# BM1 world cargo delivery: later-slice dependencies

**Reviewed document:** `BM1-WORLD-CARGO-DELIVERY-PROPOSAL.md`  
**Reviewed against:** `Artemis2028/BM1-bakeoff` at `0534015eea9ca67f185d7cd143031bc294294865` on `main` (25 September 2026), after S33 briefingArchive engine PR #73. Line numbers below refer to this head and may drift.  
**Method:** read the player cargo hold, planet versus station dock, the warp-arrival auto-deliver, Phase 8 once-token, Phase 5 strategic clock, Phase 3 encounter facts, and Phase 6 cloak. No engine changes made. This is a dependency/risk checklist for a **later** writer **if** Tenth scopes a thin subscribe module — not a post-implementation review and not permission to implement before Tenth scopes the lane. **Keep #33–#73 locked.** Do not reopen EW, boarding, Dominion-first, the roster catalog, flags/passes, the weapon ledger, empty-armable, construction visuals, HTML catalogs, economy / difficulty, standing tiers, dockClear, hygiene, alertsActive, away-team XP, the sailor catalog, or the briefing archive. Do not amend S18.18. Do not add `protect-all`. Do not `git am` remastered patches. Do not invent remastered contract ids or costs.

## Verdict in one paragraph

World cargo can stay **docs-only** on this PR. **This PR ships proposal + deps only.** If Tenth later scopes a thin slice, prefer a **sibling book** (`src/world-cargo-delivery.js`, name can change) that **reads** the hold, planet radius, cloak, and checkpoint facts and **writes** `state.worldCargoBook` plus the pods a full delivery clears. Completion is world-body service, not a station hail or station dock, and not warp entry alone. A cloaked drop only moves cargo when it completes a contract already marked covert, paying only that contract’s `covertReward`. It never pays `legalPayout` and never marks an open contract delivered. A cloaked drop of an open contract, and any failed attempt, leaves the pods in the hold and leaves status `open`. Restore keeps one reward per contract and will not turn an open contract covert. It must leave inspection, contraband, and standing untouched. A patrol may record suspicion only and must not set `engagement_authorized`, pursuit, or `firingSolution`. Open delivery may pay the existing +3 once, through `creditWorthwhileTrip`, and no other standing. Deliver-once survives reload and re-dock. An old save loads with no deliveries pending. `SAVE_SLOT_COUNT` stays 3. The book stays outside `systemStates`. `WORLD_CARGO_LOCKED_FROM_REMASTERED === false`. The later engine PR **must not merge** without baseline and after screenshots of an open delivery and a covert drop, plus a no-clip check with `clippedControls: []`. The header strip “Captain aboard Ferengi Cargo Shuttle. Fereng” is pre-existing and out of scope. The load-bearing risks are all the wrong place of completion and the cloak-as-customs leak: paying on warp arrival, paying on a station, stamping `compliance_verified`, clearing contraband, granting standing on a covert drop, paying twice, a fourth save slot, or a reopen of #33–#73.

## Natural later deliverable (say this clearly)

A thin **subscribe module** that publishes proposal §3 (world predicate, station refusal, partial / fail / expire, covert versus open, save) is the natural **S34** deliverable. Market stock, the objective board, checkpoint lifecycle, ROE, and `rosterPlayable` stay untouched.

| S34 is | S34 is not |
| --- | --- |
| Sibling book outside `systemStates` | A second `marketBook` or objective board |
| Completion at `getPlanetDockDistance` of the destination world | Payment because `currentPlanet` matches on warp drop |
| Station hail/dock leaves the contract `open` | A station in-system counting as the world |
| Covert drop while `isHullCloaked`, paying only `covertReward` | A legal payout, a customs stamp, a cleared checkpoint, or a standing write |
| Suspicion note on the book | `engagement_authorized`, pursuit, `firingSolution`, or a third ROE |
| Open +3 only via `creditWorthwhileTrip` once | An issuer bonus, a shop sell, or a second payout |
| `restore(undefined)` → empty book; three existing slots | A fourth slot or a throw on old saves |
| `inspectionCleared` / `customsCleared` forced false | A contraband scanner Phase 3 refused |
| UI host + list + outcome that fit at 1280×720 | A dockClear reopen or a header-strip fix |
| `WORLD_CARGO_LOCKED_FROM_REMASTERED === false` | A remastered `git am` |
| Replay `test:phase10` (S18.18 unchanged) + doctrine + S33 | A Phase 10 or briefing hard-gate reopen |

