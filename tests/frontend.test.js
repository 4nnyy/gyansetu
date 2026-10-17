'use strict';
// Lightweight DOM simulation: exercises the actual app script, not visual layout or MathJax itself.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const html = fs.readFileSync(path.join(__dirname, '../index.html'), 'utf8');
const script = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].at(-1)[1];

class Element {
  constructor(tag = 'div') { this.tagName = tag.toUpperCase(); this.children = []; this.listeners = {}; this.dataset = {}; this.style = {}; this.className = ''; this.value = ''; this._text = ''; this.isConnected = true; }
  get classList() {
    const el = this;
    return { contains(c) { return el.className.split(' ').includes(c); },
      add(c) { if (!this.contains(c)) el.className += ' ' + c; },
      remove(c) { el.className = el.className.split(' ').filter(x => x !== c).join(' '); },
      toggle(c, flag) { const on = flag ?? !this.contains(c); on ? this.add(c) : this.remove(c); return on; } };
  }
  set textContent(v) { this._text = String(v); this.children = []; }
  get textContent() { return this._text + this.children.map(c => c.textContent).join(''); }
  set innerHTML(v) { this.children = []; this._text = ''; }
  appendChild(c) { c.parent = this; this.children.push(c); return c; }
  append(...nodes) { nodes.forEach(n => this.appendChild(n)); }
  setAttribute(k, v) { this[k] = v; }
  getAttribute(k) { return this[k] ?? null; }
  hasAttribute(k) { return this[k] !== undefined; }
  removeAttribute(k) { delete this[k]; }
  addEventListener(k, fn) { (this.listeners[k] ||= []).push(fn); }
  async fire(k) { for (const fn of this.listeners[k] || []) await fn({ target: this, stopPropagation() {}, preventDefault() {} }); }
  dispatchEvent(e) { return this.fire(e.type); }
  remove() { if (this.parent) this.parent.children = this.parent.children.filter(x => x !== this); this.isConnected = false; }
  walk() { return [this, ...this.children.flatMap(c => c.walk())]; }
  querySelectorAll(selector) { return this.walk().filter(el => selector.startsWith('.') ? el.classList.contains(selector.slice(1)) : el.tagName.toLowerCase() === selector); }
  querySelector(selector) { return this.querySelectorAll(selector)[0] || null; }
  focus() {} contains(el) { return this.walk().includes(el); }
}

