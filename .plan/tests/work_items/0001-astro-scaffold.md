---
work_item: 0001-astro-scaffold
module: scaffold
implements: [project-setup-d4e5]
updated: 2026-06-23
---

# Tests: Astro Project Scaffold

## What this verifies

The scaffold work item has no runtime logic to test. The goal is to confirm the project builds correctly, the TypeScript compiler is satisfied, and the dev server starts — so that subsequent work items can build on a known-good foundation.

## Test cases

### Dev server starts cleanly

**Type:** manual
**Setup:** scaffold completed, dependencies installed (`npm install`)
**Action:** run `npm run dev`
**Expect:** dev server starts on `localhost:4321` with no errors in the terminal output; default Astro welcome page is reachable at `http://localhost:4321/fx-digital-technical/`

### Production build succeeds

**Type:** manual
**Setup:** scaffold completed, dependencies installed
**Action:** run `npm run build`
**Expect:** exits with code 0; a `dist/` directory is produced containing at least an `index.html`

### TypeScript reports zero errors

**Type:** manual
**Setup:** scaffold completed, dependencies installed
**Action:** run `npx tsc --noEmit`
**Expect:** exits with code 0, no output

### Base path is correctly configured

**Type:** manual
**Setup:** production build completed (`npm run build`)
**Action:** inspect `dist/index.html`
**Expect:** any script/link asset URLs reference `/fx-digital-technical/` as their path prefix, not bare `/`

## Edge cases and boundaries

None for pure configuration work.

## Error conditions

If `npm run dev` fails with a TypeScript error in the initial scaffold (before any custom code is added), it indicates a misconfigured `tsconfig.json` or an Astro version conflict — investigate before proceeding.

## Acceptance criteria

All four cases verified manually before moving to Phase 2 work items. Specifically: dev server starts, build produces `dist/`, tsc exits clean, and asset paths include the base path.
