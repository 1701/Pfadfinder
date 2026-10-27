// Validates a whole content tree: schema per file plus cross-file rules
// (file placement, unique ids, textRef, assetId, probetest composition – CONTENT_SCHEMA.md §1, §5, §6;
// typen.json since 1.0.27).
// Pure: file system access is injected by the caller (scripts/validate-content.ts).

import type { z } from 'zod';
import {
  PROBETEST_MAX_SHORT_ANSWER_SHARE,
  PROBETEST_SECONDS_RANGE,
  READING_SECONDS_PER_WORD,
  itemSchema,
  probetestSchema,
  readingTextSchema,
  schemaVersionFileSchema,
} from './schemas';
import {
  BEREICHE_BY_FACH,
  FAECHER,
  bereichOfTextKind,
  isLesenBereich,
  isRechtschreibungBereich,
  type Bereich,
  type Fach,
} from './taxonomy';
import { TYPEN_FILE, checkTypen } from './typen';
import type { Item, ItemOf, Niveau, Probetest, ReadingText } from './types';
import { splitSentences, splitWords } from './units';

export type Severity = 'error' | 'warning';

export interface ContentIssue {
  severity: Severity;
  /** Path relative to the content root, e.g. `items/mathe/raum-form.json`. */
  file: string;
  /** Item/text/probetest id, if known. */
  id?: string;
  /** Location inside the object, e.g. `payload.options[2].text`. */
  path?: string;
  message: string;
}

export interface ContentFile {
  /** Path relative to the content root, using `/` as separator. */
  path: string;
  data: unknown;
}

export interface ValidateContentOptions {
  assetExists(assetId: string): boolean;
}

interface Located<T> {
  value: T;
  file: string;
}

export interface ContentBundle {
  items: Map<string, Located<Item>>;
  texts: Map<string, Located<ReadingText>>;
  probetests: Map<string, Located<Probetest>>;
}

export interface ValidateContentResult {
  issues: ContentIssue[];
  bundle: ContentBundle;
}

const WORD_COUNT_TOLERANCE = 10;
/**
 * mark-in-text beside a reading text (1.0.11): the text box takes part of the screen, so the
 * passage to mark stays short. Measured in task 9: a whole paragraph of 5 sentences was the
 * tightest screen in landscape.
 */
export const MARK_IN_TEXT_WITH_TEXT = { maxSentences: 4, maxChars: 200 } as const;
/**
 * Other formats beside a reading text (1.0.13, match 1.0.17): limits set from the air above the
 * band in all four viewports (text-inhalt-*.json, lesen-sachtext and its patches, 2026-10-18;
 * fixture t-sach-900). Beyond them nothing has been measured.
 */
export const WITH_TEXT = {
  order: { maxItems: 4, maxItemChars: 30 },
  shortAnswer: { maxModelChars: 90, maxKeyPoints: 2, maxFeedbackChars: 150 },
  singleChoice: { maxOptionsWithStimulusText: 3 },
  /** 5 options only with a short prompt (multi-choice has 4–5 options). */
  multiChoice: { maxPromptCharsWithFiveOptions: 60 },
  /**
   * 1.0.17 (task 15, tests/e2e/sweep-match.spec.ts beside t-sach-901): 4 pairs left Üben −36 px
   * in Safari landscape already at 80 characters, 3 pairs keep ≥ 18 px up to 140; a prompt of 74
   * characters takes 3 lines in landscape and Durchsehen in Safari landscape −20 px, 60
   * characters 2 lines and +15. The feedback (up to 195 measured) does not bind. Character
   * limits stand in for lines. 35/52 per card (1.0.15) stay as wrapping limits without a warning.
   */
  match: { maxPairs: 3, maxCardChars: 140, maxPromptChars: 60 },
} as const;
/**
 * Items with a picture (1.0.21, task 19): in portrait the picture stands between stimulus and
 * prompt, so the stimulus stays short. short-answer with a picture is an error until the band is
 * rebuilt (PRODUCT §11): m-rf-3-008 kept 2 px in Durchsehen Safari portrait with a model of 80
 * and feedback of 114 characters.
 */
export const WITH_PICTURE = { maxStimulusSentences: 2 } as const;
/**
 * segment-text (1.0.25): a sentence of word tiles with a 48 px gap between every two words. Guide
 * value from /dev/format/segment-text (format-segment-text-layout.spec, four viewports, 2026-10-25):
 * 10 words / 57 characters kept ≥ 186 px air, 14 words / 85 characters ≥ 157 px (Safari landscape,
 * noch nicht); nothing longer was measured. A warning, never an error.
 */
