import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import type { Item, ItemOf } from '../../../src/domain/content';
import {
  clozeParts,
  presentedGapOptions,
  presentedMatch,
  presentedOptions,
  presentedOrder,
} from '../../../src/domain/presentation';
import { presentationSeed, seededShuffle } from '../../../src/domain/scheduler';
import { clozeSelect, match, multiChoice, order, singleChoice } from '../../fixtures/items';

const content: Item[] = ['mathe', 'deutsch'].flatMap((fach) =>
  readdirSync(`content/items/${fach}`).flatMap(
    (file) => JSON.parse(readFileSync(path.join('content/items', fach, file), 'utf8')) as Item[],
  ),
);
const active = <F extends Item['format']>(format: F) =>
  content.filter((i): i is ItemOf<F> => i.format === format && i.status !== 'retired');

describe('presentedOptions', () => {
  it('shuffles like single-choice always did (seed itemId#attemptIndex)', () => {
    for (const attempt of [0, 1, 2]) {
      expect(presentedOptions(singleChoice, attempt)).toEqual(
        seededShuffle(singleChoice.payload.options, presentationSeed(singleChoice.id, attempt)),
      );
    }
  });

  it('is deterministic per attempt and differs between attempts', () => {
    expect(presentedOptions(multiChoice, 3)).toEqual(presentedOptions(multiChoice, 3));
    const orders = new Set(
      [0, 1, 2, 3, 4, 5].map((a) =>
        presentedOptions(multiChoice, a)
          .map((o) => o.id)
          .join(''),
      ),
    );
    expect(orders.size).toBeGreaterThan(1);
  });

  it('keeps the order with keepOrder', () => {
    const kept = { ...multiChoice, payload: { ...multiChoice.payload, keepOrder: true } };
    for (const attempt of [0, 1, 2, 3]) {
      expect(presentedOptions(kept, attempt)).toEqual(multiChoice.payload.options);
    }
  });
});

describe('presentedMatch', () => {
  it('shuffles both columns and keeps every entry', () => {
    const { left, right } = presentedMatch(match, 0);
    expect([...left].sort((a, b) => a.id.localeCompare(b.id))).toEqual(match.payload.left);
    expect([...right].sort((a, b) => a.id.localeCompare(b.id))).toEqual(match.payload.right);
    expect(presentedMatch(match, 0)).toEqual(presentedMatch(match, 0));
  });
});

describe('presentedOrder', () => {
  it('is never the solution, for every real order item and many attempts', () => {
    const items = [order, ...active('order')];
    expect(items.length).toBeGreaterThan(1);
    for (const item of items) {
      for (let attempt = 0; attempt < 200; attempt++) {
        const ids = presentedOrder(item, attempt).map((e) => e.id);
        expect(ids).not.toEqual(item.solution.orderedIds);
        expect([...ids].sort()).toEqual([...item.solution.orderedIds].sort());
      }
    }
  });

  it('rotates a shuffle that came out solved by one place', () => {
    // Find an attempt whose plain shuffle is the solution, then check the rotation.
    const solved = Array.from({ length: 500 }, (_, a) => a).find((a) =>
      seededShuffle(order.payload.items, presentationSeed(order.id, a))
        .map((e) => e.id)
        .every((id, i) => id === order.solution.orderedIds[i]),
    );
    expect(solved).toBeDefined();
    const [first, ...rest] = order.solution.orderedIds;
    expect(presentedOrder(order, solved!).map((e) => e.id)).toEqual([...rest, first]);
  });
});

describe('presentedGapOptions', () => {
  it('shuffles the options of each gap and keeps them', () => {
    const options = presentedGapOptions(clozeSelect, 0);
    for (const gap of clozeSelect.payload.gaps) {
      expect([...(options[gap.key] ?? [])].sort()).toEqual([...gap.options].sort());
    }
  });
});

describe('clozeParts', () => {
  it('splits the template into text and numbered gaps', () => {
    expect(clozeParts('Im Winter ist es oft {1}. Der {2} spielt im Schnee.')).toEqual([
      { kind: 'text', text: 'Im Winter ist es oft ' },
      { kind: 'gap', key: '1', number: 1 },
      { kind: 'text', text: '. Der ' },
      { kind: 'gap', key: '2', number: 2 },
      { kind: 'text', text: ' spielt im Schnee.' },
    ]);
  });

  it('numbers gaps in reading order, whatever their keys', () => {
    expect(clozeParts('{b} und {a}').filter((p) => p.kind === 'gap')).toEqual([
      { kind: 'gap', key: 'b', number: 1 },
      { kind: 'gap', key: 'a', number: 2 },
    ]);
  });
});
