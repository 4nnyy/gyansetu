'use strict';
// Real DOM parsing/events via LinkeDOM; this does not simulate CSS layout or a phone browser.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { parseHTML } = require('linkedom');
const read = file => fs.readFileSync(path.join(__dirname, '..', file), 'utf8');

function setup(app = false) {
  const html = app ? read('index.html') : '<html><body></body></html>';
  const { window, document } = parseHTML(html);
  if (app) {
    for (const node of document.querySelectorAll('script[src], link[href]')) {
      const url = node.getAttribute('src') || node.getAttribute('href');
      if (url.startsWith('/')) assert.ok(fs.existsSync(path.join(__dirname, '..', url.slice(1))), 'Missing app asset: ' + url);
    }
  }
  const storage = new Map([['gyansetu_quick_start_v1', '1']]);
  const media = { matches: true, addEventListener() {} };
  const browser = { document, marked: require('../assets/vendor/marked-18.1.0.js'), matchMedia: () => media,
    addEventListener() {}, MathJax: { typesetPromise: async () => {}, typesetClear() {} } };
  // LinkeDOM has no focus/layout engine; model only the activeElement contract used by the trap.
  window.HTMLElement.prototype.focus = function () { document.activeElement = this; };
  document.querySelectorAll('textarea, input').forEach(node => { node.value = ''; });
  const context = vm.createContext({ window: browser, document, console, setTimeout, clearTimeout, setInterval, clearInterval,
    AbortController, Event: window.Event,
    localStorage: { getItem: k => storage.get(k) || null, setItem: (k, v) => storage.set(k, v) } });
  vm.runInContext(read('assets/answer-renderer.js'), context);
  for (const file of ['photos.js', 'photo-viewer.js', 'reply-language.js', 'onboarding.js', 'message-menu.js']) vm.runInContext(read('assets/' + file), context);
  if (app) vm.runInContext([...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)].at(-1)[1], context);
  return { window, document, browser, context, media,
    render(source) { const node = document.createElement('div'); browser.GyanSetuAnswer.render(node, source); return node; },
    click(id) { document.getElementById(id).dispatchEvent(new window.Event('click', { bubbles: true })); },
    key(key, shiftKey = false) { const e = new window.Event('keydown', { bubbles: true, cancelable: true }); e.key = key; e.shiftKey = shiftKey; document.dispatchEvent(e); return e; } };
}

test('screenshot-style 12-principle table becomes a complete semantic table with mobile labels', () => {
  const a = setup();
  const text = '| # | Principle | Simple Hindi explanation |\n|---|---|---|\n' +
    Array.from({ length: 12 }, (_, i) => `|${i + 1}| **Principle ${i + 1}** | Explanation ${i + 1}. |`).join('\n');
  const node = a.render(text);
  assert.equal(node.querySelectorAll('tbody tr').length, 12);
  assert.equal(node.querySelectorAll('th[scope="col"]').length, 3);
  assert.equal(node.querySelectorAll('tbody td').length, 36);
  assert.match(node.querySelectorAll('tbody tr')[11].textContent, /Explanation 12\./);
  assert.ok(node.querySelector('.answer-table-cards'));
  assert.equal(node.querySelectorAll('.table-mobile-label')[2].textContent, 'Simple Hindi explanation');
  assert.doesNotMatch(node.textContent, /\|---|\*\*Principle/);
});

test('wide comparison tables keep their grid inside a labelled keyboard-accessible region', () => {
  const node = setup().render('A | B | C | D\n---|---|---|---\n1 | 2 | 3 | 4');
  assert.equal(node.querySelectorAll('td').length, 4);
  assert.equal(node.querySelector('.answer-table-cards'), null);
  assert.equal(node.querySelector('[role="region"]').getAttribute('tabindex'), '0');
});

