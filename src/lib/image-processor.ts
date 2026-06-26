import type { RawMap } from './colour-algorithm.ts'

const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    'image/bmp',
])

const MAX_FILE_SIZE = 16 * 1024 * 1024

export const MIME_TYPE_LABELS: Record<string, string> = {
    'image/jpeg': 'JPEG',
    'image/png': 'PNG',
    'image/webp': 'WebP',
    'image/avif': 'AVIF',
    'image/bmp': 'BMP',
}

export class ValidationError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'ValidationError'
    }
}

export class ImageProcessor {
    rawMap: RawMap | null = null
    totalPixels: number = 0

    async loadFile(file: File): Promise<void> {
        if (!ALLOWED_MIME_TYPES.has(file.type)) {
            throw new ValidationError(
                'Unsupported file type. Please upload a JPEG, PNG, WebP, AVIF, or BMP.'
            )
        }

        if (file.size > MAX_FILE_SIZE) {
            throw new ValidationError('File is too large. Maximum size is 16 MB.')
        }

        const objectUrl = URL.createObjectURL(file)

        try {
            const image = await this.loadImage(objectUrl)
            const canvas = document.createElement('canvas')
            canvas.width = image.naturalWidth
            canvas.height = image.naturalHeight

            const context = canvas.getContext('2d')
            if (!context) {
                throw new Error('Could not read image.')
            }

            context.drawImage(image, 0, 0)

            const imageData = context.getImageData(0, 0, canvas.width, canvas.height)
            const pixels = imageData.data
            this.totalPixels = canvas.width * canvas.height

            if (this.totalPixels === 0) {
                throw new ValidationError('Image has no pixels.')
            }

            const map: RawMap = {}

            for (let index = 0; index < pixels.length; index += 4) {
                const red = pixels[index]!
                const green = pixels[index + 1]!
                const blue = pixels[index + 2]!
                const alpha = pixels[index + 3]!

                if (alpha === 0) {
                    map['transparent'] = (map['transparent'] ?? 0) + 1
                } else {
                    const key = `${red},${green},${blue}`
                    map[key] = (map[key] ?? 0) + 1
                }
            }

            this.rawMap = map
        } finally {
            URL.revokeObjectURL(objectUrl)
        }
    }

    private loadImage(src: string): Promise<HTMLImageElement> {
        return new Promise((resolve, reject) => {
            const image = new Image()
            image.onload = () => resolve(image)
            image.onerror = () => reject(new Error('Could not read image.'))
            image.src = src
        })
    }
}
