import { useState } from 'preact/hooks';
import { Icone } from '../composants/Icone.jsx';
import { useSignal } from '../outils/signal.js';
import { notifier } from '../composants/Notification.jsx';
import { ACTIVITES, rythme, temps, sauverRythme, bilan, cocher, faitsDuJour, fichierCalendrier } from '../donnees/rythme.js';
import { compter } from '../donnees/mesure.js';

const MOMENTS = [['05:30', 'Tôt le matin'], ['07:00', 'Le matin'], ['12:30', 'À midi'], ['19:00', 'Le soir'], ['21:30', 'Avant de dormir']];
const DUREES = [[10, '10 min'], [20, '20 min'], [30, '30 min'], [60, '1 heure']];
const JOURS = [[1, 'Lun'], [2, 'Mar'], [3, 'Mer'], [4, 'Jeu'], [5, 'Ven'], [6, 'Sam'], [0, 'Dim']];
const TOUS = [0, 1, 2, 3, 4, 5, 6];

// Questions pour construire le rythme : moment préféré et durée pour les activités quotidiennes, jours pour les autres.
const ETAPES = [
  { activite: 'priere', question: 'À quel moment de la journée aimes-tu (ou voudrais-tu) prier ?', defaut: { heure: '05:30', minutes: 20, jours: TOUS } },
  { activite: 'parole', question: 'À quel moment veux-tu lire la Bible ?', defaut: { heure: '07:00', minutes: 20, jours: TOUS } },
  { activite: 'meditation', question: 'Quand veux-tu méditer un verset et l\'écouter parler à ton cœur ?', defaut: { heure: '21:30', minutes: 10, jours: TOUS } },
  { activite: 'enseignement', question: 'Quels jours veux-tu écouter un enseignement ?', defaut: { heure: '19:00', minutes: 30, jours: [3, 6] }, choixJours: true },
  { activite: 'evangelisation', question: 'Quels jours veux-tu prendre un moment pour partager ta foi ou prier pour quelqu\'un qui ne connaît pas Jésus ?', defaut: { heure: '12:30', minutes: 20, jours: [6] }, choixJours: true },
  { activite: 'communion', question: 'Quels jours vas-tu au culte ou dans un groupe de chrétiens ?', defaut: { heure: '09:00', minutes: 120, jours: [0] }, choixJours: true, heureLibre: true },
];

export function Equilibre({ modifier }) {
  const r = useSignal(rythme);
  useSignal(temps);
  if (!r || modifier) return <Questionnaire existant={r} />;
  return <Tableau r={r} />;
}