DockClear polish, a Thaleron facility, a combat retune, an ROE rewrite, a flags-capacity table, or a boarding-odds table, if ever wanted, remain **different** Tenth-scoped lanes.

## What already exists (do not reinvent)

| Need | Engine / docs fact at `0534015` |
| --- | --- |
| Hold | `state.cargoArray` pods `{ tons, item, destination, destinationIndex, payout, contractId }`. `createEmpty` length 10. `cargoCap` default 20. `state.openContracts` / `state.activeContract`. |
| Due test | `isCargoDueAtCurrentPlanet` is destination index (or name) versus `state.currentPlanet` only. Necessary for “which world,” not sufficient for a book contract. |
| Warp auto-pay | `completeWarpTravel` calls `deliverContractIfPossible` after `setPlayerCloak(false, ...)`. That path calls `deliverDestinationCargoAtCurrentPlanet`, which calls `restoreMissingContractCargo` and then pays `pod.payout` and drops matching `openContracts`. |
| Open standing | `deliverContractIfPossible` calls `creditWorthwhileTrip(book, token, () => adjustFactionStanding(getSystemFaction(state.currentPlanet), 3))`. Token today is `contract:${planet}:${before}:${after}`. Book contracts need `world-cargo:${id}` so the pay is once per id. The +3 is the existing rule. Do not add an issuer share. |
| Once-token | `creditWorthwhileTrip` in `src/phase8-markets.js` skips `applyFn` when the token already exists. |
| Shop | `applyShopSell` / `recordShopTrade` move stock. `shopStandingDelta` returns 0 unless `writeStanding` (the landed shop path passes false). Do not call these from completion. |
| Planet service radius | `getPlanetDockDistance` = `max(PLANET_DOCK_DISTANCE, visual * 0.78)` with `PLANET_DOCK_DISTANCE = 126` (`src/main.js`). Use the function. Do not publish a new radius. |
| Planet dock | `tryDockAtPlanetIndex` sets `docked`, `dockedPlanetIndex`, clears `dockedStationId`, and refuses when `getCheckpointDockRefusal` returns a block. |
| Station dock | `tryDockAtStation` opens the station menu and does not deliver cargo. |
| Hail | `hailSelectedShip`. A hail is not world service. |
| Cloak | `isHullCloaked` in `src/phase6-sensors.js`. Warp arrival currently forces the player cloak off **before** the legacy deliver. Covert drop is an in-system action while cloak is on. Do not treat Phase 9.2 silent running as cloak. |
| Checkpoints | `deriveEncounterFacts` returns `inspection_order_active`, `compliance_verified`, `access_clearance`. Phase 3 brief: no contraband detection and no cargo search. `buildShipScanReport` is not a manifest. |
| Phase 5 clock | Strategic jumps advance on completed warp/wormhole only. `resolveTierSlack('standard')` reads `DEFAULT_TIER_SLACK.standard` unless injected. Ordering `tight < standard < soft` stays. Expiry here is not `asset_overdue`. |
| Phase 5 versus freight | Phase 5 proposal already says `openContracts` / player latinum pods are **not** the convoy. Keep that split. |
| Save slots | `SAVE_SLOT_COUNT = 3` (`src/main.js`). `systemStates` is wiped on load. Sibling books already include `marketBook` and `briefingArchive`. |
| UI measure | Phase 9 / dockClear: 1280×720, `clippedControls: []`, host above `.bottom-dock`. DockClear #60 / #61 stays locked. Header strip clip is out of scope. |
| Remastered locks | `MAGNITUDES_LOCKED_FROM_REMASTERED`, `UTILITY_LOCKED_FROM_REMASTERED`, `LEDGER_LOCKED_FROM_REMASTERED`, `EMPTY_ARMABLE_LOCKED_FROM_REMASTERED`, `CONSTRUCTION_LOCKED_FROM_REMASTERED`, `HTML_CATALOG_LOCKED_FROM_REMASTERED`, `ECONOMY_DIFFICULTY_LOCKED_FROM_REMASTERED`, `STANDING_TIERS_LOCKED_FROM_REMASTERED`, `DOCK_CLEAR_LOCKED_FROM_REMASTERED`, `ALERTS_ACTIVE_LOCKED_FROM_REMASTERED`, `AWAY_TEAM_XP_LOCKED_FROM_REMASTERED`, `PHASE10_ROSTER_LOCKED_FROM_REMASTERED`, `BAJORAN_SOLAR_SAILOR_LOCKED_FROM_REMASTERED`, `BRIEFING_ARCHIVE_LOCKED_FROM_REMASTERED` all **false**. |

