import { useState, useEffect, useMemo } from 'preact/hooks';
import { Icone } from '../../composants/Icone.jsx';
import { usePassage } from '../../composants/Verset.jsx';
import { lireAVoixHaute, arreterVoix, voix } from '../../audio/voix.js';
import { VERSETS_DU_JOUR, SUJETS, versetDuJour } from '../../donnees/contenu.js';
import { annotations } from '../../donnees/annotations.js';
import { PAR_CODE, ecrireReference } from '../../bible/references.js';
import { notifier } from '../../composants/Notification.jsx';
import { son } from '../../jeux/chemin.js';
import { compter } from '../../donnees/mesure.js';
import { generateur, melanger } from '../../jeux/hasard.js';

// Mémoriser un verset : on l'écoute, on le lit, puis les mots disparaissent peu à peu ;
// à la fin, on le reconstitue mot par mot.
const NIVEAUX = [0, 0.25, 0.5, 0.75, 1];
const CLE = 'yeshaya:versets-memorises';
const lireAppris = () => { try { return JSON.parse(localStorage.getItem(CLE) || '[]'); } catch { return []; } };

export function Memoriser() {
  const favoris = Object.entries(useMemo(() => annotations.valeur, [])).filter(([, a]) => a.favori).map(([k]) => { const [c, ch, v] = k.split('.'); return PAR_CODE[c] ? ecrireReference({ code: c, c: +ch, v: +v }) : null; }).filter(Boolean);
  const choix = [...new Set([versetDuJour(new Date()), ...favoris.slice(0, 6), ...SUJETS.flatMap((s) => s.versets.slice(0, 1)), ...VERSETS_DU_JOUR.slice(0, 10)])].filter(Boolean);
  const [ref, setRef] = useState(null);
  const appris = lireAppris();
  if (ref) return <Exercice reference={ref} retour={() => setRef(null)} />;
  return (
    <div class="page">
      <div class="chemin-hero"><h2>Mémoriser un verset</h2><p>Écoute, lis, puis les mots disparaissent un à un. Cache la Parole dans ton cœur (Psaume 119:11).</p></div>
      {appris.length > 0 && <p class="carte bloc" style="text-align:center">📖 Tu as déjà mémorisé <b>{appris.length}</b> verset{appris.length > 1 ? 's' : ''}.</p>}
      <h2 class="titre-section">Choisis un verset</h2>
      <div class="liste">{choix.map((r) => <button class="carte ligne" style="width:100%;text-align:left" onClick={() => setRef(r)}>
        <span class="ligne__icone"><Icone nom={appris.includes(r) ? 'verifie' : 'bible'} /></span><span class="ligne__corps"><span class="ligne__titre">{r}</span>
          {favoris.includes(r) && <span class="ligne__desc" style="display:block">Dans mes favoris</span>}</span><Icone nom="chevron" taille={20} /></button>)}</div>
      <p class="ligne__desc" style="margin:10px 4px">Astuce : les versets que tu mets en favori dans la Bible apparaissent ici.</p>
    </div>
  );
}

function Exercice({ reference, retour }) {
  const e = usePassage(reference);
  const [niv, setNiv] = useState(0);
  const texte = e.texte || '';
  const mots = texte.split(/\s+/).filter(Boolean);
  const alea = useMemo(() => generateur(reference), [reference]);
  const ordreCache = useMemo(() => melanger(mots.map((_, i) => i), alea), [texte]);
  useEffect(() => () => arreterVoix(), []);
  if (!e.texte) return <div class="page"><p class="verset__attente" style="margin-top:16px">{e.erreur || 'Chargement…'}</p></div>;
  const ref = ecrireReference(e.ref);
  if (niv >= NIVEAUX.length) return <Reconstituer mots={mots} reference={ref} retour={retour} />;
  const caches = new Set(ordreCache.slice(0, Math.round(mots.length * NIVEAUX[niv])));
  return (
    <div class="page">
      <p class="quiz__compteur">Étape {niv + 1} sur {NIVEAUX.length + 1}</p>
      <div class="progression progression--fine"><span style={{ width: (niv / (NIVEAUX.length + 1)) * 100 + '%' }} /></div>
      <section class="carte bloc memoriser__verset">
        <p>{mots.map((m, i) => caches.has(i) ? <span class="memoriser__trou">{m.replace(/[^\s,.;:!?«»]/g, '_')}</span> : <span>{m}</span>).reduce((a, b) => [a, ' ', b])}</p>
        <p class="ligne__desc" style="text-align:right">{ref}</p>
      </section>
      <p class="ligne__desc" style="text-align:center">{niv === 0 ? 'Lis le verset à voix haute deux ou trois fois.' : 'Dis le verset à voix haute en complétant les mots cachés.'}</p>
      {voix.valeur.disponible && <button class="bouton bouton--contour" style="width:100%;margin-top:8px" onClick={() => lireAVoixHaute('memo', [{ texte: `${ref}. ${texte}` }])}><Icone nom="lecture" taille={18} /> Écouter le verset</button>}
      <button class="bouton bouton--or" style="width:100%;margin-top:10px" onClick={() => setNiv(niv + 1)}>{niv < NIVEAUX.length - 1 ? 'Cacher plus de mots' : 'Je le connais : vérifier'} <Icone nom="chevron" taille={18} /></button>
      <button class="lien" style="display:block;margin:12px auto" onClick={retour}>Choisir un autre verset</button>
    </div>
  );
}

// Dernière étape : remettre les mots dans l'ordre (mots proposés en désordre, par paquets).
function Reconstituer({ mots, reference, retour }) {
  const [i, setI] = useState(0), [fautes, setFautes] = useState(0);
  const propositions = useMemo(() => melanger([...new Set([mots[i], ...melanger(mots.filter((m) => m !== mots[i])).slice(0, 3)])]), [i]);
  if (i >= mots.length) {
    const l = lireAppris(); if (!l.includes(reference)) { try { localStorage.setItem(CLE, JSON.stringify([...l, reference])); } catch {} compter('verset-memorise', reference); }
    return <div class="page"><section class="carte bloc fin-niveau fin-niveau--gagne"><p class="fin-niveau__emoji">🏆</p><h2>{fautes === 0 ? 'Parfait, sans faute !' : 'Verset mémorisé !'}</h2>
      <p>« {mots.join(' ')} »</p><p class="ligne__desc">{reference}</p>
      <div class="fin-niveau__actions"><button class="bouton bouton--or" onClick={retour}>Mémoriser un autre verset</button></div></section></div>;
  }
  return (
    <div class="page">
      <p class="quiz__compteur">Reconstitue le verset · mot {i + 1} sur {mots.length}</p>
      <section class="carte bloc memoriser__verset"><p>{mots.slice(0, i).join(' ')} <span class="memoriser__curseur">…</span></p><p class="ligne__desc" style="text-align:right">{reference}</p></section>
      <div class="quiz__choix">{propositions.map((m) => <button class="carte choix" onClick={() => { if (m === mots[i]) { son('juste'); setI(i + 1); } else { son('faux'); setFautes(fautes + 1); notifier('Pas ce mot-là, essaie encore'); } }}><span>{m}</span></button>)}</div>
    </div>
  );
}
