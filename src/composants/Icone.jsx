// Icônes SVG au trait (24×24), dessinées pour Yeshaya et inspirées du style de Lucide (licence ISC).
// Elles prennent la couleur du texte (currentColor) : elles s'adaptent donc au mode sombre.
const P = {
  menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
  reglages: <><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z" /><circle cx="12" cy="12" r="3" /></>,
  retour: <><path d="M19 12H5M12 19l-7-7 7-7" /></>,
  chevron: <><path d="m9 6 6 6-6 6" /></>,
  accueil: <><path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V20a1 1 0 0 0 1 1h4v-6h4v6h4a1 1 0 0 0 1-1V9.5" /></>,
  priere: <><path d="M12 3c-1.3 0-2.1 1-2.3 2.3L8.8 11c-.2 1.3-.9 2.3-1.8 3.2L4.6 16.6" /><path d="M12 3c1.3 0 2.1 1 2.3 2.3l.9 5.7c.2 1.3.9 2.3 1.8 3.2l2.4 2.4" /><path d="M12 3v13" /><path d="M9.3 8.8c1.2.4 2 1.4 2.7 2.7M14.7 8.8c-1.2.4-2 1.4-2.7 2.7" /><path d="M3.2 18 6.2 21M20.8 18l-3 3" /><path d="M4.6 16.6 8 20l2.6-2.4c.9-.8 1.4-1.6 1.4-1.6s.5.8 1.4 1.6L16 20l3.4-3.4" /></>,
  grandir: <><path d="M12 21v-9" /><path d="M12 12C12 7.5 8.8 5 4 5c0 4.6 3.2 7 8 7z" /><path d="M12 14c0-4 2.8-6.5 7.5-6.5 0 4-2.8 6.5-7.5 6.5z" /><path d="M7 21h10" /></>,
  evangeliser: <><path d="M3 10v4a1 1 0 0 0 1 1h2l9 5V4L6 9H4a1 1 0 0 0-1 1z" /><path d="M6 15l1.5 5.5h2.5L9 16" /><path d="M18.5 9a4 4 0 0 1 0 6" /></>,
  bible: <><path d="M2 4.5h6a4 4 0 0 1 4 4V21a3 3 0 0 0-3-3H2z" /><path d="M22 4.5h-6a4 4 0 0 0-4 4V21a3 3 0 0 1 3-3h7z" /></>,
  lecture: <><path d="M7 4.5v15l12.5-7.5z" fill="currentColor" stroke="none" /></>,
  pause: <><path d="M7 4h3.5v16H7zM13.5 4H17v16h-3.5z" fill="currentColor" stroke="none" /></>,
  calendrier: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M8 3v4M16 3v4M3 10h18" /></>,
  telecharger: <><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></>,
  info: <><circle cx="12" cy="12" r="9.5" /><path d="M12 16.5v-5M12 7.8v.2" /></>,
  soleil: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  lune: <><path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z" /></>,
  texte: <><path d="M3 19 8.5 5h1L15 19M5.2 14h7.6" /><path d="M16 19l3-7.5h.6L22.5 19M17 16.5h4.4" /></>,
  bouclier: <><path d="M12 3 20 6v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="m9 12 2 2 4-4" /></>,
  horsligne: <><path d="M2 2l20 20M8.5 16.4a5 5 0 0 1 7 0M5 12.9a10 10 0 0 1 4-2.5M19 12.9a10 10 0 0 0-2.6-1.9M2 9.3a15 15 0 0 1 4.2-2.7M22 9.3A15 15 0 0 0 11 5.1M12 20h.01" /></>,
  coeur: <><path d="M19.5 13.6 12 21l-7.5-7.4A5 5 0 0 1 12 6.6a5 5 0 0 1 7.5 7z" /></>,
  groupe: <><circle cx="9" cy="8" r="3.5" /><path d="M2.5 20c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6" /><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18 14.3c2.1.7 3.5 2.8 3.5 5.7" /></>,
  cible: <><circle cx="12" cy="12" r="9" /><circle cx="12" cy="12" r="5" /><circle cx="12" cy="12" r="1" /></>,
  trophee: <><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0z" /><path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4" /></>,
  musique: <><path d="M9 18V5l11-2v13" /><circle cx="6" cy="18" r="3" /><circle cx="17" cy="16" r="3" /></>,
  radio: <><circle cx="12" cy="12" r="2" /><path d="M8.5 8.5a5 5 0 0 0 0 7M15.5 8.5a5 5 0 0 1 0 7M5.6 5.6a9 9 0 0 0 0 12.8M18.4 5.6a9 9 0 0 1 0 12.8" /></>,
  sauvegarder: <><path d="M12 15V3M7 8l5-5 5 5" /><path d="M4 14v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" /></>,
  restaurer: <><path d="M12 3v12M7 10l5 5 5-5" /><path d="M4 14v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5" /></>,
  donnees: <><ellipse cx="12" cy="5.5" rx="8" ry="3" /><path d="M4 5.5v13c0 1.7 3.6 3 8 3s8-1.3 8-3v-13M4 12c0 1.7 3.6 3 8 3s8-1.3 8-3" /></>,
  appareil: <><path d="M4 8h3l1.5-2.5h7L17 8h3a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9a1 1 0 0 1 1-1z" /><circle cx="12" cy="13.5" r="3.5" /></>,
  partager: <><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.6 13.5 6.8 4M15.4 6.5l-6.8 4" /></>,
  copier: <><rect x="8" y="8" width="13" height="13" rx="2" /><path d="M16 8V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h3" /></>,
  surligner: <><path d="m9 11-6 6v3h9l3-3" /><path d="m22 12-4.6 4.6a2 2 0 0 1-2.8 0l-5.2-5.2a2 2 0 0 1 0-2.8L14 4" /></>,
  note: <><path d="M4 20h4L19 9a2.8 2.8 0 0 0-4-4L4 16z" /><path d="m13.5 6.5 4 4" /></>,
  agrandir: <><path d="M15 3h6v6M9 21H3v-6M21 3l-7 7M3 21l7-7" /></>,
  recherche: <><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></>,
  precedent: <><path d="m15 6-6 6 6 6" /></>,
  liste: <><path d="M8 6h13M8 12h13M8 18h13M3.5 6h.01M3.5 12h.01M3.5 18h.01" /></>,
  ampoule: <><path d="M9 18h6M10 22h4" /><path d="M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.3 1 2.3h6c0-1 .4-1.8 1-2.3A7 7 0 0 0 12 2z" /></>,
  etoile: <><path d="m12 3 2.8 5.7 6.2.9-4.5 4.4 1 6.2L12 17.3 6.5 20.2l1-6.2L3 9.6l6.2-.9z" /></>,
  croix: <><path d="M10 2h4v6h6v4h-6v10h-4V12H4V8h6z" /></>,
  reculer15: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /><text x="12" y="15.5" font-size="7.5" font-weight="700" text-anchor="middle" fill="currentColor" stroke="none" font-family="sans-serif">15</text></>,
  avancer15: <><path d="M21 12a9 9 0 1 1-3-6.7L21 8" /><path d="M21 3v5h-5" /><text x="12" y="15.5" font-size="7.5" font-weight="700" text-anchor="middle" fill="currentColor" stroke="none" font-family="sans-serif">15</text></>,
  corbeille: <><path d="M3 6h18M8 6V4h8v2M6 6l1 14h10l1-14M10 11v6M14 11v6" /></>,
  cadenas: <><rect x="4" y="10.5" width="16" height="11" rx="2" /><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5" /></>,
  rejouer: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" /></>,
  trier: <><path d="M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4" /></>,
  fermer: <><path d="M6 6l12 12M18 6 6 18" /></>,
  verifie: <><path d="m5 12.5 4.5 4.5L19 7.5" /></>,
};

