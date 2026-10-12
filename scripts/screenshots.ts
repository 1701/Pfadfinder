// Captures dev pages in both iPad formats (pfadfinder-ui skill: check every UI change on
// 1024×768 and 768×1024). Usage: npm run screenshots  → tests/e2e/screenshots/*.png

import { mkdirSync } from 'node:fs';
import { chromium, devices } from '@playwright/test';
import { createServer } from 'vite';

const PAGES = [
  { name: 'tokens', path: '/dev/tokens' },
  { name: 'karte', path: '/dev/karte' },
];
// iPad touch/scale profile, but exactly the viewports named in the skill.
const VIEWPORTS = [
  {
    name: 'ipad-landscape',
    device: { ...devices['iPad (gen 7) landscape'], viewport: { width: 1024, height: 768 } },
  },
  {
    name: 'ipad-portrait',
    device: { ...devices['iPad (gen 7)'], viewport: { width: 768, height: 1024 } },
  },
];
const OUT = 'tests/e2e/screenshots';

const server = await createServer({ server: { port: 5199, strictPort: true }, logLevel: 'error' });
await server.listen();
const browser = await chromium.launch();
mkdirSync(OUT, { recursive: true });

try {
  for (const { name: viewport, device } of VIEWPORTS) {
    const context = await browser.newContext(device);
    const page = await context.newPage();
    for (const { name, path } of PAGES) {
      await page.goto(`http://localhost:5199${path}`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const file = `${OUT}/${name}-${viewport}.png`;
      await page.screenshot({ path: file, fullPage: true });
      console.log(`Screenshot: ${file}`);
    }
    await context.close();
  }
} finally {
  await browser.close();
  await server.close();
}
