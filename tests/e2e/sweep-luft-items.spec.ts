// Air per item: measures given items of content/ in the four viewports. Runs only with
// PFADFINDER_SWEEP=1 and never in CI: the project "sweep" exists only then (playwright.config.ts).
// Measures, never fails on air:
//   PFADFINDER_SWEEP=1 PFADFINDER_SWEEP_ITEMS=d-lsa-1-008,d-lli-3-004 \
//     npx playwright test --project=sweep sweep-luft-items
// Per item and viewport: Üben /dev/item (answering, richtig, noch-nicht; short-answer also
// vergleichen) and Durchsehen /dev/probetest at the item's real place in every Probetest of
// content/probetests that holds it (keys durchsehen@<id>, durchsehen-vergleichen@<id> for a short
// answer, fehlt@<id>): the place matters, at place 24 the band says "Zur Auswertung" (224 instead
// of 180 px), in fehlt the message column gets 44 px narrower, wraps one more line and the band
// grows 110 → 136 px (m-dz-3-003: 44 px air at place 24 of mathe-03, 70 px at an earlier place).
// Only an item in no Probetest takes the place of the first item of the same format in <fach>-01
// (ProbetestPage; keys durchsehen, durchsehen-vergleichen, fehlt). Per screen: air above the band
// (fitMetrics), lines of the prompt, page scroll, overflow and overlap (screen-checks).
// Rule (airWanted, helpers.ts): ≥ 18 px everywhere; less only for the closed list AIR_EXCEPTIONS
// (looking through beside a text in Safari landscape). `failing` lists what breaks it.
// Output: tests/e2e/output/sweep-luft-items.json (always the output folder, it is no screenshot).
// First used for muster-strukturen patch 2 (then as a temporary spec), checked in with the
// Lesen batch 004.

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import {
  AIR,
  ITEMS,
  VIEWPORTS,
  airWanted,
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
/** Every Probetest of content/ with its items (as in probetest-layout.spec). */
const PROBETESTS = readdirSync('content/probetests')
  .filter((f) => /^(mathe|deutsch)-\d{2}\.json$/.test(f))
  .sort()
  .map(
    (f) =>
      JSON.parse(readFileSync(`content/probetests/${f}`, 'utf8')) as {
        id: string;
        itemIds: string[];
      },
  );

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

/**
 * Screens of one item: Üben states, then Durchsehen states at the real place of every Probetest
 * that holds the item (stand-in place in <fach>-01 only without one). `state` is the zustand.
 */
function screensOf(item: ContentItem, fach: string) {
  const short = item.format === 'short-answer';
  const ueben = ['answering', 'richtig', 'noch-nicht', ...(short ? ['vergleichen'] : [])];
  const durchsehen = ['durchsehen', ...(short ? ['vergleichen'] : []), 'fehlt'];
  const holding = PROBETESTS.filter((p) => p.itemIds.includes(item.id)).map((p) => p.id);
  const places = holding.length > 0 ? holding : [`${fach}-01`];
  const key = (zustand: string) => (zustand === 'vergleichen' ? 'durchsehen-vergleichen' : zustand);
  return [
    ...ueben.map((state) => ({
      key: state,
      state,
      ueben: true,
      url: `/dev/item/${item.id}?state=${state}`,
    })),
    ...places.flatMap((probetest) =>
      durchsehen.map((zustand) => ({
        key: holding.length > 0 ? `${key(zustand)}@${probetest}` : key(zustand),
        state: zustand,
        ueben: false,
        url: `/dev/probetest?probetest=${probetest}&zustand=${zustand}&item=${item.id}`,
      })),
    ),
  ];
}

/** A Durchsehen screen (looking through, comparing, missing answer). */
const isDurchsehen = (key: string) => key.startsWith('durchsehen') || key.startsWith('fehlt');

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
      const withText = item.stimulus?.textRef !== undefined;
      for (const { key, state, ueben, url } of screensOf(item, fach)) {
        await open(page, url);
        const s = await measure(page, item, `${item.id} ${viewport.name} ${key}`);
        ((results[item.id] ??= {})[viewport.name] ??= {})[key] = s;
        const wanted = ueben ? AIR : airWanted(state, viewport.name, withText, item.id);
        if (s.air < wanted) failing.push(`${item.id} ${viewport.name} ${key} ${s.air}`);
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
            if (isDurchsehen(key) !== ueben && (!best || s.air < best.air))
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
