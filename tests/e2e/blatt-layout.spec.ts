// The quiet sheets added in task 6b on four viewports (the two iPad sizes and the same iPad in
// Safari with its bars): Fortsetzen / Neu anfangen before practice, and the Eltern page with its
// sum, the delete button and the question back. No scrolling, large targets, the band on screen.
// Driven through the real app on the dev server; screenshots for review.

import { expect, test, type Page } from '@playwright/test';
import { SCREENSHOTS, answer, check, currentItem } from './helpers';

const VIEWPORTS = [
  { name: 'ipad-landscape', width: 1024, height: 768 },
  { name: 'ipad-portrait', width: 768, height: 1024 },
  { name: 'safari-landscape', width: 1024, height: 660 },
  { name: 'safari-portrait', width: 768, height: 900 },
];

async function expectFits(page: Page, label: string) {
  await page.evaluate(() => document.fonts.ready);
  const m = await page.evaluate(() => {
    const visible = (e: Element) => e.getBoundingClientRect().width > 0;
    const targets = [...document.querySelectorAll('main a, main button')].filter(visible);
    const band = document.querySelector('[data-region="band"]')!;
    const last = band.lastElementChild!.getBoundingClientRect();
    return {
      overflow: document.documentElement.scrollHeight - window.innerHeight,
      overflowX: document.documentElement.scrollWidth - window.innerWidth,
      smallestTarget: Math.min(
        ...targets.map((t) =>
          Math.min(t.getBoundingClientRect().width, t.getBoundingClientRect().height),
        ),
      ),
      bandBottom: window.innerHeight - band.getBoundingClientRect().bottom,
      lastButtonHeight: last.height,
    };
  });
  expect(m.overflow, `${label}: page scrolls`).toBeLessThanOrEqual(0);
  expect(m.overflowX, `${label}: page scrolls sideways`).toBeLessThanOrEqual(0);
  expect(m.smallestTarget, `${label}: target below 48 px`).toBeGreaterThanOrEqual(48);
  expect(m.bandBottom, `${label}: band leaves the screen`).toBeGreaterThanOrEqual(0);
  expect(m.lastButtonHeight, `${label}: button lower than 56 px`).toBeGreaterThanOrEqual(56);
}

for (const viewport of VIEWPORTS) {
  test(`Fortsetzen und Eltern passen auf ${viewport.name} (${viewport.width}×${viewport.height})`, async ({
    page,
  }) => {
    await page.setViewportSize(viewport);
    const shot = (name: string) =>
      page.screenshot({ path: `${SCREENSHOTS}/${name}-${viewport.name}.png` });

    // Three answers, Pause, back into the Gebiet: the choice.
    await page.goto('/');
    await page.getByRole('button', { name: 'Später' }).click();
    await page.getByRole('link', { name: 'Zahlen und Rechnen, Niveau 1' }).click();
    for (let n = 1; n <= 3; n++) {
      await expect(page.getByText(`${n} von 10`)).toBeVisible();
      const item = await currentItem(page);
      await answer(page, item, true);
      await check(page, item, true);
      await page.getByRole('button', { name: 'Weiter' }).click();
    }
    await page.getByRole('link', { name: 'Pause' }).click();
    await page.getByRole('link', { name: 'Zahlen und Rechnen, Niveau 1' }).click();
    await expect(page.getByRole('button', { name: 'Neu anfangen' })).toBeVisible();
    await expectFits(page, `wahl ${viewport.name}`);
    await shot('ueben-wahl');

    await page.goto('/eltern');
    const question = await page.getByRole('heading', { level: 1 }).textContent();
    const [, a, b] = question!.match(/(\d+) \+ (\d+)/)!;
    for (const digit of String(Number(a) + Number(b))) {
      await page.getByRole('button', { name: digit, exact: true }).click();
    }
    await expectFits(page, `eltern-frage ${viewport.name}`);
    await shot('eltern-frage');
    await page.getByRole('button', { name: 'Weiter' }).click();
    await expect(page.getByRole('button', { name: 'Alles löschen' })).toBeVisible();
    await expectFits(page, `eltern-loeschen ${viewport.name}`);
    await shot('eltern-loeschen');
    await page.getByRole('button', { name: 'Alles löschen' }).click();
    await expect(page.getByRole('button', { name: 'Ja, alles löschen' })).toBeVisible();
    await expectFits(page, `eltern-rueckfrage ${viewport.name}`);
    await shot('eltern-rueckfrage');
  });
}
