import { describe, expect, it } from 'vitest';
import type { Bereich } from '../../../src/domain/content';
import type { Correctness } from '../../../src/domain/evaluation';
import {
  checkLadderNiveau,
  checkStartNiveau,
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
  ])('ladder %j puts the next item on niveau %i', (answers, expected) => {
    expect(checkLadderNiveau(answers.map((correct) => ({ correct })))).toBe(expected);
  });

  // The niveaus are those the ladder serves: I first, +1 after a correct answer.
  it.each<[string, [1 | 2 | 3, Correctness][], 1 | 2 | 3]>([
    [
      'R R',
      [
        [1, true],
        [2, true],
      ],
      2,
    ],
    [
      'R R R',
      [
        [1, true],
        [2, true],
        [3, true],
      ],
      3,
    ],
    [
      'R R W',
      [
        [1, true],
        [2, true],
        [3, false],
      ],
      2,
    ],
    [
      'W R R',
      [
        [1, false],
        [1, true],
        [2, true],
      ],
      2,
    ],
    [
      'R W W',
      [
        [1, true],
        [2, false],
        [2, false],
      ],
      1,
    ],
    [
      'R W R',
      [
        [1, true],
        [2, false],
        [2, true],
      ],
      2,
    ],
    [
      'W W',
      [
        [1, false],
        [1, false],
      ],
      1,
    ],
    ['no answers', [], 1],
    [
      '0.5 never passes',
      [
        [1, true],
        [2, 0.5],
      ],
      1,
    ],
  ])('start niveau = highest passed niveau: %s', (_, answers, expected) => {
    expect(checkStartNiveau(answers.map(([niveau, correct]) => ({ niveau, correct })))).toBe(
      expected,
    );
  });

  it('counts the niveau of the item shown, also when the ladder had to deviate', () => {
    // Rung 2 was missing, a second niveau-1 item came instead.
    expect(
      checkStartNiveau([
        { niveau: 1, correct: true },
        { niveau: 1, correct: true },
      ]),
    ).toBe(1);
  });

  it('creates one state per checked Bereich, empty window, not mastered', () => {
    const r = (bereich: Bereich, niveau: 1 | 2 | 3, correct: boolean) => ({
      fach: 'mathe' as const,
      bereich,
      niveau,
      correct,
    });
    const states = initialMasteryFromCheck(
      [
        r('zahlen-operationen', 1, true),
        r('raum-form', 1, false),
        r('zahlen-operationen', 2, true),
        r('raum-form', 1, true),
        r('groessen-messen', 1, false),
        r('groessen-messen', 1, false),
        r('zahlen-operationen', 3, true),
        r('raum-form', 2, false),
      ],
      { learnerId: 'learner-1', at: T0 },
    );
    expect(states.map((s) => [s.bereich, s.niveau])).toEqual([
      ['zahlen-operationen', 3],
      ['raum-form', 1],
      ['groessen-messen', 1],
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
        { fach: 'deutsch', bereich: 'rs-strategien', niveau: 2, correct: true },
        { fach: 'mathe', bereich: 'daten-zufall', niveau: 1, correct: true },
      ],
      { learnerId: 'learner-1', at: T0 },
    );
    expect(states.map((s) => [s.bereich, s.niveau])).toEqual([
      ['rs-strategien', 2],
      ['daten-zufall', 1],
    ]);
    expect(initialMasteryFromCheck([], { learnerId: 'learner-1', at: T0 })).toEqual([]);
  });
});
