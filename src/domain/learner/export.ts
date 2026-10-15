// Export/import of all learner data (ARCHITECTURE.md §4). The export format is the future
// sync format, so it is versioned; parseImport migrates older versions step by step.

import { z } from 'zod';
import { formatIssuePath } from '../content';
import { masteryStateSchema, type MasteryState } from '../mastery';
import {
  attemptSchema,
  collectiblesSchema,
  learnerSchema,
  probetestRunSchema,
  reviewEntrySchema,
  sessionSchema,
  type Attempt,
  type Collectibles,
  type Learner,
  type ProbetestRun,
  type ReviewEntry,
  type Session,
} from './model';

/** 2 since 2026-10-15: ProbetestRun has status, drafts and self-ratings, a result without percent. */
export const EXPORT_VERSION = '2' as const;

/** Everything stored on the device for one learner. */
export interface LearnerData {
  learner: Learner;
  attempts: Attempt[];
  mastery: MasteryState[];
  reviews: ReviewEntry[];
  sessions: Session[];
  probetestRuns: ProbetestRun[];
  collectibles: Collectibles;
}

export const exportFileSchema = z.strictObject({
  version: z.literal(EXPORT_VERSION),
  exportedAt: z.iso.datetime({ offset: true }),
  learner: learnerSchema,
  attempts: z.array(attemptSchema),
  mastery: z.array(masteryStateSchema),
  reviews: z.array(reviewEntrySchema),
  sessions: z.array(sessionSchema),
  probetestRuns: z.array(probetestRunSchema),
  collectibles: collectiblesSchema,
});
export type ExportFile = z.infer<typeof exportFileSchema>;

export interface ImportError {
  /** Location in the file, e.g. `attempts[3].answer.optionId`; empty for the whole file. */
  path: string;
  message: string;
}

export type ImportResult =
  { ok: true; data: LearnerData; exportedAt: string } | { ok: false; errors: ImportError[] };

export function serialize(data: LearnerData, exportedAt: string): ExportFile {
  return {
    version: EXPORT_VERSION,
    exportedAt,
    learner: data.learner,
    attempts: data.attempts,
    mastery: data.mastery,
    reviews: data.reviews,
    sessions: data.sessions,
    probetestRuns: data.probetestRuns,
    collectibles: data.collectibles,
  };
}

/** Accepts the file content as string or as already parsed JSON. */
export function parseImport(json: unknown): ImportResult {
  let raw = json;
  if (typeof json === 'string') {
    try {
      raw = JSON.parse(json);
    } catch {
      return fail([
        { path: '', message: 'Die Datei ist keine gültige Fortschritts-Datei (kein JSON).' },
      ]);
    }
  }

  const version =
    typeof raw === 'object' && raw !== null ? (raw as { version?: unknown }).version : undefined;
  if (version === '1') {
    raw = migrateV1(raw as Record<string, unknown>);
  } else if (version !== EXPORT_VERSION) {
    const message =
      typeof version === 'string' && Number(version) > Number(EXPORT_VERSION)
        ? 'Die Datei stammt aus einer neueren Version der App. Bitte aktualisiere die App.'
        : 'Die Datei ist keine gültige Fortschritts-Datei (Version fehlt oder ist unbekannt).';
    return fail([{ path: 'version', message }]);
  }

  const parsed = exportFileSchema.safeParse(raw);
  if (!parsed.success) {
    return fail(
      parsed.error.issues.map((i) => ({ path: formatIssuePath(i.path), message: i.message })),
    );
  }

  const file = parsed.data;
  const errors = checkReferences(file);
  if (errors.length > 0) return fail(errors);

  const { exportedAt, learner, attempts, mastery, reviews, sessions, probetestRuns, collectibles } =
    file;
  return {
    ok: true,
    data: { learner, attempts, mastery, reviews, sessions, probetestRuns, collectibles },
    exportedAt,
  };
}

type Raw = Record<string, unknown>;

/**
 * v1 → v2: v1 runs only knew submittedAt and a result with `correct` (halves possible) and
 * `percent`. A run with submittedAt becomes "submitted"; one without was never finished and
 * becomes "aborted" (time is long up). Solved counts are rounded down (Teils is not solved).
 * Malformed input is copied as it is; the v2 schema reports it afterwards.
 */
