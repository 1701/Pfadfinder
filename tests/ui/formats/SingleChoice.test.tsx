// @vitest-environment jsdom
import '../dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SingleChoice } from '../../../src/ui/formats/SingleChoice';
import { singleChoice } from '../../fixtures/items';

const order = (attemptIndex: number) => {
  const { unmount } = render(
    <SingleChoice
      item={singleChoice}
      attemptIndex={attemptIndex}
      answer={null}
      onChange={() => {}}
      disabled={false}
    />,
  );
  const labels = screen.getAllByRole('radio').map((r) => (r as HTMLInputElement).value);
  unmount();
  return labels;
};

describe('SingleChoice', () => {
  it('shuffles deterministically per item and attempt', () => {
    expect(order(0)).toEqual(order(0));
    expect(order(0).sort()).toEqual(['a', 'b', 'c', 'd']);
    const orders = new Set([0, 1, 2, 3, 4].map((i) => order(i).join()));
    expect(orders.size).toBeGreaterThan(1);
  });

  it('reports the chosen option', async () => {
    const onChange = vi.fn();
    render(
      <SingleChoice
        item={singleChoice}
        attemptIndex={0}
        answer={null}
        onChange={onChange}
        disabled={false}
      />,
    );
    await userEvent.click(screen.getByRole('radio', { name: '8,10 €' }));
    expect(onChange).toHaveBeenCalledWith({ optionId: 'c' });
  });

  it('after a wrong answer marks the solution and the child’s choice', () => {
    render(
      <SingleChoice
        item={singleChoice}
        attemptIndex={0}
        answer={{ optionId: 'd' }}
        onChange={() => {}}
        disabled
        revealed={{ correct: false, solution: singleChoice.solution }}
      />,
    );
    const solution = screen.getByRole('radio', { name: /^7,90 €\s*\(richtige Antwort\)$/ });
    const chosen = screen.getByRole('radio', { name: /^12,10 €\s*\(deine Wahl\)$/ });
    expect(solution.closest('label')!.className).toContain('bg-correct-surface');
    expect(chosen.closest('label')!.className).toContain('bg-notyet-surface');
    expect(screen.getAllByRole('radio').every((r) => (r as HTMLInputElement).disabled)).toBe(true);
  });

  it('after a correct answer marks only the solution', () => {
    render(
      <SingleChoice
        item={singleChoice}
        attemptIndex={0}
        answer={{ optionId: 'a' }}
        onChange={() => {}}
        disabled
        revealed={{ correct: true, solution: singleChoice.solution }}
      />,
    );
    expect(screen.getByRole('radio', { name: /^7,90 €\s*\(richtige Antwort\)$/ })).toBeTruthy();
    expect(screen.queryByText(/deine Wahl/)).toBeNull();
  });
});
