// Every active item in every state on four viewports: the two iPad sizes from the skill
// and the same iPad in Safari with its bars (1024×660 landscape, 768×900 portrait).
// In CI only the two Safari sizes run (ARCHITECTURE.md §8): they are the tightest, and an item
// that fits there also fits on the full iPad screens. Locally all four run.
// A viewport does not stop at the first red item: it measures all of them and fails once, with
// the complete list. Runs against /dev/item (dev build only).

import { expect, test, type Page } from '@playwright/test';
import { ITEMS, SCREENSHOTS, VIEWPORTS as ALL_VIEWPORTS, fitProblems } from './helpers';

const VIEWPORTS = process.env.CI
  ? ALL_VIEWPORTS.filter((v) => v.name.startsWith('safari-'))
  : ALL_VIEWPORTS;
const STATES = ['answering', 'richtig', 'noch-nicht'] as const;
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
  await page.evaluate(() => document.fonts.ready);
}

for (const viewport of VIEWPORTS) {
  test(`alle Items passen auf ${viewport.name} (${viewport.width}×${viewport.height})`, async ({
    page,
  }) => {
    // About 0.8 s per item and state locally; grows with every batch.
    test.setTimeout(Math.max(300_000, ITEMS.length * (STATES.length + 1) * 3_000));
    await page.setViewportSize(viewport);
    const red: string[] = [];
    for (const item of ITEMS) {
      for (const state of statesOf(item)) {
        await openItem(page, `/dev/item/${item.id}?state=${state}`);
        for (const problem of await fitProblems(page)) red.push(`${item.id} ${state}: ${problem}`);
      }
    }
    await openItem(page, `/dev/item/${worst.id}?state=noch-nicht`);
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${SCREENSHOTS}/layout-laengstes-item-${viewport.name}.png` });
    if (pictureItem) {
      await openItem(page, `/dev/item/${pictureItem.id}?state=noch-nicht`);
      await page.waitForTimeout(300);
      await page.screenshot({ path: `${SCREENSHOTS}/layout-bild-${viewport.name}.png` });
    }
    expect(red, `${red.length} Befunde auf ${viewport.name}:\n${red.join('\n')}`).toEqual([]);
  });
}
