// Runs after `vite build`: guards properties of the production bundle that unit tests cannot see.
//  - developer pages (/dev/*) must not be in the bundle
//  - self-hosted fonts must be precached for offline use
//  - the start page's JS (entry + modulepreloads) stays below the budget and contains neither
//    Zod nor Dexie: both belong to the lazy practice chunk (ARCHITECTURE.md §5)

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
const files = readdirSync(dist, { recursive: true, encoding: 'utf8' }).filter((f) =>
  /\.(js|html|css)$/.test(f),
);
const errors: string[] = [];

for (const file of files) {
  const text = readFileSync(path.join(dist, file), 'utf8');
  for (const marker of ['/dev/tokens', 'TokensPage', 'Token-Übersicht', '/dev/item', 'ItemPage']) {
    if (text.includes(marker)) errors.push(`${file}: enthält Entwicklerseite ("${marker}")`);
  }
}

const sw = readFileSync(path.join(dist, 'sw.js'), 'utf8');
for (const font of ['fonts/andika/Andika-Regular.woff2', 'fonts/andika/Andika-Bold.woff2']) {
  if (!sw.includes(font)) errors.push(`sw.js: ${font} fehlt im Precache`);
}

/** Minified bytes of all JS the start page loads before it can render. */
const START_PAGE_BUDGET_KB = 300;
const html = readFileSync(path.join(dist, 'index.html'), 'utf8');
const initial = [
  ...html.matchAll(
    /<(?:script type="module"|link rel="modulepreload")[^>]*(?:src|href)="\/([^"]+\.js)"/g,
  ),
].map((m) => m[1] as string);
const initialKb =
  initial.reduce((sum, file) => sum + readFileSync(path.join(dist, file)).length, 0) / 1000;
if (initial.length === 0) errors.push('index.html: kein Einstiegs-Skript gefunden');
if (initialKb > START_PAGE_BUDGET_KB) {
  errors.push(
    `index.html: Startseite lädt ${initialKb.toFixed(1)} kB JS, Budget ${START_PAGE_BUDGET_KB} kB`,
  );
}
for (const file of initial) {
  const text = readFileSync(path.join(dist, file), 'utf8');
  for (const [lib, marker] of [
    ['Zod', 'ZodError'],
    ['Dexie', 'Dexie'],
  ] as const) {
    if (text.includes(marker))
      errors.push(`${file}: ${lib} gehört in den Üben-Chunk, nicht auf die Startseite`);
  }
}

if (errors.length > 0) {
  for (const e of errors) console.error(`FEHLER   dist/${e}`);
  process.exit(1);
}
console.log(
  `Bundle geprüft: ${files.length} Dateien, keine Entwicklerseiten, Schriften im Precache, ` +
    `Startseite ${initialKb.toFixed(1)} kB JS (Budget ${START_PAGE_BUDGET_KB} kB, ohne Zod/Dexie).`,
);
