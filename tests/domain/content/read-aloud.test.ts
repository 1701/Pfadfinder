import { describe, expect, it } from 'vitest';
import { readAloudText, speakable } from '../../../src/domain/content';
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

describe('speakable', () => {
  it('joins digit groups so a number is read as one number', () => {
    expect(speakable('Welche Zahl ist um 100 kleiner als 20 050?')).toBe(
      'Welche Zahl ist um 100 kleiner als 20050?',
    );
    expect(speakable('1 000 000 und 3 Reihen mit je 24')).toBe('1000000 und 3 Reihen mit je 24');
  });

  it('turns spaced operators into words', () => {
    expect(speakable('6 · 40 = 240 und 6 · 8 = 48')).toBe('6 mal 40 gleich 240 und 6 mal 8 gleich 48');
    expect(speakable('Rechne aus: 7 004 − 2 358')).toBe('Rechne aus: 7004 minus 2358');
    expect(speakable('80 : 4 = 20')).toBe('80 geteilt durch 4 gleich 20');
    expect(speakable('5 + 8 = 13')).toBe('5 plus 8 gleich 13');
  });

  it('leaves times, compounds and ranges alone', () => {
    expect(speakable('um 8:30 Uhr mit dem 20-Euro-Schein, 3–4 Sätze')).toBe(
      'um 8:30 Uhr mit dem 20-Euro-Schein, 3–4 Sätze',
    );
  });

  it('is applied to the fallback text, not to an authored readAloud', () => {
    expect(readAloudText({ prompt: 'Rechne aus: 84 : 4' })).toBe('Rechne aus: 84 geteilt durch 4');
    expect(readAloudText({ prompt: 'Rechne aus: 84 : 4', readAloud: 'Rechne 84 durch 4' })).toBe(
      'Rechne 84 durch 4',
    );
  });
});
