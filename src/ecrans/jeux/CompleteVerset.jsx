import { useMessageEchecs } from '../../composants/MessageEchecs.jsx';
import { VoixJeu } from '../../composants/VoixJeu.jsx';
import { useEffect, useState } from 'preact/hooks';
import { Icone } from '../../composants/Icone.jsx';
import { VERSETS_DU_JOUR, SUJETS } from '../../donnees/contenu.js';
import { lireReference, ecrireReference } from '../../bible/references.js';
import { chargerLivre } from '../../bible/bible.js';
import { ajouter, badge } from '../../jeux/stats.js';
import { melanger } from '../../jeux/hasard.js';
import { notifier } from '../../composants/Notification.jsx';
import { BarreEtapes, TitreEtape, FinEtape, etapesOuvertes, reussirEtape, lienBible } from '../../composants/Etapes.jsx';

// Étape n : plus de versets, plus de mots à trouver à partir de l'étape 4, score minimum plus élevé.
const regle = (n) => { const manches = Math.min(5 + n, 12); return { manches, seuil: Math.ceil(manches * Math.min(0.6 + 0.05 * n, 0.9)), bonus: n >= 3 ? 1 : 0 }; };

const VIDES = new Set('alors aussi avant avec cette celui celle ceux cela comme dans donc elle elles entre est été être leur leurs mais même nous nous parce pour quand quoi sans selon sera seront sont sous tous toute toutes vous votre vos était avait point afin dont lorsque contre après depuis encore ainsi chez moins plus très tout'.split(' '));
const mot = (m) => m.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

