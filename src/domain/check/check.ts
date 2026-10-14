// The Einstiegscheck as pure functions (PRODUCT.md §5.4, ARCHITECTURE.md §5): an answer becomes
// an Attempt with mode "check" and gives no feedback; the finished check sets the starting
// mastery per Bereich and an Entdeckung for every Etappe below it. Nothing touches the
// Fehlerkiste: the child never saw these answers judged.

import type { Fach, Item, Niveau } from '../content';
import { evaluate, parseAnswer } from '../evaluation';
import type { Attempt, Session } from '../learner';
import { initialMasteryFromCheck, type MasteryState } from '../mastery';
import { etappeId } from '../progress';
import type { CheckAnswer } from '../scheduler';

export interface CheckAnswerInput {
  learnerId: string;
  item: Item;
  /** Must match the answer schema of the item's format. */
  answer: unknown;
  attemptId: string;
  now: string;
  durationMs: number;
}

export interface CheckAnswerResult {
  attempt: Attempt;
  /** For nextCheckItem: the ladder needs the result, the child never sees it. */
  answer: CheckAnswer;
}

export function recordCheckAnswer(input: CheckAnswerInput): CheckAnswerResult {
  const { item } = input;
  const parsed = parseAnswer(item.format, input.answer);
  if (!parsed.success) throw new Error(`Answer does not match format ${item.format}`);
  const { correct } = evaluate(item, parsed.data);

  const attempt: Attempt = {
    id: input.attemptId,
    learnerId: input.learnerId,
    itemId: item.id,
    fach: item.fach,
    bereich: item.bereich,
    niveau: item.niveau,
    format: item.format,
    correct,
    answer: parsed.data,
    durationMs: Math.max(0, Math.round(input.durationMs)),
    mode: 'check',
    at: input.now,
  };
  return {
    attempt,
    answer: {
      itemId: item.id,
      fach: item.fach,
      bereich: item.bereich,
      niveau: item.niveau,
      correct,
    },
  };
}

export interface CheckCompletionInput {
  learnerId: string;
  fach: Fach;
  sessionId: string;
  startedAt: string;
  /** All attempts of the check, in answer order. */
  attempts: readonly Attempt[];
  now: string;
}

export interface CheckCompletion {
  /** One state per checked Bereich, window empty. */
  mastery: MasteryState[];
  /** Entdeckungen for the Etappen below each starting niveau. */
  discovered: string[];
  session: Session;
}

/** Etappen below the starting niveau count as reached: niveau 3 → Etappe I and II. */
export function startDiscoveries(
  states: readonly Pick<MasteryState, 'bereich' | 'niveau'>[],
): string[] {
  const etappen: Niveau[] = [1, 2];
  return states.flatMap(({ bereich, niveau }) =>
    etappen.filter((etappe) => etappe < niveau).map((etappe) => etappeId(bereich, etappe)),
  );
}

export function completeCheck(input: CheckCompletionInput): CheckCompletion {
  const { attempts, fach, now } = input;
  if (attempts.length === 0) throw new Error('A check without answers cannot be completed');
  for (const a of attempts) {
    if (a.mode !== 'check' || a.fach !== fach || a.learnerId !== input.learnerId) {
      throw new Error(`Attempt ${a.id} does not belong to the ${fach} check`);
    }
  }
  const mastery = initialMasteryFromCheck(attempts, { learnerId: input.learnerId, at: now });
  return {
    mastery,
    discovered: startDiscoveries(mastery),
    session: {
      id: input.sessionId,
      learnerId: input.learnerId,
      mode: 'check',
      startedAt: input.startedAt,
      endedAt: now,
      attemptIds: attempts.map((a) => a.id),
      goalReached: true,
    },
  };
}
