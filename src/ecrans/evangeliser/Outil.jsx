import { Icone } from '../../composants/Icone.jsx';
import { CarteVerset } from '../../composants/Verset.jsx';
import { BarreEcoute, useVoixActive } from '../../composants/Ecouter.jsx';
import { OUTILS } from '../../donnees/contenu.js';
import { parcours, noterDecision } from '../../donnees/priere.js';
import { useSignal } from '../../outils/signal.js';
import { useState } from 'preact/hooks';
import { arreterVoix } from '../../audio/voix.js';
import { notifier } from '../../composants/Notification.jsx';
import { partager } from '../../outils/partage.js';
import { Presentation } from '../../composants/Presentation.jsx';
import { LienVideo } from '../../composants/LienVideo.jsx';
import { compter } from '../../donnees/mesure.js';

// Outil d'évangélisation en images (ex. « Le cœur de l'homme ») : une image, puis l'explication, étape par étape.
// Tout le texte peut être écouté ; la prière de conversion termine la présentation.
export function Outil({ id }) {
  const o = OUTILS.find((x) => x.id === id);
  const p = useSignal(parcours);
  const va = useVoixActive(o?.id);
  const [diapo, setDiapo] = useState(false);
  const [fait, setFait] = useState(false);
  const [ordre, setOrdre] = useState(o?.ordres ? Object.keys(o.ordres)[0] : null);
  if (!o) return <div class="page"><p class="ligne__desc">Contenu introuvable.</p></div>;

  // Blocs lus à voix haute, dans l'ordre de la page (l'index sert au surlignage).
  const blocs = [];
  const ajoute = (b) => (blocs.push(b), blocs.length - 1);
  const liste = ordre ? o.ordres[ordre].map((k) => o.etapes[k]) : o.etapes;
  const etapes = liste.map((e) => ({
    ...e,
    iTitre: ajoute({ texte: e.titre.replace(/^\d+\.\s*/, '') + '.' }),
    iTextes: e.texte.map((t) => ajoute({ texte: t })),
    iVersets: e.versets.map((r) => ajoute({ reference: r })),
  }));
  const iIntro = ajoute({ texte: 'Prions ensemble. Répète après moi, du fond de ton cœur.' });
  const iPriere = ajoute({ texte: o.priere });
  const iApres = o.apres.map((t) => ajoute({ texte: t }));

  return (
    <div class="page">
      <div class="theme-hero">
        <img src={o.image} alt="" />
        <div class="theme-hero__texte"><span class="pastille pastille--or">Présenter l'Évangile · {o.duree_estimee}</span><h2>{o.titre}</h2></div>
      </div>
      <p class="guide-phase" style="margin-top:12px"><Icone nom="info" taille={18} /><span>{o.conseil}</span></p>
      <button class="carte priere-guidee__lancer" onClick={() => { arreterVoix(); setDiapo(true); }}>
        <span class="priere-guidee__icone" aria-hidden="true"><Icone nom="lecture" taille={26} /></span>
        <span class="ligne__corps"><span class="ligne__titre" style="display:block">Regarder et écouter (présentation)</span>
          <span class="ligne__desc">Chaque image apparaît, la voix explique, puis « Suivant ». Idéal pour montrer à quelqu'un.</span></span>
      </button>
      {o.ordres && <div class="segments" role="group" aria-label="Commencer par" style="margin-top:12px">
        {Object.keys(o.ordres).map((k) => <button aria-pressed={ordre === k} onClick={() => { arreterVoix(); setOrdre(k); }}>{k}</button>)}
      </div>}
      <BarreEcoute key={ordre} id={o.id} titre="Écouter toute la présentation" blocs={blocs} />
      {diapo && <Presentation id={o.id} titre={o.titre} fermer={() => setDiapo(false)}
        diapos={[...etapes.map((e) => ({ image: e.image, titre: e.titre, blocs: [blocs[e.iTitre], ...e.iTextes.map((i) => blocs[i]), ...e.iVersets.map((i) => blocs[i])] })),
          { image: etapes[etapes.length - 1].image, titre: o.decision ? 'Prière' : 'Prière pour recevoir Jésus', blocs: [blocs[iIntro], blocs[iPriere]] }]}
        finale={<BoutonDecision o={o} p={p} fait={fait} setFait={setFait} style="width:100%;margin:8px 0" classe="bouton bouton--or" />} />}

      {etapes.map((e) => (
        <section class="carte etape-outil">
          <img class="etape-outil__image" src={e.image} alt={e.titre} loading="lazy" />
          <div class="etape-outil__corps">
            <h2 class="etape-outil__titre" {...va(e.iTitre)}>{e.titre}</h2>
            {e.texte.map((t, k) => <p {...va(e.iTextes[k])}>{t}</p>)}
          </div>
          <div class="liste" style="padding:0 10px 10px">{e.versets.map((r, k) => <div {...va(e.iVersets[k])}><CarteVerset reference={r} /></div>)}</div>
        </section>
      ))}

      <section class="carte bloc priere-modele" {...va(iPriere)}>
        <h3><span class="ligne__icone"><Icone nom="priere" /></span> {o.decision ? 'Prière' : 'Prière pour recevoir Jésus'}</h3>
        <p class="ligne__desc" {...va(iIntro)}>Prions ensemble. Répète après moi, du fond de ton cœur.</p>
        <p><em>{o.priere}</em></p>
      </section>
      <BoutonDecision o={o} p={p} fait={fait} setFait={setFait} style="width:100%;margin-top:12px" classe="bouton bouton--plein" />
      <section class="carte bloc article" style="margin-top:12px">
        <h3>Et maintenant ?</h3>
        {o.apres.map((t, k) => <p {...va(iApres[k])}>{t}</p>)}
        <a class="bouton bouton--plein" href="#/grandir/enseignement/affermissement-1-le-salut" style="width:100%">Grandir : « Le salut, ce que Dieu a fait pour toi »</a>
        <a class="bouton bouton--contour" href="#/grandir/nouveau-converti" style="width:100%;margin-top:8px">Commencer le parcours « Nouveau converti »</a>
      </section>
      {o.video && <LienVideo url={o.video} auteur={o.video_auteur} />}
      <div class="verset__actions" style="justify-content:center;margin-top:12px">
        <button class="bouton bouton--contour bouton--petit" onClick={() => partager({ titre: o.titre, texte: o.resume, chemin: 'evangeliser/outil/' + o.id })}><Icone nom="partager" taille={18} /> Partager</button>
      </div>
      {o.source && <p class="source-mention">{o.source}</p>}
    </div>
  );
}

// « J'ai prié… » : décision pour Jésus (par défaut) ou autre engagement défini par le contenu (ex. revenir à Jésus).
function BoutonDecision({ o, p, fait, setFait, style, classe }) {
  const d = o.decision;
  if (!d) return p.decision
    ? <p class="carte bloc" style="text-align:center"><Icone nom="verifie" /> Tu as noté le {new Date(p.decision).toLocaleDateString('fr-FR')} que tu as donné ta vie à Jésus. Bienvenue dans la famille de Dieu !</p>
    : <button class={classe} style={style} onClick={() => { noterDecision(o.id); notifier('Bienvenue dans la famille de Dieu !'); }}><Icone nom="coeur" taille={20} /> J'ai prié pour recevoir le Seigneur Jésus</button>;
  return fait
    ? <p class="carte bloc" style="text-align:center"><Icone nom="verifie" /> {d.message}</p>
    : <button class={classe} style={style} onClick={() => { compter(d.evenement, o.id); setFait(true); notifier(d.message); }}><Icone nom="coeur" taille={20} /> {d.bouton}</button>;
}
