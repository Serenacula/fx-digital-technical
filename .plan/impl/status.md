# Impl Plan Status

_Last updated: 2026-06-23_
_Stage:_ project-plan (impl planning) — awaiting user approval

## Modules

| Module | Work items | Dependencies |
|---|---|---|
| `scaffold` | 1 | none (first to build) |
| `colour-algorithm` | 1 | scaffold |
| `image-processor` | 1 | scaffold |
| `ui` | 1 | scaffold + colour-algorithm + image-processor |

## Work items

**Phase 1 — Foundation**
- `0001-astro-scaffold` (no deps) — unblocked immediately

**Phase 2 — Core logic (both unblocked after Phase 1)**
- `0002-colour-algorithm` (depends on 0001)
- `0003-image-processor` (depends on 0001)

**Phase 3 — UI integration**
- `0004-ui-page` (depends on 0001, 0002, 0003)

Total: 4 work items.

## Open concerns

- **GitHub Pages deployment**: `project-setup-d4e5` put CI/CD out of scope. A GitHub Actions deploy workflow will be needed before the hosted demo is live, but it is not a work item here. Can be added manually after the build completes.
- **Base path placeholder**: The scaffold will include a commented `base: '/REPO-NAME/'` placeholder in `astro.config.mjs` that the user must replace with the actual repo name before deploying to GitHub Pages.
- **decisions.md staleness**: Global `decisions.md` still contains the superseded `sharp` and `300×300` entries. Node files are authoritative. This does not affect the build.

## Spec issues blocking planning

None.
