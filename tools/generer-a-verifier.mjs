// Génère A_VERIFIER.md : toutes les questions de jeu à relire, avec le texte LSG de chaque référence.
// Usage : node tools/generer-a-verifier.mjs
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const index = JSON.parse(fs.readFileSync(path.join(R, 'public/bible/index.json')));
const src = fs.readFileSync(path.join(R, 'src/bible/references.js'), 'utf8').replace(/^import index from .*$/m, `const index = ${JSON.stringify(index)};`);
const { lireReference, ecrireReference, PAR_CODE } = await import('data:text/javascript,' + encodeURIComponent(src));
const texte = (ref) => { const r = lireReference(ref); if (!r) return '⚠ RÉFÉRENCE INTROUVABLE'; const l = JSON.parse(fs.readFileSync(path.join(R, 'public/bible', PAR_CODE[r.code].fichier)));
  const ch = l.chapitres[r.c - 1]; return `${ecrireReference(r)} : « ${ch.slice((r.v || 1) - 1, r.fin || r.v).join(' ').replace(/\n/g, ' ').replace(/ /g, ' ')} »`; };
const lettres = ['A', 'B', 'C', 'D']; const L = [];
L.push('# Questions de jeu à vérifier', '', 'Généré par `node tools/generer-a-verifier.mjs`. Relisez chaque question, cochez la case, puis passez `"verifie": false` à `true` dans le fichier indiqué.', '',
  'Le texte biblique affiché ci-dessous est lu automatiquement dans la Bible LSG 1910 de l\'application.', '');
let n = 0, ok = 0;
for (const f of fs.readdirSync(path.join(R, 'content/quiz')).sort()) {
  const q = JSON.parse(fs.readFileSync(path.join(R, 'content/quiz', f)));
  L.push(`## Quiz : ${q.theme} (\`content/quiz/${f}\`)`, '');
  for (const x of q.questions) {
    n++; if (x.verifie) ok++;
    L.push(`- [${x.verifie ? 'x' : ' '}] **${x.id}** (${x.niveau}) : ${x.question}`,
      `  - Choix : ${x.choix.map((c, i) => `${lettres[i]}. ${c}${i === x.reponse ? ' ✅' : ''}`).join(' · ')}`,
      `  - Explication : ${x.explication}`, `  - ${texte(x.reference)}`, '');
  }
}
const qsj = JSON.parse(fs.readFileSync(path.join(R, 'content/jeux/qui-suis-je.json')));
L.push('## Qui suis-je ? (`content/jeux/qui-suis-je.json`)', '');
for (const p of qsj.personnages) { n++; if (p.verifie) ok++;
  L.push(`- [${p.verifie ? 'x' : ' '}] **${p.nom}** (choix : ${p.choix.join(', ')})`, ...p.indices.map((i, k) => `  - Indice ${k + 1} : ${i.texte}\n    - ${texte(i.reference)}`), ''); }
const ord = JSON.parse(fs.readFileSync(path.join(R, 'content/jeux/remets-dans-l-ordre.json')));
L.push('## Remets dans l\'ordre (`content/jeux/remets-dans-l-ordre.json`)', '');
for (const h of ord.histoires) { n++; if (h.verifie) ok++;
  L.push(`- [${h.verifie ? 'x' : ' '}] **${h.titre}** (ordre attendu)`, ...h.etapes.map((e, k) => `  ${k + 1}. ${e.texte}\n     - ${texte(e.reference)}`), ''); }
L.splice(6, 0, `**État : ${ok} élément(s) vérifié(s) sur ${n}.** (40 questions de quiz, ${qsj.personnages.length} personnages, ${ord.histoires.length} histoires)`, '');
L.push('## Textes rédigés à relire (`"relu": false`)', '', 'Ces textes sont originaux (plans inspirés de ubdavid.org, sans reprise de leurs textes). Relisez-les, puis passez `"relu"` à `true`.', '');
for (const d of ['decouvrir-jesus', 'nouveau-converti']) {
  for (const f of fs.readdirSync(path.join(R, 'content', d)).sort()) {
    const x = JSON.parse(fs.readFileSync(path.join(R, 'content', d, f)));
    L.push(`- [${x.relu ? 'x' : ' '}] \`content/${d}/${f}\` : ${x.titre}`);
  }
}
L.push('');
L.push('## « Complète le verset »', '', 'Rien à vérifier à la main : les versets sont tirés automatiquement de la Bible LSG 1910 (liste des versets du jour et des sujets), et les mots à trouver sont choisis par l\'application.');
fs.writeFileSync(path.join(R, 'A_VERIFIER.md'), L.join('\n') + '\n');
console.log(`A_VERIFIER.md : ${n} éléments, ${ok} vérifiés.`);
