import { useMemo, useState } from 'preact/hooks';
import { Icone } from '../../composants/Icone.jsx';
import { NIVEAUX_CHEMIN, QUIZ } from '../../donnees/contenu.js';
import { chemin, rang, serie, terminerNiveau, totalEtoiles, son, sonsActifs, basculerSons } from '../../jeux/chemin.js';
import { majChemin } from '../../jeux/stats.js';
import { melanger } from '../../jeux/hasard.js';
import { useSignal } from '../../outils/signal.js';
import { compter } from '../../donnees/mesure.js';
import { ecrireReference, lireReference } from '../../bible/references.js';

const VIES = 3, POINTS = 10, BONUS_COMBO = 5, BONUS_ETOILE = 15;
const parId = () => Object.fromEntries(QUIZ.flatMap((t) => t.questions.map((q) => [q.id, { ...q, type: 'qcm' }])));
const questionsDu = (n) => { const m = parId(); return n.questions.map((q) => (q.id ? m[q.id] : q)).filter(Boolean); };
const debloque = (k, e) => k === 0 || (e[NIVEAUX_CHEMIN[k - 1].id] || 0) > 0;
const refLisible = (r) => { const x = lireReference(r); return x ? ecrireReference(x) : r; };

// Barre de rang : nom, points, progression vers le rang suivant.
export function CarteRang({ compacte }) {
  const c = useSignal(chemin), r = rang(c.xp), s = serie(c.jours);
  return (
    <div class={'carte rang-carte' + (compacte ? ' rang-carte--compacte' : '')}>
      <div class="rang-carte__tete">
        <span class="rang-carte__badge" aria-hidden="true">{['🌱', '🕊️', '🪔', '🛡️', '📜', '👑'][r.i]}</span>
        <span class="ligne__corps"><span class="ligne__titre" style="display:block">{r.nom}</span>
          <span class="ligne__desc">{c.xp} points · ⭐ {totalEtoiles(c.etoiles)}{s > 1 ? ` · 🔥 ${s} jours de suite` : ''}</span></span>
      </div>
      <div class="progression"><span style={{ width: r.progression * 100 + '%' }} /></div>
      <p class="ligne__desc" style="margin:4px 0 0">{r.prochain ? `Encore ${r.prochain - c.xp} points pour devenir « ${r.nomSuivant} »` : 'Rang le plus haut atteint. Bravo !'}</p>
    </div>
  );
}

// Carte du chemin : les niveaux à débloquer les uns après les autres.
export function CheminFoi() {
  const c = useSignal(chemin);
  const [sons, setSons] = useState(sonsActifs());
  return (
    <div class="page">
      <div class="chemin-hero"><h2>Le Chemin de la foi</h2><p>Traverse toute la Bible, niveau après niveau. 3 vies par niveau : gagne des étoiles et monte en rang !</p></div>
      <CarteRang />
      <ol class="chemin">
        {NIVEAUX_CHEMIN.map((n, k) => {
          const ouvert = debloque(k, c.etoiles), et = c.etoiles[n.id] || 0;
          const contenu = (
            <>
              <span class="chemin__num">{ouvert ? k + 1 : <Icone nom="cadenas" taille={18} />}</span>
              <img src={n.image} alt="" loading="lazy" />
              <span class="ligne__corps"><span class="ligne__titre" style="display:block">{n.titre}</span>
                <span class="ligne__desc">{n.sous_titre}</span>
                <span class="chemin__etoiles" aria-label={`${et} étoile${et > 1 ? 's' : ''} sur 3`}>{[1, 2, 3].map((i) => <span class={i <= et ? 'pleine' : ''}>★</span>)}</span></span>
            </>
          );
          return <li class={'chemin__etape' + (k % 2 ? ' chemin__etape--droite' : '')}>
            {ouvert ? <a class="carte chemin__niveau" href={'#/jouer/chemin/' + n.id}>{contenu}</a>
              : <div class="carte chemin__niveau chemin__niveau--ferme" aria-disabled="true">{contenu}</div>}
          </li>;
        })}
      </ol>
      <button class="lien" style="display:block;margin:12px auto" onClick={() => { basculerSons(); setSons(sonsActifs()); }}>{sons ? '🔊 Sons activés' : '🔇 Sons désactivés'}</button>
    </div>
  );
}

