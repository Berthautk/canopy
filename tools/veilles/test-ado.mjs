import { adorationDuJour } from '../../src/donnees/veilles.js';
import { readFileSync } from 'node:fs';
const RACINE = new URL('../../', import.meta.url).pathname;
const A=JSON.parse(readFileSync(RACINE + 'content/veilles/adoration.json','utf8'));
let ko=0; const ok=(c,m)=>{ if(!c){ko++;console.log('  ÉCHEC :',m);} else console.log('  ok :',m); };
ok(A.psaumes.length===21,'21 psaumes : un pour chaque jour et chaque veille');
const paires=new Set(A.psaumes.map(x=>x.jour+x.veille)); ok(paires.size===21,'aucun doublon jour/veille');
const refs=new Set(A.psaumes.map(x=>x.ref)); ok(refs.size===21,'21 psaumes tous différents (pas de répétition dans la semaine)');
for(const j of [1,3,7]) for(const v of ['veille-aube','veille-midi','veille-soir']){ const d=new Date(2026,10,22+j); const r=adorationDuJour(A,v,d); ok(!!r.psaume,`jour ${j} · ${v} : un psaume (${r.psaume?.ref})`); }
const dim=adorationDuJour(A,'veille-aube',new Date('2026-11-29T10:00:00')); ok(dim.cantique?.id==='a-toi-la-gloire','dimanche : « À toi la gloire »');
const lun=adorationDuJour(A,'veille-aube',new Date('2026-11-23T10:00:00')); ok(lun.cantique?.id==='a-toi-la-gloire'&&!!lun.psaume,'lundi : le psaume du jour + le cantique disponible');
ok(adorationDuJour(null,'veille-aube').psaume===null,'sans données : rien ne casse');
console.log(ko?'\n>>> '+ko+' ÉCHEC(S)':'\n>>> tout passe'); process.exit(ko?1:0);
