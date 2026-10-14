import 'fake-indexeddb/auto';
import { Dexie } from 'dexie';
import { describe, expect, it } from 'vitest';
import { createDexieRepositories } from '../../src/data/dexie/repos';
import { openDb } from '../../src/data/dexie/db';
import { sampleLearnerData } from '../fixtures/learner';
import { repositoryContract } from './repos.contract';

let n = 0;
repositoryContract('Dexie (fake-indexeddb)', () => createDexieRepositories(openDb(`test-${n++}`)));

describe('Dexie schema upgrade', () => {
  it('keeps the data of a version 1 database and adds the postponed offers', async () => {
    const name = 'upgrade-v1';
    const { learner } = sampleLearnerData();
    // A device that still has the database of version 1.
    const v1 = new Dexie(name);
    v1.version(1).stores({
      learners: 'id',
      attempts: 'id, learnerId, [learnerId+bereich]',
      mastery: '[learnerId+bereich], learnerId',
      reviews: '[learnerId+itemId], learnerId, [learnerId+dueAt]',
      sessions: 'id, learnerId',
      probetestRuns: 'id, learnerId',
      collectibles: 'learnerId',
    });
    await v1.table('learners').put(learner);
    v1.close();

    const repos = createDexieRepositories(openDb(name));
    expect(await repos.learners.list()).toEqual([learner]);
    expect(await repos.postponedOffers.list()).toEqual([]);
    await repos.postponedOffers.put({ fach: 'mathe', at: '2026-10-14T08:00:00.000Z' });
    expect(await repos.postponedOffers.list()).toHaveLength(1);
  });
});
