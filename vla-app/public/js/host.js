// Pont avec l'application de gestion existante « VLA Gestion » (même site, même origine).
// - connexion unique : on réutilise la session de l'équipe (pseudo + code, rôles manager / secrétariat)
// - un candidat testé devient (ou met à jour) un apprenant de la gestion (étape « Test de placement »)
// - les apprenants inscrits / en formation et les groupes alimentent l'Entraînement et la « Vie du centre »
// Le module reste utilisable seul (mode démo) quand la gestion n'est pas présente.
import { fullName } from './identity.js';
import { practiceLevelFor } from './practice.js';

export const HOST_KEY = 'vla-gestion-demo-v7';
const TODAY = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const digits = (s) => String(s || '').replace(/\D/g, '').replace(/^237/, '');

export function hostDB() {
  try { const d = JSON.parse(localStorage.getItem(HOST_KEY)); return d && d.team && d.learners ? d : null; } catch { return null; }
}
export const hasHost = () => !!hostDB();
export function saveHost(db) { localStorage.setItem(HOST_KEY, JSON.stringify(db)); }

/** Utilisateur connecté dans la gestion (sessionStorage ou « rester connecté »), s'il est actif. */
export function hostUser() {
  const db = hostDB(); if (!db) return null;
  let id = null;
  try { id = sessionStorage.getItem(HOST_KEY + '-u'); if (!id && sessionStorage.getItem(HOST_KEY + '-u') !== 'out') id = localStorage.getItem(HOST_KEY + '-keep'); } catch { /* */ }
  if (!id || id === 'out') return null;
  const u = db.team.find((t) => t.id === id && t.active && !t.deleted);
  return u ? { id: u.id, name: u.name, role: u.role, photo: u.photo } : null;
}
export function hostLogin(pseudo, code) {
  const db = hostDB(); if (!db) throw new Error('Gestion introuvable');
  const u = db.team.find((t) => t.pseudo === String(pseudo).trim().toLowerCase() && t.code === String(code).trim());
  if (!u) throw new Error('Pseudo ou code incorrect.');
  if (!u.active) throw new Error('Cet accès a été bloqué par la manager.');
  sessionStorage.setItem(HOST_KEY + '-u', u.id);
  return { id: u.id, name: u.name, role: u.role, photo: u.photo };
}
export function hostLogout() { try { sessionStorage.setItem(HOST_KEY + '-u', 'out'); localStorage.removeItem(HOST_KEY + '-keep'); } catch { /* */ } }
export const canUsePlacement = (u) => !!u && (u.role === 'manager' || u.role === 'secretaire');
export const canManage = (u) => !!u && u.role === 'manager';

/** Programme de la gestion adapté au test passé et à l'âge. */
export function programFor(db, testCode, age) {
  const ids = db.programs.map((p) => p.id);
  const pick = (id) => (ids.includes(id) ? id : ids[0]);
  if (testCode === 'IEL') return pick('p5');
  if (testCode === 'ENF') return pick(age && age <= 10 ? 'p1' : 'p2');
  if (age && age <= 14) return pick('p2');
  if (age && age <= 18) return pick('p3');
  return pick('p4');
}
const LEVEL_HOST = { 'Pré-A1': 'Débutant', Débutant: 'Débutant', Starter: 'Débutant', '< B1': 'A2' };

