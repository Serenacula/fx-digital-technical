import { test, expect } from '@playwright/test';
import { join } from 'node:path';
import './window-hooks.d.ts';

const fixturesDir = join(process.cwd(), 'tests', 'fixtures');
const appUrl = 'http://localhost:4321/fx-digital-technical/';

test.describe('E2E: Full upload-to-chart pipeline', () => {
  test('Scenario 1: complete single-image flow with known pixel values', async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });

    await page.goto(appUrl);
    await page.locator('#file-input').setInputFiles(join(fixturesDir, '2x1-red-blue.png'));
    await expect(page.locator('.chart-row').first()).toBeVisible({ timeout: 5000 });

    const rows = page.locator('.chart-row');
    await expect(rows).toHaveCount(2);

    const labels = await page.locator('.color-label').allTextContents();
    expect(labels).toContain('#ff0000');
    expect(labels).toContain('#0000ff');

    const percentages = await page.locator('.percentage-label').allTextContents();
    expect(percentages).toContain('50.0%');
    expect(percentages.filter(percentage => percentage === '50.0%')).toHaveLength(2);

    await page.locator('#quantize-slider').fill('1');
    await page.locator('#quantize-slider').dispatchEvent('input');
    await page.waitForTimeout(100);

    const labelsAfterSlider = await page.locator('.color-label').allTextContents();
    expect(labelsAfterSlider).toContain('#ff0000');
    expect(labelsAfterSlider).toContain('#0000ff');
    const percentagesAfterSlider = await page.locator('.percentage-label').allTextContents();
    expect(percentagesAfterSlider.filter(percentage => percentage === '50.0%')).toHaveLength(2);

    expect(consoleErrors).toHaveLength(0);
  });

  test('Scenario 2: slider quantization merges colors end-to-end', async ({ page }) => {
    await page.addInitScript(() => {
      let count = 0;
      const original = URL.createObjectURL.bind(URL);
      URL.createObjectURL = (...args: Parameters<typeof URL.createObjectURL>) => {
        count++;
        window.__createObjectURLCount = count;
        return original(...args);
      };
    });

    await page.goto(appUrl);
    await page.locator('#file-input').setInputFiles(join(fixturesDir, '2x1-near-black.png'));
    await expect(page.locator('.chart-row').first()).toBeVisible({ timeout: 5000 });

    const labelsAtTen = await page.locator('.color-label').allTextContents();
    expect(labelsAtTen).toContain('#0a0000');
    expect(labelsAtTen).toContain('#1e0000');

    await page.locator('#quantize-slider').fill('64');
    await page.locator('#quantize-slider').dispatchEvent('input');
    await page.waitForTimeout(100);

    const rowCount = await page.locator('.chart-row').count();
    expect(rowCount).toBe(1);

    const labelsAtSixtyFour = await page.locator('.color-label').allTextContents();
    expect(labelsAtSixtyFour).toContain('#000000');

    const percentages = await page.locator('.percentage-label').allTextContents();
    expect(percentages).toContain('100.0%');

    const urlCount = await page.evaluate(() => window.__createObjectURLCount);
    expect(urlCount).toBe(1);
  });

  test('Scenario 3: transparent pixel appears as chart entry with checkerboard', async ({ page }) => {
    await page.goto(appUrl);
    await page.locator('#file-input').setInputFiles(join(fixturesDir, '2x1-red-transparent.png'));
    await expect(page.locator('.chart-row').first()).toBeVisible({ timeout: 5000 });

    const rows = page.locator('.chart-row');
    await expect(rows).toHaveCount(2);

    const labels = await page.locator('.color-label').allTextContents();
    expect(labels).toContain('#ff0000');
    expect(labels).toContain('transparent');

    const redIndex = labels.indexOf('#ff0000');
    const redPercentage = await rows.nth(redIndex).locator('.percentage-label').textContent();
    expect(redPercentage).toBe('50.0%');

    const transparentIndex = labels.indexOf('transparent');
    const transparentBar = rows.nth(transparentIndex).locator('.bar');

    const backgroundStyle = await transparentBar.evaluate((element) => {
      return window.getComputedStyle(element).backgroundImage || window.getComputedStyle(element).background;
    });
    expect(backgroundStyle).toContain('repeating-linear-gradient');

    const borderStyle = await transparentBar.evaluate((element) => {
      return window.getComputedStyle(element).border;
    });
    expect(borderStyle).toContain('1px solid');

    await expect(page.locator('#quantize-slider')).toBeEnabled();
  });

  test('Scenario 4: error state then successful recovery', async ({ page }) => {
    await page.goto(appUrl);

    await page.locator('#file-input').setInputFiles({
      name: 'anim.gif',
      mimeType: 'image/gif',
      buffer: Buffer.from([]),
    });
    await expect(page.locator('#error-state')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('#file-input')).toBeEnabled();
    await expect(page.locator('#quantize-slider')).toBeDisabled();

    await page.locator('#file-input').setInputFiles(join(fixturesDir, '1x1-white.png'));
    await expect(page.locator('.chart-row').first()).toBeVisible({ timeout: 5000 });

    await expect(page.locator('#error-state')).not.toBeVisible();
    const labels = await page.locator('.color-label').allTextContents();
    expect(labels).toContain('#ffffff');
    const percentages = await page.locator('.percentage-label').allTextContents();
    expect(percentages).toContain('100.0%');
    await expect(page.locator('#quantize-slider')).toBeEnabled();

    const previewSrc = await page.locator('#preview-image').getAttribute('src');
    expect(previewSrc).toBeTruthy();
  });

  test('Scenario 5: all accepted file formats process without error', async ({ page }) => {
    const formats = [
      '1x1-red.png',
      '1x1-format.jpg',
      '1x1-format.webp',
      '1x1-format.avif',
      '1x1-format.bmp',
    ];

    for (const filename of formats) {
      await page.goto(appUrl);
      await page.locator('#file-input').setInputFiles(join(fixturesDir, filename));
      await expect(page.locator('.chart-row').first()).toBeVisible({ timeout: 5000 });

      await expect(page.locator('#error-state')).not.toBeVisible();
      await expect(page.locator('#chart')).toBeVisible();
      await expect(page.locator('.chart-row')).toHaveCount(1);

      await expect(page.locator('#file-input')).toBeEnabled();
      await expect(page.locator('#quantize-slider')).toBeEnabled();
    }
  });

  test('Scenario 6: percentage text shows on each bar row', async ({ page }) => {
    await page.goto(appUrl);
    await page.locator('#file-input').setInputFiles(join(fixturesDir, '2x1-red-blue.png'));
    await expect(page.locator('.chart-row').first()).toBeVisible({ timeout: 5000 });

    const percentageLabels = await page.locator('.percentage-label').allTextContents();
    expect(percentageLabels).toHaveLength(2);
    for (const label of percentageLabels) {
      expect(label).toMatch(/^\d+\.\d%$/);
      expect(label).toBe('50.0%');
    }
  });
});
