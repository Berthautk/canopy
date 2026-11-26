import { useEffect, useRef } from 'preact/hooks';
import { signal, useSignal } from '../outils/signal.js';
import { route } from '../outils/routeur.js';
import { Icone } from './Icone.jsx';
import { auRevoir, TYPES, activites } from '../donnees/activites.js';

// « Tu nous quittes déjà ? » : quand on quitte, depuis l'application, quelque chose qu'on n'a pas fini.
// (Une page web ne peut pas afficher son propre message quand on ferme complètement l'application :
//  dans ce cas, c'est au retour qu'on retrouve « Voici où tu étais ».)
const sortie = signal(null);
const adieu = signal(null);

// À poser dans une page : `decrire()` rend l'activité en cours (ou null si tout est fini).
export function useGardeSortie(decrire) {
  const ref = useRef(decrire); ref.current = decrire;
  useEffect(() => {
    const h0 = route.valeur.hash;
    return () => {
    if (route.valeur.hash === h0) return;                    // la page a seulement changé de vue, on n'est pas parti
    const a = ref.current();
    if (!a || (a.cle && activites.valeur[a.cle]?.fini)) return;
    const dest = route.valeur.segments[0];
    if (dest === 'bible' || dest === 'montrer') return;      // un verset ouvert depuis la page : on reviendra
    sortie.valeur = a;
    };
  }, []);
}

export function SortieAvantFin() {
  const a = useSignal(sortie), m = useSignal(adieu);
  useEffect(() => { if (m) { const t = setTimeout(() => { adieu.valeur = null; }, 6500); return () => clearTimeout(t); } }, [m]);
  return (
    <>
      {a && (
        <div class="sortie" role="dialog" aria-modal="true" aria-labelledby="sortie-titre">
          <div class="sortie__boite">
            <span class="sortie__icone"><Icone nom={TYPES[a.type]?.icone || 'priere'} taille={30} /></span>
            <h2 id="sortie-titre">Tu nous quittes déjà ?</h2>
            <p>Tu n'as pas fini : <b>{a.titre}</b>{a.libelle ? ` (${a.libelle})` : ''}.</p>
            <button class="bouton bouton--or" onClick={() => { sortie.valeur = null; location.hash = a.lien; }}>Rester et continuer</button>
            <button class="bouton bouton--contour" onClick={() => { sortie.valeur = null; adieu.valeur = auRevoir(a.type); }}>Je pars quand même</button>
          </div>
        </div>
      )}
      {m && !a && <div class="adieu" role="status" onClick={() => { adieu.valeur = null; }}><Icone nom="coeur" taille={20} /><span>{m}</span></div>}
    </>
  );
}
