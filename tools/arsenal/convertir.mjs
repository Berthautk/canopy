// Convertit les données de « L'Arsenal de la Sentinelle » (fichier HTML du propriétaire) en contenus Yeshaya.
// Usage : node tools/arsenal/convertir.mjs <dossier des JSON extraits du HTML>
// 1. Les références passent de la numérotation bible.com (anglaise) à celle de la Louis Segond 1910 imprimée.
// 2. Toute citation « … » (Réf) qui n'est pas le texte LSG est remplacée par le texte LSG correspondant.
// 3. Les lignes « §Réf | texte » deviennent des références seules : l'app affiche le texte depuis la Bible.
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const R = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), A = process.argv[2];
const lire = (n) => JSON.parse(fs.readFileSync(`${A}/${n}.json`, 'utf8'));
const index = JSON.parse(fs.readFileSync(R + '/public/bible/index.json'));
const src = fs.readFileSync(R + '/src/bible/references.js', 'utf8').replace(/^import index from .*$/m, `const index = ${JSON.stringify(index)};`);
const { lireReference, ecrireReference, PAR_CODE } = await import('data:text/javascript,' + encodeURIComponent(src));
const TABLE = JSON.parse(fs.readFileSync(R + '/tools/arsenal/numerotation-kjv-vers-lsg.json'));
const livres = {};
const chap = (code, c) => (livres[code] ??= JSON.parse(fs.readFileSync(R + '/public/bible/' + PAR_CODE[code].fichier))).chapitres[c - 1] || [];
const journal = { renumerotations: [], citations: [] };

// ---- 1. Références ----
const RE_REF = /((?:[1-3]\s?)?[A-ZÉÈ][a-zéèëêïîôûüç]+\.?)\s(\d{1,3}):(\d{1,3})(?:\s?([-–])\s?(\d{1,3}))?([a-c])?/g;
const map = (code, c, v) => TABLE[`${code}.${c}.${v}`] || [c, v];
function convRef(m, livre, c, v, tiret, fin) {
  const r = lireReference(`${livre} ${c}:${v}`); if (!r) return m;
  const [c2, v2] = map(r.code, +c, +v); let suite = '';
  if (fin) { const [cf, vf] = map(r.code, +c, +fin); suite = cf === c2 ? `${tiret}${vf}` : `${tiret}${cf}:${vf}`; }
  const res = `${livre} ${c2}:${v2}${suite}`;
  if (res !== m.replace(/[a-c]$/, '')) journal.renumerotations.push(`${m} → ${res}`);
  return res;
}
const refs = (t) => t.replace(RE_REF, (m, livre, c, v, tiret, fin) => convRef(m, livre, c, v, tiret, fin));

