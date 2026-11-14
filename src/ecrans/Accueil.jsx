import { Icone } from '../composants/Icone.jsx';
import { usePassage, TextePassage, cheminMontrer } from '../composants/Verset.jsx';
import { TelechargementBible } from '../composants/TelechargementBible.jsx';
import { versetDuJour, audioDuJour } from '../donnees/contenu.js';
import { BoutonLecture } from '../composants/Audio.jsx';
import { derniereEcoute, jouer, formatTemps, lecteur } from '../audio/lecteur.js';
import { useSignal } from '../outils/signal.js';
import { reglages } from '../donnees/reglages.js';
import { choisirStats } from '../donnees/mesure.js';
import { ecrireReference } from '../bible/references.js';

const ACCES = [
  ['priere', 'Prière', 'priere', 'var(--tuile-priere)', '#2F6FB5'],
  ['grandir', 'Grandir', 'grandir', 'var(--tuile-grandir)', '#3E8A3A'],
  ['evangeliser', 'Évangéliser', 'evangeliser', 'var(--tuile-evang)', '#B7832A'],
  ['bible', 'Bible', 'bible', 'var(--tuile-bible)', '#6A55A8'],
];

// Écran 2 : accueil.
export function Accueil() {
  const etat = usePassage(versetDuJour());
  const piste = audioDuJour();
  const derniere = useSignal(derniereEcoute);
  const enCours = useSignal(lecteur).piste;
  const reprendre = derniere && derniere.position > 5 && derniere.position < derniere.duree - 5 && enCours?.id !== derniere.piste.id ? derniere : null;
  return (
    <div class="accueil">
      <div class="accueil__hero">
        <img src="/assets/vie-chretienne/homme-louange-soleil.webp" alt="" />
      </div>

      <div class="page">
        {/* Verset du jour : texte lu dans la Bible LSG 1910 (référence tirée de content/versets-du-jour.json). */}
        <section class="carte verset-jour" aria-labelledby="vj">
          <span class="pastille pastille--or verset-jour__pastille"><Icone nom="calendrier" taille={16} /> <span id="vj">Verset du jour</span></span>
          <TextePassage etat={etat} />
          {etat.ref && <a class="pastille pastille--ref" href={'#/' + cheminMontrer(etat.ref)}>{ecrireReference(etat.ref)}</a>}
        </section>
        <Consentement />

        {piste && (
          <section class="carte audio-jour">
            <a href={'#/ecouter/' + piste.id}><img src={piste.image} alt="" loading="lazy" /></a>
            <a class="audio-jour__corps" href={'#/ecouter/' + piste.id}>
              <h2>Audio du jour {piste.exemple && <span class="etiquette-exemple">EXEMPLE</span>}</h2>
              <p class="audio-jour__auteur">{piste.auteur}</p>
              <p class="audio-jour__titre">{piste.titre}</p>
            </a>
            <BoutonLecture piste={piste} />
          </section>
        )}
        {reprendre && (
          <button class="carte continuer" onClick={() => jouer(reprendre.piste)}>
            <span class="continuer__icone"><Icone nom="musique" taille={20} /></span>
            <span class="ligne__corps">
              <span class="ligne__desc" style="display:block">Continuer l'écoute · {formatTemps(reprendre.position)} / {formatTemps(reprendre.duree)}</span>
              <span class="ligne__titre">{reprendre.piste.titre}</span>
            </span>
            <Icone nom="lecture" taille={20} />
          </button>
        )}

        <nav class="acces" aria-label="Accès rapides">
          {ACCES.map(([id, libelle, icone, fond, couleur]) => (
            <a class="acces__tuile" href={'#/' + id} style={{ background: fond }}>
              <span style={{ color: couleur }}><Icone nom={icone} taille={34} stroke-width="1.8" /></span>
              <span class="acces__libelle">{libelle}</span>
            </a>
          ))}
        </nav>

        <div style="margin-top:12px"><TelechargementBible compact /></div>

        <a class="carte decouvrir-carte" href="#/grandir/decouvrir-jesus">
          <img src="/assets/jesus/jesus-main-tendue.webp" alt="" loading="lazy" />
          <span class="ligne__corps"><span class="ligne__titre" style="display:block">Découvrir Jésus</span>
            <span class="ligne__desc">Qui est-il vraiment ? Comment lui donner ta vie ? 10 courtes leçons.</span></span>
          <Icone nom="chevron" taille={20} />
        </a>

        <a class="jouer-carte" href="#/jouer">
          <img src="/assets/objets-bibliques/couronne-or.webp" alt="" loading="lazy" />
          <div>
            <h2>Jouer et apprendre</h2>
            <p>Quiz, défis et jeux bibliques pour affermir ta foi</p>
          </div>
          <span class="jouer-carte__fleche"><Icone nom="chevron" taille={22} /></span>
        </a>
      </div>
    </div>
  );
}

// Demande unique : accepter ou non l'envoi de statistiques anonymes.
function Consentement() {
  const r = useSignal(reglages);
  if (r.statsAnonymes === true || r.statsAnonymes === false) return null;
  return (
    <section class="carte bloc consentement">
      <h3><span class="ligne__icone"><Icone nom="donnees" /></span> Aider Yeshaya ?</h3>
      <p class="ligne__desc">Acceptes-tu d'envoyer des statistiques <b>anonymes</b> : seulement des chiffres (par exemple « un enseignement a été lu », « une personne a donné sa vie à Jésus »), jamais ton nom, ton numéro, ton pays ni ce que tu écris ? Tu peux changer d'avis dans les Paramètres.</p>
      <div class="boutons">
        <button class="bouton bouton--plein" onClick={() => choisirStats(true)}>Oui, j'aide</button>
        <button class="bouton bouton--contour" onClick={() => choisirStats(false)}>Non merci</button>
      </div>
    </section>
  );
}
