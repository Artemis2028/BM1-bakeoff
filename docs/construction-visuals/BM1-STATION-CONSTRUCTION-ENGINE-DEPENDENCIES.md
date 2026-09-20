# BM1 station construction visuals: engine dependencies

**Reviewed document:** `BM1-STATION-CONSTRUCTION-VISUALS-PROPOSAL.md`  
**Reviewed against:** `Artemis2028/BM1-bakeoff` at `3933daf` on `main` (20 September 2026), after empty-but-armable engine (PR #51). Line numbers below refer to this head and may drift.  
**Method:** read landed `underConstruction` / `drawStationConstructionSite` / `confirmPendingStationBuild`, side-lane `shouldDrawRepairOverlay` / `overlayUsesForbiddenArt` / `FORBIDDEN_REPAIR_OVERLAY_ASSETS`, repair overlay draw on the player sprite, `fireStationWeapon` / `tryDockAtStation`, Phase 4 `recordObservedAttack` / FLASH allowlist, combat `addWeaponEffect({ kind: 'beam' })` / `addProjectile`, pack construction notes, and GUIDED §5. No engine changes made. This is a dependency/risk checklist for a **later** writer **if** Tenth scopes a thin visual engine — not a post-implementation review and not permission to implement before Tenth scopes the lane. **Keep #33, #35, #37, #38, #39, #40, #41, #42, #43, #44, #45, #46, #47, #48, #49, #50, and #51 locked.** Do not reopen EW, boarding, Phase 10, flags/passes, the weapon ledger, or empty-armable. Do not redo repair arms. Do not retune combat. Do not open dockClear polish, HTML catalogs, or Flash price locks.

## Verdict in one paragraph

Station construction visuals can stay **docs-only**. If Tenth later scopes a thin engine, prefer **one new subscribe module** (`src/construction-visuals.js`, name can change) that **attaches** scaffold / workbee / **blue**-beam language to landed `underConstruction`, **keeps** the side-lane repair overlay on the player ship only, **hard-fails** any bind of `stationconstructing.gif` / workbee art as `repairarms` (and the reverse), and **never** writes `observedAttacks`, standing, FLASH, `addProjectile`, or combat `kind: 'beam'` from a construction beam. Subscribe to `drawStationConstructionSite`, `shouldDrawRepairOverlay`, and `overlayUsesForbiddenArt`. `CONSTRUCTION_LOCKED_FROM_REMASTERED === false`. The load-bearing risks are all integration mistakes: treating the dashed-ring placeholder as the Pass; borrowing construction GIFs as repair arms; piping a blue beam through `fireStationWeapon` / `recordAttackOnPlayerSide`; gifting `engagement_authorized`; inventing a workbee hull; `git am` remastered; reopening #33–#51.

## What already exists (do not reinvent)

| Need | Engine fact at `3933daf` |
| --- | --- |
| Constructing flag | `confirmPendingStationBuild` (`main.js` ~12045) writes `underConstruction: true`, `constructionStartedDay: state.day`, `constructionDays`, `condition: 1`, `builtByPlayer: true`. |
| Progress / complete | `getStationConstructionProgress` / `Remaining` (~11494 / ~11501). `completeDueStationConstructions` (~11508) clears the flag at progress 1. `STATION_CONSTRUCTION_DAYS = 5` (~862) + cost/defense bumps (~11486). **Do not retune.** |
| Placeholder site draw | `drawStationConstructionSite` (~22342): gold dashed ring, cyan dashed ring, green progress arc, remaining-days pill. Hull then draws faded / grayscale (~22459–22478). **Not** scaffold / workbee / blue-beam language. |
| No dock | `tryDockAtStation` (~16831): “under construction. N day(s) remaining.” |
| No fire | `fireStationWeapon` (~17958) returns if `underConstruction`. Realize paths zero `stationWeaponIds` while constructing (~3092, ~12347). Living / target filters skip constructing stations (~2355, ~6327, ~16691, ~18062). |
| Repair overlay | `REPAIR_ARMS_ASSET_PATH` = `assets/game/repair/repairarms.gif` (`side-lane-repair-reman.js` ~28). `shouldDrawRepairOverlay` (~216) requires in-progress + capable + services + asset + **player**. Drawn on the player sprite only (`main.js` ~22547). |
| Forbidden repair art | `FORBIDDEN_REPAIR_OVERLAY_ASSETS` = `stationconstructing.gif`, `workbee` (~29). `overlayUsesForbiddenArt` (~233). Probe `overlayUsesConstructionArt` (~27237). |
| Repair asset on disk | `assets/game/repair/` **does not exist** on this tip. Side-lane already has S7.4 **asset-missing**. `offline-assets.json` names neither GIF. |
| Construction asset on disk | `stationconstructing.gif` **not in-tree**. No workbee sprite under `assets/game/`. Pack notes only (`review-decisions.json` `a-73` / `a-232` / `a-233`). `bm-ships/` ships-only; `missingFeatures` still lists `station construction/workbees`. **No workbee hull id** in `ships.json`. |
| Phase 4 evidence | `recordAttackOnPlayerSide` (~5008) → `recordObservedAttack` (`phase2-security.js` ~312). Called from `fireStationWeapon` when the target is player-side (~17963). FLASH allowlist: `access_noncompliance` / `access_inability` / `destruction` / `distress` / `asset_overdue` (`phase4-incidents.js` ~38). Construction is **not** a kind. |
| Combat beams | Player / NPC / station `visualKind === 'beam'` → `addWeaponEffect({ kind: 'beam' })` or `addCuttingBeamEffects`, else `addProjectile` (~17805–18037). `drawWeaponEffects` (~20978) draws those. |
| Reconstruction (out) | `rebuildSystemStations` (~12488) un-destroys ruins, does **not** set `underConstruction`. Phase 8 conquest cost. **Do not fold in.** |
| Station plans | `state.stationPlans` (~1223) inventory strip. Buy/hold plans ≠ site visuals. |
| Empty-armable | `src/empty-armable.js`. `EMPTY_ARMABLE_LOCKED_FROM_REMASTERED === false`. Workbees are **not** pack 348 / 349 / 350. |
| Probe surface | `__BM1_PROBE__.phase9` … `.phase94`, `.boarding`, `.phase10`, `.utility`, `.weaponLedger`, `.emptyArmable`, side-lane snapshot. **S24** should add `.constructionVisuals` rather than fork S7 / S14–S23. |
| Remastered locks | `MAGNITUDES_LOCKED_FROM_REMASTERED === false`; `UTILITY_LOCKED_FROM_REMASTERED === false`; `LEDGER_LOCKED_FROM_REMASTERED === false`; `EMPTY_ARMABLE_LOCKED_FROM_REMASTERED === false`. |

**Gap this brief closes (docs now; engine only if scoped):** there is no **scoreable S24 contract** that (a) a constructing station shows scaffold / workbee / **blue**-beam language, (b) repair arms stay the side-lane overlay and never bind construction art, (c) construction beams never write Phase 4 evidence or a fire token. The placeholder site draw and the forbidden-repair-art list are **partial subscribe points**, not the package.

## Hooks the writer will have to touch

**This PR touches none of these.** If Tenth later scopes a thin engine:

Prefer a thin new file rather than growing `drawStationConstructionSite` into a second combat religion:

| Proposed module | Responsibility |
| --- | --- |
| `src/construction-visuals.js` (name can change) | `isConstructingStation`. Site language: scaffold / workbee / **blue** beam. `CONSTRUCTION_LOCKED_FROM_REMASTERED === false`. Hard-fail repair-art bind. Never write FS / `engagement_authorized` / `observedAttacks` / FLASH. Optional injectable bee count / orbit rate. |
| `src/side-lane-repair-reman.js` | **Subscribe.** Keep `FORBIDDEN_REPAIR_OVERLAY_ASSETS` and `shouldDrawRepairOverlay`. Do **not** invert the wall. |
| `src/main.js` | Thin: `drawStationConstructionSite` calls the new helpers while `underConstruction`. `__BM1_PROBE__.constructionVisuals`. **Do not** change `fireStationWeapon` except to keep the early return. **Do not** edit `game_items.json`. **Do not** redo repair overlay draw (~22547). |
| Asset load | Mirror `ensureRepairOverlayAsset` for construction **or** draw programmatic language when missing. Fail setup / snapshot `assetMissing` rather than bind `repairarms.gif`. |
| Offline test | Add `scripts/test-construction-visuals.mjs` (meaning; repair wall; no Phase 4 write; no FS; lock false). Do **not** rewrite S7 / S14–S23 files. |

Do **not** implement this inside `src/phase9-*.js`, `src/phase94-magnitudes.js`, `src/weapon-source-ledger.js`, `src/empty-armable.js` (except a later assert that workbees are not empty-armable hulls), `src/boarding-*.js`, `src/phase10-*.js`, `src/utility-inventory.js`, `src/phase8-markets.js`, or `src/phase4-incidents.js` (except a later assert that construction is absent from FLASH kinds). Do **not** `git am` remastered patches. Do **not** add EW families. Do **not** retune combat. Do **not** invent a workbee hull id.

| Existing path | Required integration (later engine) |
| --- | --- |
| `underConstruction` / `confirmPendingStationBuild` / `completeDueStationConstructions` | **Subscribe.** Language on while true; off when complete. Do not change days / costs. |
| `drawStationConstructionSite` | Add scaffold / workbee / **blue** beams. Progress HUD may stay. Placeholder-only dashes fail S24.1. |
| `shouldDrawRepairOverlay` / player overlay draw | **Untouched.** Fail if arms appear on the station / workbee / scaffold. |
| `overlayUsesForbiddenArt` / `FORBIDDEN_REPAIR_OVERLAY_ASSETS` | Keep. Fail if construction `src` is used as the repair overlay, or repair `src` as the scaffold. |
| `fireStationWeapon` / `stationWeaponIds` | Keep the constructing no-op. Do not give the blue beam a weapon id. |
| `tryDockAtStation` | Keep the constructing refuse. |
| `recordAttackOnPlayerSide` / `recordObservedAttack` / FLASH | Must not run from the construction draw. |
| `addWeaponEffect` / `addCuttingBeamEffects` / `addProjectile` | Construction beams stay off these lists. Prefer a dedicated construction-effect list if one is needed. |
| `rebuildSystemStations` | **Untouched.** Do not silently set `underConstruction` on ruins. |
| `utilityBook` / `weaponSlots` / empty-armable | Untouched. Fail if construction state or a workbee lands there. |
| `tractorIsBoarding` | Stays false. Tractor is not a construction crane. |
| `__BM1_PROBE__` | Add `constructionVisuals.snapshot` (see probe plan). **Fail setup if missing.** Keep `emptyArmable` / `phase9` … `weaponLedger` / side-lane intact. |
| Inventory / dock UI | Later engine: optional “under construction” copy on the site. DockClear polish **out**. HTML catalog **out**. |

## Risks

### 1. Placeholder chrome treated as the Pass (gate 1)

Leaving only gold / cyan dashes + a green arc “because the site already looks unfinished” fails “scaffold / workbee / **blue**-beam language.” Painting the existing cyan dash thicker and calling it a construction beam also fails if it is not a workbee-directed **blue** beam at scaffolding (or an honest programmatic stand-in when the GIF is missing).

**Gate:** S24.1.

### 2. Repair-arms redo / overlay leak (gate 2)

Drawing `repairarms` on the station, a workbee, or a scaffold, or widening `shouldDrawRepairOverlay` to `actor !== 'player'`, fails the side-lane Pass. Making a constructing defense platform `repairCapable` fails the same gate.

**Gate:** S24.2 / S24.5.

### 3. Cross-bind construction and repair art (gate 3)

`ensureRepairOverlayAsset` already rejects forbidden names, but a later construction loader that sets `repairOverlayAsset.src = '…/stationconstructing.gif'` (or draws `repairarms.gif` as the scaffold because “a GIF is a GIF”) fails the wall. Missing-asset must not become a substitution license.

**Gate:** S24.2.

### 4. Blue beam becomes weapons fire / Phase 4 evidence (gate 4)

Routing the construction beam through `fireStationWeapon`, `addWeaponEffect({ kind: 'beam' })`, `addProjectile`, or `recordAttackOnPlayerSide` writes combat evidence. A FLASH “workbee fired” or a standing tick from the beam fails even if no hull is damaged.

**Gate:** S24.3.

### 5. Construction status becomes a fire token (gate 5)

A construction inject that sets `firingSolution` / `engagement_authorized` / culture fire, or a Phase 10 rumor from “they are building,” fails the knowledge-layer lean.

**Gate:** S24.4.

### 6. Workbee becomes a hull / empty-armable / boarding target (gates 6–7)

Spawning workbees as `npcShips`, auto-filling Type X, allowing boarding, or stuffing a “construction pass” into `utilityBook` reopens #50/#51 / #38/#39 / #46/#47. Inventing a pack hull id from `a-73`’s display name does the same.

**Gate:** S24.6.

### 7. Landed-lane sneak / remastered crib (gates 6–7)

Touching EW contest, boarding XOR, Dominion pack gates, flags Thaleron-shipped, ledger combat numbers, empty-armable auto-fill, dockClear, HTML catalogs, Flash price locks, Phase 8 reconstruction costs, or `git am` remastered patches fails even if S24.1 is green. Flipping any `*_LOCKED_FROM_REMASTERED` to true fails the blind rule. Treating the placeholder draw or pack review notes as the S24 Pass also fails — those notes are not a scored visual.

**Gate:** S24.6.

## Probe plan (S24)

**Not in this docs PR.** Add `scripts/test-construction-visuals.mjs` and Chromium S24 on `__BM1_PROBE__.constructionVisuals` **only after** Tenth scopes engine. **Replay S7 + S14–S23** via existing injectors; do not break them.

**Minimum probe additions:**

```js
__BM1_PROBE__.constructionVisuals = {
  snapshot: () => ({
    constructionLockedFromRemastered: false,
    underConstruction: /* bool */,
    language: {
      scaffold: /* true or programmatic */,
      workbee: /* true or programmatic */,
      blueBeam: /* true; color !== repair / phaser gold */,
    },
    assetMissing: /* true if stationconstructing.gif absent */,
    usesRepairArmsArt: false,
    repair: {
      overlayOnPlayerOnly: true,
      overlayUsesConstructionArt: false,
      defensePlatformRepair: false,
    },
    evidence: {
      observedAttacksDelta: 0,
      flashQueued: false,
      projectileAdded: false,
      combatBeamEffectAdded: false,
      stationFired: false,
    },
    fire: { firingSolutionPresent: false, engagementAuthorizedPresent: false },
    site: { dockRefused: true, stationWeaponIds: [] },
  }),
  startBuild: (stationTypeId) => { /* fail setup if missing; must set underConstruction */ },
  completeBuild: () => { /* language stops */ },
};
```

Suggested first Chromium set:

1. **S24.1 / S24.2:** constructing site language vs repair overlay wall.
2. **S24.3 / S24.4:** no Phase 4 write; no FS / `engagement_authorized`.
3. **S24.5 / S24.6:** dock/fire/complete safety; preservation replay; remastered-lock false.

## Recommended implementation order (later engine only)

1. Subscribe `underConstruction`; snapshot lock false; asset-missing honest (S24.1).
2. Keep repair overlay + forbidden-art wall (S24.2).
3. Draw scaffold / workbee / **blue** beams off combat effect lists (S24.3).
4. No FS / `engagement_authorized` (S24.4).
5. Keep dock refuse + station no-fire; language stops on complete (S24.5).
6. Preservation replay S7 / S14–S23 (S24.6). Optional “under construction” site copy. **Not** dockClear polish. **Not** HTML catalogs.

Skip invented workbee hulls, `git am`, `game_items.json` combat retune, EW / boarding / Phase 10 / flags / ledger / empty-armable hooks, Phase 8 reconstruction folds, construction **cost** retune, and Flash price certification entirely.

## Out of scope for the writer of a later slice

Engine work **before** a brief Pass; UI screenshots on this docs PR; dockClear polish; `game_items.json` combat retune; collapsing disruptors; moving Tractor; locking Flash prices; inventing Bajoran Sail / Warp Core ids; shipping Thaleron Test Facility; inventing a workbee hull id; folding `rebuildSystemStations` into `underConstruction`; HTML review catalogs; redoing PR #18 repair arms; `BM1-remastered-work` as source; `git am` remastered patches; remastered base `758665e`; claiming a Referee Pass; reopening #33 / #35 / #37 / #38 / #39 / #40 / #41 / #42 / #43 / #44 / #45 / #46 / #47 / #48 / #49 / #50 / #51; a sixth power consumer; gifted FS / `engagement_authorized` from a blue beam; writing `observedAttacks` / FLASH from construction; wiping delivered reports; flipping `tractorIsBoarding`; rewriting `meetPackPurchaseDecision`; a second Reman id; treating the dashed-ring placeholder as S24.

## Sources

- Proposal: `docs/construction-visuals/BM1-STATION-CONSTRUCTION-VISUALS-PROPOSAL.md`
- Planning: `docs/GUIDED-CONVERGENCE.md` §5; `docs/revised-development-plan.md` §16.2 row 5
- Pack notes: `bm-ships/review-decisions.json` `a-73` / `a-231` / `a-232` / `a-233`; `bm-ships/integration-rules.json` `missingFeatures`
- Side-lane repair (subscribe, do not redo): `docs/side-lane-repair-reman-independence/`; PR #18; S7.4; `src/side-lane-repair-reman.js`
- Landed site flag / placeholder: `src/main.js` at `3933daf` (`underConstruction`, `drawStationConstructionSite`, `fireStationWeapon`, `tryDockAtStation`)
- Phase 4: `src/phase2-security.js`; `src/phase4-incidents.js`; PR #13
- Empty-armable: `docs/empty-armable/`; PR #50 / #51; S23
- Ledger / Tractor: `docs/weapon-ledger/`; PR #48 / #49; S22
- Flags/passes: `docs/flags-passes/`; PR #46 / #47; S21
- EW locked: `docs/phase9/`; PR #33 / #35 / #37 / #42 / #43 / #44 / #45; S14–S20
- Phase 10 locked: `docs/phase10/`; PR #40 / #41; S18
- Boarding: `docs/boarding/`; PR #38 / #39; S17
- Companion shape: `docs/empty-armable/BM1-EMPTY-ARMABLE-ENGINE-DEPENDENCIES.md`; `docs/weapon-ledger/BM1-WEAPON-LEDGER-ENGINE-DEPENDENCIES.md`
