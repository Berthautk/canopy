import { lignesValides, enregistrer, json } from '../_stats.js';

// POST /api/evenements : reçoit des compteurs anonymes par jour.
export async function onRequestPost({ request, env }) {
  if (!env.DB) return json({ ok: false, erreur: 'base non configurée' }, 503);
  const taille = Number(request.headers.get('content-length') || 0);
  if (taille > 50000) return json({ ok: false }, 413);
  let corps; try { corps = await request.json(); } catch { return json({ ok: false }, 400); }
  const lignes = lignesValides(corps);
  if (lignes.length) await enregistrer(env.DB, lignes);
  return json({ ok: true, lignes: lignes.length });
}
