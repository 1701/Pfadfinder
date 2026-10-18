// One practice step as a pure function (ARCHITECTURE.md §5 "Üben"): answer → Attempt →
// mastery → Fehlerkiste → session. The data layer only loads, calls this and saves the result.

import type { Bereich, Item } from '../content';
import { evaluate, parseAnswer, type EvaluationResult } from '../evaluation';
import type { Attempt, ReviewEntry, Session } from '../learner';
import { updateMastery, type MasteryState, type MasteryTransition } from '../mastery';
import { completedEtappe, DAILY_GOAL, etappeId, lastActivity } from '../progress';
import { enqueueReview, onReviewResult } from '../scheduler';
import { isSameLocalDay } from '../time';

export { isSameLocalDay, lastActivity };

/** A session ends with the Tagesziel: 10 Fundstücke = 10 answered items (PRODUCT.md §6). */
export const SESSION_GOAL = DAILY_GOAL;

export type PracticeSource = 'review' | 'practice';

export function startPracticeSession(id: string, learnerId: string, startedAt: string): Session {
  return { id, learnerId, mode: 'practice', startedAt, attemptIds: [], goalReached: false };
}

/**
 * Ends an open session without its goal: a session of an earlier day (planSessionStart) or one
 * the child leaves with "Neu anfangen". Its attempts stay; there is no Abschluss for it.
 */
export function closeSession(session: Session, now: string): Session {
  if (session.endedAt !== undefined) throw new Error(`Session ${session.id} is already finished`);
  return { ...session, endedAt: now, goalReached: false };
}

export interface SessionStartInput {
  /** All sessions of the learner, any order. */
  sessions: readonly Session[];
  /** Bereich and time of each stored attempt of the open sessions. */
  attempts: ReadonlyMap<string, Pick<Attempt, 'bereich' | 'at'>>;
  bereich: Bereich;
  now: string;
}

export interface SessionStartPlan {
  /** The session to continue, or null for a new one. */
  resume: Session | null;
  /** Open sessions from an earlier day, already closed (endedAt = now, goal not reached). */
  close: Session[];
}

/**
 * "Pause" keeps today's progress, but a new day starts fresh: open practice sessions whose last
 * answer was on an earlier local day are closed; the most recently active open session of today
 * whose answers all belong to this Bereich is continued. Sessions without answers are never
 * stored, so they never count.
 */
export function planSessionStart(input: SessionStartInput): SessionStartPlan {
  const { attempts, bereich, now } = input;
  const open = input.sessions
    .filter((s) => s.mode === 'practice' && s.endedAt === undefined)
    .map((session) => ({ session, last: lastActivity(session, attempts) }));
  const close = open
    .filter(({ last }) => !isSameLocalDay(last, now))
    .map(({ session }) => closeSession(session, now));
  const resume =
    open
      .filter(
        ({ session, last }) =>
          isSameLocalDay(last, now) &&
          session.attemptIds.length > 0 &&
          session.attemptIds.every((id) => attempts.get(id)?.bereich === bereich),
      )
      .sort((a, b) => b.last.localeCompare(a.last))[0]?.session ?? null;
  return { resume, close };
}

export interface PracticeAnswerInput {
  session: Session;
  item: Item;
  /** Must match the answer schema of the item's format. */
  answer: unknown;
  mastery: MasteryState;
  /** The learner's current Fehlerkiste entry for this item, if any. */
  review: ReviewEntry | undefined;
  /** Where pickNext took the item from. */
  source: PracticeSource;
  attemptId: string;
  now: string;
  durationMs: number;
}

export interface PracticeAnswerResult {
  attempt: Attempt;
  evaluation: EvaluationResult;
  mastery: MasteryState;
  transition: MasteryTransition;
  /** Fehlerkiste entry to store; undefined when nothing changes. */
  review: ReviewEntry | undefined;
  session: Session;
  /** The session reached its goal with this answer. */
  finished: boolean;
  /** Entdeckung for an Etappe completed with this answer (Collectibles.unlocked); never removed. */
  discovered: string | undefined;
}

/**
 * Review items move along the Fehlerkiste (onReviewResult). A practice item that is not fully
 * correct goes (back) into the Fehlerkiste at stage 1, replacing any existing entry.
 */
export function recordPracticeAnswer(input: PracticeAnswerInput): PracticeAnswerResult {
  const { session, item, mastery, review, source, now } = input;
  if (session.endedAt !== undefined) throw new Error(`Session ${session.id} is already finished`);

  const parsed = parseAnswer(item.format, input.answer);
  if (!parsed.success) throw new Error(`Answer does not match format ${item.format}`);
  const evaluation: EvaluationResult = evaluate(item, parsed.data);

  const attempt: Attempt = {
    id: input.attemptId,
    learnerId: session.learnerId,
    itemId: item.id,
    fach: item.fach,
    bereich: item.bereich,
    niveau: item.niveau,
    format: item.format,
    correct: evaluation.correct,
    answer: parsed.data,
    durationMs: Math.max(0, Math.round(input.durationMs)),
    mode: source,
    at: now,
  };

  const update = updateMastery(mastery, {
    fach: item.fach,
    bereich: item.bereich,
    correct: evaluation.correct,
    mode: source,
    at: now,
  });

  let nextReview: ReviewEntry | undefined;
  if (source === 'review' && review) nextReview = onReviewResult(review, evaluation.correct, now);
  else if (evaluation.correct !== true) nextReview = enqueueReview(session.learnerId, item.id, now);

  const etappe = completedEtappe(update.transition, mastery.niveau);

  const attemptIds = [...session.attemptIds, attempt.id];
  const finished = attemptIds.length >= SESSION_GOAL;
  const nextSession: Session = {
    ...session,
    attemptIds,
    goalReached: finished,
    ...(finished && { endedAt: now }),
  };

  return {
    attempt,
    evaluation,
    mastery: update.state,
    transition: update.transition,
    review: nextReview,
    session: nextSession,
    finished,
    discovered: etappe === undefined ? undefined : etappeId(item.bereich, etappe),
  };
}
