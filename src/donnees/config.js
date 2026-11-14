// Adresse du dépôt public des MP3 (GitHub Pages). Voir GUIDE_AUDIO.md.
export const AUDIO_BASE = 'https://berthautk.github.io/yeshaya-audio/';

// Le champ « audio » d'un contenu peut être : une URL complète, un chemin local (/audio-exemples/…),
// ou un chemin relatif au dépôt yeshaya-audio (« enseignements/salut.mp3 »).
export function urlAudio(a) {
  if (!a) return null;
  return /^https?:\/\//.test(a) || a.startsWith('/') ? a : AUDIO_BASE + a.replace(/^\.?\//, '');
}
