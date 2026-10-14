// Text as tappable blocks (mark-in-text, find-error): one toggle button per word or sentence.
// At the limit the other blocks wait (aria-disabled, dashed) until the child deselects one.
// After checking the wanted blocks carry a check mark, a different choice stays neutral stone.

import clsx from 'clsx';
import { SolutionMark, StateWords, tileClass, tileState } from './choice';

export interface UnitPickerProps<K extends string | number> {
  units: { key: K; text: string }[];
  chosen: K[];
  max: number;
  onToggle(key: K): void;
  disabled: boolean;
  /** Keys of the solution once checked. */
  solution?: K[];
  /** Sentences stand one per row, words flow like text. */
  layout: 'words' | 'sentences';
  label: string;
}

export function UnitPicker<K extends string | number>({
  units,
  chosen,
  max,
  onToggle,
  disabled,
  solution,
  layout,
  label,
}: UnitPickerProps<K>) {
  const full = chosen.length >= max;
  return (
    <div
      role="group"
      aria-label={label}
      className={clsx('flex w-full gap-xs', layout === 'words' ? 'flex-wrap' : 'flex-col')}
    >
      {units.map(({ key, text }) => {
        const isChosen = chosen.includes(key);
        const blocked = !disabled && full && !isChosen;
        const state = tileState(
          solution !== undefined,
          solution?.includes(key) ?? false,
          isChosen,
          blocked,
        );
        return (
          <button
            key={key}
            type="button"
            aria-pressed={isChosen}
            aria-disabled={disabled || blocked || undefined}
            onClick={() => {
              if (!disabled && !blocked) onToggle(key);
            }}
            className={tileClass(
              state,
              !disabled && !blocked,
              clsx('px-md text-left', layout === 'sentences' && 'w-full'),
            )}
          >
            <SolutionMark state={state} />
            <span>
              {text}
              <StateWords state={state} />
            </span>
          </button>
        );
      })}
    </div>
  );
}

/** Adds or removes a key, keeping the order in which the units appear. */
export function toggleKey<K>(chosen: K[], key: K, order: K[]): K[] {
  const next = chosen.includes(key) ? chosen.filter((c) => c !== key) : [...chosen, key];
  return order.filter((k) => next.includes(k));
}
