// Les veilles de prière : le même squelette (le Notre Père), mais un thème différent chaque jour de la semaine,
// et trois tailles (court, normal, complet). Fonctions pures : elles ne lisent rien toutes seules,
// ce qui permet de les tester sans navigateur (voir tools/securite/… et les essais de ce chantier).

export const TAILLES = [
  { id: 'court', nom: 'Court', minutes: 8, desc: "Un sujet par étape. Quand on n'a que quelques minutes." },
  { id: 'normal', nom: 'Normal', minutes: 22, desc: 'Trois sujets par étape. Le rythme de chaque jour.' },
  { id: 'complet', nom: 'Complet', minutes: 50, desc: 'Tous les sujets. Pour un vrai temps de veille.' },
];
const PAR_ETAPE = { court: 1, normal: 3, complet: Infinity };
const PROCLAMATIONS = { court: 2, normal: Infinity, complet: Infinity };
const SUJETS_DU_THEME = { court: 2, normal: Infinity, complet: Infinity };

// Jour 1 = lundi … jour 7 = dimanche (le dimanche est le 7e jour, pas le 1er).
export const jourDuCycle = (d = new Date()) => ((d.getDay() + 6) % 7) + 1;

// La veille, telle qu'elle doit s'afficher aujourd'hui :
//  - une phase « Prière du jour » (le thème de la semaine) insérée juste après l'Adoration,
//  - le verset du jour pour cette veille,
//  - le nombre de sujets adapté à la taille choisie.
export function veilleDuJour(veille, cycle, d = new Date(), taille = 'complet') {
  const jour = cycle.find((x) => x.numero === jourDuCycle(d));
  const cle = veille.id.replace('veille-', '');
  const gardes = PAR_ETAPE[taille] ?? Infinity;
  let phases = veille.phases.map((p) => ({ ...p, sujets: p.sujets.slice(0, gardes) }));
  let verset = veille.verset;
  if (jour?.veilles?.[cle]?.length) {
    const phaseJour = {
      num: 'jour', titre: `Prière du jour : ${jour.court}`, sous_titre: `Jour ${jour.numero} sur 7 · ${jour.jour}`,
      texte: jour.accroche, sujets: jour.veilles[cle].slice(0, SUJETS_DU_THEME[taille] ?? Infinity),
    };
    const i = phases.findIndex((p) => /adoration/i.test(p.titre));
    phases.splice(i >= 0 ? i + 1 : 1, 0, phaseJour);
    verset = jour.versets?.[cle] || verset;
  }
  const proclamations = (veille.proclamations || []).slice(0, PROCLAMATIONS[taille] ?? Infinity);
  return { ...veille, phases, proclamations, verset, jourCycle: jour || null, taille };
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
