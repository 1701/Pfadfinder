// The palette must stay WCAG AA (pfadfinder-ui skill). Values are read from tokens.css itself,
// so changing a color there re-runs these checks.

import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

const css = readFileSync('src/ui/theme/tokens.css', 'utf8');
const colors = Object.fromEntries(
  [...css.matchAll(/--color-([a-z-]+):\s*(#[0-9a-fA-F]{6})\b/g)].map((m) => [
    m[1],
    m[2]!.toLowerCase(),
  ]),
) as Record<string, string>;

function luminance(hex: string): number {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r! + 0.7152 * g! + 0.0722 * b!;
}

function contrast(fg: string, bg: string): number {
  const [hi, lo] = [luminance(fg), luminance(bg)].sort((a, b) => b - a);
  return (hi! + 0.05) / (lo! + 0.05);
}

// [foreground, background, minimum]: 4.5 for text, 3 for control outlines and focus ring.
const PAIRS: [string, string, number][] = [
  ['ink', 'paper', 4.5],
  ['ink', 'surface', 4.5],
  ['ink-muted', 'paper', 4.5],
  ['ink-muted', 'surface', 4.5],
  ['ink', 'signal', 4.5],
  ['ink', 'signal-soft', 4.5],
  ['ink', 'touch-soft', 4.5],
  ['ink', 'correct-surface', 4.5],
  ['ink', 'notyet-surface', 4.5],
  ['correct', 'correct-surface', 4.5],
  ['correct', 'surface', 4.5],
  ['notyet', 'notyet-surface', 4.5],
  ['notyet', 'surface', 4.5],
  // Vorlesen label and button outline inside the feedback panel.
  ['ink-muted', 'correct-surface', 4.5],
  ['ink-muted', 'notyet-surface', 4.5],
  ['line-strong', 'correct-surface', 3],
  ['line-strong', 'notyet-surface', 3],
  ['line-strong', 'paper', 3],
  ['line-strong', 'surface', 3],
  ['signal-edge', 'paper', 3],
  ['signal-edge', 'surface', 3],
  ['signal-edge', 'signal-soft', 3],
  // Map: names on every Höhenstufe, island names on the sea, outlines of open Gebiete
  // (ink-muted) against land and sea, the dashed outline of a blank spot (line-strong).
  ['ink', 'land', 4.5],
  ['ink', 'land-soft', 4.5],
  ['ink-muted', 'water', 4.5],
  ['ink-muted', 'land', 3],
  ['line-strong', 'water', 3],
];

describe('design tokens', () => {
  it('define every color used in the contrast checks', () => {
    for (const [fg, bg] of PAIRS) {
      expect(colors[fg], fg).toBeDefined();
      expect(colors[bg], bg).toBeDefined();
    }
  });

  it.each(PAIRS)('%s on %s reaches %d:1', (fg, bg, min) => {
    expect(contrast(colors[fg]!, colors[bg]!)).toBeGreaterThanOrEqual(min);
  });

  it('remove Tailwind defaults for colors, radii and shadows', () => {
    for (const ns of ['--color-*', '--radius-*', '--shadow-*', '--font-*', '--text-*']) {
      expect(css).toContain(`${ns}: initial;`);
    }
  });

  it('keep map colors and feedback colors apart (water and correct-surface look alike)', () => {
    const uiFiles = readdirSync('src/ui', { recursive: true, encoding: 'utf8' })
      .filter((f) => /\.tsx?$/.test(f))
      .map((f) => `src/ui/${f.split(path.sep).join('/')}`);
    for (const file of uiFiles) {
      const text = readFileSync(file, 'utf8');
      if (file.startsWith('src/ui/map/')) {
        expect(
          text.match(/\b(?:fill|stroke|bg|text|border)-(?:correct|notyet)\S*/g),
          file,
        ).toBeNull();
      } else {
        expect(text.match(/\b(?:fill|stroke|bg|text|border)-(?:land|water)\S*/g), file).toBeNull();
      }
    }
  });

  it('contain no red-like "error" color', () => {
    for (const hex of Object.values(colors)) {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
      const reddish = r! > 160 && r! - Math.max(g!, b!) > 80;
      expect(reddish, hex).toBe(false);
    }
  });
});

describe('the static shell in index.html', () => {
  it('uses the paper and ink of the tokens until the JS runs', () => {
    const html = readFileSync('index.html', 'utf8');
    const style = html.match(/<style>([\s\S]*?)<\/style>/)![1]!;
    expect(style).toContain(`background: ${colors.paper};`);
    expect(style).toContain(`color: ${colors.ink};`);
    expect(html).toContain('<div id="root"><p class="shell">Pfadfinder</p></div>');
  });
});
