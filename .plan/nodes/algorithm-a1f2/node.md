---
id: algorithm-a1f2
parent: root-0001
slug: algorithm
status: complete
atomic: true
depends_on: []
created: 2026-06-23
updated: 2026-06-23
---

# Core Colour Algorithm

## Purpose

Pure TypeScript module containing the quantization and re-aggregation logic. Runs entirely client-side after initial load. No I/O, no framework dependency — easily unit-testable.

## Scope

**In scope:**
- `quantize(value: number, bucketSize: number): number` — rounds a single channel value to nearest bucket
- `reaggregate(map: RawMap, bucketSize: number): AggregatedMap` — takes raw `Record<"r,g,b" | "transparent", count>` map and produces a new map with RGB keys rounded to `bucketSize`; the `"transparent"` sentinel key is passed through unchanged (no quantization applies)
- `toHex(r: number, g: number, b: number): string` — formats `#RRGGBB`
- `sortedColours(map: AggregatedMap, totalPixels: number): ColourEntry[]` — returns array of `{ hex, count, percentage, isTransparent }` sorted descending by count
- Type definitions for `RawMap`, `AggregatedMap`, `ColourEntry` (including `isTransparent: boolean`)

**Out of scope:**
- Image I/O
- DOM manipulation

## Decisions

- **Quantization formula**: `Math.round(value / bucketSize) * bucketSize`, clamped to 0–255.
- **Transparent sentinel**: The string `"transparent"` is the reserved key in `RawMap`/`AggregatedMap` for fully transparent pixels. `reaggregate` copies it through without quantizing.
- **ColourEntry**: `{ hex: string, count: number, percentage: number, isTransparent: boolean }`. For the transparent entry, `hex` is `"transparent"`.
- **Module location**: `src/lib/colour-algorithm.ts`

## Children

None — atomic.

## Open threads

None.

## Notes

This is the most testable part of the system. Tests should cover: bucket boundaries, channel clamping, known pixel maps producing expected sorted output, percentage accuracy.
