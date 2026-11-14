import { useState, useEffect } from 'preact/hooks';
import { Icone } from '../composants/Icone.jsx';
import { ENSEIGNEMENTS, PRIERES, VEILLES, COMBAT, OUTILS, APPROCHES, EVANGELISATION, DIALOGUES } from '../donnees/contenu.js';

// Espace administrateur : lecture des statistiques anonymes (mot de passe défini dans Cloudflare).
const SECTIONS = { accueil: 'Accueil', priere: 'Prière', grandir: 'Grandir', evangeliser: 'Évangéliser', bible: 'Bible', jouer: 'Jeux', ecouter: 'Écoute' };
const TYPES = [
  ['enseignement', 'Enseignements', ENSEIGNEMENTS], ['veille', 'Veilles de prière', VEILLES.map((v) => ({ ...v, id: v.id.replace('veille-', '') }))],
  ['theme-priere', 'Thèmes de prière', PRIERES], ['combat', 'Combat spirituel', COMBAT], ['outil', 'Présenter l\'Évangile', OUTILS],
  ['approche', 'Approches d\'évangélisation', APPROCHES], ['article', 'Articles (évangéliser)', EVANGELISATION], ['dialogue', 'Dialogues', DIALOGUES],
  ['parcours', 'Parcours (jours suivis)', []], ['j-ai-prie', '« J\'ai prié » (moments terminés)', [...PRIERES, ...VEILLES, ...COMBAT]], ['jeu', 'Jeux', []],
];
const propre = (s) => String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9-]+/g, '-').replace(/^-+|-+$/g, '');
const nomDe = (liste, id) => liste.find((x) => propre(x.id) === id)?.titre || id;
const nombre = (n) => n.toLocaleString('fr-FR');

export function Admin() {
  const [mdp, setMdp] = useState(() => { try { return sessionStorage.getItem('yeshaya:admin') || ''; } catch { return ''; } });
  const [jours, setJours] = useState(30);
  const [etat, setEtat] = useState({ charge: false });

  async function charger(m = mdp) {
    setEtat({ charge: true });
    try {
      const r = await fetch('/api/stats?jours=' + jours, { headers: { authorization: 'Bearer ' + m }, cache: 'no-store' });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) { setEtat({ erreur: d.erreur || 'Service indisponible (' + r.status + ').' }); return; }
      try { sessionStorage.setItem('yeshaya:admin', m); } catch {}
      setEtat({ lignes: d.lignes, depuis: d.depuis });
    } catch { setEtat({ erreur: 'Pas de connexion internet.' }); }
  }
  useEffect(() => { if (mdp && etat.lignes) charger(); }, [jours]);

  if (!etat.lignes) return (
    <div class="page">
      <section class="carte bloc">
        <h3><span class="ligne__icone"><Icone nom="cadenas" /></span> Espace administrateur</h3>
        <p class="ligne__desc">Statistiques anonymes envoyées par les utilisateurs qui l'ont accepté : aucun nom, aucun contact, aucun pays.</p>
        <form onSubmit={(e) => { e.preventDefault(); charger(); }}>
          <input class="champ" type="password" autocomplete="current-password" placeholder="Mot de passe" value={mdp} onInput={(e) => setMdp(e.currentTarget.value)} />
          <button class="bouton bouton--plein" style="width:100%;margin-top:10px" disabled={!mdp || etat.charge}>{etat.charge ? 'Chargement…' : 'Voir les statistiques'}</button>
        </form>
        {etat.erreur && <p class="ligne__desc" style="color:var(--rouge, #b3261e);margin-top:8px">{etat.erreur}</p>}
      </section>
    </div>
  );

  const L = etat.lignes;
  const total = (f) => L.filter((l) => f(l.cle)).reduce((s, l) => s + l.n, 0);
  const parCle = (prefixe) => {
    const m = {}; for (const l of L) if (l.cle.startsWith(prefixe + ':')) { const k = l.cle.slice(prefixe.length + 1); m[k] = (m[k] || 0) + l.n; }
    return Object.entries(m).sort((a, b) => b[1] - a[1]);
  };
  const decisions = total((c) => c === 'decision' || c.startsWith('decision:'));
  const sections = parCle('ouverture').filter(([k]) => SECTIONS[k]);
  const maxSection = Math.max(1, ...sections.map(([, n]) => n));
  const parJour = {}; for (const l of L) if (l.cle.startsWith('decision') || l.cle === 'ouverture:accueil') { const o = parJour[l.jour] || (parJour[l.jour] = { d: 0, v: 0 }); if (l.cle.startsWith('decision')) o.d += l.n; else o.v += l.n; }
  const jourListe = Object.entries(parJour).sort();
  const maxJour = Math.max(1, ...jourListe.map(([, o]) => o.v));

  return (
    <div class="page admin">
      <div class="segments" role="group" aria-label="Période" style="margin-top:12px">
        {[7, 30, 90, 365].map((j) => <button aria-pressed={jours === j} onClick={() => setJours(j)}>{j} j</button>)}
      </div>
      <p class="ligne__desc" style="margin:8px 4px">Depuis le {new Date(etat.depuis).toLocaleDateString('fr-FR')}.</p>
      <div class="admin__chiffres">
        <div class="carte"><b>{nombre(decisions)}</b><span>ont dit avoir donné leur vie à Jésus</span></div>
        <div class="carte"><b>{nombre(total((c) => c === 'sujet-prie'))}</b><span>sujets de prière priés</span></div>
        <div class="carte"><b>{nombre(total((c) => c.startsWith('enseignement:')))}</b><span>enseignements ouverts</span></div>
        <div class="carte"><b>{nombre(total((c) => c.startsWith('enseignement-fini:')))}</b><span>enseignements terminés</span></div>
      </div>
      {decisions > 0 && <section class="carte bloc"><h3>D'où viennent les décisions</h3>
        {parCle('decision').map(([k, n]) => <p class="admin__ligne"><span>{k === 'parcours' ? 'Parcours Nouveau converti' : k === 'app' ? 'Autre' : nomDe(OUTILS, k)}</span><b>{n}</b></p>)}</section>}
      <section class="carte bloc"><h3>Où vont les utilisateurs</h3>
        {sections.map(([k, n]) => <div class="admin__barre"><span>{SECTIONS[k]}</span><i style={{ width: (n / maxSection) * 100 + '%' }} /><b>{nombre(n)}</b></div>)}
        {!sections.length && <p class="ligne__desc">Pas encore de données.</p>}
      </section>
      {jourListe.length > 1 && <section class="carte bloc"><h3>Jour par jour</h3><p class="ligne__desc">Barre : ouvertures de l'application · point doré : décisions</p>
        <div class="admin__jours">{jourListe.map(([j, o]) => <span title={`${j} : ${o.v} ouvertures, ${o.d} décisions`} style={{ height: Math.max(4, (o.v / maxJour) * 100) + '%' }}>{o.d > 0 && <em />}</span>)}</div></section>}
      {TYPES.map(([t, libelle, liste]) => { const l = parCle(t); return l.length > 0 && (
        <section class="carte bloc"><h3>{libelle}</h3>{l.slice(0, 15).map(([k, n]) => <p class="admin__ligne"><span>{nomDe(liste, k)}</span><b>{nombre(n)}</b></p>)}</section>); })}
      <button class="bouton bouton--contour" style="width:100%;margin-top:12px" onClick={() => charger()}><Icone nom="rejouer" taille={18} /> Actualiser</button>
    </div>
  );
}
