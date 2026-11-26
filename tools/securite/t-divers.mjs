import { faireDB, req, lireRep } from './d1.mjs';
import { onRequestPost as suiviPost } from '../../functions/api/suivi.js';
import { onRequestPost as prierePost, onRequestGet as priereGet } from '../../functions/api/priere.js';
import { onRequestGet as statsGet } from '../../functions/api/stats.js';
let ko = 0; const ok = (c, m) => { if (!c) { ko++; console.log('  ÉCHEC :', m); } else console.log('  ok :', m); };

// --- A. Migration d'une base déjà en service (ancienne version, sans la colonne « ouvert ») ---
{
  const DB = faireDB(), env = { DB };
  DB.prepare('CREATE TABLE suivis (code TEXT PRIMARY KEY, prenom TEXT NOT NULL, cle_encadreur TEXT NOT NULL, cle_disciple TEXT, pas TEXT, rejoint TEXT, cree TEXT NOT NULL, maj TEXT NOT NULL)').run();
  const t = new Date().toISOString();
  await DB.prepare('INSERT INTO suivis VALUES (?,?,?,?,?,?,?,?)').bind('ABC-1234', 'Jean', 'cleb', 'cled', 'pas-01-le-salut', t, t, t).run();
  await DB.prepare('INSERT INTO suivis VALUES (?,?,?,?,?,?,?,?)').bind('XYZ-9876', 'Paul', 'cleb2', null, 'pas-01-le-salut', null, t, t).run();
  const r = await lireRep(await suiviPost({ request: req({ action: 'rejoindre', code: 'ABC-1234', prenom: 'jean' }), env }));
  ok(r.ok && r.cle, 'un suivi déjà rejoint avant la mise à jour : le converti peut se reconnecter avec son code et son prénom');
  const r2 = await lireRep(await suiviPost({ request: req({ action: 'rejoindre', code: 'XYZ-9876', prenom: 'paul' }, { ip: '5.5.5.5' }), env }));
  ok(r2.ok, 'un suivi jamais rejoint reste utilisable après la mise à jour');
}

// --- B. Mot de passe administrateur : devinette ---
{
  const DB = faireDB(), env = { DB, ADMIN_MOT_DE_PASSE: 'un-vrai-mot-de-passe-long' };
  let refus = 0, bloque = 0;
  for (let i = 0; i < 14; i++) {
    const r = await lireRep(await statsGet({ request: req({}, { auth: 'Bearer essai' + i, ip: '4.4.4.4' }), env }));
    if (r.statut === 401) refus++; if (r.statut === 429) bloque++;
  }
  ok(refus === 10 && bloque === 4, 'mot de passe admin : bloqué après 10 essais (' + refus + ' refus, ' + bloque + ' blocages)');
  const bon = await lireRep(await statsGet({ request: req({}, { auth: 'Bearer un-vrai-mot-de-passe-long', ip: '4.4.4.4' }), env }));
  ok(bon.statut === 429, 'même le bon mot de passe est bloqué pendant la pénalité (pas de contournement)');
  const ailleurs = await lireRep(await statsGet({ request: req({}, { auth: 'Bearer un-vrai-mot-de-passe-long', ip: '4.4.4.5' }), env }));
  ok(ailleurs.ok, 'depuis un autre appareil, le bon mot de passe marche (le blocage ne punit pas tout le monde)');
  const vide = await lireRep(await statsGet({ request: req({}, { auth: 'Bearer court', ip: '3.3.3.3' }), env: { DB } }));
  ok(vide.statut === 401, 'sans mot de passe configuré, tout accès est refusé');
}

// --- C. Demandes de prière : inondation ---
{
  const DB = faireDB(), env = { DB };
  let passe = 0;
  for (let i = 0; i < 9; i++) { const r = await lireRep(await prierePost({ request: req({ texte: 'spam ' + i }, { ip: '1.1.1.1' }), env })); if (r.ok) passe++; }
  ok(passe === 5, 'un seul appareil ne peut envoyer que 5 demandes par heure (' + passe + ')');
  const autre = await lireRep(await prierePost({ request: req({ texte: 'vraie demande' }, { ip: '1.1.1.2' }), env }));
  ok(autre.ok, 'les autres personnes peuvent toujours écrire (pas de blocage général)');
  const admin = await lireRep(await priereGet({ request: req({}, { auth: 'Bearer x' }), env: { DB, ADMIN_MOT_DE_PASSE: 'mot-de-passe-long' } }));
  ok(!admin.ok && admin.statut === 401, 'les demandes de prière ne se lisent pas sans le mot de passe');
}
console.log(ko ? '\n>>> ' + ko + ' ÉCHEC(S)' : '\n>>> tout passe');
process.exit(ko ? 1 : 0);
