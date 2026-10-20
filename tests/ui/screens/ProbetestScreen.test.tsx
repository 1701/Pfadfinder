// @vitest-environment jsdom
// The Deutsch Probetest over the fixture deutsch-90: the text box never reads aloud (task 13).
import '../dom';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { RouterProvider, createMemoryRouter } from 'react-router';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createContentLoader } from '../../../src/content-runtime/loader';
import { createMemoryRepositories } from '../../../src/data/memory/repos';
import { createProbetestStore, type ProbetestStore } from '../../../src/data/probetest-store';
import { preloadFormats } from '../../../src/ui/formats/registry';
import { ProbetestStoreContext } from '../../../src/ui/probetest-context';
import { ProbetestScreen } from '../../../src/ui/screens/ProbetestScreen';
import { probetestContentModules } from '../../fixtures/lesen';

let lastId = 0;

function renderProbetest(): ProbetestStore {
  const store = createProbetestStore({
    repos: createMemoryRepositories(),
    content: createContentLoader(probetestContentModules()),
    now: () => new Date().toISOString(),
    newId: () => `id-${++lastId}`,
  });
  const router = createMemoryRouter([{ path: '/probetest/:id', Component: ProbetestScreen }], {
    initialEntries: ['/probetest/deutsch-90'],
  });
  render(
    <ProbetestStoreContext value={store}>
      <RouterProvider router={router} />
    </ProbetestStoreContext>,
  );
  return store;
}

describe('ProbetestScreen – Deutsch with reading texts', () => {
  beforeAll(() => preloadFormats());
  beforeEach(() => {
    vi.stubGlobal('speechSynthesis', { speak: vi.fn(), cancel: vi.fn(), getVoices: () => [] });
  });
  afterEach(() => vi.unstubAllGlobals());

  it('the text box beside a reading item has no Vorlesen, a spelling item keeps its own', async () => {
    const user = userEvent.setup();
    const store = renderProbetest();
    await user.click(await screen.findByRole('button', { name: 'Starten' }));

    const box = await screen.findByRole('region', { name: 'Baumeister am Bach' });
    expect(box).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Vorlesen' })).toBeNull();

    store.getState().goTo(10); // d-rsl-1-900, the first spelling item, no text
    await screen.findByText('11 von 18');
    expect(screen.queryByRole('region', { name: 'Baumeister am Bach' })).toBeNull();
    expect(within(screen.getByRole('main')).getByRole('button', { name: 'Vorlesen' })).toBeTruthy();
  });
});
