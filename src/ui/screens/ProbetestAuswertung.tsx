// The result of a submitted Probetest (PRODUCT.md §5.4): per Bereich "solved of total" as
// Wegstriche and number, then the sum. Numbers are allowed here, unlike in the Einstieg; no
// percent, no grade, no comparison. A short answer waiting for the child's own rating is a
// dashed Wegstrich, the map's sign for "not explored yet" (decision 2026-10-15).

import clsx from 'clsx';
import { useEffect, useRef } from 'react';
import { Link } from 'react-router';
import type { Bereich } from '../../domain/content';
import type { ProbetestResult } from '../../domain/learner';
import { Button } from '../components/Button';
import { QUIET_ACTION_CLASS } from '../components/quiet';
import { VorlesenButton } from '../components/VorlesenButton';
import { focusQuietly } from '../focus';
import { BEREICH_NAME } from '../text/bereiche';
import {
  RESULT_DONE,
  RESULT_TEXT,
  RESULT_TIME_UP,
  REVIEW,
  TO_MAP,
  TOTAL,
  pendingLine,
  solvedOf,
} from '../text/probetest';
import { ProbetestKopf } from './ProbetestKopf';

/** Solved first (filled), then the waiting short answers (dashed), then the rest (empty). */
export function ErgebnisStriche(props: { solved: number; pending: number; total: number }) {
  return (
    <ol className="flex flex-wrap items-center gap-xs" aria-hidden="true">
      {Array.from({ length: props.total }, (_, i) => {
        const kind =
          i < props.solved ? 'solved' : i < props.solved + props.pending ? 'pending' : 'open';
        if (kind === 'pending') {
          // CSS dashes break apart at this size; a drawn outline keeps an even dash.
          return (
            <li key={i} data-strich={kind} className="block h-xs w-md">
              <svg viewBox="0 0 16 8" className="size-full overflow-visible">
                <rect
                  x="1"
                  y="1"
                  width="14"
                  height="6"
                  rx="3"
                  className="fill-none stroke-ink"
                  strokeWidth="2"
                  strokeDasharray="3 2"
                />
              </svg>
            </li>
          );
        }
        return (
          <li
            key={i}
            data-strich={kind}
            className={clsx(
              'block h-xs w-md rounded-round border-2',
              kind === 'solved' ? 'border-ink bg-ink' : 'border-line-strong bg-surface',
            )}
          />
        );
      })}
    </ol>
  );
}

export interface ProbetestAuswertungProps {
  result: ProbetestResult;
  /** Bereiche in test order. */
  bereiche: readonly Bereich[];
  timeUp: boolean;
  readAloud: boolean;
  onReview(): void;
}

export function ProbetestAuswertung(props: ProbetestAuswertungProps) {
  const { result } = props;
  const title = props.timeUp ? RESULT_TIME_UP : RESULT_DONE;
  const rows = props.bereiche.flatMap((bereich) => {
    const score = result.byBereich[bereich];
    return score ? [{ bereich, ...score }] : [];
  });
  const pending = result.total.pending;
  const speech = [
    title,
    RESULT_TEXT,
    ...rows.map((r) => `${BEREICH_NAME[r.bereich]}: ${solvedOf(r.solved, r.total)}.`),
    `${TOTAL}: ${solvedOf(result.total.solved, result.total.total)}.`,
    pending > 0 ? pendingLine(pending) : '',
  ]
    .filter(Boolean)
    .join(' ');
  const review = useRef<HTMLButtonElement>(null);
  useEffect(() => focusQuietly(review.current), []);

  return (
    <main className="screen-fit mx-auto grid max-w-page grid-rows-[auto_auto_1fr_auto] gap-sm px-lg py-sm">
      <ProbetestKopf
        left={
          <Link to="/" className={QUIET_ACTION_CLASS}>
            {TO_MAP}
          </Link>
        }
      />
      <section className="flex items-start gap-lg rounded-sheet border border-line bg-surface px-lg py-sm">
        {props.readAloud && <VorlesenButton key={speech} text={speech} />}
        <div className="grid gap-xs pt-xs">
          <h1 className="text-prompt font-bold">{title}</h1>
          <p className="text-option">{RESULT_TEXT}</p>
        </div>
      </section>
      <div data-region="answer" className="flex min-h-0 items-start justify-center pt-xs">
        <div className="grid gap-md">
          <dl className="grid grid-cols-[auto_auto_auto] items-center gap-x-lg gap-y-sm text-option">
            {rows.map((r) => (
              <div key={r.bereich} data-bereich={r.bereich} className="contents">
                <dt>{BEREICH_NAME[r.bereich]}</dt>
                <dd>
                  <ErgebnisStriche {...r} />
                </dd>
                <dd className="tabular-nums">{solvedOf(r.solved, r.total)}</dd>
              </div>
            ))}
            <div data-bereich="zusammen" className="contents font-bold">
              <dt className="border-t border-line pt-sm">{TOTAL}</dt>
              <dd aria-hidden="true" />
              <dd className="border-t border-line pt-sm tabular-nums">
                {solvedOf(result.total.solved, result.total.total)}
              </dd>
            </div>
          </dl>
          {pending > 0 && <p className="text-center text-ink-muted">{pendingLine(pending)}</p>}
        </div>
      </div>
      <div data-region="band" className="flex items-end justify-between gap-md">
        <span />
        <Button ref={review} variant="primary" onClick={props.onReview}>
          {REVIEW}
        </Button>
      </div>
    </main>
  );
}
