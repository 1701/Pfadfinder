// Tokenisation for `mark-in-text`: solution.indices refer to these units (CONTENT_SCHEMA.md §4.7).
// Validation and the UI renderer must both use this function so indices mean the same thing.

export type TextUnit = 'word' | 'sentence';

/** Words are separated by whitespace; punctuation stays attached to its word. */
export function splitWords(text: string): string[] {
  return text.split(/\s+/).filter((w) => w.length > 0);
}

/** A sentence ends with `.`, `!` or `?` (optionally followed by closing quotes) and whitespace. */
export function splitSentences(text: string): string[] {
  return text
    .split(/(?<=[.!?]["“”»«']?)\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

export function splitUnits(text: string, unit: TextUnit): string[] {
  return unit === 'word' ? splitWords(text) : splitSentences(text);
}
