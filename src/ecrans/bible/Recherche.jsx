import { useEffect, useState } from 'preact/hooks';
import { Icone } from '../../composants/Icone.jsx';
import { lireReference, ecrireReference, simplifier } from '../../bible/references.js';
import { chercherMot } from '../../bible/bible.js';
import { remplacer, aller } from '../../outils/routeur.js';
import { THEMES_BIBLE } from '../../donnees/contenu.js';
import { usePassage, cheminLire } from '../../composants/Verset.jsx';

// Un thème correspond-il à la recherche ? (« évangélisation », « pauvres », « argent »…)
export function trouverTheme(q) {
  const s = simplifier(q.trim());
  if (s.length < 3) return null;
  return THEMES_BIBLE.find((t) => simplifier(t.nom) === s || t.cles.some((c) => { const k = simplifier(c); return k === s || (s.length >= 5 && (k.startsWith(s) || (s.startsWith(k) && k.length >= 5))); })) || null;
}

function PassageCle({ reference }) {
  const e = usePassage(reference);
  if (!e.ref) return null;
  return (
    <a class="carte resultat" href={'#/' + cheminLire(e.ref)}>
      <span class="resultat__ref">{ecrireReference(e.ref)}</span>
      <span class="resultat__texte">{e.texte ? (e.texte.length > 260 ? e.texte.slice(0, 260) + '…' : e.texte) : e.erreur || '…'}</span>
    </a>
  );
}

const POPULAIRES = ['salut', 'paix', 'amour', 'foi', 'pardon', 'prière', 'espérance', 'Jn 3 16', 'Ps 23'];

// Surligne les mots trouvés, sans tenir compte des accents.
function Surligne({ texte, mots }) {
  if (!mots?.length) return texte;
  // caractère par caractère : même longueur que le texte d'origine, pour surligner au bon endroit
  const simple = [...texte].map((ch) => ch.normalize('NFD')[0].toLowerCase().replace('’', "'")).join('');
  const morceaux = []; let i = 0;
  const re = new RegExp(`(^|[^a-z0-9])(${mots.map((m) => m.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})[a-z]*`, 'g');
  for (const m of simple.matchAll(re)) {
    const debut = m.index + m[1].length, fin = m.index + m[0].length;
    if (debut > i) morceaux.push(texte.slice(i, debut));
    morceaux.push(<mark>{texte.slice(debut, fin)}</mark>); i = fin;
  }
  morceaux.push(texte.slice(i));
  return morceaux;
}

