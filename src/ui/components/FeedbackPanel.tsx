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

/**
 * Grid places with "Zurück": landscape [message | Zurück | Weiter], portrait stacked, and stacked
 * beside a reading text in landscape too (`in-[.item-with-text]`, task 13: three buttons side by
 * side left the message a narrow column, order −123 px on the iPad).
 */
const BACK_LAYOUT = {
  plain: {
    message: 'portrait:row-span-2 in-[.item-with-text]:row-span-2',
    back: 'col-start-2 row-start-1 portrait:row-start-1',
    falle: '',
    next: 'col-start-3 row-start-1 portrait:col-start-2 portrait:row-start-2 in-[.item-with-text]:col-start-2 in-[.item-with-text]:row-start-2',
  },
  asking: {
    message: 'row-span-2 portrait:row-span-3 in-[.item-with-text]:row-span-3',
    back: 'col-start-2 row-start-2',
    falle: 'col-start-3 row-start-1 portrait:col-start-2 in-[.item-with-text]:col-start-2',
    next: 'col-start-3 row-start-2 portrait:col-start-2 portrait:row-start-3 in-[.item-with-text]:col-start-2 in-[.item-with-text]:row-start-3',
  },
} as const;

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
  /** A second button left of "Weiter", in its row (Probetest review: "Zurück"). */
  back?: { label: string; onClick(): void };
  /** "Weiter" unless set (Probetest review, last item: "Zur Auswertung"). */
  nextLabel?: string;
  /**
   * The child gave no answer (Probetest review): this heading instead of the verdict, the
   * explanation of `incorrect`, no "Falle".
   */
  missing?: string;
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
  back,
  nextLabel = 'Weiter',
  missing,
  ...rest
}: FeedbackPanelProps) {
  const right = correct === true && !missing;
  const verdict = missing ?? (showVerdict ? (right ? 'Richtig.' : 'Noch nicht ganz.') : undefined);
  const explanation = right ? feedback.correct : feedback.incorrect;
  const misconception = right || missing ? undefined : feedback.misconception;
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
  // With "Zurück" (Probetest review): side by side with Weiter in landscape; stacked in portrait,
  // where two buttons side by side would leave the message a third of the width (measured
  // 2026-10-15: answers ran 8 px under the band in Safari portrait).
  const layout = back ? BACK_LAYOUT[asking ? 'asking' : 'plain'] : undefined;

  // Weiter stays a direct child of the band, in the same place as Prüfen; "Falle" sits above it.
  return (
    <div
      {...rest}
      className={clsx(
        'grid items-end gap-x-lg gap-y-xs',
        back
          ? 'grid-cols-[minmax(0,1fr)_auto_auto] portrait:grid-cols-[minmax(0,1fr)_auto] in-[.item-with-text]:grid-cols-[minmax(0,1fr)_auto]'
          : 'grid-cols-[minmax(0,1fr)_auto]',
      )}
    >
      <section
        className={clsx(
          'feedback-in flex items-start gap-md rounded-sheet px-lg py-sm',
          layout ? layout.message : asking && 'row-span-2',
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
      {back && (
        <Button size="large" className={layout?.back} onClick={back.onClick}>
          {back.label}
        </Button>
      )}
      {asking && (
        <Button
          className={layout ? layout.falle : 'col-start-2'}
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
        className={layout ? layout.next : 'col-start-2'}
        onClick={onNext}
        aria-describedby={messageId}
      >
        {nextLabel}
      </Button>
    </div>
  );
}
