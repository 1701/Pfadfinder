import { describe, expect, it } from 'vitest';
import type { Item } from '../../src/domain/content';
import { remainingMinutes } from '../../src/domain/probetest';
import { todayProgress } from '../../src/domain/progress';
import { createContentLoader } from '../../src/content-runtime/loader';
import { createMemoryRepositories } from '../../src/data/memory/repos';
import { runDeadline, type ProbetestDeps } from '../../src/data/probetest';
import { createProbetestStore, type ProbetestStore } from '../../src/data/probetest-store';
import type { Repositories } from '../../src/data/repos';
import { previewAnswer } from '../../src/ui/dev/preview-answers';

const T0 = Date.parse('2026-10-15T08:00:00.000Z');
const MINUTE = 60_000;
const ID = 'mathe-01';
const SHORT = 11; // m-gm-3-002, the short answer of mathe-01

let lastId = 0;

/** A clock that only moves when told to. */
function setup(repos: Repositories = createMemoryRepositories(), clock = { t: T0 }) {
  const deps: ProbetestDeps = {
    repos,
    content: createContentLoader(),
    now: () => new Date(clock.t).toISOString(),
    newId: () => `id-${++lastId}`,
  };
  return { repos, clock, store: createProbetestStore(deps), reopen: () => setup(repos, clock) };
}

function draftFor(item: Item, correct = true): unknown {
  return item.format === 'short-answer'
    ? { text: 'Weil 1000 g ein Kilogramm sind.' }
    : previewAnswer(item, correct);
}

async function started(s = setup()) {
  await s.store.getState().open(ID);
  await s.store.getState().begin();
  return s;
}

function answerCurrent(store: ProbetestStore, correct = true) {
  const { context, index } = store.getState();
  store.getState().setAnswer(draftFor(context!.items[index]!, correct));
}

async function storedRun(repos: Repositories) {
  const learner = (await repos.learners.list())[0]!;
  const runs = await repos.probetestRuns.listByLearner(learner.id);
  return { learner, runs, run: runs.at(-1)! };
}

describe('probetest store: a run from start to result', () => {
  it('start → 3 items → overview → jump → submit with open items → result', async () => {
    const s = setup();
    await s.store.getState().open(ID);
    expect(s.store.getState()).toMatchObject({ status: 'intro', intro: { doneBefore: false } });
    await s.store.getState().begin();
    expect(s.store.getState()).toMatchObject({ status: 'answering', index: 0 });

    answerCurrent(s.store, true);
    s.store.getState().next();
    answerCurrent(s.store, false);
    s.store.getState().next();
    answerCurrent(s.store, true);
    s.store.getState().showOverview();
    s.store.getState().goTo(20);
    expect(s.store.getState()).toMatchObject({ status: 'answering', index: 20 });
    s.store.getState().back();
    expect(s.store.getState().index).toBe(19);
    s.store.getState().showOverview();

    await s.store.getState().askSubmit();
    expect(s.store.getState().status).toBe('confirmSubmit');
    s.store.getState().cancel();
    expect(s.store.getState().status).toBe('overview');
    await s.store.getState().askSubmit();
    await s.store.getState().submit();

    const state = s.store.getState();
    expect(state.status).toBe('result');
    // Open items count as not solved.
    expect(state.run?.result?.total).toEqual({ solved: 2, total: 24, pending: 0 });
    expect(state.run?.result?.byBereich['zahlen-operationen']).toEqual({
      solved: 2,
      total: 6,
      pending: 0,
    });

    const { run } = await storedRun(s.repos);
    expect(run).toMatchObject({ status: 'submitted', endReason: 'submit' });
    expect(run.attemptIds).toHaveLength(3);
  });

  it('"Weiter" on the last item opens the overview; all answered submits without asking', async () => {
    const s = await started();
    for (let i = 0; i < 24; i++) {
      answerCurrent(s.store);
      s.store.getState().next();
    }
    expect(s.store.getState().status).toBe('overview');
    await s.store.getState().askSubmit();
    expect(s.store.getState().status).toBe('result');
    // 23 auto-checked items solved, the short answer waits for its self-rating.
    expect(s.store.getState().run?.result?.total).toEqual({ solved: 23, total: 24, pending: 1 });
  });

  it('probetest attempts touch neither mastery nor Fehlerkiste nor Tagesziel', async () => {
    const s = await started();
    for (let i = 0; i < 24; i++) {
      answerCurrent(s.store, i % 2 === 0);
      s.store.getState().next();
    }
    await s.store.getState().askSubmit();
    s.store.getState().review(SHORT);
    await s.store.getState().rate(0);

    const { learner } = await storedRun(s.repos);
    const attempts = await s.repos.attempts.listByLearner(learner.id);
    expect(attempts).toHaveLength(24);
    expect(new Set(attempts.map((a) => a.mode))).toEqual(new Set(['probetest']));
    expect(await s.repos.mastery.listByLearner(learner.id)).toEqual([]);
    expect(await s.repos.reviews.listByLearner(learner.id)).toEqual([]);
    expect(todayProgress(attempts, new Date(s.clock.t).toISOString()).count).toBe(0);
  });
});

