# BM1 captains briefing / jump-intel archive

**Later status (hygiene 25 September 2026 — cross-link only, brief text below unchanged):** S33 engine **merged** [PR #73](https://github.com/Artemis2028/BM1-bakeoff/pull/73) @ `0534015` (this brief #72 @ `37bca25`). `BRIEFING_ARCHIVE_LOCKED_FROM_REMASTERED` stays false. **No Referee Pass claimed.** World cargo delivery is a separate brief under `docs/world-cargo-delivery/` and does not reopen this lane. See `docs/BAKEOFF-STATUS.md`.

**Status:** proposal for a **knowledge-only** captains briefing and bounded archive; no engine changes made by this document.  
**Repository:** `Artemis2028/BM1-bakeoff`  
**Planning baseline:** `557200fac56556242691a7072763a7a876697253` on `main` (25 September 2026), after S32 Bajoran Solar Sailor engine [PR #71](https://github.com/Artemis2028/BM1-bakeoff/pull/71).  
**Package:** `briefingArchive` (state name can change: `state.briefingArchive`). **Slice:** **S33**, the next slice after S32. This is **not** a Phase 11.  
**This is a captains briefing / jump-intel archive brief.** When the player completes a jump and arrives, a briefing is produced from what that player already knows, the player can select which filed briefing to read, and older briefings stay in a bounded archive grouped by system or campaign. Reading and filing are UI / knowledge only.  
**Referee context:** Phase 4 engine §6 **Pass** on `7f926df`. EW #33 / #35 / #37 / #42 / #43 / #44 / #45, boarding #38 / #39, Phase 10 Dominion-first #40 / #41, flags #46 / #47, ledger #48 / #49, empty-armable #50 / #51, construction #52 / #53, HTML #54 / #55, economy #56 / #57, standing #58 / #59, dockClear #60 / #61, hygiene #62, alertsActive #63 / #64, away-team XP #65 / #66, Phase 10 roster #67 / #68, hygiene #69, and Bajoran Solar Sailor #70 / #71 stay **locked**. Phase 10 S18.18 stays **unamended**. **No Referee Pass claimed.**  
**Companion:** `docs/briefing-archive/BM1-BRIEFING-ARCHIVE-ENGINE-DEPENDENCIES.md` (hooks, risks, later S33 sketch).  
**Scoped by:** Tenth Mountain Trooper, 2026-09-25 — proposal + deps first; room scores the hard gates **before** any engine. Room-locked hard gates (knowledge-only; no fire / ROE / standing / pursuit; no playable unlock / credits / hidden Dominion reveal; bounded save-compatible archive; UI fit is an engine-PR merge gate; do-not-reopen #33–#71; blind) are **in** this one scoreable brief.

Phases 1–10 and the later subscribe packages already landed, including the contact book (Phase 6), incident ledger and delivered reports (Phase 4), convoy / distress / `asset_overdue` (Phase 5), EW ghosts and RSS / true-side / spoof rules (Phase 9–9.4), Dominion-first discovery (Phase 10), and the S32 sailor catalog (PR #71). None of those packages files a captain’s briefing on arrival or keeps an older briefing the player can reopen. This brief opens that gap as a **scoreable contract**. It does **not** reopen those locks and does **not** claim a Referee Pass.

This is **one** docs brief: publish how a jump produces a briefing from the player’s existing knowledge, how the player selects one, and how the archive groups, orders, dedupes, caps, evicts, and saves that briefing. A briefing is not a firing solution, not a third ROE, not `engagement_authorized`, not a standing write, not a pursuit permission, not a credit grant, not a `rosterPlayable` flip, and not a hidden Dominion reveal. It is not a remastered `git am`.

**This PR ships proposal + engine-deps only.** A later thin **subscribe module** (S33), if Tenth scopes it after a brief score, is the natural later deliverable. This brief does **not** ship that module and does **not** edit `src/`.

## 1. The result we want

A later writer can treat arrival intel the way Phase 6 treats the contact book and Phase 10 treats a knowledge layer: the captain reads a **snapshot of what the player already perceives**, can open an older snapshot, and cannot learn, shoot, spend, or authorize anything by doing so.

**Exit condition:** the seven hard gates in §2 are scoreable; produce / select / archive behavior in §3 is the contract; #33–#71 stay closed; no Referee Pass from this PR.

**Proposed first-release decisions:**

| Question | Proposed answer |
| --- | --- |
| What is the first playable slice? | **Docs-only** scoreable contract under `docs/briefing-archive/`. **This PR does not ship engine.** A later thin subscribe module (S33), **if** Tenth scopes it after a brief score, records §3. Name can change (`state.briefingArchive`). |
| Is a thin subscribe module the natural later deliverable? | **Yes.** Analog: `src/bajoran-solar-sailor.js` / `src/away-team-xp.js` (sibling book, no campaign rewrite). S33 **reads** landed knowledge and **writes only** the archive. |
| When is a briefing produced? | On a **completed** warp or wormhole arrival (the Phase 5 strategic-jump clock). Once per arrival hook. In-system flight, an aborted warp, `loadGame`, and `performance.now()` do **not** produce one. |
| What may the text contain? | Only what observer `player` (`observerKeyForPlayer()` → `'player'`) **already** holds: contact-book presentation, already-stored interference label, known incidents, known assignments, current Dominion layer, sayable system names. |
| Can the player choose which briefing to read? | **Yes.** `selectedId` picks one filed briefing. Produce selects the briefing just filed. Selection changes `selectedId` only. |
| How are old briefings kept? | One archive, grouped into folders. Primary folder is the arrival **system**. A campaign group tag is set only from knowledge the player already holds. One row, not two copies. |
| Retention? | Hard cap **24** briefings. Per-briefing line cap **12**. Evict the oldest **unselected** row. Caps are bake-off choices for this brief. They are not remastered locks and are not injectable upward. |
| Dedupe? | Same `dedupeKey` replaces that row in place (same id, count unchanged). A different jump or a different perception digest files a new id. |
| Ordering? | Derived on read. Folder that holds `selectedId` first; other folders by newest jump, then key. Inside a folder: newest jump, then id. |
| Save / load? | Sibling key on the existing 3-slot save. Missing key → empty archive. `systemStates` is not the archive’s home. |
| May a briefing grant fire, change ROE, set `engagement_authorized`, change standing, or grant pursuit? | **No.** UI / knowledge only. No third ROE. |
| May a briefing gift a playable unlock, `rosterPlayable`, credits, or a hidden Dominion reveal? | **No.** |
| May we reopen #33–#71? | **No.** Touched systems in §4 stay **unchanged**. |
| May we `git am` remastered or invent remastered ids / costs? | **No.** `BRIEFING_ARCHIVE_LOCKED_FROM_REMASTERED === false`. Every existing `*_LOCKED_FROM_REMASTERED` stays false. |
| Must a later engine PR prove the UI? | **Yes.** Baseline and after screenshots of the briefing view and of the archive view, plus a no-clip check, are an **engine-PR merge gate**. This docs PR attaches no PNGs. |
| Is this a Referee Pass? | **No.** Referee / One score the hard gates **before** any engine. Number Three probes only after a later S33 slice. |

These are recommendations for this package, not new decisions attributed to the user beyond the room locks. Locked bake-off constraints take precedence over any wish that a captain’s brief be omniscient, that filing intel authorize a shot, or that an archive grow without a cap.

Cite landed knowledge stores as the sources this brief **subscribes to**, not as a second spec:

| Planning source | This brief |
| --- | --- |
| Phase 6 contact book, four layers, cloak, `contactPresentation` | Gate 1. Copy the player’s rows. Do not raise layers. Hidden stays hidden. |
| Phase 9 ghosts as book rows; 9.1 RSS + true-side labels; 9.2 spoof catch | Gate 1. Ghosts and spoofs stay as the player perceives them. No silent correction. |
| Phase 4 delivered reports / `observerKnowsIncident`; jamming cannot unsend | Gate 1 + gate 6. Quote known incidents only. Do not pulse FLASH. Do not delete reports. |
| Phase 5 delivered knowledge; overdue ≠ destroyed ≠ attacker | Gate 1. Assignments the player knows. Do not name an attacker the player does not know. |
| Phase 10 knowledge layers + discovery hide; S18.18 | Gate 3. No reveal, no `rosterPlayable`, no credit. |
| Phase 2 two-mode ROE; pursuit ≠ permission ≠ per-weapon gate | Gate 2. |
| Save slots: `SAVE_SLOT_COUNT = 3`, slot 1 legacy mirror, books outside `systemStates` | Gate 4. |
| Phase 9 / dockClear screenshot + no-clip gate (1280×720) | Gate 5. Engine-PR merge gate. DockClear itself stays locked. |

## 2. Locked constraints (do not reopen)

The bake-off room locked these before this brief. Implementation and probes must treat **gates 1–7** as **hard gates**. Referee / One score this brief against those **seven** **before** any engine PR. Number Three probes only after a later S33 slice. EW / boarding / Dominion-first / roster / flags / ledger / empty-armable / construction / HTML / economy / standing / dockClear / hygiene / alertsActive / away-team XP / sailor gates stay **closed**; they are restated only as **gate 6** (preserve / do-not-open), not as a reopen. This docs PR **does not** claim a Referee Pass.

### Hard gate 1 — Knowledge only

> A briefing never reveals anything the player’s contact book and sensors do not already know. No omniscient intel. The producer reads observer `player` only. It may copy `listContacts` + `contactPresentation` for that observer, an interference label **already stored** for that receiver, incident ids already in `observerCopies.player.knownIncidentIds`, assignments the player observer already passes through `observerKnowsAssignment`, the player’s current Dominion layer (`none` / `rumor` / `evidence` / `contact`), and system names `sayableSystemName` already allows. EW ghosts stay ghosts (`ghost: true` / `source: 'ew_ghost'` / subject `ghost:…`) and use the existing ghost copy (“Ghost contact. Sensor record only — no hull, no firing solution.”). They are never resolved to a living hull. Spoofs and claims stay as the player perceives them: a claim is a claim until `spoofExposed === true` is **already** on that contact, and even then the line is the existing suspicion copy, not a Phase 1 rewrite. True-side interference labels stay the stored RSS label (`own` / `friendly` / `mixed` / `unlabeled`, with `usedClaim: false` and `inventedFaction: false`). The briefing must not replace a perceived claim or ghost with the simulation’s true faction or true hull. If no interference label is already stored, the line is omitted. Cloaked contacts the player has not detected are absent. A lost track stays an area, not a new lock. A later slice that names a hull, faction, attacker, or system the player’s books do not already show **fails**. A later slice that runs a fresh scan, jam, or discovery write in order to “improve” the paragraph **fails**.

Lane owner (wording): **Number 2** on perception vs truth; **Number Four** on read-only subscribe.

**Pass:** fixture — player book holds one ghost row and one spoof whose `spoofExposed` is false; Dominion layer is `none`; Dominica is not discovered. The filed lines still say ghost, still show the claim as a claim, contain no true hull name, and `collectLeakedNames` on the lines is empty.  
**Fail:** any line names the ghost’s true hull, prints the spoof’s true `sideId` beside an unexposed claim, or includes an unsayable system.

### Hard gate 2 — No fire, ROE, standing, or pursuit

> Briefings never grant fire, an ROE change, `engagement_authorized`, a standing change, or pursuit permission. Reading a briefing and archiving a briefing are UI / knowledge only. No third ROE mode. `ROE_MODES` stays the landed two-mode list. `protect-all` stays hold. `consultDoctrineFire` is not called by the archive. Produce and select do not set `firingSolution`, do not write `engagement_authorized`, do not change `factionStanding`, do not set `mayAutoEngage` / pursuit permission, and do not arm a weapon. Quoting an existing “Target locked” presentation is allowed only when that contact **already** has the lock; the quote does not create the lock and does not authorize a shot. A later slice that adds a mode, flips standing, or treats “captain has read the brief” as permission to fire or pursue **fails**.

Lane owner (wording): **Number 2**.

**Pass:** before/after produce and before/after select, `ROE_MODES`, standing totals, pursuit flags, contact `firingSolution` bits, and `engagement_authorized` are unchanged. Snapshot `grantsFire === false`.  
**Fail:** any of those fields change, or `protect-all` appears.

### Hard gate 3 — No playable unlock, credits, or hidden Dominion reveal

> A briefing does not gift a playable hull, a start card, a yard unlock, or `rosterPlayable`. `dominionBook.rosterPlayable` stays false. `dominionBook.scope` stays `dominion-first`. S18.18 stays unamended. `solarSailorBook.rosterPlayableGift` stays false. Latinum, duranium, antimatter, and prize credit are unchanged (`writesCredits === false`). Hidden Dominion campaign facts stay hidden: layer `none` produces no wider-Dominion sentence; produce does not call `injectKnowledge`, `injectDiscovery`, or `grantAssignmentKnowledge`; map hide stays in force. A later slice that pays the player, flips a roster flag, or reveals Dominica / the Gamma Quadrant because a briefing was filed **fails**.

Lane owner (wording): **Number Four** on unlocks and credits; **Number 2** on Dominion knowledge.

**Pass:** credits and `rosterPlayable` flags identical across produce; layer `none` yields no campaign sentence; discovery map length unchanged; leaked-name check empty.  
**Fail:** any credit delta, any roster flag flip, or any discovery write.

### Hard gate 4 — Bounded archive and save compatibility

> The archive is bounded and save-compatible. **Cap = 24** briefings (`BRIEFING_ARCHIVE_CAP`). **Line cap = 12** perceived lines (`BRIEFING_LINE_CAP`). Both are bake-off constants for this package. An inject must not raise either cap. Extra perceived facts beyond 12 lines become `omittedCount` only (a count, not hidden prose). When a **new id** would exceed 24, evict the oldest row that is **not** `selectedId`, ordered by `producedAtStrategicJumps` ascending, then id ascending. The row just produced is selected **before** eviction, so it is pinned. A dedupe hit does not evict and does not allocate an id. The book lives **outside** `systemStates`, on the existing save payload key `briefingArchive`. `SAVE_SLOT_COUNT` stays **3**. Slot keys stay `bm2_html_save_slot_` + slot. Slot 1 still mirrors `bm2_html_save`. No fourth slot. No second storage key. Old saves with no `briefingArchive` load as `emptyBriefingArchive()` (no throw, no backfill from world truth). `resetRunState` / new game clears the archive. Load does not replay jumps. A tampered payload over 24 is evicted with the same rule before the book is live. A selected id that does not exist becomes null. Lines that `collectLeakedNames` rejects against the **already restored** discovery map drop those lines; they do not add discoveries. A later slice that grows past 24, stores the book inside `systemStates`, adds a slot, or throws on a pre-archive save **fails**.

Lane owner (wording): **Number Four**.

**Pass:** 25th new id leaves count at 24 and keeps `selectedId`; same `dedupeKey` twice leaves count unchanged; `restoreBriefingArchive(undefined)` returns an empty book; slot count constant stays 3.  
**Fail:** count > 24, a missing key throws, or a new localStorage slot appears.

### Hard gate 5 — UI fit is an engine-PR merge gate

> Briefing selection and archive text / controls must fit their boxes. Designated boxes (names can change): host `#briefing-archive`, selection/folder controls `.briefing-archive-select`, body `.briefing-archive-body`. Measure at **1280×720** with the same no-clip rule used since Phase 9: `clippedControls: []`; no horizontal overflow of the designated box; the host’s bottom stays above `.bottom-dock`, or the body uses contained `overflow-y: auto` inside a host that itself clears the dock. Do not pass by clipping ghost, spoof, or system words. Do not reopen dockClear CSS as this package. **Engine-PR merge gate:** the later S33 engine pull request **must not merge** unless it attaches **baseline and after screenshots** of the briefing view and of the archive selection view, plus a **no-clip check** (overflow JSON). This docs PR attaches **no** PNGs. An engine PR that lands the panel without those shots **fails** this gate.

Lane owner (wording): **Number Four** (process).

**Pass (engine PR only):** four shots (baseline briefing, baseline archive, after briefing, after archive) plus overflow JSON with the host clear and `clippedControls` empty.  
**Fail:** missing shot pair, missing no-clip artifact, or a pass that hides the selection list. This docs PR is not that evidence.

### Hard gate 6 — Do not reopen #33–#71

> Do **not** reopen any lock from #33 through #71. Touched systems below are **read, then left unchanged**. Do **not** amend S18.18. Do **not** retune `game_items.json`, EW magnitudes, boarding odds, Flash prices, or the sailor catalog. This brief is not a Settings HUD rewrite and not a dock-overlap pass.

Lane owner (wording): **Referee / One**.

**Pass:** a preservation replay (S4–S32, doctrine, Phase 10 including S18.18) stays green, and the archive module’s writes are limited to `state.briefingArchive` plus the probe hook.  
**Fail:** any locked helper’s contract changes, or S18.18 is edited.

#### Touched but unchanged

| System | What S33 may read | What stays unchanged |
| --- | --- | --- |
| Phase 4 incidents / FLASH (#13), alertsActive (#63 / #64) | `observerKnowsIncident` for `player`; already delivered report text | Ledger, FLASH queue, acknowledge, `alertsActive`, S6.14 no second pulse |
| Phase 5 convoy / distress / `asset_overdue` (#21) | `observerKnowsAssignment` for the player observer | Board truth, close-once ids, overdue ≠ destroyed ≠ attacker |
| Phase 6 contact book / cloak (#22 / #24); Phase 6.5 suites | `listContacts(player)`, `contactPresentation`, cloak “not detected ⇒ absent” | Layers, first-frame cloak, suite budget, `ew` consumer |
| EW 9–9.4 (#33 / #35 / #37 / #42 / #43 / #44 / #45) | Ghost flag, stored RSS / true-side label, `spoofExposed`, residue / decoy flags | Ghosts stay book rows; no report wipe; no new family; magnitudes lock stays false |
| Boarding (#38 / #39), away-team XP (#65 / #66) | Nothing required | `tractorIsBoarding()` false; XP `named_mix` |
| Phase 10 Dominion-first (#40 / #41), roster (#67 / #68) | Player layer, `sayableKnowledgeLine`, `sayableSystemName`, `collectLeakedNames` | No `injectKnowledge` / `injectDiscovery`; S18.18; `rosterPlayable` false |
| Flags (#46 / #47), ledger (#48 / #49), empty-armable (#50 / #51) | Nothing required | Credentials, Flash prices, empty slots |
| Construction (#52 / #53), HTML (#54 / #55), economy (#56 / #57), standing (#58 / #59) | Nothing required | No market, price, or standing write |
| DockClear (#60 / #61) | The 1280×720 no-clip **rule** | Do not reflow dockClear panels to “make room” |
| Hygiene (#62 / #69), Sailor (#70 / #71) | Sailor book only to assert it did not change | Classification, empty arms, remastered-lock false |
| Save machinery | `saveGame` / `loadGame` / `resetRunState` slot path | `SAVE_SLOT_COUNT`, prefix, legacy key |
| Phase 2 ROE | `ROE_MODES` read | Two modes; `protect` still `record_only` |

### Hard gate 7 — Blind bake-off

> Do **not** consult, copy, cherry-pick, or `git am` from any other repository. In particular do **not** consult `BM1-remastered-work`. Do **not** invent remastered briefing ids, folder ids, or costs. `BRIEFING_ARCHIVE_LOCKED_FROM_REMASTERED === false`. Every existing `*_LOCKED_FROM_REMASTERED` stays **false**, including `BAJORAN_SOLAR_SAILOR_LOCKED_FROM_REMASTERED`. Caps 24 and 12 are **this brief’s** bake-off choices, not imports. Flipping any remastered-lock to true **fails**.

Lane owner (wording): **Referee / One**.

**Pass:** the flag is false and the module cites `docs/briefing-archive/` plus landed bake-off helpers only.  
**Fail:** a remastered patch, a copied briefing id, or a lock flag set true.

### Soft gate 8 — Suites stay green (after a later slice)

> **Soft:** existing suites stay green (Phase 1 / S4–S32 / catalog / doctrine / boarding / Phase 10 / Phase 8 / Phase 9.4 / utility / weapon-ledger / empty-armable / construction / html-catalogs / economy-difficulty / standing-tiers / dock-clear / alerts-active / away-team XP / phase10-roster / bajoran-solar-sailor / side-lane). A later S33 engine does **not** reopen those locks. Screenshot evidence is gate 5, not a waiver.

Lane owner (wording): **Number Four** (process); **Number Three** scores suite-green **after** a later slice that touches runtime — not this brief.

### Also from the room (score with the gates)

| Room lock | How this brief locks it |
| --- | --- |
| Knowledge-only; ghosts / spoofs as perceived; RSS / true-side labels; no silent correction | Gate 1. §3.2. |
| No fire, ROE change, engagement authorization, standing change, or pursuit; UI / knowledge only; no third ROE | Gate 2. |
| No playable / `rosterPlayable` unlock, credits, or hidden Dominion reveal | Gate 3. |
| Bounded archive; eviction; old saves load; slot rules unchanged | Gate 4. §3.4–§3.6. |
| Selection and archive text fit their boxes; engine PR needs baseline / after shots plus no-clip | Gate 5. |
| Do not reopen #33–#71; list touched-but-unchanged systems | Gate 6. §4. |
| Blind; no remastered ids / costs; remastered-lock flags stay false | Gate 7. |
| Suites green; no Referee Pass from this PR | Soft gate 8. Scoring note below. |

### Must not break (cite landed work)

Score as **preservation**. A later archive Pass that regresses them is a Fail. **#33 through #71 stay locked.**

| Locked rule | Cite | This brief / later slice must not |
| --- | --- | --- |
| Ghosts are book rows; no gifted lock | Phase 9 gate 2; #33 | Spawn a hull from a briefing line. Resolve `ghost:` to a living id. |
| Delivered P4/P5 reports survive jamming | Phase 9 gate 3; #33 | Unsend a report, or mint a report the player never received. |
| RSS all-paid; true-side labels; claim ≠ identity | 9.1 gates 4 and 6; #35 | Label interference from `spoofedFaction`. Silently replace a claim with true side. |
| Spoof catch is suspicion, not a shot | 9.2; #37 | Treat `spoofExposed` as `engagement_authorized`. |
| Stories are knowledge layers; hidden Dominion stays hidden | Phase 10 gates; #40 / #41 | Call `injectDiscovery` from produce. |
| `rosterPlayable` false; `scope: 'dominion-first'` | S18.18; #67 / #68 | Amend S18.18. |
| Two-mode ROE; pursuit ≠ permission | Phase 2; Phase 9 fire gates | Add `protect-all`. |
| Three save slots; books outside `systemStates` | `saveGame` / `loadGame` | A fourth slot, or an archive inside `systemStates`. |
| Sailor is a ship, unarmed, lock false | #70 / #71 | Reclass Sail or lock id 345 while filing a brief. |
| `*_LOCKED_FROM_REMASTERED === false` | #44–#71 | Flip any remastered-lock, including the new archive flag. |

### Process locks (not a change to gates 1–7)

- **Proposal first.** Do not implement the archive from this text until Tenth scopes S33 after a brief score.
- **Blind bake-off.** Implement against bake-off `main` (`557200f` after #71), **not** remastered. From `docs/briefing-archive/` + landed read helpers only. Do **not** `git am`.
- **#33–#71 stay locked.** S18.18 stays unamended.
- **Subscribe, do not fork.** Do not implement a second contact book, a second incident ledger, or a second discovery map.
- **No Referee Pass claimed** in `docs/BAKEOFF-STATUS.md` from this PR. Status may say this brief is **in review**.
- **No `src/` edits on this PR.**

### Scoring note

Referee / One score the **seven hard gates** **before** any engine PR. Number 2 scores gates **1, 2, and 3** (perception, fire/ROE/standing/pursuit, Dominion reveal). Number Four scores gates **1** (read-only), **3** (unlocks/credits), **4** (cap, eviction, save slots), and **5** (fit + merge gate). Number Three probes **only after** a later S33 slice. **No Referee Pass is claimed by this docs PR.**

## 3. Data shape (gates 1–4)

**Lane owner (wording):** Number Four on the book; Number 2 on which fields count as “already known.”

Names can change. The **rules** cannot. Caps 24 and 12 are the scoreable constants. They are not remastered numbers.

### 3.1 When a briefing is produced

Produce runs from the completed strategic-jump / wormhole arrival path **after** that arrival’s existing contact-book update has settled, and **once**. It does not increment `strategicJumps`. It does not run on `loadGame`, `resetRunState`, in-system thrust, or an aborted warp.

On produce:

1. Build a perception snapshot (§3.2).
2. Compute `dedupeKey`.
3. If that key already exists, replace `lines` / `omittedCount` / `perception` on that id and set `selectedId` to it. Stop.
4. Otherwise allocate `brf-${n}`, file the row in the arrival-system folder (§3.3), set `selectedId` to the new id, then evict until `count ≤ 24` (§3.5).

The player selects a briefing by setting `selectedId` to a live id. Selection does not rebuild lines from live sensors. Reopening an older briefing shows the frozen snapshot, including the jump number it was filed on.

A new game starts empty: no starter briefing and no gifted intel.

### 3.2 Perception snapshot

Frozen fields, player observer only:

| Source | Copied when | Must stay out of the snapshot |
| --- | --- | --- |
| Contact row | `listContacts(contactBook, 'player')` | Other observers’ rows. NPC simulation faction if it is not already on the presentation. |
| Presentation | `contactPresentation` | A raised `identification` or `trackQuality`. A new `firingSolution`. |
| Ghost / decoy / residue | Flags already on the row | A resolved hull name. A kill. A standing note. |
| Spoof | Claim text only if the row already shows it. Suspicion line only if `spoofExposed === true` already. | True `sideId` next to an unexposed claim. `playerFaction` rewrite. |
| Interference | Stored receiver label `own` / `friendly` / `mixed` / `unlabeled` if present | A label computed from `spoofedFaction`. A fresh jam spend. |
| Incidents | Ids `observerKnowsIncident(ledger, 'player', id)` | The global ledger. A new FLASH. |
| Assignments | Ids `observerKnowsAssignment` for the player | Board truth the player was not given. An attacker name that is not already in a known report. Overdue written as “destroyed.” |
| Dominion | `getObserverKnowledge(..., 'player').layer` and `sayableKnowledgeLine` | Layer `none` still emits the wider-Dominion sentence. Any `injectKnowledge`. |
| System title | `sayableSystemName` for the arrival system | Raw isolated names when the function would substitute the unsayable fallback (`Undiscovered destination.`). |

`perceptionDigest` is a canonical JSON of those copied fields. `dedupeKey` is `player|${systemIndex}|${strategicJumps}|${perceptionDigest}`.

Line budget: at most 12 strings, chosen in this stable order until the cap: arrival sayable-system line; contacts sorted by `contactId`; known incident lines sorted by id; known assignment lines sorted by id; Dominion sayable line if layer ≠ `none`. Remainder increments `omittedCount` and is not stored as prose.

### 3.3 Folders and grouping

Each briefing has one primary folder:

| Field | Rule |
| --- | --- |
| `folderKind` | `'system'` |
| `folderKey` | `system:${systemIndex}` |
| `folderLabel` | Sayable name, or the unsayable fallback when the name is hidden |
| `campaignGroup` | `'wider_dominion'` if the player’s layer is already `rumor`, `evidence`, or `contact`. Else `'objectives'` if the snapshot included at least one known assignment. Else `null`. |

`campaignGroup` is a filter tag so the UI can group by campaign. It does **not** file a second copy, and it does **not** create the knowledge it displays. Incidents do not get their own folder; they are lines inside the system folder.

### 3.4 Ordering

Ordering is derived at read time so save/load does not depend on array order.

| List | Order |
| --- | --- |
| Folders | The folder that contains `selectedId` first. Then other folders by max `producedAtStrategicJumps` descending, then `folderKey` ascending. |
| Rows in a folder | `producedAtStrategicJumps` descending, then id descending. |
| Campaign filter | Same rows, restricted to a `campaignGroup`. Not a second archive. |

Default selection after produce is the row just filed or refreshed.

### 3.5 Retention and dedupe

| Rule | Contract |
| --- | --- |
| Cap | 24 briefings. Not injectable above 24. |
| Line cap | 12 lines. Overflow is `omittedCount`. |
| Dedupe | Identical `dedupeKey` refreshes one row. Count unchanged. |
| New row | New jump or new digest → new `brf-${n}`. |
| Eviction | If count would exceed 24, drop the oldest unselected row (`producedAtStrategicJumps` asc, id asc). Selected row stays. |
| Eviction side effects | None. Contacts, incidents, objectives, and Dominion knowledge remain. |

### 3.6 Save / load

```js
{
  version: 1,
  cap: 24,
  lineCap: 12,
  nextBriefingId: 1,
  selectedId: null, // or 'brf-N'
  lockedFromRemastered: false, // BRIEFING_ARCHIVE_LOCKED_FROM_REMASTERED
  grantsFire: false,
  writesRoe: false,
  writesStanding: false,
  writesPursuit: false,
  writesCredits: false,
  writesRosterPlayable: false,
  writesDiscovery: false,
  briefings: {
    // 'brf-1': { id, folderKey, folderKind, folderLabel, campaignGroup,
    //   producedAtStrategicJumps, systemIndex, dedupeKey, lines, omittedCount,
    //   perception, grantsFire: false }
  }
}
```

`saveGame` adds `briefingArchive` beside `contactBook`, `incidentLedger`, `objectiveBoard`, `dominionBook`, and `solarSailorBook`. `loadGame` restores it **after** the contact book and Dominion book so the leak check sees the player’s real discovery map. Missing, null, or non-object → empty book. Slot clamp stays 1..3. Loading slot 2 does not import slot 1’s archive. No `performance.now()` deadlines are stored.

### 3.7 Book flags (always)

`grantsFire`, `writesRoe`, `writesStanding`, `writesPursuit`, `writesCredits`, `writesRosterPlayable`, and `writesDiscovery` are **false** on the empty book, on every produce, on every select, and on restore. A payload that tries to set them true is coerced back to false.

## 4. How this sits on landed systems (gate 6)

S33 does not replace Phase 4, Phase 5, Phase 6, EW, or Phase 10. It is a **read model** plus a **player-facing file**.

| Landed behavior | Archive behavior |
| --- | --- |
| Phase 4: knowledge is per observer; FLASH is a separate pulse | Quote `knownIncidentIds` for `player` only. Filing is not a FLASH and does not acknowledge one. |
| Phase 5: actors use delivered knowledge; overdue is not a wreck and not a named killer | The line may say an assignment the player knows is overdue. It may not say destroyed, and it may not name an attacker the player’s reports do not name. |
| Phase 6: detection ≠ identification ≠ track ≠ `firingSolution`; hidden stays hidden | Presentation copy only. Absent contact ⇒ no line. |
| EW: ghosts are rows; RSS labels are true-side; spoof is a claim until catch | Those labels are repeated. They are not corrected and not promoted to fire. |
| Phase 10: rumor / evidence / contact are not a map reveal and not a shot | The sayable layer line is repeated only when the layer is already above `none`. Discovery writes stay at zero. |

## 5. UI (gate 5)

The panel is a dedicated box, not a new page inside dockClear’s target or map chrome. Suggested nodes: `#briefing-archive`, `.briefing-archive-select` (folder list + briefing list), `.briefing-archive-body` (the selected lines, the jump number, and `omittedCount` when it is > 0).

Empty archive copy may say that no briefing has been filed. It must not invent a contact.

**Engine-PR merge gate (explicit):** the later engine PR must include baseline and after screenshots of the briefing UI and of the archive UI, plus a no-clip check, or it does not merge. Viewport 1280×720. This docs PR attaches no PNGs.

## 6. Acceptance exercises (S33 sketch)

Keep Phase 1 / S4–S32 / doctrine / catalog / boarding / Phase 10 green. **S18.18 stays unamended.** Add **S33** only **after** Tenth scopes a later thin subscribe module. IDs are a sketch; do not promise a final count. **This docs PR does not add S33 to the probe.**

Detail, risks, and the minimum snapshot live in the companion engine-deps. Number Three owns the probe gate **after** a later slice, not this brief.

| Case | Required exercise and result (later engine only) |
| --- | --- |
| **S33.1** Knowledge only | Ghost line stays the ghost copy. Unexposed spoof is not rewritten to true side. Layer `none` has no wider-Dominion sentence. `collectLeakedNames` empty. No fresh scan. |
| **S33.2** No grant | Produce and select leave ROE, standing, pursuit, `firingSolution`, and `engagement_authorized` unchanged. |
| **S33.3** No gift | Credits unchanged. `rosterPlayable` still false. Discovery map unchanged. S18.18 unchanged. |
| **S33.4** Bound and save | 25th new id → count 24 and selected kept. Dedupe does not grow. `restore(undefined)` is empty. Slot count stays 3. Book not inside `systemStates`. |
| **S33.5** UI merge gate | Baseline + after shots of briefing and archive, plus overflow JSON, `clippedControls: []`, host above the dock. |
| **S33.6** Lanes preserved | Replay S14–S32 / S17 / S18 including S18.18. Locked helpers unchanged. |
| **S33.7** Blind | `BRIEFING_ARCHIVE_LOCKED_FROM_REMASTERED === false`. Existing remastered-locks still false. |
| **S33.8** Order and folders | Selected folder first. Rows newest-jump first. `campaignGroup` does not duplicate the row. |

Do not claim a Referee Pass from this list.

## 7. Non-goals

This brief will not:

- Implement engine code, tests, UI screenshots, or dockClear polish.
- Edit `src/`.
- Reopen #33–#71 or amend S18.18.
- Raise sensor layers, resolve ghosts, or correct spoofs.
- Grant fire, change ROE, set `engagement_authorized`, change standing, or permit pursuit.
- Gift credits, a playable hull, or `rosterPlayable`.
- Reveal a hidden Dominion system or write discovery / knowledge layers.
- Add a fourth save slot or store the archive inside `systemStates`.
- File a briefing on load, on an aborted warp, or from another observer’s book.
- `git am` remastered patches or lock remastered ids / costs.
- Claim a Referee Pass in `docs/BAKEOFF-STATUS.md`.

## 8. Open questions

Mark these clearly. They do **not** weaken the hard gates.

| ID | Question | Default if a later module is scoped before an answer |
| --- | --- | --- |
| Q1 | Which DOM ids host the panel? | `#briefing-archive`, `.briefing-archive-select`, `.briefing-archive-body`. Not a dockClear rewrite. |
| Q2 | May a playtest inject change the caps? | **Not upward.** Omit inject ⇒ 24 briefings and 12 lines. A value above either cap fails gate 4. |
| Q3 | Do known incidents get their own folder? | **No.** They are lines in the system folder. `campaignGroup` is `wider_dominion` or `objectives` or null, as §3.3. |
| Q4 | May the player refresh a briefing without jumping? | **No.** Produce is the arrival hook only. Selection shows the frozen snapshot. |
| Q5 | May a line include raw contact x/y? | **No.** Use the existing presentation copy (area / ghost / residue / already-held lock wording). Coordinates are not a new exact track. |
| Q6 | Do NPC observers get an archive? | **Out of this package.** Player observer only. |
| Q7 | Where does the arrival hook sit relative to Phase 5’s jump function? | Subscribe **after** the landed jump settles the contact book. Do not own the jump clock. |

## 9. Implementation sequence and handoff

1. **Brief score.** Referee / One score the **seven hard gates**. Number 2 scores gates **1, 2, and 3**. Number Four scores gates **1, 3, 4, and 5**. Do not open an engine PR on this document alone.
2. **Tenth scopes** a later thin subscribe module **or** leaves this as docs-only. Blind implement from `docs/briefing-archive/` against bake-off `main` after #71 (`557200f`). Do not crib remastered.
3. **Suggested order if scoped:** perception snapshot (S33.1) → no grants (S33.2) → no gifts (S33.3) → cap, dedupe, eviction, old-save restore (S33.4) → folders and order (S33.8) → preservation replay (S33.6–S33.7) → UI shots and no-clip (S33.5) **before merge**.
4. **Number Three** adds/runs S33 after that later slice. Keep S4–S32 green. Do not weaken S18.18.
5. Status / changelog (version history in `docs/BAKEOFF-STATUS.md`) may note that the brief is **in review**. It must **not** write a Referee Pass.

## 10. Lanes

| Who | Owns | Scores |
| --- | --- | --- |
| **Number 2** | Doctrine: gates **1, 2, 3** — perception vs truth; no fire / ROE / standing / pursuit; no hidden Dominion reveal | Ghosts and spoofs stay as perceived; reading is not permission; layer `none` stays silent |
| **Number Four** | Archive: gates **1** (read-only), **3** (unlocks / credits), **4** (cap, eviction, slots), **5** (boxes + engine-PR merge gate). Must not edit `src/` in this PR | 24 / 12; old saves empty; three slots; shots required later |
| **Number Three** | Probe gate **after** a later S33 slice (S33; S4–S32 and S18.18 stay green) | Not this brief |
| **Referee / One** | This brief vs the **seven hard gates** in §2. **Do-not-open** check: #33–#71 closed; touched systems listed and unchanged; no `git am`; **no Referee Pass claimed**; brief marked **in review** only | **Before** any engine PR |

This brief is ready to score when a reader can mark Pass/Fail on: knowledge-only (ghosts and spoofs as perceived, RSS / true-side labels not silently corrected); no fire, ROE, engagement authorization, standing, or pursuit, and no third ROE; no playable / `rosterPlayable` / credit / hidden Dominion gift; cap 24 with oldest-unselected eviction, dedupe, ordering, folders, and old saves loading on the existing three slots; UI fit stated as an engine-PR merge gate that requires baseline and after screenshots of the briefing and the archive plus a no-clip check; #33–#71 stay closed with touched systems listed; blind, with every remastered-lock flag false.

## Sources and precedence

- This brief’s later-slice checklist: `docs/briefing-archive/BM1-BRIEFING-ARCHIVE-ENGINE-DEPENDENCIES.md`.
- Planning: `docs/GUIDED-CONVERGENCE.md`; `docs/revised-development-plan.md` §16; `docs/BAKEOFF-STATUS.md` (current main `557200f`).
- Subscribed, not reopened: Phase 4 incidents; Phase 5 convoy / distress; Phase 6 contact book; EW 9–9.4 ghost / RSS / true-side / spoof; Phase 10 Dominion-first discovery; save slots in `src/main.js`; dockClear’s no-clip **rule** only.
- Room: Tenth Mountain Trooper, 2026-09-25. Tip stays blind. No remastered repository was consulted for this brief.
