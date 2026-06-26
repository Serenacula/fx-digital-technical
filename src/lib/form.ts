export type Form = ReturnType<typeof getForm>

function requireElement<ElementType extends Element>(
    document: Document,
    id: string,
    method: 'getElementById' | 'querySelector' = 'getElementById'
): ElementType {
    const element = method === 'getElementById'
        ? document.getElementById(id)
        : document.querySelector(id)
    if (!element) {
        throw new Error(`Required element not found: "${id}"`)
    }
    return element as ElementType
}

export const getForm = (document: Document) => ({
    fileInput: requireElement<HTMLInputElement>(document, 'file-input'),
    previewArea: requireElement<HTMLDivElement>(document, 'preview-area'),
    previewImage: requireElement<HTMLImageElement>(document, 'preview-image'),
    detailName: requireElement<HTMLDivElement>(document, 'detail-name'),
    detailMeta: requireElement<HTMLDivElement>(document, 'detail-meta'),
    slider: requireElement<HTMLInputElement>(document, 'quantize-slider'),
    sliderValue: requireElement<HTMLSpanElement>(document, 'slider-value'),
    emptyPanel: requireElement<HTMLDivElement>(document, 'empty-state'),
    loadingPanel: requireElement<HTMLDivElement>(document, 'loading-state'),
    errorPanel: requireElement<HTMLDivElement>(document, 'error-state'),
    chart: requireElement<HTMLDivElement>(document, 'chart'),
    dropOverlay: requireElement<HTMLDivElement>(document, 'drop-overlay'),
    dropHint: requireElement<HTMLElement>(document, '#drop-overlay .drop-hint', 'querySelector'),
})