describe('probetest store: time', () => {
  it('runs on over a reload: same item, same answers, wall-clock time', async () => {
    const s = await started();
    answerCurrent(s.store);
    s.store.getState().next();
    answerCurrent(s.store);
    await s.store.getState().flush();

    s.clock.t += 10 * MINUTE;
    const after = s.reopen();
    await after.store.getState().open(ID);
    const state = after.store.getState();
    expect(state).toMatchObject({ status: 'answering', index: 1 });
    expect(Object.keys(state.run!.answers)).toHaveLength(2);
    const deadline = runDeadline(state.context!, state.run!);
    expect(remainingMinutes(new Date(s.clock.t).toISOString(), deadline)).toBe(35);
  });

  it('a run whose time is up on opening is aborted without a result; the intro shows', async () => {
    const s = await started();
    answerCurrent(s.store);
    await s.store.getState().flush();

    s.clock.t += 46 * MINUTE;
    const after = s.reopen();
    await after.store.getState().open(ID);
    expect(after.store.getState()).toMatchObject({
      status: 'intro',
      intro: { running: null, doneBefore: false, lastSubmitted: null },
    });
    const { run, learner } = await storedRun(s.repos);
    expect(run).toMatchObject({ status: 'aborted', endReason: 'expired' });
    expect(run.result).toBeUndefined();
    const attempts = await s.repos.attempts.listByLearner(learner.id);
    expect(attempts.map((a) => a.mode)).toEqual(['probetest']);
  });

  it('time running out in the foreground leads to the result', async () => {
    const s = await started();
    answerCurrent(s.store);
    s.clock.t += 44 * MINUTE;
    await s.store.getState().timeUp(true);
    expect(s.store.getState().status).toBe('answering'); // fired early: wait
    s.clock.t += MINUTE;
    await s.store.getState().timeUp(true);
    expect(s.store.getState()).toMatchObject({ status: 'result', run: { endReason: 'time' } });
    expect(s.store.getState().run?.result?.total.solved).toBe(1);
  });

  it('time running out while hidden aborts; so does coming back after it ran out', async () => {
    const hidden = await started();
    hidden.clock.t += 45 * MINUTE;
    await hidden.store.getState().timeUp(false);
    expect(hidden.store.getState().status).toBe('intro');
    expect((await storedRun(hidden.repos)).run).toMatchObject({
      status: 'aborted',
      endReason: 'expired',
    });

    const back = await started();
    await back.store.getState().checkTime();
    expect(back.store.getState().status).toBe('answering');
    back.clock.t += 50 * MINUTE;
    await back.store.getState().checkTime();
    expect(back.store.getState().status).toBe('intro');
    expect((await storedRun(back.repos)).run.result).toBeUndefined();
  });
});

