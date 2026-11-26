import { Icone } from '../composants/Icone.jsx';
import { useSignal } from '../outils/signal.js';
import { activites, enCours, fidelite, motFidelite, oublier, TYPES } from '../donnees/activites.js';

export const depuis = (iso, maintenant = Date.now()) => {
  const h = (maintenant - new Date(iso)) / 36e5;
  if (h < 1) return "il y a moins d'une heure";
  if (h < 24) return `il y a ${Math.floor(h)} h`;
  const j = Math.floor(h / 24);
  return j === 1 ? 'hier' : `il y a ${j} jours`;
};

// « Voici où tu étais » : ce qui est commencé, pas fini.
export function LigneReprise({ a, oubliable }) {
  return (
    <div class="reprises__ligne">
      <a href={a.lien} style="display:contents;color:inherit;text-decoration:none">
        <span class="ligne__icone"><Icone nom={TYPES[a.type]?.icone || 'priere'} /></span>
        <span><b>{a.titre}</b><small>{a.libelle ? a.libelle + ' · ' : ''}{depuis(a.maj)}</small></span>
        <span class="reprises__bouton">Continuer</span>
      </a>
      {oubliable && <button class="lien" aria-label="Retirer de la liste" onClick={() => oublier(a.cle)}>✕</button>}
    </div>
  );
}

export function Fidelite() {
  const v = useSignal(activites);
  const f = fidelite(v), reste = enCours(v);
  const finies = Object.values(v).filter((a) => a.fini).sort((a, b) => b.finiLe.localeCompare(a.finiLe)).slice(0, 12);
  return (
    <div class="page">
      <section class="carte bloc reprises" style="margin-top:12px">
        <h2>Ma fidélité</h2>
        <p class="reprises__mot">{motFidelite(f)}</p>
        <div class="fidelite__chiffres"><div><b>{f.commencees}</b><span>commencés</span></div><div><b>{f.finies}</b><span>terminés</span></div><div><b>{f.jours}</b><span>jours avec Dieu</span></div></div>
        <div class="fidelite__barre"><i style={{ width: Math.round(f.taux * 100) + '%' }} /></div>
        <p class="ligne__desc">Sur les 30 derniers jours. Ces chiffres restent sur ton téléphone : personne d'autre ne les voit.</p>
      </section>
      {reste.length > 0 && <><h2 class="titre-section">Commencés, pas encore finis</h2>
        <section class="carte bloc reprises">{reste.map((a) => <LigneReprise a={a} oubliable />)}</section></>}
      {finies.length > 0 && <><h2 class="titre-section">Terminés</h2>
        <section class="carte bloc reprises">{finies.map((a) => (
          <div class="reprises__ligne"><span class="ligne__icone"><Icone nom="verifie" /></span><span><b>{a.titre}</b><small>{depuis(a.finiLe)}</small></span></div>))}</section></>}
      {!reste.length && !finies.length && <p class="ligne__desc">Rien pour l'instant. Commence une veille ou un enseignement : tu le retrouveras ici.</p>}
    </div>
  );
}
