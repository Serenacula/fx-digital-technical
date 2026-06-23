# Decision Log

## 2026-06-23 — Tech stack

**Node:** `root-0001`
**Question:** `0001-stack`
**Decision:** TypeScript + Astro
**Rationale:** User's stated preference; familiar stack for interview demo.
**Affects:** All nodes.

---

## 2026-06-23 — Image processing library

**Node:** `root-0001`
**Question:** `0002-image-lib`
**Decision:** `sharp`
**Rationale:** Fast native decoding, raw pixel Buffer output, handles all common formats. Best server-side option.
**Affects:** `image-api-b2e3`

---

## 2026-06-23 — Resize before analysis

**Node:** `root-0001`
**Question:** `0003-resize`
**Decision:** Resize to 300×300 (cover) before pixel extraction.
**Rationale:** Caps work at ~90,000 pixels, keeps JSON payload small, negligible accuracy loss.
**Affects:** `image-api-b2e3`

---

## 2026-06-23 — Intermediate representation

**Node:** `root-0001`
**Question:** `0004-intermediate`
**Decision:** Server returns raw frequency map (bucket = 1) as JSON; client re-aggregates on slider change.
**Rationale:** Separates expensive pixel-read (once) from cheap re-aggregation (real-time, client-side).
**Affects:** `image-api-b2e3`, `algorithm-a1f2`, `ui-c3d4`

---

## 2026-06-23 — Alpha handling

**Node:** `root-0001`
**Question:** `0005-colorspace`
**Decision:** RGB only; skip only fully transparent pixels (alpha = 0). Semi-transparent pixels are processed normally.
**Rationale:** Preserves semi-transparent pixels in results. A more nuanced threshold may be added as a future feature.
**Affects:** `image-api-b2e3`

---

## 2026-06-23 — Colour scheme

**Node:** `root-0001`
**Question:** `0006-colourscheme`
**Decision:** Black on white.
**Rationale:** User's stated preference.
**Affects:** `ui-c3d4`

---

## 2026-06-23 — Page layout

**Node:** `root-0001`
**Question:** `0007-layout`
**Decision:** Left column: image + controls. Right column: scrollable bar chart.
**Rationale:** User's stated design.
**Affects:** `ui-c3d4`

---

## 2026-06-23 — Bar chart row format

**Node:** `root-0001`
**Question:** `0008-chart`
**Decision:** Each row: hex code label + colour bar (width = percentage of total pixels). Sorted most → least.
**Rationale:** User's stated design.
**Affects:** `ui-c3d4`

---
