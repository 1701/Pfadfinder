import { describe, expect, it } from 'vitest';
import type { AttemptMode } from '../../../src/domain/learner';
import { DAILY_GOAL, todayProgress } from '../../../src/domain/progress';

const at = (time: string, mode: AttemptMode = 'practice') => ({ at: time, mode });
const times = (n: number, start: string) =>
  Array.from({ length: n }, (_, i) => at(new Date(Date.parse(start) + i * 60_000).toISOString()));

describe('todayProgress (Europe/Berlin in tests)', () => {
  it('counts practice and Fehlerkiste answers of today', () => {
    const attempts = [
      ...times(3, '2026-10-12T06:00:00.000Z'),
      at('2026-10-12T07:00:00.000Z', 'review'),
      at('2026-10-12T07:01:00.000Z', 'check'),
      at('2026-10-12T07:02:00.000Z', 'probetest'),
    ];
    expect(todayProgress(attempts, '2026-10-12T15:00:00.000Z')).toEqual({
      count: 4,
      goal: DAILY_GOAL,
      reached: false,
    });
  });

  it('starts a new day at local midnight, not at UTC midnight', () => {
    // 23:58 Berlin on the 11th (21:58Z) and 00:02 on the 12th (22:02Z).
    const attempts = [at('2026-10-11T21:58:00.000Z'), at('2026-10-11T22:02:00.000Z')];
    expect(todayProgress(attempts, '2026-10-11T22:05:00.000Z').count).toBe(1);
    expect(todayProgress(attempts, '2026-10-11T21:59:00.000Z').count).toBe(1);
    // 03:00 Berlin on the 12th: only the answer after midnight counts.
    expect(todayProgress(attempts, '2026-10-12T01:00:00.000Z').count).toBe(1);
  });

  it('stops at the goal: more practice is not a higher score', () => {
    const progress = todayProgress(
      times(14, '2026-10-12T06:00:00.000Z'),
      '2026-10-12T09:00:00.000Z',
    );
    expect(progress).toEqual({ count: 10, goal: 10, reached: true });
    expect(todayProgress([], '2026-10-12T09:00:00.000Z')).toEqual({
      count: 0,
      goal: 10,
      reached: false,
    });
  });
});