test('headings, emphasis, nested steps, quotes and code preserve their semantic structure', () => {
  const node = setup().render('# Topic\n\n**Meaning** and *example*.\n\n3. First\n   - Nested\n4. Second\n\n> Keep this in mind.\n\n`x < 2`');
  assert.equal(node.querySelector('h1'), null);
  assert.equal(node.querySelector('h2').textContent, 'Topic');
  assert.equal(node.querySelector('strong').textContent, 'Meaning');
  assert.equal(node.querySelector('ol').getAttribute('start'), '3');
  assert.match(node.querySelector('ol li ul').textContent, /Nested/);
  assert.ok(node.querySelector('blockquote p'));
  assert.equal(node.querySelector('code').textContent, 'x < 2');
});

test('TeX symbols survive Markdown including nested delimiters, matrix environments and table pipes', () => {
  const node = setup().render(String.raw`### Formula

Inline \(x_1^2 + x_2^2\), not Markdown emphasis.

\[\(\frac{1}{2}\)\]

\begin{aligned}a &= b \\ c &= d\end{aligned}

| \(|x|\) | Meaning |
|---|---|
| \(\|x\|\) | Norm |
| \(a|b\) | Divisibility |`);
  assert.equal(node.querySelector('.answer-math').textContent, String.raw`\(x_1^2 + x_2^2\)`);
  assert.equal(node.querySelector('.answer-math-display').textContent, String.raw`\[\frac{1}{2}\]`);
  assert.match(node.querySelectorAll('.answer-math-display')[1].textContent, /\\\[\\begin\{aligned\}/);
  assert.equal(node.querySelector('th .answer-math').textContent, String.raw`\(|x|\)`);
  assert.equal(node.querySelector('td .answer-math').textContent, String.raw`\(\|x\|\)`);
  assert.equal(node.querySelectorAll('tbody tr')[1].querySelector('.answer-math').textContent, String.raw`\(a|b\)`);
  assert.doesNotMatch(node.textContent, /GYANSETUMATH/);
});

test('fenced, unclosed and inline code keep indentation, literal maths and HTML characters', () => {
  const a = setup();
  const code = 'if n < 2:\n    print("<img src=x>")\n    # \\(|x|\\)';
  for (const ending of ['\n```', '']) {
    const node = a.render('```python\n' + code + ending);
    assert.equal(node.querySelector('pre code').textContent, code);
    assert.equal(node.querySelector('.answer-math'), null);
    assert.equal(node.querySelector('img'), null);
  }
  assert.equal(a.render('`\\(|x|\\)`').querySelector('code').textContent, String.raw`\(|x|\)`);
});

test('model HTML, scripts, iframes, tracking images and unsafe URL schemes remain inert', () => {
  const node = setup().render('<img src=x onerror=alert(1)>\n\n<script>alert(1)</script>\n\n<iframe src="https://example.test"></iframe>\n\n[x](javascript:alert%281%29) [y](data:text/html,evil) [z](//example.test) [web](https://example.com/page)\n\n![remote](https://example.test/pixel)');
  assert.equal(node.querySelectorAll('img,script,iframe').length, 0);
  assert.equal(node.querySelectorAll('a').length, 1);
  assert.equal(node.querySelector('a').getAttribute('rel'), 'noopener noreferrer');
  assert.equal(node.querySelector('a').getAttribute('href'), 'https://example.com/page');
  assert.match(node.textContent, /<script>alert\(1\)<\/script>/);
});

test('ordinary escaped table pipes remain one cell and currency prices stay plain', () => {
  const node = setup().render('Prices $10 and $20.\n\n| Name | Value |\n|---|---|\n| A \\| B | two |');
  assert.equal(node.querySelector('p').textContent, 'Prices $10 and $20.');
  assert.equal(node.querySelector('p .answer-math'), null);
  assert.equal(node.querySelector('.table-cell-value').textContent, 'A | B');
});

test('screenshot-style bare br tags make real table line breaks without exposing the markup', () => {
  const a = setup();
  const node = a.render('| Core Subject | Main Topics Covered | Why It Matters |\n|---|---|---|\n| Mathematics I | • Limits<br>• Differentiation<br/>• Matrices<BR />• Functions | Tools |');
  const cell = node.querySelectorAll('.table-cell-value')[1];
  assert.equal(cell.querySelectorAll('br').length, 3);
  assert.doesNotMatch(cell.textContent, /<br/i); assert.match(cell.textContent, /Limits.*Differentiation.*Matrices.*Functions/);
  assert.equal(a.render('First<br>Second').querySelectorAll('br').length, 1);
});

test('br allowance never runs attributes/scripts and preserves literal HTML lessons and escaped tags', () => {
  const a = setup();
  const unsafe = a.render('First<br onclick="alert(1)">Second<script>alert(2)</script><img src=x onerror=alert(3)>');
  assert.equal(unsafe.querySelector('script, img, [onclick], [onerror]'), null);
  assert.match(unsafe.textContent, /onclick/);
  const literal = a.render('Use `<br>` for a break.\n\n```html\n<br>\n<script>alert(1)</script>\n```\n\nEscaped \\<br> stays literal.');
  assert.equal(literal.querySelector('code.inline-code').textContent, '<br>');
  assert.equal(literal.querySelectorAll('br').length, 0); assert.match(literal.querySelector('pre code').textContent, /<br>/);
});

test('a legacy standalone fraction is repaired without treating prose as an equation', () => {
  const a = setup();
  assert.equal(a.render(String.raw`\frac{60}{3} = 20`).querySelector('.answer-math-display').textContent, String.raw`\[\frac{60}{3} = 20\]`);
  assert.equal(a.render(String.raw`We use \frac for this example.`).querySelector('.answer-math-display'), null);
});

test('actual app markup puts composer and footer outside the scrolling conversation', () => {
  const { document } = setup(true);
  assert.ok(document.querySelector('main.chat-panel > .chat-card > .messages'));
  assert.ok(document.querySelector('main.chat-panel > .chat-card > .input-row'));
  assert.equal(document.querySelector('.messages .input-row'), null);
  assert.equal(document.querySelector('main footer'), null);
  assert.ok(document.querySelector('#input[aria-label]'));
});

test('mobile drawer opens, traps keyboard focus, closes on Escape and restores background interaction', () => {
  const a = setup(true), d = a.document;
  a.click('sessionToggle');
  assert.equal(d.getElementById('sessionsWrap').getAttribute('role'), 'dialog');
  assert.equal(d.getElementById('sessionsWrap').getAttribute('aria-modal'), 'true');
  assert.equal(d.getElementById('sessionBackdrop').hidden, false);
  assert.equal(d.getElementById('chatPanel').inert, true);
  assert.equal(d.activeElement.id, 'sessionClose');
  const e = a.key('Tab', true); assert.equal(e.defaultPrevented, true);
  assert.equal(d.activeElement.id, 'subjectPickerToggle');
  a.key('Tab'); assert.equal(d.activeElement.id, 'sessionClose');
  d.getElementById('subjectsSection').setAttribute('open', '');
  a.key('Tab', true);
  assert.equal(d.activeElement.getAttribute('data-subject'), 'Programming');
  assert.notEqual(d.getElementById('subjectsSection').inert, true);
  a.key('Tab'); assert.equal(d.activeElement.id, 'sessionClose');
  a.key('Escape');
  assert.equal(d.getElementById('sessionBackdrop').hidden, true);
  assert.equal(d.getElementById('chatPanel').inert, false);
  assert.equal(d.activeElement.id, 'sessionToggle');
  assert.equal(d.getElementById('sessionsWrap').getAttribute('aria-hidden'), 'true');
  assert.equal(d.getElementById('subjectsSection').hasAttribute('open'), false);
});

test('drawer backdrop closes and a second options click closes the same delete menu', () => {
  const a = setup(true), d = a.document;
  a.click('sessionToggle');
  const button = d.querySelector('.session-menu-btn'), menu = d.querySelector('.session-menu');
  button.click(); assert.equal(menu.classList.contains('hidden'), false);
  assert.equal(button.getAttribute('aria-expanded'), 'true');
  button.click(); assert.equal(menu.classList.contains('hidden'), true);
  assert.equal(button.getAttribute('aria-expanded'), 'false');
  a.click('sessionBackdrop');
  assert.equal(d.getElementById('sessionsWrap').classList.contains('open'), false);
});

test('restoring an older structured answer keeps headings, tables and selected answer actions', () => {
  const a = setup(true);
  a.context.appendMessage('@@ANSWER@@### Main idea\n**Simple meaning.**\n@@DETAILS@@| A | B |\n|---|---|\n| 1 | 2 |', 'bot', null, false, null, { id: 'old-answer', question: 'Original question' });
  const row = a.document.querySelector('[data-message-id="old-answer"]');
  assert.equal(row.querySelector('h3').textContent, 'Main idea');
  assert.equal(row.querySelectorAll('td').length, 2);
  assert.ok(Array.from(row.querySelectorAll('button')).some(b => b.textContent === 'Simplify'));
});

test('preferences stay out of the conversation and close with Escape, outside click and the close control', () => {
  const a = setup(true), d = a.document, panel = d.getElementById('learnerSettings');
  assert.equal(panel.hasAttribute('open'), false);
  assert.ok(d.getElementById('appHeader').contains(panel));
  assert.equal(d.querySelector('.messages #learnerLevel'), null);
  panel.setAttribute('open', ''); d.getElementById('learnerCourse').focus();
  assert.equal(a.key('Escape').defaultPrevented, true);
  assert.equal(panel.hasAttribute('open'), false);
  assert.equal(d.activeElement.id, 'preferencesToggle');
  panel.setAttribute('open', ''); a.click('input');
  assert.equal(panel.hasAttribute('open'), false);
  panel.setAttribute('open', ''); a.click('preferencesClose');
  assert.equal(panel.hasAttribute('open'), false);
  assert.equal(d.activeElement.id, 'preferencesToggle');
  panel.setAttribute('open', '');
  const leave = new a.window.Event('focusout', { bubbles: true }); leave.relatedTarget = d.getElementById('input');
  d.getElementById('learnerCourse').dispatchEvent(leave);
  assert.equal(panel.hasAttribute('open'), false);
});

test('attachment menu selects the correct picker and closes without submitting or erasing the draft', () => {
  const a = setup(true), d = a.document, menu = d.getElementById('attachMenu');
  const picked = [];
  d.getElementById('fileInput').click = () => picked.push('upload');
  d.getElementById('cameraInput').click = () => picked.push('camera');
  d.getElementById('input').value = 'My unsent question';
  menu.setAttribute('open', ''); a.click('attachBtn');
  assert.deepEqual(picked, ['upload']); assert.equal(menu.hasAttribute('open'), false);
  menu.setAttribute('open', ''); a.click('cameraBtn');
  assert.deepEqual(picked, ['upload', 'camera']); assert.equal(menu.hasAttribute('open'), false);
  assert.equal(d.getElementById('input').value, 'My unsent question');
  assert.equal(d.querySelector('.msg-row.user'), null);
  menu.setAttribute('open', ''); a.key('Escape');
  assert.equal(menu.hasAttribute('open'), false); assert.equal(d.activeElement.id, 'attachMenuToggle');
});

test('empty home returns after a new chat and subject selection preserves an unsent draft without extra empty chats', () => {
  const a = setup(true), d = a.document;
  assert.ok(d.querySelector('.messages .empty-state'));
  d.getElementById('input').value = 'Keep my question';
  a.click('sessionToggle');
  d.getElementById('subjectsSection').setAttribute('open', '');
  d.querySelector('[data-subject="Mathematics"]').click();
  assert.equal(d.getElementById('input').value, 'Keep my question');
  assert.equal(vm.runInContext('sessions.length', a.context), 1);
  assert.equal(vm.runInContext('getCurrentSession().subject', a.context), 'Mathematics');
  assert.equal(d.querySelector('[data-subject="Mathematics"]').getAttribute('aria-pressed'), 'true');
  assert.equal(d.getElementById('currentSubjectLabel').textContent, 'Mathematics');
  assert.equal(d.getElementById('subjectsSection').hasAttribute('open'), false);
  assert.equal(d.getElementById('sessionsWrap').classList.contains('open'), false);
  assert.equal(d.getElementById('chatPanel').inert, false);
  a.click('sessionToggle');
  d.getElementById('subjectsSection').setAttribute('open', '');
  d.querySelector('[data-subject="Mathematics"]').click();
  assert.equal(vm.runInContext('sessions.length', a.context), 1);
  assert.equal(d.getElementById('sessionsWrap').classList.contains('open'), false);
  d.querySelector('.suggestion-chip').click();
  assert.match(d.getElementById('input').value, /Derivative/);
  a.context.appendMessage('A real question', 'user');
  assert.equal(d.querySelector('.empty-state'), null);
  a.click('quickNewChatBtn');
  assert.ok(d.querySelector('.messages .empty-state'));
  assert.equal(d.getElementById('input').value, '');
  a.click('examModeBtn');
  assert.equal(d.getElementById('examModeBtn').getAttribute('aria-pressed'), 'true');
  assert.equal(d.getElementById('learnModeBtn').getAttribute('aria-pressed'), 'false');
  a.media.matches = false;
  d.getElementById('subjectsSection').setAttribute('open', '');
  d.querySelector('[data-subject="Physics"]').click();
  assert.equal(d.getElementById('currentSubjectLabel').textContent, 'Physics');
  assert.equal(d.activeElement.id, 'subjectPickerToggle');
  d.getElementById('subjectsSection').setAttribute('open', '');
  assert.equal(a.key('Escape').defaultPrevented, true);
  assert.equal(d.getElementById('subjectsSection').hasAttribute('open'), false);
});

test('math loader is skipped for plain answers and shared by simultaneous mathematical answers', async () => {
  const a = setup(true), d = a.document;
  a.browser.MathJax = { startup: { typeset: false } };
  const plain = a.render('A plain explanation'); d.body.appendChild(plain);
  await a.context.typesetMath(plain);
  assert.equal(d.querySelectorAll('script[src*="mathjax"]').length, 0);
  const first = a.render('\\(x^2\\)'), second = a.render('\\(y^2\\)');
  d.body.append(first, second);
  const one = a.context.typesetMath(first), two = a.context.typesetMath(second);
  const scripts = d.querySelectorAll('script[src*="mathjax"]'); assert.equal(scripts.length, 1);
  const rendered = [];
  a.browser.MathJax = { startup: { promise: Promise.resolve() }, typesetPromise: async nodes => rendered.push(nodes[0]) };
  scripts[0].onload(); await Promise.all([one, two]);
  assert.deepEqual(rendered, [first, second]);
});

test('failed math downloads keep notation and can retry; abandoned answers are not typeset', async () => {
  const a = setup(true), d = a.document; a.browser.MathJax = { startup: { typeset: false } };
  const first = a.render('\\(x+1\\)'); d.body.appendChild(first);
  const one = a.context.typesetMath(first);
  d.querySelector('script[src*="mathjax"]').onerror(); await one;
  assert.match(first.textContent, /x\+1/);
  const retry = a.context.typesetMath(first), script = d.querySelector('script[src*="mathjax"]');
  assert.ok(script); first.remove(); let renders = 0;
  a.browser.MathJax = { startup: { promise: Promise.resolve() }, typesetPromise: async () => renders++ };
  script.onload(); await retry; assert.equal(renders, 0);
});
