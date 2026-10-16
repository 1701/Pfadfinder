// A practice round with reading texts (task 9) on /dev/text/t-sach-900?runde: the real session
// store on in-memory repositories with the fixture texts t-sach-900 and t-sach-901.
// Reading screen → "Weiter" → three items of the same text, without a second reading screen;
// the box keeps where the child scrolled to; the item's Vorlesen never reads the text, the box's
// own Vorlesen does. Both iPad formats.

import { expect, test, type Page } from '@playwright/test';
import { LESEN_ITEMS, LESEN_TEXTS } from '../fixtures/lesen';
import { SCREENSHOTS, answer, check, type ContentItem } from './helpers';

/** Records what Vorlesen would say instead of speaking. */
function fakeSpeech() {
  const spoken: string[] = [];
  Object.assign(window, { __spoken: spoken });
  class Utterance {
    lang = '';
    rate = 1;
    onend: (() => void) | null = null;
    onerror: (() => void) | null = null;
    constructor(public text: string) {}
  }
  Object.defineProperty(window, 'SpeechSynthesisUtterance', { value: Utterance });
  Object.defineProperty(window, 'speechSynthesis', {
    value: { speak: (u: Utterance) => spoken.push(u.text), cancel: () => {} },
  });
}

const lastSpoken = (page: Page) =>
  page.evaluate(() => (window as unknown as { __spoken: string[] }).__spoken.at(-1) ?? '');

const scroller = (page: Page) => page.locator('[data-region="text"] [role="region"]');

async function scrollBoxTo(page: Page, top: number) {
  await scroller(page).evaluate((el, t) => {
    el.scrollTop = t;
    el.dispatchEvent(new Event('scroll'));
  }, top);
}

/** The fixture item on screen, found by its prompt within the running text. */
async function itemOnScreen(page: Page, textId: string): Promise<ContentItem> {
  const prompt = (await page.getByRole('heading', { level: 1 }).textContent())!.replace(
    /\u00a0/g,
    ' ',
  );
  const item = LESEN_ITEMS.find((i) => i.prompt === prompt);
  expect(item, `fixture item for "${prompt}"`).toBeDefined();
  expect(item!.stimulus?.textRef, 'item of the running text').toBe(textId);
  return item as unknown as ContentItem;
}

for (const viewport of [
  { name: 'ipad-landscape', width: 1024, height: 768 },
  { name: 'ipad-portrait', width: 768, height: 1024 },
]) {
  test(`Runde mit Lesetext: Lese-Screen, drei Items, Kasten bleibt (${viewport.name})`, async ({
    browser,
  }) => {
    const context = await browser.newContext({ viewport });
    await context.addInitScript(fakeSpeech);
    const page = await context.newPage();
    await page.goto('/dev/text/t-sach-900?runde');

    // The reading screen: instruction, title, the whole text, yellow "Weiter".
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lies den Text.');
    const title = await page.getByRole('heading', { level: 2 }).textContent();
    const text = LESEN_TEXTS.find((t) => t.title === title)!;
    expect(text).toBeDefined();
    await expect(page.getByText('1 von 10')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    await page.screenshot({ path: `${SCREENSHOTS}/lesen-runde-lesen-${viewport.name}.png` });
    await page.getByRole('button', { name: 'Weiter' }).click();

    let kept = 0;
    for (let n = 1; n <= 3; n++) {
      await expect(page.getByText(`${n} von 10`)).toBeVisible();
      // No second reading screen, and the box has no title beside an item.
      await expect(page.getByRole('heading', { name: 'Lies den Text.' })).toHaveCount(0);
      await expect(page.locator('[data-region="text"] h2')).toHaveCount(0);
      const item = await itemOnScreen(page, text.id);

      // The first item starts at the top; then the box stays where the child left it.
      expect(await scroller(page).evaluate((el) => Math.round(el.scrollTop))).toBe(kept);
      kept = 120 * n;
      await scrollBoxTo(page, kept);

      if (n === 1) {
        const sheet = page.locator('[data-region="sheet"]');
        await sheet.getByRole('button', { name: 'Vorlesen' }).click();
        const itemSpeech = await lastSpoken(page);
        expect(itemSpeech).toContain(item.prompt);
        for (const paragraph of text.paragraphs) expect(itemSpeech).not.toContain(paragraph);
        await sheet.getByRole('button', { name: 'Stopp' }).click();

        const box = page.locator('[data-region="text"]');
        await box.getByRole('button', { name: 'Vorlesen' }).click();
        expect(await lastSpoken(page)).toBe([text.title, ...text.paragraphs].join(' '));
        await box.getByRole('button', { name: 'Stopp' }).click();
        await page.screenshot({ path: `${SCREENSHOTS}/lesen-runde-item-${viewport.name}.png` });
      }

      await answer(page, item, true);
      await check(page, item, true);
      await page.locator('[data-region="band"]').getByRole('button', { name: 'Weiter' }).click();
    }
    await expect(page.getByText('4 von 10')).toBeVisible();
    await context.close();
  });
}
