// Sweep for the sum rule of match beside a reading text (task 15, CONTENT_SCHEMA 1.0.17). Runs
// only with PFADFINDER_SWEEP=1 and never in CI: the project "sweep" exists only then
// (playwright.config.ts). Measures, never fails on air:
//   PFADFINDER_SWEEP=1 npx playwright test --project=sweep
// Items: tests/fixtures/sweep-match (beside t-sach-901, prompt 74, feedback 195 characters; the
// sum of all card texts varies). Per item and viewport: Üben /dev/text (antworten, richtig,
// noch nicht) and Probetest /dev/probetest with deutsch-90 (aufgabe, durchsehen): air above the
// band (fitMetrics), page scroll, overflow and overlap (screen-checks), matchProblems, and the
// most lines of a single card (left and right).
// Rule for N (decision Markus, task 15): Üben and Aufgabe ≥ 18 px in all four viewports;
// Durchsehen ≥ 18 px, in Safari landscape ≥ 0 without overflow or overlap (ARCHITECTURE §5).
// N = the largest sum such that every point with a sum up to N keeps the rule (3 and 4 pairs,
// both splits). `uebenOnly` is the same from the Üben states alone.
// Output: tests/e2e/output/sweep-match.json (always the output folder, it is no screenshot).
// Second sweep (after the first found no N): the feedback length F varies at sum 100 and 140;
// per pair count the largest F such that every point with a feedback up to F keeps the rule at
// both sums. Output tests/e2e/output/sweep-match-feedback.json. Only this one:
//   PFADFINDER_SWEEP=1 npx playwright test --project=sweep -g Rückmeldung
// One point with a prompt of 60 characters (task 15, 1c), the prompt lines per viewport, output
// tests/e2e/output/sweep-match-prompt.json:
//   PFADFINDER_SWEEP=1 npx playwright test --project=sweep -g Prompt

import { mkdirSync, writeFileSync } from 'node:fs';
import { expect, test, type Browser, type Page } from '@playwright/test';
import {
  SWEEP_FEEDBACK_MATCH,
  SWEEP_MATCH,
  SWEEP_PROMPT_MATCH,
  type SweepPoint,
} from '../fixtures/sweep-match';
import { VIEWPORTS, fitMetrics, matchProblems } from './helpers';
import { overflowProblems, overlapProblems } from './screen-checks';

const RUN = process.env.PFADFINDER_SWEEP === '1' && !process.env.CI;
const OUT = 'tests/e2e/output';
const AIR = 18;
const UEBEN = ['antworten', 'richtig', 'noch-nicht'] as const;
const PROBETEST = ['aufgabe', 'durchsehen'] as const;
type State = (typeof UEBEN)[number] | (typeof PROBETEST)[number];
type MatchItem = Extract<SweepPoint['item'], { format: 'match' }>;

interface Screen {
  air: number;
  /** Page scroll, overflow, overlap: what the Safari-landscape exception still forbids. */
  screen: string[];
  match: string[];
  lines: { left: number; right: number };
  /** Lines of the prompt (0 when it is not found as one text). */
  promptLines: number;
}

async function open(page: Page, url: string) {
  const band = page.locator('[data-region="band"] button, [data-region="band"] a').last();
  await page.goto(url);
  try {
    await band.waitFor({ timeout: 20_000 });
  } catch {
    await page.goto(url);
    await band.waitFor();
  }
  await expect(page.locator('[data-region="answer"] [aria-busy="true"]')).toHaveCount(0);
  await page.evaluate(() => document.fonts.ready);
}

/** The most lines of one card text on the screen, left and right (a card in a slot counts too). */
async function cardLines(page: Page, left: string[], right: string[]) {
  return page.evaluate(
    ([left, right]) => {
      const answer = document.querySelector('[data-region="answer"]')!;
      const walker = document.createTreeWalker(answer, NodeFilter.SHOW_TEXT);
      const most = { left: 0, right: 0 };
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (n.parentElement?.closest('.sr-only, [data-sizer]')) continue;
        const text = (n.textContent ?? '').replace(/ /g, ' ').trim();
        const side = left!.includes(text) ? 'left' : right!.includes(text) ? 'right' : null;
        if (!side) continue;
        const range = document.createRange();
        range.selectNodeContents(n);
        const tops: number[] = [];
        for (const r of range.getClientRects()) {
          if (r.width > 0 && !tops.some((t) => Math.abs(t - r.top) < 4)) tops.push(r.top);
        }
        most[side] = Math.max(most[side], tops.length);
      }
      return most;
    },
    [left, right],
  );
}

