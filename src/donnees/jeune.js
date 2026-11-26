// Jeûne et prière : le rythme grandit avec le temps (une fois par mois, puis deux, puis deux par semaine).
// Pas de série, pas de score : l'application propose le prochain jour, la personne décide.
import { signal } from '../outils/signal.js';

const CLE = 'yeshaya:jeune';
const lire = () => { try { return JSON.parse(localStorage.getItem(CLE)) || {}; } catch { return {}; } };
export const jeune = signal(lire());     // { debut:'AAAA-MM-JJ', jeunes:['AAAA-MM-JJ'], conges:{du,au} }
export function modifierJeune(patch) {
  const n = { ...jeune.valeur, ...patch };
  jeune.valeur = n;
  try { localStorage.setItem(CLE, JSON.stringify(n)); } catch { /* stockage plein ou bloqué */ }
}

export const jourTexte = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const dateDe = (t) => { const [a, m, j] = t.split('-').map(Number); return new Date(a, m - 1, j); };
const joursEntre = (a, b) => Math.round((dateDe(b) - dateDe(a)) / 864e5);
const ajouter = (t, n) => { const d = dateDe(t); d.setDate(d.getDate() + n); return jourTexte(d); };

// Nombre de mois depuis le début du parcours.
export const moisDepuis = (debut, auj) => { const a = dateDe(debut), b = dateDe(auj); return Math.max(0, (b.getFullYear() - a.getFullYear()) * 12 + b.getMonth() - a.getMonth() - (b.getDate() < a.getDate() ? 1 : 0)); };

// Le palier atteint : le dernier dont le nombre de mois est dépassé.
export const palierDe = (paliers, debut, auj) => { const m = moisDepuis(debut, auj); return [...paliers].reverse().find((p) => m >= p.mois) || paliers[0]; };

// Écart voulu entre deux jours de jeûne, selon la fréquence.
const ECART = { mois: 28, quinzaine: 14, semaine: 3 };

// Prochain jour proposé : un samedi (ou, au rythme de deux par semaine, mercredi ou samedi),
// au plus tôt après l'écart voulu depuis le dernier jeûne. Un jour de congé est préféré s'il tombe avant.
export function prochainJeune(etat, paliers, auj) {
  if (!etat.debut) return null;
  const p = palierDe(paliers, etat.debut, auj);
  const dernier = [...(etat.jeunes || [])].sort().pop();
  let t = dernier ? ajouter(dernier, ECART[p.frequence]) : auj;
  if (t < auj) t = auj;
  const bons = p.frequence === 'semaine' ? [3, 6] : [6];
  for (let i = 0; i < 14; i++, t = ajouter(t, 1)) if (bons.includes(dateDe(t).getDay())) break;
  return { date: t, palier: p, aujourdhui: t === auj };
}

// La semaine de jeûne proposée pendant les congés (au moins 3 jours de congé).
export const semaineDeConges = (conges, auj) => conges?.du && conges?.au && conges.au >= auj && joursEntre(conges.du, conges.au) >= 2 ? conges : null;

export function noterJeune(jour = jourTexte(new Date())) {
  const l = new Set(jeune.valeur.jeunes || []); l.add(jour);
  modifierJeune({ jeunes: [...l].sort().slice(-200) });
}
export const commencerJeune = () => modifierJeune({ debut: jourTexte(new Date()) });
