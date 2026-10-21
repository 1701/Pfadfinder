// Facts about the real content that change with every batch: derived from content/manifest.json,
// so tests do not name a Bereich that a new batch makes practiceable.

import { expect } from 'vitest';
import manifest from '../../content/manifest.json';
import { createContentLoader, type ContentRuntime } from '../../src/content-runtime/loader';
import { type ContentManifest } from '../../src/domain/content/manifest';
import { type Bereich } from '../../src/domain/content/taxonomy';
import {
  MIN_ITEMS_FOR_PRACTICE,
  practiceableBereicheFromManifest,
} from '../../src/domain/scheduler';
import { SUPPORTED_FORMATS } from '../../src/ui/formats/supported';
import { makePool } from './pool';

export const CONTENT_MANIFEST = manifest as ContentManifest;

/** Bereiche the map shows as open right now, in taxonomy order. */
export const OPEN_BEREICHE: Bereich[] = practiceableBereicheFromManifest(
  CONTENT_MANIFEST,
  SUPPORTED_FORMATS,
);

/**
 * A loader whose only Mathe Bereich (muster-strukturen) has too few items. Since the
 * muster-strukturen batch of task 14 every real Mathe Bereich is practiceable.
 */
export function thinMatheContent(): { content: ContentRuntime; bereich: Bereich } {
  const bereich: Bereich = 'muster-strukturen';
  const items = makePool('mathe', 1, [bereich]);
  expect(items.length).toBeLessThan(MIN_ITEMS_FOR_PRACTICE);
  const content = createContentLoader({
    items: { [`fixtures/mathe/${bereich}.json`]: async () => structuredClone(items) },
    texts: {},
    probetests: {},
  });
  return { content, bereich };
}
