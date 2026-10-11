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
  deutsch: ['lesen-sachtext', 'lesen-literarisch', 'rs-laut-buchstabe', 'rs-strategien'],
} as const satisfies Record<Fach, readonly string[]>;

export const BEREICHE = [...BEREICHE_BY_FACH.mathe, ...BEREICHE_BY_FACH.deutsch] as const;
export type Bereich = (typeof BEREICHE)[number];

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

export function isRechtschreibungBereich(bereich: Bereich): boolean {
  return (RECHTSCHREIBUNG_BEREICHE as readonly string[]).includes(bereich);
}
