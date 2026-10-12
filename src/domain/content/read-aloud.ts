// Text spoken by the Vorlesen button (ARCHITECTURE.md §5): the item's own readAloud variant,
// otherwise everything the child has to read – stimulus text, image description, prompt.

import type { Item } from './types';

/**
 * Makes math notation speakable: digit groups are joined ("4 735" → "4735", otherwise read as
 * two numbers) and operators between spaced numbers become words. Times like "8:30" and words
 * like "20-Euro-Schein" are left alone because operators need spaces on both sides.
 */
export function speakable(text: string): string {
  return text
    .replace(/(\d)[   ](?=\d{3}(?!\d))/g, '$1')
    .replace(/\s*[·×]\s*/g, ' mal ')
    .replace(/(\d) [−–-] (?=\d)/g, '$1 minus ')
    .replace(/(\d) : (?=\d)/g, '$1 geteilt durch ')
    .replace(/(\d) \+ (?=\d)/g, '$1 plus ')
    .replace(/ = /g, ' gleich ');
}

export function readAloudText(item: Pick<Item, 'readAloud' | 'stimulus' | 'prompt'>): string {
  if (item.readAloud) return item.readAloud;
  const { text, assetAlt } = item.stimulus ?? {};
  return speakable([text, assetAlt, item.prompt].filter((part) => part && part.trim()).join(' '));
}
