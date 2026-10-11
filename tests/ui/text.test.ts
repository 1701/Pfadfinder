import { describe, expect, it } from 'vitest';
import { BEREICHE, FAECHER } from '../../src/domain/content';
import { formatGermanNumber, groupDraft, toDraft } from '../../src/ui/formats/number-format';
import { BEREICH_NAME, FACH_NAME } from '../../src/ui/text/bereiche';
import { keepNumbersTogether } from '../../src/ui/text/numbers';

const NB = '\u00a0';

describe('child-facing names', () => {
  it('exist for every Fach and Bereich, short and without English', () => {
    for (const fach of FAECHER) expect(FACH_NAME[fach]).toBeTruthy();
    for (const bereich of BEREICHE) {
      expect(BEREICH_NAME[bereich]).toBeTruthy();
      expect(BEREICH_NAME[bereich].length).toBeLessThanOrEqual(24);
    }
  });
});

describe('numbers on screen', () => {
  it('keeps digit groups on one line', () => {
    expect(keepNumbersTogether('Rechne aus: 4 735 + 2 868')).toBe(
      `Rechne aus: 4${NB}735 + 2${NB}868`,
    );
    expect(keepNumbersTogether('von 0 bis 10 000.')).toBe(`von 0 bis 10${NB}000.`);
    expect(keepNumbersTogether('3 Reihen mit je 24 Plätzen')).toBe('3 Reihen mit je 24 Plätzen');
    expect(keepNumbersTogether('1 000 000')).toBe(`1${NB}000${NB}000`);
  });

  it('formats numbers the German way', () => {
    expect(formatGermanNumber(7603)).toBe(`7${NB}603`);
    expect(formatGermanNumber(1234567.25)).toBe(`1${NB}234${NB}567,25`);
    expect(formatGermanNumber(57)).toBe('57');
    expect(groupDraft('12345,')).toBe(`12${NB}345,`);
    expect(groupDraft('0,5')).toBe('0,5');
    expect(toDraft(2.5)).toBe('2,5');
  });
});
