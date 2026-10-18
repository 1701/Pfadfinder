// Quiet, for adults: the build on /eltern and, once a new version waits, the reload (task 11).
// Its own module: the map in the start bundle needs only these two.

export const versionLine = (buildId: string) => `Version ${buildId}`;
export const UPDATE_RELOAD = 'Neue Version – Neu laden';
/** In the line below the map: the long text took the Gebietsnamen below 18 px in Safari. */
export const UPDATE_RELOAD_SHORT = 'Neu laden';

/** For the language checks in tests/ui/text.test.ts. */
export const UPDATE_TEXTS = [
  /* @__PURE__ */ versionLine('a1b2c3d · 18.10.2026'),
  UPDATE_RELOAD,
  UPDATE_RELOAD_SHORT,
] as const;
