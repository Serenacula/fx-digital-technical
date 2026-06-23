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

1. Validates `file.type` against the allowed list (`image/jpeg`, `image/png`, `image/webp`, `image/avif`, `image/bmp`); throws a typed `ValidationError` with a human-readable message if invalid
2. Validates `file.size ≤ 16 * 1024 * 1024`; throws a typed `ValidationError` if oversized
3. Creates an `<img>` element and sets its `src` to `URL.createObjectURL(file)`
4. Waits for `onload`, then draws the image to an off-screen `<canvas>` at the image's native dimensions
5. Calls `ctx.getImageData(0, 0, width, height)` to get the `Uint8ClampedArray` (RGBA, 4 bytes per pixel)
6. Iterates every pixel: pixels where `alpha === 0` increment the `"transparent"` sentinel key; all others increment the `"r,g,b"` key for their RGB channels
7. Returns `{ map, totalPixels }` where `totalPixels` is `canvas.width × canvas.height` (all pixels, so percentages including transparent sum to 100%)
8. Revokes the object URL after use

The returned `map` uses bucket size 1 (raw pixel values, no quantization) — the algorithm module handles quantization separately.

## Test strategy sketch

Unit tests: invalid MIME type and oversized file both throw `ValidationError` with correct messages. Manual browser smoke tests: 1×2 opaque image (one red, one blue) → two RGB entries, totalPixels 2; fully transparent image → `{ map: { transparent: N }, totalPixels: N }`; mixed image → transparent entry + RGB entries, all percentages sum to 100%.

## Notes

The module is async (`processImage(file: File): Promise<{ map: RawMap, totalPixels: number }>`). Object URL must be revoked after the image loads to avoid memory leaks. The canvas element is created with `document.createElement('canvas')` and never attached to the DOM. Import `RawMap` from `colour-algorithm.ts` for type consistency.
