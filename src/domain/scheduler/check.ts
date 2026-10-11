// Einstiegscheck (PRODUCT.md §5.4, ARCHITECTURE.md §5): 12 items per Fach, 2–3 per Bereich,
// auto-check formats only. The niveau ladder is adaptive, so buildCheck returns a plan
// (question order + candidates) and nextCheckItem picks the item for the current rung.

import { BEREICHE_BY_FACH, type Bereich, type Fach, type Item, type Niveau } from '../content';
import { CHECK_ITEMS_PER_BEREICH, checkLadderNiveau, type CheckResult } from '../mastery';
import { seededShuffle } from './shuffle';

export const CHECK_ITEM_COUNT = 12;

export interface CheckPlan {
  fach: Fach;
  /** Bereich of each question, in order. Round-robin, so the first questions are all niveau 1. */
  slots: Bereich[];
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

/**
 * Distributes 12 slots: every Bereich gets up to 2, then single extra slots (max 3) go to
 * Bereiche in seeded order. Bereiche with too few items get fewer slots; the check may then
 * be shorter than 12.
 */
export function buildCheck(fach: Fach, pool: readonly Item[], seed = `check-${fach}`): CheckPlan {
  const bereiche: readonly Bereich[] = BEREICHE_BY_FACH[fach];
  const candidates: Partial<Record<Bereich, Item[]>> = {};
  const slotCount = new Map<Bereich, number>();

  for (const bereich of bereiche) {
    const items = pool.filter(
      (i) => i.fach === fach && i.bereich === bereich && isCheckEligible(i),
    );
    candidates[bereich] = seededShuffle(items, `${seed}/${bereich}`);
    slotCount.set(bereich, Math.min(CHECK_ITEMS_PER_BEREICH.min, items.length));
  }

  let remaining = CHECK_ITEM_COUNT - [...slotCount.values()].reduce((a, b) => a + b, 0);
  for (const bereich of seededShuffle(bereiche, seed)) {
    if (remaining <= 0) break;
    const current = slotCount.get(bereich) ?? 0;
    if (current < CHECK_ITEMS_PER_BEREICH.max && (candidates[bereich]?.length ?? 0) > current) {
      slotCount.set(bereich, current + 1);
      remaining--;
    }
  }

  const slots: Bereich[] = [];
  for (let round = 0; round < CHECK_ITEMS_PER_BEREICH.max; round++) {
    for (const bereich of bereiche) if ((slotCount.get(bereich) ?? 0) > round) slots.push(bereich);
  }
  return { fach, slots, candidates };
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
  const bereich = plan.slots[slotIndex];
  if (bereich === undefined) return null;

  const niveau = checkLadderNiveau(answers.filter((a) => a.bereich === bereich));
  const used = new Set(answers.map((a) => a.itemId));
  const available = (plan.candidates[bereich] ?? []).filter((i) => !used.has(i.id));
  const [item] = [...available].sort(
    (a, b) => Math.abs(a.niveau - niveau) - Math.abs(b.niveau - niveau) || a.niveau - b.niveau,
  );
  if (!item) return null;
  return { item, niveau, slotIndex, total: plan.slots.length };
}