/** Lines of the prompt on the screen. */
async function promptLines(page: Page, prompt: string) {
  return page.evaluate((prompt) => {
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    for (let n = walker.nextNode(); n; n = walker.nextNode()) {
      if ((n.textContent ?? '').replace(/\u00a0/g, ' ').trim() !== prompt) continue;
      if (n.parentElement?.closest('.sr-only')) continue;
      const range = document.createRange();
      range.selectNodeContents(n);
      const tops: number[] = [];
      for (const r of range.getClientRects()) {
        if (r.width > 0 && !tops.some((t) => Math.abs(t - r.top) < 4)) tops.push(r.top);
      }
      return tops.length;
    }
    return 0;
  }, prompt);
}

async function measure(page: Page, item: MatchItem): Promise<Screen> {
  const left = item.payload.left.map((c) => c.text);
  const right = item.payload.right.map((c) => c.text);
  const fit = await fitMetrics(page);
  const scroll = fit && fit.overflow > 0 ? [`page scrolls by ${Math.round(fit.overflow)} px`] : [];
  return {
    air: fit ? Math.round(fit.slack) : -9999,
    screen: [...scroll, ...(await overflowProblems(page)), ...(await overlapProblems(page))],
    match: await matchProblems(page),
    lines: await cardLines(page, left, right),
    promptLines: await promptLines(page, item.prompt),
  };
}

/** The rule of one screen (see the head of this file). */
function keeps(state: State, viewport: string, s: Screen): boolean {
  if (state === 'durchsehen' && viewport === 'safari-landscape')
    return s.air >= 0 && s.screen.length === 0;
  return s.air >= AIR;
}

/** Largest key such that every point with a key up to it passes. */
function derive(passes: Map<number, boolean>): number | null {
  let n: number | null = null;
  for (const key of [...passes.keys()].sort((a, b) => a - b)) {
    if (!passes.get(key)) break;
    n = key;
  }
  return n;
}

type Results = Record<string, Record<string, Partial<Record<State, Screen>>>>;

/** Every point in every viewport and state: item id → viewport → state → screen. */
async function sweep(browser: Browser, points: SweepPoint[]): Promise<Results> {
  const results: Results = {};
  for (const viewport of VIEWPORTS) {
    const context = await browser.newContext({ viewport });
    const page = await context.newPage();
    for (const { item } of points) {
      if (item.format !== 'match') continue;
      const byState: Partial<Record<State, Screen>> = {};
      for (const state of UEBEN) {
        await open(page, `/dev/text/t-sach-901?item=${item.id}&zustand=${state}`);
        byState[state] = await measure(page, item);
      }
      for (const state of PROBETEST) {
        await open(page, `/dev/probetest?probetest=deutsch-90&zustand=${state}&item=${item.id}`);
        if ((await page.locator('[data-region="text"]').count()) !== 1)
          throw new Error(`${item.id} ${state}: no text box`);
        byState[state] = await measure(page, item);
      }
      (results[item.id] ??= {})[viewport.name] = byState;
    }
    await context.close();
  }
  return results;
}

/** One row per point: the air per viewport, what fails the rule, the findings. */
function rowsOf(points: SweepPoint[], results: Results) {
  return points.map(({ item, pairs, sum, split, feedback }) => {
    const byViewport = results[item.id]!;
    const lengths =
      item.format === 'match'
        ? {
            left: item.payload.left.map((c) => c.text.length),
            right: item.payload.right.map((c) => c.text.length),
          }
        : null;
    const failing = (states: readonly State[]) =>
      VIEWPORTS.flatMap((v) =>
        states
          .filter((s) => !keeps(s, v.name, byViewport[v.name]![s]!))
          .map((s) => `${v.name} ${s} ${byViewport[v.name]![s]!.air}`),
      );
    const min = (states: readonly State[]) =>
      Object.fromEntries(
        VIEWPORTS.map((v) => [v.name, Math.min(...states.map((s) => byViewport[v.name]![s]!.air))]),
      );
    const most = (side: 'left' | 'right') =>
      Math.max(
        ...VIEWPORTS.flatMap((v) => Object.values(byViewport[v.name]!).map((s) => s!.lines[side])),
      );
    const findings = VIEWPORTS.flatMap((v) =>
      Object.entries(byViewport[v.name]!).flatMap(([state, s]) =>
        [...s!.screen, ...s!.match].map((p) => `${v.name} ${state}: ${p}`),
      ),
    );
    return {
      id: item.id,
      pairs,
      sum,
      split,
      feedback,
      lengths,
      nochNicht: Object.fromEntries(
        VIEWPORTS.map((v) => [v.name, byViewport[v.name]!['noch-nicht']!.air]),
      ),
      uebenMin: min(UEBEN),
      aufgabe: min(['aufgabe']),
      durchsehen: min(['durchsehen']),
      lines: { left: most('left'), right: most('right') },
      promptLines: Object.fromEntries(
        VIEWPORTS.map((v) => [
          v.name,
          Object.fromEntries(
            Object.entries(byViewport[v.name]!).map(([state, s]) => [state, s!.promptLines]),
          ),
        ]),
      ),
      failingAll: failing([...UEBEN, ...PROBETEST]),
      failingUeben: failing(UEBEN),
      findings,
    };
  });
}
type Row = ReturnType<typeof rowsOf>[number];

