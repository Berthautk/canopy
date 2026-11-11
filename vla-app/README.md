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
