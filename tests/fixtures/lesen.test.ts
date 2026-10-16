// The reading-text fixture must stay valid content: same rules as content/ (CONTENT_SCHEMA).

import { describe, expect, it } from 'vitest';
import { splitWords, validateContent } from '../../src/domain/content';
import { toFiles } from './builders';
import { LESEN_ITEMS, LESEN_TEXTS, biberItems, biberText } from './lesen';

describe('fixture t-sach-900', () => {
  it('is valid content without warnings, together with t-sach-901', () => {
    const report = validateContent(toFiles({ items: LESEN_ITEMS, texts: LESEN_TEXTS }), {
      assetExists: () => false,
    });
    expect(report.issues).toEqual([]);
  });

  it('has 250 words and one item per Lesen format', () => {
    const words = biberText.paragraphs.reduce((sum, p) => sum + splitWords(p).length, 0);
    expect(words).toBe(250);
    expect(biberText.wordCount).toBe(250);
    expect(biberItems.map((i) => i.format).sort()).toEqual([
      'mark-in-text',
      'multi-choice',
      'order',
      'short-answer',
      'single-choice',
    ]);
    const multi = biberItems.find((i) => i.format === 'multi-choice');
    expect(multi?.format === 'multi-choice' && multi.payload.options).toHaveLength(5);
  });

  it('refers to paragraphs, never to lines (CONTENT_SCHEMA 1.0.10)', () => {
    for (const item of biberItems) expect(item.prompt).not.toMatch(/Zeile/);
  });
});