export const SEGMENT_TEXT_GUIDE = { maxWords: 14, maxChars: 85 } as const;
/** An option that only names a label of the picture: "A", "Figur B". */
const LABEL_OPTION = /^(?:Figur |Dreieck |Netz )?[A-F]$/;
/** Money in the task (§4.3, 1.0.24): the euro sign or the word Euro. */
const EURO = /€|\bEuro\b/;
/** An amount with a decimal comma: "2,50". */
const COMMA_AMOUNT = /\d,\d/;

export function formatIssuePath(path: readonly PropertyKey[]): string {
  return path
    .map((seg, i) => (typeof seg === 'number' ? `[${seg}]` : i === 0 ? String(seg) : `.${String(seg)}`))
    .join('');
}

function rawId(data: unknown): string | undefined {
  if (typeof data === 'object' && data !== null && 'id' in data) {
    const id = (data as { id: unknown }).id;
    if (typeof id === 'string') return id;
  }
  return undefined;
}

export function validateContent(
  files: readonly ContentFile[],
  options: ValidateContentOptions,
): ValidateContentResult {
  const issues: ContentIssue[] = [];
  const bundle: ContentBundle = { items: new Map(), texts: new Map(), probetests: new Map() };

  const error = (file: string, message: string, id?: string, path?: string) =>
    issues.push({ severity: 'error', file, message, ...(id && { id }), ...(path && { path }) });
  const warn = (file: string, message: string, id?: string, path?: string) =>
    issues.push({ severity: 'warning', file, message, ...(id && { id }), ...(path && { path }) });

  function parse<T>(schema: z.ZodType<T>, data: unknown, file: string, prefix = ''): T | undefined {
    const result = schema.safeParse(data);
    if (result.success) return result.data;
    const id = rawId(data);
    for (const issue of result.error.issues) {
      const path = prefix + formatIssuePath(issue.path);
      error(file, issue.message, id, path || undefined);
    }
    return undefined;
  }

  // -- 1. Per-file schema validation and placement -------------------------------------------

  let hasSchemaVersion = false;

  for (const { path: file, data } of files) {
    if (file === 'schema-version.json') {
      hasSchemaVersion = true;
      parse(schemaVersionFileSchema, data, file);
      continue;
    }

    // Task types for the page for parents (since 1.0.27): content, not part of the item contract.
    if (file === TYPEN_FILE) {
      for (const problem of checkTypen(data)) error(file, problem);
      continue;
    }

    const itemsMatch = /^items\/([^/]+)\/([^/]+)\.json$/.exec(file);
    if (itemsMatch) {
      const [, dirFach = '', fileBereich = ''] = itemsMatch;
      const fach = (FAECHER as readonly string[]).includes(dirFach) ? (dirFach as Fach) : undefined;
      if (!fach) {
        error(file, `Unbekanntes Fach-Verzeichnis "${dirFach}"`);
        continue;
      }
      if (!(BEREICHE_BY_FACH[fach] as readonly string[]).includes(fileBereich)) {
        error(file, `Dateiname muss ein Bereich von "${fach}" sein: ${BEREICHE_BY_FACH[fach].join(', ')}`);
        continue;
      }
      if (!Array.isArray(data)) {
        error(file, 'Item-Datei muss ein JSON-Array von Items sein');
        continue;
      }
      data.forEach((raw: unknown, index) => {
        const item = parse(itemSchema, raw, file, `[${index}].`);
        if (!item) return;
        if (item.fach !== fach || item.bereich !== fileBereich) {
          error(file, `Item gehört nach items/${item.fach}/${item.bereich}.json`, item.id);
        }
        const existing = bundle.items.get(item.id);
        if (existing) {
          error(file, `Doppelte Item-ID (auch in ${existing.file})`, item.id);
          return;
        }
        bundle.items.set(item.id, { value: item, file });
      });
      continue;
    }

    const textMatch = /^texts\/([^/]+)\/([^/]+)\.json$/.exec(file);
    if (textMatch) {
      const [, dirFach, fileId] = textMatch;
      if (dirFach !== 'deutsch') error(file, 'Lesetexte liegen unter texts/deutsch/');
      const text = parse(readingTextSchema, data, file);
      if (!text) continue;
      if (text.id !== fileId) error(file, `Dateiname muss der id entsprechen: ${text.id}.json`, text.id);
      if (bundle.texts.has(text.id)) {
        error(file, 'Doppelte Text-ID', text.id);
        continue;
      }
      bundle.texts.set(text.id, { value: text, file });
      continue;
    }

    const probetestMatch = /^probetests\/([^/]+)\.json$/.exec(file);
    if (probetestMatch) {
      const probetest = parse(probetestSchema, data, file);
      if (!probetest) continue;
      if (probetest.id !== probetestMatch[1]) {
        error(file, `Dateiname muss der id entsprechen: ${probetest.id}.json`, probetest.id);
      }
      if (bundle.probetests.has(probetest.id)) {
        error(file, 'Doppelte Probetest-ID', probetest.id);
        continue;
      }
      bundle.probetests.set(probetest.id, { value: probetest, file });
      continue;
    }

    error(file, 'Unerwartete Content-Datei (siehe CONTENT_SCHEMA.md §1)');
  }

  if (!hasSchemaVersion) error('schema-version.json', 'Datei fehlt');

  // -- 2. Items: assets, textRef, soft checks -------------------------------------------------

  for (const { value: item, file } of bundle.items.values()) {
    const assetRefs: [string, string][] = [];
    if (item.stimulus?.assetId) assetRefs.push([item.stimulus.assetId, 'stimulus.assetId']);
    if (item.format === 'single-choice') {
      item.payload.options.forEach((o, i) => {
        if (o.assetId) assetRefs.push([o.assetId, `payload.options[${i}].assetId`]);
      });
    }
    for (const [assetId, path] of assetRefs) {
      if (!options.assetExists(assetId)) {
        error(file, `Asset fehlt: assets/svg/${assetId}.svg`, item.id, path);
      }
    }

    const textRef = item.stimulus?.textRef;
    if (textRef !== undefined) {
      const text = bundle.texts.get(textRef)?.value;
      if (!text) {
        error(file, `Lesetext "${textRef}" existiert nicht`, item.id, 'stimulus.textRef');
      } else if (!text.itemIds.includes(item.id)) {
        error(file, `Lesetext "${textRef}" listet dieses Item nicht in itemIds`, item.id, 'stimulus.textRef');
      }
    }

    if ((item.format === 'single-choice' || item.format === 'multi-choice') && !item.payload.keepOrder) {
      if (item.payload.options.every((o) => LABEL_OPTION.test(o.text.trim()))) {
        warn(file, 'Optionen sind Bildbeschriftungen (A, B, …): keepOrder setzen?', item.id, 'payload.keepOrder');
      }
    }

    if (item.stimulus?.assetId !== undefined) {
      if (item.format === 'short-answer') {
        error(file, 'short-answer mit Bild ist nicht erlaubt (1.0.21), bis das Band umgebaut ist', item.id, 'stimulus.assetId');
      }
      const { maxStimulusSentences } = WITH_PICTURE;
      const sentences = splitSentences(item.stimulus.text ?? '').length;
      if (sentences > maxStimulusSentences) {
        warn(
          file,
          `Bild-Item: höchstens ${maxStimulusSentences} Sätze stimulus.text, hier ${sentences}`,
          item.id,
          'stimulus.text',
        );
      }
    }

    if (item.format === 'mark-in-text' && textRef !== undefined) {
      const { maxSentences, maxChars } = MARK_IN_TEXT_WITH_TEXT;
      const sentences = splitSentences(item.payload.text).length;
      const chars = item.payload.text.length;
      if (sentences > maxSentences || chars > maxChars) {
        warn(
          file,
          `mark-in-text mit Lesetext: höchstens ${maxSentences} Sätze und ${maxChars} Zeichen, hier ${sentences} Sätze und ${chars} Zeichen`,
          item.id,
          'payload.text',
        );
      }
    }

    if (textRef !== undefined) {
      for (const [message, path] of withTextFindings(item)) warn(file, message, item.id, path);
    }

    if (item.format === 'order') {
      const delivered = item.payload.items.map((o) => o.id).join(',');
      if (delivered === item.solution.orderedIds.join(',')) {
        warn(file, 'payload.items steht bereits in Lösungsreihenfolge (sollte gemischt sein)', item.id, 'payload.items');
      }
    }

    if (item.format === 'number-input' && !item.payload.allowDecimal) {
      const text = [item.stimulus?.text, item.prompt, item.readAloud].join(' ');
      if ((item.payload.unit === '€' || EURO.test(text)) && COMMA_AMOUNT.test(text)) {
        warn(file, 'Geld mit Komma-Betrag: payload.allowDecimal setzen, sonst bietet der Ziffernblock kein Komma an', item.id, 'payload.allowDecimal');
      }
    }

    if (item.format === 'segment-text') {
      for (const [message, path] of segmentTextFindings(item)) error(file, message, item.id, path);
      const { maxWords, maxChars } = SEGMENT_TEXT_GUIDE;
      const words = splitWords(item.payload.text).length;
      const chars = item.payload.text.length;
      if (words > maxWords || chars > maxChars) {
        warn(
          file,
          `segment-text: Richtwert höchstens ${maxWords} Wörter und ${maxChars} Zeichen, hier ${words} Wörter und ${chars} Zeichen`,
          item.id,
          'payload.text',
        );
      }
    }

    if (isRechtschreibungBereich(item.bereich) && (item.format === 'find-error' || item.format === 'cloze-select')) {
      for (const [message, path] of spellingFindings(item)) warn(file, message, item.id, path);
    }
  }

  // -- 3. Reading texts ------------------------------------------------------------------------

  for (const { value: text, file } of bundle.texts.values()) {
    const expectedBereich = bereichOfTextKind(text.kind);
    let previousNiveau: Niveau | undefined;
    text.itemIds.forEach((itemId, i) => {
      const item = bundle.items.get(itemId)?.value;
      const path = `itemIds[${i}]`;
      if (!item) {
        error(file, `Item "${itemId}" existiert nicht`, text.id, path);
        return;
      }
      if (item.stimulus?.textRef !== text.id) {
        error(file, `Item "${itemId}" verweist nicht per stimulus.textRef auf diesen Text`, text.id, path);
      }
      if (item.bereich !== expectedBereich) {
        error(file, `Item "${itemId}" hat Bereich "${item.bereich}", erwartet "${expectedBereich}"`, text.id, path);
      }
      if (previousNiveau !== undefined && item.niveau < previousNiveau) {
        error(file, 'itemIds müssen aufsteigend nach Niveau sortiert sein', text.id, path);
      }
      previousNiveau = item.niveau;
    });

    const actualWords = text.paragraphs.reduce((sum, p) => sum + splitWords(p).length, 0);
    if (Math.abs(actualWords - text.wordCount) > WORD_COUNT_TOLERANCE) {
      warn(file, `wordCount ist ${text.wordCount}, gezählt wurden ${actualWords} Wörter`, text.id, 'wordCount');
    }
  }

  // -- 4. Probetests ---------------------------------------------------------------------------

  for (const { value: probetest, file } of bundle.probetests.values()) {
    const items: Item[] = [];
    probetest.itemIds.forEach((itemId, i) => {
      const item = bundle.items.get(itemId)?.value;
      const path = `itemIds[${i}]`;
      if (!item) {
        error(file, `Item "${itemId}" existiert nicht`, probetest.id, path);
        return;
      }
      if (item.fach !== probetest.fach) {
        error(file, `Item "${itemId}" gehört zum Fach "${item.fach}"`, probetest.id, path);
      }
      if (item.status === 'retired') {
        error(file, `Item "${itemId}" ist retired`, probetest.id, path);
      }
      items.push(item);
    });
    // Composition rules are only meaningful once every referenced item resolves.
    if (items.length !== probetest.itemIds.length) continue;

    const niveauActual = { 1: 0, 2: 0, 3: 0 };
    const bereichActual: Partial<Record<Bereich, number>> = {};
    for (const item of items) {
      niveauActual[item.niveau] += 1;
      bereichActual[item.bereich] = (bereichActual[item.bereich] ?? 0) + 1;
    }
    for (const level of [1, 2, 3] as const) {
      if (niveauActual[level] !== probetest.niveauMix[level]) {
        error(
          file,
          `niveauMix[${level}] ist ${probetest.niveauMix[level]}, die Items ergeben ${niveauActual[level]}`,
          probetest.id,
          `niveauMix.${level}`,
        );
      }
    }
    const bereiche = new Set([...Object.keys(bereichActual), ...Object.keys(probetest.bereichMix)] as Bereich[]);
    for (const bereich of bereiche) {
      const declared = probetest.bereichMix[bereich] ?? 0;
      const actual = bereichActual[bereich] ?? 0;
      if (declared !== actual) {
        error(file, `bereichMix["${bereich}"] ist ${declared}, die Items ergeben ${actual}`, probetest.id, `bereichMix.${bereich}`);
      }
    }

    const textRefs = probetestTextRefs(items);
    const texts = textRefs.map((id) => bundle.texts.get(id)?.value).filter((t) => t !== undefined);

    const { itemSeconds, readingSeconds, seconds } = probetestTime(probetest, bundle);
    const range = PROBETEST_SECONDS_RANGE[probetest.fach];
    const allowed = `erlaubt sind ${range.min / 60}–${range.max / 60} Min.`;
    if (probetest.fach === 'deutsch') {
      if (seconds < range.min || seconds > range.max) {
        error(
          file,
          `Summe ist ${secondsText(seconds)} s (${(seconds / 60).toFixed(2).replace('.', ',')} Min.): estimatedSeconds ${itemSeconds} s + Lesezeit ${secondsText(readingSeconds)} s, ${allowed}`,
          probetest.id,
          'itemIds',
        );
      }
    } else if (itemSeconds < range.min || itemSeconds > range.max) {
      error(file, `Summe estimatedSeconds ist ${(itemSeconds / 60).toFixed(1)} Min., ${allowed}`, probetest.id, 'itemIds');
    }

    const shortAnswers = items.filter((item) => item.format === 'short-answer').length;
    if (items.length > 0 && shortAnswers / items.length > PROBETEST_MAX_SHORT_ANSWER_SHARE) {
      error(file, `short-answer-Anteil ${shortAnswers}/${items.length} liegt über 15 %`, probetest.id, 'itemIds');
    }

    if (probetest.fach === 'deutsch' && items.length > 0) {
      const report = (message: string, path: string) => error(file, message, probetest.id, path);
      checkDeutschOrder(items, report);
      checkDeutschTexts(items, report);
      if (textRefs.length < 1 || textRefs.length > 2) {
        report(`Deutsch-Probetest braucht 1 oder 2 Lesetexte, gefunden: ${textRefs.length}`, 'itemIds');
      } else if (textRefs.length === 2) {
        const [first, second] = texts;
        if (first && second && first.kind === second.kind) {
          report(`Deutsch-Probetest braucht einen Sachtext und einen literarischen Text, beide sind "${first.kind}"`, 'itemIds');
        }
      }
    }
  }

  return { issues, bundle };
}

