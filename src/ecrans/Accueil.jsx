import { Icone } from '../composants/Icone.jsx';
import { usePassage, TextePassage, cheminMontrer } from '../composants/Verset.jsx';
import { TelechargementBible } from '../composants/TelechargementBible.jsx';
import { versetDuJour, audioDuJour, veilleDuMoment, meditationDuJour } from '../donnees/contenu.js';
import { orizon, jourCourant } from '../donnees/orizon.js';
import { BoutonLecture } from '../composants/Audio.jsx';
import { derniereEcoute, jouer, formatTemps, lecteur } from '../audio/lecteur.js';
import { useSignal } from '../outils/signal.js';
import { ecrireReference } from '../bible/references.js';


// Écran 2 : accueil.
export function Accueil() {
  const etat = usePassage(versetDuJour());
  const v = veilleDuMoment(), m = meditationDuJour(new Date());
  const o = useSignal(orizon);
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

        <h2 class="titre-section sous-rubrique">Pour aujourd'hui</h2>
        <a class="carte accueil-priere" href={'#/priere/veille/' + v.id.replace('veille-', '')}>
          <img src={v.image} alt="" loading="lazy" />
          <span class="accueil-priere__texte"><span class="pastille pastille--or">Prier maintenant · {v.heures}</span><b>{v.titre}</b><span>{v.theme}</span></span>
        </a>
        <div class="aujourdhui">
          <a class="carte aujourdhui__carte" href="#/bible/meditation"><Icone nom="ampoule" taille={22} /><b>Méditation du jour</b><span>{m?.titre || 'Un verset à méditer'}</span></a>
          <a class="carte aujourdhui__carte" href={o.faits.length ? '#/orizon/jour/' + jourCourant() : '#/grandir/formation'}><Icone nom="grandir" taille={22} /><b>{o.faits.length ? 'Mon parcours' : 'Former le disciple'}</b><span>{o.faits.length ? 'Vaincre en 90 jours · jour ' + jourCourant() : '40 leçons pour grandir'}</span></a>
        </div>

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


        <div style="margin-top:12px"><TelechargementBible compact /></div>

        <a class="carte ligne" href="#/equilibre" style="margin-top:12px">
          <span class="ligne__icone"><Icone nom="calendrier" /></span>
          <span class="ligne__corps"><span class="ligne__titre" style="display:block">Mon équilibre avec Dieu</span>
            <span class="ligne__desc">Mon rythme de prière, de Parole et de méditation, avec rappels et courbes.</span></span>
          <Icone nom="chevron" taille={20} />
        </a>
        <a class="carte decouvrir-carte" href="#/grandir/decouvrir-jesus">
          <img src="/assets/jesus/jesus-main-tendue.webp" alt="" loading="lazy" />
          <span class="ligne__corps"><span class="ligne__titre" style="display:block">Découvrir Jésus</span>
            <span class="ligne__desc">Qui est-il vraiment ? Comment lui donner ta vie ? 10 courtes leçons.</span></span>
          <Icone nom="chevron" taille={20} />
        </a>

      </div>
    </div>
  );
}
