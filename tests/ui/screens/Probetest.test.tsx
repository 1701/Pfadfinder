// @vitest-environment jsdom
import '../dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { describe, expect, it, vi } from 'vitest';
import type { ProbetestResult } from '../../../src/domain/learner';
import { ProbetestAufgabe } from '../../../src/ui/screens/ProbetestAufgabe';
import { ProbetestAuswertung } from '../../../src/ui/screens/ProbetestAuswertung';
import { AbgebenFrage, ProbetestIntro } from '../../../src/ui/screens/ProbetestBlaetter';
import { ProbetestDurchsehen } from '../../../src/ui/screens/ProbetestDurchsehen';
import { ProbetestDurchsehenUebersicht } from '../../../src/ui/screens/ProbetestDurchsehenUebersicht';
import { Zeit } from '../../../src/ui/screens/ProbetestKopf';
import { ProbetestUebersicht } from '../../../src/ui/screens/ProbetestUebersicht';
import { FALLE_LABEL } from '../../../src/ui/text/feedback';
import { contentItem } from '../../fixtures/content-items';
import { singleChoice } from '../../fixtures/items';

const time = { minutes: 31, final: false };
const isPrimary = (el: HTMLElement) => el.className.includes('bg-signal');

describe('ProbetestUebersicht', () => {
  function renderOverview(answered: boolean[], handlers: Partial<Record<string, () => void>> = {}) {
    const onJump = vi.fn();
    render(
      <ProbetestUebersicht
        answered={answered}
        current={1}
        time={time}
        readAloud={false}
        onJump={onJump}
        onContinue={handlers.onContinue ?? (() => {})}
        onSubmit={handlers.onSubmit ?? (() => {})}
        onLeave={handlers.onLeave ?? (() => {})}
      />,
    );
    return { onJump };
  }

  it('yellow is on "Weitermachen" while items are open', () => {
    renderOverview([true, false, true]);
    expect(isPrimary(screen.getByRole('button', { name: 'Weitermachen' }))).toBe(true);
    expect(isPrimary(screen.getByRole('button', { name: 'Abgeben' }))).toBe(false);
  });

  it('yellow moves to "Abgeben" once every item is answered', () => {
    renderOverview([true, true, true]);
    expect(isPrimary(screen.getByRole('button', { name: 'Abgeben' }))).toBe(true);
    expect(isPrimary(screen.getByRole('button', { name: 'Weitermachen' }))).toBe(false);
  });

  it('shows answered and open items, marks where the child came from and jumps', async () => {
    const onContinue = vi.fn();
    const onSubmit = vi.fn();
    const { onJump } = renderOverview([true, false, true], { onContinue, onSubmit });
    expect(screen.getByRole('button', { name: 'Aufgabe 1, beantwortet' })).toBeTruthy();
    const second = screen.getByRole('button', { name: 'Aufgabe 2, offen' });
    expect(second.getAttribute('aria-current')).toBe('step');
    await userEvent.click(screen.getByRole('button', { name: 'Aufgabe 3, beantwortet' }));
    expect(onJump).toHaveBeenCalledWith(2);
    await userEvent.click(screen.getByRole('button', { name: 'Weitermachen' }));
    await userEvent.click(screen.getByRole('button', { name: 'Abgeben' }));
    expect(onContinue).toHaveBeenCalledOnce();
    expect(onSubmit).toHaveBeenCalledOnce();
  });
});

