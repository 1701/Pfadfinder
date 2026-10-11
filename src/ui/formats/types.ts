// Renderer contract (ARCHITECTURE.md §6).

import type { Format, ItemOf, SolutionOf } from '../../domain/content';
import type { AnswerOf, Correctness } from '../../domain/evaluation';

export interface FormatProps<F extends Format> {
  item: ItemOf<F>;
  /** How often the learner answered this item before; seeds the order of options/elements. */
  attemptIndex: number;
  answer: AnswerOf<F> | null;
  /** null: nothing valid entered (yet), so the Prüfen button stays disabled. */
  onChange(answer: AnswerOf<F> | null): void;
  /** After checking. */
  disabled: boolean;
  revealed?: { correct: Correctness; solution: SolutionOf<F> };
}
