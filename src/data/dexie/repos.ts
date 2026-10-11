// Dexie implementation of the repositories. Sorting happens here so callers get the order
// promised by the interfaces regardless of the primary key.

import { Dexie } from 'dexie';
import type { Repositories } from '../repos';
import { openDb, type PfadfinderDb } from './db';

const byAt = <T extends { at: string }>(a: T, b: T) => a.at.localeCompare(b.at);
const byStartedAt = <T extends { startedAt: string }>(a: T, b: T) =>
  a.startedAt.localeCompare(b.startedAt);

export function createDexieRepositories(db: PfadfinderDb = openDb()): Repositories {
  const tables = [
    db.learners,
    db.attempts,
    db.mastery,
    db.reviews,
    db.sessions,
    db.probetestRuns,
    db.collectibles,
  ];

  return {
    learners: {
      get: (id) => db.learners.get(id),
      list: async () =>
        (await db.learners.toArray()).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      put: async (learner) => void (await db.learners.put(learner)),
    },
    attempts: {
      get: (id) => db.attempts.get(id),
      listByLearner: async (learnerId) =>
        (await db.attempts.where('learnerId').equals(learnerId).toArray()).sort(byAt),
      listByBereich: async (learnerId, bereich) =>
        (
          await db.attempts.where('[learnerId+bereich]').equals([learnerId, bereich]).toArray()
        ).sort(byAt),
      put: async (attempt) => void (await db.attempts.put(attempt)),
    },
    mastery: {
      get: (learnerId, bereich) => db.mastery.get([learnerId, bereich]),
      listByLearner: (learnerId) => db.mastery.where('learnerId').equals(learnerId).toArray(),
      put: async (state) => void (await db.mastery.put(state)),
    },
    reviews: {
      get: (learnerId, itemId) => db.reviews.get([learnerId, itemId]),
      listByLearner: (learnerId) => db.reviews.where('learnerId').equals(learnerId).toArray(),
      listDueBefore: (learnerId, before) =>
        db.reviews
          .where('[learnerId+dueAt]')
          .between([learnerId, Dexie.minKey], [learnerId, before], true, false)
          .toArray(),
      put: async (entry) => void (await db.reviews.put(entry)),
    },
    sessions: {
      get: (id) => db.sessions.get(id),
      listByLearner: async (learnerId) =>
        (await db.sessions.where('learnerId').equals(learnerId).toArray()).sort(byStartedAt),
      put: async (session) => void (await db.sessions.put(session)),
    },
    probetestRuns: {
      get: (id) => db.probetestRuns.get(id),
      listByLearner: async (learnerId) =>
        (await db.probetestRuns.where('learnerId').equals(learnerId).toArray()).sort(byStartedAt),
      put: async (run) => void (await db.probetestRuns.put(run)),
    },
    collectibles: {
      get: (learnerId) => db.collectibles.get(learnerId),
      put: async (collectibles) => void (await db.collectibles.put(collectibles)),
    },
    transaction: (fn) => db.transaction('rw', tables, fn),
    clear: () =>
      db
        .transaction('rw', tables, () => Promise.all(tables.map((t) => t.clear())))
        .then(() => undefined),
  };
}
