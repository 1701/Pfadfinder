// @vitest-environment jsdom
import '../dom';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { describe, expect, it } from 'vitest';
import { DELETE_KEY, ZiffernBlock, pressKey } from '../../../src/ui/components/ZiffernBlock';

const ints = { allowDecimal: false, maxDigits: 4 };
const decimals = { allowDecimal: true, maxDigits: 4 };

describe('pressKey', () => {
  it('appends digits up to maxDigits and replaces a lone 0', () => {
    expect(pressKey('', '7', ints)).toBe('7');
    expect(pressKey('0', '7', ints)).toBe('7');
    expect(pressKey('1234', '5', ints)).toBe('1234');
    expect(pressKey('12,3', '4', decimals)).toBe('12,34');
    expect(pressKey('12,34', '5', decimals)).toBe('12,34');
  });

  it('allows one comma only with allowDecimal', () => {
    expect(pressKey('12', ',', ints)).toBe('12');
    expect(pressKey('12', ',', decimals)).toBe('12,');
    expect(pressKey('', ',', decimals)).toBe('0,');
    expect(pressKey('1,2', ',', decimals)).toBe('1,2');
  });

  it('deletes the last character', () => {
    expect(pressKey('12,', DELETE_KEY, decimals)).toBe('12');
    expect(pressKey('', DELETE_KEY, decimals)).toBe('');
  });
});

function Harness(props: { allowDecimal: boolean }) {
  const [value, setValue] = useState('');
  return (
    <>
      <output data-testid="value">{value}</output>
      <ZiffernBlock value={value} onChange={setValue} maxDigits={4} {...props} />
    </>
  );
}

describe('ZiffernBlock', () => {
  it('offers 0–9 and Löschen, no comma and never a dot without allowDecimal', () => {
    render(<Harness allowDecimal={false} />);
    for (const d of '0123456789') expect(screen.getByRole('button', { name: d })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Löschen' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Komma' })).toBeNull();
    expect(screen.queryByRole('button', { name: '.' })).toBeNull();
    expect(screen.getAllByRole('button')).toHaveLength(11);
  });

  it('offers a comma with allowDecimal, still no dot', async () => {
    render(<Harness allowDecimal />);
    await userEvent.click(screen.getByRole('button', { name: '3' }));
    await userEvent.click(screen.getByRole('button', { name: 'Komma' }));
    await userEvent.click(screen.getByRole('button', { name: '5' }));
    expect(screen.getByTestId('value').textContent).toBe('3,5');
    expect(screen.queryByRole('button', { name: '.' })).toBeNull();
  });

  it('works with a hardware keyboard and ignores the dot', () => {
    render(<Harness allowDecimal />);
    for (const key of ['4', '.', ',', '2', '9', 'Backspace']) fireEvent.keyDown(window, { key });
    expect(screen.getByTestId('value').textContent).toBe('4,2');
  });

  it('does nothing while disabled', () => {
    render(
      <ZiffernBlock
        value="1"
        onChange={() => {
          throw new Error('changed');
        }}
        disabled
        {...ints}
      />,
    );
    fireEvent.keyDown(window, { key: '2' });
    expect((screen.getByRole('button', { name: '2' }) as HTMLButtonElement).disabled).toBe(true);
  });
});
