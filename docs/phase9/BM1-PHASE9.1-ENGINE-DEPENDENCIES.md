# BM1 Phase 9.1 proposal: engine dependencies

**Reviewed document:** `BM1-PHASE9.1-EW-ROBUSTNESS-PROPOSAL.md`  
**Reviewed against:** `Artemis2028/BM1-bakeoff` at `2b38a14` on `main` (14 September 2026), after Phase 9 EW / weapons engine (PR #33). Line numbers below refer to this head and may drift.  
**Method:** read the landed Phase 9 `ewBook` / four families / weapons matrix, Phase 6 contact book, Phase 6.5 reserved `ew` consumer + brown-out + suite slot, Phase 3 `makeBroadcast`, Phase 1 `playerFaction` / `playerSide`, Phase 4 `deliverReport` / allowlist, and doctrine fire facts. No engine changes made. This is a dependency/risk checklist for a later writer, not a post-implementation review and not permission to implement before Tenth scopes the lane. **Keep #33 Pass locked** — do not reopen Phase 9 gates or regress S14.

## Verdict in one paragraph

The 9.1 amend can be implemented without a rewrite, without a second contact book, without a sixth power consumer, and without touching delivered reports or Phase 9 ghosts-as-hulls. Prefer **thin new modules** (`src/phase91-*.js`) that subscribe to Phase 9 / 6.5 / 6 helpers. Spend-to-suppress is a richer `reservedEwDraw` input (catalog × A × H) plus a dedicated `ew_equipment` slot copied from the suite pattern — not a new energy religion and not a stolen weapon mount. Burn-through and RSS are a contest helper (`Q = E/(E+N)`, `N = √Σ(c²)`, radius `B × √Q`) with injectable magnitudes; the load-bearing invariant is **funded E + finite N ⇒ radius > 0**. Residue-before-void is a **stop** on today’s `degradeLiveLayers` setting `detected: false` when quality hits `none` as a jam success — keep an area/detected/emission row instead of deleting the contact. True-side labels read `playerSide` / `sideId` / `securityInstanceId` telemetry, never transponder claim. HoJ is a **matrix row** on the existing ten-column ledger **before** any `game_items.json` retune; seeker logic is emission-only / incarnation-lock / silence→coast and must not write `firingSolution` or `engagement_authorized`. Transponder is a claim field on the contact row (and/or broadcast), never a write to `state.playerFaction`. The load-bearing risks are all integration mistakes: off-budget jam; cloak-void; contact-delete; strongest-three / % ceiling; friendly-from-spoof; HoJ retune-first; gifted FS / auto-fire; Phase 1 identity rewrite; `git am` remastered patches; locking remastered watts; regressing #33.

## What already exists (do not reinvent)

| Need | Engine fact at `2b38a14` |
| --- | --- |
| Four info layers + book | `src/phase6-sensors.js`: `detected`, `identification` (`none`/`partial`/`known`), `trackQuality` (`none`/`area`/`coarse`/`firm`), `firingSolution`. `state.contactBook`. Caps: 32 contacts / 24 observers. `CONTACT_SOURCES` already includes `'ew_ghost'`. |
| Report seed is area-only | `seedFromReport` (~644): `detected: true`, `trackQuality: 'area'`, **`firingSolution: false`**, `source: 'report'`. Jamming may decay the live row; must not edit the Phase 4 report. |
| Same-tick lock drop | `applyLostTrackSameTick` (~750): drops FS / UI / AI together, keeps `lastKnown` area. Residue should use this drop path **without deleting the row**. |
| Ghost rows (Phase 9, keep) | `src/phase9-ew.js`: `EW_SOURCE = 'ew_ghost'`; `upsertGhostContact` hard-fails `firingSolution`; `createContactRecord` already clamps ghosts to area/partial. **Do not reuse `ew_ghost` for residue.** |
| Live jam degrade (gap) | `degradeLiveLayers` (~420): steps quality `firm→coarse→area→none` and ident `known→partial→none`; **`if (quality === 'none') contact.detected = false`**. That last step is the residue-before-void hole. `applySensorJamming` skips ghosts and does not delete reports — keep that. |
| Reserved EW consumer **on** | `src/phase65-power.js`: `POWER_CONSUMERS` includes `'ew'`; `EW_CONSUMER_NAME = 'ew'`; **`EW_EFFECTS_IMPLEMENTED = true`** (Phase 9 flipped this); `reservedEwDraw(activeDraw)` returns the active draw; `createPowerDraws` / `consumerDraws` bill `ew`; snapshot `ew: { name, draw, effectsImplemented: true }`. S14.1 / S10.7 family green. |
| Brown-out already kills EW | `applyBrownout` (~270): order `sensors-active` → **`ew`** → cloak → weapons → propulsion. Over-budget sets `next.ew = 0` and `ewStarved`. 9.1 must **weaken via H** on this path, not skip it. |
| Suite slot pattern to copy | `SUITE_SLOT_KIND = 'sensor_suite'`; `createSuite` sets `occupiesWeaponSlot: false`; `installSensorSuite` (~418) writes `sensorSuiteId` and asserts `weaponSlotsUnchanged: true`. **Jammer must not write `sensorSuiteId`.** |
| Sensor capability / equipment axis | `sensorCapability` (`phase6-sensors.js` ~532): role + equipment + age + `powerNorm` + hull + `capabilityMod` + mode. **No first-class Sensors-points integer S.** 9.1 maps S **injectably** onto this axis (Q2). `powerNormFromBudget` (~258) is the natural **H** hook. |
| Phase 9 effect book | `state.ewBook` via `emptyEwBook` / `startEffect` / `actorEwDraw` / `tickEw`. Magnitudes already injectable (`resolveEwMagnitudes` / `EW_MAGNITUDES`). Clock: `localElapsedMs`. Families: `sensor_jamming`, `deceptive_contacts`, `fire_control`, `comms_disruption`. Attribution default `record_only`. |
| Weapons matrix (read-only) | `src/phase9-weapons-matrix.js`: ten `MATRIX_COLUMNS`; `UNIVERSAL_SHIELD_BYPASS = false`; `FLASH_PRICES_ARE_LIVE_LOCKS = false`; tractor id 25 Device; `combatNumbersUnchanged` vs `BASELINE_COMBAT_NUMBERS`; `mappingDidNotAutoFill`. **HoJ = a new row here, not a retune.** |
| Fire facts | `liveFireFactsFromContact` (~1032): `engagement_authorized` only if extras say so. `liveFireFactsFromEw` deletes it; ghosts force `liveWeaponTrack: false`. `consultDoctrineFire` (`main.js`) still **`delete facts.engagement_authorized`**. |
| Broadcast ≠ identity | `makeBroadcast` (`phase3-checkpoints.js` ~268): `source` is `hull` / `declared` / `none`. Player broadcast today: `makeBroadcast({ faction: state.playerFaction, source: 'declared' })` (`main.js` ~6571). NPC: `source: npc?.broadcastSource \|\| 'hull'`. **No transponder claim field yet.** |
| Phase 1 identity | `state.playerFaction`, `state.playerSide` (`main.js` ~994–995). Reman **53** / `bm-ship:53` via catalog wire + side-lane unlock. Claim must not write these. |
| Access / unknown | Phase 3 `getVisitorAccessDecision`: `source: 'none'` → class `unknown`, **`enforceable: false`**. Phase 6 `UNKNOWN_ACCESS_ENFORCEMENT = false`. 9.1 forgetting may **deny access** using existing policy; it must not silently turn `unknown` enforcement on as a new religion. |
| P4 allowlist | `INCIDENT_KINDS` includes `access_noncompliance` / `access_notice`; `ACTING_ALLOWLIST` is `record_only` / `investigate` / `rescue` / `defer:*` / `ignore_unknown`; `protect` folds (`NON_ACTING_FOLD`). Default spoof/jam attribution: `record_only`. |
| Delivered reports | `deliverReport` / `observerKnowsIncident` unchanged contract. Phase 9 `tryDeliverReport` may delay **new** sends under comms disruption. |
| Probe surface | `globalThis.__BM1_PROBE__.phase9` (`createPhase9ProbeApi`, `main.js` ~23288): inject jammer/ghost/delivered report, snapshot `ew` draw, ghosts vs `npcCount`, matrix, boarding flags. S15 should add **`phase91`** rather than scrape private state or fork S14. |
| Offline tests | `scripts/test-phase9-ew-weapons.mjs` + Chromium S14. Keep green. Add `scripts/test-phase91-ew-robustness.mjs`. |

## Hooks the writer will have to touch

Prefer thin new files rather than growing `phase9-ew.js` into a second religion:

| Proposed module | Responsibility |
| --- | --- |
| `src/phase91-ew-slot.js` | `ew_equipment` slot: empty default, one jammer, no stack, Compact/Tactical/Fleet catalog **shape** with injectable magnitudes. Must not occupy `weaponSlots` or `sensorSuiteId`. |
| `src/phase91-power.js` | A × H × f mapping onto `reservedEwDraw` / `consumerDraws`. S=0 → unavailable. Spin-up / cooldown on `localElapsedMs`. Brown-out weakens (H→0 / `ewStarved`). |
| `src/phase91-contest.js` | Per-emitter `cᵢ` (paid only), self-cancel, `N = √Σ(c²)`, `Q = E/(E+N)`, RF radius `B × √Q`, Clear/Interference, own/friendly/mixed labels from **true side**. |
| `src/phase91-residue.js` | Residue upsert / jam outcome that **cannot** void a living subject. Optional `source: 'ew_residue'` **added** to `CONTACT_SOURCES` without removing `ew_ghost`. |
| `src/phase91-transponder.js` | Claim enum `off` / `true` / `spoofedFaction`. Read-only vs Phase 1 identity. Forgetting ladder helpers (suspicion / challenge / deny / optional P4 open). |
| `src/phase91-hoj.js` | Seeker: emission-only, incarnation-lock, silence→coast, private knowledge, no FS / `engagement_authorized` inject. **Only after** a matrix row exists. |
| `src/phase9-weapons-matrix.js` | **Append** a HoJ / anti-emitter row (unmounted/proposed). **Zero** `BASELINE_COMBAT_NUMBERS` / `game_items.json` edits. |
| `src/phase9-ew.js` | Subscribe: jam family calls contest + residue instead of `detected: false` void. Do not replace four families. |
| `src/phase65-power.js` | Pass-through: `consumerDraws({ ew })` already accepts a number. Do **not** add a sixth consumer. Optional: document H from `powerNormFromBudget`. |
| `src/phase6-sensors.js` | Optional `CONTACT_SOURCES` + `'ew_residue'`; `createContactRecord` must **not** treat residue as ghost; `enforceFiringSolution` still drops FS when not firm. |
| `src/main.js` | Thin: serialize slot/claim/contest snapshot beside `ewBook`; `__BM1_PROBE__.phase91`; controls Off/On/spin-up/cooldown/ECCM. |

Do **not** implement 9.1 inside `src/phase4-incidents.js` or `src/phase5-objectives.js` as a sneak rewrite. Do **not** implement residue inside `createNpcShip`. Do **not** `git am` remastered patches.

| Existing path | Required integration |
| --- | --- |
| `reservedEwDraw` / `consumerDraws` / `applyBrownout` | Jammer On ⇒ `ew` draw = catalog × A × H **> 0**. Brown-out sets H/draw toward 0 and **must** shrink strength/radius. Off-budget field **fails**. |
| `installSensorSuite` | Copy the “does not steal weapon slots” assert. New installer must also assert `sensorSuiteId` unchanged. |
| `degradeLiveLayers` / `applySensorJamming` | Stop at residue (area/detected/emission). Still drop `firingSolution` via `applyLostTrackSameTick`. Still skip ghosts. Still `reportsDeleted: false`. |
| `createContactRecord` / `upsertContact` | Residue path: living `subjectKey` (`securityInstanceId`), `ghost: false`, `firingSolution: false`, row retained. Do not overload `report` or `ew_ghost`. |
| `seedFromReport` | **Unchanged.** Residue may replace a live firm track; the report row stays. |
| `actorEwDraw` / `startEffect` | Sensor-jamming family still a named costed effect. 9.1 magnitudes (A, H, f, catalog) inject **into** draw, not around it. |
| `listMatrixColumns` / `buildWeaponsMatrix` | New HoJ row with all ten columns + `provenance: 'new'`. `combatNumbersUnchanged` stays true. |
| `consultDoctrineFire` / `liveFireFactsFromEw` / `playerForceMayAutoEngage` | Pass layer facts only. Keep the delete. HoJ in flight / residue.emission / spoof must not flip `mayAutoEngage` or stuff `engagement_authorized`. |
| `makeBroadcast` / player+NPC broadcast helpers | Claim layer may **feed** a declared/none broadcast. Must not write `state.playerFaction` / `playerSide`. Spoof is claim, not `sideId`. |
| `openIncident` / `deliverReport` / `foldDoctrineResponse` | Optional forgetting incident on allowlist only. Default `record_only`. No `protect`→fire. No `erasedByJamming`. |
| `damageNpcShip` | HoJ collateral = ordinary hit. Default shields-then-hull. Phase 1 credit only `player` / `playerEscort`. |
| Weapon fire / `consumeWeaponEnergy` | HoJ launch bills **weapons** / ammo, not `ew`. Jammer bills `ew`, not weapons. |
| `loadGame` / `saveGame` / `resetRunState` | Serialize slot + claim + contest/seeker books beside `ewBook`. Load still wipes `systemStates` first. Restore cloak → contact book → ew → 9.1 contest **before** first sensor/AI pass. No `performance.now()` deadlines. Key emitters on `securityInstanceId`. |
| `__BM1_PROBE__` | Add `phase91.snapshot` / injectors (see probe plan). **Fail setup if missing.** Keep `phase9` intact for S14 replay. |

Do **not** hook `loadShipCatalog` as a rewrite, independence mint, `meetPackPurchaseDecision`, Phase 8 stock reprint, boarding, or Reman identity from spoof.

## Risks

### 1. Off-budget jam / fifth energy religion (gate 1)

A parallel “jammer watts” that ignores `consumerDraws`, a sixth `POWER_CONSUMERS` entry, or effects-on-at-draw-0 (including spin-up that rewrites contacts before `ew` bills) fails spend-to-suppress and inverts S14.1 / S10.7.

**Gate:** S15.1, S15.3, S15.19.

### 2. Slot theft / jammer stack (gate 1)

Fitting the jammer into `weaponSlots`, overwriting `sensorSuiteId`, or stacking two SKUs in one slot to beat RSS diminishing returns fails the dedicated-slot rule and Phase 6.5 suite payment.

**Gate:** S15.2.

### 3. Cloak-void / Q driven to 0 for funded receivers (gate 2)

`Q = 0` when `E > 0` (clamps, strongest-three leftover, 59.2% ceiling, `N = Infinity`) fails burn-through-always-available. UI copy that says “cloaked” because a jammer ticked is the same fail.

**Gate:** S15.4, S15.5, S15.20.

### 4. Delete-the-contact (gate 3)

`degradeLiveLayers` → `detected: false` plus prune, `delete contacts[id]`, or treating jam success as “row gone” is cloak invisibility. Residue marked `ghost: true` on a living `subjectKey` will then hit Phase 9 ghost destroy/salvage guards incorrectly — or worse, spawn a hull.

**Gate:** S15.6, S15.7, S15.18.

### 5. Strongest-three / % ceiling / unpaid RSS (gate 4)

`N = max(cᵢ)`, `N = sum` without square-root diminishing, a top-3 cutoff, or adding brown-out-dead emitters into Σ fails RSS-all-paid. Locking remastered 59.2%/35% as constants fails the blind-bake-off process lock.

**Gate:** S15.8, S15.20.

### 6. Friendly-from-claim / invented foreign ID (gates 4, 6)

Labeling interference from `spoofedFaction` or from leftover N as a polity name fails true-side. Using hull art as transponder (Phase 3 already forbade this beyond `broadcast.source`) fails the same way.

**Gate:** S15.9, S15.10, S15.14.

### 7. HoJ retune before matrix row (gate 5 + Phase 9 gate 4)

Editing `game_items.json` / `DEFAULT_WEAPON_CATALOG` / `BASELINE_COMBAT_NUMBERS` to “add a HoJ gun” in the first 9.1 engine PR without a ten-column row fails even if residue is clean. Auto-filling empty slots to host it fails mapping (S14.15 family).

**Gate:** S15.11, S15.18.

### 8. Gifted FS / `engagement_authorized` / jam-auto-fire (gate 5 + Phase 9 gate 5)

HoJ launch writing observer `firingSolution`, seeker tracking a silent/cloaked hull, `liveFireFactsFromContact(..., { engagementAuthorized: true })`, or `mayAutoEngage` true because “they jammed us” / “spoof mismatch” fails fire gates. Silence that still homes perfectly fails incarnation-lock / coast.

**Gate:** S15.12, S15.13, S15.16.

### 9. Transponder rewrites Phase 1 identity (gate 6)

`state.playerFaction = spoofedFaction`, flipping `playerSide`, minting Reman access, or changing ROE mode from a claim fails. Silent-as-cloak (merging claim-off into `isPlayerCloaked` / NPC cloak clocks) fails silent ≠ cloak.

**Gate:** S15.14, S15.15, S15.22.

### 10. Forgetting → fire / FLASH / standing (gate 6 + preservation)

Mismatch blip that `pushFlash`es, `adjustFactionStanding`s, sets `attackId`, or skips the allowlist into `protect` fails S6.13 / S6.14 / S6.4. Default is suspicion/challenge/deny + optional `record_only`.

**Gate:** S15.16, S15.22.

### 11. Unsend reports / regress #33 (gate 7)

Any jam/residue/claim tick that deletes `reports[id]`, flips `delivered`, or clears `knownIncidentIds` fails Phase 9 gate 3. Spawning ghost hulls, boarding hooks, or a universal bypass “for HoJ” fails the rest of #33.

**Gate:** S15.17, S15.18, S15.22.

### 12. Book inside `systemStates` / keyed on `npc.id`

Same Phase 3/4/5/6/9 landmine. Load wipes the cache; ambient reuse transfers a jammer, residue, HoJ lock, or spoof onto a newcomer. HoJ incarnation-lock **must** use `securityInstanceId`.

**Gate:** S15.13, S15.21.

### 13. `performance.now()` spin-up / coast clocks (process / plan §13)

Spin-up ~1 s, cooldown ~2 s, seeker coast, and contest snapshots must use `localElapsedMs`. Do not add a wall-clock `endsAt` next to the known Phase 6 cloak leftover.

**Gate:** S15.1, S15.12; process lock.

### 14. `git am` remastered / locked watts (process)

Applying remastered EW complete patches, or copying remastered EU/s / prices / wattages into non-overridable constants, fails the blind bake-off rule even if gameplay “feels right.” Background shapes (A, √Q, RSS, Compact/Tactical/Fleet) are allowed; numbers stay injectable.

**Gate:** S15.20.

## Probe plan (S15)

Add `scripts/test-phase91-ew-robustness.mjs` for offline slot / A×H draw / RSS / Q / residue / claim / matrix-row tests (like `test-phase9-ew-weapons.mjs`) and Chromium S15 cases on `__BM1_PROBE__.phase91`. **Replay S14** via existing `phase9` injectors; do not break them.

**Minimum probe additions:**

```js
__BM1_PROBE__.phase91 = {
  snapshot: () => ({
    power: {
      consumers: /* POWER_CONSUMERS — still exactly the five */,
      ew: /* { name: 'ew', draw, effectsImplemented: true } */,
      A: /* injectable aperture */,
      H: /* funded / brown-out fraction */,
      S: /* mapped Sensors points */,
      offBudget: /* draw===0 && jammerOn */,
      ewStarved: /* applyBrownout.ewStarved */
    },
    slot: {
      kind: 'ew_equipment',
      fitted: /* null | compact|tactical|fleet */,
      weaponSlotsUnchanged: true,
      sensorSuiteIdUnchanged: true,
      stacked: false
    },
    contest: {
      contributions: /* paid c_i only */,
      N: /* sqrt(sum c^2) */,
      E: /* funded receiver */,
      Q: /* E/(E+N) */,
      rfRadius: /* B * sqrt(Q) */,
      label: /* clear|interference + own|friendly|mixed|unlabeled */
    },
    residue: listResidueContacts(ensureContactBook()),
    ghosts: listGhostContacts(ensureContactBook()),
    npcCount: (state.npcShips || []).length,
    claim: /* off|true|{spoofedFaction} */,
    playerFaction: state.playerFaction,
    playerSide: state.playerSide,
    reman53: /* unlock unchanged */,
    mayAutoEngage: /* sample unchanged */,
    engagementAuthorizedPresent: false,
    hoj: {
      matrixRow: /* ten columns + provenance new */,
      numbersUnchanged: combatNumbersUnchanged(WEAPON_CATALOG, BASELINE_COMBAT_NUMBERS),
      seeker: /* incarnation, emission, coast, giftedFs: false */
    },
    report: lastDeliveredReport(state.incidentLedger),
    knownIds: observerKnownIds(state.incidentLedger, 'player'),
    magnitudesLockedFromRemastered: false,
    log: state.log
  }),
  injectJammerSlot: (opts) => { /* fail setup if slot helper missing */ },
  injectJamField: (opts) => { /* paid emitters; fail if contest missing */ },
  injectDeepJam: (opts) => {},
  injectBurnThroughObserver: (opts) => {},
  injectTransponderClaim: (opts) => {},
  injectHojLaunch: (opts) => { /* fail setup if matrix row missing */ },
  silenceEmitter: (opts) => {},
  tick91: (localElapsedMs) => {},
  lastRefuseFire: () => {}
};
```

Run, in order: existing `test:phase1`, `test:phase3`, `test:phase4`, `test:phase5`, `test:phase6`, `test:phase65`, `test:phase7`, `test:phase8`, `test:phase9`, `test:catalog`, `test:doctrine`, side-lane tests, `probe` (S4–S14), then new S15. A path that voids a contact, drives Q to 0 for E>0, bills jam off-`ew`, writes `playerFaction` from spoof, gifts FS from HoJ, or changes `mayAutoEngage` from jam is a blocker.

Suggested first Chromium set (fatal integrations):

1. **S15.1 / S15.2 / S15.3 / S15.19:** draw × A × H on reserved `ew`; dedicated slot; S=0 unavailable; Phase 6/6.5/S14.1 replay.
2. **S15.4 / S15.5 / S15.8 / S15.9 / S15.10:** radius > 0; RSS; self-cancel; true-side labels.
3. **S15.6 / S15.7 / S15.17:** residue survives; no gifted lock; delivered P4/P5 survive.
4. **S15.11 / S15.12 / S15.13:** HoJ row; silence→coast; no FS / `engagement_authorized`; incarnation-lock.
5. **S15.14 / S15.15 / S15.16:** claim ≠ identity; silent ≠ cloak; forgetting ≠ auto-fire.
6. **S15.18 / S15.20 / S15.21 / S15.22:** #33 preservation; no `git am` / no remastered watts; both sides; S6/S8/S11/S13 still green.

## Recommended implementation order (dependencies)

1. `ew_equipment` slot + injectable Compact/Tactical/Fleet **shape** (S15.2). **Zero** weapon-slot / suite theft.
2. Spend-to-suppress: map S/A/H/f into `reservedEwDraw`; spin-up/cooldown `localElapsedMs`; brown-out weakens (S15.1, S15.3). No contest yet.
3. Contest RSS + Q + burn-through radius (S15.4–S15.5, S15.8–S15.10). Assert funded ⇒ radius > 0 **before** deepening jam.
4. Residue-before-void on the jam family (S15.6–S15.7). Hard-fail if the living row disappears or `npcShips` grows. **Do not ship a stronger jam on top of contact-delete.**
5. Transponder claim layer + forgetting ladder default `record_only` (S15.14–S15.16).
6. HoJ **matrix row only** (S15.11). Still zero combat retune.
7. HoJ seeker helper (S15.12–S15.13) only if (6) is green.
8. Preservation + both-sides + no remastered lock (S15.17–S15.22). Replay S14.

Skip (7) if (6) is not reviewed. Skip (4)’s “deeper jam” if residue still voids. Skip boarding, catalog rewire, Reman, market restock, `git am`, and weapon number retunes entirely.

## Out of scope for the writer of a later slice

`BM1-remastered-work` as source; `git am` remastered EW; remastered base `758665e`; claiming a Referee Pass; reopening Phase 9 six gates / regressing #33; rewriting `seedFromReport` to grant a lock; deleting `deliverReport` rows; retuning `game_items.json` numbers before a HoJ matrix row; a global shield-bypass helper; moving tractor off the device slot; auto-filling empty `weaponSlots`; stealing the suite slot; a sixth power consumer; boarding / capture / command transfer; lobes / ECCM mesh / deeper spoof UI; `unknown` access enforcement as a new religion; setting `hostile` / `attackId` / `destroyed` / `engagement_authorized` / `playerFaction` from a jammer, residue, HoJ seeker, or transponder claim; a second contact book; persisting `performance.now()` 9.1 deadlines; Phase 8 restock; a second Reman id; strongest-three / % ceilings as locked constants.

## Sources

- Proposal: `docs/phase9/BM1-PHASE9.1-EW-ROBUSTNESS-PROPOSAL.md`
- Phase 9 locked baseline: `docs/phase9/BM1-PHASE9-EW-WEAPONS-PROPOSAL.md`; `docs/phase9/BM1-PHASE9-ENGINE-DEPENDENCIES.md`; `src/phase9-ew.js`; `src/phase9-weapons-matrix.js`; PR #33 (`2b38a14`)
- Plan §4 / §11: `docs/revised-development-plan.md`
- Phase 6: `src/phase6-sensors.js`; `docs/phase6/BM1-PHASE6-SENSORS-CLOAK-SYSTEM-SPACE-PROPOSAL.md`
- Phase 6.5: `src/phase65-power.js`; `docs/phase6/BM1-PHASE6.5-POWER-SENSORS-SUITES-PROPOSAL.md`
- Phase 4 reports / FLASH / allowlist: `src/phase4-incidents.js`; `docs/phase4/`
- Phase 5 board: `src/phase5-objectives.js`; `docs/phase5/`
- Phase 3 broadcast / access: `src/phase3-checkpoints.js` (`makeBroadcast`, `getVisitorAccessDecision`)
- Fire facts: `src/doctrine.js` (`deriveLiveFireFacts`); `src/main.js` (`consultDoctrineFire`, `playerFaction` / `playerSide`)
- Weapons data: `data/game_items.json` (do not retune)
- Probe: `src/main.js` `createPhase9ProbeApi`; `scripts/test-phase9-ew-weapons.mjs`
- Remastered EW pack / DESIGN: background shapes only — not a patch, not a constant lock
- Phase 9 companion shape (this file’s template): `docs/phase9/BM1-PHASE9-ENGINE-DEPENDENCIES.md`
