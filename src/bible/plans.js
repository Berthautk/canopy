// Plans de lecture sur 365 jours, générés à partir des 1189 chapitres.
import { get, set } from 'idb-keyval';
import { LIVRES, PAR_CODE, lireReference } from './references.js';
import { PLAN_THEMATIQUE } from '../donnees/contenu.js';
import { signal } from '../outils/signal.js';

export const JOURS = 365;
const chapitresDe = (livres) => livres.flatMap((l) => l.chapitres.map((_, i) => `${l.code}.${i + 1}`));
const AT = LIVRES.slice(0, 39), NT = LIVRES.slice(39);

// Répartit une liste de chapitres sur n jours, le plus régulièrement possible.
function repartir(liste, n) {
  const jours = [];
  for (let d = 0; d < n; d++) jours.push(liste.slice(Math.floor((d * liste.length) / n), Math.floor(((d + 1) * liste.length) / n)));
  return jours;
}

const BASES = {
  classique: () => repartir(chapitresDe(LIVRES), JOURS),
  parallele: () => { const a = repartir(chapitresDe(AT), JOURS), n = repartir(chapitresDe(NT), JOURS); return a.map((x, i) => [...x, ...n[i]]); },
  // Plan thématique de Yeshaya : un passage par jour (clé « T.<jour> »)
  thematique: () => (PLAN_THEMATIQUE?.jours || []).slice(0, JOURS).map((_, i) => [`T.${i}`]),
};
const cacheBase = {};
const base = (id) => (cacheBase[id] ??= BASES[id]());

// ===== État du plan (sur le téléphone) =====
const CLE = 'yeshaya:plan';
export const plan = signal(null);   // { id, debut: 'AAAA-MM-JJ', lus: ['GEN.1', …], rattrapage: { jour, chapitres } }
export async function chargerPlan() { try { plan.valeur = (await get(CLE)) || null; } catch {} }
async function enregistrer(p) { plan.valeur = p; try { await set(CLE, p); } catch {} }

const iso = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const commencerPlan = (id) => enregistrer({ id, debut: iso(new Date()), lus: [] });
export const arreterPlan = () => enregistrer(null);

export function jourActuel(p, auj = new Date()) {
  const [a, m, j] = p.debut.split('-').map(Number);
  const ecart = Math.round((Date.UTC(auj.getFullYear(), auj.getMonth(), auj.getDate()) - Date.UTC(a, m - 1, j)) / 864e5);
  return Math.min(JOURS, Math.max(1, ecart + 1));
}

// Programme jour par jour, en tenant compte d'un éventuel rattrapage.
export function programme(p) {
  const b = base(p.id);
  if (!p.rattrapage) return b;
  const { jour, chapitres } = p.rattrapage;
  return [...b.slice(0, jour - 1), ...repartir(chapitres, JOURS - jour + 1)];
}

export function bilan(p, auj = new Date()) {
  const prog = programme(p), j = jourActuel(p, auj), lus = new Set(p.lus);
  const total = prog.reduce((n, x) => n + x.length, 0);
  const retard = prog.slice(0, j - 1).flat().filter((k) => !lus.has(k));
  const restants = prog.flat().filter((k) => !lus.has(k));
  return { jour: j, total, lus: lus.size, pourcentage: Math.round((lus.size / total) * 100), retard, restants,
    joursRestants: JOURS - j + 1, aujourdhui: prog[j - 1] || [] };
}

// « Rattraper mon retard » : tous les chapitres non lus sont répartis sur les jours qui restent, à partir d'aujourd'hui.
export function rattraper(p) {
  const b = bilan(p);
  return enregistrer({ ...p, rattrapage: { jour: b.jour, chapitres: b.restants } });
}

export function basculerLu(p, chapitres, lu) {
  const s = new Set(p.lus); chapitres.forEach((k) => (lu ? s.add(k) : s.delete(k)));
  return enregistrer({ ...p, lus: [...s] });
}

// Regroupe des chapitres consécutifs du même livre : « Genèse 1-3 »
export function grouper(chapitres) {
  const g = [];
  for (const k of chapitres) {
    if (k.startsWith('T.')) {                      // jour du plan thématique : passage + thème
      const j = PLAN_THEMATIQUE.jours[+k.slice(2)], r = lireReference(j.reference);
      g.push({ code: r?.code, debut: r?.c, verset: r?.v, cles: [k], libelle: j.reference, theme: j.theme }); continue;
    }
    const [code, c] = k.split('.'); const dernier = g[g.length - 1];
    if (dernier && dernier.code === code && dernier.fin === +c - 1) { dernier.fin = +c; dernier.cles.push(k); }
    else g.push({ code, debut: +c, fin: +c, cles: [k] });
  }
  return g.map((x) => (x.theme ? x : { ...x, libelle: `${PAR_CODE[x.code].nom} ${x.debut}${x.fin > x.debut ? '-' + x.fin : ''}` }));
}

// Étapes de lecture d'aujourd'hui, chapitre par chapitre (pour lire le plan d'un trait, sans revenir en arrière).
// Chaque étape : { code, c, v, fin, cle, libelle }.
export function etapesDuJour(p) {
  const b = bilan(p), lus = new Set(p.lus), etapes = [];
  for (const k of b.aujourdhui) {
    if (k.startsWith('T.')) {
      const j = PLAN_THEMATIQUE.jours[+k.slice(2)], r = lireReference(j.reference);
      if (r) etapes.push({ code: r.code, c: r.c, v: r.v || null, fin: r.fin || null, cle: k, libelle: j.reference, theme: j.theme, lu: lus.has(k) });
    } else { const [code, c] = k.split('.'); etapes.push({ code, c: +c, v: null, cle: k, libelle: `${PAR_CODE[code].nom} ${c}`, lu: lus.has(k) }); }
  }
  return etapes;
}
// Clés du plan qui correspondent à un chapitre (pour le noter comme lu depuis la lecture).
export function clesDuChapitre(p, code, c) {
  if (!p) return [];
  const prog = programme(p).flat();
  if (p.id !== 'thematique') { const k = `${code}.${c}`; return prog.includes(k) ? [k] : []; }
  const aujourdhui = new Set(bilan(p).aujourdhui);
  const l = prog.filter((k) => { const r = lireReference(PLAN_THEMATIQUE.jours[+k.slice(2)]?.reference || ''); return r && r.code === code && r.c === c; });
  return l.filter((k) => aujourdhui.has(k)).length ? l.filter((k) => aujourdhui.has(k)) : l.slice(0, 1);
}
