// Text spoken by the Vorlesen button (ARCHITECTURE.md §5): the item's own readAloud variant,
// otherwise everything the child has to read – stimulus text, image description, prompt.

import type { Item } from './types';

export function readAloudText(item: Pick<Item, 'readAloud' | 'stimulus' | 'prompt'>): string {
  if (item.readAloud) return item.readAloud;
  const { text, assetAlt } = item.stimulus ?? {};
  return [text, assetAlt, item.prompt].filter((part) => part && part.trim()).join(' ');
}
