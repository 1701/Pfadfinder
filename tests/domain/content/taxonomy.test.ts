import { describe, expect, it } from 'vitest';
import {
  BEREICHE,
  BEREICHE_BY_FACH,
  FAECHER,
  PROBETEST_REQUIRED_BEREICHE,
} from '../../../src/domain/content';

describe('PROBETEST_REQUIRED_BEREICHE (CONTENT_SCHEMA §6, 1.0.22)', () => {
  it('lists Bereiche of its own Fach only, Mathe all of them', () => {
    for (const fach of FAECHER) {
      for (const bereich of PROBETEST_REQUIRED_BEREICHE[fach]) {
        expect(BEREICHE_BY_FACH[fach] as readonly string[]).toContain(bereich);
      }
    }
    expect(PROBETEST_REQUIRED_BEREICHE.mathe).toEqual(BEREICHE_BY_FACH.mathe);
  });

  it('leaves out exactly sprache-untersuchen: a new Bereich needs a decision here', () => {
    const required = FAECHER.flatMap((f) => PROBETEST_REQUIRED_BEREICHE[f] as readonly string[]);
    expect(BEREICHE.filter((b) => !required.includes(b))).toEqual(['sprache-untersuchen']);
  });
});
