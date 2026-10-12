// What the map needs from the device's storage: mastery per Gebiet, Entdeckungen and today's
// Fundstücke. Read-only; nothing is created before the child answers something.

import type { MasteryState } from '../domain/mastery/mastery';
import { todayProgress, type TodayProgress } from '../domain/progress';
import type { Repositories } from './repos';

export interface MapProgress {
  mastery: MasteryState[];
  /** Entdeckungen (Collectibles.unlocked). */
  unlocked: string[];
  today: TodayProgress;
}

export async function loadMapProgress(repos: Repositories, now: string): Promise<MapProgress> {
  const [learner] = await repos.learners.list();
  if (!learner) return { mastery: [], unlocked: [], today: todayProgress([], now) };
  const [mastery, collectibles, attempts] = await Promise.all([
    repos.mastery.listByLearner(learner.id),
    repos.collectibles.get(learner.id),
    repos.attempts.listByLearner(learner.id),
  ]);
  return { mastery, unlocked: collectibles?.unlocked ?? [], today: todayProgress(attempts, now) };
}
