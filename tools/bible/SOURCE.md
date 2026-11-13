# Bible Louis Segond 1910 : source et vérification

## Source exacte

- **Dépôt :** https://github.com/BibleCorps/FRA-B-LSG1910-PD-UBS (branche `main`, dossier `p.sfm/`)
- **Fichiers :** `FRA[B]LSG1910[PD]UBS-NN-CODE.p.sfm` (format USFM, un fichier par livre)
- **En-tête des fichiers :** « Louis Segond. Public Domain. 1910. Updated 2011 by Moon Sun Kim, 2012 by E. Canales. Updated 2024 to p.sfm. »
- **Éditeur d'origine :** Alliance biblique universelle (UBS). C'est le même texte que celui diffusé par eBible.org sous le code `fraLSG`.
- **Statut :** domaine public.

## Ce que fait la conversion (`convertir.py`)

1. Ne garde que le texte des versets. Les ajouts modernes de cette édition sont retirés : introductions des livres, titres de section, renvois, notes et tableaux.
2. Garde la mise en vers (Psaumes, Proverbes, prophètes…) : chaque vers est séparé par un saut de ligne.
3. Applique la typographie française : espace fine insécable avant `: ; ! ?`. Le texte lui-même n'est pas modifié.
4. Produit `public/bible/index.json` et un fichier JSON par livre : `{ code, nom, chapitres: [[verset1, verset2, …], …] }`.

## Corrections appliquées (et pourquoi)

| Endroit | Problème dans la source | Correction |
|---|---|---|
| Psaume 119:115 | Saisi « \\v 11 5Éloignez » : le numéro était coupé, et ce verset écrasait le Psaume 119:11. | Remis en 119:115. |
| Marc 9:50 | Verset coupé en deux (9:50 et 9:51). | Réuni en 9:50, comme dans la LSG imprimée. |
| Marc 10:52 | Verset coupé en deux (10:52 et 10:53). | Réuni en 10:52. |
| Ecclésiaste 11:9-10 | Placés à tort en 12:1-2, ce qui décalait tout le chapitre 12. | Remis en 11:9-10 ; « Souviens-toi de ton créateur » redevient 12:1. |

Aucun mot du texte n'est changé : seuls les numéros de versets ont été remis en place.

## Contre-vérification

Le texte a été comparé **mot à mot** avec une seconde source indépendante : `Beblia/Holy-Bible-XML-Format`, fichier `FrenchBible.xml` (« La Sainte Bible par Louis Segond 1910 »). Les deux textes sont identiques à quelques mots près (une coquille « accomplissemen » dans Beblia, quelques « à » isolés). Beblia n'a pas été retenue comme source principale : elle suit la numérotation anglaise (le Psaume 3:9 n'y existe pas) et ses majuscules ne sont pas accentuées (« Eternel »).

Les différences de numérotation qui restent avec Beblia sont celles de la Louis Segond elle-même, qui suit la numérotation hébraïque à plusieurs endroits : titres des Psaumes comptés comme verset 1, Exode 7-8, Lévitique 5-6, Job 38-41, Ecclésiaste 4-5, Osée, Jonas, Malachie 4…

**À vérifier sur une Bible LSG imprimée :** Actes 19 (40 versets ici, le verset 41 est inclus dans le 40) ; 2 Corinthiens 13:13 ; 3 Jean 1:15 ; Apocalypse 12:18.

## Résultat de `verifier.py`

```
OK    66 livres (66)
OK    1 189 chapitres (1189)
     versets non vides : 31168
OK    Jean 3:16 
       fichier : Car Dieu a tant aimé le monde qu’il a donné son Fils unique, afin que quiconque croit en lui ne périsse point, mais qu’il ait la vie éternelle.
OK    Psaume 3:9 
       fichier : Le salut est auprès de l’Éternel : / Que ta bénédiction soit sur ton peuple ! — Pause.
OK    aucune balise USFM résiduelle []
     numéros de verset absents : 0 []

RÉSULTAT : TOUT EST CONFORME
```

## Refaire la conversion

```bash
# télécharger les 66 fichiers .p.sfm dans un dossier, renommés CODE.sfm (GEN.sfm, EXO.sfm…)
python3 -I tools/bible/convertir.py <dossier_usfm> public/bible
python3 -I tools/bible/verifier.py public/bible
```
