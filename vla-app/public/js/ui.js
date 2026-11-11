export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const fmtTime = (s) => { s = Math.max(0, Math.round(s)); return `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`; };
export const fmtDate = (t, long = false) => t ? new Date(t).toLocaleDateString('fr-FR', long ? { day: 'numeric', month: 'long', year: 'numeric' } : { day: '2-digit', month: '2-digit', year: 'numeric' }) : '';
export const fmtDateTime = (t) => t ? new Date(t).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' }) : '';
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
export const LEVEL_NAMES = { 'Pré-A1': 'Découverte', A1: 'Débutant', A2: 'Élémentaire', B1: 'Intermédiaire', B2: 'Interm. avancé', C1: 'Avancé', 'Débutant': 'Débutant', Starter: 'Starter', '< B1': 'Inférieur à B1' };
export const TEST_NAMES = { ADU: 'Adolescents & Adultes', ENF: 'Enfants (8–13 ans)', IEL: 'Préparation IELTS / TOEFL' };
export const TEST_ICONS = { ADU: '🎓', ENF: '🧒', IEL: '🌍' };
export const IMG = { logo: 'assets/logo_vla.png', valerie: 'assets/people/valerie.jpg', formatrice: 'assets/people/formatrice.jpg' };

let tt;
export function toast(msg, ms = 2400) {
  let el = $('.toast'); if (!el) { el = document.createElement('div'); el.className = 'toast'; document.body.append(el); }
  el.textContent = msg; el.classList.remove('hidden'); clearTimeout(tt); tt = setTimeout(() => el.classList.add('hidden'), ms);
}

/** Réduit une photo (fichier ou capture caméra) en JPEG carré ~240 px, retourné en dataURL. */
export function resizePhoto(file, size = 240) {
  return new Promise((res, rej) => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas'); c.width = c.height = size;
      const s = Math.min(img.width, img.height);
      c.getContext('2d').drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      URL.revokeObjectURL(img.src); res(c.toDataURL('image/jpeg', 0.8));
    };
    img.onerror = rej; img.src = URL.createObjectURL(file);
  });
}

export function qrSvg(text, cell = 6, ecc = 'M') {
  if (typeof qrcode === 'undefined') return '';
  const q = qrcode(0, ecc); q.addData(text); q.make();
  return q.createSvgTag({ cellSize: cell, margin: 2, scalable: true });
}

export function waLink(phone, text) {
  const p = String(phone || '').replace(/[^\d]/g, '');
  const num = p.length === 9 ? '237' + p : p; // numéros camerounais saisis sans indicatif
  return `https://wa.me/${num}?text=${encodeURIComponent(text || '')}`;
}

export function loadScript(src) {
  return new Promise((res, rej) => { if (document.querySelector(`script[data-src="${src}"]`)) return res(); const s = document.createElement('script'); s.src = src; s.dataset.src = src; s.onload = res; s.onerror = rej; document.head.append(s); });
}
