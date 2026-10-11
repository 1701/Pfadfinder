import { describe, expect, it } from 'vitest';
import type { Item } from '../../../src/domain/content';
import {
  MIN_ITEMS_FOR_PRACTICE,
  practiceableBereiche,
  practiceableItems,
} from '../../../src/domain/scheduler';
import { item } from '../../fixtures/pool';
import { numberInput, order, singleChoice } from '../../fixtures/items';

const FORMATS = ['single-choice', 'number-input'] as const;

function items(bereich: Item['bereich'], count: number, base: Item): Item[] {
  return Array.from({ length: count }, (_, n) => item(bereich, 1, 100 + n, base));
}

describe('practiceableItems', () => {
  it('keeps only items with a renderer and drops retired ones', () => {
    const retired = { ...item('raum-form', 1, 1, singleChoice), status: 'retired' } as Item;
    const pool = [
      item('raum-form', 1, 2, singleChoice),
      item('raum-form', 1, 3, numberInput),
      item('raum-form', 1, 4, order),
      retired,
    ];
    expect(practiceableItems(pool, FORMATS).map((i) => i.id)).toEqual(['m-rf-1-002', 'm-rf-1-003']);
  });
});

describe('practiceableBereiche', () => {
  it(`opens a Bereich from ${MIN_ITEMS_FOR_PRACTICE} practiceable items on`, () => {
    const pool = [
      ...items('raum-form', MIN_ITEMS_FOR_PRACTICE, singleChoice),
      ...items('zahlen-operationen', MIN_ITEMS_FOR_PRACTICE - 1, numberInput),
    ];
    expect(practiceableBereiche(pool, FORMATS)).toEqual(['raum-form']);
  });

  it('does not count items without a renderer', () => {
    const pool = [
      ...items('daten-zufall', MIN_ITEMS_FOR_PRACTICE - 1, singleChoice),
      ...items('daten-zufall', 5, order).map((i, n) => ({ ...i, id: `m-dz-1-${500 + n}` }) as Item),
    ];
    expect(practiceableBereiche(pool, FORMATS)).toEqual([]);
    expect(practiceableBereiche(pool, [...FORMATS, 'order'])).toEqual(['daten-zufall']);
  });

  it('returns Bereiche in taxonomy order', () => {
    const pool = [
      ...items('rs-strategien', MIN_ITEMS_FOR_PRACTICE, singleChoice),
      ...items('zahlen-operationen', MIN_ITEMS_FOR_PRACTICE, singleChoice),
    ];
    expect(practiceableBereiche(pool, FORMATS)).toEqual(['zahlen-operationen', 'rs-strategien']);
  });
});
