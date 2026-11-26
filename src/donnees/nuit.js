// Nuit de prière : le plan se construit à partir du thème de la SEMAINE.
// Fonctions pures (testables sans navigateur). Une nuit n'est jamais identique à la précédente :
// le thème principal change chaque semaine, et les sujets tournent dans les rubriques.

export const LONGUEURS = [
  { id: 'courte', titre: 'Courte', detail: 'environ 3 h', facteur: 0.45 },
  { id: 'moyenne', titre: 'Moyenne', detail: 'environ 5 h', facteur: 0.75 },
  { id: 'complete', titre: 'Complète', detail: 'environ 6 h 30', facteur: 1 },
];

// Numéro de semaine (norme ISO : la semaine commence le lundi).
export function semaineISO(d = new Date()) {
  const t = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
  const j = t.getUTCDay() || 7;
  t.setUTCDate(t.getUTCDate() + 4 - j);
  const debut = new Date(Date.UTC(t.getUTCFullYear(), 0, 1));
  return Math.ceil(((t - debut) / 864e5 + 1) / 7);
}

// Le thème de la semaine : chaque semaine met en avant l'un des sept thèmes des veilles.
export const themeDeLaSemaine = (cycle, d = new Date()) => cycle[semaineISO(d) % cycle.length];

// La nuit conseillée : le vendredi soir (la veille d'un jour de repos).
export function prochaineNuit(d = new Date()) {
  const n = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  n.setDate(n.getDate() + ((5 - n.getDay() + 7) % 7));
  return n;
}

const CLES = ['regne', 'volonte', 'pain', 'pardon', 'tentation', 'delivre', 'grace'];   // sans l'adoration : on adore dans la louange
const arrondi5 = (m) => Math.max(5, Math.round(m / 5) * 5);
const hhmm = (min) => { const m = ((min % 1440) + 1440) % 1440; return `${String(Math.floor(m / 60)).padStart(2, '0')}h${String(m % 60).padStart(2, '0')}`; };
export const minutesDe = (hm) => { const [h, m] = String(hm || '22:00').split(':').map(Number); return (h || 0) * 60 + (m || 0); };

// Les sujets d'un thème, pour la rubrique d'intercession : `n` sujets, qui changent d'une semaine à l'autre.
export function sujetsDuTheme(jour, semaine, n, principal) {
  const liste = [];
  const debut = semaine % CLES.length;
  for (let i = 0; i < CLES.length && liste.length < n; i++) {
    const cle = CLES[(debut + i) % CLES.length];
    const s = jour.phases?.[cle] || [];
    if (!s.length) continue;
    liste.push(s[(semaine + i) % s.length]);
    if (principal && liste.length < n) liste.push(s[(semaine + i + 1) % s.length]);
  }
  // Thème principal : on complète avec l'adoration du thème et le reste, jusqu'à n sujets.
  for (const cle of CLES) { for (const s of jour.phases?.[cle] || []) { if (liste.length >= n) break; if (!liste.includes(s)) liste.push(s); } }
  return liste.slice(0, n);
}

// Construit la nuit : liste des phases avec durée, horaire prévu, consigne et sujets.
export function construireNuit({ cycle, adoration, contenu, d = new Date(), longueur = 'complete', debut = '22:00', reglages = {}, notes = [] }) {
  const f = (LONGUEURS.find((x) => x.id === longueur) || LONGUEURS[2]).facteur;
  const w = semaineISO(d);
  const theme = themeDeLaSemaine(cycle, d);
  const P = contenu.phases;
  const phases = [];
  const ajouter = (id, titre, minutes, p) => phases.push({ id, titre, minutes: reglages[id] ?? arrondi5(minutes * f), ...p });

  ajouter('ouverture', P.ouverture.titre, P.ouverture.minutes, { consigne: P.ouverture.consigne, aide: P.ouverture.aide, sujets: P.ouverture.sujets });
  ajouter('graces', P.graces.titre, P.graces.minutes, { consigne: P.graces.consigne, aide: P.graces.aide, sujets: P.graces.sujets });
  ajouter('repentance', P.repentance.titre, P.repentance.minutes, { consigne: P.repentance.consigne, aide: P.repentance.aide, sujets: P.repentance.sujets });

  // Louange : trois psaumes d'adoration, différents chaque semaine, au milieu des temps fixes.
  const psaumes = adoration?.psaumes || [];
  const trois = psaumes.length ? [0, 1, 2].map((i) => psaumes[(w * 3 + i) % psaumes.length]) : [];
  const sujetsPsaumes = trois.map((p) => ({ titre: `Psaume : ${p.titre}`, texte: `Lis à voix haute ${p.ref}. ${p.guide}` }));
  ajouter('louange', P.louange.titre, P.louange.minutes, { consigne: P.louange.consigne, aide: P.louange.aide, sujets: [...P.louange.debut, ...sujetsPsaumes, ...P.louange.fin] });

  // Prière de la Parole : trois promesses qui changent chaque semaine.
  const pr = P.parole.promesses;
  ajouter('parole', P.parole.titre, P.parole.minutes, { consigne: P.parole.consigne, aide: P.parole.aide, sujets: [0, 1, 2].map((i) => pr[(w + i * 3) % pr.length]) });

  // Intercession : le thème de la semaine d'abord (long), puis les six autres rubriques.
  ajouter('theme', `Prier pour ${theme.court}`, 50, {
    theme: theme.court, consigne: `C'est le thème de cette semaine : ${theme.court}. ${theme.accroche.replace("Aujourd'hui", 'Cette nuit')}`,
    aide: 'Prends ton temps sur chaque sujet. Nomme des personnes, des situations précises. Reviens sur ce que tu as prié cette semaine dans les veilles.', sujets: sujetsDuTheme(theme, w, 12, true),
  });
  for (const j of cycle) {
    if (j.numero === theme.numero) continue;
    ajouter('rubrique-' + j.numero, `Prier pour ${j.court}`, 15, {
      theme: j.court, consigne: j.accroche.replace("Aujourd'hui", 'Cette nuit'), aide: 'Quinze minutes pour cette rubrique : prie les sujets, puis ajoute les noms que Dieu te met à cœur.', sujets: sujetsDuTheme(j, w, 6, false),
    });
  }

  // Ma semaine : les notes écrites dans les veilles, puis des questions simples.
  const dites = notes.slice(0, 4).map((n) => ({ titre: 'Ce que tu as noté', texte: n }));
  ajouter('semaine', P.semaine.titre, P.semaine.minutes, { consigne: P.semaine.consigne, aide: P.semaine.aide, sujets: [...dites, ...P.semaine.sujets] });
  ajouter('ecoute', P.ecoute.titre, P.ecoute.minutes, { consigne: P.ecoute.consigne, aide: P.ecoute.aide, sujets: P.ecoute.sujets });
  ajouter('cloture', P.cloture.titre, P.cloture.minutes, { consigne: P.cloture.consigne, aide: P.cloture.aide, sujets: P.cloture.sujets });

  // Horaires prévus, à partir de l'heure de début choisie.
  let t = minutesDe(debut);
  for (const p of phases) { p.debut = hhmm(t); t += p.minutes; p.fin = hhmm(t); }
  return { theme, semaine: w, phases, total: phases.reduce((s, p) => s + p.minutes, 0), fin: hhmm(t) };
}
