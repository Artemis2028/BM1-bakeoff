# BM1 station construction visuals

**Status:** proposal for scaffold / workbee / blue-beam construction language; no engine changes made by this document.  
**Repository:** `Artemis2028/BM1-bakeoff`  
**Planning baseline:** `3933daf` on `main` (20 September 2026), after empty-but-armable engine (PR #51).  
**Referee context:** Phase 4 engine §6 **Pass** on `7f926df`. Phase 9–9.4 EW (PRs #33 / #35 / #37 / #42 / #43 / #44 / #45), boarding (PRs #38 / #39), Phase 10 Dominion-first (PRs #40 / #41), flags / passes (PRs #46 / #47), the weapon / device source ledger (PRs #48 / #49), and empty-but-armable (PRs #50 / #51) are the **locked** baselines — **Keep #33, #35, #37, #38, #39, #40, #41, #42, #43, #44, #45, #46, #47, #48, #49, #50, and #51 locked.** This is a **station-construction-visuals brief only**, not a repair-arms redo, not a Phase 4 combat-evidence reopen, not a fire-gate gift, and **not** a claim that those lanes already had a Referee Pass on the status MD. This brief does **not** claim a new Referee Pass.  
**Companion:** `docs/construction-visuals/BM1-STATION-CONSTRUCTION-ENGINE-DEPENDENCIES.md` (hooks, risks, later S24 probe sketch).  
**Scoped by:** Tenth Mountain Trooper, 2026-09-20 — proposal first; no engine until Tenth scopes after a brief Pass. Room-locked hard gates (construction language ≠ combat / repair / attributed attack; do not redo repair arms; construction art ≠ repair arms; beams ≠ Phase 4 evidence; no gifted fire; do-not-reopen + named outs + blind) are **in** this one scoreable brief.

Phases 1–10 and Phase 9–9.4 already landed, including closed fire gates (pursuit ≠ permission ≠ per-weapon firing gate), a side-lane `repairCapable` overlay on the **player ship only** (PR #18), player-built stations that already carry `underConstruction` + a **placeholder** dashed-ring site draw, a subscribe-only source ledger, a utility inventory book, and empty-but-armable persistence (PR #51). Convergence §5 and plan §16.2 row 5 named the remaining **station construction visuals** gap: scaffolds, workbees, and **blue** construction beams mean a station is **being built** — not combat, not repair, and not an attributed attack.

This is **one** construction-language brief: publish a **scoreable contract** that a constructing station reads as a build site, that repair arms stay the side-lane overlay, that construction art is never reused as repair arms, and that construction beams never write `observedAttacks`, standing, FLASH, or a fire token. It is not a remastered `git am`, not a repair-arms rewrite, not a Phase 4 reopen, not empty-armable reopen, not dockClear polish, not an HTML catalog, and not a Flash price lock.

## 1. The result we want

A reader can **score construction language versus combat / repair / attribution** without anyone retuning weapons or redrawing the side-lane repair overlay. A station with `underConstruction: true` shows scaffold / workbee / **blue**-beam language (or an explicit **asset-missing** probe if the construction GIF is not in-tree). Repair still overlays `repairarms` on the **player ship** only while a `repairCapable` repair is running. Construction beams never become weapons fire.

**Exit condition (GUIDED-CONVERGENCE §5 / plan §16.2 row 5):** a constructing station shows scaffold / workbee / blue-beam language, not the repair-arms overlay; repair still uses the side-lane overlay only; construction visuals never authorize ROE fire or a kill-standing token.

**Proposed first-release decisions:**

| Question | Proposed answer |
| --- | --- |
| What is the first playable slice? | **Docs-only** scoreable contract under `docs/construction-visuals/`. A later thin visual engine, **if** Tenth scopes it after Pass, **subscribes** to landed `underConstruction` / `drawStationConstructionSite` / side-lane `shouldDrawRepairOverlay` + `overlayUsesForbiddenArt` without rewriting combat numbers or redo-ing PR #18. |
| What do scaffolds, workbees, and **blue** construction beams mean? | **A station is being built.** Not combat. Not repair. Not an attributed attack. |
| May we redo repair arms? | **No.** Side-lane Pass PR #18 stays: overlay `repairarms` on the **player ship** only while `repairCapable` repair is running. Defense platforms never repair. |
| May construction art be reused as repair arms? | **No.** `stationconstructing.gif` and similar stay construction-only. `FORBIDDEN_REPAIR_OVERLAY_ASSETS` already names `stationconstructing.gif` and `workbee`. |
| Are construction beams Phase 4 combat evidence? | **No.** They must not write `observedAttacks`, standing, or FLASH as weapons fire. They must not call `addProjectile` / `addWeaponEffect({ kind: 'beam' })` / `fireStationWeapon`. |
| May construction visuals gift `firingSolution`, culture fire, or `engagement_authorized`? | **No.** |
| May we reopen EW #33/#35/#37/#42/#43/#44/#45, boarding #38/#39, Phase 10 #40/#41, flags #46/#47, ledger #48/#49, or empty-armable #50/#51? | **No.** |
| DockClear polish, HTML catalogs, combat retune, Flash price locks, empty-armable reopen? | **Out.** |
| May we `git am` remastered patches or lock remastered constants? | **No.** `CONSTRUCTION_LOCKED_FROM_REMASTERED === false` (name can change). |
| Does the current dashed-ring site draw already close this package? | **No.** `drawStationConstructionSite` is **placeholder chrome** (gold / cyan dashes + a green progress arc + remaining-days pill). That is not scaffold / workbee / **blue**-beam language. Subscribe to `underConstruction`; do not treat the placeholder as the Pass. |
| Are workbees combat NPCs / empty-armable hulls / boardable prizes? | **No.** Site-local construction effects. Do not invent a workbee hull id. Do not spawn them into `npcShips` as shooters. |
| Phase 8 reconstruction of ruins? | **Out.** `rebuildSystemStations` un-destroys immediately and does **not** set `underConstruction`. Do not force ruins onto this visual path. |
| Is this a Referee Pass? | **No.** Referee / One / Number 2 / Number Four score the hard gates **before** any engine. Number Three probes only after engine. |

These are recommendations for this construction-language package, not new decisions attributed to the user. Locked bake-off constraints take precedence over older flavor that treated a construction beam as weapons fire, borrowed `stationconstructing.gif` as repair arms, or treated the dashed-ring HUD as the agreed site language.

Cite GUIDED-CONVERGENCE §5 and plan §16.2 row 5 as the planning sources this brief **reconciles**, not as a second spec:

| Planning source | This brief |
| --- | --- |
| GUIDED §5: scaffolds, workbees, **blue** construction beams mean a station is being built | Gate 1. |
| GUIDED §5: that language is **not** combat, repair, or an attributed attack | Gates 1, 4, 5. |
| GUIDED §5 / side-lane Pass PR #18: repair-arms overlay on the **player ship** only while `repairCapable` repair runs; defense platforms never repair | Gate 2. |
| GUIDED §5: construction art (`stationconstructing.gif` and similar) must **not** be reused as repair arms | Gate 3. |
| GUIDED §5: construction beams are **not** Phase 4 combat evidence — no `observedAttacks`, standing, or FLASH as weapons fire | Gate 4. |
| GUIDED §5 acceptance 3: construction visuals never authorize ROE fire or a kill-standing token | Gates 4 and 5. |
| Phase 9 gate 5 / ledger / empty-armable: never gift FS / culture / `engagement_authorized` | Gate 5. |
| Plan §16.2 rows 1–4, 9 | **Locked or out.** Do not reopen ledger / flags / boarding / empty-armable. HTML catalogs stay out. |

## 2. Locked constraints (do not reopen)

The bake-off room locked these before this brief. Implementation and probes must treat **gates 1–7** as **hard gates**. Referee / One score this brief against those **seven** **before** any engine PR. Number Three probes only after engine. EW / boarding / Phase 10 / flags / ledger / empty-armable gates stay **closed**; they are restated only as **gate 6** (preserve / do-not-open), not as a reopen. This docs PR **does not** claim a Referee Pass.

### Hard gate 1 — Construction language means “being built”

> Scaffolds, workbees, and **blue** construction beams mean a station is **being built**. They are **not** combat, **not** repair, and **not** an attributed attack. A constructing station (`underConstruction: true`) must read as a **build site**. Placeholder gold / cyan dashed rings and a green progress arc are **not** that language.

Lane owner (wording): **Number Four** on the site draw; **Number 2** on “build ≠ attack.”

Pack review notes (`a-73`, `a-232`, `a-233`): use `stationconstructing.gif` (79 × 84, one frame) for an unfinished station, scaled to the site; workbees move around it and direct **blue** construction beams at the scaffolding. Those are construction effects, not weapons fire or aggression. A later engine that leaves only the current dashed-ring HUD, or that paints the beams as Phaser / Cutting Beam shots, **fails**.

### Hard gate 2 — Do not redo repair arms

> Overlay `repairarms` on the **player ship** only while `repairCapable` repair is running. Defense platforms never repair. Docking permission ≠ repair service. This brief **subscribes** to side-lane Pass PR #18. It does **not** reopen `isRepairCapableLocation`, `shouldDrawRepairOverlay`, or the Maintenance Station / planet / yard table.

Lane owner (wording): **Number Four**.

`shouldDrawRepairOverlay` already requires `session.inProgress`, `capable`, `servicesAllowed`, `overlayAssetPresent`, and `actor === 'player'`. First slice **keeps** that. A probe that “implements construction visuals” by drawing repair arms on a station, an NPC, a workbee, or a scaffold **fails**.

### Hard gate 3 — Construction art is not repair arms

> Construction art (`stationconstructing.gif` and similar, including workbee sprites) must **not** be reused as repair arms. `FORBIDDEN_REPAIR_OVERLAY_ASSETS` already lists `stationconstructing.gif` and `workbee`. If construction art is missing in-tree, the later engine records **asset-missing** — it must **not** bind `repairarms.gif` as a scaffold, and it must **not** bind `stationconstructing.gif` as the player-ship overlay.

Lane owner (wording): **Number Four**.

`assets/game/repair/` is **absent** on `3933daf`. `stationconstructing.gif` is also **absent** (pack notes; not shipped in `bm-ships/`). Side-lane S7.4 already has the repair **asset-missing** path. Construction gets the same rule on the other side of the wall. Substituting either GIF for the other **fails**.

### Hard gate 4 — Construction beams are not Phase 4 combat evidence

> Construction beams must **not** write `observedAttacks`, standing, or FLASH as weapons fire. They must not call `recordObservedAttack` / `recordAttackOnPlayerSide`, `openIncident` / `queueFlash`, `addProjectile`, `addWeaponEffect({ kind: 'beam' })`, `addCuttingBeamEffects`, or `fireStationWeapon`. A constructing station still **does not fire** (`fireStationWeapon` already returns when `underConstruction`).

Lane owner (wording): **Number Four** on emit; **Number 2** on “a blue beam is not an attributable attack.”

Phase 4 already allowlists FLASH kinds (`access_noncompliance`, `access_inability`, `destruction`, `distress`, `asset_overdue`). Construction is not on that list. A later engine that pulses FLASH because a workbee “shot” a scaffold, or that records `observedAttacks` from a blue construction beam, **fails** even if the site “looks busy.”

### Hard gate 5 — Never gift fire from construction visuals

> Construction visuals must **never** gift `firingSolution`, culture fire, or `engagement_authorized`. They are not a weapons-free token, not a Phase 3 ceasefire, not a boarding warrant, and not a Dominion discovery write. Pursuit, permission to engage, and the per-weapon firing gate stay the landed three-step. A constructing station may be **seen**. It does not **authorize** a shot.

Lane owner (wording): **Number 2**.

Same doctrine lean as Phase 9 gate 5, Phase 10 stories, flags credentials, the ledger, and empty-armable. An observer may still **pursue** a hostile constructor elsewhere. The blue beam itself is not permission.

### Hard gate 6 — Do not reopen landed lanes

> Do **not** reopen EW #33 / #35 / #37 / #42 / #43 / #44 / #45 (matrix read-only; ghosts book-only; no report wipe; soft numbers ≠ new fire rules; `MAGNITUDES_LOCKED_FROM_REMASTERED === false`). Do **not** reopen boarding #38 / #39 (`tractorIsBoarding()` stays false; capture XOR scuttle; XP `not_tracked_yet`; prize empty slots already preserved). Do **not** reopen Phase 10 #40 / #41 (stories stay knowledge layers). Do **not** reopen flags / passes #46 / #47 (`utilityBook` stays credentials; Thaleron pass **unverified — not shipped**). Do **not** reopen weapon ledger #48 / #49 (Phase 9 matrix read-only; Flash prices source not locks; three disruptor identities; Bajoran Sail / Warp Core deferred). Do **not** reopen empty-armable #50 / #51 (three slots; empty stays empty; unarmed cannot fire; `EMPTY_ARMABLE_LOCKED_FROM_REMASTERED === false`).

Lane owner (wording): **Referee / One**.

### Hard gate 7 — Named outs; blind bake-off

> Do **not** open dockClear polish, HTML catalogs, combat retune, Flash price locks, or empty-armable reopen. Do **not** `git am` remastered patches. `CONSTRUCTION_LOCKED_FROM_REMASTERED === false`. Implement later from bake-off `docs/` + landed `underConstruction` / repair-overlay helpers — **not** `BM1-remastered-work` engine. Phase 8 ruin reconstruction, construction **costs / days**, and station-plan inventory stay **out** of this visual package.

Lane owner (wording): **Referee / One**.

### Soft gate 8 — Suites stay green (after engine)

> **Soft:** existing suites stay green (S4–S23 / catalog / doctrine / boarding / Phase 10 / Phase 9.4 / utility / weapon-ledger / empty-armable / side-lane). Screenshot / no-clip is **N/A** on this docs PR. A later engine PR attaches UI shots **only if** the construction site visual ships; dockClear polish stays **out**.

Lane owner (wording): **Number Four** (process); **Number Three** scores suite-green **after** engine.

### Also from the room (score with the gates)

| Plan / room want | How this brief locks it |
| --- | --- |
| Scaffolds / workbees / blue beams = being built | Gate 1. |
| Not combat, repair, or an attributed attack | Gates 1, 4, 5. |
| Do not redo repair arms (PR #18) | Gate 2. |
| Construction art ≠ repair arms | Gate 3. |
| Beams ≠ Phase 4 evidence | Gate 4. |
| Never gift FS / culture / `engagement_authorized` | Gate 5. |
| Do not reopen EW / boarding / Phase 10 / flags / ledger / empty-armable | Gate 6. |
| Named outs; blind; remastered-lock false | Gate 7. |
| Suites green; no Referee Pass from this PR | Soft gate 8. Scoring note below. |

### Must not break (cite landed work)

Score as **preservation**. A later construction-visuals Pass that regresses them is a Fail. **#33, #35, #37, #38, #39, #40, #41, #42, #43, #44, #45, #46, #47, #48, #49, #50, and #51 stay locked.**

| Locked rule | Cite | This brief / later engine must not |
| --- | --- | --- |
| Repair overlay on **player ship** only while `repairCapable` repair runs | Side-lane PR #18; S7.4 | Draw arms on stations / NPCs / workbees / scaffolds. Bind construction GIFs as arms. Make defense platforms repair. |
| Defense platforms never repair | Side-lane gate 1; types 86 / 87 | Treat a constructing platform as a repair yard. |
| Pursuit ≠ permission ≠ per-weapon gate | Phase 9 gate 5; plan §11 | Gift FS / culture / `engagement_authorized` from a blue beam. |
| Phase 4 single standing / FLASH allowlist | PR #13; S6 | Write `observedAttacks` / FLASH / kill-standing from construction. |
| Constructing stations do not fire / dock | `fireStationWeapon` / `tryDockAtStation` | Arm the site so the blue beam “has a host weapon.” |
| Ten-column matrix before overhaul; numbers unchanged | Phase 9 gate 4; ledger #48/#49 | Edit live damage / cooldown / range / price “so construction beams hit.” |
| Tractor ≠ boarding | #38 / #39; `tractorIsBoarding() === false` | Tractor-as-construction-crane / boarding from a workbee. |
| Empty stays empty; unarmed cannot fire | #50 / #51 | Auto-fill Type X onto a workbee “because it should have guns.” |
| Flags/passes are credentials, not slots | #46 / #47 | Move construction state into `utilityBook`. Ship Thaleron **pass**. |
| Ledger subscribe-only; Flash prices not locks | #48 / #49 | Treat a Flash number as a live lock that “pays for scaffolds.” |
| `*_LOCKED_FROM_REMASTERED === false` | #44–#51 | Flip EW / boarding / Phase 10 / utility / ledger / empty-armable / new construction lock flags true. |

### Process locks (not a change to gates 1–7)

- **Proposal first.** Do not implement from this text until Tenth scopes the engine lane after a brief Pass.
- **Blind bake-off.** Implement against bake-off `main` (`3933daf` after #51), **not** remastered `758665e`. From `docs/` + landed construction / repair helpers only. Do **not** crib `Artemis2028/BM1-remastered-work`.
- **Subscribe, do not fork.** Reuse `underConstruction`, `drawStationConstructionSite`, `shouldDrawRepairOverlay`, `overlayUsesForbiddenArt`, `isRepairCapableLocation`. Do not invent a second repair religion.
- **#33 / #35 / #37 / #38 / #39 / #40 / #41 / #42 / #43 / #44 / #45 / #46 / #47 / #48 / #49 / #50 / #51 stay locked.**
- **No Pass claimed** in `docs/BAKEOFF-STATUS.md` from this PR.

### Scoring note

Referee / One / Number 2 / Number Four score the **seven hard gates** **before** any engine PR. Number Three probes **only after** engine. **No Referee Pass is claimed by this docs PR.** Room scores the brief before any engine.

## 3. What “construction language” means (gates 1–3)

**Lane owner (wording):** Number Four on art / overlay; **Number 2** on meaning.

| Term | Meaning in this brief |
| --- | --- |
| Constructing station | A live station with `underConstruction: true` (player-built first slice: `confirmPendingStationBuild` writes that flag + `constructionStartedDay` / `constructionDays`). |
| Scaffold | Site-local unfinished-station art. Pack name: `stationconstructing.gif` (ART 234; 79 × 84; one frame). Scaled to the construction site. **Not** a repair overlay. **Not** a completed hull. |
| Workbee | Construction-support craft **effect** that moves around the unfinished station. Pack review name “Construction Workbee” (`a-73`). **Not** a combat NPC. **Not** an empty-armable hull. **Not** a boardable prize. **Not** a repair arm. |
| Blue construction beam | A **blue** beam from a workbee (or equivalent site emitter) **at the scaffolding**. Construction effect. **Not** Phaser / Cutting Beam / Tractor. **Not** attributable weapons fire. |
| Repair-arms overlay | `repairarms.gif` drawn over the **player ship** only while a `repairCapable` repair session is running (PR #18). |
| Placeholder site chrome | Current `drawStationConstructionSite`: gold dashed ring, cyan dashed ring, green progress arc, remaining-days pill. **Subscribe as HUD if useful.** It does **not** satisfy gate 1 by itself. |
| Asset-missing | Construction GIF not in-tree. Later engine records that fact. May draw **programmatic** scaffold / workbee / **blue**-beam language. Must **not** borrow `repairarms.gif`. |

`bm-ships/review-decisions.json` `scope` already says station / repair / construction decisions are **retained for context**, not shipped as station assets. `missingFeatures` still lists `station construction/workbees`. That list is **not** a license to invent a workbee hull id or to treat helper existence as the Pass.

## 4. What already exists (subscribe; do not reinvent)

Empty-armable and the side-lane already closed adjacent packages. Construction visuals **subscribe**:

| Surface | Landed fact at `3933daf` | This brief requires |
| --- | --- | --- |
| `underConstruction` | `confirmPendingStationBuild` (~12045) writes `true`, `constructionStartedDay`, `constructionDays`. `completeDueStationConstructions` (~11508) clears it at progress 1. | Keep the flag. Visuals attach **while** it is true and stop when it clears. |
| Placeholder site draw | `drawStationConstructionSite` (~22342) + faded / grayscale hull (~22459). Gold / cyan dashes + green arc + `{remaining}d`. | Subscribe. Extend or replace the **language** with scaffold / workbee / blue beams. Progress HUD may stay. |
| No dock / no fire | `tryDockAtStation` (~16831) refuses; `fireStationWeapon` (~17958) returns; `stationWeaponIds` empty while constructing (~3092, ~12347). | **Keep.** Do not arm the site so a blue beam “needs a weapon id.” |
| Repair overlay | `shouldDrawRepairOverlay` + `REPAIR_ARMS_ASSET_PATH` (`assets/game/repair/repairarms.gif`). Drawn on the player sprite only (~22547). | **Keep.** Construction must not touch the predicate except to keep forbidding construction art. |
| Forbidden repair art | `FORBIDDEN_REPAIR_OVERLAY_ASSETS` = `stationconstructing.gif`, `workbee`. `overlayUsesForbiddenArt`. Probe: `overlayUsesConstructionArt`. | **Keep and extend** if a later construction path is added — never invert it. |
| Phase 4 evidence | `recordAttackOnPlayerSide` (~5008) → `recordObservedAttack`. FLASH allowlist in `phase4-incidents.js`. | Construction path must not call these. |
| Combat beams | `addWeaponEffect({ kind: 'beam' })` / `addCuttingBeamEffects` / `addProjectile` from `firePlayerWeapon` / `fireNpcWeapon` / `fireStationWeapon`. | Construction beams stay **off** those lists. |
| Station plans | `state.stationPlans` inventory; Phase 8 reconstruction `rebuildSystemStations` (~12488) un-destroys ruins **without** `underConstruction`. | **Out.** Do not retune costs / days. Do not fold reconstruction into this visual. |
| Empty-armable | `src/empty-armable.js`; three slots; unarmed cannot fire. | **Subscribe / do not reopen.** Workbees are not hulls 348 / 349 / 350. |

**Gap this brief closes (docs now; engine only if scoped):** there is no **scoreable S24 contract** that (a) a constructing station shows scaffold / workbee / **blue**-beam language rather than repair arms or placeholder-only chrome, (b) construction art never becomes the player-ship overlay, (c) construction beams never write Phase 4 evidence or a fire token.

## 5. Acceptance exercises (S24 sketch)

Keep Phase 1 / S4–S23 / doctrine / catalog / boarding / Phase 10 / Phase 9.4 / utility / weapon-ledger / empty-armable / side-lane green. **S7 stays repair.** **S14 stays Phase 9.** **S17 stays boarding.** **S23 stays empty-armable.** Add **S24** only **after** Tenth scopes a later thin engine. IDs are a sketch; do not promise a final count. **This docs PR does not add S24 to the probe.**

Number Three owns the probe gate **after** engine, not this brief.

| Case | Required exercise and result (later engine only) |
| --- | --- |
| **S24.1** Constructing station shows construction language | Start (or probe-inject) a player-built station with `underConstruction: true`. Site language is scaffold / workbee / **blue** beam (or explicit `assetMissing: true` **and** programmatic construction language). Not the repair-arms overlay. Placeholder-only gold/cyan dashes **fail** if they are the only site language. |
| **S24.2** Repair overlay unchanged | At a `repairCapable` location, overlay still appears on the **player ship** only while repair runs, and is absent when docked-but-not-repairing. Defense platforms still refuse. Overlay `src` is not `stationconstructing.gif` / workbee. Construction site does not draw `repairarms`. |
| **S24.3** Beams are not Phase 4 evidence | While the site is constructing (force workbee / blue-beam draw): `observedAttacks` length unchanged; no new FLASH; no `destruction` / `witnessed_aggression` incident from the beam; `addProjectile` / combat `kind: 'beam'` effect count unchanged; `fireStationWeapon` still no-ops. |
| **S24.4** No gifted fire | Construction inject does not write `firingSolution` or `engagement_authorized`. Culture cannot grant fire from “watching the build.” ROE does not flip from the beam. |
| **S24.5** Site safety + meaning preserved | Constructing station still refuses dock. Still has empty `stationWeaponIds`. Completing construction (`completeDueStationConstructions`) **stops** scaffold / workbee / blue-beam language. Repair still never lands on a defense platform. |
| **S24.6** Landed lanes preserved | Replay S7 / S14–S23 / S17 / S18. No EW / boarding / Phase 10 / flags / ledger / empty-armable reopen. No dockClear / HTML-catalog / combat-retune / Flash-lock / empty-armable work in the diff. `CONSTRUCTION_LOCKED_FROM_REMASTERED === false`. |

Do not claim a Referee Pass from this list.

## 6. Non-goals

This brief will not:

- Implement engine code, UI screenshots, or dockClear polish.
- Redo `repairCapable` / `shouldDrawRepairOverlay` / defense-platform refuse.
- Reuse `stationconstructing.gif` (or workbee art) as repair arms, or `repairarms.gif` as a scaffold.
- Write `observedAttacks`, standing, or FLASH from construction beams.
- Gift `firingSolution`, culture fire, or `engagement_authorized`.
- Retune damage, cooldown, range, live prices, or `constructionDays` / build costs.
- Rewrite the Phase 9 ten-column matrix or reopen fire-gate wording.
- Invent a workbee hull id, empty-armable workbee, or boardable construction craft.
- Fold Phase 8 ruin reconstruction into `underConstruction`.
- Open HTML review catalogs.
- Treat any Flash number as a live price lock.
- Reopen EW PRs #33 / #35 / #37 / #42 / #43 / #44 / #45, boarding #38 / #39, Phase 10 #40 / #41, flags #46 / #47, ledger #48 / #49, or empty-armable #50 / #51.
- `git am` remastered patches, or treat remastered DESIGN as engine source.
- Claim a Referee Pass in `docs/BAKEOFF-STATUS.md`.

## 7. Open questions

Mark these clearly. They do **not** weaken the hard gates.

| ID | Question | Default if a later engine is scoped before an answer |
| --- | --- | --- |
| Q1 | Canonical construction asset path once engine is scoped (`stationconstructing.gif` is not in-tree; `assets/game/repair/` is also absent)? | **S24.1 asset-missing path.** Programmatic scaffold / workbee / **blue** beams are allowed. Do **not** substitute `repairarms.gif`. |
| Q2 | Are workbees decorative effects or spawned hulls? | **Decorative / site-local effects.** Not `npcShips`. Not empty-armable. Not boardable. Do not invent a pack hull id. |
| Q3 | How many workbees / beam width / orbit rate? | **TBD / injectable.** Color is **blue**. Magnitudes are not a fire rule. |
| Q4 | May the remaining-days pill / progress arc stay? | **Yes**, as HUD beside the construction language. It does not replace scaffolds / workbees / blue beams. |
| Q5 | NPC- or world-built constructing stations (not `builtByPlayer`)? | **First slice = player-built `underConstruction`.** Other constructors later if Tenth scopes them. Meaning gates still apply if they appear. |
| Q6 | Phase 8 ruin reconstruction — should ruins show scaffolds? | **Out.** Reconstruction currently un-destroys immediately. Do not silently add `underConstruction` there. |
| Q7 | May a constructing defense platform show construction language? | **Yes**, if the player legally started that build. It still **cannot repair**. Construction ≠ `repairCapable`. |
| Q8 | HTML station catalog / dockClear / empty-armable reopen? | **Out.** |

## 8. Implementation sequence and handoff

1. **Brief Pass.** Referee / One score the **seven hard gates**. Number 2 scores gates **1, 4, 5** (meaning / not evidence / no gifted fire). Number Four scores gates **2, 3** and the engine half of **6**, plus soft gate **8** as process. Do not open an engine PR on this document alone.
2. **Tenth scopes** a later thin visual engine **or** leaves this as docs-only. Blind implement from `docs/construction-visuals/` against bake-off `main` after #51 (`3933daf`).
3. **Suggested order if scoped:** subscribe `underConstruction` + snapshot lock false (S24.1) → keep repair overlay + forbidden-art wall (S24.2) → construction beams off Phase 4 / projectile / weapon-effect paths (S24.3) → no FS inject (S24.4) → dock/fire/complete safety (S24.5) → preservation replay (S24.6). **Do not** redo PR #18. **Do not** reopen #33–#51.
4. **Number Three** adds/runs S24 after engine. Keep S4–S23 green. Do not weaken S7 / S14 / S17 / S23 to make S24 pass.
5. Changelog / status Pass wait on Referee after review. This proposal PR may note that the brief is open; it must **not** write a Pass.

## 9. Lanes

| Who | Owns | Scores |
| --- | --- | --- |
| **Number 2** | Doctrine: gates **1, 4, 5** — build ≠ attack; beams ≠ Phase 4 evidence; no FS / culture / `engagement_authorized` | A blue construction beam is not a shot and not a standing token |
| **Number Four** | Engine: gates **2, 3** (repair overlay untouched; construction art ≠ arms) plus later S24 subscribe-only hooks. Must not retune `game_items.json` or reopen EW / boarding / flags / ledger / empty-armable | Site reads as a build; repair stays the side-lane overlay |
| **Number Three** | Probe gate **after** engine (S24; S4–S23 stay green) | Not this brief |
| **Referee / One** | This brief vs the **seven hard gates** in §2. Gates **6–7** (do-not-reopen + named outs + blind). **Do-not-open** check: no #33–#51 reopen; no dockClear / HTML catalogs / combat retune / Flash locks / empty-armable reopen; no `git am`; **no Referee Pass claimed** from this PR | **Before** any engine PR |

This brief is ready to score when a reader can mark Pass/Fail on: construction language means being built; repair arms not redone; construction art ≠ repair arms; beams ≠ Phase 4 evidence; no gifted fire; landed EW / boarding / Phase 10 / flags / ledger / empty-armable not reopened; remastered-lock false and named outs held.

## Sources and precedence

- This brief’s engine checklist: `docs/construction-visuals/BM1-STATION-CONSTRUCTION-ENGINE-DEPENDENCIES.md`.
- Planning: `docs/GUIDED-CONVERGENCE.md` §5; `docs/revised-development-plan.md` §16.2 row 5.
- Pack construction notes (context, not shipped assets): `bm-ships/review-decisions.json` `a-73`, `a-231`, `a-232`, `a-233`; `bm-ships/integration-rules.json` `missingFeatures` `station construction/workbees`.
- Side-lane repair (subscribe, do not redo): `docs/side-lane-repair-reman-independence/`; PR **#18**; S7.4.
- Landed construction flag / placeholder draw: `src/main.js` `underConstruction`, `confirmPendingStationBuild`, `drawStationConstructionSite`, `fireStationWeapon`, `tryDockAtStation`.
- Phase 4 evidence (do not write): `src/phase2-security.js` `recordObservedAttack`; `src/phase4-incidents.js` FLASH allowlist; PR **#13**.
- Empty-armable (do not reopen): `docs/empty-armable/`; PRs **#50 / #51**; S23.
- Ledger / Tractor / Flash (do not reopen): `docs/weapon-ledger/`; PRs **#48 / #49**.
- Flags/passes (do not stuff construction into the book): `docs/flags-passes/`; PRs **#46 / #47**.
- EW locked: `docs/phase9/`; PRs **#33 / #35 / #37 / #42 / #43 / #44 / #45**; S14–S20.
- Phase 10 locked: `docs/phase10/`; PRs **#40 / #41**; S18.
- Boarding locked: `docs/boarding/`; PRs **#38 / #39**; S17.
- Remastered engine / DESIGN: **out of bounds.** Not a patch source. Not a constant lock. Not `758665e`.
- Bake-off process: `docs/BAKEOFF-STATUS.md` (this PR may note the construction-visuals brief is open; **no Pass claimed**; #33–#51 remain locked).

Settled Phase 1–10 behavior, Phase 9–9.4 gates, PR #33 / #35 / #37 / #38 / #39 / #40 / #41 / #42 / #43 / #44 / #45 / #46 / #47 / #48 / #49 / #50 / #51, and these seven hard gates take precedence over older handoff text that treated a construction beam as weapons fire or reused construction art as repair arms.
