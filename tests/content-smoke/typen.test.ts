// Content-Smoke: content/typen.json (CONTENT_SCHEMA §1 since 1.0.27) names task types for every
// Bereich of the real pool, for the page for parents and teachers (/eltern).
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { BEREICHE, checkTypen } from '../../src/domain/content';
import { committedManifest } from './read';

describe('content/typen.json', () => {
  const typen = JSON.parse(readFileSync('content/typen.json', 'utf8')) as Record<string, string[]>;

  it('is valid', () => {
    expect(checkTypen(typen)).toEqual([]);
  });

  it('names types for every Bereich with items, in the order of the map', () => {
    expect(Object.keys(typen)).toEqual([...BEREICHE]);
    const manifest = committedManifest();
    for (const bereich of BEREICHE) {
      if (manifest.bereiche[bereich].items > 0) expect(typen[bereich]!.length).toBeGreaterThan(0);
    }
  });
});
