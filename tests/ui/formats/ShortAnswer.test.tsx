// @vitest-environment jsdom
import '../dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ShortAnswer } from '../../../src/ui/formats/ShortAnswer';
import { probeShortAnswer } from '../../fixtures/probe';

const item = probeShortAnswer;

describe('ShortAnswer (probe: maxChars 80, a tip, 3 key points)', () => {
  it('reports the text, nothing for blanks, and counts up to maxChars', async () => {
    const onChange = vi.fn();
    render(
      <ShortAnswer
        item={item}
        attemptIndex={0}
        answer={null}
        onChange={onChange}
        disabled={false}
      />,
    );
    const field = screen.getByRole('textbox', { name: 'Deine Antwort' }) as HTMLTextAreaElement;
    expect(field.maxLength).toBe(item.payload.maxChars);
    await userEvent.type(field, '  ');
    expect(onChange).toHaveBeenLastCalledWith(null);
    await userEvent.type(field, '4 blau');
    expect(onChange).toHaveBeenLastCalledWith({ text: '  4 blau' });
    expect(screen.getByText(`8 von ${item.payload.maxChars} Zeichen`)).toBeTruthy();
  });

  // iPad finding (task 14): the return key closes the keyboard, it starts no new line.
  it('Enter says "done": no new line, the keyboard closes (the field loses focus)', async () => {
    const onChange = vi.fn();
    render(
      <ShortAnswer
        item={item}
        attemptIndex={0}
        answer={null}
        onChange={onChange}
        disabled={false}
      />,
    );
    const field = screen.getByRole('textbox', { name: 'Deine Antwort' }) as HTMLTextAreaElement;
    expect(field.getAttribute('enterkeyhint')).toBe('done');
    await userEvent.type(field, '4 blau{Enter}');
    expect(field.value).toBe('4 blau');
    expect(document.activeElement).not.toBe(field);
    expect(onChange).toHaveBeenLastCalledWith({ text: '4 blau' });
  });

  it('shows the tip as a line while writing, not as a placeholder', () => {
    render(
      <ShortAnswer
        item={item}
        attemptIndex={0}
        answer={null}
        onChange={() => {}}
        disabled={false}
      />,
    );
    expect(screen.getByText(/^Tipp:/).textContent).toContain(item.payload.hint);
    expect(screen.getByRole('textbox').getAttribute('placeholder')).toBeNull();
  });

  it('compares: the child’s text, the model answer and the key points, no field, no tip', () => {
    render(
      <ShortAnswer
        item={item}
        attemptIndex={0}
        answer={{ text: '3 blau und 3 rot' }}
        onChange={() => {}}
        disabled
        showSolution
      />,
    );
    expect(screen.queryByRole('textbox')).toBeNull();
    expect(screen.queryByText(/^Tipp:/)).toBeNull();
    expect(screen.getByText('3 blau und 3 rot')).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'So könnte es aussehen:' })).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(item.solution.keyPoints.length);
  });
});
