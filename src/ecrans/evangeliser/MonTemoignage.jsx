import { useState, useEffect } from 'preact/hooks';
import { get, set } from 'idb-keyval';
import { Icone } from '../../composants/Icone.jsx';
import { CarteVerset } from '../../composants/Verset.jsx';
import { BarreEcoute } from '../../composants/Ecouter.jsx';
import { partager } from '../../outils/partage.js';

const CLE = 'yeshaya:mon-temoignage';
const PARTIES = [
  { cle: 'avant', titre: '1. Ma vie avant Jésus', aide: "Comment était ta vie avant de connaître Jésus ? Ce que tu cherchais, ce qui te manquait, ce qui te pesait (peur, vide, colère, dépendance, religion sans vie…). Reste simple et honnête, sans glorifier le péché ni donner trop de détails.", exemple: "Pendant des années, j'allais à l'église, mais au fond de moi j'étais vide. J'avais peur de la mort et j'étais souvent en colère contre tout le monde." },
  { cle: 'rencontre', titre: '2. Comment j\'ai rencontré Jésus', aide: "Comment as-tu compris que tu avais besoin de Jésus ? Qui t'a parlé, quel verset t'a touché ? Qu'as-tu fait : repentance, prière, décision ? Explique clairement l'Évangile : le péché, la croix, la foi.", exemple: "Un collègue m'a lu Jean 3:16. J'ai compris que Jésus était mort pour moi. Ce soir-là, j'ai demandé pardon à Dieu et j'ai reçu Jésus dans mon cœur." },
  { cle: 'apres', titre: '3. Ma vie depuis', aide: "Qu'est-ce qui a changé ? La paix, le pardon, la délivrance, une nouvelle famille… Sois réaliste : la vie chrétienne n'est pas sans difficultés, mais Jésus est avec toi. Termine par une question pour la personne.", exemple: "Depuis, j'ai la paix. Je n'ai plus peur de la mort, parce que je sais où je vais. Et toi, est-ce que tu as déjà pensé à ce que Jésus peut faire dans ta vie ?" },
];
const mots = (t) => (t || '').split(/\s+/).filter(Boolean).length;

// Atelier : écrire son témoignage en trois parties (avant, rencontre, après), l'écouter et le partager.
export function MonTemoignage() {
  const [t, setT] = useState({ avant: '', rencontre: '', apres: '' });
  const [charge, setCharge] = useState(false);
  useEffect(() => { get(CLE).then((x) => { if (x) setT(x); setCharge(true); }).catch(() => setCharge(true)); }, []);
  const maj = (k, v) => { const n = { ...t, [k]: v }; setT(n); set(CLE, n).catch(() => {}); };
  const total = mots(t.avant) + mots(t.rencontre) + mots(t.apres);
  const minutes = total / 130;
  const texte = PARTIES.map((p) => t[p.cle].trim()).filter(Boolean).join('\n\n');
  return (
    <div class="page">
      <div class="theme-hero"><img src="/assets/temoignage/temoignage-au-micro.webp" alt="" />
        <div class="theme-hero__texte"><span class="pastille pastille--or">Atelier · 3 minutes</span><h2>Mon témoignage</h2></div></div>
      <BarreEcoute id="atelier-temoignage" titre="Écouter les conseils" blocs={[
        { texte: "Ton témoignage, c'est l'histoire de ce que Jésus a fait dans ta vie. Personne ne peut le contester, parce que c'est ton histoire. L'apôtre Paul a raconté son témoignage devant le roi Agrippa en trois temps : sa vie avant, sa rencontre avec Jésus, et sa vie depuis." },
        { texte: "Écris ton témoignage en trois parties, pour qu'il dure environ trois minutes. Évite les mots d'église que les gens ne comprennent pas. Parle de Jésus, pas seulement de toi. Et termine par une question qui invite la personne à réfléchir." },
        ...PARTIES.map((p) => ({ texte: `${p.titre}. ${p.aide}` })),
      ]} />
      <p class="guide-phase" style="margin-top:12px"><Icone nom="info" taille={18} /><span>Ce que tu écris reste sur ton téléphone. Vise environ 400 mots : trois minutes, le temps d'un trajet ou d'un café.</span></p>
      {PARTIES.map((p) => (
        <section class="carte bloc">
          <h3 style="margin-top:0">{p.titre}</h3>
          <p class="ligne__desc">{p.aide}</p>
          <p class="ligne__desc"><i>Exemple : « {p.exemple} »</i></p>
          <textarea class="champ champ--zone" rows={5} value={t[p.cle]} disabled={!charge} placeholder="Écris ici…" onInput={(e) => maj(p.cle, e.currentTarget.value)} />
          <p class="ligne__desc" style="text-align:right;margin:4px 0 0">{mots(t[p.cle])} mots</p>
        </section>
      ))}
      <section class="carte bloc" style="text-align:center">
        <p style="margin:0"><b>{total} mots</b> · environ {minutes < 1 ? 'moins d\'une minute' : Math.round(minutes * 10) / 10 + ' min'} à l'oral</p>
        {minutes > 4 && <p class="ligne__desc">Un peu long : essaie de garder l'essentiel pour rester autour de trois minutes.</p>}
      </section>
      {texte && <BarreEcoute id="mon-temoignage" titre="Écouter mon témoignage" blocs={PARTIES.map((p) => ({ texte: t[p.cle] || ' ' }))} />}
      {texte && <button class="bouton bouton--contour" style="width:100%;margin-top:10px" onClick={() => partager({ titre: 'Mon témoignage', texte, chemin: 'evangeliser' })}><Icone nom="partager" taille={18} /> Partager mon témoignage</button>}
      <h2 class="titre-section">Pour t'inspirer</h2>
      <div class="liste">{['Ac 26:9-18', 'Mc 5:19', '1 P 3:15', 'Ap 12:11'].map((r) => <CarteVerset reference={r} />)}</div>
    </div>
  );
}
