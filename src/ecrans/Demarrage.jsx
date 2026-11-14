import { Embleme } from '../composants/Icone.jsx';

const PROMESSES = [
  '100 % gratuit',
  'Aucune publicité',
  'Aucun compte',
  'Vos données personnelles restent sur votre téléphone',
  'Fonctionne sans internet',
];

// Écran 1 : démarrage. Au premier lancement, affiche le bandeau des engagements et un bouton « Commencer ».
export function Demarrage({ premierLancement, surCommencer }) {
  return (
    <div class="demarrage">
      <img class="demarrage__fond" src="/assets/lieux-bibliques/sentier-coucher-de-soleil.webp" alt="" />
      <div class="demarrage__voile" />
      <div class="demarrage__logo">
        <Embleme class="demarrage__embleme" />
        <h1 class="demarrage__nom">YESHAYA</h1>
        <p class="demarrage__slogan">« L'Éternel est salut »</p>
      </div>
      {premierLancement ? (
        <div class="demarrage__bandeau carte">
          <ul>
            {PROMESSES.map((p) => <li>{p}</li>)}
          </ul>
          <button class="bouton bouton--plein" onClick={surCommencer}>Commencer</button>
        </div>
      ) : (
        <div class="demarrage__chargement" role="progressbar" aria-label="Chargement"><span /></div>
      )}
    </div>
  );
}
