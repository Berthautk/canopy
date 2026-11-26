import { json, cleAnonyme, tropDEssais } from '../_stats.js';

// GET /api/veilles : combien de personnes ont prié chaque veille aujourd'hui.
// Ce ne sont que des totaux : aucune identité, aucun lieu. Et ne comptent que les personnes qui ont accepté
// de partager des statistiques anonymes : le vrai nombre est donc plus élevé.
const CLES = { aube: 'j-ai-prie:veille-aube', midi: 'j-ai-prie:veille-midi', soir: 'j-ai-prie:veille-soir' };

export async function onRequestGet({ request, env }) {
  if (!env.DB) return json({ ok: false }, 503);
  if (await tropDEssais(env.DB, await cleAnonyme(request, 'veilles'), 120)) return json({ ok: false }, 429);
  const jour = new Date().toISOString().slice(0, 10);
  try {
    await env.DB.prepare('CREATE TABLE IF NOT EXISTS stats (jour TEXT NOT NULL, cle TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (jour, cle))').run();
    const { results } = await env.DB.prepare('SELECT cle, n FROM stats WHERE jour = ? AND cle IN (?, ?, ?)').bind(jour, ...Object.values(CLES)).all();
    const par = Object.fromEntries(results.map((r) => [r.cle, r.n]));
    const r = new Response(JSON.stringify({ ok: true, jour, aube: par[CLES.aube] || 0, midi: par[CLES.midi] || 0, soir: par[CLES.soir] || 0 }), {
      status: 200, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'public, max-age=60' } });
    return r;
  } catch { return json({ ok: false }, 500); }
}
