// « Prier ensemble » : combien de personnes ont prié chaque veille aujourd'hui (totaux anonymes, venus du serveur).
// En cas de hors ligne ou d'erreur : on n'affiche rien, sans bruit.
import { signal } from '../outils/signal.js';

export const priantsDuJour = signal(null);   // { aube, midi, soir, jour } ou null
let derniere = 0;
export async function chargerPriants() {
  if (Date.now() - derniere < 5 * 60 * 1000 || (typeof navigator !== 'undefined' && !navigator.onLine)) return;
  derniere = Date.now();
  try {
    const r = await fetch('/api/veilles', { signal: AbortSignal.timeout?.(8000) });
    const d = await r.json(); if (d.ok) priantsDuJour.valeur = d;
  } catch { derniere = 0; /* on réessaiera à la prochaine ouverture */ }
}
// La phrase à afficher pour une veille.
export function phrasePriants(d, cle) {
  if (!d) return null;
  const n = d[cle] || 0;
  return n === 0 ? "Personne n'a encore prié cette veille aujourd'hui. Sois le premier : d'autres te suivront."
    : n === 1 ? "1 personne a prié cette veille aujourd'hui. Tu n'es pas seul."
    : `${n} personnes ont prié cette veille aujourd'hui. Tu n'es pas seul.`;
}