export function Icone({ nom, taille = 24, ...rest }) {
  return (
    <svg viewBox="0 0 24 24" width={taille} height={taille} fill="none" stroke="currentColor" stroke-width="2"
      stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false" {...rest}>
      {P[nom]}
    </svg>
  );
}

// Emblème du logo (croix, soleil levant, chemin, Bible ouverte), redessiné en SVG pour rester net à toute taille.
export function Embleme(props) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden="true" {...props}>
      <g stroke="#C9A85B" stroke-width="1.6" stroke-linecap="round">
        <path d="M10 22 6 19M38 22l4-3M14 16l-3-4M34 16l3-4M19 13l-1-4M29 13l1-4" />
      </g>
      <path d="M13 26a11 11 0 0 1 22 0z" fill="#C9A85B" opacity=".9" />
      <rect x="22.2" y="4" width="3.6" height="22" rx=".8" fill="#E7C979" />
      <rect x="17" y="9.5" width="14" height="3.4" rx=".8" fill="#E7C979" />
      <path d="M6 31c6-2 13-1.5 18 2 5-3.5 12-4 18-2v7c-6-2-13-1.5-18 2-5-3.5-12-4-18-2z" fill="#fff" />
      <path d="M24 33v7" stroke="#C9A85B" stroke-width="1.2" />
      <path d="M8.5 33.8c5-1.2 10-.6 13.5 1.4M26 35.2c3.5-2 8.5-2.6 13.5-1.4" stroke="#C9A85B" stroke-width=".9" fill="none" />
    </svg>
  );
}
