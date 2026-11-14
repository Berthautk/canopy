import { Icone } from '../../composants/Icone.jsx';
import { CarteVerset } from '../../composants/Verset.jsx';
import { useVoixActive } from '../../composants/Ecouter.jsx';
import { OUTILS } from '../../donnees/contenu.js';
import { parcours, noterDecision } from '../../donnees/priere.js';
import { useSignal } from '../../outils/signal.js';
import { useState, useEffect, useRef } from 'preact/hooks';
import { voix, arreterVoix, lireAVoixHaute, pauseVoix, reprendreVoix } from '../../audio/voix.js';
import { notifier } from '../../composants/Notification.jsx';
import { partager } from '../../outils/partage.js';
import { Presentation } from '../../composants/Presentation.jsx';
import { LienVideo } from '../../composants/LienVideo.jsx';
import { compter } from '../../donnees/mesure.js';

// Outil d'évangélisation en images (ex. « Le cœur de l'homme ») : une seule étape à la fois.
// On écoute l'étape ; « Suivant » ne s'active que lorsque la voix a fini. L'étape suivante reste cachée jusque-là.
export function Outil({ id }) {
  const o = OUTILS.find((x) => x.id === id);
  const p = useSignal(parcours);
  const v = useSignal(voix);
  const [diapo, setDiapo] = useState(false);
  const [fait, setFait] = useState(false);
  const [ordre, setOrdre] = useState(o?.ordres ? Object.keys(o.ordres)[0] : null);
  const [k, setK] = useState(0);                 // étape affichée
  const [lues, setLues] = useState([]);          // étapes entièrement écoutées
  const haut = useRef(null);
  const liste = o ? (ordre ? o.ordres[ordre].map((x) => o.etapes[x]) : o.etapes) : [];
  const nb = liste.length;                       // étapes + 1 (prière)
  const priere = k === nb;
  const e = liste[k];
  const blocs = !o ? [] : priere
    ? [{ texte: 'Prions ensemble. Répète après moi, du fond de ton cœur.' }, { texte: o.priere }]
    : [{ texte: e.titre.replace(/^\d+\.\s*/, '') + '.' }, ...e.texte.map((t) => ({ texte: t })), ...e.versets.map((r) => ({ reference: r }))];
  const vid = `${id}-${ordre || ''}-e${k}`;
  const va = useVoixActive(vid);
  const ici = v.id === vid;
  const lue = lues.includes(k);

  useEffect(() => { if (ici && v.termine) setLues((l) => (l.includes(k) ? l : [...l, k])); }, [v.termine, v.id]);
  // Sans voix sur le téléphone : on laisse le temps de lire le texte.
  useEffect(() => {
    if (!o || v.disponible || lue) return;
    const n = blocs.reduce((s, b) => s + (b.texte || '').length + (b.reference ? 160 : 0), 0);
    const t = setTimeout(() => setLues((l) => [...l, k]), Math.max(4000, (n / 14) * 1000));
    return () => clearTimeout(t);
  }, [k, ordre]);
  useEffect(() => () => arreterVoix(), []);
  if (!o) return <div class="page"><p class="ligne__desc">Contenu introuvable.</p></div>;

  const ecouter = () => lireAVoixHaute(vid, blocs);
  const aller = (n) => {
    setK(n);
    setTimeout(() => haut.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 30);
    if (n > k && v.disponible) {            // on lance tout de suite l'écoute de l'étape suivante
      const suiv = n === nb ? [{ texte: 'Prions ensemble. Répète après moi, du fond de ton cœur.' }, { texte: o.priere }]
        : [{ texte: liste[n].titre.replace(/^\d+\.\s*/, '') + '.' }, ...liste[n].texte.map((t) => ({ texte: t })), ...liste[n].versets.map((r) => ({ reference: r }))];
      lireAVoixHaute(`${id}-${ordre || ''}-e${n}`, suiv);
    } else arreterVoix();
  };
  const changerOrdre = (x) => { arreterVoix(); setOrdre(x); setK(0); setLues([]); };

  return (
    <div class="page">
      {k === 0 && <>
        <p class="guide-phase" style="margin-top:12px"><Icone nom="info" taille={18} /><span>{o.conseil}</span></p>
        {o.ordres && <div class="segments" role="group" aria-label="Commencer par" style="margin-top:12px">
          {Object.keys(o.ordres).map((x) => <button aria-pressed={ordre === x} onClick={() => changerOrdre(x)}>{x}</button>)}
        </div>}
      </>}
      <div ref={haut} style="scroll-margin-top:120px" />
      <div class="etape-progres" aria-hidden="true"><span style={{ width: `${((k + (lue ? 1 : 0.4)) / (nb + 1)) * 100}%` }} /></div>
      <p class="diaporama__etape" style="color:var(--texte-doux);margin:6px 0 0">{priere ? 'Prière' : `Étape ${k + 1} sur ${nb}`}</p>

      <div class="etape-commandes etape-commandes--collant">
        <button class="rond rond--grand" disabled={k === 0} onClick={() => aller(k - 1)} aria-label="Étape précédente"><Icone nom="precedent" taille={24} /></button>
        {v.disponible && (ici && v.lecture
          ? <button class="bouton bouton--contour" onClick={pauseVoix}><Icone nom="pause" taille={20} /> Pause</button>
          : ici && !v.termine
            ? <button class="bouton bouton--contour" onClick={reprendreVoix}><Icone nom="lecture" taille={20} /> Reprendre</button>
            : <button class={'bouton ' + (lue ? 'bouton--contour' : 'bouton--or')} onClick={ecouter}><Icone nom={lue ? 'rejouer' : 'lecture'} taille={20} /> {lue ? 'Réécouter' : 'Écouter'}</button>)}
        {!priere && <button class="bouton bouton--plein" disabled={!lue} onClick={() => aller(k + 1)}>
          <>Suivant <Icone nom="chevron" taille={20} /></></button>}
      </div>
      {!lue && <p class="ligne__desc" style="text-align:center;margin:6px 0 0">{v.disponible ? '« Suivant » s\'active quand la voix a fini.' : 'Prends le temps de lire ; « Suivant » s\'active dans un instant.'}</p>}

      {!priere ? (
        <section class="carte etape-outil" key={vid}>
          <img class="etape-outil__image" src={e.image} alt={e.titre} />
          <div class="etape-outil__corps">
            <h2 class="etape-outil__titre" {...va(0)}>{e.titre}</h2>
            {e.texte.map((t, j) => <p {...va(1 + j)}>{t}</p>)}
          </div>
          <div class="liste" style="padding:0 10px 10px">{e.versets.map((r, j) => <div {...va(1 + e.texte.length + j)}><CarteVerset reference={r} /></div>)}</div>
        </section>
      ) : (
        <section class="carte bloc priere-modele" key={vid}>
          <h3 {...va(0)}><span class="ligne__icone"><Icone nom="priere" /></span> {o.decision ? 'Prière' : 'Prière pour recevoir Jésus'}</h3>
          <p class="ligne__desc">Prions ensemble. Répète après moi, du fond de ton cœur.</p>
          <p {...va(1)}><em>{o.priere}</em></p>
        </section>
      )}

      {priere && lue && <>
        <BoutonDecision o={o} p={p} fait={fait} setFait={setFait} style="width:100%;margin-top:12px" classe="bouton bouton--or" />
        <section class="carte bloc article" style="margin-top:12px">
          <h3>Et maintenant ?</h3>
          {o.apres.map((t) => <p>{t}</p>)}
          <a class="bouton bouton--plein" href="#/grandir/enseignement/affermissement-1-le-salut" style="width:100%">Grandir : « Le salut, ce que Dieu a fait pour toi »</a>
          <a class="bouton bouton--contour" href="#/grandir/nouveau-converti" style="width:100%;margin-top:8px">Commencer le parcours « Nouveau converti »</a>
        </section>
        {o.video && <LienVideo url={o.video} auteur={o.video_auteur} />}
        {o.source && <p class="source-mention">{o.source}</p>}
      </>}

      <div class="verset__actions" style="justify-content:center;margin-top:16px">
        <button class="bouton bouton--contour bouton--petit" onClick={() => { arreterVoix(); setDiapo(true); }}><Icone nom="agrandir" taille={18} /> Plein écran</button>
        <button class="bouton bouton--contour bouton--petit" onClick={() => partager({ titre: o.titre, texte: o.resume, chemin: 'evangeliser/outil/' + o.id })}><Icone nom="partager" taille={18} /> Partager</button>
      </div>
      {diapo && <Presentation id={o.id} titre={o.titre} fermer={() => setDiapo(false)}
        diapos={[...liste.map((x) => ({ image: x.image, titre: x.titre, blocs: [{ texte: x.titre.replace(/^\d+\.\s*/, '') + '.' }, ...x.texte.map((t) => ({ texte: t })), ...x.versets.map((r) => ({ reference: r }))] })),
          { image: liste[nb - 1].image, titre: o.decision ? 'Prière' : 'Prière pour recevoir Jésus', blocs: [{ texte: 'Prions ensemble. Répète après moi, du fond de ton cœur.' }, { texte: o.priere }] }]}
        finale={<BoutonDecision o={o} p={p} fait={fait} setFait={setFait} style="width:100%;margin:8px 0" classe="bouton bouton--or" />} />}
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
