# BM1 boarding proposal: engine dependencies

**Reviewed document:** `BM1-BOARDING-CAPTURE-PROPOSAL.md`  
**Reviewed against:** `Artemis2028/BM1-bakeoff` at `f9f077f` on `main` (15 September 2026), after Phase 9.2 EW-depth engine (PR #37). Line numbers below refer to this head and may drift.  
**Method:** read the landed tractor hold / `destroyNpcShip` standing cascade / Phase 4 punishment tokens / Phase 5 close-once / Phase 1 identity helpers / Phase 6 contact layers / Phase 7 `playerFleet` / Phase 9 `BOARDING_IMPLEMENTED === false` flags. No engine changes made. This is a dependency/risk checklist for a later writer, not a post-implementation review and not permission to implement before Tenth scopes the lane. **Keep #33, #35, and #37 Pass locked** — do not reopen EW gates or regress S14 / S15 / S16. This is **boarding**, not Phase 10 Dominion.

## Verdict in one paragraph

Boarding can be implemented as a **thin new book** plus helpers without rewriting combat, EW, or the kill-standing cascade. Prefer `src/boarding-*.js` (names can change) that **subscribe** to Phase 1 identity, Phase 3 reach/non-aggression, Phase 4 `openIncident` / `rememberPunishment`, Phase 5 close-once (**captured ≠ destroyed**), Phase 6 detection/cloak, Phase 7 `playerFleet` / orders, and the existing tractor device **unchanged**. Hull% is a refuse on `combatHull / maxCombatHull ≤ 0.10`. Capture XOR scuttle is one attempt writer that must **not** call `destroyNpcShip` on capture and must **not** stamp both flags. Tractor hold stays `tractorIsBoarding() === false`. Prize credit is a new `capture:` token family beside existing `kill:` tokens. Command transfer is a flagship swap among rows the player already owns or captured — not `resolveNewLiveShipId`. Away-team XP is a snapshot field `not_tracked_yet`. The load-bearing risks are all integration mistakes: tractor-as-capture; capture routed through `destroyNpcShip`; double-charge when a prize is later destroyed; silent refit / `applyShipDefaultWeapons`; gifted `engagement_authorized` / FS; boarding a cloaked-hidden or undetected hull; treating a ghost/decoy as a prize; inventing a success-% table; titling the slice Phase 10; regressing #33/#35/#37.

## What already exists (do not reinvent)

| Need | Engine fact at `f9f077f` |
| --- | --- |
| Boarding **out** | `src/phase9-ew.js` `BOARDING_IMPLEMENTED = false` (~46); `tractorIsBoarding()` false (~698); `cuttingBeamIsCapture()` / `ghostIsPrize()` false; `boardingApis()` `[]`. Duplicate flag in `src/phase9-weapons-matrix.js` (~33). Probe: `createPhase9ProbeApi` boarding snapshot (`main.js` ~23795): `implemented`, `apis`, `tractorIsBoard`. S14.18 / S15.18 / S16.17 assert out. **Engine slice may flip `BOARDING_IMPLEMENTED` true without flipping tractor-is-board.** |
| Hull ratio (NPC) | `combatHull` / `maxCombatHull` on live ships. Target window already computes `hullPct` (`main.js` ~16356). Probe can set `combatHull` (`main.js` ~22241). Player flagship uses `state.hull` 0–100 percent (~12534), **not** the same fields. |
| Tractor hold | Device id **25**, `TRACTOR_BEAM_WEAPON_ID` (~732); `state.tractorBeams`; probe `tractorHold` (~22683) — hold only, no prize write. Phase 3 `unable_to_comply` tractor path (S5.10 / S6.2) is **non-aggression**. |
| Kill-standing cascade | `destroyNpcShip` (~17114): salvage latinum, `applyKillStanding` (~7996), witness-patrol −2, optional Vex feat, `openIncident(kind: 'destruction')`, `rememberPunishment`, Phase 5 `markAssignmentDestroyed`. **Capture must not enter this function.** |
| Combat credit | `grantsPlayerCombatCredit` (`src/phase1-authority.js` ~125): `player` / `playerEscort` only. |
| Punishment tokens | `src/phase4-incidents.js` `rememberPunishment` (~182); `hasPunishment` / ledger `punishmentTokens`. Shape `kill:${credit}:${system}:${victimInstance}:${bucket}` from `destroyNpcShip` (~17162). Capture needs a **sibling** `capture:` family, not a second `kill:`. |
| Phase 5 destroy close | `markAssignmentDestroyed` (`src/phase5-objectives.js` ~729) sets `truth.destroyed` and `attackerId`. Need a **captured** close that does **not** set those. |
| Identity preserve | `shouldPreserveNpcIdentity` / `preserveNpcIdentityFields` (`src/phase1-authority.js` ~195–216): `shipId`, `name`, `faction`, `role`, `fleetId`, … Concession helpers `isStationTransferableFromHolder` / `retainStationOwnerOnControlChange`. |
| No silent refit | `resolveShipId` vs `resolveNewLiveShipId` (`main.js` ~3627–3652). `applyShipDefaultWeapons` (~10364) / `hullIsEmptyButArmable` (~10383). Capture/transfer must **not** call the default-weapon filler. |
| Detection / cloak | `src/phase6-sensors.js`: `detected`, `identification`, `trackQuality`, `firingSolution`. `seedFromReport` area-only, FS false. Hail/tractor/fire at undetected cloak already denied (Phase 6 proposal §3.2). Boarding follows **detection**, must **not** require FS. |
| 9.2 share | Escort→flagship detection/last-known/residue only (`src/phase92-escort-share.js`). Shared detection **may** satisfy boarding detection if the flagship row actually has `detected`; still never gifted FS. |
| Player fleet / command | `state.playerFleet` (~1043); escort vs defense assignment; `buyEscortShip` / fleet commission (`main.js` ~13159+). Phase 7 `src/phase7-fleet.js`: `ORDER_KINDS` includes `hold_outside`; no command-transfer helper yet. |
| Fire delete | `consultDoctrineFire` / EW `liveFireFactsFromEw` delete `engagement_authorized`. Boarding must not pass it. |
| Persistence lesson | `state.systemStates = {}` wipes on load. Boarding book + prize rows + tokens live **outside** that cache (copy Phase 3/4/5). Ambient `npc.id` reuse still applies — key prizes on `securityInstanceId`. |
| Clocks | Phase 3 `localElapsedMs`. Tractor probe still uses `performance.now()` (~22686) — **do not copy** that into boarding travel/attempt deadlines. |
| Probe surface | `__BM1_PROBE__.phase9` / `.phase91` / `.phase92`. S17 should add **`phaseBoarding`** (or `boarding`) rather than scrape private state or fork S14–S16. |
| Offline tests | `scripts/test-phase9-ew-weapons.mjs` (`s14.18-boarding-out`), `test-phase91-ew-robustness.mjs`, `test-phase92-ew-depth.mjs` (`s16.17-boarding-out`). Keep green except the implemented flag as specified in the proposal. Add `scripts/test-boarding-capture.mjs`. |
| Pack missing features | `bm-ships/integration-rules.json`: `boarding/capture`, `fleet transfer`, `away-team XP`. Do not treat the pack as engine. |
| UI / dock | 9.2 dock-clear `--bm1-dock-clear`; process lock continues for a later engine PR. Docs-only: no PNGs. |

## Hooks the writer will have to touch

Prefer thin new files rather than growing `destroyNpcShip` into a capture function:

| Proposed module | Responsibility |
| --- | --- |
| `src/boarding-eligibility.js` | Hull% test (`≤ 0.10`); wreck refuse; station refuse; distinct sayable reasons. |
| `src/boarding-attempt.js` | Attempt lifecycle; XOR writer; outcome inject; `localElapsedMs` travel stub. Hard-fail if `captured && scuttled`. |
| `src/boarding-credit.js` | `capture:` token; refuse `applyKillStanding` on capture; prize-later-destroy skip original `kill:`. |
| `src/boarding-identity.js` | Prize row from preserved fields; no `applyShipDefaultWeapons`; no concession loop. |
| `src/boarding-reach.js` | Detection / cloak / range / same-system / Phase 3 non-authorization. FS not required. Ghost/decoy refuse. |
| `src/command-transfer.js` | Flagship swap among owned/captured hulls; preserve both identities; Phase 7 orders persist. |
| `src/phase9-ew.js` | **Subscribe:** `BOARDING_IMPLEMENTED` may become true; `tractorIsBoarding` **stays false**; `boardingApis()` may list the new helpers. Do not route boarding through EW families. |
| `src/main.js` | Thin: Board control ≠ tractor fire; serialize `boardingBook`; `__BM1_PROBE__.boarding`; command-transfer UI. |
| `src/phase4-incidents.js` | Optional `kind: 'capture'` (non-FLASH default). Do not fold capture into `destruction`. |
| `src/phase5-objectives.js` | `markAssignmentCaptured` (name can change): close-once captured, `destroyed: false`, no invented `attackerId`. Do **not** reuse `markAssignmentDestroyed` for capture. |
| `src/phase1-authority.js` | Reuse preserve helpers; do not add culture fire. |
| `src/phase7-fleet.js` | Prize / former-flagship rows on `playerFleet`. Do not wipe `hold_outside`. |

Do **not** implement boarding inside `src/phase91-*.js` / `src/phase92-*.js` as an EW side effect. Do **not** implement prizes inside `upsertGhostContact` or `createNpcShip` ambient reuse. Do **not** `git am` remastered patches. Do **not** retune `game_items.json`.

| Existing path | Required integration |
| --- | --- |
| Target window / combat HUD hull meter | Show boarding eligibility from the **same** ratio the helper uses. Do not round 11% to 10% in UI only. |
| Tractor fire / `tractorHold` | Unchanged. Boarding order is a **new** call. Hold may coexist; it does not start an attempt. |
| `destroyNpcShip` | **Scuttle-of-original only** (or keep calling it from the scuttle writer). Capture **returns before** salvage / standing. Prize-later-destroy: skip original-faction standing if `capture:` token exists for that instance. |
| `applyKillStanding` / `adjustFactionStanding` | Capture path: **zero** calls. S17.7 snapshots standing JSON. |
| `openIncident` / `rememberPunishment` | Capture: capture kind + `capture:` token. Scuttle-of-original: existing destruction + `kill:`. |
| `markAssignmentDestroyed` | Only real destruction. New captured close for prize assignments. |
| `consultDoctrineFire` / `playerForceMayAutoEngage` | Pass layer facts only. Keep the delete. Capture / transfer must not flip `mayAutoEngage`. |
| `shareFormationDetection` | Shared `detected` may satisfy reach; still no gifted FS / boarding-without-a-row. |
| `performActiveScan` | Not required to board if already detected. Do not dump scan flavor as prize cargo. |
| `loadGame` / `saveGame` / `resetRunState` | Serialize boarding book + prize rows beside fleet / incident ledger. Load still wipes `systemStates` first. Restore cloak → contact book → boarding **before** first sensor/AI pass. No `performance.now()` boarding deadlines. Key on `securityInstanceId`. |
| `__BM1_PROBE__` | Add `boarding.snapshot` / injectors (see probe plan). **Fail setup if missing.** Keep `phase9` boarding **preservation** fields honest: `tractorIsBoard: false`. |
| `.top-left-panel` / `.bottom-dock` | Later engine: boarding chrome dock-clear at 1280×720. Not this docs PR. |

Do **not** hook `loadShipCatalog` as a rewrite, independence mint, `meetPackPurchaseDecision`, Phase 8 stock reprint, Reman identity from a prize hull 53, or EW contest from an away-team.

## Risks

### 1. Hull% wrong religion / shields / stations (gate 1)

Using `state.hull` for NPCs, shield percent, or station `combatHull` as a ship boarding target fails S17.1–S17.2. Rounding in the UI only fails “11% still refuses.” Boarding wrecks (`combatHull ≤ 0`) as prizes fails the default wreck refuse.

**Gate:** S17.1, S17.2.

### 2. Capture and scuttle on the same attempt (gate 2)

Calling `destroyNpcShip` and then pushing a `playerFleet` prize from the same attempt stamps both flags. Inventing a locked 50% table violates convergence TBD.

**Gate:** S17.3, S17.4.

### 3. Tractor / cutting beam / ghost as capture (gate 3)

`tractorHold` writing `captured`, `tractorIsBoarding() === true`, cutting-beam kill as prize, or `ew_ghost` / `ew_decoy` as `playerFleet` fails Phase 9 boarding-out preservation even if boarding is now on.

**Gate:** S17.5, S17.17.

### 4. Gifted FS / `engagement_authorized` / culture fire (gate 4)

Lighting the Board button by setting `firingSolution`, or `mayAutoEngage` true because a prize was taken, fails Phase 9 gate 5 and boarding gate 4.

**Gate:** S17.6, S17.12.

### 5. Capture routed through `destroyNpcShip` (gate 5)

The obvious implementation. Standing, salvage, destruction incident, and Phase 5 `destroyed` all fire. Fails “capture is not a kill cascade.”

**Gate:** S17.7, S17.14.

### 6. Double-charge on later prize destroy (gate 5)

Capture token missing or keyed on recycled `npc.id`, then `destroyNpcShip` sees a “foreign” faction and charges again.

**Gate:** S17.8, S17.9, S17.15.

### 7. Silent refit / fleet gift / concession rewrite (gate 6)

`applyShipDefaultWeapons`, `resolveNewLiveShipId`, `for (station of system)`, or conscripting other NPC hulls of the former faction fails Phase 1. Capturing hull 53 must not set Reman unlock.

**Gate:** S17.10, S17.11.

### 8. Board without detection / through cloak / via report (gate 7)

Target-window omniscience, residue-as-reach, or Phase 4 report as a boarding lock fails Phase 6. Using tractor range as the only range check fails “tractor ≠ board” *and* reach.

**Gate:** S17.12, S17.13.

### 9. Silent XP / invented table (gate 8)

Awarding skill points with no snapshot rule, or shipping a locked odds/XP table, fails gate 8 even if XOR is green.

**Gate:** S17.4.

### 10. Book inside `systemStates` / keyed on `npc.id`

Same Phase 3/4/5/6/9 landmine. Load wipes the cache; ambient reuse transfers a prize onto a newcomer or loses the capture token (double-charge later).

**Gate:** S17.15.

### 11. `performance.now()` away-team clocks

Tractor probe does this today. Boarding travel/attempt must use `localElapsedMs`.

**Gate:** S17.15; process lock.

### 12. Phase 5 captured as destroyed / free replacement

`markAssignmentDestroyed` on capture, or minting a new convoy hull because the original was taken, fails Phase 5 gates 2 / 3 / 6.

**Gate:** S17.14.

### 13. Command transfer gifts a foreign hull / wipes `hold_outside`

Picking a targeted NPC that was never captured, or replacing parked orders because the flagship changed, fails gates 6 and Phase 7 persistence.

**Gate:** S17.11.

### 14. Regress #33 / #35 / #37 (preservation)

Contact-delete jam, ghost hulls, HoJ retune, claim-as-identity, universal bypass, or S14–S16 red fails even if boarding is green. Flipping `tractorIsBoarding` to make S17 pass is a fail.

**Gate:** S17.5, S17.6, S17.17.

## Probe plan (S17)

Add `scripts/test-boarding-capture.mjs` for offline hull% / XOR / capture-token / identity / transfer tests, and Chromium S17 cases on `__BM1_PROBE__.boarding`. **Replay S14–S16** via existing `phase9` / `phase91` / `phase92` injectors; do not break them except `BOARDING_IMPLEMENTED` as specified.

**Minimum probe additions:**

```js
__BM1_PROBE__.boarding = {
  snapshot: () => ({
    implemented: /* BOARDING_IMPLEMENTED — may be true after engine */,
    tractorIsBoard: false,
    cuttingIsCapture: false,
    ghostIsPrize: false,
    hull: {
      ratio: /* combatHull / maxCombatHull */,
      eligible: /* bool */,
      reason: /* hull-above-threshold | … */
    },
    attempt: {
      attemptId: /* */,
      outcome: /* capture | scuttle | fail | null */,
      captured: false,
      scuttled: false,
      xorOk: /* !(captured && scuttled) */
    },
    credit: {
      captureToken: /* or null */,
      killTokenForOriginal: /* must be null on capture */,
      standing: /* JSON of factionStanding */,
      salvageLatinumDelta: /* 0 on capture */
    },
    identity: {
      shipId: /* preserved */,
      weaponSlots: /* preserved */,
      emptySlotsStayEmpty: true,
      playerFaction: state.playerFaction,
      playerSide: state.playerSide,
      reman53: /* unlock unchanged */,
      concessionOwnerUnchanged: true,
      foreignFleetNotConscripted: true
    },
    reach: {
      detected: /* */,
      firingSolution: /* may be false */,
      cloakedHidden: /* */,
      inRange: /* */,
      sameSystem: true
    },
    awayTeamXp: {
      tracked: false,
      rule: 'not_tracked_yet',
      tablePresent: false
    },
    transfer: {
      flagshipInstanceId: /* */,
      previousStillOwned: true,
      foreignRefuse: true
    },
    phase5: {
      captured: /* bool */,
      destroyed: false,
      attackerId: null
    },
    npcBoardingImplemented: false,
    engagementAuthorizedPresent: false,
    mayAutoEngage: /* sample unchanged */,
    magnitudesLockedFromRemastered: false,
    log: state.log
  }),
  injectHullRatio: (id, ratio) => { /* fail setup if helper missing */ },
  injectDetection: (opts) => {},
  injectCloakHidden: (opts) => {},
  injectBoardingOrder: (opts) => {},
  injectBoardingAttempt: ({ outcome }) => {},
  injectTractorHoldOnly: (id) => {},
  injectCommandTransfer: (fleetId) => {},
  injectPrizeDestroy: (id) => {},
  injectPhase5Assignment: (opts) => {},
  tickBoarding: (localElapsedMs) => {},
  lastRefuseBoard: () => {}
};
```

Run, in order: existing `test:phase1`, `test:phase3`–`test:phase9`, `test:phase91`, `test:phase92`, `test:catalog`, `test:doctrine`, side-lane tests, `probe` (S4–S16), then new S17. A path that captures via `destroyNpcShip`, sets `tractorIsBoarding`, gifts FS, writes `engagement_authorized`, boards a ghost, or ships an XP table is a blocker.

Suggested first Chromium set (fatal integrations):

1. **S17.1 / S17.2 / S17.5:** hull% refuse; 10% eligible; tractor hold without boarding order.
2. **S17.3 / S17.4 / S17.7:** XOR inject; XP `not_tracked_yet`; capture standing unchanged.
3. **S17.8 / S17.9:** scuttle-of-original once; prize destroy no double-charge.
4. **S17.10 / S17.11:** identity / empty slots; command transfer; foreign refuse.
5. **S17.12 / S17.13 / S17.14:** detection/cloak; Phase 3 non-aggression; Phase 5 captured ≠ destroyed.
6. **S17.15 / S17.16 / S17.17:** persistence; npc path explicit; EW/catalog preservation.

## Recommended implementation order (dependencies)

1. Eligibility helper + refuse reasons (S17.1–S17.2). **Zero** tractor coupling.
2. Attempt book + XOR inject (S17.3–S17.4). XP snapshot field on day one.
3. Capture prize identity **without** `destroyNpcShip` (S17.10, S17.7).
4. Scuttle-of-original wrapper that **does** call destruction once (S17.8). Prize-later-destroy skip (S17.9).
5. Reach/cloak/report refuses (S17.12–S17.13).
6. Phase 5 captured close (S17.14).
7. Command transfer (S17.11).
8. Persistence + preservation (S17.15–S17.17). Later: dock-clear screenshots (S17.18).

Skip (7) if (3) still refits. Skip boarding range art if (5) still boards cloaked-hidden hulls. Skip catalog / Reman / EW / markets entirely. Do not call the UI lane done if a later engine leaves Board under the dock.

## Out of scope for the writer of a later slice

`BM1-remastered-work` as source; `git am` remastered boarding; claiming a Referee Pass; Phase **10** Dominion / wider faction; reopening Phase 9 / 9.1 / 9.2 gates or regressing #33 / #35 / #37; rewriting `seedFromReport` to grant a boarding lock; deleting `deliverReport` rows; retuning `game_items.json`; a global shield-bypass helper; moving tractor off the device slot; auto-filling empty `weaponSlots`; setting `hostile` / `attackId` / `destroyed` / `engagement_authorized` / `playerFaction` from a boarding order, a prize crew, or a command transfer; a second incident ledger; persisting `performance.now()` boarding deadlines; Phase 8 restock; a second Reman id; inventing locked success % or an XP table; boarding stations; loot-without-capture; treating dock-overlap as boarding math.

## Sources

- Proposal: `docs/boarding/BM1-BOARDING-CAPTURE-PROPOSAL.md`
- Convergence §4: `docs/GUIDED-CONVERGENCE.md`
- Plan §16.2 row 4: `docs/revised-development-plan.md`
- Pack missing features: `bm-ships/integration-rules.json`
- Phase 9 boarding-out: `docs/phase9/BM1-PHASE9-EW-WEAPONS-PROPOSAL.md` gate 6; `src/phase9-ew.js`; `src/phase9-weapons-matrix.js`; PR #33; S14.18
- Phase 9.1 / 9.2 preserve: PR #35 / #37; S15.18 / S16.17
- Tractor: `src/main.js` `tractorHold`, `TRACTOR_BEAM_WEAPON_ID`; Phase 3/4 inability
- Destroy / standing: `src/main.js` `destroyNpcShip`, `applyKillStanding`; `src/phase4-incidents.js` `rememberPunishment`
- Phase 5: `src/phase5-objectives.js` `markAssignmentDestroyed`
- Phase 1: `src/phase1-authority.js`
- Phase 6: `src/phase6-sensors.js`
- Phase 7: `src/phase7-fleet.js`; `state.playerFleet`
- Fire facts: `src/doctrine.js`; `consultDoctrineFire`
- Probe: `src/main.js` `createPhase9ProbeApi` boarding block; `scripts/test-phase9-ew-weapons.mjs`
- Remastered: not a patch source
- Companion shape: `docs/phase9/BM1-PHASE9.2-ENGINE-DEPENDENCIES.md`
