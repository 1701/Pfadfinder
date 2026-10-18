// When the map offers the Einstiegscheck (PRODUCT.md §5.4): once per Fach, voluntary, only
// while the Fach has no mastery state at all and at least two practiceable Bereiche.
// Zod-free on purpose: the start page computes this.

import { FAECHER, fachOfBereich, type Bereich, type Fach } from '../content/taxonomy';
import type { MasteryState } from '../mastery/mastery';
import { isSameLocalDay } from '../time';

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

/** "Später" on the offer: the Fach rests on this device (no learner exists before an answer). */
export interface PostponedOffer {
  fach: Fach;
  /** When "Später" was tapped. */
  at: string;
}

/**
 * "Später" holds until the end of the local calendar day, the same day boundary as continuing a
 * practice session (planSessionStart): the next day the offer is back. While a round that began
 * before midnight goes on, its day counts too (`day` = practiceDay, task 10).
 */
export function postponedFaecher(
  offers: readonly PostponedOffer[],
  now: string,
  day: string = now,
): Fach[] {
  return offers
    .filter((o) => isSameLocalDay(o.at, now) || isSameLocalDay(o.at, day))
    .map((o) => o.fach);
}
