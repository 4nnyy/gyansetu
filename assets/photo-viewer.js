(function (root) {
  'use strict';
  function create(onReuse) {
    const doc = root.document, dialog = doc.getElementById('photoViewer');
    const photo = doc.getElementById('viewerPhoto'), stage = doc.getElementById('photoViewStage');
    const label = doc.getElementById('photoZoomLabel'), close = doc.getElementById('photoViewClose');
    const minus = doc.getElementById('photoZoomOut'), plus = doc.getElementById('photoZoomIn');
    let zoom = 1, source = null, opener = null, fallback = false;
    function update() {
      const w = photo.naturalWidth || 1000, h = photo.naturalHeight || 1000;
      const fit = Math.max(1, Math.min(w, (stage.clientWidth || 360) - 24, ((stage.clientHeight || 500) - 24) * w / h));
      photo.style.width = Math.round(fit * zoom) + 'px';
      label.textContent = Math.round(zoom * 100) + '%';
      minus.disabled = zoom <= 1; plus.disabled = zoom >= 4;
    }
    function finish() {
      photo.removeAttribute('src'); source = null;
      if (fallback) ['appHeader', 'appRoot'].forEach(id => { const el = doc.getElementById(id); if (el) el.inert = false; });
      if (opener?.isConnected) opener.focus();
    }
    function shut() {
      if (typeof dialog.close === 'function') dialog.close();
      else { dialog.removeAttribute('open'); finish(); }
    }
    close.addEventListener('click', shut);
    dialog.addEventListener('close', finish);
    dialog.addEventListener('click', e => { if (e.target === dialog) shut(); });
    minus.addEventListener('click', () => { zoom = Math.max(1, zoom - .5); update(); });
    plus.addEventListener('click', () => { zoom = Math.min(4, zoom + .5); update(); });
    doc.getElementById('photoFit').addEventListener('click', () => { zoom = 1; update(); stage.scrollTop = stage.scrollLeft = 0; });
    doc.getElementById('photoReuse').addEventListener('click', () => { const image = source; shut(); if (image) onReuse(image); });
    photo.addEventListener('load', update);
    root.addEventListener('resize', () => { if (source) update(); });
    dialog.addEventListener('keydown', e => {
      if (fallback && e.key === 'Escape') { e.preventDefault(); shut(); }
      if (fallback && e.key === 'Tab') {
        const buttons = Array.from(dialog.querySelectorAll('button')).filter(b => !b.disabled);
        if (e.shiftKey && doc.activeElement === buttons[0]) { e.preventDefault(); buttons.at(-1)?.focus(); }
        else if (!e.shiftKey && doc.activeElement === buttons.at(-1)) { e.preventDefault(); buttons[0]?.focus(); }
      }
    });
    return { open(dataUrl, trigger) {
      const image = root.GyanSetuPhotos.parse(dataUrl); if (!image) return false;
      source = image; opener = trigger || doc.activeElement; zoom = 1;
      fallback = typeof dialog.showModal !== 'function';
      if (fallback) {
        dialog.setAttribute('open', '');
        ['appHeader', 'appRoot'].forEach(id => { const el = doc.getElementById(id); if (el) el.inert = true; });
      } else if (!dialog.open) dialog.showModal();
      photo.src = dataUrl; stage.scrollTop = stage.scrollLeft = 0; update(); close.focus(); return true;
    }, close: shut };
  }
  root.GyanSetuPhotoViewer = { create };
})(typeof window === 'undefined' ? globalThis : window);
