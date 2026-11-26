import { Banniere } from '../../composants/Banniere.jsx';
import { useState } from 'preact/hooks';
import { Icone } from '../../composants/Icone.jsx';
import { CarteVerset } from '../../composants/Verset.jsx';
import { TexteRefs } from '../../composants/TexteRefs.jsx';
import { BoutonLecture, BoutonTelecharger } from '../../composants/Audio.jsx';
import { notifier } from '../../composants/Notification.jsx';
import { SujetsACocher, GuidePhase, blocsSujets } from './Veille.jsx';
import { SujetsUnParUn } from './SujetsUnParUn.jsx';
import { Accordeon } from '../../composants/Accordeon.jsx';
import { PriereGuidee } from '../../composants/PriereGuidee.jsx';
import { SerieDeVeilles, SemaineDePriere, PrierEnsemble, MesDernieresNotes } from './Veille.jsx';
import { lireEnCours } from '../../donnees/veilleEnCours.js';
import { statistiques } from '../../donnees/priere.js';
import { CYCLE_VEILLES } from '../../donnees/contenu.js';
import { jourDuCycle } from '../../donnees/veilles.js';
import { BarreEcoute } from '../../composants/Ecouter.jsx';
import { PRIERES, COMBAT, VEILLES, AUDIOS, veilleDuMoment } from '../../donnees/contenu.js';
import { aiPrie, noterPriere, journal } from '../../donnees/priere.js';
import { useSignal, useMemoire } from '../../outils/signal.js';
import { partager } from '../../outils/partage.js';

const ENTREES = [
  ['proche', 'prier-pour-un-ami', 'Prier pour un proche', 'Maladie, foyer, enfant, salut d\'un proche : un programme jour après jour.'],
  ['themes', 'prier-famille-repas', 'Prier pour…', 'Ma famille, mon pays, mon église, la repentance, les malades…'],
  ['journal', 'plus-bible-cahier', 'Mon journal et mes demandes', 'Mes requêtes, les réponses de Dieu, et demander la prière.'],
  ['combat', 'prier-eglise-genoux', 'Combat spirituel', 'Des prières à prier avec persévérance, par l\'évangéliste Sophonie Blaise.'],
];

// Ce que chaque veille veut dire, en une phrase : on choisit celle qui convient à l'heure.
const EXPLICATION = {
  'veille-aube': "À faire au réveil. Tu annules la nuit, tu adores, puis tu pries le Notre Père pour ta journée.",
  'veille-midi': "Au milieu de la journée. Tu t'arrêtes, tu fais le point, et tu pries pour tenir bon jusqu'au soir.",
  'veille-soir': "Avant de dormir. Tu fais le bilan, tu pardonnes, tu remercies, et tu déposes ta journée devant Dieu.",
};


