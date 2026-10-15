// Looking through a submitted Probetest, item by item: the child's own answer, the solution and
// the normal band with "Falle" (PRODUCT.md §5.4). "Zurück" sits left of "Weiter" as in the test;
// after the last item "Weiter" says "Zur Auswertung". An entered short answer is compared here
// and rated by the child; the rating is stored and changes the result. An item without an
// answer gets the heading "Hier fehlt deine Antwort." and the explanation, without "Falle".

import type { Item } from '../../domain/content';
import type { Correctness, SelfRating } from '../../domain/evaluation';
import type { ItemOutcome } from '../../domain/probetest';
import { Button } from '../components/Button';
import { QUIET_ACTION_CLASS } from '../components/quiet';
import { BACK, MISSING, NEXT, TO_RESULT } from '../text/probetest';
import { ItemScreen } from './ItemScreen';
import { ProbetestKopf } from './ProbetestKopf';

export interface ProbetestDurchsehenProps {
  item: Item;
  attemptIndex: number;
  /** The child's draft; null for an open item. */
  answer: unknown;
  outcome: ItemOutcome;
  /** The self-rating of a short answer, once given. */
  rating?: SelfRating;
  /** 1-based. */
  current: number;
  total: number;
  readAloud: boolean;
  onBack(): void;
  onNext(): void;
  onResult(): void;
  onRate(rating: SelfRating): void;
  /** Dev preview only: open a waiting short answer directly in the comparing step. */
  previewComparing?: boolean;
}

function correctness(outcome: ItemOutcome, rating: SelfRating | undefined): Correctness {
  if (rating !== undefined) return rating === 0.5 ? 0.5 : rating === 1;
  return outcome === 'solved';
}

export function ProbetestDurchsehen(props: ProbetestDurchsehenProps) {
  const { outcome } = props;
  const first = props.current === 1;
  const waiting = outcome === 'pending';
  const back = first ? undefined : { label: BACK, onClick: props.onBack };
  return (
    <ItemScreen
      item={props.item}
      attemptIndex={props.attemptIndex}
      answer={outcome === 'open' ? null : props.answer}
      onAnswer={() => undefined}
      phase={waiting ? 'answering' : 'feedback'}
      correct={waiting ? null : correctness(outcome, props.rating)}
      readAloud={props.readAloud}
      onSubmit={(given) => {
        const rating = (given as { rating?: SelfRating } | undefined)?.rating;
        if (rating !== undefined) props.onRate(rating);
      }}
      onNext={props.onNext}
      header={
        <ProbetestKopf
          left={
            <button type="button" className={QUIET_ACTION_CLASS} onClick={props.onResult}>
              {TO_RESULT}
            </button>
          }
          current={props.current}
          total={props.total}
        />
      }
      locked
      bandStart={
        waiting ? (
          <Button size="large" disabled={first} onClick={props.onBack}>
            {BACK}
          </Button>
        ) : undefined
      }
      feedbackBack={back}
      nextLabel={props.current === props.total ? TO_RESULT : NEXT}
      feedbackMissing={outcome === 'open' ? MISSING : undefined}
      previewComparing={props.previewComparing}
    />
  );
}
