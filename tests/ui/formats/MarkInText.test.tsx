// @vitest-environment jsdom
import '../dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { splitUnits } from '../../../src/domain/content';
import { evaluate } from '../../../src/domain/evaluation';
import { MarkInText } from '../../../src/ui/formats/MarkInText';
import { probeMarkInText } from '../../fixtures/probe';
import { MARK_IN_TEXT_ITEMS } from '../../fixtures/variants';

const item = probeMarkInText;
const word = (name: string | RegExp) => screen.getByRole('button', { name });

describe('MarkInText', () => {
  // Words, sentences and a number row; that every solution index exists is a schema rule.
  it.each([...MARK_IN_TEXT_ITEMS, probeMarkInText].map((i) => [i.id, i] as const))(
    '%s: one block per unit of splitUnits(), and the solution indices are those blocks',
    async (_, example) => {
      const onChange = vi.fn();
      render(
        <MarkInText
          item={example}
          attemptIndex={0}
          answer={null}
          onChange={onChange}
          disabled={false}
        />,
      );
      const units = splitUnits(example.payload.text, example.payload.unit);
      const blocks = screen.getAllByRole('button');
      expect(blocks.map((b) => b.textContent?.replace(/ /g, ' '))).toEqual(units);
      for (const index of example.solution.indices) await userEvent.click(blocks[index]!);
      const answer = onChange.mock.lastCall?.[0];
      expect(evaluate(example, answer).correct).toBe(true);
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
    await userEvent.click(word('hund'));
    await userEvent.click(word('garten'));
    expect(onChange).toHaveBeenLastCalledWith({ indices: [1, 6] });
    await userEvent.click(word('tim'));
    expect(word('im').getAttribute('aria-disabled')).toBe('true');
    await userEvent.click(word('im'));
    expect(word('im').getAttribute('aria-pressed')).toBe('false');
    await userEvent.click(word('tim'));
    expect(word('im').getAttribute('aria-disabled')).toBeNull();
    await userEvent.click(word('garten'));
    await userEvent.click(word('hund'));
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
    expect(word(/^garten\s*\(richtige Antwort\)$/)).toBeTruthy();
    expect(word(/^hund\s*\(richtige Antwort\)$/)).toBeTruthy();
    expect(word(/^seinem\s*\(deine Wahl\)$/)).toBeTruthy();
    expect(word('mit')).toBeTruthy();
  });
});
