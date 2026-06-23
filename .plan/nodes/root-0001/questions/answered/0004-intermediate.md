---
id: 0004-intermediate
node: root-0001
status: answered
priority: high
blocks: []
blocked_by: []
created: 2026-06-23
resolved: 2026-06-23
---

# What intermediate representation is sent to the client?

## Context

Determines how re-aggregation on slider change works. Options range from raw pixel array to a pre-quantized map.

## Answer

Raw frequency map at bucket = 1 (exact RGB counts after resize). Sent as JSON to the client. Client stores it and re-aggregates locally on every slider change.

## Rationale

After resizing to 300×300, the raw map has at most ~90,000 entries but in practice far fewer distinct colours. JSON size is manageable. Gives full flexibility for any slider value with no server round-trips.
