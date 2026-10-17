'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { resolve, scriptMismatch } = require('../assets/reply-language');

test('auto matches Roman Hindi, English, Hindi and other scripts without using the subject', () => {
  for (const [question, expected] of [
    ['Mera pet dukh rha hai', 'hinglish'], ['Explain why we divide distance by time.', 'en'],
    ['मुझे भिन्न समझाओ', 'hi'], ['தமிழில் விளக்கவும்', 'auto'],
    ['AI kya hai?', 'hinglish'], ['What is AI?', 'en'], ['How do I organize my notes?', 'en']
  ]) assert.equal(resolve({ question }), expected, question);
});

test('explicit language overrides saved preference without confusing an English topic with a request', () => {
  assert.equal(resolve({ question: 'Explain fractions in English', preference: 'hi' }), 'en');
  assert.equal(resolve({ question: 'English word ka meaning kya hai?' }), 'hinglish');
  assert.equal(resolve({ question: 'इसे English mein samjhao' }), 'en');
  assert.equal(resolve({ question: 'Hindi in English letters please' }), 'hinglish');
  assert.equal(resolve({ question: 'हिंदी में समझाओ', preference: 'en' }), 'hi');
  assert.equal(resolve({ question: 'Explain this in Tamil', preference: 'en' }), 'auto');
  assert.equal(resolve({ question: 'What is speed?', preference: 'hinglish' }), 'hinglish');
  assert.equal(resolve({ question: 'Do not reply in Hindi. Explain speed.' }), 'en');
  assert.equal(resolve({ question: 'Explain in Hindi, then use English.' }), 'en');
});

test('language names used as a topic or negated request do not override the requested reply language', () => {
  for (const [question, expected] of [
    ['Do not use Hinglish; reply in English.', 'en'],
    ['Hinglish mat do, English mein do', 'en'],
    ['What is Hinglish?', 'en'], ['What is Hindi script?', 'en'],
    ['Please explain in English, then in Hindi.', 'hi'],
    ['Hindi in English letters please', 'hinglish'],
    ['अब हिंदी में मत लिखो, अंग्रेजी में बताओ', 'en']
  ]) assert.equal(resolve({ question }), expected, question);
});

test('ambiguous short follow-ups inherit learner context, never an assistant language mistake or action label', () => {
  const history = [null, { role: 'user', content: 'Mujhe speed samjhao' },
    { role: 'assistant', content: 'गति का अर्थ' }, { role: 'user', content: 'Explain step', actionKind: 'step' }];
  assert.equal(resolve({ question: 'why?', history }), 'hinglish');
  assert.equal(resolve({ question: '2+2', history }), 'hinglish');
  assert.equal(resolve({ question: 'Tell me about planets in English', history }), 'en');
  assert.equal(resolve({ question: 'How do I organize my notes?', history }), 'en');
  assert.equal(resolve({ question: '', history: [null, {role:'user',content:{}}] }), 'en');
});

test('Simplify/Recap/Practice preserve the selected answer language across topic changes', () => {
  const base = { question: 'Is answer ko aur basic se samjhao.', history: [{ role: 'user', content: 'नया विषय' }],
    action: { kind: 'simpler', question: 'Explain fractions', language: 'en' } };
  assert.equal(resolve(base), 'en');
  assert.equal(resolve({ ...base, preference: 'hi' }), 'hi');
  assert.equal(resolve({ ...base, action: { kind:'revision', question:'Average speed kaise nikale?' } }), 'hinglish');
});

test('script guard detects substantial unwanted Hindi, while retaining code, quotes and translation lessons', () => {
  const hindi = 'दर्द कहाँ हो रहा है और कितनी देर से है?';
  assert.equal(scriptMismatch(hindi, 'hinglish'), true);
  assert.equal(scriptMismatch(hindi, 'en'), true);
  assert.equal(scriptMismatch(hindi, 'hi'), false);
  assert.equal(scriptMismatch('Dard kahan hai aur kab se ho raha hai?', 'hinglish'), false);
  assert.equal(scriptMismatch('```python\nprint("' + hindi + '")\n```', 'en'), false);
  assert.equal(scriptMismatch('The sentence is “' + hindi + '” in Hindi.', 'en'), false);
  assert.equal(scriptMismatch(hindi, 'en', 'Translate this sentence'), false);
  assert.equal(scriptMismatch('दर्द = pain', 'hinglish'), false);
});
