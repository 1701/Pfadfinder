import { describe, expect, it } from 'vitest';
import { createRng, presentationSeed, seededShuffle } from '../../../src/domain/scheduler';

describe('seededShuffle', () => {
  const items = ['a', 'b', 'c', 'd', 'e', 'f'];

  it('is reproducible for the same seed', () => {
    expect(seededShuffle(items, 'm-zo-1-001#0')).toEqual(seededShuffle(items, 'm-zo-1-001#0'));
  });

  it('gives different orders for different seeds', () => {
    const orders = new Set(
      Array.from({ length: 20 }, (_, i) => seededShuffle(items, `seed-${i}`).join('')),
    );
    expect(orders.size).toBeGreaterThan(15);
  });

  it('keeps all elements and does not mutate the input', () => {
    const input = [...items];
    const result = seededShuffle(input, 'x');
    expect(input).toEqual(items);
    expect([...result].sort()).toEqual(items);
  });

  it('handles empty and single-element arrays', () => {
    expect(seededShuffle([], 'x')).toEqual([]);
    expect(seededShuffle(['a'], 'x')).toEqual(['a']);
  });

  it('is roughly uniform: over 1 000 seeds each of 4 options leads in at least 15 % of runs', () => {
    const options = ['a', 'b', 'c', 'd'];
    const runs = 1000;
    const first = new Map<string, number>();
    const positions = options.map(() => new Map<string, number>());
    for (let i = 0; i < runs; i++) {
      const shuffled = seededShuffle(options, presentationSeed('m-zo-1-005', i));
      shuffled.forEach((o, pos) => positions[pos]!.set(o, (positions[pos]!.get(o) ?? 0) + 1));
      first.set(shuffled[0]!, (first.get(shuffled[0]!) ?? 0) + 1);
    }
    for (const option of options) expect(first.get(option)! / runs).toBeGreaterThanOrEqual(0.15);
    // Stronger: every option appears at every position in at least 15 % of runs.
    for (const pos of positions)
      for (const option of options) expect(pos.get(option)! / runs).toBeGreaterThanOrEqual(0.15);
  });
});

describe('createRng / presentationSeed', () => {
  it('yields numbers in [0, 1)', () => {
    const random = createRng('x');
    for (let i = 0; i < 1000; i++) {
      const v = random();
      expect(v).toBeGreaterThanOrEqual(0);
      expect(v).toBeLessThan(1);
    }
  });

  it('builds the seed from itemId and attemptIndex', () => {
    expect(presentationSeed('m-zo-1-001', 2)).toBe('m-zo-1-001#2');
  });
});
