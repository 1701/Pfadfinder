import { describe, expect, it } from 'vitest';
import { SESSION_GOAL } from '../../src/domain/practice';
import { createMemoryRepositories } from '../../src/data/memory/repos';
import { createSessionStore, type SessionStore } from '../../src/data/session-store';
import { answerFor, testDeps, tickingClock } from './helpers';

const DAY_MS = 24 * 60 * 60 * 1000;

async function answer(store: SessionStore, correct: boolean) {
  const { current, status } = store.getState();
  expect(status).toBe('answering');
  store.getState().setAnswer(answerFor(current!.item, correct));
  await store.getState().submit();
  expect(store.getState().status).toBe('feedback');
  return store.getState().feedback!;
}

describe('practice session (store + in-memory repositories + real content)', () => {
  it('plays 10 items: pickNext → evaluate → updateMastery → enqueueReview', async () => {
    const deps = testDeps();
    const store = createSessionStore(deps);
    await store.getState().startPractice('mathe', 'zahlen-operationen');

    // 6 correct on niveau 1 → level up; then 3 wrong, 1 correct on niveau 2.
    const plan = [true, true, true, true, true, true, false, false, false, true];
    const transitions: string[] = [];
    for (const [i, correct] of plan.entries()) {
      const feedback = await answer(store, correct);
      expect(feedback.correct).toBe(correct);
      transitions.push(feedback.transition);
      await store.getState().next();
      if (i < plan.length - 1) expect(store.getState().status).toBe('answering');
    }
    expect(store.getState().status).toBe('finished');
    expect(transitions.indexOf('level-up')).toBe(5);

    const { repos } = deps;
    const learner = store.getState().learner!;
    const [session, ...others] = await repos.sessions.listByLearner(learner.id);
    expect(others).toEqual([]);
    expect(session).toMatchObject({ mode: 'practice', goalReached: true });
    expect(session!.endedAt).toBeDefined();
    expect(session!.attemptIds).toHaveLength(SESSION_GOAL);

    const attempts = await repos.attempts.listByLearner(learner.id);
    expect(attempts.map((a) => a.id)).toEqual(session!.attemptIds);
    expect(new Set(attempts.map((a) => a.itemId)).size).toBe(SESSION_GOAL);
    expect(attempts.map((a) => a.niveau)).toEqual([1, 1, 1, 1, 1, 1, 2, 2, 2, 2]);
    expect(attempts.map((a) => a.correct)).toEqual(plan);
    expect(attempts.every((a) => a.mode === 'practice' && a.format !== 'order')).toBe(true);

    expect(await repos.mastery.get(learner.id, 'zahlen-operationen')).toMatchObject({
      niveau: 2,
      window: [0, 0, 0, 1],
      mastered: false,
    });

    const reviews = await repos.reviews.listByLearner(learner.id);
    const wrong = attempts.filter((a) => a.correct === false);
    expect(reviews).toHaveLength(3);
    for (const a of wrong) {
      expect(await repos.reviews.get(learner.id, a.itemId)).toEqual({
        learnerId: learner.id,
        itemId: a.itemId,
        stage: 1,
        dueAt: new Date(Date.parse(a.at) + DAY_MS).toISOString(),
      });
    }

    // The level-up completed Etappe I: an Entdeckung that stays.
    expect(await repos.collectibles.get(learner.id)).toEqual({
      learnerId: learner.id,
      unlocked: ['zahlen-operationen:1'],
    });
    expect(store.getState().today).toEqual({ count: 10, goal: 10, reached: true });
  });

  it('never removes an Entdeckung and stores each only once', async () => {
    const repos = createMemoryRepositories();
    const store = createSessionStore(testDeps(repos));
    await store.getState().startPractice('mathe', 'zahlen-operationen');
    const learnerId = store.getState().learner!.id;
    await repos.collectibles.put({ learnerId, unlocked: ['raum-form:2', 'zahlen-operationen:1'] });
    // Six right answers: level-up 1 → 2 discovers zahlen-operationen:1 again.
    for (let i = 0; i < 6; i++) {
      await answer(store, true);
      await store.getState().next();
    }
    expect((await repos.collectibles.get(learnerId))!.unlocked).toEqual([
      'raum-form:2',
      'zahlen-operationen:1',
    ]);
  });

  it('counts the Abschluss like the map: only answers of today', async () => {
    const repos = createMemoryRepositories();
    // 23:59:30 Berlin (UTC+2): the session runs past midnight.
    const store = createSessionStore({
      ...testDeps(repos),
      now: tickingClock('2026-10-11T21:59:30.000Z'),
    });
    await store.getState().startPractice('mathe', 'zahlen-operationen');
    for (let i = 0; i < 10; i++) {
      await answer(store, true);
      await store.getState().next();
    }
    expect(store.getState().status).toBe('finished');
    const attempts = await repos.attempts.listByLearner(store.getState().learner!.id);
    const afterMidnight = attempts.filter((a) => a.at >= '2026-10-11T22:00:00.000Z').length;
    expect(afterMidnight).toBeGreaterThan(0);
    expect(afterMidnight).toBeLessThan(10);
    expect(store.getState().today).toEqual({ count: afterMidnight, goal: 10, reached: false });
  });

  it('continues an unfinished session after "Pause"', async () => {
    const repos = createMemoryRepositories();
    const first = createSessionStore(testDeps(repos));
    await first.getState().startPractice('mathe', 'zahlen-operationen');
    for (let i = 0; i < 4; i++) {
      await answer(first, true);
      await first.getState().next();
    }
    const pausedId = first.getState().practice!.session.id;
    first.getState().leave();
    expect(first.getState().status).toBe('idle');

    const second = createSessionStore(testDeps(repos));
    await second.getState().startPractice('mathe', 'zahlen-operationen');
    expect(second.getState().practice!.session.id).toBe(pausedId);
    expect(second.getState().practice!.session.attemptIds).toHaveLength(4);
    for (let i = 0; i < 6; i++) {
      await answer(second, true);
      await second.getState().next();
    }
    expect(second.getState().status).toBe('finished');

    const learnerId = second.getState().learner!.id;
    const sessions = await repos.sessions.listByLearner(learnerId);
    expect(sessions).toHaveLength(1);
    expect(sessions[0]!.attemptIds).toHaveLength(SESSION_GOAL);
  });

  it('does not continue a session of another Bereich and stores nothing before the first answer', async () => {
    const repos = createMemoryRepositories();
    const store = createSessionStore(testDeps(repos));
    await store.getState().startPractice('mathe', 'zahlen-operationen');
    const learnerId = store.getState().learner!.id;
    expect(await repos.sessions.listByLearner(learnerId)).toEqual([]);
    await answer(store, true);
    expect(await repos.sessions.listByLearner(learnerId)).toHaveLength(1);
  });

  it('reports a Bereich with too few practiceable items as empty', async () => {
    const store = createSessionStore(testDeps());
    await store.getState().startPractice('mathe', 'groessen-messen');
    expect(store.getState().status).toBe('empty');
    expect(store.getState().current).toBeNull();
  });

  it('ignores submit without an answer', async () => {
    const store = createSessionStore(testDeps());
    await store.getState().startPractice('mathe', 'zahlen-operationen');
    await store.getState().submit();
    expect(store.getState().status).toBe('answering');
    store.getState().setAnswer(null);
    await store.getState().submit();
    expect(store.getState().status).toBe('answering');
  });

  it('creates the learner once, without a name', async () => {
    const deps = testDeps();
    const store = createSessionStore(deps);
    const learner = await store.getState().init();
    expect(learner.name).toBeUndefined();
    expect(learner.settings).toEqual({ readAloud: true, bundesland: 'BW' });
    await createSessionStore(deps).getState().init();
    expect(await deps.repos.learners.list()).toEqual([learner]);
    expect(await deps.repos.collectibles.get(learner.id)).toEqual({
      learnerId: learner.id,
      unlocked: [],
    });
  });

  it('serves due Fehlerkiste items first on the next day, at most 3', async () => {
    const repos = createMemoryRepositories();
    const day1 = createSessionStore(testDeps(repos));
    await day1.getState().startPractice('mathe', 'zahlen-operationen');
    const plan = [false, false, false, false, true, true, true, true, true, true];
    for (const correct of plan) {
      await answer(day1, correct);
      await day1.getState().next();
    }
    const learnerId = day1.getState().learner!.id;
    const wrongIds = (await repos.attempts.listByLearner(learnerId))
      .filter((a) => a.correct === false)
      .map((a) => a.itemId);

    const deps = { ...testDeps(repos), now: tickingClock('2026-10-12T07:00:00.000Z') };
    const day2 = createSessionStore(deps);
    await day2.getState().startPractice('mathe', 'zahlen-operationen');
    const sources: string[] = [];
    for (let i = 0; i < 4; i++) {
      sources.push(day2.getState().current!.source);
      await answer(day2, true);
      await day2.getState().next();
    }
    expect(sources).toEqual(['review', 'review', 'review', 'practice']);

    const reviews = await repos.reviews.listByLearner(learnerId);
    expect(reviews.filter((r) => r.stage === 2)).toHaveLength(3);
    expect(reviews.filter((r) => r.stage === 1).map((r) => r.itemId)).toHaveLength(1);
    expect(wrongIds).toHaveLength(4);
    const day2Attempts = (await repos.attempts.listByLearner(learnerId)).slice(10);
    expect(day2Attempts.slice(0, 3).every((a) => a.mode === 'review')).toBe(true);
  });

  it('starts fresh after midnight and closes the session of the day before', async () => {
    const repos = createMemoryRepositories();
    // 23:55 in Berlin (UTC+2): four answers before midnight.
    const evening = createSessionStore({
      ...testDeps(repos),
      now: tickingClock('2026-10-11T21:55:00.000Z'),
    });
    await evening.getState().startPractice('mathe', 'zahlen-operationen');
    for (let i = 0; i < 4; i++) {
      await answer(evening, true);
      await evening.getState().next();
    }
    const yesterdayId = evening.getState().practice!.session.id;
    evening.getState().leave();

    // 00:01 the next day.
    const morning = createSessionStore({
      ...testDeps(repos),
      now: tickingClock('2026-10-11T22:01:00.000Z'),
    });
    await morning.getState().startPractice('mathe', 'zahlen-operationen');
    const practice = morning.getState().practice!;
    expect(practice.session.id).not.toBe(yesterdayId);
    expect(practice.session.attemptIds).toEqual([]);

    const learnerId = morning.getState().learner!.id;
    expect(await repos.sessions.get(yesterdayId)).toMatchObject({
      endedAt: '2026-10-11T22:01:00.000Z',
      goalReached: false,
    });
    expect((await repos.sessions.get(yesterdayId))!.attemptIds).toHaveLength(4);
    await answer(morning, true);
    expect(await repos.sessions.listByLearner(learnerId)).toHaveLength(2);
  });
});
