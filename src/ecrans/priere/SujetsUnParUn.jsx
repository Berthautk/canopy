import { useEffect, useRef, useState } from 'preact/hooks';
import { Icone } from '../../composants/Icone.jsx';
import { TexteRefs } from '../../composants/TexteRefs.jsx';
import { voix, lireAVoixHaute, arreterVoix } from '../../audio/voix.js';
import { useSignal } from '../../outils/signal.js';

// Une seule consigne de prière à la fois : « 1 / 3 », flèches pour aller et revenir.
// Écoute guidée : la voix dit UN sujet, puis se tait le temps que la personne prie,
// puis passe au suivant. « À mon rythme » : la voix dit le sujet et attend la flèche.
const PAUSES = [{ s: 0, t: 'À mon rythme' }, { s: 30, t: '30 s' }, { s: 60, t: '1 min' }, { s: 120, t: '2 min' }];
const lireChoix = () => { try { const n = parseInt(localStorage.getItem('yeshaya:pause-priere') || '60', 10); return PAUSES.some((p) => p.s === n) ? n : 60; } catch { return 60; } };
const phraseSujet = (s) => `${s.titre ? s.titre + '. ' : ''}${s.texte}`;

export function SujetsUnParUn({ sujets, voixId, intro, faits, setFaits, fin }) {
  const [k, setK] = useState(0);
  const [pause, setPause] = useState(lireChoix);
  const [mode, setMode] = useState('off');            // off | dit | prie
  const [reste, setReste] = useState(0);
  const v = useSignal(voix);
  const kRef = useRef(0); kRef.current = k;
  const total = sujets.length, s = sujets[k];
  const idLecture = (i) => `${voixId}-g${i}`;
  const cocher = (i) => setFaits({ ...faits, [i]: true });

  const aller = (i, coche = true) => {
    if (i < 0 || i >= total) return;
    if (coche && i > k) cocher(k);
    setK(i);
  };
  const dire = (i, avecIntro) => {
    setMode('dit');
    lireAVoixHaute(idLecture(i), [...(avecIntro && intro ? [{ texte: intro }] : []), { texte: phraseSujet(sujets[i]) }]);
  };
  const arreter = () => { setMode('off'); setReste(0); arreterVoix(); };
  const choisir = (n) => { setPause(n); try { localStorage.setItem('yeshaya:pause-priere', String(n)); } catch {} };

  // La voix a fini de dire le sujet : temps de prière, puis on passe au suivant.
  useEffect(() => {
    if (mode !== 'dit' || v.id !== idLecture(kRef.current) || !v.termine) return;
    if (pause === 0) { setMode('off'); return; }
    setMode('prie'); setReste(pause);
  }, [mode, v.termine, v.id]);
  useEffect(() => {
    if (mode !== 'prie') return;
    if (reste <= 0) {
      const i = kRef.current; cocher(i);
      if (i + 1 < total) { setK(i + 1); dire(i + 1, false); } else setMode('off');
      return;
    }
    const t = setTimeout(() => setReste(reste - 1), 1000);
    return () => clearTimeout(t);
  }, [mode, reste]);
  useEffect(() => () => { if (voix.valeur.id?.startsWith(voixId + '-g')) arreterVoix(); }, [voixId]);

  const enCours = mode !== 'off';
  return (
    <div class="un-par-un">
      <div class={'carte un-par-un__carte' + (faits[k] ? ' un-par-un__carte--fait' : '')} key={k}
        data-voix={0} data-voix-actif={mode === 'dit' && v.id === idLecture(k) ? 'oui' : undefined}>
        <span class="un-par-un__compte" aria-label={`Sujet ${k + 1} sur ${total}`}>{k + 1} / {total}</span>
        {s.titre && <h4>{s.titre}</h4>}
        <p><TexteRefs texte={s.texte} /></p>
        {mode === 'prie' && <p class="un-par-un__pause"><Icone nom="priere" taille={16} /> Prie maintenant, à ton rythme… <b>{reste} s</b>
          <button class="lien" onClick={() => setReste(0)}>J'ai fini</button></p>}
      </div>
      <div class="un-par-un__nav">
        <button class="rond" onClick={() => { arreter(); aller(k - 1, false); }} disabled={k === 0} aria-label="Sujet précédent"><Icone nom="precedent" taille={22} /></button>
        <span class="un-par-un__points" aria-hidden="true">{sujets.map((_, i) => <i class={(i === k ? 'actif ' : '') + (faits[i] ? 'fait' : '')} />)}</span>
        <button class="rond" onClick={() => { arreter(); aller(k + 1); }} disabled={k === total - 1} aria-label="Sujet suivant"><Icone nom="chevron" taille={22} /></button>
      </div>
      {v.disponible && (
        <section class="carte un-par-un__ecoute">
          {!enCours
            ? <button class="barre-ecoute__lancer" onClick={() => dire(k, k === 0)}>
                <span class="btn-lecture" style="width:44px;height:44px"><Icone nom="lecture" taille={20} /></span>
                <span class="ligne__corps"><span class="ligne__titre" style="display:block">Écouter et prier avec la voix</span>
                  <span class="ligne__desc">La voix dit le sujet, puis se tait pour te laisser prier.</span></span></button>
            : <button class="bouton bouton--contour" onClick={arreter}><Icone nom="pause" taille={18} /> Arrêter l'écoute</button>}
          <p class="un-par-un__etiq">Temps de prière après chaque sujet :</p>
          <div class="chips" role="radiogroup">{PAUSES.map((p) => <button role="radio" aria-checked={pause === p.s} class={'chip' + (pause === p.s ? ' chip--actif' : '')} onClick={() => choisir(p.s)}>{p.t}</button>)}</div>
        </section>
      )}
    </div>
  );
}
