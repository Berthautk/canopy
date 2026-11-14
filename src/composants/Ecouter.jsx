import { useEffect } from 'preact/hooks';
import { Icone } from './Icone.jsx';
import { voix, lireAVoixHaute, pauseVoix, reprendreVoix, arreterVoix, sauterVoix, vitesseVoix, VITESSES_VOIX } from '../audio/voix.js';
import { lecteur } from '../audio/lecteur.js';
import { useSignal } from '../outils/signal.js';

// Barre « Écouter » pour un contenu écrit : lecture à voix haute, bloc par bloc, avec surlignage.
export function BarreEcoute({ id, blocs, titre = 'Écouter' }) {
  const v = useSignal(voix), audio = useSignal(lecteur);
  const actif = v.id === id;
  useEffect(() => () => { if (voix.valeur.id === id) arreterVoix(); }, [id]);           // on quitte la page : on arrête
  useEffect(() => { if (audio.lecture && voix.valeur.lecture) pauseVoix(); }, [audio.lecture]);   // un audio démarre : la voix se tait
  if (!v.disponible) return null;
  return (
    <section class={'carte barre-ecoute' + (actif ? ' barre-ecoute--active' : '')}>
      {!actif ? (
        <button class="barre-ecoute__lancer" onClick={() => lireAVoixHaute(id, blocs)}>
          <span class="btn-lecture" style="width:44px;height:44px"><Icone nom="lecture" taille={20} /></span>
          <span class="ligne__corps"><span class="ligne__titre" style="display:block">{titre}</span>
            <span class="ligne__desc">Lecture à voix haute · voix de synthèse du téléphone</span></span>
        </button>
      ) : (
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
          <p class="ligne__desc" style="margin:6px 0 0">L'écran reste allumé pendant la lecture (le téléphone coupe la voix s'il se met en veille).</p>
          {v.aucuneVoixFr && <p class="ligne__desc">Aucune voix française trouvée : dans les réglages du téléphone, installez la voix française de « Synthèse vocale ».</p>}
        </>
      )}
    </section>
  );
}

// Attribut à poser sur chaque bloc lu, pour le surligner pendant la lecture.
export function useVoixActive(id) {
  const v = useSignal(voix);
  return (i) => ({ 'data-voix': i, 'data-voix-actif': v.id === id && v.index === i ? 'oui' : undefined });
}
