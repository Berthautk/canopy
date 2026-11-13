// Lecture et écriture des références bibliques en français.
import index from '../../public/bible/index.json';

export const LIVRES = index.livres;                       // [{n, code, nom, abr, chapitres:[nb versets…], fichier}]
export const PAR_CODE = Object.fromEntries(LIVRES.map((l) => [l.code, l]));

// Sans accents, minuscules, espaces simplifiés : « Ésaïe » -> « esaie »
export function simplifier(s) {
  return s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’']/g, "'").replace(/\s+/g, ' ').trim();
}

// Table « nom ou abréviation simplifié, sans espace » -> code
const NOMS = new Map();
for (const l of LIVRES) {
  const ajouter = (k) => { const c = simplifier(k).replace(/[\s.]/g, ''); if (c && !NOMS.has(c)) NOMS.set(c, l.code); };
  ajouter(l.nom); l.abr.forEach(ajouter);
  if (/^\d /.test(l.nom)) ajouter(l.nom.replace(/^(\d) /, '$1'));       // « 1corinthiens »
}
NOMS.set('ps', 'PSA'); NOMS.set('psaume', 'PSA'); NOMS.set('jn', 'JHN'); NOMS.set('es', 'ISA');   // usages les plus courants
NOMS.set('ec', 'ECC'); NOMS.set('ecclesiaste', 'ECC'); NOMS.set('cantique', 'SNG'); NOMS.set('ap', 'REV');
NOMS.set('premierjean', '1JN'); NOMS.set('ac', 'ACT'); NOMS.set('actes', 'ACT');

function trouverLivre(nom) {
  const k = simplifier(nom).replace(/[\s.]/g, '').replace(/^(i{1,3})(?=[a-z])/, (m) => String(m.length)).replace(/^(1er|1re|premiere?|premier)/, '1');
  if (NOMS.has(k)) return NOMS.get(k);
  // préfixe unique (« matth », « phili »…), au moins 3 lettres
  if (k.replace(/^\d/, '').length >= 3) {
    const cands = LIVRES.filter((l) => simplifier(l.nom).replace(/\s/g, '').startsWith(k)).map((l) => l.code);
    if (cands.length === 1) return cands[0];
  }
  return null;
}

// « Jn 3 16 », « jean 3:16 », « Rom 8 », « Ps 23 », « 1 Co 13 », « Jean 3:16-18 » -> {code, c, v, fin} ou null
export function lireReference(texte) {
  const m = simplifier(texte).match(/^((?:[1-3]|i{1,3})?\s?[a-z][a-z.' ]*?)\s*(\d{1,3})(?:\s*[:., ]\s*(\d{1,3})(?:\s*[-–]\s*(\d{1,3}))?)?\s*$/);
  if (!m) return null;
  const code = trouverLivre(m[1]); if (!code) return null;
  const livre = PAR_CODE[code];
  let c = +m[2], v = m[3] ? +m[3] : null, fin = m[4] ? +m[4] : null;
  if (livre.chapitres.length === 1 && !m[3] && c > 1) { v = c; c = 1; }      // « Jude 3 » = Jude 1:3
  if (c < 1 || c > livre.chapitres.length) return null;
  if (v && (v < 1 || v > livre.chapitres[c - 1])) return null;
  return { code, c, v, fin: fin && fin > v ? Math.min(fin, livre.chapitres[c - 1]) : null };
}

export function ecrireReference({ code, c, v, fin }) {
  const nom = code === 'PSA' ? 'Psaume' : PAR_CODE[code].nom;           // « Psaume 23 », mais le livre « Psaumes »
  return `${nom} ${c}${v ? ':' + v : ''}${fin ? '-' + fin : ''}`;
}

export const cleVerset = (code, c, v) => `${code}.${c}.${v}`;
export const lireCle = (k) => { const [code, c, v] = k.split('.'); return { code, c: +c, v: +v }; };
