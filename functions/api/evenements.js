import { lignesValides, enregistrer, json, memeOrigine, cleAnonyme, tropDEssais, corpsJson } from '../_stats.js';

// POST /api/evenements : reçoit des compteurs anonymes par jour.
export async function onRequestPost({ request, env }) {
  if (!memeOrigine(request)) return json({ ok: false }, 403);
  if (!env.DB) return json({ ok: false, erreur: 'base non configurée' }, 503);
  const corps = await corpsJson(request, 50000);
  if (corps === 'trop-long') return json({ ok: false }, 413);
  if (!corps) return json({ ok: false }, 400);
  // Personne ne s'authentifie ici : on limite les envois par appareil pour qu'un seul
  // ne puisse pas fausser les statistiques ni gonfler la base.
  if (await tropDEssais(env.DB, await cleAnonyme(request, 'evenements'), 60)) return json({ ok: false }, 429);
  const lignes = lignesValides(corps);
  if (lignes.length) await enregistrer(env.DB, lignes);
  return json({ ok: true, lignes: lignes.length });
}
