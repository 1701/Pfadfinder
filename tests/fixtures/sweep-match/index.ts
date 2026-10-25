// Sweep fixtures for the sum rule of match beside a reading text (task 15, CONTENT_SCHEMA 1.0.17).
// NOT app content – never copy into content/. Used only by the dev previews (/dev/text,
// /dev/probetest) and tests/e2e/sweep-match.spec.ts, which runs only with PFADFINDER_SWEEP=1.
//
// Every item stands beside t-sach-901 ("Der Igel im Winter") with the same prompt (74 characters)
// and the same feedback: incorrect + misconception = 195 characters, the length of the longest
// match feedback in the pool at the time (task 15: 91 + 104, Mathe without a text), so the line
// "Richtig ist: …" and the feedback below it are the conservative case. What varies is the sum of
// all card texts (left and right, the distractor included):
//   pairs 3 and 4 (each with one distractor) × sum 80, 90, 100, 110, 120, 130, 140, 160, 180
//   × split "even" (all cards the same length) and "skew" (every right card twice as long as every
//   left card); plus 5 pairs with a distractor at sum 80, even.
// Every single card stays within 35 (left) / 52 (right) characters. The card texts are real words
// of the igel text, so they wrap like German, not like a row of x.
//
// Second sweep (task 15, after the first found no sum): the feedback length varies.
//   pairs 3 and 4 (each with one distractor) × sum 100 and 140 (even)
//   × incorrect + misconception 95, 120, 150, 180, 195 characters (about 45/55 as in content;
//   195 is the fixed feedback of the first sweep). Ids d-lsa-3-960 onwards: the three-digit
//   number of d-lsa-2-… ends at 999.
// One more point (task 15, 1c): 3 pairs, sum 140, feedback 195, prompt 60 characters, which
// wraps into 2 lines in landscape where the 74 of the sweeps take 3 (d-lsa-3-980).

import { z } from 'zod';
import { itemSchema, type Item } from '../../../src/domain/content';
import { itemId } from '../builders';
import { sachtext } from '../items';

export type SweepSplit = 'even' | 'skew';

export interface SweepPoint {
  item: Item;
  pairs: number;
  sum: number;
  split: SweepSplit;
  /** incorrect + misconception in characters. */
  feedback: number;
  /** The prompt, when it is not SWEEP_PROMPT. */
  prompt?: string;
}

export const SWEEP_SUMS = [80, 90, 100, 110, 120, 130, 140, 160, 180] as const;
export const SWEEP_PAIRS = [3, 4] as const;
/** The extra point: 5 pairs only at the smallest sum. */
export const SWEEP_FIVE_PAIRS = { pairs: 5, sum: 80, split: 'even' } as const;
/** Per card, beside a reading text (1.0.15): where a single card starts to wrap badly. */
export const CARD_LIMITS = { left: 35, right: 52 } as const;

export const SWEEP_PROMPT =
  'Lies Absatz 2 und 3. Was gehört zusammen? Eine Karte passt zu keinem Satz.';
/** 60 characters (task 15, 1c): the limit of the rule, two lines in landscape. */
export const SWEEP_PROMPT_SHORT = 'Lies Absatz 3. Was gehört zusammen? Eine Karte bleibt übrig.';
export const SWEEP_FEEDBACK = {
  correct: 'Genau. Jede Karte passt zu einem Satz im Text.',
  incorrect:
    'Lies jeden Satz links noch einmal. Suche danach im Text die Stelle, die genau zu ihm passt.',
  misconception:
    'Viele nehmen die Karte, die nur ein gleiches Wort hat. Prüfe danach, ob auch der ganze Satz genau passt.',
};

/** Second sweep: feedback lengths at these sums (even split). */
export const FEEDBACK_LENGTHS = [95, 120, 150, 180, 195] as const;
export const FEEDBACK_SUMS = [100, 140] as const;
/** incorrect : misconception, about as in the match items of content/. */
const INCORRECT_SHARE = 0.45;
const INCORRECT_WORDS =
  'Lies jeden Satz links noch einmal. Suche danach im Text die Stelle, die genau zu ihm passt. Dann siehst du, welche Karte dazugehört und welche Karte am Ende übrig bleibt.';
