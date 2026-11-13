import { useState } from 'preact/hooks';
import { Icone } from '../../composants/Icone.jsx';
import { CarteVerset } from '../../composants/Verset.jsx';
import { SUJETS } from '../../donnees/contenu.js';
import { simplifier } from '../../bible/references.js';

// Écrans 20 et 21 : versets par sujet.
export function Sujets({ id }) {
  const [q, setQ] = useState('');
  const sujet = id && SUJETS.find((s) => s.id === id);

  if (sujet) {
    return (
      <div class="page">
        <div class="bandeau-titre">
          <img src={sujet.image} alt="" />
          <div><h2>{sujet.titre}</h2><p>{sujet.description}</p></div>
        </div>
        <p class="sujet__compte"><Icone nom="bible" taille={18} /> {sujet.versets.length} versets</p>
        <div class="liste">{sujet.versets.map((r) => <CarteVerset reference={r} />)}</div>
      </div>
    );
  }

  const f = simplifier(q);
  const visibles = SUJETS.filter((s) => !f || simplifier(s.titre + ' ' + s.description).includes(f));
  return (
    <div class="page">
      <div class="bandeau-titre">
        <img src="/assets/personnages/homme-en-priere.webp" alt="" />
        <div><h2>Versets par sujet</h2><p>Des promesses de la Bible pour chaque situation de la vie.</p></div>
      </div>
      <div class="barre-recherche">
        <Icone nom="recherche" taille={20} />
        <input class="barre-recherche__champ" type="search" value={q} onInput={(e) => setQ(e.currentTarget.value)}
          placeholder="Rechercher un sujet (paix, peur, famille…)" aria-label="Rechercher un sujet" />
      </div>
      <div class="grille-sujets">
        {visibles.map((s) => (
          <a class="sujet" href={'#/bible/sujets/' + s.id}>
            <img src={s.image} alt="" loading="lazy" />
            <span class="sujet__corps"><span class="sujet__titre">{s.titre}</span><span class="sujet__nb">{s.versets.length} versets</span></span>
          </a>
        ))}
      </div>
      {!visibles.length && <p class="ligne__desc" style="margin-top:12px">Aucun sujet ne correspond. Essayez la recherche dans la Bible.</p>}
    </div>
  );
}
