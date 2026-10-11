// Turns the digit-pad input into a number before evaluate() is called.

const PLAIN = /^\d+(,\d+)?$/;
/** German thousands separators: 1.000 or 1.000.000,5 – only valid in groups of three. */
const GROUPED = /^\d{1,3}(\.\d{3})+(,\d+)?$/;

/**
 * Parses a German number: comma as decimal separator, optional spaces or dots as
 * thousands separators. Returns null for empty, incomplete ("3,") or ambiguous ("1.5") input,
 * so the UI can keep the submit button disabled. Negative numbers are not supported.
 */
export function parseGermanNumber(input: string): number | null {
  const compact = input.replace(/[\s  ]/g, '');
  if (PLAIN.test(compact)) return Number(compact.replace(',', '.'));
  if (GROUPED.test(compact)) return Number(compact.replace(/\./g, '').replace(',', '.'));
  return null;
}
