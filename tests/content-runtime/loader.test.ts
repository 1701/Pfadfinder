import { describe, expect, it } from 'vitest';
import { createContentLoader } from '../../src/content-runtime/loader';
import { LESEN_ITEMS, biberText, igelText, lesenContentModules } from '../fixtures/lesen';

describe('content loader – reading texts', () => {
  it('loads the texts of a Lesen-Bereich with its items', async () => {
    const loader = createContentLoader(lesenContentModules());
    expect(await loader.loadItems('deutsch', 'lesen-sachtext')).toEqual(LESEN_ITEMS);
    const texts = await loader.loadTexts('deutsch', 'lesen-sachtext');
    expect(texts.map((t) => t.id).sort()).toEqual([biberText.id, igelText.id]);
  });

  it('matches texts by kind, not by file name', async () => {
    const literarisch = { ...structuredClone(biberText), id: 't-lit-900', kind: 'literarisch' };
    const modules = lesenContentModules();
    // A literary text in a file named like a Sachtext still belongs to lesen-literarisch.
    modules.texts = {
      'fixtures/texts/t-sach-777.json': async () => literarisch,
      'fixtures/texts/t-sach-900.json': async () => structuredClone(biberText),
    };
    const loader = createContentLoader(modules);
    expect((await loader.loadTexts('deutsch', 'lesen-sachtext')).map((t) => t.id)).toEqual([
      biberText.id,
    ]);
    expect((await loader.loadTexts('deutsch', 'lesen-literarisch')).map((t) => t.id)).toEqual([
      't-lit-900',
    ]);
    expect((await loader.loadReadingText('t-lit-900')).kind).toBe('literarisch');
  });

  it('gives other Bereiche no texts and loads no text for them', async () => {
    let loads = 0;
    const modules = lesenContentModules();
    modules.texts = { 'x/t-sach-900.json': async () => (loads++, structuredClone(biberText)) };
    const loader = createContentLoader(modules);
    expect(await loader.loadTexts('deutsch', 'rs-strategien')).toEqual([]);
    expect(await loader.loadTexts('mathe', 'zahlen-operationen')).toEqual([]);
    expect(loads).toBe(0);
  });

  it('loads every text file only once', async () => {
    let loads = 0;
    const modules = lesenContentModules();
    modules.texts = { 'x/t-sach-900.json': async () => (loads++, structuredClone(biberText)) };
    const loader = createContentLoader(modules);
    await loader.loadTexts('deutsch', 'lesen-sachtext');
    await loader.loadTexts('deutsch', 'lesen-sachtext');
    await loader.loadReadingText(biberText.id);
    expect(loads).toBe(1);
  });

  it('loads the texts of the app content for their Bereich', async () => {
    const loader = createContentLoader();
    const texts = await loader.loadTexts('deutsch', 'lesen-sachtext');
    expect(texts.map((t) => t.id).sort()).toEqual([
      't-sach-001',
      't-sach-002',
      't-sach-003',
      't-sach-004',
    ]);
    expect(await loader.loadTexts('deutsch', 'rs-strategien')).toEqual([]);
  });
});
