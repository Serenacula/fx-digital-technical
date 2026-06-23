---
id: 0001-astro-scaffold
status: pending
module: scaffold
implements: [project-setup-d4e5]
depends_on: []
created: 2026-06-23
---

# Astro Project Scaffold

## What this builds

Initialises the Astro project with TypeScript strict mode and static output configured for GitHub Pages. Produces a working `npm run dev` dev server with the default Astro welcome page. Configures `astro.config.mjs` with `output: 'static'` and a placeholder `base` path for sub-path GitHub Pages hosting. Sets up `tsconfig.json` with `strict: true`. No image processing packages — all processing is handled by the Browser Canvas API in a later work item.

## Test strategy sketch

Manual smoke test: `npm run dev` starts without errors; `npm run build` produces a `dist/` directory; TypeScript compiler reports zero errors on the empty scaffold.

## Notes

The `base` option in `astro.config.mjs` must be left as a clearly commented placeholder (e.g. `base: '/REPO-NAME/',  // TODO: replace with your GitHub repo name`) since the actual repo name is not known at build time. The build will produce correct relative paths once set.
