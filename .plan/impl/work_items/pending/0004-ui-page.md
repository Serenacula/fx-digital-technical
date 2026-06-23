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
- `<input type="file" accept=".jpg,.jpeg,.png,.webp,.avif,.gif,.bmp,image/jpeg,image/png,image/webp,image/avif,image/gif,image/bmp">` for upload
- "Colour grouping:" label followed by the current numeric value
- Quantization slider: `<input type="range" min="1" max="64" step="1" value="10">`

**Right column (vertically scrollable):**
- Bar chart container: one `<div>` per colour entry, each containing:
  - A hex code label (e.g. `#ff0000`) in monospace
  - A bar `<div>` with `background-color` set to the hex code and `width` set to `percentage%`
  - A percentage text label (e.g. `12.4%`)
- **Empty state**: "Upload an image to see its dominant colours"
- **Loading state**: "Analysing…"; file input + slider disabled
- **Error state**: specific message ("Unsupported file type. Please upload a JPEG, PNG, WebP, AVIF, GIF, or BMP." / "File is too large. Maximum size is 16 MB." / "Could not read image."); file input re-enabled; slider remains disabled

**Client-side JS state (module-level variables in `<script>`):**
- `rawMap: RawMap | null` — stored after upload, reused on slider changes
- `totalPixels: number` — stored alongside rawMap

**Event wiring:**
- File input `change` → validate + call `processImage(file)` → on success: store result, show preview, call render pipeline; on `ValidationError`: show specific error; on other error: show generic error
- Slider `input` → debounced at 50 ms → call render pipeline (re-aggregation only, no image re-read)
- Render pipeline: `reaggregate(rawMap, bucketSize)` → `sortedColours(...)` → rebuild chart DOM

## Test strategy sketch

Manual end-to-end smoke test: upload a real image, confirm preview appears, confirm chart populates with bars coloured correctly, confirm slider changes cause chart to update without re-reading the image. Verify loading/empty/error states render correctly.

## Notes

CSS: two-column layout via CSS Grid or Flexbox; right column `overflow-y: auto`; colour scheme `#000` on `#fff`. The bar widths are percentages of total pixels for that quantization level — recalculate on every render. The hex label should be monospace. The chart should have a reasonable max bar width (e.g. 100% of available container width = 100% pixel coverage). At bucketSize=1 on a photographic image, the chart may have thousands of rows — scrollability is essential.
