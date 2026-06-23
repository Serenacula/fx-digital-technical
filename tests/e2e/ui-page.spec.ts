import { test, expect } from '@playwright/test';
import { join } from 'node:path';
import './window-hooks.d.ts';

const fixturesDir = join(process.cwd(), 'tests', 'fixtures');
const appUrl = 'http://localhost:4321/fx-digital-technical/';

test.describe('UI page — empty state', () => {
  test('empty state on page load', async ({ page }) => {
    await page.goto(appUrl);
    await expect(page.locator('#empty-state')).toBeVisible();
    await expect(page.locator('#empty-state')).toContainText('Upload an image to see its dominant colours');
    await expect(page.locator('#quantize-slider')).toBeDisabled();
    await expect(page.locator('#preview-image')).not.toBeVisible();
    await expect(page.locator('#file-input')).toBeEnabled();
  });
});

test.describe('UI page — loading state', () => {
  test('loading state while processing', async ({ page }) => {
    await page.goto(appUrl);
    await page.evaluate(() => {
      window.__delayProcessing = 500;
    });
    const fileInputPromise = page.locator('#file-input').setInputFiles(join(fixturesDir, '1x1-red.png'));
    await expect(page.locator('#loading-state')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('#loading-state')).toContainText('Analysing…');
    await expect(page.locator('#file-input')).toBeDisabled();
    await expect(page.locator('#quantize-slider')).toBeDisabled();
    await fileInputPromise;
    await page.waitForFunction(() => window.__lastResult !== undefined, { timeout: 5000 });
    await expect(page.locator('#loading-state')).not.toBeVisible();
    await expect(page.locator('#chart')).toBeVisible();
  });
});

test.describe('UI page — results state', () => {
  test('results state after valid upload', async ({ page }) => {
    await page.goto(appUrl);
    await page.locator('#file-input').setInputFiles(join(fixturesDir, '2x1-red-blue.png'));
    await page.waitForFunction(() => window.__lastResult !== undefined, { timeout: 5000 });

    const chart = page.locator('#chart');
    await expect(chart).toBeVisible();

    const rows = chart.locator('.chart-row');
    await expect(rows).toHaveCount(2);

    const labels = await chart.locator('.colour-label').allTextContents();
    expect(labels).toContain('#ff0000');
    expect(labels).toContain('#0000ff');

    const percentages = await chart.locator('.percentage-label').allTextContents();
    expect(percentages).toContain('50.0%');

    await expect(page.locator('#quantize-slider')).toBeEnabled();
    await expect(page.locator('#file-input')).toBeEnabled();
    await expect(page.locator('#preview-image')).toBeVisible();
    const previewSrc = await page.locator('#preview-image').getAttribute('src');
    expect(previewSrc).toBeTruthy();
    expect(previewSrc!.length).toBeGreaterThan(0);
  });

  test('transparent entry renders as checkerboard', async ({ page }) => {
    await page.goto(appUrl);
    await page.locator('#file-input').setInputFiles(join(fixturesDir, '2x1-red-transparent.png'));
    await page.waitForFunction(() => window.__lastResult !== undefined, { timeout: 5000 });

    const rows = page.locator('.chart-row');
    await expect(rows).toHaveCount(2);

    const labels = await page.locator('.colour-label').allTextContents();
    expect(labels).toContain('transparent');

    const transparentRowIndex = labels.indexOf('transparent');
    const transparentBar = rows.nth(transparentRowIndex).locator('.bar');
    const backgroundStyle = await transparentBar.evaluate((element) => {
      const style = window.getComputedStyle(element);
      return style.background || style.backgroundImage;
    });
    expect(backgroundStyle).toContain('repeating-linear-gradient');

    const borderStyle = await transparentBar.evaluate((element) => {
      const style = window.getComputedStyle(element);
      return style.border;
    });
    expect(borderStyle).toContain('1px solid');
  });
});

test.describe('UI page — error states', () => {
  test('error state — unsupported file type', async ({ page }) => {
    await page.goto(appUrl);
    await page.locator('#file-input').setInputFiles({
      name: 'anim.gif',
      mimeType: 'image/gif',
      buffer: Buffer.from([]),
    });
    await expect(page.locator('#error-state')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('#error-state')).toContainText(
      'Unsupported file type. Please upload a JPEG, PNG, WebP, AVIF, or BMP.'
    );
    await expect(page.locator('#file-input')).toBeEnabled();
    await expect(page.locator('#quantize-slider')).toBeDisabled();
    await expect(page.locator('#chart')).not.toBeVisible();
  });

  test('error state — oversized file', async ({ page }) => {
    await page.goto(appUrl);
    await page.locator('#file-input').setInputFiles({
      name: 'big.png',
      mimeType: 'image/png',
      buffer: Buffer.alloc(17 * 1024 * 1024),
    });
    await expect(page.locator('#error-state')).toBeVisible({ timeout: 3000 });
    await expect(page.locator('#error-state')).toContainText('File is too large. Maximum size is 16 MB.');
    await expect(page.locator('#file-input')).toBeEnabled();
    await expect(page.locator('#quantize-slider')).toBeDisabled();
  });
});

