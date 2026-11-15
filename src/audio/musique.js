// Musique de fond douce, fabriquée par le téléphone (aucun fichier à télécharger) :
// des accords tenus et un petit arpège, en boucle, à faible volume.
let ctx = null, maitre = null, minuterie = null, pas = 0;
const ACCORDS = [[261.63, 329.63, 392.0], [196.0, 246.94, 293.66], [220.0, 261.63, 329.63], [174.61, 220.0, 261.63]];   // Do, Sol, La m, Fa
function note(f, t, d, v, type = 'sine') {
  const o = ctx.createOscillator(), g = ctx.createGain();
  o.type = type; o.frequency.value = f; o.connect(g); g.connect(maitre);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v, t + Math.min(0.4, d / 3)); g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.start(t); o.stop(t + d + 0.05);
}
function mesure() {
  const t = ctx.currentTime + 0.05, a = ACCORDS[Math.floor(pas / 4) % 4];
  if (pas % 4 === 0) a.forEach((f) => note(f / 2, t, 2.6, 0.05, 'triangle'));
  const m = [a[0], a[1], a[2], a[1] * 2][pas % 4];
  note(m * 2, t, 0.6, 0.035, 'sine');
  pas++;
}
export function jouerMusique() {
  try {
    if (!ctx) { ctx = new (window.AudioContext || window.webkitAudioContext)(); maitre = ctx.createGain(); maitre.gain.value = 0.8; maitre.connect(ctx.destination); }
    ctx.resume(); if (minuterie) return; mesure(); minuterie = setInterval(mesure, 650);
  } catch {}
}
export function arreterMusique() { clearInterval(minuterie); minuterie = null; try { ctx?.suspend(); } catch {} }
