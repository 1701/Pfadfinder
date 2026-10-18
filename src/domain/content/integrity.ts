// Validates a whole content tree: schema per file plus cross-file rules
// (file placement, unique ids, textRef, assetId, probetest composition – CONTENT_SCHEMA.md §1, §5, §6).
// Pure: file system access is injected by the caller (scripts/validate-content.ts).

import type { z } from 'zod';
import {
  PROBETEST_MAX_SHORT_ANSWER_SHARE,
  PROBETEST_SECONDS_RANGE,
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
import type { Item, Niveau, Probetest, ReadingText } from './types';
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
 * Other formats beside a reading text (1.0.13): limits set on 2026-10-18 from the air above the
 * band in all four viewports (text-inhalt-*.json, lesen-sachtext and its patches; fixture
 * t-sach-900). Beyond them nothing has been measured.
 */
export const WITH_TEXT = {
  order: { maxItems: 4, maxItemChars: 30 },
  shortAnswer: { maxModelChars: 90, maxKeyPoints: 2, maxFeedbackChars: 150 },
  singleChoice: { maxOptionsWithStimulusText: 3 },
  /** 5 options only with a short prompt (multi-choice has 4–5 options). */
  multiChoice: { maxPromptCharsWithFiveOptions: 60 },
} as const;
/** An option that only names a label of the picture: "A", "Figur B". */
const LABEL_OPTION = /^(?:Figur |Dreieck |Netz )?[A-F]$/;

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

    const seconds = items.reduce((sum, item) => sum + item.estimatedSeconds, 0);
    const range = PROBETEST_SECONDS_RANGE[probetest.fach];
    if (seconds < range.min || seconds > range.max) {
      error(
        file,
        `Summe estimatedSeconds ist ${(seconds / 60).toFixed(1)} Min., erlaubt sind ${range.min / 60}–${range.max / 60} Min.`,
        probetest.id,
        'itemIds',
      );
    }

    const shortAnswers = items.filter((item) => item.format === 'short-answer').length;
    if (items.length > 0 && shortAnswers / items.length > PROBETEST_MAX_SHORT_ANSWER_SHARE) {
      error(file, `short-answer-Anteil ${shortAnswers}/${items.length} liegt über 15 %`, probetest.id, 'itemIds');
    }

    if (probetest.fach === 'deutsch' && items.length > 0) {
      checkDeutschOrder(items, (message, path) => error(file, message, probetest.id, path));
      const textRefs = new Set(items.map((item) => item.stimulus?.textRef).filter((t) => t !== undefined));
      if (textRefs.size !== 2) {
        error(file, `Deutsch-Probetest braucht genau 2 Lesetexte, gefunden: ${textRefs.size}`, probetest.id, 'itemIds');
      }
    }
  }

  return { issues, bundle };
}

/** Deutsch starts with reading and ends with spelling; no reading item after the first spelling item. */
function checkDeutschOrder(items: readonly Item[], report: (message: string, path: string) => void): void {
  const first = items[0];
  const last = items[items.length - 1];
  if (first && !isLesenBereich(first.bereich)) report('Deutsch-Probetest muss mit Lesen beginnen', 'itemIds[0]');
  if (last && !isRechtschreibungBereich(last.bereich)) {
    report('Deutsch-Probetest muss mit Rechtschreibung enden', `itemIds[${items.length - 1}]`);
  }
  const firstSpelling = items.findIndex((item) => isRechtschreibungBereich(item.bereich));
  if (firstSpelling === -1) return;
  items.forEach((item, i) => {
    if (i > firstSpelling && isLesenBereich(item.bereich)) {
      report(`Lese-Item "${item.id}" steht nach Rechtschreibung`, `itemIds[${i}]`);
    }
  });
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
