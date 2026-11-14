import { useState } from 'preact/hooks';
import { Embleme } from '../composants/Icone.jsx';
import { RESUME_POLITIQUE, TextePolitique } from './Confidentialite.jsx';

const PROMESSES = [
  '100 % gratuit',
  'Aucune publicité',
  'Aucun compte',
  'Votre journal et vos notes restent sur votre téléphone',
  'Fonctionne sans internet',
];

// Écran 1 : démarrage. Au premier lancement, affiche le bandeau des engagements et un bouton « Commencer ».
export function Demarrage({ premierLancement, surCommencer }) {
  const [etape, setEtape] = useState('accueil');   // accueil → politique → (refus)
  return (
    <div class="demarrage">
      <img class="demarrage__fond" src="/assets/lieux-bibliques/sentier-coucher-de-soleil.webp" alt="" />
      <div class="demarrage__voile" />
      <div class="demarrage__logo">
        <Embleme class="demarrage__embleme" />
        <h1 class="demarrage__nom">YESHAYA</h1>
        <p class="demarrage__slogan">« L'Éternel est salut »</p>
      </div>
      {premierLancement && etape === 'accueil' ? (
        <div class="demarrage__bandeau carte">
          <ul>
            {PROMESSES.map((p) => <li>{p}</li>)}
          </ul>
          <button class="bouton bouton--plein" onClick={() => setEtape('politique')}>Commencer</button>
        </div>
      ) : premierLancement && etape === 'politique' ? (
        <div class="demarrage__bandeau carte demarrage__politique">
          <h2>Confidentialité</h2>
          <ul>{RESUME_POLITIQUE.map((p) => <li>{p}</li>)}</ul>
          <details><summary>Lire la politique de confidentialité complète</summary><TextePolitique /></details>
          <p class="ligne__desc">En appuyant sur « J'accepte », vous acceptez la politique de confidentialité et l'envoi de statistiques anonymes.</p>
          <button class="bouton bouton--plein" onClick={surCommencer}>J'accepte et je continue</button>
          <button class="bouton bouton--contour" style="margin-top:8px" onClick={() => setEtape('refus')}>Je refuse</button>
        </div>
      ) : premierLancement && etape === 'refus' ? (
        <div class="demarrage__bandeau carte">
          <p>Sans votre accord, l'application ne peut pas être utilisée. Vous pouvez la fermer, ou revenir en arrière si vous changez d'avis.</p>
          <button class="bouton bouton--plein" onClick={() => setEtape('politique')}>Revenir</button>
        </div>
      ) : (
        <div class="demarrage__chargement" role="progressbar" aria-label="Chargement"><span /></div>
      )}
    </div>
  );
}
