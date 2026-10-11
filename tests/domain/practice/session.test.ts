import { describe, expect, it } from 'vitest';
import type { ReviewEntry, Session } from '../../../src/domain/learner';
import { attemptSchema } from '../../../src/domain/learner';
import {
  SESSION_GOAL,
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
