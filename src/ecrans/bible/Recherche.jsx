import { useEffect, useState } from 'preact/hooks';
import { Icone } from '../../composants/Icone.jsx';
import { lireReference, ecrireReference, simplifier } from '../../bible/references.js';
import { chercherMot } from '../../bible/bible.js';
import { remplacer, aller } from '../../outils/routeur.js';

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

  useEffect(() => {
    setQ(qInitial);
    if (!qInitial.trim() || lireReference(qInitial)) { setRes(null); return; }
    let actif = true; setEncours(true);
    chercherMot(qInitial).then((r) => { if (actif) { setRes(r); setEncours(false); } });
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

      {encours && <p class="verset__attente" style="margin-top:16px">Recherche dans toute la Bible…</p>}
      {res?.erreur && <p class="verset__erreur">{res.erreur}</p>}
      {res && !res.erreur && !encours && (
        <>
          <div class="resultats__tete">
            <h2>Résultats pour « {qInitial} »</h2>
            <span class="pastille pastille--or">{res.total} verset{res.total > 1 ? 's' : ''}</span>
          </div>
          {res.total > res.resultats.length && <p class="ligne__desc">Les {res.resultats.length} premiers sont affichés. Ajoutez un mot pour préciser.</p>}
          {res.total === 0 && <p class="ligne__desc">Aucun verset ne contient ce mot. Vérifiez l'orthographe ou essayez un mot proche.</p>}
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
          <p class="ligne__desc" style="margin-top:10px">Astuce : tapez « Rom 8 », « 1 Co 13 » ou « Ps 23 » pour aller directement au passage. Les accents ne sont pas obligatoires.</p>
        </section>
      )}
    </div>
  );
}
