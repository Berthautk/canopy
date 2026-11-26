// Les veilles de prière : le même squelette (le Notre Père), mais un thème différent chaque jour de la semaine,
// et trois tailles (court, normal, complet). Fonctions pures : elles ne lisent rien toutes seules,
// ce qui permet de les tester sans navigateur (voir tools/securite/… et les essais de ce chantier).

// Le même squelette (le Notre Père), mais chaque étape dit ce qu'elle veut dire à CETTE heure.
const LIBELLES = {
  'veille-aube': { 'Donne-nous notre pain': "Donne-nous notre pain : ce dont j'ai besoin aujourd'hui", 'Pardonne nos offenses': 'Pardonne nos offenses : repartir net', 'Action de grâce': 'Action de grâce : sortir en vainqueur' },
  'veille-midi': { 'Adoration': 'Adoration : lever les yeux au milieu de la course', 'Pardonne-nous nos offenses': 'Pardonne-nous nos offenses : ce que la matinée a laissé' },
  'veille-soir': { 'Donne-nous notre pain': 'Donne-nous notre pain : pour la nuit et pour demain', 'Pardonne nos offenses': 'Pardonne nos offenses : ce que je dépose avant de dormir', 'Action de grâce': 'Action de grâce : fermer la journée en vainqueur' },
};

export const TAILLES = [
  { id: 'court', nom: 'Court', minutes: 8, desc: "Un sujet par étape. Quand on n'a que quelques minutes." },
  { id: 'normal', nom: 'Normal', minutes: 22, desc: 'Trois sujets par étape. Le rythme de chaque jour.' },
  { id: 'complet', nom: 'Complet', minutes: 50, desc: 'Tous les sujets. Pour un vrai temps de veille.' },
];
const PAR_ETAPE = { court: 1, normal: 3, complet: Infinity };
const PROCLAMATIONS = { court: 2, normal: Infinity, complet: Infinity };

// Jour 1 = lundi … jour 7 = dimanche (le dimanche est le 7e jour, pas le 1er).
export const jourDuCycle = (d = new Date()) => ((d.getDay() + 6) % 7) + 1;

// Les huit phases du Notre Père : on reconnaît chaque phase à son titre, quelle que soit la veille.
const CLES_PHASES = [[/adoration/i, 'adoration'], [/r[èe]gne/i, 'regne'], [/volont/i, 'volonte'], [/pain/i, 'pain'],
  [/pardon/i, 'pardon'], [/tentation/i, 'tentation'], [/d[ée]livre/i, 'delivre'], [/gr[aâ]ce/i, 'grace']];
export const clePhase = (titre) => CLES_PHASES.find(([r]) => r.test(titre))?.[1] || null;

// ----- Pour que deux semaines ne se ressemblent jamais -----
// Chaque phase a une réserve de sujets (ceux du thème du jour + ceux d'origine). Chaque semaine, on en prend quelques-uns
// dans un paquet mélangé : tant que le paquet n'est pas épuisé, aucun sujet ne revient ; quand il l'est, on le
// remélange autrement. Ainsi le même sujet ne revient que bien plus tard, et jamais dans le même ordre.
export const semaineAbsolue = (d = new Date()) => Math.floor((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 864e5 + 3) / 7);   // change chaque lundi
const graineDe = (s) => { let h = 2166136261; for (const c of String(s)) { h ^= c.charCodeAt(0); h = Math.imul(h, 16777619); } return h >>> 0; };
const hasard = (g) => () => { g = (g + 0x6D2B79F5) >>> 0; let x = g; x = Math.imul(x ^ (x >>> 15), x | 1); x ^= x + Math.imul(x ^ (x >>> 7), x | 61); return ((x ^ (x >>> 14)) >>> 0) / 4294967296; };
export function melanger(liste, graine) {
  const l = [...liste], r = hasard(graineDe(graine));
  for (let i = l.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [l[i], l[j]] = [l[j], l[i]]; }
  return l;
}
// `n` sujets pour la semaine `w` : un sujet du thème d'abord (tourne chaque semaine), puis les suivants du paquet.
function tirage(duTheme, autres, n, w, graine, sel) {
  if (n <= 0) return [];
  const premier = duTheme.length ? duTheme[(w + sel + (graineDe(graine) % 7)) % duTheme.length] : null;
  const reserve = [...duTheme.filter((s) => s !== premier), ...autres];
  if (!isFinite(n)) return [...(premier ? [premier] : []), ...melanger(reserve, graine + ':' + w + ':' + sel)];      // version complète : tout, dans un ordre qui change
  const k = premier ? n - 1 : n, sortie = [];
  for (let i = 0; i < k && reserve.length; i++) {
    const g = w * k + i, ronde = Math.floor(g / reserve.length);
    sortie.push(melanger(reserve, graine + ':r' + ronde + ':' + sel)[g % reserve.length]);
  }
  return [...(premier ? [premier] : []), ...sortie];
}
export function choisirSujets(duTheme, autres, n, w, graine) {
  const cle = (l) => l.map((s) => s.titre).join('|');
  // On écarte tout tirage identique à ceux des 12 semaines précédentes : une phase ne revient jamais pareille avant 3 mois.
  const recents = new Set(Array.from({ length: 12 }, (_, j) => cle(tirage(duTheme, autres, n, w - 1 - j, graine, 0))));
  let c = null;
  for (let sel = 0; sel < 30; sel++) { c = tirage(duTheme, autres, n, w, graine, sel); if (!recents.has(cle(c))) break; }
  return c;
}

