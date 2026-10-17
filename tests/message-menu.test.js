'use strict';
// Deterministic DOM/pointer simulations, not real mobile gesture or pixel tests.
const test = require('node:test'), assert = require('node:assert/strict');
const fs = require('node:fs'), path = require('node:path'), vm = require('node:vm');
const { parseHTML } = require('linkedom');
function setup() {
  const { document, window } = parseHTML('<html><body><header id="appHeader"></header><main id="appRoot"><article id="bubble"><p id="text">A question</p><a id="link">Link</a><pre id="code">Code</pre><div id="actions"><button class="copy-action">Copy</button><button class="edit-action">Edit</button><button class="speak-action">Listen</button><button>Simplify</button></div></article></main><dialog id="quickGuide"></dialog><dialog id="photoViewer"></dialog><dialog id="messageMenu"><button id="messageMenuClose">Close</button><div id="messageMenuItems"></div></dialog></body></html>');
  window.HTMLElement.prototype.focus = function () { document.activeElement = this; };
  const timers = new Map(), listeners = {}, calls = [], el = id => document.getElementById(id); let now = 0, seq = 0, busy = false, selected = false;
  const browser = { document, addEventListener: (name, cb) => { listeners[name] = cb; } };
  const context = vm.createContext({ window: browser, setTimeout: (cb, delay) => { const id = ++seq; timers.set(id, { cb, at: now + delay }); return id; }, clearTimeout: id => timers.delete(id) });
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../assets/message-menu.js'), 'utf8'), context);
  for (const button of el('actions').querySelectorAll('button')) button.addEventListener('click', () => calls.push(button.textContent));
  const menu = browser.GyanSetuMessageMenu.create({ canMutate: () => !busy, onSelectText: () => { selected = true; } }); menu.bind(el('bubble'), el('actions'));
  const event = (node, type, data = {}) => { const e = new window.Event(type, { bubbles: true, cancelable: true }); Object.assign(e, data); node.dispatchEvent(e); return e; };
  const pointer = (type, data = {}, node = el('text')) => event(node, type, { pointerId: 1, pointerType: 'touch', clientX: 50, clientY: 50, isPrimary: true, button: 0, ...data });
  return { el, document, menu, calls, event, pointer, listeners, busy: b => { busy = b; }, selected: () => selected,
    more: () => el('bubble').querySelector('.message-more'), opened: () => el('messageMenu').hasAttribute('open'),
    action: label => [...el('messageMenuItems').querySelectorAll('button')].find(b => b.textContent === label),
    tick(ms) { now += ms; for (const [id, t] of timers) if (t.at <= now) { timers.delete(id); t.cb(); } } };
}
test('touch hold opens once at 500ms; original controls are hidden and proxy Copy acts once', () => {
  const a = setup(); a.pointer('pointerdown'); a.tick(499); assert.equal(a.opened(), false); a.tick(1); assert.equal(a.opened(), true);
  assert.equal(a.el('actions').hidden, true); assert.equal(a.el('bubble').querySelectorAll('.message-more').length, 1);
  assert.equal(a.el('appRoot').inert, true); a.action('Copy').click(); assert.deepEqual(a.calls, ['Copy']);
  assert.equal(a.opened(), false); assert.equal(a.el('appRoot').inert, false); assert.equal(a.document.activeElement.className, 'message-more');
  a.tick(1000); assert.equal(a.opened(), false);
});
test('short taps, movement, scrolling, cancellation, second finger and blur never open a held menu', () => {
  for (const cancel of [a => a.pointer('pointerup'), a => a.pointer('pointermove', { clientX: 70 }),
    a => a.event(a.document, 'scroll'), a => a.pointer('pointercancel'), a => a.pointer('pointerdown', { pointerId: 2, isPrimary: false }), a => a.listeners.blur()]) {
    const a = setup(); a.pointer('pointerdown'); a.tick(200); cancel(a); a.tick(500); assert.equal(a.opened(), false); assert.equal(a.calls.length, 0);
  }
});
test('interactive content, mouse down and text-selection mode retain native behavior', () => {
  const a = setup();
  for (const node of [a.el('link'), a.el('code'), a.more()]) { a.pointer('pointerdown', {}, node); a.tick(600); assert.equal(a.opened(), false); }
  a.pointer('pointerdown', { pointerType: 'mouse' }); a.tick(600); assert.equal(a.opened(), false);
  a.event(a.more(), 'keydown', { key: 'ContextMenu' }); a.action('Select text').click(); assert.equal(a.selected(), true); assert.equal(a.el('bubble').classList.contains('selectable'), true);
  a.pointer('pointerdown'); a.tick(600); assert.equal(a.opened(), false);
  assert.equal(a.event(a.el('text'), 'contextmenu').defaultPrevented, false);
  a.event(a.more(), 'keydown', { key: 'ContextMenu' }); assert.equal(a.opened(), true);
});
test('keyboard menu, focus wrap, Escape, native cancel and backdrop restore original inert state', () => {
  const a = setup(); a.el('appHeader').inert = true;
  a.event(a.more(), 'keydown', { key: 'F10', shiftKey: true }); assert.equal(a.opened(), true);
  a.action('Select text').focus(); a.event(a.el('messageMenu'), 'keydown', { key: 'Tab' }); assert.equal(a.document.activeElement.id, 'messageMenuClose');
  a.event(a.el('messageMenu'), 'keydown', { key: 'Tab', shiftKey: true }); assert.equal(a.document.activeElement.textContent, 'Select text');
  a.event(a.el('messageMenu'), 'keydown', { key: 'Escape' }); assert.equal(a.opened(), false);
  assert.equal(a.el('appHeader').inert, true); assert.equal(a.el('appRoot').inert, false);
  for (const type of ['cancel', 'click']) { a.event(a.more(), 'keydown', { key: 'ContextMenu' }); a.event(a.el('messageMenu'), type); assert.equal(a.opened(), false); }
});
test('busy state disables editing; only Copy/Edit/Select text appear in the message menu', () => {
  const a = setup(); a.busy(true); a.event(a.more(), 'keydown', { key: 'ContextMenu' });
  assert.equal(a.action('Edit').disabled, true); a.action('Edit').click();
  assert.equal(a.calls.length, 0); assert.equal(a.action('Copy').disabled, false);
  assert.deepEqual([...a.el('messageMenuItems').querySelectorAll('button')].map(b => b.textContent), ['Copy', 'Edit', 'Select text']);
  const tools = a.el('bubble').querySelector('.study-tools');
  assert.equal(tools.hasAttribute('open'), false);
  assert.deepEqual([...tools.querySelectorAll('button')].map(b => b.textContent), ['Listen', 'Simplify']);
  assert.doesNotMatch(a.more().textContent, /⋯|Simplify|Listen/);
});
test('photo/onboarding modals and removed messages cannot open competing menus', () => {
  const a = setup();
  for (const id of ['quickGuide', 'photoViewer']) { a.el(id).setAttribute('open', ''); a.event(a.more(), 'keydown', { key: 'ContextMenu' }); assert.equal(a.opened(), false); a.el(id).removeAttribute('open'); }
  const trigger = a.more(); a.el('bubble').remove(); trigger.click(); assert.equal(a.opened(), false);
});
test('selected excerpt is captured before the modal takes focus', () => {
  const a = setup(); let captured;
  a.el('text').focus(); a.el('actions').querySelector('button').captureSelection = () => { captured = a.document.activeElement.id; };
  a.event(a.more(), 'keydown', { key: 'ContextMenu' }); assert.equal(captured, 'text'); assert.notEqual(a.document.activeElement.id, 'text');
});

test('copy icon copies immediately without opening a popup or submitting a question', () => {
  const a = setup(); a.more().click();
  assert.deepEqual(a.calls, ['Copy']); assert.equal(a.opened(), false);
  assert.equal(a.more().getAttribute('aria-label'), 'Copy message');
});
