// The fixture content must stay valid content: same rules as content/ (CONTENT_SCHEMA), and every
// Bereich practiceable, so tests can take the open Gebiete from the taxonomy.
import { describe, expect, it } from 'vitest';
import { BEREICHE, validateContent } from '../../src/domain/content';
import { practiceableBereicheFromManifest } from '../../src/domain/scheduler';
import { SUPPORTED_FORMATS } from '../../src/ui/formats/supported';
import { toFiles } from './builders';
import {
  FIXTURE_ITEMS,
  FIXTURE_MANIFEST,
  FIXTURE_PROBETESTS,
  FIXTURE_TEXTS,
  MATHE_91,
  fixtureContent,
  probetestItems,
} from './content';

describe('fixture content', () => {
  it('passes every validator rule', () => {
    const files = toFiles({
      items: FIXTURE_ITEMS,
      texts: FIXTURE_TEXTS,
      probetests: FIXTURE_PROBETESTS,
    });
    expect(validateContent(files, { assetExists: () => true }).issues).toEqual([]);
  });

  it('opens every Bereich on the map', () => {
    expect(practiceableBereicheFromManifest(FIXTURE_MANIFEST, SUPPORTED_FORMATS)).toEqual([
      ...BEREICHE,
    ]);
  });

  it('loads through the app loader: every item and every Probetest', async () => {
    const content = fixtureContent();
    expect((await content.loadAllItems()).map((i) => i.id).sort()).toEqual(
      FIXTURE_ITEMS.map((i) => i.id).sort(),
    );
    for (const p of FIXTURE_PROBETESTS) expect(await content.loadProbetest(p.id)).toEqual(p);
  });

  it('mathe-91 ends with its only short answer', () => {
    const formats = probetestItems(MATHE_91).map((i) => i.format);
    expect(formats.indexOf('short-answer')).toBe(formats.length - 1);
    expect(new Set(formats).size).toBeGreaterThanOrEqual(4);
  });
});
