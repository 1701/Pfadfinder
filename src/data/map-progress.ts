// What the map needs from the device's storage: mastery per Gebiet, Entdeckungen, today's
// Fundstücke and the Fächer whose Einstieg offer rests ("Später"). Reading creates nothing;
// "Später" is the only thing the map writes.

import type { Fach } from '../domain/content/taxonomy';
import type { MasteryState } from '../domain/mastery/mastery';
import { postponedFaecher, todayProgress, type TodayProgress } from '../domain/progress';
import type { Repositories } from './repos';

export interface MapProgress {
  mastery: MasteryState[];
  /** Entdeckungen (Collectibles.unlocked). */
  unlocked: string[];
  today: TodayProgress;
  /** Fächer whose Einstieg offer was postponed today. */
  postponed: Fach[];
}

export async function loadMapProgress(repos: Repositories, now: string): Promise<MapProgress> {
  const postponed = postponedFaecher(await repos.postponedOffers.list(), now);
  const [learner] = await repos.learners.list();
  if (!learner) return { mastery: [], unlocked: [], today: todayProgress([], now), postponed };
  const [mastery, collectibles, attempts] = await Promise.all([
    repos.mastery.listByLearner(learner.id),
    repos.collectibles.get(learner.id),
    repos.attempts.listByLearner(learner.id),
  ]);
  return {
    mastery,
    unlocked: collectibles?.unlocked ?? [],
    today: todayProgress(attempts, now),
    postponed,
  };
}

/** "Später": the offer of this Fach rests until the end of the day (postponedFaecher). */
export async function postponeOffer(repos: Repositories, fach: Fach, now: string): Promise<void> {
  await repos.postponedOffers.put({ fach, at: now });
}
