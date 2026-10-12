// Facts about the real content that change with every batch: derived from content/manifest.json,
// so tests do not name a Bereich that a new batch makes practiceable.

import manifest from '../../content/manifest.json';
import { countItems, type ContentManifest } from '../../src/domain/content/manifest';
import { BEREICHE_BY_FACH, type Bereich } from '../../src/domain/content/taxonomy';
import {
  MIN_ITEMS_FOR_PRACTICE,
  practiceableBereicheFromManifest,
} from '../../src/domain/scheduler';
import { SUPPORTED_FORMATS } from '../../src/ui/formats/supported';

export const CONTENT_MANIFEST = manifest as ContentManifest;

/** Bereiche the map shows as open right now, in taxonomy order. */
export const OPEN_BEREICHE: Bereich[] = practiceableBereicheFromManifest(
  CONTENT_MANIFEST,
  SUPPORTED_FORMATS,
);

/** A Mathe Bereich with too few practiceable items; fails loudly once every one is open. */
export function thinMatheBereich(): Bereich {
  const thin = BEREICHE_BY_FACH.mathe.find(
    (b) => countItems(CONTENT_MANIFEST.bereiche[b], SUPPORTED_FORMATS) < MIN_ITEMS_FOR_PRACTICE,
  );
  if (!thin) throw new Error('Every Mathe Bereich is practiceable: use a fake content loader');
  return thin;
}
