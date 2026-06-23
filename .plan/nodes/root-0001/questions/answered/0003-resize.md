---
id: 0003-resize
node: root-0001
status: answered
priority: high
blocks: []
blocked_by: []
created: 2026-06-23
resolved: 2026-06-23
---

# Should we resize the image before pixel analysis?

## Context

Large images (e.g. 12MP) contain millions of pixels. Resizing before extraction caps payload and work significantly.

## Answer

Yes — resize to 300×300 on the server before extracting pixels.

## Rationale

Caps pixel count at ~90,000. Negligible accuracy loss for dominant-colour analysis. Makes raw frequency map small enough to send to the client as JSON comfortably.
