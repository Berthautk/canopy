// Chercher et suggérer : « Pour quoi veux-tu prier ? » et « Pour aller plus loin » à la fin d'une prière.
// Tout se calcule sur le téléphone, dans les contenus de l'application.
import { PRIERES, COMBAT, ENSEIGNEMENTS, CYCLE_VEILLES } from './contenu.js';
import { semaineISO } from './nuit.js';

export const simple = (s) => String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9' ]+/g, ' ');
const mots = (q) => simple(q).split(/\s+/).filter((m) => m.length > 2 && !['pour', 'des', 'les', 'une', 'mon', 'ma', 'mes', 'dans', 'sur', 'avec', 'que', 'qui'].includes(m));
const score = (texte, ms, poids = 1) => { const t = simple(texte); return ms.reduce((s, m) => s + (t.includes(m) ? poids : 0), 0); };

// Les sujets de prière qui parlent de ce que la personne cherche : mêlés d'une semaine à l'autre.
export function chercherSujets(q, max = 12, semaine = semaineISO()) {
  const ms = mots(q); if (!ms.length) return [];
  const trouves = [];
  // 1. Un thème de la semaine (famille, santé…) : ses sujets, dans un ordre qui change chaque semaine.
  for (const j of CYCLE_VEILLES) {
    if (!ms.some((m) => (j.mots || []).some((x) => simple(x).includes(m) || m.includes(simple(x))))) continue;
    const tous = Object.entries(j.phases || {}).filter(([k]) => k !== 'adoration').flatMap(([k, l]) => l.map((s) => ({ ...s, source: j.priere })));
    const pas = 7;
    const ordre = tous.map((_, i) => tous[(semaine * 5 + i * pas) % tous.length]);
    trouves.push(...ordre.slice(0, Math.ceil(max / 2)));
  }
  // 2. Les thèmes de prière et fiches de combat dont le titre ou les sujets en parlent.
  const biblio = [
    ...PRIERES.flatMap((p) => (p.phases ? p.phases.flatMap((ph) => ph.sujets) : p.sujets || []).map((s) => ({ ...s, source: p.titre, base: p.titre }))),
    ...COMBAT.flatMap((c) => (c.sujets || []).map((s) => ({ ...s, source: c.titre, base: c.titre }))),
  ];
  const notes = biblio.map((s) => ({ s, n: score(s.base, ms, 3) + score((s.titre || '') + ' ' + s.texte, ms, 1) })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n);
  trouves.push(...notes.slice(0, max).map((x) => x.s));
  const vus = new Set();
  return trouves.filter((s) => { const k = s.texte; if (vus.has(k)) return false; vus.add(k); return true; }).slice(0, max);
}

// Enseignements et prières qui suivent la même direction (pour « aller plus loin »).
export function suggerer(q, { exclure = [], max = 2 } = {}) {
  const ms = mots(q); if (!ms.length) return { enseignements: [], prieres: [] };
  const ens = ENSEIGNEMENTS.filter((e) => !exclure.includes(e.id)).map((e) => ({ e, n: score(e.titre, ms, 3) + score((e.theme || '') + ' ' + (e.resume || ''), ms, 1) })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n).slice(0, max).map((x) => x.e);
  const pri = [...PRIERES.map((p) => ({ id: p.id, titre: p.titre, lien: '#/priere/theme/' + p.id, n: score(p.titre + ' ' + (p.resume || ''), ms, 2) })),
    ...COMBAT.map((c) => ({ id: c.id, titre: c.titre, lien: '#/priere/combat/' + c.id, n: score(c.titre + ' ' + (c.introduction || ''), ms, 2) }))]
    .filter((x) => x.n > 0 && !exclure.includes(x.id)).sort((a, b) => b.n - a.n).slice(0, max);
  return { enseignements: ens, prieres: pri };
}