function migrateV1(file: Raw): Raw {
  const runs = Array.isArray(file.probetestRuns) ? (file.probetestRuns as unknown[]) : [];
  return {
    ...file,
    version: EXPORT_VERSION,
    probetestRuns: runs.map((entry) => {
      if (typeof entry !== 'object' || entry === null) return entry;
      const { submittedAt, result, ...run } = entry as Raw;
      const submitted = typeof submittedAt === 'string';
      const migrated: Raw = {
        ...run,
        status: submitted ? 'submitted' : 'aborted',
        endedAt: submitted ? submittedAt : file.exportedAt,
        endReason: submitted ? 'submit' : 'expired',
        currentIndex: 0,
        answers: {},
        itemMs: {},
        attemptIndex: {},
        ratings: {},
      };
      if (submitted) migrated.result = migrateV1Result(result);
      return migrated;
    }),
  };
}

function migrateV1Result(result: unknown): Raw {
  const total = { solved: 0, total: 0, pending: 0 };
  const byBereich: Raw = {};
  const v1 = (result as { byBereich?: unknown } | undefined)?.byBereich;
  if (typeof v1 === 'object' && v1 !== null) {
    for (const [bereich, score] of Object.entries(v1 as Raw)) {
      const { correct, total: count } = (score ?? {}) as { correct?: unknown; total?: unknown };
      const solved = typeof correct === 'number' ? Math.floor(correct) : correct;
      byBereich[bereich] = { solved, total: count, pending: 0 };
      if (typeof solved === 'number' && typeof count === 'number') {
        total.solved += solved;
        total.total += count;
      }
    }
  }
  return { byBereich, total };
}

function fail(errors: ImportError[]): ImportResult {
  return { ok: false, errors };
}

function checkReferences(file: ExportFile): ImportError[] {
  const errors: ImportError[] = [];
  const learnerId = file.learner.id;
  const ownedBy = (path: string, owner: string) => {
    if (owner !== learnerId)
      errors.push({ path, message: `learnerId "${owner}" gehört nicht zu "${learnerId}"` });
  };
  const unique = (path: string, keys: string[], label: string) => {
    const seen = new Set<string>();
    keys.forEach((key, i) => {
      if (seen.has(key))
        errors.push({ path: `${path}[${i}]`, message: `${label} "${key}" ist doppelt` });
      seen.add(key);
    });
  };

  file.attempts.forEach((a, i) => ownedBy(`attempts[${i}].learnerId`, a.learnerId));
  file.mastery.forEach((m, i) => ownedBy(`mastery[${i}].learnerId`, m.learnerId));
  file.reviews.forEach((r, i) => ownedBy(`reviews[${i}].learnerId`, r.learnerId));
  file.sessions.forEach((s, i) => ownedBy(`sessions[${i}].learnerId`, s.learnerId));
  file.probetestRuns.forEach((p, i) => ownedBy(`probetestRuns[${i}].learnerId`, p.learnerId));
  ownedBy('collectibles.learnerId', file.collectibles.learnerId);

  unique(
    'attempts',
    file.attempts.map((a) => a.id),
    'Attempt-ID',
  );
  unique(
    'sessions',
    file.sessions.map((s) => s.id),
    'Session-ID',
  );
  unique(
    'probetestRuns',
    file.probetestRuns.map((p) => p.id),
    'Probetest-Lauf-ID',
  );
  unique(
    'mastery',
    file.mastery.map((m) => `${m.fach}/${m.bereich}`),
    'Mastery für',
  );
  unique(
    'reviews',
    file.reviews.map((r) => r.itemId),
    'Fehlerkiste-Eintrag für',
  );

  const attemptIds = new Set(file.attempts.map((a) => a.id));
  const checkAttemptRefs = (path: string, ids: string[]) =>
    ids.forEach((attemptId, i) => {
      if (!attemptIds.has(attemptId))
        errors.push({ path: `${path}[${i}]`, message: `Attempt "${attemptId}" fehlt` });
    });
  file.sessions.forEach((s, i) => checkAttemptRefs(`sessions[${i}].attemptIds`, s.attemptIds));
  file.probetestRuns.forEach((p, i) =>
    checkAttemptRefs(`probetestRuns[${i}].attemptIds`, p.attemptIds),
  );

  return errors;
}
