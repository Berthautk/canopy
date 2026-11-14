import { useState } from 'preact/hooks';
import { Icone } from '../../composants/Icone.jsx';
import { BoutonLecture, BoutonTelecharger } from '../../composants/Audio.jsx';
import { ENSEIGNEMENTS, AUDIOS, JOURS_PARCOURS } from '../../donnees/contenu.js';
import { parcours } from '../../donnees/priere.js';
import { useSignal } from '../../outils/signal.js';

function Enseignement({ e }) {
  const piste = AUDIOS[e.id];
  const lien = piste ? '#/ecouter/' + e.id : '#/grandir/enseignement/' + e.id;
  return (
    <article class="carte enseignement">
      <a href={lien}><img src={e.image} alt="" loading="lazy" /></a>
      <a class="ligne__corps" href={lien}>
        <span class="ligne__titre" style="display:block">{e.titre} {e.exemple && <span class="etiquette-exemple">EXEMPLE</span>}</span>
        <span class="ligne__desc" style="display:block">{e.resume}</span>
        <span class="enseignement__meta"><Icone nom={piste ? 'musique' : 'bible'} taille={13} /> {piste ? `${e.auteur}${e.duree ? ' · ' + e.duree : ''}` : `À lire ou écouter · ${e.lecture_minutes} min${e.video ? ' · vidéo' : ''}`}</span>
      </a>
      {piste && <div class="enseignement__boutons"><BoutonLecture piste={piste} taille={40} /><BoutonTelecharger piste={piste} compact /></div>}
    </article>
  );
}

// Écran 6 : Grandir (enseignements par thèmes, séries, tous les audios).
export function Grandir() {
  const [vue, setVue] = useState('themes');
  const p = useSignal(parcours);
  const cle = vue === 'themes' ? 'theme' : 'serie';
  const groupes = [...new Set(ENSEIGNEMENTS.map((e) => e[cle] || 'Autres'))];
  return (
    <div class="page">
      <div class="bandeau-titre">
        <img src="/assets/nouveau-converti/etude-de-la-bible.webp" alt="" />
        <div><h2>Grandir dans la foi</h2><p>Enseignements, séries et parcours pour une vie chrétienne solide.</p></div>
      </div>

      <a class="carte parcours-carte" href="#/grandir/decouvrir-jesus" style="margin-bottom:10px">
        <img src="/assets/jesus/jesus-main-tendue.webp" alt="" />
        <span class="ligne__corps">
          <span class="ligne__titre" style="display:block">Découvrir Jésus : 10 leçons</span>
          <span class="ligne__desc" style="display:block">{p.dj?.length ? `${p.dj.length} leçon${p.dj.length > 1 ? 's' : ''} sur 10 terminée${p.dj.length > 1 ? 's' : ''}` : 'Qui est Jésus ? Comment lui donner ta vie ?'}</span>
          <span class="progression progression--fine"><span style={{ width: ((p.dj?.length || 0) / 10) * 100 + '%' }} /></span>
        </span>
        <Icone nom="chevron" taille={20} />
      </a>
      <a class="carte parcours-carte" href="#/grandir/nouveau-converti">
        <img src="/assets/nouveau-converti/joie-de-la-rencontre.webp" alt="" />
        <span class="ligne__corps">
          <span class="ligne__titre" style="display:block">Nouveau converti : 30 jours</span>
          <span class="ligne__desc" style="display:block">{p.faits.length ? `${p.faits.length} jour${p.faits.length > 1 ? 's' : ''} sur ${JOURS_PARCOURS} terminé${p.faits.length > 1 ? 's' : ''}` : 'Bien commencer sa marche avec Jésus.'}</span>
          <span class="progression progression--fine"><span style={{ width: (p.faits.length / JOURS_PARCOURS) * 100 + '%' }} /></span>
        </span>
        <Icone nom="chevron" taille={20} />
      </a>
      <a class="jouer-carte" href="#/jouer" style="margin-top:10px">
        <img src="/assets/objets-bibliques/couronne-or.webp" alt="" loading="lazy" />
        <div><h2>Jouer et apprendre</h2><p>Quiz et jeux bibliques</p></div>
        <span class="jouer-carte__fleche"><Icone nom="chevron" taille={22} /></span>
      </a>

      <div class="onglets-internes" role="tablist" style="margin-top:16px">
        <button role="tab" aria-selected={vue === 'themes'} onClick={() => setVue('themes')}>Par thème</button>
        <button role="tab" aria-selected={vue === 'series'} onClick={() => setVue('series')}>Séries</button>
        <button role="tab" aria-selected={vue === 'tous'} onClick={() => setVue('tous')}>Tous<span class="onglets-internes__nb">{ENSEIGNEMENTS.length}</span></button>
      </div>
      {vue === 'tous'
        ? <div class="liste" style="margin-top:10px">{ENSEIGNEMENTS.map((e) => <Enseignement e={e} />)}</div>
        : groupes.map((g) => (
          <section>
            <h2 class="titre-section">{g}</h2>
            <div class="liste">{ENSEIGNEMENTS.filter((e) => (e[cle] || 'Autres') === g).map((e) => <Enseignement e={e} />)}</div>
          </section>
        ))}
    </div>
  );
}
