// Reading-text fixtures (task 9). NOT app content – never copy into content/; the real Lesen
// batch follows. Used by unit tests and, in the dev build only, by /dev/text (e2e and layout).
//
// - t-sach-900 "Baumeister am Bach": 250 words, one item per format that Lesen uses
//   (single-choice, mark-in-text, order, multi-choice with 5 options, short-answer).
// - t-sach-901 "Der Igel im Winter" from items.ts with 5 find-error clones, as in
//   buildDeutschProbetest. Together the Bereich has 10 items and is practiceable
//   (MIN_ITEMS_FOR_PRACTICE), and a round can move from one text to the other.

import { z } from 'zod';
import {
  itemSchema,
  readingTextSchema,
  type Item,
  type Niveau,
  type ReadingText,
} from '../../../src/domain/content';
import type { ContentModules } from '../../../src/content-runtime/loader';
import { cloneItem } from '../builders';
import { findError, sachtext } from '../items';
import biberItemsJson from './items.json' with { type: 'json' };
import biberTextJson from './t-sach-900.json' with { type: 'json' };

export const biberText: ReadingText = readingTextSchema.parse(biberTextJson);
export const biberItems: Item[] = z.array(itemSchema).parse(biberItemsJson);

export const igelText: ReadingText = structuredClone(sachtext);
const IGEL_LADDER: [Niveau, number][] = [
  [1, 901],
  [1, 902],
  [2, 901],
  [2, 902],
  [3, 901],
];
export const igelItems: Item[] = IGEL_LADDER.map(([niveau, n]) =>
  cloneItem(findError, 'lesen-sachtext', niveau, n, { stimulus: { textRef: igelText.id } }),
);

export const LESEN_TEXTS: ReadingText[] = [biberText, igelText];
export const LESEN_ITEMS: Item[] = [...biberItems, ...igelItems];

/** Sources for createContentLoader: only lesen-sachtext has items, both texts are there. */
export function lesenContentModules(): ContentModules {
  return {
    items: { 'fixtures/deutsch/lesen-sachtext.json': async () => structuredClone(LESEN_ITEMS) },
    texts: Object.fromEntries(
      LESEN_TEXTS.map((t) => [`fixtures/texts/${t.id}.json`, async () => structuredClone(t)]),
    ),
    probetests: {},
  };
}
