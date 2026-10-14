// @vitest-environment jsdom
import '../dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type { Correctness } from '../../../src/domain/evaluation';
import { ItemScreen } from '../../../src/ui/screens/ItemScreen';
import { numberInput, singleChoice } from '../../fixtures/items';

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
        pause={{ to: '/' }}
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
    expect(within(band as HTMLElement).getByRole('button', { name: 'Weiter' })).toBeTruthy();
    expect(container.textContent).not.toMatch(/falsch/i);
  });

  it('hides the digit pad after Prüfen and brings it back with the next item', () => {
    const screenFor = (item: typeof numberInput, correct: Correctness | null) => (
      <MemoryRouter>
        <ItemScreen
          item={item}
          attemptIndex={0}
          answer={correct === null ? null : { value: 7503 }}
          onAnswer={() => {}}
          phase={correct === null ? 'answering' : 'feedback'}
          correct={correct}
          progress={{ current: 3, done: 3, total: 10 }}
          readAloud
          onSubmit={() => {}}
          onNext={() => {}}
          pause={{ to: '/' }}
        />
      </MemoryRouter>
    );
    const { rerender } = render(screenFor(numberInput, false));
    expect(screen.queryByRole('group', { name: 'Ziffernblock' })).toBeNull();
    expect(screen.getByLabelText('Deine Zahl').textContent).toBe('7\u00a0503');

    rerender(screenFor({ ...numberInput, id: `${numberInput.id}-next` }, null));
    expect(screen.getByRole('group', { name: 'Ziffernblock' })).toBeTruthy();
    expect(screen.getByLabelText('Deine Zahl').textContent).toBe('');
  });

  it('asks without judging in the Einstieg: "Weiter", and "Pause" as a button', async () => {
    const onPause = vi.fn();
    const onSubmit = vi.fn();
    render(
      <MemoryRouter>
        <ItemScreen
          item={singleChoice}
          attemptIndex={0}
          answer={{ optionId: 'a' }}
          onAnswer={() => {}}
          phase="answering"
          correct={null}
          progress={{ current: 1, done: 0, total: 12 }}
          readAloud
          submitLabel="Weiter"
          onSubmit={onSubmit}
          onNext={() => {}}
          pause={{ onPause }}
        />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('button', { name: 'Prüfen' })).toBeNull();
    expect(screen.queryByRole('link', { name: 'Pause' })).toBeNull();
    await userEvent.click(screen.getByRole('button', { name: 'Pause' }));
    expect(onPause).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole('button', { name: 'Weiter' }));
    expect(onSubmit).toHaveBeenCalledOnce();
  });
});
