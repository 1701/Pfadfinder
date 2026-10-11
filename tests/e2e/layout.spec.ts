// Every practiceable item in every state on four viewports: the two iPad sizes from the skill
// and the same iPad in Safari with its bars (1024×660 landscape, 768×900 portrait).
// Runs against /dev/item (dev build only).

import { test } from '@playwright/test';
import { ITEMS, SCREENSHOTS, expectFitsScreen } from './helpers';

const VIEWPORTS = [
  { name: 'ipad-landscape', width: 1024, height: 768 },
  { name: 'ipad-portrait', width: 768, height: 1024 },
  { name: 'safari-landscape', width: 1024, height: 660 },
  { name: 'safari-portrait', width: 768, height: 900 },
];
const STATES = ['answering', 'richtig', 'noch-nicht'] as const;

/** Longest text on screen: stimulus + prompt + the "noch nicht" explanation. */
const worst = [...ITEMS].sort((a, b) => {
  const len = (i: (typeof ITEMS)[number]) =>
    (i.stimulus?.text ?? '').length +
    i.prompt.length +
    i.feedback.incorrect.length +
    (i.feedback.misconception ?? '').length;
  return len(b) - len(a);
})[0]!;

for (const viewport of VIEWPORTS) {
  test(`alle Items passen auf ${viewport.name} (${viewport.width}×${viewport.height})`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    for (const item of ITEMS) {
      for (const state of STATES) {
        await page.goto(`/dev/item/${item.id}?state=${state}`);
        await page.locator('[data-region="band"] button').waitFor();
        await page.evaluate(() => document.fonts.ready);
        await expectFitsScreen(page, `${item.id} ${state} ${viewport.name}`);
      }
    }
    await page.goto(`/dev/item/${worst.id}?state=noch-nicht`);
    await page.locator('[data-region="band"] button').waitFor();
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(300);
    await page.screenshot({ path: `${SCREENSHOTS}/layout-laengstes-item-${viewport.name}.png` });
  });
}
