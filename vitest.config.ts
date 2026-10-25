import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
import { defineConfig } from 'vitest/config';

const root = path.dirname(fileURLToPath(import.meta.url));
const contentDir = path.join(root, 'content') + path.sep;

/**
 * The Content-Smoke tests (ARCHITECTURE §8): the only Vitest files that read content/ and the
 * manifest on purpose, because they check how the real pool fits together. They may change with
 * the content; every other unit test runs without content/.
 */
const CONTENT_SMOKE = 'tests/content-smoke/**/*.test.ts';

/**
 * Unit tests never load content/ (ARCHITECTURE §8, Teststrategie): any module below it, a static
 * JSON import as well as the content loader's import.meta.glob, fails the test. The real pool is
 * replaced by nothing, so a green run proves no unit test needs it.
 */
function noContent(): Plugin {
  return {
    name: 'pfadfinder-no-content',
    enforce: 'pre',
    load(id) {
      const [file = id] = id.split('?');
      if (file.startsWith(contentDir)) {
        throw new Error(
          `Unit-Test lädt ${path.relative(path.dirname(contentDir), file)}: Fixture aus tests/fixtures nutzen (nur Content-Smoke liest content/)`,
        );
      }
    },
  };
}

export default defineConfig({
  define: { __BUILD_ID__: JSON.stringify('test') },
  test: {
    environment: 'node',
    // Review due dates use the device's local day; pin it so tests behave the same everywhere.
    env: { TZ: 'Europe/Berlin' },
    projects: [
      {
        extends: true,
        plugins: [noContent()],
        // Pictures: invented SVGs in place of content/assets/svg (ContentAsset).
        resolve: {
          alias: [
            {
              find: /^\.\/asset-sources$/,
              replacement: path.join(root, 'tests/fixtures/assets/sources.ts'),
            },
          ],
        },
        test: {
          name: 'unit',
          include: ['tests/**/*.test.{ts,tsx}'],
          exclude: ['tests/e2e/**', 'node_modules/**', CONTENT_SMOKE],
        },
      },
      {
        extends: true,
        test: { name: 'content-smoke', include: [CONTENT_SMOKE] },
      },
    ],
  },
});
