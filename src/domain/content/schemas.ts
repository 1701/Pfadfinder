// Zod schemas mirroring docs/CONTENT_SCHEMA.md v1.0 (frozen).
// Structural rules live in the object shapes; rules that relate fields of the same object
// (e.g. solution ids must exist in the payload) live in superRefine. Rules that need other
// files (textRef, assetId, probetest.itemIds) live in integrity.ts.

import { z } from 'zod';
import {
  BEREICHE,
  BEREICHE_BY_FACH,
  PROBETEST_NIVEAU_BAND,
  PROBETEST_REQUIRED_BEREICHE,
  BEREICH_ABBR,
  FACH_ABBR,
  FAECHER,
  SCHEMA_VERSION,
  fachOfBereich,
  isLesenBereich,
  type Bereich,
  type Fach,
} from './taxonomy';
import { splitUnits } from './units';

type Ctx = z.core.$RefinementCtx;

function fail(ctx: Ctx, path: (string | number)[], message: string): void {
  ctx.addIssue({ code: 'custom', path, message });
}

function findDuplicates(values: readonly string[]): string[] {
  const seen = new Set<string>();
  const dupes = new Set<string>();
  for (const v of values) {
    if (seen.has(v)) dupes.add(v);
    seen.add(v);
  }
  return [...dupes];
}

function sameSet(a: readonly string[], b: readonly string[]): boolean {
  const sa = new Set(a);
  const sb = new Set(b);
  return sa.size === sb.size && [...sa].every((v) => sb.has(v));
}

const text = z.string().trim().min(1);
const localId = z.string().trim().min(1);
/** Asset ids are file names in content/assets/svg, so they must be safe path segments. */
export const assetIdSchema = z
  .string()
  .regex(/^[a-z0-9][a-z0-9-]*$/, 'assetId: nur Kleinbuchstaben, Ziffern und "-" (Dateiname ohne .svg)');
const isoDate = z.union([z.iso.date(), z.iso.datetime({ offset: true })]);

export const fachSchema = z.enum(FAECHER);
export const bereichSchema = z.enum(BEREICHE);
export const niveauSchema = z.union([z.literal(1), z.literal(2), z.literal(3)]);
export const itemStatusSchema = z.enum(['draft', 'piloted', 'approved', 'retired']);

export const ITEM_ID_PATTERN = /^(m|d)-([a-z]{2,3})-([1-3])-(\d{3})$/;

// ---------------------------------------------------------------------------
// Common item fields (§3)

const stimulusSchema = z
  .strictObject({
    text: text.optional(),
    assetId: assetIdSchema.optional(),
    assetAlt: text.optional(),
    textRef: localId.optional(),
  })
  .superRefine((s, ctx) => {
    if (s.assetId !== undefined && s.assetAlt === undefined) {
      fail(ctx, ['assetAlt'], 'assetAlt ist Pflicht, wenn assetId gesetzt ist');
    }
  });

const feedbackSchema = z.strictObject({
  correct: text,
  incorrect: text,
  misconception: text.optional(),
});

const metaSchema = z.strictObject({
  author: text,
  createdAt: isoDate,
  calibration: z.enum(['original-2024', 'iqb', 'vera3', 'kompass4-2025', 'none']).optional(),
  pilotNote: text.optional(),
});

const itemBase = {
  id: z.string().regex(ITEM_ID_PATTERN, 'id muss dem Muster {fach}-{bereich}-{niveau}-{laufnr} folgen, z. B. m-zo-2-014'),
  schemaVersion: z.literal(SCHEMA_VERSION),
  fach: fachSchema,
  bereich: bereichSchema,
  niveau: niveauSchema,
  status: itemStatusSchema,
  stimulus: stimulusSchema.optional(),
  prompt: text,
  readAloud: text.optional(),
  feedback: feedbackSchema,
  tags: z.array(text),
  estimatedSeconds: z.number().int().positive(),
  meta: metaSchema,
};

// ---------------------------------------------------------------------------
// Formats (§4)

const optionSchema = z.strictObject({ id: localId, text });
/** Since schema 1.0.12: a choice option can be read aloud differently, e.g. "Kissen" for "Ki_en". */
const choiceOptionSchema = optionSchema.extend({ readAloud: text.optional() });
/** Since schema 1.0.4: options keep their order, e.g. when they name labels A–D of a picture. */
const keepOrder = z.boolean().optional();

