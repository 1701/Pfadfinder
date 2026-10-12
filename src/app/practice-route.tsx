// The practice route as its own lazy chunk: store, IndexedDB (Dexie), content parsing (Zod) and
// the renderers load only when a child opens a Bereich, not with the start page.

import { createContentLoader } from '../content-runtime/loader';
import { appRepositories } from '../data/dexie/instance';
import { createSessionStore, type SessionStore } from '../data/session-store';
import { SUPPORTED_FORMATS } from '../ui/formats/supported';
import { UebenScreen } from '../ui/screens/UebenScreen';
import { SessionStoreContext } from '../ui/session-context';

let store: SessionStore | null = null;

/** One store per app run, created on the first visit of a practice page. */
function sessionStore(): SessionStore {
  store ??= createSessionStore({
    repos: appRepositories(),
    content: createContentLoader(),
    now: () => new Date().toISOString(),
    newId: () => crypto.randomUUID(),
    formats: SUPPORTED_FORMATS,
  });
  return store;
}

export function PracticeRoute() {
  return (
    <SessionStoreContext value={sessionStore()}>
      <UebenScreen />
    </SessionStoreContext>
  );
}
