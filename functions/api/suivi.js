import { json, memeOrigine, memeTexte, cleAnonyme, tropDEssais, oublierEssais, corpsJson } from '../_stats.js';

// Suivi des nouveaux convertis : relie un berger et un disciple par un code.
// Le berger crée le code (avec le prénom du disciple) ; le disciple l'entre avec son prénom.
// Ensuite, les réponses du carnet du disciple sont visibles par son berger, et seulement par lui.
// Le bilan de vie n'est JAMAIS envoyé ici : il reste sur le téléphone du disciple.
//
// Le code d'invitation ne sert qu'UNE FOIS : une fois le disciple relié, il est fermé.
// Si le disciple change de téléphone, le berger le rouvre depuis sa fiche (action « rouvrir »),
// et la nouvelle liaison annule l'ancienne. Sans cela, n'importe qui recevant le message
// d'invitation transféré pourrait, des mois plus tard, lire et écraser le carnet du disciple.
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
const MAX_CARNETS = 100;          // le parcours complet en compte environ 70
const maintenant = () => new Date().toISOString();
const lenteur = () => new Promise((r) => setTimeout(r, 600));

async function preparer(db) {
  for (const s of SCHEMAS) await db.prepare(s).run();
  // Colonne ajoutée après coup : les suivis déjà rejoints sont fermés tout de suite.
  try {
    await db.prepare('ALTER TABLE suivis ADD COLUMN ouvert INTEGER NOT NULL DEFAULT 1').run();
    await db.prepare('UPDATE suivis SET ouvert = 0 WHERE cle_disciple IS NOT NULL').run();
  } catch { /* la colonne existe déjà */ }
  // Rendez-vous fixé par le berger : date-heure locale (AAAA-MM-JJTHH:MM) et lieu.
  for (const c of ['rdv TEXT', 'rdv_lieu TEXT']) { try { await db.prepare('ALTER TABLE suivis ADD COLUMN ' + c).run(); } catch { /* déjà là */ } }
}
const lire = (db, code) => db.prepare('SELECT * FROM suivis WHERE code = ?').bind(code).first();

