import { describe, expect, it } from 'vitest';
import {
  BEREICHE_BY_FACH,
  FORMATS,
  formatIssuePath,
  itemSchema,
  probetestSchema,
  readingTextSchema,
  schemaVersionFileSchema,
  type Item,
} from '../../../src/domain/content';
import {
  clozeSelect,
  findError,
  markInText,
  match,
  multiChoice,
  numberInput,
  order,
  sachtext,
  shortAnswer,
  singleChoice,
  validItemsByFormat,
} from '../../fixtures/items';
import { buildDeutschProbetest, buildMatheProbetest } from '../../fixtures/builders';

/** Returns the formatted paths of all issues, or [] if the data is valid. */
function issuePaths(schema: { safeParse(d: unknown): { success: boolean; error?: { issues: { path: PropertyKey[] }[] } } }, data: unknown): string[] {
  const result = schema.safeParse(data);
  return result.success ? [] : (result.error?.issues ?? []).map((i) => formatIssuePath(i.path));
}

/** Deep-clones an item and applies a mutation. */
function mutate<T extends Item>(item: T, fn: (draft: T) => void): T {
  const draft = structuredClone(item);
  fn(draft);
  return draft;
}

describe('itemSchema – one valid example per format', () => {
  it('covers all 9 formats', () => {
    expect(Object.keys(validItemsByFormat).sort()).toEqual([...FORMATS].sort());
  });

  it.each(Object.entries(validItemsByFormat))('%s is valid', (_format, item) => {
    expect(issuePaths(itemSchema, item)).toEqual([]);
  });
});

describe('itemSchema – one invalid example per format', () => {
  const cases: [string, Item, string][] = [
    ['single-choice: solution points to a missing option', mutate(singleChoice, (d) => (d.solution.optionId = 'z')), 'solution.optionId'],
    ['multi-choice: solution contains an unknown option', mutate(multiChoice, (d) => (d.solution.optionIds = ['a', 'x'])), 'solution.optionIds[1]'],
    ['number-input: decimal solution without allowDecimal', mutate(numberInput, (d) => (d.solution.value = 7603.5)), 'solution.value'],
    ['match: a left entry is not paired', mutate(match, (d) => (d.solution.pairs = d.solution.pairs.slice(0, 2))), 'solution.pairs'],
    ['order: orderedIds misses an element', mutate(order, (d) => (d.solution.orderedIds = ['b', 'd', 'a'])), 'solution.orderedIds'],
    ['cloze-select: solution is not one of the gap options', mutate(clozeSelect, (d) => (d.solution.gaps['2'] = 'Hunnd')), 'solution.gaps.2'],
    ['mark-in-text: index outside the text', mutate(markInText, (d) => (d.solution.indices = [1, 4, 7])), 'solution.indices[2]'],
    ['find-error: errorId does not exist', mutate(findError, (d) => { d.solution.errorIds = ['w9']; d.solution.corrections = { w9: 'See' }; }), 'solution.errorIds[0]'],
    ['short-answer: no key points', mutate(shortAnswer, (d) => (d.solution.keyPoints = [])), 'solution.keyPoints'],
  ];

  it('has a case for every format', () => {
    expect(new Set(cases.map(([, item]) => item.format))).toEqual(new Set(FORMATS));
  });

  it.each(cases)('%s', (_name, item, expectedPath) => {
    expect(issuePaths(itemSchema, item)).toContain(expectedPath);
  });
});

