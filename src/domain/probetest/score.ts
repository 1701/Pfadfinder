// Probetest result (PRODUCT.md §5.4): solved of total per Bereich and overall. No percent, no
// grade. Teils and Noch nicht are not solved (no half ticks); an open item is not solved; an
// entered short answer is pending until the child rates it while looking through the run.

import type { Bereich, Item } from '../content';
import { evaluate, parseAnswer } from '../evaluation';
import type { ProbetestResult, ProbetestRun, ProbetestScore } from '../learner';

export type ItemOutcome = 'solved' | 'notSolved' | 'pending' | 'open';

/** Something to look at: short answers need text, every other format a valid answer. */
export function isAnswered(item: Item, draft: unknown): boolean {
  if (draft === null || draft === undefined) return false;
  if (item.format === 'short-answer') {
    const text = (draft as { text?: unknown }).text;
    return typeof text === 'string' && text.trim() !== '';
  }
  return parseAnswer(item.format, draft).success;
}

export function itemOutcome(
  item: Item,
  run: Pick<ProbetestRun, 'answers' | 'ratings'>,
): ItemOutcome {
  const draft = run.answers[item.id];
  if (!isAnswered(item, draft)) return 'open';
  if (item.format === 'short-answer') {
    const rating = run.ratings[item.id];
    if (rating === undefined) return 'pending';
    return rating === 1 ? 'solved' : 'notSolved';
  }
  const parsed = parseAnswer(item.format, draft);
  return parsed.success && evaluate(item, parsed.data).correct === true ? 'solved' : 'notSolved';
}

/** Bereiche in the order they first appear in the test. */
export function scoreRun(
  items: readonly Item[],
  run: Pick<ProbetestRun, 'answers' | 'ratings'>,
): ProbetestResult {
  const byBereich: Partial<Record<Bereich, ProbetestScore>> = {};
  const total: ProbetestScore = { solved: 0, total: 0, pending: 0 };
  for (const item of items) {
    const score = (byBereich[item.bereich] ??= { solved: 0, total: 0, pending: 0 });
    const outcome = itemOutcome(item, run);
    for (const s of [score, total]) {
      s.total += 1;
      if (outcome === 'solved') s.solved += 1;
      if (outcome === 'pending') s.pending += 1;
    }
  }
  return { byBereich, total };
}
