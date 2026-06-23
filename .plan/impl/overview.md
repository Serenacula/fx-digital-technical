---
created: 2026-06-23
updated: 2026-06-23
spec_root: root-0001
---

# Implementation Plan: Image Dominant Colour Finder

## Approach

The project is a four-layer stack built bottom-up: scaffold → pure algorithm library → browser pixel reader → UI. Each layer only depends on what's below it, which keeps build ordering unambiguous and makes each layer independently testable before the next is wired in.

The core architectural decision (from the spec) is a two-phase approach: pixel reading happens once on upload, producing a raw frequency map stored in JS client state. Re-aggregation runs on every slider move, entirely client-side. The algorithm module (`colour-algorithm`) and image processor module (`image-processor`) are kept strictly separate — the algorithm module is pure TypeScript with zero I/O, making it straightforward to unit test. The image processor owns the browser Canvas API interaction and returns data in the format the algorithm module expects.

The UI layer is a single Astro page with a `<script>` tag for client-side interactivity. No framework component — the page is a single view with no routing. Chart rendering is plain HTML/CSS divs; no chart library.

## Modules

- `scaffold` — Astro project scaffold, TypeScript strict mode, static output, base path configuration for GitHub Pages.
- `colour-algorithm` — Pure TS library: quantize, reaggregate, toHex, sortedColours, shared types.
- `image-processor` — Browser Canvas API module: File → raw frequency map + total pixel count.
- `ui` — Single Astro page: two-column layout, file upload, image preview, quantization slider, bar chart.

## Build phases

**Phase 1 — Foundation**
- `0001-astro-scaffold`: Astro init, static output, TypeScript strict, GitHub Pages base path. No dependencies.

**Phase 2 — Core logic (parallel)**
- `0002-colour-algorithm`: Pure TS quantization library. Can be written and unit-tested before the scaffold even runs in a browser.
- `0003-image-processor`: Canvas API pixel reader. Depends on the scaffold for the project context; otherwise independent of the algorithm.

**Phase 3 — UI integration**
- `0004-ui-page`: Single Astro page wiring all three prior outputs together. Not startable until Phase 2 is complete.

## Open concerns

- **GitHub Pages deployment**: The spec node `project-setup-d4e5` explicitly put CI/CD out of scope. Hosting requires either a manual `dist/` push to a `gh-pages` branch or a GitHub Actions workflow. The build phase will produce a working local build; deployment is not a work item but the user will need to set it up before the hosted demo is live. A minimal GitHub Actions workflow is a one-file add that can be done after the build completes.
- **GitHub Pages base path**: If the repo is hosted as `username.github.io/repo-name/` (project repo rather than user/org root), Astro's asset paths break unless `base: '/repo-name/'` is set in `astro.config.mjs`. This is handled in `0001-astro-scaffold` by setting a `base` option. The actual repo name isn't known yet; the scaffold work item will leave a clearly marked placeholder.
- **decisions.md staleness**: The global `decisions.md` still contains the original `sharp` and `300×300 resize` entries from before the architecture was corrected to client-side. The node files (`image-api-b2e3`, `root-0001`) are authoritative and reflect the corrected decisions. The impl plan is built from node files, not from `decisions.md`.
