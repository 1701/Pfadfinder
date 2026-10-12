// The checking moment (pfadfinder-ui: the one memorable element of the item screen).
// Same band as the Prüfen button: "Weiter" appears exactly where "Prüfen" was, the message
// rises next to it. Never red, never an X, never "Falsch". The message can be read aloud.

import clsx from 'clsx';
import { useEffect, useId, useRef } from 'react';
import { speakable } from '../../domain/content/read-aloud';
import type { Feedback } from '../../domain/content';
import type { Correctness } from '../../domain/evaluation';
import { keepNumbersTogether as nb } from '../text/numbers';
import { Button } from './Button';
import { VorlesenButton } from './VorlesenButton';
import { CheckGlyph, SignpostGlyph } from './glyphs';

export interface FeedbackPanelProps {
  correct: Correctness;
  feedback: Feedback;
  onNext(): void;
  /** Learner setting; the button also hides itself where the browser cannot speak. */
  readAloud?: boolean;
  /** Passed to the band, e.g. data attributes for layout tests. */
  [data: `data-${string}`]: string;
}

export function FeedbackPanel({
  correct,
  feedback,
  onNext,
  readAloud = true,
  ...rest
}: FeedbackPanelProps) {
  const right = correct === true;
  const verdict = right ? 'Richtig.' : 'Noch nicht ganz.';
  const explanation = right ? feedback.correct : feedback.incorrect;
  const misconception = right ? undefined : feedback.misconception;
  const messageId = useId();
  const next = useRef<HTMLButtonElement>(null);

  useEffect(() => next.current?.focus(), []);

  const speech = [verdict, explanation, misconception]
    .filter((part): part is string => Boolean(part))
    .map(speakable)
    .join(' ');

  return (
    <div {...rest} className="flex items-end gap-lg">
      <section
        className={clsx(
          'feedback-in flex min-w-0 flex-1 items-start gap-md rounded-sheet px-lg py-sm',
          right ? 'bg-correct-surface' : 'bg-notyet-surface',
        )}
      >
        {readAloud && <VorlesenButton text={speech} />}
        <div id={messageId} role="status" className="grid min-w-0 gap-2xs">
          <h2
            className={clsx(
              'flex items-center gap-xs text-option font-bold',
              right ? 'text-correct' : 'text-notyet',
            )}
          >
            {right ? <CheckGlyph className="size-lg" /> : <SignpostGlyph className="size-lg" />}
            {verdict}
          </h2>
          <p>{nb(explanation)}</p>
          {misconception && <p>{nb(misconception)}</p>}
        </div>
      </section>
      <Button ref={next} variant="primary" onClick={onNext} aria-describedby={messageId}>
        Weiter
      </Button>
    </div>
  );
}
