// Primary = the yellow trail-mark button, only for Prüfen and Weiter (token decision 2026-10-11).
// Secondary = quiet outline for everything else.

import clsx from 'clsx';
import type { ComponentProps } from 'react';

export type ButtonVariant = 'primary' | 'secondary';

export interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant;
}

export function Button({
  variant = 'secondary',
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={clsx(
        'rounded-control border-2 px-lg font-bold transition-transform duration-(--duration-press) ease-standard enabled:active:translate-y-px',
        variant === 'primary'
          ? 'min-h-primary min-w-action border-signal-edge bg-signal text-option disabled:border-line-strong disabled:bg-surface disabled:text-ink-muted'
          : 'min-h-touch border-line-strong bg-surface text-body',
        className,
      )}
      {...props}
    />
  );
}
