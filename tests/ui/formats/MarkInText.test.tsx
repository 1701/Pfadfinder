// @vitest-environment jsdom
import '../dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { splitUnits } from '../../../src/domain/content';
import { evaluate } from '../../../src/domain/evaluation';
import { MarkInText } from '../../../src/ui/formats/MarkInText';
import { activeItems, contentItem } from '../../fixtures/content-items';

const item = contentItem('d-rss-1-001', 'mark-in-text');
const word = (name: string | RegExp) => screen.getByRole('button', { name });

describe('MarkInText', () => {
  it.each(activeItems('mark-in-text').map((i) => [i.id, i] as const))(
    '%s: one block per unit of splitUnits(), and the solution indices are those blocks',
    async (_, real) => {
      const onChange = vi.fn();
      render(
        <MarkInText
          item={real}
          attemptIndex={0}
          answer={null}
          onChange={onChange}
          disabled={false}
        />,
      );
      const units = splitUnits(real.payload.text, real.payload.unit);
      const blocks = screen.getAllByRole('button');
      expect(blocks.map((b) => b.textContent?.replace(/ /g, ' '))).toEqual(units);
      for (const index of real.solution.indices) await userEvent.click(blocks[index]!);
      const answer = onChange.mock.lastCall?.[0];
      expect(evaluate(real, answer).correct).toBe(true);
    },
  );

  it('toggles blocks and lets the others wait at maxSelect', async () => {
    const onChange = vi.fn();
    render(
      <MarkInText
        item={item}
        attemptIndex={0}
        answer={null}
        onChange={onChange}
        disabled={false}
      />,
    );
    await userEvent.click(word('schwester'));
    await userEvent.click(word('morgen'));
    expect(onChange).toHaveBeenLastCalledWith({ indices: [1, 6] });
    await userEvent.click(word('leyla'));
    expect(word('am').getAttribute('aria-disabled')).toBe('true');
    await userEvent.click(word('am'));
    expect(word('am').getAttribute('aria-pressed')).toBe('false');
    await userEvent.click(word('leyla'));
    expect(word('am').getAttribute('aria-disabled')).toBeNull();
    await userEvent.click(word('morgen'));
    await userEvent.click(word('schwester'));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('after checking: the wanted words carry the check, a different choice stays neutral', () => {
    render(
      <MarkInText
        item={item}
        attemptIndex={0}
        answer={{ indices: [1, 3, 5] }}
        onChange={() => {}}
        disabled
        revealed={{ correct: false, solution: item.solution }}
      />,
    );
    expect(word(/^morgen\s*\(richtige Antwort\)$/)).toBeTruthy();
    expect(word(/^schwester\s*\(richtige Antwort\)$/)).toBeTruthy();
    expect(word(/^ihrer\s*\(deine Wahl\)$/)).toBeTruthy();
    expect(word('mit')).toBeTruthy();
  });
});
