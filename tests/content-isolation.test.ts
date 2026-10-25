// Unit tests run without content/ (ARCHITECTURE §8, Teststrategie). The noContent plugin in
// vitest.config.ts stops every module load below content/; this test catches what it cannot see:
// file paths into content/ or the manifest, and ids of real items and Probetests as literals.
// Invented fixtures use -9xx (d-lsa-1-950, mathe-91); only the Content-Smoke tests may name the
// real pool.
import { readFileSync, readdirSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

const RULES: [string, RegExp][] = [
  ['Pfad nach content/', /(['"`])(\.\.\/)*content(\/|\1)/],
  ['Manifest', /manifest\.json/],
  ['echter Loader', /createContentLoader\(\)/],
  ['Item-ID ohne 9xx', /\b[md]-[a-z]{2,3}-[123]-[0-8]\d\d\b/],
  ['Probetest-ID ohne 9x', /\b(mathe|deutsch)-0\d\b/],
];

/** Directories outside the rule: Playwright runs against the real pool, the smoke tests on purpose. */
const OUTSIDE = ['tests/e2e/', 'tests/content-smoke/', 'tests/content-isolation.test.ts'];

const files = readdirSync('tests', { recursive: true, encoding: 'utf8' })
  .map((f) => `tests/${f.split('\\').join('/')}`)
  .filter((f) => /\.(ts|tsx|json)$/.test(f))
  .filter((f) => !OUTSIDE.some((o) => f.startsWith(o)));

describe('unit tests without content/', () => {
  it('scans the test files', () => {
    expect(files.length).toBeGreaterThan(80);
  });

  it('name neither content/, the manifest nor ids of the real pool', () => {
    const findings = files.flatMap((file) =>
      readFileSync(file, 'utf8')
        .split('\n')
        .flatMap((line, i) =>
          RULES.filter(([, rule]) => rule.test(line)).map(
            ([name]) => `${file}:${i + 1} ${name}: ${line.trim()}`,
          ),
        ),
    );
    expect(findings).toEqual([]);
  });
});
