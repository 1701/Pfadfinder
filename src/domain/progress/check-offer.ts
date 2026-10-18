// When the map offers the Einstiegscheck (PRODUCT.md §5.4): once per Fach, voluntary, only
// while the Fach has no mastery state at all and at least two practiceable Bereiche; at most one
// offer a day, and only before the day's first Fundstück.
// Zod-free on purpose: the start page computes this.

import { FAECHER, fachOfBereich, type Bereich, type Fach } from '../content/taxonomy';
import type { Session } from '../learner/model';
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

/** "Später" on the offer: stored on this device (no learner exists before an answer). */
export interface PostponedOffer {
  fach: Fach;
  /** When "Später" was tapped. */
  at: string;
}

type CheckSession = Pick<Session, 'mode' | 'endedAt'>;

/**
 * One offer a day (PRODUCT.md §5.4, 2026-10-18): an offer is one new thing a day, an Einstieg a
 * whole session. So "Später" for any Fach and a finished Einstieg both spend the day's offer; the
 * next Fach comes the next day. A left Einstieg stores nothing and spends nothing. The day ends
 * at local midnight, the same boundary as continuing a practice session (planSessionStart).
 * While a round that began before midnight goes on, its day counts too (`day` = practiceDay).
 */
export function offerSpentToday({
  offers,
  sessions = [],
  now,
  day = now,
}: {
  offers: readonly Pick<PostponedOffer, 'at'>[];
  sessions?: readonly CheckSession[];
  now: string;
  day?: string;
}): boolean {
  const today = (at: string) => isSameLocalDay(at, now) || isSameLocalDay(at, day);
  return (
    offers.some((o) => today(o.at)) ||
    sessions.some((s) => s.mode === 'check' && s.endedAt !== undefined && today(s.endedAt))
  );
}

/**
 * The Fach the map offers now, or null. Only while today has no Fundstück: the Tagesziel line is
 * never replaced by an offer (it could only say "0 von 10"), and a reached goal rests the offer
 * until the next day.
 */
export function mapOffer({
  practiceable,
  mastery,
  todayCount,
  spent,
}: {
  practiceable: readonly Bereich[];
  mastery: readonly Pick<MasteryState, 'fach'>[];
  todayCount: number;
  spent: boolean;
}): Fach | null {
  if (spent || todayCount > 0) return null;
  return checkOfferFach(practiceable, mastery);
}
