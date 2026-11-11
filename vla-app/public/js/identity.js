// Informations du candidat : champs obligatoires et normalisation (elles figurent sur l'attestation).
export const REQUIRED_ADULT = ['civilite', 'nom', 'prenom', 'naissance', 'ville', 'tel'];
export const REQUIRED_KID = ['civilite', 'nom', 'prenom', 'naissance', 'parent', 'tel'];
const LABEL = { civilite: 'la civilité', nom: 'le nom', prenom: 'le(s) prénom(s)', naissance: 'la date de naissance', ville: 'la ville', tel: 'le téléphone WhatsApp', parent: 'le nom du parent', photo: 'la photo', email: 'l’email' };

const collapse = (s) => String(s ?? '').replace(/\s+/g, ' ').trim();
export const cleanNom = (s) => collapse(s).toLocaleUpperCase('fr-FR');
export const cleanPrenom = (s) => collapse(s).toLocaleLowerCase('fr-FR').replace(/(^|[\s'’-])(\p{L})/gu, (m, a, b) => a + b.toLocaleUpperCase('fr-FR'));

export function cleanPhone(s) {
  const raw = collapse(s); const d = raw.replace(/\D/g, '');
  if (!d) return '';
  if (raw.startsWith('+') || raw.startsWith('00')) { const n = raw.startsWith('00') ? d.slice(2) : d; return '+' + n; }
  if (d.length === 9) return `+237 ${d[0]} ${d.slice(1, 3)} ${d.slice(3, 5)} ${d.slice(5, 7)} ${d.slice(7)}`;
  if (d.length === 12 && d.startsWith('237')) return cleanPhone('+' + d);
  return d;
}
export function cleanPhone237(s) { const p = cleanPhone(s); return /^\+237\d{9}$/.test(p.replace(/\s/g, '')) ? p.replace(/^\+237(\d)(\d{2})(\d{2})(\d{2})(\d{2})$/, '+237 $1 $2 $3 $4 $5').replace(/\s+/g, ' ') : p; }

export function ageFrom(iso, now = new Date()) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || ''); if (!m) return null;
  const [y, mo, d] = [+m[1], +m[2], +m[3]]; const dt = new Date(Date.UTC(y, mo - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
  let a = now.getFullYear() - y; if (now.getMonth() + 1 < mo || (now.getMonth() + 1 === mo && now.getDate() < d)) a--;
  return a;
}

/** Valide et normalise. Retourne { errors:{champ:message}, clean }. */
export function validateIdentity(raw, kid = false, now = new Date()) {
  const c = { ...raw };
  c.nom = cleanNom(c.nom); c.prenom = cleanPrenom(c.prenom); c.ville = collapse(c.ville); c.parent = collapse(c.parent);
  c.email = collapse(c.email).toLowerCase(); c.tel = cleanPhone237(c.tel);
  c.profession = collapse(c.profession); c.classe = collapse(c.classe);
  const errors = {};
  for (const k of kid ? REQUIRED_KID : REQUIRED_ADULT) if (!c[k]) errors[k] = `Merci d’indiquer ${LABEL[k]}.`;
  if (!errors.nom && c.nom.length < 2) errors.nom = 'Nom trop court.';
  if (!errors.prenom && c.prenom.length < 2) errors.prenom = 'Prénom trop court.';
  if (!errors.nom && /\d/.test(c.nom)) errors.nom = 'Le nom ne doit pas contenir de chiffres.';
  if (!errors.prenom && /\d/.test(c.prenom)) errors.prenom = 'Le prénom ne doit pas contenir de chiffres.';
  if (c.naissance && !errors.naissance) {
    const a = ageFrom(c.naissance, now);
    if (a === null) errors.naissance = 'Date de naissance invalide.';
    else if (a < 5 || a > 100) errors.naissance = 'Vérifiez la date de naissance.';
    else c.age = a;
  }
  if (c.tel && !errors.tel && c.tel.replace(/\D/g, '').length < 8) errors.tel = 'Numéro de téléphone trop court.';
  if (c.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email)) errors.email = 'Adresse email invalide.';
  if (!c.photo) errors.photo = 'Une photo est nécessaire pour l’attestation.';
  return { errors, clean: c, ok: Object.keys(errors).length === 0 };
}
export const fullName = (i) => [i?.prenom, i?.nom].filter(Boolean).join(' ');
export const civ = (i) => (i?.civilite === 'F' ? 'Mme / Mlle' : i?.civilite === 'M' ? 'M.' : '');
