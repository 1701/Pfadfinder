import { describe, expect, it } from 'vitest';
import { FORMATS } from '../../../src/domain/content';
import { answerSchemaByFormat, parseAnswer } from '../../../src/domain/evaluation';

describe('answer schemas', () => {
  it('exist for every format', () => {
    expect(Object.keys(answerSchemaByFormat).sort()).toEqual([...FORMATS].sort());
  });

  it.each<[string, unknown]>([
    ['single-choice', { optionId: 'a' }],
    ['multi-choice', { optionIds: ['a', 'c'] }],
    ['number-input', { value: 7603 }],
    ['match', { pairs: [['l1', 'r3']] }],
    ['order', { orderedIds: ['b', 'a'] }],
    ['cloze-select', { gaps: { '1': 'kalt' } }],
    ['mark-in-text', { indices: [1, 4] }],
    ['find-error', { errorIds: ['w2'] }],
    ['short-answer', { text: 'Nein.', rating: 0.5 }],
    ['segment-text', { boundaries: [1, 2, 4] }],
  ])('accepts a valid %s answer', (format, answer) => {
    expect(parseAnswer(format as (typeof FORMATS)[number], answer).success).toBe(true);
  });

  it.each<[string, unknown]>([
    ['single-choice', { optionIds: ['a'] }],
    ['multi-choice', { optionIds: 'a' }],
    ['number-input', { value: '7603' }],
    ['match', { pairs: [['l1']] }],
    ['order', { orderedIds: [1, 2] }],
    ['cloze-select', { gaps: { '1': 3 } }],
    ['mark-in-text', { indices: [-1] }],
    ['find-error', { errorIds: ['w2'], extra: true }],
    ['short-answer', { rating: 0.7 }],
    ['segment-text', { boundaries: [1.5] }],
  ])('rejects an invalid %s answer', (format, answer) => {
    expect(parseAnswer(format as (typeof FORMATS)[number], answer).success).toBe(false);
  });
});
