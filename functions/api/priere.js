import { memeTexte, json, memeOrigine, cleAnonyme, tropDEssais, oublierEssais, corpsJson } from '../_stats.js';

// Demandes de prière envoyées volontairement depuis l'application (« Demander la prière »).
const SCHEMA = 'CREATE TABLE IF NOT EXISTS requetes (id INTEGER PRIMARY KEY AUTOINCREMENT, recu TEXT NOT NULL, texte TEXT NOT NULL, prenom TEXT, contact TEXT, repondre INTEGER DEFAULT 0, lu INTEGER DEFAULT 0)';
const coupe = (s, n) => (typeof s === 'string' ? s.trim().slice(0, n) : '');

// Mot de passe de l'administrateur : comparaison en temps constant, et l'appareil est bloqué
// au bout de 10 essais ratés dans l'heure (sinon le mot de passe se devine en parallèle).
export async function refusAdmin(request, env) {
  const frein = await cleAnonyme(request, 'admin');
  if (await tropDEssais(env.DB, frein, 10)) return json({ ok: false, erreur: 'Trop d\'essais. Réessaie dans une heure.' }, 429);
  const mdp = env.ADMIN_MOT_DE_PASSE;
  const donne = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!mdp || mdp.length < 8 || !memeTexte(donne, mdp)) {
    await new Promise((r) => setTimeout(r, 800));
    return json({ ok: false, erreur: 'mot de passe incorrect' }, 401);
  }
  await oublierEssais(env.DB, frein);
  return null;
}

// POST : une personne envoie une demande de prière.
export async function onRequestPost({ request, env }) {
  if (!memeOrigine(request)) return json({ ok: false }, 403);
  if (!env.DB) return json({ ok: false, erreur: 'base non configurée' }, 503);
  const c = await corpsJson(request, 8000);
  if (c === 'trop-long') return json({ ok: false }, 413);
  if (!c) return json({ ok: false }, 400);
  const texte = coupe(c.texte, 1500);
  if (texte.length < 3) return json({ ok: false, erreur: 'message vide' }, 400);
  await env.DB.prepare(SCHEMA).run();
  // Frein principal : au plus 5 demandes par heure et par appareil, pour qu'une seule personne
  // ne puisse pas saturer la boîte et empêcher les autres d'écrire.
  if (await tropDEssais(env.DB, await cleAnonyme(request, 'priere'), 5)) return json({ ok: false, erreur: 'Tu as déjà envoyé plusieurs demandes. Réessaie dans une heure.' }, 429);
  const { n } = await env.DB.prepare('SELECT COUNT(*) AS n FROM requetes WHERE recu > ?').bind(new Date(Date.now() - 36e5).toISOString()).first();
  if (n >= 200) return json({ ok: false, erreur: 'trop de demandes, réessayez plus tard' }, 429);
  await env.DB.prepare('INSERT INTO requetes (recu, texte, prenom, contact, repondre) VALUES (?, ?, ?, ?, ?)')
    .bind(new Date().toISOString(), texte, coupe(c.prenom, 40), coupe(c.contact, 80), c.repondre ? 1 : 0).run();
  // Suppression automatique après 12 mois (engagement de la politique de confidentialité).
  await env.DB.prepare('DELETE FROM requetes WHERE recu < ?').bind(new Date(Date.now() - 365 * 864e5).toISOString()).run();
  return json({ ok: true });
}

// GET : l'administrateur lit les demandes.
export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ ok: false, erreur: 'base non configurée' }, 503);
  const refus = await refusAdmin(request, env); if (refus) return refus;
  await env.DB.prepare(SCHEMA).run();
  const { results } = await env.DB.prepare('SELECT * FROM requetes ORDER BY id DESC LIMIT 300').all();
  return json({ ok: true, requetes: results });
}

// PATCH ?id=…&lu=1 : marquer comme prié ; DELETE ?id=… : supprimer.
export async function onRequestPatch({ request, env }) {
  if (!env.DB) return json({ ok: false, erreur: 'base non configurée' }, 503);
  const refus = await refusAdmin(request, env); if (refus) return refus;
  const u = new URL(request.url), id = parseInt(u.searchParams.get('id'), 10);
  if (!Number.isInteger(id)) return json({ ok: false }, 400);
  await env.DB.prepare('UPDATE requetes SET lu = ? WHERE id = ?').bind(u.searchParams.get('lu') === '0' ? 0 : 1, id).run();
  return json({ ok: true });
}
export async function onRequestDelete({ request, env }) {
  if (!env.DB) return json({ ok: false, erreur: 'base non configurée' }, 503);
  const refus = await refusAdmin(request, env); if (refus) return refus;
  const id = parseInt(new URL(request.url).searchParams.get('id'), 10);
  if (!Number.isInteger(id)) return json({ ok: false }, 400);
  await env.DB.prepare('DELETE FROM requetes WHERE id = ?').bind(id).run();
  return json({ ok: true });
}
