// Durée d'écoute estimée (voix de synthèse ~150 mots/min), versets comptés avec leur vrai texte LSG.
import { readFileSync, readdirSync } from 'node:fs';
// Même astuce que verifier-contenu.mjs : on remplace l'import JSON du lecteur de références.
const index = JSON.parse(readFileSync('public/bible/index.json', 'utf8'));
const src = readFileSync('src/bible/references.js', 'utf8').replace(/^import index from .*$/m, `const index = ${JSON.stringify(index)};`);
const { lireReference } = await import('data:text/javascript,' + encodeURIComponent(src));
const livres = Object.fromEntries(readdirSync('public/bible').filter((f) => /^\d+-[A-Z0-9]+\.json$/.test(f)).map((f) => [f.split('-')[1].replace('.json', ''), f]));
const cache = {};
const mots = (t) => (t || '').split(/\s+/).filter(Boolean).length;
function motsRef(ref) {
  const r = lireReference(ref); if (!r || !livres[r.code]) return 30;
  const b = cache[r.code] ||= JSON.parse(readFileSync('public/bible/' + livres[r.code], 'utf8'));
  const ch = b.chapitres[r.c - 1] || []; const de = r.v || 1, a = r.fin || r.v || ch.length;
  return ch.slice(de - 1, a).reduce((s, v) => s + mots(v), 0);
}
for (const f of process.argv.slice(2)) {
  const d = JSON.parse(readFileSync(f, 'utf8')); let n = mots(d.introduction) + mots(d.resume), v = 0;
  for (const s of d.sections) { n += mots(s.titre); for (const b of s.blocs) b.verset ? (v += motsRef(b.verset)) : (n += mots(b.texte || b.sous_titre)); }
  console.log(`${f.split('/').pop()} : ${n} mots de texte + ${v} mots de versets ≈ ${Math.round((n + v) / 150)} min`);
}
