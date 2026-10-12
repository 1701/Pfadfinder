import { describe, expect, it } from 'vitest';
import {
  validateContent,
  type ContentFile,
  type ContentIssue,
  type Item,
  type ValidateContentOptions,
} from '../../../src/domain/content';
import { findError, numberInput, order, sachtext, shortAnswer, singleChoice, validItemsByFormat } from '../../fixtures/items';
import { buildDeutschProbetest, buildMatheProbetest, cloneItem, toFiles } from '../../fixtures/builders';

const noAssets: ValidateContentOptions = { assetExists: () => false };

function run(files: ContentFile[], options = noAssets) {
  return validateContent(files, options);
}

function errors(issues: ContentIssue[]): string[] {
  return issues.filter((i) => i.severity === 'error').map((i) => `${i.file}|${i.id ?? ''}|${i.path ?? ''}|${i.message}`);
}

describe('validateContent – files and placement', () => {
  it('accepts all format fixtures placed in their files', () => {
    const { issues, bundle } = run(toFiles({ items: Object.values(validItemsByFormat) }));
    expect(issues).toEqual([]);
    expect(bundle.items.size).toBe(9);
  });

  it('reports a missing schema-version.json', () => {
    const { issues } = run(toFiles({ items: [numberInput], schemaVersion: false }));
    expect(errors(issues)).toEqual(['schema-version.json|||Datei fehlt']);
  });

  it('reports schema errors with file, item id and path', () => {
    const broken = { ...numberInput, solution: { value: 7603.5 } };
    const { issues } = run(toFiles({ items: [broken as Item] }));
    expect(issues).toEqual([
      expect.objectContaining({
        severity: 'error',
        file: 'items/mathe/zahlen-operationen.json',
        id: 'm-zo-1-001',
        path: '[0].solution.value',
      }),
    ]);
  });

  it('reports items in the wrong file', () => {
    const files: ContentFile[] = [
      { path: 'schema-version.json', data: { version: '1.0' } },
      { path: 'items/mathe/raum-form.json', data: [numberInput] },
    ];
    expect(errors(run(files).issues)).toEqual([
      'items/mathe/raum-form.json|m-zo-1-001||Item gehört nach items/mathe/zahlen-operationen.json',
    ]);
  });

  it('reports unknown files, unknown bereich files and non-array item files', () => {
    const files: ContentFile[] = [
      { path: 'schema-version.json', data: { version: '1.0' } },
      { path: 'items/mathe/geometrie.json', data: [] },
      { path: 'items/mathe/raum-form.json', data: {} },
      { path: 'misc/notes.json', data: {} },
    ];
    expect(errors(run(files).issues)).toHaveLength(3);
  });

  it('reports duplicate item ids across files', () => {
    const files = toFiles({ items: [numberInput] });
    files.push({ path: 'items/mathe/raum-form.json', data: [numberInput] });
    expect(errors(run(files).issues)).toContain(
      'items/mathe/raum-form.json|m-zo-1-001||Doppelte Item-ID (auch in items/mathe/zahlen-operationen.json)',
    );
  });

  it('requires text and probetest file names to match their id', () => {
    const text = structuredClone(sachtext);
    const files: ContentFile[] = [
      { path: 'schema-version.json', data: { version: '1.0' } },
      { path: 'texts/deutsch/igel.json', data: text },
    ];
    expect(errors(run(files).issues)).toContain(
      'texts/deutsch/igel.json|t-sach-901||Dateiname muss der id entsprechen: t-sach-901.json',
    );
  });
});

describe('validateContent – assets', () => {
  const withAsset: Item = { ...numberInput, stimulus: { assetId: 'zahlenstrahl-01', assetAlt: 'Ein Zahlenstrahl von 0 bis 100' } };

  it('reports a missing SVG for stimulus.assetId', () => {
    expect(errors(run(toFiles({ items: [withAsset] })).issues)).toEqual([
      'items/mathe/zahlen-operationen.json|m-zo-1-001|stimulus.assetId|Asset fehlt: assets/svg/zahlenstrahl-01.svg',
    ]);
  });

  it('reports missing SVGs for single-choice option assets', () => {
    const item = structuredClone(singleChoice);
    item.payload.options[1] = { id: 'b', text: 'Würfel', assetId: 'wuerfel' };
    expect(errors(run(toFiles({ items: [item] })).issues)).toEqual([
      'items/mathe/groessen-messen.json|m-gm-2-004|payload.options[1].assetId|Asset fehlt: assets/svg/wuerfel.svg',
    ]);
  });

  it('accepts existing assets', () => {
    const { issues } = run(toFiles({ items: [withAsset] }), { assetExists: (id) => id === 'zahlenstrahl-01' });
    expect(issues).toEqual([]);
  });
});

