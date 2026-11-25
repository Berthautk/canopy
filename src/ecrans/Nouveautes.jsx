import { useEffect } from 'preact/hooks';
import { Icone } from '../composants/Icone.jsx';
import { signal } from '../outils/signal.js';
import NOUVEAUTES from '../../content/nouveautes.json';

const CLE = 'yeshaya:nouveautes-vu';
export const ELEMENTS = NOUVEAUTES.elements;
const lire = () => { try { return localStorage.getItem(CLE) || ''; } catch { return ''; } };
export const dernierVu = signal(lire());
// Y a-t-il du nouveau depuis la dernière visite de la page ?
export const aDuNouveau = () => ELEMENTS.some((x) => x.id > dernierVu.valeur);
export const toutVu = () => {
  const m = ELEMENTS.reduce((a, x) => (x.id > a ? x.id : a), '');
  dernierVu.valeur = m; try { localStorage.setItem(CLE, m); } catch { /* stockage indisponible */ }
};

// Page « Nouveautés » : ce qui vient d'être ajouté dans l'application.
export function Nouveautes() {
  const avant = dernierVu.valeur;
  // Après un instant sur la page, tout est marqué comme vu : la pastille rouge s'éteint, la liste garde les « Nouveau ».
  useEffect(() => { const t = setTimeout(toutVu, 1500); return () => clearTimeout(t); }, []);
  return (
    <div class="page">
      <p class="ligne__desc" style="margin:12px 4px">Ce qui vient d'être ajouté dans Yeshaya.</p>
      <div class="liste">
        {ELEMENTS.map((x) => (
          <a class="carte theme" href={x.lien}>
            <img src={x.image} alt="" loading="lazy" />
            <span class="ligne__corps">
              <span class="ligne__titre" style="display:block">{x.titre} {x.id > avant && <span class="pastille pastille--or pastille--mini">Nouveau</span>}</span>
              <span class="ligne__desc">{x.texte}</span>
              <span class="ligne__desc" style="font-size:.74rem">{new Date(x.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })}</span>
            </span>
            <Icone nom="chevron" taille={20} />
          </a>
        ))}
      </div>
    </div>
  );
}
