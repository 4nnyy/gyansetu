'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { racePhotoProviders } = require('../lib/photo-routing');

const candidates = [{ provider: 'primary' }, { provider: 'backup' }];
const usable = (result) => result.ok && Boolean(result.output?.trim());
const answer = { ok: true, output: 'x = 14' };

test('a fast photo answer never starts a duplicate request', async () => {
  const calls = [];
  const result = await racePhotoProviders(candidates, async (candidate) => {
    calls.push(candidate.provider);
    return answer;
  }, usable, { delayMs: 10, timeoutMs: 100 });
  assert.deepEqual(calls, ['primary']);
  assert.equal(result.winner.fallback, false);
  assert.equal(result.winner.result.output, 'x = 14');
});

test('a slow photo provider gets an early backup and the losing request is aborted', async () => {
  let primarySignal;
  const calls = [];
  const result = await racePhotoProviders(candidates, (candidate, signal) => {
    calls.push(candidate.provider);
    if (candidate.provider === 'backup') return answer;
    primarySignal = signal;
    return new Promise((resolve, reject) => signal.addEventListener('abort', () => reject(new Error('cancelled'))));
  }, usable, { delayMs: 10, timeoutMs: 100 });
  assert.deepEqual(calls, ['primary', 'backup']);
  assert.equal(result.winner.fallback, true);
  assert.equal(primarySignal.aborted, true);
  assert.deepEqual(result.failures, []);
});

test('a rejected primary starts the backup immediately and preserves the failure reason', async () => {
  const result = await racePhotoProviders(candidates, async (candidate) => candidate.provider === 'primary'
    ? { ok: false, status: 429, retryAfterSeconds: 30, data: { error: { code: 'quota_exceeded' } } }
    : answer, usable, { delayMs: 1000, timeoutMs: 100 });
  assert.equal(result.winner.candidate.provider, 'backup');
  assert.equal(result.failures[0].failure.code, 'quota_exceeded');
  assert.equal(result.failures[0].failure.retryAfterSeconds, 30);
});

test('an empty photo response cannot beat a readable answer from the other provider', async () => {
  const result = await racePhotoProviders(candidates, async (candidate) => candidate.provider === 'primary'
    ? { ok: true, output: '' } : answer, usable, { delayMs: 1000, timeoutMs: 100 });
  assert.equal(result.winner.candidate.provider, 'backup');
  assert.equal(result.failures[0].failure.status, 502);
});

test('a failed backup does not cancel a primary that can still answer', async () => {
  const result = await racePhotoProviders(candidates, (candidate) => candidate.provider === 'primary'
    ? new Promise((resolve) => setTimeout(() => resolve(answer), 20))
    : Promise.reject(new TypeError('network')), usable, { delayMs: 5, timeoutMs: 100 });
  assert.equal(result.winner.candidate.provider, 'primary');
  assert.equal(result.failures.length, 1);
});

test('two stalled providers stop at the shared deadline with no late result', async () => {
  const signals = [];
  const result = await racePhotoProviders(candidates, (candidate, signal) => {
    signals.push(signal);
    return new Promise(() => {});
  }, usable, { delayMs: 5, timeoutMs: 20 });
  assert.equal(result.winner, null);
  assert.deepEqual(result.failures.map(({ failure }) => failure.status), [503, 503]);
  assert.ok(signals.every((signal) => signal.aborted));
});
