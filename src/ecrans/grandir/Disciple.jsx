import { useState } from 'preact/hooks';
import { Icone } from '../../composants/Icone.jsx';
import { CarteVerset, usePassage } from '../../composants/Verset.jsx';
import { TexteRefs } from '../../composants/TexteRefs.jsx';
import { notifier } from '../../composants/Notification.jsx';
import { DEFIS } from '../../donnees/contenu.js';
import { disciple, cocherDefi, recommencerDefi, marquerVersetAppris, versetDeLaSemaine, ajouterPersonne, retirerPersonne, noterPour } from '../../donnees/disciple.js';
import { journal, dateCourte, parcours } from '../../donnees/priere.js';
import { compter } from '../../donnees/mesure.js';
import { useSignal } from '../../outils/signal.js';

// Outils du disciple : défis de 21 jours, verset de la semaine, mes témoignages, ma liste des 5.
export function Disciple() {
  const d = useSignal(disciple), j = useSignal(journal), p = useSignal(parcours);
  const temoignages = j.filter((r) => r.exaucee);
  return (
    <div class="page">
      <div class="chemin-hero"><h2>Mes outils de disciple</h2><p>De petites habitudes, chaque jour, pour grandir avec Jésus.</p></div>
      {p.decision && p.faits.length < 30 && (
        <a class="carte ligne" href="#/grandir/nouveau-converti" style="margin-bottom:10px">
          <span class="ligne__icone"><Icone nom="grandir" /></span>
          <span class="ligne__corps"><span class="ligne__titre" style="display:block">Ton parcours de nouveau converti</span>
            <span class="ligne__desc">{p.faits.length} jour{p.faits.length > 1 ? 's' : ''} sur 30 · prochaines étapes : église, baptême, premier service</span></span>
          <Icone nom="chevron" taille={20} />
        </a>
      )}
      <h2 class="titre-section">Défis de 21 jours</h2>
      <div class="liste">
        {DEFIS.map((x) => {
          const f = d.defis[x.id]?.faits.length || 0;
          return <a class="carte theme" href={'#/disciple/defi/' + x.id}><img src={x.image} alt="" loading="lazy" />
            <span class="ligne__corps"><span class="ligne__titre" style="display:block">{x.titre}</span>
              <span class="ligne__desc">{f ? `${f} jour${f > 1 ? 's' : ''} sur 21` : x.resume}</span>
              {f > 0 && <span class="progression progression--fine"><span style={{ width: (f / 21) * 100 + '%' }} /></span>}</span>
            <Icone nom="chevron" taille={20} /></a>;
        })}
      </div>
      <h2 class="titre-section">Les autres outils</h2>
      <div class="liste">
        <a class="carte ligne" href="#/disciple/verset"><span class="ligne__icone"><Icone nom="bible" /></span>
          <span class="ligne__corps"><span class="ligne__titre" style="display:block">Le verset de la semaine</span><span class="ligne__desc">{Object.keys(d.versets).length} verset(s) appris par cœur</span></span><Icone nom="chevron" taille={20} /></a>
        <a class="carte ligne" href="#/disciple/temoignages"><span class="ligne__icone"><Icone nom="etoile" /></span>
          <span class="ligne__corps"><span class="ligne__titre" style="display:block">Mes témoignages</span><span class="ligne__desc">{temoignages.length} prière(s) exaucée(s) à relire les jours de doute</span></span><Icone nom="chevron" taille={20} /></a>
        <a class="carte ligne" href="#/disciple/cinq"><span class="ligne__icone"><Icone nom="groupe" /></span>
          <span class="ligne__corps"><span class="ligne__titre" style="display:block">Ma liste des 5</span><span class="ligne__desc">Cinq personnes pour qui prier et à qui parler de Jésus</span></span><Icone nom="chevron" taille={20} /></a>
        <a class="carte ligne" href="#/equilibre"><span class="ligne__icone"><Icone nom="calendrier" /></span>
          <span class="ligne__corps"><span class="ligne__titre" style="display:block">Mon équilibre avec Dieu</span><span class="ligne__desc">Mon rythme, mes rappels et mes courbes</span></span><Icone nom="chevron" taille={20} /></a>
      </div>
    </div>
  );
}

