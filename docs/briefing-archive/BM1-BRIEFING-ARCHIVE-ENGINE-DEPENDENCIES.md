# BM1 captains briefing / jump-intel archive: later-slice dependencies

**Reviewed document:** `BM1-BRIEFING-ARCHIVE-PROPOSAL.md`  
**Reviewed against:** `Artemis2028/BM1-bakeoff` at `557200fac56556242691a7072763a7a876697253` on `main` (25 September 2026), after S32 Bajoran Solar Sailor engine PR #71. Line numbers below refer to this head and may drift.  
**Method:** read the player contact book, incident observer copies, Phase 5 assignment knowledge, EW ghost / RSS true-side / spoof-catch flags, Dominion knowledge + discovery hide, and the three-slot save path. No engine changes made. This is a dependency/risk checklist for a **later** writer **if** Tenth scopes a thin subscribe module — not a post-implementation review and not permission to implement before Tenth scopes the lane. **Keep #33–#71 locked.** Do not reopen EW, boarding, Dominion-first, the roster catalog, flags/passes, the weapon ledger, empty-armable, construction visuals, HTML catalogs, economy / difficulty, standing tiers, dockClear, hygiene, alertsActive, away-team XP, or the sailor catalog. Do not amend S18.18. Do not rewrite two-mode ROE. Do not `git am` remastered patches. Do not invent remastered briefing ids or costs.

## Verdict in one paragraph

The archive can stay **docs-only** on this PR. **This PR ships proposal + deps only.** If Tenth later scopes a thin slice, prefer a **sibling book** (`src/briefing-archive.js`, name can change) that **reads** observer `player` and **writes only** `state.briefingArchive`. Produce on a completed warp/wormhole arrival, after the contact book has settled, once. File at most **24** briefings and **12** lines each. Evict the oldest unselected row. Same `dedupeKey` refreshes one row. Old saves with no key restore empty. `SAVE_SLOT_COUNT` stays 3. Ghosts and unexposed spoofs stay as the player perceives them (stored RSS / true-side label, never a silent correction). Produce does not grant fire, change ROE, set `engagement_authorized`, change standing, permit pursuit, pay credits, flip `rosterPlayable`, or reveal a hidden Dominion system. `BRIEFING_ARCHIVE_LOCKED_FROM_REMASTERED === false`. The later engine PR **must not merge** without baseline and after screenshots of the briefing view and the archive view, plus a no-clip check. The load-bearing risks are all knowledge leaks and authority leaks: omniscient lines, corrected spoofs, a third ROE, a credit or roster gift, an unbounded book, a fourth save slot, a thrown load of a pre-archive save, a panel that clips its text, a remastered crib, or a reopen of #33–#71.

## Natural later deliverable (say this clearly)

A thin **subscribe module** that publishes proposal §3 (produce, select, folders, order, dedupe, cap, eviction, save) is the natural **S33** deliverable. Contact layers, incident ledger, objective board, EW books, Dominion discovery, ROE, standing, credits, and `rosterPlayable` stay untouched.

| S33 is | S33 is not |
| --- | --- |
| Sibling archive outside `systemStates` | A second contact book, ledger, or discovery map |
| Snapshot of observer `player` at arrival | An omniscient sitrep or a fresh scan |
| Ghost copy and unexposed claim left as perceived | A silent correction to true hull or true side |
| Stored RSS label `own` / `friendly` / `mixed` / `unlabeled` when already stored | A label built from `spoofedFaction` |
| Cap 24, line cap 12, oldest-unselected eviction | An unbounded journal |
| `restore(undefined)` → empty book; three existing slots | A fourth slot or a throw on old saves |
| `grantsFire: false` and the other write flags false | Fire, ROE, standing, pursuit, credits, `rosterPlayable`, discovery |
| UI host + select + body that fit at 1280×720 | A dockClear reopen |
| `BRIEFING_ARCHIVE_LOCKED_FROM_REMASTERED === false` | A remastered `git am` |
| Replay `test:phase10` (S18.18 unchanged) + doctrine + S32 | A Phase 10 or sailor hard-gate reopen |

