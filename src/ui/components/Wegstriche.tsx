// A row of trail dashes: walked dashes in ink, the next one outlined, the rest of the way in
// the faint contour color. Used by the item screen ("3 von 10") and the map's Tagesziel.

import clsx from 'clsx';

export interface WegstricheProps {
  total: number;
  /** Dashes already walked. */
  done: number;
  /** 1-based dash to outline; none when the way is complete. */
  current?: number;
}

export function Wegstriche({ total, done, current }: WegstricheProps) {
  return (
    <ol className="flex items-center gap-2xs" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <li
          key={i}
          className={clsx(
            'block h-xs w-md rounded-round border-2 transition-colors duration-(--duration-feedback)',
            i < done
              ? 'border-ink bg-ink'
              : i === (current ?? 0) - 1
                ? 'border-ink bg-surface'
                : 'border-line bg-line',
          )}
        />
      ))}
    </ol>
  );
}
