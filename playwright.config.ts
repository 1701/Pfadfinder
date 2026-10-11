import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  use: { baseURL: 'http://localhost:4173' },
  webServer: {
    command: 'npm run build && npm run preview',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'tablet-landscape', use: { ...devices['iPad (gen 7) landscape'] } },
    { name: 'tablet-portrait', use: { ...devices['iPad (gen 7)'] } },
  ],
});
