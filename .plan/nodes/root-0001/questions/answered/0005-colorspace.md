---
id: 0005-colorspace
node: root-0001
status: answered
priority: medium
blocks: []
blocked_by: []
created: 2026-06-23
resolved: 2026-06-23
---

# How should alpha/transparency be handled?

## Context

PNG images can have transparent pixels. Without filtering, transparent white could dominate.

## Answer

RGB only. Skip only fully transparent pixels (alpha = 0); process all others regardless of alpha value.

## Rationale

Preserves semi-transparent pixels in the results. A more nuanced threshold may be added later as a feature.
