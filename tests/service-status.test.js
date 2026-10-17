'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const { retryAfterSeconds, serviceFailure } = require('../lib/service-status');

test('Retry-After accepts seconds, HTTP date and Gemini RetryInfo; invalid or missing delays stay unknown', () => {
  const now = Date.UTC(2026, 9, 13);
  assert.equal(retryAfterSeconds({ headers: { get: () => '3.2' } }, {}, now), 4);
  assert.equal(retryAfterSeconds({ headers: { get: () => new Date(now + 12000).toUTCString() } }, {}, now), 12);
  assert.equal(retryAfterSeconds({}, { error: { details: [{ '@type': 'type.googleapis.com/google.rpc.RetryInfo', retryDelay: '4.5s' }] } }), 5);
  for (const value of ['', 'nonsense', '-2', 'Infinity']) assert.equal(retryAfterSeconds({ headers: { get: () => value } }, {}, now), null);
  assert.equal(retryAfterSeconds({}, {}), null);
  assert.equal(retryAfterSeconds({ headers: { get: () => '999999999' } }, {}), 86400);
});

test('service errors retain chosen language and avoid inventing a shared cooldown when any wait is unknown', () => {
  assert.match(serviceFailure([{ status: 429 }], 'hi').body.error, /उत्तर/);
  assert.match(serviceFailure([{ status: 429 }], 'hinglish').body.error, /sawaal/);
  assert.equal(serviceFailure([{ status: 429, retryAfterSeconds: 5 }, { status: 429 }], 'en').body.retryAfterSeconds, undefined);
  assert.equal(serviceFailure([{ status: 429, retryAfterSeconds: 5 }, { status: 429, retryAfterSeconds: 12 }], 'en').body.retryAfterSeconds, 12);
  assert.equal(serviceFailure([{ status: 500 }], 'en').status, 503);
  const mixed = serviceFailure([{ status: 429, code: 'quota_exceeded', retryAfterSeconds: 5 }, { status: 503 }], 'en');
  assert.equal(mixed.body.code, 'rate_limited');
  assert.equal(mixed.body.retryAfterSeconds, undefined);
  assert.doesNotMatch(mixed.body.error, /capacity needs to be restored/);
});

test('temporary service outages preserve a real cooldown without inventing one for unknown failures', () => {
  const outage = serviceFailure([{ status: 503, retryAfterSeconds: 120 }], 'en');
  assert.equal(outage.status, 503); assert.equal(outage.body.code, 'service_unavailable');
  assert.equal(outage.body.retryAfterSeconds, 120);
  assert.equal(serviceFailure([{ status: 503, retryAfterSeconds: 120 }, { status: 502 }], 'en').body.retryAfterSeconds, undefined);
});
