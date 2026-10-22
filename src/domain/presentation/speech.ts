// What the Vorlesen button reads (ARCHITECTURE.md §5): the task (readAloudText), then the
// answers in the order on screen ("Antworten: …"). number-input adds nothing. Misspelled words are
// never read aloud (2026-10-22): find-error and cloze-select in the spelling areas read the
// sentence in correct spelling instead ("Hunt" spoken by the voice gave the solution away).

import {
  readAloudText,
  speakable,
  splitUnits,
  type Bereich,
  type Item,
  type ItemOf,
  type ReadingText,
} from '../content';
import {
  clozeParts,
  presentedGapOptions,
  presentedMatch,
  presentedOptions,
  presentedOrder,
} from './order';
import { PRESENTATION_TEXTS as T } from './texts';

/** Ends a spoken piece with a period so the voice pauses between options. */
function sentence(text: string): string {
  const trimmed = text.trim();
  return /[.!?:]$/.test(trimmed) ? trimmed : `${trimmed}.`;
}

function list(texts: string[]): string {
  return texts.map((t) => sentence(speakable(t))).join(' ');
}

/** Choice options: an option's own readAloud is read as written (like the item's), else its text. */
function options(shown: { text: string; readAloud?: string }[]): string {
  return shown.map((o) => sentence(o.readAloud ?? speakable(o.text))).join(' ');
}

/**
 * Text units (words of mark-in-text and find-error) joined with commas, without speakable():
 * "100 200" in a number row must stay two numbers, not become "100200".
 */
function units(texts: string[]): string {
  return `${texts.map((t) => t.replace(/[.,;:!?]+$/, '')).join(', ')}.`;
}

type Speaker<F extends Item['format']> = (
  item: ItemOf<F>,
  attemptIndex: number,
  answer: unknown,
) => string;

const speakers: { [F in Item['format']]: Speaker<F> } = {
  'single-choice': (item, i) => `${T.answers} ${options(presentedOptions(item, i))}`,
  'multi-choice': (item, i) => `${T.answers} ${options(presentedOptions(item, i))}`,
  'number-input': () => '',
  match: (item, i) => {
    const { left, right } = presentedMatch(item, i);
    return `${list(left.map((o) => o.text))} ${T.answers} ${list(right.map((o) => o.text))}`;
  },
  order: (item, i, answer) => {
    // The order on screen: the child's current order once it moved something.
    const byId = new Map(item.payload.items.map((e) => [e.id, e.text]));
    const ids = (answer as { orderedIds?: string[] } | null)?.orderedIds;
    const texts = ids
      ? ids.map((id) => byId.get(id) ?? '')
      : presentedOrder(item, i).map((e) => e.text);
    return `${T.answers} ${list(texts)}`;
  },
  'cloze-select': (item, i) => {
    const options = presentedGapOptions(item, i);
    const parts = clozeParts(item.payload.template);
    const text = parts.map((p) => (p.kind === 'text' ? p.text : ` ${T.gap} ${p.number} `)).join('');
    const answers = parts
      .filter((p) => p.kind === 'gap')
      .map((p) => `${T.answersForGap} ${p.number}: ${(options[p.key] ?? []).join(', ')}.`);
    const spoken = text.replace(/\s+/g, ' ').replace(/ ([.,;:!?])/g, '$1');
    return speakable(`${sentence(spoken)} ${answers.join(' ')}`);
  },
  'mark-in-text': (item) =>
    item.payload.unit === 'word'
      ? `${T.answers} ${units(splitUnits(item.payload.text, 'word'))}`
      : `${T.answers} ${splitUnits(item.payload.text, 'sentence').join(' ')}`,
  'find-error': (item) => `${T.answers} ${units(item.payload.words.map((w) => w.text))}`,
  'short-answer': (item) => (item.payload.hint ? `${T.hint} ${sentence(item.payload.hint)}` : ''),
};

/** The answers part on its own ("Antworten: …"); empty for number-input. */
export function answersSpeech(item: Item, attemptIndex: number, answer: unknown = null): string {
  const speak = speakers[item.format] as Speaker<Item['format']>;
  return speak(item, attemptIndex, answer);
}

const SPELLING_BEREICHE: ReadonlySet<Bereich> = new Set(['rs-laut-buchstabe', 'rs-strategien']);

/**
 * find-error and cloze-select in the spelling areas: the sentence in correct spelling from the
 * solution, without speakable(). null when a correction or a gap's solution is missing.
 */
export function spelledSentence(
  item: ItemOf<'find-error'> | ItemOf<'cloze-select'>,
): string | null {
  if (item.format === 'find-error') {
    const { errorIds, corrections } = item.solution;
    if (errorIds.some((id) => corrections[id] === undefined)) return null;
    return item.payload.words.map((w) => corrections[w.id] ?? w.text).join(' ');
  }
  const parts = clozeParts(item.payload.template);
  const texts = parts.map((p) => (p.kind === 'text' ? p.text : item.solution.gaps[p.key]));
  return texts.every((t) => t !== undefined) ? texts.join('') : null;
}

/** Everything the Vorlesen button on the task sheet reads. */
export function itemSpeech(item: Item, attemptIndex: number, answer: unknown = null): string {
  const spelling =
    SPELLING_BEREICHE.has(item.bereich) &&
    (item.format === 'find-error' || item.format === 'cloze-select');
  const rest = spelling ? (spelledSentence(item) ?? '') : answersSpeech(item, attemptIndex, answer);
  return [readAloudText(item), rest].filter((part) => part.length > 0).join(' ');
}

/** short-answer while comparing: the question in the band, the model answer and key points. */
export function comparisonSpeech(item: ItemOf<'short-answer'>): string {
  return [
    T.compareQuestion,
    T.modelHeading,
    sentence(item.solution.model),
    T.keyPointsHeading,
    list(item.solution.keyPoints),
  ].join(' ');
}

/** find-error: the correct spelling of every error, in sentence order ("Samstag, Fahrrad"). */
export function corrections(item: ItemOf<'find-error'>): string {
  return item.payload.words
    .filter((w) => item.solution.errorIds.includes(w.id))
    .map((w) => item.solution.corrections[w.id] ?? w.text)
    .join(', ');
}

/**
 * The text box's own Vorlesen: title and paragraphs as written (task 9). Not speakable(): that is
 * for maths notation, in prose "1990 – 2000" must not become "minus". The item's button never
 * reads the text (itemSpeech has no textRef), so a child can hear the question alone.
 */
export function textSpeech(text: Pick<ReadingText, 'title' | 'paragraphs'>): string {
  return [text.title, ...text.paragraphs].join(' ');
}