/** The texts of a Probetest come from its items' textRefs, in order of first appearance (no field of its own). */
function probetestTextRefs(items: readonly Item[]): string[] {
  return [...new Set(items.map((item) => item.stimulus?.textRef).filter((t) => t !== undefined))];
}

export interface ProbetestTime {
  /** Sum of the items' estimatedSeconds. */
  itemSeconds: number;
  /** Deutsch: wordCount × READING_SECONDS_PER_WORD of its texts; Mathe: 0. */
  readingSeconds: number;
  seconds: number;
}

/**
 * The planned time of a Probetest, as the duration rule checks it: in Deutsch the item clock starts
 * after the reading screen, so reading time is in no item and comes on top (§6, 1.0.16). Items that
 * do not resolve count nothing.
 */
export function probetestTime(probetest: Probetest, bundle: ContentBundle): ProbetestTime {
  const items = probetest.itemIds.map((id) => bundle.items.get(id)?.value).filter((i) => i !== undefined);
  const itemSeconds = items.reduce((sum, item) => sum + item.estimatedSeconds, 0);
  const readingSeconds =
    probetest.fach === 'deutsch'
      ? probetestTextRefs(items).reduce(
          (sum, id) => sum + (bundle.texts.get(id)?.value.wordCount ?? 0) * READING_SECONDS_PER_WORD,
          0,
        )
      : 0;
  return { itemSeconds, readingSeconds, seconds: itemSeconds + readingSeconds };
}

