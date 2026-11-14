# Compte rendu final : Yeshaya

État au 14 novembre 2026, branche `ccr-485795c8-ead0ea`.

Tous les tests ont été faits dans Chromium sur un écran de **360 px**. **Aucun test n'a été fait sur un vrai téléphone Android.**

---

## 1. Terminé et testé

| Domaine | Ce qui fonctionne (vérifié par des tests automatisés et des captures d'écran) |
|---|---|
| **Coquille PWA** | Installable, 5 onglets, menu, mode clair/sombre/auto, 3 tailles de texte, polices hébergées dans l'app, aucun appel externe |
| **Hors ligne** | Après une seule visite, l'app démarre sans internet (testé en coupant le réseau, cache d'images vidé) |
| **Profil** | Photo (recadrée, ~20 Ko) et prénom, stockés sur le téléphone |
| **Bible LSG 1910** | 66 livres, 1 189 chapitres, Jean 3:16 et Psaume 3:9 conformes ; lecture, surlignage en 4 couleurs, favoris, notes, copier, partager, Montrer ; recherche par référence (« Jn 3 16 », « 1 Co 13 ») et par mot sans accents ; téléchargement hors ligne avec barre de progression |
| **Plans de lecture** | Classique, AT + NT, Thématique (de l'Arsenal) ; cases à cocher, « Rattraper mon retard » |
| **Méditation, sujets, chemin du salut** | Méditation du matin, 15 sujets (101 versets), chemin du salut en 8 étapes |
| **Audio** | Lecture continue d'un écran à l'autre, ±15 s, vitesse 0,75× à 1,5×, reprise à la position, « Continuer l'écoute », écran verrouillé (Media Session), téléchargement hors ligne, écran « Mes téléchargements » |
| **Prière** | « Prier maintenant » selon l'heure ; veilles de l'Aube, de Midi et du Soir guidées étape par étape (annulation, adoration, Notre Père, proclamations) ; 18 thèmes par phases du Notre Père ; 16 fiches de combat ; journal de prière ; « J'ai prié » |
| **Grandir** | Parcours « Découvrir Jésus » (10 leçons, avec la prière pour recevoir Jésus et la décision datée) ; parcours Nouveau converti complet (30 jours) ; 10 enseignements écrits (de l'Arsenal) + 3 audios d'exemple |
| **Évangéliser** | Motivation, formation, objections, dialogues en bulles avec audio |
| **Jouer et apprendre** | Quiz du jour, quiz par thème et niveau, Complète le verset, Qui suis-je ?, Remets dans l'ordre, Duel à deux, 8 badges |
| **Écoute à voix haute** | Bouton « Écouter » sur les enseignements écrits, les 40 leçons des parcours, la méditation, les veilles et thèmes de prière, les fiches de combat, l'évangélisation et chaque chapitre de la Bible : voix de synthèse du téléphone, 0 Mo, hors ligne si la voix française est installée ; surlignage du passage lu, pause, précédent/suivant, vitesse. Testé avec une voix simulée (le navigateur de test n'a pas de voix) |
| **Sauvegarde** | Fichier `.json` (30 Ko avec photo) ; envoi par WhatsApp ; restauration testée d'un navigateur vierge à un autre : tout revient |
| **Réseau lent** | 3G lente simulée (400 kbit/s, latence 400 ms, processeur ÷4) : écran de démarrage en 4,4 s à la 1re visite (634 Ko), 1,6 s ensuite |
| **Références bibliques** | 1 767 références des contenus vérifiées automatiquement, 0 erreur |

## 2. Incomplet, « bientôt disponible » ou à vérifier

| Élément | État |
|---|---|
| **Questions de jeu** | 40 questions + 8 personnages + 5 histoires en `"verifie": false` : à relire avec **`A_VERIFIER.md`** |
| **Contenus d'exemple** | 20 fichiers marqués EXEMPLE (affichés « EXEMPLE ») : 3 enseignements audio, 3 méditations, 3 jours du parcours, évangélisation, dialogues, 1 thème de prière. Textes rédigés par Claude : **à relire par une personne de confiance**, puis à remplacer ou valider |
| **Audios** | Les 3 MP3 sont des sons de test de 50 s. Aucun vrai enseignement audio |
| **Découvrir Jésus et Nouveau converti** | 40 textes originaux rédigés par Claude (plans inspirés de ubdavid.org) : à relire, liste dans `A_VERIFIER.md` |
| **Plan chronologique** | « Bientôt disponible » : pas de source fiable pour l'ordre chronologique |
| **Radio Yeshaya** | Carte « Bientôt » sur l'écran À propos (non activée, comme demandé) |
| **Classiques traduits** | 5 textes du domaine public traduits de l'anglais (versions abrégées signalées par […]) : Spurgeon (3 sermons), E. M. Bounds, Andrew Murray. Traduction à relire. Derek Prince, Paul Washer et Henri Viaud-Mürat ne sont pas inclus : leurs œuvres sont protégées |
| **Contenus de l'Arsenal** | Repris de ton application (formulations conservées). Les références ont été mises à la numérotation de la LSG imprimée (79 corrections) et 12 citations qui n'étaient pas le texte LSG ont été remplacées par le texte LSG exact (liste dans `tools/arsenal/journal-conversion.json`) |
| **ubdavid.org** | Consulté. Contenu « tous droits réservés » (Mailbox Club International) : seuls les plans et les références ont été repris, les textes sont originaux. Pour citer leurs leçons, il faudrait leur autorisation écrite |
| **Bible : numérotation à confirmer** | Actes 19:40-41, 2 Corinthiens 13:13, 3 Jean 1:15, Apocalypse 12:18 (voir `tools/bible/SOURCE.md`) |
| **Éléments graphiques non découpés** | Boutons et cadres de la planche Q (refaits en CSS), panneaux de jeux avec texte incrusté, images contenant des versets (voir `design/ASSETS.md`) |
| **Mise en ligne** | **Pas encore faite** : je ne peux pas créer de compte Cloudflare ni de dépôt GitHub depuis cette session. Tout est prêt : voir `DEPLOIEMENT.md` |
| **Audio depuis GitHub Pages** | Non testé (le dépôt n'existe pas encore). GitHub Pages autorise en principe le chargement depuis une autre adresse ; à vérifier après création |
| **Vrai téléphone** | Non testé : surtout la voix de synthèse française (qualité, voix installée), l'écoute écran éteint, l'installation et le partage WhatsApp. La lecture à voix haute s'arrête quand l'écran s'éteint (limite des navigateurs) |

## 3. Tailles

| Partie | Taille |
|---|---|
| Coquille de l'app (préchargée, hors Bible et audios) | **881 Ko** (limite 1,5 Mo), dont code JS + CSS 164 Ko compressés |
| Bible LSG 1910 (66 fichiers) | 4,5 Mo, **1,3 Mo compressés** au téléchargement |
| Illustrations (`public/assets`) | 6,3 Mo au total, chargées à la demande (une page en utilise quelques-unes) |
| Fichier de sauvegarde | ~30 Ko avec photo |

## 4. Publier une mise à jour et ajouter des audios

- **Première mise en ligne** : `DEPLOIEMENT.md` (fusion sur `main`, Cloudflare Pages, dépôt `yeshaya-audio`).
- **Mise à jour** : modifier `content/` sur `main` → Cloudflare publie seul en 1 à 2 minutes ; les téléphones se mettent à jour à la prochaine ouverture.
- **Ajouter un audio** : `GUIDE_AUDIO.md` (MP3 mono 48 kbit/s → dépôt `yeshaya-audio` → champ `"audio"` du contenu).
- **Ajouter un contenu** : `GUIDE_CONTENU.md` + modèles dans `content/_modeles/`.
- **Vérifier avant de publier** : `node tools/verifier-contenu.mjs` et `node tools/generer-a-verifier.mjs`.

**Le travail n'est pas terminé tant que les éléments de la section 2 ne sont pas traités**, en particulier la relecture des contenus, les vrais audios et la mise en ligne.
