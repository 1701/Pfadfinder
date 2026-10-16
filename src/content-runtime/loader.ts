// Lazy content loader (ARCHITECTURE.md §3): one chunk per content file, loaded on first use and
// parsed with the same Zod schemas as the build-time validation. Chunks are precached by the
// service worker, so this works offline after the first visit.

import { z } from 'zod';
import {
  FAECHER,
  BEREICHE_BY_FACH,
  bereichOfTextKind,
  isLesenBereich,
  itemSchema,
  probetestSchema,
  readingTextSchema,
  type Bereich,
  type ContentLoader,
  type Fach,
  type Item,
  type ReadingText,
} from '../domain/content';

export interface ContentRuntime extends ContentLoader {
  /** All items of all Bereiche, e.g. to decide which Bereiche can be practised. */
  loadAllItems(): Promise<Item[]>;
}

type Modules = Record<string, () => Promise<unknown>>;

/**
 * Lazy modules keyed by path. Items are found by the path ending `/<fach>/<bereich>.json`,
 * Probetests by `/<id>.json`; texts are matched by their content (`id`, `kind`), never by the
 * file name. Dev pages pass fixtures here; the app uses CONTENT_MODULES.
 */
export interface ContentModules {
  items: Modules;
  texts: Modules;
  probetests: Modules;
}

const CONTENT_MODULES: ContentModules = {
  items: import.meta.glob('../../content/items/*/*.json', { import: 'default' }),
  texts: import.meta.glob('../../content/texts/deutsch/*.json', { import: 'default' }),
  probetests: import.meta.glob('../../content/probetests/*.json', { import: 'default' }),
};

const itemFileSchema = z.array(itemSchema);

function findPath(modules: Modules, suffix: string): string | undefined {
  return Object.keys(modules).find((path) => path.endsWith(suffix));
}

export function createContentLoader(modules: ContentModules = CONTENT_MODULES): ContentRuntime {
  const itemCache = new Map<string, Promise<Item[]>>();
  let textCache: Promise<ReadingText[]> | undefined;

  async function load<T>(loadModule: () => Promise<unknown>, schema: z.ZodType<T>): Promise<T> {
    return schema.parse(await loadModule());
  }

  function loadAllTexts(): Promise<ReadingText[]> {
    if (!textCache) {
      const texts = Promise.all(
        Object.values(modules.texts).map((loadModule) => load(loadModule, readingTextSchema)),
      );
      texts.catch(() => (textCache = undefined));
      textCache = texts;
    }
    return textCache;
  }

  const loader: ContentRuntime = {
    loadItems(fach: Fach, bereich: Bereich) {
      const path = findPath(modules.items, `/${fach}/${bereich}.json`);
      if (path === undefined) return Promise.resolve([]);
      let items = itemCache.get(path);
      if (!items) {
        items = load(modules.items[path] as () => Promise<unknown>, itemFileSchema);
        itemCache.set(path, items);
        items.catch(() => itemCache.delete(path));
      }
      return items;
    },
    async loadTexts(_fach: Fach, bereich: Bereich) {
      if (!isLesenBereich(bereich)) return [];
      const texts = await loadAllTexts();
      return texts.filter((t) => bereichOfTextKind(t.kind) === bereich);
    },
    async loadReadingText(id) {
      const text = (await loadAllTexts()).find((t) => t.id === id);
      if (!text) throw new Error(`Reading text not found: ${id}`);
      return text;
    },
    async loadProbetest(id) {
      const path = findPath(modules.probetests, `/${id}.json`);
      if (path === undefined) throw new Error(`Content file not found: probetests/${id}.json`);
      return load(modules.probetests[path] as () => Promise<unknown>, probetestSchema);
    },
    async loadAllItems() {
      const files = await Promise.all(
        FAECHER.flatMap((fach) => BEREICHE_BY_FACH[fach].map((b) => loader.loadItems(fach, b))),
      );
      return files.flat();
    },
  };
  return loader;
}
