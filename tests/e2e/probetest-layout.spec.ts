// Layout of the Probetest screens on /dev/probetest (the route's components with fixed data),
// in all four viewports; in CI only the tightest ones (Safari), like layout.spec:
//   header       "Übersicht | 7 von 24 | 45 Min." and with "Noch 5 Minuten": one line, apart
//   screens      intro, overview, questions, result: no scroll, targets ≥ 48 px, band visible
//   items        every item of every Mathe Probetest in content/probetests (task 16: mathe-01,
//                mathe-02) while answering and while looking through (wrong answer, no answer),
//                the short answer while comparing: fitProblems, the least room kept per test
//   texts        the fixture deutsch-90 (task 13): items beside t-sach-900 (single-choice, order,
//                match, short-answer) while answering and looking through (short answer also
//                comparing), ≥ 18 px air, nothing overflows or overlaps; the reading screen with
//                the Probetest's Kopf before each text
//   deutsch      every item of every Deutsch Probetest (deutsch-01, deutsch-02) answering, looking
//                through, missing (short answers also comparing); beside a text the same rules as
//                the fixture, air per item in the budget
//   map          the line "Probetest Mathe" (and "Probetest Deutsch") in the legend line: ≥ 48 px,
//                one row, map names still ≥ 18 px
//   print        /probetest/mathe-01/print as A4 PDF and as a print-media screenshot (Chromium)
// Numbers go to probetest-budget-<viewport>.json in SCREENSHOTS (output-dir.ts), screenshots beside them.

import { readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';
import {
  ITEMS,
  SCREENSHOTS,
  VIEWPORTS,
  fitMetrics,
  fitProblems,
  matchProblems,
  promptLines,
} from './helpers';
import { overflowProblems, overlapProblems } from './screen-checks';

/** Every Probetest in content (task 16: a new file is measured without touching this spec). */
const PROBETESTS = readdirSync('content/probetests')
  .filter((f) => /^(mathe|deutsch)-\d{2}\.json$/.test(f))
  .sort()
  .map(
    (f) =>
      JSON.parse(readFileSync(`content/probetests/${f}`, 'utf8')) as {
        id: string;
        fach: 'mathe' | 'deutsch';
        itemIds: string[];
      },
  );
const MATHE = PROBETESTS.filter((p) => p.fach === 'mathe');
const DEUTSCH = PROBETESTS.filter((p) => p.fach === 'deutsch');
/** The default of /dev/probetest and the print sheet. */
const PROBETEST = MATHE.find((p) => p.id === 'mathe-01')!;
const SHORT_ANSWER = 'm-gm-3-002';
const LONGEST = 'm-rf-3-004';
const SCREENS = [
  'intro',
  'intro-fertig',
  'uebersicht',
  'uebersicht-fertig',
  'abgeben',
  'verlassen',
  'auswertung',
  'auswertung-offen',
  'durchsehen-uebersicht',
] as const;

/** The fixture with reading texts and its items beside t-sach-900, one per measured format. */
const FIXTURE = 'deutsch-90';
const TEXT_ITEMS = [
  { id: 'd-lsa-1-950', format: 'single-choice' },
  { id: 'd-lsa-2-950', format: 'order' },
  { id: 'd-lsa-2-952', format: 'match' },
  { id: 'd-lsa-3-950', format: 'short-answer' },
] as const;
/** The first item of each fixture text: the reading screen comes before it. */
const READING = [
  { item: 'd-lsa-1-950', title: 'Baumeister am Bach', current: 1 },
  { item: 'd-lli-1-900', title: 'Der Igel im Winter', current: 7 },
] as const;
/** Air above the band beside a reading text, as in text-layout.spec. */
const AIR = 18;
/**
 * Exception (decision Markus, task 13): looking through beside a text in Safari landscape stacks
 * Falle, Zurück and Weiter; there only no overflow and no overlap, air ≥ 0 (measured: order 1,
 * match 15, short-answer 19 px). Every other state and viewport keeps 18 px.
 */
function airWanted(state: string, viewport: string): number {
  return state === 'durchsehen' && viewport === 'safari-landscape' ? 0 : AIR;
}

const MEASURED = process.env.CI ? VIEWPORTS.filter((v) => v.name.startsWith('safari')) : VIEWPORTS;

async function open(page: Page, query: string) {
  await page.goto(`/dev/probetest?${query}`);
  await page.locator('[data-region="band"] button, [data-region="band"] a').last().waitFor();
  // The lazy renderers show a Suspense fallback (aria-busy) first, as in layout.spec.
  await expect(page.locator('[data-region="answer"] [aria-busy="true"]')).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
}

/** Problems of a whole screen: scrolling, small targets, the band's last action cut off. */
async function screenProblems(page: Page): Promise<string[]> {
  const m = await page.evaluate(() => {
    const band = document.querySelector('[data-region="band"]');
    const last = band?.querySelector(':scope > :is(button, a):last-of-type');
    const targets = [...document.querySelectorAll('main button, main a')].map((e) => {
      const r = e.getBoundingClientRect();
      return Math.min(r.width, r.height);
    });
    return {
      overflow: document.documentElement.scrollHeight - window.innerHeight,
      overflowX: document.documentElement.scrollWidth - window.innerWidth,
      smallest: Math.min(...targets),
      bandBottom: last ? window.innerHeight - last.getBoundingClientRect().bottom : -1,
    };
  });
  return [
    m.overflow > 0 && `page scrolls by ${Math.round(m.overflow)} px`,
    m.overflowX > 0 && `page scrolls sideways by ${Math.round(m.overflowX)} px`,
    m.smallest < 48 && `a target is only ${Math.round(m.smallest)} px`,
    m.bandBottom < 0 && 'the last band action leaves the screen',
  ].filter((p): p is string => typeof p === 'string');
}

async function headerMetrics(page: Page) {
  return page.evaluate(() => {
    const header = document.querySelector('[data-kopf]')!;
    const boxes = [...header.children].map((c) => c.getBoundingClientRect());
    const mids = boxes.map((b) => b.top + b.height / 2);
    return {
      height: Math.round(header.getBoundingClientRect().height),
      middles: Math.round(Math.max(...mids) - Math.min(...mids)),
      minGap: Math.round(Math.min(...boxes.slice(1).map((b, i) => b.left - boxes[i]!.right))),
    };
  });
}

for (const viewport of MEASURED) {
  test(`probetest screens – ${viewport.name}`, async ({ browser }) => {
    // Two Probetests per Fach and the fixture: about 320 screens per viewport.
    test.setTimeout(1_200_000);
    const context = await browser.newContext({ viewport });
    const report: Record<string, unknown> = { viewport };
    const red: string[] = [];
    let page = await context.newPage();

    // Header with the time, normal and in the last five minutes.
    const header: Record<string, unknown> = {};
    for (const zeit of ['45', '5']) {
      await open(page, `zustand=aufgabe&item=${LONGEST}&zeit=${zeit}`);
      const m = await headerMetrics(page);
      header[zeit] = m;
      if (m.middles > 12 || m.minGap <= 0) red.push(`header ${zeit}: ${JSON.stringify(m)}`);
      await page.screenshot({
        path: `${SCREENSHOTS}/probetest-aufgabe-zeit${zeit}-${viewport.name}.png`,
      });
    }
    report.header = header;

    // Whole screens.
    for (const zustand of SCREENS) {
      await open(page, `zustand=${zustand}`);
      for (const p of await screenProblems(page)) red.push(`${zustand}: ${p}`);
      await page.screenshot({ path: `${SCREENSHOTS}/probetest-${zustand}-${viewport.name}.png` });
    }
    await open(page, 'zustand=auswertung&zeit-um');
    await page.screenshot({
      path: `${SCREENSHOTS}/probetest-auswertung-zeit-um-${viewport.name}.png`,
    });
    await page.close();

    // Every Mathe item: answering, looking through with a wrong answer and without one.
    // slack: the tightest over all tests (for the screenshots); mathe: per test and item.
    const slack: Record<string, { probetest: string; id: string; slack: number }> = {};
    const keep = (state: string, id: string, value: number, probetest = PROBETEST.id) => {
      if (!slack[state] || value < slack[state].slack)
        slack[state] = { probetest, id, slack: Math.round(value) };
    };
    const mathe: Record<string, { slack: Record<string, { id: string; slack: number }> }> = {};
    for (const test of MATHE) {
      const least: Record<string, { id: string; slack: number }> = {};
      for (const id of test.itemIds) {
        page = await context.newPage();
        for (const state of ['aufgabe', 'durchsehen', 'fehlt'] as const) {
          await open(page, `probetest=${test.id}&zustand=${state}&item=${id}`);
          for (const p of await fitProblems(page)) red.push(`${test.id} ${state} ${id}: ${p}`);
          const at = Math.round((await fitMetrics(page))!.slack);
          keep(state, id, at, test.id);
          if (!least[state] || at < least[state].slack) least[state] = { id, slack: at };
        }
        await page.close();
      }
      mathe[test.id] = { slack: least };
    }
    report.mathe = mathe;
    // Every Deutsch Probetest (task 13, 16): every item; beside a text no overflow, no overlap,
    // 18 px air (the Safari landscape review exception as for the fixture). Air per item and state.
    const deutschReport: Record<string, unknown> = {};
    for (const test of DEUTSCH) {
      const deutsch: Record<string, Record<string, number>> = {};
      const deutschMin: Record<string, { id: string; slack: number }> = {};
      // Lines of the prompt beside a text (task 16 follow-up: the air follows lines, not characters).
      const promptRows: Record<string, Record<string, number>> = {};
      for (const id of test.itemIds) {
        const item = ITEMS.find((i) => i.id === id)!;
        const withText = item.stimulus?.textRef !== undefined;
        const states = ['aufgabe', 'durchsehen', 'fehlt'];
        if (item.format === 'short-answer') states.push('vergleichen');
        page = await context.newPage();
        for (const state of states) {
          await open(page, `probetest=${test.id}&zustand=${state}&item=${id}`);
          const label = `${test.id} ${state} ${id}`;
          for (const p of await fitProblems(page)) red.push(`${label}: ${p}`);
          const at = Math.round((await fitMetrics(page))!.slack);
          if (withText) {
            for (const p of await overflowProblems(page)) red.push(`${label}: ${p}`);
            for (const p of await overlapProblems(page)) red.push(`${label}: ${p}`);
            if (item.format === 'match')
              for (const p of await matchProblems(page)) red.push(`${label}: ${p}`);
            const wanted = airWanted(state, viewport.name);
            if (at < wanted) red.push(`${label}: only ${at} px air (${wanted} px wanted)`);
          }
          (deutsch[id] ??= {})[state] = at;
          if (withText) (promptRows[id] ??= {})[state] = await promptLines(page, item.prompt);
          if (!deutschMin[state] || at < deutschMin[state].slack)
            deutschMin[state] = { id, slack: at };
        }
        await page.close();
      }
      deutschReport[test.id] = { slack: deutschMin, items: deutsch, promptLines: promptRows };
    }
    report.deutsch = deutschReport;

    page = await context.newPage();
    // "1 Antwort vergleichen": the short answer, "1 von 1", without "Zurück".
    await open(page, 'zustand=nur-wartende');
    for (const p of await fitProblems(page)) red.push(`nur-wartende: ${p}`);
    keep('nur-wartende', SHORT_ANSWER, (await fitMetrics(page))!.slack);
    await page.screenshot({ path: `${SCREENSHOTS}/probetest-nur-wartende-${viewport.name}.png` });
    await open(page, `zustand=vergleichen&item=${SHORT_ANSWER}`);
    for (const p of await fitProblems(page)) red.push(`vergleichen: ${p}`);
    keep('vergleichen', SHORT_ANSWER, (await fitMetrics(page))!.slack);
    await page.screenshot({ path: `${SCREENSHOTS}/probetest-vergleichen-${viewport.name}.png` });
    report.slack = slack;

    // Items beside a reading text (fixture deutsch-90) and the reading screen with the Kopf.
    const text: Record<string, Record<string, number>> = {};
    const tightest: Record<string, { query: string; slack: number }> = {};
    for (const { id, format } of TEXT_ITEMS) {
      const states =
        format === 'short-answer'
          ? ['aufgabe', 'durchsehen', 'vergleichen']
          : ['aufgabe', 'durchsehen'];
      for (const state of states) {
        const query = `probetest=${FIXTURE}&zustand=${state}&item=${id}`;
        await open(page, query);
        const label = `text ${state} ${format}`;
        for (const p of await fitProblems(page)) red.push(`${label}: ${p}`);
        for (const p of await overflowProblems(page)) red.push(`${label}: ${p}`);
        for (const p of await overlapProblems(page)) red.push(`${label}: ${p}`);
        if (format === 'match')
          for (const p of await matchProblems(page)) red.push(`${label}: ${p}`);
        if ((await page.locator('[data-region="text"]').count()) !== 1)
          red.push(`${label}: no text box`);
        const at = Math.round((await fitMetrics(page))!.slack);
        const wanted = airWanted(state, viewport.name);
        if (at < wanted) red.push(`${label}: only ${at} px air (${wanted} px wanted)`);
        (text[state] ??= {})[format] = at;
        if (!tightest[state] || at < tightest[state].slack) tightest[state] = { query, slack: at };
      }
    }
    for (const { item, title, current } of READING) {
      await open(page, `probetest=${FIXTURE}&zustand=lesen&item=${item}`);
      const label = `lesen ${item}`;
      for (const p of await screenProblems(page)) red.push(`${label}: ${p}`);
      for (const p of await overflowProblems(page)) red.push(`${label}: ${p}`);
      for (const p of await overlapProblems(page)) red.push(`${label}: ${p}`);
      const m = await headerMetrics(page);
      if (m.middles > 12 || m.minGap <= 0) red.push(`${label} header: ${JSON.stringify(m)}`);
      if ((await page.getByRole('heading', { level: 1 }).textContent()) !== 'Lies den Text.')
        red.push(`${label}: no instruction`);
      if ((await page.getByRole('heading', { level: 2 }).textContent()) !== title)
        red.push(`${label}: title missing`);
      if (!(await page.locator('[data-kopf]').textContent())?.includes(`${current} von 18`))
        red.push(`${label}: Kopf without "${current} von 18"`);
      if ((await page.getByRole('button', { name: 'Vorlesen' }).count()) > 0)
        red.push(`${label}: Vorlesen in the Probetest`);
      const room = await page.evaluate(() => {
        const box = document.querySelector('[data-region="text"]')!.getBoundingClientRect();
        const band = document.querySelector('[data-region="band"]')!.getBoundingClientRect();
        return Math.round(band.top - box.bottom);
      });
      if (room < 0) red.push(`${label}: text box runs ${-room} px under the band`);
      (text.lesen ??= {})[item] = room;
      if (item === READING[0].item) {
        await page.screenshot({ path: `${SCREENSHOTS}/probetest-lesen-${viewport.name}.png` });
      }
    }
    report.text = text;
    for (const [state, { query }] of Object.entries(tightest)) {
      if (state === 'vergleichen') continue;
      await open(page, query);
      await page.screenshot({
        path: `${SCREENSHOTS}/probetest-text-${state}-knappstes-${viewport.name}.png`,
      });
    }
    for (const [state, { probetest, id }] of Object.entries(slack).filter(
      ([s]) => s !== 'vergleichen' && s !== 'nur-wartende',
    )) {
      await open(page, `probetest=${probetest}&zustand=${state}&item=${id}`);
      await page.screenshot({
        path: `${SCREENSHOTS}/probetest-${state}-knappstes-${viewport.name}.png`,
      });
    }

    // The map with the line "Probetest Mathe".
    await page.goto('/');
    await page.locator('svg[aria-label="Karte"]:visible').waitFor();
    await page.evaluate(() => document.fonts.ready);
    const line = page.getByRole('link', { name: 'Probetest Mathe' });
    const box = (await line.boundingBox())!;
    const map = await page.evaluate(() => {
      const svg = [...document.querySelectorAll('svg[aria-label="Karte"]')].find(
        (s) => s.getBoundingClientRect().width > 0,
      ) as SVGSVGElement;
      const scale = svg.getScreenCTM()?.a ?? 1;
      const sizes = [...svg.querySelectorAll('text')].map(
        (t) => Number(getComputedStyle(t).fontSize.replace('px', '')) * scale,
      );
      return {
        smallestName: Math.min(...sizes),
        overflow: document.documentElement.scrollHeight - window.innerHeight,
      };
    });
    // The second entry and whether the line stays one row (measured, task 13).
    const deutschBox = await page.getByRole('link', { name: 'Probetest Deutsch' }).boundingBox();
    const rows = await page.evaluate(
      () =>
        new Set(
          [...document.querySelectorAll('main > div:last-child :is(a, button)')]
            .map((e) => e.getBoundingClientRect())
            .filter((r) => r.width > 0)
            .map((r) => Math.round(r.bottom)),
        ).size,
    );
    report.map = {
      ...map,
      line: { height: box.height, bottom: box.y + box.height },
      deutsch: deutschBox && {
        height: deutschBox.height,
        bottom: deutschBox.y + deutschBox.height,
      },
      rows,
    };
    if (!deutschBox) red.push('map line without "Probetest Deutsch"');
    else if (deutschBox.height < 48) red.push(`map line Deutsch only ${deutschBox.height} px high`);
    if (rows !== 1) red.push(`map line has ${rows} rows`);
    if (box.height < 48) red.push(`map line only ${box.height} px high`);
    if (box.y + box.height > viewport.height) red.push('map line leaves the screen');
    if (map.smallestName < 18) red.push(`map name ${map.smallestName.toFixed(1)} px`);
    if (map.overflow > 0) red.push('map page scrolls');
    await page.screenshot({ path: `${SCREENSHOTS}/probetest-karte-${viewport.name}.png` });

    writeFileSync(
      `${SCREENSHOTS}/probetest-budget-${viewport.name}.json`,
      `${JSON.stringify(report, null, 2)}\n`,
    );
    await context.close();
    expect(red, `probetest layout in ${viewport.name}`).toEqual([]);
  });
}

test('probetest print sheet – A4 PDF, solutions on their own page', async ({
  page,
  browserName,
}) => {
  test.skip(browserName !== 'chromium', 'page.pdf exists only in Chromium');
  await page.goto('/probetest/mathe-01/print');
  await expect(page.locator('[data-item]')).toHaveCount(PROBETEST.itemIds.length);
  await expect(page.locator('[data-loesung]')).toHaveCount(PROBETEST.itemIds.length);
  await page.evaluate(() => document.fonts.ready);
  // Number items leave room to calculate before the result box (decision 2026-10-15).
  await expect(page.locator('[data-item="m-zo-1-011"] .druck-rechenplatz')).toHaveCount(1);
  await page.emulateMedia({ media: 'print' });
  await expect(page.getByRole('button', { name: 'Drucken' })).toBeHidden();
  expect(
    await page.locator('.druck-loesungen').evaluate((e) => getComputedStyle(e).breakBefore),
  ).toBe('page');
  await page.pdf({
    path: `${SCREENSHOTS}/probetest-druck.pdf`,
    format: 'A4',
    printBackground: true,
  });
  await page.setViewportSize({ width: 794, height: 1123 });
  await page.screenshot({ path: `${SCREENSHOTS}/probetest-druck-seite1.png` });
});

test('probetest print sheet Deutsch – each text before its items, the second on a new page', async ({
  page,
}) => {
  await page.goto('/probetest/deutsch-01/print');
  await expect(page.locator('[data-item]')).toHaveCount(
    DEUTSCH.find((p) => p.id === 'deutsch-01')!.itemIds.length,
  );
  const texts = page.locator('[data-text]');
  await expect(texts).toHaveCount(2);
  const order = await page
    .locator('.druck [data-text], .druck > .contents [data-item]')
    .evaluateAll((els) =>
      els.map((e) => (e as HTMLElement).dataset.text ?? (e as HTMLElement).dataset.item),
    );
  expect(order.indexOf('t-sach-001')).toBe(0);
  expect(order.indexOf('t-lit-003')).toBe(order.indexOf('d-lli-1-005') - 1);
  await page.emulateMedia({ media: 'print' });
  expect(await texts.nth(0).evaluate((e) => getComputedStyle(e).breakBefore)).toBe('auto');
  expect(await texts.nth(1).evaluate((e) => getComputedStyle(e).breakBefore)).toBe('page');
  await page.evaluate(() => document.fonts.ready);
  await page.setViewportSize({ width: 794, height: 1123 });
  await page.screenshot({ path: `${SCREENSHOTS}/probetest-druck-deutsch-seite1.png` });
});