// Écran 3 : prier maintenant, thèmes par catégorie, combat spirituel.
export function Priere({ section = null }) {
  const j = useSignal(journal), priees = useSignal(aiPrie), jourC = CYCLE_VEILLES.find((x) => x.numero === jourDuCycle());
  const enCours = lireEnCours(), st = useSignal(statistiques);
  const sujetsSemaine = Array.from({ length: 7 }, (_, i) => { const d = new Date(); d.setDate(d.getDate() - i); return st.sujets?.[d.toISOString().slice(0, 10)] || 0; }).reduce((a, b) => a + b, 0);
  const [ouvert, setOuvert] = useMemoire('categorie', null);       // catégorie dépliée
  const v = veilleDuMoment();
  const categories = [...new Set(PRIERES.map((p) => p.categorie))];
  const enPriere = j.filter((r) => !r.exaucee).length, exaucees = j.length - enPriere;
  return (
    <div class="page">
      {!section && <Banniere image="/assets/photos/banniere-priere.webp" titre="Prière" sous="Approche-toi de Dieu, parle-lui et intercède pour les autres." />}

      {v && !section && (
        <a class="carte prier-maintenant" href={'#/priere/veille/' + v.id.replace('veille-', '')}>
          <img src={v.image} alt="" />
          <span class="prier-maintenant__voile" />
          <span class="prier-maintenant__texte">
            <span class="pastille pastille--or">Prier maintenant · {v.heures}</span>
            <span class="prier-maintenant__titre">{v.titre}</span>
            {jourC && <span class="prier-maintenant__jour">Aujourd'hui : prière pour {jourC.court}</span>}
            <span class="prier-maintenant__bouton"><Icone nom="lecture" taille={18} /> Ouvrir et prier</span>
          </span>
        </a>
      )}

      {!section && enCours && (
        <a class="carte veille-reprise" href={enCours.lien}>
          <span class="ligne__icone"><Icone nom="lecture" /></span>
          <span class="ligne__corps"><b>Tu as laissé ta prière à l'étape {enCours.etape} sur {enCours.total}.</b><span>{enCours.titre} : veux-tu continuer maintenant ?</span></span>
          <Icone nom="chevron" taille={20} />
        </a>)}

      {!section && <>
        <h2 class="titre-section">Les trois veilles</h2>
        <p class="ligne__desc" style="margin:-6px 4px 10px">Chaque jour a son thème de prière. Choisis la veille qui te convient : tu peux prier 7 minutes, 20 minutes ou plus.</p>
        <div class="liste">{VEILLES.map((x) => (
          <a class={'carte theme' + (v && x.id === v.id ? ' theme--maintenant' : '')} href={'#/priere/veille/' + x.id.replace('veille-', '')}>
            <img src={x.image} alt="" loading="lazy" />
            <span class="ligne__corps">
              <span class="ligne__titre" style="display:block">{x.titre}{v && x.id === v.id && <span class="pastille pastille--or pastille--mini">Maintenant</span>}</span>
              <span class="ligne__desc"><b>{x.heures}</b> · {EXPLICATION[x.id]}</span>
            </span>
            <Icone nom="chevron" taille={20} />
          </a>))}</div>
        <a class="carte ligne" href="#/priere/nuit" style="margin-top:8px">
          <span class="ligne__icone"><Icone nom="lune" /></span>
          <span class="ligne__corps"><span class="ligne__titre" style="display:block">Nuit de prière</span><span class="ligne__desc">Veiller avec Dieu, étape par étape, selon le thème de la semaine.</span></span>
          <Icone nom="chevron" taille={20} />
        </a>

        <h2 class="titre-section">Autres façons de prier</h2>
        <div class="liste">
          <a class="carte theme" href="#/priere/jeune">
            <img src="/assets/photos/grandir-notes-lampe.webp" alt="" loading="lazy" />
            <span class="ligne__corps"><span class="ligne__titre" style="display:block">Jeûne et prière</span><span class="ligne__desc">Pourquoi prier et jeûner ensemble (Matthieu 17:21), ton rythme de jeûne, et par où commencer.</span></span>
            <Icone nom="chevron" taille={20} />
          </a>
          {ENTREES.map(([id, photo, titre, desc]) => (
            <a class="carte theme" href={'#/priere/section/' + id}>
              <img src={'/assets/photos/' + photo + '.webp'} alt="" loading="lazy" />
              <span class="ligne__corps"><span class="ligne__titre" style="display:block">{titre}</span><span class="ligne__desc">{desc}</span></span>
              <Icone nom="chevron" taille={20} />
            </a>))}
        </div>

        <h2 class="titre-section">Ma vie de prière</h2>
        <p class="ligne__desc" style="margin:-6px 4px 10px">Ces chiffres sont pour toi seul, sur ton téléphone. Ils ne sont pas là pour t'impressionner, mais pour t'aider à rester fidèle.</p>
        <SerieDeVeilles aiPrie={priees} />
        <section class="carte bloc semaine-carte">
          <h3 style="margin:0 0 8px;font-size:.95rem">Cette semaine</h3>
          <SemaineDePriere aiPrie={priees} />
          <p class="ligne__desc" style="margin:8px 0 0">{sujetsSemaine > 0 ? `${sujetsSemaine} sujet${sujetsSemaine > 1 ? 's' : ''} prié${sujetsSemaine > 1 ? 's' : ''} ces 7 derniers jours.` : "Aucun sujet prié ces 7 derniers jours : commence par une veille courte."}</p>
        </section>
        {v && <PrierEnsemble id={v.id} />}
        <MesDernieresNotes />
      </>}
      {section === 'veilles' && <>
      <h2 class="titre-section" id="p-veilles">{v ? 'Les autres veilles du jour' : 'Les trois veilles du jour'}</h2>
      <div class="liste">
        {VEILLES.filter((x) => x.id !== v?.id).map((x) => (
          <a class={'carte ligne veille-ligne' + (x.id === v?.id ? ' veille-ligne--active' : '')} href={'#/priere/veille/' + x.id.replace('veille-', '')}>
            <span class="ligne__icone"><Icone nom={x.id.endsWith('soir') ? 'lune' : 'soleil'} /></span>
            <span class="ligne__corps"><span class="ligne__titre" style="display:block">{x.titre}</span><span class="ligne__desc">{x.heures} · {x.theme}</span></span>
            <span class="veille-ligne__ouvrir">Ouvrir <Icone nom="chevron" taille={18} /></span>
          </a>
        ))}
      </div>

      <a class="carte ligne" href="#/priere/nuit" style="margin-top:8px">
        <span class="ligne__icone"><Icone nom="lune" /></span>
        <span class="ligne__corps"><span class="ligne__titre" style="display:block">Nuit de prière</span>
          <span class="ligne__desc">Veiller avec Dieu, étape par étape, selon le thème de la semaine.</span></span>
        <span class="veille-ligne__ouvrir">Ouvrir <Icone nom="chevron" taille={18} /></span>
      </a>

      </>}
      {section === 'proche' && <>
      <h2 class="titre-section" id="p-proche">Prier pour un proche</h2>
      <a class="carte theme pq-carte" href="#/priere/pour-quelqu-un">
        <img src="/assets/priere/priere-en-famille.webp" alt="" loading="lazy" />
        <span class="ligne__corps"><span class="ligne__titre" style="display:block">Programmes pour les familles et les couples</span>
          <span class="ligne__desc">Maladie, foyer en crise, enfant prodigue, salut d'un proche, emploi, examen. Écris son prénom : chaque jour, les sujets s'adaptent.</span></span>
        <Icone nom="chevron" taille={20} />
      </a>
      <a class="carte ligne" href="#/grandir/enseignement/jeune-0-troisieme-force" style="margin-top:8px">
        <span class="ligne__icone"><Icone nom="ampoule" /></span>
        <span class="ligne__corps"><span class="ligne__titre" style="display:block">Enseignement : le jeûne</span>
          <span class="ligne__desc">Les cinq jeûnes de la Bible : repentance, consécration, puissance, riposte, intercession.</span></span>
        <Icone nom="chevron" taille={20} />
      </a>

      </>}
      {section === 'themes' && <>
      <h2 class="titre-section" id="p-themes">Prier pour…</h2>
      <p class="ligne__desc" style="margin:-4px 4px 8px">Touche un thème pour voir ses sujets de prière.</p>
      {categories.map((c) => {
        const liste = PRIERES.filter((p) => p.categorie === c), deplie = ouvert === c || liste.length <= 2;
        if (liste.length === 1) return (
          <section class="categorie-priere">
            <a class="categorie-priere__tete" href={'#/priere/theme/' + liste[0].id}>
              <span>{c}</span><span class="onglets-internes__nb">1</span><span class="categorie-priere__voir">Ouvrir</span><Icone nom="chevron" taille={18} />
            </a>
          </section>
        );
        return (
          <section class="categorie-priere">
            <button class="categorie-priere__tete" aria-expanded={deplie} onClick={() => setOuvert(ouvert === c ? null : c)}>
              <span>{c}</span><span class="onglets-internes__nb">{liste.length}</span><span class="categorie-priere__voir">{deplie ? 'Masquer' : 'Voir'}</span><Icone nom="chevron" taille={18} class={deplie ? 'tourne' : ''} />
            </button>
            {deplie && <div class="liste">{liste.map((p) => <CarteTheme p={p} lien={'#/priere/theme/' + p.id} />)}</div>}
          </section>
        );
      })}

      </>}
      {section === 'journal' && <>
      <h2 class="titre-section" id="p-journal">Mon journal et mes demandes</h2>
      <a class="carte ligne journal-lien" href="#/priere/journal">
        <span class="ligne__icone"><Icone nom="note" /></span>
        <span class="ligne__corps"><span class="ligne__titre" style="display:block">Mon journal de prière</span>
          <span class="ligne__desc">{j.length ? `${enPriere} en prière · ${exaucees} exaucée${exaucees > 1 ? 's' : ''}` : 'Écris tes requêtes et note les réponses de Dieu.'}</span></span>
        <Icone nom="chevron" taille={20} />
      </a>
      <a class="carte ligne journal-lien" href="#/priere/demander" style="margin-top:8px">
        <span class="ligne__icone"><Icone nom="priere" /></span>
        <span class="ligne__corps"><span class="ligne__titre" style="display:block">Demander la prière</span>
          <span class="ligne__desc">Confie ton sujet à l'équipe de Yeshaya, nous prierons pour toi.</span></span>
        <Icone nom="chevron" taille={20} />
      </a>

      </>}
      {section === 'combat' && <>
      <h2 class="titre-section" id="p-combat">Combat spirituel</h2>
      <p class="ligne__desc" style="margin:-4px 4px 8px">Des fiches de prière à prier avec persévérance. Rédigées par l'évangéliste Sophonie Blaise, ministère AJ (Amoureux de Jésus), et publiées avec son autorisation.</p>
      <div class="grille-combat">
        {COMBAT.map((c) => (
          <a class="carte combat-tuile" href={'#/priere/combat/' + c.id}><span class="combat-tuile__emoji" aria-hidden="true">{c.emoji}</span><span>{c.titre}</span></a>
        ))}
      </div>
      </>}
    </div>
  );
}

function CarteTheme({ p, lien }) {
  return (
    <a class="carte theme" href={lien}>
      <img src={p.image} alt="" loading="lazy" />
      <span class="ligne__corps">
        <span class="ligne__titre" style="display:block">{p.nom_court || p.titre} {p.exemple && <span class="etiquette-exemple">EXEMPLE</span>}</span>
        <span class="ligne__desc">{p.nom_court ? p.titre : p.resume}</span>
      </span>
      <Icone nom="chevron" taille={20} />
    </a>
  );
}

function PiedPriere({ id, titre, texte, chemin }) {
  const fois = useSignal(aiPrie)[id] || [];
  return (
    <>
      <button class="bouton bouton--or j-ai-prie" onClick={() => { noterPriere(id); notifier('Merci ! Dieu entend ta prière.'); }}>
        <Icone nom="verifie" taille={20} /> J'ai prié</button>
      <p class="ligne__desc" style="text-align:center;margin-top:6px">
        {fois.length ? `Tu as prié pour ce sujet ${fois.length} fois. La dernière fois : ${new Date(fois[fois.length - 1]).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}.` : 'Prends le temps de prier, à ton rythme.'}
      </p>
      <div class="verset__actions" style="justify-content:center;margin-top:10px">
        <a class="bouton bouton--contour bouton--petit" href="#/priere/journal?nouveau=1"><Icone nom="note" taille={18} /> Ajouter à mon journal</a>
        <button class="bouton bouton--contour bouton--petit" onClick={() => partager({ titre, texte, chemin })}><Icone nom="partager" taille={18} /> Partager</button>
      </div>
    </>
  );
}

// Écran 4 : page d'un thème de prière, organisée selon les phases du Notre Père.
export function ThemePriere({ id, guide }) {
  const p0 = PRIERES.find((x) => x.id === id);
  // Bulletins adaptables : le nom de la ville ou de la localité remplace « {lieu} » dans les sujets.
  const [lieu, setLieu] = useState(() => { try { return localStorage.getItem('yeshaya:lieu-' + id) || ''; } catch { return ''; } });
  if (!p0) return <div class="page"><p class="ligne__desc">Thème introuvable.</p></div>;
  const nomLieu = lieu.trim() || 'notre ville';
  const p = p0.lieu_modifiable ? JSON.parse(JSON.stringify(p0).replaceAll('{lieu}', JSON.stringify(nomLieu).slice(1, -1))) : p0;
  const piste = AUDIOS[p.id];
  const tous = p.phases ? p.phases.flatMap((ph) => ph.sujets) : p.sujets || [];
  return (
    <div class="page">
      <div class="theme-hero">
        <img src={p.image} alt="" />
        <div class="theme-hero__texte"><span class="pastille pastille--or">{p.categorie}</span><h2>{p.titre}</h2></div>
      </div>
      {p.exemple && <p style="margin:8px 4px 0"><span class="etiquette-exemple">EXEMPLE</span> Contenu de démonstration.</p>}
      {p0.lieu_modifiable && <section class="carte bloc lieu-priere">
        <label class="ligne__titre" for="lieu">Pour quelle ville ou localité pries-tu ?</label>
        <input id="lieu" class="champ" value={lieu} maxLength={60} placeholder="Ex. : Bafoussam, Douala, mon quartier…" onInput={(e) => { const v = e.currentTarget.value; setLieu(v); try { localStorage.setItem('yeshaya:lieu-' + id, v); } catch {} }} />
        <p class="ligne__desc" style="margin:6px 0 0">Le nom sera repris dans chaque sujet de prière{lieu.trim() ? ` : « ${nomLieu} »` : ''}.</p>
      </section>}
      <PriereGuidee auto={guide} id={p.id} titre={p.titre} introduction={p.enseignement} etapes={p.phases ? p.phases.map((ph) => ({ titre: ph.titre, sujets: ph.sujets })) : [{ titre: p.titre, sujets: p.sujets }]} />
      {(p.enseignement || piste) && (
        <section class="carte bloc">
          <h3><span class="ligne__icone"><Icone nom="ampoule" /></span> Enseignement</h3>
          {p.enseignement && <p><TexteRefs texte={p.enseignement} /></p>}
          {piste && (
            <div class="bloc__audio">
              <BoutonLecture piste={piste} taille={44} />
              <a class="ligne__corps" href={'#/ecouter/' + piste.id}><span class="ligne__titre" style="display:block">Écouter l'enseignement</span>
                <span class="ligne__desc">{piste.auteur}{piste.duree ? ' · ' + piste.duree : ''}</span></a>
              <BoutonTelecharger piste={piste} compact />
            </div>
          )}
        </section>
      )}
      {p.enseignement_lie && <a class="carte ligne" href={'#/grandir/enseignement/' + p.enseignement_lie} style="margin-top:10px">
        <span class="ligne__icone"><Icone nom="ampoule" /></span>
        <span class="ligne__corps"><span class="ligne__titre" style="display:block">Écouter d'abord le message</span>
          <span class="ligne__desc">« Dieu s'étonne que personne n'intercède » · 16 min</span></span>
        <Icone nom="chevron" taille={20} />
      </a>}
      {p.chaine && <section class="carte bloc"><h3><span class="ligne__icone"><Icone nom="calendrier" /></span> {p.chaine.titre}</h3><p>{p.chaine.texte}</p></section>}
      {p.versets?.length > 0 && <><h2 class="titre-section">Versets clés</h2><div class="liste">{p.versets.map((r) => <CarteVerset reference={r} />)}</div></>}

      {p.phases ? (() => { let k = 0; const debuts = p.phases.map((ph) => { const d = k + 1; k += ph.sujets.length + 1; return d; }); return (
        <>
          <p class="guide-phase" style="margin-top:14px"><Icone nom="info" taille={18} /><span>Touche une phase pour l'ouvrir. Les sujets suivent le <b>Notre Père</b> (Matthieu 6:9-13) : une consigne à la fois, tu pries, puis tu touches la flèche.</span></p>
          <Accordeon mention="Touche pour prier" volets={p.phases.map((ph, j) => ({ id: j, titre: `${ph.num}. ${ph.titre}`, icone: 'priere',
            contenu: <><GuidePhase num={ph.num} /><SujetsUnParUn sujets={ph.sujets} voixId={`${p.id}-ph${j}`} intro={ph.titre + '.'} /></> }))} />
        </>); })() : (
        <><h2 class="titre-section">Sujets de prière</h2>
          <SujetsUnParUn sujets={p.sujets} voixId={p.id} intro={p.titre + '.'} /></>
      )}
      {p.priere && <section class="carte bloc priere-modele"><h3><span class="ligne__icone"><Icone nom="priere" /></span> Prière</h3><p><em>{p.priere}</em></p></section>}
      <PiedPriere id={p.id} titre={p.titre} chemin={'priere/theme/' + p.id}
        texte={`Prions ensemble : ${p.titre}\n\n${tous.slice(0, 8).map((s) => '• ' + (s.titre || s.texte)).join('\n')}`} />
      {p.source && <p class="source-mention">Source : {p.auteur}</p>}
    </div>
  );
}

// Fiche de combat spirituel.
export function FicheCombat({ id, guide }) {
  const c = COMBAT.find((x) => x.id === id);
  if (!c) return <div class="page"><p class="ligne__desc">Fiche introuvable.</p></div>;
  return (
    <div class="page">
      <div class="bandeau-titre"><span class="combat-emoji" aria-hidden="true">{c.emoji}</span><div><h2>{c.titre}</h2><p>Combat spirituel · {c.sujets.length} sujets · {c.auteur}{c.ministere ? ', ' + c.ministere : ''}</p></div></div>
      <PriereGuidee auto={guide} id={c.id} titre={c.titre} introduction={c.introduction} etapes={[{ titre: c.titre, sujets: c.sujets }]} />
      {c.introduction && <section class="carte bloc"><p><TexteRefs texte={c.introduction} /></p></section>}
      {c.versets.length > 0 && <><h2 class="titre-section">Versets de base</h2><div class="liste">{c.versets.map((r) => <CarteVerset reference={r} />)}</div></>}
      <h2 class="titre-section">À prier</h2>
      <p class="guide-phase"><Icone nom="info" taille={18} /><span>Prie chaque point avec foi, à voix haute si possible. Remplace « [...] » par les noms des personnes concernées.</span></p>
      <SujetsUnParUn sujets={c.sujets} voixId={c.id} intro={c.titre + '.'} />
      <PiedPriere id={c.id} titre={c.titre} chemin={'priere/combat/' + c.id} texte={`${c.titre}\n\n${c.sujets.slice(0, 6).map((s, i) => `${i + 1}. ${s.texte}`).join('\n')}`} />
      <p class="source-mention">{c.source || 'Source : ' + c.auteur}</p>
    </div>
  );
}
