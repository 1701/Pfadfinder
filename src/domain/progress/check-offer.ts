// When the map offers the Einstiegscheck (PRODUCT.md §5.4): once per Fach, voluntary, only
// while the Fach has no mastery state at all and at least two practiceable Bereiche.
// Zod-free on purpose: the start page computes this.

import { FAECHER, fachOfBereich, type Bereich, type Fach } from '../content/taxonomy';
import type { MasteryState } from '../mastery/mastery';

/** With a single Bereich the check would only repeat what the first practice round finds out. */
export const CHECK_MIN_BEREICHE = 2;

export function isCheckOffered(
  fach: Fach,
  practiceable: readonly Bereich[],
  mastery: readonly Pick<MasteryState, 'fach'>[],
): boolean {
  return (
    !mastery.some((m) => m.fach === fach) &&
    practiceable.filter((b) => fachOfBereich(b) === fach).length >= CHECK_MIN_BEREICHE
  );
}

/** The Fach the map offers the check for: the first one in taxonomy order, or null. */
export function checkOfferFach(
  practiceable: readonly Bereich[],
  mastery: readonly Pick<MasteryState, 'fach'>[],
): Fach | null {
  return FAECHER.find((fach) => isCheckOffered(fach, practiceable, mastery)) ?? null;
}
