// The update of the installed app (task 11) with a real second build: version A is installed,
// the server switches to B, the app finds B when it comes back to the foreground. The quiet
// "Neue Version – Neu laden" shows on /eltern, "Neu laden" on the map (landscape here), nothing
// reloads during a round, and a tap on the map brings B. Chromium only: Playwright's WebKit has no service workers.

import { expect, test, type Page } from '@playwright/test';
import { execFileSync } from 'node:child_process';
import { cpSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { startBuildServer, type BuildServer } from './update-server';

const SECOND = 'zweiter-build';
const RELOAD = { name: 'Neue Version – Neu laden' };
const MAP_RELOAD = { name: 'Neu laden', exact: true };

let dir: string;
let server: BuildServer;

test.beforeAll(async () => {
  test.setTimeout(180_000);
  dir = mkdtempSync(path.join(tmpdir(), 'pfadfinder-update-'));
  // A: the build the preview server serves (webServer builds it fresh for every run).
  cpSync('dist', path.join(dir, 'a'), { recursive: true });
  // B: the same code with another build id, so sw.js and the Eltern chunk differ.
  execFileSync('npx', ['vite', 'build', '--outDir', path.join(dir, 'b'), '--emptyOutDir'], {
    env: { ...process.env, PFADFINDER_BUILD_ID: SECOND },
    stdio: 'ignore',
  });
  server = await startBuildServer(path.join(dir, 'a'), 4180);
});

test.afterAll(async () => {
  await server?.close();
  rmSync(dir, { recursive: true, force: true });
});

/** iOS fires this when the home-screen app comes back from the background. */
async function backToForeground(page: Page) {
  await page.evaluate(() => {
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      get: () => 'visible',
    });
    document.dispatchEvent(new Event('visibilitychange'));
  });
}

test('neue Version: leiser Hinweis auf /eltern und der Karte, Neuladen nur auf Tipp', async ({
  page,
}) => {
  await page.goto(`${server.url}/eltern`);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload(); // now controlled by version A
  const version = page.getByText(/^Version /);
  await expect(version).toBeVisible();
  const first = await version.textContent();
  expect(first).not.toContain(SECOND);
  await expect(page.getByRole('button', RELOAD)).toHaveCount(0);

  server.serve(path.join(dir, 'b'));
  await backToForeground(page);
  await expect(page.getByRole('button', RELOAD)).toBeVisible({ timeout: 20_000 });

  await page.getByRole('link', { name: 'Zur Karte' }).click();
  await expect(page.getByRole('button', MAP_RELOAD)).toBeVisible();

  // A round: no hint, and nothing reloads on its own, not even back in the foreground.
  await page.evaluate(() => Object.assign(window, { stillHere: true }));
  await page.getByRole('link', { name: /^Zahlen und Rechnen/ }).click();
  await expect(page.getByText('1 von 10')).toBeVisible();
  await expect(page.getByRole('button', MAP_RELOAD)).toHaveCount(0);
  await backToForeground(page);
  await page.waitForTimeout(1_000);
  expect(await page.evaluate(() => 'stillHere' in window)).toBe(true);
  await expect(page.getByText('1 von 10')).toBeVisible();

  await page.getByRole('link', { name: 'Pause' }).click();
  await Promise.all([page.waitForEvent('load'), page.getByRole('button', MAP_RELOAD).click()]);
  expect(await page.evaluate(() => 'stillHere' in window)).toBe(false);
  await page.goto(`${server.url}/eltern`);
  await expect(page.getByText(`Version ${SECOND}`)).toBeVisible();
  await expect(page.getByRole('button', MAP_RELOAD)).toHaveCount(0);
});
