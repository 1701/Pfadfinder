// Renders public/icon.svg to the PNG app icons (manifest and apple-touch-icon) with Playwright's
// Chromium and writes them as opaque RGB PNGs. Usage: npm run icons (after changing the SVG).

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';
import { encodeRgbPng } from './png';

export const ICONS = [
  { file: 'apple-touch-icon-180.png', size: 180 },
  { file: 'icon-192.png', size: 192 },
  { file: 'icon-512.png', size: 512 },
  // Same picture: the motif already lies inside the maskable safe zone, the ground is full bleed.
  { file: 'icon-maskable-512.png', size: 512 },
] as const;

const svg = readFileSync('public/icon.svg', 'utf8');
const browser = await chromium.launch();
mkdirSync('public/icons', { recursive: true });

try {
  const page = await browser.newPage();
  for (const { file, size } of ICONS) {
    const pixels = await page.evaluate(
      async ({ svg, size }) => {
        const image = new Image(size, size);
        image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
        await image.decode();
        const canvas = document.createElement('canvas');
        canvas.width = canvas.height = size;
        const context = canvas.getContext('2d');
        if (!context) throw new Error('No 2d canvas');
        context.drawImage(image, 0, 0, size, size);
        return Array.from(context.getImageData(0, 0, size, size).data);
      },
      { svg, size },
    );
    writeFileSync(`public/icons/${file}`, encodeRgbPng(size, size, Uint8Array.from(pixels)));
    console.log(`Icon: public/icons/${file} (${size}×${size}, RGB)`);
  }
} finally {
  await browser.close();
}
