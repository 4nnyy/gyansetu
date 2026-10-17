'use strict';
// Browser APIs are simulated here. These tests do not score handwriting recognition or pixel quality.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const { parseHTML } = require('linkedom');
const { IDBFactory } = require('fake-indexeddb');
const { validateImage } = require('../lib/image');
const read = name => fs.readFileSync(path.join(__dirname, '..', name), 'utf8');
const PNG = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a1S8AAAAASUVORK5CYII=';
const URI = 'data:image/png;base64,' + PNG;
const PHOTO = { mediaType: 'image/png', base64: PNG, dataUrl: URI };

function setup({ storage = new Map(), indexedDB = new IDBFactory() } = {}) {
  storage.set('gyansetu_quick_start_v1', '1');
  const html = read('index.html'), { document, window } = parseHTML(html);
  window.HTMLElement.prototype.focus = function () { document.activeElement = this; };
  document.querySelectorAll('textarea, input').forEach(n => n.value = '');
  const calls = [], browser = { document, indexedDB, marked: require('../assets/vendor/marked-18.1.0.js'),
    matchMedia: () => ({ matches: false, addEventListener() {} }), addEventListener() {},
    MathJax: { typesetPromise: async () => {}, typesetClear() {} } };
  let fail = false;
  const context = vm.createContext({ window: browser, document, console, setTimeout, clearTimeout, setInterval, clearInterval, AbortController, Event: window.Event,
    localStorage: { getItem: k => storage.get(k) || null, setItem: (k, v) => storage.set(k, v) },
    fetch: async (url, options) => { calls.push(JSON.parse(options.body)); return { ok: !fail, json: async () => fail ? { error: 'Service unavailable' } : { text: 'Photo se padha hua question: 2x + 3 = 7.\n\nx = 2.' } }; } });
  for (const file of ['photos.js', 'photo-viewer.js', 'answer-renderer.js', 'reply-language.js', 'onboarding.js', 'message-menu.js']) vm.runInContext(read('assets/' + file), context);
  vm.runInContext([...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].at(-1)[1], context);
  return { browser, context, document, window, storage, indexedDB, calls, photos: browser.GyanSetuPhotos,
    state: s => vm.runInContext(s, context), fail: b => { fail = b; },
    attach: () => { context.fixturePhoto = { ...PHOTO }; vm.runInContext('attachedImage = fixturePhoto', context); },
    send: async text => { document.getElementById('input').value = text; return context.sendMessage(); } };
}

test('editing an older question forks only its preceding context and preserves the original and unsent draft/photo', async () => {
  const a = setup(); a.context.setAnswerMode('exam');
  await a.send('Earlier context'); await a.send('Wrong middle question'); await a.send('Later obsolete question');
  const original = a.state('getCurrentSession()'), snapshot = JSON.stringify(original.messages);
  a.document.getElementById('input').value = 'My unsent draft'; a.attach();
  const result = await a.context.editQuestion(original.id, original.messages[2].id, 'Corrected middle question');
  assert.equal(result.edited, true); assert.equal(JSON.stringify(original.messages), snapshot);
  assert.notEqual(a.state('currentSessionId'), original.id); assert.equal(a.state('sessions.length'), 2);
  assert.deepEqual(a.calls.at(-1).messages.map(m => m.content), ['Earlier context', original.messages[1].text]);
  assert.equal(a.calls.at(-1).text, 'Corrected middle question'); assert.equal(a.calls.at(-1).image, null);
  assert.equal(a.calls.at(-1).answerMode, 'exam'); assert.equal(a.calls.at(-1).subject, original.subject);
  assert.equal(a.state('lastUserQuestion'), 'Corrected middle question');
  assert.equal(a.document.getElementById('input').value, 'My unsent draft'); assert.equal(a.state('attachedImage.base64'), PNG);
  assert.match(a.state('getCurrentSession().title'), /edited/);
  const b = setup({ storage: a.storage, indexedDB: a.indexedDB });
  assert.equal(b.state('sessions.length'), 2);
  assert.equal(b.document.querySelectorAll('.edit-action').length, 2);
  assert.equal(b.document.querySelectorAll('.copy-action').length, 4);
  assert.equal(b.state('getCurrentSession().messages[2].text'), 'Corrected middle question');
});

