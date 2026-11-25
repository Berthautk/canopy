// « Former le chrétien » : carnet du disciple, bilan de vie et « Mes disciples ».
// Tout reste sur ce téléphone (localStorage). Rien n'est envoyé à Yeshaya.
const lire = (cle, defaut) => { try { const v = localStorage.getItem(cle); return v ? JSON.parse(v) : defaut; } catch { return defaut; } };
const ecrire = (cle, v) => { try { localStorage.setItem(cle, JSON.stringify(v)); } catch { /* stockage indisponible */ } };

// Carnet d'un pas : réponses écrites, vrai/faux, lectures cochées.
export const lireCarnet = (id) => lire('yeshaya:carnet:' + id, { r: {}, vf: {}, lect: [] });
let surChangement = null;   // branché par le module de suivi (envoi automatique au berger)
export const quandCarnetChange = (f) => { surChangement = f; };
export const ecrireCarnet = (id, c) => { ecrire('yeshaya:carnet:' + id, c); surChangement?.(id); };
export const pasEnCours = () => lire('yeshaya:carnet:en-cours', null);
export const marquerEnCours = (id) => ecrire('yeshaya:carnet:en-cours', id);

// Bilan de vie : il fait partie du carnet du pas 1 (« Le salut »).
// Il n'est donc plus caché : le berger le voit comme les autres réponses, et il s'imprime avec le pas.
// « Confessez vos péchés les uns aux autres, et priez les uns pour les autres, afin que vous soyez
// guéris » (Jacques 5:16) ; « Celui qui cache ses transgressions ne prospère point » (Proverbes 28:13).
const PAS_BILAN = 'pas-01-le-salut';
export const lireBilan = () => {
  const c = lireCarnet(PAS_BILAN);
  if (c.bilan) return c.bilan;
  const ancien = lire('yeshaya:bilan', null);        // bilans remplis avant ce changement : repris une fois
  if (ancien && Object.keys(ancien).length) { ecrireBilan(ancien); return ancien; }
  return {};
};
export const ecrireBilan = (b) => { const c = lireCarnet(PAS_BILAN); ecrireCarnet(PAS_BILAN, { ...c, bilan: b }); };
export const effacerBilan = () => {
  const { bilan, ...reste } = lireCarnet(PAS_BILAN);
  ecrireCarnet(PAS_BILAN, reste);
  try { localStorage.removeItem('yeshaya:bilan'); localStorage.removeItem('yeshaya:bilan:code'); sessionStorage.removeItem('yeshaya:bilan:ouvert'); } catch { /* stockage indisponible */ }
};

// Mes disciples (pour l'accompagnateur).
export const lireDisciples = () => lire('yeshaya:disciples', []);
export const ecrireDisciples = (l) => ecrire('yeshaya:disciples', l);
