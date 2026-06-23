---
work_item: 0003-image-processor
module: image-processor
implements: [image-api-b2e3]
updated: 2026-06-23
---

# Tests: Client-Side Image Processor

## What this verifies

The image processor has two distinct responsibilities: (1) validation — rejecting unsupported MIME types and oversized files with specific typed errors, before any canvas work is done; (2) pixel extraction — drawing an image to an off-screen canvas and correctly iterating the pixel data to build the frequency map, including counting alpha=0 pixels under the `"transparent"` sentinel.

Validation tests run in Vitest (jsdom), because the ValidationError is thrown before any canvas or DOM access. Pixel extraction tests run in Playwright (real Chromium), because they require a working Canvas API and the ability to decode real PNG files.

## Section A — Validation (Vitest)

### Invalid MIME type — GIF rejected

**Type:** unit
**Setup:** `const file = new File([], 'anim.gif', { type: 'image/gif' })`
**Action:** `await processImage(file)` wrapped in a try/catch or `expect(...).rejects`
**Expect:** throws `ValidationError` with message `"Unsupported file type. Please upload a JPEG, PNG, WebP, AVIF, or BMP."`

---

### Invalid MIME type — SVG rejected

**Type:** unit
**Setup:** `const file = new File([], 'icon.svg', { type: 'image/svg+xml' })`
**Action:** `await processImage(file)`
**Expect:** throws `ValidationError` with same unsupported-type message

---

### Invalid MIME type — empty type rejected

**Type:** unit
**Setup:** `const file = new File([], 'unknown', { type: '' })`
**Action:** `await processImage(file)`
**Expect:** throws `ValidationError` with unsupported-type message

---

### Oversized file rejected

**Type:** unit
**Setup:** `const file = new File([new ArrayBuffer(17 * 1024 * 1024)], 'big.png', { type: 'image/png' })`
**Action:** `await processImage(file)`
**Expect:** throws `ValidationError` with message `"File is too large. Maximum size is 16 MB."`

---

### File at exactly 16 MB is not rejected for size

**Type:** unit
**Setup:** `const file = new File([new ArrayBuffer(16 * 1024 * 1024)], 'limit.png', { type: 'image/png' })`
**Action:** catch the rejection — it will likely fail later (not a real PNG), but check the thrown error is not a ValidationError with the size message
**Expect:** no `ValidationError` with the size message is thrown. The function may fail for a different reason (image decode failure), but size validation passes.

---

## Section B — Pixel extraction (Playwright)

### Fixture generation

All pixel-extraction tests use PNG files in `tests/fixtures/`. These files are generated once by a script (`scripts/generate-test-fixtures.ts`) which uses `pngjs` (devDependency) to produce minimal PNG files from explicit RGBA pixel arrays. The script is the authoritative record of what each fixture contains. Each fixture is committed to the repository; the script does not run as part of the test suite.

**Fixtures required:**

| File | Dimensions | Pixel values (RGBA per pixel, left-to-right, top-to-bottom) |
|---|---|---|
| `1x1-red.png` | 1×1 | `(255, 0, 0, 255)` |
| `1x1-transparent.png` | 1×1 | `(0, 0, 0, 0)` |
| `1x1-semi-transparent.png` | 1×1 | `(100, 150, 200, 128)` — alpha > 0, not fully transparent |
| `1x1-white.png` | 1×1 | `(255, 255, 255, 255)` |
| `2x1-red-blue.png` | 2×1 | left: `(255, 0, 0, 255)`, right: `(0, 0, 255, 255)` |
| `2x1-red-transparent.png` | 2×1 | left: `(255, 0, 0, 255)`, right: `(0, 0, 0, 0)` |
| `4x1-same-color.png` | 4×1 | all four: `(255, 0, 0, 255)` |
| `2x1-near-black.png` | 2×1 | left: `(10, 0, 0, 255)`, right: `(30, 0, 0, 255)` — used by E2E suite quantization-merge scenario |

The generation script must verify its own output by decoding each generated PNG with `pngjs` and asserting the RGBA values match the intended input before writing the file to disk.

---

### Single opaque pixel → one RGB entry

**Type:** integration (browser)
**Setup:** Playwright navigates to the test page; uses `setInputFiles` with `tests/fixtures/1x1-red.png`
**Action:** the page processes the image (via the file input change event) and exposes the result (the builder must expose `window.__lastResult` or equivalent for testability — see notes)
**Expect:** `map` equals `{ "255,0,0": 1 }`, `totalPixels` equals `1`

---

### Single fully-transparent pixel → transparent sentinel

**Type:** integration (browser)
**Setup:** upload `tests/fixtures/1x1-transparent.png`
**Action:** page processes image, check result
**Expect:** `map` equals `{ "transparent": 1 }`, `totalPixels` equals `1`

---

### Semi-transparent pixel → processed as RGB (not transparent)

**Type:** integration (browser)
**Setup:** upload `tests/fixtures/1x1-semi-transparent.png`
**Action:** page processes image, check result
**Expect:** `map` equals `{ "100,150,200": 1 }`, `totalPixels` equals `1` — alpha=128 is NOT treated as transparent

---

### Two-pixel image with distinct colours

**Type:** integration (browser)
**Setup:** upload `tests/fixtures/2x1-red-blue.png`
**Action:** page processes image, check result
**Expect:** `map` equals `{ "255,0,0": 1, "0,0,255": 1 }`, `totalPixels` equals `2`

---

### Two-pixel mixed image → RGB entry + transparent entry

**Type:** integration (browser)
**Setup:** upload `tests/fixtures/2x1-red-transparent.png`
**Action:** page processes image, check result
**Expect:** `map` equals `{ "255,0,0": 1, "transparent": 1 }`, `totalPixels` equals `2`