/** "deutsch-03: 1205 s Items + 246 s Lesezeit = 1451 s (24,18 Min.)", printed by content:validate. */
export function formatProbetestTime(id: string, { itemSeconds, readingSeconds, seconds }: ProbetestTime): string {
  const minutes = (seconds / 60).toFixed(2).replace('.', ',');
  return `${id}: ${secondsText(itemSeconds)} s Items + ${secondsText(readingSeconds)} s Lesezeit = ${secondsText(seconds)} s (${minutes} Min.)`;
}

/**
 * Deutsch starts with reading and ends with spelling or sprache-untersuchen (1.0.25, like Kompass 4);
 * no reading item after the first spelling item, and none after the first sprache-untersuchen item
 * (1.0.22: those stand after the reading blocks).
 */
function checkDeutschOrder(items: readonly Item[], report: (message: string, path: string) => void): void {
  const first = items[0];
  const last = items[items.length - 1];
  if (first && !isLesenBereich(first.bereich)) report('Deutsch-Probetest muss mit Lesen beginnen', 'itemIds[0]');
  if (last && !isRechtschreibungBereich(last.bereich) && last.bereich !== 'sprache-untersuchen') {
    report('Deutsch-Probetest muss mit Rechtschreibung oder Sprache untersuchen enden', `itemIds[${items.length - 1}]`);
  }
  const firstSpelling = items.findIndex((item) => isRechtschreibungBereich(item.bereich));
  if (firstSpelling !== -1) {
    items.forEach((item, i) => {
      if (i > firstSpelling && isLesenBereich(item.bereich)) {
        report(`Lese-Item "${item.id}" steht nach Rechtschreibung`, `itemIds[${i}]`);
      }
    });
  }
  const firstSprache = items.findIndex((item) => item.bereich === 'sprache-untersuchen');
  if (firstSprache === -1) return;
  items.forEach((item, i) => {
    if (i > firstSprache && isLesenBereich(item.bereich)) {
      report(`Lese-Item "${item.id}" steht nach Sprache untersuchen`, `itemIds[${i}]`);
    }
  });
}

