// La veille que la personne a commencée aujourd'hui sans la finir : on l'invite à la reprendre.
// Rien ne quitte le téléphone.
const CLE = 'yeshaya:veille-en-cours';
const jour = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export const lireEnCours = () => { try { const v = JSON.parse(localStorage.getItem(CLE) || 'null'); return v && v.jour === jour() ? v : null; } catch { return null; } };
export const ecrireEnCours = (v) => { try { localStorage.setItem(CLE, JSON.stringify({ ...v, jour: jour() })); } catch { /* stockage indisponible */ } };
export const effacerEnCours = () => { try { localStorage.removeItem(CLE); } catch { /* stockage indisponible */ } };