describe('the questions and the intro', () => {
  it('asks before submitting with open items; "Weitermachen" is the yellow way back', async () => {
    const onContinue = vi.fn();
    render(
      <AbgebenFrage
        open={1}
        time={time}
        readAloud={false}
        onSubmit={() => {}}
        onContinue={onContinue}
      />,
    );
    expect(screen.getByRole('heading').textContent).toBe('Noch 1 Aufgabe ist offen.');
    const weiter = screen.getByRole('button', { name: 'Weitermachen' });
    expect(isPrimary(weiter)).toBe(true);
    expect(isPrimary(screen.getByRole('button', { name: 'Abgeben' }))).toBe(false);
    await userEvent.click(weiter);
    expect(onContinue).toHaveBeenCalledOnce();
  });

  it('says "schon gemacht" and offers the last result only after a submitted run', () => {
    const { rerender } = render(
      <MemoryRouter>
        <ProbetestIntro
          doneBefore={false}
          readAloud={false}
          onStart={() => {}}
          onShowResult={() => {}}
        />
      </MemoryRouter>,
    );
    expect(screen.queryByText('Du hast diesen Probetest schon gemacht.')).toBeNull();
    expect(screen.queryByRole('button', { name: 'Auswertung ansehen' })).toBeNull();
    rerender(
      <MemoryRouter>
        <ProbetestIntro doneBefore readAloud={false} onStart={() => {}} onShowResult={() => {}} />
      </MemoryRouter>,
    );
    expect(screen.getByText('Du hast diesen Probetest schon gemacht.')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Auswertung ansehen' })).toBeTruthy();
    expect(
      screen.getByText('45 Minuten, wie in der Schule. Du kannst vor und zurück.'),
    ).toBeTruthy();
  });
});

describe('the time', () => {
  it('shows minutes, then "Noch 5 Minuten" … "Noch 1 Minute", and says the five once', () => {
    const { rerender, container } = render(<Zeit minutes={45} final={false} />);
    expect(container.textContent).toBe('45 Min.');
    rerender(<Zeit minutes={5} final />);
    expect(screen.getAllByText('Noch 5 Minuten')).toHaveLength(2); // visible + live region
    rerender(<Zeit minutes={1} final />);
    expect(screen.getByText('Noch 1 Minute')).toBeTruthy();
    expect(container.querySelector('[aria-live]')?.textContent).toBe('');
    expect(container.innerHTML).not.toMatch(/sek|:\d\d/i);
  });
});

describe('ProbetestAufgabe', () => {
  it('has no checking: "Zurück" and "Weiter", time and "7 von 24" on top', async () => {
    const onNext = vi.fn();
    render(
      <MemoryRouter>
        <ProbetestAufgabe
          item={singleChoice}
          attemptIndex={0}
          answer={null}
          onAnswer={() => {}}
          current={1}
          total={24}
          time={time}
          readAloud={false}
          onBack={() => {}}
          onNext={onNext}
          onOverview={() => {}}
        />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('button', { name: 'Prüfen' })).toBeNull();
    expect(screen.getByRole('banner').textContent).toContain('1 von 24');
    expect(screen.getByRole('banner').textContent).toContain('31 Min.');
    expect((screen.getByRole('button', { name: 'Zurück' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    // "Weiter" works without an answer, like turning a page.
    await userEvent.click(screen.getByRole('button', { name: 'Weiter' }));
    expect(onNext).toHaveBeenCalledOnce();
  });
});

describe('ProbetestDurchsehen', () => {
  const base = {
    attemptIndex: 0,
    current: 3,
    total: 24,
    readAloud: false,
    onBack: () => {},
    onNext: () => {},
    onResult: () => {},
    onOverview: () => {},
    onRate: () => {},
  };

  it('"Übersicht" top right, as in the test', async () => {
    const onOverview = vi.fn();
    render(
      <MemoryRouter>
        <ProbetestDurchsehen
          {...base}
          onOverview={onOverview}
          item={singleChoice}
          answer={{ optionId: 'a' }}
          outcome="solved"
        />
      </MemoryRouter>,
    );
    const head = screen.getByRole('banner');
    expect([...head.querySelectorAll('button')].map((b) => b.textContent)).toEqual([
      'Zur Auswertung',
      'Übersicht',
    ]);
    await userEvent.click(within(head).getByRole('button', { name: 'Übersicht' }));
    expect(onOverview).toHaveBeenCalledOnce();
  });

  it('the first waiting short answer of "1 Antwort vergleichen": "1 von 1", no "Zurück"', () => {
    render(
      <MemoryRouter>
        <ProbetestDurchsehen
          {...base}
          current={1}
          total={1}
          item={contentItem('m-gm-3-002', 'short-answer')}
          answer={{ text: 'Es gibt keine 75 Minuten.' }}
          outcome="pending"
        />
      </MemoryRouter>,
    );
    expect(screen.getByText('1 von 1')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Zurück' })).toBeNull();
    expect(isPrimary(screen.getByRole('button', { name: 'Vergleichen' }))).toBe(true);
  });

  it('an item without an answer: "Hier fehlt deine Antwort.", the explanation, no "Falle"', () => {
    const { container } = render(
      <MemoryRouter>
        <ProbetestDurchsehen {...base} item={singleChoice} answer={null} outcome="open" />
      </MemoryRouter>,
    );
    const band = container.querySelector('[data-region="band"]') as HTMLElement;
    expect(within(band).getByRole('heading').textContent).toBe('Hier fehlt deine Antwort.');
    expect(band.textContent).toContain(singleChoice.feedback.incorrect.slice(0, 20));
    expect(within(band).queryByRole('button', { name: FALLE_LABEL })).toBeNull();
    expect(within(band).getByRole('button', { name: 'Zurück' })).toBeTruthy();
  });

  it('a wrong answer: the normal band with "Falle", "Zurück" and "Weiter"', () => {
    const { container } = render(
      <MemoryRouter>
        <ProbetestDurchsehen
          {...base}
          item={singleChoice}
          answer={{ optionId: 'd' }}
          outcome="notSolved"
        />
      </MemoryRouter>,
    );
    const band = container.querySelector('[data-region="band"]') as HTMLElement;
    expect(within(band).getByRole('heading').textContent).toBe('Noch nicht ganz.');
    expect(within(band).getByRole('button', { name: FALLE_LABEL })).toBeTruthy();
    expect([...band.querySelectorAll(':scope > button')].map((b) => b.textContent)).toEqual([
      'Zurück',
      'Falle',
      'Weiter',
    ]);
  });

  it('the last item leads back to the result', () => {
    render(
      <MemoryRouter>
        <ProbetestDurchsehen
          {...base}
          current={24}
          item={singleChoice}
          answer={{ optionId: 'a' }}
          outcome="solved"
        />
      </MemoryRouter>,
    );
    expect(screen.getAllByRole('button', { name: 'Zur Auswertung' })).toHaveLength(2);
  });

  it('a waiting short answer is compared and rated here', async () => {
    const onRate = vi.fn();
    const item = contentItem('m-gm-3-002', 'short-answer');
    render(
      <MemoryRouter>
        <ProbetestDurchsehen
          {...base}
          item={item}
          answer={{ text: 'Es gibt keine 75 Minuten.' }}
          outcome="pending"
          onRate={onRate}
        />
      </MemoryRouter>,
    );
    // The answer can no longer change, only be compared.
    expect(
      (screen.getByRole('textbox', { name: 'Deine Antwort' }) as HTMLTextAreaElement).disabled,
    ).toBe(true);
    expect(screen.getByRole('button', { name: 'Zurück' })).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Vergleichen' }));
    await userEvent.click(screen.getByRole('button', { name: 'Teils' }));
    expect(onRate).toHaveBeenCalledWith(0.5);
  });
});

describe('ProbetestAuswertung', () => {
  const result: ProbetestResult = {
    byBereich: {
      'zahlen-operationen': { solved: 4, total: 6, pending: 0 },
      'groessen-messen': { solved: 4, total: 6, pending: 1 },
    },
    total: { solved: 8, total: 12, pending: 1 },
  };

  function renderResult(r: ProbetestResult, timeUp = false) {
    return render(
      <MemoryRouter>
        <ProbetestAuswertung
          result={r}
          bereiche={['zahlen-operationen', 'groessen-messen']}
          timeUp={timeUp}
          readAloud={false}
          onReview={() => {}}
          onCompare={onCompare}
        />
      </MemoryRouter>,
    );
  }
  const onCompare = vi.fn();

  it('solved of total per Bereich and together, no percent; a waiting short answer is dashed', () => {
    const { container } = renderResult(result);
    const rows = [...container.querySelectorAll('[data-bereich]')].map((r) => r.textContent);
    expect(rows).toEqual([
      'Zahlen und Rechnen4 von 6',
      'Größen und Messen4 von 6',
      'Zusammen8 von 12',
    ]);
    const gm = container.querySelector('[data-bereich="groessen-messen"]')!;
    expect(gm.querySelectorAll('[data-strich="solved"]')).toHaveLength(4);
    expect(gm.querySelectorAll('[data-strich="pending"]')).toHaveLength(1);
    expect(gm.querySelectorAll('[data-strich="open"]')).toHaveLength(1);
    expect(screen.getByText('gestrichelt: noch nicht verglichen')).toBeTruthy();
    expect(container.textContent).not.toMatch(/%|Prozent|Note/);
    expect(screen.getByRole('heading').textContent).toBe('Geschafft.');
  });

  it('after rating no line about waiting; "Die Zeit ist um." when time ended it', () => {
    const rated: ProbetestResult = {
      byBereich: { ...result.byBereich, 'groessen-messen': { solved: 5, total: 6, pending: 0 } },
      total: { solved: 9, total: 12, pending: 0 },
    };
    renderResult(rated, true);
    expect(screen.queryByText(/noch nicht verglichen/)).toBeNull();
    expect(screen.queryByRole('button', { name: /vergleichen/ })).toBeNull();
    expect(screen.getByRole('heading').textContent).toBe('Die Zeit ist um.');
    expect(screen.getByText('9 von 12')).toBeTruthy();
  });

  it('"1 Antwort vergleichen": a quiet button below the legend, "Durchsehen" stays yellow', async () => {
    renderResult(result);
    const compare = screen.getByRole('button', { name: '1 Antwort vergleichen' });
    expect(isPrimary(compare)).toBe(false);
    expect(isPrimary(screen.getByRole('button', { name: 'Durchsehen' }))).toBe(true);
    await userEvent.click(compare);
    expect(onCompare).toHaveBeenCalledOnce();
  });
});

describe('ProbetestDurchsehenUebersicht', () => {
  const outcomes = [
    'solved',
    'pending',
    'notSolved',
    'open',
    ...Array.from({ length: 20 }, () => 'solved' as const),
  ] as const;

  function renderOverview(
    handlers: Partial<Record<'onJump' | 'onContinue' | 'onResult', () => void>> = {},
  ) {
    const { container } = render(
      <ProbetestDurchsehenUebersicht
        outcomes={outcomes}
        current={1}
        readAloud={false}
        onJump={handlers.onJump ?? vi.fn()}
        onContinue={handlers.onContinue ?? vi.fn()}
        onResult={handlers.onResult ?? vi.fn()}
      />,
    );
    return container;
  }

  it('every Wegstrich: solved filled, waiting dashed, the rest empty, never "falsch"', () => {
    const container = renderOverview();
    const items = screen.getAllByRole('button', { name: /^Aufgabe / });
    expect(items).toHaveLength(24);
    expect(items.slice(0, 4).map((b) => b.getAttribute('aria-label'))).toEqual([
      'Aufgabe 1, gelöst',
      'Aufgabe 2, noch nicht verglichen',
      'Aufgabe 3',
      'Aufgabe 4',
    ]);
    expect(
      items
        .slice(0, 4)
        .map((b) => b.querySelector('[data-strich-art]')!.getAttribute('data-strich-art')),
    ).toEqual(['filled', 'dashed', 'empty', 'empty']);
    expect(items[1]!.getAttribute('aria-current')).toBe('step');
    expect(container.textContent).not.toMatch(/falsch|nicht gelöst/);
  });

  it('two legend entries only, "gelöst" and "gestrichelt: noch nicht verglichen"', () => {
    const container = renderOverview();
    const legend = container.querySelector('[data-region="answer"] p')!;
    expect(legend.textContent).toBe('gelöstgestrichelt: noch nicht verglichen');
  });

  it('a tap jumps; "Weiter durchsehen" is the yellow step back; "Zur Auswertung" top left', async () => {
    const onJump = vi.fn();
    const onContinue = vi.fn();
    const onResult = vi.fn();
    renderOverview({ onJump, onContinue, onResult });
    await userEvent.click(screen.getByRole('button', { name: 'Aufgabe 3' }));
    expect(onJump).toHaveBeenCalledWith(2);
    const next = screen.getByRole('button', { name: 'Weiter durchsehen' });
    expect(isPrimary(next)).toBe(true);
    await userEvent.click(next);
    expect(onContinue).toHaveBeenCalledOnce();
    await userEvent.click(screen.getByRole('button', { name: 'Zur Auswertung' }));
    expect(onResult).toHaveBeenCalledOnce();
  });
});
