// Smoke flows of the Probetest (ARCHITECTURE.md §8, E2E 3) on the production build, Chromium and
// WebKit: Karte → Start → 3 items → overview → jump → submit with the question → result →
// looking through with the short-answer rating → result updated → Karte. Plus: a reload in the
// middle continues, time running out in the foreground (fake clock) leads to the result, and
// opening after the time ran out shows the intro. Deutsch with reading texts runs on the dev
// server (/dev/probetest-lauf, fixture deutsch-90, memory repos), never in the production build.

import { expect, test, type Page } from '@playwright/test';
import { PROBETEST_ITEMS, PROBETEST_TEXTS } from '../fixtures/lesen';
import { answer, currentItem, type ContentItem } from './helpers';

const DEV = 'http://localhost:5199';

const T0 = new Date('2026-10-15T08:00:00');

async function startProbetest(page: Page) {
  await page.goto('/');
  // The line below the map leads to the list of the Fach (task 16), its first entry to the test.
  await page.getByRole('link', { name: 'Probetest Mathe', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Probetest Mathe', exact: true })).toBeVisible();
  await page.getByRole('link', { name: /^Probetest Mathe 1/ }).click();
  await expect(page.getByRole('heading', { name: 'Probetest Mathe 1' })).toBeVisible();
  await page.getByRole('button', { name: 'Starten' }).click();
  await expect(page.getByText('1 von 24')).toBeVisible();
}

const header = (page: Page) => page.locator('[data-kopf]');

/** The position the running run has in IndexedDB: saving takes a few ms after a tap. */
async function storedIndex(page: Page): Promise<number | null> {
  return page.evaluate(
    () =>
      new Promise<number | null>((resolve) => {
        const request = indexedDB.open('pfadfinder');
        request.onsuccess = () => {
          const all = request.result
            .transaction('probetestRuns')
            .objectStore('probetestRuns')
            .getAll();
          all.onsuccess = () => {
            const running = (all.result as { status: string; currentIndex: number }[]).find(
              (r) => r.status === 'running',
            );
            request.result.close();
            resolve(running?.currentIndex ?? null);
          };
        };
        request.onerror = () => resolve(null);
      }),
  );
}
const band = (page: Page) => page.locator('[data-region="band"]');

test('Start → 3 Aufgaben → Übersicht → springen → Abgeben → Auswertung → vergleichen → Durchsehen → Karte', async ({
  page,
}) => {
  await startProbetest(page);
  await expect(page.getByText('Du hast diesen Probetest schon gemacht.')).toHaveCount(0);

  for (let n = 1; n <= 3; n++) {
    await expect(header(page)).toContainText(`${n} von 24`);
    await answer(page, await currentItem(page), true);
    // No checking while the test runs.
    await expect(page.getByRole('button', { name: 'Prüfen' })).toHaveCount(0);
    await page.getByRole('button', { name: 'Weiter' }).click();
  }
  await expect(header(page)).toContainText('4 von 24');
  await expect(header(page)).toContainText('Min.');

  await page.getByRole('button', { name: 'Übersicht' }).click();
  await expect(page.getByRole('button', { name: 'Aufgabe 3, beantwortet' })).toBeVisible();
  await page.getByRole('button', { name: 'Aufgabe 12, offen' }).click();
  await expect(header(page)).toContainText('12 von 24');
  const shortAnswer = await currentItem(page);
  expect(shortAnswer.format).toBe('short-answer');
  await answer(page, shortAnswer, true);
  await expect(page.getByRole('button', { name: 'Vergleichen' })).toHaveCount(0);

  await page.getByRole('button', { name: 'Übersicht' }).click();
  await page.getByRole('button', { name: 'Abgeben' }).click();
  await expect(page.getByRole('heading', { name: 'Noch 20 Aufgaben sind offen.' })).toBeVisible();
  await page.getByRole('button', { name: 'Abgeben' }).click();

  await expect(page.getByRole('heading', { name: 'Geschafft.' })).toBeVisible();
  const total = page.locator('[data-bereich="zusammen"]');
  await expect(total).toContainText('3 von 24');
  await expect(page.getByText('gestrichelt: noch nicht verglichen')).toBeVisible();
  await expect(page.locator('main')).not.toContainText('%');

  // "1 Antwort vergleichen": only the waiting short answer, then back to the result.
  await page.getByRole('button', { name: '1 Antwort vergleichen' }).click();
  await expect(header(page)).toContainText('1 von 1');
  await expect(band(page).getByRole('button', { name: 'Zurück' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Vergleichen' }).click();
  await page.getByRole('button', { name: 'Getroffen' }).click();
  await band(page).getByRole('button', { name: 'Zur Auswertung' }).click();
  await expect(total).toContainText('4 von 24');
  await expect(page.getByText(/noch nicht verglichen/)).toHaveCount(0);
  await expect(page.getByRole('button', { name: /vergleichen/ })).toHaveCount(0);

  // Looking through everything; the overview jumps to any item.
  await page.getByRole('button', { name: 'Durchsehen' }).click();
  await expect(header(page)).toContainText('1 von 24');
  await expect(band(page).getByRole('heading')).toHaveText('Richtig.');
  for (let n = 2; n <= 4; n++) {
    await band(page).getByRole('button', { name: 'Weiter' }).click();
    await expect(header(page)).toContainText(`${n} von 24`);
  }
  await expect(band(page).getByRole('heading')).toHaveText('Hier fehlt deine Antwort.');
  await expect(band(page).getByRole('button', { name: 'Falle zeigen' })).toHaveCount(0);
  await header(page).getByRole('button', { name: 'Übersicht' }).click();
  await expect(page.getByRole('button', { name: 'Aufgabe 4', exact: true })).toHaveAttribute(
    'aria-current',
    'step',
  );
  await page.getByRole('button', { name: 'Aufgabe 12, gelöst' }).click();
  await expect(header(page)).toContainText('12 von 24');

  await header(page).getByRole('button', { name: 'Zur Auswertung' }).click();
  await expect(total).toContainText('4 von 24');

  await page.getByRole('link', { name: 'Zur Karte' }).click();
  await expect(page.getByRole('link', { name: 'Probetest Mathe', exact: true })).toBeVisible();
  // A second run is allowed; the intro remembers the first and offers its result.
  await page.getByRole('link', { name: 'Probetest Mathe', exact: true }).click();
  // The list shows the Stand from the stored run (task 16), also after a reload.
  const entry = page.getByRole('link', { name: /^Probetest Mathe 1/ });
  // Only "gemacht", no date (release list, 2026-10-22).
  await expect(entry.locator('span').last()).toHaveText('gemacht');
  await page.reload();
  await expect(entry.locator('span').last()).toHaveText('gemacht');
  await entry.click();
  await expect(page.getByText('Du hast diesen Probetest schon gemacht.')).toBeVisible();
  await page.getByRole('button', { name: 'Auswertung ansehen' }).click();
  await expect(total).toContainText('4 von 24');
});

test('Neuladen mittendrin setzt beim selben Item mit derselben Antwort fort', async ({ page }) => {
  await startProbetest(page);
  await answer(page, await currentItem(page), true);
  await page.getByRole('button', { name: 'Weiter' }).click();
  await expect(header(page)).toContainText('2 von 24');
  await expect.poll(() => storedIndex(page)).toBe(1);
  await page.reload();
  await expect(header(page)).toContainText('2 von 24');
  await expect(page.getByRole('button', { name: 'Starten' })).toHaveCount(0);
  await page.getByRole('button', { name: 'Zurück' }).click();
  await expect(header(page)).toContainText('1 von 24');
  await expect(page.getByLabel('Deine Zahl')).toHaveText('435');
});

test('Die Zeit endet im Vordergrund: Hinweis bei 5 Minuten, dann die Auswertung', async ({
  page,
}) => {
  await page.clock.install({ time: T0 });
  await startProbetest(page);
  await expect(header(page)).toContainText('45 Min.');
  await answer(page, await currentItem(page), true);
  await page.clock.fastForward('40:00');
  await expect(header(page)).toContainText('Noch 5 Minuten');
  await page.clock.fastForward('05:00');
  await expect(page.getByRole('heading', { name: 'Die Zeit ist um.' })).toBeVisible();
  await expect(page.locator('[data-bereich="zusammen"]')).toContainText('1 von 24');
});

test('Öffnen mit abgelaufener Zeit zeigt das Intro, ohne Auswertung', async ({ page, context }) => {
  await page.clock.install({ time: T0 });
  await startProbetest(page);
  await answer(page, await currentItem(page), true);
  await page.getByRole('button', { name: 'Weiter' }).click();
  // Stored before the app goes away: a reload continues.
  await expect.poll(() => storedIndex(page)).toBe(1);
  await page.reload();
  await expect(header(page)).toContainText('2 von 24');
  await page.close();

  await context.clock.setSystemTime(new Date(T0.getTime() + 50 * 60_000));
  const later = await context.newPage();
  await later.goto('/probetest/mathe-01');
  await expect(later.getByRole('button', { name: 'Starten' })).toBeVisible();
  await expect(later.getByText('Du hast diesen Probetest schon gemacht.')).toHaveCount(0);
  await expect(later.getByRole('button', { name: 'Auswertung ansehen' })).toHaveCount(0);
});

test('offline: Probetest starten, eine Aufgabe, Übersicht', async ({
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
  // The probetest-route chunk, the Probetest and its items come from the precache.
  await startProbetest(page);
  await answer(page, await currentItem(page), true);
  await page.getByRole('button', { name: 'Übersicht' }).click();
  await expect(page.getByRole('button', { name: 'Aufgabe 1, beantwortet' })).toBeVisible();
});

test('Deutsch mit Lesetexten: Lese-Screen einmal je Text, Uhr läuft, Zurück/Weiter, Abgeben, Durchsehen mit Kasten', async ({
  page,
}) => {
  const [sach, lit] = PROBETEST_TEXTS;
  const reading = page.getByRole('heading', { level: 1, name: 'Lies den Text.' });
  const box = page.locator('[data-region="text"]');
  const weiter = () => band(page).getByRole('button', { name: 'Weiter' }).click();
  const at = async (n: number) => {
    await expect(header(page)).toContainText(`${n} von 18`);
    await expect(reading).toHaveCount(0);
  };

  await page.clock.install({ time: T0 });
  await page.goto(`${DEV}/dev/probetest-lauf/deutsch-90`);
  await page.getByRole('button', { name: 'Starten' }).click();

  // The reading screen before item 1: the Probetest's Kopf, title, the text, no Vorlesen.
  await expect(reading).toBeVisible();
  await expect(header(page)).toContainText('1 von 18');
  await expect(header(page)).toContainText('45 Min.');
  await expect(page.getByRole('heading', { level: 2, name: sach!.title })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Vorlesen' })).toHaveCount(0);
  // The time runs on while the child reads.
  await page.clock.fastForward('05:00');
  await expect(header(page)).toContainText('40 Min.');
  await weiter();

  await at(1);
  await expect(box).toBeVisible();
  await expect(page.getByRole('button', { name: 'Vorlesen' })).toHaveCount(0);
  await answer(page, PROBETEST_ITEMS[0] as unknown as ContentItem, true);
  await weiter();
  await at(2);
  await band(page).getByRole('button', { name: 'Zurück' }).click();
  await at(1);
  for (let n = 2; n <= 6; n++) {
    await weiter();
    await at(n);
    await expect(box).toBeVisible();
  }

  // The second text: its reading screen before item 7, once.
  await weiter();
  await expect(reading).toBeVisible();
  await expect(header(page)).toContainText('7 von 18');
  await expect(page.getByRole('heading', { level: 2, name: lit!.title })).toBeVisible();
  await weiter();
  await at(7);
  await band(page).getByRole('button', { name: 'Zurück' }).click();
  await at(6);
  await weiter();
  await at(7);

  // A spelling item keeps its Vorlesen and has no text box.
  await page.getByRole('button', { name: 'Übersicht' }).click();
  await page.getByRole('button', { name: 'Aufgabe 11, offen' }).click();
  await at(11);
  await expect(box).toHaveCount(0);
  await expect(
    page.locator('[data-region="sheet"]').getByRole('button', { name: 'Vorlesen' }),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Übersicht' }).click();
  await page.getByRole('button', { name: 'Abgeben' }).click();
  await expect(page.getByRole('heading', { name: 'Noch 17 Aufgaben sind offen.' })).toBeVisible();
  await page.getByRole('button', { name: 'Abgeben' }).click();
  await expect(page.getByRole('heading', { name: 'Geschafft.' })).toBeVisible();
  await expect(page.locator('[data-bereich="zusammen"]')).toContainText('1 von 18');

  // Looking through: the box beside every text item, never a reading screen.
  await page.getByRole('button', { name: 'Durchsehen' }).click();
  await at(1);
  await expect(box).toBeVisible();
  for (let n = 2; n <= 7; n++) {
    await weiter();
    await at(n);
    await expect(box).toBeVisible();
  }
});
