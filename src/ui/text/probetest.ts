// Everything a child reads in the Probetest (PRODUCT.md §5.4, decisions 2026-10-15). Calm and
// plain: numbers only in the result, no percent, no grade, never "falsch".

export const MAP_LINE = 'Probetest Mathe';

export const INTRO_TITLE = 'Probetest Mathe';
export const INTRO_TEXT = '45 Minuten, wie in der Schule. Du kannst vor und zurück.';
export const DONE_BEFORE = 'Du hast diesen Probetest schon gemacht.';
export const SHOW_RESULT = 'Auswertung ansehen';
export const START = 'Starten';
export const UNAVAILABLE = 'Diesen Probetest gibt es nicht.';

export const OVERVIEW = 'Übersicht';
export const BACK = 'Zurück';
export const NEXT = 'Weiter';
export const TO_MAP = 'Zur Karte';
export const TO_RESULT = 'Zur Auswertung';

export const OVERVIEW_TEXT = 'Tippe auf eine Aufgabe, dann springst du hin.';
export const ANSWERED = 'beantwortet';
export const OPEN = 'offen';
export const CONTINUE = 'Weitermachen';
export const SUBMIT = 'Abgeben';

export const SUBMIT_QUESTION = 'Willst du trotzdem abgeben?';
export const LEAVE_TITLE = 'Dann ist der Probetest vorbei.';
export const LEAVE_TEXT = 'Es gibt dann keine Auswertung.';

export const RESULT_DONE = 'Geschafft.';
export const RESULT_TIME_UP = 'Die Zeit ist um.';
export const RESULT_TEXT = 'So viele Aufgaben hast du gelöst.';
export const TOTAL = 'Zusammen';
export const REVIEW = 'Durchsehen';

export const MISSING = 'Hier fehlt deine Antwort.';

// Comparing the waiting short answers (task 11): a quiet button on the result, a legend under the
// Wegstriche, and the overview while looking through.
export const PENDING_LEGEND = 'gestrichelt: noch nicht verglichen';
export const SOLVED = 'gelöst';
export const REVIEW_ON = 'Weiter durchsehen';

// The printed sheet (parents print it; no link on a child's screen).
export const PRINT = 'Drucken';
export const PRINT_NAME = 'Name';
export const PRINT_SOLUTIONS = 'Lösungen';

/** "Probetest Mathe 1" from the id mathe-01. */
export function printTitle(fach: string, id: string): string {
  return `Probetest ${fach} ${Number(id.slice(-2))}`;
}

/** "Noch 16 Aufgaben sind offen." */
export function openTitle(open: number): string {
  return open === 1 ? 'Noch 1 Aufgabe ist offen.' : `Noch ${open} Aufgaben sind offen.`;
}

/** "1 Antwort vergleichen", "2 Antworten vergleichen". */
export function compareLabel(pending: number): string {
  return `${pending} ${pending === 1 ? 'Antwort' : 'Antworten'} vergleichen`;
}

/** "4 von 6" */
export function solvedOf(solved: number, total: number): string {
  return `${solved} von ${total}`;
}

/** The time in the header: minutes, and in the last five "Noch 5 Minuten" … "Noch 1 Minute". */
export function timeText(minutes: number, final: boolean): string {
  if (!final) return `${minutes} Min.`;
  return minutes === 1 ? 'Noch 1 Minute' : `Noch ${minutes} Minuten`;
}

/** Every fixed text above, for the language checks in tests/ui/text.test.ts. */
export const PROBETEST_TEXTS = [
  MAP_LINE,
  INTRO_TITLE,
  INTRO_TEXT,
  DONE_BEFORE,
  SHOW_RESULT,
  START,
  UNAVAILABLE,
  OVERVIEW,
  BACK,
  NEXT,
  TO_MAP,
  TO_RESULT,
  OVERVIEW_TEXT,
  ANSWERED,
  OPEN,
  CONTINUE,
  SUBMIT,
  SUBMIT_QUESTION,
  LEAVE_TITLE,
  LEAVE_TEXT,
  RESULT_DONE,
  RESULT_TIME_UP,
  RESULT_TEXT,
  TOTAL,
  REVIEW,
  MISSING,
  PENDING_LEGEND,
  SOLVED,
  REVIEW_ON,
  PRINT,
  PRINT_NAME,
  PRINT_SOLUTIONS,
  printTitle('Mathe', 'mathe-01'),
  openTitle(1),
  openTitle(16),
  compareLabel(1),
  compareLabel(2),
  timeText(45, false),
  timeText(5, true),
  timeText(1, true),
] as const;
