import { useState } from 'preact/hooks';
import { Accordeon } from '../../composants/Accordeon.jsx';
import { Banniere } from '../../composants/Banniere.jsx';
import { Icone } from '../../composants/Icone.jsx';
import { CarteVerset } from '../../composants/Verset.jsx';
import { TexteRefs } from '../../composants/TexteRefs.jsx';
import { notifier } from '../../composants/Notification.jsx';
import { useSignal } from '../../outils/signal.js';
import { jeune, modifierJeune, prochainJeune, palierDe, semaineDeConges, noterJeune, commencerJeune, jourTexte } from '../../donnees/jeune.js';
import { JEUNE_PRIERE as C } from '../../donnees/contenu.js';

const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const long = (t) => { const [a, m, j] = t.split('-').map(Number); const d = new Date(a, m - 1, j); return `${JOURS[d.getDay()]} ${j} ${MOIS[m - 1]}`; };

export function Jeune() {
  const etat = useSignal(jeune);
  const auj = jourTexte(new Date());
  const prochain = prochainJeune(etat, C.paliers, auj);
  const fait = (etat.jeunes || []).includes(auj);
  const semaine = semaineDeConges(etat.conges, auj);
  const palier = etat.debut ? palierDe(C.paliers, etat.debut, auj) : null;
  return (
    <div class="page jeune">
      <Banniere image="/assets/photos/grandir-notes-lampe.webp" titre="Jeûne et prière" sous="Se détacher du monde pour s'attacher à Dieu." />
      <CarteVerset reference={C.verset} />

      <section class="carte bloc jeune__rythme">
        <h2>Mon rythme de jeûne</h2>
        {!etat.debut ? (<>
          <p>Le jeûne se prend pas à pas : une fois par mois au début, puis plus souvent. Il n'y a ni note ni classement. Il y a toi et Dieu.</p>
          <button class="bouton bouton--or" onClick={() => { commencerJeune(); notifier('Ton parcours de jeûne commence. Courage !'); }}>Commencer mon parcours</button>
        </>) : (<>
          <p class="jeune__palier"><b>{palier.titre}</b><br />{palier.rythme}</p>
          <p class="ligne__desc">{palier.conseil}</p>
          {fait ? <p class="jeune__merci"><Icone nom="verifie" taille={18} /> Tu as jeûné aujourd'hui. Que Dieu te rencontre.</p>
            : <>
              <p class="jeune__prochain">{prochain.aujourdhui ? "Ce serait bien d'aujourd'hui : " : 'Prochain jour proposé : '}<b>{long(prochain.date)}</b></p>
              <button class="bouton bouton--plein" onClick={() => { noterJeune(); notifier('Noté. Tiens bon, Dieu voit en secret.'); }}>Je jeûne aujourd'hui</button>
            </>}
          <p class="ligne__desc" style="margin-top:8px">{(etat.jeunes || []).length} jour{(etat.jeunes || []).length > 1 ? 's' : ''} de jeûne notés depuis le début.
            <button class="lien" onClick={() => { if (confirm('Recommencer le parcours de zéro ?')) modifierJeune({ debut: null, jeunes: [] }); }}>Recommencer</button></p>
        </>)}
      </section>

      <section class="carte bloc jeune__conges">
        <h3>{C.conges.titre}</h3>
        <p>{C.conges.texte}</p>
        <div class="jeune__dates">
          <label>Du <input type="date" value={etat.conges?.du || ''} onInput={(e) => modifierJeune({ conges: { ...etat.conges, du: e.target.value } })} /></label>
          <label>Au <input type="date" value={etat.conges?.au || ''} onInput={(e) => modifierJeune({ conges: { ...etat.conges, au: e.target.value } })} /></label>
        </div>
        {semaine && <p class="jeune__merci"><Icone nom="priere" taille={18} /> Du {long(semaine.du)} au {long(semaine.au)} : semaine de jeûne et de prière. Prie plus longtemps (veilles « Complet ») et jeûne un ou plusieurs jours, selon ta santé.</p>}
      </section>

      <Accordeon ouvert="pourquoi" volets={[
        { id: 'pourquoi', titre: 'Pourquoi prier et jeûner ?', contenu: C.pourquoi.map((x) => <p><TexteRefs texte={x} /></p>) },
        { id: 'types', titre: 'Quel jeûne choisir ?', icone: 'liste', contenu: C.types.map((x) => <div class="jeune__type"><h4>{x.titre} <small>· {x.pour}</small></h4><p>{x.texte}</p></div>) },
        { id: 'sante', titre: 'Attention à ta santé', icone: 'bouclier', contenu: <ul>{C.precautions.map((x) => <li>{x}</li>)}</ul> },
        { id: 'jour', titre: 'Un jour de jeûne, pas à pas', icone: 'soleil', contenu: C.jour.map((x) => <div class="jeune__type"><h4>{x.moment}</h4><p><TexteRefs texte={x.texte} /></p></div>) },
        { id: 'convertis', titre: 'Si tu viens de te convertir', icone: 'coeur', contenu: <ol>{C.convertis.map((x) => <li>{x}</li>)}</ol> },
        { id: 'rythme', titre: 'Le rythme qui grandit', icone: 'grandir', contenu: C.paliers.map((x) => <div class="jeune__type"><h4>{x.titre}</h4><p>{x.rythme}</p></div>) },
      ]} />

      <h2 class="titre-section">Pour aller plus loin</h2>
      <div class="liste">
        <a class="carte ligne" href="#/grandir/enseignement/classique-murray-13-priere-et-jeune"><span class="ligne__corps"><span class="ligne__titre" style="display:block">« Par la prière et par le jeûne »</span><span class="ligne__desc">Andrew Murray : lire l'enseignement.</span></span><Icone nom="chevron" taille={20} /></a>
        <a class="carte ligne" href="#/grandir/enseignement/jeune-0-troisieme-force"><span class="ligne__corps"><span class="ligne__titre" style="display:block">Le jeûne, troisième force</span><span class="ligne__desc">La série sur le jeûne, étape par étape.</span></span><Icone nom="chevron" taille={20} /></a>
        <a class="carte ligne" href="#/priere/section/veilles"><span class="ligne__corps"><span class="ligne__titre" style="display:block">Prier maintenant</span><span class="ligne__desc">Les trois veilles du jour.</span></span><Icone nom="chevron" taille={20} /></a>
      </div>
    </div>
  );
}
