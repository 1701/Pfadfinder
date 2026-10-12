// Smoke flow (ARCHITECTURE.md §8): Üben starten → 10 Items → Abschluss, plus Fortsetzen nach
// Reload (IndexedDB) and offline use. Screenshots in both iPad formats (Chromium projects).

import { expect, test, type Page } from '@playwright/test';
import { ITEMS, SCREENSHOTS, expectFitsScreen, type ContentItem } from './helpers';

const viewportName = (page: Page) =>
  page.viewportSize()!.width > page.viewportSize()!.height ? 'ipad-landscape' : 'ipad-portrait';

async function shot(page: Page, name: string) {
  if (test.info().project.name.startsWith('webkit')) return;
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${SCREENSHOTS}/${name}-${viewportName(page)}.png` });
}

async function currentItem(page: Page): Promise<ContentItem> {
  const plain = (text: string | null) => (text ?? '').replace(/\u00a0/g, ' ');
  const prompt = plain(await page.getByRole('heading', { level: 1 }).textContent());
  const sheet = plain(await page.locator('main section').first().textContent());
  const item = ITEMS.find((i) => i.prompt === prompt && sheet.includes(i.stimulus?.text ?? ''));
  expect(item, `item for "${prompt}"`).toBeDefined();
  return item!;
}

async function answer(page: Page, item: ContentItem, correct: boolean) {
  if (item.format === 'single-choice') {
    const id = correct
      ? item.solution.optionId!
      : item.payload.options!.find((o) => o.id !== item.solution.optionId)!.id;
    await page.locator('label', { has: page.locator(`input[value="${id}"]`) }).click();
  } else {
    const value = correct ? item.solution.value! : item.solution.value! + 1;
    for (const key of String(value).replace('.', ',')) {
      await page.getByRole('button', { name: key === ',' ? 'Komma' : key, exact: true }).click();
    }
  }
}

test('Fokusring nach Prüfen nur bei Tastatur', async ({ page }) => {
  const outline = () =>
    page
      .getByRole('button', { name: 'Weiter' })
      .evaluate((el) => el === document.activeElement && getComputedStyle(el).outlineStyle);
  await page.goto('/');
  await page.getByRole('link', { name: 'Zahlen und Rechnen' }).click();
  await expect(page.getByText('1 von 10')).toBeVisible();
  await answer(page, await currentItem(page), true);
  await page.getByRole('button', { name: 'Prüfen' }).click();
  // Tapped: "Weiter" has the focus, but no ring.
  await expect.poll(outline).toBe('none');
  // Keyboard: back and forth with Tab, the ring is there.
  await page.keyboard.press('Shift+Tab');
  await page.keyboard.press('Tab');
  await expect.poll(outline).toBe('solid');
});

test('Karte → Gebiet → 10 Items mit Neuladen → zurück: Tagesziel 10 von 10', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: "Wohin geht's heute?" })).toBeVisible();
  await expect(page.getByText('Heute: 0 von 10 Fundstücken')).toBeVisible();
  await shot(page, 'start');
  await page.getByRole('link', { name: 'Zahlen und Rechnen, Niveau 1' }).click();

  const taken = new Set<string>();
  for (let n = 1; n <= 10; n++) {
    await expect(page.getByText(`${n} von 10`)).toBeVisible();
    const item = await currentItem(page);
    const correct = n % 2 === 0;
    await answer(page, item, correct);
    await expectFitsScreen(page, `${item.id} beantwortet`);
    if (!taken.has(item.format)) {
      taken.add(item.format);
      await shot(page, `item-${item.format}`);
    }

    await page.getByRole('button', { name: 'Prüfen' }).click();
    await expect(
      page.getByRole('heading', { name: correct ? 'Richtig.' : 'Noch nicht ganz.' }),
    ).toBeVisible();
    await expect(page.getByText(/falsch/i)).toHaveCount(0);
    await expectFitsScreen(page, `${item.id} Rückmeldung`);
    const state = correct ? 'feedback-richtig' : 'feedback-noch-nicht';
    if (!taken.has(state)) {
      taken.add(state);
      await page.waitForTimeout(300); // let the feedback finish rising
      await shot(page, state);
    }
    await page.getByRole('button', { name: 'Weiter' }).click();

    if (n === 3) {
      // Answers live in IndexedDB: after a reload the session continues at 4 von 10.
      await page.reload();
    }
  }

  await expect(page.getByRole('heading', { name: 'Heute geschafft: 10 Fundstücke' })).toBeVisible();
  await shot(page, 'abschluss');
  await page.getByRole('link', { name: 'Zur Übersicht' }).click();
  await expect(page.getByText('Heute: 10 von 10 Fundstücken. Geschafft.')).toBeVisible();
  await expect(page.getByRole('link', { name: /^Zahlen und Rechnen, Niveau \d/ })).toBeVisible();
  await shot(page, 'start-geschafft');
});

test('offline nach dem ersten Laden', async ({ page, context, browserName }) => {
  test.skip(browserName === 'webkit', 'Playwright WebKit has no service worker support');
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload(); // now controlled by the service worker
  await context.setOffline(true);
  await page.reload();
  await page.getByRole('link', { name: 'Zahlen und Rechnen' }).click();
  await expect(page.getByText('1 von 10')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Prüfen' })).toBeVisible();
});
