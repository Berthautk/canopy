// Petit message temporaire en bas de l'écran (« Verset copié », etc.).
import { signal, useSignal } from '../outils/signal.js';
const msg = signal(null); let minuteur;
export function notifier(texte) { msg.valeur = texte; clearTimeout(minuteur); minuteur = setTimeout(() => (msg.valeur = null), 2200); }
export function Notification() {
  const m = useSignal(msg);
  return m ? <div class="toast" role="status">{m}</div> : null;
}
