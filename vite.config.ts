import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script',
      manifest: {
        name: 'Pfadfinder – Übungen zur Vorbereitung auf Kompass 4',
        short_name: 'Pfadfinder',
        lang: 'de',
        start_url: '/',
        display: 'standalone',
        background_color: '#fdf8ee',
        theme_color: '#2f6b4f',
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,json,woff2}'],
      },
    }),
  ],
});
