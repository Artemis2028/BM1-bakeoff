# BM1 dockClear / UI fit polish: later-slice dependencies

**Reviewed document:** `BM1-DOCK-CLEAR-UI-FIT-PROPOSAL.md`  
**Reviewed against:** `Artemis2028/BM1-bakeoff` at `52e36d9` on `main` (21 September 2026), after standing-tiers engine (PR #59). Line numbers below refer to this head and may drift.  
**Method:** read landed `--bm1-dock-clear` / `.top-left-panel` / `#target-window` / `.interstellar-map-*` / `.bottom-dock` CSS, `snapshotDockFit` / `syncInterstellarMapFrame`, Phase 9.2+ overflow JSON (target `dockClear: false`; map-open operator panel hidden), Phase 10 `targetDockClear` / `knowledgeDockClear` / `leakedNames`, and the later tips that left dockClear polish **out**. No engine changes made. This is a dependency/risk checklist for a **later** writer **if** Tenth scopes a thin layout slice — not a post-implementation review and not permission to implement before Tenth scopes the lane. **Keep #33, #35, #37, #38, #39, #40, #41, #42, #43, #44, #45, #46, #47, #48, #49, #50, #51, #52, #53, #54, #55, #56, #57, #58, and #59 locked.** **GUIDED §6 stay-locked.** Do not reopen EW, boarding, Phase 10, flags/passes, the weapon ledger, empty-armable, construction visuals, HTML catalogs, economy / difficulty, or standing tiers. Do not retune combat. Do not invent a Thaleron facility. Do not rewrite `alertsActive` policy. Do not `git am` remastered patches.

## Verdict in one paragraph

DockClear / UI-fit polish can stay **docs-only** on this PR. **This PR ships proposal + deps only.** Phase 9.2 already closed the **centered operator panel** (`dockClear: true` at 1280×720; S16.15). The parked residual is **target / map / related dock chrome** still reporting `dockClear: false` or overflow — partly a **measurement** gap (`snapshotDockFit` scores `#top-left-panel` vs dock only, so hidden-panel shots are false) and partly **box fit** (9.2 compact target `bottom: 702` vs dock `top: 648`; map-open shots have no `mapDockClear`). If Tenth later scopes a thin slice, prefer **CSS + honest overflow subscribe** over a new gameplay module: keep `--bm1-dock-clear`, fit `#target-window` and star-chart chrome, extend measurement to the **visible** box, attach baseline + after screenshots + overflow JSON. Do **not** touch `src/standing-tiers.js`, EW contest, boarding predicates, Phase 10 discovery, or `game_items.json`. `DOCK_CLEAR_LOCKED_FROM_REMASTERED === false`. The load-bearing risks are all honesty / identity mistakes: clipping labeled systems to fake clearance; deleting Board / Hail to shorten Target; revealing Dominica to fit a label; gifting `firingSolution` from a wrap; treating a hidden operator panel as a pass; `git am` remastered; reopening #33–#59.

## Natural later deliverable (say this clearly)

A thin **layout slice** that fits the parked residual and tells the truth in overflow JSON is the natural S28 deliverable. Combat / standing / EW / boarding / Phase 10 discovery stay untouched.

| S28 is | S28 is not |
| --- | --- |
| Fit target / map / related dock chrome at 1280×720 | A gameplay rewrite or a new HUD religion |
| Honest visible-box metrics (`targetDockClear` / `mapDockClear` beside operator `dockClear`) | A hidden-`#top-left-panel` auto-pass |
| Subscribe to `--bm1-dock-clear` + `snapshotDockFit` + capture scripts | A second `--dock-clear` religion per tab |
| Baseline + after PNGs + overflow JSON | A docs-only screenshot dump on this PR |
| `DOCK_CLEAR_LOCKED_FROM_REMASTERED === false` | A remastered `git am` or locked remastered layout |

An in-game prestige HUD, Thaleron pin, or `alertsActive` policy rewrite, if ever wanted, is a **different** Tenth-scoped lane.

## What already exists (do not reinvent)

| Need | Engine / docs fact at `52e36d9` |
| --- | --- |
| Inset token | `styles.css` `--bm1-dock-clear: 88px` (~74). Operator panel max-height `min(680px, calc(100vh - 48px - var(--bm1-dock-clear) - 40px))` (~1114 / ~1153). |
| Operator panel **green** | `.top-left-panel` centered, `z-index: 71`, contained scroll. S16.15: `clippedControls: []`, `dockClear: true`. Phase 9.2 / Phase 10 OPS / Inventory / Settings overflow JSON agree. |
| Target box | `#target-window` / `.target-window`: `position: fixed; left: 18px; bottom: calc(var(--bm1-dock-clear) + 8px); max-height: min(420px, calc(100vh - 70px - var(--bm1-dock-clear))); z-index: 28` (~821–827). 9.2 compact capture still shows `bottom: 702` (pre-inset or content taller than the inset). Phase 10 boarding-tall capture can sit at `bottom: 624` with `targetDockClear: true` while operator `dockClear` stays false. |
| Map chrome | `.interstellar-map-frame` `inset: 0; z-index: 75` (~774). Canvas `inset: 0; z-index: 74` with `clip-path` from `--map-panel-clip-*` (~781–795). Close: `--map-close-top` / `--map-close-left` (~803). `syncInterstellarMapFrame()` (`src/main.js` ~14500) writes those vars from `getStarChartPanelRect()`. Body class `map-open`. |
| Dock | `.bottom-dock`: `position: fixed; bottom: 14px; z-index: 30` (~4254). At 1280×720 capture: `top: 648`, `left: 447–833`. Hover expands button `max-width: 150px`. |
| Measurement | `snapshotDockFit()` (`src/main.js` ~26602): `dockClear` = visible `#top-left-panel`.bottom ≤ dock.top + 1. Checks operator + target **buttons** for `clippedControls`. **No map chrome.** Phase 10 `scripts/capture-phase10-screens.mjs` adds `targetDockClear`, `knowledgeDockClear`, `mapOpen`, `leakedNames`. |
| Knowledge | `.phase10-readout` already uses `--bm1-dock-clear` max-height (~842). Phase 10 NOTES: `knowledgeDockClear: true`. |
| Probe | `__BM1_PROBE__.phase92.snapshotDockFit`. S16.15. First S28 adds `.dockClear` (name can change) only if Tenth scopes the slice. |
| Standing / other locks | `STANDING_TIERS_LOCKED_FROM_REMASTERED` and sibling remastered-locks all **false**. `#58 / #59 stay locked.** |
| Soft leftover (out) | Phase 4 `snapshot().alertsActive` still raw `playerSecurity` vs `getEffectivePolicy`. **Not** this slice unless identical chrome. |

**Gap this brief closes (docs now; CSS / measurement only if scoped):** there is no **scoreable S28 contract** that target / map / related chrome must fit under the Phase 9 no-clip gate, that measurement scores the **visible** box, and that later tips’ “dockClear polish out” is a **parked UI item** rather than permission to reopen EW or standing.

## Hooks the writer will have to touch

**This PR touches none of these.** If Tenth later scopes a thin layout slice:

Prefer **CSS + measurement subscribe** rather than growing `src/phase92-*.js` or `src/standing-tiers.js`:

| Proposed file | Responsibility |
| --- | --- |
| `styles.css` | Fit `#target-window`, map Close / chart box, and related dock chrome against `--bm1-dock-clear`. Do **not** clip labeled discovered systems. Do **not** regress operator-panel max-height. |
| Optional `src/dock-clear.js` (name can change) | `DOCK_CLEAR_LOCKED_FROM_REMASTERED === false`; helpers that snapshot visible-box clearance (operator / target / map). **No** fire write. **No** standing write. |
| `src/main.js` | Thin: extend `snapshotDockFit` (or sibling) with `targetDockClear` / `mapDockClear`; keep S16.15 operator `dockClear`. `syncInterstellarMapFrame` clip vars **layout only** — do not change discovery. `__BM1_PROBE__.dockClear` (name can change). |
| `scripts/capture-*-screens.mjs` / later `scripts/capture-dock-clear-screens.mjs` | Baseline + after + overflow JSON for affected panels. |
| Optional `scripts/test-dock-clear.mjs` | Offline: lock flag false; CSS token present; snapshot shape. **Not** a rewrite of S16 / S18 / S27. |

Do **not** implement this by rewriting `src/phase9-*.js` contest / ghosts, `src/boarding-*.js` predicates, `src/phase10-*.js` discovery, `src/standing-tiers.js`, `src/economy-difficulty.js`, `src/ship-catalog-wire.js`, `src/phase8-markets.js`, `src/weapon-source-ledger.js`, `src/construction-visuals.js`, `src/empty-armable.js`, `src/utility-inventory.js`, or HTML catalog generators. Do **not** `git am` remastered patches. Do **not** retune `game_items.json`. Do **not** edit `docs/html-catalogs/*.html`.

| Existing path | Required integration (later S28) |
| --- | --- |
| `--bm1-dock-clear` / `.top-left-panel` | **Preserve.** Fail if S16.15 flips false. |
| `.target-window` | **Fit.** Fail if Hail / Board / Capture / Scuttle sit under the dock or overflow X. Fail if predicates change. |
| `syncInterstellarMapFrame` / `--map-panel-clip-*` / Close vars | **Layout only.** Fail if clip hides a **discovered** labeled system. Fail if a hidden Phase 10 name leaks (`leakedNames`). |
| `.bottom-dock` | Related chrome. Fail if hover-expand covers the last labeled control of a designated box. |
| `snapshotDockFit` | **Subscribe / extend.** Fail if operator `dockClear` is dropped. Fail if hidden panel auto-passes target / map. |
| Phase 10 capture extras | Keep `leakedNames`, `mapOpen`. Add / honor `mapDockClear`. |
| `consultDoctrineFire` / `liveFireFactsFromEw` / Phase 2 ROE | Untouched. Fail if a CSS pass writes `firingSolution` or `engagement_authorized`. |
| `tractorIsBoarding` | Stays false. |
| `__BM1_PROBE__.phase92` / `.phase10` / `.standingTiers` | **Keep.** Add `.dockClear` snapshot: lock false, per-panel clearance, clippedControls, fire flags false. |
| `src/standing-tiers.js` / GUIDED §6 | **Untouched.** Fail if S28 edits standing thresholds or shop allow. |
| HTML catalogs / `game_items.json` | **Untouched.** |

## Risks

### 1. Hidden-panel auto-pass / metric rename without fit (gate 1)

`if (!panel.visible) dockClear = true`, or dropping operator `dockClear` so S16.15 no longer holds, fails honest measurement. Clipping star-chart labels or `overflow: hidden` on `#target-window` so Hail is unreachable fails fit.

**Gate:** S28.1 / S28.2 / S28.3.

### 2. Gameplay rewrite disguised as CSS (gate 2)

Deleting Board / Capture because the box is tall, changing hull-threshold copy into a new predicate, or moving map discovery into `syncInterstellarMapFrame` fails no-gameplay.

**Gate:** S28.2 / S28.5 / S28.6.

### 3. UI polish gifts fire or discovery (gates 3–4)

A handler that sets `engagement_authorized` / `firingSolution` because Target is “locked” in chrome, or that writes a Dominion discovery because a label overflowed, fails the knowledge-layer lean and Phase 10.

**Gate:** S28.3 / S28.5.

### 4. Standing / EW / alertsActive reopen (gates 4–5)

Wrapping a shop-refusal string by retuning `PURCHASE_TIER_STANDING`, “finishing 9.2” inside `phase91-contest.js`, inventing a Thaleron pin, or rewriting `alertsActive` to `getEffectivePolicy` as part of this slice fails do-not-reopen / named outs.

**Gate:** S28.6.

### 5. Remastered crib / skipped evidence (gates 6–7)

`git am` remastered HUD CSS, flipping `DOCK_CLEAR_LOCKED_FROM_REMASTERED` true, or landing CSS without baseline + after + overflow JSON fails even if a maintainer eyeballs one screenshot.

**Gate:** S28.7 / S28.8.

## Probe plan (S28)

**Not in this docs PR.** Add `__BM1_PROBE__.dockClear` + optional `scripts/test-dock-clear.mjs` **only after** Tenth scopes the slice. **Replay S16.15 + S18 + S27 + S14–S26.** Do not break existing injectors.

**Minimum later-slice contract:**

```js
__BM1_PROBE__.dockClear = {
  snapshot: () => ({
    lockedFromRemastered: false,
    viewport: { w: 1280, h: 720 },
    clippedControls: [],
    overflowX: false,
    operator: { dockClear: true },   // S16.15 preserved when that panel is open
    target: { dockClear: true },     // when Target is the visible box
    map: { dockClear: true, leakedNames: [] }, // when map is open
    fire: { firingSolutionPresent: false, engagementAuthorizedPresent: false },
  }),
  snapshotDockFit: () => { /* fail setup if helper missing; must not drop operator check */ },
};
```

Suggested first check set:

1. **S28.1 / S28.7:** operator panel still green; remastered-lock false.
2. **S28.2 / S28.3 / S28.4:** target / map / dock chrome fit; no leaked hidden names.
3. **S28.5 / S28.6:** no fire gift; preservation replay (S16.15 / S18 / S27 green; standing / EW / boarding / Phase 10 untouched).
4. **S28.8:** overflow JSON + PNGs attached on the engine PR.

## Recommended implementation order (later S28 only)

1. Add `DOCK_CLEAR_LOCKED_FROM_REMASTERED === false` and a snapshot of per-panel clearance (S28.7).
2. Replay S16.15 unchanged (S28.1).
3. Extend `snapshotDockFit` / Phase 10 capture extras so the **visible** box is scored (target / map). Do not auto-pass hidden operator panel.
4. CSS: `#target-window` clears dock; Hail / Board / Capture / Scuttle remain reachable (S28.2).
5. CSS / clip vars: map Close + labeled discovered systems inside the chart box (S28.3).
6. Related dock hover / knowledge preserve (S28.4).
7. Assert no fire / standing / discovery writes (S28.5 / S28.6).
8. Capture baseline + after + overflow JSON (S28.8).

Skip invented utilities, `git am`, `game_items.json` combat retune, Phase 8 / standing / EW / boarding / Phase 10 hook rewrites, HTML catalog edits, and `alertsActive` policy entirely.

## Out of scope for the writer of a later slice

Engine work **before** a brief Pass; screenshots on **this** docs PR; gameplay rewrite; standing #58 / #59 reopen (GUIDED §6); EW #33–#45 reopen; boarding #38 / #39 reopen; Phase 10 discovery / roster; flags Thaleron-shipped; ledger / empty-armable / construction / HTML / economy reopen; `game_items.json` combat retune; Flash price locks; inventing an away-team XP table; Phase 4 `alertsActive` policy rewrite; `BM1-remastered-work` as source; `git am` remastered patches; claiming a Referee Pass; gifted FS / `engagement_authorized` from a wrap; wiping delivered reports; flipping `tractorIsBoarding`; rewriting `meetPackPurchaseDecision`; moving Phase 5 `deadlineAt`; a sixth power consumer.

## Sources

- Proposal: `docs/dock-clear/BM1-DOCK-CLEAR-UI-FIT-PROPOSAL.md`
- Phase 9.2 gate 7 / S16.15: `docs/phase9/BM1-PHASE9.2-EW-DEPTH-PROPOSAL.md`; `docs/phase9/screenshots/phase92/NOTES.md`; `src/main.js` `snapshotDockFit`
- Overflow evidence: `docs/phase9/screenshots/phase92/05-target-overflow.json`; `docs/phase10/screenshots/phase10/NOTES.md`; `docs/phase10/screenshots/phase10/02-starchart-overflow.json`; `08-target-overflow.json`
- CSS / map sync: `styles.css`; `src/main.js` `syncInterstellarMapFrame`
- Standing (stay locked): `docs/standing-tiers/`; GUIDED §6; PRs #58 / #59; S27
- Economy / difficulty (stay locked): `docs/economy-difficulty/`; PRs #56 / #57; S26
- Phase 10 (stay locked): `docs/phase10/`; PRs #40 / #41; S18
- Boarding: `docs/boarding/`; PRs #38 / #39; S17
- EW locked: `docs/phase9/`; PRs #33 / #35 / #37 / #42 / #43 / #44 / #45; S14–S20
- Flags / ledger / empty-armable / construction / HTML: PRs #46–#55
- Companion shape: `docs/standing-tiers/BM1-STANDING-TIERS-ENGINE-DEPENDENCIES.md`
