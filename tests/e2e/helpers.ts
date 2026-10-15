import { expect, type Page } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import { splitUnits } from '../../src/domain/content/units';

type Entry = { id: string; text: string };

export interface ContentItem {
  id: string;
  format: string;
  status: string;
  prompt: string;
  stimulus?: { text?: string; assetId?: string };
  payload: {
    options?: Entry[];
    left?: Entry[];
    right?: Entry[];
    items?: Entry[];
    template?: string;
    gaps?: { key: string; options: string[] }[];
    text?: string;
    unit?: 'word' | 'sentence';
    words?: Entry[];
  };
  solution: {
    optionId?: string;
    optionIds?: string[];
    value?: number;
    pairs?: [string, string][];
    orderedIds?: string[];
    gaps?: Record<string, string>;
    indices?: number[];
    errorIds?: string[];
    model?: string;
  };
  feedback: { correct: string; incorrect: string; misconception?: string };
}

/** Every active item of every format (all nine have a renderer since task 7). */
export const ITEMS: ContentItem[] = readdirSync('content/items', { recursive: true })
  .map(String)
  .filter((file) => file.endsWith('.json'))
  .flatMap((file) => JSON.parse(readFileSync(`content/items/${file}`, 'utf8')) as ContentItem[])
  .filter((i) => i.status !== 'retired');

export const SCREENSHOTS = 'tests/e2e/screenshots';

/** The four viewports: iPad, and the same iPad in Safari with its bars (the tightest). */
export const VIEWPORTS = [
  { name: 'ipad-landscape', width: 1024, height: 768 },
  { name: 'ipad-portrait', width: 768, height: 1024 },
  { name: 'safari-landscape', width: 1024, height: 660 },
  { name: 'safari-portrait', width: 768, height: 900 },
];

export interface FitMetrics {
  /** Page scroll in px (> 0 is a problem). */
  overflow: number;
  /** Free space between the answers and the band in px (< 0: answers run under it). */
  slack: number;
  buttonBottom: number;
  buttonHeight: number;
}

/** The raw numbers behind fitProblems; null when answer area, band or band button is missing. */
export async function fitMetrics(page: Page): Promise<FitMetrics | null> {
  return page.evaluate(() => {
    const answer = document.querySelector('[data-region="answer"]')?.firstElementChild;
    const band = document.querySelector('[data-region="band"]');
    const button = band?.querySelector(':scope > button:last-of-type');
    if (!answer || !band || !button) return null;
    return {
      overflow: document.documentElement.scrollHeight - window.innerHeight,
      slack: band.getBoundingClientRect().top - answer.getBoundingClientRect().bottom,
      buttonBottom: window.innerHeight - button.getBoundingClientRect().bottom,
      buttonHeight: button.getBoundingClientRect().height,
    };
  });
}

/**
 * Measures one screen: no page scroll, answers never under the band, the band's last button fully
 * visible and 56 px high. Returns what is wrong (empty when it fits), so a caller can collect.
 */
export async function fitProblems(page: Page): Promise<string[]> {
  const m = await fitMetrics(page);
  if (!m) return ['answer area, band or band button missing'];
  const px = (n: number) => `${Math.round(n)} px`;
  return [
    m.overflow > 0 && `page scrolls by ${px(m.overflow)}`,
    m.slack < 0 && `answers run ${px(-m.slack)} under the feedback band`,
    m.buttonBottom < 0 && `button leaves the screen by ${px(-m.buttonBottom)}`,
    m.buttonHeight < 56 && `button only ${px(m.buttonHeight)} high`,
  ].filter((p): p is string => typeof p === 'string');
}

/** One screen, no page scroll; answers never run under the band; the button fully visible. */
export async function expectFitsScreen(page: Page, label: string) {
  expect(await fitProblems(page), label).toEqual([]);
}

/** Texts an item puts into the answer area (options, cards, elements, words, gap options). */
function answerTexts(item: ContentItem): string[] {
  const { payload } = item;
  return [
    ...[payload.options, payload.left, payload.right, payload.items, payload.words]
      .flatMap((list) => list ?? [])
      .map((e) => e.text),
    ...(payload.gaps ?? []).flatMap((g) => g.options),
    ...(payload.text && payload.unit ? splitUnits(payload.text, payload.unit) : []),
  ];
}

/**
 * The content item on screen, found by its prompt and stimulus. Several items share a prompt
 * ("Ordne die Zahlen. Die kleinste zuerst."): then the answer area decides.
 */
export async function currentItem(page: Page): Promise<ContentItem> {
  const plain = (text: string | null) => (text ?? '').replace(/\u00a0/g, ' ');
  const prompt = plain(await page.getByRole('heading', { level: 1 }).textContent());
  const sheet = plain(await page.locator('main section').first().textContent());
  const candidates = ITEMS.filter(
    (i) => i.prompt === prompt && sheet.includes(i.stimulus?.text ?? ''),
  );
  let item = candidates[0];
  if (candidates.length > 1) {
    const area = plain(await page.locator('[data-region="answer"]').textContent());
    item = candidates.find((c) => answerTexts(c).every((t) => area.includes(t)));
  }
  expect(item, `item for "${prompt}"`).toBeDefined();
  return item!;
}

function swapFirstTwo<T>(list: T[]): T[] {
  const [a, b, ...rest] = list;
  return a === undefined || b === undefined ? list : [b, a, ...rest];
}

