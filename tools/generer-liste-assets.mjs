// Liste des illustrations (public/assets) pour le bouton « Tout rendre disponible sans internet ».
import { readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
const racine = 'public/assets', liste = [];
(function p(d) { for (const f of readdirSync(d)) { const x = join(d, f); if (statSync(x).isDirectory()) p(x); else if (/\.(webp|svg|png|jpg)$/i.test(f)) liste.push('/' + x.replace(/^public\//, '').split('\\').join('/')); } })(racine);
writeFileSync('public/liste-assets.json', JSON.stringify(liste));
console.log(liste.length + ' illustrations listées');