const singleChoiceItem = z
  .strictObject({
    ...itemBase,
    format: z.literal('single-choice'),
    payload: z.strictObject({
      options: z.array(choiceOptionSchema.extend({ assetId: assetIdSchema.optional() })).min(3).max(4),
      keepOrder,
    }),
    solution: z.strictObject({ optionId: localId }),
  })
  .superRefine((item, ctx) => {
    const ids = item.payload.options.map((o) => o.id);
    for (const d of findDuplicates(ids)) fail(ctx, ['payload', 'options'], `Doppelte Option-ID "${d}"`);
    if (!ids.includes(item.solution.optionId)) {
      fail(ctx, ['solution', 'optionId'], `Option "${item.solution.optionId}" existiert nicht in payload.options`);
    }
  });

const multiChoiceItem = z
  .strictObject({
    ...itemBase,
    format: z.literal('multi-choice'),
    payload: z.strictObject({
      options: z.array(choiceOptionSchema).min(4).max(5),
      minSelect: z.number().int().min(1),
      keepOrder,
    }),
    solution: z.strictObject({ optionIds: z.array(localId).min(2).max(3) }),
  })
  .superRefine((item, ctx) => {
    const ids = item.payload.options.map((o) => o.id);
    for (const d of findDuplicates(ids)) fail(ctx, ['payload', 'options'], `Doppelte Option-ID "${d}"`);
    for (const d of findDuplicates(item.solution.optionIds)) {
      fail(ctx, ['solution', 'optionIds'], `Option "${d}" ist doppelt in der Lösung`);
    }
    item.solution.optionIds.forEach((id, i) => {
      if (!ids.includes(id)) fail(ctx, ['solution', 'optionIds', i], `Option "${id}" existiert nicht in payload.options`);
    });
    // Since schema 1.0.1: minSelect tells the child exactly how many options to pick.
    if (item.payload.minSelect !== item.solution.optionIds.length) {
      fail(
        ctx,
        ['payload', 'minSelect'],
        `minSelect (${item.payload.minSelect}) muss der Anzahl richtiger Optionen (${item.solution.optionIds.length}) entsprechen`,
      );
    }
  });

const numberInputItem = z
  .strictObject({
    ...itemBase,
    format: z.literal('number-input'),
    payload: z.strictObject({
      unit: text.optional(),
      allowDecimal: z.boolean().optional(),
      maxDigits: z.number().int().min(1),
    }),
    solution: z.strictObject({
      value: z.number().finite(),
      tolerance: z.number().nonnegative().optional(),
    }),
  })
  .superRefine((item, ctx) => {
    const { value } = item.solution;
    if (!item.payload.allowDecimal && !Number.isInteger(value)) {
      fail(ctx, ['solution', 'value'], 'Kommazahl als Lösung, aber payload.allowDecimal ist nicht gesetzt');
    }
    const digits = String(Math.abs(value)).replace('.', '').length;
    if (digits > item.payload.maxDigits) {
      fail(ctx, ['payload', 'maxDigits'], `Lösung ${value} hat ${digits} Ziffern, maxDigits ist ${item.payload.maxDigits}`);
    }
  });

const matchItem = z
  .strictObject({
    ...itemBase,
    format: z.literal('match'),
    payload: z.strictObject({
      left: z.array(optionSchema).min(3).max(5),
      right: z.array(optionSchema).min(3).max(6),
    }),
    solution: z.strictObject({ pairs: z.array(z.tuple([localId, localId])) }),
  })
  .superRefine((item, ctx) => {
    const leftIds = item.payload.left.map((o) => o.id);
    const rightIds = item.payload.right.map((o) => o.id);
    for (const d of findDuplicates(leftIds)) fail(ctx, ['payload', 'left'], `Doppelte ID "${d}"`);
    for (const d of findDuplicates(rightIds)) fail(ctx, ['payload', 'right'], `Doppelte ID "${d}"`);
    const extra = rightIds.length - leftIds.length;
    if (extra < 0 || extra > 1) {
      fail(ctx, ['payload', 'right'], 'right muss gleich viele Einträge wie left haben, höchstens einen Distraktor mehr');
    }
    const pairLeft = item.solution.pairs.map(([l]) => l);
    const pairRight = item.solution.pairs.map(([, r]) => r);
    if (!sameSet(pairLeft, leftIds) || pairLeft.length !== leftIds.length) {
      fail(ctx, ['solution', 'pairs'], 'Jeder linke Eintrag muss genau einmal zugeordnet sein');
    }
    for (const d of findDuplicates(pairRight)) fail(ctx, ['solution', 'pairs'], `Rechter Eintrag "${d}" ist mehrfach zugeordnet`);
    item.solution.pairs.forEach(([l, r], i) => {
      if (!leftIds.includes(l)) fail(ctx, ['solution', 'pairs', i, 0], `"${l}" existiert nicht in payload.left`);
      if (!rightIds.includes(r)) fail(ctx, ['solution', 'pairs', i, 1], `"${r}" existiert nicht in payload.right`);
    });
  });