export async function onRequestPost({ request, env }) {
  if (!memeOrigine(request)) return json({ ok: false }, 403);
  if (!env.DB) return json({ ok: false, erreur: 'Le suivi en ligne n\'est pas encore activé sur ce site.' }, 503);
  const c = await corpsJson(request, 80000);
  if (c === 'trop-long') return json({ ok: false, erreur: 'trop long' }, 413);
  if (!c) return json({ ok: false }, 400);
  const db = env.DB; await preparer(db);
  const code = lireCode(c.code);

  // Le berger crée un lien pour un nouveau converti.
  if (c.action === 'creer') {
    const prenom = String(c.prenom || '').trim().slice(0, 40);
    if (propre(prenom).length < 2) return json({ ok: false, erreur: 'prénom trop court' }, 400);
    if (await tropDEssais(db, await cleAnonyme(request, 'creer'), 10)) return json({ ok: false, erreur: 'Trop de codes créés depuis cet appareil. Réessaie dans une heure.' }, 429);
    const { n } = await db.prepare('SELECT COUNT(*) AS n FROM suivis WHERE cree > ?').bind(new Date(Date.now() - 36e5).toISOString()).first();
    if (n >= 500) return json({ ok: false, erreur: 'trop de demandes, réessaie plus tard' }, 429);
    let nouveau; for (let k = 0; k < 5; k++) { nouveau = nouveauCode(); if (!(await lire(db, nouveau))) break; }
    const cle = nouvelleCle(), t = maintenant();
    await db.prepare('INSERT INTO suivis (code, prenom, cle_encadreur, pas, cree, maj, ouvert) VALUES (?, ?, ?, ?, ?, ?, 1)').bind(nouveau, prenom, cle, 'pas-01-le-salut', t, t).run();
    // Ménage : les suivis inactifs depuis deux ans sont supprimés.
    const vieux = new Date(Date.now() - 730 * 864e5).toISOString();
    await db.prepare('DELETE FROM carnets WHERE code IN (SELECT code FROM suivis WHERE maj < ?)').bind(vieux).run();
    await db.prepare('DELETE FROM suivis WHERE maj < ?').bind(vieux).run();
    return json({ ok: true, code: nouveau, cle });
  }

  // Un code faux ou une clé fausse comptent comme un essai : au bout de 20, cet appareil est freiné.
  const frein = await cleAnonyme(request, 'suivi');
  const s = code && await lire(db, code);
  if (!s) {
    if (await tropDEssais(db, frein, 20)) return json({ ok: false, erreur: 'Trop d\'essais depuis cet appareil. Réessaie dans une heure.' }, 429);
    await lenteur();
    return json({ ok: false, erreur: 'Ce code n\'existe pas. Vérifie-le avec ton berger.' }, 404);
  }

  // Le disciple entre le code et son prénom. Le code ne sert qu'une fois.
  if (c.action === 'rejoindre') {
    if (await tropDEssais(db, frein, 20)) return json({ ok: false, erreur: 'Trop d\'essais depuis cet appareil. Réessaie dans une heure.' }, 429);
    if (s.cle_disciple && !s.ouvert) {
      await lenteur();
      return json({ ok: false, erreur: 'Ce code a déjà servi. Demande à ton berger de le rouvrir depuis ta fiche, puis réessaie.' }, 409);
    }
    if (propre(c.prenom) !== propre(s.prenom)) { await lenteur(); return json({ ok: false, erreur: 'Le prénom ne correspond pas à ce code. Écris-le comme ton berger l\'a noté.' }, 403); }
    // Clé neuve à chaque liaison : un ancien téléphone relié perd aussitôt l'accès.
    const cle = nouvelleCle(), t = maintenant();
    await db.prepare('UPDATE suivis SET cle_disciple = ?, ouvert = 0, rejoint = COALESCE(rejoint, ?), maj = ? WHERE code = ?').bind(cle, t, t, code).run();
    await oublierEssais(db, frein);
    return json({ ok: true, cle, prenom: s.prenom, pas: s.pas });
  }

  const donnee = typeof c.cle === 'string' ? c.cle : '';
  const berger = !!donnee && memeTexte(donnee, s.cle_encadreur);                      // comparaison en temps constant
  const disciple = !!donnee && !!s.cle_disciple && memeTexte(donnee, s.cle_disciple);
  if (!berger && !disciple) {
    if (await tropDEssais(db, frein, 20)) return json({ ok: false, erreur: 'Trop d\'essais depuis cet appareil. Réessaie dans une heure.' }, 429);
    await lenteur();
    return json({ ok: false, erreur: 'accès refusé' }, 403);
  }

  // Le disciple envoie son carnet d'un pas (réponses, vrai/faux, lectures cochées).
  if (c.action === 'envoyer' && disciple) {
    if (!PAS.test(c.pas || '')) return json({ ok: false }, 400);
    const data = JSON.stringify(c.data || {}); if (data.length > 60000) return json({ ok: false, erreur: 'trop long' }, 413);
    // Un carnet par pas, et pas plus de pas que le parcours n'en compte : la base ne peut pas être gonflée sans fin.
    const connu = await db.prepare('SELECT 1 FROM carnets WHERE code = ? AND pas = ?').bind(code, c.pas).first();
    if (!connu) {
      const { n } = await db.prepare('SELECT COUNT(*) AS n FROM carnets WHERE code = ?').bind(code).first();
      if (n >= MAX_CARNETS) return json({ ok: false, erreur: 'trop de pas enregistrés pour ce suivi' }, 409);
    }
    const t = maintenant();
    await db.prepare('INSERT INTO carnets (code, pas, data, maj) VALUES (?, ?, ?, ?) ON CONFLICT (code, pas) DO UPDATE SET data = excluded.data, maj = excluded.maj').bind(code, c.pas, data, t).run();
    await db.prepare('UPDATE suivis SET maj = ? WHERE code = ?').bind(t, code).run();
    return json({ ok: true, maj: t });
  }

  // État du suivi : pas en cours ; pour le berger, aussi les carnets.
  if (c.action === 'etat') {
    const r = { ok: true, prenom: s.prenom, pas: s.pas, rejoint: s.rejoint || null, rdv: s.rdv || null, lieu: s.rdv_lieu || null };
    if (berger) {
      r.ouvert = !s.cle_disciple || !!s.ouvert;
      const { results } = await db.prepare('SELECT pas, data, maj FROM carnets WHERE code = ?').bind(code).all();
      r.carnets = Object.fromEntries(results.map((x) => [x.pas, { ...JSON.parse(x.data), maj: x.maj }]));
    }
    return json(r);
  }

  // Rencontre terminée : le berger remet le pas suivant.
  if (c.action === 'avancer' && berger) {
    if (!PAS.test(c.pas || '')) return json({ ok: false }, 400);
    await db.prepare('UPDATE suivis SET pas = ?, maj = ? WHERE code = ?').bind(c.pas, maintenant(), code).run();
    return json({ ok: true, pas: c.pas });
  }

  // Le berger fixe (ou annule) le rendez-vous. Le disciple le lira à l'ouverture de l'application.
  if (c.action === 'rdv' && berger) {
    const rdv = String(c.rdv || '');
    if (rdv && !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(rdv)) return json({ ok: false, erreur: 'date invalide' }, 400);
    const lieu = rdv ? String(c.lieu || '').trim().slice(0, 80) : '';
    await db.prepare('UPDATE suivis SET rdv = ?, rdv_lieu = ?, maj = ? WHERE code = ?').bind(rdv || null, lieu || null, maintenant(), code).run();
    return json({ ok: true, rdv: rdv || null, lieu: lieu || null });
  }

  // Corriger le prénom : seul le berger.
  if (c.action === 'renommer' && berger) {
    const prenom = String(c.prenom || '').trim().slice(0, 40);
    if (propre(prenom).length < 2) return json({ ok: false, erreur: 'prénom trop court' }, 400);
    await db.prepare('UPDATE suivis SET prenom = ?, maj = ? WHERE code = ?').bind(prenom, maintenant(), code).run();
    return json({ ok: true, prenom });
  }

  // Le disciple a changé de téléphone : le berger rouvre le code pour une nouvelle liaison.
  if (c.action === 'rouvrir' && berger) {
    await db.prepare('UPDATE suivis SET ouvert = 1, maj = ? WHERE code = ?').bind(maintenant(), code).run();
    return json({ ok: true, code });
  }

  // Arrêter le suivi. Le berger efface tout ; le disciple efface ses réponses et coupe le lien
  // (il ne peut pas supprimer le suivi entier : un code transféré ne doit pas pouvoir tout détruire).
  if (c.action === 'supprimer') {
    await db.prepare('DELETE FROM carnets WHERE code = ?').bind(code).run();
    if (berger) await db.prepare('DELETE FROM suivis WHERE code = ?').bind(code).run();
    else await db.prepare('UPDATE suivis SET cle_disciple = NULL, ouvert = 0, maj = ? WHERE code = ?').bind(maintenant(), code).run();
    return json({ ok: true });
  }
  return json({ ok: false }, 400);
}
