import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { itemSchema, type Bereich, type Item } from '../../../src/domain/content';
import { initialMasteryFromCheck } from '../../../src/domain/mastery';
import {
  CHECK_ITEM_COUNT,
  buildCheck,
  nextCheckItem,
  type CheckAnswer,
  type CheckPlan,
} from '../../../src/domain/scheduler';
import { item, makePool } from '../../fixtures/pool';

function countBy<T>(values: T[]): Map<T, number> {
  const m = new Map<T, number>();
  for (const v of values) m.set(v, (m.get(v) ?? 0) + 1);
  return m;
}

/** Runs the whole check, answering with `answer(item)`. */
function runCheck(plan: CheckPlan, answer: (item: Item) => boolean): CheckAnswer[] {
  const answers: CheckAnswer[] = [];
  for (let next = nextCheckItem(plan, answers); next; next = nextCheckItem(plan, answers)) {
    answers.push({
      itemId: next.item.id,
      fach: next.item.fach,
      bereich: next.item.bereich,
      correct: answer(next.item),
    });
  }
  return answers;
}

describe('buildCheck', () => {
  it('Mathe: 12 slots, 2–3 per Bereich, exactly two Bereiche with 3', () => {
    const plan = buildCheck('mathe', makePool('mathe'));
    expect(plan.slots).toHaveLength(CHECK_ITEM_COUNT);
    const counts = [...countBy(plan.slots).values()];
    expect(counts).toHaveLength(5);
    expect(counts.filter((c) => c === 3)).toHaveLength(2);
    expect(counts.every((c) => c === 2 || c === 3)).toBe(true);
  });

  it('Deutsch: 12 slots, 3 per Bereich', () => {
    const plan = buildCheck('deutsch', makePool('deutsch'));
    expect([...countBy(plan.slots).values()]).toEqual([3, 3, 3, 3]);
  });

  it('orders slots round-robin so the check starts with one item per Bereich', () => {
    const plan = buildCheck('mathe', makePool('mathe'));
    expect(new Set(plan.slots.slice(0, 5)).size).toBe(5);
  });

  it('uses auto-check formats only (no short-answer) and no retired items', () => {
    const pool = makePool('mathe', 5).map((i, n) =>
      n % 7 === 0 ? ({ ...i, status: 'retired' } as Item) : i,
    );
    const plan = buildCheck('mathe', pool);
    const all = Object.values(plan.candidates).flat();
    expect(all.length).toBeGreaterThan(0);
    expect(all.some((i) => i.format === 'short-answer')).toBe(false);
    expect(all.some((i) => i.status === 'retired')).toBe(false);
    expect(pool.some((i) => i.format === 'short-answer')).toBe(true);
  });

  it('gives Bereiche with too few items fewer slots and stays below 12', () => {
    const pool = [
      ...makePool('mathe', 2, ['zahlen-operationen', 'raum-form']),
      item('daten-zufall', 1, 1),
    ];
    const plan = buildCheck('mathe', pool);
    const counts = countBy(plan.slots);
    expect(counts.get('zahlen-operationen')).toBe(3);
    expect(counts.get('raum-form')).toBe(3);
    expect(counts.get('daten-zufall')).toBe(1);
    expect(counts.has('groessen-messen')).toBe(false);
    expect(plan.slots).toHaveLength(7);
  });

  it('returns an empty plan for an empty pool', () => {
    const plan = buildCheck('mathe', []);
    expect(plan.slots).toEqual([]);
    expect(nextCheckItem(plan, [])).toBeNull();
  });

  it('is reproducible for the same seed', () => {
    expect(buildCheck('mathe', makePool('mathe'), 's')).toEqual(
      buildCheck('mathe', makePool('mathe'), 's'),
    );
  });
});

describe('nextCheckItem – ladder', () => {
  const plan = buildCheck('mathe', makePool('mathe'));

  it('starts every Bereich on niveau 1', () => {
    const first = nextCheckItem(plan, []);
    expect(first).toMatchObject({ niveau: 1, slotIndex: 0, total: 12 });
    expect(first?.item.niveau).toBe(1);
  });

  it('climbs after a correct answer and stays after a wrong one', () => {
    const allCorrect = runCheck(plan, () => true);
    const allWrong = runCheck(plan, () => false);
    const levels = (answers: CheckAnswer[], bereich: Bereich) =>
      answers
        .filter((a) => a.bereich === bereich)
        .map(
          (a) =>
            Object.values(plan.candidates)
              .flat()
              .find((i) => i.id === a.itemId)!.niveau,
        );
    const threeSlots = [...countBy(plan.slots)].find(([, c]) => c === 3)![0];
    expect(levels(allCorrect, threeSlots)).toEqual([1, 2, 3]);
    expect(levels(allWrong, threeSlots)).toEqual([1, 1, 1]);
  });

  it('never repeats an item and ends after all slots', () => {
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
    const sparse = buildCheck('mathe', pool);
    // Rung 2 does not exist: after one correct answer, niveau 1 and 3 are equally near → 1.
    const first = nextCheckItem(sparse, [])!;
    const second = nextCheckItem(sparse, [
      { itemId: first.item.id, fach: 'mathe', bereich: 'zahlen-operationen', correct: true },
    ]);
    expect(second?.niveau).toBe(2);
    expect(second?.item.niveau).toBe(1);
  });

  it('feeds initialMasteryFromCheck: all correct → niveau 3 everywhere', () => {
    const states = initialMasteryFromCheck(
      runCheck(plan, () => true),
      { learnerId: 'l', at: '2026-10-11T08:00:00.000Z' },
    );
    expect(states.map((s) => s.niveau)).toEqual([3, 3, 3, 3, 3]);
  });
});

describe('buildCheck with the real content', () => {
  it('builds a valid plan from content/items/mathe', () => {
    const files = ['zahlen-operationen', 'groessen-messen'];
    const pool = files.flatMap((f) =>
      (JSON.parse(readFileSync(`content/items/mathe/${f}.json`, 'utf8')) as unknown[]).map((raw) =>
        itemSchema.parse(raw),
      ),
    );
    const plan = buildCheck('mathe', pool);
    const counts = countBy(plan.slots);
    expect([...counts.values()].every((c) => c <= 3)).toBe(true);
    expect(counts.get('zahlen-operationen')).toBe(3);
    const answers = runCheck(plan, () => true);
    expect(answers).toHaveLength(plan.slots.length);
  });
});