// Prépare une manche : verset LSG, 1 à 3 mots à trouver, 3 propositions.
async function preparer(refTexte, bonus = 0) {
  const r = lireReference(refTexte); const livre = await chargerLivre(r.code);
  const texte = livre.chapitres[r.c - 1][r.v - 1].replace(/\n/g, ' ');
  const jetons = texte.split(/(\s+)/);
  const candidats = jetons.map((t, i) => ({ t, i, propre: t.replace(/^[«(“]+|[.,;:!?»)”…]+$/g, '') }))
    .filter((x) => x.propre.length >= 5 && /^[\p{L}’'-]+$/u.test(x.propre) && !VIDES.has(mot(x.propre)) && !x.propre.includes('’'));
  if (!candidats.length) return null;
  const n = Math.min(candidats.length, (texte.length > 140 ? 3 : texte.length > 70 ? 2 : 1) + bonus);
  const choisis = melanger(candidats).slice(0, n).sort((a, b) => a.i - b.i);
  // Mots du chapitre pour fabriquer des propositions plausibles
  const reserve = [...new Set(livre.chapitres[r.c - 1].join(' ').split(/\s+/).map((t) => t.replace(/^[«(“]+|[.,;:!?»)”…]+$/g, ''))
    .filter((t) => t.length >= 4 && /^[\p{L}-]+$/u.test(t) && !VIDES.has(mot(t))))];
  const fausse = () => choisis.map((c) => {
    const proches = reserve.filter((w) => mot(w) !== mot(c.propre) && Math.abs(w.length - c.propre.length) <= 2 && (w[0] === w[0].toUpperCase()) === (c.propre[0] === c.propre[0].toUpperCase()));
    return melanger(proches.length ? proches : reserve.filter((w) => mot(w) !== mot(c.propre)))[0] || '…';
  }).join(' – ');
  const juste = choisis.map((c) => c.propre).join(' – ');
  const options = new Set([juste]); let essais = 0;
  while (options.size < 3 && essais++ < 20) options.add(fausse());
  return { ref: r, jetons, trous: new Set(choisis.map((c) => c.i)), propres: Object.fromEntries(choisis.map((c) => [c.i, c.propre])), juste, options: melanger([...options]) };
}

// Écran 30 : complète le verset (texte toujours lu dans la Bible LSG).
export function CompleteVerset() {
  const [echecMsg, voileMsg] = useMessageEchecs(3);
  const [etape, setEtape] = useState(() => etapesOuvertes('complete'));
  const r = regle(etape);
  const tirage = (e = etape) => melanger([...new Set([...VERSETS_DU_JOUR, ...SUJETS.flatMap((s) => s.versets)].filter((x) => !/-/.test(x)))]).slice(0, regle(e).manches);
  const [manches, setManches] = useState(() => tirage());
  const [n, setN] = useState(0), [m, setM] = useState(null), [choix, setChoix] = useState(null), [score, setScore] = useState(0), [erreur, setErreur] = useState(null);
  useEffect(() => { if (n >= manches.length) return; setM(null); setChoix(null); preparer(manches[n], r.bonus).then(setM).catch(() => setErreur('La Bible n\'est pas disponible hors connexion. Téléchargez-la depuis l\'onglet Bible.')); }, [n, manches]);
  if (erreur) return <div class="page"><p class="verset__erreur" style="margin-top:16px">{erreur}</p></div>;
  const lancer = (e) => { setEtape(e); setManches(tirage(e)); setN(0); setScore(0); scrollTo(0, 0); };
  if (n >= manches.length) {
    const reussi = score >= r.seuil; if (reussi) reussirEtape('complete', etape);
    return <FinEtape icone="bible" etape={etape} reussi={reussi} score={`${score} / ${manches.length}`}
      texte={reussi ? 'Apprendre la Parole par cœur, c\'est la garder dans son cœur. L\'étape suivante a plus de versets.' : `Il fallait au moins ${r.seuil} bonnes réponses. Relis les versets et réessaie.`}
      suivante={() => lancer(etape + 1)} rejouer={() => lancer(etape)}
      plusLoin={manches.map((x) => lienBible('Lire ce verset dans son chapitre', x)).filter(Boolean).map((x) => ({ ...x, texte: x.ref, ref: 'Lire ce verset dans son chapitre' }))} />;
  }
  if (!m) return <div class="page"><p class="verset__attente" style="margin-top:16px">Préparation du verset…</p></div>;
  const repondu = choix !== null, juste = choix === m.juste;
  return (
    <div class="page">{voileMsg}
      <VoixJeu cle={`${n}:${repondu ? 'r' : ''}`} blocs={repondu
        ? [{ texte: juste ? 'Bonne réponse !' : 'Pas tout à fait.' }, { texte: m.jetons.map((t, i) => m.trous.has(i) ? m.propres[i] : t).join('') }, { reference: ecrireReference(m.ref) }].slice(0, 2)
        : [{ texte: 'Complète le verset. ' + m.jetons.map((t, i) => m.trous.has(i) ? '…' : t).join('') }, ...m.options.map((o, k) => ({ texte: `Réponse ${k + 1} : ${o}.` }))]} />
      {n === 0 && !repondu && <BarreEtapes jeu="complete" etape={etape} choisir={lancer} />}
      <TitreEtape etape={etape} but={`${manches.length} versets · au moins ${r.seuil} bonnes réponses${r.bonus ? ' · un mot de plus à trouver' : ''}`} />
      <p class="quiz__compteur">Verset {n + 1} / {manches.length} · {score} juste{score > 1 ? 's' : ''}</p>
      <section class="carte complete__verset">
        <p>« {m.jetons.map((t, i) => m.trous.has(i) ? <span class={'trou' + (repondu ? ' trou--rempli' : '')}>{repondu ? m.propres[i] : '______'}</span> : t)} »</p>
        <span class="pastille pastille--ref">{ecrireReference(m.ref)}</span>
      </section>
      <div class="quiz__choix">
        {m.options.map((o) => (
          <button class={'carte choix' + (repondu && o === m.juste ? ' choix--juste' : '') + (repondu && o === choix && !juste ? ' choix--faux' : '')} disabled={repondu}
            onClick={async () => { setChoix(o); if (o !== m.juste) echecMsg(); if (o === m.juste) { setScore(score + 1); const b = await ajouter('complete'); b.forEach((id) => notifier('Badge obtenu : ' + badge(id)[1])); } }}>
            <span>{o}</span>{repondu && o === m.juste && <Icone nom="verifie" taille={20} />}
          </button>
        ))}
      </div>
      {repondu && <button class="bouton bouton--or quiz__suivant" onClick={() => setN(n + 1)}>{n + 1 < manches.length ? 'Verset suivant' : 'Voir mon résultat'} <Icone nom="chevron" taille={18} /></button>}
    </div>
  );
}
