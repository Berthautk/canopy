import { useEffect, useRef, useState } from 'preact/hooks';
import { Icone } from '../../composants/Icone.jsx';
import { notifier } from '../../composants/Notification.jsx';
import { chargerLivre } from '../../bible/bible.js';
import { PAR_CODE, LIVRES, cleVerset, ecrireReference, lireReference } from '../../bible/references.js';
import { annotations, COULEURS, surligner, basculerFavori, ecrireNote, memoriserPosition } from '../../donnees/annotations.js';
import { useSignal } from '../../outils/signal.js';
import { partager, copier } from '../../outils/partage.js';
import { aller, remplacer } from '../../outils/routeur.js';
import { BarreEcoute, useVoixActive } from '../../composants/Ecouter.jsx';

// Pile des passages quittés (pour « Revenir à… ») : on peut aller voir une autre référence, puis revenir où l'on était.
const CLE_PILE = 'yeshaya:pile-lecture';
const lirePile = () => { try { return JSON.parse(sessionStorage.getItem(CLE_PILE) || '[]'); } catch { return []; } };
const ecrirePile = (p) => { try { sessionStorage.setItem(CLE_PILE, JSON.stringify(p.slice(-10))); } catch {} };
function versetVisible() {
  for (const el of document.querySelectorAll('.lecture__texte .v')) if (el.getBoundingClientRect().top > 150) return +el.id.slice(1);
  return null;
}
export function allerAuPassage(code, c, v, depuis) {
  if (depuis) ecrirePile([...lirePile(), { ...depuis, v: versetVisible() || depuis.v || null }]);
  aller(`bible/lire/${code}/${c}${v ? '/' + v : ''}`);
}

