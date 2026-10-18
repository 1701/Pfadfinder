// The overview of the running Probetest: one tappable Wegstrich per item (filled = answered,
// empty = open, ring = the item the child came from). "Weitermachen" goes back to that item,
// "Abgeben" is only here. Yellow marks the one next step: "Weitermachen" while items are open,
// "Abgeben" once every item is answered (decision 2026-10-15).

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
import { Strich, StrichRaster } from './ProbetestStrich';

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
          <StrichRaster
            arts={props.answered.map((done) => (done ? 'filled' : 'empty'))}
            labels={props.answered.map((done, i) => `Aufgabe ${i + 1}, ${done ? ANSWERED : OPEN}`)}
            current={props.current}
            onJump={props.onJump}
          />
          <p className="flex items-center gap-lg text-ink-muted">
            <span className="flex items-center gap-xs">
              <Strich art="filled" wide />
              {ANSWERED}
            </span>
            <span className="flex items-center gap-xs">
              <Strich art="empty" wide />
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
