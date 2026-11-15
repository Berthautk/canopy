import { useEffect, useState } from 'preact/hooks';
import { Icone } from '../../composants/Icone.jsx';
import { lireAVoixHaute, arreterVoix } from '../../audio/voix.js';
import { lireReference } from '../../bible/references.js';
import { melanger } from '../../jeux/hasard.js';

// « Le Tribunal de la Parole » : jeu de groupe sur un seul téléphone.
// Tous reçoivent en secret le même personnage biblique, sauf l'imposteur qui ne connaît que le thème.
// Chacun donne un indice à voix haute, puis on vote pour démasquer l'imposteur.
const PERSONNAGES = [
  ['Les patriarches', [['Abraham', 'Gn 12:1-4'], ['Isaac', 'Gn 22:1-14'], ['Jacob', 'Gn 28:10-17'], ['Joseph', 'Gn 37:3-28'], ['Noé', 'Gn 6:13-22']]],
  ['Les rois', [['David', '1 S 17:45-50'], ['Salomon', '1 R 3:5-12'], ['Saül', '1 S 15:22-23'], ['Ézéchias', '2 R 19:14-19'], ['Josias', '2 R 22:1-2']]],
  ['Les prophètes', [['Élie', '1 R 18:36-39'], ['Élisée', '2 R 2:9-14'], ['Jonas', 'Jon 1:1-3'], ['Daniel', 'Dn 6:10-22'], ['Ésaïe', 'És 6:1-8'], ['Jérémie', 'Jé 1:4-10']]],
  ['Les femmes de la Bible', [['Ruth', 'Rt 1:16-17'], ['Esther', 'Est 4:14-16'], ['Marie, mère de Jésus', 'Lc 1:30-38'], ['Débora', 'Jg 4:4-9'], ['Anne', '1 S 1:10-20'], ['Rahab', 'Jos 2:1-14']]],
  ['Les disciples et apôtres', [['Pierre', 'Mt 16:15-18'], ['Jean', 'Jn 19:25-27'], ['Paul', 'Ac 9:1-6'], ['Thomas', 'Jn 20:24-29'], ['Matthieu', 'Mt 9:9'], ['Barnabas', 'Ac 4:36-37']]],
  ['Les juges et les chefs', [['Moïse', 'Ex 3:1-10'], ['Josué', 'Jos 1:1-9'], ['Gédéon', 'Jg 6:11-16'], ['Samson', 'Jg 16:25-30'], ['Samuel', '1 S 3:1-10']]],
];
const dire = (t) => lireAVoixHaute('tribunal', [{ texte: t }]);

