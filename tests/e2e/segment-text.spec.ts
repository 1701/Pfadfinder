// Smoke for segment-text (CONTENT_SCHEMA §4.10) in both Chromium projects, on the dev page
// /dev/format/segment-text (dev server, never in the production build): tap two gaps, Prüfen,
// the band answers, nothing scrolls. No item of content/ has the format yet.

import { expect, test } from '@playwright/test';

const DEV = 'http://localhost:5199';

test('Trennstriche setzen, Prüfen, Rückmeldung ohne Scrollen', async ({ page }) => {
  await page.goto(`${DEV}/dev/format/segment-text?zustand=leer`);
  await expect(page.locator('main[data-format="segment-text"]')).toBeVisible();
  const band = page.locator('[data-region="band"]');
  const pruefen = band.getByRole('button', { name: 'Prüfen' });
  await expect(pruefen).toBeDisabled();

  // Am Nachmittag | spielt | der kleine Hund mit seinem roten Ball.  (one divider missing)
  const after = page.getByRole('button', { name: /^Trennstrich zwischen „Nachmittag“/ });
  await after.click();
  await expect(after).toHaveAttribute('aria-pressed', 'true');
  await page.getByRole('button', { name: /^Trennstrich zwischen „spielt“/ }).click();
  await expect(pruefen).toBeEnabled();
  await pruefen.click();

  await expect(band.getByText('Noch nicht ganz.')).toBeVisible();
  await expect(page.getByText(/^Richtig ist:/)).toBeVisible();
  await expect(band.getByRole('button', { name: 'Weiter' })).toBeVisible();
  const overflow = await page.evaluate(
    () => document.documentElement.scrollHeight - window.innerHeight,
  );
  expect(overflow, 'page scrolls').toBeLessThanOrEqual(0);
});
