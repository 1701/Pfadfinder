import { describe, expect, it } from 'vitest';
import { exportLearnerData, importLearnerData } from '../../src/data/backup';
import { createMemoryRepositories } from '../../src/data/memory/repos';
import { createSessionStore } from '../../src/data/session-store';
import { sampleLearnerData } from '../fixtures/learner';
import { answerFor, testDeps } from './helpers';

const EXPORTED_AT = '2026-10-11T12:00:00.000Z';

async function playedRepos() {
  const deps = testDeps();
  const store = createSessionStore(deps);
  await store.getState().startPractice('mathe', 'zahlen-operationen');
  for (let i = 0; i < 3; i++) {
    store.getState().setAnswer(answerFor(store.getState().current!.item, i !== 1));
    await store.getState().submit();
    await store.getState().next();
  }
  return { repos: deps.repos, learnerId: store.getState().learner!.id };
}

describe('export/import over the repositories', () => {
  it('round-trips a played session into an empty device', async () => {
    const { repos, learnerId } = await playedRepos();
    const file = await exportLearnerData(repos, learnerId, EXPORTED_AT);
    expect(file.attempts).toHaveLength(3);
    expect(file.reviews).toHaveLength(1);
    expect(file.sessions).toHaveLength(1);

    const target = createMemoryRepositories();
    const result = await importLearnerData(target, JSON.stringify(file));
    expect(result.ok).toBe(true);
    expect(await exportLearnerData(target, learnerId, EXPORTED_AT)).toEqual(file);
  });

  it('replaces the data on the device', async () => {
    const { repos, learnerId } = await playedRepos();
    const sample = sampleLearnerData();
    const file = await exportLearnerData(repos, learnerId, EXPORTED_AT);
    const other = createMemoryRepositories();
    await importLearnerData(other, { ...file });
    await importLearnerData(other, {
      version: '1',
      exportedAt: EXPORTED_AT,
      ...sample,
    });
    expect((await other.learners.list()).map((l) => l.id)).toEqual([sample.learner.id]);
    expect(await other.attempts.listByLearner(learnerId)).toEqual([]);
  });

  it('changes nothing when the file is invalid', async () => {
    const { repos, learnerId } = await playedRepos();
    const before = await exportLearnerData(repos, learnerId, EXPORTED_AT);
    const result = await importLearnerData(repos, '{"version":"1","learner":{}}');
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.errors.length).toBeGreaterThan(0);
    expect(await exportLearnerData(repos, learnerId, EXPORTED_AT)).toEqual(before);
  });

  it('fails for an unknown learner', async () => {
    await expect(
      exportLearnerData(createMemoryRepositories(), 'nobody', EXPORTED_AT),
    ).rejects.toThrow(/nobody/);
  });
});
