import { defineConfig, devices } from '@playwright/test';

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
      reuseExistingServer: !process.env.CI,
    },
  ],
  projects: [
    {
      name: 'chromium-landscape',
      // update.spec builds a second version; it runs here only (service workers, one run).
      testMatch: /(ueben|pwa|einstieg|eltern|probetest|update)\.spec\.ts/,
      use: { ...landscape, browserName: 'chromium', baseURL: PREVIEW },
    },
    {
      name: 'chromium-portrait',
      testMatch: /(ueben|pwa|einstieg|eltern|probetest)\.spec\.ts/,
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
      testMatch: /(layout|karte|formate|lesen)\.spec\.ts/,
      use: { ...landscape, browserName: 'chromium', baseURL: DEV },
    },
  ],
});
