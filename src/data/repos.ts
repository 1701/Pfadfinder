// Repository interfaces (ARCHITECTURE.md §9: sync later, so persistence sits behind interfaces).
// Implementations: Dexie (IndexedDB, the app) and in-memory (tests). Both pass the same
// contract suite in tests/data/repos.contract.ts.

import type { Bereich } from '../domain/content';
import type {
  Attempt,
  Collectibles,
  Learner,
  ProbetestRun,
  ReviewEntry,
  Session,
} from '../domain/learner';
import type { MasteryState } from '../domain/mastery';

export interface LearnerRepo {
  get(id: string): Promise<Learner | undefined>;
  /** Oldest first; the MVP shows only the first learner. */
  list(): Promise<Learner[]>;
  put(learner: Learner): Promise<void>;
}

export interface AttemptRepo {
  get(id: string): Promise<Attempt | undefined>;
  /** Oldest first. */
  listByLearner(learnerId: string): Promise<Attempt[]>;
  /** Oldest first. */
  listByBereich(learnerId: string, bereich: Bereich): Promise<Attempt[]>;
  put(attempt: Attempt): Promise<void>;
}

export interface MasteryRepo {
  get(learnerId: string, bereich: Bereich): Promise<MasteryState | undefined>;
  listByLearner(learnerId: string): Promise<MasteryState[]>;
  put(state: MasteryState): Promise<void>;
}

export interface ReviewRepo {
  get(learnerId: string, itemId: string): Promise<ReviewEntry | undefined>;
  listByLearner(learnerId: string): Promise<ReviewEntry[]>;
  /** Entries with dueAt < before, earliest first; includes 'done' entries. */
  listDueBefore(learnerId: string, before: string): Promise<ReviewEntry[]>;
  put(entry: ReviewEntry): Promise<void>;
}

export interface SessionRepo {
  get(id: string): Promise<Session | undefined>;
  /** Oldest first (by startedAt). */
  listByLearner(learnerId: string): Promise<Session[]>;
  put(session: Session): Promise<void>;
}

export interface ProbetestRepo {
  get(id: string): Promise<ProbetestRun | undefined>;
  /** Oldest first (by startedAt). */
  listByLearner(learnerId: string): Promise<ProbetestRun[]>;
  put(run: ProbetestRun): Promise<void>;
}

export interface CollectiblesRepo {
  get(learnerId: string): Promise<Collectibles | undefined>;
  put(collectibles: Collectibles): Promise<void>;
}

export interface Repositories {
  learners: LearnerRepo;
  attempts: AttemptRepo;
  mastery: MasteryRepo;
  reviews: ReviewRepo;
  sessions: SessionRepo;
  probetestRuns: ProbetestRepo;
  collectibles: CollectiblesRepo;
  /** Runs fn atomically: if it throws, no write inside it is kept. */
  transaction<T>(fn: () => Promise<T>): Promise<T>;
  /** Deletes everything on this device. */
  clear(): Promise<void>;
}
