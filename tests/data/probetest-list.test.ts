// The Stand of the Probetest list (task 16) comes from the stored runs: after a reload (a new
// read of the same storage) and after an import (export v2 into an empty device) it is the same.
import { describe, expect, it } from 'vitest';
import { exportLearnerData, importLearnerData } from '../../src/data/backup';
import { createContentLoader } from '../../src/content-runtime/loader';
import { createMemoryRepositories } from '../../src/data/memory/repos';
import { createProbetestStore } from '../../src/data/probetest-store';
import { loadProbetestList } from '../../src/data/probetest-list';
import { previewAnswer } from '../../src/ui/dev/preview-answers';

const IDS = ['mathe-01', 'mathe-02'];
const DONE_AT = '2026-10-15T08:20:00.000Z';
let lastId = 0;

async function oneDone() {
  const repos = createMemoryRepositories();
  const clock = { t: Date.parse('2026-10-15T08:00:00.000Z') };
  const store = createProbetestStore({
    repos,
    content: createContentLoader(),
    now: () => new Date(clock.t).toISOString(),
    newId: () => `pl-${++lastId}`,
  });
  await store.getState().open('mathe-01');
  await store.getState().begin();
  const { context } = store.getState();
  store.getState().setAnswer(previewAnswer(context!.items[0]!, true));
  clock.t = Date.parse(DONE_AT);
  store.getState().showOverview();
  await store.getState().askSubmit();
  await store.getState().submit();
  expect(store.getState().status).toBe('result');
  return repos;
}

describe('loadProbetestList', () => {
  it('without a learner: nothing done, nothing written', async () => {
    const repos = createMemoryRepositories();
    expect(await loadProbetestList(repos, IDS)).toEqual([
      { id: 'mathe-01', number: 1, doneAt: null },
      { id: 'mathe-02', number: 2, doneAt: null },
    ]);
    expect(await repos.learners.list()).toEqual([]);
  });

  it('two Probetests, one done: the same Stand after a reload and after an import', async () => {
    const repos = await oneDone();
    const wanted = [
      { id: 'mathe-01', number: 1, doneAt: DONE_AT },
      { id: 'mathe-02', number: 2, doneAt: null },
    ];
    expect(await loadProbetestList(repos, IDS)).toEqual(wanted);
    // "Neu laden": a new read of the same storage, nothing kept in memory.
    expect(await loadProbetestList(repos, IDS)).toEqual(wanted);

    const learner = (await repos.learners.list())[0]!;
    const file = await exportLearnerData(repos, learner.id, '2026-10-16T10:00:00.000Z');
    const device = createMemoryRepositories();
    expect((await importLearnerData(device, JSON.stringify(file))).ok).toBe(true);
    expect(await loadProbetestList(device, IDS)).toEqual(wanted);
  });
});
