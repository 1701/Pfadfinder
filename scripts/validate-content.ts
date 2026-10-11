// Validates every content/**/*.json against the schemas and cross-file rules.
// Usage: npm run content:validate  (exit code 1 on any error; warnings do not fail)

import { existsSync, readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateContent, type ContentFile, type ContentIssue } from '../src/domain/content';

const contentRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'content');

function listJsonFiles(root: string): string[] {
  return readdirSync(root, { recursive: true, encoding: 'utf8' })
    .filter((rel) => rel.endsWith('.json'))
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

for (const line of parseErrors) console.error(line);
for (const issue of issues) {
  (issue.severity === 'error' ? console.error : console.warn)(formatIssue(issue));
}

const errorCount = parseErrors.length + issues.filter((i) => i.severity === 'error').length;
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
