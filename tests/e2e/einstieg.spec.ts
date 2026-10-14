// Smoke flow of the Einstieg (ARCHITECTURE.md §8, E2E 1): Karte → "Los" → questions without
// feedback → result → the map shows the starting niveaus and offers nothing more. Plus pause,
// "Später", the hint on a second visit and offline use. Runs on the production build (Chromium and
// WebKit).

import { readFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { answer, currentItem } from './helpers';

const OFFER = 'Wo geht deine Reise los?';
const MAP_TITLE = "Wohin geht's heute?";

// Practiceable Mathe Bereiche from the manifest: 3 questions each, at most 12.
const manifest = JSON.parse(readFileSync('content/manifest.json', 'utf8')) as {
  bereiche: Record<
    string,
    { fach: string; byFormat: Record<string, Record<string, number> | undefined> }
  >;
};
const MATHE_OPEN = Object.entries(manifest.bereiche)
  .filter(([, b]) => b.fach === 'mathe')
  .filter(([, b]) => {
    // Every format has a renderer since task 7: all active items count.
    const count = Object.values(b.byFormat)
      .flatMap((byNiveau) => Object.values(byNiveau ?? {}))
      .reduce((sum, n) => sum + n, 0);
    return count >= 10;
  })
  .map(([bereich]) => bereich);
const TOTAL = Math.min(12, 3 * MATHE_OPEN.length);

async function startEinstieg(page: Page) {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: OFFER })).toBeVisible();
  await page.getByRole('link', { name: 'Los', exact: true }).click();
  await expect(
    page.getByRole('heading', { name: 'Wir schauen, wo deine Reise losgeht.' }),
  ).toBeVisible();
  await page.getByRole('button', { name: 'Starten' }).click();
  await expect(page.getByText(`1 von ${TOTAL}`)).toBeVisible();
}

