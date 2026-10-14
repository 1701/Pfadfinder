// Line glyphs in the ink of their context (currentColor). Decorative: always aria-hidden,
// the meaning is carried by visible or screen-reader text next to them.

const common = {
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 2.25,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
} as const;

export function SpeakerGlyph({ className }: { className?: string }) {
  return (
    <svg {...common} className={className}>
      <path d="M4 9h3l5-4v14l-5-4H4z" fill="currentColor" stroke="none" />
      <path d="M16 8.5a5 5 0 0 1 0 7" />
      <path d="M18.5 6a8.5 8.5 0 0 1 0 12" />
    </svg>
  );
}

export function StopGlyph({ className }: { className?: string }) {
  return (
    <svg {...common} className={className}>
      <rect x="6" y="6" width="12" height="12" rx="1.5" fill="currentColor" stroke="none" />
    </svg>
  );
}

/** "Richtig": a plain check mark. */
export function CheckGlyph({ className }: { className?: string }) {
  return (
    <svg {...common} className={className}>
      <path d="M4.5 12.5l5 5L19.5 7" />
    </svg>
  );
}

/** "Noch nicht ganz": a signpost – here is the way, never an X. */
export function SignpostGlyph({ className }: { className?: string }) {
  return (
    <svg {...common} className={className}>
      <path d="M12 3v18" />
      <path d="M12 5h6l2.5 2.5L18 10h-6z" fill="currentColor" />
      <path d="M12 12H6l-2.5 2.5L6 17h6z" />
    </svg>
  );
}

/** order: move up / move down. */
export function ArrowUpGlyph({ className }: { className?: string }) {
  return (
    <svg {...common} className={className}>
      <path d="M12 19V5" />
      <path d="M6 11l6-6 6 6" />
    </svg>
  );
}

export function ArrowDownGlyph({ className }: { className?: string }) {
  return (
    <svg {...common} className={className}>
      <path d="M12 5v14" />
      <path d="M6 13l6 6 6-6" />
    </svg>
  );
}

/** order: the handle to drag a card. */
export function GripGlyph({ className }: { className?: string }) {
  return (
    <svg {...common} className={className}>
      {[8, 16].flatMap((x) =>
        [6, 12, 18].map((y) => (
          <circle key={`${x}-${y}`} cx={x} cy={y} r="1.6" fill="currentColor" stroke="none" />
        )),
      )}
    </svg>
  );
}
