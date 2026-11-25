# Brief — Ajouts pour l'application « Vainqueur »

*Trois ajouts repris de Yeshaya : la bannière qui défile, la finesse du rendu, et les statistiques
personnelles. Document du 25 novembre 2026.*

---

## 0. Règle du jeu : on ajoute, on ne casse rien

**Rien de ce qui existe dans Vainqueur n'est supprimé, déplacé ni renommé.**
Aucune rubrique ne disparaît, aucun écran n'est refait, la barre du bas ne change pas, le lecteur
audio, la Bible, le hors connexion, le prénom et les mises à jour continuent exactement comme avant.

Ce brief ajoute **trois choses** et **affine** l'apparence :

| N° | Ajout | Où | Fichiers nouveaux |
|---|---|---|---|
| 1 | Une **bannière qui défile** en haut de l'accueil | Accueil | `js/carrousel.js` |
| 2 | Un **rendu plus fin** (couleurs, espaces, tuiles) | Partout | rien, que du CSS |
| 3 | **Mes statistiques** : ce que la personne utilise le plus | Accueil (+ une page) | `js/temps.js` |

Chacun peut être installé seul. Si un ajout ne plaît pas, on l'enlève sans toucher au reste.

**Compatible avec les contraintes de Vainqueur** : HTML, CSS et JavaScript simples (modules ES),
aucun framework, aucune étape de compilation, aucune bibliothèque extérieure, tout fonctionne hors
connexion, rien n'est envoyé sur un serveur.

---

## 1. La bannière qui défile

### Ce que c'est

En haut de l'accueil, une grande image (format 16/9, coins arrondis) avec, écrit dessus en bas :
une petite étiquette dorée, un titre, une ligne d'explication. **Elle change toute seule toutes les
6 secondes**, en glissant vers la gauche. Des petits points en dessous disent où l'on en est.

Elle contient **ce qui change chaque jour**. Pour Vainqueur, je propose ces quatre :

1. **Parole du jour** — le verset du jour, qui ouvre la Bible dessus.
2. **Prière du jour** — la fiche du jour (thème de la semaine).
3. **Message du jour** — s'il y en a un.
4. **Adoration à écouter** — une adoration de Nayla.

Quatre, c'est le bon nombre : assez pour donner envie, assez peu pour que tout repasse en 24 secondes.

### Le point important : la boucle

Après la dernière bannière, **la première doit revenir par la droite**, dans le même mouvement.
Elle ne doit **jamais** rembobiner en repassant à l'envers devant toutes les autres. C'est laid et
ça donne l'impression d'un bug.

La technique : on affiche **un double de la dernière avant la première, et un double de la première
après la dernière**. Quand le défilement s'arrête sur un double, on saute sans animation sur
l'original. L'œil ne voit rien, le mouvement reste toujours vers la droite.

### Le HTML

```html
<section class="carrousel" id="carrousel-jour" aria-roledescription="carrousel" aria-label="À la une aujourd'hui">
  <div class="carrousel__piste"></div>
  <div class="carrousel__points"></div>
</section>
```

### Le CSS (à ajouter dans `css/app.css`)

```css
.carrousel { margin: 0 -16px 4px; }
.carrousel__piste {
  display: flex; overflow-x: auto; scroll-snap-type: x mandatory;
  scrollbar-width: none; overscroll-behavior-x: contain; -webkit-overflow-scrolling: touch;
}
.carrousel__piste::-webkit-scrollbar { display: none; }
.carrousel__case { flex: 0 0 100%; min-width: 0; scroll-snap-align: center; padding: 0 16px; box-sizing: border-box; }

.diapo {
  position: relative; display: block; border-radius: 18px; overflow: hidden;
  aspect-ratio: 16 / 9; background: var(--bleu-nuit); box-shadow: var(--ombre);
}
.diapo img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; }
.diapo::after {
  content: ''; position: absolute; inset: 0;
  background: linear-gradient(to top, rgba(15,31,92,.92) 2%, rgba(15,31,92,.6) 42%, rgba(15,31,92,.05) 78%);
}
.diapo__texte { position: absolute; z-index: 1; left: 15px; right: 15px; bottom: 13px; display: grid; gap: 3px; color: #fff; }
.diapo__etiquette {
  justify-self: start; font-weight: 600; font-size: .68rem; letter-spacing: .06em; text-transform: uppercase;
  padding: 3px 9px; border-radius: 999px; background: var(--or); color: var(--bleu-nuit);
}
.diapo__texte b {
  font-family: var(--police-titre); font-weight: 700; font-size: 1.18rem; line-height: 1.22; color: #fff;
  text-shadow: 0 2px 10px rgba(0,0,0,.45);
  display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
}
.diapo__texte > span:last-child {
  font-size: .79rem; line-height: 1.3; color: #ecdfbe; text-shadow: 0 1px 8px rgba(0,0,0,.6);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}

.carrousel__points { display: flex; justify-content: center; align-items: center; gap: 6px; margin-top: 10px; }
.carrousel__points button {
  width: 7px; height: 7px; padding: 0; border: 0; border-radius: 999px;
  background: var(--bord, #E3E7F0); transition: width .25s, background .25s;
}
.carrousel__points button[aria-current='true'] { width: 22px; background: var(--or); }
```

