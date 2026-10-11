import type { Bereich, Fach, Item, Probetest, ReadingText } from './types';

/**
 * Source of validated content. Implemented in src/content-runtime (lazy, per Bereich);
 * the domain only depends on this interface.
 */
export interface ContentLoader {
  loadItems(fach: Fach, bereich: Bereich): Promise<Item[]>;
  loadReadingText(id: string): Promise<ReadingText>;
  loadProbetest(id: string): Promise<Probetest>;
}
