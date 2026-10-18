// The Einstieg screens and the map with the offer on four viewports (the two iPad sizes and the
// same iPad in Safari with its bars): no scrolling, large targets, buttons on screen.
// /dev/einstieg shows each screen with fixed data (dev build only); / is the real start page,
// which offers the Einstieg to a new learner (Mathe); /dev/karte?angebot=deutsch shows the longer
// Deutsch offer. Smallest names go to karte-angebot-budget-*.json. Screenshots for review.

import { expect, test, type Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { SCREENSHOTS, expectFitsScreen } from './helpers';

const VIEWPORTS = [
  { name: 'ipad-landscape', width: 1024, height: 768 },
  { name: 'ipad-portrait', width: 768, height: 1024 },
  { name: 'safari-landscape', width: 1024, height: 660 },
  { name: 'safari-portrait', width: 768, height: 900 },
];
const ZUSTAENDE = ['intro', 'intro-deutsch', 'aufgabe', 'pause', 'ergebnis', 'hinweis'] as const;
/** What the offer asks, per Fach (src/ui/text/einstieg.ts). */
const OFFER_TITLE = (fach: string) => `Wo geht's in ${fach} los?`;

async function measure(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  return page.evaluate(() => {
    const visible = (e: Element) => e.getBoundingClientRect().width > 0;
    const targets = [...document.querySelectorAll('main a, main button')].filter(visible);
    const map = [...document.querySelectorAll<SVGSVGElement>('svg[aria-label="Karte"]')].find(
      visible,
    );
    const scale = map?.getScreenCTM()?.a ?? 1;
    const band = document.querySelector('[data-region="band"]');
    return {
      overflow: document.documentElement.scrollHeight - window.innerHeight,
      overflowX: document.documentElement.scrollWidth - window.innerWidth,
      smallestTarget: Math.min(
        ...targets.map((t) =>
          Math.min(t.getBoundingClientRect().width, t.getBoundingClientRect().height),
        ),
      ),
      bandBottom: band ? window.innerHeight - band.getBoundingClientRect().bottom : 0,
      lastButtonHeight: band?.lastElementChild?.getBoundingClientRect().height ?? 56,
      smallestName: map
        ? Math.min(
            ...[...map.querySelectorAll('text')].map(
              (t) => parseFloat(getComputedStyle(t).fontSize) * scale,
            ),
          )
        : 18,
      mapBottom: map?.getBoundingClientRect().bottom ?? 0,
      bandTop: band?.getBoundingClientRect().top ?? window.innerHeight,
    };
  });
}

for (const viewport of VIEWPORTS) {
  test(`Einstieg passt auf ${viewport.name} (${viewport.width}×${viewport.height})`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    for (const zustand of ZUSTAENDE) {
      await page.goto(`/dev/einstieg?zustand=${zustand}`);
      await page.locator('main').waitFor();
      if (zustand === 'aufgabe') {
        await page.getByRole('heading', { level: 1 }).waitFor();
        await page.locator('main label').first().click();
        await expectFitsScreen(page, `${zustand} ${viewport.name}`);
        await expect(page.getByRole('button', { name: 'Weiter' })).toBeEnabled();
      }
      if (zustand === 'ergebnis')
        await page.getByRole('group', { name: 'Karte' }).first().waitFor();
      const m = await measure(page);
      const label = `${zustand} ${viewport.name}`;
      expect(m.overflow, `${label}: page scrolls`).toBeLessThanOrEqual(0);
      expect(m.overflowX, `${label}: page scrolls sideways`).toBeLessThanOrEqual(0);
      expect(m.smallestTarget, `${label}: target below 48 px`).toBeGreaterThanOrEqual(48);
      expect(m.bandBottom, `${label}: band leaves the screen`).toBeGreaterThanOrEqual(0);
      expect(m.lastButtonHeight, `${label}: button lower than 56 px`).toBeGreaterThanOrEqual(56);
      expect(m.smallestName, `${label}: names below 18 px`).toBeGreaterThanOrEqual(18);
      if (zustand === 'ergebnis') {
        expect(m.mapBottom, `${label}: map runs under the band`).toBeLessThanOrEqual(m.bandTop);
      }
      await page.screenshot({ path: `${SCREENSHOTS}/einstieg-${zustand}-${viewport.name}.png` });
    }

    // The real start page of a new learner (Mathe) and the longer Deutsch offer: the offer in
    // the header, the map at full size.
    const budget: Record<string, unknown> = {};
    for (const [fach, url, shot] of [
      ['Mathe', '/', 'karte-angebot'],
      ['Deutsch', '/dev/karte?angebot=deutsch', 'karte-angebot-deutsch'],
    ] as const) {
      const label = `Karte mit Angebot ${fach}`;
      const title = OFFER_TITLE(fach);
      await page.goto(url);
      await expect(page.getByRole('heading', { name: title })).toBeVisible();
      await page.getByRole('group', { name: 'Karte' }).first().waitFor();
      const box = async (name: string, role: 'heading' | 'link' | 'button') =>
        (await page.getByRole(role, { name, exact: true }).boundingBox())!;
      const boxes = await Promise.all([
        box(title, 'heading'),
        box('Los', 'link'),
        box('Später', 'button'),
      ]);
      const row = boxes.map((b) => b.y + b.height / 2);
      const right = Math.max(...boxes.map((b) => b.x + b.width));
      const m = await measure(page);
      expect(m.overflow, `${label}: page scrolls`).toBeLessThanOrEqual(0);
      expect(m.overflowX, `${label}: page scrolls sideways`).toBeLessThanOrEqual(0);
      expect(m.smallestName, `${label}: names below 18 px`).toBeGreaterThanOrEqual(18);
      expect(m.smallestTarget, `${label}: target below 48 px`).toBeGreaterThanOrEqual(48);
      // One header row: question, Los and Später side by side, no Tagesziel, inside the page.
      expect(Math.max(...row) - Math.min(...row), `${label}: header wraps`).toBeLessThan(12);
      expect(right, `${label}: header leaves the page`).toBeLessThanOrEqual(viewport.width);
      await expect(page.getByText(/Fundstücken/)).toHaveCount(0);
      budget[fach] = {
        smallestName: Number(m.smallestName.toFixed(1)),
        headerRight: Math.round(right),
        headerSpare: Math.round(viewport.width - right),
      };
      await page.screenshot({ path: `${SCREENSHOTS}/${shot}-${viewport.name}.png` });
    }
    writeFileSync(
      `${SCREENSHOTS}/karte-angebot-budget-${viewport.name}.json`,
      `${JSON.stringify(budget, null, 2)}\n`,
    );
  });
}
