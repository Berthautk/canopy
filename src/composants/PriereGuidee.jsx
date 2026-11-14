import { useState, useEffect } from 'preact/hooks';
import { Icone } from './Icone.jsx';
import { TexteRefs } from './TexteRefs.jsx';
import { voix, lireAVoixHaute, arreterVoix } from '../audio/voix.js';
import { useSignal } from '../outils/signal.js';
import { noterPriere, noterSujetPrie } from '../donnees/priere.js';

const CONSIGNE = "Écoute le sujet de prière. Puis prie, avec tes propres mots, à voix haute ou dans ton cœur. Quand tu as fini, appuie sur le grand bouton : j'ai prié.";

// Prière guidée à la voix, pour ceux qui ne lisent pas (ou pas facilement) :
// la voix lit un sujet, la personne prie, puis appuie sur « J'ai prié » pour passer au suivant.
// etapes = [{ titre, texte?, sujets: [{ titre?, texte }] }]
export function PriereGuidee({ id, titre, etapes, auto }) {
  const [ouvert, setOuvert] = useState(!!auto);
  const v = useSignal(voix);
  if (!v.disponible) return null;
  return (
    <>
      <button class="carte priere-guidee__lancer" onClick={() => setOuvert(true)}>
        <span class="priere-guidee__icone" aria-hidden="true"><Icone nom="radio" taille={28} /></span>
        <span class="ligne__corps"><span class="ligne__titre" style="display:block">Prier avec la voix</span>
          <span class="ligne__desc">Écoute, répète et prie, un sujet après l'autre. Sans avoir besoin de lire.</span></span>
      </button>
      {ouvert && <Lecteur id={id} titre={titre} etapes={etapes} fermer={() => { arreterVoix(); setOuvert(false); }} />}
    </>
  );
}

function Lecteur({ id, titre, etapes, fermer }) {
  // Une seule liste : chaque sujet garde le titre de sa phase.
  const liste = etapes.flatMap((e, k) => e.sujets.map((s, j) => ({ ...s, phase: e.titre, introPhase: j === 0 ? e : null, k })));
  const [i, setI] = useState(-1);         // -1 : consigne de départ ; liste.length : fin
  const [faits, setFaits] = useState(0);
  const vid = id + '-guide';
  const v = useSignal(voix);
  const parle = v.id === vid && v.lecture;

  const dire = (n) => {
    if (n < 0) return lireAVoixHaute(vid, [{ texte: titre + '.' }, { texte: CONSIGNE }]);
    if (n >= liste.length) return lireAVoixHaute(vid, [{ texte: `Amen. Tu as prié ${faits} sujet${faits > 1 ? 's' : ''}. Que Dieu te bénisse et exauce tes prières, au nom de Jésus.` }]);
    const s = liste[n], b = [];
    if (s.introPhase && etapes.length > 1) b.push({ texte: s.introPhase.titre + '.' }, s.introPhase.texte ? { texte: s.introPhase.texte } : null);
    b.push({ texte: `Sujet ${n + 1}.` + (s.titre ? ' ' + s.titre + '.' : '') }, { texte: s.texte }, { texte: 'Maintenant, prie.' });
    lireAVoixHaute(vid, b.filter(Boolean));
  };
  useEffect(() => { dire(i); }, [i]);
  useEffect(() => () => arreterVoix(), []);

  const suivant = () => {
    if (i >= 0 && i < liste.length) { setFaits(faits + 1); noterSujetPrie(); }
    if (i === liste.length - 1) noterPriere(id);
    setI(Math.min(i + 1, liste.length));
  };
  const s = liste[i];
  return (
    <div class="priere-guidee" role="dialog" aria-modal="true" aria-label={'Prier avec la voix : ' + titre}>
      <div class="priere-guidee__tete">
        <span>{titre}</span>
        <button class="rond" onClick={fermer} aria-label="Quitter"><Icone nom="fermer" taille={20} /></button>
      </div>
      <div class="priere-guidee__progres" aria-hidden="true"><span style={{ width: `${(Math.max(0, i) / liste.length) * 100}%` }} /></div>
      <div class="priere-guidee__corps">
        {i < 0 && <><p class="priere-guidee__etape">Écoute · Répète · Prie</p><p class="priere-guidee__texte">{CONSIGNE}</p></>}
        {s && <>
          <p class="priere-guidee__etape">{s.phase ? s.phase + ' · ' : ''}Sujet {i + 1} sur {liste.length}</p>
          {s.titre && <h2>{s.titre}</h2>}
          <p class="priere-guidee__texte"><TexteRefs texte={s.texte} /></p>
          <p class="priere-guidee__consigne"><Icone nom="priere" taille={20} /> {parle ? 'Écoute…' : 'Maintenant, prie. Puis appuie sur « J\'ai prié ».'}</p>
        </>}
        {i >= liste.length && <><p class="priere-guidee__etape">Amen</p><h2>Tu as prié {faits} sujet{faits > 1 ? 's' : ''}</h2><p class="priere-guidee__texte">Que Dieu te bénisse et exauce tes prières, au nom de Jésus.</p></>}
      </div>
      <div class="priere-guidee__commandes">
        {i < liste.length ? <>
          <button class="rond rond--grand" onClick={() => setI(Math.max(-1, i - 1))} disabled={i < 0} aria-label="Sujet précédent"><Icone nom="precedent" taille={26} /></button>
          <button class="rond rond--grand" onClick={() => dire(i)} aria-label="Réécouter"><Icone nom="rejouer" taille={26} /></button>
          <button class="bouton bouton--plein priere-guidee__ok" onClick={suivant}>
            <Icone nom={i < 0 ? 'lecture' : 'verifie'} taille={26} /> {i < 0 ? 'Commencer' : "J'ai prié"}</button>
        </> : <button class="bouton bouton--plein priere-guidee__ok" onClick={fermer}><Icone nom="verifie" taille={26} /> Terminer</button>}
      </div>
    </div>
  );
}
