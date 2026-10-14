// Application service for the Einstiegscheck: load, call the pure domain functions, save.
// Answers stay in memory until the last one; then attempts, session, starting mastery and
// Entdeckungen are stored in one transaction. Leaving earlier leaves nothing behind
// (decision 2026-10-14: Pause = Abbruch).

import { BEREICHE_BY_FACH, type Fach, type Item } from '../domain/content';
import { completeCheck, recordCheckAnswer } from '../domain/check';
import type { Attempt } from '../domain/learner';
import type { MasteryState } from '../domain/mastery';
import { CHECK_MIN_BEREICHE } from '../domain/progress';
import {
  buildCheck,
  nextCheckItem,
  practiceableBereiche,
  practiceableItems,
  type CheckAnswer,
  type CheckPlan,
} from '../domain/scheduler';
import { addDiscovery, type PracticeDeps } from './practice';

export type CheckDeps = PracticeDeps;

export interface CheckContext {
  learnerId: string;
  fach: Fach;
  /** Id of the check session; also the seed of the plan, so a new start may serve other items. */
  sessionId: string;
  startedAt: string;
  plan: CheckPlan;
  answers: CheckAnswer[];
  attempts: Attempt[];
  /** Earlier answers per item id: seeds the option order. */
  seen: Readonly<Record<string, number>>;
}

export interface CheckQuestion {
  item: Item;
  attemptIndex: number;
  /** 0-based position and number of questions, for the progress. */
  index: number;
  total: number;
}

export interface CheckOutcome {
  /** Starting states of the checked Bereiche. */
  mastery: MasteryState[];
  /** All Entdeckungen of the learner after the check. */
  unlocked: string[];
}

/** Why there is no check: the journey in this Fach has begun, or it has too few Bereiche. */
export type CheckUnavailable = 'started' | 'empty';

/**
 * Prepares a check of the practiceable Bereiche of the Fach. Not available when the Fach
 * already has a mastery state, or fewer than CHECK_MIN_BEREICHE practiceable Bereiche.
 */
export async function startCheck(
  deps: CheckDeps,
  learnerId: string,
  fach: Fach,
): Promise<CheckContext | CheckUnavailable> {
  const { repos } = deps;
  const files = await Promise.all(
    BEREICHE_BY_FACH[fach].map((bereich) => deps.content.loadItems(fach, bereich)),
  );
  const pool = practiceableItems(files.flat(), deps.formats);
  const bereiche = practiceableBereiche(pool, deps.formats);
  const mastery = await repos.mastery.listByLearner(learnerId);
  if (mastery.some((m) => m.fach === fach)) return 'started';
  if (bereiche.length < CHECK_MIN_BEREICHE) return 'empty';

  const seen: Record<string, number> = {};
  for (const a of await repos.attempts.listByLearner(learnerId)) {
    seen[a.itemId] = (seen[a.itemId] ?? 0) + 1;
  }
  const sessionId = deps.newId();
  return {
    learnerId,
    fach,
    sessionId,
    startedAt: deps.now(),
    plan: buildCheck(fach, pool, { bereiche, seed: sessionId }),
    answers: [],
    attempts: [],
    seen,
  };
}

/** The question on screen now, or null when every question is answered. */
export function currentCheckQuestion(ctx: CheckContext): CheckQuestion | null {
  const next = nextCheckItem(ctx.plan, ctx.answers);
  if (!next) return null;
  return {
    item: next.item,
    attemptIndex: ctx.seen[next.item.id] ?? 0,
    index: next.slotIndex,
    total: next.total,
  };
}

/** Records an answer in memory; nothing is stored yet. */
export function answerCheck(
  deps: Pick<CheckDeps, 'now' | 'newId'>,
  ctx: CheckContext,
  current: { item: Item; shownAt: string },
  answer: unknown,
): CheckContext {
  const now = deps.now();
  const result = recordCheckAnswer({
    learnerId: ctx.learnerId,
    item: current.item,
    answer,
    attemptId: deps.newId(),
    now,
    durationMs: Date.parse(now) - Date.parse(current.shownAt),
  });
  return {
    ...ctx,
    answers: [...ctx.answers, result.answer],
    attempts: [...ctx.attempts, result.attempt],
  };
}

/**
 * Stores the finished check in one transaction. Null, and nothing written, when the Fach got a
 * mastery state in the meantime (e.g. practice in a second tab): the check runs once per Fach.
 */
export async function finishCheck(
  deps: CheckDeps,
  ctx: CheckContext,
): Promise<CheckOutcome | null> {
  const { repos } = deps;
  const done = completeCheck({
    learnerId: ctx.learnerId,
    fach: ctx.fach,
    sessionId: ctx.sessionId,
    startedAt: ctx.startedAt,
    attempts: ctx.attempts,
    now: deps.now(),
  });

  return repos.transaction(async () => {
    const existing = await repos.mastery.listByLearner(ctx.learnerId);
    if (existing.some((m) => m.fach === ctx.fach)) return null;
    for (const attempt of ctx.attempts) await repos.attempts.put(attempt);
    await repos.sessions.put(done.session);
    for (const state of done.mastery) await repos.mastery.put(state);
    for (const id of done.discovered) await addDiscovery(repos, ctx.learnerId, id);
    const collectibles = await repos.collectibles.get(ctx.learnerId);
    return { mastery: done.mastery, unlocked: collectibles?.unlocked ?? [] };
  });
}
