import { Icone } from '../../composants/Icone.jsx';
import { CarteVerset } from '../../composants/Verset.jsx';
import { TexteRefs } from '../../composants/TexteRefs.jsx';
import { BoutonLecture } from '../../composants/Audio.jsx';
import { notifier } from '../../composants/Notification.jsx';
import { SujetsACocher, blocsSujets } from '../priere/Veille.jsx';
import { BarreEcoute, useVoixActive } from '../../composants/Ecouter.jsx';
import { NOUVEAU_CONVERTI, DECOUVRIR_JESUS, AUDIOS, JOURS_PARCOURS } from '../../donnees/contenu.js';
import { parcours, terminerJour, noterDecision } from '../../donnees/priere.js';
import { Questions } from './EnseignementEcrit.jsx';
import { lireReference, ecrireReference } from '../../bible/references.js';
import { useSignal } from '../../outils/signal.js';
import { aller, retourVers } from '../../outils/routeur.js';
import { rythme, chargerRythme, rappelParcours, aRappelParcours } from '../../donnees/rythme.js';
import { useEffect, useState } from 'preact/hooks';
import { compter } from '../../donnees/mesure.js';

// Bouton « Me rappeler chaque jour » : pour ne pas perdre le fil d'un parcours.
export function RappelParcours({ id }) {
  const cfg = PARCOURS[id]; useSignal(rythme);
  const [heure, setHeure] = useState('19:00');
  useEffect(() => { if (rythme.valeur === null) chargerRythme(); }, []);
  if (aRappelParcours(id)) {
    const it = rythme.valeur.items.find((x) => x.id === 'parcours-' + id);
    return <p class="ligne__desc rappel-parcours rappel-parcours--ok"><Icone nom="verifie" taille={16} /> Rappel chaque jour à {it.heure.replace(':', ' h ')}. <a class="lien" href="#/equilibre">Modifier</a></p>;
  }
  const activer = async () => {
    await rappelParcours(id, cfg.titre + ' : ma ' + cfg.unite.toLowerCase() + ' du jour', heure);
    compter('rappel-parcours', id);
    notifier('Rappel enregistré. Ouvre le fichier téléchargé pour l\'ajouter à ton agenda : il sonnera même application fermée.');
  };
  return (
    <section class="carte bloc rappel-parcours">
      <h3 style="margin-top:0"><Icone nom="calendrier" taille={18} /> Ne perds pas le fil</h3>
      <p class="ligne__desc">Beaucoup commencent, peu continuent. Un petit rappel chaque jour t'aide à avancer jusqu'au bout.</p>
      <div class="rappel-parcours__ligne">
        <label class="etiquette-champ" for={'h-' + id} style="margin:0">À</label>
        <input id={'h-' + id} class="champ" type="time" value={heure} onInput={(e) => setHeure(e.currentTarget.value || '19:00')} style="max-width:120px" />
        <button class="bouton bouton--or" onClick={activer}>Me rappeler chaque jour</button>
      </div>
    </section>
  );
}