// La veille, telle qu'elle doit s'afficher aujourd'hui.
// Le même squelette (le Notre Père), mais CHAQUE phase prie d'abord pour le thème du jour :
// « Que ton règne vienne… dans ma famille, dans la vie de mes enfants… » le lundi, dans mon travail le mardi, etc.
// Le texte d'origine de chaque phase reste à la suite : on le garde pour la version complète.
//  - court : un sujet par phase ; normal : trois ; complet : tout.
//  - l'adoration commence toujours par le psaume du jour, puis le cantique s'il y en a un.
export function veilleDuJour(veille, cycle, d = new Date(), taille = 'complet', adoration = null) {
  const jour = cycle.find((x) => x.numero === jourDuCycle(d)) || null;
  const gardes = PAR_ETAPE[taille] ?? Infinity;
  const ado = adoration ? adorationDuJour(adoration, veille.id, d) : { psaume: null, cantique: null };
  const enTete = [];
  if (ado.psaume) enTete.push({ titre: `Le psaume du jour : ${ado.psaume.titre}`, texte: `Lis à voix haute ${ado.psaume.ref.replace(/^Psaume/, 'le Psaume')}. ${ado.psaume.guide}` });
  if (ado.cantique?.refrain) enTete.push({ titre: `À chanter : ${ado.cantique.titre}`, texte: `Chante, ou dis lentement : ${ado.cantique.refrain.join(' ')} (${ado.cantique.auteur})` });
  const lib = LIBELLES[veille.id] || {};
  const phases = veille.phases.map((p) => {
    const cle = clePhase(p.titre), duTheme = (cle && jour?.phases?.[cle]) || [];
    const devant = cle === 'adoration' ? enTete : [];
    const sujets = choisirSujets(duTheme, p.sujets, isFinite(gardes) ? gardes - devant.length : gardes, semaineAbsolue(d), veille.id + ':' + p.titre);
    return { ...p, titre: lib[p.titre] || p.titre, theme: duTheme.length ? (jour.priere || 'prière pour ' + jour.court) : null, sujets: [...devant, ...sujets].slice(0, gardes) };
  });
  const proclamations = melanger(veille.proclamations || [], veille.id + ':proc:' + semaineAbsolue(d)).slice(0, PROCLAMATIONS[taille] ?? Infinity);
  return { ...veille, phases, proclamations, verset: jour?.versets?.[veille.id.replace('veille-', '')] || veille.verset, jourCycle: jour, taille };
}

// Nombre de sujets d'une veille, pour annoncer la durée avant de commencer.
export const nombreDeSujets = (v) => v.phases.reduce((s, p) => s + p.sujets.length, 0) + (v.proclamations || []).length;

// Les 7 jours de la semaine en cours, avec ceux où la personne a prié (au moins une veille).
export function semaineEnCours(aiPrie, d = new Date()) {
  const lundi = new Date(d); lundi.setHours(0, 0, 0, 0); lundi.setDate(lundi.getDate() - (jourDuCycle(d) - 1));
  const cles = new Set(Object.entries(aiPrie || {}).filter(([k]) => k.startsWith('veille-')).flatMap(([, dates]) => dates.map((x) => new Date(x).toDateString())));
  return Array.from({ length: 7 }, (_, i) => {
    const j = new Date(lundi); j.setDate(lundi.getDate() + i);
    return { numero: i + 1, date: j, prie: cles.has(j.toDateString()), aujourdhui: j.toDateString() === d.toDateString(), futur: j > d && j.toDateString() !== d.toDateString() };
  });
}

