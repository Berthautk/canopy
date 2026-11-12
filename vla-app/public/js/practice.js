// Entraînement quotidien : choix des questions (répétition espacée de Leitner), correction, progression.
// Fonctions pures : testables sans navigateur.
import { normalize, matchesAccept } from './scoring.js';

export const PRACTICE_LEVELS = ['A1', 'A2', 'B1', 'B2'];
const GAPS = [1, 2, 4, 7, 14]; // jours avant de revoir une question selon sa « boîte » (1 → 5)

/** Le niveau du test de placement → niveau d'entraînement. */
export function practiceLevelFor(level) {
  if (!level || ['Pré-A1', 'Débutant', 'Starter', '< B1'].includes(level)) return 'A1';
  if (level === 'C1') return 'B2';
  return PRACTICE_LEVELS.includes(level) ? level : 'A1';
}
export const dayIndex = (d = new Date()) => Math.floor((d.getTime() - d.getTimezoneOffset() * 60000) / 864e5);

export function newProgress(studentId, level) {
  return { id: studentId, level: practiceLevelFor(level), items: {}, log: [], streak: 0, xp: 0, lastDay: null };
}

/** Correction d'une réponse. */
export function grade(q, answer) {
  if (answer === undefined || answer === null || String(answer).trim() === '') return false;
  if (q.type === 'mcq') return Number(answer) === Number(q.answer);
  if (q.type === 'tf') return String(answer) === String(q.answer);
  return matchesAccept(answer, q.accept || [q.answer]);
}
export const answerText = (q) => (q.type === 'mcq' ? q.options[q.answer] : q.type === 'tf' ? q.answer : (q.accept || [q.answer]).join(' / '));

/** Questions du jour : d'abord celles à revoir, puis les nouvelles, puis le reste. */
export function pickDaily(bank, progress, n = 10, today = dayIndex()) {
  const pool = bank.filter((q) => q.level === progress.level);
  const st = (q) => progress.items[q.id];
  const due = pool.filter((q) => st(q) && st(q).due <= today).sort((a, b) => st(a).box - st(b).box || st(a).due - st(b).due);
  const fresh = pool.filter((q) => !st(q)).sort((a, b) => hash(a.id + today) - hash(b.id + today));
  const rest = pool.filter((q) => st(q) && st(q).due > today).sort((a, b) => st(a).box - st(b).box);
  return [...due, ...fresh, ...rest].slice(0, n);
}
function hash(s) { let h = 0; for (const c of String(s)) h = (h * 31 + c.charCodeAt(0)) | 0; return Math.abs(h); }

/** Applique les résultats d'une séance ; retourne un nouvel objet progression. */
export function applyResults(progress, results, today = dayIndex()) {
  const p = JSON.parse(JSON.stringify(progress));
  let ok = 0;
  for (const r of results) {
    const it = p.items[r.id] || { box: 0, seen: 0, right: 0 };
    it.seen++; it.last = today;
    if (r.ok) { ok++; it.right++; it.box = Math.min(it.box + 1, 5); } else it.box = 1;
    it.due = today + GAPS[it.box - 1];
    p.items[r.id] = it;
  }
  p.xp += ok * 10 + (results.length - ok) * 2;
  if (p.lastDay === today) { /* déjà compté aujourd'hui */ } else if (p.lastDay === today - 1) p.streak++; else p.streak = 1;
  p.lastDay = today;
  p.log.push({ day: today, ok, total: results.length });
  p.log = p.log.slice(-120);
  return p;
}

/** Maîtrise du niveau (0-100) et prêt pour le niveau suivant ? */
export function mastery(progress, bank) {
  const pool = bank.filter((q) => q.level === progress.level);
  if (!pool.length) return { pct: 0, ready: false, next: null };
  const known = pool.filter((q) => (progress.items[q.id]?.box || 0) >= 3).length;
  const recent = progress.log.slice(-5);
  const rt = recent.reduce((a, l) => a + l.total, 0), rk = recent.reduce((a, l) => a + l.ok, 0);
  const acc = rt ? rk / rt : 0;
  const pct = Math.round((known / pool.length) * 100);
  const i = PRACTICE_LEVELS.indexOf(progress.level);
  return { pct, acc: Math.round(acc * 100), ready: pct >= 60 && acc >= 0.8 && rt >= 20 && i < PRACTICE_LEVELS.length - 1, next: PRACTICE_LEVELS[i + 1] || null };
}

/** Statistiques par thème (pour montrer les points faibles). */
export function weakTopics(progress, bank) {
  const t = {};
  for (const q of bank) { const it = progress.items[q.id]; if (!it) continue; const x = (t[q.topic] ||= { seen: 0, right: 0 }); x.seen += it.seen; x.right += it.right; }
  return Object.entries(t).map(([topic, v]) => ({ topic, pct: Math.round((v.right / v.seen) * 100), seen: v.seen })).sort((a, b) => a.pct - b.pct);
}