describe('itemSchema – format bounds from CONTENT_SCHEMA.md §4', () => {
  it.each<[string, Item, string]>([
    ['single-choice needs 3–4 options', mutate(singleChoice, (d) => (d.payload.options = d.payload.options.slice(0, 2))), 'payload.options'],
    ['multi-choice needs 2–3 correct options', mutate(multiChoice, (d) => (d.solution.optionIds = ['a'])), 'solution.optionIds'],
    ['multi-choice minSelect above the number of correct options', mutate(multiChoice, (d) => (d.payload.minSelect = 4)), 'payload.minSelect'],
    ['multi-choice minSelect below the number of correct options', mutate(multiChoice, (d) => (d.payload.minSelect = 2)), 'payload.minSelect'],
    ['number-input solution must fit maxDigits', mutate(numberInput, (d) => (d.payload.maxDigits = 3)), 'payload.maxDigits'],
    ['match allows at most one distractor', mutate(match, (d) => d.payload.right.push({ id: 'r5', text: '10 m' })), 'payload.right'],
    ['match pairs each right entry at most once', mutate(match, (d) => (d.solution.pairs[2] = ['l3', 'r1'])), 'solution.pairs'],
    ['order needs 3–5 elements', mutate(order, (d) => (d.payload.items = d.payload.items.slice(0, 2))), 'payload.items'],
    ['cloze-select gaps have exactly 3 options', mutate(clozeSelect, (d) => d.payload.gaps[0]?.options.push('kaltt')), 'payload.gaps[0].options'],
    ['cloze-select template placeholders must match gaps', mutate(clozeSelect, (d) => (d.payload.template = 'Im Winter ist es oft {1}.')), 'payload.template'],
    ['mark-in-text respects maxSelect', mutate(markInText, (d) => (d.payload.maxSelect = 2)), 'solution.indices'],
    ['find-error has 1–2 errors', mutate(findError, (d) => (d.payload.errorCount = 3)), 'payload.errorCount'],
    ['find-error needs a correction per error', mutate(findError, (d) => (d.solution.corrections = {})), 'solution.corrections'],
    ['short-answer has at most 3 key points', mutate(shortAnswer, (d) => (d.solution.keyPoints = ['a', 'b', 'c', 'd'])), 'solution.keyPoints'],
    ['short-answer: model longer than maxChars (1.0.8)', mutate(shortAnswer, (d) => (d.payload.maxChars = d.solution.model.length - 1)), 'solution.model'],
  ])('%s', (_name, item, expectedPath) => {
    expect(issuePaths(itemSchema, item)).toContain(expectedPath);
  });

  it('number-input accepts a decimal solution when allowDecimal is set', () => {
    const item = mutate(numberInput, (d) => {
      d.payload.allowDecimal = true;
      d.solution.value = 7603.5;
    });
    expect(issuePaths(itemSchema, item)).toEqual([]);
  });

  it('mark-in-text counts sentences when unit is "sentence"', () => {
    const item = mutate(markInText, (d) => {
      d.payload = { text: 'Mia geht los. Es regnet! Ist das schlimm?', unit: 'sentence', maxSelect: 1 };
      d.solution.indices = [2];
    });
    expect(issuePaths(itemSchema, item)).toEqual([]);
    expect(issuePaths(itemSchema, mutate(item, (d) => (d.solution.indices = [3])))).toContain('solution.indices[0]');
  });
});

describe('itemSchema – keepOrder (since 1.0.4)', () => {
  it('is optional and boolean for single- and multi-choice', () => {
    expect(itemSchema.safeParse(mutate(singleChoice, (d) => (d.payload.keepOrder = true))).success).toBe(true);
    expect(itemSchema.safeParse(mutate(multiChoice, (d) => (d.payload.keepOrder = false))).success).toBe(true);
    const wrong = mutate(singleChoice, (d) => Object.assign(d.payload, { keepOrder: 'ja' }));
    expect(itemSchema.safeParse(wrong).success).toBe(false);
    const elsewhere = mutate(numberInput, (d) => Object.assign(d.payload, { keepOrder: true }));
    expect(itemSchema.safeParse(elsewhere).success).toBe(false);
  });
});

describe('itemSchema – readAloud on choice options (since 1.0.12)', () => {
  it('is optional on single- and multi-choice options', () => {
    const single = mutate(singleChoice, (d) => Object.assign(d.payload.options[0]!, { readAloud: 'Kissen' }));
    expect(issuePaths(itemSchema, single)).toEqual([]);
    const multi = mutate(multiChoice, (d) => Object.assign(d.payload.options[1]!, { readAloud: 'Fluss' }));
    expect(issuePaths(itemSchema, multi)).toEqual([]);
  });

  it('must not be empty', () => {
    for (const empty of ['', '   ']) {
      const item = mutate(multiChoice, (d) => Object.assign(d.payload.options[0]!, { readAloud: empty }));
      expect(issuePaths(itemSchema, item)).toContain('payload.options[0].readAloud');
    }
  });

  it('is not allowed on cards, elements or words of other formats', () => {
    const cards = mutate(match, (d) => Object.assign(d.payload.left[0]!, { readAloud: 'x' }));
    expect(issuePaths(itemSchema, cards)).toContain('payload.left[0]');
    const elements = mutate(order, (d) => Object.assign(d.payload.items[0]!, { readAloud: 'x' }));
    expect(issuePaths(itemSchema, elements)).toContain('payload.items[0]');
    const words = mutate(findError, (d) => Object.assign(d.payload.words[0]!, { readAloud: 'x' }));
    expect(issuePaths(itemSchema, words)).toContain('payload.words[0]');
  });
});

