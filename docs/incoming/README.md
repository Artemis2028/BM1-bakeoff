# Incoming source material

This folder holds **source material** for content extraction. It is not an
applied engine patch.

## `full-roster-v2-guided.patch`

Guided remaster full-roster-v2 patch, staged on
`14a0a1834db6b3e11ebdd5586604314431d252a9` (`docs: stage guided full-roster-v2
patch for content-only import`). Kept here for audit.

**Content extracted** into bake-off (this branch):

- Entire `bm-ships/` tree (roster, assets, aliases, helpers, `validate.mjs`)
- `docs/APPROVED-HULL-MERGES.md`
- `docs/SHIP-ECONOMY-REVIEW.md`
- `docs/ship-balance/**`

**Not applied** (forbidden on bake-off until a later catalog-wire slice):

- `src/main.js`, `src/ship-catalog-integration.mjs`, `src/ship-economy.mjs`
- `data/starship_manifest.json`, `data/stationData.json`
- Guided probes/builders under `scripts/*`
- `package.json`, `index.html`, `sw.js`, `offline-assets.json`, root `README.md`
- `docs/BM1-GAME-ROADMAP.md` (guided roadmap; bake-off plan stays
  `docs/revised-development-plan.md`)

After extract: `node bm-ships/validate.mjs` is green. Reman hull **53 /
`bm-ship:53`** remains; access stays durable unlock + later
`meetPackPurchaseDecision`. Catalog wire is still later.
