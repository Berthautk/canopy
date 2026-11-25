# Le style d'écriture de Yeshaya

*La règle la plus importante du projet. À relire avant d'écrire ou de réécrire un enseignement.*

## À qui on parle

Un frère ou une sœur du Cameroun, sur un téléphone simple. Il a peut-être arrêté l'école tôt.
Il écoute souvent le texte à voix haute au lieu de le lire. S'il ne comprend pas une phrase,
il ne la relit pas : **il ferme l'application**. C'est tout le problème.

## Les cinq règles

**1. Des phrases courtes.** Quinze mots en moyenne, pas plus. Une idée par phrase.
Quand une phrase dépasse vingt-cinq mots, elle se coupe en deux ou en trois.

**2. Des mots simples.** On écrit comme on parle à un ami, pas comme on écrit à un professeur.
« Il parle pour toi » plutôt que « il intercède en ta faveur ». « Ce qu'il a fait à la croix »
plutôt que « son œuvre expiatoire ». Si un mot n'est jamais dit au marché, on cherche l'autre mot.

**3. On dit, puis on redit autrement.** C'est le cœur du style oral. On explique une chose,
puis on la reprend tout de suite avec d'autres mots, plus simples.
**Sans écrire « en d'autres termes », sans écrire « autrement dit ».** On redit, c'est tout :

> Un nom n'est pas une étiquette. Un nom fait venir quelqu'un devant toi.

**4. Des exemples de la vie d'ici.** Le taxi, le marché, la tontine, le quartier, la boutique,
l'embouteillage, la banque, le village. Pas d'exemples qui viennent d'ailleurs.

**5. Des questions entières.** Chaque question s'écrit en phrase complète, parce que le téléphone
la lit à voix haute. « Pourquoi ? » tout seul ne veut rien dire quand on l'écoute.

## Ce qu'on ne fait pas

- Pas de phrase à tiroirs, avec des incises et des relatives empilées.
- Pas de vocabulaire d'école de théologie sans l'expliquer aussitôt.
- Pas de « On raconte que… » : on dit d'où vient ce qu'on affirme, ou on l'enlève.
- Pas de « en d'autres termes » ni de « autrement dit » : on redit sans l'annoncer.

## Comment on vérifie

    node tools/lisibilite.mjs              # le classement des 205 enseignements, du plus dur au plus simple
    node tools/lisibilite.mjs <id>         # le détail d'un enseignement, avec ses pires phrases

L'outil donne une note sur 100. **On vise 75 et plus.** En dessous de 60, le texte est à reprendre.

Mesure du 25 novembre 2026, avant le chantier de simplification :
note moyenne **53,5/100**, 17 mots par phrase, 63 enseignements « très difficiles » sur 205.
Les pires sont les classiques traduits mot à mot (Andrew Murray, E. M. Bounds) : 22 à 28 mots par phrase.

## Le cas des classiques

Murray, Bounds et Spurgeon écrivaient au dix-neuvième siècle, avec des phrases d'une longueur
impossible aujourd'hui. Les traduire mot à mot donne un texte juste mais illisible.

On garde donc **leurs idées, leur ordre et leurs images**, et on coupe les phrases. Le champ
`traduction` du fichier doit alors dire la vérité : **« adaptation en français simple »**,
et non « traduction intégrale ». On ne fait pas passer une adaptation pour une traduction.

## Un exemple

Avant (note 0/100, 50 mots d'un seul tenant) :

> « Ici, dans ses paroles d'adieu, il répète ce mot sans cesse, en lien avec ces promesses au sens
> illimité, « tout ce que », « quelque chose », « ce que vous voudrez », pour leur enseigner, et
> pour nous enseigner, que son nom est notre seul argument, mais aussi un argument qui suffit à tout. »

Après (note 100/100) :

> « Puis vient le dernier soir. Il va mourir. Il leur parle une dernière fois. Et là, il répète ce
> mot encore et encore : en mon nom, en mon nom, en mon nom. À chaque fois, il y attache une
> promesse sans limite : « tout ce que », « ce que vous voudrez ». C'est sa manière de leur dire :
> voilà votre seule carte. Mais elle suffit pour tout. »

Même contenu. Même force. Lisible.
