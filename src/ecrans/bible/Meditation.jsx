import { useEffect, useState } from 'preact/hooks';
import { get, set } from 'idb-keyval';
import { Icone } from '../../composants/Icone.jsx';
import { notifier } from '../../composants/Notification.jsx';
import { usePassage, TextePassage, CarteVerset } from '../../composants/Verset.jsx';
import { meditationDuJour } from '../../donnees/contenu.js';
import { BarreEcoute, useVoixActive } from '../../composants/Ecouter.jsx';
import { voix } from '../../audio/voix.js';
import { useSignal } from '../../outils/signal.js';
import { ecrireReference } from '../../bible/references.js';
import { partager } from '../../outils/partage.js';
import { compter } from '../../donnees/mesure.js';

const CLE = 'yeshaya:reflexions';
// Les questions de la méditation biblique : on les pose à chaque texte avant de lire le commentaire.
const QUESTIONS = [
  'Qui parle dans ce texte, et à qui ?',
  'Que se passe-t-il ? Quel est le contexte ?',
  'Que m\'apprend ce texte sur Dieu (le Père, Jésus, le Saint-Esprit) ?',
  'Que m\'apprend-il sur moi, sur l\'homme ?',
  'Y a-t-il un ordre à obéir, une promesse à saisir, un péché à éviter, un exemple à suivre ?',
  'Qu\'est-ce que Dieu me dit personnellement aujourd\'hui ?',
  'Que vais-je faire concrètement aujourd\'hui ?',
];

// Écran 19 : méditation du jour, accordée au verset du jour.
export function Meditation() {
  const m = meditationDuJour();
  const etat = usePassage(m.reference);
  const va = useVoixActive(m.id);
  const v = useSignal(voix);
  const [rep, setRep] = useState({});
  const [lire, setLire] = useState(false);
  useEffect(() => { get(CLE).then((t) => { const x = (t || {})[m.id]; if (x?.reponses) setRep(x.reponses); }).catch(() => {}); }, [m.id]);
  const enregistrer = async () => {
    const t = (await get(CLE).catch(() => ({}))) || {};
    t[m.id] = { reponses: rep, date: new Date().toISOString() };
    await set(CLE, t).catch(() => {}); notifier('Méditation enregistrée'); compter('meditation', m.id);
  };
  const d = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const date = d.charAt(0).toUpperCase() + d.slice(1);
  const ouvert = lire || v.id === m.id;
  // Ordre de lecture à voix haute : texte biblique, questions, méditation, défi, verset à mémoriser, prière.
  const iQ = 2, iT = iQ + QUESTIONS.length + 1, iD = iT + m.texte.length, iM = iD + 1, iP = iM + 1;
  const blocs = [{ texte: 'Méditation du jour. ' + m.titre + '.' }, { reference: m.reference },
    { texte: 'Pose-toi ces questions, et prends le temps d\'y répondre.' }, ...QUESTIONS.map((q) => ({ texte: q })),
    ...m.texte.map((t) => ({ texte: t })), { texte: 'Le défi du jour. ' + m.defi }, { texte: 'Le verset à mémoriser.' }, { texte: 'Prière. ' + m.priere }];

  return (
    <div class="page meditation">
      <div class="bandeau-titre">
        <img src="/assets/paysages/lever-soleil-collines.webp" alt="" />
        <div><h2>{m.titre}</h2><p>Méditation du jour · {date}</p></div>
      </div>
      <BarreEcoute id={m.id} titre="Écouter toute la méditation" blocs={blocs} />

      <section class="carte meditation__verset" {...va(1)}>
        <span class="pastille pastille--or"><Icone nom="bible" taille={16} /> 1 · Lis le texte, lentement</span>
        {etat.ref && <h3>{ecrireReference(etat.ref)}</h3>}
        <TextePassage etat={etat} />
        <p class="ligne__desc" style="margin:6px 0 0">Verset du jour : {m.verset}</p>
      </section>

      <section class="carte meditation__bloc">
        <h3 {...va(iQ)}><span class="ligne__icone"><Icone nom="cible" /></span> 2 · Médite avec ces questions</h3>
        <p class="ligne__desc" style="margin-top:0">Relis le texte, puis réponds pour toi-même. Tes réponses restent sur ton téléphone.</p>
        {QUESTIONS.map((q, i) => (
          <div class="meditation__question" {...va(iQ + 1 + i)}>
            <p class="ligne__titre">{i + 1}. {q}</p>
            <textarea class="champ champ--zone" rows={2} value={rep[i] || ''} placeholder="Ma réponse…" onInput={(e) => setRep({ ...rep, [i]: e.currentTarget.value })} />
          </div>
        ))}
        <div class="meditation__question">
          <p class="ligne__titre">Et pour aller plus loin : {m.question}</p>
          <textarea class="champ champ--zone" rows={2} value={rep.q || ''} placeholder="Ma réponse…" onInput={(e) => setRep({ ...rep, q: e.currentTarget.value })} />
        </div>
        <button class="bouton bouton--contour bouton--petit" onClick={enregistrer}><Icone nom="note" taille={16} /> Enregistrer mes réponses</button>
      </section>

      <section class="carte meditation__bloc">
        <h3><span class="ligne__icone"><Icone nom="grandir" /></span> 3 · La méditation</h3>
        {!ouvert ? <button class="bouton bouton--or" style="width:100%" onClick={() => setLire(true)}><Icone nom="bible" taille={18} /> Lire la méditation</button>
          : m.texte.map((t, i) => <p {...va(iT + i)}>{t}</p>)}
      </section>

      <section class="carte meditation__bloc meditation__defi" {...va(iD)}>
        <h3><span class="ligne__icone"><Icone nom="verifie" /></span> 4 · Le défi du jour</h3>
        <p>{m.defi}</p>
      </section>
      <section class="meditation__bloc" {...va(iM)}>
        <h3 style="margin:14px 4px 8px">5 · Le verset à mémoriser</h3>
        <CarteVerset reference={m.memoriser} />
        <a class="lien" href="#/jouer/memoriser" style="display:inline-block;margin:6px 4px 0">M'exercer à le mémoriser</a>
      </section>
      <section class="carte meditation__bloc meditation__priere" {...va(iP)}>
        <h3><span class="ligne__icone"><Icone nom="priere" /></span> 6 · Prière</h3>
        <p><em>{m.priere}</em></p>
      </section>

      <div class="verset__actions" style="justify-content:center;margin-top:12px">
        {etat.texte && <button class="bouton bouton--contour bouton--petit" onClick={() => partager({ titre: m.titre, texte: `${m.titre}\n« ${etat.texte} » — ${ecrireReference(etat.ref)} (LSG)\n\nDéfi du jour : ${m.defi}`, chemin: 'bible/meditation' })}>
          <Icone nom="partager" taille={18} /> Partager</button>}
      </div>
    </div>
  );
}
