// The checking moment (pfadfinder-ui: the one memorable element of the item screen).
// Same band as the Prüfen button: "Weiter" appears exactly where "Prüfen" was, the message
// rises next to it. Never red, never an X, never "Falsch". The message can be read aloud.
// The misconception waits behind "Falle" (above Weiter, where the band has room anyway), so
// the band stays low; once the child opens it, the band may grow over the answer.

import clsx from 'clsx';
import { useEffect, useId, useRef, useState } from 'react';
import { speakable } from '../../domain/content/read-aloud';
import type { Feedback } from '../../domain/content';
import type { Correctness } from '../../domain/evaluation';
import { focusQuietly } from '../focus';
import { FALLE_LABEL, FALLE_TEXT } from '../text/feedback';
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
  /**
   * false for a self-rated short answer: the app judges nothing, so no "Richtig." or "Noch nicht
   * ganz." – only the explanation that fits the child's own rating.
   */
  verdict?: boolean;
  /** A line under the verdict in both outcomes, e.g. "So schreibt man es: Samstag" (find-error). */
  note?: { label: string; text: string };
  /** Passed to the band, e.g. data attributes for layout tests. */
  [data: `data-${string}`]: string;
}

export function FeedbackPanel({
  correct,
  feedback,
  onNext,
  readAloud = true,
  verdict: showVerdict = true,
  note,
  ...rest
}: FeedbackPanelProps) {
  const right = correct === true;
  const verdict = showVerdict ? (right ? 'Richtig.' : 'Noch nicht ganz.') : undefined;
  const explanation = right ? feedback.correct : feedback.incorrect;
  const misconception = right ? undefined : feedback.misconception;
  const messageId = useId();
  const next = useRef<HTMLButtonElement>(null);
  const [why, setWhy] = useState(false);

  useEffect(() => focusQuietly(next.current), []);

  const noteText = note && `${note.label} ${note.text}.`;
  const speech = [verdict, noteText, explanation, misconception]
    .filter((part): part is string => Boolean(part))
    .map(speakable)
    .join(' ');

  const asking = Boolean(misconception) && !why;

  // Weiter stays a direct child of the band, in the same place as Prüfen; "Falle" sits above it.
  return (
    <div {...rest} className="grid grid-cols-[minmax(0,1fr)_auto] items-end gap-x-lg gap-y-xs">
      <section
        className={clsx(
          'feedback-in flex items-start gap-md rounded-sheet px-lg py-sm',
          asking && 'row-span-2',
          right ? 'bg-correct-surface' : 'bg-notyet-surface',
        )}
      >
        {readAloud && <VorlesenButton text={speech} />}
        <div id={messageId} role="status" className="grid min-w-0 gap-2xs">
          {verdict && (
            <h2
              className={clsx(
                'flex items-center gap-xs text-option font-bold',
                right ? 'text-correct' : 'text-notyet',
              )}
            >
              {right ? <CheckGlyph className="size-lg" /> : <SignpostGlyph className="size-lg" />}
              {verdict}
            </h2>
          )}
          {note && (
            <p className="text-option">
              {note.label} <b>{note.text}</b>
            </p>
          )}
          <p>{nb(explanation)}</p>
          {misconception && why && <p className="text-ink-muted">{nb(misconception)}</p>}
        </div>
      </section>
      {asking && (
        <Button
          className="col-start-2"
          aria-label={FALLE_LABEL}
          onClick={() => {
            setWhy(true);
            // The button goes away; focus must not fall back to the page.
            focusQuietly(next.current);
          }}
        >
          {FALLE_TEXT}
        </Button>
      )}
      <Button
        ref={next}
        variant="primary"
        className="col-start-2"
        onClick={onNext}
        aria-describedby={messageId}
      >
        Weiter
      </Button>
    </div>
  );
}
