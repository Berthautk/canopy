// Recherche plein texte, hors du fil principal pour ne jamais bloquer l'écran.
// L'index (texte sans accents de chaque verset) est construit une seule fois, au premier appel.
import index from '../../public/bible/index.json';

const CACHE = 'yeshaya-bible';
const simplifier = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/’/g, "'");
let versets = null;   // [{code, c, v, texte, simple}]

async function construire() {
  const cache = await caches.open(CACHE).catch(() => null);
  const tous = [];
  for (const l of index.livres) {
    const u = '/bible/' + l.fichier;
    let rep = cache && (await cache.match(u));
    if (!rep) { rep = await fetch(u); if (cache && rep.ok) cache.put(u, rep.clone()); }
    const livre = await rep.json();
    livre.chapitres.forEach((ch, i) => ch.forEach((t, j) => {
      if (t) tous.push({ code: l.code, c: i + 1, v: j + 1, texte: t, simple: simplifier(t.replace(/\n/g, ' ')) });
    }));
  }
  versets = tous;
}

const echapper = (m) => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&').replace(/\s+/g, '\\s+');

self.onmessage = async ({ data: { id, q, limite, champ } }) => {
  try {
    if (!versets) await construire();
    // Recherche par thème : tous les versets qui contiennent au moins un mot du champ lexical,
    // les plus riches en mots du thème d'abord.
    if (champ?.length) {
      const res = champ.map((m) => new RegExp(`(^|[^a-z0-9])${echapper(simplifier(m))}${m.length < 4 ? '(?![a-z])' : ''}`));
      const trouves = [];
      for (const x of versets) {
        let n = 0; for (const r of res) if (r.test(x.simple)) n++;
        if (n) trouves.push([n, x]);
      }
      trouves.sort((a, b) => b[0] - a[0]);
      return self.postMessage({ id, total: trouves.length, resultats: trouves.slice(0, limite).map(([, x]) => ({ code: x.code, c: x.c, v: x.v, texte: x.texte })), mots: champ.map(simplifier) });
    }
    const mots = simplifier(q).split(/[^a-z0-9']+/).filter((m) => m.length > 1);
    if (!mots.length) return self.postMessage({ id, total: 0, resultats: [] });
    // mot entier ou début de mot (« salut » trouve « salut », pas « salutation » ; « sauv » trouve « sauvé »)
    const res = mots.map((m) => new RegExp(`(^|[^a-z0-9])${echapper(m)}${m.length < 4 ? '(?![a-z])' : ''}`));
    const resultats = []; let total = 0;
    for (const x of versets) {
      if (res.every((r) => r.test(x.simple))) { total++; if (resultats.length < limite) resultats.push({ code: x.code, c: x.c, v: x.v, texte: x.texte }); }
    }
    self.postMessage({ id, total, resultats, mots });
  } catch (e) {
    self.postMessage({ id, erreur: 'La Bible n\'est pas encore disponible sur ce téléphone.', total: 0, resultats: [] });
  }
};