// Carte d'accueil : reprendre le parcours commencé (ou le commencer après une décision pour Jésus).
export function CarteParcoursAccueil() {
  const p = useSignal(parcours);
  for (const id of ['decouvrir-jesus', 'nouveau-converti']) {
    const cfg = PARCOURS[id], faits = p[cfg.cle] || [], total = cfg.total();
    if (!faits.length || faits.length >= total) continue;
    const prochain = Array.from({ length: total }, (_, i) => i + 1).find((n) => !faits.includes(n));
    const j = cfg.liste().find((x) => x.jour === prochain);
    return (
      <a class="carte ligne carte-parcours" href={`#/grandir/${id}/${prochain}`}>
        <img src={cfg.image} alt="" loading="lazy" />
        <span class="ligne__corps"><span class="pastille pastille--or pastille--mini">{cfg.unite} {prochain} sur {total}</span>
          <span class="ligne__titre" style="display:block">{j ? j.titre : cfg.titre}</span>
          <span class="ligne__desc">{cfg.titre} · ta {cfg.unite.toLowerCase()} t'attend</span></span>
        <Icone nom="chevron" taille={20} />
      </a>
    );
  }
  if (p.decision && !(p.dj || []).length) return (
    <a class="carte ligne carte-parcours" href="#/grandir/decouvrir-jesus/1">
      <img src={PARCOURS['decouvrir-jesus'].image} alt="" loading="lazy" />
      <span class="ligne__corps"><span class="pastille pastille--or pastille--mini">Pour toi qui as donné ta vie à Jésus</span>
        <span class="ligne__titre" style="display:block">Commence « Découvrir Jésus »</span>
        <span class="ligne__desc">10 leçons pour bâtir ta foi sur le roc.</span></span>
      <Icone nom="chevron" taille={20} />
    </a>
  );
  return null;
}

// Deux parcours pour le nouveau converti. Tout est ouvert : l'ordre est conseillé, pas imposé.
export const PARCOURS = {
  'decouvrir-jesus': { cle: 'dj', liste: () => DECOUVRIR_JESUS, total: () => DECOUVRIR_JESUS.length, unite: 'Leçon',
    titre: 'Découvrir Jésus', sousTitre: 'Qui est Dieu, qui est Jésus, et comment lui donner ta vie ? 10 leçons solides pour poser les fondations, à ton rythme.',
    image: '/assets/jesus/jesus-main-tendue.webp', suite: { lien: 'grandir/nouveau-converti', texte: 'Continuer avec « Mes 30 premiers jours avec Christ »' } },
  'nouveau-converti': { cle: 'faits', liste: () => NOUVEAU_CONVERTI, total: () => JOURS_PARCOURS, unite: 'Jour',
    titre: 'Mes 30 premiers jours avec Christ', sousTitre: 'Un thème par jour, environ 10 minutes : un enseignement, la Bible ouverte, un mini-quiz, une action pour la journée et une prière.',
    image: '/assets/nouveau-converti/joie-de-la-rencontre.webp' },
};

