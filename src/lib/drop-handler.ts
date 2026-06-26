export class DropHandler {
    private dropOverlay: HTMLElement
    private dropHint: HTMLElement
    private busyHintTimer: ReturnType<typeof setTimeout> | undefined
    private defaultHintText: string

    busy: boolean = false
    onFileDrop: ((file: File) => void) | null = null

    constructor(dropOverlay: HTMLElement, dropHint: HTMLElement) {
        this.dropOverlay = dropOverlay
        this.dropHint = dropHint
        this.defaultHintText = dropHint.textContent ?? 'Drop image here'

        window.addEventListener('dragenter', (event) => {
            if (!event.dataTransfer?.types.includes('Files')) {
                return
            }
            event.preventDefault()
            this.dropOverlay.classList.add('visible')
        })

        window.addEventListener('dragleave', (event) => {
            if (!event.dataTransfer?.types.includes('Files')) {
                return
            }
            if (!event.relatedTarget || !(document.documentElement.contains(event.relatedTarget as Node))) {
                this.dropOverlay.classList.remove('visible')
            }
        })

        window.addEventListener('dragover', (event) => {
            if (event.dataTransfer?.types.includes('Files')) {
                event.preventDefault()
            }
        })

        window.addEventListener('drop', (event) => {
            if (!event.dataTransfer?.types.includes('Files')) {
                return
            }
            event.preventDefault()
            this.dropOverlay.classList.remove('visible')
            if (this.busy) {
                clearTimeout(this.busyHintTimer)
                this.dropHint.textContent = 'Processing… please wait'
                this.dropOverlay.classList.add('visible')
                this.busyHintTimer = setTimeout(() => {
                    this.dropOverlay.classList.remove('visible')
                    this.dropHint.textContent = this.defaultHintText
                }, 1500)
                return
            }
            const file = event.dataTransfer?.files[0]
            if (file) {
                this.onFileDrop?.(file)
            }
        })
    }
}
