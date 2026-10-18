// Everything a child reads in the Einstiegscheck (PRODUCT.md §5.4). Never "Test" and never
// "Check": the words are about the journey. Offer and intro always name the Fach (task 12).

import { FAECHER, type Fach } from '../../domain/content/taxonomy';
import { FACH_NAME } from './bereiche';

export const offerTitle = (fach: Fach) => `Wo geht’s in ${FACH_NAME[fach]} los?`;
export const OFFER_GO = 'Los';
export const OFFER_LATER = 'Später';

export const introTitle = (fach: Fach) =>
  `Wir schauen, wo deine Reise in ${FACH_NAME[fach]} losgeht.`;
export const INTRO_TEXT = 'Das dauert etwa 10 Minuten.';
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
  ...FAECHER.map(introTitle),
  INTRO_TEXT,
  START,
  PAUSE_TEXT,
  CONTINUE,
  RESULT_TITLE,
  RESULT_SPEECH,
  STARTED_TEXT,
  EMPTY_TEXT,
  TO_MAP,
];