export function Parcours({ id, jour }) {
  const cfg = PARCOURS[id], p = useSignal(parcours), faits = p[cfg.cle] || [];
  if (jour) return <Etape cfg={cfg} id={id} n={+jour} faits={faits} decision={p.decision} />;
  const total = cfg.total(), pct = Math.round((faits.length / total) * 100);
  const prochain = Array.from({ length: total }, (_, i) => i + 1).find((n) => !faits.includes(n));
  return (
    <div class="page">
      <div class="bandeau-titre"><img src={cfg.image} alt="" /><div><h2>{cfg.titre}</h2><p>{cfg.sousTitre}</p></div></div>
      <section class="carte bloc">
        <div class="progression-tete"><span class="ligne__titre">Ma progression</span><span class="ligne__desc">{faits.length} / {total} ({pct} %)</span></div>
        <div class="progression progression--fine"><span style={{ width: pct + '%' }} /></div>
        {prochain && cfg.liste().find((j) => j.jour === prochain) && (
          <a class="bouton bouton--or" href={`#/grandir/${id}/${prochain}`} style="margin-top:10px">
            {faits.length ? 'Reprendre' : 'Commencer'} : {cfg.unite.toLowerCase()} {prochain}</a>
        )}
        {!prochain && cfg.suite && <a class="bouton bouton--or" href={'#/' + cfg.suite.lien} style="margin-top:10px">{cfg.suite.texte}</a>}
      </section>
      {prochain && <RappelParcours id={id} />}
      <details class="carte bloc conseil-parcours">
        <summary><Icone nom="ampoule" taille={18} /> Comment profiter de ce parcours</summary>
        <ol>
          <li><b>Une leçon à la fois.</b> Prends ton temps : une leçon tous les deux ou trois jours vaut mieux que tout en un soir.</li>
          <li><b>Écoute ou lis en entier</b>, la Bible ouverte. Touche les versets pour les lire dans leur contexte, puis reviens.</li>
          <li><b>Retiens</b> les points clés et <b>apprends le verset</b> de la leçon par cœur.</li>
          <li><b>Réponds aux questions</b> : ce n'est pas un examen, c'est pour vérifier que tu as compris. Si tu te trompes, relis le point indiqué.</li>
          <li><b>Mets en pratique</b> l'action proposée pendant la semaine.</li>
          <li><b>Parles-en</b> avec un chrétien mûr ou ton pasteur : pose-lui tes questions, raconte-lui ce que tu as appris.</li>
          <li><b>Prie</b> avec la prière proposée, puis avec tes propres mots.</li>
        </ol>
        <p class="ligne__desc">Toutes les leçons sont ouvertes. L'ordre conseillé est le meilleur pour bâtir solidement, mais tu peux revenir sur une leçon quand tu veux.</p>
      </details>
      <ol class="jours">
        {Array.from({ length: total }, (_, i) => i + 1).map((n) => {
          const j = cfg.liste().find((x) => x.jour === n), fait = faits.includes(n);
          const etat = fait ? 'fait' : !j ? 'ferme' : n === prochain ? 'ouvert' : 'libre';
          const contenu = (
            <>
              <span class={'jour__statut jour__statut--' + etat}>{fait ? <Icone nom="verifie" taille={18} /> : etat === 'ferme' ? <Icone nom="cadenas" taille={16} /> : <Icone nom="lecture" taille={16} />}</span>
              <span class="jour__num">{cfg.unite} {n}</span>
              <span class="ligne__corps">
                <span class="ligne__titre" style="display:block">{j ? j.titre : 'À venir'}{etat === 'ouvert' && <span class="pastille pastille--or pastille--mini">Conseillé maintenant</span>}</span>
                <span class="ligne__desc">{j ? j.versets.slice(0, 3).map((r) => ecrireReference(lireReference(r))).join(' · ') : 'Contenu en préparation'}</span>
              </span>
            </>
          );
          return <li>{etat === 'ferme' ? <div class="carte jour jour--ferme" aria-disabled="true">{contenu}</div>
            : <a class={'carte jour jour--' + etat} href={`#/grandir/${id}/${n}`}>{contenu}</a>}</li>;
        })}
      </ol>
    </div>
  );
}

