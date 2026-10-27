// The page for parents and teachers (/eltern, task L) and the device area (/eltern/geraet, by URL,
// from /eltern or "Sicherung und Gerät" in the top line of the other pages for adults, never from a
// child's screen): the way there and back (static targets, task N), offline after the first load;
// on the device area the sum on the digit pad, "Alles löschen" with a question back, then the map
// of a new device that offers the Einstieg again. Production build.

import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';
import { EXPORT_VERSION, parseImport } from '../../src/domain/learner';
import { answer, check, currentItem, expectFirstHint } from './helpers';

const OFFER = 'Unerforscht: Mathe';

async function passGate(page: Page) {
  await page.goto('/eltern/geraet');
  const question = await page.getByRole('heading', { level: 1 }).textContent();
  const [, a, b] = question!.match(/(\d+) \+ (\d+)/)!;
  for (const digit of String(Number(a) + Number(b))) {
    await page.getByRole('button', { name: digit, exact: true }).click();
  }
  await page.getByRole('button', { name: 'Weiter' }).click();
}

test('Üben → /eltern/geraet → alles löschen → Karte mit Angebot', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Später' }).click();
  // No way to the device area from the map (only from /eltern and the legal pages).
  await expect(page.locator('a[href*="geraet"]')).toHaveCount(0);
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

  await page.goto('/eltern/geraet');
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
  await expectFirstHint(page);
  // Practice starts fresh, without the old round.
  await page.getByRole('link', { name: 'Zahlen und Rechnen, Niveau 1' }).click();
  await expect(page.getByText('1 von 10')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Prüfen' })).toBeVisible();
});

test('Üben → /eltern/geraet → Sicherung herunterladen: eine gültige Datei, die sich wieder lesen lässt', async ({
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

const LEGAL = [
  ['Impressum', 'Angaben nach §\u00a05\u00a0DDG'],
  ['Datenschutz', 'Hosting bei Cloudflare'],
] as const;

test('Impressum und Datenschutz: von der Karte (seit Aufgabe 11, DDG) und von /eltern/geraet vor der Rechenfrage; Zurück immer zur Karte', async ({
  page,
}) => {
  for (const start of ['/', '/eltern/geraet']) {
    for (const [link, section] of LEGAL) {
      await page.goto(start);
      await page.getByRole('link', { name: link }).click();
      await expect(page.getByRole('heading', { level: 1, name: link })).toBeVisible();
      await expect(page.getByRole('heading', { level: 2, name: section })).toBeVisible();
      // Static target (task N): to the map, not back in the history.
      await page.getByRole('link', { name: 'Zurück' }).click();
      await expect(page.getByRole('heading', { name: OFFER })).toBeVisible();
      await expect(page).toHaveURL(/\/$/);
    }
  }
});

test('/eltern/geraet → Zurück → /eltern → Zurück → Karte', async ({ page }) => {
  await page.goto('/eltern/geraet');
  await page.getByRole('link', { name: 'Zurück' }).click();
  await expect(page).toHaveURL(/\/eltern$/);
  await page.getByRole('link', { name: 'Zurück' }).click();
  await expect(page.getByRole('heading', { name: OFFER })).toBeVisible();
});

const ELTERN = 'Für Eltern und Lehrkräfte';

test('Karte → Eltern → Seite → Zurück → Karte, auch über Impressum → Eltern', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: OFFER })).toBeVisible();
  // The quiet link in the line below the map, right before "Impressum" (task L).
  const line = page.getByRole('navigation', { name: 'Eltern und Rechtliches' });
  await line.getByRole('link', { name: 'Eltern', exact: true }).click();
  await expect(page).toHaveURL(/\/eltern$/);
  await expect(page.getByRole('heading', { level: 1, name: ELTERN })).toBeVisible();
  // Numbers from the manifest: every Gebiet with its items, then the Probetests.
  await expect(page.getByText(/^Zahlen und Rechnen · \d+ Aufgaben$/)).toBeVisible();
  await expect(page.getByText(/^\d+ Probetests? Mathe, \d+ Probetests? Deutsch\.$/)).toBeVisible();
  await expect(page.getByRole('button', { name: 'Vorlesen' })).toHaveCount(0);
  await page.getByRole('link', { name: 'Zurück' }).click();
  await expect(page.getByRole('heading', { name: OFFER })).toBeVisible();
  await expect(page).toHaveURL(/\/$/);

  await page.getByRole('link', { name: 'Impressum' }).click();
  await page.getByRole('link', { name: 'Eltern', exact: true }).click();
  await expect(page.getByRole('heading', { level: 1, name: ELTERN })).toBeVisible();
});

test('Seite für Eltern → Sicherung und Gerät → Rechenfrage', async ({ page }) => {
  await page.goto('/eltern');
  await page.getByRole('link', { name: 'Sicherung und Gerät' }).first().click();
  await expect(page).toHaveURL(/\/eltern\/geraet$/);
  await expect(page.getByRole('heading', { level: 1, name: /^Für Erwachsene/ })).toBeVisible();
  // From Impressum the device area is one link, too.
  await page.goto('/impressum');
  await page.getByRole('link', { name: 'Sicherung und Gerät' }).click();
  await expect(page.getByRole('heading', { level: 1, name: /^Für Erwachsene/ })).toBeVisible();
});

test('offline: die Seite für Eltern nach dem ersten Laden', async ({
  page,
  context,
  browserName,
}) => {
  test.skip(browserName === 'webkit', 'Playwright WebKit has no service worker support');
  await page.goto('/');
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload(); // now controlled by the service worker
  await context.setOffline(true);
  await page.goto('/eltern');
  await expect(page.getByRole('heading', { level: 1, name: ELTERN })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Aufgabe vorschlagen' })).toBeVisible();
  await page.getByRole('link', { name: 'So funktioniert Pfadfinder' }).first().click();
  await expect(
    page.getByRole('heading', { level: 1, name: 'So funktioniert Pfadfinder' }),
  ).toBeVisible();
});
