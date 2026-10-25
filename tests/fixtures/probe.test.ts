// The probe set must stay valid content under every rule of content:validate (0 errors and
// 0 warnings), one item for each of the seven formats it covers.
import { describe, expect, it } from 'vitest';
import { validateContent } from '../../src/domain/content';
import { toFiles } from './builders';
import { PROBE_ITEMS } from './probe';

describe('probe set', () => {
  it('passes every validator rule, without warnings', () => {
    const { issues } = validateContent(toFiles({ items: [...PROBE_ITEMS] }), {
      assetExists: () => true,
    });
    expect(issues).toEqual([]);
  });

  it('has one item per format', () => {
    expect(new Set(PROBE_ITEMS.map((i) => i.format)).size).toBe(PROBE_ITEMS.length);
  });
});
