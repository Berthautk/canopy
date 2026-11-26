import { veilleDuJour } from '../../src/donnees/veilles.js';
import { readFileSync } from 'node:fs';
const lire = (f) => JSON.parse(readFileSync(new URL('../../' + f, import.meta.url)));
const cycle = lire('content/veilles/cycle.json').jours, adoration = lire('content/veilles/adoration.json');
let ko = 0; const ok = (c, m) => { console.log((c ? '  ok : ' : '  KO : ') + m); if (!c) ko++; };
for (const id of ['aube', 'midi', 'soir']) {
  const v0 = lire(`content/veilles/${id}.json`);
  // Tous les lundis de 52 semaines : la veille d'un lundi ne doit jamais ressembler à celle de la semaine d'avant.
  const sig = [], ordres = new Set(); let identiques = 0, memeOrdre = 0, theme = 0;
  for (let s = 0; s < 52; s++) {
    const d = new Date(2026, 0, 5 + 7 * s, 10);                    // un lundi
    const v = veilleDuJour(v0, cycle, d, 'normal', adoration);
    const ph = v.phases.map((p) => p.sujets.map((x) => x.titre).join('|'));
    sig.push(ph.join('//'));
    if (s > 0 && sig[s] === sig[s - 1]) identiques++;
    // le thème du jour reste présent en tête de chaque phase (sauf l'adoration, qui commence par le psaume)
    if (v.phases.every((p) => p.sujets.length === 3 || p.sujets.length === 4)) theme++;
    for (let i = 1; i < v.phases.length; i++) ordres.add(v.phases[i].sujets.map((x) => x.titre).join('|'));
  }
  ok(identiques === 0, `${id} : deux lundis qui se suivent ne sont jamais identiques`);
  ok(new Set(sig).size === 52, `${id} : 52 lundis, 52 veilles différentes (${new Set(sig).size})`);
  ok(theme === 52, `${id} : trois sujets par phase en version normale`);
  // une même phase ne revient pas avec les mêmes sujets dans le même ordre avant longtemps
  const p4 = []; for (let s = 0; s < 40; s++) p4.push(veilleDuJour(v0, cycle, new Date(2026, 0, 5 + 7 * s, 10), 'normal', adoration).phases[4].sujets.map((x) => x.titre).join('|'));
  let revient = Infinity; for (let i = 0; i < p4.length; i++) for (let j = i + 1; j < p4.length; j++) if (p4[i] === p4[j]) revient = Math.min(revient, j - i);
  ok(revient > 12, `${id} : une même phase ne revient identique qu'après plus de 12 semaines (${revient === Infinity ? 'jamais en 40' : revient})`);
}
const lun = new Date(2026, 10, 23, 10), lun2 = new Date(2026, 10, 30, 10);
const a = veilleDuJour(lire('content/veilles/aube.json'), cycle, lun, 'complet', adoration), b = veilleDuJour(lire('content/veilles/aube.json'), cycle, lun2, 'complet', adoration);
ok(a.phases[2].sujets.length === b.phases[2].sujets.length && a.phases[2].sujets.map((x) => x.titre).join() !== b.phases[2].sujets.map((x) => x.titre).join(), 'version complète : mêmes sujets mais ordre différent d\'une semaine à l\'autre');
ok(a.phases[1].sujets[0].titre.startsWith('Le psaume du jour') && a.phases[1].sujets[0].titre !== b.phases[1].sujets[0].titre, 'le psaume du jour change aussi d\'une semaine à l\'autre');
console.log(ko ? '>>> ÉCHEC' : '>>> tout passe'); process.exit(ko ? 1 : 0);
