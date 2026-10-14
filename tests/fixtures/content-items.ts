// Real items from content/ for renderer tests (CLAUDE.md: no invented items). Read straight from
// the JSON files; content:validate guarantees they match the schema.

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import type { Format, Item, ItemOf } from '../../src/domain/content';

const ITEMS: Item[] = ['mathe', 'deutsch'].flatMap((fach) =>
  readdirSync(path.join('content/items', fach)).flatMap(
    (file) => JSON.parse(readFileSync(path.join('content/items', fach, file), 'utf8')) as Item[],
  ),
);

/** One real item by id; the format is checked so a content change fails loudly. */
export function contentItem<F extends Format>(id: string, format: F): ItemOf<F> {
  const item = ITEMS.find((i) => i.id === id);
  if (!item || item.format !== format || item.status === 'retired') {
    throw new Error(`No active ${format} item ${id} in content/`);
  }
  return item as ItemOf<F>;
}

/** Every active item of a format. */
export function activeItems<F extends Format>(format: F): ItemOf<F>[] {
  return ITEMS.filter((i): i is ItemOf<F> => i.format === format && i.status !== 'retired');
}
