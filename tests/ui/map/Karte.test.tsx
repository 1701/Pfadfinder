// @vitest-environment jsdom
import '../dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { describe, expect, it } from 'vitest';
import type { Bereich } from '../../../src/domain/content';
import type { RegionState } from '../../../src/domain/progress';
import { Karte } from '../../../src/ui/map/Karte';
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

/** Etappen marks of a Gebiet: "reached" (ink) or "open", plus a ring on the current niveau. */
const marks = (gebiet: Element) =>
  [...gebiet.querySelectorAll('[data-etappe]')].map(
    (mark) =>
      (mark.querySelector('rect')!.getAttribute('class') === 'fill-ink stroke-ink'
        ? 'reached'
        : 'open') + (mark.querySelector('[data-current]') ? '+here' : ''),
  );

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
      'Schreibtricks, Niveau 1',
    ]);
    expect(links.map((l) => l.getAttribute('href'))).toEqual([
      '/ueben/mathe/zahlen-operationen',
      '/ueben/mathe/raum-form',
      '/ueben/mathe/groessen-messen',
      '/ueben/deutsch/rs-strategien',
    ]);
  });

  it('shows each visible name whole at the start of its accessible name (WCAG 2.5.3)', () => {
    renderMap();
    for (const link of within(wide()).getAllByRole('link')) {
      const visible = link.querySelector('text')!.textContent!;
      expect(link.getAttribute('aria-label')!.startsWith(`${visible},`), visible).toBe(true);
    }
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
    expect(marks(zo)).toEqual(['reached', 'open+here', 'open']);

    // A new Gebiet: nothing filled, the first Etappe outlined.
    const neu = within(wide()).getByRole('link', { name: 'Größen und Messen, Niveau 1' });
    expect(
      [...neu.querySelectorAll(':scope > polygon')].slice(0, 3).map((p) => p.getAttribute('class')),
    ).toEqual(['fill-surface', 'fill-surface', 'fill-surface']);
    expect(marks(neu)).toEqual(['open+here', 'open', 'open']);
    // Sank back to niveau 1: reached Etappen stay filled, and the ring still shows where the
    // child is – filled and outlined at once.
    const rs = within(wide()).getByRole('link', { name: 'Schreibtricks, Niveau 1' });
    expect(marks(rs)).toEqual(['reached+here', 'reached', 'open']);
    // Mastered: all reached, the ring stays on the current niveau.
    const rf = within(wide()).getByRole('link', { name: 'Formen und Raum, Niveau 3, gemeistert' });
    expect(marks(rf)).toEqual(['reached', 'reached', 'reached+here']);
  });

  it('sets each name on a sign in the plateau color, without a halo', () => {
    renderMap();
    const zo = within(wide()).getByRole('link', { name: 'Zahlen und Rechnen, Niveau 2' });
    expect(zo.querySelector('[data-plate]')!.getAttribute('class')).toBe('fill-surface');
    const rf = within(wide()).getByRole('link', { name: 'Formen und Raum, Niveau 3, gemeistert' });
    expect(rf.querySelector('[data-plate]')!.getAttribute('class')).toBe('fill-land');
    // Blank spots have no contour lines, so their names need no sign.
    const blank = within(wide()).getByRole('img', { name: 'Daten und Zufall, noch unerforscht' });
    expect(blank.querySelector('[data-plate]')).toBeNull();
    for (const text of wide().querySelectorAll('text')) {
      expect(text.getAttribute('paint-order')).toBeNull();
      expect(text.getAttribute('stroke-width')).toBeNull();
    }
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

  it('names a dashed Gebiet "noch unerforscht"; no legend on the map (task 11)', () => {
    renderMap();
    const map = wide();
    expect(
      within(map)
        .getAllByRole('img')
        .map((g) => g.getAttribute('aria-label')),
    ).toEqual([
      'Daten und Zufall, noch unerforscht',
      'Muster und Zahlenfolgen, noch unerforscht',
      'Sachtexte lesen, noch unerforscht',
      'Geschichten lesen, noch unerforscht',
      'Laute und Buchstaben, noch unerforscht',
    ]);
    expect(screen.queryByText(/Gestrichelt/)).toBeNull();
  });
});

describe('one island as a picture (Einstieg result)', () => {
  it('draws only the Fach, cut to its size, with Gebiete as pictures instead of links', () => {
    render(
      <MemoryRouter>
        <Karte states={STATES} fach="mathe" interactive={false} />
      </MemoryRouter>,
    );
    const map = wide();
    expect(map.getAttribute('viewBox')).not.toBe('0 0 1000 600');
    expect(within(map).queryAllByRole('link')).toEqual([]);
    expect(
      within(map)
        .getAllByRole('img')
        .map((g) => g.getAttribute('aria-label')),
    ).toEqual([
      'Zahlen und Rechnen, Niveau 2',
      'Formen und Raum, Niveau 3, gemeistert',
      'Größen und Messen, Niveau 1',
      'Daten und Zufall, noch unerforscht',
      'Muster und Zahlenfolgen, noch unerforscht',
    ]);
    expect(map.textContent).toContain('Mathe');
    expect(map.textContent).not.toContain('Deutsch');
  });
});

describe('Tagesziel', () => {
  it('shows today with the Wegstriche, no number above the goal and no animation', () => {
    renderMap();
    expect(screen.getByText('Heute: 4 von 10 Fundstücken')).toBeTruthy();
    const dashes = [...document.querySelectorAll('header li')].map((li) => li.className);
    expect(dashes.filter((c) => c.includes('bg-ink'))).toHaveLength(4);
    expect(dashes[4]).toContain('outline-ink');
    expect(dashes[4]).toContain('bg-line');
  });

  it('is calm when reached: all dashes walked, "Geschafft."', () => {
    renderMap(STATES, { count: 10, goal: 10, reached: true });
    expect(screen.getByText('Heute: 10 von 10 Fundstücken. Geschafft.')).toBeTruthy();
    const dashes = [...document.querySelectorAll('header li')].map((li) => li.className);
    expect(dashes.every((c) => c.includes('border-ink bg-ink'))).toBe(true);
    expect(dashes.some((c) => c.includes('outline'))).toBe(false);
    expect(document.querySelector('header [class*="animate"]')).toBeNull();
  });
});
