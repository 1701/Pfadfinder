import { expect, type Page } from '@playwright/test';
import { readdirSync, readFileSync } from 'node:fs';
import { splitUnits } from '../../src/domain/content/units';

type Entry = { id: string; text: string };

export interface ContentItem {
  id: string;
  format: string;
  status: string;
  prompt: string;
  stimulus?: { text?: string; assetId?: string; assetAlt?: string; textRef?: string };
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

export { SCREENSHOTS } from './output-dir';

/** The sentence in the map's Tagesziel before the very first Fundstück (task 17). */
export const FUNDSTUECK_HINWEIS = 'Jede Aufgabe, die du übst, bringt dir ein Fundstück.';

/**
 * The map with no Fundstück on any day yet: the sentence shows. "Heute: 0 von 10 Fundstücken" is
 * there too, visible in landscape only (in portrait the sentence takes its place).
 */
export async function expectFirstHint(page: Page) {
  await expect(page.getByText(FUNDSTUECK_HINWEIS)).toBeVisible();
  await expect(page.getByText('Heute: 0 von 10 Fundstücken')).toHaveCount(1);
}

/** The four viewports: iPad, and the same iPad in Safari with its bars (the tightest). */
/** The signs of the Gebiete on the visible map (SU Phase B, measuring code of SU Phase A). */
export interface MapLabels {
  /** Smallest gap between two signs (or names of unexplored Gebiete), screen px. */
  minLabelGap: number;
  minLabelPair: string;
  /** Smallest distance of a sign to its own outline; negative: it pokes out of its Gebiet. */
  plateToOutline: number;
  plateToOutlineName: string;
  /** Smallest gap between a sign and an island name. */
  labelToIslandName: number;
  /** Per Gebiet: accessible name and distance of its sign to its outline. */
  perRegion: { name: string; toOutline: number }[];
}

export async function mapLabels(page: Page): Promise<MapLabels> {
  await page.evaluate(() => document.fonts.ready);
  return page.evaluate(() => {
    type P = [number, number];
    const round = (n: number) => Math.round(n * 10) / 10;
    const map = [...document.querySelectorAll<SVGSVGElement>('svg[aria-label="Karte"]')].find(
      (m) => m.getBoundingClientRect().width > 0,
    )!;
    const scale = map.getScreenCTM()!.a;
    const pts = (el: Element): P[] =>
      (el.getAttribute('points') ?? '')
        .trim()
        .split(/\s+/)
        .map((s) => s.split(',').map(Number) as P);
    // Signed distance of a point to a convex polygon, clockwise on screen: > 0 inside.
    const inside = (p: P, poly: P[]) =>
      Math.min(
        ...poly.map((a, i) => {
          const b = poly[(i + 1) % poly.length]!;
          const [dx, dy] = [b[0] - a[0], b[1] - a[1]];
          return ((p[0] - a[0]) * -dy + (p[1] - a[1]) * dx) / Math.hypot(dx, dy);
        }),
      );
    const regions = [...map.querySelectorAll(':scope > a, :scope > g[role="img"]')].map((g) => {
      const outline = g.querySelector('.map-outline') ?? g.querySelector('polygon')!;
      const plate = g.querySelector('rect[data-plate]');
      const box = plate
        ? (['x', 'y', 'width', 'height'] as const).map((k) => Number(plate.getAttribute(k)))
        : (() => {
            const b = (g.querySelector('text') as SVGGraphicsElement).getBBox();
            return [b.x, b.y, b.width, b.height];
          })();
      const [x, y, w, h] = box as [number, number, number, number];
      const corners: P[] = [
        [x, y],
        [x + w, y],
        [x + w, y + h],
        [x, y + h],
      ];
      return {
        name: g.getAttribute('aria-label')!,
        screen: (plate ?? g.querySelector('text')!).getBoundingClientRect(),
        toOutline: Math.min(...corners.map((c) => inside(c, pts(outline)))) * scale,
      };
    });
    const gap = (a: DOMRect, b: DOMRect) =>
      Math.max(a.left - b.right, b.left - a.right, a.top - b.bottom, b.top - a.bottom);
    let minGap = Infinity;
    let minPair = '';
    regions.forEach((a, i) =>
      regions.slice(i + 1).forEach((b) => {
        const g = gap(a.screen, b.screen);
        if (g < minGap) [minGap, minPair] = [g, `${a.name} | ${b.name}`];
      }),
    );
    const islands = [...map.querySelectorAll(':scope > text')].map((t) =>
      t.getBoundingClientRect(),
    );
    const worst = regions.reduce((a, b) => (b.toOutline < a.toOutline ? b : a));
    return {
      minLabelGap: round(minGap),
      minLabelPair: minPair,
      plateToOutline: round(worst.toOutline),
      plateToOutlineName: worst.name,
      labelToIslandName: round(
        Math.min(...regions.flatMap((r) => islands.map((n) => gap(r.screen, n)))),
      ),
      perRegion: regions.map((r) => ({ name: r.name, toOutline: round(r.toOutline) })),
    };
  });
}

/**
 * Signs on the map: ≥ 18 px apart in portrait, ≥ 15 px in landscape (decision Markus 2026-10-25,
 * SU Phase B), inside their own Gebiet and clear of the island names.
 */
export function expectMapLabels(m: MapLabels, label: string, portrait: boolean) {
  const minGap = portrait ? 18 : 15;
  expect
    .soft(m.minLabelGap, `${label}: signs closer than ${minGap} px (${m.minLabelPair})`)
    .toBeGreaterThanOrEqual(minGap);
  expect
    .soft(m.plateToOutline, `${label}: sign leaves its Gebiet (${m.plateToOutlineName})`)
    .toBeGreaterThanOrEqual(0);
  expect.soft(m.labelToIslandName, `${label}: sign on an island name`).toBeGreaterThan(0);
}

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

/**
 * match: no text or check mark leaves its label or tile; a label has at most two lines, and from
 * four words on no line holds a single word (labels wrap balanced). Beside a reading text the slot
 * (card column) takes at most 60 % of the row and the label the rest; without a text the grid is
 * packed: when no label wraps, from the end of the longest label's text to the slot no more than
 * the label's padding and the gap (28 px). A wrapped label is balanced and leaves room in its
 * column by design (m-dz-2-008 in landscape). Before, a long label squeezed the card to one word per line and the check
 * mark ran over the tile's edge (d-lli-2-003, Safari landscape, 2026-10-19); then sentences broke
 * into three lines beside short cards, and short cards left wide empty space (m-zo-1-009).
 * The invisible card sizer ([data-sizer], inside the first slot) does not count.
 */
export async function matchProblems(page: Page): Promise<string[]> {
  return page.evaluate(() => {
    const rows = document.querySelector('[data-region="answer"] [data-match-rows]');
    if (!rows) return ['match rows missing'];
    const width = rows.getBoundingClientRect().width;
    const besideText = rows.closest('.item-with-text') !== null;
    const textNodes = (box: Element) => {
      const nodes: Text[] = [];
      const walker = document.createTreeWalker(box, NodeFilter.SHOW_TEXT);
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        if (n.parentElement?.closest('.sr-only, [data-sizer]') || !(n.textContent ?? '').trim())
          continue;
        nodes.push(n as Text);
      }
      return nodes;
    };
    const parts = (box: Element) => {
      const rects: DOMRect[] = [...box.querySelectorAll('svg')].map((e) =>
        e.getBoundingClientRect(),
      );
      for (const n of textNodes(box)) {
        const range = document.createRange();
        range.selectNodeContents(n);
        rects.push(...[...range.getClientRects()].filter((r) => r.width > 0));
      }
      return rects;
    };
    const sticksOut = (box: Element) => {
      const b = box.getBoundingClientRect();
      return parts(box).some((r) => r.right > b.right + 0.5 || r.left < b.left - 0.5);
    };
    /** Words per line of a label, top to bottom (a word belongs to the line of its first box). */
    const lines = (box: Element) => {
      const byTop = new Map<number, number>();
      for (const n of textNodes(box)) {
        for (const m of (n.textContent ?? '').matchAll(/\S+/g)) {
          const range = document.createRange();
          range.setStart(n, m.index);
          range.setEnd(n, m.index + m[0].length);
          const first = [...range.getClientRects()].find((r) => r.width > 0);
          if (!first) continue;
          const top = Math.round(first.top);
          const line = [...byTop.keys()].find((t) => Math.abs(t - top) < 4) ?? top;
          byTop.set(line, (byTop.get(line) ?? 0) + 1);
        }
      }
      return [...byTop.entries()].sort((a, b) => a[0] - b[0]).map(([, words]) => words);
    };
    const found = [...rows.children].flatMap((row, i) => {
      const [label, slot] = [...row.children];
      if (!label || !slot) return [`row ${i + 1}: label or slot missing`];
      const tile = slot.querySelector('button') ?? slot;
      const share = slot.getBoundingClientRect().width / width;
      const words = lines(label);
      const total = words.reduce((a, b) => a + b, 0);
      return [
        besideText &&
          share > 0.605 &&
          `row ${i + 1}: slot takes ${Math.round(share * 100)} % of the row`,
        sticksOut(label) && `row ${i + 1}: label text leaves the label`,
        sticksOut(tile) && `row ${i + 1}: card text or check mark leaves the tile`,
        words.length > 2 && `row ${i + 1}: label has ${words.length} lines`,
        total >= 4 &&
          words.length > 1 &&
          words.includes(1) &&
          `row ${i + 1}: a label line holds one word (${words.join('/')})`,
      ].filter((p): p is string => typeof p === 'string');
    });
    if (!besideText && [...rows.children].every((row) => lines(row.children[0]!).length <= 1)) {
      const pairs = [...rows.children].map((row) => [...row.children]);
      const textEnd = Math.max(
        ...pairs.flatMap(([label]) => (label ? parts(label).map((r) => r.right) : [])),
      );
      const slotStart = Math.min(
        ...pairs.map(([, slot]) => slot?.getBoundingClientRect().left ?? Infinity),
      );
      const empty = slotStart - textEnd;
      if (empty > 28) found.push(`${Math.round(empty)} px empty between labels and slots`);
    }
    return found;
  });
}

