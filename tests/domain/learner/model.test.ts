import { describe, expect, it } from 'vitest';
import { formatIssuePath } from '../../../src/domain/content';
import {
  attemptSchema,
  collectiblesSchema,
  learnerSchema,
  probetestRunSchema,
  reviewEntrySchema,
  sessionSchema,
} from '../../../src/domain/learner';
import { sampleLearnerData } from '../../fixtures/learner';

const data = sampleLearnerData();
const paths = (r: { success: boolean; error?: { issues: { path: PropertyKey[] }[] } }) =>
  r.success ? [] : (r.error?.issues ?? []).map((i) => formatIssuePath(i.path));

describe('learner entity schemas', () => {
  it('accept the sample data', () => {
    expect(learnerSchema.safeParse(data.learner).success).toBe(true);
    for (const a of data.attempts) expect(paths(attemptSchema.safeParse(a))).toEqual([]);
    expect(reviewEntrySchema.safeParse(data.reviews[0]).success).toBe(true);
    expect(sessionSchema.safeParse(data.sessions[0]).success).toBe(true);
    expect(probetestRunSchema.safeParse(data.probetestRuns[0]).success).toBe(true);
    expect(collectiblesSchema.safeParse(data.collectibles).success).toBe(true);
  });

  it('Learner: only BW, optional name not empty', () => {
    expect(
      paths(
        learnerSchema.safeParse({
          ...data.learner,
          settings: { readAloud: true, bundesland: 'BY' },
        }),
      ),
    ).toEqual(['settings.bundesland']);
    expect(paths(learnerSchema.safeParse({ ...data.learner, name: '' }))).toEqual(['name']);
    const { name: _name, ...anonymous } = data.learner;
    expect(learnerSchema.safeParse(anonymous).success).toBe(true);
  });

  it('Attempt: answer must match the format', () => {
    const attempt = { ...data.attempts[0]!, answer: { optionId: 'a' } };
    expect(paths(attemptSchema.safeParse(attempt)).sort()).toEqual(['answer', 'answer.value']);
  });

  it('Attempt: bereich must belong to fach, correct is boolean or 0.5, mode is known', () => {
    expect(
      paths(attemptSchema.safeParse({ ...data.attempts[0]!, bereich: 'rs-strategien' })),
    ).toEqual(['bereich']);
    expect(paths(attemptSchema.safeParse({ ...data.attempts[0]!, correct: 1 }))).toEqual([
      'correct',
    ]);
    expect(paths(attemptSchema.safeParse({ ...data.attempts[0]!, mode: 'exam' }))).toEqual([
      'mode',
    ]);
  });

  it('ReviewEntry: stage is 1, 2 or "done"', () => {
    expect(reviewEntrySchema.safeParse({ ...data.reviews[0]!, stage: 'done' }).success).toBe(true);
    expect(paths(reviewEntrySchema.safeParse({ ...data.reviews[0]!, stage: 3 }))).toEqual([
      'stage',
    ]);
  });

  it('ProbetestRun: percent within 0–100, result optional', () => {
    const run = data.probetestRuns[0]!;
    expect(
      paths(probetestRunSchema.safeParse({ ...run, result: { ...run.result!, percent: 120 } })),
    ).toEqual(['result.percent']);
    const { result: _result, submittedAt: _submittedAt, ...running } = run;
    expect(probetestRunSchema.safeParse(running).success).toBe(true);
  });

  it('timestamps must be ISO date-times', () => {
    expect(
      paths(sessionSchema.safeParse({ ...data.sessions[0]!, startedAt: '11.10.2026' })),
    ).toEqual(['startedAt']);
  });
});
