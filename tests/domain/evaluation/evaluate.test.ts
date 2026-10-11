import { describe, expect, it } from 'vitest';
import { correctnessScore, evaluate } from '../../../src/domain/evaluation';
import {
  clozeSelect,
  findError,
  markInText,
  match,
  multiChoice,
  numberInput,
  order,
  shortAnswer,
  singleChoice,
} from '../../fixtures/items';

describe('single-choice', () => {
  it('is correct when the option id matches', () => {
    expect(evaluate(singleChoice, { optionId: 'a' })).toEqual({
      correct: true,
      detail: { format: 'single-choice', chosenOptionId: 'a' },
    });
  });

  it('is not correct for a distractor and reports which one was chosen', () => {
    expect(evaluate(singleChoice, { optionId: 'd' })).toEqual({
      correct: false,
      detail: { format: 'single-choice', chosenOptionId: 'd' },
    });
  });

  it('edge: empty or mistyped id is not correct', () => {
    expect(evaluate(singleChoice, { optionId: '' }).correct).toBe(false);
    expect(evaluate(singleChoice, { optionId: 'A' }).correct).toBe(false);
  });
});

describe('multi-choice', () => {
  it('is correct for the identical set, independent of order and duplicates', () => {
    expect(evaluate(multiChoice, { optionIds: ['d', 'a', 'c'] }).correct).toBe(true);
    expect(evaluate(multiChoice, { optionIds: ['a', 'c', 'd', 'a'] }).correct).toBe(true);
  });

  it('is not correct with an extra option and reports it', () => {
    expect(evaluate(multiChoice, { optionIds: ['a', 'b', 'c', 'd'] })).toEqual({
      correct: false,
      detail: { format: 'multi-choice', missing: [], extra: ['b'] },
    });
  });

  it('edge: empty selection, partial selection and mistyped id are not correct', () => {
    expect(evaluate(multiChoice, { optionIds: [] }).detail).toEqual({
      format: 'multi-choice',
      missing: ['a', 'c', 'd'],
      extra: [],
    });
    expect(evaluate(multiChoice, { optionIds: ['a', 'c'] }).correct).toBe(false);
    expect(evaluate(multiChoice, { optionIds: ['a', 'c', 'dd'] }).detail).toEqual({
      format: 'multi-choice',
      missing: ['d'],
      extra: ['dd'],
    });
  });
});

describe('number-input', () => {
  it('is correct for the exact value', () => {
    expect(evaluate(numberInput, { value: 7603 })).toEqual({
      correct: true,
      detail: { format: 'number-input', given: 7603, expected: 7603, tolerance: 0 },
    });
  });

  it('is not correct for a typical slip (forgotten carry)', () => {
    expect(evaluate(numberInput, { value: 6503 }).correct).toBe(false);
  });

  it('edge: tolerance boundary is inclusive, float noise is ignored', () => {
    const estimate = { ...numberInput, solution: { value: 7600, tolerance: 100 } };
    expect(evaluate(estimate, { value: 7700 }).correct).toBe(true);
    expect(evaluate(estimate, { value: 7500 }).correct).toBe(true);
    expect(evaluate(estimate, { value: 7701 }).correct).toBe(false);
    const decimal = {
      ...numberInput,
      payload: { maxDigits: 3, allowDecimal: true },
      solution: { value: 0.3 },
    };
    expect(evaluate(decimal, { value: 0.1 + 0.2 }).correct).toBe(true);
  });

  it('edge: NaN is never correct', () => {
    expect(evaluate(numberInput, { value: Number.NaN }).correct).toBe(false);
  });
});

describe('match', () => {
  const solution = match.solution.pairs;

  it('is correct when all pairs match, in any order', () => {
    expect(evaluate(match, { pairs: [...solution].reverse() })).toEqual({
      correct: true,
      detail: { format: 'match', wrongLeftIds: [], usedDistractorIds: [] },
    });
  });

  it('is not correct when a pair is swapped', () => {
    const result = evaluate(match, {
      pairs: [
        ['l1', 'r3'],
        ['l2', 'r2'],
        ['l3', 'r1'],
      ],
    });
    expect(result.correct).toBe(false);
    expect(result.detail).toEqual({
      format: 'match',
      wrongLeftIds: ['l2', 'l3'],
      usedDistractorIds: [],
    });
  });

  it('is not correct when the distractor is used', () => {
    const result = evaluate(match, {
      pairs: [
        ['l1', 'r4'],
        ['l2', 'r1'],
        ['l3', 'r2'],
      ],
    });
    expect(result.correct).toBe(false);
    expect(result.detail).toEqual({
      format: 'match',
      wrongLeftIds: ['l1'],
      usedDistractorIds: ['r4'],
    });
  });

  it('is not correct when all right pairs are given plus an extra distractor pair', () => {
    expect(evaluate(match, { pairs: [...solution, ['l1', 'r4']] }).correct).toBe(false);
  });

  it('edge: empty, partial and mistyped ids are not correct', () => {
    expect(evaluate(match, { pairs: [] }).detail).toEqual({
      format: 'match',
      wrongLeftIds: ['l1', 'l2', 'l3'],
      usedDistractorIds: [],
    });
    expect(evaluate(match, { pairs: solution.slice(0, 2) }).correct).toBe(false);
    expect(
      evaluate(match, {
        pairs: [
          ['l1', 'r3'],
          ['l2', 'r1'],
          ['L3', 'r2'],
        ],
      }).detail,
    ).toEqual({ format: 'match', wrongLeftIds: ['l3'], usedDistractorIds: [] });
  });
});

