import { describe, expect, it } from 'vitest';
import {
  BEREICHE_BY_FACH,
  isLesenBereich,
  type Bereich,
  type Item,
} from '../../src/domain/content';
import { CHECK_ITEM_COUNT } from '../../src/domain/scheduler';
import { createCheckStore, type CheckStore } from '../../src/data/check-store';
import { loadMapProgress } from '../../src/data/map-progress';
import { createMemoryRepositories } from '../../src/data/memory/repos';
import { ensureLearner } from '../../src/data/practice';
import type { Repositories } from '../../src/data/repos';
import { initialMastery } from '../../src/domain/mastery';
import { createContentLoader } from '../../src/content-runtime/loader';
import { OPEN_BEREICHE } from '../fixtures/content-state';
import { lesenContentModules } from '../fixtures/lesen';
import { makePool } from '../fixtures/pool';
import { answerFor, FORMATS, testDeps } from './helpers';

const MATHE_OPEN = OPEN_BEREICHE.filter((b) =>
  (BEREICHE_BY_FACH.mathe as readonly Bereich[]).includes(b),
);
const TOTAL = Math.min(CHECK_ITEM_COUNT, 3 * MATHE_OPEN.length);

/** Answers `count` questions (all when omitted); `correct` gets the item and its index in its Bereich. */
async function play(
  store: CheckStore,
  correct: (item: Item, indexInBereich: number) => boolean,
  count = Infinity,
) {
  const shown: Item[] = [];
  while (store.getState().status === 'answering' && shown.length < count) {
    const { item } = store.getState().current!;
    const index = shown.filter((i) => i.bereich === item.bereich).length;
    shown.push(item);
    store.getState().setAnswer(answerFor(item, correct(item, index)));
    await store.getState().next();
  }
  return shown;
}

async function stored(repos: Repositories, learnerId: string) {
  return {
    attempts: await repos.attempts.listByLearner(learnerId),
    mastery: await repos.mastery.listByLearner(learnerId),
    sessions: await repos.sessions.listByLearner(learnerId),
    reviews: await repos.reviews.listByLearner(learnerId),
    unlocked: (await repos.collectibles.get(learnerId))?.unlocked ?? [],
  };
}

