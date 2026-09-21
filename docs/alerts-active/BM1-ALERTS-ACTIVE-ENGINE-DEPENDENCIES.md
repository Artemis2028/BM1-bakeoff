# BM1 alertsActive snapshot policy: later-slice dependencies

**Reviewed document:** `BM1-ALERTS-ACTIVE-SNAPSHOT-PROPOSAL.md`  
**Reviewed against:** `Artemis2028/BM1-bakeoff` at `a1e4695` on `main` (21 September 2026), after docs hygiene (PR #62). Line numbers below refer to this head and may drift.  
**Method:** read landed `getEffectivePolicy` / `areAlertsActive`, top-level `__BM1_PROBE__.snapshot()`, incidents probe snapshot, `emitIncidentNotice` FLASH path, `setHoldingAlerts`, S4-21 / S6.5, and the BAKEOFF-STATUS / Phase 4 notes that left the raw-store boolean as a **soft residual**. No engine changes made. This is a dependency/risk checklist for a **later** writer **if** Tenth scopes a thin subscribe / call-site fix — not a post-implementation review and not permission to implement before Tenth scopes the lane. **Keep #33, #35, #37, #38, #39, #40, #41, #42, #43, #44, #45, #46, #47, #48, #49, #50, #51, #52, #53, #54, #55, #56, #57, #58, #59, #60, #61, and #62 locked.** Do not reopen EW, boarding, Phase 10, flags/passes, the weapon ledger, empty-armable, construction visuals, HTML catalogs, economy / difficulty, standing tiers, dockClear, or hygiene. Do not rewrite two-mode ROE. Do not retune combat. Do not invent a Thaleron facility. Do not reopen dockClear. Do not `git am` remastered patches.

## Verdict in one paragraph

`alertsActive` snapshot policy can stay **docs-only** on this PR. **This PR ships proposal + deps only.** Phase 4 already made `areAlertsActive` a real display gate and already merges alerts for **FLASH** and for `__BM1_PROBE__.incidents.snapshot()`. The parked residual is **one call site**: top-level `snapshot().alertsActive` still passes raw `state.playerSecurity` into `areAlertsActive`, which then reads `empireDefault.alerts` because the store has no top-level `alerts`. That only diverges when a **holding alert override is active**. If Tenth later scopes a thin slice, prefer **subscribe to `getEffectivePolicy` + `areAlertsActive`** over a Phase 2 rewrite: point the top-level boolean at the same one-liner the incidents probe already uses, export `ALERTS_ACTIVE_LOCKED_FROM_REMASTERED === false`, add an override-active S29 probe, replay Phase 4 / doctrine. Do **not** touch `ROE_MODES`, `pushFlash` pulse rules, dockClear CSS, or `game_items.json`. The load-bearing risks are all identity mistakes: rewriting ROE “while we are in Security”; restoring S4-21 to `=== false`; reverting the incidents snapshot to raw store; gifting `firingSolution` from a helper; treating silent as a ceasefire; `git am` remastered; reopening #33–#62.

## Natural later deliverable (say this clearly)

A thin **subscribe / call-site fix** that makes top-level `snapshot().alertsActive` match effective policy when an override is active is the natural S29 deliverable. Combat / ROE / FLASH pulse / dockClear stay untouched.

| S29 is | S29 is not |
| --- | --- |
| Top-level `alertsActive` + named twins follow `getEffectivePolicy` | A new alert enum or a third ROE |
| Probe: override-active snapshot matches `areAlertsActive(effectivePolicy)` | Deleting overrides so the raw store “passes” |
| Subscribe to landed merge + display gate | A rewrite of `getEffectivePolicy` / retain / reclaim |
| `ALERTS_ACTIVE_LOCKED_FROM_REMASTERED === false` | A remastered `git am` or locked remastered constant |
| Replay Phase 4 / doctrine green | A Phase 4 hard-gate reopen |

DockClear polish, an away-team XP table, a Phase 10 full roster, or a Thaleron facility, if ever wanted, remain **different** Tenth-scoped lanes.

## What already exists (do not reinvent)

| Need | Engine / docs fact at `a1e4695` |
| --- | --- |
| Merge | `getEffectivePolicy` (`src/phase2-security.js` ~232): not held → empire default; held + inactive override → empire default; held + active override → `mergePoliciesByDimension` (alerts from override if set). |
| Display gate | `areAlertsActive` (~259): `normalizeAlertMode(policies?.alerts ?? policies?.empireDefault?.alerts) !== 'silent'`. Also `showsBackgroundAlertLogs` (mode `=== 'all'`). |
| Store shape | `createPlayerSecurityState` (~80): `empireDefault.alerts`, `holdings[n].alerts`. **No** top-level `alerts`. `serializePlayerSecurity` (~126) same shape. |
| Residual call site | `installPlayerSecurityProbe` `snapshot()` (`src/main.js` ~28709): `alertsActive: areAlertsActive(state.playerSecurity)`. Same function already exposes `effectivePolicy: getEffectivePolicy(...)` (~28707) and `effectiveRoe` (~28706). |
| Twin already correct | `createIncidentProbeApi` (~28367–28368): `alertsMode` + `alertsActive` both from `getEffectivePolicy(...)`. |
| Live FLASH | `emitIncidentNotice` (~6982): `getEffectivePolicy(...).alerts` as `alertsMode` for `pushFlash`. `getEffectiveSecurityPolicy` (~7230) is the same wrap. |
| Holding write | `setHoldingAlerts` (~7219): writes override, returns **effective** alerts. Incidents probe exposes it (~28376). `setEmpireAlerts` / `incidents.setAlerts` write empire default. |
| S4-21 | `scripts/behavior-probe.mjs` (~748–753): migrated. `alertsActive === (mergedAlerts !== 'silent')` with `mergedAlerts` from `effectivePolicy.alerts`. Green without an alerts-dimension override fixture. |
| S6.5 | Uses **incidents** snapshot (`silentAlertsActive`). Does not catch the top-level raw-store boolean. |
| Offline Phase 4 | `scripts/test-phase4-incidents.mjs` (~179–184): `areAlertsActive` on empire-default stores only. |
| Remastered locks | Sibling `*_LOCKED_FROM_REMASTERED` all **false**. **#33–#62 stay locked.** |
| Soft leftover (this lane) | BAKEOFF-STATUS / GUIDED / plan: top-level snapshot still raw vs `getEffectivePolicy`. DockClear named it **out**. |

**Gap this brief closes (docs now; call-site only if scoped):** there is no **scoreable S29 contract** that override-active top-level `snapshot().alertsActive` must match `getEffectivePolicy`, that the incidents twin stays aligned, and that BAKEOFF-STATUS’s Phase 4 soft note is a **parked readout item** rather than permission to reopen ROE, FLASH, or dockClear.

## Hooks the writer will have to touch

**This PR touches none of these.** If Tenth later scopes a thin subscribe / call-site fix:

Prefer **one readout wrap** rather than growing `src/phase2-security.js` into a new religion:

| Proposed file | Responsibility |
| --- | --- |
| Optional `src/alerts-active.js` (name can change) | `ALERTS_ACTIVE_LOCKED_FROM_REMASTERED === false`; `snapshotAlertsActive(policies, systemIndex, playerHolds) => areAlertsActive(getEffectivePolicy(...))`. **No** ROE write. **No** FLASH write. **No** fire write. |
| `src/main.js` `installPlayerSecurityProbe` | Thin: `alertsActive: areAlertsActive(getEffectivePolicy(...))` **or** the helper. Keep `effectivePolicy` / `effectiveRoe`. `__BM1_PROBE__.alertsActive` (name can change). |
| Optional `scripts/test-alerts-active.mjs` | Offline: lock false; empire vs holding override divergence; twins; `areAlertsActive` silent rule unchanged. **Not** a rewrite of `test-phase4-incidents.mjs`. |
| `scripts/behavior-probe.mjs` | Add S29 override-active fixtures. **Keep** S4-21 migrated. **Replay** S6.5 / S6.14. |

Do **not** implement this by rewriting `getEffectivePolicy` / `mergePoliciesByDimension` / `ROE_MODES`, `pushFlash` / `shouldPulseFlash` / `shouldReplaceBanner`, `src/phase4-incidents.js` kind catalog, `src/dock-clear.js`, `src/phase9-*.js`, `src/boarding-*.js`, `src/phase10-*.js`, `src/standing-tiers.js`, `src/economy-difficulty.js`, `src/ship-catalog-wire.js`, `src/phase8-markets.js`, `src/weapon-source-ledger.js`, `src/construction-visuals.js`, `src/empty-armable.js`, or `src/utility-inventory.js`. Do **not** `git am` remastered patches. Do **not** retune `game_items.json`. Do **not** edit `docs/html-catalogs/*.html`.

| Existing path | Required integration (later S29) |
| --- | --- |
| `getEffectivePolicy` / `areAlertsActive` | **Subscribe.** Fail setup if helpers missing. Pass the **merged** object into the display gate. |
| Top-level `snapshot().alertsActive` | **Fix.** Fail if it still uses raw `state.playerSecurity` when S29.1 / S29.2 run. |
| `snapshot().effectivePolicy` | **Preserve.** Fail if dropped. Invariant: `alertsActive === (effectivePolicy.alerts !== 'silent')`. |
| Incidents `snapshot().alertsActive` | **Preserve.** Fail if reverted to raw store. |
| `emitIncidentNotice` / `pushFlash` | **Untouched pulse.** Fail if S6.14 / hold / silent-no-open-incident change. |
| `setHoldingAlerts` / retain / reclaim | **Untouched write path.** S29 **calls** it. Fail if lost-holding still applies the override (S4-16 analog). |
| `ROE_MODES` / `getEffectiveRoe` / `playerForceMayAutoEngage` | Untouched. Fail if a snapshot pass writes `firingSolution` or `engagement_authorized`. |
| `tractorIsBoarding` | Stays false. |
| S4-21 | **Keep migrated.** Fail if restored to `alertsActive === false`. |
| `__BM1_PROBE__.incidents` / `.dockClear` / `.standingTiers` / `.phase9*` | **Keep.** Add `.alertsActive` snapshot: lock false, effective mode, boolean, fire flags false. |
| `src/dock-clear.js` / GUIDED §6 / hygiene copy | **Untouched.** Fail if S29 edits overflow CSS or un-flips #62. |

## Risks

### 1. Raw-store boolean left in place / metric rename without override fixture (gate 1)

Changing the comment, or asserting `alertsActive === true` on empire default only, leaves the residual. Deleting `holdings[].alerts` so the raw store matches also fails.

**Gate:** S29.1 / S29.2 / S29.4.

### 2. Phase 2 / ROE rewrite disguised as readout (gate 2)

Editing `ROE_MODES`, making silent a ceasefire, or folding `protect-all` into alerts fails no-ROE-rewrite.

**Gate:** S29.5 / S29.6.

### 3. Snapshot helper gifts fire (gate 3)

A wrap that sets `engagement_authorized` / `firingSolution` because “alerts are active,” or that writes `observedAttacks` from a silent/all toggle, fails the Phase 4 non-aggression lean.

**Gate:** S29.5.

### 4. FLASH / S4-21 / dockClear / hygiene reopen (gates 4–5)

Restoring S4-21 to `=== false`, rewriting `pushFlash`, reopening dockClear Settings chrome, inventing Thaleron / XP / roster, or un-flipping hygiene copy fails do-not-reopen / named outs.

**Gate:** S29.6.

### 5. Remastered crib / skipped override probe (gates 6–7)

`git am` remastered Security JS, flipping `ALERTS_ACTIVE_LOCKED_FROM_REMASTERED` true, or landing the one-liner without S29.1 / S29.2 **fails** even if S4-21 stays green.

**Gate:** S29.7 / S29.1.

## Probe plan (S29)

**Not in this docs PR.** Add `__BM1_PROBE__.alertsActive` + optional `scripts/test-alerts-active.mjs` **only after** Tenth scopes the slice. **Replay `test:phase4` + `test:doctrine` + S4-21 + S6.5 + S6.14 + S16.15 / S28.** Do not break existing injectors.

**Minimum later-slice contract:**

```js
__BM1_PROBE__.alertsActive = {
  snapshot: () => {
    const top = globalThis.__BM1_PROBE__.snapshot();
    const incidents = globalThis.__BM1_PROBE__.incidents.snapshot();
    return {
      lockedFromRemastered: false,
      alertsActive: top.alertsActive,
      effectiveAlerts: top.effectivePolicy.alerts,
      incidentsAlertsActive: incidents.alertsActive,
      empireDefaultAlerts: top.playerSecurity.empireDefault.alerts,
      matchesEffective: top.alertsActive === (top.effectivePolicy.alerts !== 'silent'),
      twinsAgree: top.alertsActive === incidents.alertsActive,
      fire: { firingSolutionPresent: false, engagementAuthorizedPresent: false },
    };
  },
};
```

Suggested first check set:

1. **S29.7 / S29.3:** remastered-lock false; no-override matches empire default.
2. **S29.1 / S29.2 / S29.4:** override-active divergence; twins agree; raw empire default still differs.
3. **S29.5 / S29.6:** no fire gift; Phase 4 / doctrine / S4-21 / S6 replay; #33–#62 untouched.

## Recommended implementation order (later S29 only)

1. Add `ALERTS_ACTIVE_LOCKED_FROM_REMASTERED === false` (S29.7).
2. Point top-level `snapshot().alertsActive` at `areAlertsActive(getEffectivePolicy(...))` (S29.1 / S29.2).
3. Assert no-override / lost-holding still follow empire default (S29.3).
4. Assert incidents twin still effective (S29.4).
5. Assert no ROE / fire writes (S29.5).
6. Replay Phase 4 / doctrine / S4-21 / S6 / preservation (S29.6).

Skip invented utilities, `git am`, `game_items.json` combat retune, Phase 2 ROE hook rewrites, FLASH pulse rewrites, dockClear CSS, HTML catalog edits, and away-team XP / Phase 10 roster entirely.

## Out of scope for the writer of a later slice

Engine work **before** a brief Pass; S29 on **this** docs PR; ROE / Phase 2 rewrite; dockClear #60 / #61 reopen; hygiene #62 un-flip; EW #33–#45 reopen; boarding #38 / #39 reopen; Phase 10 discovery / roster; flags Thaleron-shipped; ledger / empty-armable / construction / HTML / economy / standing reopen; `game_items.json` combat retune; Flash price locks; inventing an away-team XP table; restoring S4-21 to `=== false`; `BM1-remastered-work` as source; `git am` remastered patches; claiming a Referee Pass; gifted FS / `engagement_authorized` from a boolean; wiping delivered reports; flipping `tractorIsBoarding`; rewriting `meetPackPurchaseDecision`; moving Phase 5 `deadlineAt`; a sixth power consumer.

## Sources

- Proposal: `docs/alerts-active/BM1-ALERTS-ACTIVE-SNAPSHOT-PROPOSAL.md`
- Phase 4 residual note: `docs/BAKEOFF-STATUS.md` (post-merge soft; Referee Pass on `7f926df`); `docs/revised-development-plan.md`; `docs/GUIDED-CONVERGENCE.md` soft residuals
- Phase 4 contract: `docs/phase4/BM1-PHASE4-INCIDENTS-ESCALATION-ALERTS-PROPOSAL.md` §7.2; `docs/phase4/BM1-PHASE4-ENGINE-DEPENDENCIES.md`
- Landed helpers: `src/phase2-security.js`; `src/main.js` `installPlayerSecurityProbe` / `createIncidentProbeApi` / `emitIncidentNotice` / `setHoldingAlerts`
- Probe: `scripts/behavior-probe.mjs` S4-21 / S6.5; `scripts/test-phase4-incidents.mjs`
- DockClear (stay locked; residual was **out**): `docs/dock-clear/`; PRs #60 / #61
- Hygiene (stay locked): PR #62
- Standing (stay locked): `docs/standing-tiers/`; GUIDED §6; PRs #58 / #59
- Boarding: `docs/boarding/`; PRs #38 / #39; S17
- Phase 10: `docs/phase10/`; PRs #40 / #41; S18
- EW locked: `docs/phase9/`; PRs #33 / #35 / #37 / #42 / #43 / #44 / #45; S14–S20
- Flags / ledger / empty-armable / construction / HTML / economy: PRs #46–#57
- Companion shape: `docs/dock-clear/BM1-DOCK-CLEAR-ENGINE-DEPENDENCIES.md`
