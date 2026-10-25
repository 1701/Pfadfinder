// Air per item: measures given items of content/ in the four viewports. Runs only with
// PFADFINDER_SWEEP=1 and never in CI: the project "sweep" exists only then (playwright.config.ts).
// Measures, never fails on air:
//   PFADFINDER_SWEEP=1 PFADFINDER_SWEEP_ITEMS=d-lsa-1-008,d-lli-3-004 \
//     npx playwright test --project=sweep sweep-luft-items
// Per item and viewport: Üben /dev/item (answering, richtig, noch-nicht; short-answer also
// vergleichen) and Durchsehen /dev/probetest with <fach>-01 (durchsehen; short-answer also
// vergleichen). An item that is not in that Probetest takes the place of its first item of the same
// format (ProbetestPage). Per screen: air above the band (fitMetrics), lines of the prompt, page
// scroll, overflow and overlap (screen-checks).
// Rule of a content batch: Üben ≥ 18 px, Durchsehen ≥ 0 (in Safari landscape the exception of
// ARCHITECTURE §5; elsewhere probetest-layout wants 18). `failing` lists what breaks it.
// Output: tests/e2e/output/sweep-luft-items.json (always the output folder, it is no screenshot).
// First used for muster-strukturen patch 2 (then as a temporary spec), checked in with the
// Lesen batch 004.

import { mkdirSync, writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import {
  ITEMS,
  VIEWPORTS,
  expectItemOnScreen,
  fitMetrics,
  promptLines,
  type ContentItem,
} from './helpers';
import { overflowProblems, overlapProblems } from './screen-checks';

const RUN = process.env.PFADFINDER_SWEEP === '1' && !process.env.CI;
const IDS = (process.env.PFADFINDER_SWEEP_ITEMS ?? '')
  .split(',')
  .map((id) => id.trim())
  .filter(Boolean);
const OUT = 'tests/e2e/output';
const AIR = 18;

interface Screen {
  air: number;
  promptLines: number;
  /** Page scroll, overflow, overlap. */
  screen: string[];
}

async function open(page: Page, url: string) {
  const band = page.locator('[data-region="band"] button, [data-region="band"] a').last();
  await page.goto(url);
  try {
    await band.waitFor({ timeout: 20_000 });
  } catch {
    await page.goto(url);
    await band.waitFor();
  }
  await expect(page.locator('[data-region="answer"] [aria-busy="true"]')).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
}

async function measure(page: Page, item: ContentItem, label: string): Promise<Screen> {
  // Another item on the screen (Durchsehen without this item): the numbers would be wrong.
  await expectItemOnScreen(page, item.id, label);
  const fit = await fitMetrics(page);
  const lines = await promptLines(page, item.prompt);
  const scroll = fit && fit.overflow > 0 ? [`page scrolls by ${Math.round(fit.overflow)} px`] : [];
  return {
    air: fit ? Math.round(fit.slack) : -9999,
    promptLines: lines,
    screen: [...scroll, ...(await overflowProblems(page)), ...(await overlapProblems(page))],
  };
}

/** Screens of one item: Üben states, then Durchsehen states (prefix "durchsehen"). */
function screensOf(item: ContentItem, fach: string) {
  const short = item.format === 'short-answer';
  const ueben = ['answering', 'richtig', 'noch-nicht', ...(short ? ['vergleichen'] : [])];
  const durchsehen = ['durchsehen', ...(short ? ['vergleichen'] : [])];
  return [
    ...ueben.map((state) => ({
      key: state,
      ueben: true,
      url: `/dev/item/${item.id}?state=${state}`,
    })),
    ...durchsehen.map((zustand) => ({
      key: zustand === 'durchsehen' ? zustand : `durchsehen-${zustand}`,
      ueben: false,
      url: `/dev/probetest?probetest=${fach}-01&zustand=${zustand}&item=${item.id}`,
    })),
  ];
}

test('Sweep: Luft je Item', async ({ page }) => {
  test.skip(!RUN || IDS.length === 0, 'nur mit PFADFINDER_SWEEP=1 und PFADFINDER_SWEEP_ITEMS');
  test.setTimeout(Math.max(5, IDS.length) * 4 * 60_000);
  const items = IDS.map((id) => {
    const item = ITEMS.find((i) => i.id === id);
    if (!item) throw new Error(`${id}: no active item in content/`);
    return item;
  });
  // item id → viewport → screen key → numbers
  const results: Record<string, Record<string, Record<string, Screen>>> = {};
  const failing: string[] = [];
  for (const viewport of VIEWPORTS) {
    await page.setViewportSize(viewport);
    for (const item of items) {
      const fach = item.id.startsWith('m-') ? 'mathe' : 'deutsch';
      for (const { key, ueben, url } of screensOf(item, fach)) {
        await open(page, url);
        const s = await measure(page, item, `${item.id} ${viewport.name} ${key}`);
        ((results[item.id] ??= {})[viewport.name] ??= {})[key] = s;
        if (s.air < (ueben ? AIR : 0)) failing.push(`${item.id} ${viewport.name} ${key} ${s.air}`);
      }
    }
  }
  /** Per item the tightest air in Üben and in Durchsehen, with where. */
  const tightest = Object.fromEntries(
    items.map((item) => {
      const least = (ueben: boolean) => {
        let best: { air: number; at: string } | null = null;
        for (const [viewport, screens] of Object.entries(results[item.id]!))
          for (const [key, s] of Object.entries(screens))
            if (key.startsWith('durchsehen') !== ueben && (!best || s.air < best.air))
              best = { air: s.air, at: `${viewport} ${key}` };
        return best;
      };
      return [item.id, { ueben: least(true), durchsehen: least(false) }];
    }),
  );
  const findings = Object.entries(results).flatMap(([id, byViewport]) =>
    Object.entries(byViewport).flatMap(([viewport, screens]) =>
      Object.entries(screens).flatMap(([key, s]) =>
        s.screen.map((p) => `${id} ${viewport} ${key}: ${p}`),
      ),
    ),
  );
  mkdirSync(OUT, { recursive: true });
  writeFileSync(
    `${OUT}/sweep-luft-items.json`,
    `${JSON.stringify({ viewports: VIEWPORTS, air: AIR, tightest, failing, findings, results }, null, 2)}\n`,
  );
  expect(Object.keys(results)).toHaveLength(items.length);
});