const orderItem = z
  .strictObject({
    ...itemBase,
    format: z.literal('order'),
    payload: z.strictObject({ items: z.array(optionSchema).min(3).max(5) }),
    solution: z.strictObject({ orderedIds: z.array(localId) }),
  })
  .superRefine((item, ctx) => {
    const ids = item.payload.items.map((o) => o.id);
    for (const d of findDuplicates(ids)) fail(ctx, ['payload', 'items'], `Doppelte ID "${d}"`);
    const { orderedIds } = item.solution;
    if (orderedIds.length !== ids.length || !sameSet(orderedIds, ids) || findDuplicates(orderedIds).length > 0) {
      fail(ctx, ['solution', 'orderedIds'], 'orderedIds muss jede ID aus payload.items genau einmal enthalten');
    }
  });

const GAP_PATTERN = /\{([^{}]+)\}/g;

const clozeSelectItem = z
  .strictObject({
    ...itemBase,
    format: z.literal('cloze-select'),
    payload: z.strictObject({
      template: text,
      gaps: z
        .array(z.strictObject({ key: localId, options: z.array(text).length(3) }))
        .min(1)
        .max(3),
    }),
    solution: z.strictObject({ gaps: z.record(z.string(), text) }),
  })
  .superRefine((item, ctx) => {
    const keys = item.payload.gaps.map((g) => g.key);
    for (const d of findDuplicates(keys)) fail(ctx, ['payload', 'gaps'], `Doppelte Lücke "${d}"`);
    const placeholders = [...item.payload.template.matchAll(GAP_PATTERN)].map((m) => m[1] ?? '');
    for (const d of findDuplicates(placeholders)) {
      fail(ctx, ['payload', 'template'], `Lücke {${d}} kommt mehrfach im Template vor`);
    }
    if (!sameSet(placeholders, keys)) {
      fail(ctx, ['payload', 'template'], 'Platzhalter im Template und payload.gaps[].key stimmen nicht überein');
    }
    item.payload.gaps.forEach((gap, i) => {
      for (const d of findDuplicates(gap.options)) fail(ctx, ['payload', 'gaps', i, 'options'], `Doppelte Option "${d}"`);
      const chosen = item.solution.gaps[gap.key];
      if (chosen === undefined) {
        fail(ctx, ['solution', 'gaps'], `Lösung für Lücke "${gap.key}" fehlt`);
      } else if (!gap.options.includes(chosen)) {
        fail(ctx, ['solution', 'gaps', gap.key], `"${chosen}" ist keine Option der Lücke "${gap.key}"`);
      }
    });
    for (const key of Object.keys(item.solution.gaps)) {
      if (!keys.includes(key)) fail(ctx, ['solution', 'gaps', key], `Lücke "${key}" existiert nicht in payload.gaps`);
    }
  });

const markInTextItem = z
  .strictObject({
    ...itemBase,
    format: z.literal('mark-in-text'),
    payload: z.strictObject({
      text,
      unit: z.enum(['word', 'sentence']),
      maxSelect: z.number().int().min(1),
    }),
    solution: z.strictObject({ indices: z.array(z.number().int().nonnegative()).min(1) }),
  })
  .superRefine((item, ctx) => {
    const unitCount = splitUnits(item.payload.text, item.payload.unit).length;
    const { indices } = item.solution;
    if (new Set(indices).size !== indices.length) fail(ctx, ['solution', 'indices'], 'Doppelte Indizes');
    if (indices.length > item.payload.maxSelect) {
      fail(ctx, ['solution', 'indices'], `Mehr Indizes (${indices.length}) als maxSelect (${item.payload.maxSelect})`);
    }
    indices.forEach((idx, i) => {
      if (idx >= unitCount) {
        fail(ctx, ['solution', 'indices', i], `Index ${idx} liegt außerhalb des Textes (${unitCount} Einheiten vom Typ "${item.payload.unit}")`);
      }
    });
  });