test('Karte → Los → Einstieg ohne Rückmeldung → Ergebnis → Karte mit Startniveaus', async ({
  page,
}) => {
  expect(MATHE_OPEN).toContain('zahlen-operationen');
  await page.goto('/');
  // While offered, the question is the title and the Tagesziel steps aside.
  await expect(page.getByRole('heading', { name: OFFER })).toBeVisible();
  await expect(page.getByText(/Fundstücken/)).toHaveCount(0);
  await startEinstieg(page);

  for (let n = 1; n <= TOTAL; n++) {
    await expect(page.getByText(`${n} von ${TOTAL}`)).toBeVisible();
    const item = await currentItem(page);
    // Zahlen und Rechnen right, everything else wrong.
    await answer(page, item, item.id.startsWith('m-zo-'));
    await expect(page.getByRole('button', { name: 'Prüfen' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Weiter' }).click();
    // No judgement, ever: straight on to the next question. Only the feedback is checked, not the
    // page: tasks themselves say "richtig" or "falsch" ("Was hat Ben falsch gemacht?").
    await expect(page.getByRole('heading', { name: /^(Richtig|Noch nicht ganz)\.$/ })).toHaveCount(
      0,
    );
    await expect(page.locator('[data-region="band"]')).not.toContainText(
      /Richtig|Noch nicht|falsch/i,
    );
  }

  await expect(page.getByRole('heading', { name: 'Deine Reise beginnt hier' })).toBeVisible();
  const map = page.getByRole('group', { name: 'Karte' }).locator('visible=true');
  await expect(map.getByRole('link')).toHaveCount(0);
  for (const label of [
    'Zahlen und Rechnen, Niveau 3',
    ...MATHE_OPEN.filter((b) => b !== 'zahlen-operationen').map(() => /, Niveau 1$/),
  ]) {
    await expect(map.getByRole('img', { name: label }).first()).toBeVisible();
  }
  // No numbers, no percent on the result.
  expect(await page.locator('main').innerText()).not.toMatch(/\d|%/);

  await page.getByRole('link', { name: 'Zur Karte' }).click();
  await expect(page.getByRole('heading', { name: MAP_TITLE })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Zahlen und Rechnen, Niveau 3' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Formen und Raum, Niveau 1' })).toBeVisible();
  // The check is no Fundstück, and it is not offered a second time.
  await expect(page.getByText('Heute: 0 von 10 Fundstücken')).toBeVisible();
  await expect(page.getByRole('heading', { name: OFFER })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('link', { name: 'Zahlen und Rechnen, Niveau 3' })).toBeVisible();
  await expect(page.getByRole('heading', { name: OFFER })).toHaveCount(0);

  await page.goto('/einstieg/mathe');
  await expect(
    page.getByRole('heading', { name: 'Deine Reise hat schon begonnen.' }),
  ).toBeVisible();
  await page.getByRole('link', { name: 'Zur Karte' }).click();
  await expect(page.getByRole('heading', { name: MAP_TITLE })).toBeVisible();
});

test('Pause fragt nach: Weitermachen bleibt dabei, Zur Karte fängt von vorn an', async ({
  page,
}) => {
  await startEinstieg(page);
  for (let n = 1; n <= 3; n++) {
    await answer(page, await currentItem(page), true);
    await page.getByRole('button', { name: 'Weiter' }).click();
  }
  const fourth = await page.getByRole('heading', { level: 1 }).textContent();

  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(
    page.getByRole('heading', {
      name: 'Wenn du jetzt gehst, fangen wir nächstes Mal von vorn an.',
    }),
  ).toBeVisible();
  await expect(page.getByText(`4 von ${TOTAL}`)).toBeVisible();
  await page.getByRole('button', { name: 'Weitermachen' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(fourth!);

  await page.getByRole('button', { name: 'Pause' }).click();
  await page.getByRole('link', { name: 'Zur Karte' }).click();
  // Nothing was kept: the offer is back, and the Einstieg starts at 1.
  await expect(page.getByRole('heading', { name: OFFER })).toBeVisible();
  await page.getByRole('link', { name: 'Los', exact: true }).click();
  await page.getByRole('button', { name: 'Starten' }).click();
  await expect(page.getByText(`1 von ${TOTAL}`)).toBeVisible();
});

test('Später: das Angebot ruht bis zum Ende des Tages, auch nach Neuladen', async ({ page }) => {
  // Fixed clock (local time of the browser): "Später" is stored with the day it was tapped.
  await page.clock.setFixedTime(new Date('2026-10-14T10:00:00'));
  await page.goto('/');
  await page.getByRole('button', { name: 'Später' }).click();
  await expect(page.getByRole('heading', { name: MAP_TITLE })).toBeVisible();
  await expect(page.getByText('Heute: 0 von 10 Fundstücken')).toBeVisible();
  // Into a Gebiet and back within the app: still resting.
  await page.getByRole('link', { name: 'Zahlen und Rechnen, Niveau 1' }).click();
  await page.getByRole('link', { name: 'Pause' }).click();
  await expect(page.getByRole('heading', { name: MAP_TITLE })).toBeVisible();
  // A new start of the app the same evening: still resting.
  await page.clock.setFixedTime(new Date('2026-10-14T21:30:00'));
  await page.reload();
  await expect(page.getByText('Heute: 0 von 10 Fundstücken')).toBeVisible();
  await expect(page.getByRole('heading', { name: OFFER })).toHaveCount(0);
  // The next morning the offer is back.
  await page.clock.setFixedTime(new Date('2026-10-15T08:00:00'));
  await page.reload();
  await expect(page.getByRole('heading', { name: OFFER })).toBeVisible();
});

test('offline: Intro → eine Aufgabe → Pause → Weitermachen', async ({
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
  await page.reload();
  // The check-route chunk and the content come from the precache.
  await startEinstieg(page);
  await answer(page, await currentItem(page), true);
  await page.getByRole('button', { name: 'Weiter' }).click();
  await expect(page.getByText(`2 von ${TOTAL}`)).toBeVisible();
  const second = await page.getByRole('heading', { level: 1 }).textContent();

  await page.getByRole('button', { name: 'Pause' }).click();
  await page.getByRole('button', { name: 'Weitermachen' }).click();
  await expect(page.getByRole('heading', { level: 1 })).toHaveText(second!);
  await answer(page, await currentItem(page), true);
  await page.getByRole('button', { name: 'Weiter' }).click();
  await expect(page.getByText(`3 von ${TOTAL}`)).toBeVisible();
});
