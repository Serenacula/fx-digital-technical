---
updated: 2026-06-23
---

# Modules

## `scaffold`

**Responsibility:** Astro project initialisation and configuration. Creates the repo structure, sets TypeScript to strict mode, configures Astro for `output: 'static'`, and sets a base path for GitHub Pages hosting. No runtime logic lives here — it's purely scaffolding.
**Implements spec nodes:** `project-setup-d4e5`
**Depends on modules:** none
**Path in repo:** `astro.config.mjs`, `tsconfig.json`, `package.json`, `src/` (empty directories)

### Notes

Astro scaffold via `npm create astro`. TypeScript strict mode set in `tsconfig.json`. The `base` option in `astro.config.mjs` handles GitHub Pages sub-path hosting — set to `'/fx-digital-technical/'` (repo name is known).

---

## `colour-algorithm`

**Responsibility:** Pure TypeScript library for all quantization, aggregation, and formatting logic. No I/O, no DOM access, no Astro dependency. Accepts a raw frequency map from the image processor and produces typed, sorted output for the UI.
**Implements spec nodes:** `algorithm-a1f2`
**Depends on modules:** `scaffold` (for project structure)
**Path in repo:** `src/lib/colour-algorithm.ts`

### Notes

Exports: `quantize`, `reaggregate`, `toHex`, `sortedColours`, plus types `RawMap`, `AggregatedMap`, `ColourEntry`. Quantization formula: `Math.round(value / bucketSize) * bucketSize`, clamped 0–255. This module is the most testable part of the system — pure functions, deterministic, no async.

---

## `image-processor`

**Responsibility:** Browser-side module that accepts a `File` object from a file input, validates its type (JPEG, PNG, WebP, AVIF, BMP) and size (≤ 16 MB), draws it to an off-screen canvas at native dimensions, extracts pixel data via `getImageData()`, and returns a raw frequency map keyed by `"r,g,b"` strings plus a total pixel count. Pixels with alpha = 0 are counted under the sentinel key `"transparent"`; all others are keyed by `"r,g,b"`. `totalPixels` = `canvas.width × canvas.height`.
**Implements spec nodes:** `image-api-b2e3`
**Depends on modules:** `scaffold` (for project structure)
**Path in repo:** `src/lib/image-processor.ts`

### Notes

Returns `{ map: RawMap, totalPixels: number }` where `totalPixels` is `canvas.width × canvas.height`. Throws a typed error on invalid type or oversized file before touching the canvas. The canvas is created off-screen (`document.createElement('canvas')`), drawn to, and discarded after use. This module is async (image loading via `URL.createObjectURL` + `onload`). No resize — native dimensions as per spec.

---

## `ui`

**Responsibility:** The single user-facing Astro page. Two-column layout: left column holds the image preview and quantization slider; right column holds the scrollable bar chart. Client-side JS (in a `<script>` tag) owns all state — raw map, total pixel count, current bucket size — and re-renders the chart on every slider move. Handles loading, empty, and error states.
**Implements spec nodes:** `ui-c3d4`, `root-0001` (layout and colour scheme decisions)
**Depends on modules:** `scaffold`, `colour-algorithm`, `image-processor`
**Path in repo:** `src/pages/index.astro`

### Notes

The `<script>` tag imports `colour-algorithm` and `image-processor` as ES modules. File input `change` event triggers `image-processor`, stores result in module-level variables, then calls the re-aggregation + chart render pipeline. Slider `input` event skips re-reading the image and goes straight to re-aggregation + render. Chart rows are `<div>` elements built by JS; the right column's overflow is `auto` for scrollability. Colour scheme: `#000` on `#fff`.
