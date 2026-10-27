// /eltern (the page for parents and teachers, task L) in four viewports: never sideways, running
// text at most 70 characters per line, the text may scroll while the top line of the pages for
// adults (ErwachsenenKopf, task N) stays where it is, in one row, every target ≥ 48 px (the two mail
// buttons included), nothing overlaps. Numbers go to eltern-budget-<viewport>.json in SCREENSHOTS
// (output-dir.ts).

import { writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { SCREENSHOTS, VIEWPORTS } from './helpers';
import { KOPF, kopfBudget, kopfMetrics, kopfProblems, overlapProblems } from './screen-checks';

const MAX_CHARS = 70;

async function measure(page: Page) {
  return page.evaluate(() => {
    // Characters per rendered line of every paragraph, from the position of each character.
    const longestLine = Math.max(
      ...[...document.querySelectorAll('main p')].flatMap((p) => {
        const lines = new Map<number, string>();
        const walker = document.createTreeWalker(p, NodeFilter.SHOW_TEXT);
        const range = document.createRange();
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          const text = node.textContent ?? '';
          for (let i = 0; i < text.length; i++) {
            range.setStart(node, i);
            range.setEnd(node, i + 1);
            const top = Math.round(range.getBoundingClientRect().top);
            lines.set(top, (lines.get(top) ?? '') + text[i]);
          }
        }
        return [...lines.values()].map((line) => line.trim().length);
      }),
    );
    const scroller = document.querySelector('[data-region="kopf"]')!.nextElementSibling!;
    const targets = [...document.querySelectorAll('main a, main button')].map((e) => {
      const r = e.getBoundingClientRect();
      return { name: e.textContent, size: Math.min(r.width, r.height) };
    });
    const mail = [...document.querySelectorAll('main a[href^="mailto:"][href*="subject"]')].map(
      (e) => Math.round(e.getBoundingClientRect().height),
    );
    return {
      overflow: document.documentElement.scrollHeight - window.innerHeight,
      overflowX: document.documentElement.scrollWidth - window.innerWidth,
      longestLine,
      scrolls: scroller.scrollHeight > scroller.clientHeight,
      smallest: targets.reduce((a, b) => (b.size < a.size ? b : a)),
      mail,
    };
  });
}

for (const viewport of VIEWPORTS) {
  test(`Für Eltern passt auf ${viewport.name} (${viewport.width}×${viewport.height})`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto('/eltern');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Für Eltern und Lehrkräfte');
    await page.evaluate(() => document.fonts.ready);
    const top = await measure(page);
    expect(top.overflowX, 'page scrolls sideways').toBeLessThanOrEqual(0);
    expect(top.overflow, 'only the text scrolls, not the page').toBeLessThanOrEqual(0);
    expect(top.longestLine, `line longer than ${MAX_CHARS} characters`).toBeLessThanOrEqual(
      MAX_CHARS,
    );
    expect(top.smallest.size, `"${top.smallest.name}" below 48 px`).toBeGreaterThanOrEqual(48);
    expect(top.mail, 'two mail buttons').toHaveLength(2);
    const kopf = await kopfMetrics(page);
    console.log(`kopf /eltern ${viewport.name}: ${JSON.stringify(kopf)}`);
    expect([...kopfProblems(kopf), ...(await overlapProblems(page, KOPF))]).toEqual([]);
    await page.screenshot({ path: `${SCREENSHOTS}/eltern-seite-${viewport.name}.png` });

    // The mail buttons and the example, then the end of the text: the Kopf has not moved.
    await page.getByRole('link', { name: 'Aufgabe vorschlagen' }).scrollIntoViewIfNeeded();
    await expect(page.getByRole('link', { name: 'Fehler melden' })).toBeInViewport();
    expect(kopfProblems(await kopfMetrics(page), kopf)).toEqual([]);
    await page.screenshot({ path: `${SCREENSHOTS}/eltern-seite-vorschlag-${viewport.name}.png` });
    const github = page.getByRole('link', { name: 'github.com/1701/Pfadfinder' });
    await github.scrollIntoViewIfNeeded();
    const end = await measure(page);
    expect(end.overflow, 'only the text scrolls, not the page, at the end').toBeLessThanOrEqual(0);
    expect(end.overflowX, 'page scrolls sideways at the end').toBeLessThanOrEqual(0);
    expect([
      ...kopfProblems(await kopfMetrics(page), kopf),
      ...(await overlapProblems(page, KOPF)),
    ]).toEqual([]);
    await expect(github).toBeInViewport();
    await page.screenshot({ path: `${SCREENSHOTS}/eltern-seite-ende-${viewport.name}.png` });

    writeFileSync(
      `${SCREENSHOTS}/eltern-budget-${viewport.name}.json`,
      `${JSON.stringify(
        {
          longestLine: top.longestLine,
          textScrolls: top.scrolls,
          kopfBottom: kopf.bottom,
          kopf: kopfBudget(kopf),
          smallestTarget: Math.round(top.smallest.size),
          mailButtonHeight: Math.min(...top.mail),
        },
        null,
        2,
      )}\n`,
    );
  });
}
