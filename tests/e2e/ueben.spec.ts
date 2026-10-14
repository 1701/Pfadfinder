// Smoke flow (ARCHITECTURE.md §8): Üben starten → 10 Items → Abschluss, plus Fortsetzen nach
// Reload (IndexedDB) and offline use. Screenshots in both iPad formats (Chromium projects).

import { expect, test, type Page } from '@playwright/test';
import { SCREENSHOTS, answer, currentItem, expectFitsScreen } from './helpers';

const viewportName = (page: Page) =>
  page.viewportSize()!.width > page.viewportSize()!.height ? 'ipad-landscape' : 'ipad-portrait';

async function shot(page: Page, name: string) {
  if (test.info().project.name.startsWith('webkit')) return;
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: `${SCREENSHOTS}/${name}-${viewportName(page)}.png` });
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
  // A new learner is offered the Einstieg first; "Später" brings back the Tagesziel.
  await page.getByRole('button', { name: 'Später' }).click();
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
      await expect(page.getByText('4 von 10')).toBeVisible();
      await page.getByRole('button', { name: 'Fortsetzen' }).click();
    }
  }

  await expect(page.getByRole('heading', { name: 'Heute geschafft: 10 Fundstücke' })).toBeVisible();
  await shot(page, 'abschluss');
  await page.getByRole('link', { name: 'Zur Übersicht' }).click();
  await expect(page.getByText('Heute: 10 von 10 Fundstücken. Geschafft.')).toBeVisible();
  await expect(page.getByRole('link', { name: /^Zahlen und Rechnen, Niveau \d/ })).toBeVisible();
  await shot(page, 'start-geschafft');
});

test('Neu anfangen: neue Runde ab 1, das Tagesziel bleibt', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Später' }).click();
  await page.getByRole('link', { name: 'Zahlen und Rechnen, Niveau 1' }).click();
  for (let n = 1; n <= 3; n++) {
    await expect(page.getByText(`${n} von 10`)).toBeVisible();
    await answer(page, await currentItem(page), true);
    await page.getByRole('button', { name: 'Prüfen' }).click();
    await page.getByRole('button', { name: 'Weiter' }).click();
  }
  await page.getByRole('link', { name: 'Pause' }).click();
  await expect(page.getByText('Heute: 3 von 10 Fundstücken')).toBeVisible();

  await page.getByRole('link', { name: 'Zahlen und Rechnen, Niveau 1' }).click();
  await expect(
    page.getByRole('heading', { name: 'Hier warst du heute schon unterwegs.' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Neu anfangen' }).click();
  await expect(page.getByText('1 von 10')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Prüfen' })).toBeVisible();
  // Back on the map: today's Fundstücke did not go back.
  await page.getByRole('link', { name: 'Pause' }).click();
  await expect(page.getByText('Heute: 3 von 10 Fundstücken')).toBeVisible();
  // The new round has no answers yet: the next visit starts it without asking.
  await page.getByRole('link', { name: 'Zahlen und Rechnen, Niveau 1' }).click();
  await expect(page.getByText('1 von 10')).toBeVisible();
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
