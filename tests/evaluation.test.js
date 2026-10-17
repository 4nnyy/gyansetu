'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const cases = require('../evaluation/cases');
const { parseArgs, collect } = require('../scripts/evaluate');
const { parsePhotoArgs, collectPhoto } = require('../scripts/evaluate-photo');

test('evaluation preserves dialogue history but resets it between scenarios', async () => {
  const calls = [];
  const selected = [cases[0], cases[1]];
  const results = await collect(selected, async body => { calls.push(body); return { status: 200, data: { text: 'Fixture only', teachingVersion: 'basics-v8' } }; });
  assert.equal(calls[1].messages.length, 2); assert.equal(calls[2].messages.length, 0);
  assert.equal(results[0].turns[0].humanScores.correctness, null);
});

test('a failed first answer is recorded, without inventing follow-up context or scores', async () => {
  let count = 0;
  const results = await collect([cases[0]], async () => { count++; return { status: 503, data: { error: 'Unavailable' } }; });
  assert.equal(count, 1); assert.equal(results[0].turns[0].answer, null);
  assert.equal(results[0].completedTurns, 1); assert.equal(results[0].plannedTurns, 2);
});

test('language evaluation carries saved preferences and records returned language without inventing grades', async () => {
  const calls = [];
  const r = await collect([cases.find(c => c.id === 'G14')], async body => {
    calls.push(body); return { status: 200, data: { text: 'Fixture only', responseLanguage: calls.length === 1 ? 'hinglish' : 'hi', responseKind: 'lesson' } };
  });
  assert.equal(calls[0].learner.language, 'hinglish'); assert.equal(calls[1].learner.language, 'hinglish');
  assert.equal(r[0].turns[1].responseLanguage, 'hi'); assert.equal(r[0].turns[1].humanScores.clarity, null);
});

test('evaluation accepts only explicit destinations and bounded sample sizes', () => {
  assert.equal(parseArgs(['--url', 'https://example.vercel.app', '--case', 'M02']).url, 'https://example.vercel.app');
  for (const args of [[], ['--local', '--url', 'https://example.com'], ['--url', 'https://user:key@example.com'], ['--url', 'https://example.com/?key=secret'], ['--local', '--limit', '0']]) assert.throws(() => parseArgs(args));
  assert.equal(cases.length, 43); assert.equal(new Set(cases.map(c => c.id)).size, 43);
});

test('photo evaluator requires an explicit image/target and preserves pixels across a follow-up', async () => {
  for (const args of [[], ['--local'], ['--image', 'photo.jpg'], ['--image', 'photo.jpg', '--url', 'http://example.com']]) assert.throws(() => parsePhotoArgs(args));
  assert.equal(parsePhotoArgs(['--local', '--image', 'photo.jpg']).local, true);
  const image = { mediaType: 'image/png', base64: 'fixture-only' }, calls = [];
  const turns = await collectPhoto(image, 'Read Q3', 'Why divide?', async body => { calls.push(body); return { status: 200, data: { text: 'Fixture only' } }; });
  assert.equal(calls[1].image, image); assert.equal(calls[1].imageSource, 'previous');
  assert.equal(calls[1].messages.length, 2);
  assert.equal(turns[0].humanReview.transcriptionMatchesPhoto, null);
});
