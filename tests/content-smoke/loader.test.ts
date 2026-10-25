// Content-Smoke: the app's loader (import.meta.glob + Zod) reads every item file, every reading
// text and every Probetest of the real content (list.ts).
import { describe, expect, it } from 'vitest';
import { createContentLoader } from '../../src/content-runtime/loader';
import { BEREICHE, fachOfBereich, isLesenBereich } from '../../src/domain/content';
import { committedManifest, contentItems } from './read';

describe('content loader – the app content', () => {
  const loader = createContentLoader();
  const manifest = committedManifest();

  it('loads every item of every Bereich', async () => {
    const loaded = await loader.loadAllItems();
    expect(loaded.map((i) => i.id).sort()).toEqual(
      contentItems()
        .map((i) => i.id)
        .sort(),
    );
  });

  it('loads the texts of each Lesen-Bereich, the same as the manifest names', async () => {
    for (const bereich of BEREICHE) {
      const texts = await loader.loadTexts(fachOfBereich(bereich), bereich);
      const expected = isLesenBereich(bereich) ? manifest.bereiche[bereich].textIds : [];
      expect(texts.map((t) => t.id).sort(), bereich).toEqual([...expected].sort());
    }
  });

  it('loads every Probetest of the manifest', async () => {
    for (const id of [...manifest.probetests.mathe, ...manifest.probetests.deutsch]) {
      expect((await loader.loadProbetest(id)).id).toBe(id);
    }
  });
});
