import { describe, expect, it } from 'vitest';
import {
  enqueueReview,
  isReviewDue,
  onReviewResult,
  reviewDueCutoff,
} from '../../../src/domain/scheduler';

const MON_NOON = '2026-10-12T10:00:00.000Z'; // 12:00 in Berlin

describe('Fehlerkiste', () => {
  it('enqueueReview: stage 1, due one day later', () => {
    expect(enqueueReview('learner-1', 'm-zo-1-903', MON_NOON)).toEqual({
      learnerId: 'learner-1',
      itemId: 'm-zo-1-903',
      stage: 1,
      dueAt: '2026-10-13T10:00:00.000Z',
    });
  });

  it('correct at stage 1 → stage 2 due three days later; correct again → done', () => {
    const entry = enqueueReview('learner-1', 'm-zo-1-903', MON_NOON);
    const tue = '2026-10-13T15:00:00.000Z';
    const stage2 = onReviewResult(entry, true, tue);
    expect(stage2).toMatchObject({ stage: 2, dueAt: '2026-10-16T15:00:00.000Z' });
    const fri = '2026-10-16T16:00:00.000Z';
    expect(onReviewResult(stage2, true, fri)).toMatchObject({ stage: 'done', dueAt: fri });
  });

  it('wrong keeps the stage and moves the due date one day', () => {
    const entry = enqueueReview('learner-1', 'm-zo-1-903', MON_NOON);
    expect(onReviewResult(entry, false, '2026-10-13T15:00:00.000Z')).toMatchObject({
      stage: 1,
      dueAt: '2026-10-14T15:00:00.000Z',
    });
    const stage2 = { ...entry, stage: 2 as const };
    expect(onReviewResult(stage2, false, '2026-10-16T09:00:00.000Z')).toMatchObject({
      stage: 2,
      dueAt: '2026-10-17T09:00:00.000Z',
    });
  });

  it('a self-rated 0.5 does not advance', () => {
    const entry = enqueueReview('learner-1', 'm-zo-3-902', MON_NOON);
    expect(onReviewResult(entry, 0.5, MON_NOON).stage).toBe(1);
  });

  it('a done entry stays done', () => {
    const done = { ...enqueueReview('learner-1', 'm-zo-1-903', MON_NOON), stage: 'done' as const };
    expect(onReviewResult(done, false, MON_NOON)).toBe(done);
  });
});

describe('isReviewDue', () => {
  const entry = {
    learnerId: 'learner-1',
    itemId: 'm-zo-1-903',
    stage: 1 as const,
    dueAt: '2026-10-13T16:00:00.000Z',
  };

  it('is not due the day before', () => {
    expect(isReviewDue(entry, '2026-10-12T20:00:00.000Z')).toBe(false);
  });

  it('is due from the start of the due day, even before the exact time', () => {
    expect(isReviewDue(entry, '2026-10-13T06:00:00.000Z')).toBe(true);
    expect(isReviewDue(entry, '2026-10-20T06:00:00.000Z')).toBe(true);
  });

  it('is never due when done', () => {
    expect(isReviewDue({ ...entry, stage: 'done' }, '2026-10-20T06:00:00.000Z')).toBe(false);
  });
});

describe('reviewDueCutoff', () => {
  it('is the start of the next local day (Europe/Berlin in tests)', () => {
    expect(reviewDueCutoff('2026-10-12T10:00:00.000Z')).toBe('2026-10-12T22:00:00.000Z');
    expect(reviewDueCutoff('2026-10-12T22:30:00.000Z')).toBe('2026-10-13T22:00:00.000Z');
  });

  it('covers every entry that isReviewDue accepts', () => {
    const now = '2026-10-12T10:00:00.000Z';
    const lateToday = {
      learnerId: 'l',
      itemId: 'm-zo-1-903',
      stage: 1 as const,
      dueAt: '2026-10-12T21:59:00.000Z',
    };
    const tomorrow = { ...lateToday, dueAt: '2026-10-12T22:00:00.000Z' };
    expect(isReviewDue(lateToday, now)).toBe(true);
    expect(lateToday.dueAt < reviewDueCutoff(now)).toBe(true);
    expect(isReviewDue(tomorrow, now)).toBe(false);
    expect(tomorrow.dueAt < reviewDueCutoff(now)).toBe(false);
  });
});
