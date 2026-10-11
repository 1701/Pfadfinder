import type { z } from 'zod';
import type {
  itemSchema,
  itemStatusSchema,
  niveauSchema,
  probetestSchema,
  readingTextSchema,
} from './schemas';

export type { Bereich, Fach } from './taxonomy';
export type { TextUnit } from './units';

export type Item = z.infer<typeof itemSchema>;
export type Format = Item['format'];
export type Niveau = z.infer<typeof niveauSchema>;
export type ItemStatus = z.infer<typeof itemStatusSchema>;
export type Stimulus = NonNullable<Item['stimulus']>;
export type Feedback = Item['feedback'];

/** The item variant for one format, e.g. `ItemOf<'single-choice'>`. */
export type ItemOf<F extends Format> = Extract<Item, { format: F }>;
export type PayloadOf<F extends Format> = ItemOf<F>['payload'];
export type SolutionOf<F extends Format> = ItemOf<F>['solution'];
export type Payload = Item['payload'];
export type Solution = Item['solution'];

export type ReadingText = z.infer<typeof readingTextSchema>;
export type Probetest = z.infer<typeof probetestSchema>;