/** Crée ou met à jour l'apprenant de la gestion correspondant au candidat. Retourne { learner, created }. */
export function upsertLearner(identity, info) {
  const db = hostDB(); if (!db) return null;
  const phone = digits(identity.tel), parent = identity.parent || '';
  let l = db.learners.find((x) => phone && (digits(x.phone) === phone || digits(x.parentPhone) === phone));
  const tc = (x) => String(x || '').toLowerCase().replace(/(^|[\s'’-])(\p{L})/gu, (m, a, b) => a + b.toUpperCase());
  const name = `${identity.prenom || ''} ${tc(identity.nom)}`.trim(), level = LEVEL_HOST[info.level] || info.level || '';
  const histo = `Test de placement VLA (${info.testCode}) : niveau ${info.level}${info.attestationNo ? ' · attestation ' + info.attestationNo : ''}`;
  let created = false;
  if (!l) {
    created = true;
    l = { id: Math.random().toString(36).slice(2, 9), name, phone: String(identity.tel || ''), lang: 'fr', parent, parentPhone: parent ? String(identity.tel || '') : '', programId: programFor(db, info.testCode, identity.age), groupSize: 1, groupId: '', stage: 'test', source: 'Passage au centre', created: TODAY(), testDate: TODAY(), level, notes: '', periodStart: '', discount: 0, discountReason: '', promise: null, lastMsg: '', scores: [], history: [] };
    db.learners.push(l);
  } else {
    if (l.stage === 'prospect') l.stage = 'test';
    l.testDate = TODAY(); l.level = level;
    if (!l.parent && parent) l.parent = parent;
  }
  l.vla = { ...(l.vla || {}), testCode: info.testCode, global: info.level, attestationNo: info.attestationNo || '', sessionId: info.sessionId || '' };
  l.history = l.history || []; l.history.push({ d: TODAY(), t: histo });
  const u = hostUser();
  db.log = db.log || []; db.log.unshift({ at: `${TODAY()} ${new Date().toTimeString().slice(0, 5)}`, u: u?.id, k: 'contact', t: `${created ? 'Nouveau candidat' : 'Test de placement'} : ${name} → niveau ${info.level}` });
  db.log = db.log.slice(0, 300);
  saveHost(db);
  return { learner: l, created };
}

/** Apprenants inscrits / en formation de la gestion → élèves de l'Entraînement (code d'accès conservé). */
export async function syncFromHost(backend) {
  const db = hostDB(); if (!db) return { n: 0 };
  const existing = await backend.listCol('students');
  const byHost = new Map(existing.filter((s) => s.hostId).map((s) => [s.hostId, s]));
  const used = new Set(existing.map((s) => s.code));
  const code = () => { const a = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; let c; do { c = Array.from({ length: 6 }, () => a[Math.floor(Math.random() * a.length)]).join(''); } while (used.has(c)); used.add(c); return c; };
  let n = 0;
  const act = db.learners.filter((l) => ['inscrit', 'formation'].includes(l.stage));
  for (const l of act) {
    const old = byHost.get(l.id), parts = String(l.name).trim().split(/\s+/), prenom = parts[0] || '', nom = parts.slice(1).join(' ').toUpperCase();
    const g = db.groups.find((x) => x.id === l.groupId), p = db.programs.find((x) => x.id === l.programId);
    const rec = { ...(old || {}), id: old?.id || 'h' + l.id, hostId: l.id, code: old?.code || code(), nom, prenom, tel: l.phone, level: practiceLevelFor(l.level), classId: l.groupId || '', className: g?.name || '', status: 'inscrit', kid: ['p1', 'p2'].includes(l.programId) || old?.kid || false, program: p?.name || '', photo: old?.photo || '' };
    if (!old || JSON.stringify([old.nom, old.prenom, old.level, old.classId, old.tel, old.kid]) !== JSON.stringify([rec.nom, rec.prenom, rec.level, rec.classId, rec.tel, rec.kid])) { await backend.putDoc('students', rec.id, rec); n++; }
    await backend.putDoc('logins', rec.code, { id: rec.code, studentId: rec.id });
  }
  // élèves liés qui ne sont plus inscrits/en formation → anciens
  for (const s of existing) if (s.hostId && !act.find((l) => l.id === s.hostId) && s.status !== 'ancien') { await backend.putDoc('students', s.id, { ...s, status: 'ancien' }); n++; }
  return { n, total: act.length };
}

/** Groupes de la gestion, au format « classes » de l'espace Vie du centre. */
export function hostClasses(db = hostDB()) {
  if (!db) return [];
  const J = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const lessons = Object.keys(db.reports || {});
  return db.groups.filter((g) => !g.deleted).map((g) => {
    const t = db.team.find((m) => m.id === g.teacherId), p = db.programs.find((x) => x.id === g.programId);
    const lv = db.learners.filter((l) => l.groupId === g.id && ['inscrit', 'formation'].includes(l.stage));
    return { id: g.id, name: g.name, level: practiceLevelFor(lv[0]?.level), days: (g.days || []).map((d) => J[d][0].toUpperCase() + J[d].slice(1)), time: `${g.start || ''} – ${g.end || ''}`, trainer: t?.name || '', size: lv.length, lessons: lessons.filter((k) => k.includes(g.id)).length, last: '', program: p?.name || '' };
  });
}