describe('Einstiegscheck (store + in-memory repositories + real content)', () => {
  it('needs at least two practiceable Mathe Bereiche (fails loudly otherwise)', () => {
    expect(MATHE_OPEN.length).toBeGreaterThanOrEqual(2);
  });

  it('plays the whole check without feedback and stores it in one go', async () => {
    const deps = testDeps();
    const store = createCheckStore(deps);
    await store.getState().start('mathe');
    expect(store.getState().status).toBe('intro');
    store.getState().begin();
    expect(store.getState().current).toMatchObject({ index: 0, total: TOTAL });

    // Zahlen right, everything else wrong.
    const right = (i: Item) => i.bereich === 'zahlen-operationen';
    const shown = await play(store, right, TOTAL - 1);
    const learnerId = store.getState().learner!.id;
    // Nothing is stored before the last answer.
    expect(await stored(deps.repos, learnerId)).toEqual({
      attempts: [],
      mastery: [],
      sessions: [],
      reviews: [],
      unlocked: [],
    });
    expect(store.getState()).not.toHaveProperty('feedback');

    shown.push(...(await play(store, right)));
    expect(store.getState().status).toBe('finished');
    expect(shown).toHaveLength(TOTAL);
    expect(new Set(shown.map((i) => i.id)).size).toBe(TOTAL);
    expect(shown.every((i) => FORMATS.includes(i.format) && i.status !== 'retired')).toBe(true);
    expect(new Set(shown.map((i) => i.bereich))).toEqual(new Set(MATHE_OPEN));

    const data = await stored(deps.repos, learnerId);
    expect(data.attempts.map((a) => a.itemId)).toEqual(shown.map((i) => i.id));
    expect(data.attempts.every((a) => a.mode === 'check')).toBe(true);
    expect(data.sessions).toEqual([
      expect.objectContaining({
        mode: 'check',
        goalReached: true,
        attemptIds: data.attempts.map((a) => a.id),
      }),
    ]);
    expect(Object.fromEntries(data.mastery.map((m) => [m.bereich, m.niveau]))).toEqual(
      Object.fromEntries(MATHE_OPEN.map((b) => [b, b === 'zahlen-operationen' ? 3 : 1])),
    );
    expect(data.mastery.every((m) => m.window.length === 0 && !m.mastered)).toBe(true);
    expect(data.unlocked).toEqual(['zahlen-operationen:1', 'zahlen-operationen:2']);
    expect(store.getState().result).toEqual({ mastery: data.mastery, unlocked: data.unlocked });

    // Wrong check answers never fill the Fehlerkiste, and are no Fundstücke.
    expect(data.reviews).toEqual([]);
    const map = await loadMapProgress(deps.repos, deps.now());
    expect(map.today.count).toBe(0);
  });

  it('starts every Bereich at its highest passed niveau (R W R → 2)', async () => {
    const deps = testDeps();
    const store = createCheckStore(deps);
    await store.getState().start('mathe');
    store.getState().begin();
    await play(store, (_, n) => n !== 1);
    const { mastery, unlocked } = store.getState().result!;
    expect(mastery.map((m) => m.niveau)).toEqual(MATHE_OPEN.map(() => 2));
    expect(unlocked).toEqual(MATHE_OPEN.map((b) => `${b}:1`));
  });

  it('pause keeps the answers; resume continues with the same question', async () => {
    const store = createCheckStore(testDeps());
    await store.getState().start('mathe');
    store.getState().begin();
    await play(store, () => true, 3);
    const before = store.getState().current;
    store.getState().pause();
    expect(store.getState().status).toBe('paused');
    store.getState().setAnswer({ optionId: 'x' });
    expect(store.getState().answer).toBeNull();
    store.getState().resume();
    expect(store.getState().status).toBe('answering');
    expect(store.getState().current).toBe(before);
    expect(store.getState().check!.answers).toHaveLength(3);
  });

  it('leaving midway keeps nothing, and the next start begins at question 1', async () => {
    const deps = testDeps();
    const store = createCheckStore(deps);
    await store.getState().start('mathe');
    store.getState().begin();
    await play(store, () => true, 5);
    store.getState().pause();
    store.getState().leave();
    expect(store.getState().status).toBe('idle');

    const learner = await ensureLearner(deps);
    const data = await stored(deps.repos, learner.id);
    expect(data).toMatchObject({ attempts: [], mastery: [], sessions: [], reviews: [] });

    await store.getState().start('mathe');
    expect(store.getState().status).toBe('intro');
    store.getState().begin();
    expect(store.getState().current?.index).toBe(0);
  });

  it('cannot start a second time once the Fach has a mastery state', async () => {
    const deps = testDeps();
    const store = createCheckStore(deps);
    await store.getState().start('mathe');
    store.getState().begin();
    await play(store, () => true);
    expect(store.getState().status).toBe('finished');

    await store.getState().start('mathe');
    expect(store.getState()).toMatchObject({ status: 'unavailable', unavailable: 'started' });

    // Practice alone (without a check) also closes the offer.
    const other = testDeps();
    const learner = await ensureLearner(other);
    await other.repos.mastery.put(initialMastery(learner.id, 'raum-form', other.now()));
    const fresh = createCheckStore(other);
    await fresh.getState().start('mathe');
    expect(fresh.getState()).toMatchObject({ status: 'unavailable', unavailable: 'started' });
  });

  it('writes nothing when the Fach got a mastery state during the check', async () => {
    const deps = testDeps();
    const store = createCheckStore(deps);
    await store.getState().start('mathe');
    store.getState().begin();
    await play(store, () => true, TOTAL - 1);
    const learnerId = store.getState().learner!.id;
    const practised = initialMastery(learnerId, 'raum-form', deps.now());
    await deps.repos.mastery.put(practised);

    await play(store, () => true);
    expect(store.getState()).toMatchObject({ status: 'unavailable', unavailable: 'started' });
    expect(await stored(deps.repos, learnerId)).toEqual({
      attempts: [],
      mastery: [practised],
      sessions: [],
      reviews: [],
      unlocked: [],
    });
  });

  it('stores all or nothing: a failing write rolls the whole check back', async () => {
    const repos = createMemoryRepositories();
    const deps = testDeps(repos);
    const store = createCheckStore(deps);
    await store.getState().start('mathe');
    store.getState().begin();
    repos.collectibles.put = () => Promise.reject(new Error('disk full'));
    await expect(play(store, () => true)).rejects.toThrow('disk full');
    const learnerId = store.getState().learner!.id;
    const data = await stored(repos, learnerId);
    expect(data).toMatchObject({ attempts: [], mastery: [], sessions: [] });
  });

  it('plays the Deutsch check over its practiceable Bereiche, without short answers', async () => {
    const deutschOpen = OPEN_BEREICHE.filter((b) =>
      (BEREICHE_BY_FACH.deutsch as readonly Bereich[]).includes(b),
    );
    expect(deutschOpen.length).toBeGreaterThanOrEqual(2);
    const store = createCheckStore(testDeps());
    await store.getState().start('deutsch');
    expect(store.getState().status).toBe('intro');
    store.getState().begin();
    const shown = await play(store, () => true);
    // The check ends with one block per practiceable Lesen-Bereich: a reading screen, then the
    // items of one real text of that Bereich (task 10).
    const readings: { textId: string; start: number }[] = [];
    while (store.getState().status === 'reading') {
      readings.push({ textId: store.getState().current!.text!.id, start: shown.length });
      store.getState().doneReading();
      shown.push(...(await play(store, () => true)));
    }
    expect(store.getState().status).toBe('finished');
    expect(new Set(shown.map((i) => i.bereich))).toEqual(new Set(deutschOpen));
    expect(shown.some((i) => i.format === 'short-answer')).toBe(false);
    const lesen = deutschOpen.filter(isLesenBereich);
    expect(readings).toHaveLength(lesen.length);
    expect(shown.slice(0, readings[0]?.start).some((i) => isLesenBereich(i.bereich))).toBe(false);
    readings.forEach(({ textId, start }, n) => {
      const block = shown.slice(start, readings[n + 1]?.start);
      expect(block.length).toBeGreaterThanOrEqual(2);
      expect(block.every((i) => i.stimulus?.textRef === textId)).toBe(true);
      expect(new Set(block.map((i) => i.bereich)).size).toBe(1);
    });
    expect(new Set(readings.map((r) => shown[r.start]!.bereich))).toEqual(new Set(lesen));
  });

  it('is not available with fewer than two practiceable Bereiche', async () => {
    const rs = makePool('deutsch', 4, ['rs-strategien']);
    const content = createContentLoader({
      items: { 'fixtures/deutsch/rs-strategien.json': async () => structuredClone(rs) },
      texts: {},
      probetests: {},
    });
    const store = createCheckStore({ ...testDeps(), content });
    await store.getState().start('deutsch');
    expect(store.getState()).toMatchObject({ status: 'unavailable', unavailable: 'empty' });
  });
});

