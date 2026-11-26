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

// 3. Le converti perd son lien (autre téléphone, réinstallation) : il se reconnecte avec le MÊME code et le MÊME prénom.
const j2 = await P({ action: 'rejoindre', code, prenom: 'Emmanuel' }, { ip: '6.6.6.6' });
ok(j2.ok && j2.cle && j2.cle !== j1.cle, 'reconnexion avec le même code et le même prénom (clé neuve)');
ok(!(await P({ action: 'rejoindre', code, prenom: 'Pirate' }, { ip: '6.6.6.7' })).ok, 'un mauvais prénom reste refusé');
ok(!(await P({ action: 'etat', code, cle: j1.cle })).ok, "l'ancien téléphone perd l'accès après la reconnexion");
// 5 reconnexions en 30 jours au maximum : ensuite le berger doit rouvrir le code.
let dernier = j2; for (let i = 0; i < 4; i++) dernier = await P({ action: 'rejoindre', code, prenom: 'Emmanuel' }, { ip: '8.8.8.' + i });
ok(dernier.ok, 'jusqu\'à 5 reconnexions acceptées');
const trop = await P({ action: 'rejoindre', code, prenom: 'Emmanuel' }, { ip: '8.8.8.9' });
ok(!trop.ok && trop.statut === 409, 'la 6e est refusée : le berger doit rouvrir (409)');
const jr = dernier;
await P({ action: 'envoyer', code, cle: jr.cle, pas: 'pas-02-essai', data: { r: { q1: 'gardé' } } });
const re = await P({ action: 'rouvrir', code, cle: cleB }).then(() => P({ action: 'rejoindre', code, prenom: 'Emmanuel' }, { ip: '8.8.7.1' }));
ok(re.ok && re.carnets === null, 'première liaison : pas de carnet à rendre');
const re2 = await P({ action: 'rejoindre', code, prenom: 'Emmanuel' }, { ip: '8.8.7.2' });
ok(re2.ok && re2.carnets?.['pas-02-essai']?.r?.q1 === 'gardé', 'à la reconnexion, ses réponses déjà envoyées lui sont rendues');
const jr2 = re2;

// 4. L'ancienne clé du disciple marche toujours, et le berger voit le carnet.
const e1 = await P({ action: 'envoyer', code, cle: jr2.cle, pas: 'pas-01-le-salut', data: { r: { q1: 'ma réponse' } } });
ok(e1.ok, 'le disciple envoie son carnet');
const et = await P({ action: 'etat', code, cle: cleB });
ok(et.ok && et.carnets['pas-01-le-salut'].r.q1 === 'ma réponse', 'le berger lit le carnet');
ok(et.ouvert === false, 'le berger voit que le code est fermé');

// 5. Le berger rouvre ; la nouvelle liaison annule l'ancienne clé.
ok((await P({ action: 'rouvrir', code, cle: cleB })).ok, 'le berger rouvre le code');
const j3 = await P({ action: 'rejoindre', code, prenom: 'Emmanuel' }, { ip: '9.9.9.2' });
ok(j3.ok && j3.cle !== jr2.cle, 'nouvelle liaison, clé neuve');
const vieux = await P({ action: 'etat', code, cle: jr2.cle });
ok(!vieux.ok && vieux.statut === 403, "l'ancien téléphone perd l'accès");

// 6. Le disciple ne peut pas détruire le suivi du berger.
ok((await P({ action: 'supprimer', code, cle: j3.cle })).ok, 'le disciple coupe le lien');
ok((await P({ action: 'etat', code, cle: cleB })).ok, 'le suivi du berger existe toujours');

// 6b. Rendez-vous : seul le berger le fixe ; le disciple le lit.
const j4 = await P({ action: 'rouvrir', code, cle: cleB }).then(() => P({ action: 'rejoindre', code, prenom: 'Emmanuel' }, { ip: '9.9.9.3' }));
ok((await P({ action: 'rdv', code, cle: cleB, rdv: '2099-12-05T16:00', lieu: 'Chez moi' })).ok, 'le berger fixe un rendez-vous');
ok(!(await P({ action: 'rdv', code, cle: j4.cle, rdv: '2099-01-01T10:00' })).ok, 'le disciple ne peut pas le changer');
ok(!(await P({ action: 'rdv', code, cle: cleB, rdv: 'demain' })).ok, 'date invalide refusée');
const vu = await P({ action: 'etat', code, cle: j4.cle });
ok(vu.rdv === '2099-12-05T16:00' && vu.lieu === 'Chez moi', 'le disciple lit le rendez-vous et le lieu');
ok((await P({ action: 'rdv', code, cle: cleB, rdv: '' })).ok && (await P({ action: 'etat', code, cle: j4.cle })).rdv === null, 'le berger annule le rendez-vous');
await P({ action: 'rdv', code, cle: cleB, rdv: '2099-12-05T16:00', lieu: 'Chez moi' });

// 6c. Statistiques du suivi pour l'administrateur : des totaux seulement.
{
  const { onRequestGet } = await import('../../functions/api/stats.js');
  const envA = { DB, ADMIN_MOT_DE_PASSE: 'motdepasse-admin' };
  const rep = await lireRep(await onRequestGet({ request: req({}, { auth: 'Bearer motdepasse-admin', ip: '5.5.5.5' }), env: envA }));
  ok(rep.ok && rep.suivi && rep.suivi.crees >= 1 && rep.suivi.rejoints >= 1 && rep.suivi.rdvAVenir >= 1, 'l\'admin voit les totaux du suivi : ' + JSON.stringify(rep.suivi));
  ok(!JSON.stringify(rep).includes('Emmanuel') && !JSON.stringify(rep).includes(code), 'aucun prénom ni code dans ces statistiques');
}

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
