// Persisted learner entities (ARCHITECTURE.md §4). Zod schemas because everything here
// ends up in the export file and must be validated on import.

import { z } from 'zod';
import {
  ITEM_ID_PATTERN,
  bereichSchema,
  fachOfBereich,
  fachSchema,
  formatSchema,
  niveauSchema,
} from '../content';
import { answerSchemaByFormat, selfRatingSchema } from '../evaluation';

const id = z.string().min(1);
const isoDateTime = z.iso.datetime({ offset: true });

export const attemptModeSchema = z.enum(['check', 'practice', 'review', 'probetest']);
export type AttemptMode = z.infer<typeof attemptModeSchema>;

export const correctnessSchema = z.union([z.boolean(), z.literal(0.5)]);

export const learnerSchema = z.strictObject({
  id,
  name: z.string().trim().min(1).optional(),
  createdAt: isoDateTime,
  settings: z.strictObject({
    readAloud: z.boolean(),
    bundesland: z.literal('BW'),
  }),
});
export type Learner = z.infer<typeof learnerSchema>;

export const attemptSchema = z
  .strictObject({
    id,
    learnerId: id,
    itemId: z.string().regex(ITEM_ID_PATTERN),
    fach: fachSchema,
    bereich: bereichSchema,
    niveau: niveauSchema,
    format: formatSchema,
    correct: correctnessSchema,
    /** Stored in full for later item statistics; shape depends on `format`. */
    answer: z.unknown(),
    durationMs: z.number().int().nonnegative(),
    mode: attemptModeSchema,
    at: isoDateTime,
  })
  .superRefine((attempt, ctx) => {
    if (fachOfBereich(attempt.bereich) !== attempt.fach) {
      ctx.addIssue({
        code: 'custom',
        path: ['bereich'],
        message: `Bereich gehört nicht zum Fach "${attempt.fach}"`,
      });
    }
    const answer = answerSchemaByFormat[attempt.format].safeParse(attempt.answer);
    if (!answer.success) {
      for (const issue of answer.error.issues) {
        ctx.addIssue({
          code: 'custom',
          path: ['answer', ...issue.path.map((p) => (typeof p === 'symbol' ? String(p) : p))],
          message: `Antwort passt nicht zum Format "${attempt.format}": ${issue.message}`,
        });
      }
    }
  });
export type Attempt = z.infer<typeof attemptSchema>;

/** Fehlerkiste entry: stage 1 due after +1 day, stage 2 after +3 days, then done. */
export const reviewEntrySchema = z.strictObject({
  learnerId: id,
  itemId: z.string().regex(ITEM_ID_PATTERN),
  dueAt: isoDateTime,
  stage: z.union([z.literal(1), z.literal(2), z.literal('done')]),
});
export type ReviewEntry = z.infer<typeof reviewEntrySchema>;

export const sessionSchema = z.strictObject({
  id,
  learnerId: id,
  mode: attemptModeSchema,
  startedAt: isoDateTime,
  endedAt: isoDateTime.optional(),
  attemptIds: z.array(id),
  goalReached: z.boolean(),
});
export type Session = z.infer<typeof sessionSchema>;

/** Per Bereich and in total: solved items, all items, short answers still waiting for a self-rating. */
const probetestScoreSchema = z.strictObject({
  solved: z.number().int().nonnegative(),
  total: z.number().int().nonnegative(),
  pending: z.number().int().nonnegative(),
});

export const probetestRunStatusSchema = z.enum(['running', 'submitted', 'aborted']);
export type ProbetestRunStatus = z.infer<typeof probetestRunStatusSchema>;

/** submit/time end with a result; leave ("Zur Karte") and expired (time up while away) do not. */
export const probetestEndReasonSchema = z.enum(['submit', 'time', 'leave', 'expired']);
export type ProbetestEndReason = z.infer<typeof probetestEndReasonSchema>;

const itemKey = z.string().regex(ITEM_ID_PATTERN);

/**
 * One go at a Probetest (ARCHITECTURE.md §4). Drafts are stored with every change while it runs,
 * so a reload or an iOS kill loses nothing; attempts (mode "probetest") are written when it ends.
 */
export const probetestRunSchema = z
  .strictObject({
    id,
    learnerId: id,
    probetestId: z.string().regex(/^(mathe|deutsch)-\d{2}$/),
    startedAt: isoDateTime,
    status: probetestRunStatusSchema,
    endedAt: isoDateTime.optional(),
    endReason: probetestEndReasonSchema.optional(),
    /** The item a resumed run continues with. */
    currentIndex: z.number().int().nonnegative(),
    /** Draft answers as the renderers report them (short-answer: { text }, no rating). */
    answers: z.record(itemKey, z.unknown()),
    /** Time spent on each item, summed over all visits. */
    itemMs: z.record(itemKey, z.number().int().nonnegative()),
    /** Fixed at the start (earlier attempts of the item): the option order stays the same. */
    attemptIndex: z.record(itemKey, z.number().int().nonnegative()),
    /** Self-ratings of short answers, given when looking through the submitted run. */
    ratings: z.record(itemKey, selfRatingSchema),
    attemptIds: z.array(id),
    /** No percent anywhere (decision 2026-10-15). */
    result: z
      .strictObject({
        byBereich: z.partialRecord(bereichSchema, probetestScoreSchema),
        total: probetestScoreSchema,
      })
      .optional(),
  })
  .superRefine((run, ctx) => {
    const issue = (path: string, message: string) =>
      ctx.addIssue({ code: 'custom', path: [path], message });
    const ended = run.endedAt !== undefined && run.endReason !== undefined;
    if (run.status === 'running') {
      if (run.endedAt || run.endReason || run.result)
        issue('status', 'Ein laufender Probetest hat kein Ende und kein Ergebnis');
    } else if (!ended) {
      issue('endedAt', 'Ein beendeter Probetest braucht endedAt und endReason');
    } else if (run.status === 'submitted') {
      if (run.endReason !== 'submit' && run.endReason !== 'time')
        issue('endReason', 'Abgegeben wird per Abgabe oder Zeitablauf');
      if (!run.result) issue('result', 'Ein abgegebener Probetest hat ein Ergebnis');
    } else {
      if (run.endReason !== 'leave' && run.endReason !== 'expired')
        issue('endReason', 'Abgebrochen wird per "Zur Karte" oder abgelaufener Zeit');
      if (run.result) issue('result', 'Ein abgebrochener Probetest hat kein Ergebnis');
    }
  });
export type ProbetestRun = z.infer<typeof probetestRunSchema>;
export type ProbetestScore = z.infer<typeof probetestScoreSchema>;
export type ProbetestResult = NonNullable<ProbetestRun['result']>;

/** Entdeckungen: one id per mastered Etappe, purely decorative (Fundstücke are answered items). */
export const collectiblesSchema = z.strictObject({
  learnerId: id,
  unlocked: z.array(z.string().min(1)),
});
export type Collectibles = z.infer<typeof collectiblesSchema>;