test('editing a photo question resends its actual pixels, with a separate stored photo for the new message', async () => {
  const a = setup(); a.attach(); await a.send('Solve question one');
  const original = a.state('getCurrentSession()'), source = original.messages[0];
  await a.context.editQuestion(original.id, source.id, 'Solve question two from this photo');
  const edited = a.state('getCurrentSession()');
  assert.equal(a.calls.at(-1).image.base64, PNG); assert.equal(a.calls.at(-1).messages.length, 0);
  assert.notEqual(edited.messages[0].imageId, source.imageId);
  assert.equal(edited.messages[1].sourceImageId, edited.messages[0].imageId);
  assert.equal(await a.photos.get(edited.messages[0].imageId), URI);
  await a.context.deleteSession(original.id);
  assert.equal(await a.photos.get(edited.messages[0].imageId), URI);
});

test('a shared prefix photo survives deleting either chat and is removed only when its last owner is deleted', async () => {
  const a = setup(); a.attach(); await a.send('Photo context'); await a.send('Wrong follow-up');
  const original = a.state('getCurrentSession()'), photoId = original.messages[0].imageId;
  await a.context.editQuestion(original.id, original.messages[2].id, 'Isme 3 minus kyun kiya?');
  const editedId = a.state('currentSessionId');
  assert.equal(a.calls.at(-1).image.base64, PNG);
  await a.context.deleteSession(original.id); assert.equal(await a.photos.get(photoId), URI);
  await a.context.deleteSession(editedId); assert.equal(await a.photos.get(photoId), null);
});

test('an edit keeps its original even at the eight-chat limit, and pruning respects shared photo references', async () => {
  const a = setup(); a.attach(); await a.send('Old photo'); await a.send('Old question');
  const original = a.state('getCurrentSession()'), photoId = original.messages[0].imageId;
  for (let i = 0; i < 7; i++) a.context.startNewChat();
  a.context.switchSession(original.id);
  await a.context.editQuestion(original.id, original.messages[2].id, 'Corrected question');
  assert.equal(a.state('sessions.length'), 8);
  assert.equal(a.state('sessions[1].id'), original.id);
  // Push the source out, while the edited branch still references its prefix photo.
  for (let i = 0; i < 7; i++) a.context.startNewChat();
  assert.equal(a.state('sessions.some(s => s.title === "Old photo")'), false);
  assert.equal(await a.photos.get(photoId), URI);
  a.context.startNewChat();
  assert.equal(await a.photos.get(photoId), null);
});

test('missing or stalled edit photo storage leaves the source untouched and the composer unlocked', async () => {
  for (const state of ['missing', 'reject', 'stall']) {
    const a = setup(); a.attach(); await a.send('Original photo');
    const original = a.state('getCurrentSession()'), snapshot = JSON.stringify(original.messages);
    a.photos.get = state === 'missing' ? async () => null : state === 'reject' ? async () => { throw new Error('Unavailable'); } : () => new Promise(() => {});
    let expire;
    a.context.setTimeout = (fn, ms) => { if (ms === 5000) { expire = fn; return 'edit-deadline'; } return setTimeout(fn, ms); };
    a.context.clearTimeout = timer => { if (timer !== 'edit-deadline') clearTimeout(timer); };
    const pending = a.context.editQuestion(original.id, original.messages[0].id, 'Corrected photo question');
    if (state === 'stall') expire();
    assert.match((await pending).error, /photo is no longer saved/);
    assert.equal(a.state('isSending'), false); assert.equal(a.state('sessions.length'), 1);
    assert.equal(a.state('currentSessionId'), original.id); assert.equal(a.calls.length, 1);
    assert.equal(JSON.stringify(original.messages), snapshot);
  }
});

test('double editing during an asynchronous photo lookup cannot create duplicate chats or switch/delete the source', async () => {
  const a = setup(); a.attach(); await a.send('Photo question');
  const original = a.state('getCurrentSession()');
  let resolvePhoto; a.photos.get = () => new Promise(resolve => { resolvePhoto = resolve; });
  const pending = a.context.editQuestion(original.id, original.messages[0].id, 'Corrected photo question');
  const duplicate = await a.context.editQuestion(original.id, original.messages[0].id, 'Duplicate question');
  assert.match(duplicate.error, /Wait/);
  a.context.startNewChat(); await a.context.deleteSession(original.id);
  assert.equal(a.state('sessions.length'), 1); assert.equal(a.calls.length, 1);
  resolvePhoto(URI); await pending;
  assert.equal(a.state('sessions.length'), 2); assert.equal(a.calls.length, 2);
});

