// "3 von 10" plus the Wegstriche: walked dashes in ink, the current one outlined, the rest of
// the way in the faint contour color. No percentages.

import { Wegstriche } from './Wegstriche';

export interface FortschrittProps {
  /** Number of the item on screen, 1-based. */
  current: number;
  total: number;
  /** Items already answered (the current one counts once it has been checked). */
  done: number;
}

export function Fortschritt({ current, total, done }: FortschrittProps) {
  return (
    <div className="flex items-center gap-md text-ink-muted">
      <Wegstriche total={total} done={done} current={current} />
      <p>
        <span className="sr-only">Aufgabe </span>
        {current} von {total}
      </p>
    </div>
  );
}
