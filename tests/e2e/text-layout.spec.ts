// Reading texts (task 9) on four viewports, against /dev/text with the fixture t-sach-900
// (250 words, one item per Lesen format). Only the text box scrolls, never the page:
//  - every item in every state fits (fitProblems) with the box beside or above it
//  - the box scrolls, shows the fade at the start and none at the end, never covers the sheet
//  - the reading screen and the Einstieg variant fit
// Budget: in portrait the box height, in landscape the column width are swept; the smallest
// space between answers and band per step goes to tests/e2e/screenshots/text-budget-*.json.
// Screenshots text-*.png are the wireframes' source. In CI only the two Safari sizes run.

import { expect, test, type Page } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { SCREENSHOTS, VIEWPORTS as ALL_VIEWPORTS, fitMetrics, fitProblems } from './helpers';

const VIEWPORTS = process.env.CI
  ? ALL_VIEWPORTS.filter((v) => v.name.startsWith('safari-'))
  : ALL_VIEWPORTS;
const TEXT = 't-sach-900';
const biberItems = JSON.parse(readFileSync('tests/fixtures/lesen/items.json', 'utf8')) as {
  id: string;
  format: string;
}[];
const STATES = ['antworten', 'richtig', 'noch-nicht'] as const;
const statesOf = (format: string): string[] =>
  format === 'short-answer' ? [...STATES, 'vergleichen'] : [...STATES];
/** Portrait: box heights in px; landscape: column widths in %. */
const HEIGHTS = Array.from({ length: 12 }, (_, i) => 200 + i * 20);
const WIDTHS = [34, 36, 38, 40, 42, 44, 46];

async function open(page: Page, query: string) {
  const band = page.locator('[data-region="band"] > button:last-of-type');
  const url = `/dev/text/${TEXT}?${query}`;
  await page.goto(url);
  try {
    await band.waitFor({ timeout: 20_000 });
  } catch {
    await page.goto(url);
    await band.waitFor();
  }
  await page.evaluate(() => document.fonts.ready);
}

/** Scrolls the text box to its end, after the font has set the text's real height. */
async function scrollToEnd(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((done) => {
        const scroller = document.querySelector('[data-region="text"] [role="region"]')!;
        scroller.scrollTop = scroller.scrollHeight;
        requestAnimationFrame(() => requestAnimationFrame(() => done()));
      }),
  );
}

/** Sets a layout token on the preview wrapper and waits for the next frame. */
async function setToken(page: Page, name: string, value: string) {
  await page.evaluate(
    ([n, v]) =>
      new Promise<void>((done) => {
        (document.querySelector('main')!.parentElement as HTMLElement).style.setProperty(n!, v!);
        requestAnimationFrame(() => requestAnimationFrame(() => done()));
      }),
    [name, value],
  );
}

interface BoxMetrics {
  scrolls: boolean;
  fade: boolean;
  overlap: number;
  sideways: number;
}

/** The text box: does it scroll, is the fade there, how far does it reach into the sheet. */
async function boxMetrics(page: Page): Promise<BoxMetrics> {
  return page.evaluate(() => {
    const box = document.querySelector('[data-region="text"]')!;
    const scroller = box.querySelector('[role="region"]')!;
    const sheet = document.querySelector('[data-region="sheet"]');
    const b = box.getBoundingClientRect();
    const s = sheet?.getBoundingClientRect();
    const portrait = window.innerHeight > window.innerWidth;
    return {
      scrolls: scroller.scrollHeight > scroller.clientHeight,
      fade: box.querySelector('[data-fade]') !== null,
      overlap: !s ? 0 : portrait ? b.bottom - s.top : b.right - s.left,
      sideways: document.documentElement.scrollWidth - window.innerWidth,
    };
  });
}

function boxProblems(m: BoxMetrics, start: boolean): string[] {
  return [
    !m.scrolls && 'text box does not scroll',
    start && !m.fade && 'no fade at the start of the text',
    !start && m.fade && 'fade at the end of the text',
    m.overlap > 0 && `text box covers the sheet by ${Math.round(m.overlap)} px`,
    m.sideways > 0 && `page scrolls sideways by ${Math.round(m.sideways)} px`,
  ].filter((p): p is string => typeof p === 'string');
}

