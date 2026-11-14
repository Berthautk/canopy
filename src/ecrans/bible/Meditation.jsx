import { useEffect, useState } from 'preact/hooks';
import { get, set } from 'idb-keyval';
import { Icone } from '../../composants/Icone.jsx';
import { notifier } from '../../composants/Notification.jsx';
import { usePassage, TextePassage, cheminMontrer } from '../../composants/Verset.jsx';
import { meditationDuJour, AUDIOS } from '../../donnees/contenu.js';
import { jouer } from '../../audio/lecteur.js';
import { BarreEcoute, useVoixActive } from '../../composants/Ecouter.jsx';
import { ecrireReference } from '../../bible/references.js';
import { partager } from '../../outils/partage.js';

const CLE = 'yeshaya:reflexions';

// Écran 19 : méditation du matin.
export function Meditation() {
  const m = meditationDuJour();
  const etat = usePassage(m.reference);
  const va = useVoixActive(m.id);
  const [reflexion, setReflexion] = useState('');
  const [ouverte, setOuverte] = useState(false);
  useEffect(() => { get(CLE).then((t) => { const x = (t || {})[m.id]; if (x) { setReflexion(x.texte); setOuverte(true); } }).catch(() => {}); }, [m.id]);
  const enregistrer = async () => {
    const t = (await get(CLE).catch(() => ({}))) || {};
    t[m.id] = { texte: reflexion.trim(), date: new Date().toISOString() };
    await set(CLE, t).catch(() => {}); notifier('Réflexion enregistrée');
  };
  const d = new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const date = d.charAt(0).toUpperCase() + d.slice(1);

  return (
    <div class="page meditation">
      <div class="bandeau-titre">
        <img src="/assets/paysages/lever-soleil-collines.webp" alt="" />
        <div><h2>Méditation du matin</h2><p>{date}</p></div>
      </div>

      {!AUDIOS[m.id] && <BarreEcoute id={m.id} titre="Écouter la méditation"
        blocs={[{ texte: 'Méditation du matin. ' + m.titre }, { reference: m.reference }, { texte: m.texte }, { texte: 'Question pour réfléchir. ' + m.question }, { texte: 'Prière. ' + m.priere }]} />}
      <section class="carte meditation__verset" {...va(1)}>
        <span class="pastille pastille--or"><Icone nom="bible" taille={16} /> Lecture du jour</span>
        {etat.ref && <h3>{ecrireReference(etat.ref)}</h3>}
        <TextePassage etat={etat} />
        {etat.ref && <a class="lien" href={'#/' + cheminMontrer(etat.ref)}>Montrer ce verset</a>}
      </section>

      <section class="carte meditation__bloc" {...va(2)}>
        <h3><span class="ligne__icone"><Icone nom="grandir" /></span> {m.titre} {m.exemple && <span class="etiquette-exemple">EXEMPLE</span>}</h3>
        <p>{m.texte}</p>
      </section>
      <section class="carte meditation__bloc" {...va(3)}>
        <h3><span class="ligne__icone"><Icone nom="cible" /></span> Question pour réfléchir</h3>
        <p>{m.question}</p>
      </section>
      <section class="carte meditation__bloc meditation__priere" {...va(4)}>
        <h3><span class="ligne__icone"><Icone nom="priere" /></span> Prière</h3>
        <p><em>{m.priere}</em></p>
      </section>

      <section class="carte meditation__bloc">
        {!ouverte ? (
          <button class="bouton bouton--plein" style="width:100%" onClick={() => setOuverte(true)}><Icone nom="note" taille={18} /> Noter ma réflexion</button>
        ) : (
          <>
            <label class="ligne__titre" for="reflexion">Ma réflexion</label>
            <textarea id="reflexion" class="champ" rows="4" maxLength={1000} value={reflexion} onInput={(e) => setReflexion(e.currentTarget.value)}
              placeholder="Ce que Dieu me dit aujourd'hui…" style="margin-top:8px;padding:10px" />
            <button class="bouton bouton--plein bouton--petit" style="margin-top:8px" onClick={enregistrer}>Enregistrer</button>
          </>
        )}
      </section>

      <div class="verset__actions" style="justify-content:center;margin-top:12px">
        {AUDIOS[m.id] ? <button class="bouton bouton--contour bouton--petit" onClick={() => jouer(AUDIOS[m.id])}><Icone nom="musique" taille={18} /> Écouter</button>
          : <button class="bouton bouton--contour bouton--petit" disabled><Icone nom="musique" taille={18} /> Pas d'audio aujourd'hui</button>}
        {etat.texte && <button class="bouton bouton--contour bouton--petit" onClick={() => partager({ titre: m.titre, texte: `${m.titre}\n« ${etat.texte} » — ${ecrireReference(etat.ref)} (LSG)\n\n${m.question}`, chemin: 'bible/meditation' })}>
          <Icone nom="partager" taille={18} /> Partager</button>}
      </div>
    </div>
  );
}
