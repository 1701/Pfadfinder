// In-memory repositories for tests. Values are cloned on every read and write, so a caller
// that mutates a returned object cannot change stored data – the same as with IndexedDB.

import type {
  Attempt,
  Collectibles,
  Learner,
  ProbetestRun,
  ReviewEntry,
  Session,
} from '../../domain/learner';
import type { MasteryState } from '../../domain/mastery';
import type { Repositories } from '../repos';

type Tables = {
  learners: Map<string, unknown>;
  attempts: Map<string, unknown>;
  mastery: Map<string, unknown>;
  reviews: Map<string, unknown>;
  sessions: Map<string, unknown>;
  probetestRuns: Map<string, unknown>;
  collectibles: Map<string, unknown>;
};

const key = (...parts: string[]) => JSON.stringify(parts);

export function createMemoryRepositories(): Repositories {
  let tables: Tables = emptyTables();

  function table<T>(name: keyof Tables) {
    return {
      get: async (k: string) => clone(tables[name].get(k) as T | undefined),
      put: async (k: string, value: T) => void tables[name].set(k, clone(value)),
      all: async () => [...tables[name].values()].map((v) => clone(v as T)),
    };
  }

  const learners = table<Learner>('learners');
  const attempts = table<Attempt>('attempts');
  const mastery = table<MasteryState>('mastery');
  const reviews = table<ReviewEntry>('reviews');
  const sessions = table<Session>('sessions');
  const probetestRuns = table<ProbetestRun>('probetestRuns');
  const collectibles = table<Collectibles>('collectibles');

  const byAt = <T extends { at: string }>(a: T, b: T) => a.at.localeCompare(b.at);
  const byStartedAt = <T extends { startedAt: string }>(a: T, b: T) =>
    a.startedAt.localeCompare(b.startedAt);

  return {
    learners: {
      get: (id) => learners.get(id),
      list: async () =>
        (await learners.all()).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
      put: (learner) => learners.put(learner.id, learner),
    },
    attempts: {
      get: (id) => attempts.get(id),
      listByLearner: async (learnerId) =>
        (await attempts.all()).filter((a) => a.learnerId === learnerId).sort(byAt),
      listByBereich: async (learnerId, bereich) =>
        (await attempts.all())
          .filter((a) => a.learnerId === learnerId && a.bereich === bereich)
          .sort(byAt),
      put: (attempt) => attempts.put(attempt.id, attempt),
    },
    mastery: {
      get: (learnerId, bereich) => mastery.get(key(learnerId, bereich)),
      listByLearner: async (learnerId) =>
        (await mastery.all()).filter((m) => m.learnerId === learnerId),
      put: (state) => mastery.put(key(state.learnerId, state.bereich), state),
    },
    reviews: {
      get: (learnerId, itemId) => reviews.get(key(learnerId, itemId)),
      listByLearner: async (learnerId) =>
        (await reviews.all()).filter((r) => r.learnerId === learnerId),
      listDueBefore: async (learnerId, before) =>
        (await reviews.all())
          .filter((r) => r.learnerId === learnerId && r.dueAt < before)
          .sort((a, b) => a.dueAt.localeCompare(b.dueAt)),
      put: (entry) => reviews.put(key(entry.learnerId, entry.itemId), entry),
    },
    sessions: {
      get: (id) => sessions.get(id),
      listByLearner: async (learnerId) =>
        (await sessions.all()).filter((s) => s.learnerId === learnerId).sort(byStartedAt),
      put: (session) => sessions.put(session.id, session),
    },
    probetestRuns: {
      get: (id) => probetestRuns.get(id),
      listByLearner: async (learnerId) =>
        (await probetestRuns.all()).filter((p) => p.learnerId === learnerId).sort(byStartedAt),
      put: (run) => probetestRuns.put(run.id, run),
    },
    collectibles: {
      get: (learnerId) => collectibles.get(learnerId),
      put: (value) => collectibles.put(value.learnerId, value),
    },
    async transaction(fn) {
      const snapshot = cloneTables(tables);
      try {
        return await fn();
      } catch (error) {
        tables = snapshot;
        throw error;
      }
    },
    async clear() {
      tables = emptyTables();
    },
  };
}

function emptyTables(): Tables {
  return {
    learners: new Map(),
    attempts: new Map(),
    mastery: new Map(),
    reviews: new Map(),
    sessions: new Map(),
    probetestRuns: new Map(),
    collectibles: new Map(),
  };
}

function cloneTables(tables: Tables): Tables {
  return Object.fromEntries(
    Object.entries(tables).map(([name, map]) => [name, new Map(clone([...map]))]),
  ) as Tables;
}

function clone<T>(value: T): T {
  return value === undefined ? value : structuredClone(value);
}
