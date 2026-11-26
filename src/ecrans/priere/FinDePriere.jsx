import { Icone } from '../../composants/Icone.jsx';
import { suggerer } from '../../donnees/suggestions.js';

// Quand on a fini de prier : on ne laisse pas la personne devant un écran vide.
// Un enseignement qui va dans le même sens, une autre prière sur le même sujet, et la suite.
export function FinDePriere({ titre, motsCles, message, exclure = [], retour = '#/priere' }) {
  const { enseignements, prieres } = suggerer(motsCles, { exclure });
  const ligne = (href, icone, haut, bas) => (
    <a class="carte ligne" href={href}>
      <span class="ligne__icone"><Icone nom={icone} /></span>
      <span class="ligne__corps"><span class="ligne__titre" style="display:block">{haut}</span><span class="ligne__desc">{bas}</span></span>
      <Icone nom="chevron" taille={20} />
    </a>
  );
  return (
    <div class="page fin-priere">
      <section class="carte bloc fin-priere__amen"><Icone nom="verifie" taille={34} /><h2>Amen !</h2><p>{message}</p></section>
      <h2 class="titre-section">Pour aller plus loin</h2>
      <div class="liste">
        {enseignements.map((e) => ligne('#/grandir/enseignement/' + e.id, 'grandir', e.titre, `Enseignement · ${e.lecture_minutes ? e.lecture_minutes + ' min de lecture' : e.theme || ''}`))}
        {prieres.map((p) => ligne(p.lien, 'priere', p.titre, 'Une autre prière, dans le même sens'))}
        {ligne('#/priere/jeune', 'soleil', 'Jeûne et prière', 'Prier avec plus de force : le rythme du jeûne.')}
        {ligne(retour, 'priere', 'Revenir à la rubrique Prière', titre ? `Après : ${titre}` : 'Les veilles, la nuit, les thèmes.')}
      </div>
    </div>
  );
}
