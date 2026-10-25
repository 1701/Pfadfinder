// Reads the real content tree like scripts/validate-content.ts does. Only for the Content-Smoke
// tests in this directory (list.ts).
import { readFileSync, readdirSync } from 'node:fs';
import { sep } from 'node:path';
import type { ContentFile, Item, Probetest } from '../../src/domain/content';
import type { ContentManifest } from '../../src/domain/content/manifest';

const ROOT = 'content';

const json = (rel: string): unknown => JSON.parse(readFileSync(`${ROOT}/${rel}`, 'utf8'));

/** Every content file except the generated manifest, as the validator sees them. */
export function contentFiles(): ContentFile[] {
  return readdirSync(ROOT, { recursive: true, encoding: 'utf8' })
    .filter((f) => f.endsWith('.json') && f !== 'manifest.json')
    .map((f) => f.split(sep).join('/'))
    .sort()
    .map((path) => ({ path, data: json(path) }));
}

export const contentItems = (): Item[] =>
  contentFiles()
    .filter((f) => f.path.startsWith('items/'))
    .flatMap((f) => f.data as Item[]);

export const contentProbetests = (): Probetest[] =>
  contentFiles()
    .filter((f) => f.path.startsWith('probetests/'))
    .map((f) => f.data as Probetest);

export const committedManifest = (): ContentManifest => json('manifest.json') as ContentManifest;

export const assetExists = (assetId: string): boolean =>
  readdirSync(`${ROOT}/assets/svg`).includes(`${assetId}.svg`);
