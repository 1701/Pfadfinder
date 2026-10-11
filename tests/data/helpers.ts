// Shared setup for data-layer tests: in-memory repos, the real content and a ticking clock.

import type { Format, Item } from '../../src/domain/content';
import { createContentLoader } from '../../src/content-runtime/loader';
import { createMemoryRepositories } from '../../src/data/memory/repos';
import type { PracticeDeps } from '../../src/data/practice';
import type { Repositories } from '../../src/data/repos';

export const FORMATS: readonly Format[] = ['single-choice', 'number-input'];

/** Every call to now() is one second later than the previous one. */
export function tickingClock(start = '2026-10-11T08:00:00.000Z') {
  let t = Date.parse(start);
  return () => {
    const iso = new Date(t).toISOString();
    t += 1000;
    return iso;
  };
}

// Module-wide, so two stores on the same repositories never hand out the same id.
let lastId = 0;

export function testDeps(repos: Repositories = createMemoryRepositories()): PracticeDeps {
  return {
    repos,
    content: createContentLoader(),
    now: tickingClock(),
    newId: () => `id-${++lastId}`,
    formats: FORMATS,
  };
}

/** A correct or a wrong answer for the two formats with a renderer. */
export function answerFor(item: Item, correct: boolean): unknown {
  if (item.format === 'single-choice') {
    const wrong = item.payload.options.find((o) => o.id !== item.solution.optionId)!;
    return { optionId: correct ? item.solution.optionId : wrong.id };
  }
  if (item.format === 'number-input') {
    return { value: correct ? item.solution.value : item.solution.value + 1 };
  }
  throw new Error(`No test answer for format ${item.format}`);
}
