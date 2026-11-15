import { useEffect, useMemo, useState } from 'preact/hooks';
import { lireAVoixHaute, arreterVoix } from '../../audio/voix.js';
import { melanger } from '../../jeux/hasard.js';

// Jeux des tout-petits (2 à 6 ans) : tout passe par la voix et les images, rien n'oblige à lire.
const dire = (t, id = 'petits') => lireAVoixHaute(id, [{ texte: t }]);
const J = '/assets/jeux/personnage-', O = '/assets/objets-bibliques/', L = '/assets/lieux-bibliques/', S = '/assets/scenes-bibliques/';

export const ALPHABET = [
  ['A', 'Abraham', J + 'abraham.webp'], ['B', 'Brebis', S + 'brebis-perdue.webp'], ['C', 'Colombe', O + 'colombe.webp'], ['D', 'Daniel', J + 'daniel.webp'],
  ['E', 'Esther', J + 'esther.webp'], ['F', 'Feu', '🔥'], ['G', 'Grotte', L + 'grotte.webp'], ['H', 'Harpe', '🎶'], ['I', 'Île', '🏝️'],
  ['J', 'Joseph', J + 'joseph.webp'], ['K', 'Kérith, le torrent', L + 'riviere.webp'], ['L', 'Lampe', O + 'lampe-a-huile.webp'], ['M', 'Moïse', J + 'moise.webp'],
  ['N', 'Noé', '🚢'], ['O', 'Olivier', L + 'oliveraie.webp'], ['P', 'Paul', J + 'paul.webp'], ['Q', 'Quarante jours au désert', '🏜️'], ['R', 'Ruth', J + 'ruth.webp'],
  ['S', 'Shofar', O + 'shofar.webp'], ['T', 'Temple', L + 'temple.webp'], ['U', 'Ur, la ville d\'Abraham', L + 'ruines-antiques.webp'], ['V', 'Vigne', O + 'pain-et-raisin.webp'],
  ['W', 'Wagon', '🚃'], ['X', 'Xerxès, le roi', '/assets/personnages/roi-biblique.webp'], ['Y', 'Yeshoua, c\'est Jésus', S + 'jesus-ressuscite-et-disciples.webp'], ['Z', 'Zachée', '🌳'],
];
const Image = ({ src, alt, grand }) => src.startsWith('/') ? <img src={src} alt={alt} class={grand ? 'petit-img petit-img--grand' : 'petit-img'} /> : <span class={grand ? 'petit-emoji petit-emoji--grand' : 'petit-emoji'} role="img" aria-label={alt}>{src}</span>;

export function PetitsAccueil() {
  useEffect(() => { dire('Bonjour ! Choisis un jeu : les lettres, compter, ou trouver l\'image.'); return () => arreterVoix(); }, []);
  const JEUX = [['alphabet', '🔤', 'Les lettres', '#f3b33d'], ['compter', '🔢', 'Compter', '#4caf7a'], ['trouver', '👆', 'Trouve l\'image', '#4a7fd6']];
  return (
    <div class="page petits">
      <div class="petits-grille">
        {JEUX.map(([id, e, t, c]) => <a class="petit-tuile" style={{ background: c }} href={'#/jouer/petits/' + id} onPointerDown={() => dire(t)}><span>{e}</span>{t}</a>)}
      </div>
    </div>
  );
}

export function Alphabet() {
  const [i, setI] = useState(null);
  useEffect(() => { dire('Touche une lettre pour l\'entendre.'); return () => arreterVoix(); }, []);
  const ouvrir = (k) => { setI(k); const [l, m] = ALPHABET[k]; dire(`${l}. ${l} comme ${m}.`); };
  if (i !== null) { const [l, m, img] = ALPHABET[i]; return (
    <div class="page petits">
      <button class="petit-carte" onClick={() => ouvrir(i)} aria-label={`${l} comme ${m}`}>
        <span class="petit-lettre">{l}<small>{l.toLowerCase()}</small></span>
        <Image src={img} alt={m} grand />
        <span class="petit-mot"><b>{m[0]}</b>{m.slice(1)}</span>
      </button>
      <div class="petits-nav">
        <button class="petit-rond" disabled={i === 0} onClick={() => ouvrir(i - 1)} aria-label="Lettre précédente">◀</button>
        <button class="petit-rond" onClick={() => setI(null)} aria-label="Toutes les lettres">🔤</button>
        <button class="petit-rond" disabled={i === ALPHABET.length - 1} onClick={() => ouvrir(i + 1)} aria-label="Lettre suivante">▶</button>
      </div>
    </div>); }
  return <div class="page petits"><div class="petits-lettres">{ALPHABET.map(([l], k) => <button class="petit-touche" style={{ '--t': (k * 37) % 360 }} onClick={() => ouvrir(k)}>{l}</button>)}</div></div>;
}

