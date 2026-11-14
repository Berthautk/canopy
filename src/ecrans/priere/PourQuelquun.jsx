import { useState, useEffect } from 'preact/hooks';
import { Icone } from '../../composants/Icone.jsx';
import { TexteRefs } from '../../composants/TexteRefs.jsx';
import { PriereGuidee } from '../../composants/PriereGuidee.jsx';
import { notifier } from '../../composants/Notification.jsx';
import { POUR_QUELQUUN, chargerProgramme } from '../../donnees/contenu.js';
import { pq, configurer, adapter, faitsDe, jourCourantPQ, etatJourPQ, terminerJourPQ, debutCycleBloque } from '../../donnees/pourQuelquun.js';
import { noterPriere } from '../../donnees/priere.js';
import { compter } from '../../donnees/mesure.js';
import { useSignal } from '../../outils/signal.js';

const I = POUR_QUELQUUN;
// « PARLER À DIEU : s'approcher » -> « Parler à Dieu : s'approcher »
const casse = (t) => t.replace(/\b[A-ZÀ-ÜÉÈÊÎÔÛ'][A-ZÀ-ÜÉÈÊÎÔÛ']+\b/g, (m) => (/^(DIEU|JÉSUS|CHRIST|ESPRIT)$/.test(m) ? m.charAt(0) + m.slice(1).toLowerCase() : m.toLowerCase())).replace(/ À /g, ' à ').replace(/^./, (x) => x.toUpperCase());
const etapeDe = (id) => I.etapes.find((e) => e.id === id) || I.etapes[0];

function Bloc({ b, c }) {
  const x = adapter(b.x, c);
  if (b.t === 'h') return <h3 class="orizon-sous">{x}</h3>;
  if (b.t === 'li') return <p class="orizon-li">{x}</p>;
  if (b.t === 'cit') return <blockquote class="orizon-cit"><TexteRefs texte={x} /></blockquote>;
  return <p class="orizon-p"><TexteRefs texte={x} /></p>;
}

