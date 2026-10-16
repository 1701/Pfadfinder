import { describe, expect, it } from 'vitest';
import type { ReviewEntry } from '../../../src/domain/learner';
import { pickNext, type PickNextInput } from '../../../src/domain/scheduler';
import { LESEN_ITEMS, biberItems, biberText, igelItems } from '../../fixtures/lesen';
import { makePool, masteryFor } from '../../fixtures/pool';

const NOW = '2026-10-16T10:00:00.000Z';
const LSA = 'lesen-sachtext' as const;

function input(overrides: Partial<PickNextInput> = {}): PickNextInput {
  return {
    fach: 'deutsch',
    bereich: LSA,
    mastery: masteryFor(LSA, 1, 'deutsch'),
    pool: LESEN_ITEMS,
    recentItemIds: [],
    sessionItemIds: [],
    dueReviews: [],
    now: NOW,
    seed: 'text',
    ...overrides,
  };
}

const review = (itemId: string): ReviewEntry => ({
  learnerId: 'learner-1',
  itemId,
  stage: 1,
  dueAt: '2026-10-16T06:00:00.000Z',
});

/** Plays a round of `count` picks; every pick is remembered as seen in the round. */
function round(count: number, overrides: Partial<PickNextInput> = {}) {
  const seen: string[] = [];
  const picks = [];
  for (let i = 0; i < count; i++) {
    const picked = pickNext(
      input({ ...overrides, recentItemIds: seen, sessionItemIds: seen, seed: `r#${i}` }),
    )!;
    picks.push(picked);
    seen.push(picked.item.id);
  }
  return picks;
}

const textOf = (id: string) => LESEN_ITEMS.find((i) => i.id === id)?.stimulus?.textRef;

describe('pickNext – items of a reading text stay together', () => {
  it('keeps the round at one text until all its items were shown, then changes the text', () => {
    const texts = round(10).map((p) => p.item.stimulus?.textRef);
    const first = texts[0]!;
    expect(texts.slice(0, 5)).toEqual(Array(5).fill(first));
    expect(new Set(texts.slice(5))).toEqual(new Set([texts[5]]));
    expect(texts[5]).not.toBe(first);
  });

  it('continues the running text after its first item, whatever the niveau rules would pick', () => {
    // The niveau-3 item is the last one of the round: the text goes on with the others.
    const last = biberItems.find((i) => i.niveau === 3)!;
    const picked = pickNext(input({ sessionItemIds: [last.id], recentItemIds: [last.id] }));
    expect(picked?.source).toBe('practice');
    expect(textOf(picked!.item.id)).toBe(biberText.id);
  });

  it('serves the nearest niveau of the text first, the easier one on a tie', () => {
    const last = biberItems.find((i) => i.niveau === 3)!;
    const atLevel2 = pickNext(
      input({ mastery: masteryFor(LSA, 2, 'deutsch'), sessionItemIds: [last.id] }),
    )!.item;
    expect(atLevel2.niveau).toBe(2);
    const atLevel3 = pickNext(
      input({ mastery: masteryFor(LSA, 3, 'deutsch'), sessionItemIds: [last.id] }),
    )!.item;
    expect(atLevel3.niveau).toBe(2);
    const atLevel1 = pickNext(input({ sessionItemIds: [last.id] }))!.item;
    expect(atLevel1.niveau).toBe(1);
  });

  it('lets a due review wait until the running text is done', () => {
    const due = [review(igelItems[0]!.id)];
    const shown = biberItems.slice(0, 2).map((i) => i.id);
    const during = pickNext(
      input({ sessionItemIds: shown, recentItemIds: shown, dueReviews: due }),
    );
    expect(during?.source).toBe('practice');
    expect(textOf(during!.item.id)).toBe(biberText.id);

    const all = biberItems.map((i) => i.id);
    const after = pickNext(input({ sessionItemIds: all, recentItemIds: all, dueReviews: due }));
    expect(after).toMatchObject({ source: 'review', item: { id: igelItems[0]!.id } });
  });

  it('repeats items of the running text even when they are among the last 20 (decision 2026-10-16)', () => {
    // Yesterday the whole Biber text was done; today's round started with one of its items again.
    const yesterday = biberItems.map((i) => i.id);
    const today = [biberItems[0]!.id];
    const picked = pickNext(
      input({ recentItemIds: [...yesterday, ...today], sessionItemIds: today }),
    );
    expect(textOf(picked!.item.id)).toBe(biberText.id);
    expect(yesterday).toContain(picked!.item.id);

    // Without the running text the last 20 count as before: an unseen Igel item comes.
    const plain = pickNext(input({ recentItemIds: [...yesterday, ...today], sessionItemIds: [] }));
    expect(textOf(plain!.item.id)).not.toBe(biberText.id);
  });

  it('does not change anything for items without a text', () => {
    const pool = makePool('mathe');
    const base = {
      fach: 'mathe' as const,
      bereich: 'zahlen-operationen' as const,
      mastery: masteryFor('zahlen-operationen', 2),
      pool,
    };
    const recent = pool
      .filter((i) => i.bereich === 'zahlen-operationen')
      .slice(0, 3)
      .map((i) => i.id);
    expect(pickNext(input({ ...base, recentItemIds: recent, sessionItemIds: recent }))).toEqual(
      pickNext(input({ ...base, recentItemIds: recent, sessionItemIds: [] })),
    );
  });
});
