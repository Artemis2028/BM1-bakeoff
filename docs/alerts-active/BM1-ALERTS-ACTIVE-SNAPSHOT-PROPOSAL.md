# BM1 alertsActive snapshot policy (Phase 4 soft residual)

**Status:** proposal for the parked Phase 4 **soft residual**; no engine changes made by this document.  
**Repository:** `Artemis2028/BM1-bakeoff`  
**Planning baseline:** `a1e4695` on `main` (21 September 2026), after docs hygiene (PR #62) on `main` @ `74f574b` (dockClear engine PR #61).  
**Referee context:** Phase 4 engine §6 **Pass** on `7f926df` (probe 89; hard gates closed; **soft** `alertsActive` snapshot note). Hygiene **#62 stay-locked**. DockClear **#60 / #61 stay-locked**. EW #33 / #35 / #37 / #42 / #43 / #44 / #45, boarding #38 / #39, Phase 10 #40 / #41, flags #46 / #47, ledger #48 / #49, empty-armable #50 / #51, construction #52 / #53, HTML catalogs #54 / #55, economy-difficulty #56 / #57, and standing-tiers #58 / #59 stay **locked**. This is a **thin readout-alignment brief only**, not a Phase 2 ROE rewrite, not a new alert religion, not a FLASH / ledger reopen, and **not** a claim that those lanes already had a Referee Pass on the status MD. This brief does **not** claim a new Referee Pass.  
**Companion:** `docs/alerts-active/BM1-ALERTS-ACTIVE-ENGINE-DEPENDENCIES.md` (hooks, risks, later S29 thin-fix sketch).  
**Scoped by:** Tenth Mountain Trooper, 2026-09-21 — proposal + deps first; room scores the hard gates **before** any engine. Room-locked hard gates (effective snapshot; no ROE / Phase 2 rewrite; never gift fire; do-not-reopen including dockClear #60–#61 and hygiene #62; named outs; blind; later thin fix + override-active probe and Phase 4 / doctrine replay) are **in** this one scoreable brief.

Phases 1–10 and the later subscribe packages already landed. Phase 4 (PR #13) activated reserved alert modes as **display only**, rewrote S4-21, and closed S6.5 / S6.14. Live FLASH (`emitIncidentNotice`) and `__BM1_PROBE__.incidents.snapshot()` already call `areAlertsActive(getEffectivePolicy(...))`. Top-level `__BM1_PROBE__.snapshot().alertsActive` still calls `areAlertsActive(state.playerSecurity)` — empire-default / raw store, **not** the holding merge. BAKEOFF-STATUS, plan §2 / §16, and GUIDED soft residuals have named that gap since the Phase 4 Pass: follow-up **only if holding alert overrides matter**. DockClear explicitly parked this as a **different** residual. This brief **is** that parked readout item.

This is **one** docs-readout brief: publish a **scoreable contract** that `snapshot().alertsActive` (and the twin readouts named below) match **effective** holding / empire alert policy via landed `getEffectivePolicy`, that two-mode ROE stays two-mode, and that a snapshot fix never gifts `firingSolution`, culture fire, or `engagement_authorized`. It is not a remastered `git am`, not a Phase 2 rewrite, not a dockClear reopen, and not a combat retune.

**This PR ships proposal + engine-deps only.** A later thin **subscribe / call-site fix** that closes the parked residual as a probeable S29 surface is the natural later deliverable. This brief does **not** ship that fix.

## 1. The result we want

A later writer can treat **top-level `snapshot().alertsActive`** the same way Phase 4 already treats FLASH and the incidents probe: boolean **active** means the **effective** alert mode at the current holding (empire default merged with an **active** holding override) is not `silent`. When a held system’s override is `silent` and the empire default is `all` / `incidents`, the snapshot is **false**. When the override is `all` / `incidents` and the empire default is `silent`, the snapshot is **true**. When there is no active holding override, the snapshot still matches empire default.

**Exit condition:** the seven hard gates in §2 are scoreable; Phase 4 S6 / S4-21 stay green; two ROE modes stay two; no gifted fire; dockClear / hygiene / EW / boarding / Phase 10 stay closed.

**Proposed first-release decisions:**

| Question | Proposed answer |
| --- | --- |
| What is the first playable slice? | **Docs-only** scoreable contract under `docs/alerts-active/`. **This PR does not ship engine.** A later thin subscribe / call-site fix (S29), **if** Tenth scopes it after Pass, points top-level `snapshot().alertsActive` at `areAlertsActive(getEffectivePolicy(...))` (or a landed equivalent helper). Name can change. |
| Is a thin subscribe / fix the natural later deliverable? | **Yes.** Analog: incidents probe already does this one-liner. S29 is **readout alignment**, not a new alert religion and not a Phase 2 merge rewrite. Combat / ROE / FLASH pulse / dockClear stay **untouched**. |
| What is already green? | Live FLASH uses `getEffectivePolicy(...).alerts`. `__BM1_PROBE__.incidents.snapshot().alertsActive` already uses `areAlertsActive(getEffectivePolicy(...))`. `snapshot().effectivePolicy` already is the merge. S4-21 already asserts mode-gates (`alertsActive === (mergedAlerts !== 'silent')`) **when** those two fields happen to agree. **Preserve.** |
| What is still residual? | Top-level `__BM1_PROBE__.snapshot().alertsActive` passes **raw** `state.playerSecurity` into `areAlertsActive`. That helper reads `policies.alerts ?? policies.empireDefault.alerts`. The store has **no** top-level `alerts`; holding overrides live under `holdings[system].alerts`. So a diverging **active** holding override is invisible to the top-level boolean. Soft because current S4 / S6 fixtures do not force that divergence. |
| May we rewrite two-mode ROE, `ROE_MODES`, fire gates, or Phase 2 merge math? | **No.** Readout only. Subscribe to landed `getEffectivePolicy` / `areAlertsActive`. |
| May a snapshot fix gift `firingSolution`, culture fire, or `engagement_authorized`? | **No.** |
| May we reopen EW #33–#45, boarding #38/#39, Phase 10 #40/#41, flags #46/#47, ledger #48/#49, empty-armable #50/#51, construction #52/#53, HTML #54/#55, economy #56/#57, standing #58/#59, dockClear #60/#61, or hygiene #62? | **No.** |
| Away-team XP table, Phase 10 full roster, Thaleron facility, combat retune, Flash price locks, dockClear reopen? | **Out.** |
| May we `git am` remastered patches or lock remastered constants? | **No.** `ALERTS_ACTIVE_LOCKED_FROM_REMASTERED === false`. |
| Must a later engine PR prove the override-active case? | **Yes.** Probe: holding override active ⇒ `snapshot().alertsActive === areAlertsActive(getEffectivePolicy(...))`. Replay Phase 4 / doctrine green. |
| Is this a Referee Pass? | **No.** Referee / One score the hard gates **before** any engine. Number Three probes only after a later S29 slice. |

These are recommendations for this readout package, not new decisions attributed to the user. Locked bake-off constraints take precedence over older flavor that treated `areAlertsActive` as always-false, treated a raw `playerSecurity` boolean as the merge, or treated a snapshot fix as permission to add a third ROE.

Cite BAKEOFF-STATUS / Phase 4 notes as the planning sources this brief **reconciles**, not as a second spec:

| Planning source | This brief |
| --- | --- |
| BAKEOFF-STATUS post-merge: top-level `snapshot().alertsActive` still raw `playerSecurity` vs `getEffectivePolicy` — follow-up if holding alert overrides matter | Gate 1. This **is** that follow-up. |
| Referee Pass Phase 4 engine §6 on `7f926df` (hard gates closed; **soft** alertsActive snapshot note) | Soft became this scoreable brief. Do **not** reopen the Pass. |
| Phase 4 proposal §7.2: empire-default and holding override merge by dimension as Phase 2 already does; `areAlertsActive` is the display gate; silent mutes FLASH only | Gates 1–2. Subscribe to the merge. Do not invent a second merge. |
| Phase 4 engine deps: `areAlertsActive` returns whether the **effective** mode is not `silent`; S4-21 rewritten in the same engine PR | Gate 1 + S29 replay. S4-21 already migrated — do **not** restore `=== false`. |
| Incidents probe already: `alertsActive: areAlertsActive(getEffectivePolicy(...))` | Twin (gate 1). Preserve. Align top-level snapshot to this. |
| Live FLASH: `getEffectivePolicy(...).alerts` in `emitIncidentNotice` | Subscribe source. Do not rewrite FLASH / S6.14. |
| DockClear gate 5 / Q7: `alertsActive` policy **out** unless identical chrome | This brief **is** that named-out residual. DockClear **stay-locked**. |
| Hygiene #62: keep the residual explicit | Pointer only. **#62 stay-locked.** |
| Two-mode ROE (Phase 2 Pass) | Gate 2. Do not reopen. |

### Twin readouts this brief names (gate 1)

A later slice that “fixes” only a comment, or only the incidents probe, **fails**. These three must agree when an override is active:

| Readout | Landed today (`a1e4695`) | Required after S29 |
| --- | --- | --- |
| `__BM1_PROBE__.snapshot().alertsActive` | `areAlertsActive(state.playerSecurity)` — **raw store** | `areAlertsActive(getEffectivePolicy(...))` (or landed equivalent) |
| `__BM1_PROBE__.incidents.snapshot().alertsActive` | already `areAlertsActive(getEffectivePolicy(...))` | **Unchanged.** Twin. |
| `__BM1_PROBE__.snapshot().effectivePolicy.alerts` | already the merge | **Unchanged.** Invariant: `alertsActive === (effectivePolicy.alerts !== 'silent')` |

Live FLASH / `pushFlash` **alertsMode** is the same effective value. S29 may **assert** that subscribe; it must **not** rewrite pulse / append-only / S6.14.

## 2. Locked constraints (do not reopen)

The bake-off room locked these before this brief. Implementation and probes must treat **gates 1–7** as **hard gates**. Referee / One score this brief against those **seven** **before** any engine PR. Number Three probes only after a later S29 slice. EW / boarding / Phase 10 / flags / ledger / empty-armable / construction / HTML-catalog / economy-difficulty / standing-tiers / dockClear / hygiene gates stay **closed**; they are restated only as **gate 4** (preserve / do-not-open), not as a reopen. This docs PR **does not** claim a Referee Pass.

### Hard gate 1 — Snapshot `alertsActive` reflects effective policy

> Top-level `snapshot().alertsActive` **and** the twin readouts named in §1 (`incidents.snapshot().alertsActive`; `snapshot().effectivePolicy.alerts` via the boolean invariant) must reflect **effective** holding / empire alert policy via landed `getEffectivePolicy` (or the landed equivalent), **not** raw `playerSecurity` alone when an override is active. A later slice that leaves the top-level boolean on `areAlertsActive(state.playerSecurity)` **fails**, even if FLASH already merges. A slice that “passes” by deleting holding overrides, by forcing empire default to match the override, or by renaming the field without the override-active probe **fails**.

Lane owner (wording): **Number Four**.

`areAlertsActive` already understands a merged `{ alerts }` object. The fix is the **call site** (and any thin helper that wraps `getEffectivePolicy` + `areAlertsActive`). Do not invent a second alert enum.

### Hard gate 2 — No ROE / Phase 2 rewrite

> Do **not** rewrite two-mode ROE. `return-fire` and `defend` stay the only automatic modes. This is **readout alignment**, not a new alert religion, not a third ROE, not `protect-all`, and not a Phase 2 merge / retain / reclaim rewrite. A later slice that edits `ROE_MODES`, `getEffectiveRoe` fire meaning, `recordObservedAttack`, or access enforcement **fails**, even if `alertsActive` then matches.

Lane owner (wording): **Referee / One** on do-not-open; **Number Four** on the call-site half.

`src/phase2-security.js` merge helpers stay **read-only** except a later one-line comment if needed. Silent is still **display**. Silent is not clearance, not a ceasefire, and not `unable_to_comply`.

### Hard gate 3 — Never gift fire from the snapshot fix

> Aligning a probe boolean, adding a helper, or asserting S29 must **never** gift `firingSolution`, culture fire, or `engagement_authorized`. An alert override is not a lock. Silent is not a weapons order. Two-mode ROE stays two-mode. Pursuit ≠ permission ≠ per-weapon gate.

Lane owner (wording): **Number 2**.

Same doctrine lean as Phase 4 S6.1 / S6.8 / S6.13, Phase 9 fire gates, and every later subscribe package. If a later snapshot line wraps `getEffectivePolicy`, it may only wrap — not `mayAutoEngage`.

### Hard gate 4 — Do not reopen landed lanes (including dockClear #60–#61 and hygiene #62)

> Do **not** reopen EW #33 / #35 / #37 / #42 / #43 / #44 / #45. Do **not** reopen boarding #38 / #39 (`tractorIsBoarding()` stays false; away-team XP `not_tracked_yet`). Do **not** reopen Phase 10 #40 / #41 (full roster stays deferred). Do **not** reopen flags / passes #46 / #47 (Thaleron pass **unverified — not shipped**). Do **not** reopen ledger #48 / #49. Do **not** reopen empty-armable #50 / #51. Do **not** reopen construction #52 / #53. Do **not** reopen HTML catalogs #54 / #55. Do **not** reopen economy / difficulty #56 / #57. Do **not** reopen standing-tiers **#58 / #59**. Do **not** reopen dockClear **#60 / #61**. Do **not** reopen hygiene **#62**. Phase 4 **hard** gates stay closed (S6.1/2 non-aggression, S6.4 single standing, S4-21 migrated, S6.13 `protect` → `record_only`, S6.14 no second FLASH). This brief is **not** a Settings HUD rewrite and **not** a dock-overlap pass.

Lane owner (wording): **Referee / One**.

A writer who “finishes Phase 4 by rewriting ROE,” who reopens dockClear “while Settings is open,” or who treats hygiene copy as unfinished work **fails**.

### Hard gate 5 — Named outs

> Do **not** invent an away-team XP table. Do **not** ship a Phase 10 full faction roster. Do **not** invent a Thaleron **facility** (place, quest, pin, or pass). Do **not** retune combat weapons. Do **not** treat any Flash number as a live price lock. Do **not** reopen dockClear / UI-fit. Cite those as **other** residuals / locked packages. Do **not** restore S4-21 to `alertsActive === false`. Do **not** reopen Phase 8 clamps or catalog wire.

Lane owner (wording): **Referee / One**.

### Hard gate 6 — Blind bake-off

> Do **not** `git am` remastered patches. Do **not** crib `BM1-remastered-work` engine or DESIGN as the snapshot source. `ALERTS_ACTIVE_LOCKED_FROM_REMASTERED === false`. Implement later from bake-off `docs/alerts-active/` + landed `getEffectivePolicy` / `areAlertsActive` only. Flipping any existing `*_LOCKED_FROM_REMASTERED` to true **fails**.

Lane owner (wording): **Referee / One**.

### Hard gate 7 — Later engine: thin fix + override-active probe; replay Phase 4 / doctrine

> A later engine PR **must** be a **thin** subscribe / call-site fix plus a probe that asserts: **override-active** top-level `snapshot().alertsActive` matches `areAlertsActive(getEffectivePolicy(...))` (and the §1 twins). It **must** replay Phase 4 (`test:phase4` / S6) and doctrine green. An engine PR that lands a helper without the override-divergent probe **fails**. An engine PR that rewrites FLASH / ROE / incident kinds to make the boolean match **fails**. **This docs PR adds no S29 to the probe and no engine.**

Lane owner (wording): **Number Four** (fix + process); **Number Three** scores the probe **after** a later slice.

### Soft gate 8 — Suites stay green (after a later slice)

> **Soft:** existing suites stay green (Phase 1 / S4–S28 / catalog / doctrine / boarding / Phase 10 / Phase 8 / Phase 9.4 / utility / weapon-ledger / empty-armable / construction / html-catalogs / economy-difficulty / standing-tiers / dock-clear / side-lane). Screenshot / no-clip is **N/A** (no UI chrome in this brief). A later S29 engine does **not** reopen dockClear or EW math.

Lane owner (wording): **Number Four** (process); **Number Three** scores suite-green **after** a later slice that touches runtime — not this brief.

### Also from the room (score with the gates)

| Plan / room want | How this brief locks it |
| --- | --- |
| Snapshot `alertsActive` (+ named twins) = effective policy, not raw `playerSecurity` when override active | Gate 1. |
| No ROE / Phase 2 rewrite; two ROEs stay; readout not a new alert religion | Gate 2. |
| Never gift FS / culture / `engagement_authorized` from the snapshot fix | Gate 3. |
| Do not reopen #33–#61, hygiene #62, Phase 4 hard gates | Gate 4. |
| Named outs: away-team XP, P10 full roster, Thaleron, combat retune, Flash locks, dockClear reopen | Gate 5. |
| Blind; `ALERTS_ACTIVE_LOCKED_FROM_REMASTERED === false` | Gate 6. |
| Later engine: thin fix + override-active probe; replay Phase 4 / doctrine | Gate 7. |
| Suites green; no Referee Pass from this PR | Soft gate 8. Scoring note below. |

### Must not break (cite landed work)

Score as **preservation**. A later alertsActive Pass that regresses them is a Fail. **#33, #35, #37, #38, #39, #40, #41, #42, #43, #44, #45, #46, #47, #48, #49, #50, #51, #52, #53, #54, #55, #56, #57, #58, #59, #60, #61, and #62 stay locked.**

| Locked rule | Cite | This brief / later slice must not |
| --- | --- | --- |
| Two ROE modes only | Phase 2 Pass; PR #6 | Add `protect-all` or a third automatic mode. |
| Alerts are display; silent is not compliance | Phase 4 §7.2; S6.5 | Skip `openIncident` when silent; treat mute as clearance. |
| S4-21 migrated to mode-gates | Phase 4 engine; `behavior-probe.mjs` S4-21 | Restore `alertsActive === false`. |
| FLASH vs append-only | S6.14 | Pulse a second FLASH from a snapshot helper. |
| Refusal / inability ≠ aggression | S6.1 / S6.2 | Write `observedAttacks` from an alerts boolean. |
| `protect` → `record_only` | S6.13 | Inject `engagement_authorized` from readout. |
| Incidents snapshot already effective | `createIncidentProbeApi` | “Fix” by reverting that line to raw `playerSecurity`. |
| Operator-panel / target / map dock-clear | #60 / #61; S16.15 / S28 | Reopen CSS / overflow JSON. |
| Hygiene residuals list | #62 | Un-flip GUIDED / plan drift cleanup. |
| `*_LOCKED_FROM_REMASTERED === false` | #44–#61 | Flip any remastered-lock true. |

### Process locks (not a change to gates 1–7)

- **Proposal first.** Do not implement the call-site fix from this text until Tenth scopes S29 after a brief Pass.
- **Blind bake-off.** Implement against bake-off `main` (`a1e4695` after #62), **not** remastered. From `docs/alerts-active/` + landed `getEffectivePolicy` / `areAlertsActive` only. Do **not** crib `Artemis2028/BM1-remastered-work`.
- **#33 / #35 / #37 / #38 / #39 / #40 / #41 / #42 / #43 / #44 / #45 / #46 / #47 / #48 / #49 / #50 / #51 / #52 / #53 / #54 / #55 / #56 / #57 / #58 / #59 / #60 / #61 / #62 stay locked.**
- **Subscribe, do not fork.** A later slice wraps the landed merge. It does not become a second Security policy or a second FLASH queue.
- **No Pass claimed** in `docs/BAKEOFF-STATUS.md` from this PR.

### Scoring note

Referee / One / Number Four score the **seven hard gates** **before** any engine PR. Number 2 scores gate **3**. Number Three probes **only after** a later S29 slice. **No Referee Pass is claimed by this docs PR.** Room scores the brief before any engine.

## 3. What the snapshot already does (do not reinvent)

**Lane owner (wording):** Number Four.

These are **in-repo** engine facts at `a1e4695`. Line numbers may drift; the files remain the evidence.

| Surface | Evidence | Residual? |
| --- | --- | --- |
| `getEffectivePolicy(policies, systemIndex, playerHolds)` | `src/phase2-security.js` | Merge-by-dimension. Empire default when not held / override inactive. Override `.alerts` when held and active. **Subscribe. Do not rewrite.** |
| `areAlertsActive(policies)` | same file | `normalizeAlertMode(policies?.alerts ?? policies?.empireDefault?.alerts) !== 'silent'`. Correct **if** passed a merged `{ alerts }` **or** if no holding override exists. **Do not** change the silent rule. |
| Top-level `snapshot().alertsActive` | `src/main.js` `installPlayerSecurityProbe` | `areAlertsActive(state.playerSecurity)` — **the residual.** |
| Top-level `snapshot().effectivePolicy` | same | Already `getEffectivePolicy(...)`. Twin invariant after S29. |
| Incidents `snapshot().alertsActive` / `alertsMode` | `createIncidentProbeApi` | Already effective. **Preserve.** |
| Live FLASH | `emitIncidentNotice` | `getEffectivePolicy(...).alerts` into `pushFlash`. **Preserve.** S6.5 / S6.14 stay the pulse contract. |
| Holding setter | `setHoldingAlerts` | Already returns `getEffectivePolicy(...).alerts`. Probe already exposes `incidents.setHoldingAlerts`. |
| S4-21 | `scripts/behavior-probe.mjs` | `alertsActive === (mergedAlerts !== 'silent')` with `mergedAlerts` from `effectivePolicy.alerts`. Green today because the S4 merge fixture does not diverge **alerts**. After S29 the same assert is the **intended** invariant — keep it; add S29 for the missing fixture. |
| Offline Phase 4 | `scripts/test-phase4-incidents.mjs` | Asserts `areAlertsActive` on **empire-default** stores (`s4-21-default-all-is-active`, silent, incidents). Does **not** cover holding override. |

`createPlayerSecurityState` has `empireDefault.alerts` and `holdings[n].alerts`. It has **no** top-level `alerts`. Passing the whole store into `areAlertsActive` therefore **always** reads empire default. That is why the residual is holding-override-only.

## 4. What already exists — subscribe, do not reinvent

**Lane owner (wording):** Number Four.

| Already live | This residual uses it as |
| --- | --- |
| `getEffectivePolicy` / `mergePoliciesByDimension` | The landed equivalent. **Call it.** Do not copy merge rules into a new file. |
| `areAlertsActive` / `normalizeAlertMode` / `ALERT_MODES` | Display gate. Pass the **merged** object. |
| `setEmpireDefaultDimension` / `setHoldingOverrideDimension` / `setHoldingAlerts` | How overrides are written. S29 **uses** them. Do not change retain / reclaim. |
| `isSystemControlled` | `playerHolds` argument. Same as FLASH. |
| Incidents probe snapshot | The template one-liner. |
| `DOCK_CLEAR_LOCKED_FROM_REMASTERED` family | Pattern only. New flag `ALERTS_ACTIVE_LOCKED_FROM_REMASTERED === false`. Do not flip siblings. |

Operator-panel / Settings alert **buttons** already exist (Phase 4). This brief does **not** restyle them. DockClear polish **out**.

## 5. Acceptance exercises (S29 sketch)

Keep Phase 1 / S4–S28 / doctrine / catalog / boarding / Phase 10 / Phase 8 / Phase 9.4 / utility / weapon-ledger / empty-armable / construction / html-catalogs / economy-difficulty / standing-tiers / dock-clear / side-lane green. **S4-21 stays the migrated mode-gate.** **S6.5 stays three observable alert modes.** **S6.14 stays no second FLASH.** Add **S29** only **after** Tenth scopes a later thin fix. IDs are a sketch; do not promise a final count. **This docs PR does not add S29 to the probe and does not add engine.**

Number Three owns the probe gate **after** a later slice, not this brief.

| Case | Required exercise and result (later S29 only) |
| --- | --- |
| **S29.1** Override-active silent vs empire all | Player **holds** current system. Empire alerts `all` (or `incidents`). Holding override **active** `silent`. Top-level `snapshot().alertsActive === false`. Equals `areAlertsActive(getEffectivePolicy(...))`. Equals `effectivePolicy.alerts !== 'silent'` → false. Raw `playerSecurity.empireDefault.alerts` remains `all` / `incidents` (prove the snapshot did **not** still follow the raw store). |
| **S29.2** Override-active all vs empire silent | Reverse of S29.1: empire `silent`, holding override `all` or `incidents`. Top-level `alertsActive === true`. Twins agree. |
| **S29.3** No override / lost holding | No active override, or holding lost (override retained inactive): snapshot matches empire default. Preserve S4-16 / S4-18 analog for **alerts** (lost holding uses empire-default alerts; retained row stays). |
| **S29.4** Twin incidents snapshot | Same fixtures as S29.1 / S29.2: `incidents.snapshot().alertsActive` === top-level `snapshot().alertsActive`. `incidents.snapshot().alertsMode` === `effectivePolicy.alerts`. |
| **S29.5** No ROE rewrite / no gifted fire | After the fix: two ROE modes only; `protectAll === false`; no `firingSolution` gift; no `engagement_authorized`; no culture fire; `mayAutoEngage` unchanged by the alerts boolean. Silent override does not skip `openIncident`. |
| **S29.6** Phase 4 / doctrine / landed lanes | Replay `test:phase4`, `test:doctrine`, S4-21, S6.1 / S6.5 / S6.13 / S6.14. Diff does **not** reopen EW / boarding / Phase 10 / flags / ledger / empty-armable / construction / HTML / economy / standing / dockClear #60/#61 / hygiene #62. No away-team XP / full roster / Thaleron-facility / combat-retune / Flash-lock / dockClear / `git am` work. |
| **S29.7** Blind lock false | `ALERTS_ACTIVE_LOCKED_FROM_REMASTERED === false`. No `git am`. Existing remastered-locks stay false. |

Do not claim a Referee Pass from this list.

## 6. Non-goals

This brief will not:

- Implement engine code or add S29 on **this** PR.
- Rewrite two-mode ROE, `protect-all`, access enforcement, or Phase 2 retain / reclaim.
- Rewrite FLASH pulse, append-only withdrawal, or the incident ledger.
- Restore S4-21 to `alertsActive === false`.
- Gift `firingSolution`, culture fire, or `engagement_authorized`.
- Reopen EW PRs #33 / #35 / #37 / #42 / #43 / #44 / #45, boarding #38 / #39, Phase 10 #40 / #41, flags #46 / #47, ledger #48 / #49, empty-armable #50 / #51, construction #52 / #53, HTML catalogs #54 / #55, economy #56 / #57, standing #58 / #59, dockClear #60 / #61, or hygiene #62.
- Invent an away-team XP table or a Phase 10 full faction roster.
- Invent Thaleron Test Facility (place, quest, pin, or pass).
- Retune combat weapons or treat any Flash number as a live price lock.
- Reopen dockClear / UI-fit.
- `git am` remastered patches, or treat remastered DESIGN as engine source.
- Claim a Referee Pass in `docs/BAKEOFF-STATUS.md`.

## 7. Open questions

Mark these clearly. They do **not** weaken the hard gates.

| ID | Question | Default if a later S29 slice is scoped before an answer |
| --- | --- | --- |
| Q1 | Thin `src/alerts-active.js` helper vs one-line call-site in `snapshot()`? | **Either is in.** Prefer a tiny subscribe module **if** the remastered-lock and S29 snapshot need a home; otherwise the incidents-probe one-liner in `installPlayerSecurityProbe` is enough. Do **not** fork `getEffectivePolicy`. |
| Q2 | Must `areAlertsActive` itself start calling `getEffectivePolicy`? | **No.** Keep the helper as a mode gate on `{ alerts }` / `empireDefault.alerts`. Pass it the **merged** object at readout sites. Changing its signature to require `systemIndex` is optional and must not break offline `test:phase4` empire-default asserts. |
| Q3 | Does S29 need to re-prove live FLASH under a silent holding override? | **Assert subscribe only.** FLASH already uses effective mode. Fail if the snapshot fix **changes** pulse / S6.14. Do not rewrite `pushFlash`. |
| Q4 | Security UI string next to the boolean? | **Out** unless the same Settings chrome already shows a stale “alerts active” string that contradicts the merge — then copy-only, not a dockClear reopen. |
| Q5 | Split engine PRs (helper vs probe)? | Tenth decides after Pass. Gates stay separable. The override-active probe (gate 7) is required on whichever PR first claims the residual closed. |
| Q6 | Away-team XP / Phase 10 roster / Thaleron / dockClear? | **Out.** Other residuals. |

## 8. Implementation sequence and handoff

1. **Brief Pass.** Referee / One score the **seven hard gates**. Number 2 scores gate **3** (no gifted fire). Number Four scores gates **1, 2, 7** (effective readout; no ROE rewrite; thin fix + probe) and the engine half of **4**, plus soft gate **8** as process. Do not open an S29 PR on this document alone.
2. **Tenth scopes** a later thin subscribe / call-site fix **or** leaves this as docs-only. Blind implement from `docs/alerts-active/` against bake-off `main` after #62 (`a1e4695`).
3. **Suggested order if scoped:** remastered-lock false (S29.7) → point top-level `snapshot().alertsActive` at `getEffectivePolicy` (S29.1 / S29.2) → no-override / lost-holding (S29.3) → twin incidents snapshot (S29.4) → no fire gift (S29.5) → replay Phase 4 / doctrine / preservation (S29.6). **Do not** reopen #33–#62. **Do not** rewrite ROE or FLASH.
4. **Number Three** adds/runs S29 after the later slice. Keep S4-21 / S6.5 / S6.14 green. Do not weaken S4-21 to hide a raw-store boolean.
5. Changelog / status Pass wait on Referee after review. This proposal PR may note that the brief is open; it must **not** write a Pass.

## 9. Lanes

| Who | Owns | Scores |
| --- | --- | --- |
| **Number Four** | Later slice: gates **1, 2, 7** — effective readout; no ROE rewrite; thin fix + override-active probe | Boolean matches `getEffectivePolicy`; Phase 4 / doctrine replay green |
| **Number 2** | Doctrine: gate **3** — snapshot fix is not FS / culture / `engagement_authorized` | Alerts override ≠ lock / ceasefire / `mayAutoEngage` |
| **Number Three** | Probe gate **after** a later S29 slice (S29; S4–S28 / S6 / doctrine stay green) | Not this brief |
| **Referee / One** | This brief vs the **seven hard gates** in §2. Gates **4–6** (do-not-reopen including dockClear #60–#61 + hygiene #62 + named outs + blind). **Do-not-open** check: no #33–#62 reopen; no away-team XP / P10 roster / Thaleron / combat retune / Flash locks / dockClear reopen; no `git am`; **no Referee Pass claimed** from this PR | **Before** any engine PR |

This brief is ready to score when a reader can mark Pass/Fail on: top-level `alertsActive` (and named twins) follow effective policy when a holding override is active; two ROEs stay; snapshot fix never gifts fire; landed EW / boarding / Phase 10 / flags / ledger / empty-armable / construction / HTML / economy / standing / dockClear / hygiene not reopened; remastered-lock false; later engine thin fix + override-active probe required.

## Sources and precedence

- This brief’s later-slice checklist: `docs/alerts-active/BM1-ALERTS-ACTIVE-ENGINE-DEPENDENCIES.md`.
- Phase 4 soft residual (planning source): `docs/BAKEOFF-STATUS.md` post-merge note; Referee Pass on `7f926df`; plan §2 / §16 named residual; GUIDED soft residual. **This brief is that follow-up.**
- Phase 4 contract: `docs/phase4/BM1-PHASE4-INCIDENTS-ESCALATION-ALERTS-PROPOSAL.md` §7.2; `docs/phase4/BM1-PHASE4-ENGINE-DEPENDENCIES.md` (`areAlertsActive` = effective mode not silent; S4-21 migration).
- Landed helpers: `src/phase2-security.js` `getEffectivePolicy` / `areAlertsActive`; `src/main.js` `installPlayerSecurityProbe` / `createIncidentProbeApi` / `emitIncidentNotice` / `setHoldingAlerts`.
- DockClear (stay locked; named this residual **out**): `docs/dock-clear/`; PRs **#60 / #61**.
- Hygiene (stay locked): PR **#62**.
- Standing (stay locked): `docs/standing-tiers/`; GUIDED §6; PRs **#58 / #59**.
- Boarding (stay locked; XP `not_tracked_yet`): `docs/boarding/`; PRs **#38 / #39**.
- Phase 10 (stay locked; full roster deferred): `docs/phase10/`; PRs **#40 / #41**.
- EW locked: `docs/phase9/`; PRs **#33 / #35 / #37 / #42 / #43 / #44 / #45**.
- Flags / ledger / empty-armable / construction / HTML / economy: PRs **#46–#57**.
- Remastered engine / DESIGN: **out of bounds.** Not a patch source. Not a constant lock.
- Bake-off process: `docs/BAKEOFF-STATUS.md` (this PR may note the alertsActive brief is open; **no Pass claimed**; #33–#62 remain locked).

Settled Phase 1–10 behavior, Phase 4 hard gates, PR #33 / #35 / #37 / #38 / #39 / #40 / #41 / #42 / #43 / #44 / #45 / #46 / #47 / #48 / #49 / #50 / #51 / #52 / #53 / #54 / #55 / #56 / #57 / #58 / #59 / #60 / #61 / #62, and these seven hard gates take precedence over older handoff text that treated `areAlertsActive` as always-false, treated raw `playerSecurity` as the merge, or treated a snapshot boolean as permission to add a third ROE.
