// Petit magasin clé/valeur IndexedDB (tout le stockage hors ligne de l'app).
let dbp;
function open() {
  if (!dbp) {
    dbp = new Promise((res, rej) => {
      const r = indexedDB.open('vla-placement', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('kv');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    });
  }
  return dbp;
}
const tx = async (mode, fn) => {
  const db = await open();
  return new Promise((res, rej) => {
    const t = db.transaction('kv', mode);
    const out = fn(t.objectStore('kv'));
    t.oncomplete = () => res(out && 'result' in out ? out.result : undefined);
    t.onerror = () => rej(t.error);
  });
};
export const idb = {
  get: (k) => tx('readonly', (s) => s.get(k)),
  set: (k, v) => tx('readwrite', (s) => { s.put(v, k); }),
  del: (k) => tx('readwrite', (s) => { s.delete(k); }),
  async prefix(p) {
    const db = await open();
    return new Promise((res, rej) => {
      const out = [];
      const q = db.transaction('kv').objectStore('kv').openCursor(IDBKeyRange.bound(p, p + '￿'));
      q.onsuccess = () => {
        const c = q.result;
        if (c) { out.push({ key: c.key, value: c.value }); c.continue(); } else res(out);
      };
      q.onerror = () => rej(q.error);
    });
  },
};
