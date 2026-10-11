// Components take colors, sizes and spacing from tokens.css only (pfadfinder-ui skill).

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const TOKEN_FILES = new Set(['src/ui/theme/tokens.css', 'src/ui/theme/fonts.css']);

const sources = ['src/ui', 'src/app']
  .flatMap((dir) =>
    readdirSync(dir, { recursive: true, encoding: 'utf8' }).map((f) =>
      path.join(dir, f).split(path.sep).join('/'),
    ),
  )
  .filter((f) => /\.(tsx?|css)$/.test(f) && !TOKEN_FILES.has(f));

describe('UI sources', () => {
  it('exist', () => {
    expect(sources.length).toBeGreaterThan(0);
  });

  it.each(sources)('%s has no hex colors and no px values', (file) => {
    const text = readFileSync(file, 'utf8');
    expect(text.match(/#[0-9a-fA-F]{3,8}\b/g) ?? []).toEqual([]);
    expect(text.match(/\b\d+(\.\d+)?px\b/g) ?? []).toEqual([]);
  });
});
