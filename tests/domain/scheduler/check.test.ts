import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BEREICHE_BY_FACH, itemSchema, type Bereich, type Item } from '../../../src/domain/content';
import { initialMasteryFromCheck } from '../../../src/domain/mastery';
import {
  CHECK_ITEM_COUNT,
  buildCheck,
  nextCheckItem,
  practiceableBereiche,
  practiceableItems,
  type CheckAnswer,
  type CheckPlan,
} from '../../../src/domain/scheduler';
import { OPEN_BEREICHE } from '../../fixtures/content-state';
import { item, makePool } from '../../fixtures/pool';
import { LESEN_ITEMS, LESEN_TEXTS, biberItems, igelItems, igelText } from '../../fixtures/lesen';

const MATHE: readonly Bereich[] = BEREICHE_BY_FACH.mathe;
const DEUTSCH: readonly Bereich[] = BEREICHE_BY_FACH.deutsch;
const opts = (bereiche: readonly Bereich[], seed = 's') => ({ bereiche, seed });

function countBy<T>(values: T[]): Map<T, number> {
  const m = new Map<T, number>();
  for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
  return m;
}

/** Runs the whole check; `answer` gets the item and how many items of its Bereich came before. */
function runCheck(
  plan: CheckPlan,
  answer: (item: Item, indexInBereich: number) => boolean,
): CheckAnswer[] {
  const answers: CheckAnswer[] = [];
  for (let next = nextCheckItem(plan, answers); next; next = nextCheckItem(plan, answers)) {
    const { item } = next;
    const index = answers.filter((a) => a.bereich === item.bereich).length;
    answers.push({
      itemId: item.id,
      fach: item.fach,
      bereich: item.bereich,
      niveau: item.niveau,
      correct: answer(item, index),
    });
  }
  return answers;
}

const perBereich = (answers: CheckAnswer[]) => countBy(answers.map((a) => a.bereich));

describe('buildCheck – number of questions', () => {
  it.each([
    [3, 9],
    [4, 12],
    [5, 12],
  ])('%i Bereiche → %i questions, 2–3 per Bereich', (n, total) => {
    const plan = buildCheck('mathe', makePool('mathe'), opts(MATHE.slice(0, n)));
    expect(plan.total).toBe(total);
    const answers = runCheck(plan, () => true);
    expect(answers).toHaveLength(total);
    const counts = [...perBereich(answers).values()];
    expect(counts).toHaveLength(n);
    expect(counts.every((c) => c === 2 || c === 3)).toBe(true);
  });

  it('Deutsch with 4 Bereiche: 3 each', () => {
    const plan = buildCheck('deutsch', makePool('deutsch'), opts(DEUTSCH));
    expect([...perBereich(runCheck(plan, () => false)).values()]).toEqual([3, 3, 3, 3]);
  });

  it('checks only the given Bereiche, even when the pool has more', () => {
    const plan = buildCheck('mathe', makePool('mathe'), opts(['raum-form', 'daten-zufall']));
    expect(plan.total).toBe(6);
    expect([...perBereich(runCheck(plan, () => true)).keys()]).toEqual([
      'raum-form',
      'daten-zufall',
    ]);
  });

  it('serves every Bereich once before any Bereich comes twice', () => {
    const plan = buildCheck('mathe', makePool('mathe'), opts(MATHE));
    const answers = runCheck(plan, () => true);
    expect(answers.slice(0, 5).map((a) => a.bereich)).toEqual(MATHE);
    expect(answers.slice(5, 10).map((a) => a.bereich)).toEqual(MATHE);
  });

  it('uses auto-check formats only (no short-answer) and no retired items', () => {
    const pool = makePool('mathe', 5).map((i, n) =>
      n % 7 === 0 ? ({ ...i, status: 'retired' } as Item) : i,
    );
    const plan = buildCheck('mathe', pool, opts(MATHE));
    const all = Object.values(plan.candidates).flat();
    expect(all.length).toBeGreaterThan(0);
    expect(all.some((i) => i.format === 'short-answer')).toBe(false);
    expect(all.some((i) => i.status === 'retired')).toBe(false);
    expect(pool.some((i) => i.format === 'short-answer')).toBe(true);
  });

  it('gives a Bereich with too few items fewer questions', () => {
    const pool = [
      ...makePool('mathe', 2, ['zahlen-operationen', 'raum-form']),
      item('daten-zufall', 1, 1),
    ];
    const plan = buildCheck(
      'mathe',
      pool,
      opts(['zahlen-operationen', 'raum-form', 'daten-zufall']),
    );
    expect(plan.total).toBe(7);
    const counts = perBereich(runCheck(plan, () => true));
    expect(Object.fromEntries(counts)).toEqual({
      'zahlen-operationen': 3,
      'raum-form': 3,
      'daten-zufall': 1,
    });
  });

  it('returns an empty plan for an empty pool', () => {
    const plan = buildCheck('mathe', [], opts(MATHE));
    expect(plan.total).toBe(0);
    expect(nextCheckItem(plan, [])).toBeNull();
  });

  it('is reproducible for the same seed and differs for another one', () => {
    const pool = makePool('mathe');
    expect(buildCheck('mathe', pool, opts(MATHE, 'a'))).toEqual(
      buildCheck('mathe', pool, opts(MATHE, 'a')),
    );
    const ids = (seed: string) =>
      runCheck(buildCheck('mathe', pool, opts(MATHE, seed)), () => true).map((a) => a.itemId);
    expect(ids('a')).not.toEqual(ids('b'));
  });
});

