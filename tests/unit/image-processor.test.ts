import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
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

    it('has null rawMap and zero totalPixels after a validation failure', async () => {
        const processor = new ImageProcessor()
        const file = new File([], 'bad.gif', { type: 'image/gif' })
        await processor.handleFile(file).catch(() => {})
        expect(processor.rawMap).toBeNull()
        expect(processor.totalPixels).toBe(0)
    })
})

describe('ImageProcessor.handleFile extraction', () => {
    // Pixel data: 2x1 image — pixel 0: red (255,0,0, alpha=255); pixel 1: transparent (0,0,0, alpha=0)
    const PIXEL_DATA = new Uint8ClampedArray([255, 0, 0, 255, 0, 0, 0, 0])
    const IMAGE_WIDTH = 2
    const IMAGE_HEIGHT = 1
    const STUB_DATA_URL = 'data:image/png;base64,stub'
    const STUB_OBJECT_URL = 'blob:stub'

    let createElementSpy: ReturnType<typeof vi.spyOn>
    let originalImage: typeof Image
    let originalFileReader: typeof FileReader

    beforeEach(() => {
        // Mock URL.createObjectURL / revokeObjectURL
        vi.stubGlobal('URL', {
            ...URL,
            createObjectURL: vi.fn(() => STUB_OBJECT_URL),
            revokeObjectURL: vi.fn(),
        })

        // Mock document.createElement to intercept 'canvas'
        const realCreateElement = document.createElement.bind(document)
        createElementSpy = vi.spyOn(document, 'createElement').mockImplementation((tagName: string) => {
            if (tagName === 'canvas') {
                const mockCanvas = {
                    width: 0,
                    height: 0,
                    getContext: (_contextId: string) => ({
                        drawImage: vi.fn(),
                        getImageData: (_x: number, _y: number, width: number, height: number) => ({
                            data: PIXEL_DATA,
                            width,
                            height,
                        }),
                    }),
                }
                return mockCanvas as unknown as HTMLCanvasElement
            }
            return realCreateElement(tagName)
        })

        // Mock Image — fires onload asynchronously
        originalImage = globalThis.Image
        class MockImage {
            naturalWidth = IMAGE_WIDTH
            naturalHeight = IMAGE_HEIGHT
            onload: (() => void) | null = null
            onerror: (() => void) | null = null
            set src(_value: string) {
                // Fire onload on next microtask to match real async behavior
                Promise.resolve().then(() => {
                    this.onload?.()
                })
            }
        }
        vi.stubGlobal('Image', MockImage)

        // Mock FileReader — fires onload asynchronously
        originalFileReader = globalThis.FileReader
        class MockFileReader {
            result: string | null = null
            onload: ((event: unknown) => void) | null = null
            onerror: (() => void) | null = null
            onabort: (() => void) | null = null
            readAsDataURL(_file: File): void {
                this.result = STUB_DATA_URL
                // Fire onload on next microtask to match real async behavior
                Promise.resolve().then(() => {
                    this.onload?.(null)
                })
            }
        }
        vi.stubGlobal('FileReader', MockFileReader)
    })

    afterEach(() => {
        vi.restoreAllMocks()
        vi.unstubAllGlobals()
        globalThis.Image = originalImage
        globalThis.FileReader = originalFileReader
    })

    it('rawMap contains correct RGB key for the opaque pixel', async () => {
        const processor = new ImageProcessor()
        const file = new File(['stub'], 'test.png', { type: 'image/png' })
        await processor.handleFile(file)
        expect(processor.rawMap).not.toBeNull()
        expect(processor.rawMap!['255,0,0']).toBe(1)
    })

    it('rawMap contains transparent sentinel for alpha-zero pixel', async () => {
        const processor = new ImageProcessor()
        const file = new File(['stub'], 'test.png', { type: 'image/png' })
        await processor.handleFile(file)
        expect(processor.rawMap!['transparent']).toBe(1)
    })

    it('totalPixels equals width × height', async () => {
        const processor = new ImageProcessor()
        const file = new File(['stub'], 'test.png', { type: 'image/png' })
        await processor.handleFile(file)
        expect(processor.totalPixels).toBe(IMAGE_WIDTH * IMAGE_HEIGHT)
    })

    it('previewUrl is non-null after successful extraction', async () => {
        const processor = new ImageProcessor()
        const file = new File(['stub'], 'test.png', { type: 'image/png' })
        await processor.handleFile(file)
        expect(processor.previewUrl).toBe(STUB_DATA_URL)
    })
})
