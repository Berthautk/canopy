import { useState } from 'preact/hooks';
import { Icone } from '../../composants/Icone.jsx';
import { TelechargementBible } from '../../composants/TelechargementBible.jsx';
import { positionLecture } from '../../donnees/annotations.js';
import { PAR_CODE } from '../../bible/references.js';
import { useSignal } from '../../outils/signal.js';
import { aller } from '../../outils/routeur.js';

const CARTES = [
  ['bible/livres', 'Lire la Bible', 'Tous les livres, chapitre par chapitre.', 'bible', '/assets/objets-bibliques/bible-ouverte.webp'],
  ['bible/plan', 'Plan 1 an', 'Lire toute la Bible en 365 jours.', 'calendrier', '/assets/objets-quotidien/calendrier.webp'],
  ['bible/meditation', 'Méditation du matin', 'Un verset, une réflexion, une prière.', 'soleil', '/assets/paysages/lever-soleil-collines.webp'],
  ['bible/sujets', 'Versets par sujet', 'Paix, peur, deuil, pardon, foi…', 'coeur', '/assets/symboles/mains-ouvertes-lumiere.webp'],
];

// Écran 15 : accueil de la Bible.
export function BibleAccueil() {
  const pos = useSignal(positionLecture);
  const [q, setQ] = useState('');
  const chercher = (e) => { e.preventDefault(); if (q.trim()) aller('bible/recherche?q=' + encodeURIComponent(q.trim())); };

  return (
    <div class="page bible-accueil">
      <div class="bandeau-titre">
        <img src="/assets/symboles/bible-dans-la-lumiere.webp" alt="" />
        <div>
          <h2>La Bible</h2>
          <p>Louis Segond 1910</p>
        </div>
      </div>

      <form class="barre-recherche" onSubmit={chercher} role="search">
        <Icone nom="recherche" taille={20} />
        <input class="barre-recherche__champ" type="search" value={q} onInput={(e) => setQ(e.currentTarget.value)}
          placeholder="Mot ou référence (Jn 3 16)" aria-label="Rechercher dans la Bible" enterkeyhint="search" />
      </form>

      {pos && (
        <a class="carte reprendre" href={`#/bible/lire/${pos.code}/${pos.c}`}>
          <span class="reprendre__icone"><Icone nom="lecture" taille={20} /></span>
          <span class="ligne__corps">
            <span class="ligne__desc" style="display:block">Reprendre ma lecture</span>
            <span class="ligne__titre">{PAR_CODE[pos.code].nom} {pos.c}</span>
          </span>
          <Icone nom="chevron" taille={20} />
        </a>
      )}

      <div class="grille-cartes">
        {CARTES.map(([lien, titre, texte, icone, image]) => (
          <a class="carte carte-image" href={'#/' + lien}>
            <img src={image} alt="" loading="lazy" />
            <span class="carte-image__corps">
              <span class="carte-image__icone"><Icone nom={icone} taille={18} /></span>
              <span class="carte-image__titre">{titre}</span>
              <span class="carte-image__texte">{texte}</span>
            </span>
          </a>
        ))}
      </div>

      <div class="liste" style="margin-top:12px">
        <a class="carte ligne" href="#/bible/chemin">
          <span class="ligne__icone"><Icone nom="croix" /></span>
          <span class="ligne__corps"><span class="ligne__titre">Le chemin du salut</span>
            <span class="ligne__desc" style="display:block">8 versets pour comprendre et partager l'Évangile.</span></span>
          <Icone nom="chevron" taille={20} />
        </a>
        <a class="carte ligne" href="#/bible/ressources">
          <span class="ligne__icone"><Icone nom="etoile" /></span>
          <span class="ligne__corps"><span class="ligne__titre">Mes favoris, surlignages et notes</span></span>
          <Icone nom="chevron" taille={20} />
        </a>
      </div>

      <div style="margin-top:12px"><TelechargementBible /></div>
    </div>
  );
}
