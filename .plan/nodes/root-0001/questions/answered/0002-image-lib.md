---
id: 0002-image-lib
node: root-0001
status: answered
priority: high
blocks: []
blocked_by: []
created: 2026-06-23
resolved: 2026-06-23
---

# Which image processing approach?

## Context

Needed for pixel extraction. Constrained to client-side only — site is fully static (GitHub Pages hosting, no server).

## Answer

Browser Canvas API — no package. Draw image to an off-screen 300×300 `<canvas>`, call `ctx.getImageData()`, iterate the resulting `Uint8ClampedArray`.

## Rationale

Zero dependencies, built into every browser, fast. The correct tool for in-browser pixel work. All alternatives (jimp, image-js, WASM decoders) are workarounds for non-browser environments.
