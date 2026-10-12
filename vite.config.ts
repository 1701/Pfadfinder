import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script',
      manifest: {
        name: 'Pfadfinder – Übungen zur Vorbereitung auf Kompass 4',
        short_name: 'Pfadfinder',
        lang: 'de',
        start_url: '/',
        display: 'standalone',
        background_color: '#eef3f1',
        theme_color: '#163a2f',
        // public/icon.svg → npm run icons. The motif lies inside the maskable safe zone.
        icons: [
          { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          {
            src: '/icons/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,json,woff2,png}'],
      },
    }),
    // npm run analyze: module sizes per chunk → bundle-stats.html (not part of dist).
    process.env.ANALYZE ? visualizer({ filename: 'bundle-stats.html', gzipSize: true }) : null,
  ],
});