function Questionnaire({ existant }) {
  const [k, setK] = useState(-1);
  const [rep, setRep] = useState(() => Object.fromEntries(ETAPES.map((e) => {
    const x = existant?.items.find((i) => i.activite === e.activite);
    return [e.activite, x ? { heure: x.heure, minutes: x.minutes, jours: x.jours, actif: true } : { ...e.defaut, actif: true }];
  })));
  if (k < 0) return (
    <div class="page">
      <section class="carte bloc" style="margin-top:12px">
        <h2 style="margin-top:0">Mon rythme avec Dieu</h2>
        <p>Une vie chrétienne solide s'appuie sur des habitudes régulières : la prière, la Parole, la méditation, l'enseignement, le partage de la foi et la communion avec les frères.</p>
        <p>Réponds à 6 questions simples. L'application te proposera un emploi du temps, pourra l'ajouter à l'agenda de ton téléphone pour te rappeler chaque moment, et te montrera ton équilibre au fil des semaines.</p>
        <p class="ligne__desc">Tes réponses restent sur ton téléphone.</p>
        <button class="bouton bouton--plein" style="width:100%" onClick={() => setK(0)}>Commencer</button>
      </section>
    </div>
  );
  if (k >= ETAPES.length) {
    const items = ETAPES.filter((e) => rep[e.activite].actif && rep[e.activite].jours.length).map((e) => ({ id: e.activite, activite: e.activite, ...rep[e.activite] }));
    return (
      <div class="page">
        <h2 class="titre-section">Ton emploi du temps</h2>
        <div class="liste">{items.map((it) => <LigneItem it={it} />)}</div>
        <button class="bouton bouton--plein" style="width:100%;margin-top:14px" onClick={() => { sauverRythme({ items, cree: new Date().toISOString() }); compter('rythme-cree'); location.hash = '#/equilibre'; }}>
          <Icone nom="verifie" taille={20} /> Valider mon rythme</button>
        <button class="bouton bouton--contour" style="width:100%;margin-top:8px" onClick={() => setK(0)}>Revoir mes réponses</button>
      </div>
    );
  }
  const e = ETAPES[k], v = rep[e.activite], a = ACTIVITES[e.activite];
  const maj = (c) => setRep({ ...rep, [e.activite]: { ...v, ...c } });
  return (
    <div class="page">
      <p class="quiz__compteur" style="margin-top:12px">Question {k + 1} / {ETAPES.length}</p>
      <div class="progression progression--fine"><span style={{ width: ((k + 1) / ETAPES.length) * 100 + '%' }} /></div>
      <section class="carte bloc questionnaire">
        <h3><span class="ligne__icone"><Icone nom={a.icone} /></span> {a.nom}</h3>
        <p><b>{e.question}</b></p>
        {e.choixJours && <div class="puces">{JOURS.map(([j, l]) => <button aria-pressed={v.jours.includes(j)} onClick={() => maj({ jours: v.jours.includes(j) ? v.jours.filter((x) => x !== j) : [...v.jours, j] })}>{l}</button>)}</div>}
        <p class="etiquette-champ">Moment</p>
        {e.heureLibre
          ? <input class="champ" type="time" value={v.heure} onInput={(ev) => maj({ heure: ev.currentTarget.value })} />
          : <div class="puces">{MOMENTS.map(([h, l]) => <button aria-pressed={v.heure === h} onClick={() => maj({ heure: h })}>{l}</button>)}</div>}
        <p class="etiquette-champ">Durée</p>
        <div class="puces">{(e.activite === 'communion' ? [[60, '1 h'], [90, '1 h 30'], [120, '2 h'], [180, '3 h']] : DUREES).map(([m, l]) => <button aria-pressed={v.minutes === m} onClick={() => maj({ minutes: m })}>{l}</button>)}</div>
        <p class="ligne__desc" style="margin-top:12px">{a.conseil}</p>
      </section>
      <div class="fin-niveau__actions">
        <button class="bouton bouton--plein" onClick={() => setK(k + 1)}>Suivant <Icone nom="chevron" taille={18} /></button>
        <button class="bouton bouton--contour" onClick={() => { maj({ actif: false }); setK(k + 1); }}>Pas pour l'instant</button>
      </div>
    </div>
  );
}

const nomsJours = (js) => js.length === 7 ? 'Tous les jours' : JOURS.filter(([j]) => js.includes(j)).map(([, l]) => l).join(', ');
function LigneItem({ it, fait, surFait }) {
  const a = ACTIVITES[it.activite];
  return (
    <div class={'carte ligne' + (fait ? ' ligne--faite' : '')}>
      <span class="ligne__icone"><Icone nom={a.icone} /></span>
      <span class="ligne__corps"><span class="ligne__titre" style="display:block">{a.nom} · {it.minutes} min</span>
        <span class="ligne__desc">{it.heure.replace(':', ' h ')} · {nomsJours(it.jours)}</span></span>
      {surFait && (fait ? <span class="ligne__fin" style="color:#2e9d5b"><Icone nom="verifie" /></span>
        : <button class="bouton bouton--petit bouton--contour" onClick={surFait}>Fait</button>)}
    </div>
  );
}

