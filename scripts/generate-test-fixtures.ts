import { PNG } from 'pngjs';
import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

function createBmpRgb(red: number, green: number, blue: number): Buffer {
  const fileHeaderSize = 14;
  const dibHeaderSize = 40;
  const pixelDataSize = 4;
  const fileSize = fileHeaderSize + dibHeaderSize + pixelDataSize;

  const buffer = Buffer.alloc(fileSize, 0);
  let offset = 0;

  buffer.write('BM', offset, 'ascii');
  offset += 2;
  buffer.writeUInt32LE(fileSize, offset);
  offset += 4;
  buffer.writeUInt16LE(0, offset);
  offset += 2;
  buffer.writeUInt16LE(0, offset);
  offset += 2;
  buffer.writeUInt32LE(fileHeaderSize + dibHeaderSize, offset);
  offset += 4;

  buffer.writeUInt32LE(dibHeaderSize, offset);
  offset += 4;
  buffer.writeInt32LE(1, offset);
  offset += 4;
  buffer.writeInt32LE(1, offset);
  offset += 4;
  buffer.writeUInt16LE(1, offset);
  offset += 2;
  buffer.writeUInt16LE(24, offset);
  offset += 2;
  buffer.writeUInt32LE(0, offset);
  offset += 4;
  buffer.writeUInt32LE(pixelDataSize, offset);
  offset += 4;
  buffer.writeInt32LE(2835, offset);
  offset += 4;
  buffer.writeInt32LE(2835, offset);
  offset += 4;
  buffer.writeUInt32LE(0, offset);
  offset += 4;
  buffer.writeUInt32LE(0, offset);
  offset += 4;

  buffer[offset] = blue;
  buffer[offset + 1] = green;
  buffer[offset + 2] = red;
  buffer[offset + 3] = 0;

  return buffer;
}

const fixturesDir = join(process.cwd(), 'tests', 'fixtures');
mkdirSync(fixturesDir, { recursive: true });

interface PixelSpec {
  red: number;
  green: number;
  blue: number;
  alpha: number;
}

function createPng(width: number, height: number, pixels: PixelSpec[]): Buffer {
  const png = new PNG({ width, height, filterType: -1 });
  for (let index = 0; index < pixels.length; index++) {
    const pixel = pixels[index]!;
    const offset = index * 4;
    png.data[offset] = pixel.red;
    png.data[offset + 1] = pixel.green;
    png.data[offset + 2] = pixel.blue;
    png.data[offset + 3] = pixel.alpha;
  }
  return PNG.sync.write(png);
}

function verifyPng(buffer: Buffer, expectedPixels: PixelSpec[]): void {
  const decoded = PNG.sync.read(buffer);
  for (let index = 0; index < expectedPixels.length; index++) {
    const expected = expectedPixels[index]!;
    const offset = index * 4;
    const red = decoded.data[offset];
    const green = decoded.data[offset + 1];
    const blue = decoded.data[offset + 2];
    const alpha = decoded.data[offset + 3];
    if (red !== expected.red || green !== expected.green || blue !== expected.blue || alpha !== expected.alpha) {
      throw new Error(
        `Pixel ${index} mismatch: expected (${expected.red},${expected.green},${expected.blue},${expected.alpha}), got (${red},${green},${blue},${alpha})`
      );
    }
  }
}

function writePng(filename: string, width: number, height: number, pixels: PixelSpec[]): void {
  const buffer = createPng(width, height, pixels);
  verifyPng(buffer, pixels);
  writeFileSync(join(fixturesDir, filename), buffer);
  console.log(`Written and verified: ${filename}`);
}

const pngFixtures: Array<{ filename: string; width: number; height: number; pixels: PixelSpec[] }> = [
  {
    filename: '1x1-red.png',
    width: 1,
    height: 1,
    pixels: [{ red: 255, green: 0, blue: 0, alpha: 255 }],
  },
  {
    filename: '1x1-transparent.png',
    width: 1,
    height: 1,
    pixels: [{ red: 0, green: 0, blue: 0, alpha: 0 }],
  },
  {
    filename: '1x1-semi-transparent.png',
    width: 1,
    height: 1,
    pixels: [{ red: 100, green: 150, blue: 200, alpha: 128 }],
  },
  {
    filename: '1x1-white.png',
    width: 1,
    height: 1,
    pixels: [{ red: 255, green: 255, blue: 255, alpha: 255 }],
  },
  {
    filename: '2x1-red-blue.png',
    width: 2,
    height: 1,
    pixels: [
      { red: 255, green: 0, blue: 0, alpha: 255 },
      { red: 0, green: 0, blue: 255, alpha: 255 },
    ],
  },
  {
    filename: '2x1-red-transparent.png',
    width: 2,
    height: 1,
    pixels: [
      { red: 255, green: 0, blue: 0, alpha: 255 },
      { red: 0, green: 0, blue: 0, alpha: 0 },
    ],
  },
  {
    filename: '4x1-same-color.png',
    width: 4,
    height: 1,
    pixels: [
      { red: 255, green: 0, blue: 0, alpha: 255 },
      { red: 255, green: 0, blue: 0, alpha: 255 },
      { red: 255, green: 0, blue: 0, alpha: 255 },
      { red: 255, green: 0, blue: 0, alpha: 255 },
    ],
  },
  {
    filename: '2x1-near-black.png',
    width: 2,
    height: 1,
    pixels: [
      { red: 10, green: 0, blue: 0, alpha: 255 },
      { red: 30, green: 0, blue: 0, alpha: 255 },
    ],
  },
];

for (const fixture of pngFixtures) {
  writePng(fixture.filename, fixture.width, fixture.height, fixture.pixels);
}

async function writeSharpFixture(
  filename: string,
  buffer: Buffer
): Promise<void> {
  writeFileSync(join(fixturesDir, filename), buffer);
  console.log(`Written: ${filename}`);
}

const whiteRgba = Buffer.from([255, 255, 255, 255]);
const redRgba = Buffer.from([255, 0, 0, 255]);

await writeSharpFixture(
  '1x1-format.jpg',
  await sharp(whiteRgba, { raw: { width: 1, height: 1, channels: 4 } })
    .jpeg({ quality: 100 })
    .toBuffer()
);

await writeSharpFixture(
  '1x1-format.webp',
  await sharp(whiteRgba, { raw: { width: 1, height: 1, channels: 4 } })
    .webp({ lossless: true })
    .toBuffer()
);

await writeSharpFixture(
  '1x1-format.avif',
  await sharp(whiteRgba, { raw: { width: 1, height: 1, channels: 4 } })
    .avif({ lossless: true })
    .toBuffer()
);

await writeSharpFixture(
  '1x1-format.bmp',
  createBmpRgb(255, 0, 0)
);

console.log('\nAll fixtures generated successfully.');
