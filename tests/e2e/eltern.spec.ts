// The Eltern page (/eltern, only by URL): sum on the digit pad, "Alles löschen" with a question
// back, then the map of a new device that offers the Einstieg again. Production build.

import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { EXPORT_VERSION, parseImport } from '../../src/domain/learner';
import { answer, check, currentItem } from './helpers';

const OFFER = 'Wo geht deine Reise los?';

async function passGate(page: Page) {
  await page.goto('/eltern');
  const question = await page.getByRole('heading', { level: 1 }).textContent();
  const [, a, b] = question!.match(/(\d+) \+ (\d+)/)!;
  for (const digit of String(Number(a) + Number(b))) {
    await page.getByRole('button', { name: digit, exact: true }).click();
  }
  await page.getByRole('button', { name: 'Weiter' }).click();
}

test('Üben → /eltern → alles löschen → Karte mit Angebot', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Später' }).click();
  // No way to the Eltern page inside the app.
  await expect(page.locator('a[href*="eltern"]')).toHaveCount(0);
  await page.getByRole('link', { name: 'Zahlen und Rechnen, Niveau 1' }).click();
  for (let n = 1; n <= 2; n++) {
    await expect(page.getByText(`${n} von 10`)).toBeVisible();
    const item = await currentItem(page);
    await answer(page, item, true);
    await check(page, item, true);
    await page.getByRole('button', { name: 'Weiter' }).click();
  }
  await page.getByRole('link', { name: 'Pause' }).click();
  await expect(page.getByText('Heute: 2 von 10 Fundstücken')).toBeVisible();

  await page.goto('/eltern');
  const question = await page.getByRole('heading', { level: 1 }).textContent();
  const [, a, b] = question!.match(/(\d+) \+ (\d+)/)!;
  for (const digit of String(Number(a) + Number(b))) {
    await page.getByRole('button', { name: digit, exact: true }).click();
  }
  await page.getByRole('button', { name: 'Weiter' }).click();
  await page.getByRole('button', { name: 'Alles löschen' }).click();
  await expect(
    page.getByRole('heading', {
      name: 'Wirklich alles löschen? Das kann nicht rückgängig gemacht werden.',
    }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Ja, alles löschen' }).click();

  // The map of a new device: the offer is back ("Später" was deleted too), no Fundstücke.
  await expect(page.getByRole('heading', { name: OFFER })).toBeVisible();
  await expect(page).toHaveURL(/\/$/);
  await page.getByRole('button', { name: 'Später' }).click();
  await expect(page.getByText('Heute: 0 von 10 Fundstücken')).toBeVisible();
  // Practice starts fresh, without the old round.
  await page.getByRole('link', { name: 'Zahlen und Rechnen, Niveau 1' }).click();
  await expect(page.getByText('1 von 10')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Prüfen' })).toBeVisible();
});

test('Üben → /eltern → Sicherung herunterladen: eine gültige Datei, die sich wieder lesen lässt', async ({
  page,
}) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Später' }).click();
  await page.getByRole('link', { name: 'Zahlen und Rechnen, Niveau 1' }).click();
  for (let n = 1; n <= 2; n++) {
    await expect(page.getByText(`${n} von 10`)).toBeVisible();
    const item = await currentItem(page);
    await answer(page, item, true);
    await check(page, item, true);
    await page.getByRole('button', { name: 'Weiter' }).click();
  }

  await passGate(page);
  const downloading = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Sicherung herunterladen' }).click();
  const download = await downloading;
  expect(download.suggestedFilename()).toMatch(/^pfadfinder-sicherung-\d{4}-\d{2}-\d{2}\.json$/);
  const text = await readFile((await download.path())!, 'utf8');
  const file = JSON.parse(text) as { version: string; attempts: unknown[] };
  expect(file.version).toBe(EXPORT_VERSION);
  expect(file.attempts).toHaveLength(2);
  expect(parseImport(text).ok).toBe(true);
  // Nothing was deleted: the button to delete is still there, the data too.
  await expect(page.getByRole('button', { name: 'Alles löschen' })).toBeVisible();
});
