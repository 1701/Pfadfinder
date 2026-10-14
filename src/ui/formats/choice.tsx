// Shared look of answer tiles (options, cards, words): one place for "chosen", "solution" and
// "your choice" so every format marks them alike. Never red: the solution is calm water blue
// with a check mark, a different choice of the child stays in neutral stone.

import clsx from 'clsx';
import { CheckGlyph } from '../components/glyphs';

export type TileState = 'plain' | 'selected' | 'solution' | 'chosen' | 'blocked';

/** The tile body; formats add width and padding. */
export const TILE_CLASS =
  'flex min-h-touch items-center gap-sm rounded-control border-2 py-2xs text-option';

export const tileStateClass: Record<TileState, string> = {
  plain: 'border-line-strong bg-surface',
  selected: 'border-signal-edge bg-signal-soft',
  solution: 'border-correct bg-correct-surface',
  chosen: 'border-notyet bg-notyet-surface',
  /** The limit is reached: this tile waits until the child deselects another one. */
  blocked: 'border-dashed border-line-strong bg-surface text-ink-muted',
};

/** State of one tile before and after checking. */
export function tileState(
  revealed: boolean,
  isSolution: boolean,
  chosen: boolean,
  blocked = false,
): TileState {
  if (revealed) return isSolution ? 'solution' : chosen ? 'chosen' : 'plain';
  if (chosen) return 'selected';
  return blocked ? 'blocked' : 'plain';
}

/** Check mark for a solution tile; screen readers get the words instead. */
export function SolutionMark({ state }: { state: TileState }) {
  if (state !== 'solution') return null;
  return <CheckGlyph className="size-lg shrink-0 text-correct" />;
}

/** "(richtige Antwort)" / "(deine Wahl)" for screen readers, after the tile text. */
export function StateWords({ state }: { state: TileState }) {
  if (state === 'solution') return <span className="sr-only"> (richtige Antwort)</span>;
  if (state === 'chosen') return <span className="sr-only"> (deine Wahl)</span>;
  return null;
}

export function tileClass(state: TileState, interactive: boolean, extra?: string): string {
  return clsx(TILE_CLASS, tileStateClass[state], interactive && 'cursor-pointer', extra);
}
