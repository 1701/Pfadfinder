// The palette must stay WCAG AA (pfadfinder-ui skill). Values are read from tokens.css itself,
// so changing a color there re-runs these checks.

import { readFileSync } from 'node:fs';
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
  ['ink', 'correct-surface', 4.5],
  ['ink', 'notyet-surface', 4.5],
  ['correct', 'correct-surface', 4.5],
  ['correct', 'surface', 4.5],
  ['notyet', 'notyet-surface', 4.5],
  ['notyet', 'surface', 4.5],
  ['line-strong', 'paper', 3],
  ['line-strong', 'surface', 3],
  ['signal-edge', 'paper', 3],
  ['signal-edge', 'surface', 3],
  ['signal-edge', 'signal-soft', 3],
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

  it('contain no red-like "error" color', () => {
    for (const hex of Object.values(colors)) {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
      const reddish = r! > 160 && r! - Math.max(g!, b!) > 80;
      expect(reddish, hex).toBe(false);
    }
  });
});
