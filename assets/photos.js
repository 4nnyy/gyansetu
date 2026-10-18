/* Photo preparation and browser-local persistence. No photos are stored in localStorage. */
(function (root) {
  'use strict';
  const MAX_FILE_BYTES = 20 * 1024 * 1024,
    MAX_DATA_LENGTH = Math.floor((2.5 * 1024 * 1024) / 3) * 4;
  const memory = new Map();
  let database,
    writes = Promise.resolve();

  function parse(dataUrl) {
    const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/.exec(
      String(dataUrl || '')
    );
    return match && match[2].length % 4 === 0
      ? { mediaType: match[1], base64: match[2], dataUrl }
      : null;
  }
  function fitSize(width, height) {
    if (!(width > 0 && height > 0) || !Number.isFinite(width * height))
      throw new Error('Photo ka size padh nahi paaye. Dusri photo bhejo.');
    const scale = Math.min(
      1,
      2560 / Math.max(width, height),
      Math.sqrt(4000000 / (width * height))
    );
    return {
      width: Math.max(1, Math.floor(width * scale)),
      height: Math.max(1, Math.floor(height * scale)),
    };
  }
  async function prepare(file) {
    if (!file || !file.size) throw new Error('Photo khali hai. Dobara select karo.');
    if (file.size > MAX_FILE_BYTES)
      throw new Error('Photo 20 MB se badi hai. Sirf question ka close-up ya screenshot bhejo.');
    const type =
      file.type ||
      (/\.png$/i.test(file.name)
        ? 'image/png'
        : /\.webp$/i.test(file.name)
          ? 'image/webp'
          : /\.jpe?g$/i.test(file.name)
            ? 'image/jpeg'
            : '');
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(type))
      throw new Error(
        'JPG, PNG ya WebP photo bhejo. HEIC/PDF ho toh question ka screenshot bhejo.'
      );
    const url = root.URL.createObjectURL(file);
    let img;
    try {
      img = await new Promise((resolve, reject) => {
        const image = new root.Image();
        const timer = setTimeout(() => {
          image.src = '';
          reject(new Error('Photo load hone mein zyada samay laga. Dobara try karo.'));
        }, 15000);
        image.onload = () => {
          clearTimeout(timer);
          resolve(image);
        };
        image.onerror = () => {
          clearTimeout(timer);
          reject(new Error('Ye image open nahi ho rahi. Saaf JPG/PNG photo dobara bhejo.'));
        };
        image.src = url;
      });
      if (img.naturalWidth * img.naturalHeight > 48000000)
        throw new Error('Photo bahut high-resolution hai. Sirf question ka close-up bhejo.');
      let { width, height } = fitSize(img.naturalWidth, img.naturalHeight);
      const canvas = root.document.createElement('canvas');
      try {
        for (let pass = 0; pass < 3; pass++) {
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          if (!ctx)
            throw new Error(
              'Is browser mein photo prepare nahi ho paayi. Dusre browser mein try karo.'
            );
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, width, height);
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          ctx.drawImage(img, 0, 0, width, height);
          const outputs =
            type === 'image/png'
              ? [['image/png'], ['image/jpeg', 0.94], ['image/jpeg', 0.86]]
              : [
                  ['image/jpeg', 0.94],
                  ['image/jpeg', 0.86],
                ];
          for (const [mime, quality] of outputs) {
            const prepared = parse(canvas.toDataURL(mime, quality));
            if (prepared && prepared.base64.length <= MAX_DATA_LENGTH)
              return { ...prepared, width, height };
          }
          // Stop before making handwriting unnecessarily tiny. Ask for a closer photo instead.
          if (Math.max(width, height) < 1600) break;
          width = Math.max(1, Math.floor(width * 0.8));
          height = Math.max(1, Math.floor(height * 0.8));
        }
        throw new Error(
          'Photo compress nahi ho paayi. Sirf question ko crop karke ya close-up photo bhejo.'
        );
      } finally {
        canvas.width = canvas.height = 0;
      }
    } finally {
      root.URL.revokeObjectURL(url);
    }
  }
  function remember(id, dataUrl) {
    memory.delete(id);
    memory.set(id, dataUrl);
    while (memory.size > 8) memory.delete(memory.keys().next().value);
  }
  function openDatabase() {
    if (!root.indexedDB) return Promise.reject(new Error('Photo storage unavailable'));
    if (!database)
      database = new Promise((resolve, reject) => {
        const request = root.indexedDB.open('gyansetu_photos_v1', 1);
        const timer = setTimeout(() => reject(new Error('Photo storage timeout')), 5000);
        request.onupgradeneeded = () => {
          if (!request.result.objectStoreNames.contains('photos'))
            request.result.createObjectStore('photos');
        };
        request.onsuccess = () => {
          clearTimeout(timer);
          const db = request.result;
          db.onversionchange = () => {
            db.close();
            database = null;
          };
          resolve(db);
        };
        request.onerror = request.onblocked = () => {
          clearTimeout(timer);
          reject(new Error('Photo storage unavailable'));
        };
      }).catch((error) => {
        database = null;
        throw error;
      });
    return database;
  }
  async function transact(mode, operation) {
    const db = await openDatabase();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('photos', mode);
      let result;
      tx.oncomplete = () => resolve(result);
      tx.onerror = tx.onabort = () => reject(tx.error || new Error('Photo storage failed'));
      operation(tx.objectStore('photos'), (value) => {
        result = value;
      });
    });
  }
  function save(id, dataUrl) {
    if (!parse(dataUrl)) return Promise.reject(new Error('Invalid photo'));
    remember(id, dataUrl);
    const pending = writes.then(() => transact('readwrite', (store) => store.put(dataUrl, id)));
    writes = pending.catch(() => {});
    return pending;
  }
  async function get(id) {
    if (!id) return null;
    if (memory.has(id)) return memory.get(id);
    await writes;
    try {
      const value = await transact('readonly', (store, set) => {
        store.get(id).onsuccess = (event) => set(event.target.result);
      });
      if (!parse(value)) return null;
      remember(id, value);
      return value;
    } catch (_) {
      return null;
    }
  }
  function remove(ids) {
    ids = ids.filter(Boolean);
    ids.forEach((id) => memory.delete(id));
    if (!ids.length) return Promise.resolve();
    const pending = writes.then(() =>
      transact('readwrite', (store) => ids.forEach((id) => store.delete(id)))
    );
    writes = pending.catch(() => {});
    return pending;
  }
  root.GyanSetuPhotos = { prepare, parse, fitSize, save, get, remove };
})(typeof window === 'undefined' ? globalThis : window);
