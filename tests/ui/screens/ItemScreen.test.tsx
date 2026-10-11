// @vitest-environment jsdom
import '../dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type { Correctness } from '../../../src/domain/evaluation';
import { ItemScreen } from '../../../src/ui/screens/ItemScreen';
import { singleChoice } from '../../fixtures/items';

function Harness({ onSubmit }: { onSubmit(): void }) {
  const [answer, setAnswer] = useState<unknown>(null);
  const [correct, setCorrect] = useState<Correctness | null>(null);
  return (
    <MemoryRouter>
      <ItemScreen
        item={singleChoice}
        attemptIndex={0}
        answer={answer}
        onAnswer={setAnswer}
        phase={correct === null ? 'answering' : 'feedback'}
        correct={correct}
        progress={{ current: 3, done: correct === null ? 2 : 3, total: 10 }}
        readAloud
        onSubmit={() => {
          onSubmit();
          setCorrect(false);
        }}
        onNext={() => {}}
        pauseTo="/"
      />
    </MemoryRouter>
  );
}

describe('ItemScreen', () => {
  it('shows progress, stimulus and prompt; Prüfen waits for an answer', async () => {
    const onSubmit = vi.fn();
    render(<Harness onSubmit={onSubmit} />);
    expect(screen.getByText(/3 von 10/)).toBeTruthy();
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(singleChoice.prompt);
    expect(screen.getByRole('link', { name: 'Pause' }).getAttribute('href')).toBe('/');

    const pruefen = screen.getByRole('button', { name: 'Prüfen' }) as HTMLButtonElement;
    expect(pruefen.disabled).toBe(true);
    await userEvent.click(screen.getByRole('radio', { name: '12,10 €' }));
    expect(pruefen.disabled).toBe(false);
    await userEvent.click(pruefen);
    expect(onSubmit).toHaveBeenCalledOnce();
  });

  it('replaces Prüfen with feedback and Weiter in the same band', async () => {
    const { container } = render(<Harness onSubmit={() => {}} />);
    await userEvent.click(screen.getByRole('radio', { name: '12,10 €' }));
    await userEvent.click(screen.getByRole('button', { name: 'Prüfen' }));
    expect(screen.queryByRole('button', { name: 'Prüfen' })).toBeNull();
    const band = container.querySelector('[data-region="band"]')!;
    expect(band.textContent).toContain('Noch nicht ganz.');
    expect(band.querySelector('button')!.textContent).toBe('Weiter');
    expect(container.textContent).not.toMatch(/falsch/i);
  });
});
