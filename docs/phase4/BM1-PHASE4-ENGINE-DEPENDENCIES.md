# BM1 Phase 4 proposal: engine dependencies

**Reviewed document:** `BM1-PHASE4-INCIDENTS-ESCALATION-ALERTS-PROPOSAL.md`  
**Reviewed against:** `Artemis2028/BM1-bakeoff` at `ff82cf4` on `main` (11 September 2026). Line numbers below refer to this head and may drift.  
**Method:** read the landed Phase 1–3 modules and the `main.js` paths the proposal must touch. No engine changes made. This is a dependency/risk checklist for the writer, not a post-implementation review and not a geometry dump.

## Verdict in one paragraph

The proposal can be implemented without a rewrite. The ledger should copy the Phase 3 pattern that already works: versioned state beside `securityEncounters`, simulation clock from `tick(frameScale)`, identity on `securityInstanceId`, never inside `systemStates`. The load-bearing risks are all integration mistakes, not missing primitives: feeding refusal into `recordObservedAttack` / `attackId`; calling `applyKillStanding` a second time from a report; letting `evaluateReact` see global truth; implementing `areAlertsActive` as a silent no-op; and routing investigate/rescue through `destinationName` or `waitUntil`. Do the token + feed + FLASH work before any acting NPC.

## What already exists (do not reinvent)

| Need | Engine fact at `ff82cf4` |
| --- | --- |
| Durable store outside the scene cache | `state.securityEncounters` is created at init, serialized in `saveGame`, restored in `loadGame`, reset on new game. `state.systemStates = {}` still runs on data load, station/wormhole build, `loadGame` and `resetRunState`. |
| Visitor identity that survives `npc.id` reuse | `assignNpcSecurityInstance` / `nextSecurityInstanceId`. `beginAmbientTrafficArrival` force-news the instance. |
| Encounter terminals to subscribe | `closeEncounter` / `terminateEncounter` in `src/phase3-checkpoints.js` + `src/main.js`. Lifecycles include `refused`, `expired`, `unable_to_comply`. |
| Local clock | `advanceLocalElapsed` / `ensureSystemLedger(...).localElapsedMs` advanced from `tickSecurity` / `tick`. |
| Reserved alerts | `ALERT_MODES`, `normalizeAlertMode`, merge/override already persist. `areAlertsActive(_policies)` **always returns `false`**. Security copy still says settings are reserved. Probe snapshot already exposes `alertsActive`. **S4-21** (`scripts/behavior-probe.mjs`) asserts `s4.alertsActive === false`. |
| Single replaceable banner | `setLog` writes `state.log` and `.top-message`. `destroyNpcShip` logs witness then immediately logs salvage — FLASH must win that race. |
| Kill-standing cascade | `applyKillStanding` then optional witness `-2` inside `destroyNpcShip`; stations use `-6`. `applyDestructionPayout` already zeroes NPC-only credit. |
| ROE / aggression | `recordObservedAttack`, `hasAttributedAttackOnPlayerSide`, `hasMatchingActiveRaid`, `playerForceMayAutoEngage`. Phase 3 must not write these for access outcomes; Phase 4 must not start. |
| Doctrine react (non-acting) | `evaluateReact` in `src/doctrine.js`. `consultDoctrineFire` is shadow-only on live fire facts. `currentLocationIdentity` already stamps `locationId` / `jurisdictionId`. |
| Probe surface | `globalThis.__BM1_PROBE__` snapshot, Security UI helpers, checkpoint helpers, `phase1.applyDestructionPayout`. S6 should extend this object rather than scrape private state. |

## Hooks the writer will have to touch

Prefer a new `src/phase4-incidents.js` (pure records, tokens, alert gate, react helpers) plus a thin `main.js` integration, matching Phase 2/3 module splits.

