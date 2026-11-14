// Illustrations des enseignements : chaque section reçoit une image (comme dans un livre illustré).
// Une section peut fixer la sienne (« image ») ; sinon, on en choisit une selon les mots de son titre et de son texte.
const A = '/assets/';
const REGLES = [
  [/intercess|brèche|nation|pays|autorités|dirigeant/i, ['priere/priere-pour-la-nation', 'priere/priere-pour-la-ville', 'priere/priere-pour-le-monde']],
  [/prière|prier|prie |genoux|exauc/i, ['priere/priere-et-bible', 'priere/mains-levees', 'priere/femme-en-priere', 'personnages/homme-en-priere', 'priere/priere-en-groupe']],
  [/croix|sang|calvaire|crucifi|sacrifice|agneau/i, ['objets-bibliques/croix-sur-colline', 'symboles/couronne-epines', 'symboles/agneau', 'symboles/croix-coucher-de-soleil']],
  [/ressusc|tombeau|résurrection/i, ['objets-bibliques/tombeau-vide', 'symboles/tombeau-lumineux']],
  [/esprit|colombe|onction|feu/i, ['symboles/colombe-dans-le-ciel', 'objets-bibliques/colombe', 'scenes-bibliques/pentecote']],
  [/bible|parole|écriture|lire|lecture|médit/i, ['etude-biblique/bible-et-tasse', 'etude-biblique/bible-surlignee', 'symboles/bible-dans-la-lumiere', 'objets-bibliques/bible-ouverte']],
  [/église|frères|communion|assemblée|corps de christ/i, ['eglise/assemblee-au-culte', 'eglise/louange-assemblee', 'vie-chretienne/communaute-silhouettes']],
  [/baptême|baptis/i, ['eglise/bapteme-en-bassin', 'vie-chretienne/bapteme']],
  [/cène|pain|coupe/i, ['eglise/table-sainte-cene', 'objets-bibliques/pain-et-raisin', 'symboles/coupe-et-pain']],
  [/mari|femme|couple|mariage|foyer|famille|enfant|parent/i, ['famille-quotidien/famille-lecture', 'famille-quotidien/couple-en-priere', 'vie-chretienne/famille-et-bible', 'famille-quotidien/mere-et-enfants']],
  [/travail|bureau|employ|argent|dîme|impôt|salaire/i, ['famille-quotidien/travail-ordinateur', 'famille-quotidien/couple-et-budget', 'famille-quotidien/commercante-au-marche']],
  [/témoign|évangél|annonc|prêch|ambassadeur/i, ['vie-chretienne/evangelisation-dans-la-rue', 'temoignage/temoignage-au-micro', 'evangelisation/partage-bible-dans-la-rue']],
  [/péché|tentation|chute|convoit|impudic|mensonge/i, ['temoignage/chaines-brisees', 'famille-quotidien/meditation-face-a-la-croix', 'vie-chretienne/priere-au-pied-de-la-croix']],
  [/combat|ennemi|diable|satan|armure/i, ['priere/combat-spirituel', 'personnages/soldat-romain']],
  [/berger|brebis|guide|conduit/i, ['personnages/berger-biblique', 'paysages/moutons-au-paturage', 'objets-bibliques/baton-de-berger']],
  [/grandir|croissance|fruit|semence|sanctific/i, ['symboles/jeune-pousse', 'symboles/semence-dans-la-main', 'paysages/champ-de-ble']],
  [/paix|repos|confiance|espérance/i, ['paysages/coucher-soleil-lac', 'symboles/ancre-esperance', 'paysages/riviere']],
];
const GENERIQUES = ['paysages/lever-soleil-collines', 'paysages/sentier-de-montagne', 'paysages/chemin-oliviers', 'symboles/chemin-sur-la-colline', 'paysages/collines-vertes', 'symboles/mains-ouvertes-lumiere'];

export function illustrations(e) {
  const pris = new Set([e.image]);
  return e.sections.map((s, i) => {
    if (s.image) return s.image;
    const texte = s.titre + ' ' + s.blocs.map((b) => b.sous_titre || b.texte || '').join(' ').slice(0, 800);
    for (const [re, l] of REGLES) {
      if (!re.test(s.titre) && !(re.test(texte) && i > 0)) continue;
      const img = l.map((x) => A + x + '.webp').find((x) => !pris.has(x));
      if (img) { pris.add(img); return img; }
    }
    const g = GENERIQUES.map((x) => A + x + '.webp').find((x) => !pris.has(x)) || A + GENERIQUES[i % GENERIQUES.length] + '.webp';
    pris.add(g); return g;
  });
}
