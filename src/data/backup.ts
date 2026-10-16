// Export/import of the learner data (PRODUCT.md §8, Gerätewechsel). These functions connect the
// domain format to the repositories; the Eltern page offers the export as a file download
// (since 2026-10-16), the import comes later.

import { parseImport, serialize, type ExportFile, type ImportResult } from '../domain/learner';
import type { Repositories } from './repos';

export async function exportLearnerData(
  repos: Repositories,
  learnerId: string,
  exportedAt: string,
): Promise<ExportFile> {
  const learner = await repos.learners.get(learnerId);
  if (!learner) throw new Error(`Learner ${learnerId} not found`);
  const [attempts, mastery, reviews, sessions, probetestRuns, collectibles] = await Promise.all([
    repos.attempts.listByLearner(learnerId),
    repos.mastery.listByLearner(learnerId),
    repos.reviews.listByLearner(learnerId),
    repos.sessions.listByLearner(learnerId),
    repos.probetestRuns.listByLearner(learnerId),
    repos.collectibles.get(learnerId),
  ]);
  return serialize(
    {
      learner,
      attempts,
      mastery,
      reviews,
      sessions,
      probetestRuns,
      collectibles: collectibles ?? { learnerId, unlocked: [] },
    },
    exportedAt,
  );
}

/**
 * Replaces everything on this device with the file's content. An invalid file changes nothing;
 * the errors are in German because parents read them.
 */
export async function importLearnerData(repos: Repositories, json: unknown): Promise<ImportResult> {
  const result = parseImport(json);
  if (!result.ok) return result;
  const { learner, attempts, mastery, reviews, sessions, probetestRuns, collectibles } =
    result.data;
  await repos.transaction(async () => {
    await repos.clear();
    await repos.learners.put(learner);
    for (const a of attempts) await repos.attempts.put(a);
    for (const m of mastery) await repos.mastery.put(m);
    for (const r of reviews) await repos.reviews.put(r);
    for (const s of sessions) await repos.sessions.put(s);
    for (const p of probetestRuns) await repos.probetestRuns.put(p);
    await repos.collectibles.put(collectibles);
  });
  return result;
}

/** "pfadfinder-sicherung-2026-10-16.json", by the local calendar day of `now`. */
export function backupFileName(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
  return `pfadfinder-sicherung-${day}.json`;
}

/** The backup of the (only) learner on this device as file name and JSON text. */
export async function backupFile(
  repos: Repositories,
  learnerId: string,
  now: Date,
): Promise<{ name: string; text: string }> {
  const file = await exportLearnerData(repos, learnerId, now.toISOString());
  return { name: backupFileName(now), text: `${JSON.stringify(file, null, 2)}\n` };
}
