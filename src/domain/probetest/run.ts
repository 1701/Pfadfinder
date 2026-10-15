// A Probetest run as pure functions (ARCHITECTURE.md §5). While it runs, only the run changes
// (drafts, time per item, position); the store saves it after every change. When it ends,
// every answered item becomes an Attempt with mode "probetest". Such attempts never touch
// mastery, Fehlerkiste or Tagesziel (PRODUCT.md §5.5): nothing here calls those modules.
// A short answer has no attempt until it is rated while looking through the run, because a
// stored short-answer attempt carries its rating.

import type { Item, Probetest } from '../content';
import { evaluate, parseAnswer, type SelfRating } from '../evaluation';
import type { Attempt, ProbetestEndReason, ProbetestRun } from '../learner';
import { scoreRun } from './score';

export interface StartRunInput {
  probetest: Probetest;
  learnerId: string;
  runId: string;
  now: string;
  /** Earlier attempts of the learner (any mode): they fix the option order of each item. */
  priorAttempts: readonly Pick<Attempt, 'itemId'>[];
}

export function startRun(input: StartRunInput): ProbetestRun {
  const ids = new Set(input.probetest.itemIds);
  const attemptIndex: Record<string, number> = {};
  for (const id of ids) attemptIndex[id] = 0;
  for (const a of input.priorAttempts) {
    if (ids.has(a.itemId)) attemptIndex[a.itemId] = (attemptIndex[a.itemId] ?? 0) + 1;
  }
  return {
    id: input.runId,
    learnerId: input.learnerId,
    probetestId: input.probetest.id,
    startedAt: input.now,
    status: 'running',
    currentIndex: 0,
    answers: {},
    itemMs: {},
    attemptIndex,
    ratings: {},
    attemptIds: [],
  };
}

function assertRunning(run: ProbetestRun): void {
  if (run.status !== 'running') throw new Error(`Probetest ${run.id} läuft nicht mehr`);
}

/** null removes the draft (e.g. "3," on the number pad is no answer yet). */
export function withDraft(run: ProbetestRun, itemId: string, draft: unknown): ProbetestRun {
  assertRunning(run);
  const { [itemId]: _old, ...answers } = run.answers;
  return { ...run, answers: draft === null ? answers : { ...answers, [itemId]: draft } };
}

export function withTime(run: ProbetestRun, itemId: string, ms: number): ProbetestRun {
  assertRunning(run);
  const add = Math.max(0, Math.round(ms));
  if (add === 0) return run;
  return { ...run, itemMs: { ...run.itemMs, [itemId]: (run.itemMs[itemId] ?? 0) + add } };
}

export function withIndex(run: ProbetestRun, index: number): ProbetestRun {
  assertRunning(run);
  return { ...run, currentIndex: index };
}

export interface RunChange {
  run: ProbetestRun;
  /** New attempts to store together with the run. */
  attempts: Attempt[];
}

function probetestAttempt(
  run: ProbetestRun,
  item: Item,
  answer: unknown,
  correct: Attempt['correct'],
  id: string,
  now: string,
): Attempt {
  return {
    id,
    learnerId: run.learnerId,
    itemId: item.id,
    fach: item.fach,
    bereich: item.bereich,
    niveau: item.niveau,
    format: item.format,
    correct,
    answer,
    durationMs: run.itemMs[item.id] ?? 0,
    mode: 'probetest',
    at: now,
  };
}

export interface FinishRunInput {
  run: ProbetestRun;
  /** The items of the test in test order. */
  items: readonly Item[];
  reason: ProbetestEndReason;
  now: string;
  newId: () => string;
}

/**
 * Ends a running run. submit/time give a result; leave/expired abort without one. Either way
 * the answered items (except short answers) are kept as attempts.
 */
export function finishRun(input: FinishRunInput): RunChange {
  const { run, items, reason, now } = input;
  assertRunning(run);
  const attempts: Attempt[] = [];
  for (const item of items) {
    if (item.format === 'short-answer') continue;
    const parsed = parseAnswer(item.format, run.answers[item.id]);
    if (!parsed.success) continue;
    const { correct } = evaluate(item, parsed.data);
    attempts.push(probetestAttempt(run, item, parsed.data, correct, input.newId(), now));
  }
  const submitted = reason === 'submit' || reason === 'time';
  const ended: ProbetestRun = {
    ...run,
    status: submitted ? 'submitted' : 'aborted',
    endedAt: now,
    endReason: reason,
    attemptIds: [...run.attemptIds, ...attempts.map((a) => a.id)],
  };
  if (submitted) ended.result = scoreRun(items, ended);
  return { run: ended, attempts };
}

export interface RateInput {
  run: ProbetestRun;
  items: readonly Item[];
  itemId: string;
  rating: SelfRating;
  now: string;
  newId: () => string;
}

/**
 * The self-rating of an entered short answer in a submitted run, given once (also later, when
 * the child comes back via "Auswertung ansehen"). Null when there is nothing to rate.
 */
export function rateShortAnswer(input: RateInput): RunChange | null {
  const { run, items, itemId, rating, now } = input;
  const item = items.find((i) => i.id === itemId);
  if (run.status !== 'submitted' || !item || item.format !== 'short-answer') return null;
  if (run.ratings[itemId] !== undefined) return null;
  const text = (run.answers[itemId] as { text?: unknown } | undefined)?.text;
  if (typeof text !== 'string' || text.trim() === '') return null;

  const answer = { text, rating };
  const { correct } = evaluate(item, answer);
  const attempt = probetestAttempt(run, item, answer, correct, input.newId(), now);
  const rated: ProbetestRun = {
    ...run,
    ratings: { ...run.ratings, [itemId]: rating },
    attemptIds: [...run.attemptIds, attempt.id],
  };
  rated.result = scoreRun(items, rated);
  return { run: rated, attempts: [attempt] };
}
