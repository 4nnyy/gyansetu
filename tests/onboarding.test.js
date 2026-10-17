'use strict';
// DOM/state regressions only; not a real phone layout, keyboard or screen-reader test.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const { parseHTML } = require('linkedom');
const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
const SEEN = 'gyansetu_quick_start_v1', PREFS = 'gyansetu_learner_v1', CHATS = 'gyansetu_sessions_v3';

function setup({ storage = new Map(), blocked = false, native = false, mobile = true } = {}) {
  const html = read('index.html'), { window, document } = parseHTML(html), calls = [];
  window.HTMLElement.prototype.focus = function () { document.activeElement = this; };
  // LinkeDOM exposes select.value as read-only; reproduce the browser setter with option selection.
  Object.defineProperty(window.HTMLSelectElement.prototype, 'value', {
    configurable: true,
    get() { return [...this.querySelectorAll('option')].find(option => option.hasAttribute('selected'))?.value || this.querySelector('option')?.value || ''; },
    set(value) { this.querySelectorAll('option').forEach(option => value === option.value ? option.setAttribute('selected', '') : option.removeAttribute('selected')); }
  });
  document.querySelectorAll('textarea, input').forEach(node => { node.value = ''; });
  const dialog = document.getElementById('quickGuide'); let nativeOpens = 0;
  if (native) {
    dialog.showModal = () => { nativeOpens++; dialog.setAttribute('open', ''); };
    dialog.close = () => { dialog.removeAttribute('open'); dialog.dispatchEvent(new window.Event('close')); };
  }
  const media = { matches: mobile, addEventListener() {} }, listeners = {};
  const browser = { document, marked: require('../assets/vendor/marked-18.1.0.js'),
    matchMedia: () => media, addEventListener: (name, fn) => { (listeners[name] ||= []).push(fn); },
    MathJax: { typesetPromise: async () => {}, typesetClear() {} } };
  const context = vm.createContext({ window: browser, document, console, setTimeout, clearTimeout, setInterval, clearInterval, AbortController, Event: window.Event,
    localStorage: { getItem: key => { if (blocked) throw new Error('Storage blocked'); return storage.get(key) || null; },
      setItem: (key, value) => { if (blocked) throw new Error('Storage blocked'); storage.set(key, value); } },
    fetch: async (url, options) => { calls.push(JSON.parse(options.body)); return { ok: true, json: async () => ({ text: 'Fixture answer', responseKind: 'lesson' }) }; }
  });
  for (const file of ['photos.js', 'photo-viewer.js', 'answer-renderer.js', 'reply-language.js', 'onboarding.js', 'message-menu.js']) vm.runInContext(read('assets/' + file), context);
  vm.runInContext([...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].at(-1)[1], context);
  const el = id => document.getElementById(id);
  return { context, document, window, storage, calls, dialog, media, el, state: text => vm.runInContext(text, context), nativeOpens: () => nativeOpens,
    click: id => el(id).click(), resize: () => (listeners.resize || []).forEach(fn => fn()),
    language: value => { el('guideLanguage').value = value; el('guideLanguage').dispatchEvent(new window.Event('change')); },
    key: (key, shiftKey = false) => { const e = new window.Event('keydown', { bubbles: true, cancelable: true }); e.key = key; e.shiftKey = shiftKey; dialog.dispatchEvent(e); return e; }
  };
}

test('a first visit opens a four-step language-first guide without API calls or new conversations', () => {
  const a = setup();
  assert.equal(a.dialog.hasAttribute('open'), true); assert.equal(a.el('guideBack').hidden, true);
  assert.match(a.el('guideProgress').textContent, /1 of 4/);
  assert.equal(a.el('guideLanguage').value, 'auto'); assert.equal(a.el('guideLanguageGroup').hidden, false);
  assert.match(a.el('guideTitle').textContent, /reply language/);
  assert.match(a.el('guideDescription').textContent, /Jawab kis language/);
  assert.equal(a.document.activeElement, a.el('guideTitle'));
  assert.equal(a.el('appRoot').inert, true); assert.equal(a.el('appHeader').inert, true);
  assert.equal(a.state('sessions.length'), 1); assert.equal(a.calls.length, 0);
});

test('guide language selection updates preferences, local storage and the first real request', async () => {
  const a = setup(); a.language('hinglish');
  assert.equal(a.el('replyLanguage').value, 'hinglish');
  assert.equal(JSON.parse(a.storage.get(PREFS)).language, 'hinglish');
  assert.match(a.el('guideTitle').textContent, /Apni reply language/);
  a.click('guideSkip');
  a.el('input').value = 'Explain fractions'; await a.context.sendMessage();
  assert.equal(a.calls[0].learner.language, 'hinglish');
  assert.equal(a.state('learnerProfile.level'), 'beginner'); assert.equal(a.state('learnerProfile.course'), '');
});