describe('buildCheck – round 3 with 5 Bereiche (2 extra places)', () => {
  const plan = buildCheck('mathe', makePool('mathe'), opts(MATHE));
  const thirdRound = (mixed: readonly Bereich[]) =>
    runCheck(plan, (i, index) => (mixed.includes(i.bereich) ? index === 0 : true))
      .slice(10)
      .map((a) => a.bereich);

  it('goes to the Bereiche whose two answers differ', () => {
    expect(thirdRound(['groessen-messen', 'muster-strukturen'])).toEqual([
      'groessen-messen',
      'muster-strukturen',
    ]);
  });

  it('then to the first Bereiche answered the same way twice', () => {
    expect(thirdRound(['daten-zufall'])).toEqual(['daten-zufall', 'zahlen-operationen']);
    expect(thirdRound([])).toEqual(['zahlen-operationen', 'raum-form']);
  });

  it('keeps the total fixed whatever the answers', () => {
    for (const mixed of [[], ['raum-form'], MATHE] as Bereich[][]) {
      expect(runCheck(plan, (i, n) => (mixed.includes(i.bereich) ? n === 0 : true))).toHaveLength(
        CHECK_ITEM_COUNT,
      );
    }
  });
});

describe('nextCheckItem – ladder', () => {
  const plan = buildCheck('mathe', makePool('mathe'), opts(MATHE.slice(0, 4)));
  const levels = (answers: CheckAnswer[], bereich: Bereich) =>
    answers.filter((a) => a.bereich === bereich).map((a) => a.niveau);

  it('starts every Bereich on niveau 1', () => {
    const first = nextCheckItem(plan, []);
    expect(first).toMatchObject({ niveau: 1, slotIndex: 0, total: 12 });
    expect(first?.item.niveau).toBe(1);
  });

  it('climbs after a correct answer and stays after a wrong one', () => {
    expect(
      levels(
        runCheck(plan, () => true),
        'raum-form',
      ),
    ).toEqual([1, 2, 3]);
    expect(
      levels(
        runCheck(plan, () => false),
        'raum-form',
      ),
    ).toEqual([1, 1, 1]);
    expect(
      levels(
        runCheck(plan, (_, n) => n !== 1),
        'raum-form',
      ),
    ).toEqual([1, 2, 2]);
  });

  it('never repeats an item and ends after all questions', () => {
    const answers = runCheck(plan, (i) => i.niveau === 1);
    expect(answers).toHaveLength(12);
    expect(new Set(answers.map((a) => a.itemId)).size).toBe(12);
    expect(nextCheckItem(plan, answers)).toBeNull();
  });

  it('falls back to the nearest niveau, the easier one on a tie', () => {
    const pool = [
      item('zahlen-operationen', 1, 1),
      item('zahlen-operationen', 1, 2),
      item('zahlen-operationen', 3, 1),
    ];
    const sparse = buildCheck('mathe', pool, opts(['zahlen-operationen']));
    // Rung 2 does not exist: after one correct answer, niveau 1 and 3 are equally near → 1.
    const first = nextCheckItem(sparse, [])!;
    const second = nextCheckItem(sparse, [
      {
        itemId: first.item.id,
        fach: 'mathe',
        bereich: 'zahlen-operationen',
        niveau: 1,
        correct: true,
      },
    ]);
    expect(second?.niveau).toBe(2);
    expect(second?.item.niveau).toBe(1);
  });

  it.each<[string, (n: number) => boolean, 1 | 2 | 3]>([
    ['R R R → 3', () => true, 3],
    ['R R W → 2', (n) => n < 2, 2],
    ['W R R → 2', (n) => n > 0, 2],
    ['R W W → 1', (n) => n === 0, 1],
    ['R W R → 2', (n) => n !== 1, 2],
    ['W W W → 1', () => false, 1],
  ])('feeds initialMasteryFromCheck: %s', (_, answer, niveau) => {
    const states = initialMasteryFromCheck(
      runCheck(plan, (_i, n) => answer(n)),
      { learnerId: 'l', at: '2026-10-11T08:00:00.000Z' },
    );
    expect(states.map((s) => s.niveau)).toEqual([niveau, niveau, niveau, niveau]);
  });
});

