// Every active item in every state on four viewports: the two iPad sizes from the skill
// and the same iPad in Safari with its bars (1024×660 landscape, 768×900 portrait).
// In CI only the two Safari sizes run (ARCHITECTURE.md §8): they are the tightest, and an item
// that fits there also fits on the full iPad screens. Locally all four run.
// A viewport does not stop at the first red item: it measures all of them and fails once, with
// the complete list. Runs against /dev/item (dev build only). match also gets matchProblems.
// Every screen also gets the generic checks (screen-checks.ts): no visible text runs out of its
// element, no two tap targets or text blocks overlap (iPad findings 2026-10-19).
// match keeps 18 px air above the band (task 14, the empty field with "…"); its air per item and
// state goes to layout-match-<viewport>.json.

import { expect, test, type Page } from '@playwright/test';
import { writeFileSync } from 'node:fs';
import {
  ITEMS,
  SCREENSHOTS,
  VIEWPORTS as ALL_VIEWPORTS,
  fitMetrics,
  fitProblems,
  itemIdOnScreen,
  matchProblems,
} from './helpers';
import { overflowProblems, overlapProblems } from './screen-checks';

// The viewports share nothing (each writes its own files), so they run side by side: locally all
// four in 12.5 min instead of 42 min one after another (layout project 27.7 instead of 43.2 min).
test.describe.configure({ mode: 'parallel' });

const VIEWPORTS = process.env.CI
  ? ALL_VIEWPORTS.filter((v) => v.name.startsWith('safari-'))
  : ALL_VIEWPORTS;
const STATES = ['answering', 'richtig', 'noch-nicht'] as const;
/** Air between the answers and the band for match items (task 14), as in text-layout. */
const MATCH_AIR = 18;
/** short-answer has one screen more: the model answer and the rating band. */
const statesOf = (item: (typeof ITEMS)[number]): string[] =>
  item.format === 'short-answer' ? [...STATES, 'vergleichen'] : [...STATES];

/** Longest text on screen: stimulus + prompt + the "noch nicht" explanation. */
const worst = [...ITEMS].sort((a, b) => {
  const len = (i: (typeof ITEMS)[number]) =>
    (i.stimulus?.text ?? '').length +
    i.prompt.length +
    i.feedback.incorrect.length +
    (i.feedback.misconception ?? '').length;
  return len(b) - len(a);
})[0]!;

/** The picture item with the most text: picture, text and number pad compete for height. */
const pictureItem = ITEMS.filter((i) => i.stimulus?.assetId).sort(
  (a, b) =>
    (b.stimulus?.text ?? '').length +
    b.prompt.length -
    ((a.stimulus?.text ?? '').length + a.prompt.length),
)[0];

/**
 * Opens a dev item page. Under parallel load the dev server occasionally fails the first import
 * of a content chunk ("Failed to fetch dynamically imported module"); the page then waits
 * forever, so it gets one reload instead of hanging until the test times out.
 */
async function openItem(page: Page, url: string) {
  const band = page.locator('[data-region="band"] > button:last-of-type');
  await page.goto(url);
  try {
    await band.waitFor({ timeout: 20_000 });
  } catch {
    await page.goto(url);
    await band.waitFor();
  }
  // The lazy renderers (match, order, …) show a Suspense fallback (aria-busy) first; measuring it
  // would see its 48 px instead of the task (CI run 39239177965: "match rows missing").
  await expect(page.locator('[data-region="answer"] [aria-busy="true"]')).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
}

for (const viewport of VIEWPORTS) {
  test(`alle Items passen auf ${viewport.name} (${viewport.width}×${viewport.height})`, async ({
    page,
    context,
  }) => {
    // About 0.8 s per item and state locally; grows with every batch.
    test.setTimeout(Math.max(300_000, ITEMS.length * (STATES.length + 1) * 3_000));
    await page.setViewportSize(viewport);
    const red: string[] = [];
    const matchAir: Record<string, number> = {};
    for (const item of ITEMS) {
      // A fresh tab per item: in CI one tab crashed after about 300 navigations ("Page crashed").
      const tab = await context.newPage();
      await tab.setViewportSize(viewport);
      for (const state of statesOf(item)) {
        await openItem(tab, `/dev/item/${item.id}?state=${state}`);
        // The same check as currentItem and the sweep: the screen shows this item.
        const shown = await itemIdOnScreen(tab);
        if (shown !== item.id) red.push(`${item.id} ${state}: the screen shows ${shown}`);
        for (const problem of [
          ...(await fitProblems(tab)),
          ...(await overflowProblems(tab)),
          ...(await overlapProblems(tab)),
        ])
          red.push(`${item.id} ${state}: ${problem}`);
        if (item.format === 'match') {
          for (const problem of await matchProblems(tab))
            red.push(`${item.id} ${state}: ${problem}`);
          const slack = Math.round((await fitMetrics(tab))?.slack ?? -Infinity);
          matchAir[`${item.id} ${state}`] = slack;
          if (slack < MATCH_AIR)
            red.push(
              `${item.id} ${state}: only ${slack} px air above the band (match: ${MATCH_AIR})`,
            );
        }
      }
      await tab.close();
    }
    await openItem(page, `/dev/item/${worst.id}?state=noch-nicht`);
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${SCREENSHOTS}/layout-laengstes-item-${viewport.name}.png` });
    if (pictureItem) {
      await openItem(page, `/dev/item/${pictureItem.id}?state=noch-nicht`);
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${SCREENSHOTS}/layout-bild-${viewport.name}.png` });
    }
    writeFileSync(
      `${SCREENSHOTS}/layout-match-${viewport.name}.json`,
      `${JSON.stringify(matchAir, null, 2)}\n`,
    );
    expect(red, `${red.length} Befunde auf ${viewport.name}:\n${red.join('\n')}`).toEqual([]);
  });
}
