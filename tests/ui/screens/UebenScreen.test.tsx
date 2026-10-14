// @vitest-environment jsdom
import '../dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { describe, expect, it } from 'vitest';
import { createMemoryRepositories } from '../../../src/data/memory/repos';
import type { Repositories } from '../../../src/data/repos';
import { createSessionStore } from '../../../src/data/session-store';
import { SessionStoreContext } from '../../../src/ui/session-context';
import { UebenScreen } from '../../../src/ui/screens/UebenScreen';
import { thinMatheBereich } from '../../fixtures/content-state';
import { answerFor, testDeps } from '../../data/helpers';

function renderAt(path: string, repos?: Repositories) {
  const store = createSessionStore(testDeps(repos));
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

  describe('with an open round of today', () => {
    /** Three answers in Zahlen und Rechnen, then "Pause". */
    async function openRound(): Promise<Repositories> {
      const repos = createMemoryRepositories();
      const store = createSessionStore(testDeps(repos));
      await store.getState().startPractice('mathe', 'zahlen-operationen');
      for (let i = 0; i < 3; i++) {
        store.getState().setAnswer(answerFor(store.getState().current!.item, true));
        await store.getState().submit();
        await store.getState().next();
      }
      store.getState().leave();
      return repos;
    }

    it('asks first: Fortsetzen bottom right and focused, Neu anfangen beside it', async () => {
      renderAt('/ueben/mathe/zahlen-operationen', await openRound());
      expect(
        await screen.findByRole('heading', { name: 'Hier warst du heute schon unterwegs.' }),
      ).toBeTruthy();
      expect(screen.getByText('4 von 10')).toBeTruthy();
      const band = document.querySelector('[data-region="band"]')!;
      expect([...band.children].map((c) => c.textContent)).toEqual(['Neu anfangen', 'Fortsetzen']);
      expect(document.activeElement?.textContent).toBe('Fortsetzen');
      expect(screen.getByRole('link', { name: 'Zur Karte' }).getAttribute('href')).toBe('/');
    });

    it('Fortsetzen goes on at 4 von 10', async () => {
      renderAt('/ueben/mathe/zahlen-operationen', await openRound());
      await userEvent.click(await screen.findByRole('button', { name: 'Fortsetzen' }));
      expect(await screen.findByRole('button', { name: 'Prüfen' })).toBeTruthy();
      expect(screen.getByText('4 von 10')).toBeTruthy();
    });

    it('Neu anfangen starts at 1 von 10 without asking again', async () => {
      renderAt('/ueben/mathe/zahlen-operationen', await openRound());
      await userEvent.click(await screen.findByRole('button', { name: 'Neu anfangen' }));
      expect(await screen.findByRole('button', { name: 'Prüfen' })).toBeTruthy();
      expect(screen.getByText('1 von 10')).toBeTruthy();
    });
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
