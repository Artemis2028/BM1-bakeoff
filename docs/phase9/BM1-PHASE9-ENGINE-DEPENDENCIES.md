# BM1 Phase 9 proposal: engine dependencies

**Reviewed document:** `BM1-PHASE9-EW-WEAPONS-PROPOSAL.md`  
**Reviewed against:** `Artemis2028/BM1-bakeoff` at `02addb6` on `main` (13 September 2026), after Phase 8 finite markets (PR #31). Line numbers below refer to this head and may drift.  
**Method:** read the landed Phase 6 contact book, Phase 6.5 reserved `ew` consumer, Phase 4 `deliverReport` / FLASH, Phase 5 board knowledge, doctrine fire facts, weapon catalog / slots, and shield absorb path. No engine changes made. This is a dependency/risk checklist for a later writer, not a post-implementation review and not permission to implement before Tenth scopes the lane.

## Verdict in one paragraph

The proposal can be implemented without a rewrite, without a second contact book, and without touching convoy overdue or delivered reports. EW should copy the Phase 4/5/6 pattern: versioned `ewBook` beside `contactBook` / `incidentLedger`, clocks from `localElapsedMs`, identity on `securityInstanceId` — never inside `systemStates`, never as fake `npcShips`. The reserved Phase 6.5 `ew` line is the only legal budget hook (`EW_EFFECTS_IMPLEMENTED` is still false; `reservedEwDraw()` is 0). Ghosts are extra `createContactRecord` rows with a new source and a hard `firingSolution === false`. The weapons matrix is a **reviewed ledger** in front of `data/game_items.json`; it is not a retune. The load-bearing risks are all integration mistakes: spawning a ghost hull; gifting `firingSolution`; deleting `reports[id]` or `knownIncidentIds`; spending EW at draw 0; collapsing pursuit / permission / the per-weapon gate; flipping `engagement_authorized`; treating tractor as cargo; inheriting a lore shield bypass; opening boarding.

## What already exists (do not reinvent)

| Need | Engine fact at `02addb6` |
| --- | --- |
| Four info layers + book | `src/phase6-sensors.js`: `detected`, `identification` (`none`/`partial`/`known`), `trackQuality` (`none`/`area`/`coarse`/`firm`), `firingSolution`. `state.contactBook` beside ledger/board. Caps: 32 contacts / 24 observers. |
| Report seed is area-only | `seedFromReport` (~624): `detected: true`, `trackQuality: 'area'`, **`firingSolution: false`**, `source: 'report'`. |
| Contact sources | `CONTACT_SOURCES` = `passive` / `active_scan` / `report` / `visual`. Ghosts need a **new** source (proposal: `ew_ghost`) or a `ghost` flag. Do not overload `report`. |
| Same-tick lock drop | `applyLostTrackSameTick` / `enforceFiringSolution`. Lost track clears UI + AI. Ghosts must use the same drop path and must never start as a lock. |
| Reserved EW consumer | `src/phase65-power.js`: `POWER_CONSUMERS` includes `'ew'`; `EW_CONSUMER_NAME = 'ew'`; `EW_EFFECTS_IMPLEMENTED = false`; `reservedEwDraw()` returns **0**; `createPowerDraws` forces `ew: 0` while the flag is false; snapshot `ew: { name, draw: 0, effectsImplemented: false }`. S10.7 green. |
| Shared generation | `resolveGeneration` / `consumerDraws` / `applyBrownout`. Sensors already split passive/active. Suites do not invent layers. |
| Delivered reports | `src/phase4-incidents.js` `deliverReport` (~593): writes `store.reports[reportId]` with `delivered: input.delivered !== false`; grants `observerCopies[recipientKey].knownIncidentIds`. Duplicate sender/recipient/incident returns the existing row. |
| Observer knowledge | `observerKnowsIncident` / `grantObserverCopy`. Load restores `reports` + `observerCopies` (`serializeIncidentLedger` ~873). |
| FLASH append-only | Phase 4: withdrawn-after-noncompliance does not `pushFlash` (S6.14). Jamming must not un-pulse or impersonate a second offense. |
| Phase 5 knowledge | `src/phase5-objectives.js` board + close tokens. Pirates/patrols evaluate from **delivered** knowledge. Overdue ≠ destroyed ≠ attacker. |
| Fire facts | `liveFireFactsFromContact` (`phase6-sensors.js` ~1012): `contactDetected` / `identityKnown` / `liveWeaponTrack`. `engagement_authorized` only if extras say so — **do not pass that extra**. |
| Doctrine fire | `consultDoctrineFire` (`src/main.js` ~7554): builds `deriveLiveFireFacts`, then **`delete facts.engagement_authorized`**. Today it still hardcodes `weaponUsable: true`, `weaponReady: true`, `insideEquippedRange: true` — a later honest per-weapon wire may tighten those **without** injecting permission. |
| Pursuit ≠ fire | Phase 1 `isWithinPursuitRange`; hunters may chase beyond shot range. Probe family: pursuit vs range. |
| Shield absorb (default) | `damageNpcShip` (~15616): `shieldDamage = min(combatShields, amount)`, remainder to hull. Stations same (~15710). **No** per-weapon bypass flag. |
| Weapon catalog | `data/game_items.json` `weapons[]` plus `DEFAULT_WEAPON_CATALOG` in `main.js`. Three slots: `weaponSlots` length 3. Tractor **id 25**, `type: Device`. Two “Disruptor Cannon” rows (ids 6 and 7). Thaleron id 26 Heavy. Cutting beam id 5. |
| Flash prices (docs only) | `docs/GUIDED-CONVERGENCE.md` §1. Not engine constants. |
| Empty-slot gravity | Player defaults `[DEFAULT_WEAPON_ID, null, null]` (`DEFAULT_WEAPON_ID = 1`). NPC `getNpcDefaultWeaponSlots`. Mapping check must **not** “fix” empties by auto-filling. |
| Probe surface | `globalThis.__BM1_PROBE__` already has `phase6`, `phase65`, `phase8`. S14 should add `phase9` rather than scrape private state. |

## Hooks the writer will have to touch

Prefer a new `src/phase9-ew.js` (effect book, family contract, ghost upsert that hard-fails `firingSolution`) plus a thin `src/phase9-weapons-matrix.js` (read-only ledger / mapping). Thin `main.js` integration only. Do **not** implement EW inside `src/phase4-incidents.js` or `src/phase5-objectives.js` as a sneak rewrite. Do **not** implement ghosts inside `createNpcShip`.

| Existing path | Required integration |
| --- | --- |
| `src/phase65-power.js` `reservedEwDraw` / `EW_EFFECTS_IMPLEMENTED` / `createPowerDraws` | When an effect is active, `ew` draw **> 0**. Keep the flag false until all four families exist as named costed effects. Do not add a sixth consumer. |
| `updatePowerSystems` / `consumerDraws` / `applyBrownout` | Subtract `ew` while effects run. Brown-out may kill EW. EW must not skip the pool. |
| `createContactRecord` / `upsertContact` / `enforceFiringSolution` | Ghost path: `firingSolution` forced false; `trackQuality` `area` or worse; `subjectKey` not a living `securityInstanceId`. Optionally extend `CONTACT_SOURCES`. |
| `seedFromReport` | **Unchanged** contract. Jamming may decay the live row; it must not edit the Phase 4 report. |
| `applyLostTrackSameTick` | Ghosts and jammed locks drop UI/AI the same tick. No leftover `combatTargetId`. |
| `deliverReport` / `observerKnowsIncident` | Comms family may **delay or fail a new** deliver. Never delete `reports[id]`, never set `delivered: false`, never splice `knownIncidentIds`. |
| Phase 5 fill/worsen / overdue | Subscribe as readers. Jammed track ≠ `destroyed` / `attackerId` / worsen. |
| `consultDoctrineFire` / `liveFireFactsFromContact` / `playerForceMayAutoEngage` | Pass layer facts only. Keep the `engagement_authorized` delete. Fire-control may clear `liveWeaponTrack`. Must not flip `mayAutoEngage` true. |
| `damageNpcShip` / player/station damage | Default shields-then-hull. Any exception is a **matrix row flag**, not a global. |
| Weapon fire / `consumeWeaponEnergy` | Still the **weapons** consumer. Do not bill shots to `ew`. |
| Tractor / Phase 3 `unable_to_comply` | Stay a slot device. Not boarding. |
| `loadGame` / `saveGame` / `resetRunState` | Serialize `ewBook` (+ matrix is data, not run state). Load still wipes `systemStates` first. Restore cloak → contact book → ew effects **before** first sensor/AI pass. No `performance.now()` deadlines. |
| `__BM1_PROBE__` | Snapshot budget `ew` draw, effect families, ghost rows vs `npcShips.length`, report ids, `knownIncidentIds`, `firingSolution`, `mayAutoEngage`, matrix columns, tractor type, shield absorb on an ordinary beam. Inject jammer / ghost / delivered report; **fail setup if missing**. |

Do **not** hook `loadShipCatalog` as a rewrite, independence mint, `meetPackPurchaseDecision`, Phase 8 stock reprint, or boarding.

## Risks

### 1. EW effects with draw 0 (gate 1)

Leaving `EW_EFFECTS_IMPLEMENTED === false` while contacts rewrite, or adding a parallel “jammer strength” that ignores `consumerDraws`, fails the reserved-budget gate and inverts S10.7.

**Gate:** S14.1, S14.10, S14.19.

### 2. Ghost spawned as a hull (gate 2)

`createNpcShip` / ambient traffic / a “decoy” escort with full `combatHull` is the hard fail. Salvage, standing, and Phase 5 worsen will fire as if a ship died.

**Gate:** S14.3, S14.5.

### 3. Gifted `firingSolution` (gates 2, 5)

`createContactRecord` already allows `firingSolution === true` when `trackQuality === 'firm'`. A ghost upsert that passes `firm` + true fails. Fire-control that **sets** a lock (instead of dropping one) fails the per-weapon gate.

**Gate:** S14.4, S14.16.

### 4. Unsend / wipe delivered reports (gate 3)

`delete store.reports[id]`, `delivered = false`, or rebuilding `observerCopies` on a jammer tick fails even if the live track correctly decays. Comms disruption that “replays” `deliverReport` as a retract is the same fail.

**Gate:** S14.6, S14.7, S14.8.

### 5. FLASH / standing side effects (gate 3 + preservation)

A jammer tick that `pushFlash`es or `adjustFactionStanding`s for a tokenized kill fails S6.14 / S6.4. Default attribution is journal / optional `record_only`.

**Gate:** S14.9, S14.20.

### 6. Overhaul before matrix (gate 4)

Editing `game_items.json` damage/cooldown/range/price, or `DEFAULT_WEAPON_CATALOG`, in the first EW PR without a reviewed ten-column ledger fails gate 4 even if ghosts are clean.

**Gate:** S14.12.

### 7. Universal shield bypass (gate 4)

`if (name.includes('polaron') \|\| name.includes('transphasic')) skipShields` as a global fails. Row-scoped notes only. Ordinary Type X / photon must still hit shields first.

**Gate:** S14.14.

### 8. Tractor / mapping / auto-fill (gate 4)

Moving tractor to cargo or flags inventory, collapsing Canon/Cannon/Turret, or filling empty `weaponSlots` with id 1 “so the matrix has hosts” fails mapping + convergence §1 / §3 cite.

**Gate:** S14.13, S14.15.

### 9. Permission inject (gate 5)

`liveFireFactsFromContact(..., { engagementAuthorized: true })`, culture→empire from a weapon family, or `mayAutoEngage` true because a ghost identified as a war target fails Phase 1/6.

**Gate:** S14.16, S14.17.

### 10. Boarding creep (gate 6)

Tractor hold, cutting beam, or “capture when hull < 10%” pulled in from convergence §4 fails the out-of-slice gate.

**Gate:** S14.18.

### 11. Book inside `systemStates` / keyed on `npc.id`

Same Phase 3/4/5/6 landmine. Load wipes the cache; ambient reuse transfers a jammer or a ghost onto a newcomer.

**Gate:** S14.3, S14.11.

### 12. `performance.now()` EW clocks (process / plan §13)

New effect deadlines must use `localElapsedMs`. Do not add a wall-clock `endsAt` next to the known Phase 6 cloak leftover.

**Gate:** S14.10; process lock.

## Probe plan (S14)

Add `scripts/test-phase9-ew-weapons.mjs` for offline ghost-row / report-survive / matrix-column / draw>0 tests (like `test-phase65-power-sensors.mjs` / `test-phase8-markets.mjs`) and Chromium S14 cases on `__BM1_PROBE__`.

**Minimum probe additions:**

```js
__BM1_PROBE__.phase9 = {
  snapshot: () => ({
    power: {
      consumers: /* POWER_CONSUMERS */,
      ew: /* { name: 'ew', draw, effectsImplemented } */
    },
    ewBook: serializeEwBook(state.ewBook),
    ghosts: listGhostContacts(ensureContactBook()),
    npcCount: (state.npcShips || []).length,
    report: lastDeliveredReport(state.incidentLedger),
    knownIds: observerKnownIds(state.incidentLedger, 'player'),
    layers: __BM1_PROBE__.phase6.snapshot(),
    mayAutoEngage: /* sample unchanged */,
    engagementAuthorizedPresent: false,
    matrix: listMatrixColumns(), // ten columns + provenance; read-only
    tractor: { id: 25, type: 'Device', slot: true },
    log: state.log
  }),
  injectJammer: (opts) => { /* fail setup if ew helper missing */ },
  injectGhost: (opts) => {},
  injectDeliveredReport: (opts) => {},
  injectInFlightReport: (opts) => {},
  tickEw: (localElapsedMs) => {},
  tryDestroyGhost: () => {},
  fireAt: (subjectKey) => {},
  lastRefuseFire: () => {}
};
```

Run, in order: existing `test:phase1`, `test:phase3`, `test:phase4`, `test:phase5`, `test:phase6`, `test:phase65`, `test:phase7`, `test:phase8`, `test:catalog`, `test:doctrine`, side-lane tests, `probe` (S4–S13), then new S14. A path that unsends a report, spawns a ghost hull, sets `firingSolution` on a ghost, or changes `mayAutoEngage` from EW is a blocker.

Suggested first Chromium set (fatal integrations):

1. **S14.1 / S14.10 / S14.19:** `ew` draw > 0; four-part contract; Phase 6/6.5 replay.
2. **S14.3 / S14.4 / S14.5:** ghost is a row; no lock; no kill.
3. **S14.6 / S14.7 / S14.8 / S14.9:** delivered P4/P5 survive; in-flight may fail; no FLASH rewrite.
4. **S14.12 / S14.13 / S14.14 / S14.15:** matrix columns; three disruptors; tractor slot; no global bypass; mapping marks.
5. **S14.16 / S14.17 / S14.18:** three fire steps; no culture inject; boarding absent.
6. **S14.11 / S14.20:** both sides; S6/S8/S11/S13 still green.

## Recommended implementation order (dependencies)

1. Read-only weapons matrix + mapping marks (S14.12–S14.15). **Zero** combat retune.
2. `ewBook` + `ew` draw > 0 while a fixture effect runs (S14.1, S14.10). No ghosts yet.
3. Jamming against **live** layers only; assert report/observer-copy unchanged (S14.2, S14.6–S14.9).
4. Ghost upsert (S14.3–S14.5). Hard-fail if `npcShips` grows or `firingSolution` is true.
5. Fire-control drop + comms delay-new-only (S14.8, S14.16).
6. Both-sides fixture + preservation (S14.11, S14.17–S14.20).

Skip (4)–(5) if (1)–(3) are not green — ghosts must not ship on top of a report-wiping jammer. Skip boarding, catalog rewire, Reman, market restock, and weapon number retunes entirely.

## Out of scope for the writer of a later slice

`BM1-remastered-work`; claiming a Referee Pass; rewriting `seedFromReport` to grant a lock; deleting `deliverReport` rows; retuning `game_items.json` numbers before a reviewed matrix; a global shield-bypass helper; moving tractor off the device slot; auto-filling empty `weaponSlots`; boarding / capture / command transfer; flags/passes inventory; `unknown` access enforcement; setting `hostile` / `attackId` / `destroyed` / `engagement_authorized` from a jammer, a ghost, or a matrix lore flag; a second contact book; persisting `performance.now()` EW deadlines; Phase 8 restock; a second Reman id.

## Sources

- Proposal: `docs/phase9/BM1-PHASE9-EW-WEAPONS-PROPOSAL.md`
- Plan §4 / §11: `docs/revised-development-plan.md`
- Flash table / tractor / empty-armable / boarding defer: `docs/GUIDED-CONVERGENCE.md` §§1, 3, 4
- Phase 6: `src/phase6-sensors.js`; `docs/phase6/BM1-PHASE6-SENSORS-CLOAK-SYSTEM-SPACE-PROPOSAL.md`
- Phase 6.5: `src/phase65-power.js`; `docs/phase6/BM1-PHASE6.5-POWER-SENSORS-SUITES-PROPOSAL.md`
- Phase 4 reports / FLASH: `src/phase4-incidents.js`; `docs/phase4/`
- Phase 5 board: `src/phase5-objectives.js`; `docs/phase5/`
- Fire facts: `src/doctrine.js` (`deriveLiveFireFacts`); `src/main.js` (`consultDoctrineFire`, `damageNpcShip`)
- Weapons data: `data/game_items.json`
- Phase 8 companion shape: `docs/phase8/BM1-PHASE8-ENGINE-DEPENDENCIES.md`
