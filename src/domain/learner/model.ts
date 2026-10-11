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
import { answerSchemaByFormat } from '../evaluation';

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

const bereichScoreSchema = z.strictObject({
  /** May contain halves from self-rated short answers. */
  correct: z.number().nonnegative(),
  total: z.number().int().nonnegative(),
});

export const probetestRunSchema = z.strictObject({
  id,
  learnerId: id,
  probetestId: z.string().regex(/^(mathe|deutsch)-\d{2}$/),
  startedAt: isoDateTime,
  submittedAt: isoDateTime.optional(),
  attemptIds: z.array(id),
  result: z
    .strictObject({
      byBereich: z.partialRecord(bereichSchema, bereichScoreSchema),
      percent: z.number().min(0).max(100),
    })
    .optional(),
});
export type ProbetestRun = z.infer<typeof probetestRunSchema>;

/** Entdeckungen: one id per mastered Etappe, purely decorative (Fundstücke are answered items). */
export const collectiblesSchema = z.strictObject({
  learnerId: id,
  unlocked: z.array(z.string().min(1)),
});
export type Collectibles = z.infer<typeof collectiblesSchema>;
