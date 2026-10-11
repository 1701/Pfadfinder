// The checking moment (pfadfinder-ui: the one memorable element of the item screen).
// Same band as the Prüfen button: "Weiter" appears exactly where "Prüfen" was, the message
// rises next to it. Never red, never an X, never "Falsch".

import clsx from 'clsx';
import { useEffect, useId, useRef } from 'react';
import type { Feedback } from '../../domain/content';
import type { Correctness } from '../../domain/evaluation';
import { keepNumbersTogether as nb } from '../text/numbers';
import { Button } from './Button';
import { CheckGlyph, SignpostGlyph } from './glyphs';

export interface FeedbackPanelProps {
  correct: Correctness;
  feedback: Feedback;
  onNext(): void;
  /** Passed to the band, e.g. data attributes for layout tests. */
  [data: `data-${string}`]: string;
}

export function FeedbackPanel({ correct, feedback, onNext, ...rest }: FeedbackPanelProps) {
  const right = correct === true;
  const messageId = useId();
  const next = useRef<HTMLButtonElement>(null);

  useEffect(() => next.current?.focus(), []);

  return (
    <div {...rest} className="flex items-end gap-lg">
      <section
        id={messageId}
        role="status"
        className={clsx(
          'feedback-in grid min-w-0 flex-1 gap-2xs rounded-sheet px-lg py-sm',
          right ? 'bg-correct-surface' : 'bg-notyet-surface',
        )}
      >
        <h2
          className={clsx(
            'flex items-center gap-xs text-option font-bold',
            right ? 'text-correct' : 'text-notyet',
          )}
        >
          {right ? <CheckGlyph className="size-lg" /> : <SignpostGlyph className="size-lg" />}
          {right ? 'Richtig.' : 'Noch nicht ganz.'}
        </h2>
        <p>{nb(right ? feedback.correct : feedback.incorrect)}</p>
        {!right && feedback.misconception && <p>{nb(feedback.misconception)}</p>}
      </section>
      <Button ref={next} variant="primary" onClick={onNext} aria-describedby={messageId}>
        Weiter
      </Button>
    </div>
  );
}
