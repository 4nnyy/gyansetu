'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { inspectAnswer, repeatedExplanation } = require('../lib/quality');
const { getLearningState, normalizeHistory } = require('../lib/tutor');

const oldAnswer = 'Average speed batati hai ki poore safar mein har ghante kitni doori tay hui. Socho tumne chaar ghanton mein assi kilometre ka safar kiya. Har ghante ka average nikalne ke liye total doori ko total samay se divide karenge. Assi ko chaar barabar hisson mein baanto. Har hissa bees kilometre ka hoga. Yeh average hai, har pal ki speed zaroori nahi ki itni ho.';

test('a long copied re-explanation is flagged, but a genuinely different example is not', () => {
  assert.equal(repeatedExplanation(oldAnswer, oldAnswer), true);
  const learning = { needsReteach: true, referenceAnswer: oldAnswer };
  assert.deepEqual(inspectAnswer({ output: oldAnswer }, learning), ['repeated_explanation']);
  assert.deepEqual(inspectAnswer({ output: 'Pehle ek ghante ka matlab dekho. Teen equal time boxes banao: [20 km] [20 km] [20 km]. Total 60 km hai; teen ghanton mein baantne se har box 20 km ka hai.' }, learning), []);
  assert.deepEqual(inspectAnswer({ output: oldAnswer }, { needsReteach: false, referenceAnswer: oldAnswer }), []);
});

test('shared short formulas and definitions do not trigger repetition repairs', () => {
  assert.equal(repeatedExplanation('v = d/t; speed = distance/time', 'v = d/t; speed = distance/time'), false);
});

test('unclosed, nested and mismatched math delimiters are detected', () => {
  for (const output of [String.raw`\[\frac{1}{2}`, String.raw`\[\(x=2\)\]`, String.raw`\(x=2\]`]) {
    assert.deepEqual(inspectAnswer({ output }), ['math_markup']);
  }
  assert.deepEqual(inspectAnswer({ output: String.raw`Use \(x=2\), then \[\frac{1}{2}\].` }), []);
});

test('TeX inside programming examples is not interpreted as broken maths', () => {
  assert.deepEqual(inspectAnswer({ output: '```js\nconst pattern = "\\(";\n```\nUse `\\[` as a literal.' }), []);
  assert.deepEqual(inspectAnswer({ output: '```python\nprint(1)', truncated: true }), ['truncated', 'unfinished_code']);
});

test('Hindi and Roman Hindi confusion retain context and escalate the teaching strategy', () => {
  const history = [{ role: 'user', content: 'Derivative kya hai?' }, { role: 'assistant', content: oldAnswer },
    { role: 'user', content: 'Mujhe samajh nahi aaya' }, { role: 'assistant', content: 'Second attempt' }];
  const state = getLearningState('मुझे समझ नहीं आया', history, null);
  assert.equal(state.level, 2); assert.equal(state.referenceAnswer, 'Second attempt');
  assert.match(state.strategy, /Switch representation/);
  assert.equal(getLearningState('Ab photosynthesis batao', history, null).needsReteach, false);
});

test('an older selected answer takes precedence over the latest topic during re-teaching', () => {
  const state = getLearningState('Simpler', [{ role: 'assistant', content: 'Recent chemistry answer' }],
    { kind: 'simpler', level: 3, answer: 'Selected integration answer' });
  assert.equal(state.referenceAnswer, 'Selected integration answer');
  assert.equal(state.level, 3);
  assert.equal(getLearningState('samajh nahi aaya', [], { kind: 'revision', answer: oldAnswer }).needsReteach, false);
});

test('long recent explanations stay whole, including a formula after character 6000', () => {
  const answer = 'word '.repeat(1400) + String.raw`\[\frac{a}{b}\]`;
  assert.equal(normalizeHistory([{ role: 'assistant', content: answer }], 'why')[0].content, answer);
  const history = normalizeHistory([{ role: 'user', content: 'x'.repeat(18000) }, { role: 'assistant', content: answer }], 'why');
  assert.equal(history.length, 1); assert.equal(history[0].content, answer);
});
