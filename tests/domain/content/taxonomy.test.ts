import { describe, expect, it } from 'vitest';
import {
  BEREICHE,
  BEREICHE_BY_FACH,
  FAECHER,
  PROBETEST_REQUIRED_BEREICHE,
} from '../../../src/domain/content';

describe('PROBETEST_REQUIRED_BEREICHE (CONTENT_SCHEMA §6, 1.0.22, Deutsch 1.0.26)', () => {
  it('lists Bereiche of its own Fach only, Mathe all of them', () => {
    for (const fach of FAECHER) {
      for (const bereich of PROBETEST_REQUIRED_BEREICHE[fach]) {
        expect(BEREICHE_BY_FACH[fach] as readonly string[]).toContain(bereich);
      }
    }
    expect(PROBETEST_REQUIRED_BEREICHE.mathe).toEqual(BEREICHE_BY_FACH.mathe);
  });

  it('leaves out exactly lesen-literarisch: a new Bereich needs a decision here', () => {
    const required = FAECHER.flatMap((f) => PROBETEST_REQUIRED_BEREICHE[f] as readonly string[]);
    expect(BEREICHE.filter((b) => !required.includes(b))).toEqual(['lesen-literarisch']);
  });

  it('requires sprache-untersuchen in Deutsch since the Probetests were mixed anew (1.0.26)', () => {
    expect(PROBETEST_REQUIRED_BEREICHE.deutsch).toEqual([
      'lesen-sachtext',
      'rs-laut-buchstabe',
      'rs-strategien',
      'sprache-untersuchen',
    ]);
  });
});