| Existing path | Required integration |
| --- | --- |
| `closeEncounter` / encounter terminate in `tickSecurity` | After a committed terminal, `linkEncounterToIncident`. Never from hail repeat or dwell ticks. `withdrawn`/`departed` after noncompliance: append history only — **no new FLASH** (S6.14). |
| `destroyNpcShip` / `destroyStation` | After the existing standing/feat block, open `destruction` with `punishmentToken`. Do not move standing *into* the incident module. |
| `applyKillStanding` / `adjustFactionStanding` | Export or wrap a “already charged?” check. Incident/report code must call the wrapper, not the raw adjuster, for destruction kinds. |
| `recordAttackOnPlayerSide` / `recordObservedAttack` | Allow a `witnessed_aggression` incident from **existing** attack evidence only. Refuse writes whose only source is an encounter outcome. |
| `setLog` | Add `pushFlash` / alert-mode gate. Reclassify the witness log vs salvage log in `destroyNpcShip`. |
| `areAlertsActive` | Stop returning `false`. Return whether the *effective* mode is not `silent` for incident-class notices; keep a separate helper for “show background logs”. **Required same-PR migration:** rewrite or retire probe **S4-21** (`alerts-are-reserved-not-notifying`, expects `alertsActive === false`). A green Phase 2 suite becomes a landmine the moment this helper is real. |
| `renderSecurityPanel` | Alert buttons + incident list. Preserve ROE/access/checkpoint. Foreign checkpoint remains non-editable. |
| `saveGame` / `loadGame` / `resetRunState` | Serialize `incidentLedger`. Load still wipes `systemStates` first; reconcile incidents after `reconcileSecurityParticipants`. |
| `evaluateReact` / `stampDoctrineOnActor` | Build per-observer facts from observer copies. Enable acting only for allowlisted responses. Fold pack `protect` (and similar) to `record_only` — S6.13. |
| `updateNpcShips` / `applyNpcSecurityObjective` | New `incidentObjective` field, same preemption as security objectives. Do not collide `getNpcHailBlockReason` string matches. |
| `beginAmbientTrafficArrival` | New instance must not inherit incident blame, observer copies or FLASH identity from the slot. |
| Control transfer / capture / claim | Resolve jurisdiction-bound access incidents on epoch change (Phase 3 already bumps epochs). |
| `__BM1_PROBE__` | Snapshot ledger, flashes, alert mode, react decisions, standing before/after, `mayAutoEngage` after refusal. |

Do **not** hook `buildShipScanReport`, planet docking (already gated by Phase 3 `visitorDeniedServices`), or doctrine `allowsRoutineGenerator` to spawn investigators.

## Risks

### 1. Quietly turning Phase 3 evidence into Phase 2 aggression

`returnFireAllowsAutoEngage` is true for a matching raid or `hasAttributedAttackOnPlayerSide`. If refusal writes `observedAttacks` or stamps `attackId` “so FLASH has an actor,” player turrets will fire under `return-fire`. **Gate:** S6.1 must assert those fields are unchanged.

`unable_to_comply` is easier to mis-label as `expired` if the terminate helper shares a path. Keep inability off the noncompliance incident kind (proposal §5).

### 2. Double standing

`destroyNpcShip` already fans out standing and then `setLog`s salvage. A naive “faction disapproves of this incident” report handler will hit `adjustFactionStanding` again. **Gate:** capture `JSON.stringify(state.factionStanding)` before/after report delivery and after `evaluateReact`. Token must match.

Witness `-2` is a second *existing* path on the same kill, not a Phase 4 invention. Do not add a third.

### 3. Global truth into `evaluateReact`

`evaluateReact` returns `ignore_unknown` when `event_known` is false. If the adapter marks every same-flag ship as knowing the incident, Klingon `record_only` and Romulan “own patrol” cases collapse. Facts must come from delivered reports or direct observation in-system.

`engagement_authorized` must stay computed. Do not put it on the incident.

`access_noncompliance` mapped to `border_breach` can match Vulcan/Tholian `protect` interest rules in the pack (`defend_assets` when `own_asset_affected`). **Locked:** `protect` and every other non-allowlisted response must fold to `record_only` (or non-acting). They must not become an acting weapons / intercept objective and must not set `attackId`, inject `engagement_authorized`, or make `evaluateFire` / `playerForceMayAutoEngage` true. **Gate:** S6.13. The adapter may log `packResponse: 'protect'` next to `appliedResponse: 'record_only'`. Allowlist remains `record_only` / `investigate` / `rescue` / `defer:*` / `ignore_unknown` only.

### 4. Alerts implemented as comments

If `areAlertsActive` becomes `true` for every mode, or Security grows buttons that only `setLog`, S6.5 fails. Need three observable behaviors. `silent` must not skip `openIncident`.

**S4-21 is a required probe migration, not optional cleanup.** Today:

```js
check(results, 'S4-21 alerts-are-reserved-not-notifying', s4.alertsActive === false);
```

in `scripts/behavior-probe.mjs` (with `alertsActive` taken from `__BM1_PROBE__.snapshot()`). Flipping `areAlertsActive` without rewriting or retiring S4-21 fails the existing 75-check probe even if S6 is green. In the same engine PR: change S4-21 to assert real mode behavior (or drop it and cover the reservation-lift in S6.5). Do not keep `=== false`.

**FLASH vs append-only:** withdrawn-after-noncompliance must not call `pushFlash`. A second pulse would read as a second offense (S6.14).

### 5. Objective channel collisions