const MISCONCEPTION_WORDS =
  'Viele nehmen die Karte, die nur ein gleiches Wort hat. Prüfe danach, ob auch der ganze Satz genau passt. Ein gleiches Wort allein reicht nicht, auch der Sinn muss stimmen.';

/** Words of the igel text, in text order; the card texts walk through them. */
const WORDS = sachtext.paragraphs
  .join(' ')
  .replace(/[.,]/g, '')
  .split(/\s+/)
  .filter((w) => w.length >= 2 && w.length <= 10);
/** The last word of a card has exactly the length that is left: 2 to 12 characters. */
const BY_LENGTH: Record<number, string[]> = {
  2: ['im', 'am', 'zu', 'so'],
  3: ['Bau', 'Ast', 'Tag', 'See'],
  4: ['Laub', 'Nest', 'Igel', 'Moos'],
  5: ['Hecke', 'Käfer', 'Kugel', 'Nacht'],
  6: ['Futter', 'Garten', 'Herbst', 'Haufen'],
  7: ['Stachel', 'Blätter', 'langsam', 'Astloch'],
  8: ['Schnecke', 'Frühling', 'Igelnest', 'Laubbett'],
  9: ['Säugetier', 'Ruheplatz', 'Käferjagd', 'Rückseite'],
  10: ['Laubhaufen', 'Winternest', 'Gartenecke', 'Herbstlaub'],
  11: ['Futtersuche', 'Igelstachel', 'Laubschicht', 'Kälteschutz'],
  12: ['Winterschlaf', 'Stachelkugel', 'Frühlingstag'],
};

/** Short cards: one word of that length, or two short words ("im Laub"), for more variety. */
function shortCards(length: number): string[] {
  const pairs: string[] = [];
  for (let a = 2; a <= length - 3; a++) {
    BY_LENGTH[a]!.forEach((first, j) => {
      const second = BY_LENGTH[length - 1 - a]!;
      pairs.push(`${first} ${second[j % second.length]!}`);
    });
  }
  return [...BY_LENGTH[length]!, ...pairs];
}

/** A card text of exactly `length` characters, starting at word `start` of the text. */
export function cardText(length: number, start: number): string {
  const last = (n: number) => BY_LENGTH[n]![start % BY_LENGTH[n]!.length]!;
  if (length <= 12) {
    const options = shortCards(length);
    return capitalize(options[start % options.length]!);
  }
  const words: string[] = [];
  let left = length;
  // Words of the text until at most 8 characters are left, so the last word is a short one.
  for (let i = start; left > 8; i++) {
    const word = WORDS[i % WORDS.length]!;
    // Room for the space and a last word of at least 2 characters.
    if (word.length + 1 + 2 > left) continue;
    words.push(word);
    left -= word.length + 1;
  }
  words.push(last(left));
  return capitalize(words.join(' '));
}

/** A feedback sentence of exactly `length` characters: words of `base`, a short word, a full stop. */
export function feedbackText(length: number, base: string): string {
  const words: string[] = [];
  let left = length;
  const all = base.split(' ');
  // Words of `base`, from the start again when they run out, until at most 9 characters are left.
  for (let i = 0; left > 9; i++) {
    const word = all[i % all.length]!;
    // Room for the space, a last word of at least 2 characters and the full stop.
    if (word.length + 1 + 3 > left) continue;
    words.push(word);
    left -= word.length + 1;
  }
  return `${[...words, BY_LENGTH[left - 1]![0]!].join(' ')}.`;
}

/** The feedback of a sweep item: the fixed one at 195, otherwise generated to the length. */
export function sweepFeedback(total: number) {
  if (total === SWEEP_FEEDBACK.incorrect.length + SWEEP_FEEDBACK.misconception.length)
    return { ...SWEEP_FEEDBACK };
  const incorrect = Math.round(total * INCORRECT_SHARE);
  return {
    correct: SWEEP_FEEDBACK.correct,
    incorrect: feedbackText(incorrect, INCORRECT_WORDS),
    misconception: feedbackText(total - incorrect, MISCONCEPTION_WORDS),
  };
}

function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Card lengths that add up to `sum` exactly: each card gets its weight's share (1 left; 1 or 2
 * right), the rest goes one character at a time to the card furthest below its share.
 */
