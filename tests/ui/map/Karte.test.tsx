// @vitest-environment jsdom
import '../dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import { BEREICHE, type Bereich } from '../../../src/domain/content';
import type { RegionState } from '../../../src/domain/progress';
import { KartenView } from '../../../src/ui/map/KartenView';

const STATES: Record<Bereich, RegionState> = {
  'zahlen-operationen': { kind: 'unterwegs', niveau: 2, erschlossen: [true, false, false] },
  'raum-form': { kind: 'gemeistert', niveau: 3, erschlossen: [true, true, true] },
  'groessen-messen': { kind: 'neu', niveau: 1, erschlossen: [false, false, false] },
  'daten-zufall': { kind: 'unerforscht' },
  'muster-strukturen': { kind: 'unerforscht' },
  'lesen-sachtext': { kind: 'unerforscht' },
  'lesen-literarisch': { kind: 'unerforscht' },
  'rs-laut-buchstabe': { kind: 'unerforscht' },
  'rs-strategien': { kind: 'unterwegs', niveau: 1, erschlossen: [true, true, false] },
};
const TODAY = { count: 4, goal: 10, reached: false };

function Where() {
  return <p data-testid="where">{useLocation().pathname}</p>;
}

function renderMap(states = STATES, today = TODAY) {
  return render(
    <MemoryRouter>
      <Routes>
        <Route path="/" element={<KartenView progress={{ states, today }} />} />
        <Route path="*" element={<Where />} />
      </Routes>
    </MemoryRouter>,
  );
}

/** jsdom ignores the orientation CSS: both layouts are in the DOM, so use the first map. */
const wide = () => screen.getAllByRole('group', { name: 'Karte' })[0]!;

describe('Karte', () => {
  it('makes every open Gebiet a link named with its niveau', () => {
    renderMap();
    const links = within(wide()).getAllByRole('link');
    expect(links.map((l) => l.getAttribute('aria-label'))).toEqual([
      'Zahlen und Rechnen, Niveau 2',
      'Formen und Raum, Niveau 3, gemeistert',
      'Größen und Messen, Niveau 1',
      'Rechtschreib-Tricks, Niveau 1',
    ]);
    expect(links.map((l) => l.getAttribute('href'))).toEqual([
      '/ueben/mathe/zahlen-operationen',
      '/ueben/mathe/raum-form',
      '/ueben/mathe/groessen-messen',
      '/ueben/deutsch/rs-strategien',
    ]);
  });

  it('shows unexplored Gebiete without a link and without a tab stop', () => {
    renderMap();
    const blank = within(wide()).getByRole('img', { name: 'Daten und Zufall, noch unerforscht' });
    expect(blank.closest('a')).toBeNull();
    expect(blank.querySelector('[tabindex]')).toBeNull();
    expect(within(wide()).getAllByRole('img')).toHaveLength(5);
  });

  it('fills reached Etappen, lightens the current one, and marks them with Wegstriche', () => {
    renderMap();
    const zo = within(wide()).getByRole('link', { name: 'Zahlen und Rechnen, Niveau 2' });
    const stufen = [...zo.querySelectorAll(':scope > polygon')].slice(0, 3);
    expect(stufen.map((p) => p.getAttribute('class'))).toEqual([
      'fill-land',
      'fill-land-soft',
      'fill-surface',
    ]);
    const marks = [...zo.querySelectorAll('rect')].map((r) => r.getAttribute('class'));
    expect(marks).toEqual([
      'fill-ink stroke-ink',
      'fill-surface stroke-ink',
      'fill-line stroke-line',
    ]);

    // A new Gebiet: nothing filled, the first Etappe outlined.
    const neu = within(wide()).getByRole('link', { name: 'Größen und Messen, Niveau 1' });
    expect(
      [...neu.querySelectorAll(':scope > polygon')].slice(0, 3).map((p) => p.getAttribute('class')),
    ).toEqual(['fill-surface', 'fill-surface', 'fill-surface']);
    // Sank back to niveau 1: reached Etappen stay filled.
    const rs = within(wide()).getByRole('link', { name: 'Rechtschreib-Tricks, Niveau 1' });
    expect([...rs.querySelectorAll('rect')].map((r) => r.getAttribute('class'))).toEqual([
      'fill-ink stroke-ink',
      'fill-ink stroke-ink',
      'fill-line stroke-line',
    ]);
  });

  it('tabs through the Gebiete island by island in reading order', async () => {
    renderMap();
    const order = within(wide())
      .getAllByRole('link')
      .map((l) => l.getAttribute('aria-label'));
    const user = userEvent.setup();
    const reached: (string | null)[] = [];
    // Vorlesen comes first where the browser can speak (not in jsdom).
    for (let i = 0; i <= order.length; i++) {
      await user.tab();
      reached.push(document.activeElement?.getAttribute('aria-label') ?? null);
    }
    // jsdom ignores the orientation CSS, so the tall layout follows; the browser hides it.
    expect(reached.filter((l) => order.includes(l)).slice(0, order.length)).toEqual(order);
  });

  it('opens the Gebiet in the app on a tap', async () => {
    renderMap();
    await userEvent.click(
      within(wide()).getByRole('link', { name: 'Formen und Raum, Niveau 3, gemeistert' }),
    );
    expect(screen.getByTestId('where').textContent).toBe('/ueben/mathe/raum-form');
  });

  it('explains the dashed outline once, and not at all when nothing is unexplored', () => {
    const { unmount } = renderMap();
    expect(screen.getAllByText('Gestrichelte Gebiete sind noch unerforscht.')).toHaveLength(1);
    expect(screen.queryByText(/noch unerforscht/)).not.toBeNull();
    unmount();
    const open = {} as Record<Bereich, RegionState>;
    for (const b of BEREICHE)
      open[b] = { kind: 'neu', niveau: 1, erschlossen: [false, false, false] };
    renderMap(open);
    expect(screen.queryByText('Gestrichelte Gebiete sind noch unerforscht.')).toBeNull();
  });
});

describe('Tagesziel', () => {
  it('shows today with the Wegstriche, no number above the goal and no animation', () => {
    renderMap();
    expect(screen.getByText('Heute: 4 von 10 Fundstücken')).toBeTruthy();
    const dashes = [...document.querySelectorAll('header li')].map((li) => li.className);
    expect(dashes.filter((c) => c.includes('bg-ink'))).toHaveLength(4);
    expect(dashes[4]).toContain('border-ink bg-surface');
  });

  it('is calm when reached: all dashes walked, "Geschafft."', () => {
    renderMap(STATES, { count: 10, goal: 10, reached: true });
    expect(screen.getByText('Heute: 10 von 10 Fundstücken. Geschafft.')).toBeTruthy();
    const dashes = [...document.querySelectorAll('header li')].map((li) => li.className);
    expect(dashes.every((c) => c.includes('border-ink bg-ink'))).toBe(true);
    expect(document.querySelector('header [class*="animate"]')).toBeNull();
  });
});
