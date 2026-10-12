// @vitest-environment jsdom
import '../dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ContentAsset, assetMarkup } from '../../../src/ui/components/ContentAsset';

describe('ContentAsset', () => {
  it('embeds the SVG inline with the description as its name', () => {
    render(<ContentAsset assetId="rf-rechteck-1" alt="Ein Rechteck, breiter als hoch." />);
    const svg = screen.getByRole('img', { name: 'Ein Rechteck, breiter als hoch.' });
    expect(svg.tagName.toLowerCase()).toBe('svg');
    expect(document.querySelector('img')).toBeNull();
    expect(svg.querySelector('rect')?.getAttribute('fill')).toBe('currentColor');
  });

  it('escapes the description and keeps a single role', () => {
    const markup = assetMarkup('rf-symm-1', 'A "B" & <C>')!;
    expect(markup).toContain('aria-label="A &quot;B&quot; &amp; &lt;C>"');
    expect(markup.match(/role=/g)).toHaveLength(1);
  });

  it('renders nothing for an unknown asset', () => {
    expect(assetMarkup('gibt-es-nicht', 'x')).toBeNull();
    const { container } = render(<ContentAsset assetId="gibt-es-nicht" alt="x" />);
    expect(container.innerHTML).toBe('');
  });
});
