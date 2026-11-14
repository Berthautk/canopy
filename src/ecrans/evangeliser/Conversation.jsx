import { useState, useEffect, useRef } from 'preact/hooks';
import { Icone } from '../../composants/Icone.jsx';
import { CarteVerset } from '../../composants/Verset.jsx';
import { useVoixActive } from '../../composants/Ecouter.jsx';
import { CONVERSATIONS } from '../../donnees/contenu.js';
import { voix, lireAVoixHaute, pauseVoix, reprendreVoix, arreterVoix } from '../../audio/voix.js';
import { parcours, noterDecision } from '../../donnees/priere.js';
import { notifier } from '../../composants/Notification.jsx';
import { compter } from '../../donnees/mesure.js';
import { useSignal } from '../../outils/signal.js';

const blocsDe = (n) => [...n.dit.map((t) => ({ texte: t })), ...n.versets.map((r) => ({ reference: r }))];

// Conversation interactive : l'application parle (texte coloré au rythme de la voix),
// puis les réponses apparaissent ; la personne touche la sienne et la conversation continue.
export function Conversation({ id }) {
  const c = CONVERSATIONS.find((x) => x.id === id);
  const v = useSignal(voix), p = useSignal(parcours);
  const [hist, setHist] = useState([{ n: 'debut' }]);     // [{ n: noeud, rep: réponse choisie }]
  const [lus, setLus] = useState([]);
  const bas = useRef(null);
  const etape = hist.length - 1, cour = c?.noeuds[hist[etape].n];
  const vid = `${id}-${etape}`;
  const va = useVoixActive(vid);
  const ici = v.id === vid, lu = lus.includes(etape);

  useEffect(() => { if (ici && v.termine) setLus((l) => (l.includes(etape) ? l : [...l, etape])); }, [v.termine, v.id]);
  useEffect(() => {
    if (!c || v.disponible || lu) return;
    const n = cour.dit.join(' ').length + cour.versets.length * 150;
    const t = setTimeout(() => setLus((l) => [...l, etape]), Math.max(2500, (n / 16) * 1000));
    return () => clearTimeout(t);
  }, [etape]);
  useEffect(() => { if (etape) setTimeout(() => bas.current?.scrollIntoView({ block: 'start', behavior: 'smooth' }), 60); if (cour?.fin) compter('conversation-fin', id + ':' + cour.fin); }, [etape]);
  useEffect(() => () => arreterVoix(), []);
  if (!c) return <div class="page"><p class="ligne__desc">Contenu introuvable.</p></div>;

  const repondre = (ch) => {
    const h = [...hist.slice(0, -1), { ...hist[etape], rep: ch.texte }, { n: ch.aller }];
    setHist(h);
    if (v.disponible) lireAVoixHaute(`${id}-${h.length - 1}`, blocsDe(c.noeuds[ch.aller]));
  };
  const recommencer = () => { arreterVoix(); setHist([{ n: 'debut' }]); setLus([]); scrollTo(0, 0); };

  const Bulle = ({ n, actif }) => (
    <div class="bulle bulle--chretien conv__app">
      <span class="bulle__avatar" aria-hidden="true"><Icone nom="croix" taille={16} /></span>
      <div class="bulle__corps">
        {n.dit.map((t, k) => <p {...(actif ? va(k) : {})} class={n.fin === 'priere' && k === n.dit.length - 1 ? 'conv__priere' : ''}>{t}</p>)}
        {n.versets.length > 0 && <div class="liste" style="margin-top:6px">{n.versets.map((r, k) => <div {...(actif ? va(n.dit.length + k) : {})}><CarteVerset reference={r} /></div>)}</div>}
      </div>
    </div>
  );

  return (
    <div class="page">
      {etape === 0 && <>
        <div class="theme-hero"><img src={c.image} alt="" />
          <div class="theme-hero__texte"><span class="pastille pastille--or">Conversation · {c.duree_estimee}</span><h2>{c.titre}</h2></div></div>
        <p class="guide-phase" style="margin-top:12px"><Icone nom="info" taille={18} /><span>{c.conseil}</span></p>
      </>}
      <div class="bulles">
        {hist.map((h, k) => <>
          {k === etape && <div ref={bas} style="scroll-margin-top:120px" />}
          <Bulle n={c.noeuds[h.n]} actif={k === etape} />
          {h.rep && <div class="bulle bulle--ami"><span class="bulle__avatar" aria-hidden="true">🙂</span><div class="bulle__corps"><p>{h.rep}</p></div></div>}
        </>)}
      </div>

      {v.disponible && <div class="etape-commandes" style="margin-top:10px">
        {ici && v.lecture ? <button class="bouton bouton--contour" onClick={pauseVoix}><Icone nom="pause" taille={20} /> Pause</button>
          : ici && !v.termine ? <button class="bouton bouton--contour" onClick={reprendreVoix}><Icone nom="lecture" taille={20} /> Reprendre</button>
          : <button class={'bouton ' + (lu ? 'bouton--contour' : 'bouton--or')} onClick={() => lireAVoixHaute(vid, blocsDe(cour))}><Icone nom={lu ? 'rejouer' : 'lecture'} taille={20} /> {lu ? 'Réécouter' : 'Écouter'}</button>}
      </div>}

      {cour.choix.length > 0 && (lu
        ? <div class="conv__choix" role="group" aria-label="Ta réponse">{cour.choix.map((ch) => <button class="bouton bouton--plein" onClick={() => repondre(ch)}>{ch.texte}</button>)}</div>
        : <p class="ligne__desc" style="text-align:center;margin-top:8px">{v.disponible ? (etape === 0 && !ici ? 'Touche « Écouter » pour commencer.' : 'Les réponses apparaîtront quand la voix aura fini.') : 'Lis le message ; les réponses apparaissent dans un instant.'}</p>)}

      {cour.fin === 'priere' && lu && <>
        {p.decision
          ? <p class="carte bloc" style="text-align:center;margin-top:12px"><Icone nom="verifie" /> Tu as noté le {new Date(p.decision).toLocaleDateString('fr-FR')} que tu as donné ta vie à Jésus. Bienvenue dans la famille de Dieu !</p>
          : <button class="bouton bouton--or" style="width:100%;margin-top:12px" onClick={() => { noterDecision(c.id); notifier('Bienvenue dans la famille de Dieu !'); }}><Icone nom="coeur" taille={20} /> J'ai prié pour recevoir le Seigneur Jésus</button>}
        <section class="carte bloc article" style="margin-top:12px">
          <h3>Et maintenant ?</h3>
          {c.apres.map((t) => <p>{t}</p>)}
          <a class="bouton bouton--plein" href="#/grandir/nouveau-converti" style="width:100%">Commencer le parcours « Nouveau converti »</a>
        </section>
      </>}
      {cour.fin === 'pas-encore' && lu && <a class="bouton bouton--contour" href="#/grandir/decouvrir-jesus" style="width:100%;margin-top:10px">Découvrir Jésus (10 leçons)</a>}
      {etape > 0 && <button class="lien" style="display:block;margin:16px auto 0" onClick={recommencer}>Recommencer la conversation</button>}
      {cour.fin && <p class="source-mention">{c.source}</p>}
    </div>
  );
}
