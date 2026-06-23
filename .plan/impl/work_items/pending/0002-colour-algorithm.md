---
id: 0002-colour-algorithm
status: pending
module: colour-algorithm
implements: [algorithm-a1f2]
depends_on: [0001-astro-scaffold]
created: 2026-06-23
---

# Colour Algorithm Library

## What this builds

`src/lib/colour-algorithm.ts` — a pure TypeScript module with no I/O and no browser dependency. Exports:

- Type `RawMap` — `Record<string, number>` keyed by `"r,g,b"` strings or the sentinel `"transparent"`
- Type `AggregatedMap` — same shape, but RGB keys are quantized; `"transparent"` key passes through unchanged
- Type `ColourEntry` — `{ hex: string, count: number, percentage: number, isTransparent: boolean }`; for the transparent entry `hex` is `"transparent"`
- `quantize(value, bucketSize)` — rounds a single channel to the nearest multiple of `bucketSize`, clamped 0–255
- `reaggregate(map, bucketSize)` — applies `quantize` to every RGB key in a `RawMap`, merging counts for colliding keys; copies `"transparent"` through unchanged; returns `AggregatedMap`
- `toHex(r, g, b)` — formats `#RRGGBB`
- `sortedColours(map, totalPixels)` — returns `ColourEntry[]` sorted descending by count, with `percentage` computed as `count / totalPixels * 100`; sets `isTransparent: true` for the `"transparent"` entry

## Test strategy sketch

Unit tests covering: quantize boundary cases (bucketSize 1, exact multiples, midpoints, channel clamping at 0 and 255); reaggregate merging colliding RGB keys correctly and passing `"transparent"` through unchanged; toHex formatting; sortedColours producing correctly ordered entries with accurate percentages; transparent entry has `isTransparent: true` and correct percentage.

## Notes

All functions are pure and synchronous — straightforward to unit test without any DOM or Astro context. The formula for quantize is `Math.round(value / bucketSize) * bucketSize` with a subsequent clamp: `Math.min(255, Math.max(0, result))`.
