// Reading texts in a round (PRODUCT.md §5.4, ARCHITECTURE.md §5): the first item of a text in a
// round comes after a reading screen with the whole text; every item of a text shows the text
// beside it. A Fehlerkiste repetition shows the text again, without the reading screen.

import type { Item } from '../content';
import type { PracticeSource } from './session';

/**
 * - `read-first`: show the reading screen, then the item with the text.
 * - `with-text`: show the item with the text.
 * - `none`: the item has no reading text.
 */
export type ReadingStep = 'read-first' | 'with-text' | 'none';

/**
 * @param shownTextIds texts already shown in this round (kept in memory by the store, so a
 *   reload starts with the reading screen again).
 */
export function readingStep(
  item: Pick<Item, 'stimulus'>,
  source: PracticeSource,
  shownTextIds: ReadonlySet<string>,
): ReadingStep {
  const textRef = item.stimulus?.textRef;
  if (textRef === undefined) return 'none';
  if (source === 'review' || shownTextIds.has(textRef)) return 'with-text';
  return 'read-first';
}