function Etape({ cfg, id, n, faits, decision }) {
  const j = cfg.liste().find((x) => x.jour === n);
  const vid = `${id}-${n}`, va = useVoixActive(vid);
  if (!j) return <div class="page"><p class="ligne__desc" style="margin-top:16px">Cette étape est en préparation.</p></div>;
  const piste = AUDIOS[j.id], fait = faits.includes(n), total = cfg.total();
  // Corps de la leçon : introduction, points numérotés (un ou plusieurs paragraphes), conclusion.
  const paras = (t) => (Array.isArray(t) ? t : [t]).filter(Boolean);
  const items = j.sections ? [
    ...paras(j.introduction).map((t) => ({ k: 'p', texte: t })),
    ...j.sections.flatMap((s, i) => [{ k: 'h', texte: (j.introduction ? `${i + 1}. ` : '') + s.titre, point: i + 1 }, ...paras(s.texte).map((t) => (t.startsWith('### ') ? { k: 's', texte: t.slice(4) } : t.startsWith('> ') ? { k: 'v', ref: t.slice(2) } : { k: 'p', texte: t }))]),
    ...(j.conclusion ? [{ k: 'h', texte: 'Pour conclure' }, ...paras(j.conclusion).map((t) => ({ k: 'p', texte: t }))] : []),
  ] : [{ k: 'p', texte: j.texte }];
  const corps = items.map((x) => (x.k === 'v' ? { reference: x.ref } : { texte: x.k === 'h' || x.k === 's' ? x.texte + '.' : x.texte }));
  const plus = [
    ...(j.retenir?.length ? [{ texte: 'À retenir.' }, ...j.retenir.map((t) => ({ texte: t }))] : []),
    ...(j.memoriser ? [{ texte: 'Verset à apprendre par cœur.' }, { reference: j.memoriser }] : []),
    ...(j.pratique ? [{ texte: (cfg.unite === 'Jour' ? 'À vivre aujourd\'hui. ' : 'À vivre cette semaine. ') + j.pratique }] : []),
  ];
  const blocs = [{ texte: `${cfg.unite} ${n}. ${j.titre}.` }, ...corps, ...plus, ...j.versets.map((r) => ({ reference: r })), { texte: 'Pour réfléchir. ' + j.question },
    ...(j.sujets?.length ? [{ texte: 'Sujets de prière.' }, ...blocsSujets(j.sujets)] : []), ...(j.priere ? [{ texte: (j.decision ? 'Prière pour recevoir Jésus. ' : 'Prière. ') + j.priere }] : [])];
  const iPlus = 1 + corps.length, iV = iPlus + plus.length, iQ = iV + j.versets.length, iS = iQ + 1, iP = iS + (j.sujets?.length ? j.sujets.length + 1 : 0);
  const terminer = () => { terminerJour(n, cfg.cle); notifier(`Bravo, ${cfg.unite.toLowerCase()} ${n} terminé${cfg.unite === 'Leçon' ? 'e' : ''} !`); };
  const suivante = cfg.liste().find((x) => x.jour === n + 1);
  return (
    <div class="page">
      <div class="theme-hero"><img src={j.image} alt="" />
        <div class="theme-hero__texte"><span class="pastille pastille--or">{cfg.unite} {n} sur {total}</span><h2>{j.titre}</h2></div></div>
      {j.exemple && <p style="margin:8px 4px 0"><span class="etiquette-exemple">EXEMPLE</span> Contenu de démonstration.</p>}
      {!piste && <BarreEcoute id={vid} blocs={blocs} titre={'Écouter ' + (cfg.unite === 'Leçon' ? 'la leçon' : 'le jour')} />}
      <section class="carte bloc enseignement-court">
        {j.objectifs?.length > 0 && <div class="objectifs-lecon"><b>{cfg.unite === 'Jour' ? "Aujourd'hui, tu vas découvrir :" : 'Dans cette leçon, tu vas apprendre :'}</b><ul>{j.objectifs.map((o) => <li>{o}</li>)}</ul></div>}
        {items.map((x, k) => x.k === 'h' ? <h3 id={x.point ? 'point-' + x.point : undefined} class="ens-point lecon-point" {...va(1 + k)}>{x.texte}</h3>
          : x.k === 's' ? <h4 class="section-ens__sous lecon-sous" {...va(1 + k)}>{x.texte}</h4>
          : x.k === 'v' ? <div {...va(1 + k)}><CarteVerset reference={x.ref} /></div>
          : <p {...va(1 + k)}><TexteRefs texte={x.texte} /></p>)}
        {piste && <div class="bloc__audio"><BoutonLecture piste={piste} taille={44} /><span class="ligne__corps"><span class="ligne__titre">Écouter</span></span></div>}
      </section>
      {j.retenir?.length > 0 && <section class="carte bloc a-retenir" {...va(iPlus)}><h3><span class="ligne__icone"><Icone nom="ampoule" /></span> À retenir</h3><ul>{j.retenir.map((t) => <li><TexteRefs texte={t} /></li>)}</ul></section>}
      {j.memoriser && <><h2 class="titre-section">Verset à apprendre par cœur</h2><div {...va(iPlus + (j.retenir?.length ? j.retenir.length + 1 : 0))}><CarteVerset reference={j.memoriser} /></div></>}
      {j.quiz?.length > 0 && <Questions e={{ id: j.id, questions: j.quiz }} />}
      {j.pratique && <section class="carte bloc" style="margin-top:12px"><h3><span class="ligne__icone"><Icone nom="cible" /></span> {cfg.unite === 'Jour' ? 'À vivre aujourd\'hui' : 'À vivre cette semaine'}</h3><p><TexteRefs texte={j.pratique} /></p></section>}
      {j.partage && <section class="carte bloc" style="margin-top:12px"><h3><span class="ligne__icone"><Icone nom="coeur" /></span> Parles-en</h3><p>{j.partage}</p></section>}
      <h2 class="titre-section">À lire</h2>
      <div class="liste">{j.versets.map((r, k) => <div {...va(iV + k)}><CarteVerset reference={r} /></div>)}</div>
      <section class="carte bloc" style="margin-top:12px" {...va(iQ)}><h3><span class="ligne__icone"><Icone nom="cible" /></span> Pour réfléchir</h3><p>{j.question}</p></section>
      {j.sujets?.length > 0 && <><h2 class="titre-section">Sujets de prière</h2><SujetsACocher sujets={j.sujets} voixId={vid} debut={iS + 1} /></>}
      {j.priere && (
        <section class={'carte bloc priere-modele' + (j.decision ? ' priere-decision' : '')} {...va(iP)}>
          <h3><span class="ligne__icone"><Icone nom="priere" /></span> {j.decision ? 'Prière pour recevoir Jésus' : 'Prière'}</h3>
          {j.decision && <p class="ligne__desc">Si tu le désires de tout ton cœur, dis cette prière à Dieu, avec tes propres mots si tu préfères.</p>}
          <p><em>{j.priere}</em></p>
        </section>
      )}
      {j.decision && (decision
        ? <p class="hors-ligne-ok" style="justify-content:center;margin-top:12px"><Icone nom="verifie" taille={18} /> Tu as donné ta vie à Jésus le {new Date(decision).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}. Bienvenue dans la famille de Dieu !</p>
        : <button class="bouton bouton--plein" style="width:100%;margin-top:12px" onClick={() => { noterDecision('parcours'); notifier('Bienvenue dans la famille de Dieu !'); }}>
            <Icone nom="coeur" taille={18} /> J'ai donné ma vie à Jésus</button>)}
      <section class="carte bloc suite-ens">
        {fait ? <p class="hors-ligne-ok" style="justify-content:center;margin:0 0 10px"><Icone nom="verifie" taille={18} /> {cfg.unite === 'Leçon' ? 'Leçon terminée' : 'Jour terminé'}</p>
          : <button class="bouton bouton--or" style="width:100%;margin-bottom:8px" onClick={terminer}><Icone nom="verifie" taille={18} /> J'ai terminé {cfg.unite === 'Leçon' ? 'cette leçon' : 'ce jour'}</button>}
        {suivante && <button class={'bouton ' + (fait ? 'bouton--or' : 'bouton--contour')} style="width:100%" onClick={() => { if (!fait) terminer(); aller(`grandir/${id}/${n + 1}`); }}>{cfg.unite} suivant{cfg.unite === 'Leçon' ? 'e' : ''} : {suivante.titre} <Icone nom="chevron" taille={18} /></button>}
        {!suivante && cfg.suite && fait && <a class="bouton bouton--or" style="width:100%" href={'#/' + cfg.suite.lien}>{cfg.suite.texte}</a>}
        <button class="lien" style="margin-top:10px" onClick={() => retourVers('grandir/' + id)}>Revenir à la liste des {cfg.unite === 'Leçon' ? 'leçons' : 'jours'}</button>
      </section>
      {j.inspiration && <p class="source-mention">{j.inspiration}</p>}
    </div>
  );
}

// Compatibilité avec l'ancienne route
export const NouveauConverti = ({ jour }) => <Parcours id="nouveau-converti" jour={jour} />;
