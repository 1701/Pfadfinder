// @vitest-environment jsdom
import '../dom';
import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Fortschritt } from '../../../src/ui/components/Fortschritt';

describe('Fortschritt', () => {
  it('says "3 von 10" without a percentage and draws one dash per item', () => {
    const { container } = render(<Fortschritt current={3} done={2} total={10} />);
    expect(container.textContent).toBe('Aufgabe 3 von 10');
    expect(container.textContent).not.toContain('%');
    const dashes = container.querySelectorAll('li');
    expect(dashes).toHaveLength(10);
    expect([...dashes].filter((d) => d.className.includes('bg-ink'))).toHaveLength(2);
    // The ring marks the item on screen, like the current Etappe on the map.
    expect([...dashes].findIndex((d) => d.hasAttribute('data-current'))).toBe(2);
    expect(dashes[2]!.className).toContain('outline-ink');
  });

  it('keeps the ring on a checked item: filled and ringed at once', () => {
    const { container } = render(<Fortschritt current={3} done={3} total={10} />);
    const current = container.querySelector('li[data-current]')!;
    expect(current.className).toContain('bg-ink');
    expect(current.className).toContain('outline-ink');
  });
});