describe('Einstiegscheck with a reading text (fixture t-sach-900/901 and a synthetic rs-strategien)', () => {
  function lesenCheckDeps() {
    const modules = lesenContentModules();
    const rs = makePool('deutsch', 4, ['rs-strategien']);
    modules.items['fixtures/deutsch/rs-strategien.json'] = async () => structuredClone(rs);
    return { ...testDeps(createMemoryRepositories()), content: createContentLoader(modules) };
  }

  it('asks the rounds first, then reads the text and asks its items as a block beside it', async () => {
    const store = createCheckStore(lesenCheckDeps());
    await store.getState().start('deutsch');
    expect(store.getState().status).toBe('intro');
    store.getState().begin();

    // The rounds come first, without a text; the Lesen block comes last.
    const before: (string | undefined)[] = [];
    while (store.getState().status === 'answering') {
      const { item, text: shown } = store.getState().current!;
      before.push(shown?.id);
      store.getState().setAnswer(answerFor(item, true));
      await store.getState().next();
    }
    expect(before.length).toBeGreaterThanOrEqual(2);
    expect(before.every((t) => t === undefined)).toBe(true);
    // The reading screen before the first item of the block.
    expect(store.getState().status).toBe('reading');
    const text = store.getState().current!.text!;
    expect(text).toBeDefined();
    // Pause on the reading screen goes back to it.
    store.getState().pause();
    expect(store.getState().status).toBe('paused');
    store.getState().resume();
    expect(store.getState().status).toBe('reading');
    store.getState().doneReading();

    const statuses: string[] = [];
    const texts: (string | undefined)[] = [];
    while (store.getState().status === 'answering' || store.getState().status === 'reading') {
      statuses.push(store.getState().status);
      const { item, text: shown } = store.getState().current!;
      texts.push(shown?.id);
      store.getState().setAnswer(answerFor(item, true));
      await store.getState().next();
    }
    expect(statuses.every((s) => s === 'answering')).toBe(true);
    expect(texts).toEqual([text.id, text.id, text.id]);
    expect(store.getState().status).toBe('finished');
  });
});
