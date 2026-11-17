// Petit message temporaire en bas de l'écran (« Verset copié », etc.).
import { signal, useSignal } from '../outils/signal.js';
import { miseAJourDispo, recharger } from '../outils/miseAJour.js';
const msg = signal(null); let minuteur;
export function notifier(texte) { msg.valeur = texte; clearTimeout(minuteur); minuteur = setTimeout(() => (msg.valeur = null), 2200); }
export function Notification() {
  const m = useSignal(msg);
  return m ? <div class="toast" role="status">{m}</div> : null;
}

// Fenêtre au milieu de l'écran quand une nouvelle version est prête.
export function FenetreMiseAJour() {
  const dispo = useSignal(miseAJourDispo);
  if (!dispo) return null;
  return (
    <div class="maj-voile" role="dialog" aria-modal="true" aria-labelledby="maj-titre">
      <div class="maj-fenetre">
        <img src="/icons/icon-192.png" alt="" width="64" height="64" />
        <h2 id="maj-titre">Nouvelle mise à jour</h2>
        <p>Une nouvelle version de Yeshaya est prête, avec de nouveaux contenus et des améliorations.</p>
        <button class="bouton bouton--or" style="width:100%" onClick={recharger}>Recharger</button>
        <button class="lien" style="margin-top:10px" onClick={() => (miseAJourDispo.valeur = false)}>Plus tard</button>
      </div>
    </div>
  );
}
