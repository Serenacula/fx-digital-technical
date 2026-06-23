import { describe, it, expect } from 'vitest';
import { processImage, ValidationError } from '../../src/lib/image-processor.ts';

describe('processImage validation', () => {
  it('rejects GIF MIME type', async () => {
    const file = new File([], 'anim.gif', { type: 'image/gif' });
    await expect(processImage(file)).rejects.toThrow(ValidationError);
    await expect(processImage(file)).rejects.toThrow(
      'Unsupported file type. Please upload a JPEG, PNG, WebP, AVIF, or BMP.'
    );
  });

  it('rejects SVG MIME type', async () => {
    const file = new File([], 'icon.svg', { type: 'image/svg+xml' });
    await expect(processImage(file)).rejects.toThrow(ValidationError);
    await expect(processImage(file)).rejects.toThrow(
      'Unsupported file type. Please upload a JPEG, PNG, WebP, AVIF, or BMP.'
    );
  });

  it('rejects empty MIME type', async () => {
    const file = new File([], 'unknown', { type: '' });
    await expect(processImage(file)).rejects.toThrow(ValidationError);
    await expect(processImage(file)).rejects.toThrow(
      'Unsupported file type. Please upload a JPEG, PNG, WebP, AVIF, or BMP.'
    );
  });

  it('rejects oversized file', async () => {
    const file = new File([new ArrayBuffer(17 * 1024 * 1024)], 'big.png', { type: 'image/png' });
    await expect(processImage(file)).rejects.toThrow(ValidationError);
    await expect(processImage(file)).rejects.toThrow('File is too large. Maximum size is 16 MB.');
  });

  it('does not reject file at exactly 16 MB for size', async () => {
    const file = new File([new ArrayBuffer(16 * 1024 * 1024)], 'limit.png', { type: 'image/png' });
    try {
      await processImage(file);
    } catch (error) {
      if (error instanceof ValidationError) {
        expect(error.message).not.toBe('File is too large. Maximum size is 16 MB.');
      }
    }
  });
});
