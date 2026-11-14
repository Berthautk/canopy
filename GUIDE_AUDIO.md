# Guide : ajouter un audio dans Yeshaya

Les MP3 ne sont **pas** dans ce dépôt (trop lourds). Ils sont dans un dépôt public séparé, **`yeshaya-audio`**,
publié gratuitement par GitHub Pages. L'application ne fait que lire les fichiers à cette adresse :

```
https://berthautk.github.io/yeshaya-audio/
```

(adresse réglée dans `src/donnees/config.js`, variable `AUDIO_BASE`).

## 1. Préparer le MP3 (une seule fois par fichier)

Format visé : **MP3 mono, 48 kbit/s** (64 kbit/s si c'est de la musique). C'est environ 0,4 Mo par minute.

- **Avec Audacity (gratuit)** : *Pistes → Mixer → Mixer la stéréo en mono*, puis *Fichier → Exporter → MP3*,
  « Débit constant », **48 kbit/s**.
- **Avec ffmpeg** (ligne de commande) :
  ```bash
  ffmpeg -i original.wav -ac 1 -ar 22050 -b:a 48k la-puissance-de-la-priere.mp3
  ```

Nom du fichier : minuscules, tirets, **sans accents ni espaces**.

## 2. Mettre le MP3 en ligne

1. Ouvrez https://github.com/Berthautk/yeshaya-audio
2. Entrez dans le bon dossier (par exemple `enseignements`).
3. **Add file → Upload files**, déposez le MP3, puis **Commit changes**.
4. Attendez une à deux minutes : le fichier est alors en ligne à
   `https://berthautk.github.io/yeshaya-audio/enseignements/la-puissance-de-la-priere.mp3`.
   Ouvrez cette adresse dans le navigateur pour vérifier que le son se lance.

## 3. Relier l'audio à un contenu

Dans le fichier JSON du contenu (dans `content/`), remplissez le champ `audio` avec le chemin **à partir du dossier** :

```json
"audio": "enseignements/la-puissance-de-la-priere.mp3",
"duree": "18:20",
"auteur": "Nom de l'orateur",
"autorisation": "oui"
```

- `autorisation : "oui"` affiche « Utilisé avec autorisation » sous le nom de l'auteur. Mettez `"oui"` **uniquement**
  si vous avez l'accord écrit de l'auteur (et notez-le dans `content/auteurs.json`).
- On peut aussi mettre une adresse complète (`https://…/fichier.mp3`).

C'est tout : à la prochaine mise à jour de l'application, l'audio apparaît, avec les boutons Écouter, Télécharger et Partager.

## Ce que fait l'application avec les audios

- **Écouter** : lecture en continu depuis internet, avec reprise à l'endroit où l'on s'était arrêté.
- **Télécharger** : l'audio est gardé sur le téléphone et marqué « Hors ligne ». Il s'écoute ensuite sans connexion.
- Les audios **ne sont jamais téléchargés automatiquement** : seulement quand la personne appuie sur « Télécharger ».
- L'écran « Mes téléchargements » montre l'espace utilisé et permet de supprimer.

## Mettre en place le dépôt `yeshaya-audio` (une seule fois)

Le modèle de dépôt est prêt dans `tools/yeshaya-audio-modele/`. La mise en place complète se fera en phase 6 :
1. Créer sur GitHub un dépôt **public** nommé `yeshaya-audio`.
2. Y copier le contenu de `tools/yeshaya-audio-modele/` (dossiers, `README.md`, `.nojekyll`).
3. *Settings → Pages* : Source « Deploy from a branch », branche `main`, dossier `/ (root)`, puis *Save*.
