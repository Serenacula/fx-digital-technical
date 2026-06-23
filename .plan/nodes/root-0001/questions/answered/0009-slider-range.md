---
id: 0009-slider-range
node: root-0001
status: answered
priority: high
blocks: [ui-c3d4]
blocked_by: []
created: 2026-06-23
resolved: 2026-06-23
---

# What is the quantization slider range and step size?

## Context

The slider controls the bucket size used to group similar colours. Affects how many distinct colour bars appear in the chart.

## Options

- Range 1–64, step 1, default 10
- Range 1–32, step 1, default 8
- Range 4–64, step 4, default 16

## Answer

Range 1–64, step 1, default 10.

## Rationale

Matches the challenge spec's example of rounding to nearest 10. Covers the full interesting range. Default of 10 gives a sensible out-of-the-box result for a typical photo.
