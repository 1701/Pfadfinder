// Einfachwahl: native radio buttons (keyboard and screen readers for free), options shuffled
// per presentation unless the item keeps their order (labels A–D of a picture, schema 1.0.4). After checking, the solution shows a check mark; a different choice of the
// child stays marked in neutral stone – never red.

import clsx from 'clsx';
import { useId, useMemo } from 'react';
import { presentationSeed, seededShuffle } from '../../domain/scheduler';
import { CheckGlyph } from '../components/glyphs';
import { keepNumbersTogether } from '../text/numbers';
import type { FormatProps } from './types';

/** Longer options get a full row each so they do not wrap into three lines. */
const LONG_OPTION_CHARS = 24;

type OptionState = 'plain' | 'selected' | 'solution' | 'chosen';

const stateClass: Record<OptionState, string> = {
  plain: 'border-line-strong bg-surface',
  selected: 'border-signal-edge bg-signal-soft',
  solution: 'border-correct bg-correct-surface',
  chosen: 'border-notyet bg-notyet-surface',
};

export function SingleChoice({
  item,
  attemptIndex,
  answer,
  onChange,
  disabled,
  revealed,
}: FormatProps<'single-choice'>) {
  const name = useId();
  const options = useMemo(
    () =>
      item.payload.keepOrder
        ? item.payload.options
        : seededShuffle(item.payload.options, presentationSeed(item.id, attemptIndex)),
    [item, attemptIndex],
  );
  const long = options.some((o) => o.text.length > LONG_OPTION_CHARS);

  return (
    <fieldset className="w-full">
      <legend className="sr-only">Wähle eine Antwort.</legend>
      <div className={clsx('grid gap-xs', long ? 'grid-cols-1' : 'grid-cols-2')}>
        {options.map((option) => {
          const chosen = answer?.optionId === option.id;
          const state: OptionState = revealed
            ? revealed.solution.optionId === option.id
              ? 'solution'
              : chosen
                ? 'chosen'
                : 'plain'
            : chosen
              ? 'selected'
              : 'plain';
          return (
            <label
              key={option.id}
              className={clsx(
                'choice flex min-h-touch items-center gap-sm rounded-control border-2 px-lg py-2xs text-option',
                !disabled && 'cursor-pointer',
                stateClass[state],
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.id}
                checked={chosen}
                disabled={disabled}
                onChange={() => onChange({ optionId: option.id })}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={clsx(
                  'grid size-lg shrink-0 place-items-center rounded-round',
                  state === 'solution' ? 'text-correct' : 'border-2 border-line-strong bg-surface',
                  state === 'selected' && 'border-signal-edge',
                  state === 'chosen' && 'border-notyet',
                )}
              >
                {state === 'solution' ? (
                  <CheckGlyph className="size-lg" />
                ) : (
                  (state === 'selected' || state === 'chosen') && (
                    <span
                      className={clsx(
                        'block size-sm rounded-round',
                        state === 'selected' ? 'bg-signal-edge' : 'bg-notyet',
                      )}
                    />
                  )
                )}
              </span>
              <span>
                {keepNumbersTogether(option.text)}
                {state !== 'plain' && state !== 'selected' && ' '}
                {state === 'solution' && <span className="sr-only">(richtige Antwort)</span>}
                {state === 'chosen' && <span className="sr-only">(deine Wahl)</span>}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
