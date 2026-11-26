import { jourDuCycle, veilleDuJour, nombreDeSujets, semaineEnCours } from '../../src/donnees/veilles.js';
import { readFileSync } from 'node:fs';
const RACINE = new URL('../../', import.meta.url).pathname;
const cycle = JSON.parse(readFileSync(RACINE + 'content/veilles/cycle.json','utf8')).jours;
let ko=0; const ok=(c,m)=>{ if(!c){ko++;console.log('  ÉCHEC :',m);} else console.log('  ok :',m); };
// 1. numéro du jour
ok(jourDuCycle(new Date('2026-11-23T10:00:00'))===1,'lundi = jour 1');
ok(jourDuCycle(new Date('2026-11-25T10:00:00'))===3,'mercredi = jour 3');
ok(jourDuCycle(new Date('2026-11-29T10:00:00'))===7,'dimanche = jour 7 (et pas 0)');
// 2. les 3 veilles, 7 jours, 3 tailles
for (const k of ['aube','midi','soir']) {
  const v = JSON.parse(readFileSync(RACINE + `content/veilles/${k}.json`,'utf8'));
  const c = nombreDeSujets(veilleDuJour(v,cycle,new Date('2026-11-23'),'complet'));
  const n = nombreDeSujets(veilleDuJour(v,cycle,new Date('2026-11-23'),'normal'));
  const t = nombreDeSujets(veilleDuJour(v,cycle,new Date('2026-11-23'),'court'));
  ok(t<n&&n<c, `${k} : court ${t} < normal ${n} < complet ${c}`);
  const j = veilleDuJour(v,cycle,new Date('2026-11-23'),'complet');
  ok(j.phases.some(p=>p.num==='jour'&&p.titre.includes('famille')),`${k} : la phase du thème « famille » est insérée lundi`);
  const idxAdo=j.phases.findIndex(p=>/adoration/i.test(p.titre)), idxJour=j.phases.findIndex(p=>p.num==='jour');
  ok(idxJour===idxAdo+1,`${k} : elle vient juste après l'Adoration`);
}
// 3. chaque jour a bien un thème différent et un verset différent par veille
const themes=new Set(cycle.map(d=>d.theme)); ok(themes.size===7,'7 thèmes différents');
const aube=JSON.parse(readFileSync(RACINE + 'content/veilles/aube.json','utf8'));
const versets=new Set([1,2,3,4,5,6,7].map(i=>veilleDuJour(aube,cycle,new Date(2026,10,22+i),'complet').verset)); ok(versets.size===7,'7 versets différents à l\'aube : '+[...versets].join(' | '));
// 4. la semaine
const s=semaineEnCours({'veille-aube':['2026-11-23T05:00:00.000Z','2026-11-25T05:00:00.000Z']},new Date('2026-11-26T12:00:00'));
ok(s[0].prie&&!s[1].prie&&s[2].prie,'lundi et mercredi marqués priés, mardi non');
ok(s[3].aujourdhui&&s[4].futur,'jeudi = aujourd\'hui, vendredi = à venir');
// 5. une veille sans cycle ne casse pas
const sans=veilleDuJour(aube,[],new Date(),'normal'); ok(sans.phases.length===9,'sans cycle : les 9 phases d\'origine, rien de cassé');
console.log(ko?'\n>>> '+ko+' ÉCHEC(S)':'\n>>> tout passe'); process.exit(ko?1:0);
