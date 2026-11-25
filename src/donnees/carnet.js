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

// Bilan de vie (confidentiel), avec code facultatif.
export const lireBilan = () => lire('yeshaya:bilan', {});
export const ecrireBilan = (b) => ecrire('yeshaya:bilan', b);
export const effacerBilan = () => { try { localStorage.removeItem('yeshaya:bilan'); localStorage.removeItem('yeshaya:bilan:code'); sessionStorage.removeItem('yeshaya:bilan:ouvert'); } catch {} };
const empreinte = (s) => { let h = 5381; for (const c of 'yeshaya:' + s) h = ((h << 5) + h + c.charCodeAt(0)) >>> 0; return h.toString(36); };
export const aUnCode = () => !!lire('yeshaya:bilan:code', null);
export const definirCode = (code) => ecrire('yeshaya:bilan:code', code ? empreinte(code) : null);
export const verifierCode = (code) => lire('yeshaya:bilan:code', null) === empreinte(code);
export const bilanOuvert = () => { try { return !aUnCode() || sessionStorage.getItem('yeshaya:bilan:ouvert') === '1'; } catch { return !aUnCode(); } };
export const ouvrirBilan = () => { try { sessionStorage.setItem('yeshaya:bilan:ouvert', '1'); } catch {} };

// Mes disciples (pour l'accompagnateur).
export const lireDisciples = () => lire('yeshaya:disciples', []);
export const ecrireDisciples = (l) => ecrire('yeshaya:disciples', l);
