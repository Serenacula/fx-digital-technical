import { MIME_TYPE_LABELS } from './image-processor.ts'

export class PreviewPanel {
    private image: HTMLImageElement
    private name: HTMLElement
    private meta: HTMLElement

    constructor(image: HTMLImageElement, name: HTMLElement, meta: HTMLElement) {
        this.image = image
        this.name = name
        this.meta = meta
    }

    show(file: File, previewUrl: string): void {
        this.image.onload = null
        this.name.textContent = file.name
        this.image.onload = () => {
            // naturalWidth/naturalHeight are only available after image decode completes
            this.meta.textContent = `${MIME_TYPE_LABELS[file.type] ?? file.type} · ${this.image.naturalWidth} × ${this.image.naturalHeight} px`
        }
        this.image.src = ""
        this.image.src = previewUrl
        this.image.classList.add("visible")
    }

    hide(): void {
        this.image.onload = null
        this.image.src = ""
        this.image.classList.remove("visible")
        this.name.textContent = ""
        this.meta.textContent = ""
    }
}
