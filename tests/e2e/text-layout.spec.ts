// Reading texts (task 9) on four viewports, against /dev/text with the fixture t-sach-900
// (250 words, one item per Lesen format). Only the text box scrolls, never the page:
//  - every item in every state fits (fitProblems) with at least 18 px air above the band
//  - portrait: the box height comes from the format's reserve token; landscape: the column is
//    34 % below 768 px height and 42 % from there (both measured)
//  - the box scrolls; the fade is below at the start, above at the end, both in between; the box
//    never covers the sheet
//  - the reading screen (instruction, title) and the Einstieg variant fit
// Budget: in portrait the box height, in landscape the column width are swept; the smallest air
// per step and, per format, the reserve that leaves 18 px go to text-budget-*.json.
// Screenshots text-*.png. In CI only the two Safari sizes run.
// The texts of content/ get the same checks at the token values: the reading screen of every
// text (a short text may fit without scrolling, then without a fade) and every item of it in
// every state (match also with matchProblems); the air per item and state goes to
// text-inhalt-*.json, a screenshot only to the screens with a finding.
// Every screen (reading screen and every item state) also gets the generic checks of
// screen-checks.ts: no visible text runs out of its element, no two tap targets or text blocks
// overlap (iPad findings 2026-10-19).

import { expect, test, type Page } from '@playwright/test';
import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import {
  ITEMS,
  SCREENSHOTS,
  VIEWPORTS as ALL_VIEWPORTS,
  fitMetrics,
  fitProblems,
  matchProblems,
} from './helpers';
import { overflowProblems, overlapProblems } from './screen-checks';

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
/** Air between answers and band that every reading item keeps (Freigabe Teil B). */
const AIR = 18;
/** Landscape column below and from 768 px screen height (tokens.css). */
const COLUMN = { short: 0.34, tall: 0.42 };
/** Reading texts of content/ with their items. */
const contentTexts = readdirSync('content/texts', { recursive: true })
  .map(String)
  .filter((file) => file.endsWith('.json'))
  .map((file) => JSON.parse(readFileSync(`content/texts/${file}`, 'utf8')) as { id: string })
  .map((text) => ({ ...text, items: ITEMS.filter((i) => i.stimulus?.textRef === text.id) }));

/** The generic checks of every screen. */
async function screenProblems(page: Page): Promise<string[]> {
  return [...(await overflowProblems(page)), ...(await overlapProblems(page))];
}

async function open(page: Page, query: string, text = TEXT) {
  const band = page.locator('[data-region="band"] > button:last-of-type');
  const url = `/dev/text/${text}?${query}`;
  await page.goto(url);
  try {
    await band.waitFor({ timeout: 20_000 });
  } catch {
    await page.goto(url);
    await band.waitFor();
  }
  // Match and order are lazy chunks: until they arrive, the answer area holds the Suspense
  // fallback (aria-busy), and every measurement would see its 48 px instead of the task. The
  // answer area comes with the band; the reading screen has none.
  await expect(page.locator('[data-region="answer"] [aria-busy="true"]')).toHaveCount(0);
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

/** Scrolls the text box to the middle of the text. */
async function scrollToMiddle(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((done) => {
        const scroller = document.querySelector('[data-region="text"] [role="region"]')!;
        scroller.scrollTop = (scroller.scrollHeight - scroller.clientHeight) / 2;
        requestAnimationFrame(() => requestAnimationFrame(() => done()));
      }),
  );
}

/** Text box size and, in landscape, its share of the grid width. */
async function boxSize(page: Page) {
  return page.evaluate(() => {
    const main = document.querySelector('main')!;
    const r = document.querySelector('[data-region="text"]')!.getBoundingClientRect();
    const style = getComputedStyle(main);
    const content =
      main.clientWidth - parseFloat(style.paddingLeft) - parseFloat(style.paddingRight);
    return { width: Math.round(r.width), height: Math.round(r.height), share: r.width / content };
  });
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
  below: boolean;
  above: boolean;
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
    // How far the two boxes reach into each other (0 when they do not touch).
    const into = (a0: number, a1: number, b0: number, b1: number) =>
      Math.max(0, Math.min(a1, b1) - Math.max(a0, b0));
    return {
      scrolls: scroller.scrollHeight > scroller.clientHeight,
      below: box.querySelector('[data-fade="below"]') !== null,
      above: box.querySelector('[data-fade="above"]') !== null,
      overlap: !s
        ? 0
        : Math.min(into(b.left, b.right, s.left, s.right), into(b.top, b.bottom, s.top, s.bottom)),
      sideways: document.documentElement.scrollWidth - window.innerWidth,
    };
  });
}

