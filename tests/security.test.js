'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path');
const handler = require('../api/chat');
const { MAX_REQUEST_BYTES } = require('../lib/request-security');
const { securityHeaders } = require('../scripts/security-headers');
const base = { 'content-type': 'application/json', host: 'gyansetuin.vercel.app' };
async function request({ method = 'POST', headers = base, body = { text: '1+1', answerMode: 'exam' } } = {}) {
  const result = { headers: {} }, original = global.fetch;
  let calls = 0; global.fetch = async () => { calls++; throw new Error('Unexpected provider request'); };
  try {
    await handler({ method, headers, body }, { setHeader: (k, v) => { result.headers[k] = v; },
      status(s) { result.status = s; return this; }, json(data) { result.data = data; return this; } });
    assert.equal(calls, 0); return result;
  } finally { global.fetch = original; }
}
test('same-origin browser JSON and CLI JSON work without caching personal answers', async () => {
  for (const headers of [base, { ...base, origin: 'https://gyansetuin.vercel.app', 'sec-fetch-site': 'same-origin' },
    { ...base, 'content-type': 'application/json; charset=UTF-8' }]) {
    const r = await request({ headers }); assert.equal(r.status, 200); assert.equal(r.data.text, '1+1 = 2');
    assert.equal(r.headers['Cache-Control'], 'no-store'); assert.equal(r.headers['CDN-Cache-Control'], 'no-store');
  }
});
test('cross-site, sibling-site, opaque and deceptive origins are rejected before providers', async () => {
  for (const extra of [{ origin: 'https://attacker.example' }, { origin: 'https://gyansetuin.vercel.app.attacker.example' },
    { origin: 'https://sibling.vercel.app' }, { origin: 'null' }, { origin: 'https://gyansetuin.vercel.app/path' },
    { origin: 'https://attacker.example', 'x-forwarded-host': 'attacker.example' },
    { 'sec-fetch-site': 'cross-site' }, { 'sec-fetch-site': 'same-site' }]) {
    assert.equal((await request({ headers: { ...base, ...extra } })).status, 403);
  }
});
test('method and content-type guards reject simple form and unsupported requests', async () => {
  const get = await request({ method: 'GET' }); assert.equal(get.status, 405); assert.equal(get.headers.Allow, 'POST');
  for (const type of ['', 'text/plain', 'application/x-www-form-urlencoded', 'multipart/form-data', 'application/jsonp']) {
    assert.equal((await request({ headers: { ...base, 'content-type': type } })).status, 415);
  }
});
test('declared and real oversized UTF-8 request bodies are rejected without provider calls', async () => {
  assert.equal((await request({ headers: { ...base, 'content-length': String(MAX_REQUEST_BYTES + 1) } })).status, 413);
  assert.equal((await request({ body: { text: 'ok', unknown: 'x'.repeat(MAX_REQUEST_BYTES) } })).status, 413);
  assert.equal((await request({ headers: { ...base, 'content-length': '20' }, body: JSON.stringify({ unknown: 'ह'.repeat(1500000) }) })).status, 413);
  assert.equal((await request({ headers: { ...base, 'content-length': '-10' } })).status, 400);
});
test('malformed JSON and circular/non-object bodies fail safely', async () => {
  const circular = {}; circular.self = circular;
  for (const body of ['{broken', 'null', [], circular]) {
    const r = await request({ body }); assert.equal(r.status, 400); assert.equal(Object.keys(r.data).join(), 'error');
  }
});
test('CSP covers current inline scripts, pinned maths and framing without allowing arbitrary scripts', () => {
  const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');
  const expected = securityHeaders(read('index.html'));
  assert.deepEqual(JSON.parse(read('vercel.json')).headers.find(rule => rule.source === '/(.*)').headers, expected);
  const policy = expected[0].value, scripts = policy.split('; ').find(d => d.startsWith('script-src'));
  assert.equal((scripts.match(/sha256-/g) || []).length, 2);
  assert.doesNotMatch(scripts, /unsafe-inline|unsafe-eval|\*/); assert.match(scripts, /mathjax@3\.2\.2\//);
  assert.match(policy, /frame-ancestors 'none'/); assert.match(policy, /connect-src 'self'/);
  assert.notDeepEqual(securityHeaders(read('index.html').replace('window.MathJax', 'window.MathJax /* edited */')), expected);
});