describe('itemSchema – common fields (§2, §3)', () => {
  it('rejects an unknown format', () => {
    expect(issuePaths(itemSchema, { ...numberInput, format: 'drawing' })).toContain('format');
  });

  it('rejects unknown keys (typos must not slip through)', () => {
    expect(issuePaths(itemSchema, { ...numberInput, readaloud: 'x' })).toEqual(['']);
  });

  it('rejects an id that does not follow {fach}-{bereich}-{niveau}-{laufnr}', () => {
    expect(issuePaths(itemSchema, { ...numberInput, id: 'm-zo-1-1' })).toContain('id');
  });

  it('rejects an id whose prefix contradicts fach/bereich/niveau', () => {
    expect(issuePaths(itemSchema, { ...numberInput, id: 'm-zo-2-001' })).toContain('id');
    expect(issuePaths(itemSchema, { ...numberInput, id: 'm-gm-1-001' })).toContain('id');
  });

  it('rejects a bereich that belongs to the other fach', () => {
    expect(issuePaths(itemSchema, { ...numberInput, bereich: 'rs-strategien' })).toContain('bereich');
  });

  it('rejects niveau outside 1–3 and an unknown status', () => {
    expect(issuePaths(itemSchema, { ...numberInput, niveau: 4 })).toContain('niveau');
    expect(issuePaths(itemSchema, { ...numberInput, status: 'published' })).toContain('status');
  });

  it('requires assetAlt when assetId is set', () => {
    const item = { ...numberInput, stimulus: { assetId: 'zahlenstrahl-01' } };
    expect(issuePaths(itemSchema, item)).toContain('stimulus.assetAlt');
    expect(issuePaths(itemSchema, { ...item, stimulus: { ...item.stimulus, assetAlt: 'Ein Zahlenstrahl' } })).toEqual([]);
  });

  it('rejects asset ids that are not safe file names', () => {
    const item = { ...numberInput, stimulus: { assetId: '../secret', assetAlt: 'x' } };
    expect(issuePaths(itemSchema, item)).toContain('stimulus.assetId');
  });

  it('allows textRef only in reading areas', () => {
    expect(issuePaths(itemSchema, { ...findError, stimulus: { textRef: 't-sach-001' } })).toContain('stimulus.textRef');
    const reading = { ...findError, id: 'd-lsa-1-002', bereich: 'lesen-sachtext', stimulus: { textRef: 't-sach-001' } };
    expect(issuePaths(itemSchema, reading)).toEqual([]);
  });

  it('requires schemaVersion "1.0" and an ISO date in meta.createdAt', () => {
    expect(issuePaths(itemSchema, { ...numberInput, schemaVersion: '1.1' })).toContain('schemaVersion');
    expect(issuePaths(itemSchema, { ...numberInput, meta: { ...numberInput.meta, createdAt: '11.10.2026' } })).toContain(
      'meta.createdAt',
    );
  });

  it('knows the calibration kompass4-2025 (since 1.0.20) and nothing unlisted', () => {
    const meta = (calibration: string) => ({ ...numberInput, meta: { ...numberInput.meta, calibration } });
    expect(issuePaths(itemSchema, meta('kompass4-2025'))).toEqual([]);
    expect(issuePaths(itemSchema, meta('kompass4-2024'))).toContain('meta.calibration');
  });

  it('rejects empty prompt and non-positive estimatedSeconds', () => {
    expect(issuePaths(itemSchema, { ...numberInput, prompt: '  ' })).toContain('prompt');
    expect(issuePaths(itemSchema, { ...numberInput, estimatedSeconds: 0 })).toContain('estimatedSeconds');
  });
});

describe('readingTextSchema (§5)', () => {
  it('accepts a valid text', () => {
    expect(issuePaths(readingTextSchema, sachtext)).toEqual([]);
  });

  it.each<[string, object, string]>([
    ['wordCount below 150', { wordCount: 120 }, 'wordCount'],
    ['fewer than 4 items', { itemIds: sachtext.itemIds.slice(0, 3) }, 'itemIds'],
    ['more than 6 items', { itemIds: [...sachtext.itemIds, 'd-lsa-3-902', 'd-lsa-3-903'] }, 'itemIds'],
    ['id prefix does not match kind', { kind: 'literarisch' }, 'id'],
    ['malformed id', { id: 'igel' }, 'id'],
  ])('rejects %s', (_name, patch, expectedPath) => {
    expect(issuePaths(readingTextSchema, { ...sachtext, ...patch })).toContain(expectedPath);
  });
});

