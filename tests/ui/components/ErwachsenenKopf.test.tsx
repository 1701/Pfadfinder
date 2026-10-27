// @vitest-environment jsdom
import '../dom';
import { cleanup, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { describe, expect, it } from 'vitest';
import { ErwachsenenKopf, type ErwachsenenSeite } from '../../../src/ui/components/ErwachsenenKopf';

const ALL = [
  ['Eltern', '/eltern'],
  ['So geht’s', '/so-gehts'],
  ['Impressum', '/impressum'],
  ['Datenschutz', '/datenschutz'],
  ['Sicherung und Gerät', '/eltern/geraet'],
] as const;

/** The page with its Kopf; one entry before it, so a history back would land elsewhere. */
function renderAt(page: ErwachsenenSeite) {
  render(
    <MemoryRouter initialEntries={['/vorher', page]} initialIndex={1}>
      <Routes>
        <Route path="/" element={<h1>Karte</h1>} />
        <Route path="/vorher" element={<h1>Vorher</h1>} />
        {ALL.map(([, to]) => (
          <Route
            key={to}
            path={to}
            element={
              <>
                <ErwachsenenKopf page={to} />
                <h1>{to}</h1>
              </>
            }
          />
        ))}
      </Routes>
    </MemoryRouter>,
  );
}

describe('ErwachsenenKopf', () => {
  it.each(ALL)('on %s links the other four pages in a fixed order', (_, page) => {
    renderAt(page);
    const kopf = document.querySelector('[data-region="kopf"]') as HTMLElement;
    const nav = within(kopf).getByRole('navigation', { name: 'Seiten für Erwachsene' });
    expect(
      within(nav)
        .getAllByRole('link')
        .map((a) => [a.textContent, a.getAttribute('href')]),
    ).toEqual(ALL.filter(([, to]) => to !== page));
    // "Zurück" first, then the links: one top line, nothing else in it.
    expect(within(kopf).getAllByRole('link')[0]!.textContent).toBe('Zurück');
  });

  it.each(ALL.filter(([, to]) => to !== '/eltern/geraet'))(
    'on %s "Zurück" leads to the map, not back in the history',
    async (_, page) => {
      renderAt(page);
      await userEvent.click(screen.getByRole('link', { name: 'Zurück' }));
      expect(screen.getByRole('heading', { name: 'Karte' })).toBeTruthy();
      cleanup();
    },
  );

  it('on the device area "Zurück" leads to /eltern', async () => {
    renderAt('/eltern/geraet');
    expect(screen.getByRole('link', { name: 'Zurück' }).getAttribute('href')).toBe('/eltern');
    await userEvent.click(screen.getByRole('link', { name: 'Zurück' }));
    expect(screen.getByRole('heading', { name: '/eltern' })).toBeTruthy();
  });
});
