// Couche d'accès aux données : deux adaptateurs avec la même interface.
//  • local    : IndexedDB + BroadcastChannel (démo / un seul navigateur, plusieurs onglets)
//  • firebase : Firestore + Auth (Spark gratuit) — temps réel entre appareils
import { idb } from './idb.js';
import { firebaseConfig } from './firebase-config.js';
import { hasHost, hostUser, hostLogin, hostLogout, canUsePlacement } from './host.js';

const FB = 'https://www.gstatic.com/firebasejs/10.12.2/';
const bc = 'BroadcastChannel' in self ? new BroadcastChannel('vla') : null;

/* ------------------------------ LOCAL ------------------------------ */
function localAdapter() {
  const subs = new Set();
  let patchQ = Promise.resolve();
  const notify = (col) => { subs.forEach((s) => s.col === col && s.run()); bc?.postMessage(col); };
  bc && (bc.onmessage = (e) => subs.forEach((s) => s.col === e.data && s.run()));
  const get = (col, id) => idb.get(`${col}/${id}`);
  const put = async (col, id, v) => { await idb.set(`${col}/${id}`, v); notify(col); };
  const all = async (col) => (await idb.prefix(col + '/')).map((r) => r.value);
  const getAnswers = async (sid) => {
    const rows = await idb.prefix(`answers/${sid}/`);
    return Object.fromEntries(rows.map((r) => [r.key.split('/')[2], r.value]));
  };
  const watch = (col, loader, cb) => {
    const s = { col, run: async () => cb(await loader()) };
    subs.add(s); s.run();
    return () => subs.delete(s);
  };
  return {
    mode: 'local',
    async init() {},
    // Authentification du personnel : code PIN local défini au premier lancement
    async staffState() {
      if (hasHost()) { const u = hostUser(); return { hasPin: true, host: true, user: canUsePlacement(u) ? u : null, denied: !!u && !canUsePlacement(u) }; }
      return { hasPin: !!(await get('settings', 'pin')), user: sessionStorage.getItem('vla-staff') ? { name: 'Valérie', role: 'manager' } : null };
    },
    async staffLogin({ pin, pseudo, code }) {
      if (hasHost()) { const u = hostLogin(pseudo, code); if (!canUsePlacement(u)) throw new Error('Accès réservé à la manager et au secrétariat.'); return u; }
      const saved = await get('settings', 'pin');
      const h = await sha(pin);
      if (!saved) { await put('settings', 'pin', h); } else if (saved !== h) throw new Error('Code incorrect');
      sessionStorage.setItem('vla-staff', '1');
      return { name: 'Valérie', role: 'manager' };
    },
    async staffLogout() { if (hasHost()) hostLogout(); sessionStorage.removeItem('vla-staff'); },
    async candidateAuth() {},
    async getTestPublic(code) {
      const cached = await get('tests_public', code);
      if (cached) return cached;
      const r = await fetch(`data/public_${code}.json`);
      if (!r.ok) throw new Error('Test introuvable');
      return r.json();
    },
    async getTestKey(code) {
      const k = await get('tests_key', code);
      if (k) return k;
      if (['localhost', '127.0.0.1'].includes(location.hostname)) {
        const r = await fetch(`/__dev/key/${code}.json`);
        if (r.ok) return r.json();
      }
      return null;
    },
    async putTest(code, pub, key) { await put('tests_public', code, pub); await put('tests_key', code, key); },
    async listKeys() { return (await all('tests_key')).map((k) => k.code); },
    async createSession(s) { if (await get('sessions', s.id)) throw new Error('code déjà utilisé'); await put('sessions', s.id, s); },
    getSession: (id) => get('sessions', id),
    // Les mises à jour sont sérialisées pour éviter les écrasements (lecture-modification-écriture concurrentes).
    patchSession(id, patch) {
      patchQ = patchQ.catch(() => {}).then(async () => { const s = await get('sessions', id); if (!s) throw new Error('session absente'); await put('sessions', id, { ...s, ...patch }); });
      return patchQ;
    },
    onSessions: (cb) => watch('sessions', () => all('sessions'), cb),
    onSession: (id, cb) => watch('sessions', () => get('sessions', id), cb),
    putAnswer: (sid, id, v) => put('answers', `${sid}/${id}`, { v, t: Date.now() }),
    getAnswers,
    onAnswers: (sid, cb) => watch('answers', () => getAnswers(sid), cb),
    getResult: (sid) => get('results', sid),
    putResult: (sid, r) => put('results', sid, r),
    onResults: (cb) => watch('results', () => all('results'), cb),
    async nextAttestationNo(year) {
      const c = (await get('counters', 'attestation')) || { year, n: 0 };
      const n = c.year === year ? c.n + 1 : 1;
      await put('counters', 'attestation', { year, n });
      return `VLA-${year}-${String(n).padStart(4, '0')}`;
    },
    // Accès générique aux collections (Centre, Entraînement…)
    listCol: (c) => all(c),
    getDoc: (c, id) => get(c, id),
    putDoc: (c, id, v) => put(c, id, v),
    delDoc: async (c, id) => { await idb.del(`${c}/${id}`); notify(c); },
    onCol: (c, cb) => watch(c, () => all(c), cb),
    listPeople: () => all('people'),
    putPerson: (p) => put('people', p.id, p),
    onPeople: (cb) => watch('people', () => all('people'), cb),
    getSettings: async () => (await get('settings', 'centre')) || {},
    putSettings: (s) => put('settings', 'centre', s),
    async exportAll() {
      const rows = await idb.prefix('');
      return Object.fromEntries(rows.filter((r) => !/^(cand|audio|settings\/pin)/.test(r.key)).map((r) => [r.key, r.value]));
    },
    async importAll(obj) { for (const [k, v] of Object.entries(obj)) await idb.set(k, v); subs.forEach((s) => s.run()); },
  };
}