### Le JavaScript — `js/carrousel.js` (fichier nouveau, à copier tel quel)

```js
// Bannières qui défilent toutes seules, en boucle sans fin.
// Après la dernière, la première revient par la droite : jamais de rembobinage.
// Un double de la dernière est placé avant la première, et un double de la première après la dernière ;
// quand le défilement s'arrête sur un double, on saute sans animation sur l'original.
export function carrousel(racine, diapos, delai = 6000) {
  const piste = racine.querySelector('.carrousel__piste');
  const zonePoints = racine.querySelector('.carrousel__points');
  const n = diapos.length;
  if (!n) { racine.hidden = true; return () => {}; }
  const boucle = n > 1, depart = boucle ? 1 : 0;
  const ordre = boucle ? [n - 1, ...diapos.map((_, k) => k), 0] : [0];

  // Construction : chaque case contient un lien .diapo
  piste.replaceChildren(...ordre.map((k, rang) => {
    const d = diapos[k];
    const caisse = document.createElement('div');
    caisse.className = 'carrousel__case';
    caisse.setAttribute('role', 'group');
    caisse.setAttribute('aria-roledescription', 'diapositive');
    caisse.setAttribute('aria-label', (k + 1) + ' sur ' + n);
    if (rang !== depart) caisse.setAttribute('aria-hidden', 'true');
    const a = document.createElement('a');
    a.className = 'diapo';
    a.href = d.lien;
    const img = document.createElement('img');
    img.src = d.image; img.alt = ''; img.loading = 'lazy';
    if (d.bas) img.style.objectPosition = 'center ' + d.bas;
    const txt = document.createElement('span');
    txt.className = 'diapo__texte';
    if (d.etiquette) { const e = document.createElement('span'); e.className = 'diapo__etiquette'; e.textContent = d.etiquette; txt.append(e); }
    const t = document.createElement('b'); t.textContent = d.titre; txt.append(t);
    if (d.texte) { const s = document.createElement('span'); s.textContent = d.texte; txt.append(s); }
    a.append(img, txt);
    caisse.append(a);
    return caisse;
  }));

  // Points
  const points = diapos.map((_, k) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.setAttribute('aria-label', 'Aller à la bannière ' + (k + 1));
    b.addEventListener('click', () => { attendre(); piste.scrollTo({ left: (k + depart) * pas(), behavior: 'smooth' }); });
    return b;
  });
  if (boucle) zonePoints.replaceChildren(...points); else zonePoints.hidden = true;

  const pas = () => Math.max(1, piste.clientWidth);
  const place = () => Math.round(piste.scrollLeft / pas());
  const marquer = (i) => points.forEach((b, k) => (k === i ? b.setAttribute('aria-current', 'true') : b.removeAttribute('aria-current')));

  // Position de départ : la vraie première, pas son double.
  const poser = () => { piste.scrollLeft = depart * pas(); };
  requestAnimationFrame(poser);
  addEventListener('resize', poser);

  // Suivi du défilement + saut invisible sur les doubles.
  let attente = false, arret = null;
  const surDefilement = () => {
    if (!attente) {
      attente = true;
      requestAnimationFrame(() => {
        attente = false;
        const p = place();
        marquer(boucle ? ((p - 1) % n + n) % n : 0);
      });
    }
    if (!boucle) return;
    clearTimeout(arret);
    arret = setTimeout(() => {
      const p = place();
      if (p === 0) piste.scrollTo({ left: n * pas(), behavior: 'auto' });          // double de la fin → vraie fin
      else if (p === n + 1) piste.scrollTo({ left: pas(), behavior: 'auto' });     // double du début → vrai début
    }, 170);
  };
  piste.addEventListener('scroll', surDefilement, { passive: true });
  marquer(0);

  // Pause de 15 s dès qu'on touche.
  let repos = 0;
  const attendre = () => { repos = Date.now() + 15000; };
  piste.addEventListener('pointerdown', attendre);
  piste.addEventListener('touchstart', attendre, { passive: true });
  piste.addEventListener('wheel', attendre, { passive: true });

  // Ne tourne que si la bannière est à l'écran.
  let visible = true;
  let oeil = null;
  if (typeof IntersectionObserver !== 'undefined') {
    oeil = new IntersectionObserver(([e]) => { visible = e.isIntersecting; }, { threshold: 0.3 });
    oeil.observe(piste);
  }

  // Défilement automatique, toujours vers la droite.
  let minuteur = null;
  let moinsDAnimations = false;
  try { moinsDAnimations = matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { /* sans matchMedia */ }
  if (boucle && !moinsDAnimations) {
    minuteur = setInterval(() => {
      if (document.hidden || !visible || Date.now() < repos) return;
      piste.scrollTo({ left: (place() + 1) * pas(), behavior: 'smooth' });
    }, delai);
  }

  // À appeler quand on quitte l'écran d'accueil.
  return () => {
    clearInterval(minuteur); clearTimeout(arret);
    removeEventListener('resize', poser);
    piste.removeEventListener('scroll', surDefilement);
    if (oeil) oeil.disconnect();
  };
}
```