describe('validateContent – reading texts', () => {
  function readingSet() {
    const text = structuredClone(sachtext);
    const items = text.itemIds.map((id) => {
      const niveau = Number(id.split('-')[2]) as 1 | 2 | 3;
      return cloneItem(findError, 'lesen-sachtext', niveau, Number(id.split('-')[3]), { stimulus: { textRef: text.id } });
    });
    return { text, items };
  }

  it('accepts a text whose items reference it', () => {
    const { text, items } = readingSet();
    expect(run(toFiles({ items, texts: [text] })).issues).toEqual([]);
  });

  it('reports a textRef to a missing text', () => {
    const { items } = readingSet();
    expect(errors(run(toFiles({ items })).issues)).toContain(
      'items/deutsch/lesen-sachtext.json|d-lsa-1-901|stimulus.textRef|Lesetext "t-sach-901" existiert nicht',
    );
  });

  it('reports text.itemIds pointing to missing items or items without textRef', () => {
    const { text, items } = readingSet();
    const [first, ...rest] = items;
    const withoutRef = { ...first, stimulus: undefined } as Item;
    const result = errors(run(toFiles({ items: [withoutRef, ...rest.slice(1)], texts: [text] })).issues);
    expect(result).toContain(
      'texts/deutsch/t-sach-901.json|t-sach-901|itemIds[0]|Item "d-lsa-1-901" verweist nicht per stimulus.textRef auf diesen Text',
    );
    expect(result).toContain('texts/deutsch/t-sach-901.json|t-sach-901|itemIds[1]|Item "d-lsa-1-902" existiert nicht');
  });

  it('reports an item referencing a text that does not list it', () => {
    const { text, items } = readingSet();
    const extra = cloneItem(findError, 'lesen-sachtext', 3, 950, { stimulus: { textRef: text.id } });
    expect(errors(run(toFiles({ items: [...items, extra], texts: [text] })).issues)).toContain(
      'items/deutsch/lesen-sachtext.json|d-lsa-3-950|stimulus.textRef|Lesetext "t-sach-901" listet dieses Item nicht in itemIds',
    );
  });

  it('requires itemIds sorted ascending by niveau', () => {
    const { text, items } = readingSet();
    text.itemIds = [...text.itemIds].reverse();
    expect(errors(run(toFiles({ items, texts: [text] })).issues).some((e) => e.includes('aufsteigend nach Niveau'))).toBe(true);
  });

  it('requires items of a sachtext to be in lesen-sachtext', () => {
    const { text, items } = readingSet();
    const literarischText = { ...text, id: 't-lit-901', kind: 'literarisch' as const };
    const relinked = items.map((i) => ({ ...i, stimulus: { textRef: 't-lit-901' } }));
    expect(errors(run(toFiles({ items: relinked, texts: [literarischText] })).issues).some((e) => e.includes('erwartet "lesen-literarisch"'))).toBe(true);
  });

  it('warns when wordCount differs clearly from the counted words', () => {
    const { text, items } = readingSet();
    text.wordCount = 220;
    const { issues } = run(toFiles({ items, texts: [text] }));
    expect(issues).toEqual([expect.objectContaining({ severity: 'warning', path: 'wordCount' })]);
  });
});

describe('validateContent – soft checks', () => {
  it('warns when an order item is delivered already sorted', () => {
    const sorted = structuredClone(order);
    sorted.payload.items = sorted.solution.orderedIds.map((id) => sorted.payload.items.find((i) => i.id === id)!);
    const { issues } = run(toFiles({ items: [sorted] }));
    expect(issues).toEqual([expect.objectContaining({ severity: 'warning', path: 'payload.items' })]);
  });

  it('suggests keepOrder when the options only name picture labels (A, B, …)', () => {
    const labels = structuredClone(singleChoice);
    labels.payload.options = labels.payload.options.map((o, i) => ({ ...o, text: `Figur ${'ABCD'[i]}` }));
    expect(run(toFiles({ items: [labels] })).issues).toEqual([
      expect.objectContaining({ severity: 'warning', path: 'payload.keepOrder' }),
    ]);
    labels.payload.keepOrder = true;
    expect(run(toFiles({ items: [labels] })).issues).toEqual([]);
  });
});

