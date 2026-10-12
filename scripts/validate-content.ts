// Validates every content/**/*.json against the schemas and cross-file rules.
// Usage: npm run content:validate  (exit code 1 on any error; warnings do not fail)
// On success it writes content/manifest.json (generated, not authored; ARCHITECTURE.md §5).
// In CI an outdated manifest is an error instead, so a stale file can never be deployed.

import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  buildContentManifest,
  checkSvgAsset,
  validateContent,
  type ContentFile,
  type ContentIssue,
} from '../src/domain/content';

const MANIFEST_FILE = 'manifest.json';

const contentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'content');

function listJsonFiles(root: string): string[] {
  return readdirSync(root, { recursive: true, encoding: 'utf8' })
    .filter((rel) => rel.endsWith('.json') && rel !== MANIFEST_FILE)
    .map((rel) => rel.split(path.sep).join('/'))
    .sort();
}

function formatIssue(issue: ContentIssue): string {
  const label = issue.severity === 'error' ? 'FEHLER  ' : 'WARNUNG ';
  const id = issue.id ? ` [${issue.id}]` : '';
  const where = issue.path ? ` ${issue.path}:` : '';
  return `${label} content/${issue.file}${id}${where} ${issue.message}`;
}

const files: ContentFile[] = [];
const parseErrors: string[] = [];
for (const rel of listJsonFiles(contentRoot)) {
  try {
    files.push({ path: rel, data: JSON.parse(readFileSync(path.join(contentRoot, rel), 'utf8')) });
  } catch (err) {
    parseErrors.push(`FEHLER   content/${rel} Kein gültiges JSON: ${(err as Error).message}`);
  }
}

const { issues, bundle } = validateContent(files, {
  assetExists: (assetId) => existsSync(path.join(contentRoot, 'assets', 'svg', `${assetId}.svg`)),
});

// SVG assets are embedded inline by the app: check every file, referenced or not.
const assetErrors: string[] = [];
const svgDir = path.join(contentRoot, 'assets', 'svg');
for (const name of readdirSync(svgDir)
  .filter((f) => f.endsWith('.svg'))
  .sort()) {
  for (const problem of checkSvgAsset(readFileSync(path.join(svgDir, name), 'utf8'))) {
    assetErrors.push(`FEHLER   content/assets/svg/${name} ${problem}`);
  }
}

for (const line of [...parseErrors, ...assetErrors]) console.error(line);
for (const issue of issues) {
  (issue.severity === 'error' ? console.error : console.warn)(formatIssue(issue));
}

const errorCount =
  parseErrors.length + assetErrors.length + issues.filter((i) => i.severity === 'error').length;
const warningCount = issues.length - issues.filter((i) => i.severity === 'error').length;
const summary =
  `${files.length + parseErrors.length} Dateien · ${bundle.items.size} Items · ` +
  `${bundle.texts.size} Lesetexte · ${bundle.probetests.size} Probetests · ` +
  `${errorCount} Fehler · ${warningCount} Warnungen`;

if (errorCount > 0) {
  console.error(`\nContent ungültig: ${summary}`);
  process.exit(1);
}
console.log(`Content gültig: ${summary}`);

const manifest = `${JSON.stringify(
  buildContentManifest([...bundle.items.values()].map((located) => located.value)),
  null,
  2,
)}\n`;
const manifestPath = path.join(contentRoot, MANIFEST_FILE);
if (!existsSync(manifestPath) || readFileSync(manifestPath, 'utf8') !== manifest) {
  if (process.env.CI) {
    console.error(
      'FEHLER   content/manifest.json ist veraltet: lokal npm run content:validate ausführen und committen.',
    );
    process.exit(1);
  }
  writeFileSync(manifestPath, manifest);
  console.log('content/manifest.json aktualisiert.');
}