const CHOSES = [['🐑', 'brebis', 'brebis'], ['🐟', 'poisson', 'poissons'], ['🍞', 'pain', 'pains'], ['⭐', 'étoile', 'étoiles'], ['🕊️', 'colombe', 'colombes'], ['🐪', 'chameau', 'chameaux'], ['🦁', 'lion', 'lions'], ['🍇', 'grappe de raisin', 'grappes de raisin']];
const NOMBRES = ['zéro', 'un', 'deux', 'trois', 'quatre', 'cinq', 'six', 'sept', 'huit', 'neuf', 'dix'];
function nouvelleManche(max) { const n = 1 + Math.floor(Math.random() * max), c = CHOSES[Math.floor(Math.random() * CHOSES.length)];
  const autres = melanger([...Array(max).keys()].map((x) => x + 1).filter((x) => x !== n)).slice(0, 2); return { n, c, choix: melanger([n, ...autres]) }; }

export function Compter() {
  const [max, setMax] = useState(5), [m, setM] = useState(() => nouvelleManche(5)), [bon, setBon] = useState(null), [etoiles, setEtoiles] = useState(0);
  useEffect(() => { setBon(null); dire(`Combien de ${m.c[2]} vois-tu ?`); }, [m]);
  useEffect(() => () => arreterVoix(), []);
  const repondre = (x) => {
    if (x === m.n) { setBon(x); const e = etoiles + 1; setEtoiles(e); dire(`Bravo ! ${NOMBRES[m.n]} ${m.n > 1 ? m.c[2] : m.c[1]}.`);
      setTimeout(() => { const mx = e >= 5 ? 10 : 5; setMax(mx); setM(nouvelleManche(mx)); }, 2200); }
    else dire(`Non, ce n'est pas ${NOMBRES[x]}. Compte avec ton doigt.`);
  };
  return (
    <div class="page petits">
      <p class="petit-score" aria-label={`${etoiles} étoiles`}>{'⭐'.repeat(Math.min(etoiles, 10)) || '☆'}</p>
      <button class="petit-scene" onClick={() => dire(`Combien de ${m.c[2]} vois-tu ?`)} aria-label="Réécouter">
        {[...Array(m.n)].map((_, k) => <span class="petit-objet" style={{ animationDelay: k * 0.12 + 's' }}>{m.c[0]}</span>)}
      </button>
      <div class="petits-choix">
        {m.choix.map((x) => <button class={'petit-nombre' + (bon === x ? ' petit-nombre--bon' : '')} onClick={() => repondre(x)} aria-label={NOMBRES[x]}>
          <b>{x}</b><span>{'●'.repeat(x)}</span></button>)}
      </div>
    </div>
  );
}

const TROUVER = [...ALPHABET.filter((a) => a[2].startsWith('/')).map((a) => [a[1].split(',')[0], a[2]]), ['La croix', O + 'croix-sur-colline.webp'], ['Les pains et les poissons', O + 'pains-et-poissons.webp'], ['La barque', O + 'barque-et-filets.webp'], ['La couronne', O + 'couronne-or.webp'], ['Le tombeau vide', O + 'tombeau-vide.webp'], ['La crèche', O + 'creche.webp']];
export function Trouver() {
  const [tour, setTour] = useState(0), [rate, setRate] = useState(null), [ok, setOk] = useState(false);
  const m = useMemo(() => { const c = melanger(TROUVER).slice(0, 4); return { c, cible: c[Math.floor(Math.random() * 4)] }; }, [tour]);
  useEffect(() => { setRate(null); setOk(false); dire(`Touche : ${m.cible[0]}.`); }, [tour]);
  useEffect(() => () => arreterVoix(), []);
  const toucher = (x) => { if (x === m.cible) { setOk(true); dire(`Oui ! C'est ${m.cible[0]}. Bravo !`); setTimeout(() => setTour((t) => t + 1), 2000); } else { setRate(x); dire(`Ça, c'est ${x[0]}. Cherche encore : ${m.cible[0]}.`); } };
  return (
    <div class="page petits">
      <button class="petit-consigne" onClick={() => dire(`Touche : ${m.cible[0]}.`)}>🔊 Réécouter</button>
      <div class="petits-images">
        {m.c.map((x) => <button class={'petit-choix' + (ok && x === m.cible ? ' petit-choix--bon' : '') + (rate === x ? ' petit-choix--non' : '')} onClick={() => toucher(x)} aria-label={x[0]}>
          <img src={x[1]} alt="" /></button>)}
      </div>
    </div>
  );
}
