import { useEffect } from 'preact/hooks';
import { Icone } from './Icone.jsx';
import { installation, toutTelecharge, verifierTout } from '../outils/telephone.js';
import { useSignal } from '../outils/signal.js';

// Un seul rappel, sur l'accueil : installer l'app et tout télécharger. Disparaît quand c'est fait.
export function BandeauTelephone() {
  const i = useSignal(installation), t = useSignal(toutTelecharge);
  useEffect(() => { if (t.statut === 'inconnu') verifierTout(); }, []);
  if (t.statut === 'inconnu' || (t.statut === 'complet' && i.installee)) return null;
  const texte = t.statut !== 'complet' ? 'Installe Yeshaya et télécharge tout en une fois : Bible, illustrations, enseignements.' : 'Ajoute l\'icône de Yeshaya sur ton écran d\'accueil.';
  return (
    <a class="carte ligne" href="#/telechargements" style="margin-top:12px;border:2px solid var(--or)">
      <span class="ligne__icone"><Icone nom="telecharger" /></span>
      <span class="ligne__corps"><span class="ligne__titre" style="display:block">Utiliser sans internet</span><span class="ligne__desc">{texte}</span></span>
      <Icone nom="chevron" taille={20} />
    </a>
  );
}
