import { describe, expect, it } from 'vitest';
import type { ReviewEntry, Session } from '../../../src/domain/learner';
import { attemptSchema } from '../../../src/domain/learner';
import type { Bereich } from '../../../src/domain/content';
import {
  SESSION_GOAL,
  isSameLocalDay,
  lastActivity,
  planSessionStart,
  recordPracticeAnswer,
  startPracticeSession,
  type PracticeAnswerInput,
} from '../../../src/domain/practice';
import { masteryFor } from '../../fixtures/pool';
import { numberInput, singleChoice } from '../../fixtures/items';

const NOW = '2026-10-11T10:00:00.000Z';
const ZO = 'zahlen-operationen' as const;

function input(overrides: Partial<PracticeAnswerInput> = {}): PracticeAnswerInput {
  return {
    session: startPracticeSession('ses-1', 'learner-1', '2026-10-11T09:55:00.000Z'),
    item: numberInput,
    answer: { value: 7603 },
    mastery: masteryFor(ZO, 1),
    review: undefined,
    source: 'practice',
    attemptId: 'att-1',
    now: NOW,
    durationMs: 41234.6,
    ...overrides,
  };
}

describe('startPracticeSession', () => {
  it('creates an empty practice session', () => {
    expect(startPracticeSession('ses-1', 'learner-1', NOW)).toEqual({
      id: 'ses-1',
      learnerId: 'learner-1',
      mode: 'practice',
      startedAt: NOW,
      attemptIds: [],
      goalReached: false,
    });
  });
});

describe('recordPracticeAnswer', () => {
  it('builds a valid attempt and appends it to the session', () => {
    const result = recordPracticeAnswer(input());
    expect(result.attempt).toEqual({
      id: 'att-1',
      learnerId: 'learner-1',
      itemId: 'm-zo-1-001',
      fach: 'mathe',
      bereich: ZO,
      niveau: 1,
      format: 'number-input',
      correct: true,
      answer: { value: 7603 },
      durationMs: 41235,
      mode: 'practice',
      at: NOW,
    });
    expect(attemptSchema.safeParse(result.attempt).success).toBe(true);
    expect(result.session.attemptIds).toEqual(['att-1']);
    expect(result.finished).toBe(false);
    expect(result.session.endedAt).toBeUndefined();
  });

  it('feeds the result into the mastery window', () => {
    const result = recordPracticeAnswer(input({ answer: { value: 7503 } }));
    expect(result.evaluation.correct).toBe(false);
    expect(result.mastery.window).toEqual([0]);
    expect(result.mastery.updatedAt).toBe(NOW);
    expect(result.transition).toBe('none');
  });

  it('reports a level change', () => {
    const mastery = { ...masteryFor(ZO, 1), window: [1, 1, 1, 1, 1] as (0 | 1)[] };
    const result = recordPracticeAnswer(input({ mastery }));
    expect(result.transition).toBe('level-up');
    expect(result.mastery).toMatchObject({ niveau: 2, window: [] });
    expect(result.discovered).toBe('zahlen-operationen:1');
  });

  it('discovers Etappe 3 when the Gebiet is mastered, nothing on other answers', () => {
    const top = { ...masteryFor(ZO, 3), window: [1, 1, 1, 1, 1] as (0 | 1)[] };
    expect(recordPracticeAnswer(input({ mastery: top })).discovered).toBe('zahlen-operationen:3');
    expect(recordPracticeAnswer(input()).discovered).toBeUndefined();
    const sinking = { ...masteryFor(ZO, 2), window: [0, 0, 0, 0, 0] as (0 | 1)[] };
    const down = recordPracticeAnswer(input({ mastery: sinking, answer: { value: 1 } }));
    expect(down.transition).toBe('level-down');
    expect(down.discovered).toBeUndefined();
  });

  it('puts a wrong practice item into the Fehlerkiste for tomorrow', () => {
    const result = recordPracticeAnswer(input({ answer: { value: 1 } }));
    expect(result.review).toEqual({
      learnerId: 'learner-1',
      itemId: 'm-zo-1-001',
      stage: 1,
      dueAt: '2026-10-12T10:00:00.000Z',
    });
  });

  it('restarts an existing Fehlerkiste entry when a practice item is wrong again', () => {
    const existing: ReviewEntry = {
      learnerId: 'learner-1',
      itemId: 'm-zo-1-001',
      stage: 2,
      dueAt: '2026-10-14T10:00:00.000Z',
    };
    const result = recordPracticeAnswer(input({ answer: { value: 1 }, review: existing }));
    expect(result.review).toMatchObject({ stage: 1, dueAt: '2026-10-12T10:00:00.000Z' });
  });

  it('leaves the Fehlerkiste alone for a correct practice item', () => {
    expect(recordPracticeAnswer(input()).review).toBeUndefined();
  });

  it('moves a review item along the Fehlerkiste and marks the attempt as review', () => {
    const review: ReviewEntry = {
      learnerId: 'learner-1',
      itemId: 'm-gm-2-004',
      stage: 1,
      dueAt: '2026-10-11T08:00:00.000Z',
    };
    const result = recordPracticeAnswer(
      input({
        item: singleChoice,
        answer: { optionId: 'a' },
        mastery: masteryFor('groessen-messen', 2),
        review,
        source: 'review',
      }),
    );
    expect(result.attempt.mode).toBe('review');
    expect(result.review).toMatchObject({ stage: 2, dueAt: '2026-10-14T10:00:00.000Z' });
    expect(result.mastery.window).toEqual([1]);
  });

  it(`finishes the session with the ${SESSION_GOAL}th answer`, () => {
    const session: Session = {
      ...startPracticeSession('ses-1', 'learner-1', NOW),
      attemptIds: Array.from({ length: SESSION_GOAL - 1 }, (_, i) => `att-${i}`),
    };
    const result = recordPracticeAnswer(input({ session, attemptId: 'att-last' }));
    expect(result.finished).toBe(true);
    expect(result.session).toMatchObject({ goalReached: true, endedAt: NOW });
    expect(result.session.attemptIds).toHaveLength(SESSION_GOAL);
  });

  it('rejects answers for a finished session and answers of the wrong shape', () => {
    const ended = { ...startPracticeSession('ses-1', 'learner-1', NOW), endedAt: NOW };
    expect(() => recordPracticeAnswer(input({ session: ended }))).toThrow(/already finished/);
    expect(() => recordPracticeAnswer(input({ answer: { optionId: 'a' } }))).toThrow(
      /number-input/,
    );
  });
});