function setup(saved, preference) {
  const elements = Object.fromEntries([...html.matchAll(/\bid="([^"]+)"/g)].map(m => { const e = new Element(); e.id = m[1]; return [m[1], e]; }));
  const storage = new Map(saved ? [['gyansetu_sessions_v3', JSON.stringify(saved)]] : []);
  storage.set('gyansetu_quick_start_v1', '1');
  if (preference) storage.set('gyansetu_learner_v1', JSON.stringify(preference));
  const calls = [];
  let fail = false;
  let responder = (body, count) => ({ text: 'ANSWER_' + count, model: 'test-model' });
  const document = {
    getElementById(id) { return Object.values(elements).flatMap(e => e.walk()).find(e => e.id === id) || null; },
    createElement: tag => new Element(tag), createTextNode: text => { const n = new Element('#text'); n.textContent = text; return n; }, addEventListener() {},
    querySelectorAll: selector => Object.values(elements).flatMap(e => e.querySelectorAll(selector)),
  };
  const context = vm.createContext({ document, console, setTimeout, clearTimeout, setInterval, clearInterval, AbortController, Event,
    window: { matchMedia: () => ({ matches: false }), addEventListener() {}, MathJax: { typesetPromise: async () => {}, typesetClear() {} } },
    localStorage: { getItem: k => storage.get(k) || null, setItem: (k, v) => storage.set(k, v) },
    fetch: async (url, options) => { const body = JSON.parse(options.body); calls.push(body); return { ok: !fail, status: fail ? 503 : 200,
      json: async () => fail ? { error: 'Temporary error' } : responder(body, calls.length) }; },
  });
  context.window.document = document;
  context.window.marked = require('../assets/vendor/marked-18.1.0.js');
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/answer-renderer.js'), 'utf8'), context);
  for (const file of ['photos.js', 'photo-viewer.js', 'reply-language.js', 'onboarding.js', 'message-menu.js']) vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/', file), 'utf8'), context);
  vm.runInContext(script, context);
  return { context, elements, calls, storage, fail: value => { fail = value; }, respond: fn => { responder = fn; }, state: expression => vm.runInContext(expression, context),
    send: async text => { elements.input.value = text; await context.sendMessage(); } };
}

test('new question is sent once and role-preserving history grows across turns', async () => {
  const a = setup(); await a.send('Integration basic se samjhao'); await a.send('Newton law samjhao');
  assert.equal(a.calls[0].messages.length, 0);
  assert.equal(a.calls[1].messages.length, 2);
  assert.equal(a.calls[1].messages[0].content, 'Integration basic se samjhao');
  assert.equal(a.calls[1].messages[1].role, 'assistant');
});

test('clicking an older answer targets that answer and preserves an unsent draft/photo', async () => {
  const a = setup(); await a.send('Integration original'); await a.send('Newton original');
  const firstBot = a.elements.messages.children.filter(e => e.classList.contains('bot') && e.dataset.messageId)[0];
  a.elements.input.value = 'Unsent new question';
  a.state("attachedImage = {mediaType:'image/png',base64:'aGVsbG8=',dataUrl:'data:image/png;base64,aGVsbG8='}");
  const button = firstBot.querySelectorAll('button').find(b => b.textContent === 'Simplify');
  await button.fire('click');
  assert.equal(a.calls[2].action.answer, 'ANSWER_1');
  assert.equal(a.calls[2].action.question, 'Integration original');
  assert.equal(a.calls[2].image, null);
  assert.equal(a.elements.input.value, 'Unsent new question');
  assert.ok(a.state('attachedImage'));
  assert.equal(a.state('lastUserQuestion'), 'Integration original');
});

test('repeated simplification advances level and remains in Learn even from Exam', async () => {
  const a = setup(); await a.send('Integration original');
  a.context.setAnswerMode('exam');
  const getLastButton = () => a.elements.messages.querySelectorAll('button').filter(b => b.textContent === 'Simplify').at(-1);
  await getLastButton().fire('click'); await getLastButton().fire('click');
  assert.equal(a.calls[1].answerMode, 'learn');
  assert.equal(a.calls[2].action.level, 2);
  assert.equal(a.calls[2].action.question, 'Integration original');
});

test('restored sessions preserve answer targets and simplification level', async () => {
  const a = setup(); await a.send('Original question');
  await a.elements.messages.querySelectorAll('button').find(b => b.textContent === 'Simplify').fire('click');
  const b = setup(JSON.parse(a.storage.get('gyansetu_sessions_v3')));
  await b.elements.messages.querySelectorAll('button').filter(n => n.textContent === 'Simplify').at(-1).fire('click');
  assert.equal(b.calls[0].action.question, 'Original question');
  assert.equal(b.calls[0].action.level, 2);
});

test('failed request restores the question and Retry sends the same payload without duplicating it', async () => {
  const a = setup(); a.fail(true); await a.send('My failed question');
  assert.equal(a.elements.input.value, 'My failed question');
  const retry = a.elements.messages.querySelectorAll('button').find(b => b.textContent === 'Retry');
  a.fail(false); await retry.fire('click');
  assert.equal(JSON.stringify(a.calls[0]), JSON.stringify(a.calls[1]));
  assert.equal(a.state("getCurrentSession().messages.filter(m => m.role === 'user').length"), 1);
  assert.equal(a.state("getCurrentSession().messages[0].failed"), false);
});

test('Retry preserves an unrelated new draft', async () => {
  const a = setup(); a.fail(true); await a.send('Failed question');
  a.elements.input.value = 'Different draft'; a.fail(false);
  await a.elements.messages.querySelectorAll('button').find(b => b.textContent === 'Retry').fire('click');
  assert.equal(a.elements.input.value, 'Different draft');
});

test('math repair does not nest delimiters or destroy existing TeX', () => {
  const a = setup();
  for (const text of [String.raw`\[\begin{vmatrix}1 & 2\\3 & 4\end{vmatrix}\]`, String.raw`Use \(\frac{x}{y}\) here.`]) {
    assert.equal(a.context.formatBotText(text), text);
  }
  assert.equal(a.context.formatBotText(String.raw`\frac{1}{2}`), String.raw`\[\frac{1}{2}\]`);
  assert.equal(a.context.formatBotText(String.raw`\[\(\frac{1}{2}\)\]`), String.raw`\[\frac{1}{2}\]`);
  assert.equal(a.context.formatBotText(String.raw`\(\[x=2\]\)`), String.raw`\[x=2\]`);
});

test('Hindi confusion keeps the original topic for the next selected-answer action', async () => {
  const a = setup(); await a.send('Derivative basic se samjhao'); await a.send('मुझे समझ नहीं आया');
  await a.elements.messages.querySelectorAll('button').filter(b => b.textContent === 'Simplify').at(-1).fire('click');
  assert.equal(a.calls[2].action.question, 'Derivative basic se samjhao');
});

test('fenced code keeps indentation, HTML remains inert, and maths inside code stays raw', () => {
  const a = setup();
  const node = new Element();
  const code = 'if x:\n    print("<script>")\n    # \\frac{1}{2}';
  a.context.renderAnswerText(node, 'Example:\n```python\n' + code + '\n```\nDone.');
  assert.equal(node.querySelector('code').textContent, code);
  assert.equal(node.querySelector('script'), null);
});

test('greetings do not erase the current academic question', async () => {
  const a = setup(); await a.send('Integration original'); await a.send('thanks');
  assert.equal(a.calls.length, 1); assert.equal(a.state('lastUserQuestion'), 'Integration original');
});

test('reply-language choice survives reload and accompanies normal and selected-answer requests', async () => {
  const a = setup(); a.elements.replyLanguage.value = 'hinglish'; await a.elements.replyLanguage.fire('change');
  a.respond(() => ({ text: 'Aadha hissa', responseLanguage: 'hinglish', responseKind: 'lesson' }));
  await a.send('Explain fractions');
  assert.equal(a.calls[0].learner.language, 'hinglish');
  const b = setup(JSON.parse(a.storage.get('gyansetu_sessions_v3')), JSON.parse(a.storage.get('gyansetu_learner_v1')));
  assert.equal(b.elements.replyLanguage.value, 'hinglish');
  await b.elements.messages.querySelectorAll('button').find(x => x.textContent === 'Simplify').fire('click');
  assert.equal(b.calls[0].action.language, 'hinglish');
  assert.equal(b.calls[0].learner.language, 'hinglish');
});

test('general answers omit study-only actions after refresh; lessons keep practice and step help', async () => {
  const a = setup(); a.respond(() => ({ text: 'Three practical steps.', responseKind: 'general', responseLanguage: 'en' }));
  await a.send('Organize my college notes');
  const b = setup(JSON.parse(a.storage.get('gyansetu_sessions_v3')));
  let labels = b.elements.messages.querySelectorAll('button').map(x => x.textContent);
  assert.ok(labels.includes('Simplify')); assert.ok(labels.includes('Listen'));
  assert.ok(!labels.includes('Practice')); assert.ok(!labels.includes('Explain a step'));
  b.respond(() => ({ text: 'Count twelve unit squares.', responseKind: 'lesson', responseLanguage: 'en' }));
  await b.send('Why is area length times width?');
  labels = b.elements.messages.querySelectorAll('button').map(x => x.textContent);
  assert.ok(labels.includes('Practice')); assert.ok(labels.includes('Explain a step'));
});

test('instant greetings respect language choice and gratitude follows the learner rather than a wrong assistant script', async () => {
  const a = setup(); await a.send('Mujhe fractions samjhao');
  assert.match(a.context.getInstantReply('thanks'), /Zaroor/);
  a.elements.replyLanguage.value = 'hi'; await a.elements.replyLanguage.fire('change');
  assert.match(a.context.getInstantReply('hello'), /नमस्ते/);
  a.elements.replyLanguage.value = 'en'; await a.elements.replyLanguage.fire('change');
  assert.match(a.context.getInstantReply('namaste'), /Hi, I/);
});

test('learner preferences are saved and included in normal and selected-answer requests', async () => {
  const a = setup();
  a.elements.learnerLevel.value = 'familiar'; a.elements.learnerCourse.value = 'B.Tech Sem 1';
  await a.elements.learnerLevel.fire('change');
  await a.send('Explain force');
  assert.equal(a.calls[0].learner.level, 'familiar'); assert.equal(a.calls[0].learner.course, 'B.Tech Sem 1');
  const b = setup(JSON.parse(a.storage.get('gyansetu_sessions_v3')), JSON.parse(a.storage.get('gyansetu_learner_v1')));
  await b.elements.messages.querySelectorAll('button').find(x => x.textContent === 'Practice').fire('click');
  assert.equal(b.calls[0].learner.course, 'B.Tech Sem 1');
});

test('selected-step form explains its own older answer and preserves composer text', async () => {
  const a = setup(); await a.send('Derivative original'); await a.send('New chemistry topic');
  const first = a.elements.messages.children.find(e => e.classList.contains('bot') && e.dataset.messageId);
  await first.querySelectorAll('button').find(b => b.textContent === 'Explain a step').fire('click');
  const field = first.querySelector('textarea'); field.value = 'Divide by h'; a.elements.input.value = 'My unsent draft';
  await first.querySelectorAll('button').find(b => b.textContent === 'Explain step').fire('click');
  assert.equal(a.calls[2].action.kind, 'step'); assert.equal(a.calls[2].action.question, 'Derivative original');
  assert.equal(a.calls[2].action.answer, 'ANSWER_1'); assert.equal(a.calls[2].action.selectedStep, 'Divide by h');
  assert.equal(a.elements.input.value, 'My unsent draft');
});

test('practice question, attempt and feedback stay linked after another topic', async () => {
  const a = setup();
  a.respond(body => ({ text: body.action?.kind === 'practice' ? 'Find 1/4 + 1/2.' : body.action?.kind === 'check_practice' ? 'Check the size of the pieces before adding.' : 'A lesson about equal parts.' }));
  await a.send('Fractions basic se');
  await a.elements.messages.querySelectorAll('button').find(b => b.textContent === 'Practice').fire('click');
  const card = a.elements.messages.children.find(row => row.querySelector('.practice-controls'));
  assert.ok(card); assert.equal(card.querySelectorAll('button').some(b => b.textContent === 'Simplify'), false);
  await a.send('New physics topic');
  card.querySelector('textarea').value = '2/6';
  await card.querySelectorAll('button').find(b => b.textContent === 'Check answer').fire('click');
  assert.equal(a.calls[3].action.practiceQuestion, 'Find 1/4 + 1/2.');
  assert.equal(a.calls[3].action.attempt, '2/6'); assert.equal(a.calls[3].action.question, 'Fractions basic se');
  assert.equal(a.state('getCurrentSession().messages.find(m => m.practice).practice.attempts.length'), 1);
  assert.match(card.querySelector('.practice-status').textContent, /1 attempt/);
});

test('practice draft and question survive refresh, and retries preserve the exact attempt', async () => {
  const a = setup(); await a.send('Fractions');
  await a.elements.messages.querySelectorAll('button').find(b => b.textContent === 'Practice').fire('click');
  const card = a.elements.messages.children.find(row => row.querySelector('.practice-controls'));
  card.querySelector('textarea').value = 'My saved working'; await card.querySelector('textarea').fire('input');
  const b = setup(JSON.parse(a.storage.get('gyansetu_sessions_v3')));
  const restored = b.elements.messages.children.find(row => row.querySelector('.practice-controls'));
  assert.equal(restored.querySelector('textarea').value, 'My saved working');
  b.fail(true); await restored.querySelectorAll('button').find(x => x.textContent === 'Check answer').fire('click');
  assert.equal(b.state('getCurrentSession().messages.find(m => m.practice).practice.attempts.length'), 0);
  b.fail(false); await b.elements.messages.querySelectorAll('button').find(x => x.textContent === 'Retry').fire('click');
  assert.deepEqual(b.calls[0], b.calls[1]);
  assert.equal(b.state('getCurrentSession().messages.find(m => m.practice).practice.attempts.length'), 1);
});

test('empty practice attempts make no request; explicit solution is recorded separately', async () => {
  const a = setup(); await a.send('Fractions');
  await a.elements.messages.querySelectorAll('button').find(b => b.textContent === 'Practice').fire('click');
  const card = a.elements.messages.children.find(row => row.querySelector('.practice-controls'));
  await card.querySelectorAll('button').find(b => b.textContent === 'Check answer').fire('click'); assert.equal(a.calls.length, 2);
  await card.querySelectorAll('button').find(b => b.textContent === 'Show solution').fire('click');
  assert.equal(a.calls[2].action.kind, 'solve_practice');
  assert.equal(a.state('getCurrentSession().messages.find(m => m.practice).practice.solutionViewed'), true);
  assert.equal(a.state('getCurrentSession().messages.find(m => m.practice).practice.attempts.length'), 0);
});

test('an incomplete generated practice question does not get an attempt form', async () => {
  const a = setup(); await a.send('Fractions'); a.respond(() => ({ text: 'Find the sum of', truncated: true }));
  await a.elements.messages.querySelectorAll('button').find(b => b.textContent === 'Practice').fire('click');
  assert.equal(a.elements.messages.querySelectorAll('.practice-controls').length, 0);
  assert.ok(a.elements.messages.querySelectorAll('button').find(b => b.textContent === 'Retry'));
});
