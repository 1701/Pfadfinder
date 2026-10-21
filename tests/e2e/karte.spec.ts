// The map on four viewports (the two iPad sizes and the same iPad in Safari with its bars):
// no scrolling, readable names, large tap targets, one layout at a time, keyboard order and
// focus ring. /dev/karte shows every state at once (dev build only); / is the real start page.
// The line below the map (task 14): one row everywhere, except /dev/karte?neu in portrait, where
// "Neu laden" has its own row above the two groups. Names ≥ 18 px, only ?neu in Safari portrait
// (768×900) ≥ 17 px (decision Markus: rare, short state, a button for adults; children play in the
// installed app, 768×1024, where 18 px holds with "Neu laden" too).

import { expect, test, type Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { SCREENSHOTS } from './helpers';

const VIEWPORTS = [
  { name: 'ipad-landscape', width: 1024, height: 768 },
  { name: 'ipad-portrait', width: 768, height: 1024 },
  { name: 'safari-landscape', width: 1024, height: 660 },
  { name: 'safari-portrait', width: 768, height: 900 },
];

async function measure(page: Page) {
  await page.getByRole('group', { name: 'Karte' }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  return page.evaluate(() => {
    const maps = [...document.querySelectorAll<SVGSVGElement>('svg[aria-label="Karte"]')];
    const visible = maps.filter((m) => m.getBoundingClientRect().width > 0);
    const map = visible[0]!;
    const scale = map.getScreenCTM()!.a;
    return {
      overflow: document.documentElement.scrollHeight - window.innerHeight,
      overflowX: document.documentElement.scrollWidth - window.innerWidth,
      visibleMaps: visible.length,
      smallestName: Math.min(
        ...[...map.querySelectorAll('text')].map(
          (t) => parseFloat(getComputedStyle(t).fontSize) * scale,
        ),
      ),
      smallestTarget: Math.min(
        ...[...map.querySelectorAll('a')].flatMap((a) => {
          const r = a.getBoundingClientRect();
          return [r.width, r.height];
        }),
      ),
      mapBottom: map.getBoundingClientRect().bottom,
      height: window.innerHeight,
      // The quiet actions below the map: Probetest, new version, Impressum · Datenschutz.
      // Only visible ones (width > 0) count.
      legend: [...document.querySelectorAll('main > div:last-child :is(a, button)')]
        .map((e) => ({ name: e.textContent, rect: e.getBoundingClientRect() }))
        .filter(({ rect }) => rect.width > 0)
        .map(({ name, rect }) => ({ name, height: rect.height, bottom: rect.bottom })),
      line: document.querySelector('main > div:last-child')!.getBoundingClientRect().height,
    };
  });
}

for (const viewport of VIEWPORTS) {
  test(`Karte passt auf ${viewport.name} (${viewport.width}×${viewport.height})`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const budget: Record<string, unknown> = {};
    for (const url of ['/dev/karte', '/dev/karte?neu', '/']) {
      await page.goto(url);
      const m = await measure(page);
      expect(m.overflow, `${url}: page scrolls`).toBeLessThanOrEqual(0);
      expect(m.overflowX, `${url}: page scrolls sideways`).toBeLessThanOrEqual(0);
      expect(m.visibleMaps, `${url}: exactly one layout`).toBe(1);
      const neu = url.endsWith('?neu');
      const portrait = viewport.height > viewport.width;
      const minName = neu && viewport.name === 'safari-portrait' ? 17 : 18;
      expect(m.smallestName, `${url}: names below ${minName} px`).toBeGreaterThanOrEqual(minName);
      expect(m.smallestTarget, `${url}: Gebiet smaller than 48 px`).toBeGreaterThanOrEqual(48);
      expect(m.mapBottom, `${url}: map leaves the screen`).toBeLessThanOrEqual(m.height);
      expect(m.legend.map((l) => l.name)).toEqual(
        expect.arrayContaining(['Impressum', 'Datenschutz']),
      );
      const rows = [...new Set(m.legend.map((l) => Math.round(l.bottom)))].sort((a, b) => a - b);
      if (neu) {
        // Both Probetests, "Neu laden" and Impressum · Datenschutz: one row in landscape; in
        // portrait "Neu laden" stands alone in a row above the two groups (built that way).
        expect(m.legend.map((l) => l.name)).toEqual(
          expect.arrayContaining(['Probetest Mathe', 'Probetest Deutsch', 'Neu laden']),
        );
        expect(rows.length, `${url}: rows`).toBe(portrait ? 2 : 1);
        if (portrait) {
          const top = m.legend.filter((l) => Math.round(l.bottom) === rows[0]).map((l) => l.name);
          expect(top, `${url}: "Neu laden" alone on top`).toEqual(['Neu laden']);
        }
      } else {
        // Without "Neu laden" the line stays one row (a second one took the names below 18 px).
        expect(rows.length, `${url}: line wraps`).toBe(1);
      }
      for (const l of m.legend) {
        expect(l.height, `${url}: "${l.name}" below 48 px`).toBeGreaterThanOrEqual(48);
        expect(l.bottom, `${url}: "${l.name}" leaves the screen`).toBeLessThanOrEqual(m.height);
      }
      budget[url] = {
        smallestName: Number(m.smallestName.toFixed(1)),
        lineRows: rows.length,
        lineHeight: Math.round(m.line),
      };
    }
    // Smallest Gebietsname, rows and height of the line below the map per page.
    writeFileSync(
      `${SCREENSHOTS}/karte-budget-${viewport.name}.json`,
      `${JSON.stringify(budget, null, 2)}\n`,
    );
    await page.goto('/dev/karte');
    await measure(page);
    await page.screenshot({ path: `${SCREENSHOTS}/karte-${viewport.name}.png` });
    await page.goto('/dev/karte?neu');
    await measure(page);
    await page.screenshot({ path: `${SCREENSHOTS}/karte-rechtliches-${viewport.name}.png` });
    await page.goto('/dev/karte?geschafft');
    await measure(page);
    await page.screenshot({ path: `${SCREENSHOTS}/karte-geschafft-${viewport.name}.png` });
  });
}

test('Tastatur: Gebiete in Leserichtung, Fokusring auf der Umrisslinie', async ({ page }) => {
  await page.setViewportSize(VIEWPORTS[0]!);
  await page.goto('/dev/karte');
  await measure(page);
  const reached: string[] = [];
  for (let i = 0; i < 8; i++) {
    await page.keyboard.press('Tab');
    const label = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'));
    if (label?.includes('Niveau')) reached.push(label);
  }
  expect(reached).toEqual([
    'Zahlen und Rechnen, Niveau 2',
    'Formen und Raum, Niveau 3, gemeistert',
    'Größen und Messen, Niveau 1',
    'Daten und Zufall, Niveau 1',
    'Sachtexte lesen, Niveau 3',
    'Schreibtricks, Niveau 1',
  ]);
  // Back to the last Gebiet: its outline carries the focus ring.
  await page.keyboard.press('Shift+Tab');
  const ring = await page.evaluate(() => {
    const active = document.activeElement;
    const outline = active?.querySelector('.map-outline');
    return {
      label: active?.getAttribute('aria-label'),
      width: outline && getComputedStyle(outline).strokeWidth,
      focusVisible: active?.matches(':focus-visible'),
    };
  });
  expect(ring).toEqual({
    label: 'Schreibtricks, Niveau 1',
    width: '6px',
    focusVisible: true,
  });
});