// ----- Combien de fois, et combien de jours de suite -----
const jourCle = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

// Les jours (AAAA-MM-JJ) où la personne a prié au moins une veille, du plus récent au plus ancien.
export function joursPries(aiPrie) {
  const s = new Set(Object.entries(aiPrie || {}).filter(([k]) => k.startsWith('veille-')).flatMap(([, ds]) => ds.map((x) => jourCle(new Date(x)))));
  return [...s].sort().reverse();
}

// La série en cours : combien de jours de suite, en comptant aujourd'hui s'il est déjà prié.
// Si aujourd'hui n'est pas encore prié, la série d'hier reste vivante jusqu'à ce soir : on ne punit pas
// quelqu'un qui n'a pas encore eu le temps de prier aujourd'hui.
export function serieEnCours(aiPrie, d = new Date()) {
  const jours = new Set(joursPries(aiPrie));
  const j = new Date(d); j.setHours(12, 0, 0, 0);
  let serie = 0, pasEncorePrieAujourdhui = !jours.has(jourCle(j));
  if (pasEncorePrieAujourdhui) j.setDate(j.getDate() - 1);
  while (jours.has(jourCle(j))) { serie++; j.setDate(j.getDate() - 1); }
  return { serie, pasEncorePrieAujourdhui, enDanger: pasEncorePrieAujourdhui && serie > 0 };
}

// Le meilleur enchaînement de toute la vie de la personne (pour qu'elle voie ce qu'elle a déjà tenu).
export function meilleureSerie(aiPrie) {
  const jours = joursPries(aiPrie).reverse().map((x) => new Date(x + 'T12:00:00').getTime());
  let best = 0, cur = 0, prev = null;
  for (const t of jours) { cur = prev !== null && Math.round((t - prev) / 864e5) === 1 ? cur + 1 : 1; best = Math.max(best, cur); prev = t; }
  return best;
}

// Une phrase d'encouragement qui dit la vérité, sans culpabiliser.
export function phraseDeSerie({ serie, enDanger }, totalFois) {
  if (!totalFois) return "Ta première veille t'attend. Un petit pas suffit pour commencer : choisis « Court ».";
  if (enDanger) return `Tu as prié ${serie} jour${serie > 1 ? 's' : ''} de suite. Prie aujourd'hui pour garder ta série.`;
  if (serie >= 30) return `${serie} jours de suite. Tu es devenu un veilleur fidèle.`;
  if (serie >= 7) return `${serie} jours de suite. Une semaine entière : continue.`;
  if (serie >= 2) return `${serie} jours de suite. Chaque jour compte.`;
  if (serie === 1) return "Tu as prié aujourd'hui. Reviens demain pour commencer une série.";
  return 'Reprends dès aujourd\'hui : un jour de plus, et la série repart.';
}

// ----- L'adoration du jour : un psaume (texte pris dans la Bible) et, si on en a un, un cantique -----
export function adorationDuJour(adoration, veilleId, d = new Date()) {
  const cle = veilleId.replace('veille-', ''), jour = jourDuCycle(d);
  // Trois psaumes parlent du thème de chaque jour (un par veille) : on les fait tourner d'une semaine à l'autre.
  const duJour = (adoration?.psaumes || []).filter((x) => x.jour === jour);
  const ordre = ['aube', 'midi', 'soir'];
  const psaume = duJour.length ? duJour[(semaineAbsolue(d) + ordre.indexOf(cle) + Math.max(0, duJour.findIndex((x) => x.veille === cle))) % duJour.length] : null;
  const candidats = (adoration?.cantiques || []).filter((c) => c.veilles?.includes(cle));
  // Un cantique qui correspond au thème du jour passe d'abord ; sinon on fait tourner les autres selon le jour.
  const dujour = candidats.filter((c) => c.jours?.includes(jour));
  const liste = dujour.length ? dujour : candidats;
  const cantique = liste.length ? liste[jour % liste.length] : null;
  return { psaume, cantique };
}
