# BM1 Phase 6 proposal: engine dependencies

**Reviewed document:** `BM1-PHASE6-SENSORS-CLOAK-SYSTEM-SPACE-PROPOSAL.md`  
**Reviewed against:** `Artemis2028/BM1-bakeoff` at `9470a66` on `main` (12 September 2026), after Phase 5 engine (PR #21) and side-lane slices. Line numbers below refer to this head and may drift.  
**Method:** read the landed cloak, targeting, minimap, scan, arrival, escort-formation, power, doctrine-fire, Phase 4/5 knowledge, and save/load paths. No engine changes made. This is a dependency/risk checklist for a later writer, not a post-implementation review and not permission to implement before Tenth scopes the lane.

## Verdict in one paragraph

The proposal can be implemented without a rewrite and without a sensor-ops religion. Cloak already exists as **player-only** `state.cloak` plus a handful of `isPlayerCloaked` branches; NPCs have no cloak field, and every UI/AI consumer iterates living hulls. The contact book should copy the Phase 3/4/5 pattern: versioned state beside `incidentLedger` / `objectiveBoard`, clocks from `localElapsedMs`, identity on `securityInstanceId` — never inside `systemStates`, never on recycled `npc.id`. Purposeful space is a thin destination list on top of `getTrafficDestinations` / asteroids / checkpoints, not a larger empty clamp box. Arrival already has one Phase 3 special case (foreign checkpoint approach); route-bearing offsets and escort formation points already exist as primitives. The load-bearing risks are all integration mistakes: applying cloak **after** the first `drawMinimap` / `updateTargetWindow` / `updateNpcShips`; treating Phase 4 `lastKnown` as `liveWeaponTrack`; drawing faction-colored minimap dots for undetected hulls; silent `scanSelectedShip`; gifting escorts a firing solution; stretching `SYSTEM_W` and calling it Phase 6.

## What already exists (do not reinvent)

| Need | Engine fact at `9470a66` |
| --- | --- |
| Player cloak truth | `state.cloak = { active, startedAt, duration }` (`src/main.js` ~873, reset ~11706 / ~19433 / ~19551). `isPlayerCloaked` / `setPlayerCloak` / `updateCloakState` / `getPlayerCloakAlpha` (~8550–8593). Duration and fade use **`performance.now()`**. Low reserve (~10) refreshes `startedAt`; energy drain in `updatePowerSystems` (~6709) can drop cloak. |
| Player cloak vs AI (partial) | `updateNpcShips` (~15810): `playerCloaked` skips `targetPlayer` fire and clears `destinationName === 'player'`. `updateStationDefenses` (~14942) skips firing at a cloaked **player**. `consultDoctrineFire` sets `liveWeaponTrack: targetType !== 'player' \|\| !isPlayerCloaked` (~6386). **NPC-vs-NPC and UI consumers are ungated.** |
| NPC hull create | `createNpcShip` (~1593) has **no** cloak field. `applySystemState` (~2602) copies traffic, then appends fleet + escorts, then `updateSystemOrbits` — then travel completion calls `setCameraNearPlanet` and the next `render`. |
| First consumers after apply | `render` (~19200) calls **`drawMinimap` then `updateTargetWindow` first**, before the flight scene. `tick` (~15984) runs `updateCloakState` then `updateNpcShips` then `updateStationDefenses`. A cloak write after those is a first-frame leak. |
| Minimap | `drawMinimap` (~18780). Every living NPC that is not traffic-warp-away gets a faction/attitude-colored dot (~18882–18886). No knowledge filter. |
| Target list / selection | `getCombatTarget` (~13614), `cycleCombatTarget` (~13632), `selectClosestContact` (~13658), `cycleAllContacts` (~13684), `findNpcAtScreen` (~13706), click-lock (~13511). All iterate `getLivingNpcShips()`. Lock copy names hull + faction + attitude. |
| Target window / scan | `updateTargetWindow` (~14204) shows name, faction, attitude, hull/shields. `scanSelectedShip` (~12042) uses `SHIP_HAIL_RANGE = 760` (~304) as “sensor range”, silent, instant. `buildShipScanReport` (~12026) **invents** cargo tons/goods and prints `government` from `npc.faction`. |
| Hail range ≠ sensor model | `SHIP_HAIL_RANGE` also gates hail/trade. Phase 3 checkpoint contact is a separate 750-unit rule. Neither is a layered sensor. |
| Science specialist hook | `formatShipClass` has a `science` label (~3352). `getShipVisualClass` maps a name containing `'science'` to **`escort`** (~3328–3336). Doctrine roles already stamp on actors. No sensor-stat table. |
| Power / damage | OPS tanks: reserve / engines / weapons / shields only (~6683). Hull/shield combat pools exist. No sensors tank — do not invent one in the first slice. |
| Reports / lastKnown | Phase 4 `deliverReport` payload may carry `lastKnown` (`src/phase4-incidents.js` ~303, ~623). Investigate movement may steam to that point (`src/main.js` ~4944). Phase 5 overdue `lastKnown` is documented historical, not a lock. |
| Local clock | Phase 3 `localElapsedMs` on the system ledger, advanced from `tick(frameScale)`. Prefer this for decay / search / cloak remaining. |
| Durable stores | `incidentLedger`, `objectiveBoard`, `unrestIndependence`, `playerUnlocks` serialize in `saveGame` / restore in `loadGame`. `state.systemStates = {}` still wipes on data load, station/wormhole build, `loadGame`, `resetRunState`. |
| Traffic destinations | `getTrafficDestinations` (~1788): named lanes (`planet transfer`, `outer orbital lane`, `inner beacon`, solar transfers, `deep-space inbound/outbound`), station approaches, wormhole approach. Clamped to `130..SYSTEM_W-130` × `130..SYSTEM_H-130`. `SYSTEM_W = 2600` (~235) is the **clamp box**, not system extent (Phase 3 review already measured stations outside it). |
| Belts | `state.asteroids` realized in `ensureSystemState` (~2471) and drawn on the minimap. Harvest, not a named destination kind. |
| Arrival | `completeWarpTravel` (~12704) → `setCameraNearPlanet` (~2758): foreign active checkpoint → `getCheckpointApproachPoint`, else planet size × (0.56, 0.34). `completeWormholeTransit` (~3638): `wormhole+(90,60)` or planet fallback. |
| Fleet spacing | `getPlayerEscortFormationPoint` (~9738): ring/slot around the player (~155 + 72/ring). Escort spawn (~9752) uses a **separate** random `from` (~150 + index×38), then steers to formation. Arrival must land them on formation, not stack on the camera. |
| Probe surface | `globalThis.__BM1_PROBE__` (~21268) already has `incidents`, `sideLane`, `phase5`. S9 should extend this object rather than scrape private state. |
| Reserved `unknown` access | `ACCESS_CLASSES` includes `unknown` (`src/phase2-security.js`). Security UI marks it `unavailable until sensors exist` (`renderAccessClassRow` ~4384). Do **not** flip enforcement in this slice. |

## Hooks the writer will have to touch

Prefer a new `src/phase6-sensors.js` (contact book, layers, cloak init helpers, variance, scan emission, destination stubs, arrival offset) plus thin `main.js` integration, matching Phase 2/3/4/5 splits. Do **not** implement tracks inside `src/phase4-incidents.js` or `src/phase5-objectives.js` as a sneak path.

| Existing path | Required integration |
| --- | --- |
| `createNpcShip` / `applySystemState` / escort+fleet materialize / `beginAmbientTrafficArrival` | Write cloak **on the object before** it is visible to `state.npcShips` consumers. Ambient replacement: new instance, new cloak, no inherited contacts. |
| `loadGame` / `saveGame` / `resetRunState` | Serialize `contactBook`. Restore cloak **then** book **before** the first `render`. Do not increment Phase 5 jumps. Do not persist `performance.now()` cloak/track deadlines. |
| `setPlayerCloak` / `updateCloakState` | Same-frame truth. Drive remaining duration from `localElapsedMs` when persisting. Fade must not add the hull to other observers’ books. |
| `render` → `drawMinimap` / `updateTargetWindow` | Filter by the **player** observer book. Detection-only ≠ faction color / name. |
| `findNpcAtScreen` / cycle / closest / `getCombatTarget` | Detected contacts only. Drop lock when `firingSolution` is false. |
| `updateNpcShips` / `updateStationDefenses` / escort priority | Each actor reads **its** book. Stop using a single `playerCloaked` boolean as the whole model. |
| `consultDoctrineFire` / `deriveLiveFireFacts` | `liveWeaponTrack` follows `firingSolution`, both sides. Do not inject `engagement_authorized`. |
| `scanSelectedShip` / `buildShipScanReport` | Active scan: useful layer raise **or** honest miss; write a detectable emission. Do not dump invented cargo as identification. Keep hail range as hail, not as omniscience. |
| `evaluateIncidentReact` / Phase 5 pirate-learn | In-system “detection” must mean a contact-book detection, not `state.npcShips.length`. Reports still do not grant `firingSolution`. |
| `completeWarpTravel` / `completeWormholeTransit` / `setCameraNearPlanet` | Apply route-bearing / local-condition offset **after** Phase 3 checkpoint rule. Then place escorts on `getPlayerEscortFormationPoint`. Retain warp/wormhole/checkpoint exit. |
| `ensureSystemState` / `getTrafficDestinations` | Add stub `systemDestinations` kinds (lane/belt/relay/wreck/research/restricted/anomaly). Do not enlarge empty `SYSTEM_W`. Do not mint deep-space addresses. |
| `__BM1_PROBE__` | Snapshot book, cloak-before-paint, layers, `firingSolution`, minimap/select leaks, scan emission, destination kinds, arrival points, escort spacing, standing unchanged. Inject cloaked hull / science vs ordinary / failed search; **fail setup if missing**. |

Do **not** hook `loadShipCatalog`, `allowsRoutineGenerator`, independence mint / breakaway profiles, or Phase 3 `unknown` enforcement.

## Risks

### 1. First-frame leak (gate 1)

`applySystemState` fills `state.npcShips`, then `completeWarpTravel` / start-game returns into `render`, which **paints the minimap and target window before the flight scene**. `tick` then lets AI acquire. Any “set cloak in the next update” scheme flashes the hull.

`createNpcShip` has no cloak field today. A writer who toggles cloak in `updateNpcShips` after spawn fails S9.1 even if later frames look right.

Load always constructs `state.cloak` as inactive (~11706) **after** other state restore. If a save ever stores an active cloak or cloaked NPCs, restore order must still beat the first paint.

**Gate:** S9.1, S9.11.

### 2. Phase 4 `lastKnown` becomes a live lock (gate 2)

Investigate already steams to `incident.lastKnown` (~4944). Wiring that point into `getCombatTarget` / `liveWeaponTrack` / tracking `turnRate` fails gate 2 and Phase 5’s “historical, not a firing solution.”

**Gate:** S9.2, S9.5.

### 3. UI omniscience (gate 3)

Minimap faction colors, click-select, cycle-all, and the target window’s `formatFaction` + attitude line will leak even if AI is honest. `selectClosestContact` currently claims “No contacts in this system” only when `npcShips` is empty — a cloaked-only system must not count those hulls.

`buildShipScanReport.government` prints hull faction without an identification layer.

**Gate:** S9.3.

### 4. AI still uses world truth (gate 3 / §1)

Station defenses already skip a cloaked player but still pick any living NPC in range (~14950). Escorts and `getCombatTarget` ignore cloak entirely. A player-only honesty pass fails “same information rules.”

Sharing the flagship book as a full lock to every escort creates a telepathic firing solution (proposal §5.2 default: detection/last-known only).

**Gate:** S9.4.

### 5. Lost track still homes (gate 4)

`getProjectileTurnRate` (~8481) and `liveWeaponTrack` will keep tracking shots on truth if nobody clears the lock. Auto-target (`state.autoTarget`) re-picks the nearest living hostile (~13620) even after a “lost lock” log.

**Gate:** S9.5, S9.6.

### 6. Variance as hull size (gate 5)

`getShipVisualClass` already folds science-named hulls into `escort`. A writer who keys reach on mass/class only cannot show a science specialist beating a larger ordinary ship. Inventing a sensors OPS tank or catalog stats is out of scope.

**Gate:** S9.7.

### 7. Silent scan (gate 6)

`scanSelectedShip` is instant, silent, and flavor-complete. Leaving it as a hail-range dump fails “useful but detectable.” Making it a real cargo inventory fails Phase 4/5 non-goals.

**Gate:** S9.8.

### 8. Empty distance / deep-space creep (gate 7)

Raising `SYSTEM_W` / `SYSTEM_H` or adding more `deep-space inbound` clamps without named kinds fails “purposeful destinations.” Minting a warp-to `locationId` that does not load a system fails the §8 later-add deferral.

**Gate:** S9.9.

### 9. Stacked arrival / no exit (gate 8)

Escorts spawn at a random offset then chase formation; a naive `setCamera` + escort `from = player` stacks the fleet. Dropping inside a restricted stub with no warp/wormhole/Phase 3 withdraw fails “retain an exit.” Ignoring inbound bearing leaves every warp on the same planet corner (except the existing checkpoint case).

**Gate:** S9.10.

### 10. `performance.now()` cloak / decay (process / §13)

Cloak remaining and fade already use wall clock. Tab throttle desyncs (Phase 3/4 lesson). Persisting `startedAt` as `performance.now()` fails the saved-timer reccheck.

**Gate:** S9.11; process lock.

### 11. `unknown` access sneak-on

Defining unidentified contacts is in-scope. Flipping `renderAccessClassRow` / `getVisitorAccessDecision` to enforce `unknown` from hidden identity is a Phase 3 leftover and a fail unless a later brief scopes it.

**Gate:** S9.12.

### 12. Side-lane / catalog / EW creep

Wiring 212 hulls, authored breakaway profiles, jamming, ghosts, or a weapon matrix fails the process locks and S9.12.

## Probe plan (S9)

Add `scripts/test-phase6-sensors.mjs` for offline book / layer / variance / emission tests (like `test-phase5-objectives.mjs`) and Chromium S9 cases on `__BM1_PROBE__`.

**Minimum probe additions:**

```js
__BM1_PROBE__.phase6 = {
  snapshot: () => ({
    book: serializeContactBook(state.contactBook),
    playerCloak: { ...state.cloak },
    minimapIds: listMinimapNpcIds(),
    targetIds: listSelectableContactIds(),
    firing: listFiringSolutions(),
    destinations: listSystemDestinationKinds(),
    arrival: { x: state.camera.x, y: state.camera.y },
    escortOffsets: listEscortOffsetsFromPlayer(),
    standing: { ...state.factionStanding },
    log: state.log
  }),
  injectCloakedHull: (opts) => { /* fail setup if cloak helper missing */ },
  firstFrameAfterApply: () => { /* snapshot without extra tick */ },
  injectScienceVsOrdinary: () => {},
  ageTrack: (contactId) => {},
  failSearch: (contactId) => {},
  activeScan: (observerKey, subjectKey) => {},
  completeJumpFrom: (fromIndex) => {}
};
```

Run, in order: existing `test:phase1`, `test:phase3`, `test:phase4`, `test:phase5`, `test:doctrine`, side-lane tests, `probe` (S4–S8), then new S9. A path that paints a cloaked hull on frame 0, sets `firingSolution` from a report, or changes `mayAutoEngage` without Phase 2 evidence is a blocker.

Suggested first Chromium set (fatal integrations):

1. **S9.1 / S9.11:** apply cloaked fixture; first-frame minimap/target/AI empty; load/reuse does not leak.
2. **S9.2 / S9.5 / S9.6:** report ≠ lock; decay drops `firingSolution`; failed search stays area.
3. **S9.3 / S9.4:** player UI leak check; ignorant NPC/station does not fire; knowing observer may.
4. **S9.7 / S9.8:** science > ordinary; scan raises a layer **and** is detected.
5. **S9.9 / S9.10:** two destination kinds present; two inbound bearings differ; escorts spaced; exit exists.
6. **S9.12:** Phase 1–5 / side-lane asserts still green; `unknown` still locked.

## Recommended implementation order (dependencies)

1. Cloak fields + init-before-consumer on spawn/apply/load/ambient (S9.1, S9.11). No new destinations yet.
2. Empty `contactBook` + four layers + save/load (S9.2).
3. Player UI filters (S9.3) then NPC/station/doctrine-fire consumers (S9.4).
4. Decay / search / drop lock (S9.5–S9.6). Wire Phase 4 `lastKnown` as **area only**.
5. Variance function + science vs ordinary fixture (S9.7).
6. Active scan emission (S9.8). Leave `buildShipScanReport` flavor out of identification.
7. Destination stubs (S9.9).
8. Arrival bearing + escort formation on drop + exit assert (S9.10).

Skip (7)–(8) if (1)–(4) are not green — space/arrival must not ship on top of a leaking sensor. Skip catalog, EW, `unknown` enforcement, and unrest retunes entirely.

## Out of scope for the writer of a later slice

`BM1-remastered-work`; claiming a Referee Pass; doctrine JSON culture→empire edits; weapon tables; EW (jamming, ghosts, fire-control, comms disruption); independently addressable deep-space locations; wiring 212 hulls; authored breakaway profiles; activating `unknown` access; treating scan flavor as inventory; a sensors OPS tank as a required first slice; stretching empty `SYSTEM_W`; stacking escorts on arrival; gifting fleet firing solutions; persisting `performance.now()` cloak/track deadlines; setting `hostile` / `attackId` / `destroyed` from a lost track or a failed search.

## Sources

- Proposal: `docs/phase6/BM1-PHASE6-SENSORS-CLOAK-SYSTEM-SPACE-PROPOSAL.md`
- Plan §4 / §8 / §1 / §13: `docs/revised-development-plan.md`
- Doctrine `lastKnown`: `docs/doctrine/DESIGN-doctrine-v0.2.1.md`
- Phase 3 unknown / broadcast: `docs/phase3/BM1-PHASE3-HOLDING-ZONES-AND-COMPLIANCE-PROPOSAL.md`
- Phase 4 reports: `src/phase4-incidents.js`
- Phase 5 board: `src/phase5-objectives.js`
- Cloak / minimap / targets / scan / arrival / escorts: `src/main.js` (`isPlayerCloaked`, `drawMinimap`, `getCombatTarget`, `scanSelectedShip`, `setCameraNearPlanet`, `getPlayerEscortFormationPoint`, `completeWarpTravel`, `consultDoctrineFire`)
- Phase 5 companion shape: `docs/phase5/BM1-PHASE5-ENGINE-DEPENDENCIES.md`
