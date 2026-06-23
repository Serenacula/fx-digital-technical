---
id: 0004-ui-page
status: pending
module: ui
implements: [ui-c3d4]
depends_on: [0001-astro-scaffold, 0002-colour-algorithm, 0003-image-processor]
created: 2026-06-23
---

# UI Page

## What this builds

`src/pages/index.astro` — the single page of the application. Astro provides the HTML shell; a `<script>` tag handles all client-side state and rendering. The page structure:

**Left column:**
- `<img>` element for image preview (hidden until a file is loaded)
- `<input type="file" accept="image/*">` for upload
- Quantization slider: `<input type="range" min="1" max="64" step="1" value="10">` with a numeric label showing the current value

**Right column (vertically scrollable):**
- Bar chart container: one `<div>` per colour entry, each containing:
  - A hex code label (e.g. `#ff0000`)
  - A bar `<div>` with `background-color` set to the hex code and `width` set to `percentage%` (relative to the container width)
- Loading state while the image is being processed
- Empty state before any image is uploaded
- Error state if the file is invalid or processing fails

**Client-side JS state (module-level variables in `<script>`):**
- `rawMap: RawMap | null` — stored after upload, reused on slider changes
- `totalPixels: number` — stored alongside rawMap

**Event wiring:**
- File input `change` → call `processImage(file)` → store result → call render pipeline
- Slider `input` → call render pipeline (re-aggregation only, no image re-read)
- Render pipeline: `reaggregate(rawMap, bucketSize)` → `sortedColours(...)` → rebuild chart DOM

## Test strategy sketch

Manual end-to-end smoke test: upload a real image, confirm preview appears, confirm chart populates with bars coloured correctly, confirm slider changes cause chart to update without re-reading the image. Verify loading/empty/error states render correctly.

## Notes

CSS: two-column layout via CSS Grid or Flexbox; right column `overflow-y: auto`; colour scheme `#000` on `#fff`. The bar widths are percentages of total pixels for that quantization level — recalculate on every render. The hex label should be monospace. The chart should have a reasonable max bar width (e.g. 100% of available container width = 100% pixel coverage). At bucketSize=1 on a photographic image, the chart may have thousands of rows — scrollability is essential.