**Gap this brief closes (docs now; module only if scoped):** there is no **scoreable S34 contract** that completes freight at the destination world, refuses station hail/dock, pays `legalPayout` only on an uncloaked open delivery, and lets a cloaked drop finish only a contract already marked covert — moving cargo without clearing inspection, contraband, or standing, and without authorizing fire.

## Hooks the writer will have to touch

**This PR touches none of these.** If Tenth later scopes a thin subscribe module:

Prefer **one new file** rather than growing `phase8-markets.js`, `phase5-objectives.js`, or `phase3-checkpoints.js` into a delivery office:

| Proposed file | Responsibility |
| --- | --- |
| `src/world-cargo-delivery.js` (name can change) | `WORLD_CARGO_LOCKED_FROM_REMASTERED === false`; `emptyWorldCargoBook` / serialize / restore (forces cleared flags false); `evaluateWorldService`; `completeWorldCargo`; `noteStationNotWorld`; `expireDueContracts`. **No** fire write. **No** encounter write. **No** covert standing write. |
| `src/main.js` | Thin: create/restore sibling `state.worldCargoBook` **beside** existing books; skip book-owned ids in `deliverDestinationCargoAtCurrentPlanet` and `restoreMissingContractCargo`; call open completion from successful destination planet dock; call covert completion from the drop control; expire on the completed-jump path; `saveGame` / `loadGame` / `resetRunState`; `__BM1_PROBE__.worldCargo`. **Do not** change `SAVE_SLOT_COUNT`. **Do not** dockClear-reflow. **Do not** edit the header strip. |
| Panel markup / CSS | Host `#world-cargo`, `.world-cargo-contracts`, `.world-cargo-outcome`. Fit only. Open and covert outcome sentences stay visible. |
| Optional `scripts/test-world-cargo-delivery.mjs` | Offline: world versus station, cloak pays no `legalPayout`, cargo-only drop, suspicion is not authority, own reward once, reload and re-dock pay 0, old-save `deliveriesPending` is 0, lock false. |
| `scripts/behavior-probe.mjs` | Add S34 **after** scope. **Replay** S18 including S18.18 and S33. Do not edit S18.18’s expected `dominion-first`. |

Do **not** implement this inside `src/phase8-markets.js`, `src/phase5-objectives.js`, `src/phase3-checkpoints.js`, `src/phase6-sensors.js`, `src/briefing-archive.js`, or `src/dock-clear.js` beyond a **read** or the book-id skip. Do **not** `git am` remastered patches.

