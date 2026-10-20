// Vorlesen in the Probetest (ARCHITECTURE.md §5, decision Markus): on in Mathe, where reading is
// not what is tested. Deutsch switches it off for reading texts and their items; spelling items
// keep it, they test writing, not reading.

import type { Fach, Item, ReadingText } from '../content';

export type ProbetestReadAloud = 'all' | 'not-reading-texts';

export const PROBETEST_READ_ALOUD: Readonly<Record<Fach, ProbetestReadAloud>> = {
  mathe: 'all',
  deutsch: 'not-reading-texts',
};

/** Whether the item screen of a Probetest offers Vorlesen. */
export function probetestReadAloud(fach: Fach, item: Pick<Item, 'stimulus'>): boolean {
  return PROBETEST_READ_ALOUD[fach] === 'all' || item.stimulus?.textRef === undefined;
}

/**
 * Whether the text box beside a Probetest item offers Vorlesen: only where the text allows it and
 * the Fach's switch does. In Deutsch it is never on (`not-reading-texts`): ReadingText.readAloud
 * holds for practice only (CONTENT_SCHEMA §5).
 */
export function probetestTextReadAloud(
  fach: Fach,
  item: Pick<Item, 'stimulus'>,
  text: Pick<ReadingText, 'readAloud'>,
): boolean {
  return text.readAloud && probetestReadAloud(fach, item);
}
