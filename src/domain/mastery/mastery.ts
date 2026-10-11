// Mastery per (fach, bereich) – PRODUCT.md §5.5 with the precisions from 2026-10-11:
// window of the last 8 scores (0.5 counts as 0.5), decisions only from 6 entries on,
// window cleared after a level change, `mastered` is never reset.

import { z } from 'zod';
import {
  BEREICHE_BY_FACH,
  bereichSchema,
  fachSchema,
  niveauSchema,
  type Bereich,
  type Fach,
  type Niveau,
} from '../content';
import { correctnessScore, type Correctness } from '../evaluation';

export const MASTERY_WINDOW_SIZE = 8;
export const MASTERY_MIN_ENTRIES = 6;
/** Identical to the Kompass levels: E ≥ 75 %, M ≥ 50 %. */
export const MASTERY_LEVEL_UP = 0.75;
export const MASTERY_LEVEL_DOWN = 0.5;
/** The Einstiegscheck serves 2–3 items per Bereich (ARCHITECTURE.md §5); enforced by the composer. */
export const CHECK_ITEMS_PER_BEREICH = { min: 2, max: 3 } as const;

export type AttemptMode = 'check' | 'practice' | 'review' | 'probetest';

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
  correct: Correctness;
}

/**
 * Niveau ladder for one Bereich: start at 1, correct → +1 (max 3), otherwise stay.
 * Only a fully correct answer climbs; a self-rated 0.5 stays.
 * Also gives the niveau of the next check item when called with the results so far.
 */
export function checkLadderNiveau(results: readonly Pick<CheckResult, 'correct'>[]): Niveau {
  let niveau: Niveau = 1;
  for (const { correct } of results) {
    if (correct === true && niveau < 3) niveau = (niveau + 1) as Niveau;
  }
  return niveau;
}

/**
 * Starting mastery after the Einstiegscheck: one state per Bereich of every Fach present in
 * the results (Bereiche without results start at niveau 1). Results must be in answer order.
 */
export function initialMasteryFromCheck(
  results: readonly CheckResult[],
  context: { learnerId: string; at: string },
): MasteryState[] {
  const faecher = [...new Set(results.map((r) => r.fach))];
  return faecher.flatMap((fach) =>
    BEREICHE_BY_FACH[fach].map((bereich) => ({
      learnerId: context.learnerId,
      fach,
      bereich,
      niveau: checkLadderNiveau(results.filter((r) => r.fach === fach && r.bereich === bereich)),
      window: [],
      mastered: false,
      updatedAt: context.at,
    })),
  );
}
