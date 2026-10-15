// Content manifest (ARCHITECTURE.md §5): what exists per Bereich and which Probetests exist,
// without loading the items.
// Written to content/manifest.json by scripts/validate-content.ts; the start page reads only this.
// Deliberately free of Zod and of schemas.ts so it stays out of the start page's bundle.

import { BEREICHE_BY_FACH, FAECHER, type Bereich, type Fach } from './taxonomy';
import type { Format, Item, Niveau } from './types';

export type NiveauCounts = Record<`${Niveau}`, number>;

export interface BereichManifest {
  fach: Fach;
  /** Active items (status other than "retired"). */
  items: number;
  /** Active items per format and niveau; formats without items are omitted. */
  byFormat: Partial<Record<Format, NiveauCounts>>;
  /** ReadingText ids referenced by the items of this Bereich (Deutsch Lesen). */
  textIds: string[];
}

export interface ContentManifest {
  bereiche: Record<Bereich, BereichManifest>;
  /** Probetest ids per Fach, sorted (the map offers a Probetest only where one exists). */
  probetests: Record<Fach, string[]>;
}

export function buildContentManifest(
  items: readonly Item[],
  probetests: readonly { id: string; fach: Fach }[] = [],
): ContentManifest {
  const bereiche = {} as Record<Bereich, BereichManifest>;
  for (const fach of FAECHER) {
    for (const bereich of BEREICHE_BY_FACH[fach]) {
      const active = items.filter((i) => i.bereich === bereich && i.status !== 'retired');
      const byFormat: Partial<Record<Format, NiveauCounts>> = {};
      for (const item of [...active].sort((a, b) => a.format.localeCompare(b.format))) {
        const counts = (byFormat[item.format] ??= { 1: 0, 2: 0, 3: 0 });
        counts[item.niveau] += 1;
      }
      const textIds = [
        ...new Set(active.flatMap((i) => (i.stimulus?.textRef ? [i.stimulus.textRef] : []))),
      ].sort();
      bereiche[bereich] = { fach, items: active.length, byFormat, textIds };
    }
  }
  const byFach = {} as Record<Fach, string[]>;
  for (const fach of FAECHER) {
    byFach[fach] = probetests.filter((p) => p.fach === fach).map((p) => p.id).sort();
  }
  return { bereiche, probetests: byFach };
}

/** Number of active items of the given formats in one Bereich. */
export function countItems(entry: BereichManifest, formats: readonly Format[]): number {
  return formats.reduce((sum, format) => {
    const counts = entry.byFormat[format];
    return sum + (counts ? counts[1] + counts[2] + counts[3] : 0);
  }, 0);
}