---

### Multiple identical pixels → count accumulates

**Type:** integration (browser)
**Setup:** upload `tests/fixtures/4x1-same-color.png`
**Action:** page processes image, check result
**Expect:** `map` equals `{ "255,0,0": 4 }`, `totalPixels` equals `4`

---

### totalPixels equals width × height (all pixels, not just opaque)

**Type:** integration (browser)
**Setup:** upload `tests/fixtures/2x1-red-transparent.png`
**Action:** check `totalPixels`
**Expect:** `2` — not `1` (not just the non-transparent count)

---

### Near-black fixture raw extraction (confirms key format before quantization)

**Type:** integration (browser)
**Setup:** upload `tests/fixtures/2x1-near-black.png`
**Action:** page processes image, check `window.__lastResult`
**Expect:** `map` equals `{ "10,0,0": 1, "30,0,0": 1 }`, `totalPixels` equals `2` — raw map, no quantization applied

---

## Section C — Format compatibility (Playwright)

Each of the five accepted MIME types must actually decode and produce a valid pixel map. This section verifies that the browser Canvas API correctly draws each format and that the image processor returns a sensible result. These tests assert no error is thrown and a non-empty map is returned; exact pixel values are only asserted for lossless formats (PNG, BMP).

**Additional fixtures required** (generated by the fixture script using `sharp`; all 1×1 pixels):

| File | Format | Input colour | Expected map (where lossless) |
|---|---|---|---|
| `1x1-format.jpg` | JPEG (lossy) | white `(255, 255, 255, 255)` | no exact assertion — JPEG is lossy; generate with quality 100 |
| `1x1-format.webp` | WebP lossless | white `(255, 255, 255, 255)` | exactly `{ "255,255,255": 1 }` — generate with `sharp().webp({ lossless: true })` |
| `1x1-format.avif` | AVIF lossless | white `(255, 255, 255, 255)` | exactly `{ "255,255,255": 1 }` — generate with `sharp().avif({ lossless: true })` |
| `1x1-format.bmp` | BMP (lossless) | red `(255, 0, 0, 255)` | exactly `{ "255,0,0": 1 }` |

---

### JPEG file processes without error

**Type:** integration (browser)
**Setup:** upload `tests/fixtures/1x1-format.jpg`
**Action:** page processes image, check result via `window.__lastResult`
**Expect:** no ValidationError; `totalPixels = 1`; `map` has exactly one key; that key is not `"transparent"`

---

### WebP file produces exact pixel values (lossless)

**Type:** integration (browser)
**Setup:** upload `tests/fixtures/1x1-format.webp`
**Action:** page processes image, check result via `window.__lastResult`
**Expect:** `map` equals `{ "255,255,255": 1 }`, `totalPixels = 1`

---

### AVIF file produces exact pixel values (lossless)

**Type:** integration (browser)
**Setup:** upload `tests/fixtures/1x1-format.avif`
**Action:** page processes image, check result via `window.__lastResult`
**Expect:** `map` equals `{ "255,255,255": 1 }`, `totalPixels = 1`

---

### BMP file produces exact pixel values (lossless)

**Type:** integration (browser)
**Setup:** upload `tests/fixtures/1x1-format.bmp`
**Action:** page processes image, check result
**Expect:** `map` equals `{ "255,0,0": 1 }`, `totalPixels = 1`

---

## Edge cases and boundaries

- **Semi-transparent pixels**: alpha > 0 but < 255 must be processed as RGB, not as transparent. Covered explicitly.
- **totalPixels denominator**: confirmed to be `width × height`, not the non-transparent pixel count. Covered by the mixed-image case.
- **Key format**: `"r,g,b"` string (commas, no spaces). If the fixture produces `(100, 150, 200)`, the expected key is `"100,150,200"`.
- **Object URL revocation**: not directly testable, but if revocation is missing the browser will log a warning. Playwright's browser console errors should be monitored during test runs and treated as test failures.
- **Memory**: at native resolution, large images produce large maps. Not tested here (no performance requirements in the spec).

## Error conditions

- **Invalid MIME type**: covered in Section A (Vitest).
- **Oversized file**: covered in Section A (Vitest).
- **Image decode failure** (valid MIME type but corrupt file): throws a non-ValidationError, caught by the UI's generic error handler. The test plan does not write a corrupt-PNG fixture — the UI work item's error-state test covers this path at the integration level.

## Test infrastructure

**Vitest (Section A):**
- `environment: 'jsdom'`
- No fixtures needed — `File` objects created inline with `new File(...)`
- `pngjs` devDependency is NOT needed here

**Playwright (Section B):**
- Fixtures in `tests/fixtures/` (generated by `scripts/generate-test-fixtures.ts`, committed to repo)
- `pngjs` as a devDependency for the generation script only
- The app page must expose `window.__lastResult = { map, totalPixels }` after a successful `processImage` call, or the tests must read the result via `page.evaluate()` on a global the script sets. The builder must add this test hook (wrapped in `if (import.meta.env.DEV)` or equivalent).
- Playwright `webServer` config starts the Astro dev server automatically

## Acceptance criteria

- All 5 Vitest validation cases pass.
- All 8 Playwright pixel-extraction cases (Section B) pass.
- All 4 Playwright format-compatibility cases (Section C) pass — JPEG accepts imprecise pixel values; WebP, AVIF, and BMP are asserted exactly (all lossless).
- No browser console errors during Playwright runs (especially URL leak warnings).
- The `totalPixels` value in every case matches `width × height`, not the non-transparent count.