/**
 * Reading blocks in a Deutsch Probetest (§6, 1.0.16): the reading screen comes once before the first
 * item of a text, so a text's items stand together, and no item without a text comes before one with.
 */
function checkDeutschTexts(items: readonly Item[], report: (message: string, path: string) => void): void {
  const ended = new Set<string>();
  let current: string | undefined;
  let firstWithout: Item | undefined;
  let reportedWithout = false;
  items.forEach((item, i) => {
    const textRef = item.stimulus?.textRef;
    if (textRef === undefined) {
      firstWithout ??= item;
    } else {
      if (firstWithout && !reportedWithout) {
        report(`Item "${firstWithout.id}" ohne Lesetext steht vor "${item.id}" mit Lesetext`, `itemIds[${i}]`);
        reportedWithout = true;
      }
      if (textRef !== current && ended.has(textRef)) {
        report(`Items zu "${textRef}" stehen nicht zusammen: "${item.id}" folgt nach einem anderen Item`, `itemIds[${i}]`);
      }
    }
    if (current !== undefined && textRef !== current) ended.add(current);
    current = textRef;
  });
}

function secondsText(seconds: number): string {
  return String(Math.round(seconds * 10) / 10).replace('.', ',');
}

/**
 * find-error and cloze-select in the spelling areas never read a misspelled word (1.0.24): the
 * app reads the sentence from the solution (a correction per error is a schema rule), so what it
 * reads before (readAloud, or stimulus and prompt, as readAloudText) must not contain a wrong word.
 */
