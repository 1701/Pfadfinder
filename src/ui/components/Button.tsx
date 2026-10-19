// Primary = the yellow trail-mark button for the next step on the way: Prüfen and Weiter, and in
// the Einstieg Erkunden, Starten, Weitermachen and Zur Karte after the result (wireframes approved
// 2026-10-14). Secondary = quiet outline for everything else.

import clsx from 'clsx';
import type { ComponentProps } from 'react';

export type ButtonVariant = 'primary' | 'secondary';

export interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

/**
 * Large: the band button (56 px, fixed width). Fill: 56 px high, as wide as its grid cell (the three
 * rating buttons share the band). Small: a touch target in running UI.
 */
export type ButtonSize = 'large' | 'fill' | 'small';

/** The button look, also for links that act like a button ("Los", "Zur Karte"). */
export function buttonClass(
  variant: ButtonVariant,
  size: ButtonSize = variant === 'primary' ? 'large' : 'small',
): string {
  return clsx(
    'rounded-control border-2 px-lg font-bold transition-transform duration-(--duration-press) ease-standard enabled:active:translate-y-px',
    variant === 'primary'
      ? 'border-signal-edge bg-signal disabled:border-line-strong disabled:bg-surface disabled:text-ink-muted'
      : 'border-line-strong bg-surface',
    size === 'large' && 'min-h-primary min-w-action text-option',
    size === 'fill' && 'min-h-primary text-option',
    size === 'small' && 'min-h-touch text-body',
  );
}

export function Button({
  variant = 'secondary',
  size,
  className,
  type = 'button',
  ...props
}: ButtonProps) {
  return <button type={type} className={clsx(buttonClass(variant, size), className)} {...props} />;
}
