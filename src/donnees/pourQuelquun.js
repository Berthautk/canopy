// « Jeûner et prier pour quelqu'un » : réglages (prénom, homme/femme, situation) et progression. Tout reste sur le téléphone.
import { get, set } from 'idb-keyval';
import { signal } from '../outils/signal.js';

const CLE = 'yeshaya:pour-quelqu-un';
export const pq = signal(null);   // { nom, sexe: 'h'|'f', situation: 'maladie'|'epreuve', detail, conjoint, etape, faits: { etape: [n] }, dates: { 'etape-n': 'AAAA-MM-JJ' }, cycles: { etape: n } }
export async function chargerPourQuelquun() { try { pq.valeur = (await get(CLE)) || null; } catch {} }
const sauver = (v) => { pq.valeur = v; return set(CLE, v).catch(() => {}); };
export const configurer = (c) => sauver({ faits: {}, dates: {}, cycles: {}, etape: 'jeune-21', ...(pq.valeur || {}), ...c });
export const effacerPourQuelquun = () => sauver(null);

export const aujourdhui = (d = new Date()) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
export const faitsDe = (etape, v = pq.valeur) => v?.faits?.[etape] || [];
export function jourCourantPQ(etape, duree, v = pq.valeur) { const f = faitsDe(etape, v); for (let j = 1; j <= duree; j++) if (!f.includes(j)) return j; return duree; }
// « ouvert », « demain » (le jour précédent a été prié aujourd'hui : il s'ouvre après minuit) ou « ferme ».
export function etatJourPQ(etape, n, v = pq.valeur) {
  const f = faitsDe(etape, v);
  if (f.includes(n) || n === 1) return 'ouvert';
  if (!f.includes(n - 1)) return 'ferme';
  return (v.dates?.[`${etape}-${n - 1}`] || '') >= aujourdhui() ? 'demain' : 'ouvert';
}
export function terminerJourPQ(etape, n, duree, perpetuel) {
  const v = pq.valeur; let faits = [...new Set([...faitsDe(etape, v), n])];
  const dates = { ...v.dates, [`${etape}-${n}`]: aujourdhui() };
  const cycles = { ...v.cycles };
  // La Veille recommence : le jour 31 terminé, on repart au jour 1 (le jour 1 s'ouvre après minuit).
  if (perpetuel && n === duree) { cycles[etape] = (cycles[etape] || 1) + 1; faits = []; dates[`${etape}-0`] = aujourdhui(); }
  return sauver({ ...v, faits: { ...v.faits, [etape]: faits }, dates, cycles });
}
export const debutCycleBloque = (etape, v = pq.valeur) => (v?.dates?.[`${etape}-0`] || '') >= aujourdhui() && !faitsDe(etape, v).length;

// Adapte un texte : prénom, accords (homme/femme), conjoint, et situation (maladie ou autre épreuve).
const MOTS_EPREUVE = [
  [/\bde maladie\b/g, "d'épreuve"], [/\bla maladie\b/g, "l'épreuve"], [/\bLa maladie\b/g, "L'épreuve"], [/\bune maladie\b/g, 'une épreuve'], [/\bmaladies\b/g, 'épreuves'], [/\bmaladie\b/g, 'épreuve'],
  [/\bla guérison\b/g, 'la délivrance'], [/\bLa guérison\b/g, 'La délivrance'], [/\bsa guérison\b/g, 'sa délivrance'], [/\bguérison\b/g, 'délivrance'],
  [/\bguéri\{e\}/g, 'délivré{e}'], [/\bguérie\b/g, 'délivrée'], [/\bguéri\b/g, 'délivré'], [/\bguérir\b/g, 'délivrer'], [/\bguérisse\b/g, 'délivre'],
  [/\ble malade\b/g, 'celui qui souffre'], [/\bdans le corps de\b/g, 'dans la vie de'], [/\ble corps de\b/g, 'la vie de'], [/\bdans son corps\b(?! mortel)/g, 'dans sa vie'], [/\bson corps\b(?! mortel)/g, 'sa vie'], [/\bguérit\b/g, 'délivre'],
];
export function adapter(t, c, citation = false) {
  if (!t || !c) return t;
  let s = t;
  if (c.situation === 'epreuve' && !citation) for (const [re, r] of MOTS_EPREUVE) s = s.replace(re, r);
  const f = c.sexe === 'f';
  const conj = c.conjoint?.trim() || (f ? 'son époux' : 'son épouse');
  const nom = c.nom?.trim() || 'notre bien-aimé';
  // Élision devant un prénom qui commence par une voyelle : « d'Esther », « qu'Esther ».
  if (/^[aeiouyéèêâîôûh]/i.test(nom)) s = s.replace(/\b([dD]e|[qQ]ue|[jJ]usque) \{nom\}/g, (m, mot) => mot.slice(0, -1) + "'{nom}");
  return s.replaceAll('{nom}', nom).replaceAll('{conjoint}', conj)
    .replaceAll('{il}', f ? 'elle' : 'il').replaceAll('{le}', f ? 'la' : 'le').replaceAll('{lui}', f ? 'elle' : 'lui').replaceAll('{e}', f ? 'e' : '')
    .replaceAll('{celui}', f ? 'celle' : 'celui').replaceAll('{un_intercesseur}', f ? 'une intercesseuse' : 'un intercesseur').replaceAll('{un_ambassadeur}', f ? 'une ambassadrice' : 'un ambassadeur')
    .replaceAll('{seul}', f ? 'seule' : 'seul');
}
