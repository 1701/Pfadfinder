// Invented pictures for the unit tests, in place of content/assets/svg (vitest.config.ts aliases
// src/ui/components/asset-sources to this file). NOT app content – never copy into content/.
export const ASSET_SOURCES: Record<string, string> = import.meta.glob('./*.svg', {
  query: '?raw',
  import: 'default',
  eager: true,
});
