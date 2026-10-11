// Lazy content loader (ARCHITECTURE.md §3): one chunk per content file, loaded on first use and
// parsed with the same Zod schemas as the build-time validation. Chunks are precached by the
// service worker, so this works offline after the first visit.

import { z } from 'zod';
import {
  FAECHER,
  BEREICHE_BY_FACH,
  itemSchema,
  probetestSchema,
  readingTextSchema,
  type Bereich,
  type ContentLoader,
  type Fach,
  type Item,
} from '../domain/content';

export interface ContentRuntime extends ContentLoader {
  /** All items of all Bereiche, e.g. to decide which Bereiche can be practised. */
  loadAllItems(): Promise<Item[]>;
}

type Modules = Record<string, () => Promise<unknown>>;

const itemModules: Modules = import.meta.glob('../../content/items/*/*.json', {
  import: 'default',
});
const textModules: Modules = import.meta.glob('../../content/texts/deutsch/*.json', {
  import: 'default',
});
const probetestModules: Modules = import.meta.glob('../../content/probetests/*.json', {
  import: 'default',
});

const itemFileSchema = z.array(itemSchema);

export function createContentLoader(): ContentRuntime {
  const itemCache = new Map<string, Promise<Item[]>>();

  async function load<T>(modules: Modules, path: string, schema: z.ZodType<T>): Promise<T> {
    const loadModule = modules[path];
    if (!loadModule) throw new Error(`Content file not found: ${path}`);
    return schema.parse(await loadModule());
  }

  const loader: ContentRuntime = {
    loadItems(fach: Fach, bereich: Bereich) {
      const path = `../../content/items/${fach}/${bereich}.json`;
      if (!itemModules[path]) return Promise.resolve([]);
      let items = itemCache.get(path);
      if (!items) {
        items = load(itemModules, path, itemFileSchema);
        itemCache.set(path, items);
        items.catch(() => itemCache.delete(path));
      }
      return items;
    },
    loadReadingText: (id) =>
      load(textModules, `../../content/texts/deutsch/${id}.json`, readingTextSchema),
    loadProbetest: (id) =>
      load(probetestModules, `../../content/probetests/${id}.json`, probetestSchema),
    async loadAllItems() {
      const files = await Promise.all(
        FAECHER.flatMap((fach) => BEREICHE_BY_FACH[fach].map((b) => loader.loadItems(fach, b))),
      );
      return files.flat();
    },
  };
  return loader;
}
