// Minimal PNG writer/reader for the app icons: opaque RGB (colour type 2), no alpha channel,
// as iOS wants for apple-touch-icon. Uses only node:zlib, no image library.

import { crc32, deflateSync } from 'node:zlib';

const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

/** Encodes RGBA pixels (alpha ignored) as an 8-bit RGB PNG without alpha. */
export function encodeRgbPng(width: number, height: number, rgba: Uint8Array): Buffer {
  if (rgba.length !== width * height * 4) throw new Error('Pixel data does not match the size');
  const rows = Buffer.alloc(height * (1 + width * 3));
  for (let y = 0; y < height; y++) {
    const row = y * (1 + width * 3); // filter byte 0 (none) at the start of every row
    for (let x = 0; x < width; x++) {
      const from = (y * width + x) * 4;
      rows.set(rgba.subarray(from, from + 3), row + 1 + x * 3);
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header.set([8, 2, 0, 0, 0], 8); // bit depth 8, colour type 2 (RGB), default methods
  return Buffer.concat([
    SIGNATURE,
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(rows)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

export interface PngInfo {
  width: number;
  height: number;
  /** 2 = RGB (no alpha), 6 = RGBA. */
  colourType: number;
}

export function readPngInfo(png: Buffer): PngInfo {
  if (!png.subarray(0, 8).equals(SIGNATURE) || png.toString('ascii', 12, 16) !== 'IHDR') {
    throw new Error('Not a PNG file');
  }
  return {
    width: png.readUInt32BE(16),
    height: png.readUInt32BE(20),
    colourType: png.readUInt8(25),
  };
}
