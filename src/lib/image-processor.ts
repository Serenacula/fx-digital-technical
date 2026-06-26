export type RawMap = Record<string, number>

export const MIME_TYPE_LABELS: Record<string, string> = {
    'image/jpeg': 'JPEG',
    'image/png': 'PNG',
    'image/webp': 'WebP',
    'image/avif': 'AVIF',
    'image/bmp': 'BMP',
}

const ALLOWED_MIME_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/avif',
    'image/bmp',
])

const MAX_FILE_SIZE = 16 * 1024 * 1024

export class ValidationError extends Error {
    constructor(message: string) {
        super(message)
        this.name = 'ValidationError'
    }
}

export class ImageProcessor {
    private _rawMap: RawMap | null = null
    private _totalPixels: number = 0
    private _previewUrl: string | null = null

    get rawMap(): RawMap | null { return this._rawMap }
    get totalPixels(): number { return this._totalPixels }
    get previewUrl(): string | null { return this._previewUrl }

    async handleFile(file: File): Promise<void> {
        this._rawMap = null
        this._totalPixels = 0
        this._previewUrl = null
        this.validate(file)

        const [previewUrl] = await Promise.all([
            this.readAsDataUrl(file),
            this.extractPixels(file),
        ])

        this._previewUrl = previewUrl
    }

    private validate(file: File): void {
        if (!ALLOWED_MIME_TYPES.has(file.type)) {
            throw new ValidationError(
                'Unsupported file type. Please upload a JPEG, PNG, WebP, AVIF, or BMP.'
            )
        }
        if (file.size > MAX_FILE_SIZE) {
            throw new ValidationError('File is too large. Maximum size is 16 MB.')
        }
    }

    private readAsDataUrl(file: File): Promise<string> {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.onload = () => resolve(reader.result as string)
            reader.onerror = () => reject(new Error('Could not read image.'))
            reader.onabort = () => reject(new Error('Could not read image.'))
            reader.readAsDataURL(file)
        })
    }

    private async extractPixels(file: File): Promise<void> {
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
            this._totalPixels = canvas.width * canvas.height

            if (this._totalPixels === 0) {
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
            this._rawMap = map
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
