// Fehlerkiste (PRODUCT.md §5.4, ARCHITECTURE.md §5): a wrong answer comes back after 1 day,
// a correct review moves it to stage 2 (+3 days), a second correct review finishes it.

import type { Correctness } from '../evaluation';
import type { ReviewEntry } from '../learner';

const DAY_MS = 24 * 60 * 60 * 1000;
export const REVIEW_INTERVAL_DAYS = { 1: 1, 2: 3 } as const;

function addDays(iso: string, days: number): string {
  return new Date(Date.parse(iso) + days * DAY_MS).toISOString();
}

export function enqueueReview(learnerId: string, itemId: string, now: string): ReviewEntry {
  return { learnerId, itemId, stage: 1, dueAt: addDays(now, REVIEW_INTERVAL_DAYS[1]) };
}

/** Only a fully correct answer advances; a self-rated 0.5 counts as "noch nicht". */
export function onReviewResult(entry: ReviewEntry, correct: Correctness, now: string): ReviewEntry {
  if (entry.stage === 'done') return entry;
  if (correct !== true) return { ...entry, dueAt: addDays(now, REVIEW_INTERVAL_DAYS[1]) };
  if (entry.stage === 1)
    return { ...entry, stage: 2, dueAt: addDays(now, REVIEW_INTERVAL_DAYS[2]) };
  return { ...entry, stage: 'done', dueAt: now };
}

/**
 * Due from the start of the due day in the device's local time, so an item answered
 * wrong at 18:00 is available the next afternoon as well.
 */
export function isReviewDue(entry: ReviewEntry, now: string): boolean {
  if (entry.stage === 'done') return false;
  const dueDay = new Date(entry.dueAt);
  dueDay.setHours(0, 0, 0, 0);
  return dueDay.getTime() <= Date.parse(now);
}
