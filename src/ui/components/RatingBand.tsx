// short-answer after "Vergleichen": the child compares its text with the model answer and rates
// itself. Three equal, quiet buttons (none yellow, so none suggests itself); the choice is the
// answer. Same band as Prüfen/Weiter: the buttons are direct children, the last one on the right.

import { useEffect, useRef } from 'react';
import type { SelfRating } from '../../domain/evaluation';
import { PRESENTATION_TEXTS as T, SELF_RATINGS } from '../../domain/presentation';
import { focusQuietly } from '../focus';
import { Button } from './Button';
import { VorlesenButton } from './VorlesenButton';

export interface RatingBandProps {
  onRate(rating: SelfRating): void;
  /** Question, model answer and key points (comparisonSpeech). */
  speech: string;
  readAloud?: boolean;
  [data: `data-${string}`]: string;
}

export function RatingBand({ onRate, speech, readAloud = true, ...rest }: RatingBandProps) {
  const question = useRef<HTMLDivElement>(null);
  // "Vergleichen" is gone; the focus waits on the question instead of falling to the page.
  useEffect(() => focusQuietly(question.current), []);

  return (
    <div
      {...rest}
      className="grid grid-cols-3 items-center gap-x-sm gap-y-xs landscape:grid-cols-[minmax(0,1fr)_auto_auto_auto]"
    >
      <div
        ref={question}
        tabIndex={-1}
        className="col-span-3 flex items-center gap-md landscape:col-span-1"
      >
        {readAloud && <VorlesenButton text={speech} />}
        <h2 className="text-option font-bold">{T.compareQuestion}</h2>
      </div>
      {SELF_RATINGS.map(({ rating, label }) => (
        <Button key={label} size="large" onClick={() => onRate(rating)}>
          {label}
        </Button>
      ))}
    </div>
  );
}