test('an edited request failure and Retry preserve even an identical unsent draft and never duplicate the corrected question', async () => {
  const a = setup(); await a.send('Original question');
  const original = a.state('getCurrentSession()');
  a.document.getElementById('input').value = 'Corrected question'; a.fail(true);
  await a.context.editQuestion(original.id, original.messages[0].id, 'Corrected question');
  assert.equal(a.document.getElementById('input').value, 'Corrected question');
  assert.equal(a.state('getCurrentSession().messages[0].failed'), true);
  const retry = [...a.document.querySelectorAll('.answer-action')].find(b => b.textContent === 'Retry');
  a.fail(false); retry.click(); await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(a.calls.at(-1), a.calls.at(-2));
  assert.equal(a.state('getCurrentSession().messages.filter(m => m.role === "user").length'), 1);
  assert.equal(a.state('getCurrentSession().messages[0].failed'), false);
  assert.equal(a.document.getElementById('input').value, 'Corrected question');
  assert.equal(original.messages[0].text, 'Original question');
});

test('invalid, unchanged, stale and generated-action edits never create a request or a chat', async () => {
  const a = setup(); await a.send('Original');
  const original = a.state('getCurrentSession()');
  for (const text of ['', '   ', ' Original ', 'x'.repeat(10001)]) assert.ok((await a.context.editQuestion(original.id, original.messages[0].id, text)).error);
  assert.ok((await a.context.editQuestion('wrong-chat', original.messages[0].id, 'Changed')).error);
  assert.ok((await a.context.editQuestion(original.id, original.messages[1].id, 'Changed')).error);
  const actionRow = a.context.appendMessage('Simplify', 'user', null, true, null, { actionKind: 'simpler' });
  assert.ok((await a.context.editQuestion(original.id, actionRow.dataset.messageId, 'Changed')).error);
  assert.equal(actionRow.querySelector('.edit-action'), null);
  assert.equal(a.calls.length, 1); assert.equal(a.state('sessions.length'), 1);
});

test('regular tap leaves questions alone; menu Edit opens the editor and Cancel/Escape preserve the question', async () => {
  const a = setup(); await a.send('Original question');
  const row = a.document.querySelector('.msg-row.user');
  a.browser.getSelection = () => ({ toString: () => 'selected words' });
  row.querySelector('.question-text').click(); assert.equal(row.querySelector('.edit-panel'), null);
  a.browser.getSelection = () => ({ toString: () => '' });
  row.querySelector('.question-text').click();
  assert.equal(row.querySelector('.edit-panel'), null);
  row.querySelector('.message-more').dispatchEvent(new a.window.Event('contextmenu', { bubbles: true, cancelable: true }));
  [...a.document.querySelectorAll('.message-menu-action')].find(b => b.textContent === 'Edit').click();
  const field = row.querySelector('.edit-panel textarea');
  assert.equal(field.value, 'Original question'); assert.equal(a.document.activeElement, field);
  field.value = 'Do not send this';
  const event = new a.window.Event('keydown', { bubbles: true }); event.key = 'Escape'; field.dispatchEvent(event);
  assert.equal(row.querySelector('.edit-panel'), null); assert.equal(a.document.activeElement.className, 'message-more');
  row.querySelector('.edit-action').click();
  const cancel = [...row.querySelectorAll('.answer-action')].find(b => b.textContent === 'Cancel'); cancel.click();
  assert.equal(row.querySelector('.edit-panel'), null); assert.equal(a.calls.length, 1);
  assert.equal(a.state('getCurrentSession().messages[0].text'), 'Original question');
});

