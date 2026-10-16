import { describe, expect, it } from 'vitest';
import {
  backupFile,
  backupFileName,
  exportLearnerData,
  importLearnerData,
} from '../../src/data/backup';
import { EXPORT_VERSION, parseImport } from '../../src/domain/learner';
import { createMemoryRepositories } from '../../src/data/memory/repos';
import { createCheckStore } from '../../src/data/check-store';
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

  it('round-trips a finished Einstiegscheck (check session, starting mastery, Entdeckungen)', async () => {
    const deps = testDeps();
    const store = createCheckStore(deps);
    await store.getState().start('mathe');
    store.getState().begin();
    while (store.getState().status === 'answering') {
      store.getState().setAnswer(answerFor(store.getState().current!.item, true));
      await store.getState().next();
    }
    const learnerId = store.getState().learner!.id;
    const file = await exportLearnerData(deps.repos, learnerId, EXPORTED_AT);
    expect(file.sessions.map((s) => s.mode)).toEqual(['check']);
    expect(file.collectibles.unlocked.length).toBeGreaterThan(0);

    const target = createMemoryRepositories();
    expect((await importLearnerData(target, JSON.stringify(file))).ok).toBe(true);
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

describe('the backup file for the Eltern page', () => {
  it('is named after the local calendar day', () => {
    expect(backupFileName(new Date(2026, 9, 16, 23, 59))).toBe(
      'pfadfinder-sicherung-2026-10-16.json',
    );
    expect(backupFileName(new Date(2026, 0, 5, 0, 1))).toBe('pfadfinder-sicherung-2026-01-05.json');
  });

  it('holds a valid export file that parseImport reads back', async () => {
    const { repos, learnerId } = await playedRepos();
    const { name, text } = await backupFile(repos, learnerId, new Date(2026, 9, 16, 9, 30));
    expect(name).toBe('pfadfinder-sicherung-2026-10-16.json');
    const parsed = JSON.parse(text) as { version: string; attempts: unknown[] };
    expect(parsed.version).toBe(EXPORT_VERSION);
    expect(parsed.attempts).toHaveLength(3);
    const result = parseImport(text);
    expect(result.ok).toBe(true);
    expect(result.ok && result.data.learner.id).toBe(learnerId);
  });
});
