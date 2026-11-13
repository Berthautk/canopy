import { Icone } from '../../composants/Icone.jsx';
import { notifier } from '../../composants/Notification.jsx';
import { usePassage, cheminLire } from '../../composants/Verset.jsx';
import { ecrireReference, cleVerset, PAR_CODE } from '../../bible/references.js';
import { annotations, basculerFavori } from '../../donnees/annotations.js';
import { useSignal } from '../../outils/signal.js';
import { partager, copier } from '../../outils/partage.js';
import { retour } from '../../outils/routeur.js';

// Écran 23 : mode « Montrer », verset en plein écran pour le faire lire à quelqu'un.
export function Montrer({ code, c, v }) {
  const [debut, fin] = String(v).split('-').map(Number);
  const r = PAR_CODE[code] ? { code, c: +c, v: debut, fin: fin || null } : null;
  const etat = usePassage(r || 'inconnu');
  const notes = useSignal(annotations);
  const cle = r && cleVerset(code, r.c, debut);
  const ref = r ? ecrireReference(r) : '';
  const long = (etat.texte || '').length > 260;

  return (
    <div class="montrer">
      <img class="montrer__fond" src="/assets/paysages/lever-soleil-collines.webp" alt="" />
      <div class="montrer__voile" />
      <div class="montrer__barre">
        <button class="entete__btn" onClick={() => retour('bible')} aria-label="Fermer"><Icone nom="fermer" /></button>
        <span>Montrer le verset</span>
        <span />
      </div>
      <div class="montrer__centre">
        <span class="montrer__ref">{ref}</span>
        {etat.erreur && <p class="montrer__texte" style="font-size:20px">{etat.erreur}</p>}
        {etat.texte && <p class={'montrer__texte' + (long ? ' montrer__texte--long' : '')}>«&nbsp;{etat.texte}&nbsp;»</p>}
        <span class="montrer__source">Louis Segond 1910</span>
      </div>
      {etat.texte && (
        <div class="montrer__actions">
          <button onClick={async () => notifier((await copier(`« ${etat.texte} » — ${ref} (LSG)`)) ? 'Verset copié' : 'Copie impossible')}><Icone nom="copier" /><span>Copier</span></button>
          <button onClick={() => basculerFavori(cle)} class={notes[cle]?.favori ? 'actif' : ''}><Icone nom="coeur" /><span>Favori</span></button>
          <button onClick={() => partager({ titre: ref, texte: `« ${etat.texte} » — ${ref} (LSG)`, chemin: cheminLire(r) })}><Icone nom="partager" /><span>Partager</span></button>
        </div>
      )}
    </div>
  );
}
