// The Probetest route as its own lazy chunk, like practice and the Einstieg: store, IndexedDB
// (Dexie), content parsing (Zod) and the renderers load only when a child opens a Probetest.

import manifest from '../../content/manifest.json';
import { createContentLoader } from '../content-runtime/loader';
import type { ContentManifest } from '../domain/content/manifest';
import { appRepositories } from '../data/dexie/instance';
import { createProbetestStore, type ProbetestStore } from '../data/probetest-store';
import { preloadFormats } from '../ui/formats/registry';
import { ProbetestStoreContext } from '../ui/probetest-context';
import { ProbetestScreen } from '../ui/screens/ProbetestScreen';

const MANIFEST = manifest as ContentManifest;

let store: ProbetestStore | null = null;

/** One store per app run, created on the first visit of a Probetest. */
function probetestStore(): ProbetestStore {
  if (!store) void preloadFormats();
  store ??= createProbetestStore({
    repos: appRepositories(),
    content: createContentLoader(),
    now: () => new Date().toISOString(),
    newId: () => crypto.randomUUID(),
  });
  return store;
}

export function ProbetestRoute() {
  return (
    <ProbetestStoreContext value={probetestStore()}>
      <ProbetestScreen probetests={MANIFEST.probetests} />
    </ProbetestStoreContext>
  );
}
