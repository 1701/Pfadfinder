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
    expect(probetestStand(['mathe-01', 'mathe-05'], []).map((s) => s.number)).toEqual([1, 2]);
  });

  it('is done only after a submitted run, with the end of the last one', () => {
    const runs = [
      run('mathe-01', 'submitted', '2026-10-01'),
      run('mathe-01', 'submitted', '2026-10-08'),
      run('mathe-01', 'aborted', '2026-10-12'),
      run('mathe-02', 'aborted', '2026-10-03'),
      run('mathe-03', 'running', '2026-10-20'),
    ];
    expect(probetestStand(['mathe-01', 'mathe-02', 'mathe-03'], runs)).toEqual([
      { id: 'mathe-01', number: 1, doneAt: '2026-10-08T08:40:00.000Z' },
      { id: 'mathe-02', number: 2, doneAt: null },
      { id: 'mathe-03', number: 3, doneAt: null },
    ]);
  });

  it('ignores runs of a Probetest the manifest no longer lists', () => {
    expect(probetestStand([], [run('mathe-09', 'submitted', '2026-10-01')])).toEqual([]);
  });
});
