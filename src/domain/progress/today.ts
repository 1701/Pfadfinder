// Tagesziel (PRODUCT.md §6): 10 Fundstücke a day. Shown on the map and on the Abschluss screen,
// so both always tell the same number.

import type { Attempt } from '../learner/model';
import { isSameLocalDay } from '../time';

/** 10 Fundstücke = 10 answered items; also the length of a practice session. */
export const DAILY_GOAL = 10;

export interface TodayProgress {
  /** Fundstücke today, at most DAILY_GOAL: more practice is not a higher score. */
  count: number;
  goal: number;
  reached: boolean;
}

/**
 * Practice and Fehlerkiste answers of the local calendar day of `now`. Einstiegscheck and
 * Probetest are measurements, not Fundstücke.
 */
export function todayProgress(
  attempts: readonly Pick<Attempt, 'mode' | 'at'>[],
  now: string,
): TodayProgress {
  const found = attempts.filter(
    (a) => (a.mode === 'practice' || a.mode === 'review') && isSameLocalDay(a.at, now),
  ).length;
  const count = Math.min(found, DAILY_GOAL);
  return { count, goal: DAILY_GOAL, reached: count >= DAILY_GOAL };
}
