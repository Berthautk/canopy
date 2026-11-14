# Mettre Yeshaya en ligne (gratuit, sans carte bancaire)

Deux services gratuits :
- **Cloudflare Pages** héberge l'application → `https://yeshaya.pages.dev`
- **GitHub Pages** héberge les fichiers MP3 (dépôt séparé `yeshaya-audio`) → `https://berthautk.github.io/yeshaya-audio/`

Aucun des deux ne demande de carte bancaire.

---

## Étape 0 : mettre le code sur la branche principale

Le code de Yeshaya est sur la branche `ccr-485795c8-ead0ea` du dépôt `Berthautk/canopy`.
La branche `main` contient encore l'ancien projet Canopy.

1. Sur GitHub, ouvrez le dépôt, puis **Pull requests → New pull request**, base `main` ← compare `ccr-485795c8-ead0ea`, et fusionnez (*Merge*).
2. (Conseillé) **Settings → General → Repository name** : renommez le dépôt `canopy` en **`yeshaya`**.

## Étape 1 : Cloudflare Pages (une seule fois)

1. Créez un compte gratuit sur https://dash.cloudflare.com/sign-up (adresse e-mail seulement).
2. **Workers & Pages → Create → Pages → Connect to Git**, autorisez GitHub, choisissez le dépôt.
3. Réglages de construction :

| Champ | Valeur |
|---|---|
| Project name | `yeshaya` (donne l'adresse `yeshaya.pages.dev`) |
| Production branch | `main` |
| Framework preset | `Vite` (ou *None*) |
| Build command | `npm run build` |
| Build output directory | `dist` |
| Variable d'environnement | `NODE_VERSION` = `22` |

4. **Save and Deploy**. Après 1 à 2 minutes, l'application est en ligne.

Le fichier `public/_headers` règle déjà le cache (code gardé un an, mises à jour vérifiées à chaque ouverture).

## Étape 2 : le dépôt des audios `yeshaya-audio` (une seule fois)

1. Sur GitHub : **New repository**, nom **`yeshaya-audio`**, **Public**, sans README.
2. Copiez-y le contenu du dossier `tools/yeshaya-audio-modele/` (dossiers, `README.md`, `.nojekyll`) :
   *Add file → Upload files*, glissez les fichiers, *Commit changes*.
3. **Settings → Pages** : *Source* « Deploy from a branch », branche `main`, dossier `/ (root)`, *Save*.
4. Après une minute, `https://berthautk.github.io/yeshaya-audio/README.md` doit s'afficher.

Si votre identifiant GitHub ou le nom du dépôt change, modifiez `AUDIO_BASE` dans `src/donnees/config.js`.

Ajouter un audio : voir **`GUIDE_AUDIO.md`**. Ajouter un contenu : voir **`GUIDE_CONTENU.md`**.

---

## Publier une mise à jour

Toute modification poussée sur `main` est publiée automatiquement par Cloudflare (1 à 2 minutes).

1. Modifiez ou ajoutez un fichier dans `content/` (directement sur GitHub : bouton ✏️ ou *Add file*).
2. Avant de valider, vérifiez les références bibliques (sur un ordinateur avec Node.js) :
   ```bash
   npm install
   node tools/verifier-contenu.mjs        # toutes les références doivent exister
   node tools/generer-a-verifier.mjs      # met à jour A_VERIFIER.md (questions de jeu)
   npm run build                          # vérifie que l'application se construit
   ```
3. *Commit* sur `main` : Cloudflare reconstruit et publie.
4. Sur les téléphones, la nouvelle version s'installe toute seule à la prochaine ouverture avec internet
   (le service worker télécharge la mise à jour en arrière-plan).

Cloudflare garde l'historique des déploiements : en cas de problème, **Deployments → … → Rollback** remet la version précédente.

## Tester avant de publier (sur un ordinateur)

```bash
npm install
npm run build
npm run preview      # puis ouvrez l'adresse affichée ; mode avion pour tester le hors ligne
```

## Statistiques anonymes et espace administrateur

L'application peut envoyer des **compteurs anonymes** (uniquement si l'utilisateur a dit « Oui, j'aide ») :
sections ouvertes, contenus ouverts, sujets priés, « j'ai donné ma vie à Jésus ». Jamais de nom, de contact, de pays,
ni de texte saisi. Le code serveur est dans `functions/` (Cloudflare Pages Functions).

À faire **une seule fois** dans Cloudflare :

1. **Workers & Pages → D1 → Create database**, nom : `yeshaya-stats`.
2. Dans le projet Pages **yeshaya → Settings → Bindings → Add → D1 database** : nom de variable `DB`, base `yeshaya-stats`.
   (La table est créée automatiquement au premier envoi.)
3. **Settings → Variables and Secrets → Add** : type *Secret*, nom `ADMIN_MOT_DE_PASSE`, valeur : un mot de passe d'au moins 12 caractères.
4. Redéployer (Deployments → Retry deployment, ou nouveau commit).

Ensuite : dans l'application, **Paramètres → Espace administrateur** (lien en bas de page) ou `https://yeshaya.pages.dev/#/admin`,
puis le mot de passe. Sans ces réglages, l'application fonctionne normalement : les compteurs restent simplement en attente sur les téléphones.