// Une partie : questions du niveau, 3 vies, combo, puis résultat.
export function NiveauChemin({ id }) {
  const k = NIVEAUX_CHEMIN.findIndex((n) => n.id === id), n = NIVEAUX_CHEMIN[k];
  const [partie, setPartie] = useState(0);
  if (!n) return <div class="page"><p class="ligne__desc">Niveau introuvable.</p></div>;
  return <Partie key={n.id + '-' + partie} n={n} k={k} rejouer={() => setPartie(partie + 1)} />;
}

function Partie({ n, k, rejouer }) {
  const qs = useMemo(() => melanger(questionsDu(n)), [n.id]);
  const [i, setI] = useState(0);
  const [vies, setVies] = useState(VIES);
  const [xp, setXp] = useState(0);
  const [combo, setCombo] = useState(0);
  const [maxCombo, setMaxCombo] = useState(0);
  const [rep, setRep] = useState(null);       // { juste, choix }
  const [fin, setFin] = useState(null);
  const q = qs[i];
  const ordre = useMemo(() => (q?.type === 'qcm' ? melanger(q.choix.map((_, j) => j)) : [true, false]), [i]);

  function repondre(choix) {
    if (rep) return;
    const juste = q.type === 'vf' ? choix === q.vrai : choix === q.reponse;
    if (juste) {
      const c = combo + 1; setCombo(c); setMaxCombo(Math.max(maxCombo, c));
      setXp(xp + POINTS + (c >= 3 ? BONUS_COMBO : 0)); son('juste');
    } else { setCombo(0); setVies(vies - 1); son('faux'); }
    setRep({ juste, choix });
  }
  async function suivant() {
    const v = vies;
    if (v <= 0 || i === qs.length - 1) {
      const fautes = VIES - v, reussi = v > 0;
      const etoiles = reussi ? Math.max(1, 3 - fautes) : 0;
      const gain = xp + (reussi ? etoiles * BONUS_ETOILE : 0);
      const r = await terminerNiveau(n.id, etoiles, gain, maxCombo);
      const c = chemin.valeur; majChemin(Object.values(c.etoiles).filter((x) => x > 0).length, totalEtoiles(c.etoiles));
      if (reussi) { compter('niveau-reussi', n.id); son(r.nouveauRang ? 'rang' : 'niveau'); }
      setFin({ reussi, etoiles, gain, ...r });
      return;
    }
    setI(i + 1); setRep(null);
  }

  if (fin) {
    const suivantNiveau = NIVEAUX_CHEMIN[k + 1];
    return (
      <div class="page">
        <section class={'carte bloc fin-niveau' + (fin.reussi ? ' fin-niveau--gagne' : '')}>
          {fin.reussi && <div class="confettis" aria-hidden="true">{Array.from({ length: 24 }, (_, j) => <i style={{ left: (j * 4.2) % 100 + '%', animationDelay: (j % 8) * 0.12 + 's', background: ['#E0B324', '#B3242F', '#2E9D5B', '#3A6FD8'][j % 4] }} />)}</div>}
          <p class="fin-niveau__emoji" aria-hidden="true">{fin.reussi ? (fin.etoiles === 3 ? '🏆' : '🎉') : '💪'}</p>
          <h2>{fin.reussi ? (fin.etoiles === 3 ? 'Parfait, sans faute !' : 'Niveau réussi !') : 'Pas cette fois…'}</h2>
          {fin.reussi
            ? <p class="fin-niveau__etoiles">{[1, 2, 3].map((j) => <span class={j <= fin.etoiles ? 'pleine' : ''} style={{ animationDelay: j * 0.25 + 's' }}>★</span>)}</p>
            : <p>Tu as perdu tes 3 vies. Ce n'est pas grave : relis les explications et réessaie, chaque partie te fait grandir.</p>}
          <p class="fin-niveau__xp">+{fin.gain} points</p>
          {fin.nouveauRang && <div class="carte nouveau-rang"><b>Nouveau rang : {fin.nouveauRang.nom} !</b><br />{fin.nouveauRang.desc}</div>}
          {fin.record && <p class="ligne__desc">Nouveau record d'étoiles pour ce niveau !</p>}
          <CarteRang compacte />
          <div class="fin-niveau__actions">
            {fin.reussi && suivantNiveau && <a class="bouton bouton--or" href={'#/jouer/chemin/' + suivantNiveau.id}>Niveau suivant : {suivantNiveau.titre} <Icone nom="chevron" taille={18} /></a>}
            {fin.reussi && !suivantNiveau && <p><b>Tu as terminé tout le chemin. Gloire à Dieu !</b></p>}
            <button class={'bouton ' + (fin.reussi ? 'bouton--contour' : 'bouton--or')} onClick={rejouer}><Icone nom="rejouer" taille={18} /> {fin.reussi && fin.etoiles < 3 ? 'Rejouer pour 3 étoiles' : 'Rejouer'}</button>
            <a class="bouton bouton--contour" href="#/jouer/chemin">Retour au chemin</a>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div class="page partie-chemin">
      <div class="partie-chemin__tete">
        <span class="partie-chemin__vies" aria-label={`${vies} vie${vies > 1 ? 's' : ''}`}>{Array.from({ length: VIES }, (_, j) => <span class={j < vies ? 'vie' : 'vie vie--perdue'}>❤</span>)}</span>
        <span class="partie-chemin__niveau">{n.titre}</span>
        <span class="partie-chemin__xp">{xp} pts</span>
      </div>
      <div class="progression progression--fine"><span style={{ width: ((i + (rep ? 1 : 0)) / qs.length) * 100 + '%' }} /></div>
      {combo >= 3 && <p class="combo" key={combo}>🔥 Combo × {combo} : +{BONUS_COMBO} bonus</p>}
      <p class="quiz__compteur">Question {i + 1} / {qs.length}</p>
      <section class="carte quiz__question"><Icone nom="bible" taille={28} /><h2>{q.type === 'vf' ? 'Vrai ou faux ? ' : ''}{q.question}</h2></section>
      <div class={'quiz__choix' + (q.type === 'vf' ? ' quiz__choix--vf' : '')}>
        {ordre.map((c, j) => {
          const bon = q.type === 'vf' ? c === q.vrai : c === q.reponse;
          const etat = !rep ? '' : bon ? ' choix--bon' : rep.choix === c ? ' choix--faux' : ' choix--eteint';
          return <button class={'carte choix' + etat} disabled={!!rep} onClick={() => repondre(c)}>
            {q.type === 'vf' ? <span>{c ? '👍 Vrai' : '👎 Faux'}</span> : <><span class="choix__lettre">{'ABCD'[j]}</span><span>{q.choix[c]}</span></>}
          </button>;
        })}
      </div>
      {rep && (
        <section class={'carte bloc reponse-chemin ' + (rep.juste ? 'reponse-chemin--juste' : 'reponse-chemin--faux')} role="status">
          <h3>{rep.juste ? (combo >= 3 ? 'Excellent !' : 'Bonne réponse !') : vies > 0 ? 'Oups… une vie en moins' : 'Plus de vies !'}</h3>
          <p>{q.explication}</p>
          <p class="ligne__desc">📖 {refLisible(q.reference)}</p>
          <button class="bouton bouton--or" style="width:100%" onClick={suivant}>{vies <= 0 || i === qs.length - 1 ? 'Voir le résultat' : 'Continuer'} <Icone nom="chevron" taille={18} /></button>
        </section>
      )}
    </div>
  );
}
