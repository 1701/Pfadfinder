// Content writes large numbers with a plain space ("10 000"). On screen the groups must never
// be split across two lines, so the space between digit groups becomes non-breaking. In the task
// itself a number also stays with the word after it ("24 Plätze", "5 €").

export function keepNumbersTogether(text: string): string {
  return text.replace(/(\d) (?=\d{3}(?!\d))/g, '$1\u00a0');
}

/** Stimulus and prompt: digit groups together, and a number together with the following word. */
export function keepNumbersWithWords(text: string): string {
  return keepNumbersTogether(text).replace(/(\d) (?=[A-Za-zÄÖÜäöüß€%])/g, '$1\u00a0');
}