/** Does every row with the same key pass? key → passes. */
function passesBy(rows: Row[], key: (r: Row) => number, pick: (r: Row) => string[]) {
  const passes = new Map<number, boolean>();
  for (const r of rows) passes.set(key(r), (passes.get(key(r)) ?? true) && pick(r).length === 0);
  return passes;
}

function write(file: string, data: unknown) {
  mkdirSync(OUT, { recursive: true });
  writeFileSync(`${OUT}/${file}`, `${JSON.stringify(data, null, 2)}\n`);
}

test('Sweep: match neben dem Text, Summe aller Kartentexte', async ({ browser }) => {
  test.skip(!RUN, 'nur mit PFADFINDER_SWEEP=1, nie in CI');
  test.setTimeout(60 * 60_000);
  const results = await sweep(browser, SWEEP_MATCH);
  const rows = rowsOf(SWEEP_MATCH, results);
  const upToFour = rows.filter((r) => r.pairs <= 4);
  const all = passesBy(
    upToFour,
    (r) => r.sum,
    (r) => r.failingAll,
  );
  const ueben = passesBy(
    upToFour,
    (r) => r.sum,
    (r) => r.failingUeben,
  );
  const five = rows.find((r) => r.pairs === 5);
  const derived = {
    n: derive(all),
    uebenOnly: derive(ueben),
    passesBySum: Object.fromEntries(all),
    uebenPassesBySum: Object.fromEntries(ueben),
    fivePairs: five && {
      sum: five.sum,
      uebenMin: five.uebenMin,
      below18: five.failingUeben.length > 0,
      failingAll: five.failingAll,
    },
    threeLineCards: rows
      .filter((r) => r.lines.left >= 3 || r.lines.right >= 3)
      .map((r) => ({ id: r.id, sum: r.sum, split: r.split, lines: r.lines, lengths: r.lengths })),
  };
  write('sweep-match.json', { viewports: VIEWPORTS, air: AIR, derived, rows, results });
  expect(rows).toHaveLength(SWEEP_MATCH.length);
});

test('Sweep: match neben dem Text, Rückmeldungslänge', async ({ browser }) => {
  test.skip(!RUN, 'nur mit PFADFINDER_SWEEP=1, nie in CI');
  test.setTimeout(60 * 60_000);
  const results = await sweep(browser, SWEEP_FEEDBACK_MATCH);
  const rows = rowsOf(SWEEP_FEEDBACK_MATCH, results);
  /** Per pair count: the largest F at which sum 100 and 140 both keep the rule. */
  const perPairs = Object.fromEntries(
    [...new Set(rows.map((r) => r.pairs))].map((pairs) => {
      const mine = rows.filter((r) => r.pairs === pairs);
      const all = passesBy(
        mine,
        (r) => r.feedback,
        (r) => r.failingAll,
      );
      const ueben = passesBy(
        mine,
        (r) => r.feedback,
        (r) => r.failingUeben,
      );
      const sum100 = passesBy(
        mine.filter((r) => r.sum === 100),
        (r) => r.feedback,
        (r) => r.failingAll,
      );
      return [
        pairs,
        {
          f: derive(all),
          uebenOnly: derive(ueben),
          fAtSum100: derive(sum100),
          passesByFeedback: Object.fromEntries(all),
        },
      ];
    }),
  );
  write('sweep-match-feedback.json', {
    viewports: VIEWPORTS,
    air: AIR,
    derived: perPairs,
    rows,
    results,
  });
  expect(rows).toHaveLength(SWEEP_FEEDBACK_MATCH.length);
});

test('Sweep: match neben dem Text, Prompt 60 Zeichen', async ({ browser }) => {
  test.skip(!RUN, 'nur mit PFADFINDER_SWEEP=1, nie in CI');
  test.setTimeout(10 * 60_000);
  const points = [
    ...SWEEP_PROMPT_MATCH,
    // The same cards and feedback with the prompt of 74, for the difference.
    ...SWEEP_MATCH.filter((p) => p.pairs === 3 && p.sum === 140 && p.split === 'even'),
  ];
  const rows = rowsOf(points, await sweep(browser, points));
  write('sweep-match-prompt.json', { viewports: VIEWPORTS, air: AIR, rows });
  expect(rows).toHaveLength(2);
});
