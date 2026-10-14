// Mehrfachwahl: native checkboxes in tiles like single-choice, with a square mark. The prompt
// says how many to pick ("Wähle 2 aus."), so the renderer adds no hint. Prüfen waits for exactly
// minSelect; once they are chosen, the other tiles wait until the child deselects one.

import clsx from 'clsx';
import { useMemo, useState } from 'react';
import { presentedOptions } from '../../domain/presentation';
import { CheckGlyph } from '../components/glyphs';
import { keepNumbersTogether } from '../text/numbers';
import { SolutionMark, StateWords, tileClass, tileState, type TileState } from './choice';
import { LONG_OPTION_CHARS } from './SingleChoice';
import type { FormatProps } from './types';

function SquareMark({ state }: { state: TileState }) {
  if (state === 'solution') return <SolutionMark state={state} />;
  return (
    <span
      aria-hidden="true"
      className={clsx(
        'grid size-lg shrink-0 place-items-center rounded-sheet border-2',
        state === 'selected' && 'border-signal-edge bg-signal-edge text-surface',
        state === 'chosen' && 'border-notyet bg-notyet',
        (state === 'plain' || state === 'blocked') && 'border-line-strong bg-surface',
      )}
    >
      {state === 'selected' && <CheckGlyph className="size-md" />}
    </span>
  );
}

export function MultiChoice({
  item,
  attemptIndex,
  answer,
  onChange,
  disabled,
  revealed,
}: FormatProps<'multi-choice'>) {
  const options = useMemo(() => presentedOptions(item, attemptIndex), [item, attemptIndex]);
  const [chosen, setChosen] = useState<string[]>(() => answer?.optionIds ?? []);
  const { minSelect } = item.payload;
  const full = chosen.length >= minSelect;
  const long = options.some((o) => o.text.length > LONG_OPTION_CHARS);

  const toggle = (id: string) => {
    const next = chosen.includes(id) ? chosen.filter((c) => c !== id) : [...chosen, id];
    setChosen(next);
    onChange(next.length === minSelect ? { optionIds: next } : null);
  };

  return (
    <fieldset className="w-full">
      <legend className="sr-only">Wähle {minSelect} Antworten.</legend>
      <div className={clsx('grid gap-xs', long ? 'grid-cols-1' : 'grid-cols-2')}>
        {options.map((option) => {
          const isChosen = chosen.includes(option.id);
          const blocked = full && !isChosen;
          const state = tileState(
            revealed !== undefined,
            revealed?.solution.optionIds.includes(option.id) ?? false,
            isChosen,
            blocked,
          );
          return (
            <label
              key={option.id}
              className={tileClass(state, !disabled && !blocked, 'choice px-lg')}
            >
              <input
                type="checkbox"
                value={option.id}
                checked={isChosen}
                disabled={disabled || blocked}
                onChange={() => toggle(option.id)}
                className="sr-only"
              />
              <SquareMark state={state} />
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
