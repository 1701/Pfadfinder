// Renderer contract (ARCHITECTURE.md §6).

import type { Format, ItemOf, SolutionOf } from '../../domain/content';
import type { AnswerOf, Correctness } from '../../domain/evaluation';

/**
 * What a renderer reports while the child answers. Equal to the answer, except short-answer:
 * its rating comes from the band after comparing, so the renderer only reports the text.
 */
export type DraftOf<F extends Format> = F extends 'short-answer' ? { text: string } : AnswerOf<F>;

export interface FormatProps<F extends Format> {
  item: ItemOf<F>;
  /** How often the learner answered this item before; seeds the order of options/elements. */
  attemptIndex: number;
  answer: DraftOf<F> | null;
  /** null: nothing valid entered (yet), so the Prüfen button stays disabled. */
  onChange(answer: DraftOf<F> | null): void;
  /** After checking (and while a short answer is being compared). */
  disabled: boolean;
  revealed?: { correct: Correctness; solution: SolutionOf<F> };
  /** short-answer: show the model answer (while comparing and after the rating). */
  showSolution?: boolean;
}
