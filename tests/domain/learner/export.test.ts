import { describe, expect, it } from 'vitest';
import {
  EXPORT_VERSION,
  parseImport,
  serialize,
  type ImportResult,
} from '../../../src/domain/learner';
import { sampleLearnerData } from '../../fixtures/learner';

const EXPORTED_AT = '2026-10-11T10:00:00.000Z';

function errorsOf(result: ImportResult) {
  if (result.ok) throw new Error('expected import to fail');
  return result.errors;
}

function exportJson(
  mutate: (file: Record<string, unknown> & ReturnType<typeof serialize>) => void = () => {},
) {
  const file = structuredClone(serialize(sampleLearnerData(), EXPORTED_AT));
  mutate(file);
  return JSON.stringify(file);
}

describe('serialize', () => {
  it('writes version 2 with all collections', () => {
    const file = serialize(sampleLearnerData(), EXPORTED_AT);
    expect(file.version).toBe(EXPORT_VERSION);
    expect(file.exportedAt).toBe(EXPORTED_AT);
    expect(Object.keys(file)).toEqual([
      'version',
      'exportedAt',
      'learner',
      'attempts',
      'mastery',
      'reviews',
      'sessions',
      'probetestRuns',
      'collectibles',
    ]);
  });
});

describe('parseImport', () => {
  it('migrates a version 1 file: runs get a status, results lose percent and halves', () => {
    const v2 = serialize(sampleLearnerData(), EXPORTED_AT);
    const {
      result: _r,
      endedAt: _e,
      endReason: _x,
      status: _s,
      currentIndex: _c,
      answers: _a,
      itemMs: _m,
      attemptIndex: _i,
      ratings: _t,
      ...base
    } = v2.probetestRuns[0]!;
    const v1 = {
      ...v2,
      version: '1',
      probetestRuns: [
        {
          ...base,
          submittedAt: '2026-10-11T09:40:00.000Z',
          result: { byBereich: { 'zahlen-operationen': { correct: 1.5, total: 3 } }, percent: 50 },
        },
        { ...base, id: 'run-2', attemptIds: [] },
      ],
    };
    const result = parseImport(JSON.stringify(v1));
    if (!result.ok) throw new Error(JSON.stringify(result.errors));
    const [submitted, unfinished] = result.data.probetestRuns;
    expect(submitted).toMatchObject({
      status: 'submitted',
      endedAt: '2026-10-11T09:40:00.000Z',
      endReason: 'submit',
      answers: {},
      ratings: {},
      result: {
        byBereich: { 'zahlen-operationen': { solved: 1, total: 3, pending: 0 } },
        total: { solved: 1, total: 3, pending: 0 },
      },
    });
    expect(unfinished).toMatchObject({
      status: 'aborted',
      endReason: 'expired',
      endedAt: EXPORTED_AT,
    });
    expect(unfinished).not.toHaveProperty('result');
  });

  it('roundtrip: serialize → JSON → parseImport returns the same data', () => {
    const data = sampleLearnerData();
    const result = parseImport(JSON.stringify(serialize(data, EXPORTED_AT)));
    expect(result).toEqual({ ok: true, data, exportedAt: EXPORTED_AT });
  });

  it('accepts already parsed JSON', () => {
    expect(parseImport(serialize(sampleLearnerData(), EXPORTED_AT)).ok).toBe(true);
  });

  it('rejects text that is not JSON', () => {
    expect(errorsOf(parseImport('{ kaputt'))).toEqual([
      { path: '', message: 'Die Datei ist keine gültige Fortschritts-Datei (kein JSON).' },
    ]);
  });

  it('rejects a missing or unknown version', () => {
    expect(errorsOf(parseImport('{}'))[0]?.path).toBe('version');
    expect(errorsOf(parseImport('[]'))[0]?.path).toBe('version');
    expect(errorsOf(parseImport(exportJson((f) => (f.version = '0' as '2'))))[0]?.message).toMatch(
      /keine gültige/,
    );
  });

  it('explains files from a newer app version', () => {
    expect(errorsOf(parseImport(exportJson((f) => (f.version = '3' as '2'))))).toEqual([
      {
        path: 'version',
        message: 'Die Datei stammt aus einer neueren Version der App. Bitte aktualisiere die App.',
      },
    ]);
  });

  it('lists every schema error with its path', () => {
    const errors = errorsOf(
      parseImport(
        exportJson((f) => {
          f.attempts[1]!.answer = { optionId: 4 };
          f.reviews[0]!.stage = 7 as 1;
        }),
      ),
    );
    expect(errors.map((e) => e.path)).toEqual(['attempts[1].answer.optionId', 'reviews[0].stage']);
  });

  it('rejects data of another learner', () => {
    expect(
      errorsOf(parseImport(exportJson((f) => (f.attempts[0]!.learnerId = 'learner-2')))),
    ).toEqual([
      {
        path: 'attempts[0].learnerId',
        message: 'learnerId "learner-2" gehört nicht zu "learner-1"',
      },
    ]);
  });

  it('rejects duplicate ids and duplicate mastery/review keys', () => {
    const errors = errorsOf(
      parseImport(
        exportJson((f) => {
          f.attempts[2]!.id = 'att-1';
          f.mastery.push({ ...f.mastery[0]! });
          f.reviews.push({ ...f.reviews[0]!, stage: 2 });
        }),
      ),
    );
    expect(errors.map((e) => e.path)).toEqual(
      expect.arrayContaining([
        'attempts[2]',
        'mastery[1]',
        'reviews[1]',
        'probetestRuns[0].attemptIds[0]',
      ]),
    );
  });

  it('rejects sessions and probetest runs that point to missing attempts', () => {
    const errors = errorsOf(
      parseImport(exportJson((f) => f.sessions[0]!.attemptIds.push('att-9'))),
    );
    expect(errors).toEqual([
      { path: 'sessions[0].attemptIds[2]', message: 'Attempt "att-9" fehlt' },
    ]);
  });

  it('rejects unknown top-level fields', () => {
    expect(errorsOf(parseImport(exportJson((f) => (f.extra = 1))))[0]?.message).toMatch(/extra/);
  });
});
