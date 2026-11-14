import { useState, useEffect } from 'preact/hooks';
import { Icone } from './Icone.jsx';
import { voix, lireAVoixHaute, pauseVoix, reprendreVoix, arreterVoix } from '../audio/voix.js';
import { useSignal } from '../outils/signal.js';
import { usePassage, TextePassage } from './Verset.jsx';
import { lireReference, ecrireReference } from '../bible/references.js';

// Présentation illustrée (évangélisation) : une image apparaît, la voix explique ;
// le bouton « Suivant » ne s'active que lorsque la voix a fini. On ne peut pas sauter en avant.
// diapos = [{ image, titre, blocs: [{ texte } | { reference }] }]
export function Presentation({ id, titre, diapos, fermer, finale, surEtape }) {
  const [k, setK] = useState(0);
  const vid = id + '-presentation';
  const v = useSignal(voix);
  const d = diapos[k];
  const ici = v.id === vid;
  // « fini » ne vaut que pour la diapo en cours (évite qu'un double appui saute une image).
  const [lue, setLue] = useState(-1);
  useEffect(() => { if (ici && v.termine) setLue(k); }, [v.termine, v.id]);
  const fini = !v.disponible || lue === k;
  const derniere = k === diapos.length - 1;

  useEffect(() => { if (v.disponible) lireAVoixHaute(vid, d.blocs); surEtape?.(k); }, [k]);
  useEffect(() => { if (fini) surEtape?.(k + 1); }, [fini, k]);
  useEffect(() => () => arreterVoix(), []);

  const b = ici ? d.blocs[v.index] || {} : {};
  const texte = !v.disponible ? d.blocs.filter((x) => x.texte).map((x) => x.texte).join('\n\n')
    : b.texte || d.titre;

  return (
    <div class="priere-guidee diaporama" role="dialog" aria-modal="true" aria-label={'Présentation : ' + titre}>
      <div class="priere-guidee__tete"><span>{d.titre}</span>
        <button class="rond" onClick={fermer} aria-label="Quitter"><Icone nom="fermer" taille={20} /></button></div>
      <div class="priere-guidee__progres" aria-hidden="true"><span style={{ width: `${((k + (fini ? 1 : 0.5)) / diapos.length) * 100}%` }} /></div>
      <img class="diaporama__image" src={d.image} alt="" key={d.image + k} />
      <div class="priere-guidee__corps diaporama__texte">
        {b.reference ? <VersetDiapo reference={b.reference} /> : <p class="priere-guidee__texte">{texte}</p>}
      </div>
      {fini && derniere && finale}
      <div class="priere-guidee__commandes">
        <button class="rond rond--grand" onClick={() => setK(Math.max(0, k - 1))} disabled={k === 0} aria-label="Image précédente"><Icone nom="precedent" taille={26} /></button>
        {v.disponible && (fini
          ? <button class="rond rond--grand" onClick={() => lireAVoixHaute(vid, d.blocs)} aria-label="Réécouter"><Icone nom="rejouer" taille={24} /></button>
          : <button class="rond rond--grand" onClick={v.lecture ? pauseVoix : reprendreVoix} aria-label={v.lecture ? 'Pause' : 'Reprendre'}><Icone nom={v.lecture ? 'pause' : 'lecture'} taille={24} /></button>)}
        {derniere
          ? <button class="bouton bouton--plein priere-guidee__ok" disabled={!fini} onClick={fermer}><Icone nom="verifie" taille={24} /> Terminer</button>
          : <button class="bouton bouton--plein priere-guidee__ok" disabled={!fini} onClick={() => setK(k + 1)}>
              {fini ? <>Suivant <Icone nom="chevron" taille={24} /></> : <span class="ligne__desc" style="color:inherit">Écoute…</span>}</button>}
      </div>
      <p class="diaporama__etape">{k + 1} / {diapos.length}</p>
    </div>
  );
}

// Pendant la lecture d'un verset, son texte (Bible LSG) s'affiche à l'écran.
function VersetDiapo({ reference }) {
  const etat = usePassage(reference), r = lireReference(reference);
  return (
    <div class="diaporama__verset">
      <p class="priere-guidee__etape">📖 {r ? ecrireReference(r) : reference}</p>
      <TextePassage etat={etat} />
    </div>
  );
}
