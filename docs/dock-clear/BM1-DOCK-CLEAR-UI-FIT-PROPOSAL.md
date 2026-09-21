# BM1 dockClear / UI fit polish

**Status:** proposal for the parked **dockClear / UI-fit** residual; no engine changes made by this document.  
**Repository:** `Artemis2028/BM1-bakeoff`  
**Planning baseline:** `52e36d9` on `main` (21 September 2026), after standing-tiers engine (PR #59).  
**Referee context:** Phase 4 engine §6 **Pass** on `7f926df`. Phase 9.2 engine (PR #37) **closed** dock-overlap for the centered operator panel (`.top-left-panel` / OPS / Inventory / Settings) and left target / map / related dock chrome as a **soft residual**. Standing-tiers brief + S27 engine are **landed** (PRs #58 / #59) — **GUIDED §6 / #58 / #59 stay locked.** EW #33 / #35 / #37 / #42 / #43 / #44 / #45, boarding #38 / #39, Phase 10 #40 / #41, flags #46 / #47, ledger #48 / #49, empty-armable #50 / #51, construction #52 / #53, HTML catalogs #54 / #55, and economy-difficulty #56 / #57 stay **locked**. This is a **thin UI / layout slice only**, not a gameplay rewrite, not a 9.2 reopen, not a standing reopen, and **not** a claim that those lanes already had a Referee Pass on the status MD. This brief does **not** claim a new Referee Pass.  
**Companion:** `docs/dock-clear/BM1-DOCK-CLEAR-ENGINE-DEPENDENCIES.md` (hooks, risks, later S28 layout-slice sketch).  
**Scoped by:** Tenth Mountain Trooper, 2026-09-21 — proposal + deps first; room scores the hard gates **before** any engine. Room-locked hard gates (fit only; no gameplay rewrite; never gift fire; do-not-reopen including standing #58–#59; named outs; blind; later engine must attach baseline + after screenshots + overflow JSON) are **in** this one scoreable brief.

Phases 1–10 and the later subscribe packages already landed. Phase 9.2 gate 7 reserved `--bm1-dock-clear` and raised the centered operator panel so OPS / Inventory / Settings report `dockClear: true` and `clippedControls: []` at 1280×720 (S16.15). Later tips **explicitly left dockClear polish out**: 9.3 / 9.4, boarding, Phase 10, flags, ledger, empty-armable, construction, HTML catalogs, economy-difficulty, and standing-tiers. Attached overflow JSON still shows **target** and **star-chart / map** shots reporting `dockClear: false` (and, on map-open shots, the operator panel hidden). That is the residual this brief scores.

This is **one** docs-layout brief: publish a **scoreable contract** that target / map / related dock chrome **fit their designated boxes**, that labeled systems do not clip or overflow, that the same screenshot / no-clip gate used since Phase 9 measures the **visible** box, and that UI polish never gifts `firingSolution`, culture fire, or `engagement_authorized`. It is not a remastered `git am`, not an EW reopen, not a standing-tiers reopen, not a Phase 4 `alertsActive` policy rewrite, and not a combat retune.

**This PR ships proposal + engine-deps only.** A later thin **layout slice** that closes the parked residual as a probeable S28 surface is the natural later deliverable. This brief does **not** ship that slice and does **not** attach PNGs.

## 1. The result we want

A later writer can treat **target / map / related dock chrome** the same way Phase 9.2 treated the centered operator panel: text and controls stay inside the designated box; the box clears the bottom dock at the process viewport; labeled star-chart systems stay inside the chart box; overflow JSON tells the truth about the **visible** chrome.

**Exit condition:** the seven hard gates in §2 are scoreable; already-green operator-panel dock-clear (S16.15) stays green; standing GUIDED §6 / #58 / #59 stay closed; no gameplay rewrite.

**Proposed first-release decisions:**

| Question | Proposed answer |
| --- | --- |
| What is the first playable slice? | **Docs-only** scoreable contract under `docs/dock-clear/`. **This PR does not ship engine.** A later thin layout slice (S28), **if** Tenth scopes it after Pass, lives as CSS / measurement subscribe around landed `--bm1-dock-clear`, `#target-window`, `.interstellar-map-*`, and `.bottom-dock`. Name can change. |
| Is a thin layout slice the natural later deliverable? | **Yes.** Analog: Phase 9.2 gate 7 (CSS inset, not EW math). S28 is **fit**, not a new HUD religion and not a map-discovery rewrite. Combat / standing / EW / boarding / markets stay **untouched**. |
| What is already green? | Centered `.top-left-panel` (OPS / Inventory / Settings) at 1280×720: `dockClear: true`, `clippedControls: []`. Contained `overflow-y: auto` is OK. **Preserve.** Do not reopen 9.2 gate 7 as unfinished EW work. |
| What is still residual? | Target / map / related dock chrome still reporting `dockClear: false` or overflow in the Phase 9.2+ screenshot gate. Target shots hide `#top-left-panel`, so today’s `snapshotDockFit().dockClear` (operator-panel vs dock only) is **false** even when target buttons are not under the dock. Map-open shots are the same family (`mapOpen: true`, operator panel hidden). Labeled systems must still fit the chart box. |
| How do we measure? | **Same screenshot / no-clip gate used since Phase 9** (1280×720 Chromium; `clippedControls: []`; no horizontal overflow of the designated box; panel bottom above the dock). Score the **visible** designated box: operator panel when OPS/Inv/Settings is open; `#target-window` when Target is open; map / star-chart chrome when the map is open. Do **not** “pass” a hidden operator panel. Do **not** clip EW / boarding / map labels to fake clearance. |
| May we change fire gates, EW, boarding, markets, standing tiers, difficulty overlays, or catalog wire? | **No.** Fit only. |
| May UI polish gift `firingSolution`, culture fire, or `engagement_authorized`? | **No.** |
| May we reopen EW #33–#45, boarding #38/#39, Phase 10 #40/#41, flags #46/#47, ledger #48/#49, empty-armable #50/#51, construction #52/#53, HTML #54/#55, economy #56/#57, or standing #58/#59? | **No.** GUIDED §6 **stay-locked.** |
| Thaleron facility, combat retune, Flash price locks, full faction roster, away-team XP table, Phase 4 `alertsActive` policy rewrite? | **Out.** `alertsActive` (raw `playerSecurity` vs `getEffectivePolicy`) is a **different** soft residual unless it is the same chrome; cite only as optional soft follow-up. |
| May we `git am` remastered patches or lock remastered constants? | **No.** `DOCK_CLEAR_LOCKED_FROM_REMASTERED === false`. |
| Must a later engine PR attach evidence? | **Yes.** Baseline + after screenshots **and** overflow JSON for every affected panel. This docs PR attaches **no** PNGs. |
| Is this a Referee Pass? | **No.** Referee / One / Number Four score the hard gates **before** any engine. Number Three probes only after a later S28 slice. |

These are recommendations for this UI-fit package, not new decisions attributed to the user. Locked bake-off constraints take precedence over older flavor that treated dock-overlap as EW math, treated a hidden operator panel as a dock-clear pass, or treated CSS clip as permission to hide labeled systems.

Cite Phase 9.2 gate 7 and the later “dockClear polish **out**” tips as the planning sources this brief **reconciles**, not as a second spec:

| Planning source | This brief |
| --- | --- |
| Phase 9.2 hard gate 7: dock-overlap UI polish; screenshot / no-clip; 1280×720 | Gate 1. Operator panel **already closed**. Residual is target / map / related chrome. |
| `--bm1-dock-clear` + S16.15 `snapshotDockFit` | Subscribe. Do not regress. Extend measurement to the **visible** box. |
| Phase 9.3+ / boarding / Phase 10 / flags / ledger / empty-armable / construction / HTML / economy / standing: dockClear polish **out** | This brief **is** that parked UI item. Those lanes stay locked. |
| Phase 10 S18.19 / map + knowledge chrome process lock | Gate 1 + gate 7. Knowledge readout already `knowledgeDockClear: true` in Phase 10 NOTES — preserve. Map still reports `dockClear: false`. |
| Standing GUIDED §6 / #58 / #59 | Gate 4. **Stay locked.** Money is not trust. Not a shop HUD. |
| Phase 4 soft `alertsActive` snapshot | Named out (gate 5) unless identical chrome. |
| Process: engine PRs attach screenshots when UI changes | Gate 7. |

## 2. Locked constraints (do not reopen)

The bake-off room locked these before this brief. Implementation and probes must treat **gates 1–7** as **hard gates**. Referee / One score this brief against those **seven** **before** any engine PR. Number Three probes only after a later S28 slice. EW / boarding / Phase 10 / flags / ledger / empty-armable / construction / HTML-catalog / economy-difficulty / standing-tiers gates stay **closed**; they are restated only as **gate 4** (preserve / do-not-open), not as a reopen. This docs PR **does not** claim a Referee Pass.

### Hard gate 1 — Fit only (same screenshot / no-clip gate)

> **UI text and controls must fit their designated boxes.** Target / map / related dock chrome: no clip or overflow of labeled systems or labeled controls. Measure with the **same screenshot / no-clip gate used since Phase 9**: viewport **1280×720**; `clippedControls: []`; no horizontal overflow of the designated box; the visible box’s bottom stays above `.bottom-dock` (`dockClear` / per-panel equivalent **true**). Contained `overflow-y: auto` inside a box that itself clears the dock is OK. An engine PR that “passes” by hiding `#top-left-panel`, by clipping EW / boarding / star-chart labels, or by renaming the metric without fitting the visible chrome **fails**.

Lane owner (wording): **Number Four**.

Landed S16.15 already scores the **operator panel**. This amend **subscribes** to that gate and **extends** it to the residual surfaces: `#target-window`, `.interstellar-map-frame` / canvas / Close, and related dock chrome that still reports false or overflow. Do not invent a second HUD. Do not cover campaign math with CSS that hides named discovered systems.

### Hard gate 2 — No gameplay rewrite

> Do **not** change fire gates, EW, boarding, markets, standing tiers, difficulty overlays, or catalog wire. Layout / CSS / honest overflow measurement only. A later slice that retunes `consultDoctrineFire`, `liveFireFactsFromEw`, `tractorIsBoarding`, `evaluateWiredPurchase`, `meetPackPurchaseDecision`, `PURCHASE_TIER_STANDING`, `resolveMagnitudes`, Phase 10 discovery writes, or `game_items.json` combat numbers **fails**, even if the panels are pretty.

Lane owner (wording): **Referee / One** on do-not-open; **Number Four** on the CSS-only half.

`styles.css` `--bm1-dock-clear` / panel insets / map clip vars and a thin measurement subscribe are in. `src/phase9-*.js`, `src/standing-tiers.js`, `src/economy-difficulty.js`, `src/ship-catalog-wire.js`, and boarding / Phase 10 gate logic stay **read-only**.

### Hard gate 3 — Never gift fire from UI polish

> Fitting a box, raising a panel, or attaching a screenshot must **never** gift `firingSolution`, culture fire, or `engagement_authorized`. A Target chrome tweak is not a lock. A map-label fit is not a discovery write and not a ceasefire. Two-mode ROE stays two-mode. Pursuit ≠ permission ≠ per-weapon gate.

Lane owner (wording): **Number 2**.

Same doctrine lean as Phase 9 fire gates, Phase 10 stories, flags credentials, the ledger, empty-armable, construction visuals, HTML catalogs, economy-difficulty knobs, and standing-tiers. If a later Target label wraps, it may only wrap — not `mayAutoEngage`.

### Hard gate 4 — Do not reopen landed lanes (standing §6 / #58–#59 stay locked)

> Do **not** reopen EW #33 / #35 / #37 / #42 / #43 / #44 / #45 (ghosts book-only; residue-before-void; soft numbers ≠ new fire rules; `MAGNITUDES_LOCKED_FROM_REMASTERED === false`). Do **not** reopen boarding #38 / #39 (`tractorIsBoarding()` stays false; capture XOR scuttle; away-team XP `not_tracked_yet`). Do **not** reopen Phase 10 #40 / #41 (stories stay knowledge layers; hidden wider Dominion stays hidden; no gifted FS from a map label). Do **not** reopen flags / passes #46 / #47 (Thaleron pass **unverified — not shipped**). Do **not** reopen ledger #48 / #49. Do **not** reopen empty-armable #50 / #51. Do **not** reopen construction #52 / #53. Do **not** reopen HTML catalogs #54 / #55. Do **not** reopen economy / difficulty #56 / #57. Do **not** reopen standing-tiers **#58 / #59**. **GUIDED §6 stay-locked** — money is not trust; home 20 / others Open 0; Independent / Concord is standing + vendor; price ≠ ban; single standing token. This brief is **not** a shop HUD and **not** a prestige-graph.

Lane owner (wording): **Referee / One**.

A writer who “finishes 9.2 gate 7 as EW work,” who retunes `PURCHASE_TIER_STANDING` “while the shop label wraps,” or who reveals Dominica because a label overflowed **fails**.

### Hard gate 5 — Named outs

> Do **not** invent a Thaleron **facility** (place, quest, pin, or pass). Do **not** retune combat weapons. Do **not** treat any Flash number as a live price lock. Do **not** ship a full faction roster. Do **not** invent an away-team XP table. Do **not** rewrite Phase 4 `alertsActive` policy (raw `playerSecurity` vs `getEffectivePolicy`) **unless** that copy lives on the **same** chrome this brief is fitting — and then only as a wrap / inset, **not** a policy change. Cite `alertsActive` as an **optional soft follow-up** if it is a different surface. Do **not** reopen Phase 8 clamps or catalog wire.

Lane owner (wording): **Referee / One**.

### Hard gate 6 — Blind bake-off

> Do **not** `git am` remastered patches. Do **not** crib `BM1-remastered-work` engine or DESIGN as the layout source. `DOCK_CLEAR_LOCKED_FROM_REMASTERED === false`. Implement later from bake-off `docs/dock-clear/` + landed `--bm1-dock-clear` / capture-script helpers only. Flipping any existing `*_LOCKED_FROM_REMASTERED` to true **fails**.

Lane owner (wording): **Referee / One**.

### Hard gate 7 — Later engine PR must attach evidence

> A later engine PR **must** include **baseline + after** screenshots **and** overflow JSON for every affected panel (target, map / star chart, and any related dock chrome that still reports false or overflow). Viewport 1280×720. Process lock continues from Phase 9 / 9.2 / Phase 10 NOTES. **This docs PR attaches no PNGs.** An engine PR that lands CSS without overflow JSON **fails** this brief.

Lane owner (wording): **Number Four** (process).

### Soft gate 8 — Suites stay green (after a later slice)

> **Soft:** existing suites stay green (S4–S27 / catalog / doctrine / boarding / Phase 10 / Phase 8 / Phase 9.4 / utility / weapon-ledger / empty-armable / construction / html-catalogs / economy-difficulty / standing-tiers / side-lane). Screenshot / no-clip is **N/A** on this docs PR. S16.15 operator-panel dock-clear stays green. A later S28 engine attaches the gate-7 shots; it does **not** reopen standing or EW math.

Lane owner (wording): **Number Four** (process); **Number Three** scores suite-green **after** a later slice that touches runtime — not this brief.

### Also from the room (score with the gates)

| Plan / room want | How this brief locks it |
| --- | --- |
| Fit only — target / map / related dock chrome | Gate 1. |
| Same screenshot / no-clip gate since Phase 9 | Gates 1 + 7. |
| No gameplay rewrite (fire / EW / boarding / markets / standing / difficulty / catalog) | Gate 2. |
| Never gift FS / culture / `engagement_authorized` from UI polish | Gate 3. |
| Do not reopen #33–#59; GUIDED §6 / standing #58–#59 stay-locked | Gate 4. |
| Named outs: Thaleron, combat retune, Flash locks, full roster, away-team XP, alertsActive policy | Gate 5. |
| Blind; `DOCK_CLEAR_LOCKED_FROM_REMASTERED === false` | Gate 6. |
| Later engine: baseline + after screenshots + overflow JSON | Gate 7. |
| Suites green; no Referee Pass from this PR | Soft gate 8. Scoring note below. |

### Must not break (cite landed work)

Score as **preservation**. A later dockClear Pass that regresses them is a Fail. **#33, #35, #37, #38, #39, #40, #41, #42, #43, #44, #45, #46, #47, #48, #49, #50, #51, #52, #53, #54, #55, #56, #57, #58, and #59 stay locked.**

| Locked rule | Cite | This brief / later slice must not |
| --- | --- | --- |
| Operator-panel dock-clear at 1280×720 | Phase 9.2 gate 7; S16.15; `--bm1-dock-clear: 88px` | Regress OPS / Inventory / Settings `dockClear` or put Close / last EW rows under the dock. |
| `clippedControls: []` | Phase 9+ capture scripts | Leave a labeled control under the dock. |
| Ghosts book-only; residue-before-void; no gifted FS | EW #33 / #35 / #37 / #42 / #43 / #44 / #45 | Treat dock-overlap as EW math. Add a family to “make the panel shorter.” |
| Tractor ≠ boarding; XP `not_tracked_yet` | #38 / #39 | Hide Board / Capture / Scuttle by deleting the predicates. |
| Stories = knowledge layers; hidden Dominion stays hidden | #40 / #41 | Reveal Dominica / Gamma to “fit” a label. Gift FS from a rumor row. |
| Standing gates; home 20 / Open 0 | GUIDED §6; #58 / #59 | Retune `PURCHASE_TIER_STANDING` or home 20 as layout. |
| Economy pacing ≠ ownership | #56 / #57 | Easy / Hard as a CSS excuse. |
| Flash prices source, not locks | Ledger #48/#49; HTML #54/#55 | Live price lock from a wrap. |
| Thaleron unverified — not shipped | #46 / #47 | Invent a facility pin on the map. |
| `*_LOCKED_FROM_REMASTERED === false` | #44–#59 | Flip any remastered-lock true. |

### Process locks (not a change to gates 1–7)

- **Proposal first.** Do not implement a layout slice from this text until Tenth scopes S28 after a brief Pass.
- **Blind bake-off.** Implement against bake-off `main` (`52e36d9` after #59), **not** remastered. From `docs/dock-clear/` + landed CSS / capture helpers only. Do **not** crib `Artemis2028/BM1-remastered-work`.
- **#33 / #35 / #37 / #38 / #39 / #40 / #41 / #42 / #43 / #44 / #45 / #46 / #47 / #48 / #49 / #50 / #51 / #52 / #53 / #54 / #55 / #56 / #57 / #58 / #59 stay locked.** GUIDED §6 stay-locked.
- **Subscribe, do not fork.** A later slice extends `snapshotDockFit` / capture overflow JSON. It does not become a second sensor religion or a second star chart.
- **No Pass claimed** in `docs/BAKEOFF-STATUS.md` from this PR.

### Scoring note

Referee / One / Number Four score the **seven hard gates** **before** any engine PR. Number 2 scores gate **3**. Number Three probes **only after** a later S28 slice. **No Referee Pass is claimed by this docs PR.** Room scores the brief before any engine.

## 3. What the overflow JSON already shows (do not reinvent)

**Lane owner (wording):** Number Four.

These are **in-repo** capture facts at the process viewport (1280×720). Line numbers may drift; the files remain the evidence.

| Surface | Evidence | Residual |
| --- | --- | --- |
| OPS / Inventory / Settings | `docs/phase9/screenshots/phase92/NOTES.md`; Phase 10 `05-ops` / `06-inventory` / `07-settings` | **Already green.** `dockClear: true`. `clippedControls: []`. Preserve. |
| Target (9.2 compact) | `docs/phase9/screenshots/phase92/05-target-overflow.json` | `#target-window` `bottom: 702` vs dock `top: 648`. Operator panel hidden. Reported `dockClear: false`. `clippedControls: []` (no button under dock). |
| Target (Phase 10 / boarding chrome) | `docs/phase10/screenshots/phase10/NOTES.md` Target block; `08-target-overflow.json` | Operator-panel `dockClear: false` (panel hidden). Separate `targetDockClear` may already be true when the box sits at `bottom: 624`. **Honest per-panel metric required.** Do not delete Board / Hail to shorten the box. |
| Star chart / map | `docs/phase10/screenshots/phase10/02-starchart-overflow.json`; `04-starchart-discovered-overflow.json` | `mapOpen: true`. Operator panel hidden → reported `dockClear: false`. `targetDockClear: false` (target hidden). `leakedNames: []` (preserve Phase 10). Labeled **discovered** systems must remain inside the designated chart box. |
| Knowledge readout | Phase 10 NOTES `knowledgeDockClear: true` | **Already green** as a sibling metric. Preserve. Not a Phase 10 reopen. |
| Bottom dock | Same JSON `dock` boxes: `top: 648`, `left: 447–833` at 1280×720 | Related chrome. Hover-expand labels must not overflow the viewport or cover a designated panel’s last control. |

`snapshotDockFit()` in `src/main.js` today sets `dockClear` from **`#top-left-panel` vs `.bottom-dock` only**. That is why target / map shots report false when the operator panel is hidden. Phase 10 capture already added `targetDockClear` / `knowledgeDockClear` / `mapOpen`. A later S28 **subscribes** to that family and scores the visible box. It does **not** declare victory by deleting the operator-panel check.

## 4. What already exists — subscribe, do not reinvent

**Lane owner (wording):** Number Four.

| Already live | Dock-clear uses it as |
| --- | --- |
| `--bm1-dock-clear: 88px` | The landed inset token. Operator panel max-height already consumes it. Target CSS already sets `bottom: calc(var(--bm1-dock-clear) + 8px)`. **Subscribe.** Do not invent a second token religion unless the residual proves 88px is not enough for the visible box — and then keep it one token. |
| `.top-left-panel` max-height / contained scroll | Green. Preserve S16.15. |
| `#target-window` | Residual surface. Fit text / Hail / Board / Capture / Scuttle in the box. Do not change boarding predicates. |
| `.interstellar-map-frame` / canvas clip-path / Close vars | Residual surface. `syncInterstellarMapFrame()` already writes `--map-panel-clip-*` and Close position. Fit labeled systems inside the chart box. Do not change Phase 10 discovery. |
| `.bottom-dock` | Related chrome. Stay `z-index` below operator panel (71) and map frame (75). Do not steal EW / Target clicks by raising it over labeled controls. |
| `snapshotDockFit` / capture `*overflow.json` | Measurement subscribe. Extend; do not scrap S16.15. |
| Phase 10 `targetDockClear` / `knowledgeDockClear` / `leakedNames` | Sibling metrics. Keep `leakedNames: []` at Blender start. |

Operator-panel green does **not** mean target / map are done. Hidden-panel `dockClear: false` does **not** by itself prove the target box is under the dock — measure the visible box.

## 5. Acceptance exercises (S28 sketch)

Keep Phase 1 / S4–S27 / doctrine / catalog / boarding / Phase 10 / Phase 8 / Phase 9.4 / utility / weapon-ledger / empty-armable / construction / html-catalogs / economy-difficulty / standing-tiers / side-lane green. **S16.15 stays operator-panel dock-clear.** **S18 stays Phase 10.** **S27 stays standing-tiers.** Add **S28** only **after** Tenth scopes a later thin layout slice. IDs are a sketch; do not promise a final count. **This docs PR does not add S28 to the probe and does not add engine.**

Number Three owns the probe gate **after** a later slice, not this brief.

| Case | Required exercise and result (later S28 only) |
| --- | --- |
| **S28.1** Operator panel preserved | Replay S16.15: OPS / Inventory / Settings at 1280×720 still `dockClear: true`, `clippedControls: []`, no horizontal overflow. Close / last EW rows stay above the dock (contained scroll OK). |
| **S28.2** Target fit | Target open, operator panel hidden: visible `#target-window` clears the dock (`targetDockClear === true` or equivalent). `clippedControls: []`. Hail / Board / Capture / Scuttle (when shown) stay inside the box. `tractorIsBoarding() === false`. No new fire fact. |
| **S28.3** Map / star-chart fit | Map open at 1280×720: designated chart box + Close clear the dock; labeled **discovered** systems stay inside the chart box (no clip / overflow of those labels). Hidden Phase 10 names stay hidden (`leakedNames: []` at Blender start). Do not “fit” by revealing Dominica. |
| **S28.4** Related dock chrome | `.bottom-dock` labels / hover-expand do not overflow the viewport or cover a designated panel’s last control. Knowledge readout stays `knowledgeDockClear: true` if scored. |
| **S28.5** No gameplay / no gifted fire | After the layout slice: no `firingSolution` gift; no `engagement_authorized`; no culture fire; two-mode ROE unchanged; standing table unchanged; `STANDING_TIERS_LOCKED_FROM_REMASTERED === false`. |
| **S28.6** Landed lanes preserved | Replay S14–S27 / S17 / S18 / S11 / S13 / S26. Diff does **not** reopen EW / boarding / Phase 10 / flags / ledger / empty-armable / construction / HTML / economy / standing #58/#59. No Thaleron-facility / combat-retune / Flash-lock / full-roster / away-team-XP / `alertsActive` policy / `git am` work. |
| **S28.7** Blind lock false | `DOCK_CLEAR_LOCKED_FROM_REMASTERED === false`. No `git am`. Existing remastered-locks stay false. |
| **S28.8** Evidence attached | Engine PR attaches baseline + after PNGs **and** overflow JSON for target, map, and any other affected panel. Docs-only brief: **N/A**. |

Do not claim a Referee Pass from this list.

## 6. Non-goals

This brief will not:

- Implement engine code or attach UI screenshots on **this** PR.
- Reopen Phase 9.2 as EW work, or regress S16.15.
- Change fire gates, EW contest, boarding predicates, markets, standing tiers, difficulty overlays, or catalog wire.
- Gift `firingSolution`, culture fire, or `engagement_authorized`.
- Reveal hidden Phase 10 systems to shorten a label.
- Reopen EW PRs #33 / #35 / #37 / #42 / #43 / #44 / #45, boarding #38 / #39, Phase 10 #40 / #41, flags #46 / #47, ledger #48 / #49, empty-armable #50 / #51, construction #52 / #53, HTML catalogs #54 / #55, economy #56 / #57, or standing #58 / #59.
- Reopen GUIDED §6 (money ≠ trust; home 20 / Open 0; Independent / Concord = standing + vendor).
- Invent Thaleron Test Facility (place, quest, pin, or pass).
- Retune combat weapons or treat any Flash number as a live price lock.
- Ship a full faction roster or an away-team XP table.
- Rewrite Phase 4 `alertsActive` policy (unless identical chrome, wrap only — default **out**).
- `git am` remastered patches, or treat remastered DESIGN as engine source.
- Claim a Referee Pass in `docs/BAKEOFF-STATUS.md`.

## 7. Open questions

Mark these clearly. They do **not** weaken the hard gates.

| ID | Question | Default if a later S28 slice is scoped before an answer |
| --- | --- | --- |
| Q1 | Keep one `--bm1-dock-clear` token, or add per-panel tokens? | **One token** unless a named panel cannot clear the dock without it. Do not invent a token per tab. |
| Q2 | Must `dockClear` stay the operator-panel field, with `targetDockClear` / `mapDockClear` beside it? | **Yes.** Do not collapse metrics so a hidden operator panel auto-passes. Score the visible box. |
| Q3 | Is Phase 10 knowledge readout in scope? | **Only if** a later capture still reports overflow / not-clear. Current NOTES: `knowledgeDockClear: true`. Preserve. Not a Phase 10 reopen. |
| Q4 | May S28 change boarding / Target copy to shorten the box? | **Wrap / inset only.** Do not change hull-threshold, XOR, or XP `not_tracked_yet`. |
| Q5 | May S28 change map discovery or pin new systems? | **No.** Fit labels of systems the player already earned. |
| Q6 | Split engine PRs (measurement vs CSS)? | Tenth decides after Pass. Gates stay separable. Evidence (gate 7) is required on whichever PR first claims the residual closed. |
| Q7 | Phase 4 `alertsActive` policy (raw `playerSecurity` vs `getEffectivePolicy`)? | **Out** unless that string is the same chrome. Optional soft follow-up. Not a Settings reopen. |
| Q8 | Mobile / &lt;1280 viewports? | **Process viewport is 1280×720.** Narrower is best-effort; do not fail S28 on a viewport the gate does not score. |

## 8. Implementation sequence and handoff

1. **Brief Pass.** Referee / One score the **seven hard gates**. Number 2 scores gate **3** (no gifted fire). Number Four scores gates **1, 2, 7** (fit; no gameplay; evidence) and the engine half of **4**, plus soft gate **8** as process. Do not open an S28 PR on this document alone.
2. **Tenth scopes** a later thin layout slice **or** leaves this as docs-only. Blind implement from `docs/dock-clear/` against bake-off `main` after #59 (`52e36d9`).
3. **Suggested order if scoped:** remastered-lock false (S28.7) → preserve operator-panel S16.15 (S28.1) → honest visible-box measurement → Target fit without boarding rewrite (S28.2) → map / labeled-systems fit without Phase 10 reopen (S28.3) → related dock chrome (S28.4) → no fire gift (S28.5) → preservation replay (S28.6) → attach baseline + after + overflow JSON (S28.8). **Do not** reopen #33–#59. **Do not** reopen GUIDED §6.
4. **Number Three** adds/runs S28 after the later slice. Keep S16.15 / S18 / S27 green. Do not weaken S16.15 to make a hidden-panel shot pass.
5. Changelog / status Pass wait on Referee after review. This proposal PR may note that the brief is open; it must **not** write a Pass.

## 9. Lanes

| Who | Owns | Scores |
| --- | --- | --- |
| **Number Four** | Later slice: gates **1, 2, 7** — fit; CSS / measurement only; baseline + after + overflow JSON | Visible boxes clear the dock; S16.15 still green |
| **Number 2** | Doctrine: gate **3** — UI polish is not FS / culture / `engagement_authorized` | Target wrap ≠ lock; map label ≠ discovery / fire |
| **Number Three** | Probe gate **after** a later S28 slice (S28; S4–S27 / S16.15 / S18 / S27 stay green) | Not this brief |
| **Referee / One** | This brief vs the **seven hard gates** in §2. Gates **4–6** (do-not-reopen including standing §6 / #58–#59 + named outs + blind). **Do-not-open** check: no #33–#59 reopen; no Thaleron facility / combat retune / Flash locks / full roster / away-team XP / `alertsActive` policy; no `git am`; **no Referee Pass claimed** from this PR | **Before** any engine PR |

This brief is ready to score when a reader can mark Pass/Fail on: target / map / related chrome fit the designated boxes under the Phase 9 no-clip gate; no gameplay rewrite; UI polish never gifts fire; landed EW / boarding / Phase 10 / flags / ledger / empty-armable / construction / HTML / economy / standing not reopened; remastered-lock false; later engine evidence required.

## Sources and precedence

- This brief’s later-slice checklist: `docs/dock-clear/BM1-DOCK-CLEAR-ENGINE-DEPENDENCIES.md`.
- Phase 9.2 dock-overlap (operator panel closed; residual parked): `docs/phase9/BM1-PHASE9.2-EW-DEPTH-PROPOSAL.md` gate 7; `docs/phase9/screenshots/phase92/NOTES.md`; S16.15.
- Capture / overflow evidence: `docs/phase9/screenshots/phase92/05-target-overflow.json`; `docs/phase10/screenshots/phase10/NOTES.md`; `docs/phase10/screenshots/phase10/02-starchart-overflow.json`; `08-target-overflow.json`.
- Landed CSS / measurement: `styles.css` `--bm1-dock-clear`; `src/main.js` `snapshotDockFit` / `syncInterstellarMapFrame`.
- Standing (stay locked): `docs/standing-tiers/`; GUIDED §6; PRs **#58 / #59**; S27.
- Economy / difficulty (stay locked): `docs/economy-difficulty/`; PRs **#56 / #57**; S26.
- Phase 10 (stay locked): `docs/phase10/`; PRs **#40 / #41**; S18.
- Boarding (stay locked): `docs/boarding/`; PRs **#38 / #39**; S17.
- EW locked: `docs/phase9/`; PRs **#33 / #35 / #37 / #42 / #43 / #44 / #45**; S14–S20.
- Flags / ledger / empty-armable / construction / HTML: PRs **#46–#55**.
- Phase 4 soft `alertsActive`: `docs/BAKEOFF-STATUS.md` post-merge note — **out** unless identical chrome.
- Remastered engine / DESIGN: **out of bounds.** Not a patch source. Not a constant lock.
- Bake-off process: `docs/BAKEOFF-STATUS.md` (this PR may note the dock-clear brief is open; **no Pass claimed**; #33–#59 remain locked; GUIDED §6 stay-locked).

Settled Phase 1–10 behavior, Phase 9.2 operator-panel dock-clear, standing #58 / #59, PR #33 / #35 / #37 / #38 / #39 / #40 / #41 / #42 / #43 / #44 / #45 / #46 / #47 / #48 / #49 / #50 / #51 / #52 / #53 / #54 / #55 / #56 / #57, and these seven hard gates take precedence over older handoff text that treated dock-overlap as EW math, treated a hidden operator panel as a pass, or treated CSS clip as permission to hide labeled systems.
