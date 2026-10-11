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

export function formatGermanNumber(value: number): string {
  const [int = '', frac] = String(value).split('.');
  return frac ? `${groupInteger(int)},${frac}` : groupInteger(int);
}

/** Digit-pad text for a stored answer, e.g. when a renderer is shown again. */
export function toDraft(value: number): string {
  return String(value).replace('.', ',');
}
