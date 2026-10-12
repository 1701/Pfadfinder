// Focus that the app moves by itself (e.g. to "Weiter" after "Prüfen") shows no ring when the
// child tapped: a ring there looks like a selection and confuses. After a keyboard press the
// ring shows as usual, and it comes back on the next key press.

let lastInput: 'pointer' | 'keyboard' = 'pointer';

if (typeof window !== 'undefined') {
  window.addEventListener('pointerdown', () => (lastInput = 'pointer'), true);
  window.addEventListener('keydown', () => (lastInput = 'keyboard'), true);
}

export const QUIET_FOCUS = 'data-quiet-focus';

export function focusQuietly(element: HTMLElement | null): void {
  if (!element) return;
  if (lastInput === 'keyboard') {
    element.focus();
    return;
  }
  element.setAttribute(QUIET_FOCUS, '');
  const clear = () => {
    element.removeAttribute(QUIET_FOCUS);
    element.removeEventListener('blur', clear);
    window.removeEventListener('keydown', clear, true);
  };
  element.addEventListener('blur', clear);
  window.addEventListener('keydown', clear, true);
  // focusVisible is not in TypeScript's DOM types yet; browsers that know it skip the ring.
  const options: FocusOptions & { focusVisible?: boolean } = { focusVisible: false };
  element.focus(options);
}
