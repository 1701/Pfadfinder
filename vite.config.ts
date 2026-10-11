import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';

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
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,json,woff2}'],
      },
    }),
  ],
});
