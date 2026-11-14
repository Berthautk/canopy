import { Icone } from '../../composants/Icone.jsx';
import { stats, BADGES } from '../../jeux/stats.js';
import { useSignal } from '../../outils/signal.js';

// Écran 34 : mes badges (personnels, sans classement).
export function Badges() {
  const s = useSignal(stats);
  const obtenus = BADGES.filter((b) => s.badges[b[0]]).length;
  return (
    <div class="page">
      <p class="jouer-intro" style="margin-top:12px">Tes progrès dans la Parole. Ils restent sur ton téléphone : pas de classement, pas de comparaison.</p>
      <div class="grille-badges">
        {BADGES.map(([id, nom, desc, icone, prog]) => {
          const ok = !!s.badges[id], p = Math.round(prog(s) * 100);
          return (
            <div class={'carte badge' + (ok ? ' badge--ok' : '')}>
              <span class="badge__icone"><Icone nom={icone} taille={30} /></span>
              <span class="badge__nom">{nom}</span>
              <span class="badge__desc">{desc}</span>
              {ok ? <span class="badge__etat"><Icone nom="verifie" taille={14} /> Obtenu</span>
                : <span class="progression progression--fine" style="width:100%"><span style={{ width: p + '%' }} /></span>}
            </div>
          );
        })}
      </div>
      <section class="carte bloc">
        <div class="progression-tete"><span class="ligne__titre">Badges obtenus</span><span class="ligne__desc">{obtenus} / {BADGES.length}</span></div>
        <div class="progression progression--fine"><span style={{ width: (obtenus / BADGES.length) * 100 + '%' }} /></div>
        <p class="ligne__desc">Quiz joués : {s.quizJoues} · Bonnes réponses : {s.bonnes} · Versets complétés : {s.complete}</p>
      </section>
    </div>
  );
}
