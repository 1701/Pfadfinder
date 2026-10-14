// @vitest-environment jsdom
import '../dom';
import { act, render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { FORMATS } from '../../../src/domain/content';
import {
  FormatRenderer,
  SUPPORTED_FORMATS,
  formatEntry,
  formatRegistry,
} from '../../../src/ui/formats/registry';
import { findError, validItemsByFormat } from '../../fixtures/items';

const props = { attemptIndex: 0, answer: null, onChange: () => {}, disabled: false };

describe('format registry', () => {
  it('has a renderer for every format of the schema', () => {
    expect([...SUPPORTED_FORMATS].sort()).toEqual([...FORMATS].sort());
    expect(Object.keys(formatRegistry).sort()).toEqual([...SUPPORTED_FORMATS].sort());
  });

  const ROLE: Partial<Record<(typeof FORMATS)[number], string>> = {
    'single-choice': 'radio',
    'multi-choice': 'checkbox',
    'short-answer': 'textbox',
  };

  it.each(FORMATS)('renders a %s item', async (format) => {
    // match and order load as their own chunks and suspend first: the render must be awaited.
    let container!: HTMLElement;
    await act(async () => {
      ({ container } = render(<FormatRenderer item={validItemsByFormat[format]} {...props} />));
    });
    await screen.findAllByRole(ROLE[format] ?? 'button', {}, { timeout: 5000 });
    expect(container.querySelector('[aria-busy]')).toBeNull();
  });

  it('only short-answer rates itself and says "Vergleichen"', () => {
    for (const format of FORMATS) {
      const entry = formatEntry(validItemsByFormat[format]);
      expect(entry.selfRated ?? false).toBe(format === 'short-answer');
      expect(entry.submitLabel).toBe(format === 'short-answer' ? 'Vergleichen' : undefined);
    }
  });

  it('find-error names the correct spelling for the band', () => {
    expect(formatEntry(findError).bandNote?.(findError)).toEqual({
      label: 'So schreibt man es:',
      text: 'Samstag',
    });
  });
});
