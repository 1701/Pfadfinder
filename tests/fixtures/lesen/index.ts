// Reading-text fixtures (task 9). NOT app content – never copy into content/; the real Lesen
// batch follows. Used by unit tests and, in the dev build only, by /dev/text (e2e and layout).
//
// - t-sach-900 "Baumeister am Bach": 250 words, one item per format that Lesen uses
//   (single-choice, mark-in-text, order, multi-choice with 5 options, match, short-answer).
//   d-lsa-2-952 (match) measures geometry only, in the form of d-lli-2-003: card texts 57 + 55 =
//   112 characters, 3 pairs, prompt 60 characters (task 15: the limits of 1.0.17; before 65).
// - t-sach-901 "Der Igel im Winter" from items.ts with 5 find-error clones, as in
//   buildDeutschProbetest. Together the Bereich has 11 items and is practiceable
//   (MIN_ITEMS_FOR_PRACTICE), and a round can move from one text to the other.

import { z } from 'zod';
import {
  itemSchema,
  readingTextSchema,
  type Bereich,
  type Item,
  type Niveau,
  type Probetest,
  type ReadingText,
} from '../../../src/domain/content';
import type { ContentModules } from '../../../src/content-runtime/loader';
import { cloneItem, mixesOf } from '../builders';
import { clozeSelect, findError, sachtext } from '../items';
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

// The Deutsch fixture Probetest deutsch-90 (task 13): valid content (§6, 1.0.16) from fixtures only,
// the smallest the schema loads (18 items): t-sach-900 with all 6 items, t-lit-900 (a literary
// clone of the igel text; t-sach-901 stays a Sachtext elsewhere) with 4, then 8 spelling items.
// Time: 650 s + 8 × 65 s + reading (250 + 152 words) × 0.75 s = 1471.5 s = 24.5 min.
// Drives the reading screen in the dev build (/dev/probetest, /dev/probetest-lauf) and the specs.

export const litText: ReadingText = {
  ...structuredClone(sachtext),
  id: 't-lit-900',
  kind: 'literarisch',
};
const LIT_LADDER: [Niveau, number][] = [
  [1, 900],
  [1, 901],
  [2, 900],
  [3, 900],
];
export const litItems: Item[] = LIT_LADDER.map(([niveau, n]) =>
  cloneItem(findError, 'lesen-literarisch', niveau, n, { stimulus: { textRef: litText.id } }),
);
litText.itemIds = litItems.map((i) => i.id);

const SPELLING_LADDER: [Item, Bereich, Niveau, number][] = [
  [clozeSelect, 'rs-laut-buchstabe', 1, 900],
  [findError, 'rs-strategien', 1, 900],
  [clozeSelect, 'rs-laut-buchstabe', 1, 901],
  [findError, 'rs-strategien', 2, 900],
  [clozeSelect, 'rs-laut-buchstabe', 2, 900],
  [findError, 'rs-strategien', 2, 901],
  [clozeSelect, 'rs-laut-buchstabe', 3, 900],
  [findError, 'rs-strategien', 3, 900],
];
export const spellingItems: Item[] = SPELLING_LADDER.map(([base, bereich, niveau, n]) =>
  cloneItem(base, bereich, niveau, n, { estimatedSeconds: 65 }),
);

const deutsch90Items = [...biberItems, ...litItems, ...spellingItems];

export const DEUTSCH_90: Probetest = {
  id: 'deutsch-90',
  fach: 'deutsch',
  durationMinutes: 45,
  itemIds: deutsch90Items.map((i) => i.id),
  ...mixesOf(deutsch90Items),
};
export const PROBETEST_TEXTS: ReadingText[] = [biberText, litText];
export const PROBETEST_ITEMS: Item[] = deutsch90Items;

/** Sources for createContentLoader with deutsch-90: its items per Bereich, both texts. */
export function probetestContentModules(): ContentModules {
  const byBereich = new Map<string, Item[]>();
  for (const item of PROBETEST_ITEMS)
    byBereich.set(item.bereich, [...(byBereich.get(item.bereich) ?? []), item]);
  return {
    items: Object.fromEntries(
      [...byBereich].map(([bereich, items]) => [
        `fixtures/deutsch/${bereich}.json`,
        async () => structuredClone(items),
      ]),
    ),
    texts: Object.fromEntries(
      PROBETEST_TEXTS.map((t) => [`fixtures/texts/${t.id}.json`, async () => structuredClone(t)]),
    ),
    probetests: { 'fixtures/probetests/deutsch-90.json': async () => structuredClone(DEUTSCH_90) },
  };
}
