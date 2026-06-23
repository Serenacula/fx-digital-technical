---
id: ui-c3d4
parent: root-0001
slug: ui
status: complete
atomic: true
depends_on: [algorithm-a1f2, image-api-b2e3, root-0001]
created: 2026-06-23
updated: 2026-06-23
---

# UI

## Purpose

The single Astro page (`src/pages/index.astro`) with client-side interactivity. Handles image upload, preview, slider, and bar chart rendering.

## Scope

**In scope:**
- Two-column layout (left: image + controls; right: scrollable chart)
- File input for image upload (JPEG, PNG, WebP, AVIF, GIF, BMP; 16 MB limit)
- Image preview in the left column after upload
- Quantization slider: range 1–64, step 1, default 10, labelled "Colour grouping:", debounced at 50 ms
- Bar chart: each row = label + colour bar (width = percentage) + percentage text, sorted most → least. Transparent entry uses label "transparent", bar is a CSS checkerboard pattern (grey/white squares) with a black border
- Empty state: "Upload an image to see its dominant colours" in chart column
- Loading state: file input + slider disabled; "Analysing…" in chart column
- Error state: specific message in chart column (invalid type / oversized / processing failure); file input re-enabled

**Out of scope:**
- Drag-and-drop upload
- Mobile layout

## Decisions

- **Interactivity approach**: Plain client-side JS in a `<script>` tag (no framework component needed — the page is a single view with no routing).
- **Chart rendering**: Plain HTML/CSS — a `<div>` per row with `background-color` and `width` set inline. No canvas, no chart library.
- **Colour scheme**: Black on white (`#000` on `#fff`).

## Children

None — atomic.

## Open threads

None.

## Decisions (continued)

- **Slider range**: 1–64, step 1, default 10 (from `0009-slider-range` in `root-0001`).

## Notes

The slider's `input` event triggers re-aggregation and chart re-render entirely in JS. No server round-trip after the initial upload.
