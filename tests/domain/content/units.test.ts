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

// segment-text (1.0.25): gap k lies between word k and word k + 1 of splitUnits(text, "word").
describe('splitUnits for segment-text gaps', () => {
  const groups = (text: string, boundaries: number[]) => {
    const words = splitUnits(text, 'word');
    const out: string[][] = [[]];
    words.forEach((w, k) => {
      out[out.length - 1]!.push(w);
      if (boundaries.includes(k)) out.push([]);
    });
    return out.map((g) => g.join(' '));
  };

  it('gap indices cut the sentence into its Satzglieder', () => {
    expect(groups('Am Nachmittag spielt der kleine Hund mit seinem roten Ball.', [1, 2, 5])).toEqual([
      'Am Nachmittag',
      'spielt',
      'der kleine Hund',
      'mit seinem roten Ball.',
    ]);
  });

  it('n words have n − 1 gaps; the period stays with the last word, no gap after it', () => {
    expect(splitUnits('Mia liest ein Buch.', 'word')).toEqual(['Mia', 'liest', 'ein', 'Buch.']);
  });

  it('a hyphenated word is one unit; a dash between spaces is a unit of its own (known limit)', () => {
    expect(splitUnits('Das Fußball-Spiel beginnt.', 'word')).toEqual(['Das', 'Fußball-Spiel', 'beginnt.']);
    expect(splitUnits('Ben – mein Freund – lacht.', 'word')).toEqual(['Ben', '–', 'mein', 'Freund', '–', 'lacht.']);
  });
});
