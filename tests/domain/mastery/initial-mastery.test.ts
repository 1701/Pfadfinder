import { describe, expect, it } from 'vitest';
import { initialMastery, masteryStateSchema } from '../../../src/domain/mastery';

describe('initialMastery', () => {
  it('starts a Bereich without check result on niveau 1 with an empty window', () => {
    const state = initialMastery('learner-1', 'rs-strategien', '2026-10-11T08:00:00.000Z');
    expect(state).toEqual({
      learnerId: 'learner-1',
      fach: 'deutsch',
      bereich: 'rs-strategien',
      niveau: 1,
      window: [],
      mastered: false,
      updatedAt: '2026-10-11T08:00:00.000Z',
    });
    expect(masteryStateSchema.safeParse(state).success).toBe(true);
  });
});