// Réglages : pour qui, homme ou femme, quelle situation.
function Reglages({ c, fini }) {
  const [f, setF] = useState({ nom: c?.nom || '', sexe: c?.sexe || 'h', situation: c?.situation || 'maladie', detail: c?.detail || '', conjoint: c?.conjoint || '', etape: c?.etape || 'jeune-21' });
  const maj = (k, v) => setF({ ...f, [k]: v });
  return (
    <section class="carte bloc pq-reglages">
      <h3 style="margin-top:0">{c ? 'Modifier' : 'Pour qui veux-tu prier ?'}</h3>
      <label class="ligne__titre" for="pq-nom">Son prénom (et son nom si tu veux)</label>
      <input id="pq-nom" class="champ" value={f.nom} maxLength={40} placeholder="Ex. : Paul, maman Esther…" onInput={(e) => maj('nom', e.currentTarget.value)} />
      <p class="ligne__titre" style="margin:12px 0 6px">C'est…</p>
      <div class="segments" role="group" aria-label="Homme ou femme">
        <button aria-pressed={f.sexe === 'h'} onClick={() => maj('sexe', 'h')}>un homme</button>
        <button aria-pressed={f.sexe === 'f'} onClick={() => maj('sexe', 'f')}>une femme</button>
      </div>
      <p class="ligne__titre" style="margin:12px 0 6px">Pour quelle situation ?</p>
      <div class="segments" role="group" aria-label="Situation">
        <button aria-pressed={f.situation === 'maladie'} onClick={() => maj('situation', 'maladie')}>Une maladie</button>
        <button aria-pressed={f.situation === 'epreuve'} onClick={() => maj('situation', 'epreuve')}>Une autre épreuve</button>
      </div>
      <input class="champ" style="margin-top:8px" value={f.detail} maxLength={80} placeholder="En quelques mots (facultatif) : ex. un cancer, un procès, un chômage…" onInput={(e) => maj('detail', e.currentTarget.value)} />
      <label class="ligne__titre" for="pq-conj" style="display:block;margin-top:12px">Prénom de son conjoint (facultatif, pour l'étape en couple)</label>
      <input id="pq-conj" class="champ" value={f.conjoint} maxLength={40} placeholder="Ex. : Marie" onInput={(e) => maj('conjoint', e.currentTarget.value)} />
      {!c && <>
        <p class="ligne__titre" style="margin:12px 0 6px">Par où commencer ?</p>
        <div class="liste">{I.etapes.map((e, i) => (
          <button class={'carte pq-choix' + (f.etape === e.id ? ' pq-choix--actif' : '')} onClick={() => maj('etape', e.id)}>
            <span class="orizon-etape__num">{i + 1}</span><span class="ligne__corps"><b>{e.titre}</b><span class="ligne__desc" style="display:block">{e.description}</span></span>
          </button>))}</div>
      </>}
      <button class="bouton bouton--or" style="width:100%;margin-top:14px" disabled={!f.nom.trim()} onClick={() => { configurer(f); fini?.(); compter('pour-quelqu-un', f.etape); }}>
        {c ? 'Enregistrer' : `Commencer à prier pour ${f.nom.trim() || '…'}`}</button>
      <p class="ligne__desc" style="margin-top:8px">Tout reste sur ton téléphone. Les textes s'adaptent automatiquement au prénom et à la situation.</p>
    </section>
  );
}

// Accueil : pour qui, l'étape en cours, le jour du jour, les jours suivants.
export function PourQuelquun({ jour }) {
  const c = useSignal(pq);
  const [modif, setModif] = useState(false);
  if (jour && c) return <JourPQ n={+jour} c={c} />;
  if (!c || modif) return (
    <div class="page">
      <div class="theme-hero"><img src="/assets/priere/priere-pour-un-malade.webp" alt="" />
        <div class="theme-hero__texte"><span class="pastille pastille--or">Un jour, une prière</span><h2>{I.titre}</h2></div></div>
      <p class="niveau-description">{I.resume}</p>
      <Reglages c={modif ? c : null} fini={() => setModif(false)} />
      <p class="source-mention">{I.source}</p>
    </div>
  );
  const e = etapeDe(c.etape), faits = faitsDe(e.id, c), n = jourCourantPQ(e.id, e.duree, c);
  const bloque = debutCycleBloque(e.id, c), et = bloque ? 'demain' : etatJourPQ(e.id, n, c);
  const cycle = c.cycles?.[e.id] || 1;
  return (
    <div class="page">
      <section class="carte bloc pq-tete">
        <p class="ligne__desc" style="margin:0">Tu pries pour</p>
        <h2 style="margin:2px 0">{c.nom}</h2>
        <p class="ligne__desc" style="margin:0">{c.situation === 'maladie' ? 'Maladie' : 'Épreuve'}{c.detail ? ' · ' + c.detail : ''}</p>
        <button class="lien" style="margin-top:6px" onClick={() => setModif(true)}>Modifier</button>
      </section>

      <h2 class="titre-section">Les étapes</h2>
      <div class="pq-etapes">{I.etapes.map((x, i) => (
        <button class={'pq-etape' + (x.id === e.id ? ' pq-etape--active' : '')} onClick={() => x.id !== e.id && configurer({ etape: x.id })} aria-pressed={x.id === e.id}>
          <span class="orizon-etape__num">{i + 1}</span><span>{x.court}</span></button>))}</div>
      <p class="niveau-description">{adapter(e.description, c)}</p>

      <section class="carte bloc pq-jour">
        <p class="ligne__desc" style="margin:0">{e.titre}{e.perpetuel ? ` · cycle ${cycle}` : ''}</p>
        <p class="pq-jour__n">Jour {n} <span>sur {e.duree}</span></p>
        <div class="progression"><span style={{ width: (faits.length / e.duree) * 100 + '%' }} /></div>
        {et === 'demain'
          ? <p class="orizon-attente" style="margin-top:10px"><Icone nom="cadenas" taille={18} /> Tu as prié aujourd'hui. Le jour {n} s'ouvrira demain, après minuit.</p>
          : <a class="bouton bouton--or" style="width:100%;margin-top:10px" href={'#/priere/pour-quelqu-un/jour/' + n}><Icone nom="lecture" taille={20} /> Prier le jour {n}</a>}
      </section>

      <details class="carte bloc pq-comment">
        <summary><Icone nom="info" taille={18} /> Comment ça marche ? <span class="ligne__desc">(toucher pour lire)</span></summary>
        {e.intro.map((b) => <Bloc b={b} c={c} />)}
      </details>

      <h2 class="titre-section">Tous les jours</h2>
      <div class="orizon-grille">
        {Array.from({ length: e.duree }, (_, k) => k + 1).map((j) => {
          const s = bloque && !faits.includes(j) ? 'ferme' : etatJourPQ(e.id, j, c);
          const cl = 'orizon-case orizon-case--structure' + (faits.includes(j) ? ' orizon-case--fait' : '') + (j === n && s === 'ouvert' ? ' orizon-case--courant' : '') + (s !== 'ouvert' ? ' orizon-case--fermee' : '');
          return s === 'ouvert' ? <a class={cl} href={'#/priere/pour-quelqu-un/jour/' + j}>{j}</a> : <span class={cl} aria-disabled="true">{j}</span>;
        })}
      </div>
      <p class="ligne__desc" style="margin:6px 4px">Un jour s'ouvre chaque jour, après minuit. Les jours déjà priés restent accessibles.</p>
      {faits.length === e.duree - 1 || (!e.perpetuel && faits.length === e.duree) ? <p class="guide-phase"><Icone nom="info" taille={18} /><span>Après la dernière journée, passe à l'étape suivante (en haut) pour continuer de prier, même si Dieu a déjà répondu : pour rendre grâce, et pour qu'il maintienne ce qu'il a fait.</span></p> : null}
      <p class="source-mention">{I.source}</p>
    </div>
  );
}

function useProgramme(id) {
  const [d, setD] = useState(null);
  useEffect(() => { let ok = true; setD(null); chargerProgramme(id).then((x) => ok && setD(x)).catch(() => ok && setD({ erreur: true })); return () => { ok = false; }; }, [id]);
  return d;
}

// Une journée : tout le déroulé, avec « Écouter et prier » en haut.
function JourPQ({ n, c }) {
  const e = etapeDe(c.etape), d = useProgramme(e.id);
  const a = (t, cit) => adapter(t, c, cit);
  if (!d) return <div class="page"><p class="verset__attente" style="margin-top:16px">Chargement…</p></div>;
  if (d.erreur) return <div class="page"><p class="verset__erreur" style="margin-top:16px">Ce programme n'est pas encore sur ton téléphone. Connecte-toi une fois pour l'ouvrir.</p></div>;
  const et = debutCycleBloque(e.id, c) && !faitsDe(e.id, c).includes(n) ? 'demain' : etatJourPQ(e.id, n, c);
  if (et !== 'ouvert') return <div class="page"><section class="carte bloc" style="margin-top:16px;text-align:center"><Icone nom="cadenas" taille={28} /><p>{et === 'demain' ? `Le jour ${n} s'ouvrira demain, après minuit.` : `Le jour ${n} s'ouvrira quand tu auras prié le jour ${n - 1}.`}</p><a class="bouton bouton--or" href="#/priere/pour-quelqu-un" style="width:100%">Retour</a></section></div>;
  const j = (d.jours || []).find((x) => x.n === n);
  if (!j) return <div class="page"><p class="ligne__desc">Jour introuvable.</p></div>;
  const sem = (d.semaines || []).filter((s) => s.apres < n).pop();
  const S = (t) => ({ texte: a(t) });
  let guide, contenu;

  if (e.id === 'jeune-21') {
    guide = { introduction: `${a(j.courage)} Texte du jour, ${j.ref} : ${a(j.citation, true)} ${a(j.meditation)}`,
      etapes: [{ titre: 'Les sept proclamations du matin', sujets: d.matin.map(S) }, { titre: 'Le cri du jour', texte: 'Pendant la journée de jeûne, reviens souvent à ce cri.', sujets: [S(j.cri)] }, { titre: 'Le soir : les sept proclamations', sujets: d.soir.map(S) }, { titre: 'Avant de dormir', sujets: [S('{nom} vivra et ne mourra pas, et {il} racontera les œuvres de l\'Éternel. (Psaume 118:17)')] }] };
    contenu = <>
      <p class="guide-phase"><Icone nom="coeur" taille={18} /><span><b>Courage pour aujourd'hui.</b> {a(j.courage)}</span></p>
      <h3 class="pq-moment">1 · Le matin, avant 6 h</h3>
      <p class="ligne__titre">Le texte du jour : <TexteRefs texte={j.ref} /></p>
      <blockquote class="orizon-cit">« {a(j.citation, true)} »</blockquote>
      <p class="orizon-p"><b>Méditation (5 à 10 minutes).</b> {a(j.meditation)}</p>
      <p class="ligne__titre">Les sept proclamations du matin, à voix haute</p>
      <ol class="pq-liste">{d.matin.map((x) => <li><TexteRefs texte={a(x)} /></li>)}</ol>
      <p class="orizon-p">À 6 h, confie ta journée à Dieu et commence le jeûne jusqu'à 18 h.</p>
      <h3 class="pq-moment">2 · Dans la journée, de 6 h à 18 h</h3>
      <p class="orizon-p">Prie pour {c.nom} chaque fois que tu le peux. Bois de l'eau. Quand la faim se fait sentir, transforme-la en prière.</p>
      <p class="pq-cri"><b>Cri du jour :</b> {a(j.cri)}</p>
      <p class="orizon-p">À 18 h, romps le jeûne doucement : de l'eau, un fruit, puis un repas léger.</p>
      <h3 class="pq-moment">3 · Le soir</h3>
      <p class="orizon-p"><b>Question de partage :</b> {a(j.question)}</p>
      <p class="ligne__titre">Les sept proclamations du soir</p>
      <ol class="pq-liste">{d.soir.map((x) => <li><TexteRefs texte={a(x)} /></li>)}</ol>
      <p class="orizon-p">Priez ensemble selon le cri du jour, puis rendez grâce d'avance. Avant de dormir : « {a('{nom} vivra et ne mourra pas, et {il} racontera les œuvres de l\'Éternel.')} » (Psaume 118:17)</p>
    </>;
  } else if (e.id === 'veille') {
    guide = { introduction: `Texte du jour, ${j.refs} : ${a(j.citation, true)} ${a(j.partage)} Ce que je contemple de Dieu : ${a(j.contemple)}`,
      etapes: [{ titre: 'Prière, supplication et action de grâce', sujets: j.prieres.map(S) }, { titre: 'Pour la gloire de Dieu', sujets: [S(j.axe)] }] };
    contenu = <>
      <ol class="pq-agenda">
        <li><b>Prière d'ouverture</b> : invoquer la présence et la conduite du Saint-Esprit.</li>
        <li><b>Les nouvelles et les témoignages</b> : ce que Dieu a fait depuis hier.</li>
        <li><b>Louange et adoration</b> : quelques chants ; on loue avant de demander.</li>
      </ol>
      <h3 class="pq-moment">4 · Le texte du jour : <TexteRefs texte={j.refs} /></h3>
      <blockquote class="orizon-cit">« {a(j.citation, true)} »</blockquote>
      <h3 class="pq-moment">5 · Partage</h3>
      <p class="orizon-p">{a(j.partage)}</p>
      <p class="pq-cri"><b>Ce que je contemple de Dieu :</b> {a(j.contemple)}</p>
      <h3 class="pq-moment">6 · Prière, supplication et action de grâce</h3>
      <ul class="pq-liste">{j.prieres.map((x) => <li>{a(x)}</li>)}</ul>
      <p class="pq-cri"><b>Pour la gloire de Dieu :</b> {a(j.axe)}</p>
      <h3 class="pq-moment">7 · Prière de clôture</h3>
      <p class="orizon-p">Bénédiction finale, et engagement à se retrouver demain.</p>
    </>;
  } else if (j.type === 'nuit') {
    guide = { introduction: `${a(j.intro)} ${a(j.comment)}`, etapes: j.creneaux.map((k) => ({ titre: `${k.heure.replace('–', ' à ')} : ${k.titre}`, sujets: k.puces.map(S) })) };
    contenu = <>
      <p class="orizon-p">{a(j.intro)}</p>
      <p class="guide-phase"><Icone nom="info" taille={18} /><span><b>Comment mener cette nuit.</b> {a(j.comment)}</span></p>
      <p class="orizon-p"><b>Lecture du jour :</b> {j.lecture}</p>
      {j.creneaux.map((k) => <section class="pq-creneau"><h3 class="pq-moment">{k.heure} · {k.titre}</h3>{k.refs && <p class="ligne__desc"><TexteRefs texte={k.refs.replace(/(\d)\.(\d)/g, '$1:$2')} /></p>}<ul class="pq-liste">{k.puces.map((x) => <li>{a(x)}</li>)}</ul></section>)}
    </>;
  } else if (j.type === 'louange') {
    guide = { introduction: j.blocs.filter((b) => b.t === 'p').map((b) => a(b.x)).join(' '), etapes: [{ titre: j.titre, sujets: j.blocs.filter((b) => b.t === 'cit' || b.t === 'li').map((b) => S(b.x)) }] };
    contenu = j.blocs.map((b) => <Bloc b={b} c={c} />);
  } else {
    guide = { introduction: `${a(j.ouverture)} Texte du jour, ${j.ref} : ${a(j.citation, true)} ${a(j.partage)}`, etapes: j.volets.map((v) => ({ titre: casse(v.titre), sujets: v.puces.map(S) })) };
    contenu = <>
      <h3 class="pq-moment">1 · Prière d'ouverture et repentance</h3><p class="orizon-p">{a(j.ouverture)}</p>
      <h3 class="pq-moment">2 · Les nouvelles et le suivi</h3><p class="orizon-p">As-tu lu le passage d'hier ? Qu'en as-tu retenu ? As-tu prié seul dans la journée ? As-tu écouté un enseignement ?</p>
      <h3 class="pq-moment">3 · Louange et adoration</h3><p class="orizon-p">Quelques cantiques. On loue avant de demander.</p>
      <h3 class="pq-moment">4 · Le texte du jour : <TexteRefs texte={j.ref} /></h3><blockquote class="orizon-cit">« {a(j.citation, true)} »</blockquote>
      <h3 class="pq-moment">5 · Partage</h3><p class="orizon-p">{a(j.partage)}</p><p class="pq-cri"><b>Ce que je contemple de Dieu :</b> {a(j.contemple)}</p>
      <h3 class="pq-moment">6 · Prière, supplication et action de grâce</h3>
      {j.volets.map((v) => <section class="pq-creneau"><p class="ligne__titre">{v.lettre} · {casse(v.titre)}</p><p class="ligne__desc"><i>{v.verset}</i></p><ul class="pq-liste">{v.puces.map((x) => <li>{a(x)}</li>)}</ul></section>)}
      <h3 class="pq-moment">7 · Prière de clôture</h3><p class="orizon-p">{a(j.cloture)}</p>
    </>;
  }

  const fait = faitsDe(e.id, c).includes(n);
  return (
    <div class="page orizon-texte">
      <p class="orizon-jour__phase">{e.titre}{sem ? ' · ' + casse(sem.titre) : ''}</p>
      <h2 class="orizon-jour__titre">Jour {n} · {a(j.titre)}</h2>
      <p class="ligne__desc" style="margin:0 0 4px">Pour {c.nom}</p>
      <PriereGuidee id={`pq-${e.id}-${n}`} titre={`Jour ${n} · ${a(j.titre)}`} introduction={guide.introduction} etapes={guide.etapes} />
      {contenu}
      {fait ? <p class="carte bloc" style="text-align:center;margin-top:14px"><Icone nom="verifie" /> Jour {n} prié. Le jour suivant s'ouvre après minuit.</p>
        : <button class="bouton bouton--or" style="width:100%;margin-top:14px" onClick={() => { terminerJourPQ(e.id, n, e.duree, e.perpetuel); noterPriere(`pq-${e.id}`); compter('pour-quelqu-un-jour', e.id); notifier('Amen ! Le jour suivant s\'ouvrira demain.'); location.hash = '#/priere/pour-quelqu-un'; }}>
          <Icone nom="verifie" taille={20} /> J'ai prié le jour {n}</button>}
      <a class="bouton bouton--contour" href="#/priere/pour-quelqu-un" style="width:100%;margin-top:10px">Retour</a>
    </div>
  );
}
