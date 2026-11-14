import { Icone } from '../../composants/Icone.jsx';
import { CarteVerset } from '../../composants/Verset.jsx';
import { BarreEcoute, useVoixActive } from '../../composants/Ecouter.jsx';
import { OUTILS } from '../../donnees/contenu.js';
import { parcours, noterDecision } from '../../donnees/priere.js';
import { useSignal } from '../../outils/signal.js';
import { notifier } from '../../composants/Notification.jsx';
import { partager } from '../../outils/partage.js';

// Outil d'évangélisation en images (ex. « Le cœur de l'homme ») : une image, puis l'explication, étape par étape.
// Tout le texte peut être écouté ; la prière de conversion termine la présentation.
export function Outil({ id }) {
  const o = OUTILS.find((x) => x.id === id);
  const p = useSignal(parcours);
  const va = useVoixActive(o?.id);
  if (!o) return <div class="page"><p class="ligne__desc">Contenu introuvable.</p></div>;

  // Blocs lus à voix haute, dans l'ordre de la page (l'index sert au surlignage).
  const blocs = [];
  const ajoute = (b) => (blocs.push(b), blocs.length - 1);
  const etapes = o.etapes.map((e) => ({
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
      <BarreEcoute id={o.id} titre="Écouter toute la présentation" blocs={blocs} />

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
        : <button class="bouton bouton--plein" style="width:100%;margin-top:12px" onClick={() => { noterDecision(); notifier('Bienvenue dans la famille de Dieu !'); }}>
            <Icone nom="coeur" taille={20} /> J'ai prié pour recevoir le Seigneur Jésus</button>}
      <section class="carte bloc article" style="margin-top:12px">
        <h3>Et maintenant ?</h3>
        {o.apres.map((t, k) => <p {...va(iApres[k])}>{t}</p>)}
        <a class="bouton bouton--contour" href="#/grandir/nouveau-converti" style="width:100%">Commencer le parcours « Nouveau converti »</a>
      </section>
      <div class="verset__actions" style="justify-content:center;margin-top:12px">
        <button class="bouton bouton--contour bouton--petit" onClick={() => partager({ titre: o.titre, texte: o.resume, chemin: 'evangeliser/outil/' + o.id })}><Icone nom="partager" taille={18} /> Partager</button>
      </div>
      {o.source && <p class="source-mention">{o.source}</p>}
    </div>
  );
}
