import { Icone } from '../../composants/Icone.jsx';
import { CarteVerset } from '../../composants/Verset.jsx';
import { BoutonLecture } from '../../composants/Audio.jsx';
import { notifier } from '../../composants/Notification.jsx';
import { NOUVEAU_CONVERTI, AUDIOS, JOURS_PARCOURS } from '../../donnees/contenu.js';
import { parcours, terminerJour, jourDebloque } from '../../donnees/priere.js';
import { lireReference, ecrireReference } from '../../bible/references.js';
import { useSignal } from '../../outils/signal.js';
import { aller } from '../../outils/routeur.js';

// Écran 7 : parcours « Nouveau converti » sur 30 jours. Un jour se débloque quand le précédent est terminé.
export function NouveauConverti({ jour }) {
  const p = useSignal(parcours);
  if (jour) return <Jour n={+jour} faits={p.faits} />;
  const pct = Math.round((p.faits.length / JOURS_PARCOURS) * 100);
  const prochain = Array.from({ length: JOURS_PARCOURS }, (_, i) => i + 1).find((n) => !p.faits.includes(n));
  return (
    <div class="page">
      <div class="bandeau-titre">
        <img src="/assets/nouveau-converti/joie-de-la-rencontre.webp" alt="" />
        <div><h2>Mes 30 premiers jours avec Christ</h2><p>Un parcours simple pour bien commencer, un thème par jour, à ton rythme.</p></div>
      </div>
      <section class="carte bloc">
        <div class="progression-tete"><span class="ligne__titre">Ma progression</span><span class="ligne__desc">{p.faits.length} / {JOURS_PARCOURS} ({pct} %)</span></div>
        <div class="progression progression--fine"><span style={{ width: pct + '%' }} /></div>
        {prochain && NOUVEAU_CONVERTI.find((j) => j.jour === prochain) && (
          <a class="bouton bouton--or" href={'#/grandir/nouveau-converti/' + prochain} style="margin-top:10px">
            {p.faits.length ? 'Reprendre' : 'Commencer'} : jour {prochain}</a>
        )}
      </section>
      <ol class="jours">
        {Array.from({ length: JOURS_PARCOURS }, (_, i) => i + 1).map((n) => {
          const j = NOUVEAU_CONVERTI.find((x) => x.jour === n), fait = p.faits.includes(n), ouvert = jourDebloque(n, p.faits);
          const etat = fait ? 'fait' : ouvert && j ? 'ouvert' : 'ferme';
          const contenu = (
            <>
              <span class={'jour__statut jour__statut--' + etat}>{fait ? <Icone nom="verifie" taille={18} /> : etat === 'ouvert' ? <Icone nom="lecture" taille={16} /> : <Icone nom="cadenas" taille={16} />}</span>
              <span class="jour__num">Jour {n}</span>
              <span class="ligne__corps">
                <span class="ligne__titre" style="display:block">{j ? j.titre : 'À venir'}</span>
                <span class="ligne__desc">{j ? j.versets.map((r) => ecrireReference(lireReference(r))).join(' · ') : 'Contenu en préparation'}</span>
              </span>
            </>
          );
          return <li>{etat === 'ferme' ? <div class="carte jour jour--ferme" aria-disabled="true">{contenu}</div>
            : <a class={'carte jour jour--' + etat} href={'#/grandir/nouveau-converti/' + n}>{contenu}</a>}</li>;
        })}
      </ol>
    </div>
  );
}

function Jour({ n, faits }) {
  const j = NOUVEAU_CONVERTI.find((x) => x.jour === n);
  if (!j || !jourDebloque(n, faits)) return <div class="page"><p class="ligne__desc" style="margin-top:16px">Ce jour n'est pas encore disponible. Termine d'abord le jour précédent.</p></div>;
  const piste = AUDIOS[j.id], fait = faits.includes(n);
  return (
    <div class="page">
      <div class="theme-hero">
        <img src={j.image} alt="" />
        <div class="theme-hero__texte"><span class="pastille pastille--or">Jour {n} sur {JOURS_PARCOURS}</span><h2>{j.titre}</h2></div>
      </div>
      {j.exemple && <p style="margin:8px 4px 0"><span class="etiquette-exemple">EXEMPLE</span> Contenu de démonstration.</p>}
      <section class="carte bloc"><p>{j.texte}</p>
        {piste && <div class="bloc__audio"><BoutonLecture piste={piste} taille={44} /><span class="ligne__corps"><span class="ligne__titre">Écouter</span></span></div>}
      </section>
      <h2 class="titre-section">À lire aujourd'hui</h2>
      <div class="liste">{j.versets.map((r) => <CarteVerset reference={r} />)}</div>
      <section class="carte bloc" style="margin-top:12px">
        <h3><span class="ligne__icone"><Icone nom="cible" /></span> Pour réfléchir</h3>
        <p>{j.question}</p>
      </section>
      {fait ? <p class="hors-ligne-ok" style="justify-content:center;margin-top:14px"><Icone nom="verifie" taille={18} /> Jour terminé</p>
        : <button class="bouton bouton--or" style="width:100%;margin-top:14px" onClick={() => { terminerJour(n); notifier('Bravo, jour ' + n + ' terminé !'); aller('grandir/nouveau-converti'); }}>
          <Icone nom="verifie" taille={18} /> J'ai terminé ce jour</button>}
    </div>
  );
}
