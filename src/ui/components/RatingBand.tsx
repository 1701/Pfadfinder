// short-answer after "Vergleichen": the child compares its text with the model answer and rates
// itself. Three equal, quiet buttons (none yellow, so none suggests itself); the choice is the
// answer. Same band as Prüfen/Weiter: the buttons are direct children, the last one on the right.
// The band's width decides the layout, not the orientation (beside a reading text the band is
// narrow in landscape too; iPad finding 2026-10-19: the question ran into the buttons). A frame
// around the band is the size container (a grid cannot query its own width):
//  - from --container-rating-row: Vorlesen, question and the three buttons in one row
//  - from --container-rating-beside: Vorlesen on the left, the question above the buttons
//  - narrower: Vorlesen and question above, the buttons over the full width below

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
  const question = useRef<HTMLHeadingElement>(null);
  // "Vergleichen" is gone; the focus waits on the question instead of falling to the page.
  useEffect(() => focusQuietly(question.current), []);

  return (
    <div className="rating-frame @container">
      <div
        {...rest}
        className="grid grid-cols-3 items-center gap-x-sm gap-y-xs @rating-beside:grid-cols-[auto_repeat(3,minmax(0,1fr))] @rating-row:grid-cols-[auto_minmax(0,1fr)_auto_auto_auto]"
      >
        <div className="col-span-3 flex items-center gap-md @rating-beside:contents">
          {/* Stays when empty: it holds Vorlesen's column, so the grid is the same either way. */}
          <div className="@rating-beside:row-span-2 @rating-row:row-span-1">
            {readAloud && <VorlesenButton text={speech} />}
          </div>
          <h2
            ref={question}
            tabIndex={-1}
            className="text-option font-bold @rating-beside:col-span-3 @rating-row:col-span-1"
          >
            {T.compareQuestion}
          </h2>
        </div>
        {SELF_RATINGS.map(({ rating, label }) => (
          <Button
            key={label}
            size="fill"
            className="@rating-row:min-w-action"
            onClick={() => onRate(rating)}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}
