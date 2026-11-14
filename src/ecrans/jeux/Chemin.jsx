import { useMemo, useState, useEffect } from 'preact/hooks';
import { genererEtape, genererDefi, infoEtape, estEtape, numeroEtape, PREMIERE_ETAPE } from '../../jeux/generateur.js';
import { aujourdhui } from '../../jeux/hasard.js';
import { route } from '../../outils/routeur.js';
import { partager } from '../../outils/partage.js';
import { profil } from '../../donnees/profil.js';
import { lireAVoixHaute, arreterVoix, voix } from '../../audio/voix.js';
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
        <span class="rang-carte__badge" aria-hidden="true">{['🌱', '🕊️', '🪔', '🛡️', '📜', '👑', '📖', '🧱', '🌾', '🏛️', '🏆'][r.i]}</span>
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
      <h2 class="titre-section">Les étapes sans fin</h2>
      <p class="ligne__desc" style="margin:-4px 4px 8px">Après les niveaux du chemin, les étapes continuent sans fin : chaque étape a un thème, des versets à compléter et des livres à retrouver. Il y a toujours une étape suivante !</p>
      <ol class="chemin">
        {(() => { let max = PREMIERE_ETAPE; while (c.etoiles['etape-' + max]) max++; const l = []; for (let num = PREMIERE_ETAPE; num <= max + 2; num++) l.push(num); return l; })().map((num, k) => {
          const e = infoEtape(num), prec = num === PREMIERE_ETAPE ? NIVEAUX_CHEMIN[NIVEAUX_CHEMIN.length - 1].id : 'etape-' + (num - 1);
          const ouvert = (c.etoiles[prec] || 0) > 0, et = c.etoiles[e.id] || 0;
          const contenu = <><span class="chemin__num">{ouvert ? num : <Icone nom="cadenas" taille={18} />}</span><img src={e.image} alt="" loading="lazy" />
            <span class="ligne__corps"><span class="ligne__titre" style="display:block">{e.titre}</span><span class="ligne__desc">{e.sous_titre}</span>
              <span class="chemin__etoiles">{[1, 2, 3].map((i) => <span class={i <= et ? 'pleine' : ''}>★</span>)}</span></span></>;
          return <li class={'chemin__etape' + (k % 2 ? ' chemin__etape--droite' : '')}>{ouvert ? <a class="carte chemin__niveau" href={'#/jouer/chemin/' + e.id}>{contenu}</a> : <div class="carte chemin__niveau chemin__niveau--ferme" aria-disabled="true">{contenu}</div>}</li>;
        })}
      </ol>
      <p class="ligne__desc" style="text-align:center">… et encore des centaines d'étapes après celles-ci.</p>
      <button class="lien" style="display:block;margin:12px auto" onClick={() => { basculerSons(); setSons(sonsActifs()); }}>{sons ? '🔊 Sons activés' : '🔇 Sons désactivés'}</button>
    </div>
  );
}

