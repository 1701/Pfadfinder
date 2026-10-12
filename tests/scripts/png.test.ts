import { readFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';
import { describe, expect, it } from 'vitest';
import { encodeRgbPng, readPngInfo } from '../../scripts/png';

describe('encodeRgbPng', () => {
  it('writes an RGB PNG without alpha and keeps the colours', () => {
    // 2×1: ink and signal yellow, alpha values that must be dropped.
    const rgba = Uint8Array.from([0x16, 0x3a, 0x2f, 0x80, 0xf2, 0xb8, 0x3a, 0x00]);
    const png = encodeRgbPng(2, 1, rgba);
    expect(readPngInfo(png)).toEqual({ width: 2, height: 1, colourType: 2 });
    const idatStart = png.indexOf('IDAT') + 4;
    const idatLength = png.readUInt32BE(idatStart - 8);
    const rows = inflateSync(png.subarray(idatStart, idatStart + idatLength));
    expect([...rows]).toEqual([0, 0x16, 0x3a, 0x2f, 0xf2, 0xb8, 0x3a]);
  });

  it('rejects pixel data of the wrong size', () => {
    expect(() => encodeRgbPng(2, 2, new Uint8Array(4))).toThrow(/size/);
  });
});

describe('app icons in public/icons (npm run icons)', () => {
  it.each([
    ['apple-touch-icon-180.png', 180],
    ['icon-192.png', 192],
    ['icon-512.png', 512],
    ['icon-maskable-512.png', 512],
  ])('%s is %i px and has no alpha channel', (file, size) => {
    expect(readPngInfo(readFileSync(`public/icons/${file}`))).toEqual({
      width: size,
      height: size,
      colourType: 2,
    });
  });
});
