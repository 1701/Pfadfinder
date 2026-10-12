// @vitest-environment jsdom
import '../dom';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import {
  FormatRenderer,
  SUPPORTED_FORMATS,
  formatRegistry,
} from '../../../src/ui/formats/registry';
import { numberInput, order, singleChoice } from '../../fixtures/items';

describe('format registry', () => {
  it('knows the formats with a renderer', () => {
    expect(SUPPORTED_FORMATS).toEqual(['single-choice', 'number-input']);
    expect(Object.keys(formatRegistry)).toEqual([...SUPPORTED_FORMATS]);
  });

  it('renders each item with its format component', () => {
    const props = { attemptIndex: 0, answer: null, onChange: () => {}, disabled: false };
    const { unmount } = render(<FormatRenderer item={singleChoice} {...props} />);
    expect(screen.getAllByRole('radio')).toHaveLength(4);
    unmount();
    render(<FormatRenderer item={numberInput} {...props} />);
    expect(screen.getByRole('group', { name: 'Ziffernblock' })).toBeTruthy();
    expect(() => render(<FormatRenderer item={order} {...props} />)).toThrow(/order/);
  });
});