for (const viewport of VIEWPORTS) {
  const portrait = viewport.height > viewport.width;

  test(`Lesetext passt auf ${viewport.name} (${viewport.width}×${viewport.height})`, async ({
    browser,
  }) => {
    test.setTimeout(300_000);
    const context = await browser.newContext({ viewport });
    let page = await context.newPage();
    const red: string[] = [];
    const shot = (name: string) =>
      page.screenshot({ path: `${SCREENSHOTS}/text-${name}-${viewport.name}.png` });

    // The reading screen, at the start and at the end of the text.
    await open(page, 'zustand=lesen');
    const lesen = await page.evaluate(() => ({
      overflow: document.documentElement.scrollHeight - window.innerHeight,
      button:
        window.innerHeight -
        document.querySelector('[data-region="band"] button')!.getBoundingClientRect().bottom,
    }));
    if (lesen.overflow > 0) red.push(`lesen: page scrolls by ${lesen.overflow} px`);
    if (lesen.button < 0) red.push('lesen: Weiter leaves the screen');
    for (const p of boxProblems(await boxMetrics(page), true)) red.push(`lesen: ${p}`);
    await shot('lesen');
    await scrollToEnd(page);
    for (const p of boxProblems(await boxMetrics(page), false)) red.push(`lesen ende: ${p}`);
    await shot('lesen-ende');

    // Every item and state at the token values; then the sweep for the budget.
    const token = portrait ? '--reading-box' : '--spacing-reading-column';
    const steps = portrait ? HEIGHTS.map((h) => `${h}px`) : WIDTHS.map((w) => `${w}%`);
    const sweep: Record<string, { slack: number; at: string }> = {};
    const byFormat: Record<string, Record<string, Record<string, number>>> = {};
    /** At the token values: the tightest screen and the size of the text box. */
    let current: { slack: number; at: string } | undefined;
    let box: { width: number; height: number } | undefined;
    for (const item of biberItems) {
      page = await context.newPage();
      for (const state of statesOf(item.format)) {
        await open(page, `item=${item.id}&zustand=${state}`);
        const label = `${item.format} ${state}`;
        for (const p of await fitProblems(page)) red.push(`${label}: ${p}`);
        for (const p of boxProblems(await boxMetrics(page), true)) red.push(`${label}: ${p}`);
        const at = Math.round((await fitMetrics(page))!.slack);
        if (!current || at < current.slack) current = { slack: at, at: label };
        box ??= await page.evaluate(() => {
          const r = document.querySelector('[data-region="text"]')!.getBoundingClientRect();
          return { width: Math.round(r.width), height: Math.round(r.height) };
        });
        if (state === 'antworten') await shot(item.format);
        if (item.format === 'multi-choice' && state === 'noch-nicht') await shot('rueckmeldung');
        for (const step of steps) {
          await setToken(page, token, step);
          const slack = Math.round((await fitMetrics(page))!.slack);
          (byFormat[item.format] ??= {})[state] ??= {};
          byFormat[item.format]![state]![step] = slack;
          if (!sweep[step] || slack < sweep[step].slack) sweep[step] = { slack, at: label };
        }
      }
      await page.close();
    }

    // The fade is gone at the end, also beside an item; the Einstieg variant fits.
    page = await context.newPage();
    await open(page, 'item=d-lsa-1-950&zustand=antworten');
    await scrollToEnd(page);
    for (const p of boxProblems(await boxMetrics(page), false)) red.push(`ende: ${p}`);
    await shot('ende');
    await open(page, 'item=d-lsa-2-951&zustand=antworten&einstieg');
    for (const p of await fitProblems(page)) red.push(`einstieg: ${p}`);
    await shot('einstieg');
    await page.close();

    writeFileSync(
      `${SCREENSHOTS}/text-budget-${viewport.name}.json`,
      `${JSON.stringify({ viewport, current, box, token, sweep, byFormat }, null, 2)}\n`,
    );
    await context.close();
    expect(red, `reading text layout in ${viewport.name}`).toEqual([]);
  });
}
