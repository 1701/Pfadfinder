// The quiet sheets added in task 6b on four viewports (the two iPad sizes and the same iPad in
// Safari with its bars): Fortsetzen / Neu anfangen before practice, and the device area
// (/eltern/geraet) with its sum, the delete button and the question back. No scrolling, large
// targets, the band on screen. Then Impressum and Datenschutz: only the text scrolls. On the
// device area (not while asking back) and the legal pages the top line of the pages for adults
// (ErwachsenenKopf, task N) stays in one row; its numbers go to blatt-kopf-budget-<viewport>.json
// in SCREENSHOTS (output-dir.ts). Driven through the real app on the dev server; screenshots for
// review.

import { writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import { SCREENSHOTS, answer, check, currentItem } from './helpers';
import { KOPF, kopfBudget, kopfMetrics, kopfProblems, overlapProblems } from './screen-checks';

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
    const budget: Record<string, unknown> = {};
    const kopf = async (label: string) => {
      const m = await kopfMetrics(page);
      console.log(`kopf ${label} ${viewport.name}: ${JSON.stringify(m)}`);
      expect([...kopfProblems(m), ...(await overlapProblems(page, KOPF))], label).toEqual([]);
      budget[label] = kopfBudget(m);
      return m;
    };

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

    await page.goto('/eltern/geraet');
    const question = await page.getByRole('heading', { level: 1 }).textContent();
    const [, a, b] = question!.match(/(\d+) \+ (\d+)/)!;
    for (const digit of String(Number(a) + Number(b))) {
      await page.getByRole('button', { name: digit, exact: true }).click();
    }
    await expectFits(page, `geraet-frage ${viewport.name}`);
    await kopf('geraet-frage');
    await shot('geraet-frage');
    await page.getByRole('button', { name: 'Weiter' }).click();
    await expect(page.getByRole('button', { name: 'Alles löschen' })).toBeVisible();
    await expectFits(page, `geraet-loeschen ${viewport.name}`);
    await kopf('geraet-loeschen');
    await shot('geraet-loeschen');
    await page.getByRole('button', { name: 'Alles löschen' }).click();
    await expect(page.getByRole('button', { name: 'Ja, alles löschen' })).toBeVisible();
    await expectFits(page, `geraet-rueckfrage ${viewport.name}`);
    await expect(page.locator('[data-region="kopf"]')).toHaveCount(0);
    await shot('geraet-rueckfrage');

    // Impressum and Datenschutz: only the text scrolls (text for adults), never the page, the Kopf
    // stays. The end gets its own picture only where the text scrolls.
    for (const legal of ['impressum', 'datenschutz']) {
      await page.goto(`/${legal}`);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await page.evaluate(() => document.fonts.ready);
      const scroll = () =>
        page.evaluate(() => {
          const box = document.querySelector('[data-region="kopf"]')!.nextElementSibling!;
          return {
            overflow: document.documentElement.scrollHeight - window.innerHeight,
            overflowX: document.documentElement.scrollWidth - window.innerWidth,
            textScrolls: box.scrollHeight > box.clientHeight,
          };
        });
      const label = `${legal} ${viewport.name}`;
      const top = await scroll();
      expect(top.overflow, `${label}: page scrolls`).toBeLessThanOrEqual(0);
      expect(top.overflowX, `${label}: page scrolls sideways`).toBeLessThanOrEqual(0);
      const before = await kopf(legal);
      budget[legal] = { ...(budget[legal] as object), textScrolls: top.textScrolls };
      await shot(legal);
      if (!top.textScrolls) continue;
      await page.locator('main article > :last-child').scrollIntoViewIfNeeded();
      const end = await scroll();
      expect(end.overflow, `${label}: page scrolls at the end`).toBeLessThanOrEqual(0);
      expect(end.overflowX, `${label}: page scrolls sideways at the end`).toBeLessThanOrEqual(0);
      const after = await kopfMetrics(page);
      expect(
        [...kopfProblems(after, before), ...(await overlapProblems(page, KOPF))],
        label,
      ).toEqual([]);
      await shot(`${legal}-ende`);
    }

    writeFileSync(
      `${SCREENSHOTS}/blatt-kopf-budget-${viewport.name}.json`,
      `${JSON.stringify(budget, null, 2)}\n`,
    );
  });
}
