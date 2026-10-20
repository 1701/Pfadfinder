// @vitest-environment jsdom
import '../dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { presentedOptions } from '../../../src/domain/presentation';
import { MultiChoice } from '../../../src/ui/formats/MultiChoice';
import { contentItem } from '../../fixtures/content-items';

const item = contentItem('m-dz-2-007', 'multi-choice');
const boxes = () => screen.getAllByRole('checkbox') as HTMLInputElement[];
const box = (name: string | RegExp) => screen.getByRole('checkbox', { name }) as HTMLInputElement;

describe('MultiChoice (m-dz-2-007)', () => {
  it('shows the options in the presented order, two columns for short options', () => {
    const { container } = render(
      <MultiChoice
        item={item}
        attemptIndex={1}
        answer={null}
        onChange={() => {}}
        disabled={false}
      />,
    );
    expect(boxes().map((b) => b.value)).toEqual(presentedOptions(item, 1).map((o) => o.id));
    expect(container.querySelector('.grid-cols-2')).not.toBeNull();
  });

  // Task 14: no lock below or above minSelect, no hint. Too few or too many picks are mistakes.
  it('reports an answer from the first pick; every tile stays open after minSelect', async () => {
    const onChange = vi.fn();
    render(
      <MultiChoice
        item={item}
        attemptIndex={0}
        answer={null}
        onChange={onChange}
        disabled={false}
      />,
    );
    await userEvent.click(box('Zu Fuß: am meisten.'));
    expect(onChange).toHaveBeenLastCalledWith({ optionIds: ['a'] });
    await userEvent.click(box('Bus: mehr als Fahrrad.'));
    expect(onChange).toHaveBeenLastCalledWith({ optionIds: ['a', 'b'] });

    expect(boxes().every((b) => !b.disabled)).toBe(true);
    expect(document.querySelector('.border-dashed')).toBeNull();
    await userEvent.click(box('Auto: mehr als Fahrrad.'));
    expect(onChange).toHaveBeenLastCalledWith({ optionIds: ['a', 'b', 'c'] });

    for (const name of ['Zu Fuß: am meisten.', 'Bus: mehr als Fahrrad.', 'Auto: mehr als Fahrrad.'])
      await userEvent.click(box(name));
    expect(onChange).toHaveBeenLastCalledWith(null);
  });

  it('a draft from the Probetest comes back as it was, even below minSelect', () => {
    render(
      <MultiChoice
        item={item}
        attemptIndex={0}
        answer={{ optionIds: ['c'] }}
        onChange={() => {}}
        disabled={false}
      />,
    );
    expect(
      boxes()
        .filter((b) => b.checked)
        .map((b) => b.value),
    ).toEqual(['c']);
  });

  it('marks the solution and the child’s other choice after checking, never as wrong', () => {
    render(
      <MultiChoice
        item={item}
        attemptIndex={0}
        answer={{ optionIds: ['a', 'c'] }}
        onChange={() => {}}
        disabled
        revealed={{ correct: false, solution: item.solution }}
      />,
    );
    expect(box(/^Zu Fuß: am meisten\.\s*\(richtige Antwort\)$/)).toBeTruthy();
    expect(box(/^Bus: mehr als Fahrrad\.\s*\(richtige Antwort\)$/)).toBeTruthy();
    expect(box(/^Auto: mehr als Fahrrad\.\s*\(deine Wahl\)$/)).toBeTruthy();
    expect(box('Insgesamt 20 Kinder.')).toBeTruthy();
    expect(boxes().every((b) => b.disabled)).toBe(true);
    expect(document.body.textContent).not.toMatch(/falsch/i);
  });
});
