# Decision Log

## 2026-06-23 — Tech stack

**Node:** `root-0001`
**Question:** `0001-stack`
**Decision:** TypeScript + Astro
**Rationale:** User's stated preference; familiar stack for interview demo.
**Affects:** All nodes.

---

## 2026-06-23 — Image processing approach

**Node:** `root-0001`
**Question:** `0002-image-lib`
**Decision:** Browser Canvas API — `drawImage` to an off-screen canvas, then `getImageData()`. No server, no dependencies.
**Rationale:** Architecture is fully static (GitHub Pages); server-side libraries (`sharp`, etc.) are not available. Canvas API handles all common image formats natively.
**Affects:** `image-api-b2e3`
**Supersedes original entry:** Initial decision was `sharp` (server-side), corrected when static hosting requirement was clarified.

---

## 2026-06-23 — Resize before analysis

**Node:** `root-0001`
**Question:** `0003-resize`
**Decision:** No resize — canvas is drawn at native image dimensions.
**Rationale:** Avoid premature optimisation before baseline performance is known. Trivial to add later.
**Affects:** `image-api-b2e3`
**Supersedes original entry:** Initial decision was 300×300 resize, reverted after user review.

---

## 2026-06-23 — Intermediate representation

**Node:** `root-0001`
**Question:** `0004-intermediate`
**Decision:** Client builds raw frequency map (bucket = 1) on upload; re-aggregates on slider change. All client-side.
**Rationale:** Separates expensive pixel-read (once) from cheap re-aggregation (real-time, client-side).
**Affects:** `image-api-b2e3`, `algorithm-a1f2`, `ui-c3d4`

---

## 2026-06-23 — Alpha handling

**Node:** `root-0001`
**Question:** `0005-colorspace`
**Decision:** RGB only; skip only fully transparent pixels (alpha = 0). Semi-transparent pixels are processed normally.
**Rationale:** Preserves semi-transparent pixels in results. A more nuanced threshold may be added as a future feature.
**Affects:** `image-api-b2e3`

---

## 2026-06-23 — Colour scheme

**Node:** `root-0001`
**Question:** `0006-colourscheme`
**Decision:** Black on white.
**Rationale:** User's stated preference.
**Affects:** `ui-c3d4`

---

## 2026-06-23 — Page layout

**Node:** `root-0001`
**Question:** `0007-layout`
**Decision:** Left column: image + controls. Right column: scrollable bar chart.
**Rationale:** User's stated design.
**Affects:** `ui-c3d4`

---

## 2026-06-23 — Bar chart row format

**Node:** `root-0001`
**Question:** `0008-chart`
**Decision:** Each row: hex code label + colour bar (width = percentage of total pixels) + percentage text label. Sorted most → least.
**Rationale:** User's stated design; percentage text added so the value is readable without estimating bar width.
**Affects:** `ui-c3d4`

---

## 2026-06-23 — File validation

**Node:** `image-api-b2e3`
**Decision:** Accepted formats: JPEG, PNG, WebP, AVIF, GIF, BMP. Validated by MIME type (`file.type`). Maximum file size: 16 MB. Validation runs before any canvas work.
**Rationale:** JPG and PNG required; WebP, AVIF, GIF, BMP are free wins via the Canvas API. SVG excluded (no fixed pixel grid). HEIC excluded (not cross-browser). 16 MB limit set conservatively; will be adjusted after performance testing.
**Affects:** `image-api-b2e3`, `ui-c3d4`

---

## 2026-06-23 — totalPixels denominator

**Node:** `algorithm-a1f2`
**Decision:** `totalPixels` passed to `sortedColours` is the count of non-fully-transparent pixels (alpha > 0), not the canvas pixel count (`width × height`).
**Rationale:** Percentages represent "of the visible image" rather than "of the full canvas including transparent areas." Percentages sum to 100% for any image.
**Affects:** `image-api-b2e3`, `algorithm-a1f2`

---

## 2026-06-23 — UI states

**Node:** `ui-c3d4`
**Decision:**
- **Empty state**: Chart column shows "Upload an image to see its dominant colours."
- **Loading state**: File input and slider disabled; chart column shows "Analysing…"; previous results cleared.
- **Error state**: Chart column shows a specific error message (invalid type, oversized, or processing failure); file input re-enabled; slider remains disabled.
- **Results state**: Chart populates; file input and slider enabled.
**Rationale:** Impl-level decisions to close spec gaps.
**Affects:** `ui-c3d4`

---

## 2026-06-23 — Slider label and debounce

**Node:** `ui-c3d4`
**Decision:** Slider is labelled "Colour grouping:" followed by the current numeric value. Slider `input` event is debounced at 50 ms before triggering re-aggregation.
**Rationale:** "Colour grouping" is descriptive without requiring the user to understand bucket sizes. 50 ms debounce prevents full chart DOM rebuild on every pixel of slider movement without making the UI feel sluggish.
**Affects:** `ui-c3d4`
