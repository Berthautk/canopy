import { useState } from 'preact/hooks';
import { Icone, Embleme } from './Icone.jsx';
import { aller, retour } from '../outils/routeur.js';

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
export function Entete({ titre, surMenu }) {
  return (
    <header class="entete">
      <div class="entete__ligne">
        <button class="entete__btn" onClick={surMenu} aria-label="Ouvrir le menu"><Icone nom="menu" /></button>
        <a href="#/accueil" aria-label="Yeshaya, accueil"><Logo /></a>
        <button class="entete__btn" onClick={() => aller('parametres')} aria-label="Paramètres"><Icone nom="reglages" /></button>
      </div>
      {titre && (
        <div class="sous-titre">
          <button class="entete__btn" onClick={() => retour()} aria-label="Retour"><Icone nom="retour" /></button>
          <h1>{titre}</h1>
        </div>
      )}
    </header>
  );
}

const ONGLETS = [
  ['accueil', 'Accueil', 'accueil'],
  ['priere', 'Prière', 'priere'],
  ['grandir', 'Grandir', 'grandir'],
  ['evangeliser', 'Évangéliser', 'evangeliser'],
  ['bible', 'Bible', 'bible'],
];

export function BarreOnglets({ actif }) {
  return (
    <nav class="onglets" aria-label="Navigation principale">
      {ONGLETS.map(([id, libelle, icone]) => (
        <a class="onglet" href={'#/' + id} aria-current={actif === id ? 'page' : undefined}>
          <Icone nom={icone} />
          <span>{libelle}</span>
        </a>
      ))}
    </nav>
  );
}

const MENU = [
  ['jouer', 'Jouer et apprendre', 'trophee'],
  ['telechargements', 'Mes téléchargements', 'telecharger'],
  ['parametres', 'Paramètres', 'reglages'],
  ['a-propos', 'À propos de Yeshaya', 'info'],
];

export function Tiroir({ ouvert, fermer }) {
  if (!ouvert) return null;
  return (
    <>
      <div class="voile" onClick={fermer} />
      <aside class="tiroir" role="dialog" aria-label="Menu">
        <div class="tiroir__tete">
          <img src="/icons/icon-192.png" alt="" width="48" height="48" />
          <div>
            <h2 style="font-size:1.1rem">Yeshaya</h2>
            <p style="font-size:.8rem;color:var(--texte-doux)">« L'Éternel est salut »</p>
          </div>
        </div>
        <div class="liste">
          {MENU.map(([id, libelle, icone]) => (
            <a class="carte ligne" href={'#/' + id} onClick={fermer}>
              <span class="ligne__icone"><Icone nom={icone} /></span>
              <span class="ligne__corps"><span class="ligne__titre">{libelle}</span></span>
              <span class="ligne__fin"><Icone nom="chevron" taille={20} /></span>
            </a>
          ))}
        </div>
      </aside>
    </>
  );
}

export function useTiroir() {
  const [ouvert, setOuvert] = useState(false);
  return { ouvert, ouvrir: () => setOuvert(true), fermer: () => setOuvert(false) };
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
