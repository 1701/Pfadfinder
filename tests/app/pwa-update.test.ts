import { describe, expect, it, vi } from 'vitest';
import { createUpdateWatch, type UpdateWatchDeps } from '../../src/app/pwa-update';

class FakeWorker extends EventTarget {
  state: ServiceWorkerState = 'installing';
  postMessage = vi.fn();
  become(state: ServiceWorkerState) {
    this.state = state;
    this.dispatchEvent(new Event('statechange'));
  }
}

class FakeRegistration extends EventTarget {
  waiting: FakeWorker | null = null;
  installing: FakeWorker | null = null;
  update = vi.fn(() => Promise.resolve(this as never));
  /** The browser found a new sw.js and installs it. */
  found(): FakeWorker {
    const worker = new FakeWorker();
    this.installing = worker;
    this.dispatchEvent(new Event('updatefound'));
    return worker;
  }
}

function setup({ controlled = true, waiting = false } = {}) {
  const registration = new FakeRegistration();
  if (waiting) registration.waiting = new FakeWorker();
  const container = Object.assign(new EventTarget(), {
    controller: controlled ? {} : null,
    register: vi.fn(() => Promise.resolve(registration)),
  });
  const doc = Object.assign(new EventTarget(), {
    visibilityState: 'visible' as DocumentVisibilityState,
  });
  const reload = vi.fn();
  const watch = createUpdateWatch({
    container,
    doc,
    reload,
  } as unknown as UpdateWatchDeps);
  const show = (state: DocumentVisibilityState) => {
    doc.visibilityState = state;
    doc.dispatchEvent(new Event('visibilitychange'));
  };
  return { watch, registration, container, show, reload };
}

/** A new worker finished installing and now waits. */
function installNext(registration: FakeRegistration) {
  const worker = registration.found();
  registration.installing = null;
  registration.waiting = worker;
  worker.become('installed');
  return worker;
}

describe('createUpdateWatch', () => {
  it('registers /sw.js and asks for a new version at once', async () => {
    const { watch, registration, container } = setup();
    await watch.start();
    expect(container.register).toHaveBeenCalledWith('/sw.js', { scope: '/' });
    expect(registration.update).toHaveBeenCalledOnce();
  });

  it('asks again whenever the app comes back to the foreground, not when it goes away', async () => {
    const { watch, registration, show } = setup();
    await watch.start();
    show('hidden');
    expect(registration.update).toHaveBeenCalledTimes(1);
    show('visible');
    expect(registration.update).toHaveBeenCalledTimes(2);
  });

  it('is ready when a new version already waits at start', async () => {
    const { watch } = setup({ waiting: true });
    await watch.start();
    expect(watch.isReady()).toBe(true);
  });

  it('becomes ready once a found version is installed, and tells its listeners', async () => {
    const { watch, registration } = setup();
    const listener = vi.fn();
    watch.subscribe(listener);
    await watch.start();
    expect(watch.isReady()).toBe(false);
    installNext(registration);
    expect(watch.isReady()).toBe(true);
    expect(listener).toHaveBeenCalledOnce();
  });

  it('offers nothing on the first install, when no version controls the page yet', async () => {
    const { watch, registration } = setup({ controlled: false });
    await watch.start();
    installNext(registration);
    expect(watch.isReady()).toBe(false);
  });

  it('activates the waiting version and reloads only once it has taken over', async () => {
    const { watch, registration, container, reload } = setup({ waiting: true });
    await watch.start();
    watch.apply();
    expect(registration.waiting?.postMessage).toHaveBeenCalledWith({ type: 'SKIP_WAITING' });
    expect(reload).not.toHaveBeenCalled();
    container.dispatchEvent(new Event('controllerchange'));
    container.dispatchEvent(new Event('controllerchange'));
    expect(reload).toHaveBeenCalledOnce();
  });

  it('never reloads on its own, e.g. when another tab activated the new version', async () => {
    const { watch, registration, container, show, reload } = setup();
    await watch.start();
    installNext(registration);
    show('visible');
    container.dispatchEvent(new Event('controllerchange'));
    expect(reload).not.toHaveBeenCalled();
  });

  it('stays quiet when the check fails (offline) or registering fails', async () => {
    const offline = setup();
    offline.registration.update.mockRejectedValueOnce(new Error('offline'));
    await offline.watch.start();
    expect(offline.watch.isReady()).toBe(false);

    const broken = setup();
    broken.container.register.mockRejectedValueOnce(new Error('blocked'));
    await expect(broken.watch.start()).resolves.toBeUndefined();
  });
});
