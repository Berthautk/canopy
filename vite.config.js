import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join, relative } from 'node:path';

// Index des enseignements : seules les informations de la liste (titre, auteur, résumé…) entrent dans l'app.
// Le texte complet de chaque enseignement est un fichier séparé, téléchargé à l'ouverture (dossier dist/contenus/).
const CHAMPS_INDEX = ['id', 'titre', 'theme', 'serie', 'auteur', 'resume', 'image', 'lecture_minutes', 'video', 'audio', 'duree',
  'exemple', 'date_ajout', 'autorisation'];
function indexEnseignements() {
  const ID = 'virtual:enseignements-index', RID = '\0' + ID, racine = new URL('./content/enseignements', import.meta.url).pathname;
  const fichiers = (d) => readdirSync(d).flatMap((f) => { const p = join(d, f); return statSync(p).isDirectory() ? fichiers(p) : p.endsWith('.json') ? [p] : []; });
  return {
    name: 'index-enseignements',
    resolveId: (id) => (id === ID ? RID : null),
    load(id) {
      if (id !== RID) return null;
      const liste = fichiers(racine).map((f) => {
        this.addWatchFile(f);
        const d = JSON.parse(readFileSync(f, 'utf8'));
        const m = Object.fromEntries(CHAMPS_INDEX.filter((k) => d[k] !== undefined).map((k) => [k, d[k]]));
        return { ...m, traduit: !!d.traduction, chemin: '/content/enseignements/' + relative(racine, f).split('\\').join('/') };
      });
      return 'export default ' + JSON.stringify(liste);
    },
  };
}

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default defineConfig({
  define: { __VERSION__: JSON.stringify(version) },
  plugins: [
    indexEnseignements(),
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,       // enregistrement fait à la main dans src/main.jsx
      manifest: false,             // on garde public/manifest.webmanifest
      workbox: {
        clientsClaim: true,   // contrôle la page dès la 1re visite : ce qui est ouvert est gardé pour le hors ligne
        skipWaiting: true,
        // Coquille de l'app : précachée pour fonctionner hors ligne dès la 1re visite.
        globPatterns: ['**/*.{js,css,html,woff2,ico,webmanifest}', 'icons/*.png'],
        // Les illustrations ne sont pas précachées (poids) : mises en cache à la demande.
        globIgnores: ['assets/**', 'bible/**', 'contenus/**'],
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/api\//, /^\/confidentialite\.html/],
        runtimeCaching: [
          {
            // Texte des enseignements : téléchargé à l'ouverture, puis gardé pour la lecture hors ligne.
            urlPattern: ({ url }) => url.pathname.startsWith('/contenus/'),
            handler: 'CacheFirst',
            options: { cacheName: 'yeshaya-enseignements' },
          },
          {
            // La Bible : téléchargée une fois, puis lue depuis le téléphone (même cache que src/bible/bible.js).
            urlPattern: ({ url }) => url.pathname.startsWith('/bible/'),
            handler: 'CacheFirst',
            options: { cacheName: 'yeshaya-bible' },
          },
          {
            // Audios : servis depuis le téléphone s'ils ont été téléchargés (bouton « Télécharger »),
            // avec réponse aux requêtes partielles (Range) indispensables au lecteur.
            // Aucun audio n'est mis en cache automatiquement : seule la réponse marquée par l'app est gardée.
            urlPattern: ({ url }) => /\.(mp3|m4a|ogg|opus)$/i.test(url.pathname),
            handler: 'CacheFirst',
            options: {
              cacheName: 'yeshaya-audio',
              rangeRequests: true,
              cacheableResponse: { headers: { 'x-yeshaya-telecharge': 'oui' } },
            },
          },
          {
            urlPattern: ({ url }) => url.pathname.startsWith('/assets/'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'yeshaya-images',
              expiration: { maxEntries: 400, maxAgeSeconds: 60 * 60 * 24 * 365 },
            },
          },
        ],
      },
    }),
  ],
  // Le code de l'app va dans dist/app/ (et non dist/assets/, réservé aux illustrations de public/assets).
  build: {
    target: 'es2019', assetsInlineLimit: 0, assetsDir: 'app',
    rollupOptions: { output: { chunkFileNames: (c) => (c.facadeModuleId?.includes('/content/enseignements/') ? 'contenus/[name]-[hash].js' : 'app/[name]-[hash].js') } },
  },
});
