// Invented task types per Bereich (shape of content/typen.json, CONTENT_SCHEMA §1 since 1.0.27):
// two per Bereich, recognisable as fixtures. The real file is checked in tests/content-smoke.

import { BEREICHE, type AufgabenTypen } from '../../src/domain/content';

export const FIXTURE_TYPEN = Object.fromEntries(
  BEREICHE.map((bereich, i) => [bereich, [`Probetyp ${i + 1}a`, `Probetyp ${i + 1}b`]]),
) as unknown as AufgabenTypen;