// Une partie : questions du niveau, 3 vies, combo, puis résultat.
export function NiveauChemin({ id }) {
  const [partie, setPartie] = useState(0);
  const [gen, setGen] = useState(null);
  useEffect(() => { if (!estEtape(id)) return; setGen(null); genererEtape(numeroEtape(id)).then(setGen).catch(() => setGen({ erreur: true })); }, [id]);
  if (estEtape(id)) {
    if (!gen) return <div class="page"><p class="verset__attente" style="margin-top:16px">Préparation de l'étape…</p></div>;
    if (gen.erreur) return <div class="page"><p class="verset__erreur" style="margin-top:16px">Pour jouer aux étapes sans fin, la Bible doit être sur ce téléphone : connectez-vous une fois, ou téléchargez-la dans l'onglet Bible.</p></div>;
    return <Partie key={id + '-' + partie} n={gen} k={-1} rejouer={() => setPartie(partie + 1)} />;
  }
  const k = NIVEAUX_CHEMIN.findIndex((n) => n.id === id), n = NIVEAUX_CHEMIN[k];
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
  const [quitter, setQuitter] = useState(false);
  const p = route.valeur.params, defi = p.defi ? { score: +p.defi, nom: p.nom } : null;
  const q = qs[i];
  useEffect(() => () => arreterVoix(), []);
  const ecouterQ = () => lireAVoixHaute('jeu-q', [{ texte: (q.type === 'vf' ? 'Vrai ou faux ? ' : '') + q.question }, ...(q.type === 'qcm' ? ordre.map((c, j) => ({ texte: `Réponse ${'ABCD'[j]} : ${q.choix[c]}.` })) : [])]);
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
    const suivantNiveau = k === -2 ? null : k >= 0 ? (NIVEAUX_CHEMIN[k + 1] || infoEtape(PREMIERE_ETAPE)) : infoEtape(n.num + 1);
    const jDefi = k === -2 ? serie(chemin.valeur.jours) : 0;
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
          {defi && <p class="carte bloc" style="margin:8px 0">⚔️ {defi.nom || 'Ton ami'} avait fait <b>{defi.score} points</b>. {fin.gain > defi.score ? 'Tu as gagné le duel ! 🎉' : fin.gain === defi.score ? 'Égalité !' : 'Il te bat cette fois… revanche ?'}</p>}
          {(k < 0) && <button class="bouton bouton--contour" style="width:100%;margin:6px 0" onClick={() => partager({ titre: 'Défi Yeshaya', texte: `${profil.valeur.prenom || 'Un ami'} te défie sur « ${n.titre} » : ${fin.gain} points. Fais mieux si tu peux !`, chemin: `jouer/${k === -2 ? 'defi' : 'chemin/' + n.id}?${k === -2 ? 'jour=' + n.id.slice(5) + '&' : ''}defi=${fin.gain}&nom=${encodeURIComponent(profil.valeur.prenom || '')}` })}>⚔️ Défier un ami sur cette étape</button>}
          {k === -2 && <p class="carte bloc" style="margin:8px 0">🔥 {jDefi > 1 ? `${jDefi} jours de suite ! Reviens demain pour le prochain défi.` : 'Reviens demain pour un nouveau défi !'} <span class="ligne__desc" style="display:block">Si tu manques un jour, ce n'est pas grave : ta série recommence, simplement.</span></p>}
          {fin.nouveauRang && <div class="carte nouveau-rang"><b>Nouveau rang : {fin.nouveauRang.nom} !</b><br />{fin.nouveauRang.desc}</div>}
          {fin.record && <p class="ligne__desc">Nouveau record d'étoiles pour ce niveau !</p>}
          <CarteRang compacte />
          <div class="fin-niveau__actions">
            {fin.reussi && suivantNiveau && <a class="bouton bouton--or" href={'#/jouer/chemin/' + suivantNiveau.id}>Niveau suivant : {suivantNiveau.titre} <Icone nom="chevron" taille={18} /></a>}
            <button class={'bouton ' + (fin.reussi ? 'bouton--contour' : 'bouton--or')} onClick={rejouer}><Icone nom="rejouer" taille={18} /> {fin.reussi && fin.etoiles < 3 ? 'Rejouer pour 3 étoiles' : 'Rejouer'}</button>
            {!quitter ? <button class="bouton bouton--contour" onClick={() => setQuitter(true)}>Retour au chemin</button> : (
              <div class="carte bloc ne-pars-pas">
                <p><b>Tu pars déjà ? 🙂</b> {fin.reussi ? 'Tu es lancé : encore une étape, et tu te rapproches du rang suivant !' : 'Une petite revanche ? Tu vas y arriver !'}</p>
                <div class="fin-niveau__actions">
                  {fin.reussi && suivantNiveau ? <a class="bouton bouton--or" href={'#/jouer/chemin/' + suivantNiveau.id}>Encore une étape !</a> : <button class="bouton bouton--or" onClick={rejouer}>Je rejoue !</button>}
                  <a class="bouton bouton--contour" href="#/jouer/chemin">À bientôt ! Je reviens demain</a>
                </div>
              </div>)}
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
      {defi && i === 0 && !rep && <p class="guide-phase" style="margin:8px 0"><span>⚔️ {defi.nom || 'Un ami'} t'a défié : il a fait {defi.score} points sur cette étape. À toi de jouer !</span></p>}
      {combo >= 3 && <p class="combo" key={combo}>🔥 Combo × {combo} : +{BONUS_COMBO} bonus</p>}
      <p class="quiz__compteur">Question {i + 1} / {qs.length}</p>
      <section class="carte quiz__question"><Icone nom="bible" taille={28} /><h2>{q.type === 'vf' ? 'Vrai ou faux ? ' : ''}{q.question}</h2>
        {voix.valeur.disponible && <button class="bouton bouton--contour bouton--petit" style="margin-top:8px" onClick={ecouterQ}><Icone nom="lecture" taille={16} /> Écouter la question</button>}</section>
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

// Défi biblique du jour : 10 questions nouvelles chaque jour, avec une série douce (aucune pénalité si on manque un jour).
export function DefiDuJour() {
  const j = route.valeur.params.jour || aujourdhui();   // un défi reçu par lien garde les questions du jour où il a été lancé
  const [d, setD] = useState(null);
  const [partie, setPartie] = useState(0);
  useEffect(() => { genererDefi(j).then(setD).catch(() => setD({ erreur: true })); }, [j]);
  if (!d) return <div class="page"><p class="verset__attente" style="margin-top:16px">Préparation du défi du jour…</p></div>;
  if (d.erreur) return <div class="page"><p class="verset__erreur" style="margin-top:16px">Pour le défi du jour, la Bible doit être sur ce téléphone : connectez-vous une fois, ou téléchargez-la dans l'onglet Bible.</p></div>;
  const deja = (chemin.valeur.etoiles[d.id] || 0) > 0;
  return <>
    {deja && partie === 0 && <div class="page"><p class="guide-phase" style="margin-top:12px"><Icone nom="verifie" taille={18} /><span>Tu as déjà relevé le défi d'aujourd'hui. Tu peux rejouer pour faire mieux ; un nouveau défi arrive demain.</span></p></div>}
    <Partie key={d.id + '-' + partie} n={{ ...d, num: undefined }} k={-2} rejouer={() => setPartie(partie + 1)} />
  </>;
}
