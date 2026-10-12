// @vitest-environment jsdom
import '../dom';
import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { FeedbackPanel } from '../../../src/ui/components/FeedbackPanel';
import { QUIET_FOCUS } from '../../../src/ui/focus';
import { singleChoice } from '../../fixtures/items';

const { feedback } = singleChoice;

describe('FeedbackPanel', () => {
  it('confirms a correct answer without the misconception', () => {
    render(<FeedbackPanel correct feedback={feedback} onNext={() => {}} />);
    expect(screen.getByRole('heading').textContent).toBe('Richtig.');
    expect(screen.getByText(feedback.correct.replace(/(\d) (?=\d{3})/g, '$1\u00a0'))).toBeTruthy();
    expect(screen.queryByText(feedback.misconception!)).toBeNull();
  });

  it('says "Noch nicht ganz", explains and names the misconception – never "Falsch"', () => {
    const { container } = render(
      <FeedbackPanel correct={false} feedback={feedback} onNext={() => {}} />,
    );
    expect(screen.getByRole('heading').textContent).toBe('Noch nicht ganz.');
    expect(container.textContent).toContain(feedback.incorrect);
    expect(container.textContent).toContain(feedback.misconception);
    expect(container.textContent).not.toMatch(/falsch/i);
    expect(screen.getByText(feedback.misconception!).className).toContain('text-ink-muted');
  });

  it('moves focus to "Weiter" without a ring after a tap, with one after a key press', () => {
    fireEvent.pointerDown(document.body);
    const { unmount } = render(
      <FeedbackPanel correct={false} feedback={feedback} onNext={vi.fn()} />,
    );
    const weiter = screen.getByRole('button', { name: 'Weiter' });
    expect(weiter.hasAttribute(QUIET_FOCUS)).toBe(true);
    fireEvent.keyDown(window, { key: 'Tab' });
    expect(weiter.hasAttribute(QUIET_FOCUS)).toBe(false);
    unmount();

    render(<FeedbackPanel correct={false} feedback={feedback} onNext={vi.fn()} />);
    const again = screen.getByRole('button', { name: 'Weiter' });
    expect(document.activeElement).toBe(again);
    expect(again.hasAttribute(QUIET_FOCUS)).toBe(false);
  });

  it('focuses "Weiter", which describes the message and calls onNext', async () => {
    const onNext = vi.fn();
    render(<FeedbackPanel correct={false} feedback={feedback} onNext={onNext} />);
    const weiter = screen.getByRole('button', { name: 'Weiter' });
    expect(document.activeElement).toBe(weiter);
    expect(weiter.getAttribute('aria-describedby')).toBe(screen.getByRole('status').id);
    await userEvent.click(weiter);
    expect(onNext).toHaveBeenCalledOnce();
  });

  describe('Vorlesen', () => {
    afterEach(() => vi.unstubAllGlobals());

    function installSpeech() {
      const synth = { speak: vi.fn(), cancel: vi.fn(), getVoices: () => [] };
      vi.stubGlobal('speechSynthesis', synth);
      vi.stubGlobal(
        'SpeechSynthesisUtterance',
        class {
          lang = '';
          rate = 1;
          constructor(public text: string) {}
        },
      );
      return synth;
    }

    it('reads verdict, explanation and misconception; a second tap stops', async () => {
      const synth = installSpeech();
      render(<FeedbackPanel correct={false} feedback={feedback} onNext={() => {}} />);
      await userEvent.click(screen.getByRole('button', { name: 'Vorlesen' }));
      const { text } = synth.speak.mock.calls[0]![0] as { text: string };
      expect(text).toBe(`Noch nicht ganz. ${feedback.incorrect} ${feedback.misconception}`);
      await userEvent.click(screen.getByRole('button', { name: 'Stopp' }));
      expect(synth.speak).toHaveBeenCalledOnce();
      expect(screen.getByRole('button', { name: 'Vorlesen' })).toBeTruthy();
    });

    it('reads math notation as words and skips the misconception when right', async () => {
      const synth = installSpeech();
      render(
        <FeedbackPanel
          correct
          feedback={{ correct: '6 · 40 = 240.', incorrect: 'x', misconception: 'y' }}
          onNext={() => {}}
        />,
      );
      await userEvent.click(screen.getByRole('button', { name: 'Vorlesen' }));
      expect((synth.speak.mock.calls[0]![0] as { text: string }).text).toBe(
        'Richtig. 6 mal 40 gleich 240.',
      );
    });

    it('is hidden when the learner turned reading aloud off', () => {
      installSpeech();
      render(<FeedbackPanel correct feedback={feedback} onNext={() => {}} readAloud={false} />);
      expect(screen.queryByRole('button', { name: 'Vorlesen' })).toBeNull();
    });
  });
});
