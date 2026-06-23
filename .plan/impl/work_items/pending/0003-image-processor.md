---
id: 0003-image-processor
status: pending
module: image-processor
implements: [image-api-b2e3]
depends_on: [0001-astro-scaffold]
created: 2026-06-23
---

# Client-Side Image Processor

## What this builds

`src/lib/image-processor.ts` — a browser-side TypeScript module that accepts a `File` object from a file input and returns `{ map: RawMap, totalPixels: number }`. It:

1. Creates an `<img>` element and sets its `src` to `URL.createObjectURL(file)`
2. Waits for `onload`, then draws the image to an off-screen `<canvas>` at the image's native dimensions
3. Calls `ctx.getImageData(0, 0, width, height)` to get the `Uint8ClampedArray` (RGBA, 4 bytes per pixel)
4. Iterates every pixel: skips pixels where `alpha === 0`; for the rest, builds a `RawMap` keyed by `"r,g,b"` and increments counts
5. Returns `{ map, totalPixels }` where `totalPixels` is the count of non-fully-transparent pixels processed
6. Revokes the object URL after use

The returned `map` uses bucket size 1 (raw pixel values, no quantization) — the algorithm module handles quantization separately.

## Test strategy sketch

Manual smoke test: upload a synthetic test image (1×2 pixels, one red one blue, both opaque) and assert the returned map has exactly two entries with count 1 each and totalPixels 2. Test a fully transparent image (alpha = 0) produces `{ map: {}, totalPixels: 0 }`. Test a semi-transparent pixel (alpha > 0) is included in the map.

## Notes

The module is async (`processImage(file: File): Promise<{ map: RawMap, totalPixels: number }>`). Object URL must be revoked after the image loads to avoid memory leaks. The canvas element is created with `document.createElement('canvas')` and never attached to the DOM. Import `RawMap` from `colour-algorithm.ts` for type consistency.
