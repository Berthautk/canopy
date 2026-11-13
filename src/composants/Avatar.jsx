import { profil } from '../donnees/profil.js';
import { useSignal } from '../outils/signal.js';

// Photo de profil, ou initiale du prénom, ou silhouette par défaut.
export function Avatar({ taille = 48 }) {
  const p = useSignal(profil);
  const style = { width: taille + 'px', height: taille + 'px', fontSize: taille * 0.42 + 'px' };
  if (p.photo) return <img class="avatar" src={p.photo} alt="Ma photo de profil" style={style} />;
  return (
    <span class="avatar avatar--vide" style={style} aria-hidden="true">
      {p.prenom ? p.prenom[0].toUpperCase() : (
        <svg viewBox="0 0 24 24" width="60%" height="60%" fill="currentColor"><circle cx="12" cy="8" r="4.2" /><path d="M3.5 21c.6-4.4 4.1-7 8.5-7s7.9 2.6 8.5 7z" /></svg>
      )}
    </span>
  );
}