const findErrorItem = z
  .strictObject({
    ...itemBase,
    format: z.literal('find-error'),
    payload: z.strictObject({
      words: z.array(optionSchema).min(2),
      errorCount: z.number().int().min(1).max(2),
    }),
    solution: z.strictObject({
      errorIds: z.array(localId).min(1).max(2),
      corrections: z.record(z.string(), text),
    }),
  })
  .superRefine((item, ctx) => {
    const words = new Map(item.payload.words.map((w) => [w.id, w.text]));
    for (const d of findDuplicates(item.payload.words.map((w) => w.id))) {
      fail(ctx, ['payload', 'words'], `Doppelte Wort-ID "${d}"`);
    }
    const { errorIds, corrections } = item.solution;
    if (errorIds.length !== item.payload.errorCount || findDuplicates(errorIds).length > 0) {
      fail(ctx, ['solution', 'errorIds'], `errorIds muss genau ${item.payload.errorCount} verschiedene Wörter enthalten`);
    }
    errorIds.forEach((id, i) => {
      if (!words.has(id)) fail(ctx, ['solution', 'errorIds', i], `Wort "${id}" existiert nicht in payload.words`);
    });
    if (!sameSet(Object.keys(corrections), errorIds)) {
      fail(ctx, ['solution', 'corrections'], 'corrections muss genau für jede errorId eine Schreibung enthalten');
    }
    for (const [id, fixed] of Object.entries(corrections)) {
      if (words.get(id) === fixed) fail(ctx, ['solution', 'corrections', id], 'Korrektur ist identisch mit dem Wort');
    }
  });

const shortAnswerItem = z
  .strictObject({
    ...itemBase,
    format: z.literal('short-answer'),
    payload: z.strictObject({
      maxChars: z.number().int().min(1),
      hint: text.optional(),
    }),
    solution: z.strictObject({
      model: text,
      keyPoints: z.array(text).min(1).max(3),
    }),
  })
  .superRefine((item, ctx) => {
    // Since schema 1.0.8: the child compares with a model it could have written itself.
    const { model } = item.solution;
    if (model.length > item.payload.maxChars) {
      fail(ctx, ['solution', 'model'], `Musterlösung hat ${model.length} Zeichen, maxChars ist ${item.payload.maxChars}`);
    }
  });

export const FORMATS = [
  'single-choice',
  'multi-choice',
  'number-input',
  'match',
  'order',
  'cloze-select',
  'mark-in-text',
  'find-error',
  'short-answer',
] as const;
export const formatSchema = z.enum(FORMATS);

export const itemSchema = z
  .discriminatedUnion('format', [
    singleChoiceItem,
    multiChoiceItem,
    numberInputItem,
    matchItem,
    orderItem,
    clozeSelectItem,
    markInTextItem,
    findErrorItem,
    shortAnswerItem,
  ])
  .superRefine((item, ctx) => {
    if (fachOfBereich(item.bereich) !== item.fach) {
      fail(ctx, ['bereich'], `Bereich "${item.bereich}" gehört nicht zum Fach "${item.fach}"`);
    }
    const m = ITEM_ID_PATTERN.exec(item.id);
    if (m) {
      const expected = `${FACH_ABBR[item.fach]}-${BEREICH_ABBR[item.bereich]}-${item.niveau}`;
      if (`${m[1]}-${m[2]}-${m[3]}` !== expected) {
        fail(ctx, ['id'], `id passt nicht zu fach/bereich/niveau, erwartet Präfix "${expected}-"`);
      }
    }
    if (item.stimulus?.textRef !== undefined && !isLesenBereich(item.bereich)) {
      fail(ctx, ['stimulus', 'textRef'], 'textRef ist nur in den Bereichen lesen-sachtext und lesen-literarisch erlaubt');
    }
  });

// ---------------------------------------------------------------------------
// ReadingText (§5)

export const readingTextSchema = z
  .strictObject({
    id: z.string().regex(/^t-(sach|lit)-\d{3}$/, 'id muss dem Muster t-sach-NNN oder t-lit-NNN folgen'),
    kind: z.enum(['sachtext', 'literarisch']),
    title: text,
    wordCount: z.number().int().min(150).max(250),
    paragraphs: z.array(text).min(1),
    readAloud: z.boolean(),
    itemIds: z.array(z.string().regex(ITEM_ID_PATTERN)).min(4).max(6),
  })
  .superRefine((t, ctx) => {
    const expectedPrefix = t.kind === 'sachtext' ? 't-sach-' : 't-lit-';
    if (!t.id.startsWith(expectedPrefix)) fail(ctx, ['id'], `id muss bei kind "${t.kind}" mit "${expectedPrefix}" beginnen`);
    for (const d of findDuplicates(t.itemIds)) fail(ctx, ['itemIds'], `Item "${d}" ist doppelt gelistet`);
  });