/** One screen, no page scroll; answers never run under the band; the button fully visible. */
export async function expectFitsScreen(page: Page, label: string) {
  expect(await fitProblems(page), label).toEqual([]);
}

/** The id on the root node of the item screen (ItemScreen: data-item-id), once there is one. */
export async function itemIdOnScreen(page: Page): Promise<string> {
  const root = page.locator('main[data-item-id]');
  await expect(root).toHaveCount(1);
  return (await root.getAttribute('data-item-id'))!;
}

/**
 * The content item on screen, by the id on the item screen's root node (task F). Before, it was
 * guessed from prompt and stimulus, which items with the same prompt made ambiguous.
 */
export async function currentItem(page: Page): Promise<ContentItem> {
  const id = await itemIdOnScreen(page);
  const item = ITEMS.find((i) => i.id === id);
  expect(item, `active item ${id} in content/`).toBeDefined();
  return item!;
}

/** Fails unless the screen shows item `id`: measuring another item would give wrong numbers. */
export async function expectItemOnScreen(page: Page, id: string, label = 'item on screen') {
  expect(await itemIdOnScreen(page), label).toBe(id);
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
  // The order renderer is a lazy chunk: the prompt can be on screen before the list.
  await expect(page.locator('[data-region="answer"] li')).toHaveCount(text.size);
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
  // After an arrow tap the card slides (180 ms) and stays tinted for a second (task 14): wait
  // until the list rests, so boxes and screenshots show the cards in place, untinted.
  await expect(page.locator('[data-region="answer"] li[data-moved]')).toHaveCount(0);
  await expect
    .poll(() =>
      page
        .locator('[data-region="answer"] li')
        .evaluateAll((els) => els.filter((el) => (el as HTMLElement).style.transition).length),
    )
    .toBe(0);
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

/** Lines of the prompt on the screen. */
export async function promptLines(page: Page, prompt: string) {
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
