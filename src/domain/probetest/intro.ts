// What the intro of a Probetest knows about earlier runs. Free of Zod (types only).

import type { ProbetestRun } from '../learner';

export interface ProbetestIntro {
  /** At most one per Probetest id. */
  running: ProbetestRun | null;
  /** For "Auswertung ansehen". */
  lastSubmitted: ProbetestRun | null;
  /** "Du hast diesen Probetest schon gemacht." – only after a submitted run, not an aborted one. */
  doneBefore: boolean;
}

/** `runs` of the learner, oldest first (as the repository lists them). */
export function introState(runs: readonly ProbetestRun[], probetestId: string): ProbetestIntro {
  const own = runs.filter((r) => r.probetestId === probetestId);
  const lastSubmitted = own.filter((r) => r.status === 'submitted').at(-1) ?? null;
  return {
    running: own.find((r) => r.status === 'running') ?? null,
    lastSubmitted,
    doneBefore: lastSubmitted !== null,
  };
}
