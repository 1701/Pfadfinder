// The map on four viewports (the two iPad sizes and the same iPad in Safari with its bars):
// no scrolling, readable names, large tap targets, one layout at a time, keyboard order and
// focus ring. /dev/karte shows every state at once (dev build only); / is the real start page.
// The line below the map (task 14): one row everywhere, except /dev/karte?neu in portrait, where
// "Neu laden" has its own row above the two groups. Names ≥ 18 px, only ?neu in Safari portrait
// (768×900) ≥ 17 px (decision Markus: rare, short state, a button for adults; children play in the
// installed app, 768×1024, where 18 px holds with "Neu laden" too).
// Before the very first Fundstück (task 17, /dev/karte?erstes and / after "Später") one sentence
// stands in place of the dashes, in portrait also of "Heute …": no Gebietsname and no Gebiet gets
// smaller than without it.
// "Eltern" (/eltern, task L) stands right before "Impressum" in every viewport and state: "Für
// Eltern" there or behind the Probetests took the line to two rows in portrait. The map never links
// the device area (/eltern/geraet).
// Signs of the Gebiete (SU Phase B): ≥ 18 px apart in portrait, ≥ 15 px in landscape (decision
// Markus 2026-10-25), inside their Gebiet, clear of the island names. / shows no sign on a Gebiet
// without items; /dev/karte?alle shows all ten, as / does once every Bereich has items.

