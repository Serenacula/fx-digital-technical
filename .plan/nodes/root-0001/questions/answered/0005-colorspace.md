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

RGB only for coloured pixels. Pixels with alpha = 0 are counted as a separate "transparent" colour entry rather than excluded. Semi-transparent pixels (alpha > 0) are processed by their RGB channels. `totalPixels` = `canvas.width × canvas.height`, so all percentages sum to 100%.

## Rationale

Transparent pixels are real content in the image — excluding them hides information. Counting them as a distinct entry lets the user see what fraction of the image is transparent. The alpha threshold (default 0) was considered as a user-configurable slider but deferred as feature creep.