async function sha(s) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode('vla:' + s));
  return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, '0')).join('');
}

/* ----------------------------- FIREBASE ---------------------------- */
async function firebaseAdapter(cfg) {
  const [{ initializeApp }, A, F] = await Promise.all([
    import(FB + 'firebase-app.js'), import(FB + 'firebase-auth.js'), import(FB + 'firebase-firestore.js'),
  ]);
  const app = initializeApp(cfg);
  const auth = A.getAuth(app);
  // Cache hors ligne Firestore (IndexedDB) : les écritures sont mises en file puis synchronisées.
  const db = F.initializeFirestore(app, { localCache: F.persistentLocalCache({ tabManager: F.persistentMultipleTabManager() }) });
  const D = (...p) => F.doc(db, ...p);
  const C = (...p) => F.collection(db, ...p);
  const snapDoc = async (ref) => { const s = await F.getDoc(ref); return s.exists() ? s.data() : null; };
  return {
    mode: 'firebase',
    async init() {},
    staffState: () => new Promise((res) => { const u = A.onAuthStateChanged(auth, (user) => { u(); res({ hasPin: true, user: user && !user.isAnonymous ? { name: user.displayName || user.email } : null }); }); }),
    async staffLogin({ email, password }) { const c = await A.signInWithEmailAndPassword(auth, email, password); return { name: c.user.email }; },
    staffLogout: () => A.signOut(auth),
    async candidateAuth() { if (!auth.currentUser) await A.signInAnonymously(auth); },
    getTestPublic: async (code) => snapDoc(D('tests_public', code)),
    getTestKey: async (code) => snapDoc(D('tests_key', code)),
    async putTest(code, pub, key) { await F.setDoc(D('tests_public', code), { json: JSON.stringify(pub) }); await F.setDoc(D('tests_key', code), { json: JSON.stringify(key) }); },
    async listKeys() { return (await F.getDocs(C('tests_key'))).docs.map((d) => d.id); },
    async createSession(s) { if ((await F.getDoc(D('sessions', s.id))).exists()) throw new Error('code déjà utilisé'); await F.setDoc(D('sessions', s.id), s); },
    getSession: (id) => snapDoc(D('sessions', id)),
    patchSession: (id, patch) => F.updateDoc(D('sessions', id), patch),
    onSessions: (cb) => F.onSnapshot(C('sessions'), (s) => cb(s.docs.map((d) => d.data()))),
    onSession: (id, cb) => F.onSnapshot(D('sessions', id), (s) => cb(s.exists() ? s.data() : null)),
    putAnswer: (sid, id, v) => F.setDoc(D('sessions', sid, 'answers', id), { v, t: Date.now() }),
    async getAnswers(sid) { const s = await F.getDocs(C('sessions', sid, 'answers')); return Object.fromEntries(s.docs.map((d) => [d.id, d.data()])); },
    onAnswers: (sid, cb) => F.onSnapshot(C('sessions', sid, 'answers'), (s) => cb(Object.fromEntries(s.docs.map((d) => [d.id, d.data()])))),
    getResult: (sid) => snapDoc(D('results', sid)),
    putResult: (sid, r) => F.setDoc(D('results', sid), JSON.parse(JSON.stringify(r))),
    onResults: (cb) => F.onSnapshot(C('results'), (s) => cb(s.docs.map((d) => d.data()))),
    nextAttestationNo: (year) => F.runTransaction(db, async (t) => {
      const ref = D('counters', 'attestation');
      const s = await t.get(ref);
      const c = s.exists() ? s.data() : { year, n: 0 };
      const n = c.year === year ? c.n + 1 : 1;
      t.set(ref, { year, n });
      return `VLA-${year}-${String(n).padStart(4, '0')}`;
    }),
    listCol: async (c) => (await F.getDocs(C(c))).docs.map((d) => d.data()),
    getDoc: (c, id) => snapDoc(D(c, id)),
    putDoc: (c, id, v) => F.setDoc(D(c, id), JSON.parse(JSON.stringify(v))),
    delDoc: (c, id) => F.deleteDoc(D(c, id)),
    onCol: (c, cb) => F.onSnapshot(C(c), (s) => cb(s.docs.map((d) => d.data()))),
    listPeople: async () => (await F.getDocs(C('people'))).docs.map((d) => d.data()),
    putPerson: (p) => F.setDoc(D('people', p.id), JSON.parse(JSON.stringify(p))),
    onPeople: (cb) => F.onSnapshot(C('people'), (s) => cb(s.docs.map((d) => d.data()))),
    getSettings: async () => (await snapDoc(D('settings', 'centre'))) || {},
    putSettings: (s) => F.setDoc(D('settings', 'centre'), s),
    async exportAll() { return {}; },
    async importAll() {},
  };
}

/* Les tests Firestore sont stockés en JSON texte (évite les limites de profondeur/champs) → on enveloppe. */
function unwrapTests(b) {
  const g = (f) => async (c) => { const d = await f(c); return d && d.json ? JSON.parse(d.json) : d; };
  b.getTestPublic = g(b.getTestPublic);
  b.getTestKey = g(b.getTestKey);
  return b;
}

export async function createBackend() {
  if (firebaseConfig) {
    try { const b = unwrapTests(await firebaseAdapter(firebaseConfig)); await b.init(); return b; }
    catch (e) { console.warn('Firebase indisponible, bascule en mode local', e); }
  }
  const b = localAdapter();
  await b.init();
  return b;
}
