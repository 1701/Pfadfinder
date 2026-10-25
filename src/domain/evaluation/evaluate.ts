// Pure answer checking per format (PRODUCT.md §5.3). One evaluator per format, no format switch
// in calling code: evaluate(item, answer) dispatches via the table below.

import type { Format, ItemOf } from '../content';
import type { AnswerOf, SelfRating } from './answers';

/** 0.5 only comes from a short-answer self-rating of "teils". */
export type Correctness = boolean | 0.5;

interface DetailByFormat {
  'single-choice': { chosenOptionId: string };
  'multi-choice': { missing: string[]; extra: string[] };
  'number-input': { given: number; expected: number; tolerance: number };
  /** wrongLeftIds: left entries not paired exactly with their solution partner. */
  match: { wrongLeftIds: string[]; usedDistractorIds: string[] };
  order: { wrongPositions: number[] };
  'cloze-select': { wrongGapKeys: string[] };
  'mark-in-text': { missing: number[]; extra: number[] };
  /** corrections are passed through for the feedback panel only. */
  'find-error': { missing: string[]; extra: string[]; corrections: Record<string, string> };
  'short-answer': { rating: SelfRating };
  /** missing: dividers of the solution not set; extra: dividers set where none belongs. */
  'segment-text': { missing: number[]; extra: number[] };
}

export type EvaluationDetail<F extends Format = Format> = {
  [K in F]: { format: K } & DetailByFormat[K];
}[F];

export interface EvaluationResult<F extends Format = Format> {
  correct: Correctness;
  detail: EvaluationDetail<F>;
}

/** Numeric value of a result for averages (mastery window, probetest score). */
export function correctnessScore(correct: Correctness): 0 | 0.5 | 1 {
  return correct === 0.5 ? 0.5 : correct ? 1 : 0;
}

const FLOAT_EPSILON = 1e-9;

function setDiff<T>(a: readonly T[], b: readonly T[]): { missing: T[]; extra: T[] } {
  const sa = new Set(a);
  const sb = new Set(b);
  return {
    missing: [...sa].filter((v) => !sb.has(v)),
    extra: [...sb].filter((v) => !sa.has(v)),
  };
}

type Evaluator<F extends Format> = (item: ItemOf<F>, answer: AnswerOf<F>) => EvaluationResult<F>;

const evaluators: { [F in Format]: Evaluator<F> } = {
  'single-choice': (item, answer) => ({
    correct: answer.optionId === item.solution.optionId,
    detail: { format: 'single-choice', chosenOptionId: answer.optionId },
  }),

  'multi-choice': (item, answer) => {
    const { missing, extra } = setDiff(item.solution.optionIds, answer.optionIds);
    return {
      correct: missing.length === 0 && extra.length === 0,
      detail: { format: 'multi-choice', missing, extra },
    };
  },

  'number-input': (item, answer) => {
    const expected = item.solution.value;
    const tolerance = item.solution.tolerance ?? 0;
    return {
      correct:
        Number.isFinite(answer.value) &&
        Math.abs(answer.value - expected) <= tolerance + FLOAT_EPSILON,
      detail: { format: 'number-input', given: answer.value, expected, tolerance },
    };
  },

  match: (item, answer) => {
    const solutionRight = new Map(item.solution.pairs);
    const answered = new Map<string, string[]>();
    for (const [left, right] of answer.pairs)
      answered.set(left, [...(answered.get(left) ?? []), right]);
    const wrongLeftIds = item.solution.pairs
      .filter(([left, right]) => {
        const given = answered.get(left);
        return given?.length !== 1 || given[0] !== right;
      })
      .map(([left]) => left);
    const pairedRights = new Set(solutionRight.values());
    const usedDistractorIds = [...new Set(answer.pairs.map(([, right]) => right))].filter(
      (right) => !pairedRights.has(right),
    );
    return {
      correct:
        wrongLeftIds.length === 0 &&
        usedDistractorIds.length === 0 &&
        answer.pairs.length === item.solution.pairs.length,
      detail: { format: 'match', wrongLeftIds, usedDistractorIds },
    };
  },

  order: (item, answer) => {
    const expected = item.solution.orderedIds;
    const length = Math.max(expected.length, answer.orderedIds.length);
    const wrongPositions = Array.from({ length }, (_, i) => i).filter(
      (i) => answer.orderedIds[i] !== expected[i],
    );
    return { correct: wrongPositions.length === 0, detail: { format: 'order', wrongPositions } };
  },

  'cloze-select': (item, answer) => {
    const wrongGapKeys = Object.entries(item.solution.gaps)
      .filter(([key, value]) => answer.gaps[key] !== value)
      .map(([key]) => key);
    return { correct: wrongGapKeys.length === 0, detail: { format: 'cloze-select', wrongGapKeys } };
  },

  'mark-in-text': (item, answer) => {
    const { missing, extra } = setDiff(item.solution.indices, answer.indices);
    return {
      correct: missing.length === 0 && extra.length === 0,
      detail: { format: 'mark-in-text', missing, extra },
    };
  },

  'find-error': (item, answer) => {
    const { missing, extra } = setDiff(item.solution.errorIds, answer.errorIds);
    return {
      correct: missing.length === 0 && extra.length === 0,
      detail: { format: 'find-error', missing, extra, corrections: item.solution.corrections },
    };
  },

  'short-answer': (_item, answer) => ({
    correct: answer.rating === 0.5 ? 0.5 : answer.rating === 1,
    detail: { format: 'short-answer', rating: answer.rating },
  }),

  // Right only with exactly the solution's dividers; no partial credit.
  'segment-text': (item, answer) => {
    const { missing, extra } = setDiff(item.solution.boundaries, answer.boundaries);
    return {
      correct: missing.length === 0 && extra.length === 0,
      detail: { format: 'segment-text', missing, extra },
    };
  },
};

export function evaluate<F extends Format>(
  item: ItemOf<F>,
  answer: AnswerOf<F>,
): EvaluationResult<F> {
  const evaluator = evaluators[item.format as F] as Evaluator<F>;
  return evaluator(item, answer);
}