// Écran 17 : un seul champ, pour une référence (« Jn 3 16 ») ou des mots (« paix »).
export function Recherche({ q: qInitial = '' }) {
  const [q, setQ] = useState(qInitial);
  const [res, setRes] = useState(null);
  const [encours, setEncours] = useState(false);
  const ref = q.trim() ? lireReference(q) : null;
  const theme = qInitial ? trouverTheme(qInitial) : null;

  useEffect(() => {
    setQ(qInitial);
    if (!qInitial.trim() || lireReference(qInitial)) { setRes(null); return; }
    let actif = true; setEncours(true);
    const t = trouverTheme(qInitial);
    chercherMot(qInitial, 300, t ? [...new Set([simplifier(qInitial.trim()), ...t.mots])] : null).then(async (r) => {
      // Aucun verset avec ce mot exact : on essaie la racine du mot (« polygamie » → « polyg… »).
      const q0 = simplifier(qInitial.trim());
      if (!t && r.total === 0 && q0.length > 5 && !q0.includes(' ')) { const r2 = await chercherMot(q0.slice(0, Math.max(4, q0.length - 3))); if (r2.total) r = { ...r2, racine: true }; }
      if (actif) { setRes(r); setEncours(false); }
    });
    return () => { actif = false; };
  }, [qInitial]);

  const valider = (e) => {
    e?.preventDefault();
    const t = q.trim(); if (!t) return;
    const r = lireReference(t);
    if (r) aller(`bible/lire/${r.code}/${r.c}${r.v ? '/' + r.v : ''}`);
    else remplacer('bible/recherche?q=' + encodeURIComponent(t));
  };

  return (
    <div class="page">
      <form class="barre-recherche barre-recherche--active" onSubmit={valider} role="search">
        <Icone nom="recherche" taille={20} />
        <input class="barre-recherche__champ" type="search" value={q} onInput={(e) => setQ(e.currentTarget.value)} autoFocus={!qInitial}
          placeholder="Mot ou référence" aria-label="Rechercher dans la Bible" enterkeyhint="search" />
        <button class="bouton bouton--or bouton--petit" type="submit">Chercher</button>
      </form>

      {ref && (
        <a class="carte ligne aller-ref" href={`#/bible/lire/${ref.code}/${ref.c}${ref.v ? '/' + ref.v : ''}`}>
          <span class="ligne__icone"><Icone nom="bible" /></span>
          <span class="ligne__corps"><span class="ligne__desc" style="display:block">Aller au passage</span>
            <span class="ligne__titre">{ecrireReference(ref)}</span></span>
          <Icone nom="chevron" taille={20} />
        </a>
      )}

      {theme && (
        <section class="theme-recherche">
          <div class="resultats__tete"><h2>Thème : {theme.nom}</h2><span class="pastille pastille--or">{theme.versets.length} passages clés</span></div>
          <p class="ligne__desc" style="margin:0 4px 8px">Les passages essentiels sur ce thème, puis tous les versets qui en parlent (mots de la même famille et mots proches).</p>
          <div class="liste">{theme.versets.map((r) => <PassageCle reference={r} />)}</div>
        </section>
      )}

      {encours && <p class="verset__attente" style="margin-top:16px">Recherche dans toute la Bible…</p>}
      {res?.erreur && <p class="verset__erreur">{res.erreur}</p>}
      {res && !res.erreur && !encours && (
        <>
          <div class="resultats__tete">
            <h2>{theme ? 'Tous les versets sur ce thème' : <>Résultats pour « {qInitial} »</>}</h2>
            <span class="pastille pastille--or">{res.total} verset{res.total > 1 ? 's' : ''}</span>
          </div>
          {theme && <p class="ligne__desc">Mots recherchés : {theme.mots.join(', ')}…</p>}
          {res.total > res.resultats.length && <p class="ligne__desc">Les {res.resultats.length} {theme ? 'plus proches du thème' : 'premiers'} sont affichés.{theme ? '' : ' Ajoutez un mot pour préciser.'}</p>}
          {res.racine && <p class="ligne__desc">Aucun verset ne contient ce mot exact : voici les versets avec des mots de la même famille.</p>}
          {res.total === 0 && <p class="ligne__desc">Aucun verset ne contient ce mot. Essayez un mot proche, ou choisissez un thème ci-dessous.</p>}
          {res.total === 0 && <div class="puces" style="margin-top:8px">{THEMES_BIBLE.map((t) => <button class="puce" onClick={() => remplacer('bible/recherche?q=' + encodeURIComponent(t.nom))}>{t.nom}</button>)}</div>}
          <div class="liste">
            {res.resultats.map((x) => (
              <a class="carte resultat" href={`#/bible/lire/${x.code}/${x.c}/${x.v}`}>
                <span class="resultat__ref">{ecrireReference(x)}</span>
                <span class="resultat__texte"><Surligne texte={x.texte.replace(/\n/g, ' ')} mots={res.mots} /></span>
              </a>
            ))}
          </div>
        </>
      )}

      {!qInitial && !ref && (
        <section class="carte populaires">
          <h3>Recherches fréquentes</h3>
          <div class="puces">
            {POPULAIRES.map((p) => <button class="puce" onClick={() => { setQ(p); const r = lireReference(p); r ? aller(`bible/lire/${r.code}/${r.c}${r.v ? '/' + r.v : ''}`) : remplacer('bible/recherche?q=' + encodeURIComponent(p)); }}>{p}</button>)}
          </div>
          <h3 style="margin-top:14px">Chercher par thème</h3>
          <div class="puces">
            {THEMES_BIBLE.map((t) => <button class="puce" onClick={() => { setQ(t.nom); remplacer('bible/recherche?q=' + encodeURIComponent(t.nom)); }}>{t.nom}</button>)}
          </div>
          <p class="ligne__desc" style="margin-top:10px">Astuce : tapez « Rom 8 », « 1 Co 13 » ou « Ps 23 » pour aller directement au passage. Les accents ne sont pas obligatoires.</p>
        </section>
      )}
    </div>
  );
}
