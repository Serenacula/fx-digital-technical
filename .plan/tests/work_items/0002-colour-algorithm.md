---
work_item: 0002-colour-algorithm
module: colour-algorithm
implements: [algorithm-a1f2]
updated: 2026-06-23
---

# Tests: Colour Algorithm Library

## What this verifies

All exported functions in `src/lib/colour-algorithm.ts` are pure and synchronous — no I/O, no DOM. This is the highest-value testing target in the project. Tests cover: the quantize arithmetic formula and its channel-clamping behaviour; reaggregate's merging of colliding keys and passthrough of the transparent sentinel; toHex's zero-padded hex formatting; and sortedColours' ordering, percentage accuracy, and correct `isTransparent` annotation.

## Test cases

---

### quantize — identity at bucketSize 1

**Type:** unit
**Setup:** none
**Action:** `quantize(0, 1)`, `quantize(128, 1)`, `quantize(255, 1)`
**Expect:** each returns the input unchanged (`0`, `128`, `255`)

---

### quantize — rounds to nearest bucket multiple

**Type:** unit
**Setup:** none
**Action:** `quantize(123, 10)`, `quantize(125, 10)`, `quantize(126, 10)`
**Expect:** `120`, `130` (JS `Math.round(12.5)` = 13 → 130), `130`

---

### quantize — exact multiple passes through

**Type:** unit
**Setup:** none
**Action:** `quantize(120, 10)`, `quantize(64, 32)`
**Expect:** `120`, `64`

---

### quantize — clamps at 0

**Type:** unit
**Setup:** none
**Action:** `quantize(1, 64)` (1/64 = 0.015… → rounds to 0 → 0)
**Expect:** `0`

---

### quantize — clamps at 255 (no overflow)

**Type:** unit
**Setup:** none
**Action:** `quantize(255, 64)` — `Math.round(255/64) * 64` = `Math.round(3.984) * 64` = `4 * 64` = `256`, clamped to `255`
**Expect:** `255`

---

### quantize — large bucketSize collapses the range

**Type:** unit
**Setup:** none
**Action:** `quantize(0, 64)`, `quantize(32, 64)`, `quantize(64, 64)`, `quantize(128, 64)`, `quantize(192, 64)`, `quantize(255, 64)`
**Expect:** `0`, `64`, `64`, `128`, `192`, `255`
_(Note: `Math.round(32/64)` = `Math.round(0.5)` = `1`, so `1 * 64 = 64`.)_

---

### reaggregate — single key, bucketSize 1 (no-op)

**Type:** unit
**Setup:** `map = { "255,0,0": 5 }`
**Action:** `reaggregate(map, 1)`
**Expect:** `{ "255,0,0": 5 }` — key unchanged, count preserved

---

### reaggregate — distinct keys that don't collide after quantization

**Type:** unit
**Setup:** `map = { "10,0,0": 3, "100,0,0": 7 }`, bucketSize 10
**Action:** `reaggregate(map, 10)`
**Expect:** `{ "10,0,0": 3, "100,0,0": 7 }` — both keys already on multiples of 10, no collision

---

### reaggregate — two keys that collide after quantization

**Type:** unit
**Setup:** `map = { "11,0,0": 3, "14,0,0": 7 }`, bucketSize 10
**Action:** `reaggregate(map, 10)`
**Expect:** `{ "10,0,0": 10 }` — both quantize to `10,0,0`, counts sum to 10

---

### reaggregate — transparent sentinel passes through unchanged

**Type:** unit
**Setup:** `map = { "11,0,0": 3, "transparent": 42 }`, bucketSize 10
**Action:** `reaggregate(map, 10)`
**Expect:** `{ "10,0,0": 3, "transparent": 42 }` — `"transparent"` is never quantized, count preserved

---

### reaggregate — map with only transparent

**Type:** unit
**Setup:** `map = { "transparent": 100 }`, any bucketSize
**Action:** `reaggregate(map, 32)`
**Expect:** `{ "transparent": 100 }`

---

### reaggregate — empty map

**Type:** unit
**Setup:** `map = {}`
**Action:** `reaggregate(map, 10)`
**Expect:** `{}`

---

### toHex — primary colours

**Type:** unit
**Setup:** none
**Action:** `toHex(255, 0, 0)`, `toHex(0, 255, 0)`, `toHex(0, 0, 255)`
**Expect:** `"#ff0000"`, `"#00ff00"`, `"#0000ff"`

---

### toHex — zero-pads single-digit hex values

**Type:** unit
**Setup:** none
**Action:** `toHex(0, 1, 15)` (0→00, 1→01, 15→0f)
**Expect:** `"#00010f"`

---

### toHex — black and white

**Type:** unit
**Setup:** none
**Action:** `toHex(0, 0, 0)`, `toHex(255, 255, 255)`
**Expect:** `"#000000"`, `"#ffffff"`

---

### sortedColours — single RGB entry

**Type:** unit
**Setup:** `map = { "255,0,0": 4 }`, `totalPixels = 4`
**Action:** `sortedColours(map, 4)`
**Expect:** `[{ hex: "#ff0000", count: 4, percentage: 100, isTransparent: false }]`

---

### sortedColours — sorted descending by count

**Type:** unit
**Setup:** `map = { "0,0,255": 10, "255,0,0": 30, "0,255,0": 20 }`, `totalPixels = 60`
**Action:** `sortedColours(map, 60)`
**Expect:** result order: red (30), green (20), blue (10); percentages: 50, 33.33…, 16.66…

---

### sortedColours — transparent entry has isTransparent true and correct data

**Type:** unit
**Setup:** `map = { "255,0,0": 3, "transparent": 1 }`, `totalPixels = 4`
**Action:** `sortedColours(map, 4)`
**Expect:**
- red entry: `{ hex: "#ff0000", count: 3, percentage: 75, isTransparent: false }`
- transparent entry: `{ hex: "transparent", count: 1, percentage: 25, isTransparent: true }`
- red comes first (higher count)

---

### sortedColours — percentages sum to 100 across all entries

**Type:** unit
**Setup:** `map = { "255,0,0": 1, "0,0,255": 1, "transparent": 2 }`, `totalPixels = 4`
**Action:** `sortedColours(map, 4)`, sum all `percentage` values
**Expect:** sum equals 100 (or 100.000…01 due to floating point — accept within 0.001)

---

## Edge cases and boundaries

- **bucketSize at max (64)**: `quantize(255, 64)` must not return 256 or throw — tests above cover this.
- **Midpoint rounding**: `quantize(125, 10)` = 130 not 120 (JS `Math.round` convention). Covered explicitly.
- **Empty map to sortedColours**: `sortedColours({}, 100)` → `[]` (no crash, empty array).
- **Map with only transparent to sortedColours**: `sortedColours({ transparent: 5 }, 5)` → single entry with `isTransparent: true`.
- **reaggregate with bucketSize 64 collapsing everything**: all 256³ colours potentially map to ~5 bins — the merge logic must handle large count accumulation.

## Error conditions

All inputs come from internal code (Uint8ClampedArray values are 0–255, bucketSize is 1–64 per slider). No external validation is needed at this layer, and no error paths are in scope.

## Test infrastructure

Vitest with `environment: 'jsdom'` (or `node` — neither DOM nor browser APIs are used by this module; `node` environment is preferable). No fixtures, mocks, or external setup.

## Acceptance criteria

All test cases above must pass. The `sortedColours — percentages sum to 100` case is allowed to tolerate floating-point imprecision (within 0.001). All other cases are exact.
