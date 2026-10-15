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
  isLesenBereich,
  isRechtschreibungBereich,
  type Bereich,
  type Fach,
} from './taxonomy';
import type { Item, Niveau, Probetest, ReadingText } from './types';
import { splitWords } from './units';

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

    if (item.format === 'order') {
      const delivered = item.payload.items.map((o) => o.id).join(',');
      if (delivered === item.solution.orderedIds.join(',')) {
        warn(file, 'payload.items steht bereits in Lösungsreihenfolge (sollte gemischt sein)', item.id, 'payload.items');
      }
    }
  }

  // -- 3. Reading texts ------------------------------------------------------------------------

  for (const { value: text, file } of bundle.texts.values()) {
    const expectedBereich: Bereich = text.kind === 'sachtext' ? 'lesen-sachtext' : 'lesen-literarisch';
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
