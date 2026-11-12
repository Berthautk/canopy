# VLA — Module « Test de placement » (PWA)

Application web installable (téléphone, tablette, ordinateur), sans build : HTML + JavaScript natif.
Cahier des charges : `SPEC_Module_Test_de_Placement.md` (hors dépôt). Maquettes : dossier fourni par Emmanuel.

## Lancer en local
Placez d'abord les 3 fichiers complets `test_ADU.json`, `test_ENF.json`, `test_IEL.json` (fournis avec le cahier des charges) dans `vla-app/source-data/`. Ce dossier est volontairement **exclu de git** : il contient les corrigés.

```bash
cd vla-app
npm test          # 10 tests unitaires : correction, paliers, niveaux (§6-§7), exemples du cahier des charges
npm run split     # régénère public/data/public_*.json (énoncés SANS corrigés)
npm run serve     # http://localhost:8080
```
* `#/c` écran candidat · `#/staff` espace de Valérie (au premier lancement : choisir un code PIN).
* En mode local, les corrigés sont servis **uniquement sur localhost** (`/__dev/key/…`). En production ils ne sont **pas** déployés :
  Paramètres → « Corrigés des tests » → importer les 3 fichiers `test_*.json` complets (ils sont séparés dans l'app puis stockés dans `tests_key`).

## Deux modes de stockage
| Mode | Quand | Temps réel entre appareils |
|---|---|---|
| **Local** (défaut) | démonstration, un seul navigateur (onglets distincts) | non |
| **Firebase Spark** | utilisation réelle au centre | oui |

### Activer Firebase (gratuit, plan Spark, jamais Blaze)
1. console.firebase.google.com → créer un projet **sans** Google Analytics, rester sur le plan **Spark**.
2. Authentication → méthodes : activer **Anonyme** et **Email/Mot de passe** ; créer le compte de Valérie.
3. Firestore Database → créer en mode production, puis coller `firestore.rules` dans l'onglet Règles.
4. Créer à la main le document `staff/<UID de Valérie>` (champ libre, ex. `role: "admin"`) → c'est ce qui donne accès au personnel.
5. Paramètres du projet → Application Web → copier la configuration dans `public/js/firebase-config.js`.
6. Authentication → Paramètres → Domaines autorisés : ajouter le domaine Netlify.
7. Déployer le dossier `public/` sur Netlify (`netlify.toml` fourni), ouvrir `#/staff`, importer les corrigés.

## Sécurité des corrigés
`tests_public` (énoncés) est lu par l'appareil candidat ; `tests_key` (réponses, scripts, grilles) n'est lisible que par le personnel.
La correction est calculée dans le navigateur de Valérie (`public/js/scoring.js`). Un test unitaire vérifie qu'aucun champ `expected/accept/answer/script/note/grid` ne figure dans le public.

## Oral : en salle ou à distance
Le candidat termine l'écrit → son écran se verrouille et attend. Valérie ouvre **Correction → 3 · Oral** :
* **En salle** : candidat et formateur sont dans la même pièce. Le formateur pose les questions à voix haute (ou touche « 📺 Afficher » pour les montrer sur l'écran du candidat), note sur son propre appareil : niveau (grille CECR), notes, questions posées, chrono.
* **À distance** : Valérie choisit « À distance », génère un lien Jitsi (ou colle un lien Meet/Zoom, ou fait un appel vidéo WhatsApp) et l'envoie au candidat. Dès qu'elle touche « ▶ Démarrer l'entretien », un bouton **Rejoindre** apparaît sur l'écran du candidat. La notation se fait de la même façon.
Dans les deux cas le résultat oral est enregistré dans la même fiche, et entre dans le calcul du niveau global.
> Réserve : le serveur public meet.jit.si peut demander à l'organisateur de se connecter ; Google Meet ou l'appel vidéo WhatsApp sont des alternatives gratuites.

## Limites connues / à valider
* Non testé sur de vrais appareils ni contre un vrai projet Firebase (adaptateur écrit mais non exécuté ici).
* Une écoute interrompue (page fermée pendant l'audio) est comptée comme faite : l'audio n'est jamais rejoué.
* PDF de l'attestation : impression navigateur → « Enregistrer au format PDF » (A5 paysage), sans service payant.

## Fidélité aux maquettes et corrections apportées
Le design reprend les maquettes (en-têtes marine, bandeaux de partie, cartes bleu/crème, QCM en 2 colonnes, vague or/turquoise en pied de page, barre latérale de Valérie, fiches et statistiques). Défauts des images corrigés :
* **Attestation** : faute « LALÉRIE » sur le cachet (refait : « VALÉRIE LANGUAGE ACADEMY »), « Poucentage », ville « Yaoundé » alors que le centre est à **Garoua** (ville configurable), nom de la directrice supposé (à saisir dans Paramètres, avec la signature numérique), A5 paysage réel.
* **Notes** : les maquettes additionnaient les points de tout le test (« 67/90, 74 % »). Le guide du correcteur l'interdit : le niveau se calcule **par paliers**. L'attestation affiche donc le niveau et le résultat du palier décisif ; les critères /5 de l'écriture et de l'oral servent d'aide à la notation.
* **Contenu réel** : nombre de questions lu dans les JSON (pas « 20 questions » partout), exercice enfant en **anglais** (la maquette montrait du français), message de fin d'écrit adapté à l'oral **en salle** ou **à distance**, plus de « REC » fictif (aucun enregistrement n'est réalisé), statistiques calculées sur les données réelles.
* **QR code** en correction d'erreur élevée (logo retiré de la zone de lecture), accessibilité au clavier et aux A−/A+.

## Informations obligatoires du candidat (imprimées sur l'attestation)
Civilité, nom, prénom(s), date de naissance, ville, téléphone WhatsApp et **photo** (adulte) ; pour l'enfant : nom du parent à la place de la ville. Validation à la saisie (`public/js/identity.js`, testée) : nom en MAJUSCULES, prénoms normalisés, téléphone mis au format +237, date plausible. Le candidat relit et confirme avant de commencer ; Valérie peut corriger l'orthographe dans l'onglet Récapitulatif, et la validation du résultat est **bloquée** tant qu'une information obligatoire manque.

## PDF
« Télécharger le PDF » génère un vrai fichier A5 paysage dans le navigateur (html2canvas + jsPDF, embarqués dans `public/js/vendor`, aucun service payant). « Envoyer par WhatsApp » partage le PDF directement sur mobile (Web Share) ; sur ordinateur il est téléchargé puis le lien WhatsApp s'ouvre.

## Trois sections
Barre de sections en haut de l'espace de Valérie : **🎯 Test de placement** · **🏫 Centre** · **📚 Entraînement**.
* **Centre** (`#/centre`) : vue d'ensemble, élèves (téléphone et frais visibles du personnel seulement), classes & leçons (présence), activités, import des prospects testés. « Publier le tableau de bord » écrit un résumé général (compteurs, classes, activités, prénom + initiale) visible des apprenants connectés ; aucun téléphone, frais ou note n'y figure.
* **Entraînement** (`#/train` côté Valérie, `#/learn` côté apprenant) : l'apprenant entre son code personnel, reçoit chaque jour 10 questions de son niveau (répétition espacée : les erreurs reviennent), voit la correction expliquée en français, sa série de jours, sa maîtrise du niveau ; Valérie voit le suivi et fait passer au niveau suivant. Banque de 40 questions A1–B2 fournie, enrichissable (ajout ou import JSON).
* **Résultat du test envoyé au candidat** : à la validation, le niveau et l'attestation (sans aucun corrigé) apparaissent sur l'écran du candidat avec un bouton de téléchargement PDF (option désactivable dans Paramètres).

## Maquettes Centre / Entraînement / Apprenant (pack « 13 maquettes »)
Reprises : cadre « Espace de Valérie » (bandeau, onglets Test de placement | Centre | Entraînement, menu latéral à vague or/turquoise), élèves (liste filtrable paginée + fiche d'édition), classes & leçons (appel des présents), activités (calendrier + liste), rapports (exports CSV/Excel), suivi des apprenants, banque d'exercices groupée par titre (brouillon/publié, aperçu), espace apprenant (connexion, accueil avec parcours, séance, résultat détaillé, progression, badges, vie du centre avec inscription aux activités, résultat du test + attestation), mode enfant.
Photos de la bibliothèque fournie (`assets/photos/`) : ce sont des **illustrations générées par IA** (bâtiment fictif) ; à remplacer par de vraies photos du centre dès que possible.
Écarts volontaires : pas de mot de passe apprenant (un code personnel suffit), pas de « Cours en ligne » ni « Messages » (modules non spécifiés), « Rapports » = exports réels (frais dus, présences), compteurs et pourcentages tous calculés sur les vraies données (les maquettes affichaient 186 élèves, +12 %, etc.).

## Intégration à VLA Gestion (site Netlify existant)
Le dossier `host/` contient l'application de gestion déployée (fichiers d'origine, intacts). `npm run build` produit `dist/` = **VLA Gestion + ce module dans `/placement/`** : c'est `dist/` qu'on publie sur Netlify.
* **3 ajouts minimaux et additifs dans la gestion** (faits par `tools/build-site.mjs`, qui s'arrête si le fichier d'origine a changé) : entrées de menu « Tests de placement » (manager et secrétariat) et « Entraînement » (manager) ; écoute des modifications faites par le module dans un autre onglet.
* **Connexion unique** : le module réutilise la session de l'équipe (même origine). Rôles : manager = tout ; secrétariat = tests de placement (sans paramètres ni statistiques) ; formateur = pas d'accès.
* **Candidat testé → Apprenants** : à la validation, le candidat est créé (ou mis à jour, rapprochement par téléphone) dans les Apprenants, à l'étape « Test de placement », avec niveau, date et n° d'attestation ; programme choisi selon le test et l'âge.
* **Centre = la gestion existante** (apprenants, groupes, paiements, agenda, équipe). L'onglet « Centre » du module renvoie vers elle ; l'Entraînement et « Vie du centre » se nourrissent de ses apprenants inscrits / en formation et de ses groupes (aucun doublon de frais ni de présences ; les frais restent dans la gestion).
* **En-têtes de sécurité** (`_headers`) : ceux d'origine + autorisations nécessaires (audios jsDelivr, Firebase, caméra). Sans cela l'audio et Firebase seraient bloqués par la politique actuelle.
* **Limite** : la gestion actuelle stocke ses données dans le navigateur (clé `vla-gestion-demo-v7`, version démo). Le pont fonctionne donc sur le même appareil ; le multi-appareils arrivera avec la migration Firebase de la gestion elle-même.
