// Digit pad (PRODUCT.md §5.3): no system keyboard. Phone layout, a comma only when the item
// allows decimals, never a dot. A hardware keyboard works too (laptop).

import clsx from 'clsx';
import { useEffect } from 'react';

export const DELETE_KEY = 'Löschen';
type Key = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | ',' | typeof DELETE_KEY;

export interface ZiffernBlockOptions {
  allowDecimal: boolean;
  /** Maximum number of digits, decimals included. */
  maxDigits: number;
}

/** The next input after one key press; returns the input unchanged when the key is not allowed. */
export function pressKey(
  value: string,
  key: Key,
  { allowDecimal, maxDigits }: ZiffernBlockOptions,
): string {
  if (key === DELETE_KEY) return value.slice(0, -1);
  if (key === ',') {
    if (!allowDecimal || value.includes(',')) return value;
    return value === '' ? '0,' : `${value},`;
  }
  if (value.replace(',', '').length >= maxDigits) return value;
  return value === '0' ? key : value + key;
}

export interface ZiffernBlockProps extends ZiffernBlockOptions {
  value: string;
  onChange(value: string): void;
  disabled?: boolean;
}

const ROWS: Key[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
];

const keyClass =
  'min-h-touch rounded-control border-2 border-line-strong bg-surface font-bold transition-transform duration-(--duration-press) enabled:active:translate-y-px disabled:border-line disabled:text-ink-muted';

/**
 * Keys are 90 px wide when there is room and 72 px at least. Without a comma "Löschen" takes two
 * columns of the last row (0 | Löschen): in one 72 px key it ran 10 px out (iPad landscape beside
 * a reading text, finding 2026-10-19). With a comma the row stays , | 0 | Löschen.
 */
const GRID_CLASS = 'grid-cols-[repeat(3,minmax(var(--spacing-key),var(--spacing-key-max)))]';

export function ZiffernBlock({ value, onChange, disabled = false, ...options }: ZiffernBlockProps) {
  const { allowDecimal, maxDigits } = options;
  const press = (key: Key) => {
    const next = pressKey(value, key, { allowDecimal, maxDigits });
    if (next !== value) onChange(next);
  };

  useEffect(() => {
    if (disabled) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey || event.ctrlKey || event.metaKey) return;
      const key: Key | null = /^[0-9]$/.test(event.key)
        ? (event.key as Key)
        : event.key === ','
          ? ','
          : event.key === 'Backspace'
            ? DELETE_KEY
            : null;
      if (!key) return;
      event.preventDefault();
      const next = pressKey(value, key, { allowDecimal, maxDigits });
      if (next !== value) onChange(next);
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [disabled, value, onChange, allowDecimal, maxDigits]);

  return (
    <div className={clsx('grid gap-xs', GRID_CLASS)} role="group" aria-label="Ziffernblock">
      {ROWS.flat().map((key) => (
        <button
          key={key}
          type="button"
          className={`${keyClass} text-option`}
          disabled={disabled}
          onClick={() => press(key)}
        >
          {key}
        </button>
      ))}
      {allowDecimal && (
        <button
          type="button"
          className={`${keyClass} text-option`}
          disabled={disabled}
          onClick={() => press(',')}
          aria-label="Komma"
        >
          ,
        </button>
      )}
      <button
        type="button"
        className={`${keyClass} text-option`}
        disabled={disabled}
        onClick={() => press('0')}
      >
        0
      </button>
      <button
        type="button"
        className={clsx(keyClass, 'px-xs text-body', !allowDecimal && 'col-span-2')}
        disabled={disabled}
        onClick={() => press(DELETE_KEY)}
      >
        {DELETE_KEY}
      </button>
    </div>
  );
}
