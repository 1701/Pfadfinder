import { describe, expect, it } from 'vitest';
import { readAloudText } from '../../../src/domain/content';
import { numberInput, singleChoice } from '../../fixtures/items';

describe('readAloudText', () => {
  it('prefers the readAloud variant of the item', () => {
    expect(readAloudText(numberInput)).toBe('Rechne aus: 4735 plus 2868');
  });

  it('reads stimulus text and prompt otherwise', () => {
    expect(readAloudText(singleChoice)).toBe(
      `${singleChoice.stimulus?.text} Wie viel Geld bekommt sie zurück?`,
    );
  });

  it('includes the image description and skips empty parts', () => {
    expect(
      readAloudText({
        prompt: 'Wie viele Ecken hat die Figur?',
        stimulus: { assetId: 'fig', assetAlt: 'Ein Sechseck.' },
      }),
    ).toBe('Ein Sechseck. Wie viele Ecken hat die Figur?');
    expect(readAloudText({ prompt: 'Nur die Frage.' })).toBe('Nur die Frage.');
  });
});
