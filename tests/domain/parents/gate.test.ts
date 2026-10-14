import { describe, expect, it } from 'vitest';
import { gateQuestion, isGateAnswer } from '../../../src/domain/parents';

describe('Eltern question', () => {
  it('adds two two-digit numbers, at the edges too', () => {
    expect(gateQuestion(() => 0)).toEqual({ a: 10, b: 10 });
    expect(gateQuestion(() => 0.999999)).toEqual({ a: 99, b: 99 });
    const values = [0.5, 0.25];
    expect(gateQuestion(() => values.shift()!)).toEqual({ a: 55, b: 32 });
  });

  it('always draws numbers from 10 to 99', () => {
    for (let i = 0; i < 200; i++) {
      const { a, b } = gateQuestion();
      for (const n of [a, b]) {
        expect(Number.isInteger(n)).toBe(true);
        expect(n).toBeGreaterThanOrEqual(10);
        expect(n).toBeLessThanOrEqual(99);
      }
    }
  });

  it('accepts only the sum', () => {
    const q = { a: 47, b: 38 };
    expect(isGateAnswer(q, 85)).toBe(true);
    expect(isGateAnswer(q, 84)).toBe(false);
    expect(isGateAnswer(q, null)).toBe(false);
  });
});
