// /eltern (the page for parents and teachers, task L) in four viewports: never sideways, running
// text at most 70 characters per line, the text may scroll while the band with "Zurück" stays where
// it is, every target ≥ 48 px (the two mail buttons included). Numbers go to
// eltern-budget-<viewport>.json in SCREENSHOTS (output-dir.ts).

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
      return { name: e.textContent, size: Math.min(r.width, r.height) };
    });
    const mail = [...document.querySelectorAll('main a[href^="mailto:"][href*="subject"]')].map(
      (e) => Math.round(e.getBoundingClientRect().height),
    );
    return {
      overflow: document.documentElement.scrollHeight - window.innerHeight,
      overflowX: document.documentElement.scrollWidth - window.innerWidth,
      longestLine,
      bandTop: Math.round(band.top),
      bandBottom: Math.round(band.bottom),
      height: window.innerHeight,
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
    expect(top.bandBottom, 'band leaves the screen').toBeLessThanOrEqual(top.height);
    await page.screenshot({ path: `${SCREENSHOTS}/eltern-seite-${viewport.name}.png` });

    // The mail buttons and the example, then the end of the text: the band has not moved.
    await page.getByRole('link', { name: 'Aufgabe vorschlagen' }).scrollIntoViewIfNeeded();
    await expect(page.getByRole('link', { name: 'Fehler melden' })).toBeInViewport();
    await page.screenshot({ path: `${SCREENSHOTS}/eltern-seite-vorschlag-${viewport.name}.png` });
    const footer = page.getByRole('navigation', { name: 'Für Eltern und Lehrkräfte' });
    await footer.scrollIntoViewIfNeeded();
    const end = await measure(page);
    expect(end.bandTop, 'band moved while scrolling').toBe(top.bandTop);
    expect(end.overflowX, 'page scrolls sideways at the end').toBeLessThanOrEqual(0);
    await expect(footer.getByRole('link', { name: 'Sicherung und Gerät' })).toBeInViewport();
    await page.screenshot({ path: `${SCREENSHOTS}/eltern-seite-ende-${viewport.name}.png` });

    writeFileSync(
      `${SCREENSHOTS}/eltern-budget-${viewport.name}.json`,
      `${JSON.stringify(
        {
          longestLine: top.longestLine,
          textScrolls: top.scrolls,
          bandTop: top.bandTop,
          smallestTarget: Math.round(top.smallest.size),
          mailButtonHeight: Math.min(...top.mail),
        },
        null,
        2,
      )}\n`,
    );
  });
}
