// Einstiegscheck (PRODUCT.md §5.4, ARCHITECTURE.md §5): 2–3 items per practiceable Bereich,
// at most 12, auto-check formats only. The niveau ladder is adaptive, so buildCheck returns a
// plan (Bereiche in round order + candidates) and nextCheckItem picks the item for the current
// rung. Rounds 1 and 2 serve every Bereich; round 3 gives the remaining places to Bereiche whose
// first two answers differ, then to the ones answered the same way twice (decision 2026-10-14).
// A Lesen-Bereich takes all its items from one reading text and asks them as one block, so the
// items of the text follow each other (2026-10-16). The blocks come after the rounds (task 10):
// the check starts with short items, the long reading comes last; the cut to 12 never hits a
// block.

import { isLesenBereich, type Bereich, type Fach, type Item, type Niveau } from '../content';
import { CHECK_ITEMS_PER_BEREICH, checkLadderNiveau, type CheckResult } from '../mastery';
import { seededShuffle } from './shuffle';

export const CHECK_ITEM_COUNT = 12;

export interface CheckPlan {
  fach: Fach;
  /** Bereiche in the given order; the others in rounds, then the Lesen-Bereiche as blocks. */
  bereiche: Bereich[];
  /** Number of questions; fixed before the first answer, so the progress never jumps. */
  total: number;
  /** Shuffled auto-check items per Bereich. */
  candidates: Partial<Record<Bereich, Item[]>>;
}

export interface CheckAnswer extends CheckResult {
  itemId: string;
}

export interface NextCheckItem {
  item: Item;
  /** Ladder rung the item was chosen for; the item may deviate if none exists on it. */
  niveau: Niveau;
  slotIndex: number;
  total: number;
}

export function isCheckEligible(item: Item): boolean {
  return item.status !== 'retired' && item.format !== 'short-answer';
}

export interface BuildCheckOptions {
  /** The Bereiche to check, in round order: the practiceable ones of the Fach. */
  bereiche: readonly Bereich[];
  /** Shuffles the candidates; a new check may serve other items. */
  seed: string;
}

/** Places a Bereich can fill: up to 3, fewer when it has fewer eligible items. */
function capacity(plan: Pick<CheckPlan, 'candidates'>, bereich: Bereich): number {
  return Math.min(CHECK_ITEMS_PER_BEREICH.max, plan.candidates[bereich]?.length ?? 0);
}

/** Bereich of every question of the blocks: each Lesen-Bereich with all its places in a row. */
function blockSlots(plan: Pick<CheckPlan, 'bereiche' | 'candidates'>): Bereich[] {
  return plan.bereiche
    .filter(isLesenBereich)
    .flatMap((b) => Array<Bereich>(capacity(plan, b)).fill(b));
}

/** The Bereiche asked in rounds: all but the Lesen-Bereiche. */
function roundBereiche(plan: Pick<CheckPlan, 'bereiche'>): Bereich[] {
  return plan.bereiche.filter((b) => !isLesenBereich(b));
}

/** Bereich of every question in rounds 1 and 2, in order. */
function firstRounds(plan: Pick<CheckPlan, 'bereiche' | 'candidates'>): Bereich[] {
  const rounds = Array.from({ length: CHECK_ITEMS_PER_BEREICH.min }, (_, round) =>
    roundBereiche(plan).filter((b) => capacity(plan, b) > round),
  );
  return rounds.flat();
}

export function buildCheck(
  fach: Fach,
  pool: readonly Item[],
  options: BuildCheckOptions,
): CheckPlan {
  const candidates: Partial<Record<Bereich, Item[]>> = {};
  for (const bereich of options.bereiche) {
    const items = pool.filter(
      (i) => i.fach === fach && i.bereich === bereich && isCheckEligible(i),
    );
    const seed = `${options.seed}/${bereich}`;
    candidates[bereich] = seededShuffle(oneText(items, seed), seed);
  }
  const plan = { fach, bereiche: [...options.bereiche], candidates };
  const block = blockSlots(plan).length;
  const first = firstRounds(plan).length;
  const third = roundBereiche(plan).filter((b) => capacity(plan, b) > CHECK_ITEMS_PER_BEREICH.min);
  return { ...plan, total: Math.min(CHECK_ITEM_COUNT, block + first + third.length) };
}

/**
 * A Lesen-Bereich is checked with 2–3 items of one reading text (PROGRESS 3C): the seed picks a
 * text with at least 2 eligible items, and only its items are candidates. Items without a
 * textRef only count when no text qualifies; Bereiche without texts are left as they are.
 */
function oneText(items: readonly Item[], seed: string): Item[] {
  const byText = new Map<string, Item[]>();
  for (const item of items) {
    const textRef = item.stimulus?.textRef;
    if (textRef !== undefined) byText.set(textRef, [...(byText.get(textRef) ?? []), item]);
  }
  if (byText.size === 0) return [...items];
  const usable = [...byText.keys()]
    .filter((id) => (byText.get(id)?.length ?? 0) >= CHECK_ITEMS_PER_BEREICH.min)
    .sort();
  const [textRef] = seededShuffle(usable, `${seed}/text`);
  if (textRef === undefined) return items.filter((i) => i.stimulus?.textRef === undefined);
  return byText.get(textRef) ?? [];
}

/**
 * Round 3: Bereiche with a third item, decided after rounds 1 and 2. A Bereich whose two
 * answers differ comes first; the cut lands on those answered the same way twice.
 */
function thirdRound(plan: CheckPlan, firstAnswers: readonly CheckAnswer[], places: number) {
  const passed = (bereich: Bereich) =>
    firstAnswers.filter((a) => a.bereich === bereich).map((a) => a.correct === true);
  const open = roundBereiche(plan).filter((b) => capacity(plan, b) > CHECK_ITEMS_PER_BEREICH.min);
  const mixed = open.filter((b) => new Set(passed(b)).size > 1);
  const same = open.filter((b) => !mixed.includes(b));
  return [...mixed, ...same].slice(0, places);
}

function slotBereich(
  plan: CheckPlan,
  answers: readonly CheckAnswer[],
  slotIndex: number,
): Bereich | undefined {
  if (slotIndex >= plan.total) return undefined;
  const first = firstRounds(plan);
  if (slotIndex < first.length) return first[slotIndex];
  const block = blockSlots(plan);
  const thirdPlaces = Math.max(0, plan.total - first.length - block.length);
  const later = slotIndex - first.length;
  if (later < thirdPlaces)
    return thirdRound(plan, answers.slice(0, first.length), thirdPlaces)[later];
  return block[later - thirdPlaces];
}

/**
 * Next question for the answers given so far (in order). Picks an unused item on the ladder
 * rung of that Bereich; if none is left there, the nearest niveau, the easier one on a tie.
 * Returns null when the check is complete.
 */
export function nextCheckItem(
  plan: CheckPlan,
  answers: readonly CheckAnswer[],
): NextCheckItem | null {
  const slotIndex = answers.length;
  const bereich = slotBereich(plan, answers, slotIndex);
  if (bereich === undefined) return null;

  const niveau = checkLadderNiveau(answers.filter((a) => a.bereich === bereich));
  const used = new Set(answers.map((a) => a.itemId));
  const available = (plan.candidates[bereich] ?? []).filter((i) => !used.has(i.id));
  const [item] = [...available].sort(
    (a, b) => Math.abs(a.niveau - niveau) - Math.abs(b.niveau - niveau) || a.niveau - b.niveau,
  );
  if (!item) return null;
  return { item, niveau, slotIndex, total: plan.total };
}
