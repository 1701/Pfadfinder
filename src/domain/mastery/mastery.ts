// Mastery per (fach, bereich) – PRODUCT.md §5.5 with the precisions from 2026-10-11:
// window of the last 8 scores (0.5 counts as 0.5), decisions only from 6 entries on,
// window cleared after a level change, `mastered` is never reset.

import { z } from 'zod';
import {
  BEREICHE_BY_FACH,
  bereichSchema,
  fachOfBereich,
  fachSchema,
  niveauSchema,
  type Bereich,
  type Fach,
  type Niveau,
} from '../content';
import { correctnessScore, type Correctness } from '../evaluation';
import type { AttemptMode } from '../learner';

export const MASTERY_WINDOW_SIZE = 8;
export const MASTERY_MIN_ENTRIES = 6;
/** Identical to the Kompass levels: E ≥ 75 %, M ≥ 50 %. */
export const MASTERY_LEVEL_UP = 0.75;
export const MASTERY_LEVEL_DOWN = 0.5;
/** The Einstiegscheck serves 2–3 items per practiceable Bereich (ARCHITECTURE.md §5); see buildCheck. */
export const CHECK_ITEMS_PER_BEREICH = { min: 2, max: 3 } as const;

/**
 * Modes that never change mastery: the probetest is a measurement, not training;
 * the Einstiegscheck sets the starting niveau via initialMasteryFromCheck and leaves the window empty.
 */
const MODES_WITHOUT_MASTERY: readonly AttemptMode[] = ['probetest', 'check'];

const scoreSchema = z.union([z.literal(0), z.literal(0.5), z.literal(1)]);

export const masteryStateSchema = z.strictObject({
  learnerId: z.string().min(1),
  fach: fachSchema,
  bereich: bereichSchema,
  niveau: niveauSchema,
  window: z.array(scoreSchema).max(MASTERY_WINDOW_SIZE),
  mastered: z.boolean(),
  updatedAt: z.iso.datetime({ offset: true }),
});

export type MasteryState = z.infer<typeof masteryStateSchema>;

export interface MasteryResult {
  fach: Fach;
  bereich: Bereich;
  correct: Correctness;
  mode: AttemptMode;
  /** ISO timestamp of the attempt. */
  at: string;
}

export type MasteryTransition = 'none' | 'level-up' | 'level-down' | 'mastered';

export interface MasteryUpdate {
  state: MasteryState;
  transition: MasteryTransition;
}

/** Average of the window, or null while fewer than MASTERY_MIN_ENTRIES results exist. */
export function masteryScore(window: readonly number[]): number | null {
  if (window.length < MASTERY_MIN_ENTRIES) return null;
  return window.reduce((sum, s) => sum + s, 0) / window.length;
}

export function updateMastery(state: MasteryState, result: MasteryResult): MasteryUpdate {
  if (result.fach !== state.fach || result.bereich !== state.bereich) {
    throw new Error(
      `Mastery result for ${result.fach}/${result.bereich} applied to state ${state.fach}/${state.bereich}`,
    );
  }
  if (MODES_WITHOUT_MASTERY.includes(result.mode)) return { state, transition: 'none' };

  const window = [...state.window, correctnessScore(result.correct)].slice(-MASTERY_WINDOW_SIZE);
  const next: MasteryState = { ...state, window, updatedAt: result.at };
  const score = masteryScore(window);

  if (score === null) return { state: next, transition: 'none' };

  if (score >= MASTERY_LEVEL_UP) {
    if (state.niveau < 3) {
      return {
        state: { ...next, niveau: (state.niveau + 1) as Niveau, window: [] },
        transition: 'level-up',
      };
    }
    if (!state.mastered) return { state: { ...next, mastered: true }, transition: 'mastered' };
    return { state: next, transition: 'none' };
  }

  if (score < MASTERY_LEVEL_DOWN && state.niveau > 1) {
    return {
      state: { ...next, niveau: (state.niveau - 1) as Niveau, window: [] },
      transition: 'level-down',
    };
  }

  return { state: next, transition: 'none' };
}

// ---------------------------------------------------------------------------
// Einstiegscheck

export interface CheckResult {
  fach: Fach;
  bereich: Bereich;
  /** Niveau of the item actually shown (it may deviate from the ladder rung). */
  niveau: Niveau;
  correct: Correctness;
}

/**
 * Ladder rung of the next check item in one Bereich: start at 1, correct → +1 (max 3),
 * otherwise stay. Only a fully correct answer climbs; a self-rated 0.5 stays.
 * Chooses items only; the starting niveau is checkStartNiveau.
 */
export function checkLadderNiveau(results: readonly Pick<CheckResult, 'correct'>[]): Niveau {
  let niveau: Niveau = 1;
  for (const { correct } of results) {
    if (correct === true && niveau < 3) niveau = (niveau + 1) as Niveau;
  }
  return niveau;
}

/**
 * Starting niveau of one Bereich (decision 2026-10-14): the highest niveau of a fully correct
 * answer, at least 1. A start that is too low corrects itself within a practice round; one
 * that is too high writes Entdeckungen that are never taken back.
 */
export function checkStartNiveau(
  results: readonly Pick<CheckResult, 'niveau' | 'correct'>[],
): Niveau {
  return results.reduce<Niveau>(
    (best, r) => (r.correct === true && r.niveau > best ? r.niveau : best),
    1,
  );
}

/**
 * Starting mastery after the Einstiegscheck: one state per Bereich with results, in taxonomy
 * order. Bereiche without results get initialMastery (niveau 1) when first practised.
 */
export function initialMasteryFromCheck(
  results: readonly CheckResult[],
  context: { learnerId: string; at: string },
): MasteryState[] {
  const faecher = [...new Set(results.map((r) => r.fach))];
  return faecher.flatMap((fach) =>
    BEREICHE_BY_FACH[fach].flatMap((bereich) => {
      const own = results.filter((r) => r.fach === fach && r.bereich === bereich);
      if (own.length === 0) return [];
      return [
        {
          learnerId: context.learnerId,
          fach,
          bereich,
          niveau: checkStartNiveau(own),
          window: [],
          mastered: false,
          updatedAt: context.at,
        },
      ];
    }),
  );
}

/** Starting state for a Bereich without Einstiegscheck result: niveau 1, empty window. */
export function initialMastery(learnerId: string, bereich: Bereich, at: string): MasteryState {
  return {
    learnerId,
    fach: fachOfBereich(bereich),
    bereich,
    niveau: 1,
    window: [],
    mastered: false,
    updatedAt: at,
  };
}