test.describe('UI page — slider', () => {
  test('slider updates chart without re-reading the image', async ({ page }) => {
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
    await page.locator('#file-input').setInputFiles(join(fixturesDir, '2x1-red-blue.png'));
    await page.waitForFunction(() => window.__lastResult !== undefined, { timeout: 5000 });

    const initialRendered = await page.evaluate(() => window.__lastRendered);

    await page.locator('#quantize-slider').fill('64');
    await page.locator('#quantize-slider').dispatchEvent('input');
    await page.waitForTimeout(100);

    const urlCount = await page.evaluate(() => window.__createObjectURLCount);
    expect(urlCount).toBe(1);

    const updatedRendered = await page.evaluate(() => window.__lastRendered);
    expect(updatedRendered).not.toEqual(initialRendered);

    const labels = await page.locator('.colour-label').allTextContents();
    expect(labels).toContain('#ff0000');
    expect(labels).toContain('#0000ff');
  });

  test('debounce — rapid slider changes trigger at most one recalculation', async ({ page }) => {
    await page.goto(appUrl);
    await page.locator('#file-input').setInputFiles(join(fixturesDir, '2x1-red-blue.png'));
    await page.waitForFunction(() => window.__lastResult !== undefined, { timeout: 5000 });

    const countBefore = await page.evaluate(() => window.__recalcCount);

    await page.evaluate(() => {
      const slider = document.querySelector('input[type=range]') as HTMLInputElement;
      for (let sliderIndex = 1; sliderIndex <= 10; sliderIndex++) {
        slider.value = String(sliderIndex * 5);
        slider.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
    await page.waitForTimeout(100);

    const countAfter = await page.evaluate(() => window.__recalcCount);
    expect(countAfter - countBefore).toBe(1);
  });

  test('slider label shows current value', async ({ page }) => {
    await page.goto(appUrl);
    await page.locator('#file-input').setInputFiles(join(fixturesDir, '1x1-red.png'));
    await page.waitForFunction(() => window.__lastResult !== undefined, { timeout: 5000 });

    await page.locator('#quantize-slider').fill('32');
    await page.locator('#quantize-slider').dispatchEvent('input');
    await expect(page.locator('#slider-value')).toHaveText('32');
  });

  test('slider at minimum bucketSize 1 — no crash, chart scrollable', async ({ page }) => {
    await page.goto(appUrl);
    await page.locator('#file-input').setInputFiles(join(fixturesDir, '2x1-red-blue.png'));
    await page.waitForFunction(() => window.__lastResult !== undefined, { timeout: 5000 });

    await page.locator('#quantize-slider').fill('1');
    await page.locator('#quantize-slider').dispatchEvent('input');
    await page.waitForTimeout(100);

    const rows = page.locator('.chart-row');
    await expect(rows).toHaveCount(2);

    const overflowStyle = await page.locator('.right-column').evaluate((element) => {
      return window.getComputedStyle(element).overflowY;
    });
    expect(['auto', 'scroll']).toContain(overflowStyle);
  });
});

test.describe('UI page — re-upload and recovery', () => {
  test('re-upload replaces previous result', async ({ page }) => {
    await page.goto(appUrl);
    await page.locator('#file-input').setInputFiles(join(fixturesDir, '1x1-red.png'));
    await page.waitForFunction(() => window.__lastResult !== undefined, { timeout: 5000 });

    await page.evaluate(() => {
      window.__lastResult = undefined;
    });

    await page.locator('#file-input').setInputFiles(join(fixturesDir, '1x1-white.png'));
    await page.waitForFunction(() => window.__lastResult !== undefined, { timeout: 5000 });

    const labels = await page.locator('.colour-label').allTextContents();
    expect(labels).toContain('#ffffff');
    expect(labels).not.toContain('#ff0000');

    const previewSrc = await page.locator('#preview-image').getAttribute('src');
    expect(previewSrc).toBeTruthy();
  });

  test('error state then successful recovery', async ({ page }) => {
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
    await page.waitForFunction(() => window.__lastResult !== undefined, { timeout: 5000 });

    await expect(page.locator('#error-state')).not.toBeVisible();
    const labels = await page.locator('.colour-label').allTextContents();
    expect(labels).toContain('#ffffff');
    const percentages = await page.locator('.percentage-label').allTextContents();
    expect(percentages).toContain('100.0%');
    await expect(page.locator('#quantize-slider')).toBeEnabled();
  });
});
