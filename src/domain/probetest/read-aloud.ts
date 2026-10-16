// Vorlesen in the Probetest (ARCHITECTURE.md §5, decision Markus): on in Mathe, where reading is
// not what is tested. Deutsch will switch it off for reading texts; the switch exists, the
// Deutsch Probetest does not yet (task 8).

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
 * Whether the text box beside a Probetest item offers Vorlesen (task 9): only where the text
 * allows it and the Fach's switch does. The Deutsch Probetest is not built yet; its text box
 * will call this and stay silent (`not-reading-texts`).
 */
export function probetestTextReadAloud(
  fach: Fach,
  item: Pick<Item, 'stimulus'>,
  text: Pick<ReadingText, 'readAloud'>,
): boolean {
  return text.readAloud && probetestReadAloud(fach, item);
}
