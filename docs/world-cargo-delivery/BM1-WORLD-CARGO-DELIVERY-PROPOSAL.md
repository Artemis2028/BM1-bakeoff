# BM1 world cargo delivery

**Status:** proposal for **world-center freight completion** and **covert drops that are not customs clearance**; no engine changes made by this document.  
**Repository:** `Artemis2028/BM1-bakeoff`  
**Planning baseline:** `0534015eea9ca67f185d7cd143031bc294294865` on `main` (25 September 2026), after S33 `briefingArchive` engine [PR #73](https://github.com/Artemis2028/BM1-bakeoff/pull/73). Brief #72 stays at `37bca25`.  
**Package:** `worldCargoDelivery` (state name can change: `state.worldCargoBook`). **Slice:** **S34**, the next slice after S33. This is **not** a Phase 11.  
**This is a world cargo delivery brief.** A freight contract completes when the player services the destination **world** (the planet body). Hailing or docking a station in that system does not complete it. A cloaked drop only moves cargo. It may complete a contract that is already marked **covert**, paying only that contract’s `covertReward`. It never completes a legal contract, never pays a legal payout, never clears inspection or customs, never clears a contraband label, and never grants standing. A patrol may note suspicion only.  
**Referee context:** Phase 4 engine §6 **Pass** on `7f926df`. EW #33 / #35 / #37 / #42 / #43 / #44 / #45, boarding #38 / #39, Phase 10 Dominion-first #40 / #41, flags #46 / #47, ledger #48 / #49, empty-armable #50 / #51, construction #52 / #53, HTML #54 / #55, economy #56 / #57, standing #58 / #59, dockClear #60 / #61, hygiene #62, alertsActive #63 / #64, away-team XP #65 / #66, Phase 10 roster #67 / #68, hygiene #69, Bajoran Solar Sailor #70 / #71, and captains briefing #72 / #73 stay **locked**. Phase 10 S18.18 stays **unamended**. **No Referee Pass claimed.**  
**Companion:** `docs/world-cargo-delivery/BM1-WORLD-CARGO-DELIVERY-ENGINE-DEPENDENCIES.md` (hooks, risks, later S34 sketch).  
**Scoped by:** Tenth Mountain Trooper, 2026-09-25 — proposal + deps first; room scores the hard gates **before** any engine. Room-locked hard gates (world-center completion; covert drop never earns a legal payout; cloak drop only moves cargo and is not inspection clear; no authority, suspicion is not a weapons grant; no gifts; save-compatible deliver-once across reload and re-dock; UI merge gate; do-not-reopen #33–#73; blind) are **in** this one scoreable brief. Room clarifications the same day are folded into gates 2 through 6.

Phases 1–10 and the later subscribe packages already landed, including finite markets (Phase 8), convoy / distress / `asset_overdue` (Phase 5), holding zones (Phase 3), sensors / cloak (Phase 6), and the player cargo hold (`state.cargoArray`, `state.openContracts`). On this tip, contract pods whose destination index matches `state.currentPlanet` are paid from `completeWarpTravel` via `deliverContractIfPossible`, after warp arrival forces the player cloak off. Station dock (`tryDockAtStation`) does not pay them. That is not yet a scoreable world-body rule, and nothing in the landed code treats a cloaked drop as a covert contract that leaves inspection, contraband, and standing untouched. This brief opens that gap as a **scoreable contract**. It does **not** reopen those locks and does **not** claim a Referee Pass.

This is **one** docs brief: publish when a freight contract is delivered at the destination world, what a station hail or station dock does instead, how partial, failed, and expired attempts resolve, and how a covert drop differs from an open delivery. A delivery is not a firing solution, not a third ROE, not `engagement_authorized`, not a pursuit permission, not a playable unlock, not a hidden Dominion reveal, and not a customs stamp. It is not a remastered `git am`.

**This PR ships proposal + engine-deps only.** A later thin **subscribe module** (S34), if Tenth scopes it after a brief score, is the natural later deliverable. This brief does **not** ship that module and does **not** edit `src/`.

## 1. The result we want

A later writer can treat destination freight the way Phase 8 treats a once-token and Phase 3 treats a checkpoint fact: the captain services the **world**, the hold and the contract reward move only on a full delivery, and a cloak does not become a customs pass.

**Exit condition:** the nine hard gates in §2 are scoreable; completion, covert-drop, and expiry behavior in §3 is the contract; #33–#73 stay closed; no Referee Pass from this PR.

**Proposed first-release decisions:**

| Question | Proposed answer |
| --- | --- |
| What is the first playable slice? | **Docs-only** scoreable contract under `docs/world-cargo-delivery/`. **This PR does not ship engine.** A later thin subscribe module (S34), **if** Tenth scopes it after a brief score, records §3. Name can change (`state.worldCargoBook`). |
| Is a thin subscribe module the natural later deliverable? | **Yes.** Analog: `src/briefing-archive.js` / `src/phase8-markets.js` (sibling book, no campaign rewrite). S34 **reads** landed hold, cloak, checkpoint, and market helpers and **writes** the book plus the contract-bound pods it completes. |
| What counts as arrival at the world? | Loaded system index equals the contract `targetIndex`, **and** the player ship is within the existing planet service radius `getPlanetDockDistance` of that world’s body, **and** the player performs the mode’s service action there. Warp setting `currentPlanet` is not enough. |
| What is open service? | `mode: 'open'`. Successful planet dock at that body (`tryDockAtPlanetIndex`: `dockedPlanetIndex === targetIndex`, `dockedStationId == null`) while `isHullCloaked` is false. |
| What is a covert drop? | `mode` is already `'covert'`. An explicit drop action inside the same radius, not docked, `dockedStationId == null`, while `isHullCloaked` is true. It pays only that contract’s `covertReward`. Silent running is not a cloak. A cloaked drop of an `open` contract moves cargo and pays 0. |
| What if the player docks or hails a station? | The contract stays `open`. Pods stay. No latinum, no standing, no market write, no Phase 5 close, no inspection write. `lastAttempt.reason` is `station-not-world` or `hail-not-world`. |
| Partial / failed / expired? | Short hold is `partial` and pays nothing. Other refusals are `failed` and pay nothing. A completed strategic jump past the deadline sets `expired` once, releases the bound pods to loose cargo with **payout 0**, and does not pay. |
| How does this relate to Phase 8? | Open delivery may call landed `creditWorthwhileTrip` once. The only standing write is the landed open-contract rule: `adjustFactionStanding(getSystemFaction(target), 3)` inside that callback. No shop sell, no stock reprint. Covert does not call that callback. |
| How does this relate to Phase 5? | Player freight is not a convoy. Do not open, close, or retoken `convoy_delivery`, `distress_rescue`, or `asset_overdue`. Expiry is not overdue. |
| How does this relate to Phase 3? | Read `deriveEncounterFacts`. Never write `compliance_verified`, `access_clearance`, or `inspection_order_active`. A checkpoint refusal still blocks planet dock. A covert drop does not satisfy or cancel the encounter. |
| How does this relate to the hold? | Pods stay on `state.cargoArray` (`tons`, `item`, `destination`, `destinationIndex`, `payout`, `contractId`). Full delivery clears the matching pods. The book does not replace the hold and does not change `cargoCap`. |
| May a cloaked drop pay a legal contract or count as a legal delivery? | **No.** Legal payout only from an uncloaked open delivery. Covert reward only from a contract already marked covert. |
| May a cloaked drop clear inspection, customs, contraband, or standing? | **No.** The drop only moves cargo. |
| May a patrol’s suspicion grant fire, `firingSolution`, `engagement_authorized`, pursuit, or a third ROE? | **No.** Suspicion is a book note only. |
| May delivery grant fire, `firingSolution`, `engagement_authorized`, an ROE change, pursuit, or extra standing? | **No.** Two ROE modes only. `protect-all` stays hold. Open standing is only the existing +3 once-token. Covert standing delta is 0. |
| May delivery gift a playable unlock, `rosterPlayable`, a hidden Dominion reveal, or a second payout? | **No.** Open pays `legalPayout` once. Covert pays `covertReward` once. |
| Save? | Sibling key `worldCargoBook` on the existing 3-slot save, **outside** `systemStates`. Missing key → empty book, **no deliveries pending**. Reload and re-dock do not pay twice. `SAVE_SLOT_COUNT` stays **3**. |
| May we reopen #33–#73? | **No.** Touched systems in §4 stay **unchanged**. |
| May we `git am` remastered or invent remastered ids / costs? | **No.** `WORLD_CARGO_LOCKED_FROM_REMASTERED === false`. Every existing `*_LOCKED_FROM_REMASTERED` stays false. |
| Must a later engine PR prove the UI? | **Yes.** Baseline and after screenshots of an **open delivery** outcome and a **covert drop** outcome, plus a no-clip check at 1280×720 with `clippedControls: []` on the designated boxes. The top header strip clip (“Captain aboard Ferengi Cargo Shuttle. Fereng”) predates this work and is **out of scope**. This docs PR attaches no PNGs. |
| Is this a Referee Pass? | **No.** Referee / One score the hard gates **before** any engine. Number Three probes only after a later S34 slice. |

These are recommendations for this package, not new decisions attributed to the user beyond the room locks. Locked bake-off constraints take precedence over any wish that a station count as the world, that a cloak stamp customs, or that a delivery authorize weapons.

Cite landed stores as the sources this brief **subscribes to**, not as a second spec:

| Planning source | This brief |
| --- | --- |
| Planet dock radius `getPlanetDockDistance` / `PLANET_DOCK_DISTANCE`; `tryDockAtPlanetIndex` | Gate 1. World service uses that radius. Do not invent a second radius. |
| `tryDockAtStation`, station hail, `hailSelectedShip` | Gate 1. Station hail/dock does not complete. |
| `deliverContractIfPossible` / `deliverDestinationCargoAtCurrentPlanet` / `isCargoDueAtCurrentPlanet` | Gates 1 and 5. Legacy pods not in the book keep this path. Book-owned pods are skipped here so warp arrival cannot pre-pay them. |
| `creditWorthwhileTrip` + `adjustFactionStanding(..., 3)` in `deliverContractIfPossible` | Gates 2, 4, and 5. That +3, once, is the **open** contract’s existing standing rule. A cloak must not call it. No issuer bonus. No shop prestige. |
| Phase 8 finite markets, shop sell, jump-farm | Gate 8. Do not restock, do not call `applyShopSell` from completion. |
| Phase 5 convoy / distress / `asset_overdue`; close-once | Gate 8. Freight is not a convoy. Expiry is not overdue. |
| Phase 3 `deriveEncounterFacts`, `getCheckpointDockRefusal` | Gate 3. Read facts. Do not write them. Refusal still blocks open dock. |
| Phase 6 `isHullCloaked`; warp `setPlayerCloak(false)` | Gates 2 and 3. Covert reads cloak in system. Do not reopen first-frame cloak. Silent ≠ cloak. |
| Hold `cargoArray` / `openContracts` / `cargoCap` | Gates 3, 5, and 6. A cloaked drop may move pods. It does not pay a legal contract. |
| Phase 2 `ROE_MODES` (`return-fire`, `defend`); `offersProtectAll() === false` | Gate 4. Suspicion does not add a mode. |
| Save slots: `SAVE_SLOT_COUNT = 3`; books outside `systemStates` | Gate 6. Deliver-once survives reload and re-dock. Old saves have no deliveries pending. |
| Phase 9 / dockClear screenshot + no-clip gate (1280×720) | Gate 7. Engine-PR merge gate. DockClear itself stays locked. Header strip clip is out of scope. |

## 2. Locked constraints (do not reopen)

The bake-off room locked these before this brief, and the same-day clarifications are part of the lock. Implementation and probes must treat **gates 1–9** as **hard gates**. Referee / One score this brief against those **nine** **before** any engine PR. Number Three probes only after a later S34 slice. EW / boarding / Dominion-first / roster / flags / ledger / empty-armable / construction / HTML / economy / standing / dockClear / hygiene / alertsActive / away-team XP / sailor / briefing gates stay **closed**; they are restated only as **gate 8** (preserve / do-not-open), not as a reopen. This docs PR **does not** claim a Referee Pass.

### Hard gate 1 — World-center completion

> A book contract completes only at the destination **world**, under the rule in §3.1. The loaded system index must equal `targetIndex` (the same resolution as `getContractTargetIndex`). The player ship must be within `getPlanetDockDistance` of that world’s body (the radius `tryDockAtPlanetIndex` already uses; `PLANET_DOCK_DISTANCE` is the existing floor). Open mode then requires a successful planet dock at that body: `docked === true`, `dockedPlanetIndex === targetIndex`, `dockedStationId == null`, and `isHullCloaked` false. Covert mode requires the explicit drop action inside that same radius, with `docked === false` and `dockedStationId == null`, while cloaked. A station hail or station dock does not complete the contract, including a station in the destination system and including a station that happens to sit inside the world-service radius. Warp arrival that only sets `currentPlanet` does not complete a book contract. Planet dock in a different system does not complete it. A later slice that pays because `isCargoDueAtCurrentPlanet` is true, or because `dockedStationId` is set, **fails**.

Lane owner (wording): **Number Four** on the predicate; **Number 2** on “world” versus station authority.

**Pass:** fixture — book contract targeted at world A. Dock the station in A, or hail that station: status stays `open`, pods unchanged, latinum unchanged. Move inside `getPlanetDockDistance` of A’s body and perform the mode’s service: status becomes `delivered` and the matching pods clear. Warp-drop elsewhere in A, outside the radius, leaves status `open`.  
**Fail:** any completion on station hail, station dock, or system entry alone.

### Hard gate 2 — Covert drop never earns a legal payout

> A cloaked or covert drop at the destination world **never** earns a legal (open) delivery payout and **never** completes a legal contract. A drop while `isHullCloaked` is true may complete a contract only when that contract’s `mode` is already `'covert'`. The latinum paid is that contract’s stored `covertReward` and nothing else. It is not `legalPayout`. It is not `getContractTotal` of an open contract. It is not the landed open-delivery standing callback. Cloaking does not retag an `open` contract as `covert`. Dropping the cargo of an `open` contract while cloaked leaves that contract not `delivered`, pays **0**, and does not write the open once-token. **Exploit:** cloak in order to skip inspection and still collect the legal payout. That exploit is a **Fail**.

Lane owner (wording): **Number Four** on which figure is paid; **Number 2** on legal versus covert.

**Pass:** an `open` contract at the destination world, player cloaked, drop action: status stays not `delivered`, latinum delta is 0, standing delta is 0. A separate contract with `mode: 'covert'` and `covertReward` set, same drop: status `delivered`, latinum delta equals `covertReward` only, and `legalPayout` of any open contract is not paid.  
**Fail:** any cloaked drop pays an open contract’s `legalPayout`, marks an `open` contract `delivered`, or pays a covert contract any figure other than its own `covertReward`.

### Hard gate 3 — Cloak drop only moves cargo

> A cloaked drop **only moves the cargo**. It never clears inspection, never removes contraband flags, never changes standing, and never counts as a legal delivery. It does not set `inspectionCleared`, `customsCleared`, `compliance_verified`, `access_clearance`, or any other cleared/customs flag. It does not clear `inspection_order_active`. It does not call `closeEncounter`. It does not remove a contraband label (`contract.contraband` stays as it was; a `true` label stays `true`). It does not grant standing (`adjustFactionStanding` is not called; standing totals unchanged). It does not set an `open` contract to `delivered` and does not pay `legalPayout` (gate 2). An `open` contract’s cargo may leave the hold on that drop; the contract stays not delivered and unpaid. A covert contract attempted while uncloaked fails with `uncloaked-not-covert` and pays nothing. Silent running is not a cloak. Phase 3 still does not gain a cargo search: this package does not claim contraband detection. If a checkpoint order is active, a covert-marked drop may still complete **that covert contract** and must leave `deriveEncounterFacts` unchanged, so the check is neither skipped nor satisfied. `restore` forces `inspectionCleared` and `customsCleared` to false even if a tampered payload says true. A later slice that stamps customs, waives a checkpoint, clears `contraband`, writes standing, or records the drop as a legal delivery **fails**.

Lane owner (wording): **Number 2** on inspection, contraband, and standing; **Number Four** on the cloak predicate.

**Pass:** before/after a cloaked drop, `deriveEncounterFacts` is deep-equal, `contraband` is unchanged, faction standing totals are unchanged, the book’s cleared flags are false, and no `open` contract is `delivered`. The sayable outcome states that inspection was not cleared and that the drop is not a legal delivery. Cargo that the drop moved is no longer in those pods.  
**Fail:** any cleared/customs flag becomes true, any contraband label flips to false, standing changes, the checkpoint encounter closes because of the drop, or the drop is counted as a legal delivery.

### Hard gate 4 — No authority; patrol suspicion is not a weapons grant

> Delivery, open or covert, never grants fire, `firingSolution`, `engagement_authorized`, an ROE change, pursuit permission, or standing beyond the contract’s existing rules. The only standing the existing open-contract rule defines on this tip is `creditWorthwhileTrip` once, whose callback is `adjustFactionStanding(getSystemFaction(destination), 3)` (see `deliverContractIfPossible`). That callback runs only for an uncloaked completion of an `open` contract. A covert drop does not use it and does not write standing. A patrol that detects a covert drop may raise **suspicion only** (a book note, not an incident, not a contact-layer upgrade, not FLASH). Suspicion never sets `engagement_authorized`, pursuit permission, or `firingSolution`, and never adds a third ROE mode. Do not add a second faction, an issuer bonus, or a “cleared customs” bonus. `ROE_MODES` stays `['return-fire', 'defend']`. `offersProtectAll()` stays false. Do **not** add `protect-all`. `consultDoctrineFire` is not called by this package. A later slice that adds a mode, sets `engagement_authorized`, grants pursuit, gifts a lock from suspicion, or writes any standing on a covert drop **fails**.

Lane owner (wording): **Number 2**.

**Pass:** before/after open delivery, before/after covert drop, and before/after a patrol suspicion note, `ROE_MODES` is still the two landed modes, `firingSolution` bits are unchanged, `engagement_authorized` is unchanged, and pursuit flags are unchanged. The suspicion note does not contain a lock or an authorization. Covert standing delta is 0. Open standing delta is 3 only when the once-token is new, else 0. Snapshot `offersProtectAll === false`.  
**Fail:** suspicion or a drop sets `engagement_authorized`, pursuit permission, or `firingSolution`; a third ROE mode appears; covert standing moves; open standing moves by any amount other than the existing once-only +3; or `protect-all` appears.

### Hard gate 5 — No gifts

> Delivery does not gift a playable hull, a start card, a yard unlock, or `rosterPlayable`. `dominionBook.rosterPlayable` stays false. `dominionBook.scope` stays `dominion-first`. S18.18 stays unamended. `solarSailorBook.rosterPlayableGift` stays false. Hidden Dominion facts stay hidden: delivery does not call `injectKnowledge`, `injectDiscovery`, or `grantAssignmentKnowledge`. An open delivery pays that contract’s `legalPayout` once. A covert delivery pays that contract’s `covertReward` once. Neither pays the other mode’s figure, and neither pays a bonus. Deliver-once is gate 6 as well: a second completion, a reload, or a re-dock pays 0. Partial, failed, and expired attempts pay 0. A later slice that pays twice, pays a legal figure from a cloak, flips a roster flag, or reveals Dominica / the Gamma Quadrant because freight was delivered **fails**.

Lane owner (wording): **Number Four** on unlocks, credits, and idempotence; **Number 2** on Dominion knowledge.

**Pass:** one open delivery adds exactly `legalPayout`; one covert delivery adds exactly `covertReward`; a second call on either adds 0. `rosterPlayable` flags and the discovery map are unchanged. `collectLeakedNames` on the outcome line is empty.  
**Fail:** any credit beyond that contract’s own reward, any second payout, any roster flag flip, or any discovery write.

### Hard gate 6 — Save-compatible, deliver-once across reload and re-dock

> Old saves that lack `worldCargoBook` load as `emptyWorldCargoBook()` with **no deliveries pending** (no throw, no backfill, no payout, no queue of completions, no completed deliveries invented from `openContracts`, and the next dock or arrival does not auto-pay a book contract that was not in the save). Deliver-once is explicit against **reload** and **re-dock**. A contract that is `delivered` stores `completionToken`. Reloading that save and then re-docking or re-arriving at the world pays 0 latinum and 0 standing. Re-docking or re-arriving in the same session, without a reload, also pays 0. The token lives on the book, so a load that wipes `systemStates` still sees it. The book lives **outside** `systemStates`, on the existing save payload key `worldCargoBook`. It does not belong in `systemStates`: that cache is wiped on load and is per-system scratch, and a delivery token must survive a system change and a reload. No justification is claimed for putting it inside `systemStates`. `SAVE_SLOT_COUNT` stays **3**. Slot keys stay `bm2_html_save_slot_` + slot. Slot 1 still mirrors `bm2_html_save`. No fourth slot. No second storage key. Legacy `openContracts` and `cargoArray` restore as they do today. Contracts absent from the book keep the landed warp-arrival / planet-trade path and are not migrated into the book on load. `resetRunState` / new game clears the book. Load does not replay jumps and does not auto-deliver. Deadlines are strategic-jump counts, not `performance.now()`. A tampered `inspectionCleared: true` or `customsCleared: true` restores false. A later slice that throws on a pre-book save, pays again after reload or re-dock, leaves a delivery pending on an old save, adds a slot, or stores the book inside `systemStates` **fails**.

Lane owner (wording): **Number Four**.

**Pass:** `restoreWorldCargoBook(undefined)` returns an empty book and `deliveriesPending` is 0. Slot count constant stays 3. A save payload’s `systemStates` does not contain the book. A legacy save’s `cargoArray` round-trips without a new payout and without a pending book delivery. After a completed delivery, save, load, and re-dock (and a re-dock with no reload) each add 0 latinum.  
**Fail:** a missing key throws, an old save loads with a delivery pending, reload or re-dock pays again, a fourth slot appears, or the book is nested under `systemStates`.

### Hard gate 7 — UI merge gate

> Delivery and contract text and controls must fit their boxes. Designated boxes (names can change): host `#world-cargo`, contract list / actions `.world-cargo-contracts`, outcome `.world-cargo-outcome`. The outcome must be able to show an **open delivery** result and a **covert drop** result, including the covert sentence that inspection was not cleared. Measure at **1280×720** with the same no-clip rule used since Phase 9: `clippedControls: []` on those designated boxes; no horizontal overflow of the designated box; the host’s bottom stays above `.bottom-dock`, or the outcome uses contained `overflow-y: auto` inside a host that itself clears the dock. Do not pass by clipping the world name, the payout, or the “inspection not cleared” sentence. Do not reopen dockClear CSS as this package. **Engine-PR merge gate:** the later S34 engine pull request **must not merge** unless it attaches **baseline and after screenshots** of the relevant delivery UI, including an open delivery outcome and a covert drop outcome, plus a **no-clip check** (overflow JSON) at 1280×720 with `clippedControls: []`. This docs PR attaches **no** PNGs. An engine PR that lands the panel without those shots **fails** this gate. The top header strip clip (“Captain aboard Ferengi Cargo Shuttle. Fereng”) **predates this work and is out of scope**. Do not restyle that strip to satisfy this gate. If a full-viewport sweep still reports that strip, NOTES name it as the pre-existing header and the designated-box `clippedControls` array is still `[]`.

Lane owner (wording): **Number Four** (process).

**Pass (engine PR only):** baseline shot, after shot of an open delivery outcome, after shot of a covert drop outcome, plus overflow JSON measured on `#world-cargo` with `clippedControls: []` and the host clear of the dock. NOTES record the pre-existing header strip as out of scope.  
**Fail:** missing open or covert shot, missing no-clip artifact, a non-empty `clippedControls` on the designated boxes, or a pass that hides the outcome sentence. Fixing the header strip is not this gate.

### Hard gate 8 — Do not reopen #33–#73

> Do **not** reopen any lock from #33 through #73. Touched systems below are **read, then left unchanged**, except the narrow guards in §4 that skip **book-owned** pods inside the landed delivery helper. Do **not** amend S18.18. Do **not** retune `game_items.json`, EW magnitudes, boarding odds, Flash prices, market magnitudes, Phase 5 tier ordering, or the sailor catalog. This brief is not a Settings HUD rewrite, not a dock-overlap pass, and not a header-strip fix.

Lane owner (wording): **Referee / One**.

**Pass:** a preservation replay (S4–S33, doctrine, Phase 10 including S18.18) stays green, and the module’s authority writes stay inside §3.  
**Fail:** any locked helper’s contract changes, or S18.18 is edited.

#### Touched but unchanged

| System | What S34 may read | What stays unchanged |
| --- | --- | --- |
| Cargo hold / `openContracts` (`src/main.js`) | Pod fields, `getContractTargetIndex`, `getContractTotal`, `getPlanetDockDistance`, `clearCargoPod` | `cargoCap`, pod schema, legacy contracts **not** in the book, `tradeAtPlanet` loose-cargo sale |
| Landed auto-deliver | Whether a pod’s `contractId` is in the book | `deliverDestinationCargoAtCurrentPlanet` payout math and `restoreMissingContractCargo` for **non-book** contracts. Book ids are skipped so warp arrival cannot pre-pay them. That skip is the gate 1 guard, not a Phase 8 retune |
| Phase 8 markets (#31), economy (#56 / #57) | `creditWorthwhileTrip`, `getSystemFaction` for the open +3 | Stock, demand, shop sell, jump-farm caps, difficulty profiles. No `applyShopSell` from completion |
| Standing tiers (#58 / #59) | Nothing required | Tier table, `evaluateWiredPurchase`. Open +3 is the existing delivery callback, not a new tier |
| Phase 5 convoy / distress / `asset_overdue` (#21) | Clock: strategic jumps advance on completed warp/wormhole only. `resolveTierSlack('standard')` for the default deadline slack | Board truth, close-once ids, overdue ≠ destroyed ≠ attacker. Expiry here does not emit `asset_overdue` |
| Phase 3 holding zones (#8 / #9) | `deriveEncounterFacts`, `getCheckpointDockRefusal` | Encounter lifecycle, dwell, `compliance_verified`, `access_clearance`. No cargo search |
| Phase 6 cloak (#22 / #24); Phase 6.5 | `isHullCloaked` | First-frame cloak, warp `setPlayerCloak(false)`, suite budget. Silent ≠ cloak |
| Phase 4 incidents / FLASH (#13), alertsActive (#63 / #64) | Nothing required | Ledger, FLASH, `alertsActive` |
| EW 9–9.4 (#33 / #35 / #37 / #42 / #43 / #44 / #45) | Nothing required | Ghosts, residue, magnitudes lock false |
| Boarding (#38 / #39), away-team XP (#65 / #66) | Nothing required | `tractorIsBoarding()` false; XP `named_mix` |
| Phase 10 Dominion-first (#40 / #41), roster (#67 / #68) | `sayableSystemName` if a world name is shown | No `injectDiscovery`; S18.18; `rosterPlayable` false |
| Briefing archive (#72 / #73) | Nothing required | Cap 24 × 12, knowledge-only produce |
| Flags (#46 / #47), ledger (#48 / #49), empty-armable (#50 / #51) | Nothing required | Credentials, Flash prices, empty slots |
| Construction (#52 / #53), HTML (#54 / #55) | Nothing required | Scaffolds, catalog pages |
| DockClear (#60 / #61) | The 1280×720 no-clip **rule** | Do not reflow dockClear panels. Do not “fix” the header strip |
| Hygiene (#62 / #69), Sailor (#70 / #71) | Sailor book only to assert it did not change | Classification, empty arms, remastered-lock false |
| Save machinery | `saveGame` / `loadGame` / `resetRunState` slot path | `SAVE_SLOT_COUNT`, prefix, legacy key |
| Phase 2 ROE | `ROE_MODES`, `offersProtectAll` | Two modes; `protect-all` stays false |

### Hard gate 9 — Blind bake-off

> Do **not** consult, copy, cherry-pick, or `git am` from any other repository. In particular do **not** consult `BM1-remastered-work`. Do **not** invent remastered contract ids, world ids, ton prices, or deadline tables. `WORLD_CARGO_LOCKED_FROM_REMASTERED === false`. Every existing `*_LOCKED_FROM_REMASTERED` stays **false**, including `BRIEFING_ARCHIVE_LOCKED_FROM_REMASTERED` and `BAJORAN_SOLAR_SAILOR_LOCKED_FROM_REMASTERED`. The world-service radius is the landed `getPlanetDockDistance`. The open standing delta is the landed +3. The default deadline slack is the landed Phase 5 `resolveTierSlack('standard')` (injectable). Those are bake-off subscriptions, not imports. Flipping any remastered-lock to true **fails**.

Lane owner (wording): **Referee / One**.

**Pass:** the new flag is false, every prior remastered-lock flag is false, and the module cites `docs/world-cargo-delivery/` plus landed bake-off helpers only.  
**Fail:** a remastered patch, a copied remastered id or cost, or a lock flag set true.

### Soft gate 10 — Suites stay green (after a later slice)

> **Soft:** existing suites stay green (Phase 1 / S4–S33 / catalog / doctrine / boarding / Phase 10 / Phase 8 / Phase 9.4 / utility / weapon-ledger / empty-armable / construction / html-catalogs / economy-difficulty / standing-tiers / dock-clear / alerts-active / away-team XP / phase10-roster / bajoran-solar-sailor / briefing-archive / side-lane). A later S34 engine does **not** reopen those locks. Screenshot evidence is gate 7, not a waiver.

Lane owner (wording): **Number Four** (process); **Number Three** scores suite-green **after** a later slice that touches runtime — not this brief.

### Also from the room (score with the gates)

| Room lock | How this brief locks it |
| --- | --- |
| Delivery completes only at the destination world; station hail/dock does not | Gate 1. §3.1–§3.2. |
| Cloaked/covert drop never earns a legal payout and never completes a legal contract; covert pays only `covertReward` | Gate 2. §3.4. Exploit (cloak to skip inspection and take the legal payout) is a Fail. |
| Cloaked drop only moves cargo: never clears inspection, never removes contraband, never changes standing, never counts as a legal delivery | Gate 3. §3.4. |
| No fire, `firingSolution`, `engagement_authorized`, ROE change, or pursuit. Patrol suspicion only. Two ROE modes. No `protect-all`. Open standing is only the existing +3 once-token | Gate 4. |
| No playable / `rosterPlayable` unlock, no hidden Dominion reveal, no payout outside the contract’s own reward | Gate 5. |
| Deliver-once across reload and re-dock. Old saves load with no deliveries pending. `SAVE_SLOT_COUNT` stays 3. Book stays out of `systemStates` | Gate 6. §3.6. |
| UI fit; engine PR needs baseline + after shots of open delivery and covert drop, plus no-clip `clippedControls: []`; header strip out of scope | Gate 7. |
| Do not reopen #33–#73; list touched-but-unchanged systems | Gate 8. §4. |
| Blind; `WORLD_CARGO_LOCKED_FROM_REMASTERED` false; all remastered-lock flags stay false | Gate 9. |
| Suites green; no Referee Pass from this PR | Soft gate 10. Scoring note below. |

### Must not break (cite landed work)

Score as **preservation**. A later delivery Pass that regresses them is a Fail. **#33 through #73 stay locked.**

| Locked rule | Cite | This brief / later slice must not |
| --- | --- | --- |
| Finite stock; price ≠ ban; money ≠ standing ≠ Reman; jump-farm closed | Phase 8; #31 | Restock a market from a drop. Turn delivery into `applyShopSell`. |
| Worthwhile trip pays once | Phase 8 S13.17; `creditWorthwhileTrip` | Pay the open +3 twice, or pay it on a covert drop. |
| Close-once convoy; overdue ≠ destroyed ≠ attacker | Phase 5; #21 | Close a convoy because freight delivered. Emit `asset_overdue` on expiry. |
| Checkpoint facts are movement/identity, not a cargo search | Phase 3 | Set `compliance_verified` from a drop. Invent a contraband scanner. |
| First-frame cloak; silent ≠ cloak | Phase 6; Phase 9.2 | Treat silent running as a covert drop. Rewrite warp decloak. |
| Ghosts are book rows; no gifted lock | Phase 9; #33 | Grant `firingSolution` from a delivery. |
| Stories are knowledge layers; hidden Dominion stays hidden | Phase 10; #40 / #41 | Call `injectDiscovery` from a drop. |
| `rosterPlayable` false; `scope: 'dominion-first'` | S18.18; #67 / #68 | Amend S18.18. |
| Two-mode ROE; `protect-all` hold | Phase 2; #6 | Add `protect-all`. |
| Three save slots; books outside `systemStates` | `saveGame` / `loadGame` | A fourth slot, or a book inside `systemStates`. |
| Briefing archive cap 24 × 12; knowledge-only | #72 / #73 | File an omniscient briefing from a drop. |
| Sailor is a ship, unarmed, lock false | #70 / #71 | Reclass Sail while delivering freight. |
| `*_LOCKED_FROM_REMASTERED === false` | #44–#73 | Flip any remastered-lock, including the new world-cargo flag. |
| Header strip clip predates this package | Gate 7 | Claim a UI pass by editing that strip, or fail this package for it. |

### Process locks (not a change to gates 1–9)

- **Proposal first.** Do not implement world cargo from this text until Tenth scopes S34 after a brief score.
- **Blind bake-off.** Implement against bake-off `main` (`0534015` after #73), **not** remastered. From `docs/world-cargo-delivery/` + landed read helpers only. Do **not** `git am`.
- **#33–#73 stay locked.** S18.18 stays unamended.
- **Subscribe, do not fork.** Do not implement a second market book, a second objective board, or a second checkpoint ledger.
- **No Referee Pass claimed** in `docs/BAKEOFF-STATUS.md` from this PR. Status may say this brief is **in review**.
- **No `src/` edits on this PR.**

### Scoring note

Referee / One score the **nine hard gates** **before** any engine PR. Number 2 scores gates **1** (world versus station), **2** (legal payout versus covert reward), **3** (inspection / contraband / standing / not a legal delivery), and **4** (fire / ROE / pursuit / suspicion). Number Four scores gates **1** (radius and dock predicate), **2** (which figure is paid), **5** (no roster), **6** (deliver-once across reload and re-dock; old saves have no deliveries pending), and **7** (fit + merge gate). Number Three probes **only after** a later S34 slice. **No Referee Pass is claimed by this docs PR.**

## 3. Data shape (gates 1–6)

**Lane owner (wording):** Number Four on the book; Number 2 on which writes would be authority, customs, or standing.

Names can change. The **rules** cannot. The radius, the +3, and the Phase 5 standard slack are landed bake-off values. They are not remastered numbers.

### 3.1 Arrival at the world

`atWorld` is true only when all of these hold:

1. `state.currentPlanet` equals the contract’s `targetIndex` (resolved like `getContractTargetIndex`, including a name fallback already used by that helper).
2. Distance from `state.ship` to the destination planet marker is **≤** `getPlanetDockDistance(planet)`.
3. The mode’s action matches §1: open planet dock, or covert drop.
4. `dockedStationId` is null. A non-null station id fails closed, even at the world body.
5. The matching pod rule in §3.3 passes for a **full** delivery. Short or empty holds do not set `atWorld` into a payout.

Warp completion (`completeWarpTravel`) may set `currentPlanet` and may drop the player cloak. That hook does **not** call completion for book-owned ids. `isCargoDueAtCurrentPlanet` remains a system-index test for legacy pods. It is necessary context for “which world,” and it is not sufficient for a book contract.

### 3.2 Station hail or station dock

If the player hails a station or ship (`hailSelectedShip`, or a station hail target) or docks a station (`tryDockAtStation` / `dockedStationId` set):

- Status stays `open` (unless it was already `delivered` or `expired`).
- Matching pods are not cleared and their `payout` is not paid.
- `lastAttempt` becomes `{ result: 'failed', reason: 'station-not-world' | 'hail-not-world', stationId }`.
- No `creditWorthwhileTrip`, no `adjustFactionStanding`, no `applyShopSell`, no Phase 5 close, no encounter write.
- Sayable line: the freight is due at the destination world, not at this station.
- The player may undock and later service the world, until expiry.

Origin **accept** may still happen at a docked station or planet. That is taking the job. It is not delivery. `acceptPendingContract` stays dock-gated as it is today. New book rows are created only for contracts accepted after the module exists; this brief does not move the accept site.

### 3.3 Hold, partial, failed, expired

The hold stays `state.cargoArray`. A pod matches a book contract when `contractId` matches, the good matches, and the destination index matches `targetIndex`.

| Result | When | Writes |
| --- | --- | --- |
| `delivered` | `atWorld`, matching tons **≥** `contract.tons`, and the mode matches the action: uncloaked planet dock for `open`, cloaked drop for `covert` | Clear those pods (`clearCargoPod`). Open adds `legalPayout` once and may apply the +3 once-token. Covert adds `covertReward` once and standing 0. Status `delivered`. `completionToken = world-cargo:${id}`. |
| `partial` | Matching tons **> 0** and **<** `contract.tons` | Status stays `open`. Pods stay. Latinum 0. Standing 0. Token not consumed. `lastAttempt.result = 'partial'`, `reason = 'short-tons'`. |
| `failed` | Wrong world, station, hail, outside radius, empty matching hold, wrong good, uncloaked covert, checkpoint refusal on open dock | Status stays `open`. Pods stay. Latinum 0. Standing 0. Token not consumed. |
| `expired` | Status still `open` when a **completed** warp/wormhole makes `strategicJumps > acceptedAtStrategicJumps + deadlineSlack` | Status `expired` once. Latinum 0. Standing 0. Bound pods become loose: `destination` cleared, `contractId` cleared, `payout` set to **0**, tons unchanged. They are not a new reward. A later shop sale is Phase 8, not this contract. A second jump does not expire again and does not pay. |

`deadlineSlack` defaults to `resolveTierSlack('standard')` from Phase 5. A probe may inject a slack. This package does not publish a new deadline table and does not reorder `tight < standard < soft`. In-system flight, `loadGame`, and `performance.now()` do not expire a contract.

`restoreMissingContractCargo` must not refill a book-owned id. A missing book pod is an empty or partial attempt, not a free reload.

Checkpoint refusal (`getCheckpointDockRefusal` on planet dock) is a **failed** open attempt (`checkpoint-refused`). It is not delivery and not compliance.

### 3.4 Open delivery and covert drop

| | Open (`mode: 'open'`) | Covert (`mode: 'covert'` already) |
| --- | --- | --- |
| Completes when | Uncloaked planet dock at the world body, full tons | Cloaked drop in the same radius, not docked, full tons |
| Cloaked attempt | Cargo for that contract may leave the hold. Status stays not `delivered`. Latinum 0. Reason `cloak-not-legal`. Not a legal delivery | May deliver. Pays `covertReward` only |
| Uncloaked attempt | May deliver. Pays `legalPayout` only | Fail `uncloaked-not-covert`. Pays 0 |
| Latinum | `legalPayout` once. Never from a cloak | `covertReward` once. Never `legalPayout` |
| Standing | Existing +3 via `creditWorthwhileTrip` once, destination faction only, and only on that uncloaked completion | **0.** Do not call `adjustFactionStanding` |
| Inspection / customs | Flags stay false. Encounter facts unchanged | Flags stay false. Encounter facts unchanged. Outcome says inspection was not cleared |
| Contraband label | Unchanged | Unchanged |
| Patrol sees the drop | Not applicable to the open dock | Suspicion note only. No `firingSolution`, no `engagement_authorized`, no pursuit, no third ROE |
| Phase 3 order active | Dock refusal fails the delivery if the checkpoint blocks planet dock | Drop may complete the covert contract. The order stays. Facts stay. The drop is not dwell, withdrawal, waiver, clearance, or a legal delivery |

There is no landed player-wide contraband flag. Do not invent one in order to clear it. The contract field `contraband` is a label (default false). A drop never assigns it to false.

`legalPayout` is stored only on `mode: 'open'` (the landed `getContractTotal` at accept). `covertReward` is stored only on `mode: 'covert'` (that contract’s own defined reward, set at accept; a probe may inject the figure). The other field is 0. A cloaked drop reads `covertReward` and only when `mode` is already `'covert'`. It does not read `legalPayout`. Neither figure is a remastered price table.

Book fields `inspectionCleared` and `customsCleared` exist so a probe can read them. They are constantly false. Restore forces false.

### 3.5 Book sketch

```text
worldCargoBook = {
  version: 1,
  inspectionCleared: false,   // constant; restore forces false
  customsCleared: false,      // constant; restore forces false
  contracts: {
    [id]: {
      id,
      mode: 'open' | 'covert',   // set at accept; a drop cannot retag it
      status: 'open' | 'delivered' | 'expired',
      good,
      tons,
      legalPayout,              // open contracts only; getContractTotal at accept. Cloak never pays this
      covertReward,             // covert contracts only; that contract's defined reward. Not legalPayout
      originIndex,
      targetIndex,
      targetName,
      contraband: false,        // label; a drop never assigns false
      acceptedAtStrategicJumps,
      deadlineSlack,            // resolveTierSlack('standard') unless injected
      completionToken: null,    // or 'world-cargo:' + id; survives reload
      deliveredAtStrategicJumps: null,
      deliveredCloaked: null,   // true only after a covert completion; not customs; not legal
      lastAttempt: null
    }
  },
  suspicion: []                 // notes only; never a lock, ROE mode, or standing write
}
```

No `firingSolution`, no `engagement_authorized`, no `protect-all`, no `rosterPlayable`.

### 3.6 Save

`saveGame` adds `worldCargoBook` beside `marketBook`, `briefingArchive`, and the other sibling books. `loadGame` restores it with the other books, not from inside `systemStates`. Missing, null, or non-object → empty book and **no deliveries pending**. Slot clamp stays 1..3. Loading slot 2 does not import slot 1’s book. Legacy contracts not listed in the book are not enrolled and are not paid by the restore. A restored `completionToken` blocks another pay on the next dock or arrival. Load does not run completion.

## 4. What a later slice may change

Only if Tenth scopes S34:

- Add `state.worldCargoBook` and the completion / drop / expiry helpers.
- Skip book-owned contract ids inside `deliverDestinationCargoAtCurrentPlanet` and `restoreMissingContractCargo` so the landed warp-arrival payer cannot pre-pay them.
- Call open-mode completion from a successful destination planet dock, not from `completeWarpTravel`.
- Call covert-mode completion from the drop action.
- On completed strategic jumps, expire due book contracts once.
- Render `#world-cargo` and record the gate 7 shots.

Leave legacy non-book contracts on the landed path. Leave Phase 5, Phase 8 stock, Phase 3 encounters, cloak init, ROE, and the briefing archive’s produce path alone.

## 5. Non-goals

- No engine, CSS, probe, or save-format code in **this** PR.
- No second market, no second convoy board, no cargo-search minigame, no customs office simulation.
- No change to accept-at-origin docking. Employers may still be stations. Completion is the world.
- No `protect-all`. No third ROE. No pursuit grant. No gifted `firingSolution`.
- No playable unlock, no `rosterPlayable` flip, no hidden Dominion reveal, no credit besides the matching contract’s own reward once. A cloak does not collect `legalPayout`.
- No fourth save slot. No book inside `systemStates`.
- No dockClear reopen. No repair of the pre-existing header strip.
- No remastered ids, costs, or `git am`.
- No Referee Pass.

## 6. Acceptance exercises (S34 sketch)

Keep Phase 1 / S4–S33 / doctrine / catalog / boarding / Phase 10 green. **S18.18 stays unamended.** Add **S34** only **after** Tenth scopes a later thin subscribe module. IDs are a sketch; do not promise a final count. **This docs PR does not add S34 to the probe.**

| ID | Exercise | Pass picture |
| --- | --- | --- |
| **S34.1** World-center | Station dock and station hail in the destination system do not deliver. Outside the planet radius does not deliver. World service does. | Gate 1. |
| **S34.2** No legal payout from a cloak | Open contract, cloaked drop at the world: not `delivered`, latinum 0. Covert contract, same drop: `delivered`, latinum equals `covertReward` only. Exploit (legal payout while cloaked) fails the gate. | Gate 2. |
| **S34.3** Cloak only moves cargo | Facts unchanged. `contraband` unchanged. Standing unchanged. Cleared flags false. Drop is not a legal delivery. Uncloaked blocks covert. | Gate 3. |
| **S34.4** Suspicion is not authority | Patrol note does not set `firingSolution`, `engagement_authorized`, or pursuit. `ROE_MODES` stays two. No `protect-all`. Covert standing 0. Open standing +3 once or 0 if the token exists. | Gate 4. |
| **S34.5** No gifts | Each mode pays its own reward once. Partial / fail / expire pay 0. `rosterPlayable` false. No discovery write. | Gate 5. |
| **S34.6** Save and deliver-once | `restore(undefined)` empty and `deliveriesPending` is 0. Slots stay 3. Book not in `systemStates`. After delivery, reload then re-dock pays 0. Re-dock without reload pays 0. | Gate 6. |
| **S34.7** UI merge gate | Baseline + after open outcome + after covert outcome. Overflow JSON `clippedControls: []`. Header strip noted out of scope. | Gate 7. |
| **S34.8** Lanes preserved | Replay S14–S33 / S18 including S18.18. Locked helpers unchanged except the book-id skip. | Gate 8. |
| **S34.9** Blind | `WORLD_CARGO_LOCKED_FROM_REMASTERED === false`. Existing remastered-locks still false. | Gate 9. |
| **S34.10** Partial and expiry | Short tons stay open and unpaid. Jump past slack expires once, pods go loose at payout 0, no `asset_overdue`. | §3.3. |

## 7. Open questions

| ID | Question | Scoreable default until Tenth amends |
| --- | --- | --- |
| Q1 | Which DOM ids host the panel? | `#world-cargo`, `.world-cargo-contracts`, `.world-cargo-outcome`. Not a dockClear rewrite. |
| Q2 | Do legacy `openContracts` absent from the book stay on warp-arrival delivery? | **Yes.** They are not migrated on load. Only book ids use §3.1. |
| Q3 | May a covert drop complete while a Phase 3 order is active? | **Yes, the contract only.** Encounter facts stay. The drop does not skip or satisfy the check. |
| Q4 | What is the deadline slack? | Landed `resolveTierSlack('standard')`, overridable by inject. No new table. |
| Q5 | What happens to tons on expiry? | They remain in the hold as loose cargo with `payout` 0. They are not deleted and not paid as the contract. |

## 8. Suggested order if a later slice is scoped

1. **Brief score.** Referee / One score the **nine** hard gates. Do not open an engine PR on this document alone.
2. **Tenth scopes** a later thin subscribe module **or** leaves this as docs-only. Blind implement from `docs/world-cargo-delivery/` against bake-off `main` after #73 (`0534015`). Do not crib remastered.
3. **Suggested order if scoped:** world predicate and station refusal (S34.1) → cloak versus legal payout (S34.2) → cargo-only drop (S34.3) → suspicion is not authority (S34.4) → own-reward once (S34.5) → partial / expiry (S34.10) → reload and re-dock (S34.6) → preservation replay (S34.8–S34.9) → UI shots and no-clip (S34.7) **before merge**.
4. **Number Three** adds/runs S34 after that later slice. Keep S4–S33 green. Do not weaken S18.18.

| Who | What they score | When |
| --- | --- | --- |
| **Referee / One** | All **nine** hard gates, before engine | This brief |
| **Number 2** | Gates **1, 2, 3, 4** | This brief |
| **Number Four** | Gates **1, 2, 5, 6, 7** | This brief; gate 7 evidence is the later engine PR |
| **Number Three** | Probe gate **after** a later S34 slice (S34; S4–S33 and S18.18 stay green) | Not this brief |

**No Referee Pass is claimed.**

## 9. Where to read next

- This brief’s later-slice checklist: `docs/world-cargo-delivery/BM1-WORLD-CARGO-DELIVERY-ENGINE-DEPENDENCIES.md`.
- Status and changelog: `docs/BAKEOFF-STATUS.md`.
- Locked-package list: `docs/revised-development-plan.md` §16 and `docs/GUIDED-CONVERGENCE.md`.
