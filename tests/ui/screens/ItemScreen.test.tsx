// @vitest-environment jsdom
import '../dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useState } from 'react';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type { Item } from '../../../src/domain/content';
import { evaluate, parseAnswer, type Correctness } from '../../../src/domain/evaluation';
import { ItemScreen } from '../../../src/ui/screens/ItemScreen';
import { numberInput, singleChoice } from '../../fixtures/items';
import { probeFindError, probeMultiChoice, probeShortAnswer } from '../../fixtures/probe';

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

  // Task F: the e2e tests find the item on screen by this attribute (currentItem), not by text.
  it('names the item and its format on the root node, while answering and after Prüfen', async () => {
    const { container } = render(<Harness onSubmit={() => {}} />);
    const root = () => container.querySelector('main')!;
    expect(root().dataset).toMatchObject({ itemId: singleChoice.id, format: 'single-choice' });
    expect(container.querySelectorAll('[data-item-id]')).toHaveLength(1);
    await userEvent.click(screen.getByRole('radio', { name: '12,10 €' }));
    await userEvent.click(screen.getByRole('button', { name: 'Prüfen' }));
    expect(root().dataset.itemId).toBe(singleChoice.id);
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

  /** Plays one item like the practice store: submit evaluates, the band shows the result. */
  function Played({ item, onSubmit = () => {} }: { item: Item; onSubmit?(answer: unknown): void }) {
    const [answer, setAnswer] = useState<unknown>(null);
    const [correct, setCorrect] = useState<Correctness | null>(null);
    return (
      <MemoryRouter>
        <ItemScreen
          item={item}
          attemptIndex={0}
          answer={answer}
          onAnswer={setAnswer}
          phase={correct === null ? 'answering' : 'feedback'}
          correct={correct}
          progress={{ current: 3, done: 2, total: 10 }}
          readAloud
          onSubmit={(given) => {
            const submitted = given ?? answer;
            onSubmit(submitted);
            const parsed = parseAnswer(item.format, submitted);
            if (parsed.success) setCorrect(evaluate(item, parsed.data).correct);
          }}
          onNext={() => {}}
          pause={{ to: '/' }}
        />
      </MemoryRouter>
    );
  }

  // iPad run (task 14): Prüfen works from the first pick, like every other format.
  // Too few or too many picks are mistakes: "Noch nicht ganz." with the explanation and the Falle.
  describe('multi-choice (two right): Prüfen from the first pick', () => {
    const item = probeMultiChoice;
    const pick = (name: string) => userEvent.click(screen.getByRole('checkbox', { name }));
    const pruefen = () => screen.getByRole('button', { name: 'Prüfen' }) as HTMLButtonElement;

    it('one of two right: Prüfen is on, the band says "Noch nicht ganz."', async () => {
      const onSubmit = vi.fn();
      render(<Played item={item} onSubmit={onSubmit} />);
      expect(pruefen().disabled).toBe(true);
      await pick('Ida hat die meisten.');
      expect(pruefen().disabled).toBe(false);
      await userEvent.click(pruefen());
      expect(onSubmit).toHaveBeenCalledWith({ optionIds: ['a'] });
      const band = document.querySelector('[data-region="band"]') as HTMLElement;
      expect(band.textContent).toContain('Noch nicht ganz.');
      expect(band.textContent).toContain(item.feedback.incorrect);
      expect(within(band).getByRole('button', { name: 'Falle zeigen' })).toBeTruthy();
    });

    it('one too many: all three can be picked, the band says "Noch nicht ganz."', async () => {
      const onSubmit = vi.fn();
      render(<Played item={item} onSubmit={onSubmit} />);
      await pick('Ida hat die meisten.');
      await pick('Tom hat die wenigsten.');
      await pick('Lena hat mehr als Ida.');
      await userEvent.click(pruefen());
      expect(onSubmit).toHaveBeenCalledWith({ optionIds: ['a', 'b', 'c'] });
      const band = document.querySelector('[data-region="band"]') as HTMLElement;
      expect(band.textContent).toContain('Noch nicht ganz.');
      expect(band.textContent).not.toContain('Richtig.');
    });
  });

  describe('short-answer: compare, then rate yourself', () => {
    const item = probeShortAnswer;

    async function compare() {
      const onSubmit = vi.fn();
      const { container } = render(<Played item={item} onSubmit={onSubmit} />);
      const vergleichen = screen.getByRole('button', { name: 'Vergleichen' }) as HTMLButtonElement;
      expect(screen.queryByRole('button', { name: 'Prüfen' })).toBeNull();
      expect(vergleichen.disabled).toBe(true);
      await userEvent.type(screen.getByRole('textbox', { name: 'Deine Antwort' }), '4 blau, 2 rot');
      await userEvent.click(vergleichen);
      return { onSubmit, band: container.querySelector('[data-region="band"]') as HTMLElement };
    }

    it('"Vergleichen" shows the model answer and asks; nothing is submitted yet', async () => {
      const { onSubmit, band } = await compare();
      expect(onSubmit).not.toHaveBeenCalled();
      expect(screen.getByRole('heading', { name: 'So könnte es aussehen:' })).toBeTruthy();
      expect(screen.getByText('4 blau, 2 rot')).toBeTruthy();
      expect(within(band).getByRole('heading', { name: 'Hast du es getroffen?' })).toBeTruthy();
      expect([...band.querySelectorAll(':scope > button')].map((b) => b.textContent)).toEqual([
        'Getroffen',
        'Teils',
        'Noch nicht',
      ]);
    });

    it('the band lays out by its own width (size container), the focus waits on the question', async () => {
      const { band } = await compare();
      // Beside a reading text the band is narrow in landscape too (iPad finding 2026-10-19).
      expect(band.parentElement?.className).toContain('@container');
      expect(document.activeElement).toBe(
        within(band).getByRole('heading', { name: 'Hast du es getroffen?' }),
      );
    });

    it('"Teils" submits 0.5; the band explains without a verdict and offers the Falle', async () => {
      const { onSubmit, band } = await compare();
      await userEvent.click(within(band).getByRole('button', { name: 'Teils' }));
      expect(onSubmit).toHaveBeenCalledWith({ text: '4 blau, 2 rot', rating: 0.5 });
      const feedback = document.querySelector('[data-region="band"]') as HTMLElement;
      expect(feedback.textContent).not.toMatch(/Richtig\.|Noch nicht ganz\./);
      expect(feedback.textContent).toContain(item.feedback.incorrect);
      expect(within(feedback).getByRole('button', { name: 'Falle zeigen' })).toBeTruthy();
      expect(screen.getByRole('heading', { name: 'So könnte es aussehen:' })).toBeTruthy();
    });

    it('"Getroffen" submits 1 and shows the confirming text, no Falle', async () => {
      const { onSubmit, band } = await compare();
      await userEvent.click(within(band).getByRole('button', { name: 'Getroffen' }));
      expect(onSubmit).toHaveBeenCalledWith({ text: '4 blau, 2 rot', rating: 1 });
      const feedback = document.querySelector('[data-region="band"]') as HTMLElement;
      expect(feedback.textContent).not.toMatch(/Richtig\./);
      expect(feedback.textContent).toContain(item.feedback.correct);
      expect(within(feedback).queryByRole('button', { name: 'Falle zeigen' })).toBeNull();
    });
  });

  describe('find-error: the band names the correct spelling', () => {
    const item = probeFindError;

    it.each([
      ['montag', 'Richtig.'],
      ['gehen', 'Noch nicht ganz.'],
    ])('after choosing "%s": %s and "So schreibt man es: Montag"', async (word, verdict) => {
      render(<Played item={item} />);
      await userEvent.click(screen.getByRole('button', { name: word }));
      await userEvent.click(screen.getByRole('button', { name: 'Prüfen' }));
      const band = document.querySelector('[data-region="band"]') as HTMLElement;
      expect(band.textContent).toContain(verdict);
      expect(band.textContent).toContain('So schreibt man es: Montag');
    });
  });

  it('takes another header and, while answering, other band buttons (Probetest)', () => {
    const { container } = render(
      <MemoryRouter>
        <ItemScreen
          item={probeShortAnswer}
          attemptIndex={0}
          answer={{ text: 'Weil' }}
          onAnswer={() => {}}
          phase="answering"
          correct={null}
          readAloud
          onSubmit={() => {}}
          onNext={() => {}}
          header={<header>7 von 24</header>}
          actions={
            <>
              <button type="button">Zurück</button>
              <button type="button">Weiter</button>
            </>
          }
        />
      </MemoryRouter>,
    );
    expect(container.querySelector('header')?.textContent).toBe('7 von 24');
    expect(screen.queryByText('Pause')).toBeNull();
    const band = container.querySelector('[data-region="band"]') as HTMLElement;
    expect([...band.querySelectorAll('button')].map((b) => b.textContent)).toEqual([
      'Zurück',
      'Weiter',
    ]);
    // A short answer is only typed in: no "Vergleichen".
    expect(screen.queryByRole('button', { name: 'Vergleichen' })).toBeNull();
  });
});
