// Practice rounds with reading texts (task 9): store + in-memory repositories + the fixture texts
// t-sach-900 and t-sach-901 (tests/fixtures/lesen), 11 items in lesen-sachtext.

import { describe, expect, it } from 'vitest';
import { createContentLoader } from '../../src/content-runtime/loader';
import { createMemoryRepositories } from '../../src/data/memory/repos';
import type { PracticeDeps } from '../../src/data/practice';
import { createSessionStore, type SessionStore } from '../../src/data/session-store';
import type { Repositories } from '../../src/data/repos';
import { LESEN_TEXTS, lesenContentModules } from '../fixtures/lesen';
import { answerFor, testDeps, tickingClock } from './helpers';

const LSA = 'lesen-sachtext' as const;

function lesenDeps(repos: Repositories, start?: string): PracticeDeps {
  return {
    ...testDeps(repos),
    content: createContentLoader(lesenContentModules()),
    now: tickingClock(start),
  };
}

async function answer(store: SessionStore, correct = true) {
  const { current } = store.getState();
  expect(store.getState().status).toBe('answering');
  store.getState().setAnswer(answerFor(current!.item, correct));
  await store.getState().submit();
  expect(store.getState().status).toBe('feedback');
}

const textRef = (store: SessionStore) => store.getState().current?.item.stimulus?.textRef;

describe('practice round with reading texts', () => {
  it('reads a text once, keeps its items together and changes the text only when it is done', async () => {
    const store = createSessionStore(lesenDeps(createMemoryRepositories()));
    await store.getState().startPractice('deutsch', LSA);

    const statuses: string[] = [];
    const texts: (string | undefined)[] = [];
    for (let i = 0; i < 10; i++) {
      statuses.push(store.getState().status);
      texts.push(textRef(store));
      const { current } = store.getState();
      expect(current?.text?.id).toBe(textRef(store));
      if (store.getState().status === 'reading') store.getState().doneReading();
      await answer(store);
      await store.getState().next();
    }
    expect(store.getState().status).toBe('finished');

    // The reading screen comes before the first item of each text only: one per text. The first
    // text runs through all its items (t-sach-900 has 6, t-sach-901 5).
    const switchAt = LESEN_TEXTS.find((t) => t.id === texts[0])!.itemIds.length;
    expect(statuses.map((s, i) => (s === 'reading' ? i : -1)).filter((i) => i >= 0)).toEqual([
      0,
      switchAt,
    ]);
    expect(new Set(texts.slice(0, switchAt)).size).toBe(1);
    expect(new Set(texts.slice(switchAt)).size).toBe(1);
    expect(texts[0]).not.toBe(texts[switchAt]);
  });

  it('starts the item time after the reading screen', async () => {
    const repos = createMemoryRepositories();
    const store = createSessionStore(lesenDeps(repos));
    await store.getState().startPractice('deutsch', LSA);
    expect(store.getState().status).toBe('reading');
    store.getState().doneReading();
    await answer(store);
    const [attempt] = await repos.attempts.listByLearner(store.getState().learner!.id);
    // tickingClock: one second between "Weiter" on the reading screen and "Prüfen".
    expect(attempt!.durationMs).toBe(1000);
  });

  it('shows the reading screen again after a reload, then goes on with the same text', async () => {
    const repos = createMemoryRepositories();
    const first = createSessionStore(lesenDeps(repos));
    await first.getState().startPractice('deutsch', LSA);
    first.getState().doneReading();
    const text = textRef(first);
    await answer(first);
    first.getState().leave();

    const second = createSessionStore(lesenDeps(repos, '2026-10-11T09:00:00.000Z'));
    await second.getState().startPractice('deutsch', LSA);
    expect(second.getState().status).toBe('choosing');
    await second.getState().resume();
    expect(second.getState().status).toBe('reading');
    expect(textRef(second)).toBe(text);
  });

  it('repeats a Fehlerkiste item the next day with its text, without the reading screen', async () => {
    const repos = createMemoryRepositories();
    const day1 = createSessionStore(lesenDeps(repos));
    await day1.getState().startPractice('deutsch', LSA);
    day1.getState().doneReading();
    const wrongItem = day1.getState().current!.item;
    await answer(day1, false);
    day1.getState().leave();

    const day2 = createSessionStore(lesenDeps(repos, '2026-10-12T08:00:00.000Z'));
    await day2.getState().startPractice('deutsch', LSA);
    const { status, current } = day2.getState();
    expect(status).toBe('answering');
    expect(current).toMatchObject({ source: 'review', item: { id: wrongItem.id } });
    expect(current?.text?.id).toBe(wrongItem.stimulus?.textRef);

    // The text has been shown with the repetition: its further items come without reading screen.
    await answer(day2);
    await day2.getState().next();
    expect(day2.getState().status).toBe('answering');
    expect(textRef(day2)).toBe(wrongItem.stimulus?.textRef);
  });
});