describe('probetest store: leaving, second runs, one running run', () => {
  it('"Zur Karte" asks, then aborts: attempts stay, no result', async () => {
    const s = await started();
    answerCurrent(s.store);
    s.store.getState().showOverview();
    s.store.getState().askLeave();
    expect(s.store.getState().status).toBe('confirmLeave');
    await s.store.getState().leave();
    expect(s.store.getState().status).toBe('left');
    const { run, learner } = await storedRun(s.repos);
    expect(run).toMatchObject({ status: 'aborted', endReason: 'leave' });
    expect(run.result).toBeUndefined();
    expect(await s.repos.attempts.listByLearner(learner.id)).toHaveLength(1);
  });

  it('after an aborted run a new one is possible, without "schon gemacht"', async () => {
    const s = await started();
    s.store.getState().showOverview();
    s.store.getState().askLeave();
    await s.store.getState().leave();
    const firstId = (await storedRun(s.repos)).run.id;

    await s.store.getState().open(ID);
    expect(s.store.getState().intro).toMatchObject({ doneBefore: false, lastSubmitted: null });
    await s.store.getState().begin();
    expect(s.store.getState().run?.id).not.toBe(firstId);
    expect(s.store.getState().run?.status).toBe('running');
  });

  it('after a submitted run a second one is possible and the intro knows the first', async () => {
    const s = await started();
    s.store.getState().showOverview();
    await s.store.getState().askSubmit();
    await s.store.getState().submit();
    const first = (await storedRun(s.repos)).run;

    await s.store.getState().open(ID);
    expect(s.store.getState().intro).toMatchObject({
      doneBefore: true,
      lastSubmitted: { id: first.id },
    });
    await s.store.getState().begin();
    const { runs } = await storedRun(s.repos);
    expect(runs.map((r) => r.status)).toEqual(['submitted', 'running']);
  });

  it('at most one running run per Probetest: a second tab continues the same run', async () => {
    const tab1 = await started();
    const tab2 = tab1.reopen();
    await tab2.store.getState().open(ID);
    expect(tab2.store.getState().status).toBe('answering');
    expect(tab2.store.getState().run?.id).toBe(tab1.store.getState().run?.id);
    expect((await storedRun(tab1.repos)).runs).toHaveLength(1);
  });

  it('keeps the option order of each item over a reload (attemptIndex fixed at the start)', async () => {
    const s = setup();
    await s.store.getState().open(ID);
    const item = s.store.getState().context!.items[0]!;
    const learner = s.store.getState().learner!;
    await s.repos.attempts.put({
      id: 'earlier',
      learnerId: learner.id,
      itemId: item.id,
      fach: item.fach,
      bereich: item.bereich,
      niveau: item.niveau,
      format: item.format,
      correct: true,
      answer: previewAnswer(item, true),
      durationMs: 1000,
      mode: 'practice',
      at: new Date(T0 - MINUTE).toISOString(),
    });
    await s.store.getState().begin();
    expect(s.store.getState().run?.attemptIndex[item.id]).toBe(1);
    const after = s.reopen();
    await after.store.getState().open(ID);
    expect(after.store.getState().run?.attemptIndex[item.id]).toBe(1);
  });

  it('saves every change in order and keeps the last one', async () => {
    const s = await started();
    for (const value of [1, 12, 123, 1234]) s.store.getState().setAnswer({ value });
    s.clock.t += 5000;
    s.store.getState().next();
    await s.store.getState().flush();
    const { run } = await storedRun(s.repos);
    const first = s.store.getState().context!.items[0]!.id;
    expect(run.answers[first]).toEqual({ value: 1234 });
    expect(run.currentIndex).toBe(1);
    expect(run.itemMs[first]).toBe(5000);
  });
});

