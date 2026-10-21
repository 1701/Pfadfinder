// @vitest-environment jsdom
// The Probetests of one Fach (task 16): names by position, Stand, links, the empty sentence.
import '../dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { ProbetestListe, type ProbetestListEntry } from '../../../src/ui/screens/ProbetestListe';

function renderList(entries: ProbetestListEntry[], known = true) {
  const router = createMemoryRouter(
    [
      {
        path: '/probetest/mathe',
        element: <ProbetestListe fach="mathe" entries={entries} known={known} />,
      },
      { path: '/probetest/:id', element: <p>Start</p> },
      { path: '/', element: <p>Karte</p> },
    ],
    { initialEntries: ['/probetest/mathe'] },
  );
  render(<RouterProvider router={router} />);
  return router;
}

const TWO: ProbetestListEntry[] = [
  { id: 'mathe-01', number: 1, doneAt: '2026-10-21T10:00:00' },
  { id: 'mathe-03', number: 2, doneAt: null },
];

describe('ProbetestListe', () => {
  it('lists the Probetests by position with their Stand and no result', () => {
    renderList(TWO);
    expect(screen.getByRole('heading', { name: 'Probetest Mathe' })).toBeTruthy();
    const links = within(screen.getByRole('list')).getAllByRole('link');
    expect(links.map((l) => l.textContent)).toEqual([
      'Probetest Mathe 1gemacht am 21. Oktober',
      'Probetest Mathe 2noch nicht gemacht',
    ]);
    expect(links.map((l) => l.getAttribute('href'))).toEqual([
      '/probetest/mathe-01',
      '/probetest/mathe-03',
    ]);
    expect(document.body.textContent).not.toMatch(/gelöst|Zusammen|\d+ von \d+/);
    expect(screen.queryByRole('button', { name: 'Vorlesen' })).toBeNull();
  });

  it('shows names only while the Stand is not known', () => {
    renderList(TWO, false);
    expect(screen.queryByText(/gemacht/)).toBeNull();
    expect(screen.getByRole('link', { name: 'Probetest Mathe 2' })).toBeTruthy();
  });

  it('says so in one sentence when the Fach has no Probetest', () => {
    renderList([]);
    expect(screen.getByText('Hier gibt es noch keinen Probetest.')).toBeTruthy();
    expect(screen.queryByRole('list')).toBeNull();
  });

  it('opens the start page of a Probetest, "Zurück" goes to the map', async () => {
    const user = userEvent.setup();
    const router = renderList(TWO);
    await user.click(screen.getByRole('link', { name: /Probetest Mathe 2/ }));
    expect(router.state.location.pathname).toBe('/probetest/mathe-03');
    await router.navigate('/probetest/mathe');
    await user.click(await screen.findByRole('link', { name: 'Zurück' }));
    expect(router.state.location.pathname).toBe('/');
  });
});
