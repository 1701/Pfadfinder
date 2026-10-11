import { describe, expect, it } from 'vitest';
import type { Item } from '../../../src/domain/content';
import type { ReviewEntry } from '../../../src/domain/learner';
import {
  MAX_REVIEWS_PER_SESSION,
  pickNext,
  type PickNextInput,
} from '../../../src/domain/scheduler';
import { item, makePool, masteryFor } from '../../fixtures/pool';
import { numberInput, singleChoice } from '../../fixtures/items';

const NOW = '2026-10-12T10:00:00.000Z';
const ZO = 'zahlen-operationen' as const;

function input(overrides: Partial<PickNextInput> = {}): PickNextInput {
  return {
    fach: 'mathe',
    bereich: ZO,
    mastery: masteryFor(ZO, 2),
    pool: makePool('mathe'),
    recentItemIds: [],
    dueReviews: [],
    now: NOW,
    seed: 'test',
    ...overrides,
  };
}

function review(itemId: string, dueAt = '2026-10-12T08:00:00.000Z'): ReviewEntry {
  return { learnerId: 'learner-1', itemId, stage: 1, dueAt };
}

const pickedItem = (i: PickNextInput) => pickNext(i)?.item;

describe('pickNext – empty pools', () => {
  it('returns null for an empty pool', () => {
    expect(pickNext(input({ pool: [] }))).toBeNull();
  });

  it('returns null when the pool has no usable item in this Bereich', () => {
    const otherBereich = makePool('mathe', 2, ['raum-form']);
    const retired = [{ ...item(ZO, 2, 1), status: 'retired' } as Item];
    expect(pickNext(input({ pool: [...otherBereich, ...retired] }))).toBeNull();
  });
});

describe('pickNext – Fehlerkiste first', () => {
  const pool = makePool('mathe');
  const zoLevel1 = pool.find((i) => i.bereich === ZO && i.niveau === 1)!;

  it('serves a due review of this Bereich before anything else, regardless of niveau', () => {
    const result = pickNext(input({ dueReviews: [review(zoLevel1.id)] }));
    expect(result).toEqual({ source: 'review', item: zoLevel1, review: review(zoLevel1.id) });
  });

  it('serves reviews even if the item was seen recently ("only reviews due")', () => {
    const allZo = pool.filter((i) => i.bereich === ZO).map((i) => i.id);
    expect(
      pickNext(input({ recentItemIds: allZo, dueReviews: [review(zoLevel1.id)] }))?.source,
    ).toBe('review');
  });

  it('takes the earliest due review first', () => {
    const [a, b] = pool.filter((i) => i.bereich === ZO);
    const result = pickNext(
      input({
        dueReviews: [
          review(a!.id, '2026-10-12T07:00:00.000Z'),
          review(b!.id, '2026-10-11T07:00:00.000Z'),
        ],
      }),
    );
    expect(result?.item.id).toBe(b!.id);
  });

  it('ignores reviews that are not due, done, of another Bereich or another learner', () => {
    const rf = pool.find((i) => i.bereich === 'raum-form')!;
    const result = pickNext(
      input({
        dueReviews: [
          review(zoLevel1.id, '2026-10-14T08:00:00.000Z'),
          { ...review(zoLevel1.id), stage: 'done' },
          review(rf.id),
          { ...review(zoLevel1.id), learnerId: 'learner-2' },
        ],
      }),
    );
    expect(result?.source).toBe('practice');
  });

  it(`stops serving reviews after ${MAX_REVIEWS_PER_SESSION} per session`, () => {
    const dueReviews = [review(zoLevel1.id)];
    expect(pickNext(input({ dueReviews, reviewsInSession: 2 }))?.source).toBe('review');
    expect(pickNext(input({ dueReviews, reviewsInSession: 3 }))?.source).toBe('practice');
  });
});

