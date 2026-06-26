import type { ColourEntry, BlacklistEntry, ExcludedEntry } from './aggregation-engine.ts'
import type { AggregationEngine } from './aggregation-engine.ts'

const EYE_OPEN_SVG = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`
const EYE_CLOSED_SVG = `<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`

export enum ChartDisplay {
    Empty,
    Loading,
    Error,
    Chart,
}

export class BarChart {
    private container: HTMLElement
    private engine: AggregationEngine
    private currentBucketSize: number = NaN
    onToggle: (() => void) | null = null

    // Placeholders shown in the chart area when there is no chart to display
    private emptyPanel: HTMLElement
    private loadingPanel: HTMLElement
    private errorPanel: HTMLElement

    constructor(
        container: HTMLElement,
        emptyPanel: HTMLElement,
        loadingPanel: HTMLElement,
        errorPanel: HTMLElement,
        engine: AggregationEngine,
    ) {
        this.container = container
        this.emptyPanel = emptyPanel
        this.loadingPanel = loadingPanel
        this.errorPanel = errorPanel
        this.engine = engine
    }

    showMessage(display: ChartDisplay, message = ''): void {
        this.emptyPanel.style.display = 'none'
        this.loadingPanel.style.display = 'none'
        this.errorPanel.style.display = 'none'
        this.container.classList.remove('visible')

        switch (display) {
            case ChartDisplay.Empty:
                this.emptyPanel.style.display = ''
                break
            case ChartDisplay.Loading:
                this.loadingPanel.style.display = ''
                break
            case ChartDisplay.Error:
                this.errorPanel.style.display = ''
                this.errorPanel.textContent = message
                break
            case ChartDisplay.Chart:
                this.container.classList.add('visible')
                break
        }
    }

    render(included: ColourEntry[], excluded: ExcludedEntry[], bucketSize: number): void {
        this.currentBucketSize = bucketSize
        this.container.innerHTML = ''
        for (const entry of included) {
            this.container.appendChild(this.buildIncludedRow(entry))
        }
        for (const entry of excluded) {
            this.container.appendChild(this.buildExcludedRow(entry))
        }
        this.showMessage(ChartDisplay.Chart)
    }

    private buildBar(hex: string, isTransparent: boolean, percentage: number): HTMLElement {
        const track = document.createElement('div')
        track.className = 'bar-track'
        const bar = document.createElement('div')
        bar.className = 'bar'
        bar.style.width = `${percentage}%`
        if (isTransparent) {
            bar.style.background = 'repeating-linear-gradient(45deg, #ccc 0px, #ccc 4px, #fff 4px, #fff 8px)'
            bar.style.border = '1px solid black'
        } else {
            bar.style.backgroundColor = hex
        }
        track.appendChild(bar)
        return track
    }

    private buildIncludedRow(entry: ColourEntry): HTMLElement {
        const row = document.createElement('div')
        row.className = 'chart-row'

        const label = document.createElement('div')
        label.className = 'colour-label'
        label.textContent = entry.isTransparent ? 'transparent' : entry.hex
        row.appendChild(label)

        row.appendChild(this.buildBar(entry.hex, entry.isTransparent, entry.percentage))

        const percentLabel = document.createElement('span')
        percentLabel.className = 'percentage-label'
        percentLabel.textContent = `${entry.percentage.toFixed(1)}%`
        row.appendChild(percentLabel)

        const excludeBtn = document.createElement('button')
        excludeBtn.className = 'exclude-btn'
        excludeBtn.innerHTML = EYE_OPEN_SVG
        excludeBtn.title = 'Exclude colour'
        excludeBtn.addEventListener('click', () => {
            if (!Number.isFinite(this.currentBucketSize)) {
                return
            }
            this.engine.ban({
                quantizedKey: entry.quantizedKey,
                bucketSize: this.currentBucketSize,
                hex: entry.hex,
                isTransparent: entry.isTransparent,
            })
            this.onToggle?.()
        })
        row.appendChild(excludeBtn)

        return row
    }

    private buildExcludedRow(entry: ExcludedEntry): HTMLElement {
        const row = document.createElement('div')
        row.className = 'chart-row excluded'

        const label = document.createElement('div')
        label.className = 'colour-label'
        const hexLine = document.createElement('span')
        hexLine.textContent = entry.isTransparent ? 'transparent' : entry.hex
        label.appendChild(hexLine)
        const groupingLine = document.createElement('span')
        groupingLine.className = 'colour-grouping'
        groupingLine.textContent = `quantisation: ${entry.bucketSize}`
        label.appendChild(groupingLine)
        row.appendChild(label)

        row.appendChild(this.buildBar(entry.hex, entry.isTransparent, entry.percentage))

        const percentLabel = document.createElement('span')
        percentLabel.className = 'percentage-label'
        percentLabel.textContent = '—'
        row.appendChild(percentLabel)

        const excludeBtn = document.createElement('button')
        excludeBtn.className = 'exclude-btn'
        excludeBtn.innerHTML = EYE_CLOSED_SVG
        excludeBtn.title = 'Re-include colour'
        excludeBtn.addEventListener('click', () => {
            this.engine.unban(entry)
            this.onToggle?.()
        })
        row.appendChild(excludeBtn)

        return row
    }
}
