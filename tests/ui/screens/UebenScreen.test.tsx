// @vitest-environment jsdom
import '../dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { createSessionStore } from '../../../src/data/session-store';
import { SessionStoreContext } from '../../../src/ui/session-context';
import { UebenScreen } from '../../../src/ui/screens/UebenScreen';
import { thinMatheBereich } from '../../fixtures/content-state';
import { testDeps } from '../../data/helpers';

function renderAt(path: string) {
  const store = createSessionStore(testDeps());
  const router = createMemoryRouter(
    [
      { path: '/', element: <p>Übersicht</p> },
      { path: '/ueben/:fach/:bereich', Component: UebenScreen },
    ],
    { initialEntries: [path] },
  );
  render(
    <SessionStoreContext value={store}>
      <RouterProvider router={router} />
    </SessionStoreContext>,
  );
  return store;
}

describe('UebenScreen', () => {
  it('plays 10 items and ends with the Fundstücke', async () => {
    const user = userEvent.setup();
    renderAt('/ueben/mathe/zahlen-operationen');
    for (let i = 1; i <= 10; i++) {
      await screen.findByText(new RegExp(`${i} von 10`));
      const radios = screen.queryAllByRole('radio');
      if (radios.length > 0) await user.click(radios[0]!);
      else await user.click(screen.getByRole('button', { name: '1' }));
      await user.click(screen.getByRole('button', { name: 'Prüfen' }));
      await user.click(await screen.findByRole('button', { name: 'Weiter' }));
    }
    expect((await screen.findByRole('heading', { level: 1 })).textContent).toBe(
      'Heute geschafft: 10 Fundstücke',
    );
    expect(screen.getByText('Du warst heute im Gebiet Zahlen und Rechnen unterwegs.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Zur Übersicht' }).getAttribute('href')).toBe('/');
  });

  it('explains when a Bereich has too few items or does not exist', async () => {
    renderAt(`/ueben/mathe/${thinMatheBereich()}`);
    expect(await screen.findByText('Hier gibt es noch nicht genug Aufgaben.')).toBeTruthy();
  });

  it('rejects a Bereich under the wrong Fach', async () => {
    renderAt('/ueben/deutsch/zahlen-operationen');
    expect(await screen.findByText('Dieses Gebiet gibt es nicht.')).toBeTruthy();
  });
});
