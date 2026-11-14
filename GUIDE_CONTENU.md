# Guide : ajouter du contenu dans Yeshaya

Tous les contenus sont de simples fichiers texte au format **JSON**, rangés dans le dossier **`content/`**.
Pour ajouter un enseignement, un thème de prière, un dialogue ou une question de quiz, **il suffit d'ajouter un fichier**.
Aucune ligne de code à modifier.

Des **modèles prêts à copier** se trouvent dans `content/_modeles/` (l'application ne les affiche pas).

---

## Les 5 règles d'or

1. **Les versets : seulement la référence**, jamais le texte. Écrivez `"Jn 3:16"`, `"Ps 23:1"`, `"1 Co 13:4-7"`.
   L'application va chercher elle-même le texte exact dans la Bible Louis Segond 1910.
2. **Chaque fichier a un `id` unique** : minuscules, tirets, sans accents (`priere-famille`, `enseignement-la-foi`).
3. **`"autorisation": "oui"` uniquement si l'auteur a donné son accord écrit.** L'application affiche alors « Utilisé avec autorisation ».
   Notez cet accord dans `content/auteurs.json`.
4. **N'attribuez jamais une citation à une personne réelle** si elle ne l'a pas dite. Pour un essai, écrivez « Nom de l'orateur ».
5. **Pour un contenu de démonstration**, ajoutez `"exemple": true` : l'application affiche alors la mention **EXEMPLE**.
   Retirez cette ligne (ou mettez `false`) pour un vrai contenu.

> Les guillemets doivent être droits (`"`), et chaque ligne sauf la dernière d'un bloc se termine par une virgule.
> En cas de doute, collez votre fichier sur https://jsonlint.com pour vérifier qu'il est valide.

---

## Ajouter un thème de prière (écrans 3 et 4)

1. Copiez `content/_modeles/theme-de-priere.json` dans **`content/prieres/`**, par exemple sous le nom `travail.json`.
2. Remplissez :

| Champ | Ce qu'il faut mettre |
|---|---|
| `id` | identifiant unique, ex. `priere-travail` |
| `categorie` | le groupe affiché dans la liste : `Famille`, `Santé`, `Travail`, `Nation et Église`… (une nouvelle catégorie apparaît toute seule) |
| `ordre` | position dans la liste (1, 2, 3…) |
| `titre`, `resume`, `enseignement`, `priere` | les textes |
| `versets` | liste de références : `["Ph 4:6-7", "Mt 6:33"]` |
| `sujets` | liste des sujets à prier ; chacun peut avoir son propre `audio` |
| `audio`, `duree` | l'enseignement audio (voir `GUIDE_AUDIO.md`) ; supprimez ces lignes s'il n'y a pas d'audio |
| `image` | une image de `public/assets/` (voir `design/ASSETS.md`), ex. `/assets/priere/priere-en-famille.webp` |

## Ajouter un enseignement (écran 6 « Grandir »)

Copiez `content/_modeles/enseignement.json` dans **`content/enseignements/`**. Champs importants :
- `theme` : regroupement dans l'onglet « Par thème » (ex. `Foi`, `Prière`, `Famille`) ;
- `serie` : regroupement dans l'onglet « Séries » (ex. `Les bases de la foi`) ;
- `audio` et `duree` : l'audio et sa durée (ex. `"25:10"`).

Les plus récents (`date_ajout`) apparaissent en premier. L'« Audio du jour » de l'accueil tourne parmi les enseignements qui ont un audio.

## Ajouter un jour au parcours Nouveau converti (écran 7)

Copiez `content/_modeles/jour-nouveau-converti.json` dans **`content/nouveau-converti/`** sous le nom `jour-04.json`, `jour-05.json`…
Le champ `jour` (4, 5…) fixe sa place. Les jours sans fichier s'affichent « À venir ». Un jour se débloque quand le précédent est terminé.

## Ajouter un contenu « Évangéliser » (écran 8)

Dans **`content/evangelisation/`**, un fichier par contenu, avec `"type"` :
- `"motivation"` ou `"formation"` : `titre`, `texte` (liste de paragraphes), `versets` ;
- `"objection"` : en plus, `question` (l'objection telle qu'on l'entend).

Inspirez-vous des fichiers existants. Pour les échanges avec des amis musulmans : **toujours respectueux et bienveillant**,
jamais moqueur ni agressif ; on ne critique jamais la foi de l'autre.

## Ajouter un dialogue (écran 9)

Copiez `content/_modeles/dialogue.json` dans **`content/dialogues/`** :
- `personnes` : chaque personne avec `"role": "chretien"` (bulle à gauche, en bleu) ou `"ami"` (bulle à droite) ;
- `repliques` : dans l'ordre, chacune avec `personne` (le même nom que dans `personnes`) et `texte` ;
- `verset_a_partager` : une référence ; `audio` : l'enregistrement du dialogue (facultatif).

## Ajouter une question de quiz (« Jouer et apprendre », phase 5)

Dans **`content/quiz/`**, un fichier par thème (modèle : `content/_modeles/question-de-quiz.json`) :

```json
{ "id": "vj-002", "niveau": "facile", "question": "…", "choix": ["A", "B", "C", "D"], "reponse": 0,
  "explication": "…", "reference": "Lc 2:7", "verifie": false }
```

- `reponse` : le numéro de la bonne réponse **en comptant à partir de 0** (0 = première, 1 = deuxième, etc.) ;
- `niveau` : `facile`, `moyen` ou `expert` ;
- `reference` : **obligatoire**, et elle doit contenir la réponse (le texte LSG est affiché sous l'explication) ;
- `verifie` : passez à `true` une fois la question relue. La liste à relire se régénère avec `node tools/generer-a-verifier.mjs` (fichier `A_VERIFIER.md`).
- Dans les questions et explications, **ne citez pas un verset entre guillemets** : reformulez, le vrai texte est affiché automatiquement.

## Ajouter des versets par sujet, une méditation ou un verset du jour

- **Sujets** (`content/sujets-versets/`) : `titre`, `description`, `image`, `versets`.
- **Méditations** (`content/meditations/`) : `numero`, `titre`, `reference`, `texte`, `question`, `priere`, et `audio` facultatif.
  Elles tournent une par jour.
- **Versets du jour** : ajoutez des références dans la liste de `content/versets-du-jour.json`.

---

## Publier

1. Sur GitHub, dans le bon dossier de `content/` : **Add file → Create new file** (ou *Upload files*), collez le contenu, puis **Commit changes**.
2. Le site se met à jour tout seul en quelques minutes (déploiement Cloudflare Pages, mis en place en phase 6).
3. Pour l'audio : déposez d'abord le MP3 dans le dépôt `yeshaya-audio` (voir **`GUIDE_AUDIO.md`**).

**Avant de publier**, vérifiez toutes les références avec :

```bash
node tools/verifier-contenu.mjs
```
(la commande liste chaque référence avec le texte LSG correspondant, et signale celles qui n'existent pas).
