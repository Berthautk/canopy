// Progression du parcours ORIZON (90 jours) : jours vécus, réponses au journal de bord. Tout reste sur le téléphone.
import { get, set } from 'idb-keyval';
import { signal } from '../outils/signal.js';

const CLE = 'yeshaya:orizon';
export const orizon = signal({ debut: null, faits: [], journal: {}, chutes: [] });
export async function chargerProgressionOrizon() {
  try { orizon.valeur = { debut: null, faits: [], journal: {}, chutes: [], ...((await get(CLE)) || {}) }; } catch {}
}
const sauver = (v) => { orizon.valeur = v; return set(CLE, v).catch(() => {}); };
export const commencerOrizon = () => sauver({ ...orizon.valeur, debut: orizon.valeur.debut || new Date().toISOString() });
export const terminerJourOrizon = (j) => sauver({ ...orizon.valeur, faits: [...new Set([...orizon.valeur.faits, j])].sort((a, b) => a - b) });
export const noterJournal = (j, i, texte) => {
  const jr = { ...(orizon.valeur.journal[j] || {}), [i]: texte.slice(0, 4000) };
  return sauver({ ...orizon.valeur, journal: { ...orizon.valeur.journal, [j]: jr } });
};
// Une chute ne remet pas à zéro : on la note, et on continue au jour suivant (règle du manuel).
export const noterChute = () => sauver({ ...orizon.valeur, chutes: [...orizon.valeur.chutes, new Date().toISOString()] });
export const jourCourant = () => { const f = orizon.valeur.faits; for (let j = 1; j <= 90; j++) if (!f.includes(j)) return j; return 90; };

// Jours sans enseignement dans les phases 2 et 3 : pratique libre ou sabbat (le jour 31 est un lundi).
export function typeJour(j, redige) {
  if (redige) return 'structure';
  if (j <= 30) return 'structure';
  return (j - 31) % 7 === 6 ? 'sabbat' : 'pratique';
}
export const phaseDe = (j) => (j <= 30 ? 1 : j <= 60 ? 2 : 3);
