// What the map needs from the device's storage: mastery per Gebiet, Entdeckungen, today's
// Fundstücke and whether today's Einstieg offer is spent ("Später" or a finished Einstieg).
// Reading creates nothing; "Später" is the only thing the map writes.

import type { Fach } from '../domain/content/taxonomy';
import type { MasteryState } from '../domain/mastery/mastery';
import {
  offerSpentToday,
  practiceDay,
  todayProgress,
  type TodayProgress,
} from '../domain/progress';
import type { Repositories } from './repos';

export interface MapProgress {
  mastery: MasteryState[];
  /** Entdeckungen (Collectibles.unlocked). */
  unlocked: string[];
  today: TodayProgress;
  /** Today's offer is spent (or on the day of a round still running): no other Fach today. */
  offerSpent: boolean;
}

export async function loadMapProgress(repos: Repositories, now: string): Promise<MapProgress> {
  const offers = await repos.postponedOffers.list();
  const [learner] = await repos.learners.list();
  if (!learner) {
    return {
      mastery: [],
      unlocked: [],
      today: todayProgress([], now),
      offerSpent: offerSpentToday({ offers, now }),
    };
  }
  const [mastery, collectibles, attempts, sessions] = await Promise.all([
    repos.mastery.listByLearner(learner.id),
    repos.collectibles.get(learner.id),
    repos.attempts.listByLearner(learner.id),
    repos.sessions.listByLearner(learner.id),
  ]);
  // A round from before midnight that still goes on keeps its day (practiceDay).
  const day = practiceDay(sessions, new Map(attempts.map((a) => [a.id, a])), now);
  return {
    mastery,
    unlocked: collectibles?.unlocked ?? [],
    today: todayProgress(attempts, day, sessions),
    offerSpent: offerSpentToday({ offers, sessions, now, day }),
  };
}

/** "Später": the offer rests until the end of the day, for every Fach (offerSpentToday). */
export async function postponeOffer(repos: Repositories, fach: Fach, now: string): Promise<void> {
  await repos.postponedOffers.put({ fach, at: now });
}
