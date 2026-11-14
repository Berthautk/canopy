import { lireReference } from '../bible/references.js';

// Affiche un texte en rendant cliquables les références bibliques qu'il contient (« (Proverbes 31:30) »).
const RE = /((?:[1-3]\s?)?[A-ZÉÈ][a-zéèëêïîôûüç]+\.?\s\d{1,3}:\d{1,3}(?:\s?[-–]\s?\d{1,3})?)/g;
export function TexteRefs({ texte }) {
  if (!texte) return null;
  const morceaux = texte.split(RE);
  return morceaux.map((m, i) => {
    if (i % 2 === 0) return m;
    const r = lireReference(m);
    return r ? <a class="ref-inline" href={`#/bible/lire/${r.code}/${r.c}/${r.v}`}>{m}</a> : m;
  });
}