export function cardLengths(pairs: number, sum: number, split: SweepSplit) {
  const weights = [
    ...Array<number>(pairs).fill(1),
    ...Array<number>(pairs + 1).fill(split === 'skew' ? 2 : 1),
  ];
  const unit = sum / weights.reduce((a, b) => a + b, 0);
  const lengths = weights.map((w) => Math.floor(w * unit));
  for (let rest = sum - lengths.reduce((a, b) => a + b, 0); rest > 0; rest--) {
    const behind = lengths.map((l, i) => weights[i]! * unit - l);
    lengths[behind.indexOf(Math.max(...behind))]! += 1;
  }
  return { left: lengths.slice(0, pairs), right: lengths.slice(pairs) };
}

function sweepItem(
  id: string,
  { pairs, sum, split, feedback, prompt = SWEEP_PROMPT }: Omit<SweepPoint, 'item'>,
): Item {
  const lengths = cardLengths(pairs, sum, split);
  // Every card starts at another word; a text that is already there takes the next start, so no
  // two cards of an item read the same (the renderer keys its card sizer by text).
  const used = new Set<string>();
  const unique = (len: number, start: number) => {
    let text = cardText(len, start);
    for (let k = 1; used.has(text); k++) text = cardText(len, start + k);
    used.add(text);
    return text;
  };
  const left = lengths.left.map((len, i) => ({ id: `l${i + 1}`, text: unique(len, 7 * i) }));
  const right = lengths.right.map((len, i) => ({
    id: `r${i + 1}`,
    text: unique(len, 7 * (pairs + i) + 3),
  }));
  return {
    id,
    schemaVersion: '1.0',
    fach: 'deutsch',
    bereich: 'lesen-sachtext',
    niveau: Number(id.split('-')[2]) as 2 | 3,
    format: 'match',
    status: 'draft',
    stimulus: { textRef: sachtext.id },
    prompt,
    payload: { left, right },
    solution: { pairs: left.map((l, i) => [l.id, right[i]!.id] as [string, string]) },
    feedback: sweepFeedback(feedback),
    tags: ['sweep'],
    estimatedSeconds: 70,
    meta: { author: 'claude', createdAt: '2026-10-21', calibration: 'none' },
  } as Item;
}

const FIXED = SWEEP_FEEDBACK.incorrect.length + SWEEP_FEEDBACK.misconception.length;
const POINTS: Omit<SweepPoint, 'item'>[] = [
  ...SWEEP_PAIRS.flatMap((pairs) =>
    SWEEP_SUMS.flatMap((sum) =>
      (['even', 'skew'] as const).map((split) => ({ pairs, sum, split, feedback: FIXED })),
    ),
  ),
  { ...SWEEP_FIVE_PAIRS, feedback: FIXED },
];
const FEEDBACK_POINTS: Omit<SweepPoint, 'item'>[] = SWEEP_PAIRS.flatMap((pairs) =>
  FEEDBACK_SUMS.flatMap((sum) =>
    FEEDBACK_LENGTHS.map((feedback) => ({ pairs, sum, split: 'even' as const, feedback })),
  ),
);

const build = (points: Omit<SweepPoint, 'item'>[], niveau: 2 | 3, first = 960) =>
  points.map((p, i) => ({
    ...p,
    item: z
      .array(itemSchema)
      .parse([sweepItem(itemId('lesen-sachtext', niveau, first + i), p)])[0]!,
  }));

/** The first sweep (sum of the card texts): ids d-lsa-2-960 onwards, in the order of POINTS. */
export const SWEEP_MATCH: SweepPoint[] = build(POINTS, 2);
/** The second sweep (feedback length): ids d-lsa-3-960 onwards. */
export const SWEEP_FEEDBACK_MATCH: SweepPoint[] = build(FEEDBACK_POINTS, 3);
/** The point with the short prompt: d-lsa-3-980. */
export const SWEEP_PROMPT_MATCH: SweepPoint[] = build(
  [{ pairs: 3, sum: 140, split: 'even', feedback: FIXED, prompt: SWEEP_PROMPT_SHORT }],
  3,
  980,
);
export const SWEEP_MATCH_ITEMS: Item[] = [
  ...SWEEP_MATCH,
  ...SWEEP_FEEDBACK_MATCH,
  ...SWEEP_PROMPT_MATCH,
].map((p) => p.item);
