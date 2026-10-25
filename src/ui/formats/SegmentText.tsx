// Satz in Satzglieder teilen (CONTENT_SCHEMA §4.10): the words come from splitUnits() like
// mark-in-text, between every two words a gap the child taps to set or lift a divider. Nothing is
// mixed: the order of the words is the task. A word and the gap after it never break apart, so a
// gap at the end of a line stays tappable. After checking the child's dividers stay (right ones
// calm blue, others stone), below them "Richtig ist:" with the sentence and the solution's dividers.

import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { splitUnits } from '../../domain/content/units';
import { PRESENTATION_TEXTS as T } from '../../domain/presentation';
import { keepNumbersTogether } from '../text/numbers';
import { toggleKey } from './UnitPicker';
import type { FormatProps } from './types';

type GapState = 'empty' | 'set' | 'right' | 'other';

const BAR: Record<GapState, string> = {
  empty: 'h-md bg-line-strong',
  set: 'h-xl bg-signal-edge',
  right: 'h-xl bg-correct',
  other: 'h-xl bg-notyet',
};

/** Screen readers hear what a divider means after checking. */
const GAP_WORDS: Partial<Record<GapState, string>> = {
  right: ' (richtig)',
  other: ' (deine Wahl)',
};

/** The sentence with " | " at the given gaps: "Am Nachmittag | spielt | …". */
export function dividedSentence(words: string[], boundaries: number[]): string {
  return words.map((w, k) => (boundaries.includes(k) ? `${w} |` : w)).join(' ');
}

export function SegmentText({
  item,
  answer,
  onChange,
  disabled,
  revealed,
}: FormatProps<'segment-text'>) {
  const { text } = item.payload;
  const words = useMemo(() => splitUnits(text, 'word').map(keepNumbersTogether), [text]);
  const [chosen, setChosen] = useState<number[]>(() => answer?.boundaries ?? []);
  const gaps = words.slice(0, -1).map((_, k) => k);
  const solution = revealed?.solution.boundaries;

  const stateOf = (k: number): GapState => {
    if (!chosen.includes(k)) return 'empty';
    if (!solution) return 'set';
    return solution.includes(k) ? 'right' : 'other';
  };

  return (
    <div className="grid w-full gap-sm">
      <div
        role="group"
        aria-label="Satz mit Lücken zum Antippen"
        className="flex w-full flex-wrap items-center gap-y-xs"
      >
        {words.map((word, k) => (
          <span key={k} className="flex items-center">
            <span className="flex min-h-touch items-center rounded-control border-2 border-line bg-surface px-sm text-option">
              {word}
            </span>
            {k < words.length - 1 && (
              <Gap
                state={stateOf(k)}
                label={`Trennstrich zwischen „${word}“ und „${words[k + 1] ?? ''}“`}
                interactive={!disabled}
                onToggle={() => {
                  const next = toggleKey(chosen, k, gaps);
                  setChosen(next);
                  onChange(next.length > 0 ? { boundaries: next } : null);
                }}
              />
            )}
          </span>
        ))}
      </div>
      {solution && revealed?.correct !== true && (
        <p className="text-option text-correct">
          {T.rightIs} {dividedSentence(words, solution)}
        </p>
      )}
    </div>
  );
}

function Gap({
  state,
  label,
  interactive,
  onToggle,
}: {
  state: GapState;
  label: string;
  interactive: boolean;
  onToggle(): void;
}) {
  const pressed = state !== 'empty';
  return (
    <button
      type="button"
      aria-label={label + (GAP_WORDS[state] ?? '')}
      aria-pressed={pressed}
      aria-disabled={!interactive || undefined}
      onClick={() => {
        if (interactive) onToggle();
      }}
      className={clsx(
        'flex size-touch shrink-0 items-center justify-center rounded-control',
        state === 'set' && 'bg-signal-soft',
        interactive && 'cursor-pointer',
      )}
    >
      <span
        aria-hidden="true"
        className={clsx(
          'w-2xs rounded-round transition-[height,background-color] duration-(--duration-press) ease-standard',
          BAR[state],
        )}
      />
    </button>
  );
}