describe('probetestSchema (§6)', () => {
  const { probetest } = buildMatheProbetest();

  it('accepts a valid probetest', () => {
    expect(issuePaths(probetestSchema, probetest)).toEqual([]);
  });

  it('requires durationMinutes 45', () => {
    expect(issuePaths(probetestSchema, { ...probetest, durationMinutes: 30 })).toContain('durationMinutes');
  });

  it('requires 18–24 items', () => {
    const itemIds = probetest.itemIds.slice(0, 17);
    expect(issuePaths(probetestSchema, { ...probetest, itemIds })).toContain('itemIds');
  });

  // The niveau band (1.0.23): I 29–44 %, II 38–55 %, III 16–23 % of the items, no rounding, no ±1.
  const niveauIssues = ([n1, n2, n3]: [number, number, number]) => {
    const itemIds = Array.from({ length: n1 + n2 + n3 }, (_, i) => `m-zo-1-${900 + i}`);
    const p = { ...probetest, itemIds, niveauMix: { 1: n1, 2: n2, 3: n3 } };
    return issuePaths(probetestSchema, p).filter((path) => path.startsWith('niveauMix'));
  };

  it.each([
    ['10/10/4 (deutsch-01/02, mathe-01/02)', [10, 10, 4]],
    ['9/8/4 at 21 items (deutsch-03)', [9, 8, 4]],
    ['7/13/4 (mathe-03, Kompass 4 test mix)', [7, 13, 4]],
    ['7/7/4 at 18 items (deutsch-90, III 22.2 % under 23 %)', [7, 7, 4]],
  ] as const)('accepts the niveau mix %s', (_, mix) => {
    expect(niveauIssues([...mix])).toEqual([]);
  });

  it.each([
    [[24, 0, 0], ['niveauMix.1', 'niveauMix.2', 'niveauMix.3']],
    [[12, 12, 0], ['niveauMix.1', 'niveauMix.3']],
    [[0, 12, 12], ['niveauMix.1', 'niveauMix.3']],
    [[6, 14, 4], ['niveauMix.1', 'niveauMix.2']],
    [[11, 9, 4], ['niveauMix.1', 'niveauMix.2']],
    // 18 items: III 27.8 % over 23 %, II 33.3 % under 38 %.
    [[7, 6, 5], ['niveauMix.2', 'niveauMix.3']],
  ] as const)('rejects the niveau mix %j outside the band', (mix, paths) => {
    expect(niveauIssues([...mix])).toEqual(paths);
  });

  it('requires at least 2 items in every bereich of the fach', () => {
    const p = { ...probetest, bereichMix: { ...probetest.bereichMix, 'raum-form': 1, 'zahlen-operationen': 7 } };
    expect(issuePaths(probetestSchema, p)).toContain('bereichMix.raum-form');
  });

  it.each(BEREICHE_BY_FACH.mathe)('requires every Mathe Bereich, also when %s is missing', (bereich) => {
    const other = BEREICHE_BY_FACH.mathe.find((b) => b !== bereich)!;
    const bereichMix = Object.fromEntries(
      Object.entries(probetest.bereichMix)
        .filter(([b]) => b !== bereich)
        .map(([b, c]) => [b, b === other ? c + probetest.bereichMix[bereich]! : c]),
    );
    expect(issuePaths(probetestSchema, { ...probetest, bereichMix })).toEqual([`bereichMix.${bereich}`]);
  });

  it('accepts a Deutsch probetest without the optional Bereich sprache-untersuchen (1.0.22)', () => {
    const deutsch = buildDeutschProbetest().probetest;
    expect(deutsch.bereichMix).not.toHaveProperty('sprache-untersuchen');
    expect(issuePaths(probetestSchema, deutsch)).toEqual([]);
    // Present, it only counts: 1 item is fine for a Bereich that is not required.
    const p = { ...deutsch, bereichMix: { ...deutsch.bereichMix, 'rs-strategien': 4, 'sprache-untersuchen': 1 } };
    expect(issuePaths(probetestSchema, p)).toEqual([]);
  });

  it('rejects bereiche of the other fach and sums that do not match the item count', () => {
    const p = { ...probetest, bereichMix: { ...probetest.bereichMix, 'rs-strategien': 2 } };
    expect(issuePaths(probetestSchema, p)).toEqual(expect.arrayContaining(['bereichMix.rs-strategien', 'bereichMix']));
  });

  it('rejects an id that does not start with the fach', () => {
    expect(issuePaths(probetestSchema, { ...probetest, id: 'deutsch-01' })).toContain('id');
  });
});

describe('schemaVersionFileSchema (§1)', () => {
  it('accepts version 1.0 only', () => {
    expect(issuePaths(schemaVersionFileSchema, { version: '1.0' })).toEqual([]);
    expect(issuePaths(schemaVersionFileSchema, { version: '2.0' })).toContain('version');
  });
});