// ---------------------------------------------------------------------------
// Probetest (§6)

export const PROBETEST_ITEM_RANGE = { min: 18, max: 24 } as const;
/**
 * Time per Fach (§6): Mathe since 1.0.9, Deutsch since 1.0.16. These are app times; the 45-minute
 * timer stays, as on paper children may finish early. Deutsch adds the reading time of each text
 * (READING_SECONDS_PER_WORD): the item clock starts after the reading screen.
 */
export const PROBETEST_SECONDS_RANGE: Readonly<Record<Fach, { min: number; max: number }>> = {
  mathe: { min: 24 * 60, max: 32 * 60 },
  deutsch: { min: 24 * 60, max: 32 * 60 },
};
/** Reading time per word of a text in a Deutsch Probetest: 80 words per minute (§6, 1.0.16). */
export const READING_SECONDS_PER_WORD = 0.75;
export const PROBETEST_MAX_SHORT_ANSWER_SHARE = 0.15;
export const PROBETEST_MIN_ITEMS_PER_BEREICH = 2;

const count = z.number().int().nonnegative();

export const probetestSchema = z
  .strictObject({
    id: z.string().regex(/^(mathe|deutsch)-\d{2}$/, 'id muss dem Muster mathe-NN oder deutsch-NN folgen'),
    fach: fachSchema,
    durationMinutes: z.literal(45),
    itemIds: z.array(z.string().regex(ITEM_ID_PATTERN)),
    niveauMix: z.strictObject({ 1: count, 2: count, 3: count }),
    bereichMix: z.partialRecord(bereichSchema, count),
  })
  .superRefine((p, ctx) => {
    const n = p.itemIds.length;
    if (!p.id.startsWith(`${p.fach}-`)) fail(ctx, ['id'], `id muss mit "${p.fach}-" beginnen`);
    for (const d of findDuplicates(p.itemIds)) fail(ctx, ['itemIds'], `Item "${d}" ist doppelt gelistet`);
    if (n < PROBETEST_ITEM_RANGE.min || n > PROBETEST_ITEM_RANGE.max) {
      fail(ctx, ['itemIds'], `Probetest braucht ${PROBETEST_ITEM_RANGE.min}–${PROBETEST_ITEM_RANGE.max} Items, hat ${n}`);
    }

    const niveauSum = p.niveauMix[1] + p.niveauMix[2] + p.niveauMix[3];
    if (niveauSum !== n) fail(ctx, ['niveauMix'], `Summe niveauMix (${niveauSum}) ≠ Anzahl Items (${n})`);
    for (const level of [1, 2, 3] as const) {
      const { min, max } = PROBETEST_NIVEAU_BAND[level];
      const c = p.niveauMix[level];
      if (c < min * n || c > max * n) {
        const range = `${(min * n).toFixed(2)}–${(max * n).toFixed(2)}`;
        fail(ctx, ['niveauMix', String(level)], `Niveau ${level}: ${c} Items, erlaubt ${range} (${Math.round(min * 100)}–${Math.round(max * 100)} %)`);
      }
    }

    const fachBereiche: readonly Bereich[] = BEREICHE_BY_FACH[p.fach];
    let bereichSum = 0;
    for (const [bereich, c] of Object.entries(p.bereichMix) as [Bereich, number][]) {
      bereichSum += c;
      if (!fachBereiche.includes(bereich)) {
        fail(ctx, ['bereichMix', bereich], `Bereich "${bereich}" gehört nicht zum Fach "${p.fach}"`);
      }
    }
    // Only the required Bereiche need 2 items; another Bereich of the Fach may be missing.
    for (const bereich of PROBETEST_REQUIRED_BEREICHE[p.fach]) {
      const c = p.bereichMix[bereich] ?? 0;
      if (c < PROBETEST_MIN_ITEMS_PER_BEREICH) {
        fail(ctx, ['bereichMix', bereich], `Bereich "${bereich}" braucht mindestens ${PROBETEST_MIN_ITEMS_PER_BEREICH} Items, hat ${c}`);
      }
    }
    if (bereichSum !== n) fail(ctx, ['bereichMix'], `Summe bereichMix (${bereichSum}) ≠ Anzahl Items (${n})`);
  });

// ---------------------------------------------------------------------------
// content/schema-version.json (§1)

export const schemaVersionFileSchema = z.strictObject({ version: z.literal(SCHEMA_VERSION) });
