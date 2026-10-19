// One real item per new format (task 7), played on /dev/item/:id?state=spielen (dev build): answer
// through the UI, Prüfen, the band, Weiter. Right and "noch nicht" once, then the "noch nicht" path
// in all four viewports with a fit check and screenshots before and after Prüfen. The item is the
// tightest of its format from the measurement in task 7, part A.

import { expect, test, type Page } from '@playwright/test';
import {
  ITEMS,
  SCREENSHOTS,
  VIEWPORTS,
  answer,
  check,
  expectFitsScreen,
  verdictOf,
  type ContentItem,
} from './helpers';

const CASES = [
  ['multi-choice', 'm-dz-2-007'],
  ['match', 'm-rf-1-004'],
  ['order', 'm-rf-2-008'],
  ['cloze-select', 'm-gm-2-008'],
  ['mark-in-text', 'd-rss-1-001'],
  ['find-error', 'd-rss-1-002'],
  ['short-answer', 'm-dz-3-003'],
] as const;

async function open(page: Page, item: ContentItem) {
  await page.goto(`/dev/item/${item.id}?state=spielen`);
  await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  // The lazy renderers show a Suspense fallback (aria-busy) first, as in layout.spec.
  await expect(page.locator('[data-region="answer"] [aria-busy="true"]')).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
}

const band = (page: Page) => page.locator('[data-region="band"]');

/**
 * What must stay in place when Prüfen is pressed (no layout jump): the cards of order, the row
 * labels of match. Rounded to whole pixels.
 */
const STILL: Record<string, string> = {
  order: '[data-region="answer"] li > span:nth-child(2)',
  match: '[data-region="answer"] [class*="px-sm"]',
};
async function boxes(page: Page, format: string): Promise<string[]> {
  const selector = STILL[format];
  if (!selector) return [];
  return page.locator(selector).evaluateAll((els) =>
    els.map((el) => {
      const r = el.getBoundingClientRect();
      return [r.x, r.y, r.width, r.height].map(Math.round).join(',');
    }),
  );
}

async function expectBand(page: Page, item: ContentItem, correct: boolean) {
  const verdict = verdictOf(item, correct);
  if (verdict) await expect(band(page).getByRole('heading', { name: verdict })).toBeVisible();
  else
    await expect(
      band(page).getByRole('heading', { name: /Richtig\.|Noch nicht ganz\./ }),
    ).toHaveCount(0);
  await expect(band(page).getByRole('button', { name: 'Weiter' })).toBeVisible();
  await expect(band(page).getByText(/falsch/i)).toHaveCount(0);
  if (item.format === 'find-error') {
    await expect(band(page)).toContainText('So schreibt man es: Samstag');
  }
  if (item.format === 'short-answer') {
    await expect(band(page)).toContainText(
      correct ? item.feedback.correct : item.feedback.incorrect,
    );
  }
}

for (const [format, id] of CASES) {
  test(`${format} (${id}): antworten, prüfen, Rückmeldung in vier Viewports`, async ({ page }) => {
    test.setTimeout(120_000);
    const item = ITEMS.find((i) => i.id === id && i.format === format);
    expect(item, `${format} item ${id} in content/`).toBeDefined();
    const it = item!;

    // Both outcomes once; Weiter brings back an unanswered item.
    await page.setViewportSize(VIEWPORTS[0]!);
    for (const correct of [true, false]) {
      await open(page, it);
      const submit = page.getByRole('button', {
        name: it.format === 'short-answer' ? 'Vergleichen' : 'Prüfen',
      });
      await expect(submit).toBeDisabled();
      await answer(page, it, correct);
      await expect(submit).toBeEnabled();
      await check(page, it, correct);
      await expectBand(page, it, correct);
      await band(page).getByRole('button', { name: 'Weiter' }).click();
      await expect(submit).toBeDisabled();
    }

    for (const viewport of VIEWPORTS) {
      await page.setViewportSize(viewport);
      await open(page, it);
      await answer(page, it, false);
      await expectFitsScreen(page, `${id} beantwortet ${viewport.name}`);
      await page.screenshot({
        path: `${SCREENSHOTS}/format-${format}-vorher-${viewport.name}.png`,
      });
      const before = await boxes(page, it.format);
      if (it.format === 'short-answer') {
        await page.getByRole('button', { name: 'Vergleichen' }).click();
        await expect(page.getByRole('heading', { name: 'So könnte es aussehen:' })).toBeVisible();
        await expectFitsScreen(page, `${id} vergleichen ${viewport.name}`);
        await page.screenshot({
          path: `${SCREENSHOTS}/format-${format}-vergleichen-${viewport.name}.png`,
        });
        await page.getByRole('button', { name: 'Noch nicht', exact: true }).click();
      } else {
        await check(page, it, false);
      }
      await expectBand(page, it, false);
      await page.waitForTimeout(300); // let the feedback finish rising
      await expectFitsScreen(page, `${id} Rückmeldung ${viewport.name}`);
      expect(await boxes(page, it.format), `${id}: nothing moves on Prüfen`).toEqual(before);
      await page.screenshot({
        path: `${SCREENSHOTS}/format-${format}-nachher-${viewport.name}.png`,
      });
    }
  });
}

test('match lässt sich auch ziehen (m-rf-1-004)', async ({ page }) => {
  const it = ITEMS.find((i) => i.id === 'm-rf-1-004')!;
  await page.setViewportSize(VIEWPORTS[0]!);
  await open(page, it);
  const card = page
    .getByRole('group', { name: 'Antworten' })
    .getByRole('button', { name: '6 gleich große Quadrate' });
  const slot = page.getByRole('button', { name: 'Feld für Würfel' });
  await card.hover();
  await page.mouse.down();
  const box = (await slot.boundingBox())!;
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 12 });
  await page.mouse.up();
  await expect(
    page.getByRole('button', { name: /6 gleich große Quadrate, bei Würfel/ }),
  ).toBeVisible();
});

test('order lässt sich auch ziehen (m-rf-2-008)', async ({ page }) => {
  const it = ITEMS.find((i) => i.id === 'm-rf-2-008')!;
  await page.setViewportSize(VIEWPORTS[0]!);
  await open(page, it);
  const rows = page.locator('[data-region="answer"] li');
  const before = await rows.allTextContents();
  const handle = rows.nth(0).locator('span').first();
  const target = (await rows.nth(2).boundingBox())!;
  await handle.hover();
  await page.mouse.down();
  await page.mouse.move(target.x + 20, target.y + target.height / 2 + 4, { steps: 16 });
  await page.mouse.up();
  await expect.poll(() => rows.allTextContents()).not.toEqual(before);
  await expect(page.getByRole('button', { name: 'Prüfen' })).toBeEnabled();
});
