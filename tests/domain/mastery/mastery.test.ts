import { describe, expect, it } from 'vitest';
import type { Correctness } from '../../../src/domain/evaluation';
import {
  checkLadderNiveau,
  initialMasteryFromCheck,
  masteryScore,
  masteryStateSchema,
  updateMastery,
  type MasteryState,
  type MasteryUpdate,
} from '../../../src/domain/mastery';
import type { AttemptMode } from '../../../src/domain/learner';

const T0 = '2026-10-11T08:00:00.000Z';
const T1 = '2026-10-11T08:05:00.000Z';

function state(overrides: Partial<MasteryState> = {}): MasteryState {
  return {
    learnerId: 'learner-1',
    fach: 'mathe',
    bereich: 'zahlen-operationen',
    niveau: 1,
    window: [],
    mastered: false,
    updatedAt: T0,
    ...overrides,
  };
}

function result(correct: Correctness, mode: AttemptMode = 'practice') {
  return { fach: 'mathe', bereich: 'zahlen-operationen', correct, mode, at: T1 } as const;
}

/** Applies results one by one and returns every update. */
function feed(start: MasteryState, results: Correctness[]): MasteryUpdate[] {
  const updates: MasteryUpdate[] = [];
  let current = start;
  for (const correct of results) {
    const update = updateMastery(current, result(correct));
    updates.push(update);
    current = update.state;
  }
  return updates;
}

const last = (updates: MasteryUpdate[]) => updates[updates.length - 1]!;

describe('masteryScore', () => {
  it('is null below 6 entries and the average from 6 entries on', () => {
    expect(masteryScore([1, 1, 1, 1, 1])).toBeNull();
    expect(masteryScore([1, 1, 1, 0.5, 0, 1])).toBe(0.75);
  });
});

describe('updateMastery – window', () => {
  it('appends the score; 0.5 counts as 0.5', () => {
    const { state: s } = updateMastery(state({ window: [1] }), result(0.5));
    expect(s.window).toEqual([1, 0.5]);
    expect(s.updatedAt).toBe(T1);
  });

  it('makes no decision with 5 entries, even if all are correct', () => {
    const updates = feed(state(), [true, true, true, true, true]);
    expect(updates.map((u) => u.transition)).toEqual(['none', 'none', 'none', 'none', 'none']);
    expect(last(updates).state).toMatchObject({ niveau: 1, window: [1, 1, 1, 1, 1] });
  });

  it('keeps only the last 8 entries', () => {
    const updates = feed(state({ niveau: 2 }), [
      true,
      false,
      true,
      true,
      false,
      true,
      false,
      true,
      false,
    ]);
    expect(updates.every((u) => u.transition === 'none')).toBe(true);
    expect(last(updates).state.window).toEqual([0, 1, 1, 0, 1, 0, 1, 0]);
  });

  it('is cleared after a level change, so the next decision needs 6 new entries', () => {
    const updates = feed(state(), [
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
      true,
    ]);
    expect(updates[5]!.transition).toBe('level-up');
    expect(updates[5]!.state.window).toEqual([]);
    expect(updates.slice(6, 11).map((u) => u.transition)).toEqual([
      'none',
      'none',
      'none',
      'none',
      'none',
    ]);
    expect(last(updates).state).toMatchObject({ niveau: 2, window: [1, 1, 1, 1, 1] });
  });
});

