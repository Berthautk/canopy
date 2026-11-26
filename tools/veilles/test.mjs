import { jourDuCycle, veilleDuJour, nombreDeSujets, semaineEnCours, clePhase } from '../../src/donnees/veilles.js';
import { readFileSync } from 'node:fs';
const RACINE = new URL('../../', import.meta.url).pathname;
const lire = (f) => JSON.parse(readFileSync(RACINE + 'content/veilles/' + f, 'utf8'));
const cycle = lire('cycle.json').jours, ado = lire('adoration.json');
let ko = 0; const ok = (c, m) => { if (!c) { ko++; console.log('  ÉCHEC :', m); } else console.log('  ok :', m); };
// 1. numéro du jour
ok(jourDuCycle(new Date('2026-11-23T10:00:00')) === 1, 'lundi = jour 1');
ok(jourDuCycle(new Date('2026-11-25T10:00:00')) === 3, 'mercredi = jour 3');
ok(jourDuCycle(new Date('2026-11-29T10:00:00')) === 7, 'dimanche = jour 7 (et pas 0)');
// 2. le contenu du cycle : 7 jours × 8 phases × 3 sujets
const CLES = ['adoration', 'regne', 'volonte', 'pain', 'pardon', 'tentation', 'delivre', 'grace'];
ok(cycle.length === 7, '7 jours');
ok(cycle.every((j) => CLES.every((k) => j.phases[k]?.length === 3)), 'chaque jour a les 8 phases du Notre Père, 3 sujets chacune (168 sujets)');
ok(new Set(cycle.map((j) => j.theme)).size === 7, '7 thèmes différents');
ok(/assembl/i.test(cycle[2].accroche) && /corps de Christ/i.test(cycle[2].accroche), "mercredi : l'Église = l'assemblée locale ET le corps de Christ");
// 3. le thème traverse CHAQUE phase (c'était la demande : « que ton règne vienne dans ma famille… »)
for (const k of ['aube', 'midi', 'soir']) {
  const v = lire(k + '.json'), d = new Date('2026-11-23T08:00:00');
  const n = veilleDuJour(v, cycle, d, 'normal', ado);
  const regne = n.phases.find((p) => clePhase(p.titre) === 'regne');
  ok(regne.sujets[0].titre === 'Ton règne dans ma maison', `${k} · lundi : « Que Ton règne vienne » commence par « Ton règne dans ma maison »`);
  const avecTheme = n.phases.filter((p) => p.theme).length;
  ok(avecTheme === 8, `${k} : les 8 phases du Notre Père portent le thème du jour (${avecTheme})`);
  ok(!n.phases.some((p) => /Prière du jour/.test(p.titre)), `${k} : plus de phase « Prière du jour » à part : le thème est DANS chaque phase`);
  const c = nombreDeSujets(veilleDuJour(v, cycle, d, 'complet', ado)), no = nombreDeSujets(n), co = nombreDeSujets(veilleDuJour(v, cycle, d, 'court', ado));
  ok(co < no && no < c, `${k} : court ${co} < normal ${no} < complet ${c}`);
  const adoPhase = n.phases.find((p) => clePhase(p.titre) === 'adoration');
  ok(/Le psaume du jour/.test(adoPhase.sujets[0].titre), `${k} : l'Adoration commence par le psaume du jour (dans la phase, pas en panneau)`);
  const courtAdo = veilleDuJour(v, cycle, d, 'court', ado).phases.find((p) => clePhase(p.titre) === 'adoration');
  ok(courtAdo.sujets.length === 1 && /psaume/i.test(courtAdo.sujets[0].titre), `${k} : en version courte, l'adoration = le psaume`);
}
// 4. changement de thème d'un jour à l'autre, dans la même phase
const aube = lire('aube.json');
const titresRegne = [1, 2, 3, 4, 5, 6, 7].map((i) => veilleDuJour(aube, cycle, new Date(2026, 10, 22 + i), 'normal', ado).phases.find((p) => clePhase(p.titre) === 'regne').sujets[0].titre);
ok(new Set(titresRegne).size === 7, 'la phase « Règne » change chaque jour : ' + titresRegne.join(' | '));
const versets = new Set([1, 2, 3, 4, 5, 6, 7].map((i) => veilleDuJour(aube, cycle, new Date(2026, 10, 22 + i), 'complet', ado).verset)); ok(versets.size === 7, '7 versets différents à l\'aube');
// 5. la semaine
const s = semaineEnCours({ 'veille-aube': ['2026-11-23T05:00:00.000Z', '2026-11-25T05:00:00.000Z'] }, new Date('2026-11-26T12:00:00'));
ok(s[0].prie && !s[1].prie && s[2].prie, 'lundi et mercredi marqués priés, mardi non');
// 6. sans cycle, rien ne casse
const sans = veilleDuJour(aube, [], new Date(), 'normal'); ok(sans.phases.length === 9, "sans cycle : les 9 phases d'origine");
console.log(ko ? '\n>>> ' + ko + ' ÉCHEC(S)' : '\n>>> tout passe'); process.exit(ko ? 1 : 0);
