# Éléments graphiques extraits des planches

Généré par `tools/design/` à partir des planches A à T (voir `design/planches/`).
Tous les fichiers sont au format **WebP**, dans `public/assets/<dossier>/`.

**Total : 303 fichiers, 5.8 Mo.** Plus gros fichier : 51 Ko (limite 200 Ko). Plus grosse icône : 2 Ko (limite 50 Ko).

| Dossier | Nombre | Exemples |
|---|---|---|
| `audio/` | 16 | homme-ecoute-au-casque, casque-et-bible, micro-de-studio, femme-ecouteurs… |
| `eglise/` | 16 | louange-assemblee, pasteur-predication, chorale, batteur… |
| `etude-biblique/` | 10 | la-sainte-bible, bible-annotee, livres-des-testaments, rouleau-ancien… |
| `evangelisation/` | 10 | partage-bible-dans-la-rue, dialogue-entre-femmes, dialogue-avec-un-ancien, don-de-livre… |
| `famille-quotidien/` | 16 | mariage, famille-lecture, couple-en-priere, mere-et-enfants… |
| `icones/` | 27 | accueil, bible, priere, meditations… |
| `interface/` | 9 | fond-montagnes-aube, fond-lumiere-feuilles, fond-ciel-bleu, fond-bible-croix… |
| `jesus/` | 8 | jesus-portrait-serein, jesus-main-tendue, jesus-regard-vers-le-ciel, jesus-en-priere… |
| `jeux/` | 11 | banniere-quiz-biblique, banniere-duel-biblique, banniere-enigme-biblique, personnage-moise… |
| `lieux-bibliques/` | 16 | tombeau-ouvert, jerusalem-vue-generale, temple, lac-et-olivier… |
| `nouveau-converti/` | 12 | joie-de-la-rencontre, accompagnement-pasteur, bapteme, etude-de-la-bible… |
| `objets-bibliques/` | 20 | bible-ouverte, bible-noire-croix, livres-et-diplome, rouleau-parchemin… |
| `objets-quotidien/` | 20 | telephone, bible-cuir, bible-ouverte-sur-table, carnet-et-stylo… |
| `paysages/` | 15 | lever-soleil-collines, montagne, coucher-soleil-lac, chemin-oliviers… |
| `personnages/` | 20 | homme-en-priere, femme-foulard-en-priere, jeune-homme-joyeux, fille-en-priere… |
| `priere/` | 12 | femme-en-priere, mains-levees, combat-spirituel, priere-en-famille… |
| `scenes-bibliques/` | 16 | guerison-aveugle, sermon-sur-la-montagne, multiplication-des-pains, tempete-apaisee… |
| `symboles/` | 16 | croix-coucher-de-soleil, colombe-dans-le-ciel, bible-dans-la-lumiere, chemin-sur-la-colline… |
| `temoignage/` | 16 | temoignage-au-micro, avant-apres, reconnaissance, victoire-bras-leves… |
| `vie-chretienne/` | 17 | femme-en-priere, homme-louange-soleil, femme-lit-la-bible, homme-etudie-la-bible… |

## Éléments non découpés ou exclus

Ces éléments n'ont pas été extraits. Ceux marqués « à refaire » doivent être régénérés à part ou dessinés en SVG/CSS.

| Planche-n° | Raison |
|---|---|
| G-28 | planche d'éléments décoratifs en mosaïque (vagues, colombe, pastilles) : à refaire en SVG/CSS |
| H-04 | panneau composite (Moïse, Abraham) : portraits découpés à la main séparément |
| H-05 | panneau composite (6 héros) : portraits découpés à la main séparément |
| H-06 | panneau composite types de jeux + niveaux + récompenses avec textes incrustés |
| H-07 | panneau composite indices et aides avec textes incrustés |
| H-08 | panneau composite résultats avec textes incrustés |
| H-09 | bannière « Bravo ! » avec confettis : utilisable seulement entière, texte incrusté |
| J-01 | deux photos collées sans marge : séparées en deux fichiers |
| S-06 | contient le texte de Jean 3:16 incrusté (règle : aucun verset tiré d'une image) |
| S-08 | frise « grandes étapes de la Bible » avec textes incrustés non vérifiés |
| S-10 | onglets des livres avec texte déformé (« Lévitique » mal écrit) |
| S-11 | contient le texte du Psaume 23 incrusté |
| S-12 | contient le texte de Romains 12 incrusté |
| S-15 | contient le texte du Psaume 119:105 incrusté |
| Q (31 éléments) | Éléments d'interface (boutons, cases, interrupteurs, barre de navigation, cadres) mal isolés sur la planche : ils seront faits en CSS/SVG en phase 1. |

## Points d'attention

- **Icônes (`icones/`)** : environ 116 px, sur fond blanc (pas de transparence). Bien sur fond clair ; pour le mode sombre, il faudra des versions SVG ou détourées.
- **`lieux-bibliques/jerusalem-vue-generale.webp`** : montre le Dôme du Rocher, construit au VIIᵉ siècle, donc anachronique pour une scène biblique. À utiliser comme « Jérusalem aujourd'hui » ou à régénérer.
- **`jeux/personnage-*.webp`** : le prénom est incrusté dans l'image (Moïse, Abraham, David…). Vérifié : orthographe correcte.
- **`temoignage/avant-apres.webp`** : image en deux parties, voulue ainsi (avant / après).
- **Aucun verset n'est lu depuis une image** : les vignettes contenant un texte biblique incrusté ont été exclues.

## Icônes PWA

Dans `public/icons/`, découpées depuis `design/identite/Logo_et_icone_Yeshaya_512_et_48.webp` : `icon-192.png`, `icon-512.png` (coins arrondis), `icon-maskable-192.png`, `icon-maskable-512.png` (logo dans la zone sûre de 80 %), `apple-touch-icon.png`, `favicon-32.png`, `favicon-48.png` et `public/favicon.ico`. Contrôle à 48×48 : « YESHAYA » est lisible ; le slogan ne l'est pas (normal à cette taille).
