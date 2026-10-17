/* Compact message actions with touch hold, keyboard and visible-button alternatives. */
(function (root) {
  'use strict';
  function create(options) {
    const doc = root.document, dialog = doc.getElementById('messageMenu');
    const items = doc.getElementById('messageMenuItems'), closeButton = doc.getElementById('messageMenuClose');
    let active = null, pending = null, background = [];
    function cancelHold() { if (pending) clearTimeout(pending.timer); pending = null; }
    function close(restoreFocus = true) {
      cancelHold();
      if (!active) return;
      const previous = active; active = null;
      previous.trigger.setAttribute('aria-expanded', 'false');
      if (typeof dialog.close === 'function' && dialog.hasAttribute('open')) dialog.close();
      else dialog.removeAttribute('open');
      background.forEach(([node, value]) => { node.inert = value; }); background = [];
      items.textContent = '';
      if (restoreFocus && previous.trigger.isConnected) previous.trigger.focus();
    }
    function open(bubble, actions, trigger, point) {
      cancelHold();
      if (!bubble.isConnected || doc.getElementById('quickGuide').hasAttribute('open') || doc.getElementById('photoViewer').hasAttribute('open')) return;
      close(false); active = { bubble, trigger }; trigger.setAttribute('aria-expanded', 'true');
      items.textContent = '';
      Array.from(actions.querySelectorAll('button')).filter(source => source.classList.contains('copy-action') || source.classList.contains('edit-action')).forEach(source => {
        source.captureSelection?.();
        const button = doc.createElement('button'); button.type = 'button'; button.className = 'message-menu-action'; button.textContent = source.textContent;
        button.disabled = source.disabled || (!options.canMutate() && !source.classList.contains('copy-action') && !source.classList.contains('speak-action'));
        button.addEventListener('click', () => { if (button.disabled) return; close(); source.click(); });
        items.appendChild(button);
      });
      const select = doc.createElement('button'); select.type = 'button'; select.className = 'message-menu-action'; select.textContent = 'Select text';
      select.addEventListener('click', () => { close(); bubble.classList.add('selectable'); options.onSelectText?.(); }); items.appendChild(select);
      background = ['appHeader', 'appRoot'].map(id => [doc.getElementById(id), Boolean(doc.getElementById(id).inert)]);
      background.forEach(([node]) => { node.inert = true; });
      try { if (typeof dialog.showModal === 'function') dialog.showModal(); else dialog.setAttribute('open', ''); }
      catch (_) { dialog.setAttribute('open', ''); }
      const panel = dialog.querySelector('.message-menu-panel');
      if (panel && trigger.getBoundingClientRect) {
        const anchor = trigger.getBoundingClientRect();
        const viewport = root.visualViewport;
        const width = viewport?.width || root.innerWidth;
        const height = viewport?.height || root.innerHeight;
        const left = viewport?.offsetLeft || 0, top = viewport?.offsetTop || 0;
        const rect = panel.getBoundingClientRect();
        const x = point?.x ?? anchor.left, y = point?.y ?? anchor.bottom;
        panel.style.left = Math.max(left + 12, Math.min(x, left + width - rect.width - 12)) + 'px';
        panel.style.top = Math.max(top + 12, Math.min(y + 8, top + height - rect.height - 12)) + 'px';
      }
      (items.querySelector('button:not(:disabled)') || closeButton).focus();
    }
    const interactive = target => target?.closest?.('button, a, input, textarea, select, summary, pre, code, .learning-inline, .message-photo');
    function bind(bubble, actions) {
      const tools = Array.from(actions.querySelectorAll('button')).filter(button => !button.classList.contains('copy-action') && !button.classList.contains('edit-action'));
      if (tools.length) {
        const disclosure = doc.createElement('details'); disclosure.className = 'study-tools';
        const summary = doc.createElement('summary'); summary.textContent = tools.some(button => button.textContent === 'Practice' || button.textContent === 'Explain a step') ? 'Study tools' : 'Answer tools';
        const list = doc.createElement('div'); list.className = 'study-tools-actions';
        const capture = () => tools.forEach(button => button.captureSelection?.());
        summary.addEventListener('pointerdown', capture);
        summary.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') capture(); });
        tools.forEach(button => { list.appendChild(button); button.addEventListener('click', () => disclosure.removeAttribute('open')); });
        disclosure.append(summary, list); bubble.appendChild(disclosure);
      }
      actions.hidden = true; actions.classList.add('message-actions-source'); bubble.classList.add('menu-enabled');
      const trigger = doc.createElement('button'); trigger.type = 'button'; trigger.className = 'message-more';
      trigger.innerHTML = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3"/></svg>';
      trigger.setAttribute('aria-label', 'Copy message'); trigger.setAttribute('title', 'Copy message'); trigger.setAttribute('aria-controls', 'messageMenu'); trigger.setAttribute('aria-expanded', 'false');
      trigger.addEventListener('click', () => actions.querySelector('.copy-action')?.click()); bubble.appendChild(trigger);
      bubble.addEventListener('pointerdown', e => {
        cancelHold();
        if (!['touch', 'pen'].includes(e.pointerType) || e.isPrimary === false || (e.button != null && e.button !== 0) || interactive(e.target) || bubble.classList.contains('selectable')) return;
        const hold = { id: e.pointerId, x: e.clientX, y: e.clientY, timer: null };
        hold.timer = setTimeout(() => { if (pending !== hold) return; pending = null; open(bubble, actions, trigger, hold); }, 500);
        pending = hold;
      });
      bubble.addEventListener('contextmenu', e => {
        if ((interactive(e.target) && e.target !== trigger) || bubble.classList.contains('selectable')) return;
        e.preventDefault(); if (!active) open(bubble, actions, trigger, { x: e.clientX, y: e.clientY });
      });
      // A regular tap never edits/sends. Select text restores native selection on touch.
      bubble.addEventListener('keydown', e => {
        if (e.key === 'ContextMenu' || (e.shiftKey && e.key === 'F10')) { e.preventDefault(); open(bubble, actions, trigger); }
      });
    }
    doc.addEventListener('pointermove', e => {
      if (pending && (e.pointerId !== pending.id || Math.hypot(e.clientX - pending.x, e.clientY - pending.y) > 12)) cancelHold();
    });
    ['pointerup', 'pointercancel'].forEach(name => doc.addEventListener(name, cancelHold));
    doc.addEventListener('pointerdown', e => { if (pending && (e.pointerId !== pending.id || e.isPrimary === false)) cancelHold(); });
    doc.addEventListener('scroll', cancelHold, true); root.addEventListener('blur', cancelHold);
    closeButton.addEventListener('click', () => close());
    dialog.addEventListener('cancel', e => { e.preventDefault(); close(); });
    dialog.addEventListener('close', () => close());
    dialog.addEventListener('click', e => { if (e.target === dialog) close(); });
    dialog.addEventListener('keydown', e => {
      if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); }
      if (e.key === 'Tab') {
        const buttons = Array.from(dialog.querySelectorAll('button')).filter(button => !button.disabled), first = buttons[0], last = buttons.at(-1);
        if (e.shiftKey && doc.activeElement === first) { e.preventDefault(); last?.focus(); }
        else if (!e.shiftKey && doc.activeElement === last) { e.preventDefault(); first?.focus(); }
      }
    });
    return { bind, close };
  }
  root.GyanSetuMessageMenu = { create };
})(typeof window === 'undefined' ? globalThis : window);
