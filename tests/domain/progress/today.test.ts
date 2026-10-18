import { describe, expect, it } from 'vitest';
import type { AttemptMode } from '../../../src/domain/learner';
import type { Session } from '../../../src/domain/learner';
import { DAILY_GOAL, practiceDay, todayProgress } from '../../../src/domain/progress';

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

// A round from 23:55 on the 11th to 00:04 on the 12th (Berlin, UTC+2): six answers before
// midnight, four after.
const ROUND_START = '2026-10-11T21:55:00.000Z';
const AFTER_MIDNIGHT = '2026-10-11T22:01:00.000Z';
const roundAttempts = Array.from({ length: 10 }, (_, i) => ({
  id: `a${i}`,
  mode: 'practice' as const,
  // Every 30 s from 23:55 to 23:57:30, then every minute from 00:01 to 00:04.
  at: new Date(
    i < 6 ? Date.parse(ROUND_START) + i * 30_000 : Date.parse(AFTER_MIDNIGHT) + (i - 6) * 60_000,
  ).toISOString(),
}));
const round = (attemptIds: string[], endedAt?: string): Session => ({
  id: 's1',
  learnerId: 'l1',
  mode: 'practice',
  startedAt: ROUND_START,
  attemptIds,
  goalReached: endedAt !== undefined,
  ...(endedAt !== undefined && { endedAt }),
});
const byId = new Map(roundAttempts.map((a) => [a.id, a]));

describe('a round past midnight belongs to the day it began', () => {
  it('has six answers before and four after midnight (fixture)', () => {
    expect(roundAttempts.filter((a) => a.at < '2026-10-11T22:00:00.000Z')).toHaveLength(6);
  });

  it('counts all its answers for that day, none for the next', () => {
    const sessions = [
      round(
        roundAttempts.map((a) => a.id),
        roundAttempts[9]!.at,
      ),
    ];
    expect(todayProgress(roundAttempts, ROUND_START, sessions)).toEqual({
      count: 10,
      goal: 10,
      reached: true,
    });
    expect(todayProgress(roundAttempts, '2026-10-12T08:00:00.000Z', sessions).count).toBe(0);
    // Without the round, the answers count by their own time as before.
    expect(todayProgress(roundAttempts, '2026-10-12T08:00:00.000Z').count).toBe(4);
  });

  it('keeps its day for the map while it runs', () => {
    const open = [round(roundAttempts.slice(0, 8).map((a) => a.id))];
    expect(practiceDay(open, byId, '2026-10-11T22:10:00.000Z')).toBe(ROUND_START);
    // Ended, or not active since midnight (it would not be continued): the day is today.
    const ended = [
      round(
        roundAttempts.map((a) => a.id),
        roundAttempts[9]!.at,
      ),
    ];
    expect(practiceDay(ended, byId, '2026-10-11T22:10:00.000Z')).toBe('2026-10-11T22:10:00.000Z');
    const before = [round(roundAttempts.slice(0, 6).map((a) => a.id))];
    expect(practiceDay(before, byId, '2026-10-11T22:10:00.000Z')).toBe('2026-10-11T22:10:00.000Z');
  });

  it('a round of today is just today', () => {
    const now = '2026-10-11T21:58:00.000Z';
    expect(practiceDay([round(['a0', 'a1'])], byId, now)).toBe(now);
  });
});
