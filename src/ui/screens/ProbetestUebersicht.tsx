// The overview of the running Probetest: one tappable Wegstrich per item (filled = answered,
// empty = open, ring = the item the child came from). "Weitermachen" goes back to that item,
// "Abgeben" is only here. Yellow marks the one next step: "Weitermachen" while items are open,
// "Abgeben" once every item is answered (decision 2026-10-15).

import clsx from 'clsx';
import { useEffect, useRef } from 'react';
import { Button } from '../components/Button';
import { QUIET_ACTION_CLASS } from '../components/quiet';
import { VorlesenButton } from '../components/VorlesenButton';
import { focusQuietly } from '../focus';
import {
  ANSWERED,
  CONTINUE,
  OPEN,
  OVERVIEW,
  OVERVIEW_TEXT,
  SUBMIT,
  TO_MAP,
} from '../text/probetest';
import { ProbetestKopf, Zeit, type ProbetestZeit } from './ProbetestKopf';

export interface ProbetestUebersichtProps {
  /** Per item in test order. */
  answered: readonly boolean[];
  /** 0-based item with the ring. */
  current: number;
  time: ProbetestZeit;
  readAloud: boolean;
  onJump(index: number): void;
  onContinue(): void;
  onSubmit(): void;
  onLeave(): void;
}

function Strich({ on }: { on: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={clsx(
        'block h-xs w-lg rounded-round border-2',
        on ? 'border-ink bg-ink' : 'border-line-strong bg-surface',
      )}
    />
  );
}

export function ProbetestUebersicht(props: ProbetestUebersichtProps) {
  const allAnswered = props.answered.every(Boolean);
  const primary = useRef<HTMLButtonElement>(null);
  useEffect(() => focusQuietly(primary.current), []);

  return (
    <main className="screen-fit mx-auto grid max-w-page grid-rows-[auto_auto_1fr_auto] gap-sm px-lg py-sm">
      <ProbetestKopf
        left={
          <button type="button" className={QUIET_ACTION_CLASS} onClick={props.onLeave}>
            {TO_MAP}
          </button>
        }
        right={<Zeit {...props.time} />}
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
          <ol className="grid grid-cols-12 gap-xs">
            {props.answered.map((done, i) => (
              <li key={i}>
                <button
                  type="button"
                  aria-label={`Aufgabe ${i + 1}, ${done ? ANSWERED : OPEN}`}
                  aria-current={i === props.current ? 'step' : undefined}
                  onClick={() => props.onJump(i)}
                  className={clsx(
                    'grid min-h-primary min-w-touch place-items-center gap-2xs rounded-control px-2xs py-xs',
                    i === props.current && 'outline-2 outline-offset-2 outline-ink',
                  )}
                >
                  <span aria-hidden="true">{i + 1}</span>
                  <Strich on={done} />
                </button>
              </li>
            ))}
          </ol>
          <p className="flex items-center gap-lg text-ink-muted">
            <span className="flex items-center gap-xs">
              <Strich on />
              {ANSWERED}
            </span>
            <span className="flex items-center gap-xs">
              <Strich on={false} />
              {OPEN}
            </span>
          </p>
        </div>
      </div>
      <div data-region="band" className="flex items-end justify-between gap-md">
        <Button
          ref={allAnswered ? undefined : primary}
          variant={allAnswered ? 'secondary' : 'primary'}
          size="large"
          onClick={props.onContinue}
        >
          {CONTINUE}
        </Button>
        <Button
          ref={allAnswered ? primary : undefined}
          variant={allAnswered ? 'primary' : 'secondary'}
          size="large"
          onClick={props.onSubmit}
        >
          {SUBMIT}
        </Button>
      </div>
    </main>
  );
}
