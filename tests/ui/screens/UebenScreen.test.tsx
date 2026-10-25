// @vitest-environment jsdom
import '../dom';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { beforeAll, describe, expect, it } from 'vitest';
import type { ContentRuntime } from '../../../src/content-runtime/loader';
import { createMemoryRepositories } from '../../../src/data/memory/repos';
import type { Repositories } from '../../../src/data/repos';
import { createSessionStore } from '../../../src/data/session-store';
import { SessionStoreContext } from '../../../src/ui/session-context';
import { UebenScreen } from '../../../src/ui/screens/UebenScreen';
import { thinMatheContent } from '../../fixtures/content';
import { answerFor, testDeps } from '../../data/helpers';
import { answerOnScreen } from '../answer-on-screen';
import { preloadFormats } from '../../../src/ui/formats/registry';

/** Prüfen, or Vergleichen for a short answer. */
const SUBMIT = /^(Prüfen|Vergleichen)$/;

function renderAt(path: string, repos?: Repositories, content?: ContentRuntime) {
  const store = createSessionStore({ ...testDeps(repos), ...(content && { content }) });
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
  // match and order are their own chunks; in jsdom they must be there before the first render.
  beforeAll(() => preloadFormats());

  // All nine formats can come up; a match item alone takes eight taps.
  it('plays 10 items and ends with the Fundstücke', { timeout: 20_000 }, async () => {
    const user = userEvent.setup();
    renderAt('/ueben/mathe/zahlen-operationen');
    for (let i = 1; i <= 10; i++) {
      await screen.findByText(new RegExp(`${i} von 10`));
      await answerOnScreen(user);
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
      // The next item may be a short answer: its button says Vergleichen.
      expect(await screen.findByRole('button', { name: SUBMIT })).toBeTruthy();
      expect(screen.getByText('4 von 10')).toBeTruthy();
    });

    it('Neu anfangen starts at 1 von 10 without asking again', async () => {
      renderAt('/ueben/mathe/zahlen-operationen', await openRound());
      await userEvent.click(await screen.findByRole('button', { name: 'Neu anfangen' }));
      expect(await screen.findByRole('button', { name: SUBMIT })).toBeTruthy();
      expect(screen.getByText('1 von 10')).toBeTruthy();
    });
  });

  it('explains when a Bereich has too few items or does not exist', async () => {
    const { content, bereich } = thinMatheContent();
    renderAt(`/ueben/mathe/${bereich}`, undefined, content);
    expect(await screen.findByText('Hier gibt es noch nicht genug Aufgaben.')).toBeTruthy();
  });

  it('rejects a Bereich under the wrong Fach', async () => {
    renderAt('/ueben/deutsch/zahlen-operationen');
    expect(await screen.findByText('Dieses Gebiet gibt es nicht.')).toBeTruthy();
  });
});
