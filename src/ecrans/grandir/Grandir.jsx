import { useState } from 'preact/hooks';
import { Icone } from '../../composants/Icone.jsx';
import { BoutonLecture, BoutonTelecharger } from '../../composants/Audio.jsx';
import { ENSEIGNEMENTS, AUDIOS, JOURS_PARCOURS, NIVEAUX } from '../../donnees/contenu.js';
import { parcours } from '../../donnees/priere.js';
import { useSignal } from '../../outils/signal.js';

function Enseignement({ e, n }) {
  const piste = AUDIOS[e.id];
  const lien = piste ? '#/ecouter/' + e.id : '#/grandir/enseignement/' + e.id;
  return (
    <article class="carte enseignement">
      <a href={lien}><img src={e.image} alt="" loading="lazy" /></a>
      <a class="ligne__corps" href={lien}>
        <span class="ligne__titre" style="display:block">{n && <span class="enseignement__num">{n}</span>}{e.titre} {e.exemple && <span class="etiquette-exemple">EXEMPLE</span>}</span>
        <span class="ligne__desc" style="display:block">{e.resume}</span>
        <span class="enseignement__meta"><Icone nom={piste ? 'musique' : 'bible'} taille={13} /> {piste ? `${e.auteur}${e.duree ? ' · ' + e.duree : ''}` : `À lire ou écouter · ${e.lecture_minutes} min${e.video ? ' · vidéo' : ''}`}</span>
      </a>
      {piste && <div class="enseignement__boutons"><BoutonLecture piste={piste} taille={40} /><BoutonTelecharger piste={piste} compact /></div>}
    </article>
  );
}

const PARCOURS = {
  'decouvrir-jesus': { lien: '#/grandir/decouvrir-jesus', image: '/assets/jesus/jesus-main-tendue.webp', titre: 'Découvrir Jésus : 10 leçons', desc: (p) => (p.dj?.length ? `${p.dj.length} leçon${p.dj.length > 1 ? 's' : ''} sur 10 terminée${p.dj.length > 1 ? 's' : ''}` : 'Qui est Jésus ? Comment lui donner ta vie ?'), progres: (p) => (p.dj?.length || 0) / 10 },
  'nouveau-converti': { lien: '#/grandir/nouveau-converti', image: '/assets/nouveau-converti/joie-de-la-rencontre.webp', titre: 'Nouveau converti : 30 jours', desc: (p) => (p.faits.length ? `${p.faits.length} jour${p.faits.length > 1 ? 's' : ''} sur ${JOURS_PARCOURS} terminé${p.faits.length > 1 ? 's' : ''}` : 'Bien commencer sa marche avec Jésus.'), progres: (p) => p.faits.length / JOURS_PARCOURS },
  formation: { lien: '#/grandir/formation', image: '/assets/symboles/croix-coucher-de-soleil.webp', titre: 'Former le disciple · 40 leçons', desc: () => "L'affermissement sur deux ans : enseignements, questions et travail de la semaine." },
  disciple: { lien: '#/disciple', image: '/assets/nouveau-converti/liste-de-progres.webp', titre: 'Mes outils de disciple', desc: () => 'Défis de 21 jours, verset de la semaine, témoignages, ma liste des 5.' },
  orizon: { lien: '#/orizon', image: '/assets/temoignage/chaines-brisees.webp', titre: '90 jours pour se libérer de la masturbation et de la pornographie', desc: () => 'Vaincre en 90 jours : chaque jour, un enseignement et une prière.' },
};

function CarteParcours({ id, p }) {
  const x = PARCOURS[id]; if (!x) return null;
  return (
    <a class="carte parcours-carte" href={x.lien} style="margin-bottom:10px">
      <img src={x.image} alt="" />
      <span class="ligne__corps">
        <span class="ligne__titre" style="display:block">{x.titre}</span>
        <span class="ligne__desc" style="display:block">{x.desc(p)}</span>
        {x.progres && <span class="progression progression--fine"><span style={{ width: x.progres(p) * 100 + '%' }} /></span>}
      </span>
      <Icone nom="chevron" taille={20} />
    </a>
  );
}

