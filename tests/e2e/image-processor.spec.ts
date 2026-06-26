import { test, expect } from '@playwright/test';
import { join } from 'node:path';

const fixturesDir = join(process.cwd(), 'tests', 'fixtures');
const appUrl = 'http://localhost:4321/fx-digital-technical/';

async function uploadAndWait(page: import('@playwright/test').Page, fixtureName: string) {
  await page.goto(appUrl);
  await page.locator('#file-input').setInputFiles(join(fixturesDir, fixtureName));
  await expect(page.locator('.chart-row').first()).toBeVisible({ timeout: 5000 });
}

test.describe('image processor — pixel extraction', () => {
  test('single opaque pixel → one RGB entry', async ({ page }) => {
    await uploadAndWait(page, '1x1-red.png');
    await expect(page.locator('.chart-row')).toHaveCount(1);
    const labels = await page.locator('.color-label').allTextContents();
    expect(labels).toContain('#ff0000');
  });

  test('single fully-transparent pixel → transparent sentinel', async ({ page }) => {
    await uploadAndWait(page, '1x1-transparent.png');
    await expect(page.locator('.chart-row')).toHaveCount(1);
    const labels = await page.locator('.color-label').allTextContents();
    expect(labels).toContain('transparent');
  });

  test('semi-transparent pixel → processed as RGB, not transparent', async ({ page }) => {
    await uploadAndWait(page, '1x1-semi-transparent.png');
    await expect(page.locator('.chart-row')).toHaveCount(1);
    // Chromium premultiplies alpha internally and un-premultiplies on getImageData read,
    // causing rounding: (150 × 128/255) rounds to 75, then (75 × 255/128) rounds to 149.
    // Raw key 100,149,199 → hex #6495c7
    const labels = await page.locator('.color-label').allTextContents();
    expect(labels).toContain('#6495c7');
    expect(labels).not.toContain('transparent');
  });

  test('two-pixel image with distinct colors', async ({ page }) => {
    await uploadAndWait(page, '2x1-red-blue.png');
    await expect(page.locator('.chart-row')).toHaveCount(2);
    const labels = await page.locator('.color-label').allTextContents();
    expect(labels).toContain('#ff0000');
    expect(labels).toContain('#0000ff');
  });

  test('two-pixel mixed image → RGB entry + transparent entry', async ({ page }) => {
    await uploadAndWait(page, '2x1-red-transparent.png');
    await expect(page.locator('.chart-row')).toHaveCount(2);
    const labels = await page.locator('.color-label').allTextContents();
    expect(labels).toContain('#ff0000');
    expect(labels).toContain('transparent');
  });

  test('multiple identical pixels → count accumulates', async ({ page }) => {
    await uploadAndWait(page, '4x1-same-color.png');
    await expect(page.locator('.chart-row')).toHaveCount(1);
    const labels = await page.locator('.color-label').allTextContents();
    expect(labels).toContain('#ff0000');
    const percentages = await page.locator('.percentage-label').allTextContents();
    expect(percentages).toContain('100.0%');
  });

  test('totalPixels equals width × height (all pixels)', async ({ page }) => {
    await uploadAndWait(page, '2x1-red-transparent.png');
    await expect(page.locator('.chart-row')).toHaveCount(2);
    const percentages = await page.locator('.percentage-label').allTextContents();
    const total = percentages.reduce((sum, text) => sum + parseFloat(text), 0);
    expect(total).toBeCloseTo(100, 0);
  });

  test('near-black fixture raw extraction confirms key format before quantization', async ({ page }) => {
    await uploadAndWait(page, '2x1-near-black.png');
    await expect(page.locator('.chart-row')).toHaveCount(2);
    // Raw keys 10,0,0 and 30,0,0 survive default bucket size 10 unchanged → #0a0000 and #1e0000
    const labels = await page.locator('.color-label').allTextContents();
    expect(labels).toContain('#0a0000');
    expect(labels).toContain('#1e0000');
  });
});

test.describe('image processor — format compatibility', () => {
  test('JPEG file processes without error', async ({ page }) => {
    await uploadAndWait(page, '1x1-format.jpg');
    await expect(page.locator('.chart-row')).toHaveCount(1);
    const labels = await page.locator('.color-label').allTextContents();
    expect(labels).not.toContain('transparent');
  });

  test('WebP file produces exact pixel values (lossless)', async ({ page }) => {
    await uploadAndWait(page, '1x1-format.webp');
    await expect(page.locator('.chart-row')).toHaveCount(1);
    const labels = await page.locator('.color-label').allTextContents();
    expect(labels).toContain('#ffffff');
  });

  test('AVIF file produces exact pixel values (lossless)', async ({ page }) => {
    await uploadAndWait(page, '1x1-format.avif');
    await expect(page.locator('.chart-row')).toHaveCount(1);
    const labels = await page.locator('.color-label').allTextContents();
    expect(labels).toContain('#ffffff');
  });

  test('BMP file produces exact pixel values (lossless)', async ({ page }) => {
    await uploadAndWait(page, '1x1-format.bmp');
    await expect(page.locator('.chart-row')).toHaveCount(1);
    const labels = await page.locator('.color-label').allTextContents();
    expect(labels).toContain('#ff0000');
  });
});
