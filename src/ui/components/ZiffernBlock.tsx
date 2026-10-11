// Digit pad (PRODUCT.md §5.3): no system keyboard. Phone layout, a comma only when the item
// allows decimals, never a dot. A hardware keyboard works too (laptop).

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
  'min-h-touch min-w-key rounded-control border-2 border-line-strong bg-surface font-bold transition-transform duration-(--duration-press) enabled:active:translate-y-px disabled:text-ink-muted';

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
    <div className="grid grid-cols-3 gap-xs" role="group" aria-label="Ziffernblock">
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
      {allowDecimal ? (
        <button
          type="button"
          className={`${keyClass} text-option`}
          disabled={disabled}
          onClick={() => press(',')}
          aria-label="Komma"
        >
          ,
        </button>
      ) : (
        <span aria-hidden="true" />
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
        className={`${keyClass} px-xs text-body`}
        disabled={disabled}
        onClick={() => press(DELETE_KEY)}
      >
        {DELETE_KEY}
      </button>
    </div>
  );
}
