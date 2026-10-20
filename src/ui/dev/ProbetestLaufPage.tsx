// /dev/probetest-lauf/:id – a real Probetest run on memory repos with the fixture deutsch-90
// (tests/fixtures/lesen): the store, the clock and the reading screens, without IndexedDB and
// without fixture content in the app (task 13). Dev build only; a reload starts afresh.

import { useState } from 'react';
import { createContentLoader } from '../../content-runtime/loader';
import { createMemoryRepositories } from '../../data/memory/repos';
import { createProbetestStore } from '../../data/probetest-store';
import { probetestContentModules } from '../../../tests/fixtures/lesen';
import { preloadFormats } from '../formats/registry';
import { ProbetestStoreContext } from '../probetest-context';
import { ProbetestScreen } from '../screens/ProbetestScreen';

export function ProbetestLaufPage() {
  const [store] = useState(() => {
    void preloadFormats();
    return createProbetestStore({
      repos: createMemoryRepositories(),
      content: createContentLoader(probetestContentModules()),
      now: () => new Date().toISOString(),
      newId: () => crypto.randomUUID(),
    });
  });
  return (
    <ProbetestStoreContext value={store}>
      <ProbetestScreen />
    </ProbetestStoreContext>
  );
}
