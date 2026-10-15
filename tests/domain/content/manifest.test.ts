import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  BEREICHE,
  buildContentManifest,
  countItems,
  type ContentManifest,
  type Item,
  type Probetest,
} from '../../../src/domain/content';
import { practiceableBereicheFromManifest, practiceableBereiche } from '../../../src/domain/scheduler';
import { item } from '../../fixtures/pool';
import { findError, numberInput, singleChoice } from '../../fixtures/items';

describe('buildContentManifest', () => {
  it('counts active items per format and niveau, for every Bereich', () => {
    const retired = { ...item('raum-form', 2, 9, singleChoice), status: 'retired' } as Item;
    const manifest = buildContentManifest([
      item('raum-form', 1, 1, singleChoice),
      item('raum-form', 1, 2, singleChoice),
      item('raum-form', 3, 3, numberInput),
      retired,
    ]);
    expect(Object.keys(manifest.bereiche)).toEqual([...BEREICHE]);
    expect(manifest.bereiche['raum-form']).toEqual({
      fach: 'mathe',
      items: 3,
      byFormat: {
        'number-input': { 1: 0, 2: 0, 3: 1 },
        'single-choice': { 1: 2, 2: 0, 3: 0 },
      },
      textIds: [],
    });
    expect(manifest.bereiche['lesen-sachtext']).toEqual({
      fach: 'deutsch',
      items: 0,
      byFormat: {},
      textIds: [],
    });
    expect(countItems(manifest.bereiche['raum-form'], ['single-choice'])).toBe(2);
    expect(manifest.probetests).toEqual({ mathe: [], deutsch: [] });
  });

  it('lists the Probetests per Fach', () => {
    const manifest = buildContentManifest(
      [],
      [
        { id: 'mathe-02', fach: 'mathe' },
        { id: 'mathe-01', fach: 'mathe' },
        { id: 'deutsch-01', fach: 'deutsch' },
      ],
    );
    expect(manifest.probetests).toEqual({ mathe: ['mathe-01', 'mathe-02'], deutsch: ['deutsch-01'] });
  });

  it('lists the reading texts a Bereich refers to', () => {
    const withText = (n: number, textRef: string) =>
      ({ ...item('lesen-sachtext', 1, n, findError), stimulus: { textRef } }) as Item;
    const manifest = buildContentManifest([withText(1, 't-sach-002'), withText(2, 't-sach-001'), withText(3, 't-sach-002')]);
    expect(manifest.bereiche['lesen-sachtext'].textIds).toEqual(['t-sach-001', 't-sach-002']);
  });
});

describe('content/manifest.json', () => {
  const items = readdirSync('content/items', { recursive: true, encoding: 'utf8' })
    .filter((f) => f.endsWith('.json'))
    .flatMap((f) => JSON.parse(readFileSync(`content/items/${f}`, 'utf8')) as Item[]);
  const probetests = readdirSync('content/probetests')
    .filter((f) => f.endsWith('.json'))
    .map((f) => JSON.parse(readFileSync(`content/probetests/${f}`, 'utf8')) as Probetest);
  const committed = JSON.parse(readFileSync('content/manifest.json', 'utf8')) as ContentManifest;

  it('is up to date with the content (run npm run content:validate)', () => {
    expect(committed).toEqual(buildContentManifest(items, probetests));
  });

  it('opens the same Bereiche as the item-based rule', () => {
    for (const formats of [['single-choice', 'number-input'], ['single-choice']] as const) {
      expect(practiceableBereicheFromManifest(committed, formats)).toEqual(
        practiceableBereiche(items, formats),
      );
    }
  });
});
