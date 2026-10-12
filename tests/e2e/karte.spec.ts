// The map on four viewports (the two iPad sizes and the same iPad in Safari with its bars):
// no scrolling, readable names, large tap targets, one layout at a time, keyboard order and
// focus ring. /dev/karte shows every state at once (dev build only); / is the real start page.

import { expect, test, type Page } from '@playwright/test';
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
    };
  });
}

for (const viewport of VIEWPORTS) {
  test(`Karte passt auf ${viewport.name} (${viewport.width}×${viewport.height})`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    for (const url of ['/dev/karte', '/']) {
      await page.goto(url);
      const m = await measure(page);
      expect(m.overflow, `${url}: page scrolls`).toBeLessThanOrEqual(0);
      expect(m.overflowX, `${url}: page scrolls sideways`).toBeLessThanOrEqual(0);
      expect(m.visibleMaps, `${url}: exactly one layout`).toBe(1);
      expect(m.smallestName, `${url}: names below 18 px`).toBeGreaterThanOrEqual(18);
      expect(m.smallestTarget, `${url}: Gebiet smaller than 48 px`).toBeGreaterThanOrEqual(48);
      expect(m.mapBottom, `${url}: map leaves the screen`).toBeLessThanOrEqual(m.height);
    }
    await page.goto('/dev/karte');
    await measure(page);
    await page.screenshot({ path: `${SCREENSHOTS}/karte-${viewport.name}.png` });
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
