// @vitest-environment jsdom
import '../dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { FindError } from '../../../src/ui/formats/FindError';
import { probeFindError } from '../../fixtures/probe';

const item = probeFindError;
const word = (name: string | RegExp) => screen.getByRole('button', { name });

describe('FindError (probe: montag)', () => {
  it('shows the sentence as words and allows errorCount choices', async () => {
    const onChange = vi.fn();
    render(
      <FindError item={item} attemptIndex={0} answer={null} onChange={onChange} disabled={false} />,
    );
    expect(screen.getAllByRole('button').map((b) => b.textContent)).toEqual(
      item.payload.words.map((w) => w.text),
    );
    await userEvent.click(word('gehen'));
    expect(onChange).toHaveBeenLastCalledWith({ errorIds: ['w3'] });
    expect(word('montag').getAttribute('aria-disabled')).toBe('true');
    await userEvent.click(word('gehen'));
    await userEvent.click(word('montag'));
    expect(onChange).toHaveBeenLastCalledWith({ errorIds: ['w2'] });
  });

  it('after checking marks the misspelled word; the correction is the band’s job', () => {
    render(
      <FindError
        item={item}
        attemptIndex={0}
        answer={{ errorIds: ['w3'] }}
        onChange={() => {}}
        disabled
        revealed={{ correct: false, solution: item.solution }}
      />,
    );
    expect(word(/^montag\s*\(richtige Antwort\)$/)).toBeTruthy();
    expect(word(/^gehen\s*\(deine Wahl\)$/)).toBeTruthy();
    expect(screen.queryByText('Montag')).toBeNull();
  });
});