const lireNiveau = () => { try { return localStorage.getItem('yeshaya:niveau-grandir') || 'fondations'; } catch { return 'fondations'; } };
const simple = (t) => (t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// Écran 6 : Grandir. Les enseignements sont rangés par niveaux qui montent (Fondations, puis Maturité 1, 2, 3).
// Tout reste libre : on peut ouvrir n'importe quel enseignement, dans n'importe quel ordre.
export function Grandir() {
  const [niv, setNiv] = useState(lireNiveau);
  const [vue, setVue] = useState('themes');
  const [q, setQ] = useState('');
  const p = useSignal(parcours);
  const choisir = (n) => { setNiv(n); try { localStorage.setItem('yeshaya:niveau-grandir', n); } catch {} };
  const N = NIVEAUX.find((x) => x.id === niv);
  const parId = Object.fromEntries(ENSEIGNEMENTS.map((e) => [e.id, e]));
  const cle = vue === 'themes' ? 'theme' : 'serie';
  const trouves = q.trim().length > 1 ? ENSEIGNEMENTS.filter((e) => simple(e.titre + ' ' + e.resume + ' ' + e.theme + ' ' + e.auteur).includes(simple(q.trim()))) : null;
  const groupes = [...new Set(ENSEIGNEMENTS.map((e) => e[cle] || 'Autres'))];
  return (
    <div class="page">
      <div class="bandeau-titre">
        <img src="/assets/nouveau-converti/etude-de-la-bible.webp" alt="" />
        <div><h2>Grandir dans la foi</h2><p>Des enseignements rangés par niveaux, du nouveau converti au chrétien mûr.</p></div>
      </div>

      <div class="niveaux" role="tablist" aria-label="Niveaux">
        {NIVEAUX.map((n, i) => (
          <button role="tab" aria-selected={niv === n.id} class={'niveau-onglet niveau-onglet--' + i} onClick={() => choisir(n.id)}>
            <span class="niveau-onglet__marche" aria-hidden="true">{Array.from({ length: i + 1 }, () => <i />)}</span>
            <b>{n.nom}</b><span>{n.sous_titre}</span>
          </button>
        ))}
        <button role="tab" aria-selected={niv === 'tout'} class="niveau-onglet niveau-onglet--tout" onClick={() => choisir('tout')}>
          <span class="niveau-onglet__marche" aria-hidden="true"><Icone nom="recherche" taille={16} /></span>
          <b>Tout</b><span>Chercher librement</span>
        </button>
      </div>

      {N && <>
        <p class="niveau-description">{N.description}</p>
        {N.parcours.map((id) => <CarteParcours id={id} p={p} />)}
        <h2 class="titre-section">Les enseignements · {N.nom}</h2>
        <div class="liste">{N.enseignements.filter((id) => parId[id]).map((id, i) => <Enseignement e={parId[id]} n={i + 1} />)}</div>
        <p class="ligne__desc" style="margin:12px 4px 0">L'ordre proposé monte progressivement, mais tu peux écouter librement l'enseignement que tu veux.</p>
        {NIVEAUX[NIVEAUX.indexOf(N) + 1] && <button class="bouton bouton--contour" style="width:100%;margin-top:12px" onClick={() => { choisir(NIVEAUX[NIVEAUX.indexOf(N) + 1].id); scrollTo(0, 0); }}>
          Niveau suivant : {NIVEAUX[NIVEAUX.indexOf(N) + 1].nom} <Icone nom="chevron" taille={18} /></button>}
      </>}

      {niv === 'tout' && <>
        <form class="barre-recherche" style="margin-top:12px" onSubmit={(e) => e.preventDefault()} role="search">
          <Icone nom="recherche" taille={18} />
          <input class="barre-recherche__champ" type="search" value={q} onInput={(e) => setQ(e.currentTarget.value)} placeholder="Chercher un enseignement (prière, croix, jeûne…)" aria-label="Chercher un enseignement" />
        </form>
        {trouves ? <>
          <p class="ligne__desc" style="margin:10px 4px">{trouves.length} enseignement{trouves.length > 1 ? 's' : ''} trouvé{trouves.length > 1 ? 's' : ''}</p>
          <div class="liste">{trouves.map((e) => <Enseignement e={e} />)}</div>
        </> : <>
          <div class="onglets-internes" role="tablist" style="margin-top:12px">
            <button role="tab" aria-selected={vue === 'themes'} onClick={() => setVue('themes')}>Par thème</button>
            <button role="tab" aria-selected={vue === 'series'} onClick={() => setVue('series')}>Auteurs</button>
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
        </>}
      </>}
    </div>
  );
}
