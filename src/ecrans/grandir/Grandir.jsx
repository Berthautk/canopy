import { useState } from 'preact/hooks';
import { Icone } from '../../composants/Icone.jsx';
import { BoutonLecture, BoutonTelecharger } from '../../composants/Audio.jsx';
import { ENSEIGNEMENTS, AUDIOS, JOURS_PARCOURS, NIVEAUX } from '../../donnees/contenu.js';
import { parcours } from '../../donnees/priere.js';
import { useSignal } from '../../outils/signal.js';
import { lectures } from '../../donnees/lectures.js';
import { aller } from '../../outils/routeur.js';

function Enseignement({ e, n }) {
  const piste = AUDIOS[e.id], lu = useSignal(lectures).lus.includes(e.id);
  const lien = piste ? '#/ecouter/' + e.id : '#/grandir/enseignement/' + e.id;
  return (
    <article class="carte enseignement">
      <a href={lien} tabindex="-1" aria-hidden="true"><img src={e.image} alt="" loading="lazy" /></a>
      <a class="ligne__corps" href={lien}>
        <span class="ligne__titre" style="display:block">{n && <span class={'enseignement__num' + (lu ? ' enseignement__num--lu' : '')}>{lu ? <Icone nom="verifie" taille={13} /> : n}</span>}{e.titre} {e.exemple && <span class="etiquette-exemple">EXEMPLE</span>}</span>
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
  accompagner: { lien: '#/accompagner', image: '/assets/nouveau-converti/etude-de-la-bible.webp', titre: 'Former le chrétien · accompagnement', desc: () => 'À deux : un pas par semaine, puis une rencontre avec ton accompagnateur. Carnet, bilan de vie, fiches de l\'accompagnateur.' },
  formation: { lien: '#/grandir/formation', image: '/assets/symboles/croix-coucher-de-soleil.webp', titre: 'Leçons d\'affermissement · 38 leçons', desc: () => "L'affermissement sur deux ans : enseignements, questions et travail de la semaine." },
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

const seriesDe = (N) => N.groupes?.length ? N.groupes : [{ titre: N.nom + ' · ' + N.sous_titre, description: N.description, enseignements: N.enseignements }];

// Carte d'une série : grande, visible, avec le nombre d'enseignements et la progression.
function CarteSerie({ niv, gi, g, parId, lus }) {
  const l = g.enseignements.filter((id) => parId[id]), faits = l.filter((id) => lus.includes(id)).length, img = parId[l[0]]?.image;
  if (!l.length) return null;   // série encore en préparation
  return (
    <a class="carte serie-carte" href={`#/grandir/serie/${niv}/${gi}`}>
      {img && <img src={img} alt="" loading="lazy" />}
      <span class="serie-carte__corps">
        <b>{g.titre}</b>
        <span class="serie-carte__nb">{l.length} enseignement{l.length > 1 ? 's' : ''}{faits ? ` · ${faits} lu${faits > 1 ? 's' : ''}` : ''}</span>
        {faits > 0 && <span class="progression progression--fine"><span style={{ width: (faits / l.length) * 100 + '%' }} /></span>}
      </span>
      <Icone nom="chevron" taille={20} />
    </a>
  );
}

// Page d'une série : tous ses enseignements, dans l'ordre conseillé.
export function SerieEnseignements({ niv, gi }) {
  const N = NIVEAUX.find((x) => x.id === niv); const series = N ? seriesDe(N) : []; const g = series[+gi];
  const parId = Object.fromEntries(ENSEIGNEMENTS.map((e) => [e.id, e]));
  if (!g) return <div class="page"><p class="ligne__desc" style="margin-top:16px">Série introuvable.</p></div>;
  const l = g.enseignements.filter((id) => parId[id]), suivante = series[+gi + 1];
  return (
    <div class="page">
      <p class="pastille pastille--or" style="margin-top:12px;display:inline-block">{N.nom} · série {+gi + 1} sur {series.length}</p>
      <h2 style="margin:8px 4px 4px">{g.titre}</h2>
      <p class="ligne__desc" style="margin:0 4px 12px">{g.description} L'ordre est conseillé, mais tout est libre.</p>
      <div class="liste">{l.map((id, i) => <Enseignement e={parId[id]} n={i + 1} />)}</div>
      {suivante
        ? <a class="bouton bouton--contour" style="width:100%;margin-top:14px" href={`#/grandir/serie/${niv}/${+gi + 1}`}>Série suivante : {suivante.titre} <Icone nom="chevron" taille={18} /></a>
        : <a class="bouton bouton--contour" style="width:100%;margin-top:14px" href="#/grandir/enseignements">Voir les autres niveaux</a>}
    </div>
  );
}

// Faire descendre l'écran jusqu'à un endroit, sous l'en-tête (après que le contenu a changé).
const allerA = (id) => setTimeout(() => {
  const el = document.getElementById(id); if (!el) return;
  const haut = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--haut-entete')) || 110;
  scrollTo({ top: el.getBoundingClientRect().top + scrollY - haut - 8, behavior: 'smooth' });
}, 60);

const lireNiveau = () => { try { return localStorage.getItem('yeshaya:niveau-grandir') || 'fondations'; } catch { return 'fondations'; } };
const simple = (t) => (t || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

// Écran 6 : Grandir. Les enseignements sont rangés par niveaux qui montent (Fondations, puis Maturité 1, 2, 3).
// Tout reste libre : on peut ouvrir n'importe quel enseignement, dans n'importe quel ordre.
export function Enseignements() {
  const [niv, setNiv] = useState(lireNiveau);
  const [vue, setVue] = useState('themes');
  const [q, setQ] = useState('');
  const p = useSignal(parcours), { lus, dernier } = useSignal(lectures);
  const choisir = (n) => { setNiv(n); try { localStorage.setItem('yeshaya:niveau-grandir', n); } catch {} };
  const N = NIVEAUX.find((x) => x.id === niv);
  const parId = Object.fromEntries(ENSEIGNEMENTS.map((e) => [e.id, e]));
  const cle = vue === 'themes' ? 'theme' : 'serie';
  const mot = simple(q.trim());
  const trouves = mot.length > 1 ? ENSEIGNEMENTS.filter((e) => simple(e.titre + ' ' + e.resume + ' ' + e.theme + ' ' + e.auteur).includes(mot))
    .sort((a, b) => simple(b.titre).includes(mot) - simple(a.titre).includes(mot)) : null;
  const reprise = dernier && !lus.includes(dernier) ? parId[dernier] : null;
  const groupes = [...new Set(ENSEIGNEMENTS.map((e) => e[cle] || 'Autres'))];
  return (
    <div class="page">
      <div class="bandeau-titre">
        <img src="/assets/nouveau-converti/etude-de-la-bible.webp" alt="" />
        <div><h2>Les enseignements</h2><p>Rangés par niveaux, du nouveau converti au chrétien mûr.</p></div>
      </div>

      <form class="barre-recherche" style="margin-top:12px" onSubmit={(e) => e.preventDefault()} role="search">
        <Icone nom="recherche" taille={18} />
        <input class="barre-recherche__champ" type="search" value={q} onInput={(e) => setQ(e.currentTarget.value)} placeholder={`Chercher parmi les ${ENSEIGNEMENTS.length} enseignements`} aria-label="Chercher un enseignement" />
      </form>

      {trouves ? <>
        <p class="ligne__desc" style="margin:10px 4px">{trouves.length} enseignement{trouves.length > 1 ? 's' : ''} trouvé{trouves.length > 1 ? 's' : ''}</p>
        <div class="liste">{trouves.map((e) => <Enseignement e={e} />)}</div>
      </> : <>

      {reprise && (
        <a class="carte ligne carte-parcours" href={'#/grandir/enseignement/' + reprise.id} style="margin-top:12px">
          <img src={reprise.image} alt="" loading="lazy" />
          <span class="ligne__corps"><span class="pastille pastille--or pastille--mini">Reprendre</span>
            <span class="ligne__titre" style="display:block">{reprise.titre}</span>
            <span class="ligne__desc">Là où tu t'es arrêté</span></span>
          <Icone nom="chevron" taille={20} />
        </a>
      )}

      <h2 class="titre-section">Choisis ton niveau</h2>
      <div class="niveaux" role="tablist" aria-label="Niveaux">
        {NIVEAUX.map((n, i) => (
          <button role="tab" aria-selected={niv === n.id} class={'niveau-onglet niveau-onglet--' + i} onClick={() => { choisir(n.id); allerA('niveau-contenu'); }}>
            <span class="niveau-onglet__marche" aria-hidden="true">{Array.from({ length: i + 1 }, () => <i />)}</span>
            <b>{n.nom} <small class="niveau-onglet__nb">{n.enseignements.filter((id) => parId[id]).length}</small></b><span>{n.sous_titre}</span>
          </button>
        ))}
        <button role="tab" aria-selected={niv === 'tout'} class="niveau-onglet niveau-onglet--tout" onClick={() => { choisir('tout'); allerA('niveau-contenu'); }}>
          <span class="niveau-onglet__marche" aria-hidden="true"><Icone nom="liste" taille={16} /></span>
          <b>Tout voir <small class="niveau-onglet__nb">{ENSEIGNEMENTS.length}</small></b><span>Par thème, par auteur, ou la liste complète</span>
        </button>
      </div>

      <div id="niveau-contenu" />
      {N && <>
        <h2 class="niveau-titre"><span class="niveau-titre__marche" aria-hidden="true">{Array.from({ length: NIVEAUX.indexOf(N) + 1 }, () => <i />)}</span>{N.nom} <small>{N.sous_titre}</small></h2>
        <p class="niveau-description">{N.description}</p>
        {N.parcours.length > 0 && <h2 class="titre-section">{N.id === 'fondations' ? 'Commence ici : les parcours guidés' : 'Parcours guidé'}</h2>}
        {N.parcours.map((id) => <CarteParcours id={id} p={p} />)}
        <h2 class="titre-section" id="series">{N.nom} : {N.enseignements.filter((id) => parId[id]).length} enseignements en {seriesDe(N).length} série{seriesDe(N).length > 1 ? 's' : ''}</h2>
        <p class="ligne__desc" style="margin:-4px 4px 10px">Touche une série pour voir tous ses enseignements.</p>
        <div class="series-grille">{seriesDe(N).map((g, gi) => <CarteSerie niv={N.id} gi={gi} g={g} parId={parId} lus={lus} />)}</div>
        {NIVEAUX[NIVEAUX.indexOf(N) + 1] && <button class="bouton bouton--contour" style="width:100%;margin-top:12px" onClick={() => { choisir(NIVEAUX[NIVEAUX.indexOf(N) + 1].id); allerA('niveau-contenu'); }}>
          Niveau suivant : {NIVEAUX[NIVEAUX.indexOf(N) + 1].nom} <Icone nom="chevron" taille={18} /></button>}
      </>}

      {niv === 'tout' && <>
          <h2 class="niveau-titre">Tous les enseignements <small>par thème, par auteur, ou la liste complète</small></h2>
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

const ouvrirNiveau = (n) => { try { localStorage.setItem('yeshaya:niveau-grandir', n); } catch {} aller('grandir/enseignements'); };

// Écran 6 : Grandir, une porte d'entrée claire. Chaque rubrique a sa propre page : on ne se perd plus.
export function Grandir() {
  const p = useSignal(parcours), { lus, dernier } = useSignal(lectures);
  const reprise = dernier && !lus.includes(dernier) ? ENSEIGNEMENTS.find((e) => e.id === dernier) : null;
  return (
    <div class="page">
      <div class="bandeau-titre">
        <img src="/assets/nouveau-converti/etude-de-la-bible.webp" alt="" />
        <div><h2>Grandir dans la foi</h2><p>Choisis ce dont tu as besoin aujourd'hui.</p></div>
      </div>

      {reprise && (
        <a class="carte ligne carte-parcours" href={'#/grandir/enseignement/' + reprise.id} style="margin-top:12px">
          <img src={reprise.image} alt="" loading="lazy" />
          <span class="ligne__corps"><span class="pastille pastille--or pastille--mini">Reprendre</span>
            <span class="ligne__titre" style="display:block">{reprise.titre}</span>
            <span class="ligne__desc">Là où tu t'es arrêté</span></span>
          <Icone nom="chevron" taille={20} />
        </a>
      )}

      <section class="carte bloc par-ou">
        <h3 style="margin:0 0 4px">Par où commencer ?</h3>
        <button class="par-ou__choix" onClick={() => aller('grandir/decouvrir-jesus')}><b>Je viens de donner ma vie à Jésus</b><span>« Découvrir Jésus » : 10 leçons, à ton rythme</span><Icone nom="chevron" taille={18} /></button>
        <button class="par-ou__choix" onClick={() => ouvrirNiveau('fondations')}><b>Je suis chrétien depuis peu</b><span>Les Fondations : salut, affermissement, Bible</span><Icone nom="chevron" taille={18} /></button>
        <button class="par-ou__choix" onClick={() => ouvrirNiveau('maturite-1')}><b>Je veux aller plus loin</b><span>Maturité 1 à 5 : prière, caractère, sainteté, l'islam…</span><Icone nom="chevron" taille={18} /></button>
      </section>

      <h2 class="titre-section">1 · Bien commencer</h2>
      <CarteParcours id="decouvrir-jesus" p={p} />
      <CarteParcours id="nouveau-converti" p={p} />

      <h2 class="titre-section">2 · Apprendre la Parole</h2>
      <a class="carte parcours-carte" href="#/grandir/enseignements" style="margin-bottom:10px">
        <img src="/assets/objets-quotidien/bible-ouverte-sur-table.webp" alt="" />
        <span class="ligne__corps"><span class="ligne__titre" style="display:block">Tous les enseignements</span>
          <span class="ligne__desc" style="display:block">{ENSEIGNEMENTS.length} enseignements en {NIVEAUX.length} niveaux. Cherche un sujet, un thème ou un auteur.</span></span>
        <Icone nom="chevron" taille={20} />
      </a>
      <CarteParcours id="formation" p={p} />

      <h2 class="titre-section">3 · Être accompagné</h2>
      <CarteParcours id="accompagner" p={p} />
      <CarteParcours id="disciple" p={p} />

      <h2 class="titre-section">4 · Être libre d'une habitude</h2>
      <CarteParcours id="orizon" p={p} />
    </div>
  );
}