test('compact menu Copy and separate Study tools retain the older selected answer and an unrelated draft', async () => {
  const a = setup(); await a.send('Original fractions question'); await a.send('Later chemistry question');
  const firstAnswer = a.document.querySelector('.msg-row.bot'), originalAnswer = a.state('getCurrentSession().messages[1].text');
  let copied; a.browser.navigator = { clipboard: { writeText: async value => { copied = value; } } };
  const choose = label => {
    firstAnswer.querySelector('.message-more').dispatchEvent(new a.window.Event('contextmenu', { bubbles: true, cancelable: true }));
    [...a.document.querySelectorAll('.message-menu-action')].find(button => button.textContent === label).click();
  };
  choose('Copy'); await new Promise(resolve => setImmediate(resolve)); assert.equal(copied, originalAnswer);
  a.document.getElementById('input').value = 'Unsent draft';
  const tools = firstAnswer.querySelector('.study-tools'); assert.equal(tools.hasAttribute('open'), false);
  tools.setAttribute('open', '');
  [...tools.querySelectorAll('button')].find(button => button.textContent === 'Simplify').click();
  await new Promise(resolve => setImmediate(resolve)); assert.equal(tools.hasAttribute('open'), false);
  assert.equal(a.calls.at(-1).action.question, 'Original fractions question'); assert.equal(a.calls.at(-1).action.answer, originalAnswer);
  assert.equal(a.document.getElementById('input').value, 'Unsent draft'); assert.equal(a.document.getElementById('messageMenu').hasAttribute('open'), false);
});

test('practice answer controls remain visible and separate from its Copy menu', () => {
  const a = setup();
  const row = a.context.appendMessage('Try this question', 'bot', null, true, null,
    { practice: { question: 'Practice question', sourceQuestion: 'Source', sourceAnswer: 'Answer', attempts: [] } });
  for (const button of row.querySelectorAll('.practice-controls button')) assert.equal(Boolean(button.closest('[hidden]')), false);
  row.querySelector('.message-more').dispatchEvent(new a.window.Event('contextmenu', { bubbles: true, cancelable: true }));
  assert.deepEqual([...a.document.querySelectorAll('.message-menu-action')].map(b => b.textContent), ['Copy', 'Select text']);
});

test('Save & resend uses the editor value, not the unrelated composer draft', async () => {
  const a = setup(); await a.send('Wrong question');
  a.document.getElementById('input').value = 'Unsent draft';
  a.document.querySelector('.edit-action').click();
  a.document.querySelector('.edit-panel textarea').value = 'Corrected question';
  [...a.document.querySelectorAll('.edit-panel button')].find(b => b.textContent === 'Save & resend').click();
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(a.calls.at(-1).text, 'Corrected question'); assert.equal(a.calls.length, 2);
  assert.equal(a.document.getElementById('input').value, 'Unsent draft');
});

test('Copy preserves exact answer Markdown, TeX and code, without adding UI labels', async () => {
  const a = setup(), copied = [];
  a.browser.navigator = { clipboard: { writeText: async text => { copied.push(text); } } };
  const text = '# Formula\n\n\\(x^2\\)\n\n```python\nif x:\n    print(x)\n```';
  const row = a.context.appendMessage(text, 'bot');
  const button = row.querySelector('.copy-action'); button.click();
  await new Promise(resolve => setImmediate(resolve));
  assert.deepEqual(copied, [text]); assert.equal(button.textContent, 'Copied');
  assert.equal(row.querySelector('.copy-panel'), null);
  await a.send('hello'); assert.ok(a.document.querySelector('.msg-row.bot:last-child .copy-action'));
  const practice = a.context.appendMessage('Practice question', 'bot', null, true, null,
    { practice: { question: 'Practice question', sourceQuestion: 'Source', sourceAnswer: 'Answer', attempts: [] } });
  assert.equal(practice.querySelectorAll('.copy-action').length, 1);
});

test('unavailable or denied clipboard offers selectable manual text and never reports a false copy success', async () => {
  for (const denied of [false, true]) {
    const a = setup();
    if (denied) a.browser.navigator = { clipboard: { writeText: async () => { throw new Error('NotAllowedError'); } } };
    const text = '<img src=x onerror=alert(1)>\nExact original';
    const row = a.context.appendMessage(text, 'bot'), button = row.querySelector('.copy-action'); button.click();
    await new Promise(resolve => setImmediate(resolve));
    const field = row.querySelector('.copy-panel textarea');
    assert.equal(field.value, text); assert.equal(field.readOnly, true); assert.equal(a.document.activeElement, field);
    assert.equal(button.textContent, 'Copy'); assert.equal(button.disabled, false);
    assert.equal(row.querySelector('.copy-panel img'), null);
    row.querySelector('.copy-panel button').click(); assert.equal(row.querySelector('.copy-panel'), null);
    assert.equal(a.document.activeElement.className, 'message-more');
  }
});

