// The Probetest's Wegstriche: filled, dashed (a short answer that waits for the child's own
// rating) and empty. One drawing for the result, both overviews and their legends.
// The dashed one is a drawn outline: CSS dashes break apart at this size, and with "3 2" most
// dashes sat on the round ends and read as dots on the iPad; "4 3" keeps dashes on the long
// sides (task 11, compared at 2× pixel density).

import clsx from 'clsx';

export type StrichArt = 'filled' | 'dashed' | 'empty';

/** `wide`: the overviews' 24 px Strich; otherwise the result's 16 px. */
export function Strich({ art, wide = false }: { art: StrichArt; wide?: boolean }) {
  const size = clsx('block h-xs shrink-0', wide ? 'w-lg' : 'w-md');
  if (art === 'dashed') {
    const width = wide ? 24 : 16;
    return (
      <svg
        aria-hidden="true"
        data-strich-art={art}
        viewBox={`0 0 ${width} 8`}
        className={clsx(size, 'overflow-visible')}
      >
        <rect
          x="1"
          y="1"
          width={width - 2}
          height="6"
          rx="3"
          className="fill-none stroke-ink"
          strokeWidth="2"
          strokeDasharray="4 3"
        />
      </svg>
    );
  }
  return (
    <span
      aria-hidden="true"
      data-strich-art={art}
      className={clsx(
        size,
        'rounded-round border-2',
        art === 'filled' ? 'border-ink bg-ink' : 'border-line-strong bg-surface',
      )}
    />
  );
}

export interface StrichRasterProps {
  arts: readonly StrichArt[];
  /** Spoken name per item, e.g. "Aufgabe 3, beantwortet". */
  labels: readonly string[];
  /** 0-based item with the ring. */
  current: number;
  onJump(index: number): void;
}

/** One tappable Wegstrich per item, twelve in a row, the number above. */
export function StrichRaster({ arts, labels, current, onJump }: StrichRasterProps) {
  return (
    <ol className="grid grid-cols-12 gap-xs">
      {arts.map((art, i) => (
        <li key={i}>
          <button
            type="button"
            aria-label={labels[i]}
            aria-current={i === current ? 'step' : undefined}
            onClick={() => onJump(i)}
            className={clsx(
              'grid min-h-primary min-w-touch place-items-center gap-2xs rounded-control px-2xs py-xs',
              i === current && 'outline-2 outline-offset-2 outline-ink',
            )}
          >
            <span aria-hidden="true">{i + 1}</span>
            <Strich art={art} wide />
          </button>
        </li>
      ))}
    </ol>
  );
}
