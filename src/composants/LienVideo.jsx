import { Icone } from './Icone.jsx';

// Lien vers la vidéo complète (YouTube). Pas de lecteur intégré : aucun script ni traceur tiers n'est chargé dans l'app.
const VALIDE = /^https:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]{6,}/;
export function LienVideo({ url, duree, auteur }) {
  if (!url || !VALIDE.test(url)) return null;
  return (
    <a class="carte lien-video" href={url} target="_blank" rel="noopener noreferrer">
      <span class="lien-video__icone"><Icone nom="lecture" taille={22} /></span>
      <span class="ligne__corps">
        <span class="ligne__titre" style="display:block">Voir la prédication complète{auteur ? ' du ' + auteur.replace(/^Pasteur/, 'pasteur') : ''}</span>
        <span class="ligne__desc">Vidéo sur YouTube{duree ? ' · ' + duree : ''} · nécessite internet et consomme des données</span>
      </span>
      <Icone nom="partager" taille={18} />
    </a>
  );
}
