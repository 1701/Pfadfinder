// The map on four viewports (the two iPad sizes and the same iPad in Safari with its bars):
// no scrolling, readable names, large tap targets, one layout at a time, keyboard order and
// focus ring. /dev/karte shows every state at once (dev build only); / is the real start page.

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
      // Hidden ones (width 0) do not count: "Neu laden" in Safari portrait.
      legend: [...document.querySelectorAll('main > div:last-child :is(a, button)')]
        .map((e) => ({ name: e.textContent, rect: e.getBoundingClientRect() }))
        .filter(({ rect }) => rect.width > 0)
        .map(({ name, rect }) => ({ name, height: rect.height, bottom: rect.bottom })),
      mapLegend: (() => {
        const legend = map.querySelector<SVGGElement>('[data-map-legend]');
        if (!legend) return null;
        const box = legend.getBBox();
        const view = map.viewBox.baseVal;
        // Distance from the legend's box to a segment (0 when it crosses the box).
        const rect = { l: box.x, t: box.y, r: box.x + box.width, b: box.y + box.height };
        const inBox = (x: number, y: number) =>
          x >= rect.l && x <= rect.r && y >= rect.t && y <= rect.b;
        const toBox = (x: number, y: number) =>
          Math.hypot(Math.max(rect.l - x, 0, x - rect.r), Math.max(rect.t - y, 0, y - rect.b));
        const toSegment = (
          px: number,
          py: number,
          ax: number,
          ay: number,
          bx: number,
          by: number,
        ) => {
          const [dx, dy] = [bx - ax, by - ay];
          const t = Math.max(
            0,
            Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)),
          );
          return Math.hypot(px - (ax + t * dx), py - (ay + t * dy));
        };
        const corners: [number, number][] = [
          [rect.l, rect.t],
          [rect.r, rect.t],
          [rect.r, rect.b],
          [rect.l, rect.b],
        ];
        let coast = Infinity;
        for (const polygon of map.querySelectorAll('polygon')) {
          const pts = [...polygon.points].map((p) => [p.x, p.y] as const);
          pts.forEach(([ax, ay], i) => {
            const [bx, by] = pts[(i + 1) % pts.length]!;
            // A crossing edge or a corner inside the box: overlap.
            const steps = 20;
            for (let s = 0; s <= steps; s++) {
              const [x, y] = [ax + ((bx - ax) * s) / steps, ay + ((by - ay) * s) / steps];
              if (inBox(x, y)) coast = 0;
            }
            coast = Math.min(
              coast,
              toBox(ax, ay),
              ...corners.map(([x, y]) => toSegment(x, y, ax, ay, bx, by)),
            );
          });
          // The box inside a Gebiet.
          const probe = new DOMPoint(rect.l, rect.t);
          if (polygon.isPointInFill(probe)) coast = 0;
        }
        // Island names (bold texts outside the legend) and the Gebiet name plates.
        let names = Infinity;
        for (const other of map.querySelectorAll<SVGGraphicsElement>('text, rect')) {
          if (legend.contains(other)) continue;
          const o = other.getBBox();
          const dx = Math.max(o.x - rect.r, 0, rect.l - (o.x + o.width));
          const dy = Math.max(o.y - rect.b, 0, rect.t - (o.y + o.height));
          names = Math.min(names, Math.hypot(dx, dy));
        }
        const r = legend.getBoundingClientRect();
        return {
          // Objects, not arrays: JSON.stringify then writes what Prettier accepts.
          units: {
            x: Math.round(box.x),
            y: Math.round(box.y),
            w: Math.round(box.width),
            h: Math.round(box.height),
          },
          px: {
            x: Math.round(r.left),
            y: Math.round(r.top),
            w: Math.round(r.width),
            h: Math.round(r.height),
          },
          fontPx: parseFloat(getComputedStyle(legend.querySelector('text')!).fontSize) * scale,
          inside:
            rect.l >= view.x &&
            rect.t >= view.y &&
            rect.r <= view.x + view.width &&
            rect.b <= view.y + view.height,
          coastPx: coast * scale,
          namesPx: names * scale,
        };
      })(),
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
      expect(m.smallestName, `${url}: names below 18 px`).toBeGreaterThanOrEqual(18);
      expect(m.smallestTarget, `${url}: Gebiet smaller than 48 px`).toBeGreaterThanOrEqual(48);
      expect(m.mapBottom, `${url}: map leaves the screen`).toBeLessThanOrEqual(m.height);
      expect(m.legend.map((l) => l.name)).toEqual(
        expect.arrayContaining(['Impressum', 'Datenschutz']),
      );
      // The line below the map stays one row: a second one took the names below 18 px.
      expect(new Set(m.legend.map((l) => Math.round(l.bottom))).size, `${url}: line wraps`).toBe(1);
      if (url.endsWith('?neu')) {
        // Since the legend moved into the sea, "Neu laden" fits the line in every viewport.
        const reload = m.legend.some((l) => l.name === 'Neu laden');
        expect(reload, `${url}: "Neu laden"`).toBe(true);
      }
      // The legend of the blank spots in open sea: inside the map, as large as the names,
      // clear of coast, Gebiete and name plates.
      if (url.startsWith('/dev/karte')) expect(m.mapLegend, `${url}: map legend`).not.toBeNull();
      if (m.mapLegend) {
        expect(m.mapLegend.inside, `${url}: legend outside the map`).toBe(true);
        expect(m.mapLegend.fontPx, `${url}: legend below 18 px`).toBeGreaterThanOrEqual(18);
        expect(m.mapLegend.coastPx, `${url}: legend touches the coast`).toBeGreaterThanOrEqual(4);
        expect(m.mapLegend.namesPx, `${url}: legend touches a name`).toBeGreaterThanOrEqual(4);
      }
      for (const l of m.legend) {
        expect(l.height, `${url}: "${l.name}" below 48 px`).toBeGreaterThanOrEqual(48);
        expect(l.bottom, `${url}: "${l.name}" leaves the screen`).toBeLessThanOrEqual(m.height);
      }
      budget[url] = {
        smallestName: Number(m.smallestName.toFixed(1)),
        lineRows: new Set(m.legend.map((l) => Math.round(l.bottom))).size,
        mapLegend: m.mapLegend && {
          ...m.mapLegend,
          fontPx: Number(m.mapLegend.fontPx.toFixed(1)),
          coastPx: Number(m.mapLegend.coastPx.toFixed(1)),
          namesPx: Number(m.mapLegend.namesPx.toFixed(1)),
        },
      };
    }
    // Smallest Gebietsname per page (task 11: 18 px with Impressum · Datenschutz and Neu laden).
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
    await page.goto('/dev/karte?neu');
    await measure(page);
    await page.screenshot({ path: `${SCREENSHOTS}/karte-legende-${viewport.name}.png` });
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
