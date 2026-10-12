// Prints the size of every JS chunk in dist/ and the entry chunk (the "main bundle").
// Usage: npm run analyze  (also writes bundle-stats.html with the module treemap)

import { readFileSync, readdirSync } from 'node:fs';
import path from 'node:path';
import { gzipSync } from 'node:zlib';

const dist = path.resolve('dist');
const html = readFileSync(path.join(dist, 'index.html'), 'utf8');
const entry = /<script type="module"[^>]*src="\/([^"]+)"/.exec(html)?.[1];

const rows = readdirSync(path.join(dist, 'assets'))
  .filter((f) => f.endsWith('.js'))
  .map((f) => {
    const buf = readFileSync(path.join(dist, 'assets', f));
    return { file: `assets/${f}`, kb: buf.length / 1000, gzipKb: gzipSync(buf).length / 1000 };
  })
  .sort((a, b) => b.kb - a.kb);

for (const r of rows) {
  const mark = r.file === entry ? '  ← Hauptbundle' : '';
  console.log(
    `${r.kb.toFixed(1).padStart(8)} kB  ${r.gzipKb.toFixed(1).padStart(7)} kB gzip  ${r.file}${mark}`,
  );
}
