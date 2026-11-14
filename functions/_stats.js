// Statistiques anonymes de Yeshaya (Cloudflare Pages Functions + base D1 liée sous le nom « DB »).
// Rien d'identifiant n'est reçu ni stocké : ni nom, ni adresse IP, ni pays, ni identifiant d'appareil.
// Seulement des compteurs par jour : « tel contenu a été ouvert N fois », « N personnes ont dit avoir donné leur vie à Jésus ».

export const SCHEMA = 'CREATE TABLE IF NOT EXISTS stats (jour TEXT NOT NULL, cle TEXT NOT NULL, n INTEGER NOT NULL DEFAULT 0, PRIMARY KEY (jour, cle))';
const CLE = /^[a-z][a-z0-9-]{0,40}(:[a-z0-9-]{1,80})?$/;
const JOUR = /^\d{4}-\d{2}-\d{2}$/;

// Vérifie et nettoie un envoi { jours: { 'AAAA-MM-JJ': { cle: nombre } } }. Renvoie des lignes [jour, cle, n].
export function lignesValides(corps, maintenant = new Date()) {
  const lignes = [];
  const jours = corps && typeof corps === 'object' && corps.jours && typeof corps.jours === 'object' ? corps.jours : {};
  const max = maintenant.getTime() + 864e5, min = maintenant.getTime() - 60 * 864e5;   // 60 jours en arrière au plus
  for (const [jour, compteurs] of Object.entries(jours).slice(0, 61)) {
    if (!JOUR.test(jour)) continue;
    const t = Date.parse(jour + 'T00:00:00Z'); if (!(t >= min && t <= max)) continue;
    if (!compteurs || typeof compteurs !== 'object') continue;
    for (const [cle, n] of Object.entries(compteurs).slice(0, 200)) {
      if (!CLE.test(cle) || !Number.isInteger(n) || n < 1) continue;
      lignes.push([jour, cle, Math.min(n, 500)]);
    }
  }
  return lignes.slice(0, 1000);
}

export async function enregistrer(db, lignes) {
  await db.prepare(SCHEMA).run();
  const req = db.prepare('INSERT INTO stats (jour, cle, n) VALUES (?, ?, ?) ON CONFLICT (jour, cle) DO UPDATE SET n = n + excluded.n');
  if (db.batch) await db.batch(lignes.map((l) => req.bind(...l)));
  else for (const l of lignes) await req.bind(...l).run();
}

export async function lire(db, depuis) {
  await db.prepare(SCHEMA).run();
  const { results } = await db.prepare('SELECT jour, cle, n FROM stats WHERE jour >= ? ORDER BY jour').bind(depuis).all();
  return results;
}

// Comparaison en temps constant (évite de deviner le mot de passe caractère par caractère).
export function memeTexte(a = '', b = '') {
  const x = new TextEncoder().encode(a), y = new TextEncoder().encode(b);
  let d = x.length ^ y.length;
  for (let i = 0; i < Math.max(x.length, y.length); i++) d |= (x[i] || 0) ^ (y[i] || 0);
  return d === 0;
}
export const json = (o, statut = 200) => new Response(JSON.stringify(o), { status: statut, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store' } });