export function DefiJour({ id }) {
  const x = DEFIS.find((y) => y.id === id), d = useSignal(disciple);
  if (!x) return <div class="page"><p class="ligne__desc">Défi introuvable.</p></div>;
  const faits = d.defis[id]?.faits || [];
  const prochain = x.jours.find((jr) => !faits.includes(jr.jour));
  return (
    <div class="page">
      <div class="theme-hero"><img src={x.image} alt="" /><div class="theme-hero__texte"><span class="pastille pastille--or">{faits.length} / 21</span><h2>{x.titre}</h2></div></div>
      <p class="guide-phase" style="margin-top:12px"><Icone nom="info" taille={18} /><span>{x.resume} Coche chaque jour vécu. Si tu en manques un, continue simplement le lendemain.</span></p>
      {faits.length === 21 && <section class="carte bloc fin-niveau fin-niveau--gagne"><p class="fin-niveau__emoji">🏆</p><h2>Défi terminé !</h2><p>Gloire à Dieu pour ces 21 jours. Garde cette habitude, et choisis un nouveau défi.</p>
        <button class="bouton bouton--contour" onClick={() => recommencerDefi(id)}>Recommencer ce défi</button></section>}
      <ol class="sujets">
        {x.jours.map((jr) => {
          const fait = faits.includes(jr.jour);
          return (
            <li class={'carte sujet-priere' + (fait ? ' sujet-priere--fait' : '') + (jr === prochain ? ' defi--prochain' : '')}>
              <button class="sujet-priere__case" aria-pressed={fait} aria-label={fait ? 'Jour vécu' : 'Marquer comme vécu'}
                onClick={() => { cocherDefi(id, jr.jour); if (!fait) { compter('defi-jour', id); if (faits.length === 20) notifier('Défi terminé ! Bravo !'); } }}>{fait ? <Icone nom="verifie" taille={16} /> : jr.jour}</button>
              <div class="sujet-priere__corps">
                <h4>Jour {jr.jour} · {jr.titre}</h4>
                <p><b>Lire :</b> <TexteRefs texte={jr.lecture} /></p>
                <p><b>Faire :</b> {jr.action}</p>
                <p><b>Prier :</b> <TexteRefs texte={jr.priere} /></p>
              </div>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

// Verset de la semaine : on le lit, puis on le récite en masquant progressivement les mots.
export function VersetSemaine() {
  const ref = versetDeLaSemaine(), d = useSignal(disciple), etat = usePassage(ref);
  const [niveau, setNiveau] = useState(0);
  const mots = (etat.texte || '').split(/\s+/);
  const masque = mots.map((m, i) => (niveau && (i * 7 + niveau * 3) % 4 < niveau ? m.replace(/[\p{L}\p{N}]/gu, '_') : m)).join(' ');
  return (
    <div class="page">
      <h2 class="titre-section">Le verset de la semaine</h2>
      <CarteVerset reference={ref} />
      <section class="carte bloc">
        <h3>Apprendre par cœur</h3>
        <p class="ligne__desc">Lis le verset à voix haute trois fois. Puis cache des mots, et récite-le sans regarder.</p>
        {etat.texte && <p class="verset-memoire">« {masque} »</p>}
        <div class="segments" role="group" aria-label="Mots cachés">
          {[['0', 'Tout voir'], ['1', 'Un peu caché'], ['2', 'Bien caché'], ['4', 'Tout caché']].map(([v, l]) => <button aria-pressed={niveau === +v} onClick={() => setNiveau(+v)}>{l}</button>)}
        </div>
        {d.versets[ref] ? <p style="margin-top:12px"><Icone nom="verifie" /> Appris le {dateCourte(d.versets[ref])}.</p>
          : <button class="bouton bouton--or" style="width:100%;margin-top:12px" onClick={() => { marquerVersetAppris(ref); compter('verset-appris'); notifier('Bravo ! Ce verset est dans ton cœur.'); }}>Je le connais par cœur</button>}
      </section>
      {Object.keys(d.versets).length > 0 && <><h2 class="titre-section">Mes versets appris</h2><div class="liste">{Object.keys(d.versets).map((r) => <CarteVerset reference={r} />)}</div></>}
    </div>
  );
}

export function Temoignages() {
  const j = useSignal(journal), t = j.filter((r) => r.exaucee);
  return (
    <div class="page">
      <h2 class="titre-section">Mes témoignages</h2>
      <p class="ligne__desc" style="margin:0 4px 10px">Les prières exaucées de ton journal. Relis-les les jours de doute : « Mon âme, bénis l'Éternel, et n'oublie aucun de ses bienfaits ! » (Psaume 103:2)</p>
      {!t.length && <section class="carte bloc"><p>Pas encore de témoignage. Dans ton journal de prière, quand Dieu répond, appuie sur « Exaucée » et raconte ce qu'il a fait.</p>
        <a class="bouton bouton--contour" href="#/priere/journal">Ouvrir mon journal</a></section>}
      <div class="liste">{t.map((r) => (
        <section class="carte bloc temoignage-carte">
          <p class="ligne__desc">Demandé le {dateCourte(r.date)} · exaucé le {dateCourte(r.exaucee.date)}</p>
          <h3>{r.titre}</h3>
          {r.exaucee.temoignage && <p>{r.exaucee.temoignage}</p>}
        </section>
      ))}</div>
    </div>
  );
}

export function ListeCinq() {
  const d = useSignal(disciple);
  const [prenom, setPrenom] = useState(''), [note, setNote] = useState('');
  const auj = new Date().toISOString().slice(0, 10);
  return (
    <div class="page">
      <h2 class="titre-section">Ma liste des 5</h2>
      <p class="ligne__desc" style="margin:0 4px 10px">Note cinq personnes de ton entourage qui ne connaissent pas encore Jésus. Prie pour elles chaque jour, et cherche une occasion de leur parler de lui. Leurs prénoms restent sur ton téléphone.</p>
      <div class="liste">{d.cinq.map((p) => (
        <section class="carte bloc">
          <h3 style="margin-top:0">{p.prenom}</h3>
          {p.note && <p class="ligne__desc">{p.note}</p>}
          <p class="ligne__desc">Prié {p.prie.length} fois · parlé de Jésus {p.parle.length} fois</p>
          <div class="verset__actions">
            <button class="bouton bouton--petit bouton--plein" disabled={p.prie.includes(auj)} onClick={() => { noterPour(p.id, 'prie'); compter('liste5-prie'); }}>{p.prie.includes(auj) ? 'Prié aujourd\'hui ✓' : 'J\'ai prié pour lui/elle'}</button>
            <button class="bouton bouton--petit bouton--contour" onClick={() => { noterPour(p.id, 'parle'); compter('liste5-parle'); notifier('Que Dieu arrose la semence !'); }}>Je lui ai parlé de Jésus</button>
            <button class="bouton bouton--petit bouton--contour" onClick={() => confirm('Retirer ' + p.prenom + ' de la liste ?') && retirerPersonne(p.id)}>Retirer</button>
          </div>
        </section>
      ))}</div>
      {d.cinq.length < 5 && (
        <form class="carte bloc" onSubmit={(e) => { e.preventDefault(); if (prenom.trim()) { ajouterPersonne(prenom, note); setPrenom(''); setNote(''); } }}>
          <label class="etiquette-champ" for="l5-prenom">Prénom</label>
          <input id="l5-prenom" class="champ" maxLength={40} value={prenom} onInput={(e) => setPrenom(e.currentTarget.value)} />
          <label class="etiquette-champ" for="l5-note">Sujet de prière (facultatif)</label>
          <input id="l5-note" class="champ" maxLength={300} value={note} onInput={(e) => setNote(e.currentTarget.value)} placeholder="Ex. : sa santé, son travail, son cœur…" />
          <button class="bouton bouton--plein" style="width:100%;margin-top:12px" disabled={!prenom.trim()}>Ajouter ({d.cinq.length}/5)</button>
        </form>
      )}
      <a class="carte ligne" href="#/evangeliser" style="margin-top:12px"><span class="ligne__icone"><Icone nom="evangeliser" /></span>
        <span class="ligne__corps"><span class="ligne__titre" style="display:block">Comment leur parler de Jésus ?</span><span class="ligne__desc">Les outils et approches d'évangélisation</span></span><Icone nom="chevron" taille={20} /></a>
    </div>
  );
}
