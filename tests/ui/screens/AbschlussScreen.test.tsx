// @vitest-environment jsdom
import '../dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AbschlussScreen } from '../../../src/ui/screens/AbschlussScreen';

afterEach(() => vi.unstubAllGlobals());

describe('AbschlussScreen', () => {
  it('names the Fundstücke and the Gebiet and reads the heading aloud', async () => {
    const speak = vi.fn();
    vi.stubGlobal('speechSynthesis', { speak, cancel: vi.fn(), getVoices: () => [] });
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        constructor(public text: string) {}
      },
    );
    render(
      <MemoryRouter>
        <AbschlussScreen count={10} bereich="zahlen-operationen" />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Heute geschafft: 10 Fundstücke',
    );
    expect(screen.getByText('Du warst heute im Gebiet Zahlen und Rechnen unterwegs.')).toBeTruthy();
    await userEvent.click(screen.getByRole('button', { name: 'Vorlesen' }));
    expect((speak.mock.calls[0]![0] as { text: string }).text).toBe(
      'Heute geschafft: 10 Fundstücke',
    );
  });

  it('counts like the map, in singular for one Fundstück', () => {
    render(
      <MemoryRouter>
        <AbschlussScreen count={1} bereich="zahlen-operationen" readAloud={false} />
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(
      'Heute geschafft: 1 Fundstück',
    );
  });

  it('hides Vorlesen when the learner turned it off', () => {
    vi.stubGlobal('speechSynthesis', { speak: vi.fn(), cancel: vi.fn(), getVoices: () => [] });
    render(
      <MemoryRouter>
        <AbschlussScreen count={10} bereich="zahlen-operationen" readAloud={false} />
      </MemoryRouter>,
    );
    expect(screen.queryByRole('button', { name: 'Vorlesen' })).toBeNull();
  });
});