function spellingFindings(item: ItemOf<'find-error'> | ItemOf<'cloze-select'>): [string, string][] {
  const findings: [string, string][] = [];
  const wrong =
    item.format === 'find-error'
      ? item.payload.words.filter((w) => item.solution.errorIds.includes(w.id)).map((w) => w.text)
      : item.payload.gaps.flatMap((g) => g.options.filter((o) => o !== item.solution.gaps[g.key]));
  // What Vorlesen reads besides the sentence (readAloudText): readAloud, or stimulus and prompt.
  const spoken: [string, string | undefined][] =
    item.readAloud !== undefined
      ? [['readAloud', item.readAloud]]
      : [
          ['stimulus.text', item.stimulus?.text],
          ['stimulus.assetAlt', item.stimulus?.assetAlt],
          ['prompt', item.prompt],
        ];
  for (const word of new Set(wrong)) {
    const escaped = word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const pattern = new RegExp(`(^|[^\\p{L}])${escaped}([^\\p{L}]|$)`, 'u');
    for (const [path, text] of spoken) {
      if (text !== undefined && pattern.test(text)) {
        findings.push([`Vorlesen enthält das falsch geschriebene Wort "${word}"`, path]);
      }
    }
  }
  return findings;
}

/**
 * segment-text stands alone on the screen (1.0.25): no reading text, no picture beside the
 * sentence. unit "letter" is allowed by the schema but has no renderer yet.
 */
