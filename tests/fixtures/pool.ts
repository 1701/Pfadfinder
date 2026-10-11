// Synthetic item pools for scheduler tests, built from the format fixtures. NOT app content.

import {
  BEREICHE_BY_FACH,
  type Bereich,
  type Fach,
  type Item,
  type Niveau,
} from '../../src/domain/content';
import type { MasteryState } from '../../src/domain/mastery';
import { cloneItem } from './builders';
import { multiChoice, numberInput, order, shortAnswer, singleChoice } from './items';

const BASES: Item[] = [singleChoice, numberInput, order, multiChoice, shortAnswer];

/** `perNiveau` items per niveau and Bereich; formats rotate through BASES. */
export function makePool(
  fach: Fach,
  perNiveau = 4,
  bereiche: readonly Bereich[] = BEREICHE_BY_FACH[fach],
): Item[] {
  const pool: Item[] = [];
  for (const bereich of bereiche) {
    for (const niveau of [1, 2, 3] as Niveau[]) {
      for (let n = 0; n < perNiveau; n++) {
        pool.push(cloneItem(BASES[n % BASES.length]!, bereich, niveau, 100 + n));
      }
    }
  }
  return pool;
}

export function item(bereich: Bereich, niveau: Niveau, n: number, base: Item = singleChoice): Item {
  return cloneItem(base, bereich, niveau, n);
}

export function masteryFor(bereich: Bereich, niveau: Niveau, fach: Fach = 'mathe'): MasteryState {
  return {
    learnerId: 'learner-1',
    fach,
    bereich,
    niveau,
    window: [],
    mastered: false,
    updatedAt: '2026-10-11T08:00:00.000Z',
  };
}
