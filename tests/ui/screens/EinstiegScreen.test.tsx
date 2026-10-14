// @vitest-environment jsdom
import '../dom';
import { act, render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { beforeAll, describe, expect, it } from 'vitest';
import { createCheckStore, type CheckStore } from '../../../src/data/check-store';
import { ensureLearner } from '../../../src/data/practice';
import { initialMastery } from '../../../src/domain/mastery';
import { CheckStoreContext } from '../../../src/ui/check-context';
import { EinstiegScreen } from '../../../src/ui/screens/EinstiegScreen';
import { answerFor, testDeps } from '../../data/helpers';
import { preloadFormats } from '../../../src/ui/formats/registry';

function renderEinstieg(store: CheckStore, fach = 'mathe') {
  return render(
    <CheckStoreContext value={store}>
      <MemoryRouter initialEntries={[`/einstieg/${fach}`]}>
        <Routes>
          <Route path="/einstieg/:fach" element={<EinstiegScreen />} />
          <Route path="/" element={<p>Karte</p>} />
        </Routes>
      </MemoryRouter>
    </CheckStoreContext>,
  );
}

/** Answers the question on screen through the store and taps "Weiter". */
async function answerAndGo(store: CheckStore, correct = true) {
  const { item } = store.getState().current!;
  act(() => store.getState().setAnswer(answerFor(item, correct)));
  await userEvent.click(screen.getByRole('button', { name: 'Weiter' }));
}

async function begin(store: CheckStore) {
  renderEinstieg(store);
  await userEvent.click(await screen.findByRole('button', { name: 'Starten' }));
}

describe('EinstiegScreen', () => {
  // match and order are their own chunks; in jsdom they must be there before the first render.
  beforeAll(() => preloadFormats());

  it('opens with the intro: two sentences, the empty way ahead, Starten', async () => {
    const store = createCheckStore(testDeps());
    const { container } = renderEinstieg(store);
    expect(
      await screen.findByRole('heading', { name: 'Wir schauen, wo deine Reise losgeht.' }),
    ).toBeTruthy();
    expect(screen.getByText('Das dauert etwa 10 Minuten.')).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Zur Karte' }).getAttribute('href')).toBe('/');
    const total = store.getState().check!.plan.total;
    expect(container.querySelectorAll('ol[aria-hidden] li')).toHaveLength(total);
    // The way ahead has no number: no "x von y" before the first question.
    expect(container.textContent).not.toMatch(/\d+ von \d+/);
    expect(container.textContent).not.toMatch(/Check|Test/);
  });

  it('asks without judging: "Weiter" instead of "Prüfen", no feedback after an answer', async () => {
    const store = createCheckStore(testDeps());
    await begin(store);
    const total = store.getState().check!.plan.total;
    expect(screen.getByText(`1 von ${total}`)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Prüfen' })).toBeNull();
    expect((screen.getByRole('button', { name: 'Weiter' }) as HTMLButtonElement).disabled).toBe(
      true,
    );
    await answerAndGo(store, false);
    expect(screen.getByText(`2 von ${total}`)).toBeTruthy();
    expect(screen.queryByText(/Richtig|Noch nicht|Falle/)).toBeNull();
  });

  it('pause asks first: Weitermachen goes back to the same question', async () => {
    const store = createCheckStore(testDeps());
    await begin(store);
    await answerAndGo(store);
    const prompt = screen.getByRole('heading', { level: 1 }).textContent;
    await userEvent.click(screen.getByRole('button', { name: 'Pause' }));

    expect(
      screen.getByRole('heading', {
        name: 'Wenn du jetzt gehst, fangen wir nächstes Mal von vorn an.',
      }),
    ).toBeTruthy();
    const band = document.querySelector('[data-region="band"]') as HTMLElement;
    // "Zur Karte" bottom left, "Weitermachen" bottom right and focused.
    expect([...band.children].map((c) => c.textContent)).toEqual(['Zur Karte', 'Weitermachen']);
    expect(document.activeElement?.textContent).toBe('Weitermachen');
    expect(screen.getByText(`2 von ${store.getState().check!.plan.total}`)).toBeTruthy();

    await userEvent.click(screen.getByRole('button', { name: 'Weitermachen' }));
    expect(screen.getByRole('heading', { level: 1 }).textContent).toBe(prompt);
  });

  it('ends with the island and the starting Etappen: no numbers, no links', async () => {
    const store = createCheckStore(testDeps());
    await begin(store);
    while (store.getState().status === 'answering') {
      await answerAndGo(store, store.getState().current!.item.bereich === 'zahlen-operationen');
    }
    expect(await screen.findByRole('heading', { name: 'Deine Reise beginnt hier' })).toBeTruthy();
    const map = screen.getAllByRole('group', { name: 'Karte' })[0]!;
    expect(within(map).queryAllByRole('link')).toEqual([]);
    expect(within(map).getByRole('img', { name: 'Zahlen und Rechnen, Niveau 3' })).toBeTruthy();
    expect(within(map).getByRole('img', { name: 'Formen und Raum, Niveau 1' })).toBeTruthy();
    // Only the Mathe island.
    expect(within(map).queryByRole('img', { name: /Sachtexte/ })).toBeNull();
    expect(document.querySelector('main')!.textContent).not.toMatch(/\d|%/);
    expect(screen.getByRole('link', { name: 'Zur Karte' }).getAttribute('href')).toBe('/');
  });

  it('says the journey has begun when the Fach already has a mastery state', async () => {
    const deps = testDeps();
    const learner = await ensureLearner(deps);
    await deps.repos.mastery.put(initialMastery(learner.id, 'raum-form', deps.now()));
    renderEinstieg(createCheckStore(deps));
    expect(
      await screen.findByRole('heading', { name: 'Deine Reise hat schon begonnen.' }),
    ).toBeTruthy();
    expect(screen.getByRole('link', { name: 'Zur Karte' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Starten' })).toBeNull();
  });

  it('says the same when the last answer finds a mastery state written meanwhile', async () => {
    const deps = testDeps();
    const store = createCheckStore(deps);
    await begin(store);
    const total = store.getState().check!.plan.total;
    for (let n = 1; n < total; n++) await answerAndGo(store);
    await deps.repos.mastery.put(
      initialMastery(store.getState().learner!.id, 'raum-form', deps.now()),
    );
    await answerAndGo(store);

    expect(
      await screen.findByRole('heading', { name: 'Deine Reise hat schon begonnen.' }),
    ).toBeTruthy();
    expect(store.getState().status).toBe('unavailable');
    expect(screen.queryByRole('heading', { name: 'Deine Reise beginnt hier' })).toBeNull();
  });

  it('has no Einstieg where too few Gebiete are open (Deutsch for now)', async () => {
    renderEinstieg(createCheckStore(testDeps()), 'deutsch');
    expect(
      await screen.findByRole('heading', { name: 'Hier gibt es noch nicht genug Aufgaben.' }),
    ).toBeTruthy();
  });
});
