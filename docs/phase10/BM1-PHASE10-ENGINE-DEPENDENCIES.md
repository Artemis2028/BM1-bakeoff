# BM1 Phase 10 (Dominion-first) proposal: engine dependencies

**Reviewed document:** `BM1-PHASE10-DOMINION-FIRST-PROPOSAL.md`  
**Reviewed against:** `Artemis2028/BM1-bakeoff` at `de1f857` on `main` (15 September 2026), after boarding-capture engine (PR #39). Line numbers below refer to this head and may drift.  
**Method:** read the landed catalog wire / pack `regionAllows` / `currentCatalogSpawnContext` authorized-deployment default / wormhole Dominica hard-wire / map label + planet-copy leaks / doctrine remnant vs central profiles / Phase 6 contact layers / Phase 8 finite markets / Phase 9–9.2 EW books / boarding prize path. No engine changes made. This is a dependency/risk checklist for a later writer, not a post-implementation review and not permission to implement before Tenth scopes the lane. **Keep #33, #35, #37, #38, and #39 Pass locked** — do not reopen EW or boarding gates or regress S14 / S15 / S16 / S17. This is **Phase 10 Dominion-first**, not a full faction roster.

## Verdict in one paragraph

Phase 10 Dominion-first can be implemented as a **thin campaign book** plus **live pack-gate wiring** without rewriting combat, EW, boarding, or Phase 1 identity. Prefer `src/phase10-*.js` (names can change) that **subscribe** to pack `spawnPool` / `getPurchaseDecision`, catalog `catalogSpawnContext`, Phase 6 contact layers (rumor ≠ `firingSolution`), Phase 4 delivered reports (new sends only), Phase 8 `marketBook` / holding obligations, and doctrine profile selection (`dominion_remnant` vs `dominion_central` sharing runtime key `dominion`). Close the debug default `authorizedDeployment: role === 'fleetAttack' || role === 'mission'` in `currentCatalogSpawnContext`. Hide Dominica / Gamma **labels, route previews, wormhole destination names, and tooltips** until a named discovery write; Blender remnant stays playable. Rumor → evidence → contact are observer knowledge rows, not ROE. Stage inject must **not** jump to fronts because opponent strength is low. The load-bearing risks are all integration mistakes: start-as-Dominion map dump; debug-all deployments; blender yards selling core/Battleship; empty Gorn pool falling back to random hulls; rumor-as-FS / `engagement_authorized`; weakness-as-invasion; ordinary captains inheriting pacts; forking a second catalog or contact book; regressing #33/#35/#37/#38/#39.

## What already exists (do not reinvent)

| Need | Engine fact at `de1f857` |
| --- | --- |
| Pack region gates | `bm-ships/catalog.mjs` `regionAllows` (~43–58): `reserved-gorn` / `unassigned` false; `mission-only` needs `role === 'mission'` and `authorizedDeployment`; `dominion-all` blender/dominica/core/invasion/mission; `dominion-core` dominica/core/authorized. Unknown region **false**. `eligibleForSpawn` / `spawnPool`: empty legal pool stays empty (~60–78). |
| Pack Dominion metadata | `bm-ships/integration-rules.json` `dominion.blenderRoutineIds` **206, 322** (validate.mjs also checks hull **30** at Blender patrol); `coreRegion: "dominion-core"`. |
| Battleship no-ambient | Hull **65** `availabilityRegion: "dominion-core"`, `trafficEligible: false` (`bm-ships/ships.json` ~2484). Core hulls **48, 216, 238** are `dominion-core` and **illegal at Blender patrol** (`validate.mjs` ~73–77). |
| Gorn / mission-only offline | `validate.mjs` ~86–93; S11 `scripts/test-catalog-wire.mjs` `gorn-pool-empty`, `mission-only-not-ambient`, `blender-has-remnant-or-general`. |
| Catalog wire | `src/ship-catalog-wire.js`: `catalogSpawnContext` (~175) already AND-gates `authorizedDeployment` with role `fleetAttack`/`mission` **when the caller passes the flag**. `spawnIdsFromCatalog` (~244). Comment: empty pools stay empty (~11). |
| **Debug default to close** | `src/main.js` `currentCatalogSpawnContext` (~3663): `authorizedDeployment: role === 'fleetAttack' \|\| role === 'mission'`. Live `catalogSpawnIds` (~1838) uses that context. **This is the gate 4 bug.** |
| Live NPC pick | `getNpcShipId` / `getNpcShipIdForFaction` (~1848–1864). Traffic role may fall back to an unfiltered pool if the faction pool is empty — **risk**: do not refill Gorn/Dominion-core from “any hull.” |
| Authored planet stock leak | `data/planetData.json` Dominica / JemHadar Relay `shipStockIds` include **48, 65**. Live yards must still run `eligibleForStock` / region; do not treat authored ids as a bypass. |
| Wormhole → Dominica | `WORMHOLE_ORIGIN_SYSTEM_NAME = 'Bajora'`; `WORMHOLE_DOMINION_SYSTEM_NAME = 'Dominica'` (~651–652). `WORMHOLE_ISOLATED_SYSTEM_NAMES` (~653–662): Dominica, Vortara, New Bajor, JemHadar Relay, Karemma Exchange, Founders Watch, Dosi Gate, T-Rogoran Annex. `getFixedWormholeLinks` id `bajora-dominica-wormhole` (~2424). `getDefaultWormholeDestinationIndex` **prefers Dominica** (~12315). |
| Map label leak | `drawPlanetMarker` (~20282) labels current / selected / **route neighbor** / plotted-route systems with `p.name`. `data/mapnames.json` lists Gamma names unconditionally. |
| Tooltip / copy leak | Dominica description (~1899): “Gamma Quadrant, home to the dreaded Dominion.” JemHadar Relay (~2294): “between Blender and Dominica.” Dosi Gate copy names Dominica. **Blender** copy (~944) naming the remnant war is **allowed** (local remnant, not Gamma reveal). |
| Doctrine two profiles | `docs/doctrine/bm1-faction-doctrine.v0.2.1.json`: `dominion_remnant` / `dominion_central`, both `runtimeFaction: "dominion"`. `src/doctrine.js` still `DESIGN_ONLY_NOT_LOADED_BY_GAME` for full runtime — campaign must not pretend the pack already drives AI. `engagement_authorized` delete: `main.js` ~8241; `phase9-ew.js` `FORBIDDEN_FIRE_INJECT`. |
| Contact layers | `src/phase6-sensors.js`: four layers; `seedFromReport` area-only, FS false. Caps 32 contacts / 24 observers. |
| Finite prep / occupation | `src/phase8-markets.js` compact `state.marketBook`; holding obligations on claim. Subscribe; do not reprint stock for an invasion. |
| EW / boarding landed | `BOARDING_IMPLEMENTED === true` (`src/boarding-eligibility.js` ~15); `tractorIsBoarding() === false` (`src/phase9-ew.js` ~700). S17 probe `__BM1_PROBE__.boarding`. Phase 9–9.2 `__BM1_PROBE__.phase9` / `.phase91` / `.phase92`. |
| Persistence lesson | `state.systemStates = {}` wipes on load. Campaign book + discovery flags + agreement roster live **outside** that cache. Key on observer / operation / `securityInstanceId`, not ambient `npc.id`. |
| Clocks | Phase 3 `localElapsedMs`; Phase 5 strategic jump clock. Campaign discovery/prep must declare which clock. Do **not** copy `performance.now()` tractor-probe deadlines. |
| Probe surface | Add **`phase10` / `dominion`** on `__BM1_PROBE__`. Fail setup if missing. Replay S14–S17 unchanged. |
| Offline tests | Keep `test:catalog`, `test:boarding`, `test:phase9*`. Add `scripts/test-phase10-dominion.mjs`. |

## Hooks the writer will have to touch

Prefer thin new files rather than growing `ship-catalog-wire.js` / `main.js` wormhole block into a second religion:

| Proposed module | Responsibility |
| --- | --- |
| `src/phase10-dominion-book.js` | `state.dominionBook` outside `systemStates`. Observer knowledge layers (rumor/evidence/contact). Stage enum. Inject. Hard-fail FS / `engagement_authorized` / Phase 1 writes. |
| `src/phase10-discovery.js` | Per-observer revealed system list. Hide vs sayable names. Discovery write lists systems (no galaxy dump). |
| `src/phase10-pack-gates.js` | Wrap `catalogSpawnContext` / live spawn/stock: `authorizedDeployment` only with a live operation id. Snapshot `debugAuthorizeAllDeployments: false`. |
| `src/phase10-map-hide.js` | Filter labels, route-preview strings, wormhole destination options, planet descriptions for unearned observers. |
| `src/phase10-agreements.js` | Scoped pact roster; default `agreementsLive: false`. Ordinary captain ≠ command. |
| `src/phase10-magnitudes.js` | Injectable clocks/odds; `discoveryOddsLocked` / `invasionOddsLocked` false. |
| `src/ship-catalog-wire.js` | **Subscribe:** `catalogSpawnContext` already AND-gates the flag — **stop the main.js caller from forcing true**. Do not rewrite Reman meeting. |
| `src/main.js` | Thin: `currentCatalogSpawnContext` must pass `authorizedDeployment` from the book, **not** from role. Map/wormhole/tooltip filters. `__BM1_PROBE__.phase10`. Serialize `dominionBook`. |
| `src/phase6-sensors.js` | Optional: rumor seed uses `seedFromReport` area-only. **Never** raise FS. Do not add a fifth information religion. |
| `src/phase4-incidents.js` | Optional campaign incident kinds (non-FLASH default). Do not fold rumor into `destruction`. |
| `src/phase8-markets.js` | Procurement/occupation **subscribe** to finite stock and holding obligations. No free reprint. |
| `src/doctrine.js` | Profile select remnant vs central **without** injecting fire facts. Pack may stay DESIGN_ONLY for full AI; do not fake a second evaluator. |
| `src/phase9-ew.js` / `src/boarding-*.js` | **Do not touch** except preservation. No new EW family. No boarding-from-rumor. |

Do **not** implement Phase 10 inside `src/phase91-*.js` / `src/phase92-*.js` as an EW side effect. Do **not** implement Gamma fleets inside `createNpcShip` ambient reuse. Do **not** `git am` remastered patches. Do **not** retune `game_items.json`. Do **not** implement Independent/Ferengi/Vulcan playable paths in this slice.

| Existing path | Required integration |
| --- | --- |
| `currentCatalogSpawnContext` (~3663) | `authorizedDeployment` from live operation **only**. Role `fleetAttack`/`mission` is **necessary, not sufficient**. |
| `catalogSpawnIds` / `getNpcShipIdForFaction` | Empty Dominion-core / Gorn pool stays empty. Traffic fallback must **not** pick 48/65/216/238 or reserved Gorn. |
| `spawnIdsFromCatalog` / `stockIdsFromCatalog` / `evaluateWiredPurchase` | Region refuse at Blender for core hulls. Battleship 65 never ambient stock. |
| Authored `shipStockIds` on planet rows | Filter through `eligibleForStock` + discovery/region. JemHadar Relay listing 65 is **not** authorization. |
| `getFixedWormholeLinks` / `getDefaultWormholeDestinationIndex` | Unearned observers: do not **name** Dominica; do not prefer it as default; refuse unearned transit (proposal Q6 default). |
| `drawPlanetMarker` / route preview / mapnames | Filter `p.name` against observer discovery. Route-neighbor is a leak vector. |
| Planet `description` / station names (`Dominica Check Point`) | Redact for unearned observers. |
| `consultDoctrineFire` / `liveFireFactsFromEw` / `playerForceMayAutoEngage` | Pass layer facts only. Keep the delete. Campaign stage must not flip `mayAutoEngage`. |
| `seedFromReport` / contact book | Rumor may area-seed **only** with coordinates the observer actually received. |
| `deliverReport` / FLASH | New sends only. Rumor default not FLASH. No unsend. |
| `markAssignmentDestroyed` / Phase 5 | Missing Gamma rumor ≠ destroyed ≠ attacker. |
| Boarding helpers | Detection still required. Campaign knowledge is not reach. Tractor still not board. |
| `loadGame` / `saveGame` / `resetRunState` | Serialize `dominionBook` + discovery + agreements beside incident ledger / market book. Load still wipes `systemStates` first. Restore cloak → contact book → campaign hide **before** first map/AI pass. No `performance.now()` discovery deadlines. |
| `__BM1_PROBE__` | Add `phase10.snapshot` / injectors (see probe plan). **Fail setup if missing.** Keep `phase9` / `boarding` intact. |
| `.top-left-panel` / `.bottom-dock` | Later engine: map + knowledge chrome dock-clear at 1280×720. Not this docs PR. |

Do **not** hook `meetPackPurchaseDecision` as a Dominion unlock, independence mint, Phase 8 stock reprint, Reman identity from a Dominion prize 53, or EW contest from a rumor.

## Risks

### 1. Rumor / contact gift FS, culture fire, or `engagement_authorized` (gate 1)

Lighting Target lock from a campaign fact, or `mayAutoEngage` true because `stage === 'contact'`, fails Phase 6 / 9 fire gates and Phase 10 gate 1. Rewriting `playerFaction` to `dominion_central` fails Phase 1.

**Gate:** S18.1, S18.2, S18.3, S18.14.

### 2. Blender / Dominion start auto-reveals Gamma (gate 2)

`mapnames.json` + `drawPlanetMarker` + Dominica wormhole default + planet descriptions dump the distant region on frame one. Start-faction Dominion must **not** skip the hide.

**Gate:** S18.4, S18.5.

### 3. Route-neighbor / plotted-route label leak (gate 2)

Even if the node is “fogged,” a travel-route neighbor label of `Dominica` fails hide. Probe must scrape **strings** in map/tooltip/preview snapshots, not only a boolean.

**Gate:** S18.5.

### 4. Paths implemented as a third ROE (gate 3)

A `dominion-war` auto-engage mode, or remnant merchant inheriting central strike permissions, fails plan §12 and gate 3.

**Gate:** S18.14.

### 5. `authorizedDeployment` stays a role bit (gate 4)

Leaving `currentCatalogSpawnContext` as `role === 'fleetAttack' \|\| role === 'mission'` fails “real operations, not debug defaults” even if pack helpers are green in isolation.

**Gate:** S18.8.

### 6. Live spawn ignores pack / authored stock bypass (gate 4)

`createNpcShip` using pre-pack 66-hull ids, or planet `shipStockIds` [65] without `trafficEligible` / region checks, puts Battleships in Blender/Alpha. `getNpcShipIdForFaction` traffic fallback into `catalogSpawnIds(role, null)` can refill an empty Gorn/core pool.

**Gate:** S18.6, S18.7, S18.9.

### 7. Gorn name-pool polity (gate 4)

Spawning reserved hulls 251/252/288, or minting a Gorn controller because `mapnames` still has `"Gorn"`, recreates a state doctrine forbids.

**Gate:** S18.7.

### 8. Weakness instantly authorizes fronts (gate 5)

A strength snapshot writing `authorizedDeployment: true` or `stage: 'fronts'` fails “opportunity ≠ conjuration.”

**Gate:** S18.10, S18.12.

### 9. Free invasion reprint / occupation as loot (gate 5)

Minting hulls because prep was sabotaged, or skipping Phase 8 holding obligations on occupation, fails plan §10 table subscribe.

**Gate:** S18.11.

### 10. Ordinary captains inherit pacts (gate 6)

`runtimeFaction === 'cardassian'` ⇒ pact facts, or starting Breen auto-briefs invasion, restores the Phase 1 alliance the doctrine removed.

**Gate:** S18.13, S18.16.

### 11. Book inside `systemStates` / keyed on `npc.id`

Same Phase 3/4/5/6/9 landmine. Load wipes discovery; ambient reuse transfers an operation onto a newcomer (false authorized spawn).

**Gate:** S18.15.

### 12. `performance.now()` discovery clocks

Tractor probe does this today. Campaign timing must use `localElapsedMs` and/or completed jumps as declared.

**Gate:** S18.15; process lock.

### 13. Rumor as Phase 5 destroyed / FLASH spam (preservation)

Treating a missing Gamma rumor as `destroyed` + attacker, or pulsing FLASH every rumor tick, fails Phase 4/5.

**Gate:** S18.1, S18.17.

### 14. Boarding/EW reopen (gate 7)

Tractor-as-capture, ghost-as-contact-hull, contact-delete jam, or S14–S17 red fails even if pack pools are green. Flipping `tractorIsBoarding` to “reach Gamma” is a fail.

**Gate:** S18.17.

### 15. Full roster shipped as this slice (scope)

Independent/Ferengi/Vulcan playable paths, or a rare-commander memory table, fail Dominion-first / non-goals.

**Gate:** S18.18.

## Probe plan (S18)

Add `scripts/test-phase10-dominion.mjs` for offline hide-strings / pack-context / stage-inject / compartmentation tests, and Chromium S18 cases on `__BM1_PROBE__.phase10`. **Replay S14–S17** via existing injectors; do not break them.

**Minimum probe additions:**

```js
__BM1_PROBE__.phase10 = {
  snapshot: () => ({
    scope: 'dominion-first',           // fail if full-roster flags true
    rosterPlayable: { independent: false, ferengi: false, vulcan: false },
    rareCommanders: false,
    debugAuthorizeAllDeployments: false,
    discoveryOddsLocked: false,
    invasionOddsLocked: false,
    magnitudesInjectable: true,
    fire: {
      firingSolutionGifted: false,
      engagement_authorized: undefined,
      playerFaction: state.playerFaction,
      playerSide: state.playerSide,
      reman53: /* unlock unchanged */
    },
    knowledge: {
      observerKey: 'player',
      layer: /* none | rumor | evidence | contact */,
      mapRevealed: false
    },
    hide: {
      startFaction: /* */,
      currentSystem: /* Blender */,
      leakedNames: /* [] must not include Dominica, Founders Watch, … */,
      wormholeDefaultNamesDominica: false
    },
    pack: {
      blenderCoreHulls: /* [] */,
      battleshipAmbient: false,
      gornPool: [],
      authorizedDeployment: false,
      liveOperationId: null
    },
    stage: {
      value: /* rumor | … | abandoned */,
      weaknessOpportunity: false,
      weaknessDidAuthorize: false   // must stay false
    },
    agreements: {
      live: false,
      ordinaryCaptainKnowsPact: false
    },
    boarding: {
      tractorIsBoard: false,
      implemented: true
    }
  }),
  injectKnowledge: ({ layer }) => {},
  injectDiscovery: ({ observerKey, systemNames }) => {},
  injectStage: ({ stage, weaknessOpportunity, authorizedDeployment }) => {},
  injectOperation: ({ operationId, authorizedDeployment }) => {},
  startFaction: (key) => {},
  failIfMissing: true
};
```

Fail setup if `phase10` is missing. Fail if `leakedNames` contains isolated Gamma strings on a Blender Dominion start. Fail if `injectStage({ weaknessOpportunity: true })` sets `authorizedDeployment`. Fail if `catalogSpawnContext({ role: 'fleetAttack' })` is authorized without `injectOperation`.

**Screenshot / no-clip (engine PR only):** 1280×720 star chart (hidden vs revealed), knowledge readout, Target / OPS / Settings / Inventory. `clippedControls: []`. Dock-clear. NOTES under `docs/phase10/screenshots/`. This docs PR attaches **no** PNGs.

## Do not implement from remastered

Blind bake-off. `docs/` only. Do not crib `BM1-remastered-work` invasion timing, map fog, or spawn tables. Pack Flash/balance numbers remain **source material**, not locked invasion odds.

## Handoff

Referee / One score the seven gates on the proposal **before** engine. Number Four owns pack/map/spawn hooks. Number 2 owns knowledge / ROE / compartmentation. Number Three runs S18 after Tenth scopes engine. **No Referee Pass is claimed from this dependency MD.**
