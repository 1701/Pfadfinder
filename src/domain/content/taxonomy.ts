// Subjects, areas and their ID abbreviations (CONTENT_SCHEMA.md §2).

export const SCHEMA_VERSION = '1.0' as const;

export const FAECHER = ['mathe', 'deutsch'] as const;
export type Fach = (typeof FAECHER)[number];

export const BEREICHE_BY_FACH = {
  mathe: [
    'zahlen-operationen',
    'raum-form',
    'groessen-messen',
    'daten-zufall',
    'muster-strukturen',
  ],
  deutsch: [
    'lesen-sachtext',
    'lesen-literarisch',
    'rs-laut-buchstabe',
    'rs-strategien',
    'sprache-untersuchen',
  ],
} as const satisfies Record<Fach, readonly string[]>;

export const BEREICHE = [...BEREICHE_BY_FACH.mathe, ...BEREICHE_BY_FACH.deutsch] as const;
export type Bereich = (typeof BEREICHE)[number];

/**
 * Bereiche every Probetest of a Fach must cover with at least 2 items (CONTENT_SCHEMA §6, 1.0.22;
 * Deutsch since 1.0.26: sprache-untersuchen in, lesen-literarisch out, as in Kompass 4 Deutsch
 * 2024 and 2025). Written out, never derived from BEREICHE_BY_FACH: a new Bereich is not required
 * until the Probetests of its Fach contain it. Never extend the Bereich enum without deciding here.
 */
export const PROBETEST_REQUIRED_BEREICHE = {
  mathe: [
    'zahlen-operationen',
    'raum-form',
    'groessen-messen',
    'daten-zufall',
    'muster-strukturen',
  ],
  deutsch: ['lesen-sachtext', 'rs-laut-buchstabe', 'rs-strategien', 'sprache-untersuchen'],
} as const satisfies Record<Fach, readonly Bereich[]>;

/**
 * Share of the items per Niveau in every Probetest (CONTENT_SCHEMA §6, 1.0.23): min·n ≤ count ≤
 * max·n, compared as decimals, no rounding, no ±1. Decision 2026-10-25: covers the pool mix
 * 10/10/4 (and 9/8/4 at 21 items) and the Kompass 4 test mix 7/13/4. III 23 % instead of 22 %, so
 * that 4 of 18 and 5 of 22 are valid (2026-10-25).
 */
export const PROBETEST_NIVEAU_BAND = {
  1: { min: 0.29, max: 0.44 },
  2: { min: 0.38, max: 0.55 },
  3: { min: 0.16, max: 0.23 },
} as const;

export const FACH_ABBR = { mathe: 'm', deutsch: 'd' } as const satisfies Record<Fach, string>;

export const BEREICH_ABBR = {
  'zahlen-operationen': 'zo',
  'raum-form': 'rf',
  'groessen-messen': 'gm',
  'daten-zufall': 'dz',
  'muster-strukturen': 'ms',
  'lesen-sachtext': 'lsa',
  'lesen-literarisch': 'lli',
  'rs-laut-buchstabe': 'rsl',
  'rs-strategien': 'rss',
  'sprache-untersuchen': 'su',
} as const satisfies Record<Bereich, string>;

/** Reading areas: the only ones allowed to reference a ReadingText via `stimulus.textRef`. */
export const LESEN_BEREICHE = ['lesen-sachtext', 'lesen-literarisch'] as const satisfies readonly Bereich[];
/** Spelling areas: a Deutsch Probetest ends with these. */
export const RECHTSCHREIBUNG_BEREICHE = [
  'rs-laut-buchstabe',
  'rs-strategien',
] as const satisfies readonly Bereich[];

export function fachOfBereich(bereich: Bereich): Fach {
  return (BEREICHE_BY_FACH.mathe as readonly string[]).includes(bereich) ? 'mathe' : 'deutsch';
}

export function isLesenBereich(bereich: Bereich): boolean {
  return (LESEN_BEREICHE as readonly string[]).includes(bereich);
}

/** The Lesen-Bereich whose items use a text of this kind (CONTENT_SCHEMA §5). */
export function bereichOfTextKind(kind: 'sachtext' | 'literarisch'): Bereich {
  return kind === 'sachtext' ? 'lesen-sachtext' : 'lesen-literarisch';
}

export function isRechtschreibungBereich(bereich: Bereich): boolean {
  return (RECHTSCHREIBUNG_BEREICHE as readonly string[]).includes(bereich);
}