### Comment l'utiliser dans `views/accueil.js`

```js
import { carrousel } from '../carrousel.js';

// … après avoir construit la page et récupéré le contenu du jour :
const diapos = [];
if (parole) diapos.push({
  lien: '#/bible/' + parole.lienBible, image: '/assets/fonds/parole.webp', bas: '40%',
  etiquette: 'Parole du jour', titre: '« ' + court(parole.texte, 95) + ' »',
  texte: parole.ref + ' · toucher pour la lire en grand',
});
if (ficheDuJour) diapos.push({
  lien: '#/priere/' + ficheDuJour.id, image: ficheDuJour.image,
  etiquette: 'Prière du jour', titre: ficheDuJour.titre, texte: ficheDuJour.duree + ' · enseignement puis 5 sujets',
});
if (messageDuJour) diapos.push({
  lien: '#/nouveautes', image: messageDuJour.image,
  etiquette: 'Message du jour', titre: messageDuJour.titre, texte: messageDuJour.sous,
});
if (adoration) diapos.push({
  lien: '#/nayla/' + adoration.id, image: adoration.image,
  etiquette: 'Adoration', titre: adoration.titre, texte: 'À écouter · ' + adoration.duree,
});

const fermer = carrousel(document.getElementById('carrousel-jour'), diapos);
// … et appeler fermer() quand on quitte l'accueil (sinon le minuteur continue de tourner)
```

Petite fonction utile :

```js
const court = (s, n) => (s && s.length > n ? s.slice(0, n).replace(/\s+\S*$/, '') + '…' : s || '');
```

### Les pièges à ne pas refaire

1. **Ne pas faire `scrollTo({left: 0})` pour revenir au début.** C'est exactement ce qui provoque le
   rembobinage. Toujours avancer vers la droite, et utiliser les doubles.
2. **Ne pas sauter pendant que le défilement est en cours.** D'où le délai de 170 ms : on attend que
   tout soit arrêté avant de sauter.
3. **Toujours arrêter le minuteur** quand on quitte l'écran, sinon il tourne pour rien et vide la batterie.
4. **Respecter « moins d'animations »** : si le téléphone le demande, la bannière ne bouge pas toute
   seule, mais on peut toujours la faire glisser au doigt.
5. **Laisser 15 secondes de calme après un toucher** : sinon la bannière part juste quand la personne
   est en train de lire.

---

## 2. Le rendu plus fin

Le but : ce qu'on a vu sur certaines applications professionnelles — **beaucoup de blanc, peu de
cadres, des ombres très douces, des photos qui respirent**. Le contraire de la carte avec bordure
épaisse et dégradé.

### Les variables à ajuster dans `css/app.css`

