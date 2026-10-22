// /so-gehts (how Pfadfinder works, for parents, 2026-10-22) in four viewports: never sideways,
// running text at most 70 characters per line, the text may scroll while the band with "Zurück"
// stays where it is, targets ≥ 48 px. Numbers go to so-gehts-budget-<viewport>.json in
// SCREENSHOTS (output-dir.ts).

import { writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { SCREENSHOTS, VIEWPORTS } from './helpers';

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
    const band = document.querySelector('[data-region="band"]')!.getBoundingClientRect();
    const scroller = document.querySelector('main')!.children[0]!;
    const targets = [...document.querySelectorAll('main a, main button')].map((e) => {
      const r = e.getBoundingClientRect();
      return Math.min(r.width, r.height);
    });
    return {
      overflow: document.documentElement.scrollHeight - window.innerHeight,
      overflowX: document.documentElement.scrollWidth - window.innerWidth,
      longestLine,
      bandTop: Math.round(band.top),
      bandBottom: Math.round(band.bottom),
      height: window.innerHeight,
      scrolls: scroller.scrollHeight > scroller.clientHeight,
      smallestTarget: Math.min(...targets),
    };
  });
}

for (const viewport of VIEWPORTS) {
  test(`So geht’s passt auf ${viewport.name} (${viewport.width}×${viewport.height})`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    await page.goto('/so-gehts');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('So funktioniert Pfadfinder');
    await page.evaluate(() => document.fonts.ready);
    const top = await measure(page);
    expect(top.overflowX, 'page scrolls sideways').toBeLessThanOrEqual(0);
    expect(top.overflow, 'only the text scrolls, not the page').toBeLessThanOrEqual(0);
    expect(top.longestLine, `line longer than ${MAX_CHARS} characters`).toBeLessThanOrEqual(
      MAX_CHARS,
    );
    expect(top.smallestTarget, 'target below 48 px').toBeGreaterThanOrEqual(48);
    expect(top.bandBottom, 'band leaves the screen').toBeLessThanOrEqual(top.height);
    await page.screenshot({ path: `${SCREENSHOTS}/so-gehts-${viewport.name}.png` });

    // To the end of the text: the band has not moved, the e-mail is on screen.
    await page.getByRole('link', { name: 'pfadfinder@steireif.de' }).scrollIntoViewIfNeeded();
    const end = await measure(page);
    expect(end.bandTop, 'band moved while scrolling').toBe(top.bandTop);
    expect(end.overflowX, 'page scrolls sideways at the end').toBeLessThanOrEqual(0);
    await expect(page.getByRole('link', { name: 'pfadfinder@steireif.de' })).toBeInViewport();
    await page.screenshot({ path: `${SCREENSHOTS}/so-gehts-ende-${viewport.name}.png` });

    writeFileSync(
      `${SCREENSHOTS}/so-gehts-budget-${viewport.name}.json`,
      `${JSON.stringify(
        { longestLine: top.longestLine, textScrolls: top.scrolls, bandTop: top.bandTop },
        null,
        2,
      )}\n`,
    );
  });
}
