// The Stand of each Probetest of a Fach for its list (task 16), derived from the stored runs
// (exported with them since export v2), nothing new is stored. Free of Zod (types only).

import type { ProbetestRun } from '../learner';
import { introState } from './intro';

export interface ProbetestStand {
  id: string;
  /** Position in the manifest, from 1; never read from the id. */
  number: number;
  /** End of the last submitted run, the one "Auswertung ansehen" shows; null: not done yet. */
  doneAt: string | null;
}

/**
 * `ids` in manifest order, `runs` of the learner oldest first. Done means submitted, like
 * "Du hast diesen Probetest schon gemacht."; aborted and running runs do not count.
 */
export function probetestStand(
  ids: readonly string[],
  runs: readonly ProbetestRun[],
): ProbetestStand[] {
  return ids.map((id, i) => {
    const last = introState(runs, id).lastSubmitted;
    return { id, number: i + 1, doneAt: last ? (last.endedAt ?? last.startedAt) : null };
  });
}
