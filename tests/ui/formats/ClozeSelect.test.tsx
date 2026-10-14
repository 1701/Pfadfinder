// @vitest-environment jsdom
import '../dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { presentedGapOptions } from '../../../src/domain/presentation';
import { ClozeSelect } from '../../../src/ui/formats/ClozeSelect';
import { contentItem } from '../../fixtures/content-items';

const NB = ' ';
const item = contentItem('m-gm-2-008', 'cloze-select');
const gap = (n: number) => screen.getByRole('button', { name: new RegExp(`^Lücke ${n}:`) });
const optionsOf = (n: number) => screen.getByRole('group', { name: `Antworten für Lücke ${n}` });

describe('ClozeSelect (m-gm-2-008)', () => {
  it('opens the first gap with its three options; no native select', () => {
    render(
      <ClozeSelect
        item={item}
        attemptIndex={0}
        answer={null}
        onChange={() => {}}
        disabled={false}
      />,
    );
    expect(gap(1).getAttribute('aria-expanded')).toBe('true');
    expect(gap(2).getAttribute('aria-expanded')).toBe('false');
    expect(
      within(optionsOf(1))
        .getAllByRole('button')
        .map((b) => b.textContent),
    ).toEqual(presentedGapOptions(item, 0)['1']!.map((o) => o.replace(' ', NB)));
    expect(screen.queryByRole('combobox')).toBeNull();
  });

  it('fills a gap, opens the next empty one, and reports when all are filled', async () => {
    const onChange = vi.fn();
    render(
      <ClozeSelect
        item={item}
        attemptIndex={0}
        answer={null}
        onChange={onChange}
        disabled={false}
      />,
    );
    await userEvent.click(within(optionsOf(1)).getByRole('button', { name: `3${NB}000` }));
    expect(gap(1).getAttribute('aria-label')).toBe('Lücke 1: 3 000');
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(gap(2).getAttribute('aria-expanded')).toBe('true');
    await userEvent.click(within(optionsOf(2)).getByRole('button', { name: '4' }));
    expect(onChange).toHaveBeenLastCalledWith({ gaps: { '1': '3 000', '2': '4' } });
    expect(screen.queryByRole('group')).toBeNull();

    // Tapping a filled gap opens it again to change it.
    await userEvent.click(gap(1));
    await userEvent.click(within(optionsOf(1)).getByRole('button', { name: '300' }));
    expect(onChange).toHaveBeenLastCalledWith({ gaps: { '1': '300', '2': '4' } });
  });

  it('after checking: no options, the right word next to a different choice', () => {
    render(
      <ClozeSelect
        item={item}
        attemptIndex={0}
        answer={{ gaps: { '1': '3 000', '2': '3' } }}
        onChange={() => {}}
        disabled
        revealed={{ correct: false, solution: item.solution }}
      />,
    );
    expect(screen.queryByRole('group')).toBeNull();
    expect((gap(2) as HTMLButtonElement).disabled).toBe(true);
    expect(screen.getByText(/richtig ist: 4/)).toBeTruthy();
    expect(screen.queryByText(/richtig ist: 3/)).toBeNull();
  });
});
