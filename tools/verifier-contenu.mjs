// Vérifie toutes les références bibliques du dossier content/ : elles doivent exister dans la Bible LSG 1910.
// Usage : node tools/verifier-contenu.mjs        (affiche chaque référence avec le début du texte)
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const RACINE = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const index = JSON.parse(fs.readFileSync(path.join(RACINE, 'public/bible/index.json')));
// Charge le lecteur de références de l'application en remplaçant l'import JSON (non pris en charge par Node sans attribut).
const src = fs.readFileSync(path.join(RACINE, 'src/bible/references.js'), 'utf8').replace(/^import index from .*$/m, `const index = ${JSON.stringify(index)};`);
const { lireReference, ecrireReference, PAR_CODE } = await import('data:text/javascript,' + encodeURIComponent(src));

const fichiers = [];
(function parcourir(d) { for (const f of fs.readdirSync(d)) { const p = path.join(d, f); if (fs.statSync(p).isDirectory()) { if (f !== '_modeles') parcourir(p); } else if (f.endsWith('.json')) fichiers.push(p); } })(path.join(RACINE, 'content'));

let erreurs = 0, total = 0, totalTexte = 0; const erreursTexte = [];
const texte = (r) => { const l = JSON.parse(fs.readFileSync(path.join(RACINE, 'public/bible', PAR_CODE[r.code].fichier))); const ch = l.chapitres[r.c - 1]; return ch.slice((r.v || 1) - 1, r.fin || r.v || ch.length).join(' ').replace(/\n/g, ' '); };
for (const f of fichiers) {
  let j; try { j = JSON.parse(fs.readFileSync(f, 'utf8')); } catch (e) { console.log(`\n✗ ${path.relative(RACINE, f)} : JSON invalide (${e.message})`); erreurs++; continue; }
  const refs = [...(j.versets || []), ...(j.etapes || []).map((e) => e.reference), j.reference, j.verset_a_partager, ...(j.questions || []).map((q) => q.reference), ...(j.personnages || []).flatMap((x) => x.indices.map((i) => i.reference)), ...(j.histoires || []).flatMap((h) => h.etapes.map((e) => e.reference))].filter(Boolean);
  // références écrites dans les textes, ex. « (Proverbes 31:30) » ou « Jos 24:15 »
  const RE = /((?:[1-3]\s?)?[A-ZÉÈ][a-zéèëêïîôûüç]+\.?)\s(\d{1,3}):(\d{1,3})(?:\s?[-–]\s?(\d{1,3}))?/g;
  const dansTexte = [...JSON.stringify(j).matchAll(RE)].map((m) => m[0]).filter((x) => !refs.includes(x));
  for (const x of dansTexte) {
    if (!/^((?:[1-3]\s?)?\p{Lu}\p{Ll}+)/u.test(x)) continue;
    totalTexte++; const r = lireReference(x);
    if (!r && lireReference(x.replace(/\s\d.*$/, '') + ' 1')) { erreursTexte.push(`${path.relative(RACINE, f)} : « ${x} » n'existe pas`); }
  }
  if (!refs.length) continue;
  console.log(`\n## ${path.relative(RACINE, f)}`);
  for (const s of refs) {
    total++; const r = lireReference(s);
    if (!r) { console.log(`  ✗ « ${s} » : référence introuvable`); erreurs++; continue; }
    console.log(`  ${ecrireReference(r).padEnd(24)} ${texte(r).slice(0, 90)}`);
  }
}
erreursTexte.forEach((e) => console.log('  ✗ ' + e));
erreurs += erreursTexte.length;
console.log(`\n${total} références (champs) + ${totalTexte} références dans les textes vérifiées, ${erreurs} erreur(s).`);
process.exit(erreurs ? 1 : 0);
