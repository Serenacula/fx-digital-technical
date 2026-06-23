# Test Plan Status

_Last updated: 2026-06-23_
_Stage:_ project-tests (test planning) — awaiting user approval

## Coverage by module

- `scaffold` — manual smoke tests only, 4 cases across 1 work item
- `colour-algorithm` — thorough unit tests (Vitest/node), 18 cases across 1 work item
- `image-processor` — 5 unit validation cases (Vitest/jsdom) + 8 pixel-extraction browser cases + 4 format-compat browser cases (Playwright)
- `ui` — integration/E2E only, 11 cases across 1 work item (Playwright)

## Work items

### Planned

- `0001-astro-scaffold` — 4 manual cases
- `0002-colour-algorithm` — 18 unit cases (Vitest, node environment)
- `0003-image-processor` — 5 unit cases (Vitest/jsdom) + 12 browser cases (Playwright, Sections B+C)
- `0004-ui-page` — 11 e2e cases (Playwright), including loading state, debounce, error→recovery, and slider-at-min

### Pending

None — all 4 work items have test plans.

## Suites

- `e2e-full-flow` — e2e, 6 scenarios, depends on all 4 work items

## Open questions

None — all open questions from the critique have been resolved:
- `window.__lastResult` / `window.__lastRendered` / `window.__recalcCount` / `window.__delayProcessing` defined in strategy.md test hooks section
- Loading state test now uses `window.__delayProcessing` — must-pass, not best-effort
- WebP and AVIF fixtures are lossless (`{ lossless: true }`); exact pixel assertions apply
- Percentage format pinned to `toFixed(1)` — e.g. `"50.0%"` — consistent across all test files
- Scenario 2 in E2E suite rewritten with verified quantization math and correct fixture name

## Spec or impl-plan issues surfaced

1. **`window.__lastResult` timing**: set immediately after `processImage()`, before reaggregation (raw map). `window.__lastRendered` set after each chart render (post-quantization `ColourEntry[]`). Both dev-only hooks. See strategy.md for full definition.
2. **`window.__recalcCount` and `window.__delayProcessing`**: additional dev-only hooks required from the builder. See strategy.md.
3. **`ValidationError.kind` field removed as requirement**: the "valid MIME type accepted" test was dropped as untestable — valid-type acceptance is implicitly covered by every pixel-extraction test in Section B.
