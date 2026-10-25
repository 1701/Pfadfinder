// The pictures of content/assets/svg as raw text, keyed by path. A module of its own, so the unit
// tests can put invented pictures in its place (vitest.config.ts, tests/fixtures/assets).
export const ASSET_SOURCES: Record<string, string> = import.meta.glob(
  '../../../content/assets/svg/*.svg',
  { query: '?raw', import: 'default', eager: true },
);
