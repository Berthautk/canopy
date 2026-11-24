import { json, memeOrigine } from '../_stats.js';

// Suivi des nouveaux convertis : relie un encadreur et un disciple par un code.
// L'encadreur crée le code (avec le prénom du disciple) ; le disciple l'entre avec son prénom.
// Ensuite, les réponses du carnet du disciple sont visibles par son encadreur, et seulement par lui.
// Le bilan de vie n'est JAMAIS envoyé ici : il reste sur le téléphone du disciple.
const SCHEMAS = [
  'CREATE TABLE IF NOT EXISTS suivis (code TEXT PRIMARY KEY, prenom TEXT NOT NULL, cle_encadreur TEXT NOT NULL, cle_disciple TEXT, pas TEXT, rejoint TEXT, cree TEXT NOT NULL, maj TEXT NOT NULL)',
  'CREATE TABLE IF NOT EXISTS carnets (code TEXT NOT NULL, pas TEXT NOT NULL, data TEXT NOT NULL, maj TEXT NOT NULL, PRIMARY KEY (code, pas))',
];
const LETTRES = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';   // sans I, O, 0, 1 (faciles à confondre)
const hasard = (n, alphabet) => { const t = crypto.getRandomValues(new Uint8Array(n)); return [...t].map((x) => alphabet[x % alphabet.length]).join(''); };
const nouveauCode = () => hasard(3, LETTRES) + '-' + hasard(4, LETTRES);
const nouvelleCle = () => hasard(32, 'abcdefghijklmnopqrstuvwxyz0123456789');
const propre = (s) => String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const lireCode = (s) => String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^(.{3})(.{4})$/, '$1-$2');
const PAS = /^pas-\d{2}-[a-z0-9-]{1,60}$/;
const maintenant = () => new Date().toISOString();

async function preparer(db) { for (const s of SCHEMAS) await db.prepare(s).run(); }
const lire = (db, code) => db.prepare('SELECT * FROM suivis WHERE code = ?').bind(code).first();

