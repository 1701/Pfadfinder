// Runs after `vite build`: guards properties of the production bundle that unit tests cannot see.
//  - developer pages (/dev/*) must not be in the bundle
//  - test fixtures (reading text t-sach-900) only reach the dev pages, never the bundle
//  - self-hosted fonts and reading texts must be precached for offline use
//  - updates wait for "Neu laden" (task 11): sw.js only skips waiting on request, never on its own,
//    and the app registers the worker itself (no registerSW.js); the build id is filled in
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
  for (const marker of [
    '/dev/tokens',
    'TokensPage',
    'Token-Übersicht',
    '/dev/item',
    'ItemPage',
    '/dev/karte',
    'KartePage',
    '/dev/einstieg',
    'EinstiegPage',
    '/dev/probetest',
    'ProbetestPage',
    'ProbetestLaufPage',
    '/dev/text',
    'TextPage',
    '/dev/format',
    'FormatPage',
    'Baumeister am Bach',
  ]) {
    if (text.includes(marker)) errors.push(`${file}: enthält Entwicklerseite ("${marker}")`);
  }
}

const sw = readFileSync(path.join(dist, 'sw.js'), 'utf8');
for (const font of ['fonts/andika/Andika-Regular.woff2', 'fonts/andika/Andika-Bold.woff2']) {
  if (!sw.includes(font)) errors.push(`sw.js: ${font} fehlt im Precache`);
}
// Reading texts: one lazy chunk per file (content-runtime/loader), named after the file.
const textsDir = path.resolve(dist, '..', 'content', 'texts', 'deutsch');
for (const file of readdirSync(textsDir).filter((f) => f.endsWith('.json'))) {
  const id = file.replace(/\.json$/, '');
  const chunk = readdirSync(path.join(dist, 'assets')).find(
    (f) => f.startsWith(`${id}-`) && f.endsWith('.js'),
  );
  if (!chunk) errors.push(`assets: kein Chunk für content/texts/deutsch/${file}`);
  else if (!sw.includes(`assets/${chunk}`)) errors.push(`sw.js: Lesetext ${id} fehlt im Precache`);
}
// Updates (src/app/pwa-update.ts): a new worker waits until the app sends SKIP_WAITING.
if (!/"SKIP_WAITING"===\w+\.data\.type&&self\.skipWaiting\(\)/.test(sw)) {
  errors.push('sw.js: kein SKIP_WAITING-Listener');
}
if ((sw.match(/skipWaiting\(\)/g) ?? []).length !== 1 || sw.includes('clientsClaim')) {
  errors.push(
    'sw.js: übernimmt von selbst (skipWaiting/clientsClaim), ein Update käme mitten in eine Runde',
  );
}
for (const file of files) {
  const text = readFileSync(path.join(dist, file), 'utf8');
  if (text.includes('registerSW'))
    errors.push(`${file}: lädt registerSW.js, die App registriert selbst`);
  if (text.includes('__BUILD_ID__')) errors.push(`${file}: Build-Kennung nicht eingesetzt`);
}

// App icons: listed in the manifest, linked for iOS, precached for offline start.
const manifest = readFileSync(path.join(dist, 'manifest.webmanifest'), 'utf8');
for (const icon of ['icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png']) {
  if (!manifest.includes(`/${icon}`)) errors.push(`manifest.webmanifest: ${icon} fehlt`);
  if (!sw.includes(icon)) errors.push(`sw.js: ${icon} fehlt im Precache`);
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

/**
 * dnd-kit only in the format chunks (match, order): never in what the start page or a route
 * loads statically. Static imports in the minified output look like `import{…}from"./x.js"` or
 * `import"./x.js"`; dynamic ones (`import("./x.js")`) are the lazy edges and are not followed.
 */
const DND_MARKER = 'DndDescribedBy';
const assets = path.join(dist, 'assets');
const staticImports = (file: string): string[] =>
  [
    ...readFileSync(path.join(dist, file), 'utf8').matchAll(
      /import\s*(?:[^"'()]*?from\s*)?["']\.\/([^"']+\.js)["']/g,
    ),
  ].map((m) => `assets/${m[1]}`);
const roots = [
  ...initial,
  ...readdirSync(assets)
    .filter((f) => /-route-[\w-]+\.js$/.test(f))
    .map((f) => `assets/${f}`),
];
const closure = new Set<string>();
for (const queue = [...roots]; queue.length > 0;) {
  const file = queue.pop() as string;
  if (closure.has(file)) continue;
  closure.add(file);
  queue.push(...staticImports(file));
}
const withDnd = readdirSync(assets)
  .filter(
    (f) => f.endsWith('.js') && readFileSync(path.join(assets, f), 'utf8').includes(DND_MARKER),
  )
  .map((f) => `assets/${f}`);
if (withDnd.length === 0) errors.push('assets: dnd-kit fehlt ganz (Marker nicht gefunden)');
for (const file of withDnd.filter((f) => closure.has(f))) {
  errors.push(
    `${file}: dnd-kit gehört in die Format-Chunks (match, order), nicht in Startseite oder Route`,
  );
}

if (errors.length > 0) {
  for (const e of errors) console.error(`FEHLER   dist/${e}`);
  process.exit(1);
}
console.log(
  `Bundle geprüft: ${files.length} Dateien, keine Entwicklerseiten, Schriften und Icons im Precache, ` +
    `Startseite ${initialKb.toFixed(1)} kB JS (Budget ${START_PAGE_BUDGET_KB} kB, ohne Zod/Dexie), dnd-kit nur in ${withDnd.join(', ')}.`,
);
