import { deflateSync } from "node:zlib";

/**
 * Tiny PNG encoder, used by the seed to give sample content real image bytes.
 * Seeded media has to point at objects that actually exist in the image bucket,
 * otherwise every seeded project renders a broken cover. Hand-rolled rather
 * than pulling in an image library for three rectangles.
 */

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buf: Buffer) {
  let c = 0xffffffff;
  for (const byte of buf) c = CRC_TABLE[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Buffer) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const typeAndData = Buffer.concat([Buffer.from(type, "ascii"), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(typeAndData));
  return Buffer.concat([length, typeAndData, crc]);
}

/** Solid-colour RGB PNG. Two tones are mixed by row so it is not dead flat. */
export function solidPng(width: number, height: number, top: [number, number, number], bottom: [number, number, number]) {
  const raw = Buffer.alloc(height * (1 + width * 3));
  let offset = 0;
  for (let y = 0; y < height; y++) {
    raw[offset++] = 0; // filter type: none
    const t = height === 1 ? 0 : y / (height - 1);
    for (let x = 0; x < width; x++) {
      raw[offset++] = Math.round(top[0] + (bottom[0] - top[0]) * t);
      raw[offset++] = Math.round(top[1] + (bottom[1] - top[1]) * t);
      raw[offset++] = Math.round(top[2] + (bottom[2] - top[2]) * t);
    }
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // bit depth
  ihdr[9] = 2; // colour type: truecolour
  ihdr[10] = 0; // deflate
  ihdr[11] = 0; // adaptive filtering
  ihdr[12] = 0; // no interlace

  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk("IHDR", ihdr),
    chunk("IDAT", deflateSync(raw, { level: 9 })),
    chunk("IEND", Buffer.alloc(0)),
  ]);
}
