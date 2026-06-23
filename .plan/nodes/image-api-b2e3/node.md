---
id: image-api-b2e3
parent: root-0001
slug: image-processor
status: complete
atomic: true
depends_on: [project-setup-d4e5]
created: 2026-06-23
updated: 2026-06-23
---

# Client-Side Image Processor

## Purpose

Pure TypeScript module that takes a browser `File` object, draws it to an off-screen canvas, extracts pixel data, and returns a raw frequency map. Runs entirely in the browser — no server involved.

## Scope

**In scope:**
- Accept a `File` from an `<input type="file">`
- Validate MIME type against allowed list (JPEG, PNG, WebP, AVIF, GIF, BMP); reject others with a typed error
- Validate file size ≤ 16 MB; reject oversized files with a typed error
- Draw to an off-screen `<canvas>` at the image's native dimensions using `drawImage()`
- Call `ctx.getImageData()` to get `Uint8ClampedArray` (RGBA, 4 bytes per pixel)
- Iterate pixels, skip pixels where alpha = 0, build frequency map: `Record<string, number>` keyed by `"r,g,b"`
- Return `{ map: Record<string, number>, totalPixels: number }` where `totalPixels` is the count of non-fully-transparent pixels (alpha > 0)

**Out of scope:**
- Any server communication
- Caching results between page loads

## Decisions

- **Resize method**: No resize — canvas matches native image dimensions. Deferred; trivial to add later.
- **Key format**: `"r,g,b"` string — consistent with algorithm module expectations.
- **Alpha threshold**: 0 — only fully transparent pixels (alpha = 0) are excluded from map and `totalPixels`; semi-transparent pixels are processed normally.
- **Accepted formats**: JPEG, PNG, WebP, AVIF, GIF, BMP — validated by `file.type`.
- **File size limit**: 16 MB (`file.size > 16 * 1024 * 1024` → reject).
- **totalPixels**: count of pixels where alpha > 0 (not `canvas.width × canvas.height`).
- **Module location**: `src/lib/image-processor.ts`

## Children

None — atomic.

## Open threads

None.
