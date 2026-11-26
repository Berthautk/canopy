import { useEffect, useState } from 'preact/hooks';
import { Icone } from '../../composants/Icone.jsx';
import { TexteRefs } from '../../composants/TexteRefs.jsx';
import { notifier } from '../../composants/Notification.jsx';
import { SujetsUnParUn } from './SujetsUnParUn.jsx';
import { FinDePriere } from './FinDePriere.jsx';
import { chercherSujets } from '../../donnees/suggestions.js';
import { avancer, terminer } from '../../donnees/activites.js';
import { noterPriere } from '../../donnees/priere.js';
import { useGardeSortie } from '../../composants/SortieAvantFin.jsx';
import { aller } from '../../outils/routeur.js';

export const IDEES = ['ma famille', 'mon travail', 'la santé', 'mon pays', "l'Église", 'un examen', 'les perdus', 'la peur', 'le pardon'];

// Le champ « Pour quoi veux-tu prier ? » : la personne écrit un mot, la prière se compose toute seule.
export function ChampPrier({ valeur = '' }) {
  const [q, setQ] = useState(valeur);
  const chercher = (x) => { const m = (x ?? q).trim(); if (m) aller('priere/chercher?q=' + encodeURIComponent(m)); };
  return (
    <section class="champ-prier">
      <form onSubmit={(e) => { e.preventDefault(); chercher(); }} role="search">
        <label class="champ-prier__etiquette" for="champ-prier">Pour quoi veux-tu prier ?</label>
        <div class="champ-prier__ligne">
          <input id="champ-prier" class="champ" type="search" enterkeyhint="search" autocomplete="off" placeholder="Par exemple : famille, santé, examen…" value={q} onInput={(e) => setQ(e.currentTarget.value)} />
          <button class="bouton bouton--or" type="submit" aria-label="Chercher"><Icone nom="recherche" taille={20} /></button>
        </div>
      </form>
      <div class="chips champ-prier__idees">{IDEES.map((i) => <button class="chip" onClick={() => chercher(i)}>{i}</button>)}</div>
    </section>
  );
}

export function PriereSurMesure({ q = '' }) {
  const sujets = chercherSujets(q, 12);
  const [fini, setFini] = useState(false);
  const cle = `mesure-${q.toLowerCase().trim()}-${new Date().toISOString().slice(0, 10)}`;
  const lien = '#/priere/chercher?q=' + encodeURIComponent(q);
  useEffect(() => { if (sujets.length && !fini) avancer({ cle, type: 'priere', titre: 'Prière : ' + q, lien, fraction: 0.1, libelle: 'prière sur mesure' }); }, [q]);
  useGardeSortie(() => (sujets.length && !fini ? { cle, type: 'priere', titre: 'Prière : ' + q, libelle: 'prière sur mesure', lien } : null));
  useEffect(() => { setFini(false); scrollTo(0, 0); }, [q]);
  if (fini) return <FinDePriere titre={q} motsCles={q} message={`Tu as prié pour « ${q} ». Que Dieu exauce ta prière.`} retour="#/priere" />;
  return (
    <div class="page">
      <ChampPrier valeur={q} />
      {!sujets.length ? (
        <section class="carte bloc"><p>Je n'ai pas trouvé de sujets pour « {q} ». Essaie un mot plus simple : <i>famille, santé, travail, pays, Église, peur, pardon…</i></p></section>
      ) : (
        <>
          <h2 class="titre-section">Ta prière : {q}</h2>
          <p class="phase__consigne">{sujets.length} consignes, une à la fois : lis, prie avec tes mots, puis touche la flèche dorée.</p>
          <SujetsUnParUn key={q} sujets={sujets} voixId={'mesure-' + q} intro={'Prière pour ' + q + '.'} />
          <nav class="nav-phase" style="grid-template-columns:1fr">
            <button class="nav-phase__bouton nav-phase__bouton--suivant nav-phase__bouton--fin" onClick={() => { noterPriere('mesure'); terminer(cle); notifier('Amen ! Que Dieu exauce ta prière.'); setFini(true); scrollTo(0, 0); }}>
              <Icone nom="verifie" taille={26} /><span><small>Terminer</small><b>J'ai prié</b></span></button>
          </nav>
        </>
      )}
    </div>
  );
}
