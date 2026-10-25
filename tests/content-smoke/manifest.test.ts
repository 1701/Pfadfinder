// Content-Smoke: the committed manifest matches the real content (list.ts).
import { describe, expect, it } from 'vitest';
import { buildContentManifest } from '../../src/domain/content';
import { practiceableBereiche, practiceableBereicheFromManifest } from '../../src/domain/scheduler';
import { committedManifest, contentItems, contentProbetests } from './read';

describe('content/manifest.json', () => {
  const items = contentItems();
  const committed = committedManifest();

  it('is up to date with the content (run npm run content:validate)', () => {
    expect(committed).toEqual(buildContentManifest(items, contentProbetests()));
  });

  it('opens the same Bereiche as the item-based rule', () => {
    for (const formats of [['single-choice', 'number-input'], ['single-choice']] as const) {
      expect(practiceableBereicheFromManifest(committed, formats)).toEqual(
        practiceableBereiche(items, formats),
      );
    }
  });
});
