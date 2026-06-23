import { test, expect } from '@playwright/test';
import { join } from 'node:path';
import './window-hooks.d.ts';

const fixturesDir = join(process.cwd(), 'tests', 'fixtures');
const appUrl = 'http://localhost:4321/fx-digital-technical/';

async function uploadAndGetResult(page: import('@playwright/test').Page, fixtureName: string) {
  await page.goto(appUrl);
  const fileInput = page.locator('#file-input');
  await fileInput.setInputFiles(join(fixturesDir, fixtureName));
  await page.waitForFunction(() => window.__lastResult !== undefined, { timeout: 5000 });
  return page.evaluate(() => window.__lastResult!);
}

test.describe('image processor — pixel extraction', () => {
  test('single opaque pixel → one RGB entry', async ({ page }) => {
    const result = await uploadAndGetResult(page, '1x1-red.png');
    expect(result.map).toEqual({ '255,0,0': 1 });
    expect(result.totalPixels).toBe(1);
  });

  test('single fully-transparent pixel → transparent sentinel', async ({ page }) => {
    const result = await uploadAndGetResult(page, '1x1-transparent.png');
    expect(result.map).toEqual({ 'transparent': 1 });
    expect(result.totalPixels).toBe(1);
  });

  test('semi-transparent pixel → processed as RGB, not transparent', async ({ page }) => {
    const result = await uploadAndGetResult(page, '1x1-semi-transparent.png');
    // Canvas pre-multiplies alpha on write and un-pre-multiplies on read, causing
    // rounding: (150 × 128/255) rounds to 75, then (75 × 255/128) rounds to 149.
    expect(result.map).toEqual({ '100,149,199': 1 });
    expect(result.totalPixels).toBe(1);
  });

  test('two-pixel image with distinct colours', async ({ page }) => {
    const result = await uploadAndGetResult(page, '2x1-red-blue.png');
    expect(result.map).toEqual({ '255,0,0': 1, '0,0,255': 1 });
    expect(result.totalPixels).toBe(2);
  });

  test('two-pixel mixed image → RGB entry + transparent entry', async ({ page }) => {
    const result = await uploadAndGetResult(page, '2x1-red-transparent.png');
    expect(result.map).toEqual({ '255,0,0': 1, 'transparent': 1 });
    expect(result.totalPixels).toBe(2);
  });

  test('multiple identical pixels → count accumulates', async ({ page }) => {
    const result = await uploadAndGetResult(page, '4x1-same-color.png');
    expect(result.map).toEqual({ '255,0,0': 4 });
    expect(result.totalPixels).toBe(4);
  });

  test('totalPixels equals width × height (all pixels)', async ({ page }) => {
    const result = await uploadAndGetResult(page, '2x1-red-transparent.png');
    expect(result.totalPixels).toBe(2);
  });

  test('near-black fixture raw extraction confirms key format before quantization', async ({ page }) => {
    const result = await uploadAndGetResult(page, '2x1-near-black.png');
    expect(result.map).toEqual({ '10,0,0': 1, '30,0,0': 1 });
    expect(result.totalPixels).toBe(2);
  });
});

test.describe('image processor — format compatibility', () => {
  test('JPEG file processes without error', async ({ page }) => {
    const result = await uploadAndGetResult(page, '1x1-format.jpg');
    expect(result.totalPixels).toBe(1);
    const keys = Object.keys(result.map);
    expect(keys).toHaveLength(1);
    expect(keys[0]).not.toBe('transparent');
  });

  test('WebP file produces exact pixel values (lossless)', async ({ page }) => {
    const result = await uploadAndGetResult(page, '1x1-format.webp');
    expect(result.map).toEqual({ '255,255,255': 1 });
    expect(result.totalPixels).toBe(1);
  });

  test('AVIF file produces exact pixel values (lossless)', async ({ page }) => {
    const result = await uploadAndGetResult(page, '1x1-format.avif');
    expect(result.map).toEqual({ '255,255,255': 1 });
    expect(result.totalPixels).toBe(1);
  });

  test('BMP file produces exact pixel values (lossless)', async ({ page }) => {
    const result = await uploadAndGetResult(page, '1x1-format.bmp');
    expect(result.map).toEqual({ '255,0,0': 1 });
    expect(result.totalPixels).toBe(1);
  });
});
