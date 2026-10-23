// @vitest-environment jsdom
import '../dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { VorlesenButton } from '../../../src/ui/components/VorlesenButton';

class FakeUtterance {
  lang = '';
  rate = 1;
  voice: unknown = null;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public text: string) {}
}

function installSpeech() {
  const synth = {
    speak: vi.fn(),
    cancel: vi.fn(),
    getVoices: vi.fn(() => [{ lang: 'en-US' }, { lang: 'de-DE', name: 'Helena' }]),
  };
  vi.stubGlobal('speechSynthesis', synth);
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
  return synth;
}

afterEach(() => vi.unstubAllGlobals());

describe('VorlesenButton', () => {
  it('is hidden when the browser cannot speak', () => {
    const { container } = render(<VorlesenButton text="Rechne aus." />);
    expect(container.innerHTML).toBe('');
  });

  it('reads the text in German and stops on a second tap', async () => {
    const synth = installSpeech();
    render(<VorlesenButton text="Rechne aus: 4735 plus 2868" />);
    const button = screen.getByRole('button', { name: 'Vorlesen' });
    await userEvent.click(button);
    const utterance = synth.speak.mock.calls[0]![0] as FakeUtterance;
    expect(utterance.text).toBe('Rechne aus: 4735 plus 2868');
    expect(utterance.lang).toBe('de-DE');
    expect(utterance.rate).toBe(0.9);
    expect(button.getAttribute('aria-pressed')).toBe('true');

    await userEvent.click(screen.getByRole('button', { name: 'Stopp' }));
    expect(synth.speak).toHaveBeenCalledOnce();
    expect(screen.getByRole('button', { name: 'Vorlesen' }).getAttribute('aria-pressed')).toBe(
      'false',
    );
  });

  it('sets no voice: the device uses its own German default (iOS Bedienungshilfen)', async () => {
    const synth = installSpeech();
    render(<VorlesenButton text="Hallo" />);
    await userEvent.click(screen.getByRole('button', { name: 'Vorlesen' }));
    const utterance = synth.speak.mock.calls[0]![0] as FakeUtterance;
    expect(utterance.voice).toBeNull();
    expect(synth.getVoices).not.toHaveBeenCalled();
  });

  it('stops reading when the screen goes away', () => {
    const synth = installSpeech();
    const { unmount } = render(<VorlesenButton text="Hallo" />);
    unmount();
    expect(synth.cancel).toHaveBeenCalled();
  });
});
