import { describe, expect, it } from 'vitest';
import type { Niveau } from '../../../src/domain/content';
import { completeCheck, recordCheckAnswer, startDiscoveries } from '../../../src/domain/check';
import { sessionSchema, attemptSchema, type Attempt } from '../../../src/domain/learner';
import { item } from '../../fixtures/pool';

const T0 = '2026-10-14T08:00:00.000Z';
const T1 = '2026-10-14T08:10:00.000Z';

function answered(
  bereich: Parameters<typeof item>[0],
  niveau: Niveau,
  n: number,
  correct: boolean,
) {
  const it = item(bereich, niveau, n);
  if (it.format !== 'single-choice') throw new Error('fixture must be single-choice');
  const wrong = it.payload.options.find((o) => o.id !== it.solution.optionId)!;
  return recordCheckAnswer({
    learnerId: 'learner-1',
    item: it,
    answer: { optionId: correct ? it.solution.optionId : wrong.id },
    attemptId: `a-${bereich}-${n}`,
    now: T0,
    durationMs: 12_345.6,
  });
}

describe('recordCheckAnswer', () => {
  it('stores a check attempt and hands the result to the ladder only', () => {
    const { attempt, answer } = answered('raum-form', 2, 1, false);
    expect(attempt).toMatchObject({
      id: 'a-raum-form-1',
      learnerId: 'learner-1',
      fach: 'mathe',
      bereich: 'raum-form',
      niveau: 2,
      correct: false,
      mode: 'check',
      durationMs: 12346,
      at: T0,
    });
    expect(attemptSchema.safeParse(attempt).success).toBe(true);
    expect(answer).toEqual({
      itemId: attempt.itemId,
      fach: 'mathe',
      bereich: 'raum-form',
      niveau: 2,
      correct: false,
    });
  });

  it('rejects an answer of the wrong format', () => {
    expect(() =>
      recordCheckAnswer({
        learnerId: 'l',
        item: item('raum-form', 1, 1),
        answer: { value: 3 },
        attemptId: 'a',
        now: T0,
        durationMs: 0,
      }),
    ).toThrow(/single-choice/);
  });
});

describe('startDiscoveries', () => {
  it('writes one Entdeckung per Etappe below the starting niveau', () => {
    expect(
      startDiscoveries([
        { bereich: 'zahlen-operationen', niveau: 3 },
        { bereich: 'raum-form', niveau: 2 },
        { bereich: 'daten-zufall', niveau: 1 },
      ]),
    ).toEqual(['zahlen-operationen:1', 'zahlen-operationen:2', 'raum-form:1']);
  });
});

describe('completeCheck', () => {
  const attempts: Attempt[] = [
    answered('zahlen-operationen', 1, 1, true),
    answered('raum-form', 1, 1, false),
    answered('zahlen-operationen', 2, 2, true),
    answered('raum-form', 1, 2, true),
    answered('zahlen-operationen', 3, 3, true),
    answered('raum-form', 2, 3, false),
  ].map((r) => r.attempt);

  const done = completeCheck({
    learnerId: 'learner-1',
    fach: 'mathe',
    sessionId: 'check-1',
    startedAt: T0,
    attempts,
    now: T1,
  });

  it('sets the starting niveau of each checked Bereich (highest passed)', () => {
    expect(done.mastery.map((m) => [m.bereich, m.niveau, m.window, m.updatedAt])).toEqual([
      ['zahlen-operationen', 3, [], T1],
      ['raum-form', 1, [], T1],
    ]);
  });

  it('discovers the Etappen below the start', () => {
    expect(done.discovered).toEqual(['zahlen-operationen:1', 'zahlen-operationen:2']);
  });

  it('closes a finished check session over all attempts', () => {
    expect(done.session).toEqual({
      id: 'check-1',
      learnerId: 'learner-1',
      mode: 'check',
      startedAt: T0,
      endedAt: T1,
      attemptIds: attempts.map((a) => a.id),
      goalReached: true,
    });
    expect(sessionSchema.safeParse(done.session).success).toBe(true);
  });

  it('has nothing for the Fehlerkiste: the result carries no review entries', () => {
    expect(Object.keys(done).sort()).toEqual(['discovered', 'mastery', 'session']);
  });

  it('refuses an empty check and foreign attempts', () => {
    const base = {
      learnerId: 'learner-1',
      fach: 'mathe' as const,
      sessionId: 's',
      startedAt: T0,
      now: T1,
    };
    expect(() => completeCheck({ ...base, attempts: [] })).toThrow(/without answers/);
    expect(() =>
      completeCheck({ ...base, attempts: [{ ...attempts[0]!, mode: 'practice' }] }),
    ).toThrow(/does not belong/);
    expect(() => completeCheck({ ...base, fach: 'deutsch', attempts })).toThrow(/does not belong/);
  });
});