describe('pickNext – practice items', () => {
  it('picks an item of the Bereich on the current niveau', () => {
    const picked = pickedItem(input());
    expect(picked).toMatchObject({ bereich: ZO, niveau: 2 });
  });

  it('skips items among the last 20 seen', () => {
    const pool = [item(ZO, 2, 1), item(ZO, 2, 2), item(ZO, 2, 3)];
    const recent = [pool[0]!.id, pool[1]!.id];
    expect(pickedItem(input({ pool, recentItemIds: recent }))?.id).toBe(pool[2]!.id);
  });

  it('allows items seen more than 20 items ago', () => {
    const pool = [item(ZO, 2, 1), item(ZO, 2, 2)];
    const filler = Array.from({ length: 20 }, (_, i) => `m-rf-1-${String(i).padStart(3, '0')}`);
    // pool[0] was seen 21 items ago, pool[1] just now.
    const recent = [pool[0]!.id, ...filler.slice(0, 19), pool[1]!.id];
    expect(pickedItem(input({ pool, recentItemIds: recent }))?.id).toBe(pool[0]!.id);
  });

  it('prefers a different format than the last item', () => {
    const pool = [
      item(ZO, 2, 1, numberInput),
      item(ZO, 2, 2, numberInput),
      item(ZO, 2, 3, singleChoice),
    ];
    const last = item(ZO, 1, 9, numberInput);
    for (const seed of ['a', 'b', 'c', 'd', 'e']) {
      expect(
        pickedItem(input({ pool: [...pool, last], recentItemIds: [last.id], seed }))?.format,
      ).toBe('single-choice');
    }
  });

  it('accepts the same format when nothing else is available', () => {
    const pool = [item(ZO, 2, 1, numberInput)];
    const last = item(ZO, 1, 9, numberInput);
    expect(pickedItem(input({ pool: [...pool, last], recentItemIds: [last.id] }))?.id).toBe(
      pool[0]!.id,
    );
  });

  it('is reproducible for the same seed', () => {
    expect(pickedItem(input({ seed: 's1' }))).toEqual(pickedItem(input({ seed: 's1' })));
  });

  it('throws when mastery belongs to another Bereich', () => {
    expect(() => pickNext(input({ mastery: masteryFor('raum-form', 2) }))).toThrow(/raum-form/);
  });
});

describe('pickNext – fallbacks', () => {
  it('uses niveau ±1 when everything on the niveau was seen recently', () => {
    const level2 = [item(ZO, 2, 1), item(ZO, 2, 2)];
    const pool = [...level2, item(ZO, 1, 1), item(ZO, 3, 1)];
    const picked = pickedItem(input({ pool, recentItemIds: level2.map((i) => i.id) }));
    expect([1, 3]).toContain(picked?.niveau);
  });

  it('uses only the existing neighbour at niveau 1 (no niveau 0)', () => {
    const pool = [item(ZO, 1, 1), item(ZO, 2, 1), item(ZO, 3, 1)];
    const picked = pickedItem(
      input({ mastery: masteryFor(ZO, 1), pool, recentItemIds: [pool[0]!.id] }),
    );
    expect(picked?.niveau).toBe(2);
  });

  it('repeats an item on the niveau when everything nearby was seen, but not the very last one', () => {
    const pool = [item(ZO, 2, 1), item(ZO, 2, 2), item(ZO, 1, 1)];
    const recent = [pool[2]!.id, pool[0]!.id, pool[1]!.id];
    expect(pickedItem(input({ pool, recentItemIds: recent }))?.id).toBe(pool[0]!.id);
  });

  it('repeats the very last item only if it is the only one', () => {
    const pool = [item(ZO, 2, 1)];
    expect(pickedItem(input({ pool, recentItemIds: [pool[0]!.id] }))?.id).toBe(pool[0]!.id);
  });

  it('falls back to niveaus two steps away rather than returning null', () => {
    const pool = [item(ZO, 3, 1)];
    expect(pickedItem(input({ mastery: masteryFor(ZO, 1), pool }))?.id).toBe(pool[0]!.id);
  });
});
