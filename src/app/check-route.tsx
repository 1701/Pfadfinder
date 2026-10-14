// The Einstieg route as its own lazy chunk, like the practice route: store, IndexedDB (Dexie),
// content parsing (Zod) and the renderers load only when a child starts the Einstieg.

import { createContentLoader } from '../content-runtime/loader';
import { createCheckStore, type CheckStore } from '../data/check-store';
import { appRepositories } from '../data/dexie/instance';
import { CheckStoreContext } from '../ui/check-context';
import { preloadFormats } from '../ui/formats/registry';
import { SUPPORTED_FORMATS } from '../ui/formats/supported';
import { EinstiegScreen } from '../ui/screens/EinstiegScreen';

let store: CheckStore | null = null;

/** One store per app run, created on the first visit of the Einstieg. */
function checkStore(): CheckStore {
  // Renderers in their own chunks (match, order) start loading with the first visit.
  if (!store) void preloadFormats();
  store ??= createCheckStore({
    repos: appRepositories(),
    content: createContentLoader(),
    now: () => new Date().toISOString(),
    newId: () => crypto.randomUUID(),
    formats: SUPPORTED_FORMATS,
  });
  return store;
}

export function CheckRoute() {
  return (
    <CheckStoreContext value={checkStore()}>
      <EinstiegScreen />
    </CheckStoreContext>
  );
}