function segmentTextFindings(item: ItemOf<'segment-text'>): [string, string][] {
  const findings: [string, string][] = [];
  if (item.payload.unit === 'letter') findings.push(['Renderer für unit letter nicht gebaut', 'payload.unit']);
  if (item.stimulus?.textRef !== undefined) {
    findings.push(['segment-text steht allein: kein stimulus.textRef', 'stimulus.textRef']);
  }
  if (item.stimulus?.assetId !== undefined) {
    findings.push(['segment-text steht allein: kein stimulus.assetId', 'stimulus.assetId']);
  }
  return findings;
}

/** Limits for items beside a reading text (WITH_TEXT): message and path per finding. */
function withTextFindings(item: Item): [string, string][] {
  const findings: [string, string][] = [];
  if (item.format === 'order') {
    const { maxItems, maxItemChars } = WITH_TEXT.order;
    const { items } = item.payload;
    if (items.length > maxItems) {
      findings.push([`order mit Lesetext: höchstens ${maxItems} Elemente, hier ${items.length}`, 'payload.items']);
    }
    items.forEach((element, i) => {
      if (element.text.length > maxItemChars) {
        findings.push([
          `order mit Lesetext: Element höchstens ${maxItemChars} Zeichen, hier ${element.text.length}`,
          `payload.items[${i}].text`,
        ]);
      }
    });
  }
  if (item.format === 'short-answer') {
    const { maxModelChars, maxKeyPoints, maxFeedbackChars } = WITH_TEXT.shortAnswer;
    const { model, keyPoints } = item.solution;
    if (model.length > maxModelChars) {
      findings.push([`short-answer mit Lesetext: model höchstens ${maxModelChars} Zeichen, hier ${model.length}`, 'solution.model']);
    }
    if (keyPoints.length > maxKeyPoints) {
      findings.push([
        `short-answer mit Lesetext: höchstens ${maxKeyPoints} keyPoints, hier ${keyPoints.length}`,
        'solution.keyPoints',
      ]);
    }
    const { incorrect, misconception = '' } = item.feedback;
    const feedback = incorrect.length + misconception.length;
    if (feedback > maxFeedbackChars) {
      findings.push([
        `short-answer mit Lesetext: incorrect und misconception zusammen höchstens ${maxFeedbackChars} Zeichen, hier ${feedback}`,
        'feedback',
      ]);
    }
  }
  if (item.format === 'multi-choice' && item.payload.options.length >= 5) {
    const { maxPromptCharsWithFiveOptions: max } = WITH_TEXT.multiChoice;
    if (item.prompt.length > max) {
      findings.push([
        `multi-choice mit Lesetext und 5 Optionen: prompt höchstens ${max} Zeichen, hier ${item.prompt.length}`,
        'prompt',
      ]);
    }
  }
  if (item.format === 'match') {
    const { maxPairs, maxCardChars, maxPromptChars } = WITH_TEXT.match;
    const pairs = item.payload.left.length;
    if (pairs > maxPairs) {
      findings.push([
        `match mit Lesetext: höchstens ${maxPairs} Paare, hier ${pairs}`,
        'payload.left',
      ]);
    }
    const cards = [...item.payload.left, ...item.payload.right];
    const sum = cards.reduce((n, card) => n + card.text.length, 0);
    if (sum > maxCardChars) {
      findings.push([
        `match mit Lesetext: alle Kartentexte zusammen höchstens ${maxCardChars} Zeichen, hier ${sum}`,
        'payload',
      ]);
    }
    if (item.prompt.length > maxPromptChars) {
      findings.push([
        `match mit Lesetext: prompt höchstens ${maxPromptChars} Zeichen, hier ${item.prompt.length}`,
        'prompt',
      ]);
    }
  }
  if (item.format === 'single-choice' && item.stimulus?.text !== undefined) {
    const { maxOptionsWithStimulusText: max } = WITH_TEXT.singleChoice;
    const count = item.payload.options.length;
    if (count > max) {
      findings.push([
        `single-choice mit Lesetext und stimulus.text: höchstens ${max} Optionen, hier ${count}`,
        'payload.options',
      ]);
    }
  }
  return findings;
}