| Existing path | Required integration (later S34) |
| --- | --- |
| `getPlanetDockDistance` / `tryDockAtPlanetIndex` | **Read** the radius. Open completion runs only after a successful planet dock at `targetIndex`. Fail if a station id is set. |
| `tryDockAtStation` / hail | **Do not** complete. Record `station-not-world` or `hail-not-world`. |
| `deliverDestinationCargoAtCurrentPlanet` | **Skip** pods whose `contractId` is in the book (no refill, no pay). Legacy pods keep today’s payout. Fail if a book id still pays on warp arrival. |
| `creditWorthwhileTrip` | **Uncloaked open completion only,** token `world-cargo:${id}`, callback the existing +3. Fail if a cloak calls it, pays `legalPayout`, or calls `adjustFactionStanding`. |
| `applyShopSell` / market stock | **Untouched** by completion. Fail if a drop changes `stock` or `demand`. |
| `deriveEncounterFacts` / `closeEncounter` | **Read** facts. Fail if a drop writes them or closes the encounter. |
| `getCheckpointDockRefusal` | **Keep** as the open-dock block. A refusal is `checkpoint-refused`, not delivery. |
| `isHullCloaked` | **Read.** Fail if silent running counts as covert, if an open contract becomes `delivered` while cloaked, or if that drop pays `legalPayout`. |
| `resolveTierSlack('standard')` | **Read** for the default slack. Fail if expiry emits `asset_overdue` or uses `performance.now()`. |
| `injectDiscovery` / `rosterPlayable` / `ROE_MODES` | **Untouched.** Fail if any changes. |
| `saveGame` / `loadGame` / `resetRunState` | New sibling key. Missing key → empty. `SAVE_SLOT_COUNT` stays 3. |
| `__BM1_PROBE__.briefingArchive` / `.phase10` | Keep. Add `.worldCargo`. S18.18 still reads dominion scope. |

## Risks

| Risk | Why it fails a gate |
| --- | --- |
| Warp arrival still pays book pods | Gate 1. `completeWarpTravel` sets `currentPlanet` outside the world radius and drops cloak first. |
| Cloak pays `legalPayout` or marks an open contract delivered | Gate 2. That is the inspection-skip exploit. |
| Reload or re-dock pays the token again | Gate 6. `completionToken` must still be on the book after load. |
| Old save restores a pending delivery | Gate 6. Missing key is an empty book and `deliveriesPending === 0`. |
| Suspicion sets a lock or a third ROE | Gate 4. The note is not `consultDoctrineFire`. |
| Station inside the planet radius counts as the world | Gate 1. `dockedStationId` must fail closed. |
| Covert drop sets `compliance_verified` or `access_clearance` | Gate 3. That is customs. |
| Covert drop calls the +3 callback | Gates 3 and 4. |
| `restoreMissingContractCargo` reloads a delivered book pod | Gates 5 and 6. A second pay, or a partial that refills itself. |
| Book stored on `systemStates` | Gate 6. Load wipes it and can strand or revive a token. |
| Outcome text clipped, or no covert shot | Gate 7. Header strip is not a substitute and not a defect of this package. |
| Editing `deliverContractIfPossible` payout math for legacy pods | Gate 8. The allowed edit is the book-id skip only. |
| Copying a remastered freight id or flipping a lock flag | Gate 9. |

## Probe hook sketch (later)

`__BM1_PROBE__.worldCargo` may expose `evaluate`, `complete`, `drop`, `noteStation`, `noteSuspicion`, `expire`, `snapshot`. Snapshot fields a scorer needs: `atWorld`, `status`, `mode`, `reason`, `latinumDelta`, `legalPayoutDelta`, `covertRewardDelta`, `countedAsLegal`, `standingDelta`, `inspectionCleared`, `customsCleared`, `contraband`, `encounterFacts`, `suspicionOnly`, `firingSolution`, `engagement_authorized`, `pursuit`, `roeModes`, `offersProtectAll`, `completionToken`, `deliveriesPending`, `saveSlotCount`, `bookInsideSystemStates`. This docs PR does not add the hook.
