// Everything a child reads in the Einstiegscheck (PRODUCT.md §5.4). Never "Test" and never
// "Check": the words are about exploring. Offer and intro always name the Fach (task 12).

import { FAECHER, type Fach } from '../../domain/content/taxonomy';
import { BEREICH_NAME, FACH_NAME } from './bereiche';

// The title stays short: "Mathe ist noch unerforscht." and "Noch unerforscht: Deutsch" did not
// fit beside Erkunden and Später in portrait (measured 2026-10-19, see KartenView).
export const offerTitle = (fach: Fach) => `Unerforscht: ${FACH_NAME[fach]}`;
export const OFFER_GO = 'Erkunden';
export const OFFER_LATER = 'Später';
/** Vorlesen on the map: the title (with a full stop for the pause), the yellow button, then the
 * open Gebiete, if any. */
export const offerSpeech = (fach: Fach, openGebiete: readonly string[]) =>
  openGebiete.length > 0
    ? `${offerTitle(fach)}. Tippe auf ${OFFER_GO}, oder wähle gleich ein Gebiet: ${openGebiete.join(', ')}.`
    : `${offerTitle(fach)}. Tippe auf ${OFFER_GO}.`;

export const introTitle = (fach: Fach) => `Wir erkunden ${FACH_NAME[fach]}.`;
/** Deutsch takes longer: twelve questions plus two reading texts. */
const INTRO_MINUTES: Record<Fach, number> = { mathe: 10, deutsch: 15 };
export const introText = (fach: Fach) =>
  `Ein paar Aufgaben zeigen, wo du startest. Das dauert etwa ${INTRO_MINUTES[fach]} Minuten.`;
export const START = 'Starten';

export const PAUSE_TEXT = 'Wenn du jetzt gehst, fangen wir nächstes Mal von vorn an.';
export const CONTINUE = 'Weitermachen';

export const RESULT_TITLE = 'Deine Reise beginnt hier';
export const RESULT_SPEECH = `${RESULT_TITLE}. Auf der Karte siehst du, wo du startest.`;

export const STARTED_TEXT = 'Deine Reise hat schon begonnen.';
export const EMPTY_TEXT = 'Hier gibt es noch nicht genug Aufgaben.';

export const TO_MAP = 'Zur Karte';

/** Every text above, for each Fach, for the language checks in tests/ui/text.test.ts. */
export const EINSTIEG_TEXTS = [
  ...FAECHER.map(offerTitle),
  OFFER_GO,
  OFFER_LATER,
  ...FAECHER.map((fach) => offerSpeech(fach, [])),
  ...FAECHER.map((fach) => offerSpeech(fach, Object.values(BEREICH_NAME))),
  ...FAECHER.map(introTitle),
  ...FAECHER.map(introText),
  START,
  PAUSE_TEXT,
  CONTINUE,
  RESULT_TITLE,
  RESULT_SPEECH,
  STARTED_TEXT,
  EMPTY_TEXT,
  TO_MAP,
];
