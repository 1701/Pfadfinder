import { defineConfig, devices } from '@playwright/test';
import { mkdirSync } from 'node:fs';
import { homedir } from 'node:os';
import { join } from 'node:path';

// Browsers write their temporary files to TMPDIR. A /tmp with a per-user quota (tmpfs usrquota,
// 6 256 MiB here) fills within seconds with parallel Chrome, and pages hang (issue #1).
if (!process.env.CI && !process.env.TMPDIR) {
  process.env.TMPDIR = join(homedir(), '.cache', 'pfadfinder-playwright');
  mkdirSync(process.env.TMPDIR, { recursive: true });
}

// iPad touch profile with exactly the viewports from the pfadfinder-ui skill.
const landscape = { ...devices['iPad (gen 7) landscape'], viewport: { width: 1024, height: 768 } };
const portrait = { ...devices['iPad (gen 7)'], viewport: { width: 768, height: 1024 } };
const PREVIEW = 'http://localhost:4173';
const DEV = 'http://localhost:5199';

export default defineConfig({
  testDir: 'tests/e2e',
  timeout: 60_000,
  webServer: [
    {
      command: 'npm run build && npm run preview',
      url: PREVIEW,
      // Always a fresh build: a leftover `vite preview` would test an old bundle (finding 5d).
      reuseExistingServer: false,
    },
    {
      // Dev build for /dev/item previews (layout checks of every item).
      command: 'npx vite --port 5199 --strictPort',
      url: DEV,
      // Never a leftover dev server (issue #1): a taken port 5199 stops the run at once.
      reuseExistingServer: false,
    },
  ],
  projects: [
    {
      name: 'chromium-landscape',
      // update.spec builds a second version; it runs here only (service workers, one run).
      testMatch: /(ueben|pwa|einstieg|eltern|probetest|update|segment-text)\.spec\.ts/,
      use: { ...landscape, browserName: 'chromium', baseURL: PREVIEW },
    },
    {
      name: 'chromium-portrait',
      testMatch: /(ueben|pwa|einstieg|eltern|probetest|segment-text)\.spec\.ts/,
      use: { ...portrait, browserName: 'chromium', baseURL: PREVIEW },
    },
    // The target device is an iPad: Safari's engine for the smoke flow (h-dvh, IndexedDB).
    {
      name: 'webkit-landscape',
      testMatch: /(ueben|pwa|einstieg|eltern|probetest)\.spec\.ts/,
      use: { ...landscape, browserName: 'webkit', baseURL: PREVIEW },
    },
    {
      name: 'webkit-portrait',
      testMatch: /(ueben|pwa|einstieg|eltern|probetest)\.spec\.ts/,
      use: { ...portrait, browserName: 'webkit', baseURL: PREVIEW },
    },
    {
      name: 'layout',
      testMatch: /(layout|karte|formate|lesen|probetest-liste)\.spec\.ts/,
      use: { ...landscape, browserName: 'chromium', baseURL: DEV },
    },
    // Measuring sweeps (task 15): only with PFADFINDER_SWEEP=1, so CI and `npm run e2e` never
    // see them. The spec sets its own viewports.
    ...(process.env.PFADFINDER_SWEEP === '1'
      ? [
          {
            name: 'sweep',
            testMatch: /sweep-.*\.spec\.ts/,
            use: { ...landscape, browserName: 'chromium' as const, baseURL: DEV },
          },
        ]
      : []),
  ],
});
