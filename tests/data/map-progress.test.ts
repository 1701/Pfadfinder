import { describe, expect, it } from 'vitest';
import { createMemoryRepositories } from '../../src/data/memory/repos';
import { loadMapProgress } from '../../src/data/map-progress';
import { masteryFor } from '../fixtures/pool';

describe('loadMapProgress', () => {
  it('reads nothing and creates nothing before the first answer', async () => {
    const repos = createMemoryRepositories();
    expect(await loadMapProgress(repos, '2026-10-12T08:00:00.000Z')).toEqual({
      mastery: [],
      unlocked: [],
      today: { count: 0, goal: 10, reached: false },
    });
    expect(await repos.learners.list()).toEqual([]);
  });

  it("collects mastery, Entdeckungen and today's Fundstücke of the first learner", async () => {
    const repos = createMemoryRepositories();
    await repos.learners.put({
      id: 'learner-1',
      createdAt: '2026-10-11T08:00:00.000Z',
      settings: { readAloud: true, bundesland: 'BW' },
    });
    const zo = masteryFor('zahlen-operationen', 2);
    await repos.mastery.put(zo);
    await repos.collectibles.put({ learnerId: 'learner-1', unlocked: ['zahlen-operationen:1'] });
    for (const [i, at] of ['2026-10-11T09:00:00.000Z', '2026-10-12T07:00:00.000Z'].entries()) {
      await repos.attempts.put({
        id: `a${i}`,
        learnerId: 'learner-1',
        itemId: 'm-zo-1-001',
        fach: 'mathe',
        bereich: 'zahlen-operationen',
        niveau: 1,
        format: 'number-input',
        correct: true,
        answer: { value: 1 },
        durationMs: 1000,
        mode: 'practice',
        at,
      });
    }
    expect(await loadMapProgress(repos, '2026-10-12T08:00:00.000Z')).toEqual({
      mastery: [zo],
      unlocked: ['zahlen-operationen:1'],
      today: { count: 1, goal: 10, reached: false },
    });
  });
});
