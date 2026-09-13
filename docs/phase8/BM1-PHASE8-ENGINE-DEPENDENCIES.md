# BM1 Phase 8 proposal: engine dependencies

**Reviewed document:** `BM1-PHASE8-ECONOMY-TRADE-PROGRESSION-PROPOSAL.md`  
**Reviewed against:** `Artemis2028/BM1-bakeoff` at `ca2645d` on `main` (13 September 2026), after catalog wire + standing tiers (PR #28) and Phase 7 fleet orders (PR #29). Line numbers below refer to this head and may drift.  
**Method:** read the landed Phase 5 board, catalog-wire purchase path, Reman meeting, planet markets, claim/occupy, travel flavor, repair, and Phase 7 orders. No engine changes made. This is a dependency/risk checklist for a later writer, not a post-implementation review and not permission to implement before Tenth scopes the lane.

## Verdict in one paragraph

The proposal can be implemented without a rewrite, without a second catalog, and without touching convoy overdue. The market book should copy the Phase 4/5 pattern that already works: versioned state beside `objectiveBoard` / `incidentLedger`, strategic ticks only from `incrementStrategicJumps`, identity on stable location/good IDs — never inside `systemStates`. Restriction kinds are a thin classifier in front of the **already distinct** purchase reasons (`funds` / `faction-standing` / `access-locked` / `region`). The load-bearing risks are all integration mistakes: restocking on load or `state.day`; writing standing from buy/sell; treating a premium as an embargo lift; selling Reman 53 on a black market; forking a second shortage ledger; claiming holdings as free income; silently superseding Phase 7 orders to “collect upkeep.”

## What already exists (do not reinvent)

| Need | Engine fact at `ca2645d` |
| --- | --- |
| Durable store outside the scene cache | `state.incidentLedger`, `state.objectiveBoard`, `state.unrestIndependence`, `state.playerUnlocks`, `state.fleetOrders`. All serialize in `saveGame` / restore in `loadGame`. `state.systemStates = {}` still runs on data load, station/wormhole build, `loadGame`, and `resetRunState`. |
| Phase 5 shortage writes | `src/phase5-objectives.js`: shortage `filled` / `worsened`; close tokens; `truth.shortageFilled`. Escort / independent deliver / exploit already named. **Subscribe.** Do not retune. |
| Strategic clock | `incrementStrategicJumps` on completed inter-system warp / wormhole only. `loadGame` restores without increment. Cancel / same-system warp / ambient warp do not tick. |
| Catalog wire + standing tiers | `src/ship-catalog-wire.js`: `CATALOG_WIRED`, `PURCHASE_TIER_STANDING` (0/15/30/50/75/100), `HOME_FACTION_STANDING = 20`, `evaluateWiredPurchase`, `catalogPurchaseContext` (`tierThresholds`). Live yards use `loadShipCatalog()`. S11 green. |
| Reman meeting | `meetPackPurchaseDecision` in `src/side-lane-repair-reman.js`. Hull **53 / `bm-ship:53`**. Remus is a vendor note. Granted access survives off-Remus. S7.8 / S11.2–S11.3. |
| Purchase reasons already split | `wiredPurchaseRefusal` (`src/main.js` ~12229): `access-locked`, `faction-standing`, `funds`, `region` / `restricted-stock`, `unavailable`. **Do not collapse these.** |
| Independent / Concord vendors | `INDEPENDENT_ENDGAME_VENDOR`, `PASO_PROJECT_X_VENDOR`, `REMUS_SECRET_VENDOR`. `neutral` standing = independent trade trust, not a side. |
| Infinite-ish goods markets (replace as source of truth) | `state.planetMarkets` — eight seeded `{ goods, price }` rows, persist in save, **no stock/demand**. `buyMarketGood` / `sellMarketGood` (~13577, ~13606) each `adjustFactionStanding(..., 1)` — **the prestige loop**. `updatePlanetMarketVariance` (~13385) wobbles price on jump; called from warp complete (~13989) with `state.day += 1`. |
| Player latinum contracts | `state.openContracts` / `deliverContractIfPossible` (~13736) / +3 standing on deliver (~13739). Separate from Phase 5 convoys. Consumed-once by contract id. |
| Hail trade | `createShipHailSession` — seeded infinite NPC goods, latinum only, no standing. |
| Port refuse ancestor | `serviceRefusal` (~7598): hostile standing, Cardassian/Romulan feat unlocks, plus Phase 3 `visitorDeniedServices`. |
| Claim / occupy | `getSystemClaimCost` / `claimCurrentSystem` (~11193, ~11320): one-time latinum+duranium. `controlledSystems.push`. Building a station also claims (~10738). **No** garrison/supply/reconstruction/stabilization. Flag plant (~7614): −8 sovereign / +12 planted faction. |
| Repair / refuel | `repairHull` (~13824) latinum-per-percent at `repairCapable` docks. `refuel` (~13801) 1 latinum per antimatter. Side-lane `evaluateRepairStart` unchanged. |
| Jump flavor income | `randomTravelEvent` (~13778): ~15% salvage latinum. Transport mission (~13660): often +latinum. |
| Fleet orders | `src/phase7-fleet.js`. Hold-outside persists; interrupt resumes standing (S12.7). Upkeep must not `supersede` that row. |
| Standing once | `applyKillStanding` + Phase 4 `punishmentTokens` / `applyStandingOnce`. |
| Probe surface | `globalThis.__BM1_PROBE__`. S13 should extend this object (`phase8`) rather than scrape private state. `test:catalog` already covers wire. |

## Hooks the writer will have to touch

Prefer a new `src/phase8-markets.js` (book, clamps, restriction classifier, upkeep record, standing cap) plus thin `main.js` integration, matching Phase 2–7 splits. Do **not** implement markets inside `src/phase5-objectives.js` as a sneak rewrite. Do **not** edit `meetPackPurchaseDecision` unless a probe-only fixture needs a read.

| Existing path | Required integration |
| --- | --- |
| Phase 5 fill / worsen / close | After a **successful** named write, notify the book: clamp stock/demand. **Do not** change tokens, overdue, or `attackerId`. |
| `incrementStrategicJumps` / `completeWarpTravel` / `completeWormholeTransit` | Optional compact tick (decay toward authored equilibrium **inside clamps**). **Do not** add a second increment. Do not restock from `state.day` or `updatePlanetMarketVariance`. |
| `buyMarketGood` / `sellMarketGood` | Decrement/increment **stock**; refuse when empty or restricted; **stop** raw +1 standing. Cap any leftover shop standing at Trusted (15); reversal writes **0**. |
| `deliverContractIfPossible` / Phase 5 independent deliver | Keep worthwhile-trip standing **once**. Do not also fire shop +1. |
| `evaluateWiredPurchase` / `getShipPurchaseStatus` | Leave hull reasons intact. Good-level embargo/license is a **new** check on cargo deals, not a new Reman path. |
| `serviceRefusal` / Phase 3 dock deny | Map into `seller_rule` / access. Do not convert to premium-only. |
| `claimCurrentSystem` / station-build claim / `plantFlagForEmpire` | After control, mint a holding-obligation record. Flag plant still must not grant catalog trust. |
| `repairHull` / `refuel` / escort hire | Read supply/upkeep. May premium or refuse. Keep `repairCapable` as the physical gate. |
| `randomTravelEvent` / transport mission | Cap or diminish latinum. Pirate flavor still must not set `attackerId`. |
| Phase 7 `issueOrder` / interrupt resume | Upkeep charge or readiness flag only. Do not change `kind` / `status` as a side effect of tax. |
| `loadGame` / `saveGame` / `resetRunState` | Serialize `marketBook` (+ obligation record). Load still wipes `systemStates` first; **do not** increment jumps; **do not** restock. |
| `__BM1_PROBE__` | Snapshot stock/demand/clamps, restriction kind, standing before/after shop, Reman decision reasons, holding upkeep, last Phase 5 token, fleet order kind. Inject market + wartime ports + neglected holding; **fail setup if missing**. |

Do **not** hook `buildShipScanReport`, `loadShipCatalog` as a rewrite, independence mint, `allowsRoutineGenerator` (free garrison navy), or weapon tables.

## Risks

### 1. Restock on load, cancel, day, or variance (gate 1)

`updatePlanetMarketVariance` already runs on warp complete next to `state.day += 1`. Wiring “new day = full stock” or regenerating `planetMarkets` on `loadGame` fails finite markets and the jump-farm gate.

**Gate:** S13.1–S13.3, S13.10.

### 2. Phase 5 fork or overdue-from-price (gate 6)

A writer who opens a second shortage ledger, moves `deadlineAt`, or sets `destroyed` / `attackerId` because stock hit zero fails Phase 5 preservation. Subscribe to fill/worsen only.

**Gate:** S13.3, S13.14.

### 3. Premium used as a ban bypass (gate 2)

`if (credits > embargoPrice) allow` is the hard fail. Imperial wartime yards must refuse. Only the named neutral/black-market fixture may sell at premium/license.

**Gate:** S13.4, S13.5.

### 4. Collapsing purchase reasons / second Reman bypass (gates 3, 6)

Black-market cargo must not call `evaluateWiredPurchase(53)` with a “wartime exception” that returns allowed. Do not treat `prestige-threshold-unconfigured` as a new unlock. Do not fold `funds` and `faction-standing` into one “too expensive” string.

**Gate:** S13.6, S13.15.

### 5. Independent as alliance or immunity (gate 3)

Using `neutral >= 15` to skip an Earth embargo, or treating Concord vendor as open to all independents, fails local explainable restrictions.

**Gate:** S13.7, S13.8.

### 6. Shop standing loop left on (gate 4)

If `buyMarketGood` still calls `adjustFactionStanding(..., 1)`, S13.9 fails even if a cap helper exists elsewhere. Hail trade growing a standing write would also fail.

**Gate:** S13.9, S13.17.

### 7. Jump / dock infinity (gate 4)

Unbounded salvage + transport + free repair at every owned dock + free garrison on jump is the snowball the exit forbids. Zero upkeep for parked Phase 7 wings is the same family.

**Gate:** S13.10, S13.16.

### 8. Charter-only conquest (gate 5)

Leaving `claimCurrentSystem` as a one-time 2500× multiplier with no obligation record fails “holdings are responsibilities.” Auto-claim from `confirmPendingStationBuild` must mint the same record.

**Gate:** S13.11, S13.12.

### 9. Unwinnable neglect or unrest retune (gate 5 + process)

A neglect spiral that zeros hull/antimatter with no recovery, or a silent rewrite of side-lane unrest thresholds, fails recovery and the process lock.

**Gate:** S13.13. Q7 default: optional named writer only.

### 10. Board inside `systemStates` / keyed on `npc.id`

Same Phase 3/4/5 landmine. Load wipes the cache; ambient reuse transfers stock to a newcomer.

**Gate:** S13.2–S13.3.

### 11. Double standing / embargo-as-aggression

An embargo FLASH that calls `adjustFactionStanding` after a tokenized kill, or that writes `observedAttacks`, fails Phase 4/3 preservation.

**Gate:** S13.15.

### 12. `openContracts` promotion

`normalizeContract` looks like a market. Promoting pods skips Phase 5 tokens and finite stock.

**Gate:** process lock; S13.3, S13.17.

## Probe plan (S13)

Add `scripts/test-phase8-markets.mjs` for offline book / clamp / restriction-kind / standing-cap tests (like `test-phase5-objectives.mjs` / `test-catalog-wire.mjs`) and Chromium S13 cases on `__BM1_PROBE__`.

**Minimum probe additions:**

```js
__BM1_PROBE__.phase8 = {
  snapshot: () => ({
    book: serializeMarketBook(state.marketBook),
    standing: { ...state.factionStanding },
    reman: evaluateWiredPurchase(state.shipCatalog, 53, state.playerUnlocks, currentCatalogPurchaseContext()),
    holding: serializeHoldingObligations(state.currentPlanet),
    fleetKind: findOrderForShip(ensureFleetOrders(), escortId)?.kind,
    strategicJumps: state.incidentLedger?.strategicJumps || 0,
    lastPhase5Token: /* close token if any */,
    log: state.log
  }),
  injectMarket: (opts) => { /* fail setup if book helper missing */ },
  injectWartimePorts: () => { /* imperial vs neutral */ },
  applyPhase5Fill: (shortageId) => {},
  applyPhase5Worsen: (shortageId) => {},
  shopBuySell: (good) => {},
  completeJump: (kind) => {},
  claimOrInjectHolding: () => {},
  setObligations: (flags) => {},
  lastRefuseKind: () => {}
};
```

Run, in order: existing `test:phase1`, `test:phase3`, `test:phase4`, `test:phase5`, `test:phase6`, `test:phase65`, `test:phase7`, `test:catalog`, `test:doctrine`, side-lane tests, `probe` (S4–S12), then new S13. A path that restocks on load, allows Reman for latinum, or changes `mayAutoEngage` from an embargo is a blocker.

Suggested first Chromium set (fatal integrations):

1. **S13.1 / S13.2 / S13.3:** fill clamps; worsen clamps; closed token does not reprint.
2. **S13.4 / S13.5 / S13.8:** four kinds; wartime imperial refuse vs neutral premium; local not global.
3. **S13.6 / S13.7 / S13.15:** three Reman/money/standing reasons; independent not immune; no hull-53 black market; no double standing.
4. **S13.9 / S13.10 / S13.17:** shop reversal standing 0 / cap 15; jumps do not reprint infinity; delivery pays once.
5. **S13.11 / S13.12 / S13.13 / S13.16:** neglected holding no snowball; recovery exists; hold-outside kind unchanged.
6. **S13.14 / S13.18:** S8/S11/S12 still green; cheaper hull still has a job.

## Recommended implementation order (dependencies)

1. Empty `marketBook` + clamps + save/load (S13.1–S13.3). No standing writes.
2. Subscribe **only** to Phase 5 fill/worsen (S13.14).
3. Restriction classifier on cargo deals (S13.4–S13.5, S13.8). Hull path untouched.
4. Remove shop +1 standing; cap Trusted (S13.9, S13.17).
5. Bound jump/dock farms (S13.10).
6. Holding obligation record on claim/build (S13.11–S13.13). Fleet upkeep without order mutate (S13.16).

Skip (6) if (1)–(4) are not green. Skip catalog, Reman, and unrest retunes entirely.

## Out of scope for the writer of a later slice

`BM1-remastered-work`; claiming a Referee Pass; rewriting `meetPackPurchaseDecision`; retuning `PURCHASE_TIER_STANDING`; Phase 5 overdue/clock edits; weapon tables; boarding; flags/passes inventory; difficulty knobs that change ownership; setting `hostile` / `attackId` / `destroyed` from an embargo, a market dip, or a jump; a second civilian sim; promoting `openContracts`; restocking from ambient warp or `state.day`; infinite shop prestige; free garrison navies; a second Reman id.

## Sources

- Proposal: `docs/phase8/BM1-PHASE8-ECONOMY-TRADE-PROGRESSION-PROPOSAL.md`
- Plan §4 / §10: `docs/revised-development-plan.md`
- Catalog / standing: `src/ship-catalog-wire.js`; `scripts/test-catalog-wire.mjs`; `docs/SHIP-ECONOMY-REVIEW.md`
- Reman: `src/side-lane-repair-reman.js` (`meetPackPurchaseDecision`)
- Phase 5: `src/phase5-objectives.js`
- Markets / claim / travel / standing: `src/main.js` (`planetMarkets`, `buyMarketGood`, `claimCurrentSystem`, `randomTravelEvent`, `adjustFactionStanding`)
- Phase 7: `src/phase7-fleet.js`
- Phase 5 companion shape: `docs/phase5/BM1-PHASE5-ENGINE-DEPENDENCIES.md`