test('actual image headers, MIME mismatches, corrupt data and oversized payloads are validated before AI', () => {
  assert.equal(validateImage(PHOTO).image.base64, PNG);
  for (const image of ['photo', [], {}, { ...PHOTO, mediaType: 'image/jpeg' }, { ...PHOTO, base64: 'aGVsbG8=' }, { ...PHOTO, base64: PNG + '%' }]) assert.equal(validateImage(image).status, 400);
  assert.equal(validateImage({ ...PHOTO, base64: 'A'.repeat(4 * 1024 * 1024 + 4) }).status, 413);
});

test('photos survive a new app instance without putting image bytes in localStorage', async () => {
  const a = setup(); a.attach(); await a.send('Photo ka question samjhao');
  const saved = JSON.parse(a.storage.get('gyansetu_sessions_v3'));
  const message = saved[0].messages.find(m => m.role === 'user');
  assert.ok(message.imageId); assert.equal(saved[0].messages.find(m => m.role === 'bot').sourceImageId, message.imageId);
  assert.doesNotMatch(a.storage.get('gyansetu_sessions_v3'), /data:image|iVBORw/);
  const b = setup({ storage: a.storage, indexedDB: a.indexedDB });
  assert.equal(await b.photos.get(message.imageId), URI);
  await new Promise(resolve => setImmediate(resolve));
  assert.equal(b.document.querySelector('.message-photo img').getAttribute('src'), URI);
  assert.equal(b.document.querySelector('.message-photo').disabled, false);
});

test('saved photos open with zoom/fit, close restores focus, and reuse restores the composer attachment', async () => {
  const a = setup(); a.attach(); await a.send('Photo samjhao');
  const trigger = a.document.querySelector('.message-photo'); trigger.click();
  assert.equal(a.document.getElementById('photoViewer').hasAttribute('open'), true);
  assert.equal(a.document.getElementById('viewerPhoto').getAttribute('src'), URI);
  a.document.getElementById('photoZoomIn').click(); assert.equal(a.document.getElementById('photoZoomLabel').textContent, '150%');
  a.document.getElementById('photoFit').click(); assert.equal(a.document.getElementById('photoZoomLabel').textContent, '100%');
  a.document.getElementById('photoViewClose').click();
  assert.equal(a.document.getElementById('photoViewer').hasAttribute('open'), false);
  assert.equal(a.document.activeElement, trigger);
  trigger.click(); a.document.getElementById('photoReuse').click();
  assert.equal(a.state('attachedImage.base64'), PNG);
  assert.ok(a.document.getElementById('previewRow').classList.contains('active'));
});

test('same-photo follow-ups resend pixels, while an unrelated topic does not', async () => {
  const a = setup(); a.attach(); await a.send('Photo question');
  await a.send('Isme 3 ko minus kyun kiya?');
  assert.equal(a.calls[1].image.base64, PNG); assert.equal(a.calls[1].imageSource, 'previous');
  await a.send('Photosynthesis kya hota hai?'); assert.equal(a.calls[2].image, null);
});

test('an image follow-up lookup cannot consume a new draft/attachment or accept a double submit', async () => {
  const a = setup(); a.attach(); await a.send('Photo question');
  let resolvePhoto;
  a.photos.get = () => new Promise(resolve => { resolvePhoto = resolve; });
  const pending = a.send('Isme divide kyun kiya?');
  a.document.getElementById('input').value = 'Unsent new question'; a.attach();
  await a.context.sendMessage(); assert.equal(a.calls.length, 1);
  resolvePhoto(URI); await pending;
  assert.equal(a.calls.length, 2);
  assert.equal(a.document.getElementById('input').value, 'Unsent new question');
  assert.equal(a.state('attachedImage.base64'), PNG);
});

test('an unexpected photo storage failure leaves the composer usable and does not attach a guessed photo', async () => {
  const a = setup(); a.attach(); await a.send('Handwritten algebra');
  a.photos.get = async () => { throw new Error('Storage unavailable'); };
  await a.send('Isme divide kyun kiya?');
  assert.equal(a.state('isSending'), false); assert.equal(a.document.getElementById('sendBtn').disabled, false);
  assert.equal(a.calls[1].image, null); assert.match(a.document.getElementById('appNotice').textContent, /Purani photo/);
});

