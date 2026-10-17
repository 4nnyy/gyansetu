#!/usr/bin/env node
'use strict';
const fs = require('node:fs/promises'), path = require('node:path'), crypto = require('node:crypto');
const { parseArgs: checkTarget } = require('./evaluate');
const { validateImage } = require('../lib/image');

function parsePhotoArgs(args) {
  const out = { out: 'reports/photo-review.json', question: 'Is photo ka question basics se samjhao.' };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--local') out.local = true;
    else if (['--url', '--image', '--question', '--followup', '--out'].includes(arg)) {
      const value = args[++i]; if (!value || value.startsWith('--')) throw new Error('Missing value for ' + arg);
      out[arg.slice(2)] = value;
    } else throw new Error('Unknown argument: ' + arg);
  }
  if (!out.image) throw new Error('Supply --image /absolute/path/photo.jpg');
  if (out.question.length > 10000 || (out.followup || '').length > 10000) throw new Error('Question/follow-up too long');
  const target = checkTarget([...(out.local ? ['--local'] : []), ...(out.url ? ['--url', out.url] : [])]);
  return { ...out, url: target.url };
}

async function collectPhoto(image, question, followup, invoke) {
  const turns = [], messages = [];
  for (const text of [question, followup].filter(Boolean)) {
    const start = performance.now();
    let result;
    try { result = await invoke({ subject: 'General', text, image, imageSource: turns.length ? 'previous' : 'current', messages: [...messages], answerMode: 'learn' }); }
    catch { result = { status: 0, data: { error: 'Request failed or timed out' } }; }
    const data = result.data || {}, ok = result.status === 200 && typeof data.text === 'string' && data.text.trim();
    turns.push({ question: text, status: result.status, durationMs: Math.round(performance.now() - start),
      answer: ok ? data.text : null, error: ok ? null : data.error || 'No answer', teachingVersion: data.teachingVersion || null,
      model: data.model || null, truncated: Boolean(data.truncated),
      humanReview: { transcriptionMatchesPhoto: null, uncertaintyHandled: null, solutionCorrect: null, basicsExplained: null, notes: '' } });
    if (!ok) break;
    messages.push({ role: 'user', content: text, hasImage: true }, { role: 'assistant', content: data.text });
  }
  return turns;
}

async function main(args) {
  const opts = parsePhotoArgs(args);
  if (opts.local && !process.env.GEMINI_API_KEY && !process.env.GROQ_API_KEY) throw new Error('No provider keys configured; no photo was sent. Set keys privately in environment variables or use a configured preview URL.');
  const filename = path.resolve(opts.image), stat = await fs.stat(filename);
  if (!stat.isFile() || stat.size > 3 * 1024 * 1024) throw new Error('Use a JPG/PNG/WebP image smaller than 3 MB for this direct API test.');
  const bytes = await fs.readFile(filename), extension = path.extname(filename).toLowerCase();
  const mediaType = { '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp' }[extension];
  const result = validateImage({ mediaType, base64: bytes.toString('base64') });
  if (result.error) throw new Error(result.error);
  const invoke = opts.local ? async body => {
    const response = {}; await require('../api/chat')({ method: 'POST', body }, { status(code) { response.status = code; return this; }, json(data) { response.data = data; return this; } }); return response;
  } : async body => {
    const res = await fetch(opts.url + '/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body), signal: AbortSignal.timeout(40000), redirect: 'error' });
    return { status: res.status, data: await res.json().catch(() => ({ error: 'Non-JSON response; preview may require authentication' })) };
  };
  const turns = await collectPhoto(result.image, opts.question, opts.followup, invoke);
  const report = { createdAt: new Date().toISOString(), target: opts.url || 'local handler', image: { filename: path.basename(filename), sha256: crypto.createHash('sha256').update(bytes).digest('hex') }, status: 'awaiting-human-photo-review', turns };
  const dest = path.resolve(opts.out); await fs.mkdir(path.dirname(dest), { recursive: true }); await fs.writeFile(dest, JSON.stringify(report, null, 2) + '\n', { mode: 0o600 });
  console.log('Saved: ' + dest + '. Compare the answers with the original photo; no handwriting accuracy score was assigned.');
  if (turns.some(t => !t.answer || t.teachingVersion !== 'basics-v5')) process.exitCode = 1;
}
if (require.main === module) main(process.argv.slice(2)).catch(error => { console.error(error.message); process.exitCode = 1; });
module.exports = { parsePhotoArgs, collectPhoto };
