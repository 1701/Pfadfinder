// The list of a Fach's Probetests (task 16): the Stand from the runs on this device. Reads only,
// so a reload or an import (which replaces the runs) shows the right Stand at once.

import { probetestStand, type ProbetestStand } from '../domain/probetest/list';
import type { Repositories } from './repos';

export async function loadProbetestList(
  repos: Repositories,
  ids: readonly string[],
): Promise<ProbetestStand[]> {
  const [learner] = await repos.learners.list();
  const runs = learner ? await repos.probetestRuns.listByLearner(learner.id) : [];
  return probetestStand(ids, runs);
}
