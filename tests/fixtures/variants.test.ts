// The variants must stay valid content under every rule of content:validate.
import { describe, expect, it } from 'vitest';
import { validateContent } from '../../src/domain/content';
import { toFiles } from './builders';
import { VARIANT_ITEMS } from './variants';

describe('fixture variants', () => {
  it('pass every validator rule, without warnings', () => {
    const { issues } = validateContent(toFiles({ items: VARIANT_ITEMS }), {
      assetExists: () => true,
    });
    expect(issues).toEqual([]);
  });
});
