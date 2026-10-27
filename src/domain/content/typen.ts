// content/typen.json (CONTENT_SCHEMA §1, §7, since 1.0.27): the task types per Bereich, named on the
// page for parents and teachers (/eltern). Content, not part of the item contract; kept up to date
// with every batch. Checked here, called from validateContent.

import { BEREICHE, type Bereich } from './taxonomy';

export const TYPEN_FILE = 'typen.json';

/** Task types per Bereich, as parents read them: "Stellentafel", "Zahlen ordnen und runden". */
export type AufgabenTypen = Record<Bereich, readonly string[]>;

/** Problems of a typen.json, one message each; empty when it is valid. */
export function checkTypen(data: unknown): string[] {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) {
    return ['typen.json muss ein Objekt Bereich → Liste von Aufgabentypen sein'];
  }
  const problems: string[] = [];
  const known = BEREICHE as readonly string[];
  for (const bereich of BEREICHE) {
    if (!(bereich in data)) problems.push(`Bereich "${bereich}" fehlt`);
  }
  for (const [key, value] of Object.entries(data)) {
    if (!known.includes(key)) {
      problems.push(`Unbekannter Bereich "${key}"`);
      continue;
    }
    if (!Array.isArray(value) || value.length === 0) {
      problems.push(`"${key}": Liste von Aufgabentypen fehlt oder ist leer`);
    } else if (value.some((typ) => typeof typ !== 'string' || typ.trim() === '')) {
      problems.push(`"${key}": jeder Aufgabentyp ist ein nicht leerer Text`);
    }
  }
  return problems;
}
