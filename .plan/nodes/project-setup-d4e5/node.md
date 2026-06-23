---
id: project-setup-d4e5
parent: root-0001
slug: project-setup
status: complete
atomic: true
depends_on: []
created: 2026-06-23
updated: 2026-06-23
---

# Project Setup

## Purpose

Scaffold the Astro project with TypeScript and configure it for static output (GitHub Pages hosting).

## Scope

**In scope:**
- `npm create astro` scaffold (TypeScript strict mode)
- Astro output mode: `static`
- Basic `tsconfig.json`
- No server dependencies — all processing is client-side

**Out of scope:**
- Any server adapter
- `sharp` or other image processing packages
- CI/CD

## Decisions

- **Astro output mode**: `static` — hosted on GitHub Pages, no server available.
- **No npm packages for image processing**: Browser Canvas API handles everything natively.

## Children

None — atomic.

## Open threads

None.
