import { useState, useEffect, useRef } from 'preact/hooks';
import { Icone, Embleme } from './Icone.jsx';
import { aller, retour, revenir, provenance, route, viaOnglet } from '../outils/routeur.js';
import { Avatar } from './Avatar.jsx';
import { profil } from '../donnees/profil.js';
import { useSignal } from '../outils/signal.js';
import { reglages, modifierReglages } from '../donnees/reglages.js';
import { installation, installer } from '../outils/telephone.js';
import { aDuNouveau, dernierVu } from '../ecrans/Nouveautes.jsx';

// Bandeau « Installer » sous l'en-tête, sur toutes les pages, tant que l'app n'est pas installée.
// Un toucher : la fenêtre d'installation du téléphone s'ouvre. Sinon, on montre comment faire.
function BandeauInstaller() {
  const i = useSignal(installation), r = useSignal(route);
  const [cache, setCache] = useState(() => { try { return Date.now() - Number(localStorage.getItem('yeshaya:installer-cache') || 0) < 7 * 864e5; } catch { return false; } });
  if (i.installee || cache || !['accueil', 'plus'].includes(r.segments[0]) || r.segments[0] === 'telechargements') return null;
  const toucher = async () => { if (i.pret) { await installer(); } else aller('telechargements'); };
  return (
    <div class="bandeau-installer">
      <button class="bandeau-installer__btn" onClick={toucher}><Icone nom="telecharger" taille={18} /><span>Installer Yeshaya sur mon téléphone</span></button>
      <button class="bandeau-installer__fermer" aria-label="Masquer pendant une semaine"
        onClick={() => { setCache(true); try { localStorage.setItem('yeshaya:installer-cache', String(Date.now())); } catch {} }}><Icone nom="fermer" taille={16} /></button>
    </div>
  );
}

export function Logo() {
  return (
    <div class="logo">
      <Embleme class="logo__embleme" />
      <div>
        <div class="logo__nom">YESHAYA</div>
        <div class="logo__slogan">L'ÉTERNEL EST SALUT</div>
      </div>
    </div>
  );
}

// En-tête commun. `titre` ajoute la barre secondaire avec le bouton retour (écrans de détail).
export function Entete({ titre }) {
  useSignal(dernierVu);
  // Hauteur réelle de l'en-tête (elle varie avec le bandeau « Installer » et le titre) : les barres collantes se placent dessous.
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const maj = () => document.documentElement.style.setProperty('--haut-entete', el.getBoundingClientRect().height + 'px');
    maj(); if (typeof ResizeObserver === 'undefined') return;
    const o = new ResizeObserver(maj); o.observe(el); return () => o.disconnect();
  }, []);
  return (
    <header class="entete" ref={ref}>
      <div class="entete__ligne">
        <a class="entete__btn entete__cloche" href="#/nouveautes" aria-label={aDuNouveau() ? 'Nouveautés : il y a du nouveau' : 'Nouveautés'}><Icone nom="cloche" />{aDuNouveau() && <i class="entete__pastille" aria-hidden="true" />}</a>
        <a href="#/accueil" aria-label="Yeshaya, accueil"><Logo /></a>
        <button class="entete__btn" onClick={() => aller('parametres')} aria-label="Paramètres"><Icone nom="reglages" /></button>
      </div>
      <BandeauInstaller />
      {titre && (
        <div class="sous-titre">
          <button class="entete__btn" onClick={() => retour()} aria-label="Retour"><Icone nom="retour" /></button>
          <h1>{titre}</h1>
          <BoutonRevenir />
        </div>
      )}
    </header>
  );
}

const ONGLETS = [
  ['accueil', 'Accueil', 'accueil'],
  ['priere', 'Prière', 'priere'],
  ['grandir', 'Grandir', 'grandir'],
  ['bible', 'Bible', 'bible'],
  ['plus', 'Plus', 'plus'],
];

// Bouton « Revenir » : visible dans la Bible quand on y est arrivé depuis une autre page (un verset dans une prière…).
export function BoutonRevenir() {
  const p = useSignal(provenance), r = useSignal(route);
  if (!p || !(r.segments[0] === 'bible' || r.segments[0] === 'montrer')) return null;
  return (
    <button class="revenir-pastille" onClick={revenir} aria-label={'Revenir à ' + (p.titre || 'la page précédente')}>
      <Icone nom="retour" taille={16} /><span>{p.titre || 'Revenir'}</span>
    </button>
  );
}

export function BarreOnglets({ actif }) {
  return (
    <nav class="onglets" aria-label="Navigation principale">
      {ONGLETS.map(([id, libelle, icone]) => (
        <a class="onglet" href={'#/' + id} onClick={viaOnglet} aria-current={actif === id ? 'page' : undefined}>
          <Icone nom={icone} />
          <span>{libelle}</span>
        </a>
      ))}
    </nav>
  );
}

// Carte pour les sections qui arrivent dans les phases suivantes.
export function Bientot({ image, titre, texte }) {
  return (
    <div class="carte bientot">
      {image && <img src={image} alt="" loading="lazy" />}
      <span class="pastille pastille--or">Bientôt disponible</span>
      <h2 style="font-size:1.15rem">{titre}</h2>
      <p>{texte}</p>
    </div>
  );
}
