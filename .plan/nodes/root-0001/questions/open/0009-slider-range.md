---
id: 0009-slider-range
node: root-0001
status: open
priority: high
blocks: [ui-c3d4]
blocked_by: []
created: 2026-06-23
resolved: null
---

# What is the quantization slider range and step size?

## Context

The slider controls the bucket size used to group similar colours. This affects how many distinct colour bars appear in the chart. The range and step need to be specified before the UI node can be finalised.

## Options

- **Range 1–64, step 1**: Full granularity control. At 1, every distinct RGB value is its own bucket (very noisy for photos). At 64, you get 4³ = 64 buckets total.
- **Range 4–64, step 4**: Avoids the noisy low end. Steps are multiples of 4 (aligns nicely with bit operations). Default could be 16.
- **Range 1–128, step 1**: Wider range; at 128 you get only 2³ = 8 possible colours.

## Answer

## Rationale

## Drop / defer reason