// Choisir un autre livre ou chapitre (ou taper une référence) sans quitter la lecture.
function Selecteur({ code, c, fermer }) {
  const [livre, setLivre] = useState(null);
  const [q, setQ] = useState('');
  const [onglet, setOnglet] = useState(LIVRES.findIndex((l) => l.code === code) >= 39 ? 'nt' : 'at');
  const ici = { code, c };
  const choisir = (cd, ch, v) => { fermer(); if (cd !== code || ch !== c || v) allerAuPassage(cd, ch, v, ici); };
  const r = q.trim() ? lireReference(q) : null;
  const l = livre && PAR_CODE[livre];
  return (
    <div class="selecteur-passage" role="dialog" aria-modal="true" aria-label="Aller à un autre passage">
      <div class="selecteur-passage__tete">
        {l ? <button class="rond" onClick={() => setLivre(null)} aria-label="Retour aux livres"><Icone nom="precedent" taille={20} /></button> : <span />}
        <b>{l ? l.nom : 'Aller à un autre passage'}</b>
        <button class="rond" onClick={fermer} aria-label="Fermer"><Icone nom="fermer" taille={20} /></button>
      </div>
      {!l && <>
        <form class="barre-recherche" onSubmit={(e) => { e.preventDefault(); if (r) choisir(r.code, r.c, r.v); }}>
          <Icone nom="recherche" taille={18} />
          <input class="barre-recherche__champ" value={q} onInput={(e) => setQ(e.currentTarget.value)} placeholder="Ex. : Jn 3 16, Rom 8, Ps 23" aria-label="Référence" enterkeyhint="go" />
          <button class="bouton bouton--or bouton--petit" type="submit" disabled={!r}>Aller</button>
        </form>
        {r && <p class="ligne__desc" style="margin:6px 4px">→ {ecrireReference(r)}</p>}
        <div class="segments" role="group" aria-label="Testament" style="margin:10px 0">
          <button aria-pressed={onglet === 'at'} onClick={() => setOnglet('at')}>Ancien Testament</button>
          <button aria-pressed={onglet === 'nt'} onClick={() => setOnglet('nt')}>Nouveau Testament</button>
        </div>
      </>}
      <div class="selecteur-passage__corps">
        {l ? (
          <div class="grille-chapitres">
            {l.chapitres.map((_, i) => <button class={'carte pastille-chapitre' + (l.code === code && i + 1 === c ? ' pastille-chapitre--ici' : '')} onClick={() => choisir(l.code, i + 1)}>{i + 1}</button>)}
          </div>
        ) : (
          <div class="grille-livres">
            {(onglet === 'at' ? LIVRES.slice(0, 39) : LIVRES.slice(39)).map((x) => (
              <button class={'carte livre' + (x.code === code ? ' livre--ici' : '')} onClick={() => (x.chapitres.length === 1 ? choisir(x.code, 1) : setLivre(x.code))}>
                <span class="livre__nom">{x.nom}</span><span class="livre__ch">{x.chapitres.length} ch.</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <p class="ligne__desc" style="text-align:center;margin:8px 0 0">Un bouton « Revenir à {ecrireReference({ code, c })} » te ramènera ici.</p>
    </div>
  );
}

function voisin(code, c, sens) {
  const l = PAR_CODE[code], i = LIVRES.indexOf(l);
  if (sens > 0) return c < l.chapitres.length ? [code, c + 1] : LIVRES[i + 1] ? [LIVRES[i + 1].code, 1] : null;
  return c > 1 ? [code, c - 1] : LIVRES[i - 1] ? [LIVRES[i - 1].code, LIVRES[i - 1].chapitres.length] : null;
}

// Écran 16 : lecture libre. Toucher (ou appui long) sur un verset ouvre les actions.
export function Lecture({ code, c, vise }) {
  const livre = PAR_CODE[code];
  const [chap, setChap] = useState(null);
  const [erreur, setErreur] = useState(null);
  const [sels, setSels] = useState([]);            // versets sélectionnés (on peut en choisir plusieurs)
  const sel = sels[0] || null;
  const setSel = (v) => setSels(v ? [v] : []);
  const basculer = (v) => setSels((l) => (l.includes(v) ? l.filter((x) => x !== v) : [...l, v].sort((a, b) => a - b)));
  const [choix, setChoix] = useState(false);       // sélecteur de livre/chapitre ouvert
  const [pile, setPile] = useState(lirePile);
  const [palette, setPalette] = useState(false);
  const [note, setNote] = useState(null);          // texte de la note en cours d'édition
  const notes = useSignal(annotations);
  const appui = useRef(null);
  const va = useVoixActive(`bible-${code}-${c}`);

  useEffect(() => {
    let actif = true; setChap(null); setErreur(null); setSels([]); setNote(null); setPile(lirePile());
    chargerLivre(code).then((l) => { if (!actif) return; setChap(l.chapitres[c - 1]); memoriserPosition(code, c); })
      .catch(() => actif && setErreur('Ce livre n\'est pas encore sur votre téléphone. Connectez-vous une fois ou téléchargez la Bible.'));
    return () => { actif = false; };
  }, [code, c]);

  useEffect(() => {        // aller au verset demandé
    if (chap && vise) {
      const el = document.getElementById('v' + vise);
      if (el) { el.scrollIntoView({ block: 'center' }); el.classList.add('flash'); setSel(vise); }
    }
  }, [chap, vise]);

  if (!livre) return <div class="page"><p>Livre inconnu.</p></div>;
  const prec = voisin(code, c, -1), suiv = voisin(code, c, 1);
  const cle = sel ? cleVerset(code, c, sel) : null;
  const cles = sels.map((v) => cleVerset(code, c, v));
  const a = cle ? notes[cle] || {} : {};
  const tousFavoris = cles.length && cles.every((k) => notes[k]?.favori);
  const texteSel = chap ? sels.map((v) => (sels.length > 1 ? v + ' ' : '') + chap[v - 1].replace(/\n/g, ' ')).join(' ') : '';
  // « Matthieu 5:3-5, 8 » : plages de versets consécutifs
  const plages = []; sels.forEach((v) => { const p = plages[plages.length - 1]; if (p && v === p[1] + 1) p[1] = v; else plages.push([v, v]); });
  const refSel = sels.length ? `${ecrireReference({ code, c })}:${plages.map(([d, f]) => (d === f ? d : `${d}-${f}`)).join(', ')}` : '';
  const retourA = pile[pile.length - 1];
  const revenir = () => { const p = lirePile(); const r = p.pop(); ecrirePile(p); if (r) aller(`bible/lire/${r.code}/${r.c}${r.v ? '/' + r.v : ''}`); };

  const debutAppui = (v) => { appui.current = setTimeout(() => { basculer(v); appui.current = 'fait'; navigator.vibrate?.(15); }, 450); };
  const finAppui = () => { if (appui.current !== 'fait') clearTimeout(appui.current); };

  return (
    <div class="lecture">
      <div class="lecture__barre">
        <button class="selecteur" onClick={() => setChoix(true)} aria-label="Choisir un autre livre ou chapitre"><Icone nom="bible" taille={18} /> {livre.nom} {c} ▾</button>
        <button class="rond" disabled={!prec} onClick={() => prec && aller(`bible/lire/${prec[0]}/${prec[1]}`)} aria-label="Chapitre précédent"><Icone nom="precedent" taille={20} /></button>
        <button class="rond" disabled={!suiv} onClick={() => suiv && aller(`bible/lire/${suiv[0]}/${suiv[1]}`)} aria-label="Chapitre suivant"><Icone nom="chevron" taille={20} /></button>
      </div>

      {choix && <Selecteur code={code} c={c} fermer={() => setChoix(false)} />}
      {retourA && !(retourA.code === code && retourA.c === c) && (
        <button class="revenir-passage" onClick={revenir}><Icone nom="precedent" taille={16} /> Revenir à {ecrireReference({ code: retourA.code, c: retourA.c, v: retourA.v || undefined })}</button>
      )}
      <article class="page lecture__texte" lang="fr">
        {chap && <BarreEcoute id={`bible-${code}-${c}`} titre={'Écouter ' + ecrireReference({ code, c })}
          blocs={[{ texte: (code === 'PSA' ? ecrireReference({ code, c }) : ecrireReference({ code, c }).replace(/ (\d+)$/, ', chapitre $1')) + '.' }, ...chap.map((t) => ({ texte: (t || '').replace(/\n/g, ' ') }))]} />}
        <h2 class="lecture__titre">{ecrireReference({ code, c })}</h2>
        {erreur && <p class="verset__erreur">{erreur}</p>}
        {!chap && !erreur && <p class="verset__attente">Chargement…</p>}
        {chap && chap.map((t, i) => {
          if (!t) return null;
          const v = i + 1, k = cleVerset(code, c, v), an = notes[k] || {};
          return (
            <p id={'v' + v} {...va(v)} class={'v' + (sels.includes(v) ? ' v--sel' : '')} style={an.couleur ? { background: COULEURS[an.couleur] } : undefined}
              onClick={() => { if (appui.current === 'fait') { appui.current = null; return; } basculer(v); setPalette(false); setNote(null); }}
              onTouchStart={() => debutAppui(v)} onTouchEnd={finAppui} onTouchMove={finAppui}
              role="button" tabIndex={0} aria-pressed={sels.includes(v)} onKeyDown={(e) => e.key === 'Enter' && basculer(v)}>
              <sup class="v__n">{v}</sup>
              {t.split('\n').map((ligne, j) => <span class={j ? 'v__vers' : ''}>{ligne}{' '}</span>)}
              {an.favori && <Icone nom="coeur" taille={14} class="v__marque" />}
              {an.note && <Icone nom="note" taille={14} class="v__marque" />}
            </p>
          );
        })}
        {chap && suiv && (
          <a class="bouton bouton--contour lecture__suivant" href={`#/bible/lire/${suiv[0]}/${suiv[1]}`}>
            Chapitre suivant : {PAR_CODE[suiv[0]].nom} {suiv[1]} <Icone nom="chevron" taille={18} />
          </a>
        )}
      </article>

      {sel && note === null && (
        <div class="actions-verset" role="toolbar" aria-label={'Actions pour ' + refSel}>
          <div class="actions-verset__ref">{refSel}{sels.length > 1 && <span class="pastille pastille--or" style="margin-left:6px">{sels.length} versets</span>}<button onClick={() => setSels([])} aria-label="Fermer"><Icone nom="fermer" taille={18} /></button></div>
          {sels.length === 1 && <p class="ligne__desc" style="margin:0 0 6px">Touche d'autres versets pour les ajouter à la sélection.</p>}
          {palette && (
            <div class="palette">
              {Object.entries(COULEURS).map(([nom, coul]) => (
                <button style={{ background: coul }} aria-label={'Surligner en ' + nom} aria-pressed={cles.every((k) => notes[k]?.couleur === nom)}
                  onClick={() => { surligner(cles, nom); setPalette(false); setSels([]); notifier(sels.length > 1 ? sels.length + ' versets surlignés' : 'Verset surligné'); }} />
              ))}
              {cles.some((k) => notes[k]?.couleur) && <button class="palette__effacer" onClick={() => { surligner(cles, null); setPalette(false); }}>Effacer</button>}
            </div>
          )}
          <div class="actions-verset__boutons">
            <button onClick={() => setPalette(!palette)}><Icone nom="surligner" /><span>Surligner</span></button>
            <button onClick={() => { basculerFavori(cles, !tousFavoris); notifier(tousFavoris ? 'Retiré des favoris' : sels.length > 1 ? sels.length + ' versets ajoutés aux favoris' : 'Ajouté aux favoris'); }} class={tousFavoris ? 'actif' : ''}>
              <Icone nom="coeur" /><span>Favori</span></button>
            {sels.length === 1 && <button onClick={() => setNote(a.note || '')}><Icone nom="note" /><span>Note</span></button>}
            <button onClick={async () => notifier((await copier(`« ${texteSel} » — ${refSel} (LSG)`)) ? 'Verset copié' : 'Copie impossible')}>
              <Icone nom="copier" /><span>Copier</span></button>
            <button onClick={() => partager({ titre: refSel, texte: `« ${texteSel} » — ${refSel} (LSG)`, chemin: `bible/lire/${code}/${c}/${sel}` })}>
              <Icone nom="partager" /><span>Partager</span></button>
            <a href={`#/montrer/${code}/${c}/${plages[0][0]}${plages.length === 1 && plages[0][1] > plages[0][0] ? '-' + plages[0][1] : ''}`}><Icone nom="agrandir" /><span>Montrer</span></a>
          </div>
        </div>
      )}

      {sel && note !== null && (
        <div class="actions-verset note-edition">
          <label class="ligne__titre" for="note">Ma note sur {refSel}</label>
          <textarea id="note" class="champ" rows="4" maxLength={500} value={note} onInput={(e) => setNote(e.currentTarget.value)} autoFocus />
          <div class="note-edition__pied">
            <span class="ligne__desc">{note.length} / 500</span>
            {a.note && <button class="bouton bouton--contour bouton--petit" onClick={() => { ecrireNote(cle, ''); setNote(null); notifier('Note supprimée'); }}>Supprimer</button>}
            <button class="bouton bouton--contour bouton--petit" onClick={() => setNote(null)}>Annuler</button>
            <button class="bouton bouton--plein bouton--petit" onClick={() => { ecrireNote(cle, note); setNote(null); notifier('Note enregistrée'); }}>Enregistrer</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Redirige « bible/lire » sans paramètre vers la dernière position ou Genèse 1.
export function allerLecture(pos) { remplacer(pos ? `bible/lire/${pos.code}/${pos.c}` : 'bible/lire/GEN/1'); }
