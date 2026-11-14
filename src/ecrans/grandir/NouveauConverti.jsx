import { Icone } from '../../composants/Icone.jsx';
import { CarteVerset } from '../../composants/Verset.jsx';
import { TexteRefs } from '../../composants/TexteRefs.jsx';
import { BoutonLecture } from '../../composants/Audio.jsx';
import { notifier } from '../../composants/Notification.jsx';
import { SujetsACocher, blocsSujets } from '../priere/Veille.jsx';
import { BarreEcoute, useVoixActive } from '../../composants/Ecouter.jsx';
import { NOUVEAU_CONVERTI, DECOUVRIR_JESUS, AUDIOS, JOURS_PARCOURS } from '../../donnees/contenu.js';
import { parcours, terminerJour, jourDebloque, noterDecision } from '../../donnees/priere.js';
import { lireReference, ecrireReference } from '../../bible/references.js';
import { useSignal } from '../../outils/signal.js';
import { aller } from '../../outils/routeur.js';

// Deux parcours progressifs : une étape se débloque quand la précédente est terminée.
export const PARCOURS = {
  'decouvrir-jesus': { cle: 'dj', liste: () => DECOUVRIR_JESUS, total: () => DECOUVRIR_JESUS.length, unite: 'Leçon',
    titre: 'Découvrir Jésus', sousTitre: 'Qui est Jésus, et comment lui donner ta vie ? 10 courtes leçons, à ton rythme.',
    image: '/assets/jesus/jesus-main-tendue.webp', suite: { lien: 'grandir/nouveau-converti', texte: 'Continuer avec « Mes 30 premiers jours avec Christ »' } },
  'nouveau-converti': { cle: 'faits', liste: () => NOUVEAU_CONVERTI, total: () => JOURS_PARCOURS, unite: 'Jour',
    titre: 'Mes 30 premiers jours avec Christ', sousTitre: 'Un parcours simple pour bien commencer, un thème par jour, à ton rythme.',
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
      <ol class="jours">
        {Array.from({ length: total }, (_, i) => i + 1).map((n) => {
          const j = cfg.liste().find((x) => x.jour === n), fait = faits.includes(n), ouvert = jourDebloque(n, faits);
          const etat = fait ? 'fait' : ouvert && j ? 'ouvert' : 'ferme';
          const contenu = (
            <>
              <span class={'jour__statut jour__statut--' + etat}>{fait ? <Icone nom="verifie" taille={18} /> : etat === 'ouvert' ? <Icone nom="lecture" taille={16} /> : <Icone nom="cadenas" taille={16} />}</span>
              <span class="jour__num">{cfg.unite} {n}</span>
              <span class="ligne__corps">
                <span class="ligne__titre" style="display:block">{j ? j.titre : 'À venir'}</span>
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
  if (!j || !jourDebloque(n, faits)) return <div class="page"><p class="ligne__desc" style="margin-top:16px">Cette étape n'est pas encore disponible. Termine d'abord la précédente.</p></div>;
  const piste = AUDIOS[j.id], fait = faits.includes(n), total = cfg.total();
  const corps = j.sections ? j.sections.map((s) => ({ texte: `${s.titre}. ${s.texte}` })) : [{ texte: j.texte }];
  const blocs = [{ texte: `${cfg.unite} ${n}. ${j.titre}.` }, ...corps, ...j.versets.map((r) => ({ reference: r })), { texte: 'Pour réfléchir. ' + j.question },
    ...(j.sujets?.length ? [{ texte: 'Sujets de prière.' }, ...blocsSujets(j.sujets)] : []), ...(j.priere ? [{ texte: (j.decision ? 'Prière pour recevoir Jésus. ' : 'Prière. ') + j.priere }] : [])];
  const iV = 1 + corps.length, iQ = iV + j.versets.length, iS = iQ + 1, iP = iS + (j.sujets?.length ? j.sujets.length + 1 : 0);
  const terminer = () => { terminerJour(n, cfg.cle); notifier(`Bravo, ${cfg.unite.toLowerCase()} ${n} terminé${cfg.unite === 'Leçon' ? 'e' : ''} !`); aller('grandir/' + id); };
  return (
    <div class="page">
      <div class="theme-hero"><img src={j.image} alt="" />
        <div class="theme-hero__texte"><span class="pastille pastille--or">{cfg.unite} {n} sur {total}</span><h2>{j.titre}</h2></div></div>
      {j.exemple && <p style="margin:8px 4px 0"><span class="etiquette-exemple">EXEMPLE</span> Contenu de démonstration.</p>}
      {!piste && <BarreEcoute id={vid} blocs={blocs} titre={'Écouter ' + (cfg.unite === 'Leçon' ? 'la leçon' : 'le jour')} />}
      <section class="carte bloc enseignement-court">
        {j.sections ? j.sections.map((s, k) => <div {...va(1 + k)}><h3 class="section-ens__sous" style="margin:0">{s.titre}</h3><p><TexteRefs texte={s.texte} /></p></div>) : <p {...va(1)}><TexteRefs texte={j.texte} /></p>}
        {piste && <div class="bloc__audio"><BoutonLecture piste={piste} taille={44} /><span class="ligne__corps"><span class="ligne__titre">Écouter</span></span></div>}
      </section>
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
      {fait ? <p class="hors-ligne-ok" style="justify-content:center;margin-top:14px"><Icone nom="verifie" taille={18} /> Terminé</p>
        : <button class="bouton bouton--or" style="width:100%;margin-top:14px" onClick={terminer}><Icone nom="verifie" taille={18} /> J'ai terminé {cfg.unite === 'Leçon' ? 'cette leçon' : 'ce jour'}</button>}
      {j.inspiration && <p class="source-mention">{j.inspiration}</p>}
    </div>
  );
}

// Compatibilité avec l'ancienne route
export const NouveauConverti = ({ jour }) => <Parcours id="nouveau-converti" jour={jour} />;
