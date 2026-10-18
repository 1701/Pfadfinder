// Tagesziel (PRODUCT.md §6): 10 Fundstücke a day. Shown on the map and on the Abschluss screen,
// so both always tell the same number. A round that runs past midnight belongs to the day it
// began (task 10): its answers count for that day, and so does "Später" while it runs.

import type { Attempt, Session } from '../learner/model';
import { isSameLocalDay } from '../time';

/** 10 Fundstücke = 10 answered items; also the length of a practice session. */
export const DAILY_GOAL = 10;

export interface TodayProgress {
  /** Fundstücke today, at most DAILY_GOAL: more practice is not a higher score. */
  count: number;
  goal: number;
  reached: boolean;
}

type RoundSession = Pick<Session, 'mode' | 'startedAt' | 'endedAt' | 'attemptIds'>;

/** Time of the session's newest stored answer; startedAt when none is known. */
export function lastActivity(
  session: Pick<Session, 'startedAt' | 'attemptIds'>,
  attempts: ReadonlyMap<string, Pick<Attempt, 'at'>>,
): string {
  return session.attemptIds.reduce((latest, id) => {
    const at = attempts.get(id)?.at;
    return at !== undefined && at > latest ? at : latest;
  }, session.startedAt);
}

/**
 * The time whose local day is "today" for the map: the start of an open practice round from an
 * earlier day that still goes on (its last answer was today, so planSessionStart continues it);
 * otherwise now. The most recently active round wins.
 */
export function practiceDay(
  sessions: readonly RoundSession[],
  attempts: ReadonlyMap<string, Pick<Attempt, 'at'>>,
  now: string,
): string {
  const running = sessions
    .filter((s) => s.mode === 'practice' && s.endedAt === undefined)
    .map((s) => ({ startedAt: s.startedAt, last: lastActivity(s, attempts) }))
    .filter(({ startedAt, last }) => isSameLocalDay(last, now) && !isSameLocalDay(startedAt, now))
    .sort((a, b) => b.last.localeCompare(a.last));
  return running[0]?.startedAt ?? now;
}

/**
 * Practice and Fehlerkiste answers of the local calendar day of `day`. An answer of a practice
 * round counts for the day the round began; one without a known round for its own time.
 * Einstiegscheck and Probetest are measurements, not Fundstücke.
 */
export function todayProgress(
  attempts: readonly (Pick<Attempt, 'mode' | 'at'> & { id?: string })[],
  day: string,
  sessions: readonly RoundSession[] = [],
): TodayProgress {
  const roundStart = new Map(
    sessions
      .filter((s) => s.mode === 'practice')
      .flatMap((s) => s.attemptIds.map((id) => [id, s.startedAt] as const)),
  );
  const found = attempts.filter(
    (a) =>
      (a.mode === 'practice' || a.mode === 'review') &&
      isSameLocalDay((a.id !== undefined && roundStart.get(a.id)) || a.at, day),
  ).length;
  const count = Math.min(found, DAILY_GOAL);
  return { count, goal: DAILY_GOAL, reached: count >= DAILY_GOAL };
}