test('a stalled photo lookup has a deadline and cannot leave Send permanently disabled', async () => {
  const a = setup(); a.attach(); await a.send('Handwritten algebra');
  a.photos.get = () => new Promise(() => {});
  let expire;
  a.context.setTimeout = (fn, ms) => { if (ms === 5000) { expire = fn; return 'photo-deadline'; } return setTimeout(fn, ms); };
  a.context.clearTimeout = timer => { if (timer !== 'photo-deadline') clearTimeout(timer); };
  const pending = a.send('Isme divide kyun kiya?');
  assert.equal(a.state('isSending'), true); assert.equal(typeof expire, 'function');
  expire(); await pending;
  assert.equal(a.state('isSending'), false); assert.equal(a.calls[1].image, null);
});

test('explicit step/photo references still reuse pixels and keep the original question', async () => {
  const a = setup(); a.attach(); await a.send('Handwritten algebra');
  for (const text of ['Why did you divide by 2?', 'How does this step work?', 'Same photo mein question 2 dekho', 'Actually the sign is minus, not plus']) {
    await a.send(text);
    assert.equal(a.calls.at(-1).image.base64, PNG, text);
    assert.equal(a.state('lastUserQuestion'), 'Handwritten algebra');
  }
});

test('a quick thank-you does not break a later repeated-confusion photo follow-up', async () => {
  const a = setup(); a.attach(); await a.send('Handwritten algebra'); await a.send('thanks');
  await a.send('Mujhe abhi bhi samajh nahi aaya');
  assert.equal(a.calls.length, 2); assert.equal(a.calls[1].image.base64, PNG);
  assert.equal(a.state('lastUserQuestion'), 'Handwritten algebra');
});

test('an older selected answer reuses its source photo without consuming a different unsent photo or draft', async () => {
  const a = setup(); a.attach(); await a.send('Handwritten algebra');
  const old = a.state('getCurrentSession().messages.find(m => m.role === "bot")');
  await a.send('New physics topic'); a.attach(); a.document.getElementById('input').value = 'Unsent draft';
  await a.context.sendSpecialRequest('simpler', { id: old.id, question: old.question, answer: old.text });
  assert.equal(a.calls[2].image.base64, PNG); assert.equal(a.calls[2].imageSource, 'previous');
  assert.equal(a.document.getElementById('input').value, 'Unsent draft'); assert.equal(a.state('attachedImage.base64'), PNG);
});

test('a new How/Why question does not reuse the previous photo or original question', async () => {
  for (const question of ['How do I organize my college files?', 'Why is the sky blue?', 'Mujhe samjhao photosynthesis kya hai']) {
    const a = setup(); a.attach(); await a.send('Handwritten algebra'); await a.send(question);
    assert.equal(a.calls[1].image, null, question);
    assert.equal(a.state('lastUserQuestion'), question);
    const bot = a.state('getCurrentSession().messages.findLast(m => m.role === "bot")');
    assert.equal(bot.sourceImageId, null); assert.equal(bot.question, question);
  }
});

test('failed photo request and Retry preserve the exact image without duplicating the user message', async () => {
  const a = setup(); a.attach(); a.fail(true); await a.send('Handwritten question');
  assert.equal(a.state('attachedImage.base64'), PNG);
  const original = a.calls[0]; a.fail(false);
  const session = a.state('getCurrentSession()');
  await a.context.sendMessage({ retryPayload: original, retryQuestion: 'Handwritten question', retrySessionId: session.id, retryMessageId: session.messages[0].id });
  assert.deepEqual(a.calls[1], original);
  assert.equal(a.state('getCurrentSession().messages.filter(m => m.role === "user").length'), 1);
});

test('cancel or a newer file selection invalidates a slow photo preparation result', async () => {
  const a = setup(), waits = [];
  a.photos.prepare = () => new Promise(resolve => waits.push(resolve));
  const one = a.context.handleImageFile({ name: 'one.jpg' });
  assert.equal(a.state('isPreparingImage'), true); await a.send('Do not send yet'); assert.equal(a.calls.length, 0);
  const two = a.context.handleImageFile({ name: 'two.jpg' });
  waits[1]({ ...PHOTO, width: 200 }); await two;
  waits[0]({ ...PHOTO, width: 100 }); await one;
  assert.equal(a.state('attachedImage.width'), 200);
  const three = a.context.handleImageFile({ name: 'three.jpg' });
  a.document.getElementById('previewRemove').click(); waits[2](PHOTO); await three;
  assert.equal(a.state('attachedImage'), null); assert.equal(a.document.getElementById('sendBtn').disabled, false);
});

