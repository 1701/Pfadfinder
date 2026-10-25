// Shared setup for data-layer tests: in-memory repos, the real content and a ticking clock.

import type { Format, Item } from '../../src/domain/content';
import { previewAnswer } from '../../src/ui/dev/preview-answers';
import { SUPPORTED_FORMATS } from '../../src/ui/formats/supported';
import { fixtureContent } from '../fixtures/content';
import { createMemoryRepositories } from '../../src/data/memory/repos';
import type { PracticeDeps } from '../../src/data/practice';
import type { Repositories } from '../../src/data/repos';

/** The formats the app serves: all nine since task 7. */
export const FORMATS: readonly Format[] = SUPPORTED_FORMATS;

/** Every call to now() is one second later than the previous one. */
export function tickingClock(start = '2026-10-11T08:00:00.000Z') {
  let t = Date.parse(start);
  return () => {
    const iso = new Date(t).toISOString();
    t += 1000;
    return iso;
  };
}

/** A fake clock like tickingClock that a test can move to another time (over midnight). */
export function settableClock(start: string) {
  let t = Date.parse(start);
  return {
    now() {
      const iso = new Date(t).toISOString();
      t += 1000;
      return iso;
    },
    set(iso: string) {
      t = Date.parse(iso);
    },
  };
}

// Module-wide, so two stores on the same repositories never hand out the same id.
let lastId = 0;

export function testDeps(repos: Repositories = createMemoryRepositories()): PracticeDeps {
  return {
    repos,
    content: fixtureContent(),
    now: tickingClock(),
    newId: () => `id-${++lastId}`,
    formats: FORMATS,
  };
}

/**
 * A correct or a wrong answer for every format (the dev preview's answers). A wrong short answer
 * is rated "noch nicht" (0), so it counts as wrong like in every other format.
 */
export function answerFor(item: Item, correct: boolean): unknown {
  if (item.format === 'short-answer') return { text: 'x', rating: correct ? 1 : 0 };
  return previewAnswer(item, correct);
}
