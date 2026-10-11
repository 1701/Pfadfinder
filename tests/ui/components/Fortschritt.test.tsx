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
  });
});
