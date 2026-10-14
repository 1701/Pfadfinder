// Words the child sees and hears around the formats. Kept in the domain because the read-aloud
// text uses them too; the UI imports them from here (one wording on screen and in the voice).

export const PRESENTATION_TEXTS = {
  answers: 'Antworten:',
  gap: 'Lücke',
  answersForGap: 'Antworten für Lücke',
  hint: 'Tipp:',
  compareQuestion: 'Hast du es getroffen?',
  modelHeading: 'So könnte es aussehen:',
  keyPointsHeading: 'Darauf kommt es an:',
  correction: 'So schreibt man es:',
  rightIs: 'Richtig ist:',
} as const;

/** Self-rating of a short answer (CONTENT_SCHEMA §4.9): 1 / 0.5 / 0. */
export const SELF_RATINGS = [
  { rating: 1, label: 'Getroffen' },
  { rating: 0.5, label: 'Teils' },
  { rating: 0, label: 'Noch nicht' },
] as const;
