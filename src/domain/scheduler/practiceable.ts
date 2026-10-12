// Which items and Bereiche can be practised right now (decision 2026-10-11): only items whose
// format has a renderer count, and a Bereich opens from MIN_ITEMS_FOR_PRACTICE such items on,
// so a session of 10 never repeats one item over and over. New content opens Bereiche by itself.

// Imports only zod-free modules: the start page uses practiceableBereicheFromManifest.
import { countItems, type ContentManifest } from '../content/manifest';
import { BEREICHE, type Bereich } from '../content/taxonomy';
import type { Format, Item } from '../content/types';

export const MIN_ITEMS_FOR_PRACTICE = 10;

export function practiceableItems(pool: readonly Item[], formats: readonly Format[]): Item[] {
  const supported = new Set(formats);
  return pool.filter((i) => i.status !== 'retired' && supported.has(i.format));
}

/** Bereiche in taxonomy order that have at least MIN_ITEMS_FOR_PRACTICE practiceable items. */
export function practiceableBereiche(pool: readonly Item[], formats: readonly Format[]): Bereich[] {
  const counts = new Map<Bereich, number>();
  for (const item of practiceableItems(pool, formats)) {
    counts.set(item.bereich, (counts.get(item.bereich) ?? 0) + 1);
  }
  return BEREICHE.filter((b) => (counts.get(b) ?? 0) >= MIN_ITEMS_FOR_PRACTICE);
}

/** Same rule from the content manifest, without loading any item. */
export function practiceableBereicheFromManifest(
  manifest: ContentManifest,
  formats: readonly Format[],
): Bereich[] {
  return BEREICHE.filter(
    (b) => countItems(manifest.bereiche[b], formats) >= MIN_ITEMS_FOR_PRACTICE,
  );
}
