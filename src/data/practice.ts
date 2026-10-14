// Application service for the practice mode: load from the repositories, call the pure domain
// functions, save the result. No decisions are made here (ARCHITECTURE.md §1).

import type { Bereich, ContentLoader, Fach, Format, Item } from '../domain/content';
import type { Learner, ReviewEntry, Session } from '../domain/learner';
import { initialMastery, type MasteryState } from '../domain/mastery';
import {
  closeSession,
  planSessionStart,
  recordPracticeAnswer,
  startPracticeSession,
  type PracticeAnswerResult,
  type PracticeSource,
} from '../domain/practice';
import {
  MIN_ITEMS_FOR_PRACTICE,
  pickNext,
  practiceableItems,
  reviewDueCutoff,
} from '../domain/scheduler';
import { todayProgress, type TodayProgress } from '../domain/progress';
import type { Repositories } from './repos';

export interface PracticeDeps {
  repos: Repositories;
  content: Pick<ContentLoader, 'loadItems'>;
  /** Current time as ISO string. */
  now: () => string;
  newId: () => string;
  /** Formats with a registered renderer; other items are never served. */
  formats: readonly Format[];
}

export interface PracticeContext {
  learnerId: string;
  fach: Fach;
  bereich: Bereich;
  /** Practiceable items of the Bereich. */
  pool: Item[];
  session: Session;
  mastery: MasteryState;
  reviewsInSession: number;
}

export interface PracticeItem {
  item: Item;
  source: PracticeSource;
  /** How often the learner has answered this item before; seeds the option order. */
  attemptIndex: number;
}

/** The first learner on this device; created without a name on the very first start. */
export async function ensureLearner(deps: PracticeDeps): Promise<Learner> {
  const { repos } = deps;
  return repos.transaction(async () => {
    const [existing] = await repos.learners.list();
    if (existing) return existing;
    const learner: Learner = {
      id: deps.newId(),
      createdAt: deps.now(),
      settings: { readAloud: true, bundesland: 'BW' },
    };
    await repos.learners.put(learner);
    await repos.collectibles.put({ learnerId: learner.id, unlocked: [] });
    return learner;
  });
}

/**
 * Continues today's unfinished session of this Bereich ("Pause" keeps the progress) and closes
 * open sessions of earlier days (planSessionStart). A new session is only stored with its first
 * answer, so leaving before answering leaves nothing behind.
 * Returns null when the Bereich has fewer than MIN_ITEMS_FOR_PRACTICE practiceable items.
 */
export async function startPractice(
  deps: PracticeDeps,
  learnerId: string,
  fach: Fach,
  bereich: Bereich,
): Promise<PracticeContext | null> {
  const { repos } = deps;
  const pool = practiceableItems(await deps.content.loadItems(fach, bereich), deps.formats);
  if (pool.length < MIN_ITEMS_FOR_PRACTICE) return null;

  const now = deps.now();
  const mastery =
    (await repos.mastery.get(learnerId, bereich)) ?? initialMastery(learnerId, bereich, now);

  const sessions = await repos.sessions.listByLearner(learnerId);
  const openAttemptIds = sessions.filter((s) => !s.endedAt).flatMap((s) => s.attemptIds);
  const attempts = await Promise.all(openAttemptIds.map((id) => repos.attempts.get(id)));
  const attemptsById = new Map(attempts.flatMap((a) => (a ? [[a.id, a] as const] : [])));
  const plan = planSessionStart({ sessions, attempts: attemptsById, bereich, now });

  if (plan.close.length > 0) {
    await repos.transaction(async () => {
      for (const session of plan.close) await repos.sessions.put(session);
    });
  }
  if (plan.resume) {
    const reviewsInSession = plan.resume.attemptIds.filter(
      (id) => attempts.find((a) => a?.id === id)?.mode === 'review',
    ).length;
    return { learnerId, fach, bereich, pool, session: plan.resume, mastery, reviewsInSession };
  }

  const session = startPracticeSession(deps.newId(), learnerId, now);
  return { learnerId, fach, bereich, pool, session, mastery, reviewsInSession: 0 };
}

