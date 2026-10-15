// One item while the Probetest runs: no checking, no band, no "Falle". "Zurück" and "Weiter"
// always work, with or without an answer, like turning pages on paper. A short answer is only
// typed in; comparing comes when looking through the submitted test.

import type { Item } from '../../domain/content';
import { Button } from '../components/Button';
import { QUIET_ACTION_CLASS } from '../components/quiet';
import { BACK, NEXT, OVERVIEW } from '../text/probetest';
import { ItemScreen } from './ItemScreen';
import { ProbetestKopf, Zeit, type ProbetestZeit } from './ProbetestKopf';

export interface ProbetestAufgabeProps {
  item: Item;
  attemptIndex: number;
  answer: unknown;
  onAnswer(answer: unknown): void;
  /** 1-based. */
  current: number;
  total: number;
  time: ProbetestZeit;
  readAloud: boolean;
  onBack(): void;
  onNext(): void;
  onOverview(): void;
}

const noop = () => undefined;

export function ProbetestAufgabe(props: ProbetestAufgabeProps) {
  return (
    <ItemScreen
      item={props.item}
      attemptIndex={props.attemptIndex}
      answer={props.answer}
      onAnswer={props.onAnswer}
      phase="answering"
      correct={null}
      readAloud={props.readAloud}
      onSubmit={noop}
      onNext={noop}
      header={
        <ProbetestKopf
          left={
            <button type="button" className={QUIET_ACTION_CLASS} onClick={props.onOverview}>
              {OVERVIEW}
            </button>
          }
          current={props.current}
          total={props.total}
          right={<Zeit {...props.time} />}
        />
      }
      actions={
        <>
          <Button size="large" disabled={props.current === 1} onClick={props.onBack}>
            {BACK}
          </Button>
          <Button variant="primary" onClick={props.onNext}>
            {NEXT}
          </Button>
        </>
      }
    />
  );
}
