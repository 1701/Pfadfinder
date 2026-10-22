// The Eltern page (/eltern, by URL or from Impressum and Datenschutz). Written for adults, still Du and at most two sentences
// per element, like everything else in the app.

import type { GateQuestion } from '../../domain/parents';

export const gateTitle = ({ a, b }: GateQuestion) => `Für Erwachsene: Wie viel ist ${a} + ${b}?`;
export const GATE_RETRY = 'Das passt nicht. Hier ist eine neue Rechnung.';
export const GATE_SUBMIT = 'Weiter';

export const DELETE_TITLE = 'Hier kannst du die Daten auf diesem Gerät sichern oder löschen.';
export const DELETE_TEXT =
  'Die Sicherung ist eine Datei mit allen Antworten, Niveaus und Entdeckungen. Löschen entfernt alles von diesem Gerät.';
export const BACKUP = 'Sicherung herunterladen';
export const BACKUP_FAILED = 'Die Sicherung hat nicht geklappt. Versuch es bitte noch einmal.';
export const DELETE_ALL = 'Alles löschen';

/** Below "Sicherung herunterladen" (release list, 2026-10-22): a file from another device. */
export const IMPORT = 'Sicherung einlesen';
export const IMPORT_INVALID = 'Das ist keine Pfadfinder-Sicherung.';
export const IMPORT_CONFIRM = 'Ersetzt alles auf diesem Gerät. Weiter?';
export const IMPORT_GO = 'Einlesen';
export const IMPORT_FAILED = 'Das Einlesen hat nicht geklappt. Versuch es bitte noch einmal.';

/** The app picks no voice (VorlesenButton), so a better one comes from iPadOS (2026-10-22). */
export const PREMIUM_VOICE =
  'Auf dem iPad klingt das Vorlesen besser, wenn du in Einstellungen → Bedienungshilfen → Gesprochene Inhalte eine Premium-Stimme für Deutsch lädst.';

export const CONFIRM_TITLE = 'Wirklich alles löschen? Das kann nicht rückgängig gemacht werden.';
export const CANCEL = 'Abbrechen';
export const CONFIRM_DELETE = 'Ja, alles löschen';
export const DELETE_FAILED = 'Das Löschen hat nicht geklappt. Versuch es bitte noch einmal.';

/** Every text above, for the language checks in tests/ui/text.test.ts. */
export const ELTERN_TEXTS = [
  gateTitle({ a: 47, b: 38 }),
  GATE_RETRY,
  GATE_SUBMIT,
  DELETE_TITLE,
  DELETE_TEXT,
  BACKUP,
  BACKUP_FAILED,
  DELETE_ALL,
  IMPORT,
  IMPORT_INVALID,
  IMPORT_CONFIRM,
  IMPORT_GO,
  IMPORT_FAILED,
  PREMIUM_VOICE,
  CONFIRM_TITLE,
  CANCEL,
  CONFIRM_DELETE,
  DELETE_FAILED,
] as const;