```css
:root {
  /* Les couleurs de Vainqueur ne changent pas. On adoucit seulement les cadres et les ombres. */
  --bord: #E8ECF4;                         /* au lieu d'un gris plus franc */
  --ombre: 0 2px 10px rgba(15, 31, 92, .07);   /* très douce : on la devine, on ne la voit pas */
  --ombre-forte: 0 6px 20px rgba(15, 31, 92, .10);
  --rayon: 16px;
  --rayon-s: 12px;
}
```

### Les cinq règles de finesse

1. **Moins de cadres.** Une carte sur deux n'a pas besoin de bordure **ni** d'ombre **ni** de fond.
   Si la carte contient déjà une photo, la photo suffit à la séparer du reste.
2. **Des ombres qu'on ne voit pas.** Une ombre doit se sentir, pas se remarquer. Si on la distingue
   nettement, elle est trop forte.
3. **De l'air.** 16 px entre les blocs, 18 px entre les rangées de tuiles, 22 px au-dessus d'un titre
   de section. C'est le vide qui fait le professionnel, pas la décoration.
4. **Deux tailles de texte par carte, pas trois.** Un titre, une explication. Le reste se supprime.
5. **Une seule couleur vive par écran.** L'or sert aux actions et à l'élément actif. Tout le reste
   reste en bleu nuit et en gris.

### Les titres de section

```css
.titre-section {
  font-size: 1.05rem; font-weight: 600; margin: 22px 4px 10px;
  display: flex; align-items: center; gap: 8px;
}
.titre-section::before { content: ''; width: 4px; height: 17px; border-radius: 2px; background: var(--or); }
```

Un petit trait doré avant le titre : discret, et ça range l'écran du premier coup d'œil.

---

## 3. Les tuiles affinées

### Le changement

**Avant** : l'image est dans le cadre, avec le texte écrit par-dessus ou à côté, le tout dans une
carte avec fond et bordure.

**Après** : **la photo d'abord, le titre et l'explication en dessous**, sur le fond de la page, sans
cadre et sans fond. C'est plus lisible (le texte n'est jamais sur une image chargée), plus léger, et
la photo ressort mieux.

### Le CSS

```css
.tuiles { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 18px 12px; }
.tuile { display: grid; align-content: start; gap: 2px; color: var(--titre); min-width: 0; }
.tuile img {
  width: 100%; aspect-ratio: 4 / 3; object-fit: cover;
  border-radius: 14px; display: block; margin-bottom: 8px; box-shadow: var(--ombre);
}
.tuile b { font-family: var(--police-titre); font-weight: 600; font-size: .98rem; line-height: 1.25; }
.tuile > span {
  font-size: .78rem; line-height: 1.35; color: var(--texte-doux);
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
}
.tuile:active img { filter: brightness(.93); }
```

### Le HTML

```html
<nav class="tuiles" aria-label="Rubriques">
  <a class="tuile" href="#/priere">
    <img src="/assets/tuiles/priere.webp" alt="" loading="lazy">
    <b>Prière</b><span>Fiches guidées, matin et soir</span>
  </a>
  <!-- … les autres -->
</nav>
```

### Deux conseils

- **L'explication peut être vivante.** Au lieu de « Fiches guidées », écrire l'état du jour :
  « Thème de la semaine · jour 3 sur 7 ». La tuile devient utile, pas seulement décorative.
- **Ne jamais changer la taille d'un bouton sous le doigt** (`transform: scale`) : sur certains
  Android, le premier toucher est ignoré. Assombrir seulement, avec `filter: brightness`.

---

## 4. Mes statistiques personnelles

### Ce que c'est

Sur l'accueil, en bas : **« Mes temps avec Dieu »**, quatre petites tuiles claires qui montrent, sur
les 7 derniers jours, les activités que la personne a le plus vécues — avec les minutes, une barre et
un pourcentage.

Exemple réel :

| | |
|---|---|
| **Lecture de la Bible** — 1 h 10 — 33 % | **Adorations** — 1 h 10 — 33 % |
| **Prière** — 45 min — 21 % | **Cœurs brisés** — 15 min — 7 % |

### Pourquoi c'est important

Ce n'est pas un gadget. C'est ce qui donne envie de revenir : la personne voit qu'elle avance, et
elle voit ce qu'elle néglige. Mais il y a une **règle absolue** :