`getNpcHailBlockReason` still string-matches `destinationName` (`defend:`, `raid:`, …). Investigate text such as `raid-investigation` would close hails. Store the objective on `npc.incidentObjective`. `waitUntil` is still stomped to `now+140` by tractor/engine branches — same Phase 3 hold bug. Inability must be detected before a hold re-assert.

### 6. Persistence and replacements

Load wipes `systemStates` and `activeFleetAttack`. A `witnessed_aggression` incident must not expect a live raid after travel (Phase 2). Ambient replacement reuses `npc.id`; blame keyed on `id` will attach to the newcomer. Use `securityInstanceId` only.

`performance.now()` FLASH holds would desync from the Phase 3 clock when the tab throttles. Use `localElapsedMs`.

### 7. Acting without capacity

Doctrine `can_respond` / `can_investigate` / `can_rescue` / `survivors_known` are observer facts. If the writer sets them all true “to see movement,” every Vulcan ship becomes a relief wing. First slice: set facts only when the fixture or live state supports them; otherwise `defer:*`.

Do not create ships to satisfy a response. Absent actor → deferred record, not a spawn.

### 8. UI refresh

Security still renders on click / keyed refresh (`refreshSecurityPanelIfOpen`). Incident countdowns and FLASH age need the same keyed pattern as encounters. Station names are not unique; lists key on `incidentId` / `station.id`.

## Probe plan (S6)

Add `scripts/test-phase4-incidents.mjs` for offline record/token/alert-gate tests (like `test-phase3-checkpoints.mjs`) and Chromium S6 cases on `__BM1_PROBE__`.

**Minimum probe additions:**

```js
__BM1_PROBE__.incidents = {
  snapshot: () => ({
    ledger: serializeIncidentLedger(state.incidentLedger),
    standing: { ...state.factionStanding },
    flash: [...(state.incidentLedger?.alerts?.flashQueue || [])],
    alertsMode: getEffectivePolicy(...).alerts,
    log: state.log
  }),
  setAlerts: (mode) => setEmpireDefaultDimension(..., 'alerts', mode),
  injectDistress: (facts) => { /* fixture; fail if no eligible observer */ },
  lastReact: (observerId) => observerCopies[observerId]?.lastDecision
};
```

Run, in order: existing `test:phase1`, `test:phase3`, `test:doctrine`, the **migrated** Phase 2/3 probe (S4-21 rewritten or retired in the same PR as `areAlertsActive`), then new S6. A refusal case that changes `mayAutoEngage` from false to true is a blocker even if the journal looks right.

Suggested first Chromium set (catches the fatal integrations):

1. Vulcan + `return-fire` (or player holding + NPC) refuse → snapshot aggression fields + standing + shot count.
2. Credited kill → standing once → deliver report → standing unchanged → FLASH still visible after salvage log.
3. Same incident, Vulcan observer acts, Klingon `record_only`, `evaluateFire` unchanged.
4. **S6.13:** observer whose pack match is `protect` on `border_breach` → `appliedResponse === 'record_only'`, no `attackId`, `engagement_authorized` not injected, fire gates unchanged.
5. **S6.14:** refuse (one FLASH) then withdraw → same `incidentId`, history append only, flash-queue length / last FLASH id unchanged.

## Recommended implementation order (dependencies)

1. Token wrapper around the existing kill cascade (no delta changes) + empty ledger save/load.
2. Encounter-terminal feed (S6.1–S6.3) with explicit kind allowlist.
3. FLASH / `areAlertsActive` / Security buttons (S6.5–S6.6, S6.14) **and rewrite/retire S4-21 in the same PR**.
4. Observer copies + allowlisted `evaluateReact` acting (S6.7–S6.8, **S6.13** `protect` → `record_only`).
5. Caps, capture/reclaim, replacement identity (S6.9–S6.11).

Skip acting (step 4) if steps 1–3 are not green. Acting is the only new movement; everything else is records and UI.

## Out of scope for the writer of this slice

`BM1-remastered-work`, `docs/BAKEOFF-STATUS.md`, doctrine JSON edits, weapon tables, `asset_overdue` multi-jump loops, cloak/sensors, and any path that sets `hostile` / `attackId` from an encounter lifecycle.

## Sources

- Proposal: `docs/phase4/BM1-PHASE4-INCIDENTS-ESCALATION-ALERTS-PROPOSAL.md`
- Phase 3 module: `src/phase3-checkpoints.js`
- Phase 2 alerts: `src/phase2-security.js`
- Doctrine react: `src/doctrine.js` (`evaluateReact`, `deriveLiveFireFacts`)
- Standing / log / save: `src/main.js` (`applyKillStanding`, `destroyNpcShip`, `setLog`, `saveGame`, `loadGame`)
