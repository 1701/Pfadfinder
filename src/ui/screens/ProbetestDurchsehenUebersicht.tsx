// The overview while looking through a submitted Probetest (task 11): every item's Wegstrich, a
// tap jumps there and looks through all items again from it. Filled = solved, dashed = a short
// answer that waits for the child's own rating, empty = everything else, without a name in the
// legend (decision 2026-10-18): the result already says how many were solved, never "falsch".
// "Weiter durchsehen" goes back to the item the child came from.

import { useEffect, useRef } from 'react';
import type { ItemOutcome } from '../../domain/probetest';
import { Button } from '../components/Button';
import { QUIET_ACTION_CLASS } from '../components/quiet';
import { VorlesenButton } from '../components/VorlesenButton';
import { focusQuietly } from '../focus';
import {
  OVERVIEW,
  OVERVIEW_TEXT,
  PENDING_LEGEND,
  REVIEW_ON,
  SOLVED,
  TO_RESULT,
} from '../text/probetest';
import { ProbetestKopf } from './ProbetestKopf';
import { Strich, StrichRaster, type StrichArt } from './ProbetestStrich';

export interface ProbetestDurchsehenUebersichtProps {
  /** Per item in test order. */
  outcomes: readonly ItemOutcome[];
  /** 0-based item with the ring: the one the child came from. */
  current: number;
  readAloud: boolean;
  onJump(index: number): void;
  onContinue(): void;
  onResult(): void;
}

const ART: Record<ItemOutcome, StrichArt> = {
  solved: 'filled',
  pending: 'dashed',
  notSolved: 'empty',
  open: 'empty',
};

function label(outcome: ItemOutcome, i: number): string {
  if (outcome === 'solved') return `Aufgabe ${i + 1}, ${SOLVED}`;
  if (outcome === 'pending') return `Aufgabe ${i + 1}, noch nicht verglichen`;
  return `Aufgabe ${i + 1}`;
}

export function ProbetestDurchsehenUebersicht(props: ProbetestDurchsehenUebersichtProps) {
  const primary = useRef<HTMLButtonElement>(null);
  useEffect(() => focusQuietly(primary.current), []);
  const pending = props.outcomes.includes('pending');

  return (
    <main className="screen-fit mx-auto grid max-w-page grid-rows-[auto_auto_1fr_auto] gap-sm px-lg py-sm">
      <ProbetestKopf
        left={
          <button type="button" className={QUIET_ACTION_CLASS} onClick={props.onResult}>
            {TO_RESULT}
          </button>
        }
      />
      <section className="flex items-start gap-lg rounded-sheet border border-line bg-surface px-lg py-sm">
        {props.readAloud && <VorlesenButton text={`${OVERVIEW}. ${OVERVIEW_TEXT}`} />}
        <div className="grid gap-xs pt-xs">
          <h1 className="text-prompt font-bold">{OVERVIEW}</h1>
          <p className="text-option">{OVERVIEW_TEXT}</p>
        </div>
      </section>
      <div data-region="answer" className="flex min-h-0 items-start justify-center pt-xs">
        <div className="grid gap-md">
          <StrichRaster
            arts={props.outcomes.map((o) => ART[o])}
            labels={props.outcomes.map(label)}
            current={props.current}
            onJump={props.onJump}
          />
          <p className="flex items-center gap-lg text-ink-muted">
            <span className="flex items-center gap-xs">
              <Strich art="filled" wide />
              {SOLVED}
            </span>
            {pending && (
              <span className="flex items-center gap-xs">
                <Strich art="dashed" wide />
                {PENDING_LEGEND}
              </span>
            )}
          </p>
        </div>
      </div>
      <div data-region="band" className="flex items-end justify-between gap-md">
        <span />
        <Button ref={primary} variant="primary" size="large" onClick={props.onContinue}>
          {REVIEW_ON}
        </Button>
      </div>
    </main>
  );
}
