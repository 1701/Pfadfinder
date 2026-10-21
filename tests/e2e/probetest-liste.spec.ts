// The Probetests of one Fach (task 16) on /dev/probetest-liste in four viewports (fixed entries,
// dev build only): no page scroll, entries ≥ 64 px high and as wide as the page, targets ≥ 48 px,
// text ≥ 18 px, ≥ 18 px air between the last entry and the band. Two and three entries, Stand
// keiner / einer / alle, and the Fach without a Probetest (one sentence). If three entries did
// not fit, only the list would scroll and the band stay (fallback decided before measuring);
// listScroll in the budget says whether it did.
// Numbers go to probetest-liste-budget-<viewport>.json in SCREENSHOTS (output-dir.ts).

import { writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { SCREENSHOTS, VIEWPORTS } from './helpers';

const AIR = 18;
const STATES = [
  { fach: 'mathe', anzahl: 0, stand: 'keiner' },
  ...[2, 3].flatMap((anzahl) =>
    ['keiner', 'einer', 'alle'].map((stand) => ({ fach: 'mathe', anzahl, stand })),
  ),
  // The longer Fach name with the longest Stand.
  { fach: 'deutsch', anzahl: 3, stand: 'alle' },
] as const;
/** Versioned with PFADFINDER_UPDATE_SCREENSHOTS=1: one picture per kind of state. */
const PICTURES = new Set(['mathe-0-keiner', 'mathe-2-keiner', 'mathe-3-einer', 'mathe-3-alle']);

async function measure(page: Page) {
  return page.evaluate(() => {
    const main = document.querySelector('main')!;
    const band = document.querySelector('[data-region="band"]')!.getBoundingClientRect();
    const list = document.querySelector('main ul');
    const entries = [...document.querySelectorAll('main li > a')].map((a) =>
      a.getBoundingClientRect(),
    );
    const scroller = main.children[1]!;
    const content = main.getBoundingClientRect();
    const padding = parseFloat(getComputedStyle(main).paddingLeft);
    const last = entries.at(-1) ?? document.querySelector('main p')!.getBoundingClientRect();
    const targets = [...main.querySelectorAll('a, button')].map((e) => {
      const r = e.getBoundingClientRect();
      return Math.min(r.width, r.height);
    });
    const texts = [...main.querySelectorAll('h1, p, a, span')].filter((e) =>
      [...e.childNodes].some((n) => n.nodeType === Node.TEXT_NODE && n.textContent!.trim()),
    );
    // Name and Stand in one line: same top within the entry.
    const wrapped = [...document.querySelectorAll('main li > a')].filter((a) => {
      const [name, stand] = [...a.children].map((c) => c.getBoundingClientRect());
      return stand !== undefined && stand.top >= name!.bottom - 1;
    }).length;
    return {
      overflow: document.documentElement.scrollHeight - window.innerHeight,
      overflowX: document.documentElement.scrollWidth - window.innerWidth,
      listScroll: scroller.scrollHeight - scroller.clientHeight,
      entries: entries.length,
      lowestEntry: entries.length ? Math.min(...entries.map((r) => r.height)) : null,
      narrowest: entries.length ? Math.min(...entries.map((r) => r.width)) : null,
      pageWidth: content.width - 2 * padding,
      smallestTarget: Math.min(...targets),
      smallestText: Math.min(...texts.map((e) => parseFloat(getComputedStyle(e).fontSize))),
      air: band.top - Math.min(last.bottom, scroller.getBoundingClientRect().bottom),
      bandBottom: window.innerHeight - band.bottom,
      wrapped,
      hasList: list !== null,
    };
  });
}

for (const viewport of VIEWPORTS) {
  test(`Probetest-Liste – ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const red: string[] = [];
    const report: Record<string, unknown> = { viewport };
    for (const { fach, anzahl, stand } of STATES) {
      const key = `${fach}-${anzahl}-${stand}`;
      await page.goto(`/dev/probetest-liste?fach=${fach}&anzahl=${anzahl}&stand=${stand}`);
      await page.getByRole('link', { name: 'Zurück' }).waitFor();
      await page.evaluate(() => document.fonts.ready);
      const m = await measure(page);
      report[key] = { ...m, air: Math.round(m.air) };
      const problems = [
        m.overflow > 0 && `page scrolls by ${Math.round(m.overflow)} px`,
        m.overflowX > 0 && `page scrolls sideways by ${Math.round(m.overflowX)} px`,
        m.entries !== anzahl && `${m.entries} entries, ${anzahl} wanted`,
        m.lowestEntry !== null && m.lowestEntry < 64 && `an entry is only ${m.lowestEntry} px high`,
        m.narrowest !== null &&
          m.narrowest < m.pageWidth - 1 &&
          `an entry is ${Math.round(m.narrowest)} px wide, the page ${Math.round(m.pageWidth)}`,
        m.smallestTarget < 48 && `a target is only ${Math.round(m.smallestTarget)} px`,
        m.smallestText < 18 && `text of only ${m.smallestText} px`,
        m.air < AIR && `only ${Math.round(m.air)} px air above the band`,
        m.bandBottom < 0 && 'the band leaves the screen',
        anzahl === 0 && m.hasList && 'an empty list instead of a sentence',
      ].filter((p): p is string => typeof p === 'string');
      for (const p of problems) red.push(`${key}: ${p}`);
      if (anzahl === 0)
        await expect(page.getByText('Hier gibt es noch keinen Probetest.')).toBeVisible();
      if (PICTURES.has(key))
        await page.screenshot({
          path: `${SCREENSHOTS}/probetest-liste-${anzahl}-${stand}-${viewport.name}.png`,
        });
    }
    writeFileSync(
      `${SCREENSHOTS}/probetest-liste-budget-${viewport.name}.json`,
      `${JSON.stringify(report, null, 2)}\n`,
    );
    expect(red).toEqual([]);
  });
}