import { expect, test, type Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import { FUNDSTUECK_HINWEIS as HINWEIS, SCREENSHOTS, expectMapLabels, mapLabels } from './helpers';

const VIEWPORTS = [
  { name: 'ipad-landscape', width: 1024, height: 768 },
  { name: 'ipad-portrait', width: 768, height: 1024 },
  { name: 'safari-landscape', width: 1024, height: 660 },
  { name: 'safari-portrait', width: 768, height: 900 },
];

async function measure(page: Page) {
  await page.getByRole('group', { name: 'Karte' }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  return page.evaluate((hinweis) => {
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
      // Height of the map's box (the water) and of the header above it.
      mapHeight: map.getBoundingClientRect().height,
      headerHeight: document.querySelector('main > header')!.getBoundingClientRect().height,
      // Water between the drawn islands (centred in the box) and the line below the map.
      air: (() => {
        const box = map.getBoundingClientRect();
        const drawn = map.viewBox.baseVal.height * scale;
        const line = document.querySelector('main > div:last-child')!.getBoundingClientRect();
        return line.top - (box.top + (box.height + drawn) / 2);
      })(),
      // The quiet actions below the map: Probetest, new version, Impressum · Datenschutz.
      // Only visible ones (width > 0) count.
      legend: [...document.querySelectorAll('main > div:last-child :is(a, button)')]
        .map((e) => ({ name: e.textContent, rect: e.getBoundingClientRect() }))
        .filter(({ rect }) => rect.width > 0)
        .map(({ name, rect }) => ({ name, height: rect.height, bottom: rect.bottom })),
      line: document.querySelector('main > div:last-child')!.getBoundingClientRect().height,
      elternHref: [...document.querySelectorAll('main > div:last-child a')]
        .find((a) => a.textContent === 'Eltern')
        ?.getAttribute('href'),
      geraetLinks: document.querySelectorAll('a[href*="geraet"]').length,
      // The Tagesziel: dashes, "Heute …" and the sentence before the first Fundstück, if shown.
      dashes: document.querySelector('header ol')?.getBoundingClientRect().width ?? 0,
      heute: [...document.querySelectorAll('header p')]
        .filter((p) => p.textContent?.startsWith('Heute'))
        .some((p) => p.getBoundingClientRect().width > 0),
      hint: [...document.querySelectorAll('header p')]
        .filter((p) => p.textContent === hinweis)
        .map((p) => p.getBoundingClientRect())
        .filter((r) => r.width > 0)
        .map((r) => ({ height: r.height }))[0],
    };
  }, HINWEIS);
}

/** Checks of the sentence before the first Fundstück; `base` is the same page without it. */
function expectHint(
  url: string,
  m: Awaited<ReturnType<typeof measure>>,
  portrait: boolean,
  base?: Awaited<ReturnType<typeof measure>>,
) {
  expect(m.hint, `${url}: sentence before the first Fundstück`).toBeDefined();
  expect(m.dashes, `${url}: dashes beside the sentence`).toBe(0);
  // Portrait: one line in place of dashes and "Heute …"; landscape: at most two lines above it.
  expect(m.heute, `${url}: "Heute …"`).toBe(!portrait);
  expect(m.hint!.height, `${url}: lines`).toBeLessThanOrEqual(portrait ? 27 : 53);
  if (!base) return;
  expect(m.smallestName, `${url}: names smaller`).toBeGreaterThanOrEqual(base.smallestName - 0.1);
  expect(m.smallestTarget, `${url}: Gebiete smaller`).toBeGreaterThanOrEqual(
    base.smallestTarget - 0.5,
  );
}

for (const viewport of VIEWPORTS) {
  test(`Karte passt auf ${viewport.name} (${viewport.width}×${viewport.height})`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const budget: Record<string, unknown> = {};
    const measured: Record<string, Awaited<ReturnType<typeof measure>>> = {};
    const urls = [
      '/dev/karte',
      '/dev/karte?neu',
      '/dev/karte?erstes',
      '/dev/karte?erstes&neu',
      '/dev/karte?alle',
      '/',
    ];
    for (const url of urls) {
      await page.goto(url);
      const m = await measure(page);
      measured[url] = m;
      expect(m.overflow, `${url}: page scrolls`).toBeLessThanOrEqual(0);
      expect(m.overflowX, `${url}: page scrolls sideways`).toBeLessThanOrEqual(0);
      expect(m.visibleMaps, `${url}: exactly one layout`).toBe(1);
      const query = new URL(url, 'http://karte').searchParams;
      const neu = query.has('neu');
      const portrait = viewport.height > viewport.width;
      if (query.has('erstes')) {
        expectHint(url, m, portrait, measured[neu ? '/dev/karte?neu' : '/dev/karte']);
      } else {
        expect(m.hint, `${url}: no sentence`).toBeUndefined();
      }
      const labels = await mapLabels(page);
      expectMapLabels(labels, url, portrait);
      const minName = neu && viewport.name === 'safari-portrait' ? 17 : 18;
      expect(m.smallestName, `${url}: names below ${minName} px`).toBeGreaterThanOrEqual(minName);
      expect(m.smallestTarget, `${url}: Gebiet smaller than 48 px`).toBeGreaterThanOrEqual(48);
      expect(m.mapBottom, `${url}: map leaves the screen`).toBeLessThanOrEqual(m.height);
      expect(m.legend.map((l) => l.name)).toEqual(
        expect.arrayContaining(['Impressum', 'Datenschutz']),
      );
      const names = m.legend.map((l) => l.name);
      expect(names[names.indexOf('Impressum') - 1], `${url}: "Eltern" before "Impressum"`).toBe(
        'Eltern',
      );
      expect(m.elternHref, `${url}: "Eltern" leads to /eltern`).toBe('/eltern');
      expect(m.geraetLinks, `${url}: link to the device area`).toBe(0);
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
        smallestTarget: Math.round(m.smallestTarget),
        lineRows: rows.length,
        lineHeight: Math.round(m.line),
        headerHeight: Math.round(m.headerHeight),
        mapHeight: Math.round(m.mapHeight),
        air: Math.round(m.air),
        minLabelGap: labels.minLabelGap,
        plateToOutline: labels.plateToOutline,
        labelToIslandName: labels.labelToIslandName,
      };
    }
    // The real start page of a new device after "Später": the sentence instead of the dashes.
    await page.goto('/');
    await page.getByRole('button', { name: 'Später' }).click();
    await page.getByText(HINWEIS).waitFor();
    const later = await measure(page);
    expectHint('/ nach Später', later, viewport.height > viewport.width);
    expect(later.overflow, '/ nach Später: page scrolls').toBeLessThanOrEqual(0);
    expect(later.smallestName, '/ nach Später: names').toBeGreaterThanOrEqual(18);
    expect(later.smallestTarget, '/ nach Später: Gebiete').toBeGreaterThanOrEqual(48);
    budget['/ nach Später'] = {
      smallestName: Number(later.smallestName.toFixed(1)),
      smallestTarget: Math.round(later.smallestTarget),
      headerHeight: Math.round(later.headerHeight),
      mapHeight: Math.round(later.mapHeight),
      air: Math.round(later.air),
    };
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
    await page.goto('/dev/karte?erstes');
    await measure(page);
    await page.screenshot({ path: `${SCREENSHOTS}/karte-erstes-${viewport.name}.png` });
    await page.goto('/dev/karte?geschafft');
    await measure(page);
    await page.screenshot({ path: `${SCREENSHOTS}/karte-geschafft-${viewport.name}.png` });
    await page.goto('/dev/karte?alle');
    await measure(page);
    await page.screenshot({ path: `${SCREENSHOTS}/karte-alle-${viewport.name}.png` });
  });
}

test('Tastatur: Gebiete in Leserichtung, Fokusring auf der Umrisslinie', async ({ page }) => {
  await page.setViewportSize(VIEWPORTS[0]!);
  await page.goto('/dev/karte');
  await measure(page);
  const reached: string[] = [];
  for (let i = 0; i < 9; i++) {
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
    'Wörter und Sätze, Niveau 2',
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
    label: 'Wörter und Sätze, Niveau 2',
    width: '6px',
    focusVisible: true,
  });
});