test('Hindi and English guide content follows the selection, and Auto remains available', () => {
  const a = setup(); a.language('hi'); assert.match(a.el('guideTitle').textContent, /भाषा/); assert.equal(a.dialog.lang, 'hi');
  a.click('guideNext'); assert.match(a.el('guideTitle').textContent, /सवाल/); assert.equal(a.el('guideLanguageGroup').hidden, true);
  a.click('guideBack'); a.language('en'); assert.match(a.el('guideTitle').textContent, /Choose/);
  a.language('auto'); assert.equal(a.state('learnerProfile.language'), 'auto');
});

test('Skip persists dismissal across reloads, new chats and repeated start calls', () => {
  const a = setup(); a.click('guideSkip'); assert.equal(a.storage.get(SEEN), '1');
  assert.equal(a.dialog.hasAttribute('open'), false); assert.equal(a.el('appRoot').inert, false);
  assert.equal(a.document.activeElement, a.el('preferencesToggle'));
  a.context.startNewChat(); assert.equal(a.state('quickGuide.start()'), false);
  const b = setup({ storage: a.storage }); assert.equal(b.dialog.hasAttribute('open'), false);
});

test('Next/Back and Finish cover all locations, persist completion and never change subject or mode', () => {
  const a = setup();
  a.click('guideNext'); assert.match(a.el('guideLocation').textContent, /Bottom/);
  a.click('guideNext'); assert.match(a.el('guideLocation').textContent, /Learn \/ Exam/);
  a.click('guideBack'); assert.match(a.el('guideTitle').textContent, /own way/);
  a.click('guideNext'); a.click('guideNext'); assert.match(a.el('guideLocation').textContent, /Top left/);
  assert.equal(a.el('guideNext').textContent, 'Get started'); a.click('guideNext');
  assert.equal(a.dialog.hasAttribute('open'), false); assert.equal(a.storage.get(SEEN), '1');
  assert.equal(a.state('currentSubject'), 'General'); assert.equal(a.state('answerMode'), 'learn'); assert.equal(a.calls.length, 0);
  assert.equal(setup({ storage: a.storage }).dialog.hasAttribute('open'), false);
});

test('existing preferences or chat history do not trigger an unsolicited first-visit tour', () => {
  for (const storage of [new Map([[PREFS, JSON.stringify({ language: 'hi', course: 'B.Tech', level: 'familiar' })]]),
    new Map([[CHATS, JSON.stringify([{ id: 'saved', messages: [{ id: 'question', role: 'user', text: 'My old question' }] }])]])]) {
    const a = setup({ storage }); assert.equal(a.dialog.hasAttribute('open'), false);
    a.click('quickGuideBtn'); assert.equal(a.dialog.hasAttribute('open'), true);
  }
});

test('manual replay preserves course, level, language, draft, attachment, chat and answer style', () => {
  const a = setup({ storage: new Map([[PREFS, JSON.stringify({ language: 'hi', course: 'B.Tech', level: 'familiar' })]]) });
  a.context.setAnswerMode('exam'); a.el('input').value = 'Unsent draft';
  a.state('attachedImage = {mediaType:"image/png",base64:"aGVsbG8=",dataUrl:"data:image/png;base64,aGVsbG8="}');
  const id = a.state('currentSessionId'); a.el('learnerSettings').setAttribute('open', '');
  a.click('quickGuideBtn'); assert.equal(a.el('learnerSettings').hasAttribute('open'), false);
  assert.equal(a.el('guideLanguage').value, 'hi'); a.click('guideSkip');
  assert.equal(a.state('currentSessionId'), id); assert.equal(a.state('answerMode'), 'exam');
  assert.equal(a.el('input').value, 'Unsent draft'); assert.equal(a.state('attachedImage.base64'), 'aGVsbG8=');
  assert.equal(a.state('learnerProfile.course'), 'B.Tech'); assert.equal(a.state('learnerProfile.level'), 'familiar');
  assert.equal(a.state('learnerProfile.language'), 'hi'); assert.equal(a.calls.length, 0);
});

test('dialog keyboard navigation wraps only visible controls and Escape dismisses safely', () => {
  const a = setup();
  a.el('guideNext').focus(); assert.equal(a.key('Tab').defaultPrevented, true); assert.equal(a.document.activeElement, a.el('guideSkip'));
  a.key('Tab', true); assert.equal(a.document.activeElement, a.el('guideNext'));
  a.click('guideNext'); assert.equal(a.el('guideLanguageGroup').hidden, true);
  a.key('Tab'); assert.equal(a.document.activeElement, a.el('guideSkip'));
  assert.equal(a.key('Escape').defaultPrevented, true);
  assert.equal(a.dialog.hasAttribute('open'), false); assert.equal(a.el('appHeader').inert, false); assert.equal(a.storage.get(SEEN), '1');
});

