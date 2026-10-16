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
  it('numbers the paragraphs on the left; the title only on the reading screen', () => {
    const { rerender } = render(<TextKasten text={biberText} readAloud={false} />);
    expect(screen.queryByRole('heading')).toBeNull();
    rerender(<TextKasten text={biberText} readAloud={false} showTitle />);
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(biberText.title);
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

  it('shows a fade below while text follows and above once scrolled', () => {
    const { container } = render(<TextKasten text={biberText} readAloud={false} />);
    const region = screen.getByRole('region', { name: biberText.title });
    const fades = () =>
      [...container.querySelectorAll('[data-fade]')].map((f) => f.getAttribute('data-fade'));
    fakeScroll(region);
    const scrollTo = (top: number) => {
      region.scrollTop = top;
      act(() => void region.dispatchEvent(new Event('scroll')));
    };
    scrollTo(0);
    expect(fades()).toEqual(['below']);
    scrollTo(400);
    expect(fades()).toEqual(['above', 'below']);
    scrollTo(800);
    expect(fades()).toEqual(['above']);
    const box = container.querySelector('[data-region="text"]')!;
    expect(box.getAttribute('data-more-above')).toBe('true');
    expect(box.getAttribute('data-more-below')).toBe('false');
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
  it('shows "Lies den Text.", the whole text with its title and the yellow Weiter', async () => {
    const synth = installSpeech();
    const onNext = vi.fn();
    render(
      <MemoryRouter>
        <LeseScreen
          text={biberText}
          readAloud
          textReadAloud
          progress={{ current: 1, done: 0, total: 10 }}
          pause={{ to: '/' }}
          onNext={onNext}
        />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe('Lies den Text.');
    expect(screen.getByRole('heading', { level: 2 }).textContent).toBe(biberText.title);
    expect(screen.getAllByRole('listitem')).toHaveLength(biberText.paragraphs.length);
    // The instruction's Vorlesen reads it with the title; the box reads the text.
    const sheet = document.querySelector('[data-region="sheet"]') as HTMLElement;
    await userEvent.click(within(sheet).getByRole('button', { name: 'Vorlesen' }));
    expect(spoken(synth)).toBe(`Lies den Text. ${biberText.title}`);
    const box = document.querySelector('[data-region="text"]') as HTMLElement;
    await userEvent.click(within(box).getByRole('button', { name: 'Vorlesen' }));
    expect(spoken(synth)).toBe(textSpeech(biberText));
    expect(screen.getByText(/1 von 10/)).toBeTruthy();
    const weiter = screen.getByRole('button', { name: 'Weiter' });
    expect(weiter.className).toContain('bg-signal');
    await userEvent.click(weiter);
    expect(onNext).toHaveBeenCalledOnce();
  });
});

describe('LeseScreen without Vorlesen for the text', () => {
  it('keeps the instruction readable, but not the text', () => {
    installSpeech();
    render(
      <MemoryRouter>
        <LeseScreen text={biberText} readAloud textReadAloud={false} onNext={() => {}} />
      </MemoryRouter>,
    );
    const box = document.querySelector('[data-region="text"]') as HTMLElement;
    expect(within(box).queryByRole('button', { name: 'Vorlesen' })).toBeNull();
    expect(screen.getAllByRole('button', { name: 'Vorlesen' })).toHaveLength(1);
  });
});
