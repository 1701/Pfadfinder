// How numbers look to the child: thousands grouped by a non-breaking space like in the tasks
// ("4 735"), comma as decimal separator.

const GROUP = '\u00a0';

function groupInteger(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, GROUP);
}

/** Groups the integer part of digit-pad input, keeps a trailing comma ("1 234,"). */
export function groupDraft(draft: string): string {
  const [int = '', ...rest] = draft.split(',');
  return rest.length > 0 ? `${groupInteger(int)},${rest.join('')}` : groupInteger(int);
}

/** Units whose amounts are written with cents: 2.2 € is "2,20 €", never "2,2 €". */
const CENT_UNITS: ReadonlySet<string> = new Set(['€']);

function plain(value: number, unit?: string): string {
  return unit !== undefined && CENT_UNITS.has(unit) && !Number.isInteger(value)
    ? value.toFixed(2)
    : String(value);
}

export function formatGermanNumber(value: number, unit?: string): string {
  const [int = '', frac] = plain(value, unit).split('.');
  return frac ? `${groupInteger(int)},${frac}` : groupInteger(int);
}

/** Digit-pad text for a stored answer, e.g. when a renderer is shown again. */
export function toDraft(value: number, unit?: string): string {
  return plain(value, unit).replace('.', ',');
}