describe('buildCheck with the real content', () => {
  it('Mathe: every practiceable Bereich gets 2–3 items, at most 12', () => {
    const formats = ['single-choice', 'number-input'] as const;
    const pool = practiceableItems(
      MATHE.flatMap((b) => {
        let raw: unknown[];
        try {
          raw = JSON.parse(readFileSync(`content/items/mathe/${b}.json`, 'utf8')) as unknown[];
        } catch {
          return [];
        }
        return raw.map((r) => itemSchema.parse(r));
      }),
      formats,
    );
    const bereiche = practiceableBereiche(pool, formats);
    expect(bereiche).toEqual(OPEN_BEREICHE.filter((b) => MATHE.includes(b)));
    const plan = buildCheck('mathe', pool, opts(bereiche));
    expect(plan.total).toBe(Math.min(CHECK_ITEM_COUNT, 3 * bereiche.length));
    const answers = runCheck(plan, () => true);
    expect(answers).toHaveLength(plan.total);
    expect([...perBereich(answers).keys()]).toEqual(bereiche);
    expect([...perBereich(answers).values()].every((c) => c === 2 || c === 3)).toBe(true);
  });
});

describe('buildCheck – a Lesen-Bereich takes its items from one text', () => {
  const LSA: Bereich = 'lesen-sachtext';
  const textOf = (i: Item) => i.stimulus?.textRef;

  it('checks 2–3 items of one text only, chosen by the seed', () => {
    const chosen = new Set<string>();
    for (const seed of ['a', 'b', 'c', 'd', 'e', 'f']) {
      const plan = buildCheck('deutsch', LESEN_ITEMS, opts([LSA], seed));
      const answers = runCheck(plan, () => true);
      expect(answers.length).toBeGreaterThanOrEqual(2);
      expect(answers.length).toBeLessThanOrEqual(3);
      const texts = new Set(
        answers.map((a) => textOf(LESEN_ITEMS.find((i) => i.id === a.itemId)!)),
      );
      expect(texts.size).toBe(1);
      chosen.add([...texts][0]!);
      // Every candidate belongs to that text: the ladder can only pick from it.
      expect(new Set(plan.candidates[LSA]!.map(textOf))).toEqual(texts);
    }
    expect(chosen).toEqual(new Set(LESEN_TEXTS.map((t) => t.id)));
  });

  it('is reproducible for the same seed', () => {
    const a = buildCheck('deutsch', LESEN_ITEMS, opts([LSA], 'x'));
    const b = buildCheck('deutsch', LESEN_ITEMS, opts([LSA], 'x'));
    expect(a).toEqual(b);
  });

  it('skips a text with fewer than 2 auto-check items (short-answer does not count)', () => {
    const biber = biberItems
      .filter((i) => i.format === 'short-answer' || i.niveau === 1)
      .slice(0, 2);
    // One auto-check item and the short answer: not enough for the Biber text.
    const pool = [...biber.filter((i) => i.format !== 'mark-in-text'), ...igelItems];
    for (const seed of ['a', 'b', 'c', 'd']) {
      const plan = buildCheck('deutsch', pool, opts([LSA], seed));
      expect(new Set(plan.candidates[LSA]!.map(textOf))).toEqual(new Set([igelText.id]));
    }
  });
});
