import { useEffect, useRef, useState } from 'preact/hooks';
import { lireAVoixHaute, arreterVoix, voix } from '../audio/voix.js';
import { messageSuivant, ANNONCE } from '../jeux/messages.js';

// Après plusieurs erreurs dans un jeu : un temps « Écoute ceci attentivement », un silence,
// puis un court message pour enfants (il change à chaque fois : péché, croix, pardon, repentance…).
export function useMessageEchecs(seuil = 3) {
  const [etat, setEtat] = useState(null);           // null | { phase: 'ecoute' } | { phase: 'message', m }
  const n = useRef(0);
  const echec = () => { n.current++; if (n.current % seuil === 0) { setEtat({ phase: 'ecoute' }); lireAVoixHaute('jeu-message', [{ texte: ANNONCE }]); } };
  useEffect(() => {
    if (etat?.phase !== 'ecoute') return;
    let t0 = null, id;
    const tic = () => {
      if (voix.valeur.lecture) { t0 = null; id = setTimeout(tic, 150); return; }
      if (t0 == null) t0 = Date.now();
      if (Date.now() - t0 >= 2200) { const m = messageSuivant(); setEtat({ phase: 'message', m }); dire(m); return; }
      id = setTimeout(tic, 150);
    };
    id = setTimeout(tic, 300);
    return () => clearTimeout(id);
  }, [etat?.phase]);
  useEffect(() => () => arreterVoix(), []);
  const dire = (m) => lireAVoixHaute('jeu-message', [{ texte: `${m.titre}. ${m.texte} La Bible dit : ${m.verset.replace(/[«»]/g, '')} ${m.ref}.` }]);
  const fermer = () => { arreterVoix(); setEtat(null); };
  const voile = !etat ? null : (
    <div class="message-echecs" role="dialog" aria-modal="true" aria-label="Message pour toi">
      {etat.phase === 'ecoute' ? <div class="message-echecs__boite message-echecs__boite--ecoute">
        <p class="course__oreille" aria-hidden="true">👂</p><h2>Écoute ceci attentivement</h2>
        <p class="course__points" aria-hidden="true"><i /><i /><i /></p>
      </div> : <div class="message-echecs__boite">
        <p class="course__etiquette">Message pour toi</p>
        <h2>{etat.m.titre}</h2>
        <p>{etat.m.texte}</p>
        <p class="course__verset">{etat.m.verset}<small>{etat.m.ref}</small></p>
        <button class="bouton bouton--or" onClick={fermer}>J'ai compris, je continue ▶</button>
        <button class="lien course__reecouter" onClick={() => dire(etat.m)}>🔊 Réécouter</button>
      </div>}
    </div>
  );
  return [echec, voile];
}
