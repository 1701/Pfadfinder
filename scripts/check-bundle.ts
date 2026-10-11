// Runs after `vite build`: guards properties of the production bundle that unit tests cannot see.
//  - developer pages (/dev/*) must not be in the bundle
//  - self-hosted fonts must be precached for offline use

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

if (errors.length > 0) {
  for (const e of errors) console.error(`FEHLER   dist/${e}`);
  process.exit(1);
}
console.log(
  `Bundle geprüft: ${files.length} Dateien, keine Entwicklerseiten, Schriften im Precache.`,
);
