// A row of trail dashes, the same sign language as the Etappen marks on the map: a filled dash
// is walked, a faint one is still ahead, and a ring with a little gap says "you are here".
// Used by the item screen ("3 von 10") and the map's Tagesziel.

import clsx from 'clsx';

export interface WegstricheProps {
  total: number;
  /** Dashes already walked. */
  done: number;
  /** 1-based dash with the ring; none when the way is complete. */
  current?: number;
}

export function Wegstriche({ total, done, current }: WegstricheProps) {
  return (
    <ol className="flex items-center gap-xs" aria-hidden="true">
      {Array.from({ length: total }, (_, i) => (
        <li
          key={i}
          data-current={i === (current ?? 0) - 1 ? '' : undefined}
          className={clsx(
            'block h-xs w-md rounded-round border-2 transition-colors duration-(--duration-feedback)',
            i < done ? 'border-ink bg-ink' : 'border-line bg-line',
            i === (current ?? 0) - 1 && 'outline-2 outline-offset-2 outline-ink',
          )}
        />
      ))}
    </ol>
  );
}
