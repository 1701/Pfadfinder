// Helpers to assemble content trees for integrity tests from the fixtures in items.ts.

import {
  BEREICH_ABBR,
  FACH_ABBR,
  fachOfBereich,
  type Bereich,
  type ContentFile,
  type Item,
  type Niveau,
  type Probetest,
  type ReadingText,
} from '../../src/domain/content';
import { findError, numberInput, sachtext } from './items';

export function itemId(bereich: Bereich, niveau: Niveau, n: number): string {
  const fach = fachOfBereich(bereich);
  return `${FACH_ABBR[fach]}-${BEREICH_ABBR[bereich]}-${niveau}-${String(n).padStart(3, '0')}`;
}

/** Copies `base` into another Bereich/Niveau with a matching id. */
export function cloneItem(
  base: Item,
  bereich: Bereich,
  niveau: Niveau,
  n: number,
  overrides: Partial<Item> = {},
): Item {
  return {
    ...structuredClone(base),
    fach: fachOfBereich(bereich),
    bereich,
    niveau,
    id: itemId(bereich, niveau, n),
    ...overrides,
  } as Item;
}

export function toFiles(content: {
  items?: Item[];
  texts?: ReadingText[];
  probetests?: Probetest[];
  schemaVersion?: boolean;
}): ContentFile[] {
  const files: ContentFile[] = [];
  if (content.schemaVersion !== false)
    files.push({ path: 'schema-version.json', data: { version: '1.0' } });
  const byFile = new Map<string, Item[]>();
  for (const item of content.items ?? []) {
    const path = `items/${item.fach}/${item.bereich}.json`;
    byFile.set(path, [...(byFile.get(path) ?? []), item]);
  }
  for (const [path, data] of byFile) files.push({ path, data });
  for (const text of content.texts ?? [])
    files.push({ path: `texts/deutsch/${text.id}.json`, data: text });
  for (const p of content.probetests ?? [])
    files.push({ path: `probetests/${p.id}.json`, data: p });
  return files;
}

function countBy<K extends string | number>(
  items: Item[],
  key: (item: Item) => K,
): Record<K, number> {
  const out = {} as Record<K, number>;
  for (const item of items) out[key(item)] = (out[key(item)] ?? 0) + 1;
  return out;
}

export function mixesOf(items: Item[]): Pick<Probetest, 'niveauMix' | 'bereichMix'> {
  const niveau = countBy(items, (i) => i.niveau);
  return {
    niveauMix: { 1: niveau[1] ?? 0, 2: niveau[2] ?? 0, 3: niveau[3] ?? 0 },
    bereichMix: countBy(items, (i) => i.bereich),
  };
}

const MATHE_BEREICHE: Bereich[] = [
  'zahlen-operationen',
  'raum-form',
  'groessen-messen',
  'daten-zufall',
  'muster-strukturen',
];

/** 20 items, 8/8/4 niveaus, 4 per Bereich, 90 s each = 30 min. */
export function buildMatheProbetest(): { items: Item[]; probetest: Probetest } {
  const niveaus: Niveau[] = [
    ...Array<Niveau>(8).fill(1),
    ...Array<Niveau>(8).fill(2),
    ...Array<Niveau>(4).fill(3),
  ];
  const items = niveaus.map((niveau, i) =>
    cloneItem(numberInput, MATHE_BEREICHE[i % 5] as Bereich, niveau, 900 + i, {
      estimatedSeconds: 90,
    }),
  );
  const probetest: Probetest = {
    id: 'mathe-91',
    fach: 'mathe',
    durationMinutes: 45,
    itemIds: items.map((i) => i.id),
    ...mixesOf(items),
  };
  return { items, probetest };
}

/**
 * Two texts (5 items each), then 5 + 5 spelling items; 8/8/4 niveaus. 75 s each = 1500 s plus
 * the reading time of both texts (2 × 152 words × 0.75 s = 228 s) = 28.8 min (§6, 1.0.16).
 */
export function buildDeutschProbetest(): {
  items: Item[];
  texts: ReadingText[];
  probetest: Probetest;
} {
  const ladder: Niveau[] = [1, 1, 2, 2, 3];
  const sach = structuredClone(sachtext);
  const literarisch: ReadingText = {
    ...structuredClone(sachtext),
    id: 't-lit-901',
    kind: 'literarisch',
  };
  const texts = [sach, literarisch];
  const group = (bereich: Bereich, offset: number, textRef?: string) =>
    ladder.map((niveau, i) =>
      cloneItem(findError, bereich, niveau, offset + i, {
        estimatedSeconds: 75,
        ...(textRef && { stimulus: { textRef } }),
      }),
    );
  const items = [
    ...group('lesen-sachtext', 900, sach.id),
    ...group('lesen-literarisch', 900, literarisch.id),
    ...group('rs-laut-buchstabe', 900),
    ...group('rs-strategien', 900),
  ];
  for (const text of texts) {
    text.itemIds = items.filter((i) => i.stimulus?.textRef === text.id).map((i) => i.id);
  }
  const probetest: Probetest = {
    id: 'deutsch-91',
    fach: 'deutsch',
    durationMinutes: 45,
    itemIds: items.map((i) => i.id),
    ...mixesOf(items),
  };
  return { items, texts, probetest };
}
