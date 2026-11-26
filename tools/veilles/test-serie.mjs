import { joursPries, serieEnCours, meilleureSerie, phraseDeSerie } from '../../src/donnees/veilles.js';
let ko=0; const ok=(c,m)=>{ if(!c){ko++;console.log('  ÉCHEC :',m);} else console.log('  ok :',m); };
const j=(s)=>new Date(s+'T08:00:00').toISOString();
const A={ 'veille-aube':[j('2026-11-22'),j('2026-11-23'),j('2026-11-24')], 'veille-soir':[j('2026-11-24'),j('2026-11-20')] };
const lui=new Date('2026-11-24T20:00:00');
ok(joursPries(A).length===4,'4 jours distincts : le même jour prié deux fois ne compte qu\'une fois');
let s=serieEnCours(A,lui); ok(s.serie===3&&!s.pasEncorePrieAujourdhui,'3 jours de suite, aujourd\'hui prié');
s=serieEnCours(A,new Date('2026-11-25T07:00:00')); ok(s.serie===3&&s.enDanger,'le lendemain matin, pas encore prié : la série de 3 est vivante mais en danger');
s=serieEnCours(A,new Date('2026-11-26T07:00:00')); ok(s.serie===0,'deux jours sans prier : la série retombe à 0');
ok(meilleureSerie(A)===3,'meilleure série : 3');
ok(serieEnCours({},lui).serie===0,'personne qui n\'a jamais prié : 0, sans erreur');
// série qui traverse la fin du mois
const B={'veille-midi':[j('2026-11-29'),j('2026-11-30'),j('2026-12-01'),j('2026-12-02')]};
ok(serieEnCours(B,new Date('2026-12-02T10:00:00')).serie===4,'une série qui passe du 30 novembre au 1er décembre tient');
// les autres prières (thèmes, combat) ne comptent pas comme veille
ok(joursPries({'theme-famille':[j('2026-11-24')]}).length===0,'seules les veilles comptent pour la série');
ok(/première veille/.test(phraseDeSerie({serie:0,enDanger:false},0)),'phrase pour un débutant');
ok(/garder ta série/.test(phraseDeSerie({serie:5,enDanger:true},9)),'phrase quand la série est en danger');
console.log(ko?'\n>>> '+ko+' ÉCHEC(S)':'\n>>> tout passe'); process.exit(ko?1:0);
