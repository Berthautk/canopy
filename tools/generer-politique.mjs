// Génère public/confidentialite.html (page publique, lisible sans l'application) à partir de content/politique-confidentialite.json.
import { readFileSync, writeFileSync } from 'node:fs';
const P = JSON.parse(readFileSync(new URL('../content/politique-confidentialite.json', import.meta.url), 'utf8'));
const e = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const r = (s) => e(s.replaceAll('{contact}', P.contact));
const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Politique de confidentialité · Yeshaya</title><meta name="description" content="Politique de confidentialité de l'application chrétienne Yeshaya.">
<style>body{font-family:system-ui,sans-serif;max-width:720px;margin:0 auto;padding:16px;line-height:1.6;color:#1d2433;background:#fbf7f0}h1{color:#172B49}h2{color:#172B49;font-size:1.1rem;margin-top:1.6em}.resume{background:#fff;border-radius:12px;padding:12px 16px;border:1px solid #e6dccb}</style></head>
<body><h1>Politique de confidentialité · Yeshaya</h1><p><em>Version ${P.version} · ${e(P.date)}</em></p>
<div class="resume"><ul>${P.resume.map((x) => `<li>${r(x)}</li>`).join('')}</ul></div>
${P.sections.map(([t, ps]) => `<h2>${e(t)}</h2>${ps.map((p) => `<p>${r(p)}</p>`).join('')}`).join('\n')}
</body></html>`;
writeFileSync(new URL('../public/confidentialite.html', import.meta.url), html);
console.log('public/confidentialite.html générée');
