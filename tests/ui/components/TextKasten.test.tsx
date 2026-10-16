// @vitest-environment jsdom
import '../dom';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { itemSpeech, textSpeech } from '../../../src/domain/presentation';
import { TextKasten } from '../../../src/ui/components/TextKasten';
import { ItemScreen } from '../../../src/ui/screens/ItemScreen';
import { LeseScreen } from '../../../src/ui/screens/LeseScreen';
import { biberItems, biberText } from '../../fixtures/lesen';

class FakeUtterance {
  lang = '';
  rate = 1;
  onend: (() => void) | null = null;
  onerror: (() => void) | null = null;
  constructor(public text: string) {}
}

function installSpeech() {
  const synth = { speak: vi.fn(), cancel: vi.fn() };
  vi.stubGlobal('speechSynthesis', synth);
  vi.stubGlobal('SpeechSynthesisUtterance', FakeUtterance);
  return synth;
}

afterEach(() => vi.unstubAllGlobals());

const spoken = (synth: ReturnType<typeof installSpeech>) =>
  (synth.speak.mock.calls.at(-1)![0] as FakeUtterance).text;

/** jsdom has no layout: give the scroll box a height and a longer content. */
function fakeScroll(el: HTMLElement, { scrollHeight = 1000, clientHeight = 200 } = {}) {
  Object.defineProperty(el, 'scrollHeight', { configurable: true, value: scrollHeight });
  Object.defineProperty(el, 'clientHeight', { configurable: true, value: clientHeight });
}

describe('TextKasten', () => {
  it('numbers the paragraphs on the left, under the title', () => {
    render(<TextKasten text={biberText} readAloud={false} />);
    const region = screen.getByRole('region', { name: biberText.title });
    const paragraphs = within(region).getAllByRole('listitem');
    expect(paragraphs).toHaveLength(biberText.paragraphs.length);
    paragraphs.forEach((p, i) => {
      expect(p.textContent).toBe(`${i + 1}Absatz ${i + 1}: ${biberText.paragraphs[i]}`);
    });
    // The box can be scrolled with the keyboard.
    expect(region.getAttribute('tabindex')).toBe('0');
  });

  it('reads title and text with its own Vorlesen, only where the text allows it', async () => {
    const synth = installSpeech();
    const { rerender } = render(<TextKasten text={biberText} readAloud={false} />);
    expect(screen.queryByRole('button', { name: 'Vorlesen' })).toBeNull();
    rerender(<TextKasten text={biberText} readAloud />);
    await userEvent.click(screen.getByRole('button', { name: 'Vorlesen' }));
    expect(spoken(synth)).toBe(textSpeech(biberText));
    expect(spoken(synth)).toBe([biberText.title, ...biberText.paragraphs].join(' '));
  });

  it('shows the fade while text is left below, and none at the end', () => {
    const { container } = render(<TextKasten text={biberText} readAloud={false} />);
    const region = screen.getByRole('region');
    fakeScroll(region);
    region.scrollTop = 0;
    act(() => void region.dispatchEvent(new Event('scroll')));
    expect(container.querySelector('[data-fade]')).not.toBeNull();
    region.scrollTop = 800;
    act(() => void region.dispatchEvent(new Event('scroll')));
    expect(container.querySelector('[data-fade]')).toBeNull();
  });

  it('starts at the given scroll position and reports where the child scrolled to', () => {
    const onScroll = vi.fn();
    render(<TextKasten text={biberText} readAloud={false} scrollTop={120} onScroll={onScroll} />);
    const region = screen.getByRole('region');
    expect(region.scrollTop).toBe(120);
    region.scrollTop = 300;
    act(() => void region.dispatchEvent(new Event('scroll')));
    expect(onScroll).toHaveBeenLastCalledWith(300);
  });
});

describe('item with a reading text', () => {
  const item = biberItems.find((i) => i.format === 'single-choice')!;

  it("the item's Vorlesen reads stimulus, prompt and answers, never the text", async () => {
    const synth = installSpeech();
    render(
      <MemoryRouter>
        <ItemScreen
          item={item}
          attemptIndex={0}
          answer={null}
          onAnswer={() => {}}
          phase="answering"
          correct={null}
          readAloud
          onSubmit={() => {}}
          onNext={() => {}}
          text={<TextKasten text={biberText} readAloud />}
        />
      </MemoryRouter>,
    );
    const sheet = document.querySelector('[data-region="sheet"]') as HTMLElement;
    await userEvent.click(within(sheet).getByRole('button', { name: 'Vorlesen' }));
    expect(spoken(synth)).toBe(itemSpeech(item, 0));
    for (const paragraph of biberText.paragraphs) expect(spoken(synth)).not.toContain(paragraph);

    const box = document.querySelector('[data-region="text"]') as HTMLElement;
    await userEvent.click(within(box).getByRole('button', { name: 'Vorlesen' }));
    expect(spoken(synth)).toBe(textSpeech(biberText));
  });
});

describe('LeseScreen', () => {
  it('shows the whole text with Vorlesen and the yellow Weiter', async () => {
    installSpeech();
    const onNext = vi.fn();
    render(
      <MemoryRouter>
        <LeseScreen
          text={biberText}
          readAloud
          progress={{ current: 1, done: 0, total: 10 }}
          pause={{ to: '/' }}
          onNext={onNext}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: biberText.title })).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(biberText.paragraphs.length);
    expect(screen.getByRole('button', { name: 'Vorlesen' })).toBeTruthy();
    expect(screen.getByText(/1 von 10/)).toBeTruthy();
    const weiter = screen.getByRole('button', { name: 'Weiter' });
    expect(weiter.className).toContain('bg-signal');
    await userEvent.click(weiter);
    expect(onNext).toHaveBeenCalledOnce();
  });
});