export async function onRequestPost({ request, env }) {
  if (!memeOrigine(request)) return json({ ok: false }, 403);
  if (!env.DB) return json({ ok: false, erreur: 'Le suivi en ligne n\'est pas encore activé sur ce site.' }, 503);
  if (Number(request.headers.get('content-length') || 0) > 80000) return json({ ok: false, erreur: 'trop long' }, 413);
  let c; try { c = await request.json(); } catch { return json({ ok: false }, 400); }
  const db = env.DB; await preparer(db);
  const code = lireCode(c.code);

  // L'encadreur crée un lien pour un nouveau converti.
  if (c.action === 'creer') {
    const prenom = String(c.prenom || '').trim().slice(0, 40);
    if (propre(prenom).length < 2) return json({ ok: false, erreur: 'prénom trop court' }, 400);
    const { n } = await db.prepare('SELECT COUNT(*) AS n FROM suivis WHERE cree > ?').bind(new Date(Date.now() - 36e5).toISOString()).first();
    if (n >= 300) return json({ ok: false, erreur: 'trop de demandes, réessaie plus tard' }, 429);
    let nouveau; for (let k = 0; k < 5; k++) { nouveau = nouveauCode(); if (!(await lire(db, nouveau))) break; }
    const cle = nouvelleCle(), t = maintenant();
    await db.prepare('INSERT INTO suivis (code, prenom, cle_encadreur, pas, cree, maj) VALUES (?, ?, ?, ?, ?, ?)').bind(nouveau, prenom, cle, 'pas-01-le-salut', t, t).run();
    // Ménage : les suivis inactifs depuis deux ans sont supprimés.
    const vieux = new Date(Date.now() - 730 * 864e5).toISOString();
    await db.prepare('DELETE FROM carnets WHERE code IN (SELECT code FROM suivis WHERE maj < ?)').bind(vieux).run();
    await db.prepare('DELETE FROM suivis WHERE maj < ?').bind(vieux).run();
    return json({ ok: true, code: nouveau, cle });
  }

  const s = code && await lire(db, code);
  if (!s) { await new Promise((r) => setTimeout(r, 600)); return json({ ok: false, erreur: 'Ce code n\'existe pas. Vérifie-le avec ton encadreur.' }, 404); }

  // Le disciple entre le code et son prénom.
  if (c.action === 'rejoindre') {
    if (propre(c.prenom) !== propre(s.prenom)) { await new Promise((r) => setTimeout(r, 600)); return json({ ok: false, erreur: 'Le prénom ne correspond pas à ce code. Écris-le comme ton encadreur l\'a noté.' }, 403); }
    const cle = s.cle_disciple || nouvelleCle(), t = maintenant();
    await db.prepare('UPDATE suivis SET cle_disciple = ?, rejoint = COALESCE(rejoint, ?), maj = ? WHERE code = ?').bind(cle, t, t, code).run();
    return json({ ok: true, cle, prenom: s.prenom, pas: s.pas });
  }

  const encadreur = c.cle && c.cle === s.cle_encadreur, disciple = c.cle && s.cle_disciple && c.cle === s.cle_disciple;
  if (!encadreur && !disciple) return json({ ok: false, erreur: 'accès refusé' }, 403);

  // Le disciple envoie son carnet d'un pas (réponses, vrai/faux, lectures cochées).
  if (c.action === 'envoyer' && disciple) {
    if (!PAS.test(c.pas || '')) return json({ ok: false }, 400);
    const data = JSON.stringify(c.data || {}); if (data.length > 60000) return json({ ok: false, erreur: 'trop long' }, 413);
    const t = maintenant();
    await db.prepare('INSERT INTO carnets (code, pas, data, maj) VALUES (?, ?, ?, ?) ON CONFLICT (code, pas) DO UPDATE SET data = excluded.data, maj = excluded.maj').bind(code, c.pas, data, t).run();
    await db.prepare('UPDATE suivis SET maj = ? WHERE code = ?').bind(t, code).run();
    return json({ ok: true, maj: t });
  }

  // État du suivi : pas en cours ; pour l'encadreur, aussi les carnets.
  if (c.action === 'etat') {
    const r = { ok: true, prenom: s.prenom, pas: s.pas, rejoint: s.rejoint || null };
    if (encadreur) {
      const { results } = await db.prepare('SELECT pas, data, maj FROM carnets WHERE code = ?').bind(code).all();
      r.carnets = Object.fromEntries(results.map((x) => [x.pas, { ...JSON.parse(x.data), maj: x.maj }]));
    }
    return json(r);
  }

  // Rencontre terminée : l'encadreur remet le pas suivant.
  if (c.action === 'avancer' && encadreur) {
    if (!PAS.test(c.pas || '')) return json({ ok: false }, 400);
    await db.prepare('UPDATE suivis SET pas = ?, maj = ? WHERE code = ?').bind(c.pas, maintenant(), code).run();
    return json({ ok: true, pas: c.pas });
  }

  // Corriger le prénom : seul l'encadreur.
  if (c.action === 'renommer' && encadreur) {
    const prenom = String(c.prenom || '').trim().slice(0, 40);
    if (propre(prenom).length < 2) return json({ ok: false, erreur: 'prénom trop court' }, 400);
    await db.prepare('UPDATE suivis SET prenom = ?, maj = ? WHERE code = ?').bind(prenom, maintenant(), code).run();
    return json({ ok: true, prenom });
  }

  // Arrêter le suivi : tout est effacé du serveur (par l'un ou l'autre).
  if (c.action === 'supprimer') {
    await db.prepare('DELETE FROM carnets WHERE code = ?').bind(code).run();
    await db.prepare('DELETE FROM suivis WHERE code = ?').bind(code).run();
    return json({ ok: true });
  }
  return json({ ok: false }, 400);
}
