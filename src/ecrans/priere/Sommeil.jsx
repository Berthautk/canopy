import { useState, useEffect } from 'preact/hooks';
import { Icone } from '../../composants/Icone.jsx';
import { BarreEcoute, useVoixActive } from '../../composants/Ecouter.jsx';
import { voix, arreterVoix } from '../../audio/voix.js';
import { usePassage } from '../../composants/Verset.jsx';
import { useSignal } from '../../outils/signal.js';
import { compter } from '../../donnees/mesure.js';

// Prière pour s'endormir : la voix lit lentement un psaume et quelques sujets courts, puis se tait toute seule.
const SOIREES = [
  { id: 'paix', titre: 'Je me couche en paix', psaume: 'Ps 4:2-9', sujets: ["Seigneur, merci pour cette journée. Je te remets tout ce que j'ai vécu aujourd'hui, le bon comme le difficile.", "Pardonne-moi pour mes paroles, mes pensées et mes actes qui ne t'ont pas plu aujourd'hui. Lave-moi par le sang de Jésus.", "Je dépose devant toi mes soucis de demain. Tu prends soin de moi.", "Garde ma maison, ma famille et mon sommeil. Que tes anges campent autour de nous cette nuit.", "Je me couche et je m'endors en paix, car toi seul, ô Éternel, tu me donnes la sécurité dans ma demeure. Amen."] },
  { id: 'berger', titre: "L'Éternel est mon berger", psaume: 'Ps 23:1-6', sujets: ["Seigneur, tu es mon berger : je ne manquerai de rien. Je te confie mes besoins.", "Conduis-moi cette nuit près des eaux paisibles. Restaure mon âme fatiguée.", "Même si je marche dans la vallée de l'ombre de la mort, je ne crains aucun mal, car tu es avec moi.", "Je te bénis pour ta bonté et ta grâce qui m'accompagnent tous les jours de ma vie. Amen."] },
  { id: 'abri', titre: "À l'abri du Très-Haut", psaume: 'Ps 91:1-11', sujets: ["Seigneur, je demeure sous ton abri. Tu es mon refuge et ma forteresse.", "Je ne crains ni les terreurs de la nuit, ni les mauvais rêves, ni les attaques de l'ennemi. Je suis couvert par le sang de Jésus.", "Ordonne à tes anges de me garder dans toutes mes voies, cette nuit et demain.", "Je m'endors dans la confiance, sous l'ombre de tes ailes. Amen."] },
  { id: 'garde', titre: 'Celui qui te garde ne sommeille pas', psaume: 'Ps 121:1-8', sujets: ["Seigneur, mon secours vient de toi, qui as fait les cieux et la terre.", "Toi qui me gardes, tu ne sommeilles pas. Je peux dormir, parce que tu veilles.", "Garde mon âme, garde mon corps, garde ma famille, maintenant et à jamais.", "Je remets mon départ et mon arrivée entre tes mains. Amen."] },
];
const MINUTES = [0, 10, 20, 30];

function Psaume({ reference, attr }) {
  const e = usePassage(reference);
  return <div class="sommeil__psaume" {...attr}>{e.versets ? e.versets.map((x) => <p><sup>{x.v}</sup> {x.texte.replace(/\n/g, ' ')}</p>) : <p class="ligne__desc">Chargement…</p>}</div>;
}

export function Sommeil() {
  const [s, setS] = useState(SOIREES[0]);
  const [min, setMin] = useState(20);
  const v = useSignal(voix);
  const id = 'sommeil-' + s.id, va = useVoixActive(id);
  const actif = v.id === id && v.lecture;
  // Minuteur : la voix s'arrête au bout du temps choisi (en plus de l'arrêt naturel à la fin).
  useEffect(() => { if (!actif || !min) return; const t = setTimeout(() => arreterVoix(), min * 60000); return () => clearTimeout(t); }, [actif, min]);
  useEffect(() => { if (actif) compter('sommeil', s.id); }, [actif]);
  const blocs = [{ texte: s.titre + '. Installe-toi, respire calmement, et écoute.' }, { reference: s.psaume }, { texte: 'Prions.' }, ...s.sujets.map((t) => ({ texte: t }))];
  return (
    <div class="page sommeil">
      <div class="sommeil__tete"><Icone nom="lune" taille={36} /><h2>Prier pour s'endormir</h2>
        <p>La voix lit lentement un psaume et une courte prière. Pose ton téléphone, ferme les yeux, et confie ta nuit à Dieu.</p></div>
      <div class="liste">{SOIREES.map((x) => (
        <button class={'carte ligne sommeil__choix' + (x.id === s.id ? ' sommeil__choix--actif' : '')} onClick={() => { arreterVoix(); setS(x); }}>
          <span class="ligne__icone"><Icone nom="lune" /></span><span class="ligne__corps"><span class="ligne__titre">{x.titre}</span></span>
          {x.id === s.id && <Icone nom="verifie" taille={20} />}</button>))}</div>
      <p class="ligne__titre" style="margin:14px 4px 6px">Arrêter la voix après</p>
      <div class="segments" role="group" aria-label="Minuteur">{MINUTES.map((m) => <button aria-pressed={min === m} onClick={() => setMin(m)}>{m ? m + ' min' : 'la fin'}</button>)}</div>
      <BarreEcoute key={id} id={id} blocs={blocs} titre={'Écouter : ' + s.titre} />
      <section class="carte bloc">
        <h3 {...va(0)} style="margin-top:0">{s.titre}</h3>
        <Psaume reference={s.psaume} attr={va(1)} />
        <p class="ligne__titre" {...va(2)}>Prions</p>
        {s.sujets.map((t, k) => <p {...va(3 + k)}><i>{t}</i></p>)}
      </section>
    </div>
  );
}