/**
 * "Neu anfangen": ends the open session without an Abschluss and starts a new round of
 * SESSION_GOAL items. Attempts, mastery, Fehlerkiste and Entdeckungen stay as they are, so
 * today's Fundstücke do not go back. The new session is stored with its first answer.
 */
export async function restartPractice(
  deps: PracticeDeps,
  ctx: PracticeContext,
): Promise<PracticeContext> {
  const now = deps.now();
  // A session without answers was never stored and has nothing to end.
  if (ctx.session.attemptIds.length > 0) {
    await deps.repos.sessions.put(closeSession(ctx.session, now));
  }
  const session = startPracticeSession(deps.newId(), ctx.learnerId, now);
  return { ...ctx, session, reviewsInSession: 0 };
}

export async function pickPracticeItem(
  deps: PracticeDeps,
  ctx: PracticeContext,
): Promise<PracticeItem | null> {
  const { repos } = deps;
  const now = deps.now();
  const attempts = await repos.attempts.listByBereich(ctx.learnerId, ctx.bereich);
  const dueReviews = await repos.reviews.listDueBefore(ctx.learnerId, reviewDueCutoff(now));

  const picked = pickNext({
    fach: ctx.fach,
    bereich: ctx.bereich,
    mastery: ctx.mastery,
    pool: ctx.pool,
    recentItemIds: attempts.map((a) => a.itemId),
    dueReviews,
    reviewsInSession: ctx.reviewsInSession,
    now,
    seed: `${ctx.session.id}#${ctx.session.attemptIds.length}`,
  });
  if (!picked) return null;

  const attemptIndex = attempts.filter((a) => a.itemId === picked.item.id).length;
  return { item: picked.item, source: picked.source, attemptIndex };
}

/** Entdeckungen are only ever added (PRODUCT.md §6: keine Abzüge). */
export async function addDiscovery(
  repos: Repositories,
  learnerId: string,
  id: string,
): Promise<void> {
  const collectibles = (await repos.collectibles.get(learnerId)) ?? { learnerId, unlocked: [] };
  if (collectibles.unlocked.includes(id)) return;
  await repos.collectibles.put({ ...collectibles, unlocked: [...collectibles.unlocked, id] });
}

/** Tagesziel of the learner (todayProgress), for the Abschluss screen. */
export async function loadTodayProgress(
  deps: Pick<PracticeDeps, 'repos' | 'now'>,
  learnerId: string,
): Promise<TodayProgress> {
  return todayProgress(await deps.repos.attempts.listByLearner(learnerId), deps.now());
}

export interface SubmitResult {
  ctx: PracticeContext;
  result: PracticeAnswerResult;
}

/** Evaluates the answer and stores attempt, mastery, Fehlerkiste entry and session together. */
export async function submitPracticeAnswer(
  deps: PracticeDeps,
  ctx: PracticeContext,
  current: { item: Item; source: PracticeSource; shownAt: string },
  answer: unknown,
): Promise<SubmitResult> {
  const { repos } = deps;
  const now = deps.now();
  const review: ReviewEntry | undefined = await repos.reviews.get(ctx.learnerId, current.item.id);

  const result = recordPracticeAnswer({
    session: ctx.session,
    item: current.item,
    answer,
    mastery: ctx.mastery,
    review,
    source: current.source,
    attemptId: deps.newId(),
    now,
    durationMs: Date.parse(now) - Date.parse(current.shownAt),
  });

  await repos.transaction(async () => {
    await repos.attempts.put(result.attempt);
    await repos.mastery.put(result.mastery);
    if (result.review) await repos.reviews.put(result.review);
    await repos.sessions.put(result.session);
    if (result.discovered) await addDiscovery(repos, ctx.learnerId, result.discovered);
  });

  return {
    result,
    ctx: {
      ...ctx,
      session: result.session,
      mastery: result.mastery,
      reviewsInSession: ctx.reviewsInSession + (current.source === 'review' ? 1 : 0),
    },
  };
}
