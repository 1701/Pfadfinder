// The sweep fixture for the match sum rule (task 15) measures what it claims: exact sums, cards
// within 35/52, the fixed prompt and feedback, the skew, beside t-sach-901.

import { describe, expect, it } from 'vitest';
import type { Item } from '../../src/domain/content';
import { sachtext } from './items';
import {
  CARD_LIMITS,
  FEEDBACK_LENGTHS,
  SWEEP_FEEDBACK_MATCH,
  feedbackText,
  SWEEP_FEEDBACK,
  SWEEP_MATCH,
  SWEEP_PROMPT,
  SWEEP_SUMS,
  cardLengths,
  cardText,
} from './sweep-match';

type Match = Extract<Item, { format: 'match' }>;
const cards = (item: Item) => {
  const { left, right } = (item as Match).payload;
  return { left: left.map((c) => c.text), right: right.map((c) => c.text) };
};
const sum = (texts: string[]) => texts.reduce((n, t) => n + t.length, 0);

describe('sweep fixture match (task 15)', () => {
  it('covers 3 and 4 pairs × 9 sums × even/skew, plus 5 pairs at 80', () => {
    expect(SWEEP_MATCH).toHaveLength(2 * SWEEP_SUMS.length * 2 + 1);
    expect(SWEEP_MATCH.at(-1)).toMatchObject({ pairs: 5, sum: 80, split: 'even' });
    expect(new Set(SWEEP_MATCH.map((p) => p.item.id)).size).toBe(SWEEP_MATCH.length);
    expect(SWEEP_MATCH[0]!.item.id).toBe('d-lsa-2-960');
  });

  it('has exactly the sum of the point, one distractor and cards within 35/52', () => {
    for (const { item, pairs, sum: wanted } of SWEEP_MATCH) {
      const { left, right } = cards(item);
      expect(left, item.id).toHaveLength(pairs);
      expect(right, item.id).toHaveLength(pairs + 1);
      expect(sum([...left, ...right]), item.id).toBe(wanted);
      expect(new Set([...left, ...right]).size, `${item.id}: card texts unique`).toBe(
        left.length + right.length,
      );
      expect(Math.max(...left.map((t) => t.length)), item.id).toBeLessThanOrEqual(CARD_LIMITS.left);
      expect(Math.max(...right.map((t) => t.length)), item.id).toBeLessThanOrEqual(
        CARD_LIMITS.right,
      );
    }
  });

  it('even: all cards within one character; skew: every right card about twice every left', () => {
    for (const { item, split } of SWEEP_MATCH) {
      const lengths = [...cards(item).left, ...cards(item).right].map((t) => t.length);
      const { left, right } = cards(item);
      if (split === 'even') {
        expect(Math.max(...lengths) - Math.min(...lengths), item.id).toBeLessThanOrEqual(1);
      } else {
        const ratio = sum(right) / right.length / (sum(left) / left.length);
        expect(ratio, item.id).toBeGreaterThan(1.8);
        expect(ratio, item.id).toBeLessThan(2.2);
      }
    }
  });

  it('keeps prompt (74) and feedback (195 = longest match feedback in content) fixed', () => {
    expect(SWEEP_PROMPT).toHaveLength(74);
    expect(SWEEP_FEEDBACK.incorrect.length + SWEEP_FEEDBACK.misconception.length).toBe(195);
    for (const { item } of SWEEP_MATCH) {
      expect(item.prompt).toBe(SWEEP_PROMPT);
      expect(item.feedback).toEqual(SWEEP_FEEDBACK);
      expect(item.stimulus?.textRef).toBe(sachtext.id);
    }
  });

  it('builds card texts of the exact length from words', () => {
    for (let length = 2; length <= CARD_LIMITS.right; length++) {
      for (const start of [0, 3, 17]) {
        const text = cardText(length, start);
        expect(text, `${length}/${start}`).toHaveLength(length);
        expect(text).not.toMatch(/\s{2}|^\s|\s$/);
      }
    }
    expect(cardLengths(3, 80, 'skew')).toEqual({ left: [7, 7, 7], right: [15, 15, 15, 14] });
  });
});

describe('sweep fixture match, feedback length (task 15, second sweep)', () => {
  it('covers 3 and 4 pairs × sum 100 and 140 × five feedback lengths, ids d-lsa-3-960…979', () => {
    expect(SWEEP_FEEDBACK_MATCH).toHaveLength(2 * 2 * FEEDBACK_LENGTHS.length);
    expect(SWEEP_FEEDBACK_MATCH.map((p) => p.item.id)).toEqual(
      Array.from({ length: 20 }, (_, i) => `d-lsa-3-${960 + i}`),
    );
  });

  it('has the feedback length of the point, about 45/55, and the cards of the first sweep', () => {
    for (const { item, pairs, sum: wanted, split, feedback } of SWEEP_FEEDBACK_MATCH) {
      const { incorrect, misconception = '' } = item.feedback;
      expect(incorrect.length + misconception.length, item.id).toBe(feedback);
      expect(incorrect.length / feedback, item.id).toBeGreaterThan(0.4);
      expect(incorrect.length / feedback, item.id).toBeLessThan(0.5);
      expect(item.prompt).toBe(SWEEP_PROMPT);
      const { left, right } = cards(item);
      expect(sum([...left, ...right]), item.id).toBe(wanted);
      const twin = SWEEP_MATCH.find(
        (p) => p.pairs === pairs && p.sum === wanted && p.split === split,
      );
      expect(cards(item), item.id).toEqual(cards(twin!.item));
    }
  });

  it('builds feedback of the exact length, ending with a full stop', () => {
    for (let length = 30; length <= 110; length++) {
      const text = feedbackText(
        length,
        'Lies jeden Satz links noch einmal. Suche danach im Text die Stelle.',
      );
      expect(text, String(length)).toHaveLength(length);
      expect(text.endsWith('.')).toBe(true);
    }
  });
});