export function Tribunal() {
  const [noms, setNoms] = useState(['', '', '']);
  const [partie, setPartie] = useState(null);
  useEffect(() => () => arreterVoix(), []);

  const lancer = () => {
    const joueurs = noms.map((n, i) => n.trim() || `Joueur ${i + 1}`);
    const [theme, liste] = PERSONNAGES[Math.floor(Math.random() * PERSONNAGES.length)];
    const [nom, ref] = melanger(liste)[0];
    setPartie({ joueurs, theme, nom, ref, imposteur: Math.floor(Math.random() * joueurs.length), tour: 0, vu: false, phase: 'secret', vote: null, premier: Math.floor(Math.random() * joueurs.length) });
    dire(`Chacun va regarder son rôle en secret. Passe le téléphone à ${joueurs[0]}.`);
  };

  if (!partie) return (
    <div class="page">
      <div class="tribunal-tete"><span aria-hidden="true">⚖️</span><h2>Le Tribunal de la Parole</h2>
        <p>De 3 à 8 joueurs, sur un seul téléphone. Tous reçoivent en secret le même personnage de la Bible, sauf un : <b>l'imposteur</b>, qui ne connaît que le thème. Chacun donne un indice à voix haute, sans dire le nom. Puis on vote pour démasquer l'imposteur.</p></div>
      <div class="liste">
        {noms.map((n, i) => <div class="carte duel__joueur"><span class="duel__num">{i + 1}</span>
          <input class="champ" value={n} placeholder={`Prénom du joueur ${i + 1}`} onInput={(e) => setNoms(noms.map((x, k) => (k === i ? e.target.value : x)))} />
          {noms.length > 3 && <button class="entete__btn" style="color:var(--texte-doux)" aria-label="Retirer" onClick={() => setNoms(noms.filter((_, k) => k !== i))}><Icone nom="fermer" taille={18} /></button>}</div>)}
      </div>
      {noms.length < 8 && <button class="bouton bouton--contour" style="width:100%;margin-top:10px" onClick={() => setNoms([...noms, ''])}>+ Ajouter un joueur</button>}
      <button class="bouton bouton--or" style="width:100%;margin-top:12px" onClick={lancer}>⚖️ Commencer</button>
    </div>
  );

  const p = partie, maj = (x) => setPartie({ ...p, ...x });
  if (p.phase === 'secret') {
    const j = p.joueurs[p.tour], imp = p.tour === p.imposteur;
    return (
      <div class="page tribunal">
        <p class="quiz__compteur">Rôle {p.tour + 1} / {p.joueurs.length}</p>
        {!p.vu ? <div class="carte tribunal-secret">
          <p>Donne le téléphone à</p><h2>{j}</h2><p class="ligne__desc">Les autres ne regardent pas !</p>
          <button class="bouton bouton--or" onClick={() => maj({ vu: true })}>👁 Voir mon rôle</button></div>
        : <div class={'carte tribunal-secret ' + (imp ? 'tribunal-secret--imp' : '')}>
          {imp ? <><p>Tu es</p><h2>🎭 l'imposteur</h2><p>Le thème est : <b>{p.theme}</b>.</p><p class="ligne__desc">Écoute bien les autres et fais semblant de savoir !</p></>
            : <><p>Ton personnage est</p><h2>{p.nom}</h2><p class="ligne__desc">Thème : {p.theme}. Ne dis jamais son nom.</p></>}
          <button class="bouton bouton--plein" onClick={() => {
            if (p.tour + 1 < p.joueurs.length) { maj({ tour: p.tour + 1, vu: false }); dire(`Passe le téléphone à ${p.joueurs[p.tour + 1]}.`); }
            else { maj({ phase: 'indices' }); dire(`Tout le monde connaît son rôle. Le thème est : ${p.theme}. ${p.joueurs[p.premier]} commence. Chacun à son tour donne un indice sur le personnage, sans dire son nom. Faites deux tours, puis votez.`); } }}>
            J'ai vu, je cache ✓</button></div>}
      </div>);
  }
  if (p.phase === 'indices') return (
    <div class="page tribunal">
      <div class="carte tribunal-secret"><p>Thème</p><h2>{p.theme}</h2>
        <p>Chacun à son tour, en commençant par <b>{p.joueurs[p.premier]}</b>, donne <b>un indice à voix haute</b> sur le personnage, sans dire son nom.</p>
        <p class="ligne__desc">Faites deux tours. Ensuite, votez.</p>
        <button class="bouton bouton--or" onClick={() => { maj({ phase: 'vote' }); dire('Qui est l\'imposteur ? Discutez, puis touchez le nom de celui que vous accusez.'); }}>⚖️ Passer au vote</button></div>
    </div>);
  if (p.phase === 'vote') return (
    <div class="page tribunal">
      <p class="jouer-intro" style="margin-top:12px">Qui est l'imposteur ? Mettez-vous d'accord et touchez son nom.</p>
      <div class="qsj-choix">{p.joueurs.map((j, i) => <button class="carte choix choix--centre" onClick={() => {
        const juste = i === p.imposteur; maj({ phase: 'verdict', vote: i });
        dire(juste ? `Bravo ! ${j} était bien l'imposteur. Le personnage était ${p.nom}.` : `Non ! ${j} était innocent. L'imposteur était ${p.joueurs[p.imposteur]}. Le personnage était ${p.nom}.`); }}>{j}</button>)}</div>
    </div>);
  const juste = p.vote === p.imposteur;
  return (
    <div class="page tribunal">
      <div class={'carte tribunal-secret ' + (juste ? '' : 'tribunal-secret--imp')}>
        <p>{juste ? '🎉 Imposteur démasqué !' : '🎭 L\'imposteur a gagné !'}</p>
        <h2>{p.joueurs[p.imposteur]}</h2><p>était l'imposteur. Le personnage était <b>{p.nom}</b>.</p>
        <a class="bouton bouton--contour" href={lien(p.ref)}>📖 Lire son histoire ({p.ref})</a>
        <p class="ligne__desc" style="margin-top:8px">Si l'imposteur devine le personnage maintenant, il gagne quand même un point !</p>
        <button class="bouton bouton--or" onClick={lancer}>⚖️ Nouvelle partie</button>
      </div>
    </div>);
}

function lien(ref) { const r = lireReference(ref); return r ? `#/bible/lire/${r.code}/${r.c}/${r.v || 1}` : '#/bible'; }
