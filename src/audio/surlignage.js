// Texte coloré au rythme de la voix, partout où l'on écoute : le mot prononcé est surligné,
// les mots déjà lus changent de couleur. On utilise l'API « CSS Custom Highlight » :
// rien n'est modifié dans la page, on colore simplement une portion du texte du bloc en cours.
import { voix } from './voix.js';
import { reglages } from '../donnees/reglages.js';

const possible = typeof CSS !== 'undefined' && CSS.highlights && typeof Highlight !== 'undefined';
const compter = (t) => (t.match(/[^\s]+/g) || []).length;
const IGNORER = 'sup, button, svg, .v__marque, .verset__actions, [aria-hidden="true"]';

function motsDe(el) {
  const mots = [];
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement?.closest(IGNORER) && el.contains(n.parentElement.closest(IGNORER)) ? NodeFilter.FILTER_REJECT : NodeFilter.FILTER_ACCEPT),
  });
  let n;
  while ((n = w.nextNode())) {
    const re = /[^\s«»"“”—–]+/g; let m;
    while ((m = re.exec(n.data))) mots.push({ n, d: m.index, f: m.index + m[0].length });
  }
  return mots;
}

function effacer() { try { CSS.highlights.delete('voix-mot'); CSS.highlights.delete('voix-lu'); } catch {} }

function mettreAJour(v) {
  if (!possible) return;
  if (!v.id || !v.lecture || reglages.valeur.suivi === 'paragraphe' || !v.phrases?.length) { effacer(); return; }
  const el = document.querySelector('[data-voix-actif="oui"]');
  if (!el) { effacer(); return; }
  // Position (en mots) dans le texte dit pour ce bloc.
  let avant = 0, total = 0;
  v.phrases.forEach((p, i) => { const c = compter(p); total += c; if (i < v.iPhrase) avant += c; });
  const p = v.phrases[v.iPhrase] || '';
  if (v.mot) avant += compter(p.slice(0, v.mot.debut));
  const mots = motsDe(el);
  if (!mots.length || !total) { effacer(); return; }
  const k = Math.min(mots.length - 1, Math.round((avant * mots.length) / total));
  try {
    const r = new Range(); r.setStart(mots[k].n, mots[k].d); r.setEnd(mots[k].n, mots[k].f);
    CSS.highlights.set('voix-mot', new Highlight(r));
    if (k > 0) { const lu = new Range(); lu.setStart(mots[0].n, mots[0].d); lu.setEnd(mots[k - 1].n, mots[k - 1].f); CSS.highlights.set('voix-lu', new Highlight(lu)); }
    else CSS.highlights.delete('voix-lu');
  } catch { effacer(); }
}

let prevu = 0;
if (possible) voix.abonner((v) => { cancelAnimationFrame(prevu); prevu = requestAnimationFrame(() => mettreAJour(v)); });
