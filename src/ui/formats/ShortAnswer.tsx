// Kurzantwort: free text (the only format with the system keyboard, PRODUCT §5.3). No auto-check:
// "Vergleichen" shows the model answer and the key points next to the child's own text, the child
// rates itself in the band (ItemScreen). The tip stays visible while writing, not as placeholder.

import { useId, useState } from 'react';
import { PRESENTATION_TEXTS as T } from '../../domain/presentation';
import { keepNumbersWithWords as nb } from '../text/numbers';
import type { FormatProps } from './types';

export function ShortAnswer({
  item,
  answer,
  onChange,
  disabled,
  showSolution,
}: FormatProps<'short-answer'>) {
  const { maxChars, hint } = item.payload;
  const [text, setText] = useState(answer?.text ?? '');
  const countId = useId();

  if (showSolution) {
    return (
      <div className="grid w-full items-start gap-sm landscape:grid-cols-2">
        <div className="grid gap-2xs">
          <p className="min-h-2xl rounded-control border-2 border-line bg-paper px-md py-xs text-option whitespace-pre-wrap">
            {text}
          </p>
          <span className="text-ink-muted">Deine Antwort</span>
        </div>
        <section className="grid gap-2xs rounded-sheet border border-line bg-surface px-md py-xs">
          <h2 className="font-bold">{T.modelHeading}</h2>
          <p>{nb(item.solution.model)}</p>
          <h2 className="font-bold">{T.keyPointsHeading}</h2>
          <ul className="list-disc pl-lg">
            {item.solution.keyPoints.map((point) => (
              <li key={point}>{nb(point)}</li>
            ))}
          </ul>
        </section>
      </div>
    );
  }

  return (
    <div className="grid w-full gap-xs">
      <div className="grid gap-2xs">
        <textarea
          aria-label="Deine Antwort"
          aria-describedby={countId}
          value={text}
          maxLength={maxChars}
          rows={3}
          disabled={disabled}
          onChange={(event) => {
            setText(event.target.value);
            onChange(event.target.value.trim() ? { text: event.target.value } : null);
          }}
          className="w-full resize-none rounded-control border-2 border-line-strong bg-surface px-md py-xs text-option"
        />
        <span id={countId} className="text-ink-muted">
          {text.length} von {maxChars} Zeichen
        </span>
      </div>
      {hint && (
        <p className="text-ink-muted">
          {T.hint} {nb(hint)}
        </p>
      )}
    </div>
  );
}
