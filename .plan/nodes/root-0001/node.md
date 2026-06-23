---
id: root-0001
parent: null
slug: root
status: complete
atomic: false
depends_on: []
created: 2026-06-23
updated: 2026-06-23
---

# Image Dominant Colour Finder (Root)

## Purpose

Top-level node for the Image Dominant Colour Finder. Owns project-wide constraints, tech stack, and decomposition into major areas.

## Scope

**In scope:**
- Single-page Astro web app
- Image upload and pixel analysis
- Quantization slider with real-time re-aggregation (client-side)
- Scrollable ranked bar chart of dominant colours

**Out of scope:**
- User accounts or persistent storage
- Batch image processing
- Colour palette export
- Mobile-specific layout (desktop-first is fine)

## Decisions

- **Language/stack** (from `0001-stack`): TypeScript + Astro — user's stated preference; familiar stack for interview demo.
- **Image processing approach** (from `0002-image-lib`): Browser Canvas API — `drawImage` to an off-screen 300×300 canvas, then `getImageData()` for the pixel array. No server, no dependencies.
- **Resize before analysis** (from `0003-resize`): No resize — canvas is drawn at the image's native dimensions. Can be added later if performance on large images becomes an issue (one-line change).
- **Intermediate representation** (from `0004-intermediate`): After pixel extraction, build raw frequency map in JS and store in client state. Re-aggregate on slider change.
- **Colour space** (from `0005-colorspace`): RGB only; ignore alpha channel. Fully transparent pixels (alpha = 0) are skipped; all others are processed regardless of alpha value.
- **Colour scheme** (from `0006-colourscheme`): Black on white.
- **UI layout** (from `0007-layout`): Image top-left; controls (slider) below image; bar chart on right, vertically scrollable.
- **Bar chart format** (from `0008-chart`): Each row = hex code label + colour bar sized by percentage of total pixels. Sorted most → least dominant.

## Children

- `project-setup-d4e5` — Astro project scaffold, dependencies, dev tooling
- `image-api-b2e3` — Server API endpoint: upload → sharp → raw frequency map JSON
- `algorithm-a1f2` — Core quantization + counting logic (pure TS, used client-side)
- `ui-c3d4` — Full UI: layout, upload, image preview, slider, bar chart

## Open threads

None.

## Considered but rejected

- **k-means / median-cut clustering**: More perceptually meaningful but out of scope for this challenge; pure frequency count is what the spec asks for.
- **jimp**: Pure JS, too slow for large images; also server-side.
- **sharp**: Server-side only; project is fully static.
- **canvas (npm)**: Server-side only.

## Notes

The key architectural insight: pixel-read is expensive (done once on upload); re-aggregation is cheap (done client-side on every slider move). These two concerns are cleanly separated.
