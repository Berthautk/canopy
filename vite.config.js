import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

import { readFileSync } from 'node:fs';

const { version } = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));

export default defineConfig({
  define: { __VERSION__: JSON.stringify(version) },
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: false,       // enregistrement fait à la main dans src/main.jsx
      manifest: false,             // on garde public/manifest.webmanifest
      workbox: {
        // Coquille de l'app : précachée pour fonctionner hors ligne dès la 1re visite.
        globPatterns: ['**/*.{js,css,html,woff2,ico,webmanifest}', 'icons/*.png'],
        // Les illustrations ne sont pas précachées (poids) : mises en cache à la demande.
        globIgnores: ['assets/**', 'bible/**'],
        navigateFallback: '/index.html',
        runtimeCaching: [
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
  build: { target: 'es2019', assetsInlineLimit: 0 },
});