describe('planSessionStart (day boundary by last answer, Europe/Berlin in tests)', () => {
  const ZO_ = 'zahlen-operationen' as const;
  const open = (id: string, startedAt: string, attemptIds: string[]): Session => ({
    ...startPracticeSession(id, 'learner-1', startedAt),
    attemptIds,
  });
  const at = (bereich: Bereich, time: string) => ({ bereich, at: time });
  const attempts = new Map([
    ['a1', at(ZO_, '2026-10-12T06:05:00.000Z')],
    ['a2', at(ZO_, '2026-10-12T07:05:00.000Z')],
    ['b1', at('raum-form', '2026-10-12T06:05:00.000Z')],
  ]);

  it('compares calendar days in local time', () => {
    // 23:59 and 00:01 Berlin time (UTC+2) are different days although 2 minutes apart.
    expect(isSameLocalDay('2026-10-11T21:59:00.000Z', '2026-10-11T22:01:00.000Z')).toBe(false);
    expect(isSameLocalDay('2026-10-11T22:01:00.000Z', '2026-10-12T21:59:00.000Z')).toBe(true);
  });

  it('takes the newest answer as last activity, else startedAt', () => {
    const s = open('s1', '2026-10-12T06:00:00.000Z', ['a2', 'a1', 'missing']);
    expect(lastActivity(s, attempts)).toBe('2026-10-12T07:05:00.000Z');
    expect(lastActivity(open('s2', '2026-10-12T06:00:00.000Z', []), attempts)).toBe(
      '2026-10-12T06:00:00.000Z',
    );
  });

  it("continues today's open session of the same Bereich", () => {
    const today = open('s1', '2026-10-12T06:00:00.000Z', ['a1', 'a2']);
    const plan = planSessionStart({
      sessions: [today],
      attempts,
      bereich: ZO_,
      now: '2026-10-12T15:00:00.000Z',
    });
    expect(plan).toEqual({ resume: today, close: [] });
  });

  it('closes sessions whose last answer was on an earlier day and starts fresh', () => {
    // Last answer 23:58 Berlin, next start 00:01.
    const evening = new Map([['e1', at(ZO_, '2026-10-11T21:58:00.000Z')]]);
    const yesterday = open('s1', '2026-10-11T21:55:00.000Z', ['e1']);
    const now = '2026-10-11T22:01:00.000Z';
    const plan = planSessionStart({ sessions: [yesterday], attempts: evening, bereich: ZO_, now });
    expect(plan.resume).toBeNull();
    expect(plan.close).toEqual([{ ...yesterday, endedAt: now, goalReached: false }]);
  });

  it('continues a session that began before midnight but was answered after it', () => {
    // Started 23:55 Berlin, last answer 00:03, next start 00:10: still today's session.
    const late = new Map([
      ['e1', at(ZO_, '2026-10-11T21:57:00.000Z')],
      ['e2', at(ZO_, '2026-10-11T22:03:00.000Z')],
    ]);
    const session = open('s1', '2026-10-11T21:55:00.000Z', ['e1', 'e2']);
    const plan = planSessionStart({
      sessions: [session],
      attempts: late,
      bereich: ZO_,
      now: '2026-10-11T22:10:00.000Z',
    });
    expect(plan).toEqual({ resume: session, close: [] });
  });

  it("keeps today's sessions of other Bereiche open and ignores finished ones", () => {
    const otherBereich = open('s1', '2026-10-12T06:00:00.000Z', ['b1']);
    const finished = {
      ...open('s2', '2026-10-10T06:00:00.000Z', ['a1']),
      endedAt: '2026-10-10T06:10:00.000Z',
    };
    const mixed = open('s3', '2026-10-12T07:00:00.000Z', ['a1', 'b1']);
    const plan = planSessionStart({
      sessions: [otherBereich, finished, mixed],
      attempts,
      bereich: ZO_,
      now: '2026-10-12T08:00:00.000Z',
    });
    expect(plan).toEqual({ resume: null, close: [] });
  });

  it('picks the most recently answered of several open sessions of today', () => {
    // s1 started later, but s2 was answered last.
    const startedLater = open('s1', '2026-10-12T06:30:00.000Z', ['a1']);
    const answeredLater = open('s2', '2026-10-12T06:00:00.000Z', ['a2']);
    const plan = planSessionStart({
      sessions: [startedLater, answeredLater],
      attempts,
      bereich: ZO_,
      now: '2026-10-12T08:00:00.000Z',
    });
    expect(plan.resume?.id).toBe('s2');
  });
});