test('native modal and cancel events restore the app and do not reopen the guide', () => {
  const a = setup({ native: true }); assert.equal(a.nativeOpens(), 1);
  const event = new a.window.Event('cancel', { cancelable: true }); a.dialog.dispatchEvent(event);
  assert.equal(event.defaultPrevented, true); assert.equal(a.dialog.hasAttribute('open'), false);
  assert.equal(a.el('appRoot').inert, false); assert.equal(a.storage.get(SEEN), '1');
  a.click('quickGuideBtn'); assert.equal(a.nativeOpens(), 2); a.click('guideSkip'); assert.equal(a.calls.length, 0);
});

test('blocked storage still allows language selection and dismissal without locking the app', () => {
  const a = setup({ blocked: true }); a.language('hinglish'); a.click('guideSkip');
  assert.equal(a.dialog.hasAttribute('open'), false); assert.equal(a.el('appRoot').inert, false);
  assert.equal(a.state('learnerProfile.language'), 'hinglish');
  assert.match(a.el('appNotice').textContent, /could not save/);
  assert.equal(a.state('quickGuide.start()'), false);
});

test('a saved dismissal wins even if other browser data is corrupt; malformed new data does not crash', () => {
  const a = setup({ storage: new Map([[SEEN, '1'], [PREFS, 'broken'], [CHATS, '{']]) });
  assert.equal(a.dialog.hasAttribute('open'), false);
  const b = setup({ storage: new Map([[PREFS, 'broken'], [CHATS, '{']]) });
  assert.equal(b.dialog.hasAttribute('open'), true); b.click('guideSkip'); assert.equal(b.el('appRoot').inert, false);
});

test('replay is blocked during a request, photo preparation, dictation or photo viewing', () => {
  const a = setup(); a.click('guideSkip');
  for (const name of ['isSending', 'isPreparingImage', 'isListening']) {
    a.state(name + ' = true'); a.click('quickGuideBtn'); assert.equal(a.dialog.hasAttribute('open'), false); a.state(name + ' = false');
  }
  a.el('photoViewer').setAttribute('open', ''); a.click('quickGuideBtn'); assert.equal(a.dialog.hasAttribute('open'), false);
  a.el('photoViewer').removeAttribute('open'); a.click('quickGuideBtn'); assert.equal(a.dialog.hasAttribute('open'), true);
});

test('guide locations update when the viewport changes from phone to desktop', () => {
  const a = setup(); for (let i = 0; i < 3; i++) a.click('guideNext');
  assert.match(a.el('guideLocation').textContent, /Top left/);
  a.media.matches = false; a.resize(); assert.match(a.el('guideLocation').textContent, /Left sidebar/);
  assert.equal(a.el('guideProgress').textContent, 'Quick guide · 4 of 4');
});

test('optional guide help covers actual preferences and message tools in every language without expanding each screen', () => {
  for (const language of ['en', 'hinglish', 'hi']) {
    const a = setup(); a.language(language);
    const more = a.el('guideMore'), text = () => a.el('guideDetails').textContent;
    assert.equal(more.hasAttribute('open'), false);
    assert.match(text(), /Step by step/); assert.match(text(), /Focused explanation/); assert.match(text(), /reply in English/);
    more.setAttribute('open', ''); a.resize(); assert.equal(more.hasAttribute('open'), true);
    a.click('guideNext'); assert.equal(more.hasAttribute('open'), false);
    for (const label of ['Fit', 'Use photo', 'Retry']) assert.ok(text().includes(label));
    more.setAttribute('open', ''); a.click('guideNext'); assert.equal(more.hasAttribute('open'), false);
    for (const label of ['Select text', 'Save & resend', 'Recap', 'Listen', 'Check answer', 'Show solution', 'Continue answer']) assert.ok(text().includes(label));
    a.click('guideNext'); assert.match(text(), /Delete chat/); assert.match(text(), /eight|8/);
    more.setAttribute('open', ''); a.click('guideNext'); assert.equal(a.storage.get(SEEN), '1');
    a.click('quickGuideBtn'); assert.equal(more.hasAttribute('open'), false); assert.equal(a.el('guideLanguage').value, language);
    a.click('guideSkip'); assert.equal(setup({ storage: a.storage }).dialog.hasAttribute('open'), false);
  }
});
