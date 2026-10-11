// IndexedDB schema (ARCHITECTURE.md §4). Every schema change needs a new version() with an
// upgrade, never an edit of an existing version: devices keep their data across app updates.

import { Dexie, type EntityTable } from 'dexie';
import type {
  Attempt,
  Collectibles,
  Learner,
  ProbetestRun,
  ReviewEntry,
  Session,
} from '../../domain/learner';
import type { MasteryState } from '../../domain/mastery';

export const DB_NAME = 'pfadfinder';

export type PfadfinderDb = Dexie & {
  learners: EntityTable<Learner, 'id'>;
  attempts: EntityTable<Attempt, 'id'>;
  mastery: Dexie.Table<MasteryState, [string, string]>;
  reviews: Dexie.Table<ReviewEntry, [string, string]>;
  sessions: EntityTable<Session, 'id'>;
  probetestRuns: EntityTable<ProbetestRun, 'id'>;
  collectibles: EntityTable<Collectibles, 'learnerId'>;
};

export function openDb(name = DB_NAME): PfadfinderDb {
  const db = new Dexie(name) as PfadfinderDb;
  db.version(1).stores({
    learners: 'id',
    attempts: 'id, learnerId, [learnerId+bereich]',
    mastery: '[learnerId+bereich], learnerId',
    reviews: '[learnerId+itemId], learnerId, [learnerId+dueAt]',
    sessions: 'id, learnerId',
    probetestRuns: 'id, learnerId',
    collectibles: 'learnerId',
  });
  return db;
}