describe('updateMastery – transitions', () => {
  it('levels up at exactly 6 entries with score 1', () => {
    const update = last(feed(state(), [true, true, true, true, true, true]));
    expect(update).toEqual({
      transition: 'level-up',
      state: expect.objectContaining({ niveau: 2, window: [], mastered: false }),
    });
  });

  it('levels up at exactly 0.75 (half points included)', () => {
    const update = last(feed(state({ niveau: 2 }), [true, true, true, 0.5, false, true]));
    expect(update.transition).toBe('level-up');
    expect(update.state.niveau).toBe(3);
  });

  it('stays just below 0.75', () => {
    const update = last(feed(state({ niveau: 2 }), [true, true, true, false, false, true]));
    expect(update).toMatchObject({ transition: 'none', state: { niveau: 2 } });
  });

  it('stays at exactly 0.5', () => {
    const update = last(feed(state({ niveau: 2 }), [true, true, true, false, false, false]));
    expect(update).toMatchObject({ transition: 'none', state: { niveau: 2 } });
    const halves = last(feed(state({ niveau: 2 }), [0.5, 0.5, 0.5, 0.5, 0.5, 0.5]));
    expect(halves).toMatchObject({ transition: 'none', state: { niveau: 2 } });
  });

  it('levels down below 0.5 and clears the window', () => {
    const update = last(feed(state({ niveau: 2 }), [true, true, false, false, false, 0.5]));
    expect(update).toEqual({
      transition: 'level-down',
      state: expect.objectContaining({ niveau: 1, window: [] }),
    });
  });

  it('never goes below niveau 1 and keeps the window there', () => {
    const update = last(feed(state({ niveau: 1 }), [false, false, false, false, false, false]));
    expect(update).toMatchObject({
      transition: 'none',
      state: { niveau: 1, window: [0, 0, 0, 0, 0, 0] },
    });
  });

  it('marks niveau 3 with ≥ 0.75 as mastered without clearing the window', () => {
    const update = last(feed(state({ niveau: 3 }), [true, true, true, true, true, true]));
    expect(update).toEqual({
      transition: 'mastered',
      state: expect.objectContaining({ niveau: 3, mastered: true, window: [1, 1, 1, 1, 1, 1] }),
    });
  });

  it('reports "mastered" only once', () => {
    const update = updateMastery(
      state({ niveau: 3, mastered: true, window: [1, 1, 1, 1, 1, 1] }),
      result(true),
    );
    expect(update.transition).toBe('none');
    expect(update.state.mastered).toBe(true);
  });

  it('never resets mastered, also after a level-down', () => {
    const update = last(
      feed(state({ niveau: 3, mastered: true }), [false, false, false, false, false, false]),
    );
    expect(update).toMatchObject({
      transition: 'level-down',
      state: { niveau: 2, mastered: true },
    });
  });

  it('counts review attempts like practice', () => {
    const s = state({ window: [1, 1, 1, 1, 1] });
    expect(updateMastery(s, result(true, 'review')).transition).toBe('level-up');
  });
});

describe('updateMastery – modes without effect', () => {
  it.each<AttemptMode>(['probetest', 'check'])('%s attempts leave the state untouched', (mode) => {
    const s = state({ window: [1, 1, 1, 1, 1] });
    const update = updateMastery(s, result(true, mode));
    expect(update).toEqual({ state: s, transition: 'none' });
    expect(update.state).toBe(s);
  });
});

describe('updateMastery – guards', () => {
  it('throws when the result belongs to another Bereich', () => {
    expect(() => updateMastery(state(), { ...result(true), bereich: 'raum-form' })).toThrow(
      /raum-form/,
    );
  });

  it('produces states that satisfy the schema', () => {
    for (const update of feed(state(), [true, 0.5, false, true, true, true, true, true])) {
      expect(masteryStateSchema.safeParse(update.state).success).toBe(true);
    }
  });
});

describe('Einstiegscheck', () => {
  it.each<[Correctness[], 1 | 2 | 3]>([
    [[], 1],
    [[false, false], 1],
    [[true, false], 2],
    [[false, true], 2],
    [[true, true], 3],
    [[true, true, true], 3],
    [[true, false, true], 3],
    [[0.5, true], 2],
  ])('ladder %j ends at niveau %i', (answers, expected) => {
    expect(checkLadderNiveau(answers.map((correct) => ({ correct })))).toBe(expected);
  });

  it('creates one state per Bereich of the Fach, empty window, not mastered', () => {
    const states = initialMasteryFromCheck(
      [
        { fach: 'mathe', bereich: 'zahlen-operationen', correct: true },
        { fach: 'mathe', bereich: 'raum-form', correct: false },
        { fach: 'mathe', bereich: 'zahlen-operationen', correct: true },
        { fach: 'mathe', bereich: 'raum-form', correct: true },
        { fach: 'mathe', bereich: 'groessen-messen', correct: false },
        { fach: 'mathe', bereich: 'groessen-messen', correct: false },
      ],
      { learnerId: 'learner-1', at: T0 },
    );
    expect(states.map((s) => [s.bereich, s.niveau])).toEqual([
      ['zahlen-operationen', 3],
      ['raum-form', 2],
      ['groessen-messen', 1],
      ['daten-zufall', 1],
      ['muster-strukturen', 1],
    ]);
    for (const s of states) {
      expect(s).toMatchObject({
        learnerId: 'learner-1',
        fach: 'mathe',
        window: [],
        mastered: false,
        updatedAt: T0,
      });
      expect(masteryStateSchema.safeParse(s).success).toBe(true);
    }
  });

  it('handles both Fächer and returns nothing for no results', () => {
    const states = initialMasteryFromCheck(
      [
        { fach: 'deutsch', bereich: 'rs-strategien', correct: true },
        { fach: 'mathe', bereich: 'daten-zufall', correct: true },
      ],
      { learnerId: 'learner-1', at: T0 },
    );
    expect(states).toHaveLength(9);
    expect(states.find((s) => s.bereich === 'rs-strategien')?.niveau).toBe(2);
    expect(initialMasteryFromCheck([], { learnerId: 'learner-1', at: T0 })).toEqual([]);
  });
});
