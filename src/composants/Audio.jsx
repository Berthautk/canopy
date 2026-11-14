import { Icone } from './Icone.jsx';
import { notifier } from './Notification.jsx';
import { lecteur, jouer, basculer, fermer, formatTemps } from '../audio/lecteur.js';
import { telecharges, enCours, telecharger, supprimer } from '../audio/telechargements.js';
import { useSignal } from '../outils/signal.js';
import { route } from '../outils/routeur.js';

// Bouton « Télécharger » / progression / « Hors ligne » pour une piste.
export function BoutonTelecharger({ piste, compact }) {
  const t = useSignal(telecharges), e = useSignal(enCours);
  if (!piste) return null;
  if (t[piste.id]) {
    return (
      <button class={'btn-dl btn-dl--ok' + (compact ? ' btn-dl--compact' : '')} aria-label="Disponible hors ligne. Appuyer pour supprimer le téléchargement"
        onClick={() => { if (confirm(`Supprimer « ${piste.titre} » de ce téléphone ?`)) { supprimer(piste.id); notifier('Téléchargement supprimé'); } }}>
        <Icone nom="verifie" taille={18} /> {!compact && 'Hors ligne'}
      </button>
    );
  }
  if (e[piste.id] !== undefined) {
    return <span class={'btn-dl btn-dl--cours' + (compact ? ' btn-dl--compact' : '')} role="progressbar" aria-valuenow={e[piste.id]} aria-label="Téléchargement en cours">
      <span class="btn-dl__barre" style={{ width: e[piste.id] + '%' }} /> {compact ? e[piste.id] + '%' : `Téléchargement… ${e[piste.id]} %`}</span>;
  }
  return (
    <button class={'btn-dl' + (compact ? ' btn-dl--compact' : '')} aria-label={'Télécharger ' + piste.titre}
      onClick={async () => notifier((await telecharger(piste)) ? 'Disponible hors ligne' : 'Téléchargement impossible. Vérifiez la connexion.')}>
      <Icone nom="telecharger" taille={18} /> {!compact && 'Télécharger'}
    </button>
  );
}

// Bouton lecture/pause pour une piste donnée (dans une liste ou une carte).
export function BoutonLecture({ piste, taille = 48 }) {
  const l = useSignal(lecteur);
  const actif = l.piste?.id === piste?.id;
  const enLecture = actif && l.lecture;
  return (
    <button class="btn-lecture" style={{ width: taille + 'px', height: taille + 'px' }} disabled={!piste}
      onClick={() => (actif ? basculer() : jouer(piste))} aria-label={enLecture ? 'Pause' : 'Écouter ' + (piste?.titre || '')}>
      <Icone nom={enLecture ? 'pause' : 'lecture'} taille={Math.round(taille * 0.45)} />
    </button>
  );
}

// Mini-lecteur au-dessus de la barre d'onglets, visible dès qu'un audio est chargé.
export function MiniLecteur() {
  const l = useSignal(lecteur), r = useSignal(route);
  if (!l.piste || r.segments[0] === 'ecouter') return null;
  const pct = l.duree ? (l.position / l.duree) * 100 : 0;
  return (
    <div class="mini-lecteur" role="region" aria-label="Lecteur audio">
      <a class="mini-lecteur__info" href={'#/ecouter/' + l.piste.id}>
        <img src={l.piste.image} alt="" />
        <span class="mini-lecteur__textes">
          <span class="mini-lecteur__titre">{l.piste.titre}</span>
          <span class="mini-lecteur__auteur">{l.erreur || `${l.piste.auteur} · ${formatTemps(l.position)}`}</span>
        </span>
      </a>
      <button class="mini-lecteur__btn" onClick={basculer} aria-label={l.lecture ? 'Pause' : 'Lecture'}><Icone nom={l.lecture ? 'pause' : 'lecture'} /></button>
      <button class="mini-lecteur__btn mini-lecteur__btn--fermer" onClick={fermer} aria-label="Fermer le lecteur"><Icone nom="fermer" taille={20} /></button>
      <span class="mini-lecteur__progression" style={{ width: pct + '%' }} />
    </div>
  );
}
