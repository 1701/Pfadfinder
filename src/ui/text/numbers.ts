// Content writes large numbers with a plain space ("10 000"). On screen the groups must never
// be split across two lines, so the space between digit groups becomes non-breaking.

export function keepNumbersTogether(text: string): string {
  return text.replace(/(\d) (?=\d{3}(?!\d))/g, '$1\u00a0');
}
