// segment-text (CONTENT_SCHEMA §4.10) on its dev page /dev/format/segment-text in four viewports
// and three states (leer, noch-nicht, durchsehen): no page scroll, ≥ 18 px air above the band,
// every gap a touch target of at least 48 × 48 px. Screenshots format-segment-text-<state>-
// <viewport>.png and format-segment-text-budget-<viewport>.json in SCREENSHOTS (output-dir.ts).
// A second sentence of 14 words / 85 characters is measured for the guide value in §4.10; its
// numbers always go to tests/e2e/output (never versioned).

import { mkdirSync, writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { SCREENSHOTS, VIEWPORTS, fitMetrics, fitProblems } from './helpers';

const AIR = 18;
const TOUCH = 48;
const STATES = ['leer', 'noch-nicht', 'durchsehen'] as const;
const OUTPUT = 'tests/e2e/output';
/** 14 words, 85 characters: Am späten Nachmittag | spielt | der kleine braune Hund | mit seinem neuen Ball | im Garten. */
const LONG = {
  text: 'Am späten Nachmittag spielt der kleine braune Hund mit seinem neuen Ball im Garten.',
  loesung: '2,3,7,11',
};

interface Measured {
  air: number;
  overflow: number;
  /** Smallest side of a gap button. */
  smallestGap: number;
  /** Smallest side of any button on the screen. */
  smallestTarget: number;
  /** Rows of the child's sentence. */
  rows: number;
}

async function open(page: Page, query: string) {
  await page.goto(`/dev/format/segment-text?${query}`);
  await expect(page.locator('main[data-format="segment-text"]')).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
}

async function measure(page: Page): Promise<Measured> {
  const m = (await fitMetrics(page))!;
  const sizes = await page.evaluate(() => {
    const side = (e: Element) => {
      const r = e.getBoundingClientRect();
      return Math.min(r.width, r.height);
    };
    const gaps = [...document.querySelectorAll('button[aria-label^="Trennstrich"]')];
    const buttons = [...document.querySelectorAll('main button')];
    const group = document.querySelector('[role="group"][aria-label^="Satz mit Lücken"]')!;
    const rows = new Set([...group.children].map((c) => Math.round(c.getBoundingClientRect().top)));
    return {
      smallestGap: Math.min(...gaps.map(side)),
      smallestTarget: Math.min(...buttons.map(side)),
      rows: rows.size,
    };
  });
  return { air: Math.round(m.slack), overflow: Math.max(0, m.overflow), ...sizes };
}

for (const viewport of VIEWPORTS) {
  test(`segment-text passt auf ${viewport.name} (${viewport.width}×${viewport.height})`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const budget: Record<string, Measured> = {};
    const red: string[] = [];
    for (const state of STATES) {
      await open(page, `zustand=${state}`);
      if (state !== 'leer') await expect(page.getByText('Richtig ist:')).toBeVisible();
      const m = await measure(page);
      budget[state] = m;
      for (const p of await fitProblems(page)) red.push(`${state}: ${p}`);
      if (m.air < AIR) red.push(`${state}: only ${m.air} px air (${AIR} px wanted)`);
      if (m.smallestGap < TOUCH) red.push(`${state}: gap ${m.smallestGap} px`);
      if (m.smallestTarget < TOUCH) red.push(`${state}: target ${m.smallestTarget} px`);
      await page.screenshot({
        path: `${SCREENSHOTS}/format-segment-text-${state}-${viewport.name}.png`,
      });
    }
    writeFileSync(
      `${SCREENSHOTS}/format-segment-text-budget-${viewport.name}.json`,
      `${JSON.stringify(budget, null, 2)}\n`,
    );
    expect(red).toEqual([]);
  });

  test(`segment-text mit 14 Wörtern, Messung ${viewport.name}`, async ({ page }) => {
    await page.setViewportSize(viewport);
    const query = `text=${encodeURIComponent(LONG.text)}&loesung=${LONG.loesung}`;
    const measured: Record<string, Measured> = {};
    for (const state of STATES) {
      await open(page, `zustand=${state}&${query}`);
      measured[state] = await measure(page);
    }
    mkdirSync(OUTPUT, { recursive: true });
    writeFileSync(
      `${OUTPUT}/format-segment-text-lang-${viewport.name}.json`,
      `${JSON.stringify(measured, null, 2)}\n`,
    );
  });
}
