import { describe, expect, it } from 'vitest';
import { readingStep } from '../../../src/domain/practice';
import { biberItems, biberText } from '../../fixtures/lesen';
import { singleChoice } from '../../fixtures/items';

const [first, second] = biberItems as [(typeof biberItems)[0], (typeof biberItems)[0]];

describe('readingStep', () => {
  it('shows the reading screen before the first item of a text in a round', () => {
    expect(readingStep(first, 'practice', new Set())).toBe('read-first');
  });

  it('shows the text beside every further item of that text, without the reading screen', () => {
    expect(readingStep(second, 'practice', new Set([biberText.id]))).toBe('with-text');
  });

  it('shows a Fehlerkiste repetition with its text, never with the reading screen', () => {
    expect(readingStep(first, 'review', new Set())).toBe('with-text');
  });

  it('has nothing to show for an item without a text', () => {
    expect(readingStep(singleChoice, 'practice', new Set())).toBe('none');
  });
});
