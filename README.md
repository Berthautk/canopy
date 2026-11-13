# Yeshaya — « L'Éternel est salut »

Application chrétienne d'édification, d'évangélisation, de prière et de lecture de la Bible.

**100 % gratuite · aucune publicité · aucun compte · données uniquement sur le téléphone · fonctionne hors ligne.**

> Yeshaya est le nom hébreu du prophète Isaïe. Il signifie : « l'Éternel est salut ».

## État du projet

| Phase | Contenu | État |
|---|---|---|
| 0 | Nettoyage du dépôt, initialisation, extraction des éléments graphiques, icônes PWA | Terminée, en attente de validation |
| 1 | Coquille PWA, design system, navigation 5 onglets, Accueil, À propos, Paramètres | À faire |
| 2 | Bible Louis Segond 1910 complète | À faire |
| 3 | Lecteur audio, hors ligne, partage | À faire |
| 4 | Prière, Grandir, Nouveau converti, Évangéliser, Dialogues | À faire |
| 5 | Jouer et apprendre (quiz) | À faire |
| 6 | Sauvegarde, tests 360 px / réseau lent, déploiement Cloudflare Pages | À faire |

## Organisation du dépôt

```
design/            maquettes de référence (non déployées) : écrans 1–34, planches A–T, identité visuelle
  ASSETS.md        inventaire des éléments graphiques extraits et liste de ce qui reste à refaire
public/
  assets/          illustrations et icônes en WebP, rangées par thème
  icons/           icônes PWA (192, 512, maskable, apple-touch, favicons)
  manifest.webmanifest
tools/design/      scripts Python de découpe des planches (reproductibles)
index.html         page provisoire (la vraie coquille arrive en phase 1)
```

## Identité visuelle

| Couleur | Code |
|---|---|
| Bleu nuit | `#172B49` |
| Or doux | `#C9A85B` |
| Ivoire | `#F6F1E6` |
| Vert sauge | `#347C75` |
| Blanc | `#FFFFFF` |
| Gris texte | `#454B55` |

Polices : **Poppins** (titres, boutons, menus) et **Roboto** (textes, versets). Elles seront auto-hébergées, sans appel à Google Fonts.

## Régénérer les éléments graphiques

Les zips de livraison ne sont pas versionnés (trop lourds). Pour refaire la découpe :

```bash
python3 -I tools/design/segment.py <dossier Planches_A_a_T> <sortie_decoupes>
python3 -I tools/design/export.py  <dossier Planches_A_a_T> <sortie_decoupes>/_boites.json public/assets
```

Les noms de fichiers et les exclusions sont définis dans `tools/design/noms.py`.
