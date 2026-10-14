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
import type { PostponedOffer } from '../../domain/progress';

export const DB_NAME = 'pfadfinder';

export type PfadfinderDb = Dexie & {
  learners: EntityTable<Learner, 'id'>;
  attempts: EntityTable<Attempt, 'id'>;
  mastery: Dexie.Table<MasteryState, [string, string]>;
  reviews: Dexie.Table<ReviewEntry, [string, string]>;
  sessions: EntityTable<Session, 'id'>;
  probetestRuns: EntityTable<ProbetestRun, 'id'>;
  collectibles: EntityTable<Collectibles, 'learnerId'>;
  postponedOffers: EntityTable<PostponedOffer, 'fach'>;
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
  // v2: "Später" on the Einstieg offer lasts until the end of the day (PRODUCT.md §5.4).
  // A new table only, no upgrade function needed.
  db.version(2).stores({ postponedOffers: 'fach' });
  return db;
}
