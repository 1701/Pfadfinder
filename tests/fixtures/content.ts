// The whole content as invented fixtures, for every unit test that needs a content loader or a
// manifest (ARCHITECTURE §8, Teststrategie). NOT app content – never copy into content/.
//
// - Mathe: makePool for all five Bereiche, 8 per Niveau (enough for a level-up after 6 right;
//   formats rotate through single-choice, number-input, order, multi-choice, short-answer;
//   90 s each), plus a short answer in muster-strukturen and a retired number-input item in
//   zahlen-operationen.
// - Deutsch: lesen-sachtext with t-sach-900/901 (fixtures/lesen), lesen-literarisch with
//   t-lit-900 (4 items) and t-lit-902 (6 items), the spelling items of deutsch-90 on top of
//   makePool in both spelling Bereiche, makePool in sprache-untersuchen.
// - Probetests: mathe-91 (20 items, 8/8/4, a short answer as item 20), mathe-92 (the same items
//   backwards) and deutsch-90.
// Every Bereich has at least MIN_ITEMS_FOR_PRACTICE items, so the map opens all ten.

import { expect } from 'vitest';
import {
  createContentLoader,
  type ContentModules,
  type ContentRuntime,
} from '../../src/content-runtime/loader';
import {
  BEREICHE_BY_FACH,
  buildContentManifest,
  type Bereich,
  type Item,
  type Niveau,
  type Probetest,
  type ReadingText,
} from '../../src/domain/content';
import type { ContentManifest } from '../../src/domain/content/manifest';
import { MIN_ITEMS_FOR_PRACTICE } from '../../src/domain/scheduler';
import { cloneItem, itemId, mixesOf } from './builders';
import { findError, numberInput, sachtext, shortAnswer } from './items';
import { DEUTSCH_90, LESEN_ITEMS, LESEN_TEXTS, litItems, litText, spellingItems } from './lesen';
import { makePool } from './pool';

const MATHE = BEREICHE_BY_FACH.mathe;

/** The short answer of mathe-91 (its last item). */
export const MATHE_SHORT_ANSWER: Item = cloneItem(shortAnswer, 'muster-strukturen', 3, 190);
/** Retired: never served, but attempts and Fehlerkiste entries on it stay. */
export const RETIRED_ITEM: Item = {
  ...cloneItem(numberInput, 'zahlen-operationen', 1, 190),
  status: 'retired',
};

const LIT_LADDER: [Niveau, number][] = [
  [1, 910],
  [1, 911],
  [2, 910],
  [2, 911],
  [3, 910],
  [3, 911],
];
export const lit2Text: ReadingText = {
  ...structuredClone(sachtext),
  id: 't-lit-902',
  kind: 'literarisch',
};
const lit2Items: Item[] = LIT_LADDER.map(([niveau, n]) =>
  cloneItem(findError, 'lesen-literarisch', niveau, n, { stimulus: { textRef: lit2Text.id } }),
);
lit2Text.itemIds = lit2Items.map((i) => i.id);

// 90 s each, so mathe-91 takes about 30 min (§6: 24–32).
const matheItems: Item[] = [
  ...makePool('mathe', 8).map((item) => ({ ...item, estimatedSeconds: 90 })),
  MATHE_SHORT_ANSWER,
  RETIRED_ITEM,
];

const deutschItems: Item[] = [
  ...LESEN_ITEMS,
  ...litItems,
  ...lit2Items,
  ...makePool('deutsch', 4, ['rs-laut-buchstabe', 'rs-strategien', 'sprache-untersuchen']),
  ...spellingItems,
];

export const FIXTURE_ITEMS: Item[] = [...matheItems, ...deutschItems];
export const FIXTURE_TEXTS: ReadingText[] = [...LESEN_TEXTS, litText, lit2Text];

const byId = (id: string) => FIXTURE_ITEMS.find((i) => i.id === id)!;

/**
 * 20 items, 4 per Bereich: Niveau I and II from the first four Bereiche, III from
 * muster-strukturen, the short answer last. Formats alternate (makePool rotates them).
 */
function matheProbetestItems(): Item[] {
  // makePool numbers the items of a Bereich and Niveau from 100.
  const at = (bereich: Bereich, niveau: Niveau, n: number) =>
    byId(itemId(bereich, niveau, 100 + n));
  const items: Item[] = [];
  MATHE.slice(0, 4).forEach((bereich, k) => {
    for (const niveau of [1, 2] as Niveau[]) {
      items.push(at(bereich, niveau, k % 4), at(bereich, niveau, (k + 1) % 4));
    }
  });
  items.push(...[0, 1, 2].map((n) => at('muster-strukturen', 3, n)), MATHE_SHORT_ANSWER);
  return items;
}

function probetest(id: string, fach: Probetest['fach'], items: Item[]): Probetest {
  return { id, fach, durationMinutes: 45, itemIds: items.map((i) => i.id), ...mixesOf(items) };
}

export const MATHE_91: Probetest = probetest('mathe-91', 'mathe', matheProbetestItems());
export const MATHE_92: Probetest = probetest(
  'mathe-92',
  'mathe',
  [...matheProbetestItems()].reverse(),
);
export const FIXTURE_PROBETESTS: Probetest[] = [MATHE_91, MATHE_92, DEUTSCH_90];

/** Items of a Probetest in its order. */
export const probetestItems = (p: Probetest): Item[] => p.itemIds.map(byId);

/** Sources for createContentLoader: one file per Bereich, every text and Probetest. */
export function fixtureContentModules(): ContentModules {
  const byFile = new Map<string, Item[]>();
  for (const item of FIXTURE_ITEMS) {
    const file = `fixtures/${item.fach}/${item.bereich}.json`;
    byFile.set(file, [...(byFile.get(file) ?? []), item]);
  }
  return {
    items: Object.fromEntries(
      [...byFile].map(([file, items]) => [file, async () => structuredClone(items)]),
    ),
    texts: Object.fromEntries(
      FIXTURE_TEXTS.map((t) => [`fixtures/texts/${t.id}.json`, async () => structuredClone(t)]),
    ),
    probetests: Object.fromEntries(
      FIXTURE_PROBETESTS.map((p) => [
        `fixtures/probetests/${p.id}.json`,
        async () => structuredClone(p),
      ]),
    ),
  };
}

export function fixtureContent(): ContentRuntime {
  return createContentLoader(fixtureContentModules());
}

/** The manifest of the fixture content, as content:validate would write it. */
export const FIXTURE_MANIFEST: ContentManifest = buildContentManifest(
  FIXTURE_ITEMS,
  FIXTURE_PROBETESTS,
);

/**
 * A loader whose only Mathe Bereich (muster-strukturen) has too few items. Every Bereich of the
 * fixture content is practiceable.
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
