// Application service for the Probetest: load, call the pure domain functions, save.
// The run is stored with every change while it runs (the store calls saveRun), so a reload or
// an iOS kill loses nothing. Ending a run or rating a short answer writes run and attempts in
// one transaction. Mastery, Fehlerkiste and Tagesziel are never touched (PRODUCT.md §5.5).

import type { ContentLoader, Item, Probetest } from '../domain/content';
import type { SelfRating } from '../domain/evaluation';
import type { ProbetestEndReason, ProbetestRun } from '../domain/learner';
import {
  deadlineOf,
  finishRun,
  introState,
  onOpen,
  rateShortAnswer,
  startRun,
  type ProbetestIntro,
  type RunChange,
} from '../domain/probetest';
import type { PracticeDeps } from './practice';
import type { Repositories } from './repos';

export interface ProbetestDeps extends Pick<PracticeDeps, 'repos' | 'now' | 'newId'> {
  content: Pick<ContentLoader, 'loadItems' | 'loadProbetest'>;
}

export interface ProbetestContext {
  probetest: Probetest;
  /** The items of the test, in test order. */
  items: Item[];
}

const PROBETEST_ID = /^(mathe|deutsch)-\d{2}$/;

/** Null when there is no such Probetest (or an item of it is missing). */
export async function loadProbetestContext(
  deps: Pick<ProbetestDeps, 'content'>,
  id: string,
): Promise<ProbetestContext | null> {
  if (!PROBETEST_ID.test(id)) return null;
  let probetest: Probetest;
  try {
    probetest = await deps.content.loadProbetest(id);
  } catch {
    return null;
  }
  const bereiche = Object.keys(probetest.bereichMix) as (keyof Probetest['bereichMix'])[];
  const files = await Promise.all(bereiche.map((b) => deps.content.loadItems(probetest.fach, b)));
  const byId = new Map(files.flat().map((item) => [item.id, item]));
  const items = probetest.itemIds.map((itemId) => byId.get(itemId));
  if (items.some((item) => item === undefined)) return null;
  return { probetest, items: items as Item[] };
}

export function runDeadline(ctx: ProbetestContext, run: Pick<ProbetestRun, 'startedAt'>): number {
  return deadlineOf(run, ctx.probetest.durationMinutes);
}

async function store(repos: Repositories, change: RunChange): Promise<ProbetestRun> {
  for (const attempt of change.attempts) await repos.attempts.put(attempt);
  await repos.probetestRuns.put(change.run);
  return change.run;
}

async function runsOf(repos: Repositories, learnerId: string, probetestId: string) {
  const runs = await repos.probetestRuns.listByLearner(learnerId);
  return runs.filter((r) => r.probetestId === probetestId);
}

export interface OpenedProbetest {
  intro: ProbetestIntro;
  /** The running run to continue with, if its time is not up. */
  resumed: ProbetestRun | null;
}

/**
 * On opening the Probetest (also after a reload or a return from the background): a running run
 * with time left continues; one whose time ran out while the app was away is aborted without a
 * result, and the intro shows as usual.
 */
export async function openProbetest(
  deps: ProbetestDeps,
  learnerId: string,
  ctx: ProbetestContext,
): Promise<OpenedProbetest> {
  const { repos } = deps;
  const id = ctx.probetest.id;
  return repos.transaction(async () => {
    const intro = introState(await runsOf(repos, learnerId, id), id);
    const running = intro.running;
    if (!running) return { intro, resumed: null };
    const now = deps.now();
    if (onOpen(now, runDeadline(ctx, running)) === 'resume') return { intro, resumed: running };
    await store(
      repos,
      finishRun({ run: running, items: ctx.items, reason: 'expired', now, newId: deps.newId }),
    );
    return { intro: introState(await runsOf(repos, learnerId, id), id), resumed: null };
  });
}

/** Starts a run; if one is already running (second tab), that one continues: at most one. */
export async function beginRun(
  deps: ProbetestDeps,
  learnerId: string,
  ctx: ProbetestContext,
): Promise<ProbetestRun> {
  const { repos } = deps;
  return repos.transaction(async () => {
    const running = introState(
      await runsOf(repos, learnerId, ctx.probetest.id),
      ctx.probetest.id,
    ).running;
    if (running) return running;
    const run = startRun({
      probetest: ctx.probetest,
      learnerId,
      runId: deps.newId(),
      now: deps.now(),
      priorAttempts: await repos.attempts.listByLearner(learnerId),
    });
    await repos.probetestRuns.put(run);
    return run;
  });
}

export function saveRun(deps: Pick<ProbetestDeps, 'repos'>, run: ProbetestRun): Promise<void> {
  return deps.repos.probetestRuns.put(run);
}

/**
 * Ends the run with the drafts of `run`. If the stored run has ended meanwhile (e.g. in a second
 * tab), that one wins and nothing is written.
 */
export async function endRun(
  deps: ProbetestDeps,
  ctx: ProbetestContext,
  run: ProbetestRun,
  reason: ProbetestEndReason,
): Promise<ProbetestRun> {
  const { repos } = deps;
  return repos.transaction(async () => {
    const stored = await repos.probetestRuns.get(run.id);
    if (stored && stored.status !== 'running') return stored;
    const now = deps.now();
    return store(repos, finishRun({ run, items: ctx.items, reason, now, newId: deps.newId }));
  });
}

/** Self-rating of a short answer while looking through a submitted run. */
export async function rateRun(
  deps: ProbetestDeps,
  ctx: ProbetestContext,
  runId: string,
  itemId: string,
  rating: SelfRating,
): Promise<ProbetestRun | null> {
  const { repos } = deps;
  return repos.transaction(async () => {
    const run = await repos.probetestRuns.get(runId);
    if (!run) return null;
    const change = rateShortAnswer({
      run,
      items: ctx.items,
      itemId,
      rating,
      now: deps.now(),
      newId: deps.newId,
    });
    return change ? store(repos, change) : run;
  });
}
