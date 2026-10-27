// Updates of the installed app (task 11). The app registers its service worker itself and asks for
// a new version at start and whenever it comes back to the foreground (an iPad home-screen app is
// mostly suspended, not restarted). A new worker waits; only a tap on "Neu laden" (/eltern/geraet
// and the line below the map) activates it and reloads. Nothing reloads on its own, so a round or a
// Probetest is never interrupted, and a worker taking over from another tab reloads nothing here.

import { useSyncExternalStore } from 'react';

type Registration = Pick<ServiceWorkerRegistration, 'waiting' | 'installing' | 'update'> &
  Pick<EventTarget, 'addEventListener'>;

export interface UpdateWatchDeps {
  container: {
    register(url: string, options: RegistrationOptions): Promise<Registration>;
    readonly controller: unknown;
    addEventListener(type: 'controllerchange', listener: () => void): void;
  };
  doc: Pick<Document, 'visibilityState'> & {
    addEventListener(type: 'visibilitychange', listener: () => void): void;
  };
  reload(): void;
}

export interface UpdateWatch {
  start(): Promise<void>;
  /** Activates the waiting version and reloads once it controls the page. */
  apply(): void;
  isReady(): boolean;
  subscribe(listener: () => void): () => void;
}

export function createUpdateWatch(deps: UpdateWatchDeps): UpdateWatch {
  let registration: Registration | null = null;
  let ready = false;
  let applying = false;
  let reloaded = false;
  const listeners = new Set<() => void>();

  // A waiting worker is a new version only if an old one controls the page (not the first install).
  const markIfWaiting = () => {
    if (ready || !registration?.waiting || !deps.container.controller) return;
    ready = true;
    for (const listener of listeners) listener();
  };
  const reload = () => {
    if (reloaded) return;
    reloaded = true;
    deps.reload();
  };
  const check = () => {
    // Offline or a server hiccup: ask again at the next start or return to the foreground.
    registration?.update().then(markIfWaiting, () => undefined);
  };

  deps.container.addEventListener('controllerchange', () => {
    if (applying) reload();
  });

  return {
    async start() {
      try {
        registration = await deps.container.register('/sw.js', { scope: '/' });
      } catch {
        return;
      }
      const current = registration;
      current.addEventListener('updatefound', () => {
        const worker = current.installing;
        worker?.addEventListener('statechange', () => {
          if (worker.state === 'installed') markIfWaiting();
        });
      });
      markIfWaiting();
      check();
      deps.doc.addEventListener('visibilitychange', () => {
        if (deps.doc.visibilityState === 'visible') check();
      });
    },
    apply() {
      applying = true;
      const waiting = registration?.waiting;
      if (!waiting) return reload();
      waiting.postMessage({ type: 'SKIP_WAITING' });
    },
    isReady: () => ready,
    subscribe(listener) {
      listeners.add(listener);
      return () => listeners.delete(listener);
    },
  };
}

const NEVER: UpdateWatch = {
  start: async () => undefined,
  apply: () => undefined,
  isReady: () => false,
  subscribe: () => () => undefined,
};

// Only the production build has a service worker (none in `vite` dev or in tests).
const watch: UpdateWatch =
  import.meta.env.PROD && typeof navigator !== 'undefined' && 'serviceWorker' in navigator
    ? createUpdateWatch({
        container: navigator.serviceWorker,
        doc: document,
        reload: () => window.location.reload(),
      })
    : NEVER;

/** Registers the service worker after the page has loaded, like registerSW.js did before. */
export function startPwaUpdates(): void {
  if (document.readyState === 'complete') void watch.start();
  else window.addEventListener('load', () => void watch.start(), { once: true });
}

export const applyUpdate = (): void => watch.apply();

/** True once a new version waits for "Neu laden". */
export function useUpdateReady(): boolean {
  return useSyncExternalStore(watch.subscribe, watch.isReady, () => false);
}