describe('probetest store: the self-rating while looking through', () => {
  async function submittedWithShortAnswer() {
    const s = await started();
    s.store.getState().goTo(SHORT);
    answerCurrent(s.store);
    s.store.getState().showOverview();
    await s.store.getState().askSubmit();
    await s.store.getState().submit();
    return s;
  }

  it('the result waits for the short answer; Getroffen adds it, Teils does not', async () => {
    const s = await submittedWithShortAnswer();
    expect(s.store.getState().run?.result?.total).toEqual({ solved: 0, total: 24, pending: 1 });
    s.store.getState().review(SHORT);
    await s.store.getState().rate(1);
    expect(s.store.getState().run?.result?.total).toEqual({ solved: 1, total: 24, pending: 0 });
    expect((await storedRun(s.repos)).run.ratings).toEqual({ 'm-gm-3-002': 1 });

    const teils = await submittedWithShortAnswer();
    teils.store.getState().review(SHORT);
    await teils.store.getState().rate(0.5);
    expect(teils.store.getState().run?.result?.total).toEqual({ solved: 0, total: 24, pending: 0 });
    const { learner } = await storedRun(teils.repos);
    const attempts = await teils.repos.attempts.listByLearner(learner.id);
    expect(attempts.map((a) => [a.itemId, a.correct])).toEqual([['m-gm-3-002', 0.5]]);
  });

  it('"Auswertung ansehen" later: the rating can be caught up and changes the result', async () => {
    const s = await submittedWithShortAnswer();
    const later = s.reopen();
    await later.store.getState().open(ID);
    later.store.getState().showResult();
    expect(later.store.getState()).toMatchObject({
      status: 'result',
      run: { result: { total: { pending: 1 } } },
    });
    later.store.getState().review(SHORT);
    await later.store.getState().rate(1);
    later.store.getState().showResult();
    expect(later.store.getState().run?.result?.total).toEqual({ solved: 1, total: 24, pending: 0 });
    expect((await storedRun(s.repos)).run.result?.total.solved).toBe(1);
  });

  it('looking through goes forward and back and ends at the result', async () => {
    const s = await submittedWithShortAnswer();
    s.store.getState().review();
    s.store.getState().back();
    expect(s.store.getState().index).toBe(0);
    s.store.getState().next();
    expect(s.store.getState()).toMatchObject({ status: 'review', index: 1 });
    s.store.getState().review(23);
    s.store.getState().next();
    expect(s.store.getState().status).toBe('result');
  });

  it('"1 Antwort vergleichen": only the waiting short answer, then back to the result', async () => {
    const s = await submittedWithShortAnswer();
    s.store.getState().review(0, 'pending');
    expect(s.store.getState()).toMatchObject({
      status: 'review',
      index: SHORT,
      reviewOnly: [SHORT],
    });
    s.store.getState().back();
    expect(s.store.getState().index).toBe(SHORT);
    await s.store.getState().rate(1);
    // The rated item stays on screen; "Zur Auswertung" (next) ends the filtered look.
    expect(s.store.getState()).toMatchObject({ status: 'review', index: SHORT });
    s.store.getState().next();
    expect(s.store.getState()).toMatchObject({ status: 'result', reviewOnly: null });
    expect(s.store.getState().run?.result?.total.pending).toBe(0);
    // Nothing waits any more: the filter has nothing to show.
    s.store.getState().review(0, 'pending');
    expect(s.store.getState().status).toBe('result');
  });

  it('the overview while looking through: a Wegstrich jumps and ends the filter', async () => {
    const s = await submittedWithShortAnswer();
    s.store.getState().review(0, 'pending');
    s.store.getState().showReviewOverview();
    expect(s.store.getState().status).toBe('reviewOverview');
    s.store.getState().continueReview();
    expect(s.store.getState()).toMatchObject({
      status: 'review',
      index: SHORT,
      reviewOnly: [SHORT],
    });
    s.store.getState().showReviewOverview();
    s.store.getState().review(3);
    expect(s.store.getState()).toMatchObject({ status: 'review', index: 3, reviewOnly: null });
    s.store.getState().next();
    expect(s.store.getState().index).toBe(4);
    s.store.getState().showReviewOverview();
    s.store.getState().showResult();
    expect(s.store.getState()).toMatchObject({ status: 'result', reviewOnly: null });
  });

  it('an unknown Probetest is unavailable', async () => {
    const s = setup();
    await s.store.getState().open('mathe-99');
    expect(s.store.getState().status).toBe('unavailable');
    await s.store.getState().open('../etwas');
    expect(s.store.getState().status).toBe('unavailable');
  });
});
