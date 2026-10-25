// Content-Smoke: the whole real pool passes every validator rule, and so does every Probetest
// (deutsch-01 and its reading blocks included). content:validate checks the same in npm run check;
// this keeps the interplay of schema, integrity rules and the real files in the test run (list.ts).
import { describe, expect, it } from 'vitest';
import { validateContent } from '../../src/domain/content';
import { assetExists, contentFiles } from './read';

describe('the real content', () => {
  const { issues, bundle } = validateContent(contentFiles(), { assetExists });
  const line = (i: (typeof issues)[number]) =>
    `${i.severity} ${i.file} ${i.id ?? ''} ${i.path ?? ''} ${i.message}`;

  it('has no errors and no warnings', () => {
    expect(issues.map(line)).toEqual([]);
  });

  it('has at least one Probetest per Fach, each without findings', () => {
    const ids = [...bundle.probetests.keys()];
    expect(ids.some((id) => id.startsWith('mathe-'))).toBe(true);
    expect(ids.some((id) => id.startsWith('deutsch-'))).toBe(true);
    expect(issues.filter((i) => i.file.startsWith('probetests/')).map(line)).toEqual([]);
  });
});
