// Layout of the Probetest screens on /dev/probetest (the route's components with fixed data),
// in all four viewports; in CI only the tightest ones (Safari), like layout.spec:
//   header       "Übersicht | 7 von 24 | 45 Min." and with "Noch 5 Minuten": one line, apart
//   screens      intro, overview, questions, result: no scroll, targets ≥ 48 px, band visible
//   items        every item of mathe-01 while answering and while looking through (wrong answer,
//                no answer), the short answer while comparing: fitProblems, the least room kept
//   map          the line "Probetest Mathe" in the legend line: ≥ 48 px, map names still ≥ 18 px
//   print        /probetest/mathe-01/print as A4 PDF and as a print-media screenshot (Chromium)
// Numbers go to probetest-budget-<viewport>.json in SCREENSHOTS (output-dir.ts), screenshots beside them.

import { readFileSync, writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { SCREENSHOTS, VIEWPORTS, fitMetrics, fitProblems } from './helpers';

const PROBETEST = JSON.parse(readFileSync('content/probetests/mathe-01.json', 'utf8')) as {
  itemIds: string[];
};
const SHORT_ANSWER = 'm-gm-3-002';
const LONGEST = 'm-rf-3-004';
const SCREENS = [
  'intro',
  'intro-fertig',
  'uebersicht',
  'uebersicht-fertig',
  'abgeben',
  'verlassen',
  'auswertung',
  'auswertung-offen',
  'durchsehen-uebersicht',
] as const;

const MEASURED = process.env.CI ? VIEWPORTS.filter((v) => v.name.startsWith('safari')) : VIEWPORTS;

async function open(page: Page, query: string) {
  await page.goto(`/dev/probetest?${query}`);
  await page.locator('[data-region="band"] button, [data-region="band"] a').last().waitFor();
  // The lazy renderers show a Suspense fallback (aria-busy) first, as in layout.spec.
  await expect(page.locator('[data-region="answer"] [aria-busy="true"]')).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
}

/** Problems of a whole screen: scrolling, small targets, the band's last action cut off. */
async function screenProblems(page: Page): Promise<string[]> {
  const m = await page.evaluate(() => {
    const band = document.querySelector('[data-region="band"]');
    const last = band?.querySelector(':scope > :is(button, a):last-of-type');
    const targets = [...document.querySelectorAll('main button, main a')].map((e) => {
      const r = e.getBoundingClientRect();
      return Math.min(r.width, r.height);
    });
    return {
      overflow: document.documentElement.scrollHeight - window.innerHeight,
      overflowX: document.documentElement.scrollWidth - window.innerWidth,
      smallest: Math.min(...targets),
      bandBottom: last ? window.innerHeight - last.getBoundingClientRect().bottom : -1,
    };
  });
  return [
    m.overflow > 0 && `page scrolls by ${Math.round(m.overflow)} px`,
    m.overflowX > 0 && `page scrolls sideways by ${Math.round(m.overflowX)} px`,
    m.smallest < 48 && `a target is only ${Math.round(m.smallest)} px`,
    m.bandBottom < 0 && 'the last band action leaves the screen',
  ].filter((p): p is string => typeof p === 'string');
}

async function headerMetrics(page: Page) {
  return page.evaluate(() => {
    const header = document.querySelector('[data-kopf]')!;
    const boxes = [...header.children].map((c) => c.getBoundingClientRect());
    const mids = boxes.map((b) => b.top + b.height / 2);
    return {
      height: Math.round(header.getBoundingClientRect().height),
      middles: Math.round(Math.max(...mids) - Math.min(...mids)),
      minGap: Math.round(Math.min(...boxes.slice(1).map((b, i) => b.left - boxes[i]!.right))),
    };
  });
}

for (const viewport of MEASURED) {
  test(`probetest screens – ${viewport.name}`, async ({ browser }) => {
    test.setTimeout(300_000);
    const context = await browser.newContext({ viewport });
    const report: Record<string, unknown> = { viewport };
    const red: string[] = [];
    let page = await context.newPage();

    // Header with the time, normal and in the last five minutes.
    const header: Record<string, unknown> = {};
    for (const zeit of ['45', '5']) {
      await open(page, `zustand=aufgabe&item=${LONGEST}&zeit=${zeit}`);
      const m = await headerMetrics(page);
      header[zeit] = m;
      if (m.middles > 12 || m.minGap <= 0) red.push(`header ${zeit}: ${JSON.stringify(m)}`);
      await page.screenshot({
        path: `${SCREENSHOTS}/probetest-aufgabe-zeit${zeit}-${viewport.name}.png`,
      });
    }
    report.header = header;

    // Whole screens.
    for (const zustand of SCREENS) {
      await open(page, `zustand=${zustand}`);
      for (const p of await screenProblems(page)) red.push(`${zustand}: ${p}`);
      await page.screenshot({ path: `${SCREENSHOTS}/probetest-${zustand}-${viewport.name}.png` });
    }
    await open(page, 'zustand=auswertung&zeit-um');
    await page.screenshot({
      path: `${SCREENSHOTS}/probetest-auswertung-zeit-um-${viewport.name}.png`,
    });
    await page.close();

    // Every item: answering, looking through with a wrong answer and without one.
    const slack: Record<string, { id: string; slack: number }> = {};
    const keep = (state: string, id: string, value: number) => {
      if (!slack[state] || value < slack[state].slack)
        slack[state] = { id, slack: Math.round(value) };
    };
    for (const id of PROBETEST.itemIds) {
      page = await context.newPage();
      for (const state of ['aufgabe', 'durchsehen', 'fehlt'] as const) {
        await open(page, `zustand=${state}&item=${id}`);
        for (const p of await fitProblems(page)) red.push(`${state} ${id}: ${p}`);
        keep(state, id, (await fitMetrics(page))!.slack);
      }
      await page.close();
    }
    page = await context.newPage();
    // "1 Antwort vergleichen": the short answer, "1 von 1", without "Zurück".
    await open(page, 'zustand=nur-wartende');
    for (const p of await fitProblems(page)) red.push(`nur-wartende: ${p}`);
    keep('nur-wartende', SHORT_ANSWER, (await fitMetrics(page))!.slack);
    await page.screenshot({ path: `${SCREENSHOTS}/probetest-nur-wartende-${viewport.name}.png` });
    await open(page, `zustand=vergleichen&item=${SHORT_ANSWER}`);
    for (const p of await fitProblems(page)) red.push(`vergleichen: ${p}`);
    keep('vergleichen', SHORT_ANSWER, (await fitMetrics(page))!.slack);
    await page.screenshot({ path: `${SCREENSHOTS}/probetest-vergleichen-${viewport.name}.png` });
    report.slack = slack;
    for (const [state, { id }] of Object.entries(slack).filter(
      ([s]) => s !== 'vergleichen' && s !== 'nur-wartende',
    )) {
      await open(page, `zustand=${state}&item=${id}`);
      await page.screenshot({
        path: `${SCREENSHOTS}/probetest-${state}-knappstes-${viewport.name}.png`,
      });
    }

    // The map with the line "Probetest Mathe".
    await page.goto('/');
    await page.locator('svg[aria-label="Karte"]:visible').waitFor();
    await page.evaluate(() => document.fonts.ready);
    const line = page.getByRole('link', { name: 'Probetest Mathe' });
    const box = (await line.boundingBox())!;
    const map = await page.evaluate(() => {
      const svg = [...document.querySelectorAll('svg[aria-label="Karte"]')].find(
        (s) => s.getBoundingClientRect().width > 0,
      ) as SVGSVGElement;
      const scale = svg.getScreenCTM()?.a ?? 1;
      const sizes = [...svg.querySelectorAll('text')].map(
        (t) => Number(getComputedStyle(t).fontSize.replace('px', '')) * scale,
      );
      return {
        smallestName: Math.min(...sizes),
        overflow: document.documentElement.scrollHeight - window.innerHeight,
      };
    });
    report.map = { ...map, line: { height: box.height, bottom: box.y + box.height } };
    if (box.height < 48) red.push(`map line only ${box.height} px high`);
    if (box.y + box.height > viewport.height) red.push('map line leaves the screen');
    if (map.smallestName < 18) red.push(`map name ${map.smallestName.toFixed(1)} px`);
    if (map.overflow > 0) red.push('map page scrolls');
    await page.screenshot({ path: `${SCREENSHOTS}/probetest-karte-${viewport.name}.png` });

    writeFileSync(
      `${SCREENSHOTS}/probetest-budget-${viewport.name}.json`,
      `${JSON.stringify(report, null, 2)}\n`,
    );
    await context.close();
    expect(red, `probetest layout in ${viewport.name}`).toEqual([]);
  });
}

test('probetest print sheet – A4 PDF, solutions on their own page', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'page.pdf exists only in Chromium');
  await page.goto('/probetest/mathe-01/print');
  await expect(page.locator('[data-item]')).toHaveCount(PROBETEST.itemIds.length);
  await expect(page.locator('[data-loesung]')).toHaveCount(PROBETEST.itemIds.length);
  await page.evaluate(() => document.fonts.ready);
  // Number items leave room to calculate before the result box (decision 2026-10-15).
  await expect(page.locator('[data-item="m-zo-1-011"] .druck-rechenplatz')).toHaveCount(1);
  await page.emulateMedia({ media: 'print' });
  await expect(page.getByRole('button', { name: 'Drucken' })).toBeHidden();
  expect(
    await page.locator('.druck-loesungen').evaluate((e) => getComputedStyle(e).breakBefore),
  ).toBe('page');
  await page.pdf({
    path: `${SCREENSHOTS}/probetest-druck.pdf`,
    format: 'A4',
    printBackground: true,
  });
  await page.setViewportSize({ width: 794, height: 1123 });
  await page.screenshot({ path: `${SCREENSHOTS}/probetest-druck-seite1.png` });
});
