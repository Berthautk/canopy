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
          <p class="ligne__desc">Acceptez-vous l'envoi de statistiques anonymes pour aider Yeshaya ? Votre choix ne change rien à l'utilisation de l'application, et vous pourrez le modifier dans les Paramètres.</p>
          <div class="demarrage__choix">
            <button class="bouton bouton--plein" onClick={() => surCommencer(true)}>J'accepte</button>
            <button class="bouton bouton--plein" onClick={() => surCommencer(false)}>Je refuse</button>
          </div>
        </div>
      ) : (
        <div class="demarrage__chargement" role="progressbar" aria-label="Chargement"><span /></div>
      )}
    </div>
  );
}
