// "3 von 10" plus a row of trail dashes: walked dashes in ink, the current one outlined,
// the rest of the way in the faint contour color. No percentages.

import clsx from 'clsx';

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
      <ol className="flex items-center gap-2xs" aria-hidden="true">
        {Array.from({ length: total }, (_, i) => (
          <li
            key={i}
            className={clsx(
              'block h-xs w-md rounded-round border-2 transition-colors duration-(--duration-feedback)',
              i < done
                ? 'border-ink bg-ink'
                : i === current - 1
                  ? 'border-ink bg-surface'
                  : 'border-line bg-line',
            )}
          />
        ))}
      </ol>
      <p>
        <span className="sr-only">Aufgabe </span>
        {current} von {total}
      </p>
    </div>
  );
}