test('photo decode errors keep an existing attachment and re-enable sending', async () => {
  const a = setup(); a.attach();
  a.photos.prepare = async () => { throw new Error('Unreadable photo'); };
  await a.context.handleImageFile({ name: 'broken.jpg' });
  assert.equal(a.state('attachedImage.base64'), PNG);
  assert.equal(a.document.getElementById('sendBtn').disabled, false);
  assert.equal(a.document.getElementById('appNotice').textContent, 'Unreadable photo');
});

test('new chat cancels an in-progress photo so it cannot appear in a different conversation', async () => {
  const a = setup(); let finish;
  a.photos.prepare = () => new Promise(resolve => { finish = resolve; });
  const pending = a.context.handleImageFile({ name: 'old.jpg' });
  a.context.startNewChat(); finish(PHOTO); await pending;
  assert.equal(a.state('attachedImage'), null); assert.equal(a.state('isPreparingImage'), false);
});

test('deleting a photo chat removes its photos but preserves another chat photo', async () => {
  const a = setup(); a.attach(); await a.send('First photo');
  const old = a.state('getCurrentSession()'), oldId = old.messages[0].imageId;
  a.context.startNewChat(); a.attach(); await a.send('Second photo');
  const newId = a.state('getCurrentSession().messages[0].imageId');
  await a.context.deleteSession(old.id);
  const b = setup({ indexedDB: a.indexedDB });
  assert.equal(await b.photos.get(oldId), null); assert.equal(await b.photos.get(newId), URI);
});

test('Hindi IME Enter during composition does not accidentally submit an unfinished question', () => {
  const a = setup(), field = a.document.getElementById('input'); field.value = 'अधूरा सवाल';
  const event = new a.window.Event('keydown'); event.key = 'Enter'; event.isComposing = true;
  field.dispatchEvent(event); assert.equal(a.calls.length, 0); assert.equal(field.value, 'अधूरा सवाल');
});

test('Suno can switch A to B to A, and stale speech completion cannot stop the current answer', () => {
  const a = setup(), spoken = [];
  a.browser.speechSynthesis = { speaking: false, cancel() { this.speaking = false; }, speak(u) { spoken.push(u); this.speaking = true; } };
  a.context.SpeechSynthesisUtterance = class { constructor(text) { this.text = text; } };
  a.context.appendMessage('Answer A', 'bot', null, true); a.context.appendMessage('Answer B', 'bot', null, true);
  const [first, second] = a.document.querySelectorAll('.speak-action');
  first.click(); second.click(); first.click();
  assert.deepEqual(spoken.map(u => u.text), ['Answer A', 'Answer B', 'Answer A']);
  spoken[0].onend(); assert.ok(first.classList.contains('speaking'));
  first.click(); assert.equal(a.browser.speechSynthesis.speaking, false);
});

test('delete waits behind a pending photo save and removes the stored image', async () => {
  const a = setup(), pending = a.photos.save('deleted-photo', URI);
  await a.photos.remove(['deleted-photo']); await pending;
  const b = setup({ indexedDB: a.indexedDB }); assert.equal(await b.photos.get('deleted-photo'), null);
});

test('unavailable IndexedDB leaves current-session viewing usable and reports persistence failure', async () => {
  const a = setup({ indexedDB: null }); a.attach(); await a.send('Photo');
  await new Promise(resolve => setImmediate(resolve));
  assert.match(a.document.getElementById('appNotice').textContent, /save nahi ho paayi/);
  assert.equal(a.document.querySelector('.message-photo').disabled, false);
});

test('20 MB and unsupported files fail before decoding; dimensions preserve aspect ratio without upscaling', async () => {
  const { photos } = setup();
  await assert.rejects(photos.prepare({ size: 21 * 1024 * 1024, type: 'image/jpeg' }), /20 MB/);
  await assert.rejects(photos.prepare({ size: 100, type: 'application/pdf' }), /screenshot/);
  const large = photos.fitSize(4000, 3000);
  assert.ok(large.width <= 2560 && large.width * large.height <= 4000000);
  assert.ok(Math.abs(large.width / large.height - 4 / 3) < .002);
  assert.equal(photos.fitSize(200, 100).width, 200);
});