const button = (page: Page, name: string) => page.getByRole('button', { name, exact: true });

/** Puts the order list into the wanted order with the arrow buttons (at least one move). */
async function arrange(page: Page, item: ContentItem, wanted: string[]) {
  const text = new Map(item.payload.items!.map((e) => [e.id, e.text]));
  const shown = async () =>
    (await page.locator('[data-region="answer"] li').allTextContents()).map((t) =>
      t.replace(/ /g, ' ').trim(),
    );
  let moved = false;
  for (const [target, id] of wanted.entries()) {
    const name = text.get(id)!;
    let at = (await shown()).indexOf(name);
    while (at > target) {
      await button(page, `${name} nach oben`).click();
      at--;
      moved = true;
    }
  }
  if (!moved) {
    // Already in the wanted order: one move down and back, Prüfen waits for a move.
    const first = text.get(wanted[0]!)!;
    await button(page, `${first} nach unten`).click();
    await button(page, `${first} nach oben`).click();
  }
}

/**
 * Answers the item on screen correctly or wrongly through the UI, like a child taps. Does not
 * press Prüfen (see check); a short answer is only typed here.
 */
export async function answer(page: Page, item: ContentItem, correct: boolean) {
  const { payload, solution } = item;
  switch (item.format) {
    case 'single-choice': {
      const id = correct
        ? solution.optionId!
        : payload.options!.find((o) => o.id !== solution.optionId)!.id;
      await page.locator('label', { has: page.locator(`input[value="${id}"]`) }).click();
      return;
    }
    case 'multi-choice': {
      const right = solution.optionIds!;
      const other = payload.options!.find((o) => !right.includes(o.id))!.id;
      for (const id of correct ? right : [...right.slice(0, -1), other]) {
        await page.locator('label', { has: page.locator(`input[value="${id}"]`) }).click();
      }
      return;
    }
    case 'number-input': {
      const value = correct ? solution.value! : solution.value! + 1;
      for (const key of String(value).replace('.', ',')) {
        await button(page, key === ',' ? 'Komma' : key).click();
      }
      return;
    }
    case 'match': {
      const pairs = solution.pairs!;
      const rights = correct ? pairs.map(([, r]) => r) : swapFirstTwo(pairs.map(([, r]) => r));
      const left = new Map(payload.left!.map((e) => [e.id, e.text]));
      const right = new Map(payload.right!.map((e) => [e.id, e.text]));
      for (const [i, [l]] of pairs.entries()) {
        await button(page, left.get(l)!).click();
        await page
          .getByRole('group', { name: 'Antworten' })
          .getByRole('button', { name: right.get(rights[i]!)!, exact: true })
          .click();
      }
      return;
    }
    case 'order':
      await arrange(
        page,
        item,
        correct ? solution.orderedIds! : swapFirstTwo(solution.orderedIds!),
      );
      return;
    case 'cloze-select': {
      const gaps = [...payload.template!.matchAll(/\{([^{}]+)\}/g)].map((m) => m[1]!);
      for (const [i, key] of gaps.entries()) {
        const options = payload.gaps!.find((g) => g.key === key)!.options;
        const value =
          correct || i > 0 ? solution.gaps![key]! : options.find((o) => o !== solution.gaps![key])!;
        // The first empty gap opens by itself; tapping an open gap would close it.
        const gap = page.getByRole('button', { name: new RegExp(`^Lücke ${i + 1}:`) });
        if ((await gap.getAttribute('aria-expanded')) !== 'true') await gap.click();
        await page
          .getByRole('group', { name: `Antworten für Lücke ${i + 1}` })
          .getByRole('button', { name: value, exact: true })
          .click();
      }
      return;
    }
    case 'mark-in-text': {
      const wanted = solution.indices!;
      const units = splitUnits(payload.text!, payload.unit!);
      const other = units.findIndex((_, i) => !wanted.includes(i));
      const blocks = page.getByRole('group', { name: /zum Antippen$/ }).getByRole('button');
      for (const index of correct ? wanted : [...wanted.slice(0, -1), other]) {
        await blocks.nth(index).click();
      }
      return;
    }
    case 'find-error': {
      const wanted = solution.errorIds!;
      const other = payload.words!.find((w) => !wanted.includes(w.id))!.id;
      const words = new Map(payload.words!.map((w) => [w.id, w.text]));
      for (const id of correct ? wanted : [...wanted.slice(0, -1), other]) {
        await button(page, words.get(id)!).click();
      }
      return;
    }
    case 'short-answer':
      await page
        .getByRole('textbox', { name: 'Deine Antwort' })
        .fill(correct ? 'Wie die Musterlösung.' : 'Weiß nicht.');
      return;
    default:
      throw new Error(`No e2e answer for format ${item.format}`);
  }
}

/** Presses Prüfen; a short answer is compared ("Vergleichen") and then rated by the child. */
export async function check(page: Page, item: ContentItem, correct: boolean) {
  if (item.format === 'short-answer') {
    await button(page, 'Vergleichen').click();
    await button(page, correct ? 'Getroffen' : 'Noch nicht').click();
  } else {
    await button(page, 'Prüfen').click();
  }
}

/** The headline of the band after checking; a self-rated short answer has none. */
export function verdictOf(item: ContentItem, correct: boolean): string | null {
  if (item.format === 'short-answer') return null;
  return correct ? 'Richtig.' : 'Noch nicht ganz.';
}
