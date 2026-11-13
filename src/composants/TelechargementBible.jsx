import { useEffect } from 'preact/hooks';
import { Icone } from './Icone.jsx';
import { etatTelechargement, telechargerBible, verifierHorsLigne } from '../bible/bible.js';
import { useSignal } from '../outils/signal.js';

// Bandeau « Télécharger la Bible pour l'utiliser hors ligne » avec barre de progression.
export function TelechargementBible({ compact }) {
  const e = useSignal(etatTelechargement);
  useEffect(() => { if (e.statut === 'inconnu') verifierHorsLigne(); }, []);
  if (e.statut === 'inconnu' || e.statut === 'indisponible') return null;
  if (e.statut === 'complet') return compact ? null : (
    <p class="hors-ligne-ok"><Icone nom="verifie" taille={18} /> La Bible est disponible hors ligne sur ce téléphone.</p>
  );
  const pct = Math.round((e.fait / e.total) * 100);
  return (
    <section class="carte telechargement">
      <div class="telechargement__tete">
        <span class="ligne__icone"><Icone nom="telecharger" /></span>
        <div>
          <h3>Télécharger la Bible pour l'utiliser hors ligne</h3>
          <p class="ligne__desc">Environ 1,4 Mo, une seule fois. Ensuite, plus besoin d'internet pour la lire.</p>
        </div>
      </div>
      {e.statut === 'en-cours' ? (
        <div class="progression" role="progressbar" aria-valuenow={pct} aria-valuemin="0" aria-valuemax="100" aria-label="Téléchargement de la Bible">
          <span style={{ width: pct + '%' }} /><b>{e.fait} / {e.total} livres</b>
        </div>
      ) : (
        <button class="bouton bouton--plein" onClick={telechargerBible}>
          {e.statut === 'erreur' ? 'Reprendre le téléchargement' : e.fait > 0 ? 'Terminer le téléchargement' : 'Télécharger'}
        </button>
      )}
      {e.statut === 'erreur' && <p class="ligne__desc">Connexion interrompue. Les livres déjà reçus sont gardés : appuyez pour reprendre.</p>}
    </section>
  );
}
