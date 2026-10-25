// @vitest-environment jsdom
import '../dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { splitUnits } from '../../../src/domain/content';
import { evaluate } from '../../../src/domain/evaluation';
import { SegmentText } from '../../../src/ui/formats/SegmentText';
import { probeSegmentText } from '../../fixtures/probe';
import { SEGMENT_TEXT_ITEMS } from '../../fixtures/variants';

// Nach der Schule | fährt | Amira | mit dem Fahrrad | nach Hause.  (gaps 2, 3, 4, 7)
const item = probeSegmentText;
const gap = (left: string, right: string) =>
  screen.getByRole('button', {
    name: new RegExp(`^Trennstrich zwischen „${left}“ und „${right}“`),
  });
const gaps = () => screen.getAllByRole('button', { name: /^Trennstrich/ });

describe('SegmentText', () => {
  it.each([...SEGMENT_TEXT_ITEMS, probeSegmentText].map((i) => [i.id, i] as const))(
    '%s: the words of splitUnits(), a gap between every two, the solution gaps are those gaps',
    async (_, example) => {
      const onChange = vi.fn();
      render(
        <SegmentText
          item={example}
          attemptIndex={0}
          answer={null}
          onChange={onChange}
          disabled={false}
        />,
      );
      const words = splitUnits(example.payload.text, 'word');
      const group = screen.getByRole('group', { name: 'Satz mit Lücken zum Antippen' });
      expect(group.textContent?.replace(/ /g, ' ')).toBe(words.join(''));
      expect(gaps()).toHaveLength(words.length - 1);
      for (const k of example.solution.boundaries) await userEvent.click(gaps()[k]!);
      expect(evaluate(example, onChange.mock.lastCall?.[0]).correct).toBe(true);
    },
  );

  it('tapping a gap sets a divider, tapping it again lifts it; no divider reports null', async () => {
    const onChange = vi.fn();
    render(
      <SegmentText
        item={item}
        attemptIndex={0}
        answer={null}
        onChange={onChange}
        disabled={false}
      />,
    );
    await userEvent.click(gap('Fahrrad', 'nach'));
    await userEvent.click(gap('Schule', 'fährt'));
    expect(onChange).toHaveBeenLastCalledWith({ boundaries: [2, 7] });
    expect(gap('Schule', 'fährt').getAttribute('aria-pressed')).toBe('true');
    await userEvent.click(gap('Schule', 'fährt'));
    expect(gap('Schule', 'fährt').getAttribute('aria-pressed')).toBe('false');
    expect(onChange).toHaveBeenLastCalledWith({ boundaries: [7] });
    await userEvent.click(gap('Fahrrad', 'nach'));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('a gap toggles with Enter and Space as well', async () => {
    const onChange = vi.fn();
    render(
      <SegmentText
        item={item}
        attemptIndex={0}
        answer={null}
        onChange={onChange}
        disabled={false}
      />,
    );
    gap('Amira', 'mit').focus();
    await userEvent.keyboard('{Enter}');
    expect(onChange).toHaveBeenLastCalledWith({ boundaries: [4] });
    await userEvent.keyboard(' ');
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('noch nicht: the child dividers stay, marked right or own choice, and "Richtig ist" below', () => {
    render(
      <SegmentText
        item={item}
        attemptIndex={0}
        answer={{ boundaries: [1, 3] }}
        onChange={() => {}}
        disabled
        revealed={{ correct: false, solution: item.solution }}
      />,
    );
    expect(gap('fährt', 'Amira').getAttribute('aria-label')).toMatch(/\(richtig\)$/);
    expect(gap('der', 'Schule').getAttribute('aria-label')).toMatch(/\(deine Wahl\)$/);
    expect(gap('Schule', 'fährt').getAttribute('aria-pressed')).toBe('false');
    expect(
      screen.getByText(
        'Richtig ist: Nach der Schule | fährt | Amira | mit dem Fahrrad | nach Hause.',
      ),
    ).toBeTruthy();
  });

  it('right: no "Richtig ist" line', () => {
    render(
      <SegmentText
        item={item}
        attemptIndex={0}
        answer={{ boundaries: item.solution.boundaries }}
        onChange={() => {}}
        disabled
        revealed={{ correct: true, solution: item.solution }}
      />,
    );
    expect(screen.queryByText(/^Richtig ist:/)).toBeNull();
    expect(gaps().filter((g) => g.getAttribute('aria-pressed') === 'true')).toHaveLength(4);
  });

  it('looking through is read-only: own answer and solution, taps change nothing', async () => {
    const onChange = vi.fn();
    render(
      <SegmentText
        item={item}
        attemptIndex={0}
        answer={{ boundaries: [2] }}
        onChange={onChange}
        disabled
        revealed={{ correct: false, solution: item.solution }}
      />,
    );
    for (const g of gaps()) expect(g.getAttribute('aria-disabled')).toBe('true');
    await userEvent.click(gap('Amira', 'mit'));
    expect(gap('Amira', 'mit').getAttribute('aria-pressed')).toBe('false');
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByText(/^Richtig ist:/)).toBeTruthy();
  });
});
