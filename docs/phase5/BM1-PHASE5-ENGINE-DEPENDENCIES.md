# BM1 Phase 5 proposal: engine dependencies

**Reviewed document:** `BM1-PHASE5-PERSISTENT-CONVOY-DISTRESS-PROPOSAL.md`  
**Reviewed against:** `Artemis2028/BM1-bakeoff` at `72cc984` on `main` (12 September 2026), after Phase 4 engine and side-lane slices 1–2 (PRs #18 / #19). Line numbers below refer to this head and may drift.  
**Method:** read the landed Phase 1–4 modules, side-lane unrest/repair helpers, travel/antimatter/route planner, save/load, and ambient traffic. No engine changes made. This is a dependency/risk checklist for a later writer, not a post-implementation review and not permission to implement before Tenth scopes the lane.

## Verdict in one paragraph

The proposal can be implemented without a rewrite and without a second civilian sim. The board should copy the Phase 3/4/side-lane pattern that already works: versioned state beside `incidentLedger` / `unrestIndependence`, strategic clock from `incrementStrategicJumps` (already called on completed warp/wormhole only), identity on stable assignment IDs — never inside `systemStates`, never on recycled `npc.id`. Reachable urgency is a thin function over `getPlottedRoute().antimatter`, `state.antimatter` / `state.antimatteruse`, and assigned escorts — not a new galaxy model. The load-bearing risks are all integration mistakes: ticking the clock on load; storing the board in the scene cache; treating unload as overdue; setting `destroyed` / `attackerId` when a window burns; feeding `evaluateReact` global board truth; converting every civilian into a convoy timer; calling `applyKillStanding` again; soft-resetting `deadlineAt` on a hull swap; one global timer instead of tiers.

## What already exists (do not reinvent)

| Need | Engine fact at `72cc984` |
| --- | --- |
| Durable store outside the scene cache | `state.incidentLedger` (`src/phase4-incidents.js`), `state.unrestIndependence` (`src/side-lane-unrest-independence.js`), `state.playerUnlocks`. All three serialize in `saveGame` / restore in `loadGame`. `state.systemStates = {}` still runs on data load (~3109), station/wormhole build, `loadGame` (~11459) and `resetRunState`. |
| Strategic jump counter | `incrementStrategicJumps(ledger)` (`src/phase4-incidents.js` ~578). Called from `completeWarpTravel` when `from !== to` (~12431–12433) and from `completeWormholeTransit` (~3627). `loadGame` restores the ledger and sets `state.warp.active = false` (~11454) **without** incrementing. |
| Warp / wormhole start ≠ complete | `state.warp` / `state.wormholeTransit` hold in-flight flags. `clearWormholeTransit` (~3700) does not tick. Same-system warp is skipped. Ambient `scheduleAmbientTrafficWarp` / `beginAmbientTrafficArrival` (~15350, ~15388) must **not** be wired to the player clock. |
| Route cost vs AM | `WARP_RANGE_PER_ANTIMATTER = 95` (~236). `getPlottedRoute` (~3778) returns `antimatter: getRouteCostForDistance(distance)` (`ceil(distance / 95)`). `getPlottedRouteStatus` (~3832) compares ship range + fuel range. `getAntimatterWarpRange` = `floor(AM) * 95` (~3520). `state.antimatteruse` from `stats.antimatterUse` (~3938). `state.fuelCap` ≈ `antimatteruse * 30` (~3972). |
| Fleet escorts | `state.playerFleet`; live `role === 'playerEscort'`. Mean capacity is **assigned-to-this-objective** only (proposal Q6 default). |
| Incident / report / react | `openIncident`, `deliverReport`, `observerCopies`, `evaluateIncidentReact`, `createIncidentObjective`, `rememberPunishment`. Kinds already include `distress` and `destruction`. **No** `asset_overdue` kind on the ledger yet. |
| Doctrine event | Pack `eventContracts.asset_overdue` + acceptance fixtures. Runtime `evaluateReact` can receive `asset_overdue` if the adapter maps it. Side-lane exports `ASSET_OVERDUE_IMPLEMENTED = false` / `PHASE5_ASSET_OVERDUE = 'asset_overdue'` (~77–80) as the explicit boundary. |
| Punishment once | `ledger.punishmentTokens`. `destroyNpcShip` / `destroyStation` already stamp Phase 4 tokens. |
| Lounge + contract civilians | `CIVILIAN_PURPOSES`, `CONTRACT_ROLE = 'commerceContract'`, `injectLoungeAndContract`, `failCivilianDelivery`, `raiseUnrestFromCommerceFailure`, `relieveUnrest`. Fixture-level; **not** campaign convoy bookkeeping. |
| Pirates as pressure | Faction `pirate`; predation facts in `consultDoctrineFire` (~6108+). Unrest writers `raiseUnrestFromPiratePresence` / `clearPirates`. Flavor `randomTravelEvent` pirate cargo loss (~12272) is **not** an attacker ID. |
| Player latinum contracts | `state.openContracts` / `activeContract` / `normalizeContract` (~7916). Separate. Do not promote. |
| Visitor identity | `assignNpcSecurityInstance` / `nextSecurityInstanceId`. `beginAmbientTrafficArrival` force-news the instance. |
| Probe surface | `globalThis.__BM1_PROBE__`. S8 should extend this object rather than scrape private state. |

## Hooks the writer will have to touch

Prefer a new `src/phase5-objectives.js` (board, tokens, urgency math, close-once) plus thin `main.js` integration, matching Phase 2/3/4 / side-lane splits. Do **not** implement overdue inside `src/side-lane-unrest-independence.js` as a sneak path.

| Existing path | Required integration |
| --- | --- |
| `incrementStrategicJumps` / `completeWarpTravel` / `completeWormholeTransit` | After a **successful** increment, notify the board: burn remaining on open objectives. **Do not** add a second increment. Do not call from load, cancel, ambient warp, or `state.day += 1`. |
| `loadGame` / `saveGame` / `resetRunState` | Serialize `objectiveBoard`. Load still wipes `systemStates` first; restore board **after** the ledger; do **not** increment jumps; do **not** burn deadlines. |
| `beginAmbientTrafficArrival` | New instance must not inherit convoy blame, overdue identity, or a closed token’s hull. Must not open overdue because the old slot left. |
| `destroyNpcShip` / `destroyStation` | If the hull was on an assignment, set `truth.destroyed` only here; reuse Phase 4 `punishmentToken`; close-once. Do not open overdue-as-destroyed. |
| `applyKillStanding` / `adjustFactionStanding` | Board / overdue / report code must call the existing “already charged?” wrapper, not the raw adjuster. |
| `deliverReport` / `evaluateIncidentReact` | Map `asset_overdue` / `distress`. Facts from observer copies only. Fold `protect` (S6.13 still closed). |
| `updateNpcShips` / `incidentObjective` | Pirates with knowledge may take a campaign shadow/raid objective **without** a new fire grant. Patrol/relief reuse Phase 4 movement. |
| `getPlottedRoute` / `getPlottedRouteStatus` / `state.antimatter` / `state.antimatteruse` / assigned escorts | `reachableUrgency(objective, playerOrEscorts)` on open and on hull/fleet change. Recalc capacity; **do not** move `openedAt` / `deadlineAt`. |
| `applyCurrentShipStats` / fleet assign/dismiss | Trigger urgency recalc. |
| Side-lane `failCivilianDelivery` / `relieveUnrest` / `injectLoungeAndContract` | Optional named writes on loss / deliver. Keep lounge+contract coexist (S8.10 / S7.22). Do not convert all `traffic` / `localTraffic`. |
| `ASSET_OVERDUE_IMPLEMENTED` | Flip only when the board actually implements the event. Do not leave the flag true with no close-once. |
| `__BM1_PROBE__` | Snapshot board, tokens, jumps, remaining, tiers, reachable, standing, `destroyed` / `attackerId`, civilian role counts, last react. Inject shortage/convoy/overdue; fail setup if missing. |

Do **not** hook `buildShipScanReport`, `allowsRoutineGenerator` (pirate or investigator navy), `loadShipCatalog`, or independence mint / breakaway profiles.

## Risks

### 1. Clock ticks on load, cancel, or ambient warp

`loadGame` already clears `warp.active` without incrementing. A writer who burns “because travel was interrupted” or who subscribes `state.day` / `randomTravelEvent` fails gates 1 and 7. Ambient traffic warp is easy to mistake for a strategic tick.

**Gate:** S8.1, S8.2, S8.12.

### 2. Board inside `systemStates` / keyed on `npc.id`

Load wipes the scene cache. Ambient replacement reuses `npc.id`. Either mistake respawns a closed convoy or transfers overdue onto a newcomer.

**Gate:** S8.3, S8.4.

### 3. Unload or burned window ⇒ destroyed / attacker

`randomTravelEvent` already logs a flavor pirate cargo loss on some jumps. Wiring that line (or scene unload) to `truth.attackerId = 'pirate'` or `destroyed: true` fails gates 3 and 6. Same fail: FLASH copy that names a killer.

**Gate:** S8.5, S8.6, S8.13. One’s soft: “missing” phrasing only if the model stays clean.

### 4. Global truth into `evaluateReact`

Phase 4 already failed this if every same-flag ship “knew” the incident. Reading `objectiveBoard.truth` as pirate/patrol facts collapses S8.7–S8.8. `event_known` must come from a delivered report or in-system detection.

Pack `protect` on overdue (Tholian tender fixture) still folds to `record_only` unless a later scoped brief allowlists it. Do not reopen S6.13.

**Gate:** S8.7, S8.8.

### 5. Second civilian sim / all-freighter

Rewriting `traffic` / `localTraffic` into convoy timers fails gate 5 and S7.22. Attach an assignment to a **contract** civilian; leave lounge in the same system.

**Gate:** S8.10.

### 6. Double standing

A naive “faction hates this overdue” handler will hit `adjustFactionStanding` after `destroyNpcShip` already paid. Capture standing before/after report + react.

**Gate:** S8.9.

### 7. Soft-reset on hull / fleet change

`applyCurrentShipStats` already rewrites `antimatteruse` and `fuelCap`. Recalc that **refreshes** `deadlineAt = now + fullBudget` (or zeroes `burnedJumps`) fails gate 7. Remaining may shrink if the writer also moves the absolute deadline earlier — prefer: **never move `deadlineAt` later**; recalc only `capacityJumps` / `reachable` / sayable route cost.

**Gate:** S8.11.

### 8. One global timer

A single `state.nextDeadlineJumps` shared by convoy rescue and soft patrol overdue fails gate 8 even if the number is “reachable.”

**Gate:** S8.14.

### 9. Free replacements / spawn from reports

`allowsRoutineGenerator` or a jump-in `beginAmbientTrafficArrival` that mints a fresh freighter “because the assignment is still open” after close-once fails gate 2. Absent patrol → defer, not spawn (Phase 4 risk 7, still closed).

**Gate:** S8.4, S8.8.

### 10. Latinum `openContracts` confusion

`deliverContractIfPossible` / `normalizeContract` look like convoys. Promoting them silently skips stable campaign IDs and close-once.

**Gate:** process lock; S8.3.

### 11. Side-lane / catalog creep

Implementing overdue inside the unrest module, flipping temperament maps, wiring 212 hulls, or shipping authored breakaway profiles fails the process locks and S8.16.

### 12. `performance.now()` deadlines

Phase 4 already warned: tab throttle desyncs. Urgency must use `incidentLedger.strategicJumps`, not wall clock.

## Probe plan (S8)

Add `scripts/test-phase5-objectives.mjs` for offline board / token / urgency-math tests (like `test-phase4-incidents.mjs` / `test-side-lane-unrest-independence.mjs`) and Chromium S8 cases on `__BM1_PROBE__`.

**Minimum probe additions:**

```js
__BM1_PROBE__.phase5 = {
  snapshot: () => ({
    board: serializeObjectiveBoard(state.objectiveBoard),
    strategicJumps: state.incidentLedger?.strategicJumps || 0,
    standing: { ...state.factionStanding },
    civilianRoles: countCivilianRoles(state.npcShips, state.unrestIndependence?.civilians?.[worldKey(state.currentPlanet)]),
    mayAutoEngage: playerForceMayAutoEngage(...),
    log: state.log
  }),
  injectShortageAndConvoy: (opts) => { /* fail setup if board helper missing */ },
  completeJump: (kind) => { /* warp | wormhole; fail if increment did not run */ },
  cancelTravel: () => { /* no-op increment */ },
  burnWindow: (objectiveId) => { /* completed jumps or inject remaining=0 */ },
  changeHull: (shipId) => { /* recalc urgency */ },
  assignEscorts: (ids) => { /* mean capacity */ },
  deliverReportTo: (observerKey, incidentId) => {},
  lastReact: (observerId) => observerCopies[observerId]?.lastDecision
};
```

Run, in order: existing `test:phase1`, `test:phase3`, `test:phase4`, `test:doctrine`, side-lane tests, `probe` (S4–S7), then new S8. A path that increments jumps on load, sets `attackerId` from overdue, or changes `mayAutoEngage` without Phase 2 evidence is a blocker.

Suggested first Chromium set (fatal integrations):

1. **S8.1 / S8.2 / S8.12:** warp complete +1; wormhole complete +1; load / cancel 0.
2. **S8.3 / S8.4 / S8.5:** save / wipe `systemStates` / reload same IDs; close-once; unload does not overdue.
3. **S8.6 / S8.9 / S8.13:** burned window overdue once, not destroyed, standing unchanged; credited kill standing once.
4. **S8.7 / S8.8:** knowing pirate vs ignorant pirate; knowing relief vs `record_only` / `ignore_unknown`; no spawn.
5. **S8.11 / S8.14:** hull/escort recalc without `deadlineAt` refresh; tight budget < soft budget.
6. **S8.10 / S8.16:** lounge + contract coexist; Phase 1–4 / side-lane asserts still green.

## Recommended implementation order (dependencies)

1. Empty `objectiveBoard` + close tokens + save/load (S8.3–S8.4). No actors.
2. Subscribe **only** to existing `incrementStrategicJumps` (S8.1–S8.2, S8.12).
3. One shortage + one convoy assignment + player deliver/ignore (S8.15). Attach to side-lane contract role; keep lounge (S8.10).
4. Overdue / distress via Phase 4 ledger (S8.5–S8.6, S8.13). Flip `ASSET_OVERDUE_IMPLEMENTED` here, not earlier.
5. Knowledge-scoped pirate + patrol/relief (S8.7–S8.8). Punishment reuse (S8.9).
6. Reachable urgency + tiers (S8.11, S8.14).

Skip (5) if (1)–(4) are not green. Skip catalog, breakaway profiles, and unrest retunes entirely.

## Out of scope for the writer of a later slice

`BM1-remastered-work`; claiming a Referee Pass; doctrine JSON culture→empire edits; weapon tables; cloak/sensors; deep-space POIs as a required first slice; wiring 212 hulls; authored breakaway profiles; inventing unrest thresholds or lounge:contract ratios; setting `hostile` / `attackId` / `destroyed` from overdue, unload, cancel, load, or a burned window; a second civilian sim; promoting `openContracts` pods; ticking the clock from ambient warp or `state.day`; soft-resetting urgency on hull change; one global deadline.

## Sources

- Proposal: `docs/phase5/BM1-PHASE5-PERSISTENT-CONVOY-DISTRESS-PROPOSAL.md`
- Plan §4 / §7: `docs/revised-development-plan.md`
- Doctrine: `docs/doctrine/DESIGN-doctrine-v0.2.1.md` (`asset_overdue`); `src/doctrine.js` (`evaluateReact`)
- Phase 4: `src/phase4-incidents.js` (`incrementStrategicJumps`, tokens, reports, react)
- Side-lane: `src/side-lane-unrest-independence.js` (`ASSET_OVERDUE_IMPLEMENTED`, lounge/contract, pirate pressure)
- Travel / AM / save: `src/main.js` (`completeWarpTravel`, `completeWormholeTransit`, `getPlottedRoute`, `loadGame`, `beginAmbientTrafficArrival`, `randomTravelEvent`)
- Phase 4 companion shape: `docs/phase4/BM1-PHASE4-ENGINE-DEPENDENCIES.md`