describe('validateContent – probetest rules (§6)', () => {
  it('accepts a valid Mathe probetest', () => {
    const { items, probetest } = buildMatheProbetest();
    expect(run(toFiles({ items, probetests: [probetest] })).issues).toEqual([]);
  });

  it('accepts a valid Deutsch probetest', () => {
    const { items, texts, probetest } = buildDeutschProbetest();
    expect(run(toFiles({ items, texts, probetests: [probetest] })).issues).toEqual([]);
  });

  it('reports missing items, items of the other fach and retired items', () => {
    const { items, probetest } = buildMatheProbetest();
    const retired = { ...items[0], status: 'retired' } as Item;
    probetest.itemIds[1] = 'm-zo-1-999';
    probetest.itemIds[2] = findError.id;
    const result = errors(run(toFiles({ items: [retired, ...items.slice(1), findError], probetests: [probetest] })).issues);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.stringContaining('itemIds[0]|Item "m-zo-1-900" ist retired'),
        expect.stringContaining('itemIds[1]|Item "m-zo-1-999" existiert nicht'),
        expect.stringContaining('itemIds[2]|Item "d-rss-1-002" gehört zum Fach "deutsch"'),
      ]),
    );
  });

  it('reports declared mixes that contradict the items', () => {
    const { items, probetest } = buildMatheProbetest();
    // Swap a niveau-1 item for a niveau-2 item: still within ±1, but the declaration is now wrong.
    const swapped = cloneItem(numberInput, 'zahlen-operationen', 2, 950, { estimatedSeconds: 120 });
    probetest.itemIds[0] = swapped.id;
    const result = errors(run(toFiles({ items: [...items, swapped], probetests: [probetest] })).issues);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.stringContaining('niveauMix.1|niveauMix[1] ist 8, die Items ergeben 7'),
        expect.stringContaining('niveauMix.2|niveauMix[2] ist 8, die Items ergeben 9'),
      ]),
    );
  });

  it('requires the estimated time between 35 and 42 minutes', () => {
    const { items, probetest } = buildMatheProbetest();
    const quick = items.map((i) => ({ ...i, estimatedSeconds: 60 }));
    expect(errors(run(toFiles({ items: quick, probetests: [probetest] })).issues)).toEqual([
      'probetests/mathe-01.json|mathe-01|itemIds|Summe estimatedSeconds ist 20.0 Min., erlaubt sind 35–42 Min.',
    ]);
  });

  it('allows at most 15 % short-answer items', () => {
    const { items, probetest } = buildMatheProbetest();
    // 4 of 20 = 20 %: replace items keeping id, bereich and niveau.
    const mixed = items.map((item, i) => (i < 4 ? ({ ...shortAnswer, id: item.id, bereich: item.bereich, niveau: item.niveau, estimatedSeconds: 120 } as Item) : item));
    expect(errors(run(toFiles({ items: mixed, probetests: [probetest] })).issues)).toEqual([
      'probetests/mathe-01.json|mathe-01|itemIds|short-answer-Anteil 4/20 liegt über 15 %',
    ]);
    const three = mixed.map((item, i) => (i === 3 ? items[3]! : item));
    expect(run(toFiles({ items: three, probetests: [probetest] })).issues).toEqual([]);
  });

  it('Deutsch must start with reading and end with spelling', () => {
    const { items, texts, probetest } = buildDeutschProbetest();
    probetest.itemIds = [...probetest.itemIds].reverse();
    const result = errors(run(toFiles({ items, texts, probetests: [probetest] })).issues);
    expect(result).toEqual(
      expect.arrayContaining([
        expect.stringContaining('Deutsch-Probetest muss mit Lesen beginnen'),
        expect.stringContaining('Deutsch-Probetest muss mit Rechtschreibung enden'),
      ]),
    );
  });

  it('Deutsch must not put reading items after spelling items', () => {
    const { items, texts, probetest } = buildDeutschProbetest();
    const ids = [...probetest.itemIds];
    // Move one spelling item into the middle of the reading block.
    const [spelling] = ids.splice(10, 1);
    ids.splice(5, 0, spelling!);
    probetest.itemIds = ids;
    const result = errors(run(toFiles({ items, texts, probetests: [probetest] })).issues);
    expect(result.length).toBeGreaterThan(0);
    expect(result.every((e) => e.includes('steht nach Rechtschreibung'))).toBe(true);
  });

  it('Deutsch needs exactly 2 reading texts', () => {
    const { items, texts, probetest } = buildDeutschProbetest();
    // Literary items without textRef: only one text remains in the probetest.
    const unlinked = items.map((i) => (i.bereich === 'lesen-literarisch' ? ({ ...i, stimulus: undefined } as Item) : i));
    const result = errors(run(toFiles({ items: unlinked, texts: texts.slice(0, 1), probetests: [probetest] })).issues);
    expect(result).toEqual([
      'probetests/deutsch-01.json|deutsch-01|itemIds|Deutsch-Probetest braucht genau 2 Lesetexte, gefunden: 1',
    ]);
  });
});
