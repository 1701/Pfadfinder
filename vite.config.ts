import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
import { execSync } from 'node:child_process';

/**
 * Shown quietly on /eltern: short commit hash and build day, e.g. "a1b2c3d · 18.10.2026".
 * Cloudflare Workers Builds also passes the commit as WORKERS_CI_COMMIT_SHA.
 * PFADFINDER_BUILD_ID replaces it (the second build of the update e2e test).
 */
function buildId(): string {
  if (process.env.PFADFINDER_BUILD_ID) return process.env.PFADFINDER_BUILD_ID;
  let hash = process.env.WORKERS_CI_COMMIT_SHA?.slice(0, 7) ?? 'lokal';
  try {
    hash = execSync('git rev-parse --short=7 HEAD', { stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    // No git in the build environment: keep the fallback.
  }
  const day = new Intl.DateTimeFormat('de-DE', {
    timeZone: 'Europe/Berlin',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(new Date());
  return `${hash} · ${day}`;
}

export default defineConfig({
  define: { __BUILD_ID__: JSON.stringify(buildId()) },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // A new version waits until a parent taps "Neu laden" (src/app/pwa-update.ts), never
      // mid-round: the app registers the worker itself, so no registerSW.js.
      registerType: 'prompt',
      injectRegister: false,
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