function Tableau({ r }) {
  const [faits, setFaits] = useState(faitsDuJour());
  const auj = new Date().getDay();
  const duJour = r.items.filter((it) => it.jours.includes(auj)).sort((a, b) => a.heure.localeCompare(b.heure));
  const semaine = bilan(7);
  const actives = Object.keys(ACTIVITES).filter((k) => semaine[k].objectif > 0);
  const pct = (b) => (b.objectif ? Math.min(100, Math.round((b.minutes / b.objectif) * 100)) : 0);
  const historique = actives.map((k) => ({ k, points: [5, 4, 3, 2, 1, 0].map((s) => { const f = new Date(); f.setDate(f.getDate() - s * 7); return pct(bilan(7, f)[k]); }) }));
  const tri = [...actives].sort((a, b) => pct(semaine[a]) - pct(semaine[b]));
  const faible = tri[0], fort = tri[tri.length - 1];

  function telecharger() {
    const blob = new Blob([fichierCalendrier(r)], { type: 'text/calendar' });
    const u = URL.createObjectURL(blob), lien = document.createElement('a');
    lien.href = u; lien.download = 'yeshaya-mon-rythme.ics'; document.body.appendChild(lien); lien.click(); lien.remove();
    setTimeout(() => URL.revokeObjectURL(u), 5000); compter('rythme-calendrier');
    notifier('Ouvre le fichier pour ajouter les rappels à ton agenda.');
  }

  return (
    <div class="page">
      <h2 class="titre-section">Aujourd'hui</h2>
      <div class="liste">
        {duJour.map((it) => <LigneItem it={it} fait={faits.includes(it.id)} surFait={() => { cocher(it); setFaits(faitsDuJour()); notifier('Bravo ! Que Dieu te bénisse.'); }} />)}
        {!duJour.length && <p class="ligne__desc">Rien de prévu aujourd'hui : profite pour te reposer en Dieu.</p>}
      </div>
      <p class="ligne__desc" style="margin:6px 4px">Le temps passé dans l'application (prière, Bible, enseignements, évangélisation) est compté automatiquement. Appuie sur « Fait » pour ce que tu as vécu ailleurs.</p>

      <h2 class="titre-section">Mon équilibre cette semaine</h2>
      <section class="carte bloc equilibre">
        {actives.map((k) => {
          const b = semaine[k], p = pct(b);
          return (
            <div class="equilibre__ligne" title={`${ACTIVITES[k].nom} : ${Math.round(b.minutes)} min sur ${b.objectif} min prévues (${p} %)`}>
              <span class="equilibre__nom">{ACTIVITES[k].nom}</span>
              <span class="equilibre__barre"><i style={{ width: Math.max(p, 2) + '%' }} /></span>
              <span class="equilibre__val">{p} %</span>
            </div>
          );
        })}
        <p class="ligne__desc" style="margin-top:8px">Pourcentage de ton objectif atteint sur les 7 derniers jours.</p>
      </section>
      {faible && fort && faible !== fort && (
        <section class="carte bloc conseil-equilibre">
          <h3><span class="ligne__icone"><Icone nom="ampoule" /></span> Conseil</h3>
          {pct(semaine[fort]) > 0 && <p>Bravo pour <b>{ACTIVITES[fort].nom.toLowerCase()}</b> : continue ainsi !</p>}
          <p>Ce qui demande le plus d'attention cette semaine : <b>{ACTIVITES[faible].nom.toLowerCase()}</b>. {ACTIVITES[faible].conseil}</p>
        </section>
      )}

      <h2 class="titre-section">Évolution sur 6 semaines</h2>
      <section class="carte bloc">
        <div class="courbes">
          {historique.map(({ k, points }) => (
            <figure class="courbe">
              <svg viewBox="0 0 120 48" role="img" aria-label={`${ACTIVITES[k].nom} : ${points.join(' %, ')} %`}>
                <line x1="0" y1="44" x2="120" y2="44" class="courbe__axe" />
                <polyline points={points.map((v, i) => `${i * 24},${44 - v * 0.4}`).join(' ')} class="courbe__ligne" />
                {points.map((v, i) => <circle cx={i * 24} cy={44 - v * 0.4} r="3" class="courbe__point"><title>{`Il y a ${5 - i} semaine(s) : ${v} %`}</title></circle>)}
              </svg>
              <figcaption>{ACTIVITES[k].nom} <b>{points[5]} %</b></figcaption>
            </figure>
          ))}
        </div>
      </section>

      <h2 class="titre-section">Mon emploi du temps</h2>
      <div class="liste">{r.items.map((it) => <LigneItem it={it} />)}</div>
      <button class="bouton bouton--plein" style="width:100%;margin-top:12px" onClick={telecharger}><Icone nom="calendrier" taille={20} /> Ajouter les rappels à mon agenda</button>
      <p class="ligne__desc" style="margin:6px 4px">Un fichier d'agenda est créé : ouvre-le avec l'application Agenda ou Calendrier de ton téléphone pour recevoir une notification à chaque moment prévu.</p>
      <a class="bouton bouton--contour" href="#/equilibre/modifier" style="width:100%;margin-top:8px">Modifier mon rythme</a>
      <a class="carte ligne" href="#/disciple" style="margin-top:12px"><span class="ligne__icone"><Icone nom="grandir" /></span>
        <span class="ligne__corps"><span class="ligne__titre" style="display:block">Mes outils de disciple</span><span class="ligne__desc">Défis de 21 jours, verset de la semaine, ma liste des 5</span></span><Icone nom="chevron" taille={20} /></a>
    </div>
  );
}
