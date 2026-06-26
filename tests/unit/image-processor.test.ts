import { describe, it, expect } from 'vitest'
import { ImageProcessor, ValidationError } from '../../src/lib/image-processor.ts'

describe('ImageProcessor.handleFile validation', () => {
    it('rejects GIF MIME type', async () => {
        const processor = new ImageProcessor()
        const file = new File([], 'anim.gif', { type: 'image/gif' })
        await expect(processor.handleFile(file)).rejects.toThrow(ValidationError)
        await expect(processor.handleFile(file)).rejects.toThrow(
            'Unsupported file type. Please upload a JPEG, PNG, WebP, AVIF, or BMP.'
        )
    })

    it('rejects SVG MIME type', async () => {
        const processor = new ImageProcessor()
        const file = new File([], 'icon.svg', { type: 'image/svg+xml' })
        await expect(processor.handleFile(file)).rejects.toThrow(ValidationError)
        await expect(processor.handleFile(file)).rejects.toThrow(
            'Unsupported file type. Please upload a JPEG, PNG, WebP, AVIF, or BMP.'
        )
    })

    it('rejects empty MIME type', async () => {
        const processor = new ImageProcessor()
        const file = new File([], 'unknown', { type: '' })
        await expect(processor.handleFile(file)).rejects.toThrow(ValidationError)
        await expect(processor.handleFile(file)).rejects.toThrow(
            'Unsupported file type. Please upload a JPEG, PNG, WebP, AVIF, or BMP.'
        )
    })

    it('rejects oversized file', async () => {
        const processor = new ImageProcessor()
        const file = new File([new ArrayBuffer(17 * 1024 * 1024)], 'big.png', { type: 'image/png' })
        await expect(processor.handleFile(file)).rejects.toThrow(ValidationError)
        await expect(processor.handleFile(file)).rejects.toThrow('File is too large. Maximum size is 16 MB.')
    })

    it('does not reject file at exactly 16 MB for size', async () => {
        const processor = new ImageProcessor()
        const file = new File([new ArrayBuffer(16 * 1024 * 1024)], 'limit.png', { type: 'image/png' })
        await expect(processor.handleFile(file)).rejects.not.toBeInstanceOf(ValidationError)
    })

    it('has null rawMap and zero totalPixels after a validation failure', async () => {
        const processor = new ImageProcessor()
        const file = new File([], 'bad.gif', { type: 'image/gif' })
        await processor.handleFile(file).catch(() => {})
        expect(processor.rawMap).toBeNull()
        expect(processor.totalPixels).toBe(0)
    })
})