type Where = 'start' | 'middle' | 'end';

/** A real text may fit its box: then it needs no fade, otherwise the fades of boxProblems. */
function contentBoxProblems(m: BoxMetrics, where: Where): string[] {
  if (m.scrolls) return boxProblems(m, where);
  return boxProblems({ ...m, scrolls: true, below: false, above: false }, 'end').concat(
    m.below || m.above ? ['fade on a box that does not scroll'] : [],
  );
}

function boxProblems(m: BoxMetrics, where: Where): string[] {
  return [
    !m.scrolls && 'text box does not scroll',
    where !== 'end' && !m.below && `no fade below (${where})`,
    where === 'end' && m.below && 'fade below at the end of the text',
    where !== 'start' && !m.above && `no fade above (${where})`,
    where === 'start' && m.above && 'fade above at the start of the text',
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
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lies den Text.');
    await expect(page.getByRole('heading', { level: 2 })).toHaveText('Baumeister am Bach');
    for (const p of boxProblems(await boxMetrics(page), 'start')) red.push(`lesen: ${p}`);
    for (const p of await screenProblems(page)) red.push(`lesen: ${p}`);
    await shot('lesen');
    await scrollToEnd(page);
    for (const p of boxProblems(await boxMetrics(page), 'end')) red.push(`lesen ende: ${p}`);
    await shot('lesen-ende');

    // Every item and state at the token values; then the sweep for the budget.
    const token = portrait ? '--reading-box' : '--reading-column';
    const steps = portrait ? HEIGHTS.map((h) => `${h}px`) : WIDTHS.map((w) => `${w}%`);
    const sweep: Record<string, { slack: number; at: string }> = {};
    const byFormat: Record<string, Record<string, Record<string, number>>> = {};
    /** At the token values: the tightest screen overall and per format. */
    let current: { slack: number; at: string } | undefined;
    const formats: Record<
      string,
      { box: { width: number; height: number }; slack: number; at: string; reserve?: number }
    > = {};
    for (const item of biberItems) {
      page = await context.newPage();
      for (const state of statesOf(item.format)) {
        await open(page, `item=${item.id}&zustand=${state}`);
        const label = `${item.format} ${state}`;
        for (const p of await fitProblems(page)) red.push(`${label}: ${p}`);
        for (const p of boxProblems(await boxMetrics(page), 'start')) red.push(`${label}: ${p}`);
        for (const p of await screenProblems(page)) red.push(`${label}: ${p}`);
        const at = Math.round((await fitMetrics(page))!.slack);
        if (at < AIR) red.push(`${label}: only ${at} px air (${AIR} px wanted)`);
        if (!current || at < current.slack) current = { slack: at, at: label };
        const { width, height, share } = await boxSize(page);
        const known = formats[item.format];
        if (known && known.box.height !== height) red.push(`${label}: box height changes`);
        if (!known || at < known.slack) {
          // Portrait: every px of box costs one px of air, so this is the reserve leaving AIR.
          const reserve = portrait ? viewport.height - (height + at - AIR) : undefined;
          formats[item.format] = { box: { width, height }, slack: at, at: state, reserve };
        }
        if (!portrait) {
          const want = viewport.height >= 768 ? COLUMN.tall : COLUMN.short;
          if (Math.abs(share - want) > 0.005)
            red.push(`${label}: column ${(share * 100).toFixed(1)} %, want ${want * 100} %`);
        }
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

    // Beside an item: fades in the middle and at the end; the Einstieg variant fits.
    page = await context.newPage();
    await open(page, 'item=d-lsa-1-950&zustand=antworten');
    await scrollToMiddle(page);
    for (const p of boxProblems(await boxMetrics(page), 'middle')) red.push(`mitte: ${p}`);
    await shot('mitte');
    await scrollToEnd(page);
    for (const p of boxProblems(await boxMetrics(page), 'end')) red.push(`ende: ${p}`);
    await shot('ende');
    await open(page, 'item=d-lsa-2-951&zustand=antworten&einstieg');
    for (const p of [...(await fitProblems(page)), ...(await screenProblems(page))])
      red.push(`einstieg: ${p}`);
    await shot('einstieg');
    await page.close();

    writeFileSync(
      `${SCREENSHOTS}/text-budget-${viewport.name}.json`,
      `${JSON.stringify({ viewport, current, formats, token, sweep, byFormat }, null, 2)}\n`,
    );
    await context.close();
    expect(red, `reading text layout in ${viewport.name}`).toEqual([]);
  });
}

for (const viewport of VIEWPORTS) {
  test(`echte Lesetexte passen auf ${viewport.name} (${viewport.width}×${viewport.height})`, async ({
    browser,
  }) => {
    const states = contentTexts.reduce(
      (n, t) => n + t.items.reduce((m, i) => m + statesOf(i.format).length, 1),
      0,
    );
    test.setTimeout(Math.max(120_000, states * 4_000));
    const context = await browser.newContext({ viewport });
    const red: string[] = [];
    /** Air above the band per item and state; the reading screen's page overflow per text. */
    const air: Record<string, Record<string, number>> = {};
    const lesen: Record<string, { scrolls: boolean; overflow: number }> = {};
    for (const text of contentTexts) {
      const page = await context.newPage();
      await open(page, 'zustand=lesen', text.id);
      const overflow = await page.evaluate(
        () => document.documentElement.scrollHeight - window.innerHeight,
      );
      const button = await page.evaluate(
        () =>
          window.innerHeight -
          document.querySelector('[data-region="band"] button')!.getBoundingClientRect().bottom,
      );
      if (overflow > 0) red.push(`${text.id} lesen: page scrolls by ${overflow} px`);
      if (button < 0) red.push(`${text.id} lesen: Weiter leaves the screen`);
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lies den Text.');
      const start = await boxMetrics(page);
      lesen[text.id] = { scrolls: start.scrolls, overflow };
      for (const p of [...contentBoxProblems(start, 'start'), ...(await screenProblems(page))])
        red.push(`${text.id} lesen: ${p}`);
      await page.screenshot({ path: `${SCREENSHOTS}/text-${text.id}-lesen-${viewport.name}.png` });
      await scrollToEnd(page);
      for (const p of contentBoxProblems(await boxMetrics(page), 'end'))
        red.push(`${text.id} lesen ende: ${p}`);

      for (const item of text.items) {
        for (const state of statesOf(item.format)) {
          await open(page, `item=${item.id}&zustand=${state}`, text.id);
          const label = `${item.id} ${item.format} ${state}`;
          const problems = [
            ...(await fitProblems(page)),
            ...contentBoxProblems(await boxMetrics(page), 'start'),
            ...(item.format === 'match' ? await matchProblems(page) : []),
            ...(await screenProblems(page)),
          ];
          const at = Math.round((await fitMetrics(page))?.slack ?? -Infinity);
          (air[item.id] ??= {})[state] = at;
          if (at < AIR) problems.push(`only ${at} px air (${AIR} px wanted)`);
          for (const p of problems) red.push(`${label}: ${p}`);
          // Only the screens with a finding: one picture per item would be 30 per text.
          if (problems.length > 0)
            await page.screenshot({
              path: `${SCREENSHOTS}/text-${item.id}-${state}-${viewport.name}.png`,
            });
        }
      }
      await page.close();
    }
    writeFileSync(
      `${SCREENSHOTS}/text-inhalt-${viewport.name}.json`,
      `${JSON.stringify({ viewport, lesen, air }, null, 2)}\n`,
    );
    await context.close();
    expect(red, `content reading texts in ${viewport.name}`).toEqual([]);
  });
}
