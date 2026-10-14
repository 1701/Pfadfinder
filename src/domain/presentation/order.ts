// Presentation order per format: which option, card or element the child sees where. Renderers
// and the read-aloud text both use these functions, so the voice reads what is on the screen.
// Seed = itemId + attemptIndex (CLAUDE.md); keepOrder keeps options that name picture labels.

import type { ItemOf } from '../content';
import { presentationSeed, seededShuffle } from '../scheduler/shuffle';

type Option = { id: string; text: string };

/** Options of single-choice and multi-choice, shuffled unless the item keeps their order. */
export function presentedOptions<O extends Option>(
  item: { id: string; payload: { options: O[]; keepOrder?: boolean } },
  attemptIndex: number,
): O[] {
  if (item.payload.keepOrder) return item.payload.options;
  return seededShuffle(item.payload.options, presentationSeed(item.id, attemptIndex));
}

/** Both columns of a match item, each shuffled with its own seed. */
export function presentedMatch(
  item: ItemOf<'match'>,
  attemptIndex: number,
): { left: Option[]; right: Option[] } {
  const seed = presentationSeed(item.id, attemptIndex);
  return {
    left: seededShuffle(item.payload.left, `${seed}/left`),
    right: seededShuffle(item.payload.right, `${seed}/right`),
  };
}

/**
 * Elements of an order item, shuffled. A shuffle that happens to be the solution is rotated by
 * one place, so the child never starts with a solved list (Prüfen waits for the first move).
 */
export function presentedOrder(item: ItemOf<'order'>, attemptIndex: number): Option[] {
  const shuffled = seededShuffle(item.payload.items, presentationSeed(item.id, attemptIndex));
  const solved = shuffled.every((element, i) => element.id === item.solution.orderedIds[i]);
  return solved ? [...shuffled.slice(1), ...shuffled.slice(0, 1)] : shuffled;
}

/** The three options of every gap, each gap shuffled with its own seed. */
export function presentedGapOptions(
  item: ItemOf<'cloze-select'>,
  attemptIndex: number,
): Record<string, string[]> {
  const seed = presentationSeed(item.id, attemptIndex);
  return Object.fromEntries(
    item.payload.gaps.map((gap) => [gap.key, seededShuffle(gap.options, `${seed}/${gap.key}`)]),
  );
}

export type ClozePart =
  { kind: 'text'; text: string } | { kind: 'gap'; key: string; number: number };

/** The template split into text and gaps; gaps are numbered 1, 2, 3 in reading order. */
export function clozeParts(template: string): ClozePart[] {
  const parts: ClozePart[] = [];
  let number = 0;
  for (const piece of template.split(/(\{[^{}]+\})/)) {
    if (piece === '') continue;
    const gap = /^\{([^{}]+)\}$/.exec(piece);
    if (gap) parts.push({ kind: 'gap', key: gap[1] ?? '', number: ++number });
    else parts.push({ kind: 'text', text: piece });
  }
  return parts;
}
