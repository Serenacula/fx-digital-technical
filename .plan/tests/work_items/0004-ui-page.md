---
work_item: 0004-ui-page
module: ui
implements: [ui-c3d4]
updated: 2026-06-23
---

# Tests: UI Page

## What this verifies

The UI page (`src/pages/index.astro`) has no exportable units — all JS lives in a `<script>` tag. Testing is integration/E2E via Playwright. The focus is on: correct initial state (empty state, slider disabled), state transitions across the upload flow (loading → results, loading → error), slider debounce behaviour, correct bar chart rendering (hex labels, bar widths, percentage text, transparent entry's checkerboard appearance), and that re-uploading a new image replaces the previous result cleanly.

## Test cases

### Empty state on page load

**Type:** e2e (Playwright)
**Setup:** navigate to `http://localhost:4321/fx-digital-technical/`
**Action:** observe initial DOM state before any file is uploaded
**Expect:**
- Chart column shows "Upload an image to see its dominant colours"
- Slider is disabled (`disabled` attribute present)
- Image preview is hidden (or not rendered)
- File input is enabled

---

### Loading state while processing

**Type:** e2e (Playwright)
**Setup:** navigate to page; before uploading, use `page.evaluate(() => { window.__delayProcessing = 500; })` to inject a 500ms delay into the processing path (see test hooks in `strategy.md`)
**Action:** upload `tests/fixtures/1x1-red.png` via `setInputFiles`; immediately after (without awaiting results) check DOM state
**Expect:** "Analysing…" text visible in chart column; file input has `disabled` attribute; slider has `disabled` attribute
**Cleanup:** after the upload resolves (wait for results state), assert the loading text is gone and results are shown

---

### Results state after valid upload

**Type:** e2e (Playwright)
**Setup:** navigate to page; prepare `tests/fixtures/2x1-red-blue.png`
**Action:** upload `2x1-red-blue.png` via `setInputFiles`
**Expect:**
- Chart column contains two bar rows
- First row label: `#ff0000`; bar has `background-color: #ff0000`; percentage text: `50.0%`
- Second row label: `#0000ff`; bar has `background-color: #0000ff`; percentage text: `50.0%`
- Both rows appear (either order is fine at bucketSize 10 since these are well-separated colours)
- Slider is enabled
- File input is enabled
- Image preview shows (the `<img>` element has a non-empty `src`)

---

### Transparent entry renders as checkerboard

**Type:** e2e (Playwright)
**Setup:** upload `tests/fixtures/2x1-red-transparent.png`
**Action:** observe the bar chart
**Expect:**
- Two rows rendered
- One row has label `transparent`
- That row's bar element has a `background` style containing `repeating-linear-gradient` (the checkerboard CSS), not a flat `background-color`
- That row's bar element has a `1px solid black` border (or `border: 1px solid #000`)

---

### Error state — unsupported file type

**Type:** e2e (Playwright)
**Setup:** prepare a `.gif` file (`new File([], 'anim.gif', { type: 'image/gif' })` supplied via Playwright's buffer upload)
**Action:** upload the file
**Expect:**
- Chart column shows `"Unsupported file type. Please upload a JPEG, PNG, WebP, AVIF, or BMP."`
- File input is re-enabled
- Slider is disabled
- Any previous chart result is cleared

---

### Error state — oversized file

**Type:** e2e (Playwright)
**Setup:** supply a file with valid MIME type but size > 16 MB (16 MB + 1 byte buffer, type `image/png`)
**Action:** upload the file
**Expect:**
- Chart column shows `"File is too large. Maximum size is 16 MB."`
- File input is re-enabled; slider is disabled

---

### Slider updates chart without re-reading the image

**Type:** e2e (Playwright)
**Setup:** install a spy before navigation: `await page.addInitScript(() => { let count = 0; const orig = URL.createObjectURL.bind(URL); URL.createObjectURL = (...args) => { count++; window.__createObjectURLCount = count; return orig(...args); }; })`. Upload `tests/fixtures/2x1-red-blue.png` and wait for results.
**Action:** move slider to value 64
**Expect:**
- Chart re-renders (DOM updates — `window.__lastRendered` changes)
- `window.__createObjectURLCount` is still `1` — image was not re-read
- At bucketSize 64: red `(255,0,0)` and blue `(0,0,255)` remain separate entries (`#ff0000` and `#0000ff`); chart shows two rows

---

### Debounce — rapid slider changes trigger at most one recalculation

**Type:** e2e (Playwright)
**Setup:** upload `tests/fixtures/2x1-red-blue.png`; wait for results; note `window.__recalcCount` (should be `1` after initial render)
**Action:** dispatch 10 `input` events on the slider in rapid succession (synchronously via `page.evaluate`), then wait 100ms
**Expect:** `window.__recalcCount` has increased by exactly `1` — the 10 events debounced into a single recalculation
**Implementation note:** `page.evaluate(() => { const slider = document.querySelector('input[type=range]'); for (let i = 1; i <= 10; i++) { slider.value = String(i * 5); slider.dispatchEvent(new Event('input', { bubbles: true })); } })` followed by `page.waitForTimeout(100)`

---

### Slider label shows current value

**Type:** e2e (Playwright)
**Setup:** upload any valid image (e.g. `1x1-red.png`)
**Action:** move slider to value 32
**Expect:** the "Colour grouping:" label shows "32" as the current value (the numeric part updates)

---

### Re-upload replaces previous result

**Type:** e2e (Playwright)
**Setup:** upload `tests/fixtures/1x1-red.png`; wait for results
**Action:** upload `tests/fixtures/1x1-white.png`
**Expect:**
- Chart updates to show `#ffffff` (not `#ff0000`)
- Preview image updates to the new image
- Previous result is gone

---

### Error state then successful recovery

**Type:** e2e (Playwright)
**Setup:** navigate to page
**Action:**
1. Upload a GIF (invalid type) → error state
2. Upload `tests/fixtures/1x1-white.png`
**Expect:**
- After GIF: error message shown; file input enabled; slider disabled
- After PNG: error message gone; chart shows 1 row with label `#ffffff`, percentage `100.0%`; slider enabled; preview updates

---

### Slider at minimum (bucketSize 1) — no crash, chart scrollable

**Type:** e2e (Playwright)
**Setup:** upload `tests/fixtures/2x1-red-blue.png`; wait for results
**Action:** move slider to value `1`
**Expect:**
- No JS console errors
- Chart renders 2 rows (one per pixel colour)
- Chart container has `overflow-y` set to `auto` or `scroll` in computed style (verifiable via `getComputedStyle`)

---

## Edge cases and boundaries

- **Slider at max (64)**: most real-photo colours converge to a small number of entries. Chart should update without error.
- **Slider interaction before any upload**: slider is disabled — user cannot interact. No JS error should be thrown if the slider element somehow fires an event while disabled.

## Error conditions

- **Generic processing error** (corrupt image that passes MIME/size validation): the chart column should show `"Could not read image."` and the file input should be re-enabled.

## Test infrastructure

- Playwright with Chromium
- Fixtures from `tests/fixtures/` (see 0003 test plan for full list)
- Dev server started via Playwright `webServer` config
- Test hooks: `window.__lastResult`, `window.__lastRendered`, `window.__recalcCount`, `window.__delayProcessing` — all defined in `strategy.md`; the builder adds them to the UI `<script>` guarded by `import.meta.env.DEV`.

## Acceptance criteria

All named test cases must pass. There are no best-effort exceptions — the loading-state case uses the `window.__delayProcessing` hook to make it reliably observable.
