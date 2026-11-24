import { useEffect, useRef, useState } from 'preact/hooks';
import { Icone } from './Icone.jsx';
import { voix, lireAVoixHaute, pauseVoix, reprendreVoix, arreterVoix, sauterVoix, vitesseVoix, VITESSES_VOIX, positionVoix, reprendreDepuisMemoire } from '../audio/voix.js';
import { lecteur } from '../audio/lecteur.js';
import { useSignal } from '../outils/signal.js';

// Barre « Écouter » pour un contenu écrit : lecture à voix haute, bloc par bloc, avec surlignage.
export function BarreEcoute({ id, blocs, titre = 'Écouter' }) {
  const v = useSignal(voix), audio = useSignal(lecteur);
  const actif = v.id === id;
  const ref = useRef(null), [horsVue, setHorsVue] = useState(false);
  useEffect(() => () => { if (voix.valeur.id === id) arreterVoix(); }, [id]);           // on quitte la page : on arrête (la position est gardée)
  useEffect(() => { if (audio.lecture && voix.valeur.lecture) pauseVoix(); }, [audio.lecture]);   // un audio démarre : la voix se tait
  useEffect(() => {   // la barre sort de l'écran : une petite commande flottante la remplace
    if (!ref.current || typeof IntersectionObserver === 'undefined') return;
    const o = new IntersectionObserver(([e]) => setHorsVue(!e.isIntersecting && e.boundingClientRect.top < 0)); o.observe(ref.current); return () => o.disconnect();
  }, [actif]);
  if (!v.disponible) return null;
  const memoire = !actif ? positionVoix(id) : null;
  return (
    <>
    <section ref={ref} class={'carte barre-ecoute' + (actif ? ' barre-ecoute--active' : '')}>
      {!actif ? (memoire ? (
        <div class="barre-ecoute__memoire">
          <button class="barre-ecoute__lancer" onClick={() => reprendreDepuisMemoire(id, blocs)}>
            <span class="btn-lecture" style="width:44px;height:44px"><Icone nom="lecture" taille={20} /></span>
            <span class="ligne__corps"><span class="ligne__titre" style="display:block">Reprendre l'écoute</span>
              <span class="ligne__desc">Là où tu t'es arrêté · passage {memoire.index + 1} sur {blocs.length}</span></span>
          </button>
          <button class="lien" onClick={() => lireAVoixHaute(id, blocs)}>Écouter depuis le début</button>
        </div>
      ) : (
        <button class="barre-ecoute__lancer" onClick={() => lireAVoixHaute(id, blocs)}>
          <span class="btn-lecture" style="width:44px;height:44px"><Icone nom="lecture" taille={20} /></span>
          <span class="ligne__corps"><span class="ligne__titre" style="display:block">{titre}</span>
            <span class="ligne__desc">Lecture à voix haute · voix de synthèse du téléphone</span></span>
        </button>
      )) : (
        <>
          <div class="barre-ecoute__commandes">
            <button class="rond" onClick={() => sauterVoix(-1)} aria-label="Passage précédent"><Icone nom="precedent" taille={20} /></button>
            <button class="btn-lecture" style="width:52px;height:52px" onClick={v.lecture ? pauseVoix : reprendreVoix} aria-label={v.lecture ? 'Pause' : 'Reprendre'}>
              <Icone nom={v.lecture ? 'pause' : 'lecture'} taille={24} /></button>
            <button class="rond" onClick={() => sauterVoix(1)} aria-label="Passage suivant"><Icone nom="chevron" taille={20} /></button>
            <button class="rond" onClick={arreterVoix} aria-label="Arrêter la lecture"><Icone nom="fermer" taille={18} /></button>
          </div>
          <div class="barre-ecoute__pied">
            <span class="ligne__desc">Passage {v.index + 1} / {v.total}</span>
            <span class="segments segments--mini" role="group" aria-label="Vitesse de la voix">
              {VITESSES_VOIX.map((x) => <button aria-pressed={v.vitesse === x} onClick={() => vitesseVoix(x)}>{String(x).replace('.', ',')}×</button>)}
            </span>
          </div>
          <p class="ligne__desc" style="margin:6px 0 0">La pause garde ta place : « Lecture » reprend exactement là où tu t'es arrêté.</p>
          {v.aucuneVoixFr && <p class="ligne__desc">Aucune voix française trouvée : dans les réglages du téléphone, installez la voix française de « Synthèse vocale ».</p>}
        </>
      )}
    </section>
    {actif && horsVue && (
      <div class="ecoute-flottante" role="group" aria-label="Lecture à voix haute">
        <button class="btn-lecture" onClick={v.lecture ? pauseVoix : reprendreVoix} aria-label={v.lecture ? 'Pause' : 'Reprendre'}><Icone nom={v.lecture ? 'pause' : 'lecture'} taille={22} /></button>
        <span class="ecoute-flottante__texte">{v.lecture ? 'Lecture en cours' : 'En pause'} · {v.index + 1}/{v.total}</span>
        <button class="rond" onClick={() => ref.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })} aria-label="Afficher les commandes"><Icone nom="reglages" taille={18} /></button>
        <button class="rond" onClick={arreterVoix} aria-label="Arrêter"><Icone nom="fermer" taille={18} /></button>
      </div>
    )}
    </>
  );
}

// Attribut à poser sur chaque bloc lu, pour le surligner pendant la lecture.
export function useVoixActive(id) {
  const v = useSignal(voix);
  return (i) => ({ 'data-voix': i, 'data-voix-actif': v.id === id && v.index === i ? 'oui' : undefined });
}
