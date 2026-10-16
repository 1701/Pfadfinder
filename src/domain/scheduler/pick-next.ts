// Item selection for the practice mode (ARCHITECTURE.md §5 "Üben").

import type { Bereich, Fach, Format, Item } from '../content';
import type { ReviewEntry } from '../learner';
import type { MasteryState } from '../mastery';
import { isReviewDue } from './review';
import { seededShuffle } from './shuffle';

export const RECENT_WINDOW = 20;
export const MAX_REVIEWS_PER_SESSION = 3;

export interface PickNextInput {
  fach: Fach;
  bereich: Bereich;
  mastery: MasteryState;
  /** All loaded items; filtered to fach/bereich and non-retired here. */
  pool: readonly Item[];
  /** Item ids seen before, oldest first, most recent last. */
  recentItemIds: readonly string[];
  /** Item ids of the current round (session), oldest first; keeps the items of a text together. */
  sessionItemIds?: readonly string[];
  /** Fehlerkiste entries of the learner; only due entries of this Bereich are used. */
  dueReviews: readonly ReviewEntry[];
  /** Reviews already shown in the current session (max. 3 per session). */
  reviewsInSession?: number;
  now: string;
  /** Makes the choice among equal candidates reproducible, e.g. sessionId + attempt count. */
  seed?: string;
}

export type PickNextResult =
  { source: 'review'; item: Item; review: ReviewEntry } | { source: 'practice'; item: Item } | null;

/**
 * Order: the running reading text → due reviews of this Bereich → items on the current niveau
 * not seen in the last 20 → niveau ±1 not seen → repetition allowed (never the very last item if
 * anything else exists). Within each step a different format than the last item is preferred.
 * Returns null only when the Bereich has no usable items ("Gebiet fertig für heute").
 *
 * Running text: when the last item of the round has a textRef, the items of that text not yet
 * shown in this round come first, before reviews and regardless of the last 20 (decision
 * 2026-10-16: a text is read once and then worked through). Only when none is left does the
 * round move on to another text or item.
 */
export function pickNext(input: PickNextInput): PickNextResult {
  const { fach, bereich, mastery, pool, recentItemIds, dueReviews, now } = input;
  if (mastery.fach !== fach || mastery.bereich !== bereich) {
    throw new Error(`Mastery ${mastery.fach}/${mastery.bereich} does not match ${fach}/${bereich}`);
  }

  const candidates = pool.filter(
    (i) => i.fach === fach && i.bereich === bereich && i.status !== 'retired',
  );
  if (candidates.length === 0) return null;

  const sameText = runningTextItems(candidates, input.sessionItemIds ?? []);
  if (sameText.length > 0) {
    return { source: 'practice', item: closestNiveau(sameText, mastery.niveau, input.seed ?? '') };
  }

  if ((input.reviewsInSession ?? 0) < MAX_REVIEWS_PER_SESSION) {
    const byId = new Map(candidates.map((i) => [i.id, i]));
    const due = dueReviews
      .filter((r) => r.learnerId === mastery.learnerId && byId.has(r.itemId) && isReviewDue(r, now))
      .sort((a, b) => a.dueAt.localeCompare(b.dueAt) || a.itemId.localeCompare(b.itemId));
    const first = due[0];
    if (first) return { source: 'review', item: byId.get(first.itemId) as Item, review: first };
  }

  const recent = new Set(recentItemIds.slice(-RECENT_WINDOW));
  const lastId = recentItemIds[recentItemIds.length - 1];
  const lastFormat = lastId === undefined ? undefined : pool.find((i) => i.id === lastId)?.format;
  const atLevel = (i: Item) => i.niveau === mastery.niveau;
  const nearLevel = (i: Item) => Math.abs(i.niveau - mastery.niveau) === 1;
  const notRecent = (i: Item) => !recent.has(i.id);
  const notLast = (i: Item) => i.id !== lastId;

  const steps: ((i: Item) => boolean)[] = [
    (i) => atLevel(i) && notRecent(i),
    (i) => nearLevel(i) && notRecent(i),
    (i) => atLevel(i) && notLast(i),
    (i) => nearLevel(i) && notLast(i),
    notLast,
    () => true,
  ];
  for (const step of steps) {
    const item = choose(candidates.filter(step), lastFormat, input.seed ?? '');
    if (item) return { source: 'practice', item };
  }
  return null;
}

function choose(items: Item[], lastFormat: Format | undefined, seed: string): Item | undefined {
  const otherFormat = items.filter((i) => i.format !== lastFormat);
  return seededShuffle(otherFormat.length > 0 ? otherFormat : items, seed)[0];
}

/** Items of the text the round is reading (textRef of its last item) not yet shown in it. */
function runningTextItems(candidates: readonly Item[], sessionItemIds: readonly string[]): Item[] {
  const lastId = sessionItemIds[sessionItemIds.length - 1];
  const textRef = candidates.find((i) => i.id === lastId)?.stimulus?.textRef;
  if (textRef === undefined) return [];
  const shown = new Set(sessionItemIds);
  return candidates.filter((i) => i.stimulus?.textRef === textRef && !shown.has(i.id));
}

/** Nearest to the learner's niveau, the easier one on a tie; seeded among equals. */
function closestNiveau(items: readonly Item[], niveau: number, seed: string): Item {
  const distance = (i: Item) => Math.abs(i.niveau - niveau);
  const best = Math.min(...items.map(distance));
  const nearest = items.filter((i) => distance(i) === best);
  const lowest = Math.min(...nearest.map((i) => i.niveau));
  return seededShuffle(
    nearest.filter((i) => i.niveau === lowest),
    seed,
  )[0] as Item;
}
