export class Controls {
    private slider: HTMLInputElement
    private sliderValue: HTMLSpanElement
    private debounceTimer: ReturnType<typeof setTimeout> | undefined
    onBucketSizeChange: (() => void) | null = null

    constructor(slider: HTMLInputElement, sliderValue: HTMLSpanElement) {
        this.slider = slider
        this.sliderValue = sliderValue

        this.slider.disabled = true
        this.slider.value = '16'
        this.sliderValue.textContent = '16'
        this.syncSliderFill()

        this.slider.addEventListener('input', () => {
            this.sliderValue.textContent = this.slider.value
            this.syncSliderFill()
            clearTimeout(this.debounceTimer)
            this.debounceTimer = setTimeout(() => {
                this.onBucketSizeChange?.()
            }, 50)
        })
    }

    get bucketSize(): number {
        return parseInt(this.slider.value, 10)
    }

    enable(): void {
        this.slider.disabled = false
    }

    disable(): void {
        clearTimeout(this.debounceTimer)
        this.slider.disabled = true
    }

    private syncSliderFill(): void {
        const pct = ((+this.slider.value - +this.slider.min) / (+this.slider.max - +this.slider.min)) * 100
        this.slider.style.setProperty('--fill-pct', `${pct}%`)
    }
}