DockClear polish, a Thaleron facility, a combat retune, an ROE rewrite, a flags-capacity table, or a boarding-odds table, if ever wanted, remain **different** Tenth-scoped lanes.

## What already exists (do not reinvent)

| Need | Engine / docs fact at `557200f` |
| --- | --- |
| Player observer | `observerKeyForPlayer()` in `src/phase6-sensors.js` returns `'player'`. `playerObserverKey()` in `src/main.js` delegates to it. |
| Contacts | `listContacts` / `contactPresentation`. Ghosts force area track and no `firingSolution`. Ghost copy: “Ghost contact. Sensor record only — no hull, no firing solution.” |
| Cloak | Undetected cloaked contacts are not in the player’s list. Do not add them. |
| Incidents | `observerKnowsIncident(ledger, observerKey, incidentId)` reads `observerCopies[observerKey].knownIncidentIds`. Delivered reports are not erased by jamming. |
| Assignments | `observerKnowsAssignment(observer, assignmentId)` in `src/phase5-objectives.js`. Overdue ≠ destroyed ≠ attacker (Phase 5 gate 3). |
| RSS / true-side | `interferenceLabel` / `snapshotContest` in `src/phase91-contest.js`. `source` is `own` / `friendly` / `mixed` / `unlabeled`. `usedClaim: false`. `inventedFaction: false`. Read a **stored** label. Do not spend `ew` to create one. |
| Spoof | `src/phase92-spoof-catch.js`. `spoofExposed` true uses the suspicion sayable. Catch does not set `engagement_authorized`. Unexposed claims stay claims. |
| Dominion layer | `getObserverKnowledge` / `sayableKnowledgeLine` in `src/phase10-dominion-book.js`. Layers `none` / `rumor` / `evidence` / `contact`. `injectKnowledge` rejects fire writes. Do not call it from the archive. |
| Discovery hide | `sayableSystemName`, `collectLeakedNames`, `redactHiddenText` in `src/phase10-discovery.js`. Fallback for a hidden destination is already “Undiscovered destination.” (`src/phase10-map-hide.js`). |
| Roster lock | `rosterPlayable` false and `scope: 'dominion-first'`. S18.18 unamended. Sailor `rosterPlayableGift` false (PR #71). |
| Save slots | `SAVE_SLOT_COUNT = 3`, `SAVE_SLOT_PREFIX = 'bm2_html_save_slot_'`, `LEGACY_SAVE_KEY = 'bm2_html_save'` (slot 1 mirror). `saveGame` / `loadGame` already persist sibling books beside `systemStates`, which is wiped on load. |
| Jump clock | Phase 5: the strategic clock advances on **completed** warp/wormhole only. Archive produce subscribes after that path. It does not own the clock. |
| UI measure | Phase 9 / dockClear: 1280×720, `clippedControls: []`, host above `.bottom-dock`. DockClear engine #60 / #61 stays locked. |
| Remastered locks | `MAGNITUDES_LOCKED_FROM_REMASTERED`, `UTILITY_LOCKED_FROM_REMASTERED`, `LEDGER_LOCKED_FROM_REMASTERED`, `EMPTY_ARMABLE_LOCKED_FROM_REMASTERED`, `CONSTRUCTION_LOCKED_FROM_REMASTERED`, `HTML_CATALOG_LOCKED_FROM_REMASTERED`, `ECONOMY_DIFFICULTY_LOCKED_FROM_REMASTERED`, `STANDING_TIERS_LOCKED_FROM_REMASTERED`, `DOCK_CLEAR_LOCKED_FROM_REMASTERED`, `ALERTS_ACTIVE_LOCKED_FROM_REMASTERED`, `AWAY_TEAM_XP_LOCKED_FROM_REMASTERED`, `PHASE10_ROSTER_LOCKED_FROM_REMASTERED`, `BAJORAN_SOLAR_SAILOR_LOCKED_FROM_REMASTERED` all **false**. |

**Gap this brief closes (docs now; module only if scoped):** there is no **scoreable S33 contract** that files an arrival briefing from player knowledge, lets the player select an older briefing, and bounds that archive without granting authority or revealing hidden Dominion facts.

## Hooks the writer will have to touch

**This PR touches none of these.** If Tenth later scopes a thin subscribe module:

Prefer **one new file** rather than growing `phase6-sensors.js`, `phase10-dominion-book.js`, or `phase91-contest.js` into a journal:

| Proposed file | Responsibility |
| --- | --- |
| `src/briefing-archive.js` (name can change) | `BRIEFING_ARCHIVE_LOCKED_FROM_REMASTERED === false`; `BRIEFING_ARCHIVE_CAP = 24`; `BRIEFING_LINE_CAP = 12`; `emptyBriefingArchive` / serialize / restore; `produceArrivalBriefing` (pure toward other books); `selectBriefing`; folder + order helpers. **No** fire write. **No** discovery write. **No** standing write. |
| `src/main.js` | Thin: create/restore sibling `state.briefingArchive` **beside** existing books; one call from the completed-jump arrival path after contacts settle; `saveGame` / `loadGame` / `resetRunState`; `__BM1_PROBE__.briefingArchive`. **Do not** change `SAVE_SLOT_COUNT`, faction defs, or map hide. **Do not** dockClear-reflow. |
| Panel markup / CSS | Host `#briefing-archive`, `.briefing-archive-select`, `.briefing-archive-body`. Fit only. Ghost and spoof words stay visible. |
| Optional `scripts/test-briefing-archive.mjs` | Offline: knowledge-only, no grants, cap/eviction/dedupe, old-save empty, lock false. |
| `scripts/behavior-probe.mjs` | Add S33 **after** scope. **Replay** S18 including S18.18 and S32. Do not edit S18.18’s expected `dominion-first`. |

Do **not** implement this inside `src/phase9-*.js`, `src/phase10-*.js`, `src/phase4-incidents.js`, `src/phase5-objectives.js`, `src/phase6-sensors.js`, or `src/dock-clear.js` beyond a **read**. Do **not** `git am` remastered patches.

| Existing path | Required integration (later S33) |
| --- | --- |
| `listContacts` / `contactPresentation` | **Read** player rows. Fail if a ghost line names a living hull. |
| `observerKnowsIncident` | **Read.** Fail if produce opens an incident or pulses FLASH. |
| `observerKnowsAssignment` | **Read.** Fail if an unknown assignment or an unnamed attacker appears. |
| `interferenceLabel` stored source | **Read** if already stored. Fail if `usedClaim` becomes true or a spoof is corrected. |
| `spoofExposed` / catch sayable | **Read.** Fail if an unexposed claim gains a true `sideId`. |
| `getObserverKnowledge` / `sayableKnowledgeLine` | **Read.** Fail if `injectKnowledge` runs. |
| `sayableSystemName` / `collectLeakedNames` | **Read.** Fail if a hidden name survives in `lines` or `folderLabel`. |
| `injectDiscovery` / `grantAssignmentKnowledge` | **Untouched.** Fail if either is called from produce. |
| `consultDoctrineFire` / `ROE_MODES` / standing | Untouched. Fail if a flag or mode changes. |
| `saveGame` / `loadGame` / `resetRunState` | New sibling key. Restore **after** contact book + dominion book. Missing key → empty. |
| `__BM1_PROBE__.phase10` / `.solarSailor` | Keep. Add `.briefingArchive` (below). S18.18 still reads dominion scope. |

## Risks

### 1. Omniscient or corrected intel (gate 1)

A line that names a ghost’s true hull, prints true `sideId` beside an unexposed spoof, includes another observer’s contact, or mentions Dominica at layer `none` fails knowledge-only.

**Gate:** S33.1.

### 2. Reading grants authority (gate 2)

Setting `firingSolution`, `engagement_authorized`, a standing delta, a pursuit flag, or `protect-all` because the captain opened the archive fails the UI/knowledge-only rule.

**Gate:** S33.2.

### 3. Credits, roster, or Dominion reveal (gate 3)

Paying latinum, flipping `rosterPlayable`, or calling `injectDiscovery` / `injectKnowledge` fails even if the paragraph is pretty.

**Gate:** S33.3.

### 4. Unbounded book or brittle saves (gate 4)

Count above 24, a fourth slot, the book inside `systemStates`, or a throw when `briefingArchive` is absent fails save compatibility.

**Gate:** S33.4.

### 5. UI merge without shots (gate 5)

Landing the panel without baseline and after screenshots of **both** the briefing view and the archive view, or without a no-clip / overflow JSON at 1280×720, fails the engine-PR merge gate. Clipping the word “Ghost” to clear the box fails it too.

**Gate:** S33.5.

### 6. Reopen of #33–#71 (gate 6)

Retuning EW, amending S18.18, or rewriting dockClear “to fit the brief” fails do-not-reopen. The touched-but-unchanged table in the proposal is the checklist.

**Gate:** S33.6.

### 7. Remastered crib (gate 7)

`git am`, a copied briefing id, or `BRIEFING_ARCHIVE_LOCKED_FROM_REMASTERED === true` fails. Caps 24 and 12 stay this brief’s constants.

**Gate:** S33.7.

### 8. Duplicate rows or unstable order (gates 1 and 4)

A second copy for `campaignGroup`, or order that depends on `Object` insertion instead of the stated sort, fails the archive contract.

**Gate:** S33.8.

## Probe plan (S33)

**Not in this docs PR.** Add `__BM1_PROBE__.briefingArchive` + optional `scripts/test-briefing-archive.mjs` **only after** Tenth scopes the slice. **Replay `test:phase10` + `test:doctrine` + `test:bajoran-solar-sailor` + S18 including S18.18 + S32.** Do not break existing injectors.

**Engine-PR merge gate:** attach baseline and after screenshots of the briefing UI and of the archive UI, plus overflow JSON (`clippedControls: []`, host clear of `.bottom-dock`, 1280×720). An engine PR without that set **must not merge**.

**Minimum later-slice contract:**

```js
__BM1_PROBE__.briefingArchive = {
  lockedFromRemastered: false, // BRIEFING_ARCHIVE_LOCKED_FROM_REMASTERED
  cap: 24,
  lineCap: 12,
  count: 0,
  selectedId: null,
  grantsFire: false,
  writesRoe: false,
  writesStanding: false,
  writesPursuit: false,
  writesCredits: false,
  writesRosterPlayable: false,
  writesDiscovery: false,
  saveSlotCount: 3,
  // briefings: [{ id, folderKey, folderLabel, campaignGroup, dedupeKey,
  //   lineCount, omittedCount, producedAtStrategicJumps }]
};
```

Suggested asserts (later only):

1. **S33.1:** ghost line unchanged; unexposed spoof not corrected; `collectLeakedNames(lines)` is empty; no scan/jam/discovery call.
2. **S33.2:** ROE, standing, pursuit, `firingSolution`, `engagement_authorized` unchanged across produce and select.
3. **S33.3:** credits unchanged; `rosterPlayable` still false; discovery list length unchanged.
4. **S33.4:** 25 distinct keys → count 24 and `selectedId` kept; duplicate key does not grow; `restore(undefined)` empty; payload has no fourth slot.
5. **S33.5:** screenshot + overflow artifacts present on the engine PR (not this docs PR).
6. **S33.6 / S33.7:** S18.18 still `dominion-first`; sailor lock still false; archive lock false.
7. **S33.8:** one row per briefing; selected folder sorts first; campaign tag is not a second id.

## Out of scope for this docs PR

Engine work; tests; screenshots; `src/` edits; a fourth save slot; `git am` remastered; a Referee Pass; reopening #33–#71; amending S18.18; NPC archives; a manual refresh without a jump; dockClear CSS; fire, ROE, standing, pursuit, credits, or Dominion reveals.
