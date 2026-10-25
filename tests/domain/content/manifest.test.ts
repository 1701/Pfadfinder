import { describe, expect, it } from 'vitest';
import {
  BEREICHE,
  buildContentManifest,
  countItems,
  probetestNumber,
  type Item,
} from '../../../src/domain/content';
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
        { id: 'mathe-92', fach: 'mathe' },
        { id: 'mathe-91', fach: 'mathe' },
        { id: 'deutsch-91', fach: 'deutsch' },
      ],
    );
    expect(manifest.probetests).toEqual({ mathe: ['mathe-91', 'mathe-92'], deutsch: ['deutsch-91'] });
  });

  it('lists the reading texts a Bereich refers to', () => {
    const withText = (n: number, textRef: string) =>
      ({ ...item('lesen-sachtext', 1, n, findError), stimulus: { textRef } }) as Item;
    const manifest = buildContentManifest([withText(1, 't-sach-002'), withText(2, 't-sach-001'), withText(3, 't-sach-002')]);
    expect(manifest.bereiche['lesen-sachtext'].textIds).toEqual(['t-sach-001', 't-sach-002']);
  });
});

describe('probetestNumber', () => {
  it('is the position in the manifest from 1, never read from the id', () => {
    expect(probetestNumber(['mathe-91', 'mathe-93'], 'mathe-93')).toBe(2);
    expect(probetestNumber(['mathe-91'], 'mathe-91')).toBe(1);
    expect(probetestNumber(['mathe-91'], 'deutsch-90')).toBeNull();
  });
});
