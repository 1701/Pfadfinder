// Einfachwahl: native radio buttons (keyboard and screen readers for free), options shuffled
// per presentation unless the item keeps their order (labels A–D of a picture, schema 1.0.4).
// After checking, the solution shows a check mark; a different choice of the child stays marked
// in neutral stone – never red.

import clsx from 'clsx';
import { useId, useMemo } from 'react';
import { presentedOptions } from '../../domain/presentation';
import { CheckGlyph } from '../components/glyphs';
import { keepNumbersTogether } from '../text/numbers';
import { StateWords, tileClass, tileState } from './choice';
import type { FormatProps } from './types';

/** Longer options get a full row each so they do not wrap into three lines (CONTENT_SCHEMA §7). */
export const LONG_OPTION_CHARS = 24;

export function SingleChoice({
  item,
  attemptIndex,
  answer,
  onChange,
  disabled,
  revealed,
}: FormatProps<'single-choice'>) {
  const name = useId();
  const options = useMemo(() => presentedOptions(item, attemptIndex), [item, attemptIndex]);
  const long = options.some((o) => o.text.length > LONG_OPTION_CHARS);

  return (
    <fieldset className="w-full">
      <legend className="sr-only">Wähle eine Antwort.</legend>
      <div className={clsx('grid gap-xs', long ? 'grid-cols-1' : 'grid-cols-2')}>
        {options.map((option) => {
          const chosen = answer?.optionId === option.id;
          const state = tileState(
            revealed !== undefined,
            revealed?.solution.optionId === option.id,
            chosen,
          );
          return (
            <label key={option.id} className={tileClass(state, !disabled, 'choice px-lg')}>
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
                <StateWords state={state} />
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}