test('large camera images are prepared under the upload budget with white background and URL cleanup', async () => {
  const a = setup(), operations = [];
  class Image { set src(value) { this.naturalWidth = 4032; this.naturalHeight = 3024; queueMicrotask(() => this.onload()); } }
  a.browser.Image = Image;
  a.browser.URL = { createObjectURL: () => 'blob:fixture', revokeObjectURL: url => operations.push(['revoke', url]) };
  const create = a.document.createElement.bind(a.document);
  const ctx = { fillRect: (...args) => operations.push(['fill', ...args]), drawImage: (...args) => operations.push(['draw', ...args.slice(1)]) };
  a.document.createElement = tag => tag === 'canvas' ? { getContext: () => ctx, toDataURL: (type, quality) => { operations.push(['encode', type, quality]); return URI; } } : create(tag);
  const result = await a.photos.prepare({ name: 'camera.jpg', type: 'image/jpeg', size: 8 * 1024 * 1024 });
  assert.equal(result.base64, PNG); assert.ok(result.width * result.height <= 4000000);
  assert.equal(ctx.fillStyle, '#ffffff'); assert.ok(operations.some(op => op[0] === 'draw'));
  assert.ok(operations.some(op => op[0] === 'encode' && op[2] === .94));
  assert.deepEqual(operations.at(-1), ['revoke', 'blob:fixture']);
});

test('Recap does not retrieve the old photo or duplicate chat history, but later photo follow-ups keep the source', async () => {
  const a = setup(); a.attach(); await a.send('Solve this equation');
  const source = a.state('getCurrentSession().messages[1]');
  a.document.getElementById('input').value = 'My unsent question'; a.attach();
  const originalGet = a.photos.get; let lookups = 0;
  a.photos.get = async (...args) => { lookups++; return originalGet(...args); };
  await a.context.sendSpecialRequest('revision', { id: source.id, question: source.question, answer: source.text, language: 'hinglish' });
  assert.equal(lookups, 0); assert.equal(a.calls.at(-1).image, null); assert.deepEqual(a.calls.at(-1).messages, []);
  assert.equal(a.calls.at(-1).action.answer, source.text);
  assert.equal(a.document.getElementById('input').value, 'My unsent question'); assert.equal(a.state('attachedImage.base64'), PNG);
  assert.equal(a.state('getCurrentSession().messages.at(-1).sourceImageId'), source.sourceImageId);
  a.state('attachedImage = null'); await a.send('Isme 3 minus kyun kiya?');
  assert.equal(a.calls.at(-1).image.base64, PNG);
});

test('a server cooldown disables Retry until ready, then retries the same question without duplicate messages', async () => {
  const a = setup(); let clock = 1000, seq = 0; const timers = new Map();
  a.context.Date = class extends Date { static now() { return clock; } };
  a.context.setTimeout = (fn, delay) => { const id = ++seq; timers.set(id, { fn, delay }); return id; };
  a.context.clearTimeout = id => timers.delete(id);
  a.context.fetch = async () => ({ ok: false, status: 429, json: async () => ({ error: 'Temporarily limited.', code: 'rate_limited', retryAfterSeconds: 2 }) });
  await a.send('Summarize this answer');
  const retry = [...a.document.querySelectorAll('.msg.error button')].find(b => b.textContent.startsWith('Retry'));
  assert.equal(retry.disabled, true); assert.equal(retry.textContent, 'Retry in 2s');
  clock += 2000; for (const [id, timer] of [...timers]) { if (timer.delay === 1000) { timers.delete(id); timer.fn(); } }
  assert.equal(retry.disabled, false); assert.equal(retry.textContent, 'Retry');
  a.document.getElementById('input').value = 'Keep my other draft';
  a.context.fetch = async () => ({ ok: true, json: async () => ({ text: 'A concise recap.', responseKind: 'general' }) });
  retry.click(); await new Promise(resolve => setImmediate(resolve));
  assert.equal(a.state('getCurrentSession().messages.filter(m => m.role === "user").length'), 1);
  assert.equal(a.document.querySelectorAll('.msg.error').length, 0);
  assert.equal(a.document.getElementById('input').value, 'Keep my other draft');
});
