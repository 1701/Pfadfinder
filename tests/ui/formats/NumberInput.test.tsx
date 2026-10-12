// @vitest-environment jsdom
import '../dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { readFileSync } from 'node:fs';
import type { Item, ItemOf } from '../../../src/domain/content';
import { evaluate } from '../../../src/domain/evaluation';
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

describe('NumberInput – money with a comma (groessen-messen, allowDecimal)', () => {
  const money = (
    JSON.parse(readFileSync('content/items/mathe/groessen-messen.json', 'utf8')) as Item[]
  ).filter(
    (i): i is ItemOf<'number-input'> =>
      i.format === 'number-input' && i.payload.allowDecimal === true && i.status !== 'retired',
  );

  it('exists in the content: 2,20 € and 4,55 €', () => {
    expect(money.map((i) => [i.solution.value, i.payload.unit])).toEqual([
      [2.2, '€'],
      [4.55, '€'],
    ]);
  });

  it.each([
    ['2', 'Komma', '2', '0'],
    ['4', 'Komma', '5', '5'],
  ])('takes %s %s %s %s from the pad and counts it as right', async (...keys) => {
    const item = money.find((i) => String(i.solution.value).startsWith(keys[0]!))!;
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
    await press(...keys);
    const answer = onChange.mock.lastCall![0];
    expect(answer).toEqual({ value: item.solution.value });
    expect(evaluate(item, answer).correct).toBe(true);
    // The child sees exactly what it typed, the trailing zero included.
    expect(screen.getByLabelText('Deine Zahl').textContent).toBe(`${keys[0]},${keys[2]}${keys[3]}`);
    expect(screen.queryByRole('button', { name: '.' })).toBeNull();
  });

  it('accepts 2,2 for 2,20 € and shows the solution with cents', async () => {
    const item = money.find((i) => i.solution.value === 2.2)!;
    const onChange = vi.fn();
    const { unmount } = render(
      <NumberInput
        item={item}
        attemptIndex={0}
        answer={null}
        onChange={onChange}
        disabled={false}
      />,
    );
    await press('2', 'Komma', '2');
    expect(evaluate(item, onChange.mock.lastCall![0]).correct).toBe(true);
    unmount();

    render(
      <NumberInput
        item={item}
        attemptIndex={0}
        answer={{ value: 2.8 }}
        onChange={() => {}}
        disabled
        revealed={{ correct: false, solution: item.solution }}
      />,
    );
    expect(screen.getByLabelText('Deine Zahl').textContent).toBe('2,80');
    expect(
      screen.getByText((_, el) => el?.tagName === 'P' && el.textContent === 'Richtig ist: 2,20 €'),
    ).toBeTruthy();
  });
});