> **Tout reste sur le téléphone. Rien n'est envoyé nulle part, jamais.**
> C'est le miroir de la personne, pas un outil de surveillance.

Il faut l'écrire noir sur blanc sous le bloc : « Ce décompte reste sur ton téléphone. »

### Comment on mesure

On compte **le temps passé dans chaque rubrique**, en secondes, à partir du routeur. Dès qu'on change
d'écran, on ferme le compteur de l'ancienne rubrique. On plafonne à 20 minutes par passage, pour que
le téléphone oublié ouvert sur une page ne fausse pas tout.

### Le JavaScript — `js/temps.js` (fichier nouveau)

```js
// Temps passé par rubrique. Tout reste sur ce téléphone : rien n'est envoyé.
const CLE = 'vainqueur:temps';

export const ACTIVITES = {
  priere:    { nom: 'Prière',        icone: '🙏' },
  adoration: { nom: 'Adorations',    icone: '🎧' },
  coeurs:    { nom: 'Cœurs brisés',  icone: '❤️' },
  parole:    { nom: 'La Bible',      icone: '📖' },
  affaires:  { nom: 'Affaires',      icone: '💼' },
  evangile:  { nom: 'Évangélisation', icone: '📣' },
};

// Quelle rubrique correspond à la route en cours ? (à adapter aux routes de Vainqueur)
const RUBRIQUE = (chemin) => {
  const a = chemin.split('/')[0];
  if (a === 'priere') return 'priere';
  if (a === 'nayla') return 'adoration';
  if (a === 'coeurs') return 'coeurs';
  if (a === 'bible') return 'parole';
  if (a === 'affaires') return 'affaires';
  if (a === 'evangelisation' || a === 'salut') return 'evangile';
  return null;
};

const lire = () => { try { return JSON.parse(localStorage.getItem(CLE) || '{}'); } catch (e) { return {}; } };
const ecrire = (v) => { try { localStorage.setItem(CLE, JSON.stringify(v)); } catch (e) { /* stockage plein ou bloqué */ } };
const jourCle = (d = new Date()) =>
  d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');

function ajouter(activite, secondes) {
  if (!ACTIVITES[activite] || secondes <= 0) return;
  const t = lire(), j = jourCle();
  t[j] = t[j] || {};
  t[j][activite] = (t[j][activite] || 0) + Math.round(secondes);
  // Ménage : on ne garde que 60 jours.
  const limite = jourCle(new Date(Date.now() - 60 * 864e5));
  for (const k of Object.keys(t)) if (k < limite) delete t[k];
  ecrire(t);
}

let courant = null, depuis = 0;
function cloturer() {
  if (courant && depuis) ajouter(courant, Math.min((Date.now() - depuis) / 1000, 20 * 60));
  depuis = 0;
}

// À appeler à CHAQUE changement de route, depuis js/main.js.
export function suivre(chemin) {
  cloturer();
  courant = RUBRIQUE(chemin);
  depuis = courant ? Date.now() : 0;
}

// On n'oublie pas de compter quand la personne quitte ou verrouille son téléphone.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') cloturer();
  else if (courant) depuis = Date.now();
});
addEventListener('pagehide', cloturer);

// Bilan sur N jours : { activite: minutes }
export function bilan(jours = 7) {
  const t = lire(), res = {};
  for (const k of Object.keys(ACTIVITES)) res[k] = 0;
  for (let i = 0; i < jours; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const q = t[jourCle(d)] || {};
    for (const [k, s] of Object.entries(q)) if (res[k] !== undefined) res[k] += s / 60;
  }
  return res;
}
```

Dans `js/main.js`, une seule ligne à ajouter là où la route change :

```js
import { suivre } from './temps.js';
// … dans la fonction qui affiche un écran :
suivre(chemin);
```

### Le bloc sur l'accueil