describe('order', () => {
  it('is correct for the identical order', () => {
    expect(evaluate(order, { orderedIds: ['b', 'd', 'a', 'c'] })).toEqual({
      correct: true,
      detail: { format: 'order', wrongPositions: [] },
    });
  });

  it('is not correct when two neighbours are swapped', () => {
    expect(evaluate(order, { orderedIds: ['d', 'b', 'a', 'c'] }).detail).toEqual({
      format: 'order',
      wrongPositions: [0, 1],
    });
  });

  it('edge: empty, partial and mistyped ids are not correct', () => {
    expect(evaluate(order, { orderedIds: [] }).detail).toEqual({
      format: 'order',
      wrongPositions: [0, 1, 2, 3],
    });
    expect(evaluate(order, { orderedIds: ['b', 'd', 'a'] }).detail).toEqual({
      format: 'order',
      wrongPositions: [3],
    });
    expect(evaluate(order, { orderedIds: ['b', 'd', 'a', 'c', 'x'] }).correct).toBe(false);
    expect(evaluate(order, { orderedIds: ['b', 'd', 'a', 'C'] }).correct).toBe(false);
  });
});

describe('cloze-select', () => {
  it('is correct when every gap is right', () => {
    expect(evaluate(clozeSelect, { gaps: { '1': 'kalt', '2': 'Hund' } })).toEqual({
      correct: true,
      detail: { format: 'cloze-select', wrongGapKeys: [] },
    });
  });

  it('is not correct when one gap is wrong', () => {
    expect(evaluate(clozeSelect, { gaps: { '1': 'kalt', '2': 'Hunt' } }).detail).toEqual({
      format: 'cloze-select',
      wrongGapKeys: ['2'],
    });
  });

  it('edge: empty, partial and mistyped gap key are not correct', () => {
    expect(evaluate(clozeSelect, { gaps: {} }).detail).toEqual({
      format: 'cloze-select',
      wrongGapKeys: ['1', '2'],
    });
    expect(evaluate(clozeSelect, { gaps: { '1': 'kalt' } }).correct).toBe(false);
    expect(evaluate(clozeSelect, { gaps: { '01': 'kalt', '2': 'Hund' } }).detail).toEqual({
      format: 'cloze-select',
      wrongGapKeys: ['1'],
    });
  });
});

describe('mark-in-text', () => {
  it('is correct for the identical index set in any order', () => {
    expect(evaluate(markInText, { indices: [6, 1, 4] })).toEqual({
      correct: true,
      detail: { format: 'mark-in-text', missing: [], extra: [] },
    });
  });

  it('is not correct when a non-noun is marked', () => {
    expect(evaluate(markInText, { indices: [0, 1, 4, 6] }).detail).toEqual({
      format: 'mark-in-text',
      missing: [],
      extra: [0],
    });
  });

  it('edge: empty and partial selections are not correct', () => {
    expect(evaluate(markInText, { indices: [] }).correct).toBe(false);
    expect(evaluate(markInText, { indices: [1, 4] }).detail).toEqual({
      format: 'mark-in-text',
      missing: [6],
      extra: [],
    });
  });
});

describe('find-error', () => {
  it('is correct for the identical error set and passes corrections through', () => {
    expect(evaluate(findError, { errorIds: ['w2'] })).toEqual({
      correct: true,
      detail: { format: 'find-error', missing: [], extra: [], corrections: { w2: 'Samstag' } },
    });
  });

  it('is not correct when another word is tapped', () => {
    expect(evaluate(findError, { errorIds: ['w1'] }).detail).toMatchObject({
      missing: ['w2'],
      extra: ['w1'],
    });
  });

  it('edge: empty, extra and mistyped ids are not correct', () => {
    expect(evaluate(findError, { errorIds: [] }).correct).toBe(false);
    expect(evaluate(findError, { errorIds: ['w2', 'w6'] }).correct).toBe(false);
    expect(evaluate(findError, { errorIds: ['W2'] }).correct).toBe(false);
  });
});

describe('short-answer', () => {
  it('"getroffen" counts as correct', () => {
    expect(evaluate(shortAnswer, { text: 'Nein, die 6 ist möglich.', rating: 1 })).toEqual({
      correct: true,
      detail: { format: 'short-answer', rating: 1 },
    });
  });

  it('"nein" counts as not correct', () => {
    expect(evaluate(shortAnswer, { rating: 0 }).correct).toBe(false);
  });

  it('edge: "teils" counts as 0.5, also with empty text', () => {
    expect(evaluate(shortAnswer, { text: '', rating: 0.5 }).correct).toBe(0.5);
  });
});

describe('correctnessScore', () => {
  it('maps true/0.5/false to 1/0.5/0', () => {
    expect([true, 0.5, false].map((c) => correctnessScore(c as boolean | 0.5))).toEqual([
      1, 0.5, 0,
    ]);
  });
});
