import { describe, expect, it } from 'vitest';
import { splitUnits } from '../../../src/domain/content';

describe('splitUnits', () => {
  it('splits words on whitespace and keeps punctuation attached', () => {
    expect(splitUnits('  Am Morgen packt   der Junge seinen Rucksack. ', 'word')).toEqual([
      'Am',
      'Morgen',
      'packt',
      'der',
      'Junge',
      'seinen',
      'Rucksack.',
    ]);
  });

  it('splits sentences after . ! ? and keeps closing quotes with the sentence', () => {
    expect(splitUnits('Mia ruft: „Komm her!“ Ben kommt. Ist das gut? Ja.', 'sentence')).toEqual([
      'Mia ruft: „Komm her!“',
      'Ben kommt.',
      'Ist das gut?',
      'Ja.',
    ]);
  });

  it('does not split inside numbers like 1,20 €', () => {
    expect(splitUnits('Ein Heft kostet 1,20 €. Mia kauft zwei.', 'sentence')).toHaveLength(2);
  });
});