// ---- 2. Citations ----
const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[’]/g, "'").replace(/[^a-z0-9' ]/g, ' ').replace(/\s+/g, ' ').trim();
function texteLSG(refTxt) {
  const r = lireReference(refTxt.replace(/[a-c]$/, '')); if (!r) return null;
  const ch = chap(r.code, r.c); return ch.slice((r.v || 1) - 1, r.fin || r.v || ch.length).join(' ').replace(/\n/g, ' ').replace(/\s+/g, ' ').trim();
}
function citationLSG(q, lsg) {
  // Zone du verset qui correspond le mieux à la citation, étendue jusqu'aux limites de la proposition (ponctuation).
  const qset = new Set(norm(q).split(' ')), mots = lsg.split(' ');
  const ok = mots.map((m) => norm(m).split(' ').some((w) => w && qset.has(w)));
  let best = [0, mots.length - 1, 0];
  for (let i = 0; i < mots.length; i++) if (ok[i]) {
    let j = i, n = 1, trou = 0;
    for (let k = i + 1; k < mots.length && trou <= 3; k++) { if (ok[k]) { j = k; n++; trou = 0; } else trou++; }
    if (n > best[2]) best = [i, j, n];
  }
  let [a, b] = best; const fin = (m) => /[,;:.!?]$/.test(m);
  for (let k = 0; k < 8 && a > 0 && !fin(mots[a - 1]); k++) a--;
  for (let k = 0; k < 8 && b < mots.length - 1 && !fin(mots[b]); k++) b++;
  if (a > 0 && !fin(mots[a - 1])) a = best[0];
  return mots.slice(a, b + 1).join(' ').replace(/^[,;:]\s*/, '').replace(/[,;:.]\s*$/, '').replace(/^\p{Ll}/u, (x) => x.toUpperCase());
}
// Passages LSG choisis à la main pour les citations qui n'étaient pas le texte LSG (vérifiés ci-dessous mot pour mot).
const F = '\u202f';
const CHOIX = {
  'Juges 5:20': 'Des cieux on combattit, De leurs sentiers les étoiles combattirent contre Sisera',
  'Psaume 49:16': 'Mais Dieu sauvera mon âme du séjour des morts',
  'Joël 2:25': 'Je vous remplacerai les années Qu’ont dévorées la sauterelle',
  'Actes 16:31': 'Crois au Seigneur Jésus, et tu seras sauvé, toi et ta famille',
  'Josué 1:3': 'Tout lieu que foulera la plante de votre pied, je vous le donne',
  'Actes 20:28': 'Prenez donc garde à vous-mêmes, et à tout le troupeau',
  'Matthieu 13:25': 'Son ennemi vint, sema de l’ivraie parmi le blé',
  'Deutéronome 28:7': `L’Éternel te donnera la victoire sur tes ennemis qui s’élèveront contre toi${F}; ils sortiront contre toi par un seul chemin, et ils s’enfuiront devant toi par sept chemins`,
  'Éphésiens 6:12': `Car nous n’avons pas à lutter contre la chair et le sang, mais contre les dominations, contre les autorités, contre les princes de ce monde de ténèbres, contre les esprits méchants dans les lieux célestes`,
  'Matthieu 3:16': 'Il sortit de l’eau',
  'Actes 8:38-39': 'Quand ils furent sortis de l’eau',
  'Psaume 46:11': 'Arrêtez, et sachez que je suis Dieu',
};
for (const [ref, t] of Object.entries(CHOIX)) {
  if (!norm(texteLSG(ref)).includes(norm(t))) throw new Error('Passage choisi absent de la LSG : ' + ref);
}
function citations(t) {
  return t.replace(/«\s*([^»]{6,}?)\s*»(\s*\()([^)]+)\)/g, (m, q, esp, refTxt) => {
    const premiere = refTxt.split(/[;·]/)[0].trim(), lsg = texteLSG(premiere); if (!lsg) return m;
    const qn = norm(q.replace(/\.\.\.|…/g, ' ')), ln = norm(lsg), mots = qn.split(' ');
    if (ln.includes(qn) || mots.filter((w) => ln.includes(w)).length / mots.length >= 0.9) return m;  // déjà fidèle
    const nouv = CHOIX[premiere] ?? citationLSG(q, lsg);
    if (!CHOIX[premiere]) journal.a_verifier = (journal.a_verifier || 0) + 1;
    journal.citations.push({ reference: premiere, avant: q, apres: nouv });
    return `« ${nouv} »${esp}${refTxt})`;
  });
}
const T = (s) => (typeof s === 'string' ? citations(refs(s)) : s);
const items = (l) => (l || []).map((x) => ({ titre: T(x.t), texte: T(x.c) }));

// ---- 3. Écriture des contenus ----
const ecrire = (rel, d) => { const p = path.join(R, 'content', rel); fs.mkdirSync(path.dirname(p), { recursive: true }); fs.writeFileSync(p, JSON.stringify(d, null, 1)); };
const SOURCE = { auteur: "L'Arsenal de la Sentinelle", autorisation: 'oui', source: "Arsenal de la Sentinelle (application du propriétaire de Yeshaya)", date_ajout: '2026-11-14' };
const NOMS = lire('PHASE_NAMES'), GUIDE = lire('PHASE_GUIDE');
const versetSeul = (v) => { const m = v.match(/—\s*(.+)$/); return m ? refs(m[1].trim()) : null; };

// Guide des phases (le Notre Père)
ecrire('veilles/guide-des-phases.json', { id: 'guide-des-phases', titre: 'Prier avec le Notre Père',
  phases: Object.fromEntries(Object.entries(GUIDE).map(([k, g]) => [k, { titre: g.title, texte: T(g.text) }])),
  noms: { 0: 'Annulation', 1: 'Adoration', ...NOMS, proc: 'Proclamations' }, minuteur: lire('TIMER_PHASES').map((t) => ({ nom: t.name, secondes: t.secs })), ...SOURCE });

// Les trois veilles
const IMG_VEILLE = { aube: '/assets/paysages/lever-soleil-collines.webp', midi: '/assets/paysages/collines-vertes.webp', soir: '/assets/paysages/coucher-soleil-montagnes.webp' };
for (const [i, n] of ['AUBE', 'MIDI', 'SOIR'].entries()) {
  const v = lire(n);
  const ph = (num, p) => ({ num, titre: T(p.title), sous_titre: T(p.subtitle || ''), texte: T(p.desc || ''), sujets: items(p.items) });
  ecrire(`veilles/${v.key}.json`, { id: 'veille-' + v.key, ordre: i + 1, titre: v.title, heures: v.hours, theme: v.theme, verset: versetSeul(v.verset), image: IMG_VEILLE[v.key],
    introduction: T(v.intro), phases: [ph('0', v.phase0), ph('1', v.phase1), ...Object.entries(v.phases).map(([k, p]) => ph(k, p))],
    proclamations: items(v.proclamations), ...SOURCE });
}

// Profils -> thèmes de prière (classés par catégorie)
const CAT = { maris: 'Couple et famille', femmes: 'Couple et famille', parents: 'Couple et famille', enfants: 'Couple et famille', 'fiancés': 'Couple et famille',
  'célibataires': 'Couple et famille', sansenfants: 'Couple et famille', avecenfants: 'Couple et famille', 'élèves': 'Études et travail', 'étudiants': 'Études et travail',
  'chômeurs': 'Études et travail', professionnels: 'Études et travail', serviteurs: 'Église et ministère', malades: 'Épreuves', deuil: 'Épreuves',
  occultisme: 'Épreuves', salut: 'Salut et évangélisation', ames: 'Salut et évangélisation' };
const IMG = { maris: 'famille-quotidien/mariage', femmes: 'famille-quotidien/couple-en-priere', parents: 'famille-quotidien/famille-lecture', enfants: 'famille-quotidien/mere-et-enfants',
  'fiancés': 'temoignage/couple-marie', 'célibataires': 'vie-chretienne/femme-en-priere', sansenfants: 'famille-quotidien/couple-en-priere', avecenfants: 'priere/priere-en-famille',
  'élèves': 'famille-quotidien/mere-aide-aux-devoirs', 'étudiants': 'nouveau-converti/etude-de-la-bible', 'chômeurs': 'temoignage/nouveau-depart', professionnels: 'famille-quotidien/travail-ordinateur',
  serviteurs: 'eglise/pasteur-predication', malades: 'famille-quotidien/visite-a-hopital', deuil: 'famille-quotidien/consolation-deuil', occultisme: 'temoignage/chaines-brisees',
  salut: 'priere/priere-en-famille', ames: 'evangelisation/partage-bible-dans-la-rue' };
const slug = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const P = lire('PROFILES');
lire('PROFILE_ORDER').forEach((k, i) => {
  const p = P[k];
  ecrire(`prieres/${slug(k)}.json`, { id: 'priere-' + slug(k), categorie: CAT[k], ordre: 10 + i, titre: p.label, nom_court: p.name, image: `/assets/${IMG[k]}.webp`,
    resume: `Sujets de prière pour : ${p.label.toLowerCase()}, en suivant le Notre Père.`,
    phases: Object.entries(p.phases).filter(([, l]) => l.length).map(([num, l]) => ({ num, titre: NOMS[num], sujets: items(l) })), ...SOURCE });
});

// Fiches de combat spirituel
lire('COMBAT_DATA').forEach((c, i) => ecrire(`combat/${c.id}.json`, { id: 'combat-' + c.id, ordre: i + 1, titre: c.title.replace(/^Fiche de (prière|restauration)\s*(\d\s*)?:\s*/i, '').replace(/^./, (x) => x.toUpperCase()),
  emoji: c.emoji, versets: (refs(c.refs || '').match(RE_REF) || []), introduction: T(c.intro || ''), sujets: (c.items || []).map((t) => ({ texte: T(typeof t === 'string' ? t : t.c || t.t) })), ...SOURCE }));

// Enseignements écrits
const THEME_E = { 'ruses-malin': 'Combat spirituel', 'ko-ennemi': 'Combat spirituel', 'combat-spirituel-2': 'Combat spirituel', evangelisation: 'Évangélisation',
  'differents-cieux': 'Doctrine', 'origine-demons': 'Doctrine', 'doctrine-baptemes': 'Doctrine', 'retraite-spirituelle': 'Vie de prière', 'nuit-de-priere': 'Vie de prière', 'jeune-biblique': 'Vie de prière' };
const IMG_E = { 'ruses-malin': 'symboles/bible-dans-la-lumiere', 'ko-ennemi': 'temoignage/victoire-bras-leves', 'combat-spirituel-2': 'priere/combat-spirituel', evangelisation: 'evangelisation/partage-bible-dans-la-rue',
  'differents-cieux': 'paysages/coucher-soleil-montagnes', 'origine-demons': 'temoignage/chaines-brisees', 'doctrine-baptemes': 'eglise/bapteme-en-bassin', 'retraite-spirituelle': 'paysages/chemin-oliviers',
  'nuit-de-priere': 'priere/priere-avec-larmes', 'jeune-biblique': 'priere/mains-levees' };
lire('ENSEIGNEMENT_DATA').forEach((e) => ecrire(`enseignements/${e.id}.json`, { id: 'enseignement-' + e.id, titre: e.title, theme: THEME_E[e.id] || 'Enseignement', serie: "L'Arsenal de la Sentinelle",
  resume: T(e.sub), image: `/assets/${IMG_E[e.id] || 'objets-bibliques/bible-ouverte'}.webp`, verset_de_base: refs(e.verset_base?.ref || '') || null,
  objectifs: (e.objectifs || []).map(T), introduction: T(e.intro || ''),
  sections: e.sections.map((s) => ({ numero: String(s.num), titre: T(s.title), references: s.refs ? (refs(s.refs).match(RE_REF) || []) : [], transition: T(s.transition || '') || undefined,
    blocs: s.items.map((it) => { if (typeof it !== 'string') return { texte: T(JSON.stringify(it)) };
      if (it.startsWith('§')) { const [r] = it.slice(1).split('|'); return lireReference(refs(r.trim())) ? { verset: refs(r.trim()) } : { sous_titre: T(r.trim()) }; }
      return { texte: T(it) }; }) })), lecture_minutes: Math.max(3, Math.round(JSON.stringify(e).length / 1400)), ...SOURCE }));

// Plan thématique 365 jours
const TRIM = lire('TRIMESTRES');
ecrire('plans/thematique.json', { id: 'thematique', titre: 'Plan thématique (Arsenal)', description: 'Un passage et un thème par jour, en quatre étapes : fondements, maturité, sanctification, mission.',
  trimestres: TRIM.map((t) => ({ nom: t.name, mois: t.months })), jours: lire('PLAN').map(([ref, theme]) => ({ reference: refs(ref), theme })), ...SOURCE });

fs.writeFileSync(path.join(R, 'tools/arsenal/journal-conversion.json'), JSON.stringify(journal, null, 1));
console.log(`références renumérotées : ${journal.renumerotations.length} ; citations remplacées par le texte LSG : ${journal.citations.length}`);
