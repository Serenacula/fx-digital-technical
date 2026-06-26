export type Form = ReturnType<typeof getForm>

export const getForm = (document: Document) => ({
    fileInput: document.getElementById('file-input') as HTMLInputElement,
    previewArea: document.getElementById('preview-area') as HTMLDivElement,
    previewImage: document.getElementById('preview-image') as HTMLImageElement,
    detailName: document.getElementById('detail-name') as HTMLDivElement,
    detailMeta: document.getElementById('detail-meta') as HTMLDivElement,
    slider: document.getElementById('quantize-slider') as HTMLInputElement,
    sliderValue: document.getElementById('slider-value') as HTMLSpanElement,
    emptyState: document.getElementById('empty-state') as HTMLDivElement,
    loadingState: document.getElementById('loading-state') as HTMLDivElement,
    errorState: document.getElementById('error-state') as HTMLDivElement,
    chart: document.getElementById('chart') as HTMLDivElement,
    dropOverlay: document.getElementById('drop-overlay') as HTMLDivElement,
    dropHint: document.querySelector('#drop-overlay .drop-hint') as HTMLElement,
})
