// Sépare source-data/test_XXX.json en public/data/public_XXX.json (énoncés seuls).
// Les corrigés (test_key) ne sont JAMAIS écrits dans public/ : ils sont importés
// dans l'espace de Valérie (Paramètres → Importer les corrigés) puis stockés dans Firestore (tests_key).
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { splitTest } from '../public/js/scoring.js';
const root = new URL('..', import.meta.url).pathname;
mkdirSync(root + 'public/data', { recursive: true });
for (const code of ['ADU', 'ENF', 'IEL']) {
  const full = JSON.parse(readFileSync(`${root}source-data/test_${code}.json`, 'utf8'));
  const { pub } = splitTest(full);
  writeFileSync(`${root}public/data/public_${code}.json`, JSON.stringify(pub));
  console.log(code, 'public OK');
}
