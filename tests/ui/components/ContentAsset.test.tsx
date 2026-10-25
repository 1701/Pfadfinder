// @vitest-environment jsdom
import '../dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { checkSvgAsset } from '../../../src/domain/content';
import { ContentAsset, assetMarkup, isWideAsset } from '../../../src/ui/components/ContentAsset';
import { ASSET_SOURCES } from '../../fixtures/assets/sources';

// Pictures: tests/fixtures/assets (fx-rechteck-9 240 × 160, fx-band-9 480 × 170 with a role).
describe('ContentAsset', () => {
  it('embeds the SVG inline with the description as its name', () => {
    render(<ContentAsset assetId="fx-rechteck-9" alt="Ein Rechteck, breiter als hoch." />);
    const svg = screen.getByRole('img', { name: 'Ein Rechteck, breiter als hoch.' });
    expect(svg.tagName.toLowerCase()).toBe('svg');
    expect(document.querySelector('img')).toBeNull();
    expect(svg.querySelector('rect')?.getAttribute('fill')).toBe('currentColor');
  });

  it('escapes the description and keeps a single role', () => {
    const markup = assetMarkup('fx-band-9', 'A "B" & <C>')!;
    expect(markup).toContain('aria-label="A &quot;B&quot; &amp; &lt;C>"');
    expect(markup.match(/role=/g)).toHaveLength(1);
  });

  it('renders nothing for an unknown asset', () => {
    expect(assetMarkup('gibt-es-nicht', 'x')).toBeNull();
    const { container } = render(<ContentAsset assetId="gibt-es-nicht" alt="x" />);
    expect(container.innerHTML).toBe('');
  });

  it('puts a picture wider than 2 : 1 below the text (unknown ids count as wide)', () => {
    expect(isWideAsset('fx-rechteck-9')).toBe(false);
    expect(isWideAsset('fx-band-9')).toBe(true);
    expect(isWideAsset('gibt-es-nicht')).toBe(true);
  });

  it('runs on invented pictures that keep the rules of content/assets/svg', () => {
    expect(Object.keys(ASSET_SOURCES)).toHaveLength(2);
    for (const [path, svg] of Object.entries(ASSET_SOURCES))
      expect(checkSvgAsset(svg), path).toEqual([]);
  });
});
