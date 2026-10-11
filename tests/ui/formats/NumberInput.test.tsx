// @vitest-environment jsdom
import '../dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import type { ItemOf } from '../../../src/domain/content';
import { NumberInput } from '../../../src/ui/formats/NumberInput';
import { numberInput } from '../../fixtures/items';

const press = async (...keys: string[]) => {
  for (const key of keys) await userEvent.click(screen.getByRole('button', { name: key }));
};

describe('NumberInput', () => {
  it('turns digit-pad input into a number, grouped on screen', async () => {
    const onChange = vi.fn();
    render(
      <NumberInput
        item={numberInput}
        attemptIndex={0}
        answer={null}
        onChange={onChange}
        disabled={false}
      />,
    );
    await press('7', '6', '0', '3');
    expect(onChange).toHaveBeenLastCalledWith({ value: 7603 });
    expect(screen.getByLabelText('Deine Zahl').textContent).toBe('7\u00a0603');
    await press('Löschen', 'Löschen', 'Löschen', 'Löschen');
    expect(onChange).toHaveBeenLastCalledWith(null);
    expect(screen.queryByRole('button', { name: 'Komma' })).toBeNull();
  });

  it('reports null for an unfinished decimal and shows the unit', async () => {
    const item: ItemOf<'number-input'> = {
      ...numberInput,
      payload: { maxDigits: 4, allowDecimal: true, unit: 'm' },
      solution: { value: 2.5 },
    };
    const onChange = vi.fn();
    render(
      <NumberInput
        item={item}
        attemptIndex={0}
        answer={null}
        onChange={onChange}
        disabled={false}
      />,
    );
    expect(screen.getByText('m')).toBeTruthy();
    await press('2', 'Komma');
    expect(onChange).toHaveBeenLastCalledWith(null);
    await press('5');
    expect(onChange).toHaveBeenLastCalledWith({ value: 2.5 });
  });

  it('shows the solution after a wrong answer and locks the pad', () => {
    render(
      <NumberInput
        item={numberInput}
        attemptIndex={0}
        answer={{ value: 7503 }}
        onChange={() => {}}
        disabled
        revealed={{ correct: false, solution: numberInput.solution }}
      />,
    );
    expect(screen.getByLabelText('Deine Zahl').textContent).toBe('7\u00a0503');
    expect(
      screen.getByText(
        (_, el) => el?.tagName === 'P' && el.textContent === 'Richtig ist: 7\u00a0603',
      ),
    ).toBeTruthy();
    expect((screen.getByRole('button', { name: '1' }) as HTMLButtonElement).disabled).toBe(true);
  });
});
