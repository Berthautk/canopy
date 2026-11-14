import { memeTexte, json } from '../_stats.js';

// Demandes de prière envoyées volontairement depuis l'application (« Demander la prière »).
const SCHEMA = 'CREATE TABLE IF NOT EXISTS requetes (id INTEGER PRIMARY KEY AUTOINCREMENT, recu TEXT NOT NULL, texte TEXT NOT NULL, prenom TEXT, contact TEXT, repondre INTEGER DEFAULT 0, lu INTEGER DEFAULT 0)';
const coupe = (s, n) => (typeof s === 'string' ? s.trim().slice(0, n) : '');
const admin = (request, env) => env.ADMIN_MOT_DE_PASSE && env.ADMIN_MOT_DE_PASSE.length >= 8
  && memeTexte((request.headers.get('authorization') || '').replace(/^Bearer\s+/i, ''), env.ADMIN_MOT_DE_PASSE);

// POST : une personne envoie une demande de prière.
export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ ok: false, erreur: 'base non configurée' }, 503);
  if (Number(request.headers.get('content-length') || 0) > 8000) return json({ ok: false }, 413);
  let c; try { c = await request.json(); } catch { return json({ ok: false }, 400); }
  const texte = coupe(c.texte, 1500);
  if (texte.length < 3) return json({ ok: false, erreur: 'message vide' }, 400);
  await env.DB.prepare(SCHEMA).run();
  await env.DB.prepare('INSERT INTO requetes (recu, texte, prenom, contact, repondre) VALUES (?, ?, ?, ?, ?)')
    .bind(new Date().toISOString(), texte, coupe(c.prenom, 40), coupe(c.contact, 80), c.repondre ? 1 : 0).run();
  // Suppression automatique après 12 mois (engagement de la politique de confidentialité).
  await env.DB.prepare('DELETE FROM requetes WHERE recu < ?').bind(new Date(Date.now() - 365 * 864e5).toISOString()).run();
  return json({ ok: true });
}

// GET : l'administrateur lit les demandes.
export async function onRequestGet({ request, env }) {
  if (!admin(request, env)) { await new Promise((r) => setTimeout(r, 800)); return json({ ok: false, erreur: 'mot de passe incorrect' }, 401); }
  if (!env.DB) return json({ ok: false, erreur: 'base non configurée' }, 503);
  await env.DB.prepare(SCHEMA).run();
  const { results } = await env.DB.prepare('SELECT * FROM requetes ORDER BY id DESC LIMIT 300').all();
  return json({ ok: true, requetes: results });
}

// PATCH ?id=…&lu=1 : marquer comme prié ; DELETE ?id=… : supprimer.
export async function onRequestPatch({ request, env }) {
  if (!admin(request, env)) return json({ ok: false }, 401);
  const u = new URL(request.url), id = parseInt(u.searchParams.get('id'), 10);
  await env.DB.prepare('UPDATE requetes SET lu = ? WHERE id = ?').bind(u.searchParams.get('lu') === '0' ? 0 : 1, id).run();
  return json({ ok: true });
}
export async function onRequestDelete({ request, env }) {
  if (!admin(request, env)) return json({ ok: false }, 401);
  const id = parseInt(new URL(request.url).searchParams.get('id'), 10);
  await env.DB.prepare('DELETE FROM requetes WHERE id = ?').bind(id).run();
  return json({ ok: true });
}
