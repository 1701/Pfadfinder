// Layout budget of the Probetest (task 8, part B), measured on /dev/probetest in all four
// viewports before the wireframes:
//   M1   header: "Übersicht" | "7 von 24" | minutes (variant d, the choice) and, for the record,
//        the variant with 24 Wegstriche
//   M1b  overview: 24 tappable dashes, "Abgeben", no scroll
//   M2   every item of mathe-01 while the test runs (answer filled in, band "Zurück" | "Weiter")
//   M3   every item while looking through, "Noch nicht ganz." with "Falle": "Zurück" in the band
//        (r1) or quietly in the header (r2); the short answer also while comparing
//   M4   the map: room for a line "Probetest Mathe" below the Mathe island
// Writes the numbers to tests/e2e/screenshots/probetest-budget-<viewport>.json. Asserts only what
// the chosen variants need; the comparisons are recorded, not judged.

import { readFileSync, writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { BEREICH_NAME } from '../../src/ui/text/bereiche';
import { SCREENSHOTS, VIEWPORTS, fitMetrics, type FitMetrics } from './helpers';

const PROBETEST = JSON.parse(readFileSync('content/probetests/mathe-01.json', 'utf8')) as {
  itemIds: string[];
};
const SHORT_ANSWER = 'm-gm-3-002';
const LONGEST = 'm-rf-3-004';
const MATHE_NAMES = Object.entries(BEREICH_NAME)
  .filter(([bereich]) => !/^(lesen|rs)-/.test(bereich))
  .map(([, name]) => name);

async function open(page: Page, query: string) {
  await page.goto(`/dev/probetest?${query}`);
  await page.locator('[data-region="band"] button').last().waitFor();
  await page.evaluate(() => document.fonts.ready);
}

interface HeaderMetrics {
  height: number;
  /** Largest difference between the vertical middles of the header's children (wraps if > 12). */
  middles: number;
  /** Smallest horizontal gap between neighbouring children. */
  minGap: number;
  overflowX: number;
}

async function headerMetrics(page: Page): Promise<HeaderMetrics> {
  return page.evaluate(() => {
    const header = document.querySelector('[data-kopf]')!;
    const boxes = [...header.children].map((c) => c.getBoundingClientRect());
    const mids = boxes.map((b) => b.top + b.height / 2);
    const gaps = boxes.slice(1).map((b, i) => b.left - boxes[i]!.right);
    return {
      height: header.getBoundingClientRect().height,
      middles: Math.max(...mids) - Math.min(...mids),
      minGap: Math.min(...gaps),
      overflowX: document.documentElement.scrollWidth - window.innerWidth,
    };
  });
}

/** Smallest interactive element of the page (touch targets ≥ 48 px). */
async function smallestTarget(page: Page): Promise<number> {
  return page.evaluate(() =>
    Math.min(
      ...[...document.querySelectorAll('main button, main a')].map((e) => {
        const r = e.getBoundingClientRect();
        return Math.min(r.width, r.height);
      }),
    ),
  );
}

async function itemFits(page: Page, query: string): Promise<FitMetrics> {
  await open(page, query);
  const m = await fitMetrics(page);
  if (!m) throw new Error(`no band on ${query}`);
  return m;
}

// In CI only the tightest viewports (iPad with Safari bars), like layout.spec.
const MEASURED = process.env.CI ? VIEWPORTS.filter((v) => v.name.startsWith('safari')) : VIEWPORTS;

const round = (n: number) => Math.round(n);
const tightest = (list: { id: string; m: FitMetrics }[]) =>
  list.reduce((a, b) => (b.m.slack < a.m.slack ? b : a));

for (const viewport of MEASURED) {
  test(`probetest layout budget – ${viewport.name}`, async ({ browser }) => {
    test.setTimeout(240_000);
    const context = await browser.newContext({ viewport });
    const fresh = async () => context.newPage();
    const report: Record<string, unknown> = { viewport };

    // M1: header variants.
    let page = await fresh();
    const header: Record<string, HeaderMetrics> = {};
    for (const [name, query] of [
      ['d-45', `zustand=aufgabe&item=${LONGEST}&kopf=d`],
      ['d-noch5', `zustand=aufgabe&item=${LONGEST}&kopf=d&zeit=5`],
      ['wegstriche-45', `zustand=aufgabe&item=${LONGEST}&kopf=striche`],
    ] as const) {
      await open(page, query);
      header[name] = await headerMetrics(page);
      await page.screenshot({ path: `${SCREENSHOTS}/probetest-kopf-${name}-${viewport.name}.png` });
    }
    report.header = header;
    for (const name of ['d-45', 'd-noch5'] as const) {
      expect(header[name]!.middles, `${name}: header wraps`).toBeLessThanOrEqual(12);
      expect(header[name]!.minGap, `${name}: header children touch`).toBeGreaterThan(0);
      expect(header[name]!.overflowX, `${name}: page scrolls sideways`).toBeLessThanOrEqual(0);
    }

    // M1b: overview.
    await open(page, 'zustand=uebersicht');
    const overview = { ...(await fitMetrics(page))!, smallestTarget: await smallestTarget(page) };
    report.overview = overview;
    await page.screenshot({ path: `${SCREENSHOTS}/probetest-uebersicht-${viewport.name}.png` });
    expect(overview.overflow, 'overview scrolls').toBeLessThanOrEqual(0);
    expect(overview.smallestTarget, 'overview target < 48 px').toBeGreaterThanOrEqual(48);
    await page.close();

    // M2 and M3: every item, a fresh tab each (a tab crashes after many navigations in CI).
    const answering: { id: string; m: FitMetrics }[] = [];
    const reviewR1: { id: string; m: FitMetrics }[] = [];
    const reviewR2: { id: string; m: FitMetrics }[] = [];
    for (const id of PROBETEST.itemIds) {
      page = await fresh();
      answering.push({ id, m: await itemFits(page, `zustand=aufgabe&item=${id}`) });
      reviewR1.push({ id, m: await itemFits(page, `zustand=durchsehen&item=${id}&band=r1`) });
      reviewR2.push({ id, m: await itemFits(page, `zustand=durchsehen&item=${id}&band=r2`) });
      await page.close();
    }
    page = await fresh();
    const comparing = await itemFits(page, `zustand=vergleichen&item=${SHORT_ANSWER}&band=r2`);
    await page.screenshot({ path: `${SCREENSHOTS}/probetest-vergleichen-${viewport.name}.png` });

    const summary = (list: { id: string; m: FitMetrics }[]) => {
      const t = tightest(list);
      return {
        tightest: t.id,
        slack: round(t.m.slack),
        overflow: round(Math.max(...list.map((e) => e.m.overflow))),
        problems: list
          .filter((e) => e.m.slack < 0 || e.m.overflow > 0 || e.m.buttonBottom < 0)
          .map((e) => `${e.id}: slack ${round(e.m.slack)}, overflow ${round(e.m.overflow)}`),
      };
    };
    report.answering = summary(answering);
    report.reviewR1 = summary(reviewR1);
    report.reviewR2 = summary(reviewR2);
    report.comparing = { slack: round(comparing.slack), overflow: round(comparing.overflow) };

    for (const [state, list] of [
      ['aufgabe', answering],
      ['durchsehen-r1', reviewR1],
      ['durchsehen-r2', reviewR2],
    ] as const) {
      const t = tightest(list);
      await open(
        page,
        `zustand=${state.startsWith('aufgabe') ? 'aufgabe' : 'durchsehen'}&item=${t.id}&band=${state.endsWith('r1') ? 'r1' : 'r2'}`,
      );
      await page.screenshot({
        path: `${SCREENSHOTS}/probetest-${state}-knappstes-${viewport.name}.png`,
      });
    }
    await open(page, `zustand=aufgabe&item=${LONGEST}`);
    await page.screenshot({
      path: `${SCREENSHOTS}/probetest-aufgabe-laengstes-${viewport.name}.png`,
    });

    // M4: the map on the start page.
    await page.goto('/');
    await page.locator('svg[aria-label="Karte"]:visible').waitFor();
    await page.evaluate(() => document.fonts.ready);
    report.map = await page.evaluate((names) => {
      const svg = [...document.querySelectorAll('svg[aria-label="Karte"]')].find(
        (s) => s.getBoundingClientRect().width > 0,
      )!;
      const regions = [...svg.querySelectorAll('[aria-label]')].filter((e) =>
        names.some((n) => (e.getAttribute('aria-label') ?? '').startsWith(n)),
      );
      const rects = regions.map((e) => e.getBoundingClientRect());
      const mathe = {
        left: Math.min(...rects.map((r) => r.left)),
        right: Math.max(...rects.map((r) => r.right)),
        bottom: Math.max(...rects.map((r) => r.bottom)),
      };
      const deutschName = [...svg.querySelectorAll('text')].find(
        (t) => t.textContent === 'Deutsch',
      );
      const legend = document.querySelector('main > p:last-of-type, main p.min-h-touch');
      const scale = (svg as SVGSVGElement).getScreenCTM()?.a ?? 1;
      return {
        svgBottom: svg.getBoundingClientRect().bottom,
        matheBottom: mathe.bottom,
        matheLeft: mathe.left,
        matheRight: mathe.right,
        deutschNameTop: deutschName?.getBoundingClientRect().top,
        legendTop: legend?.getBoundingClientRect().top,
        legendHeight: legend?.getBoundingClientRect().height,
        textScale: scale,
      };
    }, MATHE_NAMES);
    await page.screenshot({ path: `${SCREENSHOTS}/probetest-karte-${viewport.name}.png` });

    writeFileSync(
      `${SCREENSHOTS}/probetest-budget-${viewport.name}.json`,
      `${JSON.stringify(report, null, 2)}\n`,
    );
    console.log(viewport.name, JSON.stringify(report));

    // The chosen screens: the test itself must fit in every viewport.
    expect((report.answering as { problems: string[] }).problems, 'item while answering').toEqual(
      [],
    );
    await context.close();
  });
}
