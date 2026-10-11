// Answer shapes per format. Zod schemas so stored attempts can be validated on import.

import { z } from 'zod';
import type { Format } from '../content';

const id = z.string();

export const selfRatingSchema = z.union([z.literal(1), z.literal(0.5), z.literal(0)]);
export type SelfRating = z.infer<typeof selfRatingSchema>;

export const answerSchemaByFormat = {
  'single-choice': z.strictObject({ optionId: id }),
  'multi-choice': z.strictObject({ optionIds: z.array(id) }),
  'number-input': z.strictObject({ value: z.number().finite() }),
  match: z.strictObject({ pairs: z.array(z.tuple([id, id])) }),
  order: z.strictObject({ orderedIds: z.array(id) }),
  'cloze-select': z.strictObject({ gaps: z.record(z.string(), z.string()) }),
  'mark-in-text': z.strictObject({ indices: z.array(z.number().int().nonnegative()) }),
  'find-error': z.strictObject({ errorIds: z.array(id) }),
  /** No auto-check: the child compares with the model answer and rates itself. */
  'short-answer': z.strictObject({ text: z.string().optional(), rating: selfRatingSchema }),
} as const satisfies Record<Format, z.ZodType>;

export type AnswerOf<F extends Format> = z.infer<(typeof answerSchemaByFormat)[F]>;
export type Answer = AnswerOf<Format>;

export function parseAnswer<F extends Format>(
  format: F,
  data: unknown,
): z.ZodSafeParseResult<AnswerOf<F>> {
  const schema: z.ZodType = answerSchemaByFormat[format];
  return schema.safeParse(data) as z.ZodSafeParseResult<AnswerOf<F>>;
}
