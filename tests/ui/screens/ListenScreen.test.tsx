// @vitest-environment jsdom
import '../dom';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import type { Bereich } from '../../../src/domain/content';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ListenScreen } from '../../../src/ui/screens/ListenScreen';

function renderWith(bereiche: Bereich[]) {
  render(
    <MemoryRouter>
      <ListenScreen bereiche={bereiche} />
    </MemoryRouter>,
  );
}

describe('ListenScreen', () => {
  it('lists the practiceable Bereiche by Fach with child-friendly names', async () => {
    renderWith(['zahlen-operationen', 'rs-strategien']);
    const link = await screen.findByRole('link', { name: 'Zahlen und Rechnen' });
    expect(link.getAttribute('href')).toBe('/ueben/mathe/zahlen-operationen');
    expect(screen.getByRole('link', { name: 'Schreibtricks' }).getAttribute('href')).toBe(
      '/ueben/deutsch/rs-strategien',
    );
    expect(screen.getAllByRole('heading', { level: 2 }).map((h) => h.textContent)).toEqual([
      'Mathe',
      'Deutsch',
    ]);
  });

  it('hides a Fach without Bereiche', async () => {
    renderWith(['zahlen-operationen']);
    await screen.findByRole('link', { name: 'Zahlen und Rechnen' });
    expect(screen.queryByRole('heading', { name: 'Deutsch' })).toBeNull();
  });

  it('reads the heading aloud', async () => {
    const speak = vi.fn();
    vi.stubGlobal('speechSynthesis', { speak, cancel: vi.fn(), getVoices: () => [] });
    vi.stubGlobal(
      'SpeechSynthesisUtterance',
      class {
        constructor(public text: string) {}
      },
    );
    renderWith(['zahlen-operationen']);
    (await screen.findByRole('button', { name: 'Vorlesen' })).click();
    expect((speak.mock.calls[0]![0] as { text: string }).text).toBe('Wohin geht’s heute?');
  });

  afterEach(() => vi.unstubAllGlobals());
});
