import { describe, expect, it } from 'vitest';
import type { ProbetestRun } from '../../../src/domain/learner';
import { probetestStand } from '../../../src/domain/probetest';

function run(probetestId: string, status: ProbetestRun['status'], day: string): ProbetestRun {
  return {
    id: `${probetestId}-${day}`,
    learnerId: 'l1',
    probetestId,
    startedAt: `${day}T08:00:00.000Z`,
    status,
    ...(status !== 'running' && { endedAt: `${day}T08:40:00.000Z` }),
    currentIndex: 0,
    answers: {},
    itemMs: {},
    attemptIndex: {},
    ratings: {},
    attemptIds: [],
  };
}

describe('probetestStand (task 16)', () => {
  it('numbers by manifest position, never by the id', () => {
    expect(probetestStand(['mathe-91', 'mathe-95'], []).map((s) => s.number)).toEqual([1, 2]);
  });

  it('is done only after a submitted run, with the end of the last one', () => {
    const runs = [
      run('mathe-91', 'submitted', '2026-10-01'),
      run('mathe-91', 'submitted', '2026-10-08'),
      run('mathe-91', 'aborted', '2026-10-12'),
      run('mathe-92', 'aborted', '2026-10-03'),
      run('mathe-93', 'running', '2026-10-20'),
    ];
    expect(probetestStand(['mathe-91', 'mathe-92', 'mathe-93'], runs)).toEqual([
      { id: 'mathe-91', number: 1, doneAt: '2026-10-08T08:40:00.000Z' },
      { id: 'mathe-92', number: 2, doneAt: null },
      { id: 'mathe-93', number: 3, doneAt: null },
    ]);
  });

  it('ignores runs of a Probetest the manifest no longer lists', () => {
    expect(probetestStand([], [run('mathe-98', 'submitted', '2026-10-01')])).toEqual([]);
  });
});
