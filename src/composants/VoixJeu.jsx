import { useEffect } from 'preact/hooks';
import { Icone } from './Icone.jsx';
import { voix, lireAVoixHaute, arreterVoix } from '../audio/voix.js';
import { reglages, modifierReglages } from '../donnees/reglages.js';
import { useSignal } from '../outils/signal.js';

// Voix des jeux : lit la question dès qu'elle apparaît (si la lecture des jeux est activée),
// et garde en haut un bouton pour écouter, réécouter, arrêter, ou couper la voix des jeux.
export function VoixJeu({ cle, blocs }) {
  const v = useSignal(voix), r = useSignal(reglages);
  const id = 'jeu:' + cle;
  const active = r.voixJeux !== false;
  useEffect(() => { if (active && v.disponible && blocs?.length) { const t = setTimeout(() => lireAVoixHaute(id, blocs), 250); return () => clearTimeout(t); } }, [cle]);
  useEffect(() => () => arreterVoix(), []);
  if (!v.disponible) return null;
  const parle = v.id === id && v.lecture;
  return (
    <div class="voix-jeu">
      <button class={'bouton bouton--petit ' + (parle ? 'bouton--contour' : 'bouton--or')} onClick={() => (parle ? arreterVoix() : lireAVoixHaute(id, blocs))}>
        <Icone nom={parle ? 'pause' : 'lecture'} taille={16} /> {parle ? 'Arrêter la voix' : 'Écouter'}</button>
      <button class="bouton bouton--contour bouton--petit" aria-pressed={active} onClick={() => { if (active) arreterVoix(); modifierReglages({ voixJeux: !active }); }}>
        <Icone nom={active ? 'son' : 'muet'} taille={16} /> {active ? 'Voix auto' : 'Voix coupée'}</button>
    </div>
  );
}
