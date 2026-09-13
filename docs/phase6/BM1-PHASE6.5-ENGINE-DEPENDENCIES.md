# BM1 Phase 6.5 proposal: engine dependencies

**Reviewed document:** `BM1-PHASE6.5-POWER-SENSORS-SUITES-PROPOSAL.md`  
**Reviewed against:** `Artemis2028/BM1-bakeoff` at `bcb4a9a` on `main` (13 September 2026), after Phase 6 engine (PR #24) and content hull-merges / full-roster-v2 (PR #25). Line numbers below refer to this head and may drift.  
**Method:** read the landed Phase 6 contact book, `sensorCapability`, active-scan emission, player OPS/energy, content roster fields, Reman 53 / alias maps, and S9 probe surface. No engine changes made. This is a dependency/risk checklist for a later writer, not a post-implementation review and not permission to implement before Tenth scopes the lane.

## Verdict in one paragraph

Phase 6.5 can be implemented as a **thin budget + equipment layer on top of PR #24**, not a second sensor religion. `src/phase6-sensors.js` already distinguishes passive evaluation from `performActiveScan`, already folds role / equipment / age / `powerNorm` / damage into `sensorCapability`, and already writes a detectable emission. What is missing is **authored generation**, **different draws**, and a **swappable suite**. Player energy today is mass-scaled (`getPowerMaxEnergy` = 100 + mass × 25) with four OPS tanks and a cloak drain; NPCs default `powerNorm` to 1. The 172-hull pack has no power or suite fields. The load-bearing risks are all integration mistakes: inventing 172 numbers; wiring the catalog; treating a suite grade as identification or `firingSolution`; adding a fifth OPS tank as if it were required; implementing EW effects; touching Reman 53 or the 38 aliases; reopening S9.

## What already exists (do not reinvent)

| Need | Engine / content fact at `bcb4a9a` |
| --- | --- |
| Four info layers + book | `src/phase6-sensors.js`: `detected`, `identification`, `trackQuality`, `firingSolution`. `state.contactBook` beside ledger/board. Reports seed area only. |
| Hidden / same-tick drop | S9.3 / S9.4 / S9.5. `enforceFiringSolution`; lost track clears UI + AI on the same tick. |
| Variance axes | `sensorCapability`: role, `sensorEquipment`, `sensorAge`, `powerNorm`, `hullRatio`. Science can beat larger ordinary (S9.7). **No suite item.** |
| Passive vs active (info only) | `evaluatePassiveDetection` vs `performActiveScan` + `createScanEmission` / `noticeScanEmission`. Active is useful + detectable (S9.8). **Same `powerNorm`; no draw split.** |
| Player energy | `state.power = { energy, dist: { reserve, engines, weapons, shields } }`. `POWER_DIST_BUDGET = 20`. `getPowerMaxEnergy()` ~ `src/main.js` 7120: `100 + mass * 25`. |
| Cloak drain | `updatePowerSystems` (~7214): regen from reserve; cloak subtracts `6 * dt`; energy ≤ 0 drops cloak. Still uses `performance.now()` on that drop path. |
| Player sensor actor | `sensorActorFromPlayer` (~4750): `powerNorm` from energy/max × (reserve ≥ 2 ? 1 : 0.35). Science inferred from **name / shipClass**, not a fitted suite. |
| NPC sensor actor | `sensorActorFromNpc` (~4774): `powerNorm` defaults to **1** unless `npc.powerNorm` is set. `sensorEquipment` from role default. |
| Three combat/device slots | Pack + convergence: empty stays empty; devices (cloak, tractor, tachyon) share those slots. No `sensor_suite` kind. |
| Content roster | `bm-ships/ships.json` version `2026.09.13-full-roster-v2`: **172 active**, two retired, **38 aliases**. No `basePowerGeneration` / suite keys. **Not wired** to live yards. |
| Reman 53 | Pack id 53 / `bm-ship:53`, `shipyardEligible: false`, `specialVendor: remus-secret`. Side-lane `meetPackPurchaseDecision` in `src/side-lane-repair-reman.js`. |
| Aliases | `ships.json` `aliases` and `integration-rules.json` `hullAliases` — same 38 pairs as `docs/APPROVED-HULL-MERGES.md`. |
| Probe surface | `globalThis.__BM1_PROBE__.phase6` already has book / cloak / scan / science-vs-ordinary injectors. S10 should **extend** this object (or add `phase65`), not scrape private state. |
| Offline Phase 6 | `npm run test:phase6` → `scripts/test-phase6-sensors.mjs`. Keep green. |

## Hooks the writer will have to touch

Prefer extending `src/phase6-sensors.js` (capability, draw, suite resolve) plus thin `main.js` integration on `updatePowerSystems` / `sensorActorFrom*`. A new `src/phase65-power.js` is OK if it stays a budget helper. Do **not** implement tracks inside `src/phase4-incidents.js` or `src/phase5-objectives.js`. Do **not** edit alias maps or Reman unlock code unless a probe-only inject needs a fixture.

| Existing path | Required integration |
| --- | --- |
| Hull / fixture stats | Read injectable `basePowerGeneration` (or probe inject). Do not silently replace it with `100 + mass * 25`. |
| `updatePowerSystems` / `consumeWeaponEnergy` / cloak drain | Subtract **passive** draw every tick the suite is live; subtract **active** draw while a scan/emission is running. Same pool as weapons + cloak. Reserve an `ew` line at 0. |
| `sensorActorFromPlayer` / `sensorActorFromNpc` / station | `powerNorm` from remaining energy **and** generation headroom. `sensorEquipment` from **fitted suite**, not only name-contains-`science`. |
| `evaluatePassiveDetection` / `performActiveScan` | Keep layer earn rules. Active may use a higher capability mod **and** must cost more. Emission path unchanged in kind. |
| Suite install / remove | Apply payment axes (cargo / power / speed / detectability). Do not auto-fill an empty weapon slot. Do not write contact layers. |
| `saveGame` / `loadGame` / `resetRunState` | Persist fitted `suiteId` + generation if they become runtime state. Restore **before** first sensor pass. No `performance.now()` deadlines. |
| `__BM1_PROBE__` | Snapshot generation, draws, suite id, payment axes, `ew` reserved, layers, Reman 53, alias resolve. Inject haul+suite / two-generation fixtures; **fail setup if missing**. |
| `bm-ships/ships.json` | Optional later content inject of keys as `null`/TBD. **Not** this brief. Never rewrite `aliases` or hull 53. |

Do **not** hook `loadShipCatalog` as a requirement. Do **not** hook independence mint, Phase 3 `unknown` enforcement, or weapon tables.

## Risks

### 1. Mass-only energy stays the budget (gate 1)

If the writer only retunes `getPowerMaxEnergy()`, two same-mass hulls cannot differ and S10.1 fails. Authored generation must be a real input.

**Gate:** S10.1.

### 2. Active is still free (gate 2)

`performActiveScan` today does not spend energy. Leaving that true fails “different power draw.” Spending energy but skipping the emission fails S9.8 / S10.2.

**Gate:** S10.2, S9.8.

### 3. Suite writes layers or fire permission (gates 2–3 + preservation)

A high-end suite must not set `identification` / `firingSolution` / `engagement_authorized`. It only moves the Phase 6 **equipment** axis (and payment axes).

**Gate:** S10.3, S10.8, S9.2.

### 4. Science-by-name remains the only equipment (gate 3)

`sensorActorFromPlayer` still keys science on the hull name. Without a fitted suite id, scout-freighter is impossible and S10.4 fails.

**Gate:** S10.4, S10.5.

### 5. Dominated “sensor battleship” (gate 4)

Adding generation + a free science suite to a tank/gun hull without payment recreates the #25 dominated-purchase problem on a new axis.

**Gate:** S10.6.

### 6. EW creep (gate 5)

Jamming, ghosts, or fire-control interference belong to Phase 9. A reserved `ew` consumer that is silently implemented as a contact rewrite fails the non-goal.

**Gate:** S10.7.

### 7. Catalog wire / invented 172 numbers (process)

Filling `ships.json` with guessed generation values, or flipping S7.9, is out of scope. Fixtures and `null` keys are enough.

**Gate:** S10.10.

### 8. Reman 53 / alias rewrite (preservation)

Hull 53 is not a merge. Discarded ids must not reappear as active rows.

**Gate:** S10.9.

### 9. Reopen Phase 6 init / leak / destinations

Touching cloak-before-paint, minimap filters, or `SYSTEM_W` “to make sensors better” fails S10.8 / S9.1 / S9.9.

**Gate:** S10.8.

### 10. `performance.now()` power clocks (process / plan §13)

New brown-out or suite timers must use `localElapsedMs`. The existing cloak drop still calling `performance.now()` is a known Phase 6 leftover — do not add a second wall-clock deadline.

**Gate:** S10.8; process lock.

## Probe plan (S10)

Add `scripts/test-phase65-power-sensors.mjs` for offline generation / draw / suite-payment tests (like `test-phase6-sensors.mjs`) and Chromium S10 cases on `__BM1_PROBE__`.

**Minimum probe additions:**

```js
__BM1_PROBE__.phase65 = {
  snapshot: () => ({
    generation: listObserverGeneration(),
    draws: { passive: null, active: null, ew: 0 },
    suiteId: playerSuiteId(),
    payments: { cargo: null, speed: null, detectability: null },
    layers: __BM1_PROBE__.phase6.snapshot(),
    reman53: { key: 'bm-ship:53', aliased: false },
    alias304: resolveHullAlias(304), // → 2
    catalogWired: isLoadShipCatalogRequired()
  }),
  injectGeneration: (observerKey, value) => { /* fail setup if helper missing */ },
  injectSuite: (observerKey, suiteId) => {},
  setSensorMode: (observerKey, 'passive' | 'active') => {},
  injectRoleCurveQuartet: () => {}
};
```

Run, in order: existing `test:phase1`, `test:phase3`, `test:phase4`, `test:phase5`, `test:phase6`, `test:doctrine`, side-lane tests, `probe` (S4–S9), then new S10. A path that sets `firingSolution` from a suite, changes Reman 53, or requires `loadShipCatalog()` is a blocker.

Suggested first Chromium set:

1. **S10.1 / S10.7:** two generation fixtures; `ew` reserved at 0.
2. **S10.2 / S10.3:** draw split; emission still detectable; no invented layers.
3. **S10.4 / S10.5:** cargo hull suite swap; paid scout-freighter.
4. **S10.6:** tank/haul/scout/gun ordering.
5. **S10.8:** S9 subset replay (first-frame, layers, hidden, same-tick drop, science>ordinary).
6. **S10.9 / S10.10:** Reman 53 + `304 → 2`; no catalog wire.

## Recommended implementation order (dependencies)

1. Injectable generation + consumer snapshot, including `ew: 0` (S10.1, S10.7). Leave suite swap out.
2. Passive vs active draw on the existing scan/emission path (S10.2, S10.3). Replay S9.8.
3. Suite id on the actor → `sensorEquipment` / capability mod + payment axes (S10.4, S10.5).
4. Role-curve fixtures (S10.6).
5. Regression: S9 replay, Reman 53, aliases, no catalog wire (S10.8–S10.10).

Skip (3)–(4) if (1)–(2) are not green — suites must not ship on a free active scan. Skip catalog fill, EW effects, `unknown` enforcement, and unrest retunes entirely.

## Out of scope for the writer of a later slice

`BM1-remastered-work`; claiming a Referee Pass; rewriting Phase 6 gates 1–8; doctrine JSON culture→empire edits; weapon tables; EW effects; independently addressable deep-space locations; wiring 172/174 hulls; authored breakaway profiles; inventing 172 generation numbers; activating `unknown` access; treating scan flavor as inventory; requiring a fifth OPS tank; merging or splitting Reman 53; rewriting `hullAliases`; gifting fleet firing solutions; persisting `performance.now()` power deadlines; setting `hostile` / `attackId` / `engagement_authorized` from a suite or a scan.

## Sources

- Proposal: `docs/phase6/BM1-PHASE6.5-POWER-SENSORS-SUITES-PROPOSAL.md`
- Phase 6 brief + deps: `docs/phase6/BM1-PHASE6-SENSORS-CLOAK-SYSTEM-SPACE-PROPOSAL.md`, `docs/phase6/BM1-PHASE6-ENGINE-DEPENDENCIES.md`
- Landed Phase 6: `src/phase6-sensors.js`, `src/main.js` (`sensorActorFromPlayer`, `updatePowerSystems`, `performActiveScan` integration)
- Content / aliases / Reman: `bm-ships/ships.json`, `bm-ships/integration-rules.json`, `docs/APPROVED-HULL-MERGES.md`, `src/side-lane-repair-reman.js`
- Plan §8 / §11: `docs/revised-development-plan.md`
- Phase 5 companion shape: `docs/phase5/BM1-PHASE5-ENGINE-DEPENDENCIES.md`