```js
import { bilan, ACTIVITES } from '../temps.js';

const duree = (m) => (m >= 60 ? Math.floor(m / 60) + ' h ' + String(Math.round(m % 60)).padStart(2, '0') : Math.round(m) + ' min');

export function blocTemps() {
  const b = bilan(7);
  const l = Object.entries(b)
    .map(([k, minutes]) => ({ k, ...ACTIVITES[k], minutes }))
    .filter((x) => x.minutes >= 1)
    .sort((a, c) => c.minutes - a.minutes);
  const total = l.reduce((s, x) => s + x.minutes, 0);
  if (!total) return null;                     // rien à montrer la première semaine : on n'affiche pas le bloc

  const section = document.createElement('section');
  section.innerHTML =
    '<h2 class="titre-section">Mes temps avec Dieu</h2>' +
    '<p class="note">Ces 7 derniers jours, ' + duree(total) + ' au total. Ce décompte reste sur ton téléphone.</p>' +
    '<div class="stats-perso">' + l.slice(0, 4).map((x) =>
      '<div class="stat-perso">' +
        '<span class="stat-perso__nom">' + x.icone + ' ' + x.nom + '</span>' +
        '<b>' + duree(x.minutes) + '</b>' +
        '<span class="stat-perso__part"><i style="width:' + Math.max(4, (x.minutes / total) * 100) + '%"></i></span>' +
        '<span class="stat-perso__pc">' + Math.round((x.minutes / total) * 100) + ' % de ton temps</span>' +
      '</div>').join('') + '</div>';
  return section;
}
```

### Le CSS

```css
.stats-perso { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.stat-perso {
  display: grid; gap: 3px; padding: 12px; border-radius: 14px;
  background: var(--surface-2, #F7F8FC); border: 1px solid var(--bord); min-width: 0;
}
.stat-perso__nom { font-size: .76rem; color: var(--texte-doux); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
.stat-perso b { font-family: var(--police-titre); font-weight: 700; font-size: 1.22rem; color: var(--titre); line-height: 1.1; }
.stat-perso__part { display: block; height: 5px; border-radius: 999px; background: var(--bord); overflow: hidden; margin-top: 3px; }
.stat-perso__part i { display: block; height: 100%; border-radius: 999px; background: var(--or); }
.stat-perso__pc { font-size: .72rem; color: var(--texte-doux); }
```

### Pour aller plus loin (facultatif)

Une page « Mon parcours » qui montre la même chose sur 30 jours, avec le nombre de fiches priées, de
jours d'affilée, d'adorations écoutées. Mais commencer par le bloc de l'accueil : c'est lui qui est vu.

---

## 5. Ordre de travail conseillé

1. **Les tuiles affinées** (partie 3). C'est le plus rapide, que du CSS, et ça change tout l'écran.
2. **Le rendu plus fin** (partie 2). Variables, ombres, espaces, titres de section.
3. **La bannière qui défile** (partie 1). Copier `carrousel.js`, ajouter le CSS, brancher l'accueil.
4. **Les statistiques** (partie 4). Copier `temps.js`, brancher une ligne dans le routeur, ajouter le bloc.

Entre chaque étape, publier et regarder sur un vrai téléphone.

## 6. Ce qu'il faut vérifier avant de publier

- [ ] La bannière avance toute seule, **toujours vers la droite**, et la première revient sans rembobiner.
- [ ] Un toucher arrête le défilement pendant 15 secondes.
- [ ] Rien ne dépasse à droite sur un écran de 360 px de large.
- [ ] Hors connexion, les bannières s'affichent (les images sont dans le cache).
- [ ] Les statistiques montent quand on reste dans une rubrique, et le bloc n'apparaît pas tant qu'il
      n'y a rien à montrer.
- [ ] Après avoir changé le CSS, **monter `VERSION` dans `sw.js`**, sinon les anciens fichiers restent.
- [ ] Vérifier qu'aucune accolade CSS n'a été laissée ouverte : un sélecteur orphelin avale la règle
      suivante, et une image peut alors couvrir tout l'écran. (C'est arrivé pendant ce travail.)
- [ ] Tester en thème sombre si Vainqueur en a un.

## 7. Ce qui ne doit surtout pas changer

- La barre du bas et ses cinq onglets.
- Le lecteur audio global et la lecture qui continue d'un écran à l'autre.
- La Bible, les plans, les marques, le mode intervention.
- Le hors connexion, les téléchargements, le prénom, la mise à jour sur clic.
- Toutes les rubriques existantes, leurs noms et leurs contenus.
- Le badge « Exemple » sur tout contenu de démonstration.
- Les règles de la section 6 du brief d'origine (double toucher, Google Drive, lecteur YouTube, etc.).

---

*Ces quatre ajouts tournent en production dans Yeshaya depuis le 25 novembre 2026. Le code donné ici
est la version vanilla, adaptée à Vainqueur, sans framework ni étape de compilation.*
