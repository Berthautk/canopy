import { faireDB, req, lireRep } from './d1.mjs';
import { onRequestPost } from '../../functions/api/suivi.js';
const DB = faireDB(), env = { DB };
const P = async (corps, o) => lireRep(await onRequestPost({ request: req(corps, o), env }));
let ko = 0; const ok = (c, m) => { if (!c) { ko++; console.log('  ÉCHEC :', m); } else console.log('  ok :', m); };

// 1. Le berger crée un code.
const cr = await P({ action: 'creer', prenom: 'Emmanuel' });
ok(cr.ok && /^[A-Z0-9]{3}-[A-Z0-9]{4}$/.test(cr.code), 'création du code ' + cr.code);
const { code, cle: cleB } = cr;

// 2. Le disciple rejoint.
const j1 = await P({ action: 'rejoindre', code, prenom: 'emmanuel' }, { ip: '9.9.9.1' });
ok(j1.ok && j1.cle, 'le disciple se relie');

// 3. FAILLE CORRIGÉE : un deuxième appareil avec le même code + prénom (message WhatsApp transféré).
const j2 = await P({ action: 'rejoindre', code, prenom: 'Emmanuel' }, { ip: '6.6.6.6' });
ok(!j2.ok && j2.statut === 409, 'un code transféré ne donne plus accès (409)');

// 4. L'ancienne clé du disciple marche toujours, et le berger voit le carnet.
const e1 = await P({ action: 'envoyer', code, cle: j1.cle, pas: 'pas-01-le-salut', data: { r: { q1: 'ma réponse' } } });
ok(e1.ok, 'le disciple envoie son carnet');
const et = await P({ action: 'etat', code, cle: cleB });
ok(et.ok && et.carnets['pas-01-le-salut'].r.q1 === 'ma réponse', 'le berger lit le carnet');
ok(et.ouvert === false, 'le berger voit que le code est fermé');

// 5. Le berger rouvre ; la nouvelle liaison annule l'ancienne clé.
ok((await P({ action: 'rouvrir', code, cle: cleB })).ok, 'le berger rouvre le code');
const j3 = await P({ action: 'rejoindre', code, prenom: 'Emmanuel' }, { ip: '9.9.9.2' });
ok(j3.ok && j3.cle !== j1.cle, 'nouvelle liaison, clé neuve');
const vieux = await P({ action: 'etat', code, cle: j1.cle });
ok(!vieux.ok && vieux.statut === 403, "l'ancien téléphone perd l'accès");

// 6. Le disciple ne peut pas détruire le suivi du berger.
ok((await P({ action: 'supprimer', code, cle: j3.cle })).ok, 'le disciple coupe le lien');
ok((await P({ action: 'etat', code, cle: cleB })).ok, 'le suivi du berger existe toujours');

// 7. Mauvaise clé = refus, et au bout de 20 essais l'appareil est freiné.
let bloque = 0;
for (let i = 0; i < 24; i++) { const r = await P({ action: 'etat', code, cle: 'x'.repeat(32) }, { ip: '7.7.7.7' }); if (r.statut === 429) bloque++; }
ok(bloque > 0, 'devinette de clé freinée après 20 essais (' + bloque + ' refus 429)');

// 8. Un code inconnu est freiné de la même façon.
let b2 = 0;
for (let i = 0; i < 24; i++) { const r = await P({ action: 'rejoindre', code: 'AAA-BBB' + i % 9, prenom: 'x' }, { ip: '8.8.8.8' }); if (r.statut === 429) b2++; }
ok(b2 > 0, 'devinette de code freinée (' + b2 + ' refus 429)');

// 9. On ne peut pas gonfler la base avec des pas inventés.
const cr2 = await P({ action: 'creer', prenom: 'Grace' }, { ip: '2.2.2.2' });
const jd = await P({ action: 'rejoindre', code: cr2.code, prenom: 'Grace' }, { ip: '2.2.2.3' });
let refuse = null;
for (let i = 0; i < 105 && !refuse; i++) {
  const r = await P({ action: 'envoyer', code: cr2.code, cle: jd.cle, pas: 'pas-01-invente-' + i, data: { x: 1 } }, { ip: '2.2.2.3' });
  if (!r.ok) refuse = i;
}
ok(refuse === 100, 'plus de 100 carnets refusés (bloqué au n°' + refuse + ')');

// 10. Corps trop gros sans en-tête content-length.
const gros = await lireRep(await onRequestPost({ request: req(JSON.stringify({ action: 'creer', prenom: 'a'.repeat(90000) })), env }));
ok(gros.statut === 413, 'corps trop gros refusé même sans content-length');

// 11. Envoi depuis un autre site (CSRF).
ok((await P({ action: 'creer', prenom: 'Pirate' }, { origin: 'https://mechant.example' })).statut === 403, 'requête venue d\'un autre site refusée');

console.log(ko ? '\n>>> ' + ko + ' ÉCHEC(S)' : '\n>>> tout passe');
process.exit(ko ? 1 : 0);
