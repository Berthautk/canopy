import { Icone } from '../../composants/Icone.jsx';
import { CarteVerset } from '../../composants/Verset.jsx';
import { BarreEcoute, useVoixActive } from '../../composants/Ecouter.jsx';
import { OUTILS } from '../../donnees/contenu.js';
import { parcours, noterDecision } from '../../donnees/priere.js';
import { useSignal } from '../../outils/signal.js';
import { useState } from 'preact/hooks';
import { voix, lireAVoixHaute, pauseVoix, reprendreVoix, arreterVoix } from '../../audio/voix.js';
import { notifier } from '../../composants/Notification.jsx';
import { partager } from '../../outils/partage.js';

// Outil d'évangélisation en images (ex. « Le cœur de l'homme ») : une image, puis l'explication, étape par étape.
// Tout le texte peut être écouté ; la prière de conversion termine la présentation.
export function Outil({ id }) {
  const o = OUTILS.find((x) => x.id === id);
  const p = useSignal(parcours);
  const va = useVoixActive(o?.id);
  const [diapo, setDiapo] = useState(false);
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
      <button class="carte priere-guidee__lancer" onClick={() => { setDiapo(true); lireAVoixHaute(o.id, blocs); }}>
        <span class="priere-guidee__icone" aria-hidden="true"><Icone nom="lecture" taille={26} /></span>
        <span class="ligne__corps"><span class="ligne__titre" style="display:block">Regarder et écouter (diaporama)</span>
          <span class="ligne__desc">La voix explique, les images défilent. Idéal pour montrer à quelqu'un.</span></span>
      </button>
      {o.ordres && <div class="segments" role="group" aria-label="Commencer par" style="margin-top:12px">
        {Object.keys(o.ordres).map((k) => <button aria-pressed={ordre === k} onClick={() => { arreterVoix(); setOrdre(k); }}>{k}</button>)}
      </div>}
      <BarreEcoute key={ordre} id={o.id} titre="Écouter toute la présentation" blocs={blocs} />
      {diapo && <Diaporama o={o} etapes={etapes} blocs={blocs} iIntro={iIntro} fermer={() => { arreterVoix(); setDiapo(false); }} />}

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
        <h3><span class="ligne__icone"><Icone nom="priere" /></span> Prière pour recevoir Jésus</h3>
        <p class="ligne__desc" {...va(iIntro)}>Prions ensemble. Répète après moi, du fond de ton cœur.</p>
        <p><em>{o.priere}</em></p>
      </section>
      {p.decision
        ? <p class="carte bloc" style="text-align:center"><Icone nom="verifie" /> Tu as noté le {new Date(p.decision).toLocaleDateString('fr-FR')} que tu as donné ta vie à Jésus. Bienvenue dans la famille de Dieu !</p>
        : <button class="bouton bouton--plein" style="width:100%;margin-top:12px" onClick={() => { noterDecision(o.id); notifier('Bienvenue dans la famille de Dieu !'); }}>
            <Icone nom="coeur" taille={20} /> J'ai prié pour recevoir le Seigneur Jésus</button>}
      <section class="carte bloc article" style="margin-top:12px">
        <h3>Et maintenant ?</h3>
        {o.apres.map((t, k) => <p {...va(iApres[k])}>{t}</p>)}
        <a class="bouton bouton--plein" href="#/grandir/enseignement/affermissement-1-le-salut" style="width:100%">Grandir : « Le salut, ce que Dieu a fait pour toi »</a>
        <a class="bouton bouton--contour" href="#/grandir/nouveau-converti" style="width:100%;margin-top:8px">Commencer le parcours « Nouveau converti »</a>
      </section>
      <div class="verset__actions" style="justify-content:center;margin-top:12px">
        <button class="bouton bouton--contour bouton--petit" onClick={() => partager({ titre: o.titre, texte: o.resume, chemin: 'evangeliser/outil/' + o.id })}><Icone nom="partager" taille={18} /> Partager</button>
      </div>
      {o.source && <p class="source-mention">{o.source}</p>}
    </div>
  );
}

// Diaporama : l'image de l'étape en cours s'affiche pendant que la voix lit le texte.
function Diaporama({ o, etapes, blocs, iIntro, fermer }) {
  const v = useSignal(voix);
  const i = v.id === o.id ? v.index : 0;
  let k = 0; etapes.forEach((e, j) => { if (e.iTitre <= i) k = j; });
  const enPriere = i >= iIntro;
  const e = etapes[k], b = blocs[i] || {};
  const aller = (j) => lireAVoixHaute(o.id, blocs, j);
  return (
    <div class="priere-guidee diaporama" role="dialog" aria-modal="true" aria-label={'Diaporama : ' + o.titre}>
      <div class="priere-guidee__tete"><span>{enPriere ? 'Prière pour recevoir Jésus' : e.titre}</span>
        <button class="rond" onClick={fermer} aria-label="Quitter"><Icone nom="fermer" taille={20} /></button></div>
      <div class="priere-guidee__progres" aria-hidden="true"><span style={{ width: `${((i + 1) / blocs.length) * 100}%` }} /></div>
      <img class="diaporama__image" src={enPriere ? etapes[etapes.length - 1].image : e.image} alt="" />
      <div class="priere-guidee__corps diaporama__texte">
        <p class="priere-guidee__texte">{b.texte ? (i === e.iTitre && !enPriere ? e.titre : b.texte) : b.reference ? '📖 ' + b.reference : ''}</p>
      </div>
      <div class="priere-guidee__commandes">
        <button class="rond rond--grand" onClick={() => aller(etapes[Math.max(0, enPriere ? etapes.length - 1 : k - 1)].iTitre)} aria-label="Image précédente"><Icone nom="precedent" taille={26} /></button>
        <button class="bouton bouton--plein priere-guidee__ok" onClick={v.lecture ? pauseVoix : (v.id === o.id ? reprendreVoix : () => aller(0))}>
          <Icone nom={v.lecture ? 'pause' : 'lecture'} taille={26} /> {v.lecture ? 'Pause' : 'Écouter'}</button>
        <button class="rond rond--grand" onClick={() => aller(k + 1 < etapes.length ? etapes[k + 1].iTitre : iIntro)} aria-label="Image suivante"><Icone nom="chevron" taille={26} /></button>
      </div>
    </div>
  );
}
