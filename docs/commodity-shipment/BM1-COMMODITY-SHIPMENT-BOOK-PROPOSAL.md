# BM1 commodity and shipment book

**Status:** proposal for a **read ledger** of commodity names and shipment records; no engine changes made by this document.  
**Repository:** `Artemis2028/BM1-bakeoff`  
**Planning baseline:** `bc00a867c281139faaa0cd80238072baf0482707` on `main` (26 September 2026), after header-strip polish [PR #77](https://github.com/Artemis2028/BM1-bakeoff/pull/77). S34 world cargo brief [PR #74](https://github.com/Artemis2028/BM1-bakeoff/pull/74) @ `a76acbf`. S34 `worldCargoDelivery` engine **merged** [PR #75](https://github.com/Artemis2028/BM1-bakeoff/pull/75) @ `1b579e5`. Header pending-label polish [PR #76](https://github.com/Artemis2028/BM1-bakeoff/pull/76) @ `7e8a27f`.  
**Package:** `commodityShipmentBook` (state name can change: `state.commodityShipmentBook`). **Slice:** **S35**, the next slice after S34. This is **not** a Phase 11.  
**This is a commodity and shipment book brief.** The player can open a book that lists commodity names they have actually carried or contracted, and shipment records that point at freight the game already tracks. The book does not own the hold, does not complete a contract, and does not pay.  
**Referee context:** Phase 4 engine §6 **Pass** on `7f926df`. EW #33 / #35 / #37 / #42 / #43 / #44 / #45, boarding #38 / #39, Phase 10 Dominion-first #40 / #41, flags #46 / #47, ledger #48 / #49, empty-armable #50 / #51, construction #52 / #53, HTML #54 / #55, economy #56 / #57, standing #58 / #59, dockClear #60 / #61, hygiene #62, alertsActive #63 / #64, away-team XP #65 / #66, Phase 10 roster #67 / #68, hygiene #69, Bajoran Solar Sailor #70 / #71, captains briefing #72 / #73, world cargo #74 / #75, and header polish #76 / #77 stay **locked**. Phase 10 S18.18 stays **unamended**. **No Referee Pass claimed.**  
**Companion:** `docs/commodity-shipment/BM1-COMMODITY-SHIPMENT-ENGINE-DEPENDENCIES.md` (hooks, risks, later S35 sketch).  
**Scoped by:** Tenth Mountain Trooper, 2026-09-26 — proposal + deps first; room scores the hard gates **before** any engine. Room-locked constraints this brief must not relax: world-cargo delivery completes only at the world; a cloaked drop of an open contract fails `cloak-not-legal` (pods stay aboard, contract stays open, pays 0); restore trusts saved `mode` and zeroes the other reward; `completionToken` restores as delivered; exactly two ROE modes and no `protect-all`; boarding stays ≤10% hull, capture XOR scuttle, tractor ≠ board. Selling captured or prize goods is **out of scope** (the separate alt item; it needs its own capture-rules brief).

Phases 1–10 and the later subscribe packages already landed. The player hold is `state.cargoArray` (ten pods). Accepted freight is `state.openContracts`. World-body completion, cloak refusal, and deliver-once live on `state.worldCargoBook` (`src/world-cargo-delivery.js`, S34, #75). Shop stock and loose-cargo sale live on `state.marketBook` (Phase 8). None of those stores is a book the captain opens to read “what this good is” beside “which shipment it belongs to” without also being the payer. This brief opens that gap as a **scoreable read ledger**. It does **not** reopen those locks and does **not** claim a Referee Pass.

This is **one** docs brief: publish what a commodity entry is, what a shipment record is, how each relates to pods and world-cargo contracts, what the player sees, how save and restore treat an old slot, and how the book does not write standing, cloak, or delivery. A book row is not a firing solution, not a third ROE, not `engagement_authorized`, not a standing write, not a customs stamp, not a payout, and not a prize-goods shop. It is not a remastered `git am`.

**This PR ships proposal + engine-deps only.** A later thin **subscribe module** (S35), if Tenth scopes it after a brief score, is the natural later deliverable. This brief does **not** ship that module and does **not** edit `src/`.

## 1. The result we want

A later writer can treat the book the way the briefing archive treats a filed snapshot: the captain reads a copy of freight the game already holds, and reading it cannot deliver, pay, clear inspection, or change standing.

**Exit condition:** the eight hard gates in §2 are scoreable; the entry, the record, the panel, and the save rule in §3 are the contract; #33–#77 and the landed S34 rules stay closed; no Referee Pass from this PR.

**Proposed first-release decisions:**

| Question | Proposed answer |
| --- | --- |
| What is the first playable slice? | **Docs-only** scoreable contract under `docs/commodity-shipment/`. **This PR does not ship engine.** A later thin subscribe module (S35), **if** Tenth scopes it after a brief score, records §3. Name can change (`state.commodityShipmentBook`). |
| Is a thin subscribe module the natural later deliverable? | **Yes.** Analog: `src/briefing-archive.js` (sibling book, no campaign rewrite) beside `src/world-cargo-delivery.js` (the freight authority this book **reads**). S35 **reads** pods, `openContracts`, and `worldCargoBook`. It **writes only** the commodity book. |
| What is a commodity entry? | A name-keyed row. The key is the good’s display string as already stored on a player pod (`pod.item`) or a player contract (`openContracts[].goods` or `worldCargoBook.contracts[].good`). It is not a weapon, not a hull from `itemtext.json`, not a market price, and not a standing tier. |
| What is a shipment record? | One display row per existing player freight **contract id**. It points at that id. It copies route and status for reading. It does not own pods, tons, or payout. |
| How does it relate to world cargo? | If that id is in `worldCargoBook`, the shipment row’s status, `mode`, and `lastAttempt.reason` are a **copy** of that contract. The world-cargo contract remains the authority. On disagreement, the world-cargo contract wins and the next index pass overwrites the copy. |
| How does it relate to pods? | A pod matches the shipment when `pod.contractId` equals the shipment’s contract id, the same way `podMatches` already matches a world-cargo contract. The hold stays `cargoArray`. Indexing does not call `clearCargoPod`, `addCargoToPods`, or `removeCargoFromPods`. |
| What does the player see? | A sibling panel: commodity names, shipment rows (good, tons, origin, destination, copied status), and a detail line. No Deliver control. No Sell control. Delivery stays on `#world-cargo` and on the landed dock / drop actions. |
| Save? | Sibling key `commodityShipmentBook` on the existing 3-slot save, **outside** `systemStates`. Missing key → empty book. Restore does not pay, does not enroll world cargo, and does not rewrite `mode` or `completionToken`. `SAVE_SLOT_COUNT` stays **3**. |
| Standing? | **No write.** The book does not call `adjustFactionStanding` or `creditWorthwhileTrip`. The landed open-delivery +3 stays inside world cargo only. |
| Cloak? | **No write.** The book does not read `isHullCloaked` in order to complete, retag, or clear. It may **show** `mode`, `deliveredCloaked`, and a stored `cloak-not-legal` reason. Silent running is still not a cloak. |
| Delivery? | **Unchanged.** This book never calls `completeWorldCargo`, `dropWorldCargo`, `noteStationNotWorld`, `expireDueContracts`, `deliverContractIfPossible`, or `tradeAtPlanet`. |
| Prize / captured goods? | **Out.** No sale, no new commodity class, no copy of a prize hull’s cargo onto the player hold. That is the separate alt item. |
| May we reopen #33–#77 or relax S34? | **No.** Touched systems in §4 stay **unchanged**, including the #75 restore rules. |
| May we `git am` remastered or invent remastered ids / prices? | **No.** `COMMODITY_SHIPMENT_LOCKED_FROM_REMASTERED === false`. Every existing `*_LOCKED_FROM_REMASTERED` stays false. |
| Must a later engine PR prove the UI? | **Yes.** The standing UI gate: baseline and after screenshots, plus a no-clip check at 1280×720 with `clippedControls: []`, `occluders: []`, and `pillOverlaps: []`. Text and controls fit their boxes. This docs PR attaches no PNGs. |
| Is this a Referee Pass? | **No.** Referee / One score the hard gates **before** any engine. Number Three probes only after a later S35 slice. |

These are recommendations for this package, not new decisions attributed to the user beyond the room locks. Locked bake-off constraints take precedence over any wish that the book complete freight, that a cloak become legal by being written down, or that a captured hull’s hold become a shop.

Cite landed stores as the sources this brief **subscribes to**, not as a second spec:

| Planning source | This brief |
| --- | --- |
| `state.tradeGoodsArray` from `normalizeTradeGoods` / `data/game_items.json` `tradeGoods`; fallback `DEFAULT_TRADE_GOODS` | Gate 1. Names already on a pod or contract may be recorded. The book does not edit the JSON or the array. |
| `itemtext.json` hull rows; `game_items.json` `weapons` | Gate 1. Not commodities. |
| Hold `cargoArray`; `clearCargoPod`; ten slots; `cargoCap` | Gate 2. Read pods. Do not resize, refill, or clear them from this book. |
| `openContracts` / `normalizeContract` / `getContractTotal` | Gates 2 and 3. A shipment id is a contract id. Payout stays on the contract. |
| `worldCargoBook` (#74 / #75): world-body completion, `cloak-not-legal`, mode-trust restore, `completionToken` → `delivered` | Gate 3. Copy for display. Do not rewrite. Do not relax. |
| Phase 8 `marketBook`, `applyShopBuy` / `applyShopSell`, loose pods (`destination === undefined`) | Gates 1 and 5. No second market. Loose cargo is not a shipment under the §7 default. |
| Standing tiers (#58 / #59); open +3 via `creditWorthwhileTrip` inside world cargo only | Gate 4. No standing write from this book. |
| Phase 6 `isHullCloaked`; silent ≠ cloak | Gate 4. Display a stored reason. Do not complete from cloak. |
| Phase 2 `ROE_MODES` (`return-fire`, `defend`); `offersProtectAll() === false` | Gate 5. |
| Boarding #38 / #39: ≤10% hull; capture XOR scuttle; tractor ≠ board; prize identity | Gate 5. No prize sale. No new boarding start. |
| Save slots: `SAVE_SLOT_COUNT = 3`; books outside `systemStates` | Gate 6. |
| Phase 9 / dockClear / header-strip no-clip (1280×720; `clippedControls`, `occluders`, `pillOverlaps`) | Gate 7. Engine-PR merge gate. Do not reopen dockClear or the header strip. |

## 2. Locked constraints (do not reopen)

The bake-off room locked world cargo, ROE, standing, and boarding before this brief. Implementation and probes must treat **gates 1–8** as **hard gates**. Referee / One score this brief against those **eight** **before** any engine PR. Number Three probes only after a later S35 slice. EW / boarding / Dominion-first / roster / flags / ledger / empty-armable / construction / HTML / economy / standing / dockClear / hygiene / alertsActive / away-team XP / sailor / briefing / world-cargo / header-strip gates stay **closed**; they are restated only as **gate 8** (preserve / do-not-open), not as a reopen. This docs PR **does not** claim a Referee Pass.

### Hard gate 1 — A commodity entry is a name, not a market

> A commodity entry’s identity is the good’s **name string**. The string is one already stored on a player pod (`pod.item`, and not the empty-pod placeholder `'Nothing'`) or on a player contract (`goods` / world-cargo `good`). The landed catalog of trade-good names is `state.tradeGoodsArray`: `normalizeTradeGoods` reads `data/game_items.json` `tradeGoods` (a string list; no prices), and if that list is missing the fallback is `DEFAULT_TRADE_GOODS` (`Medical Supplies`, `Food Stuffs`, `Warp Coils`, `Dilithium`, `Raw Latinum`). `itemtext.json` rows are hulls. `game_items.json` `weapons` are weapons. Neither becomes a commodity entry. An entry stores the name and a seen-from tag (`pod` or `contract`). It does **not** store a price, stock, demand, restriction, standing minimum, or a contraband clearance. Creating or restoring an entry does not change `tradeGoodsArray`, does not edit `game_items.json`, and does not call `applyShopBuy` or `applyShopSell`. The string `Warp Cores` in `tradeGoods`, if it is already on a pod or contract, is a commodity **name**. It is not the deferred Warp Core utility (ledger §6.2). A later slice that files a weapon, a hull, a price, or a standing tier as a commodity **fails**.

Lane owner (wording): **Number Four** on the key; **Number 2** on “not a market.”

**Pass:** a pod whose `item` is `Medical Supplies` indexes one entry keyed `Medical Supplies`, with no `price` field that the shop would read. Indexing leaves `marketBook` stock, demand, and price unchanged, and leaves `tradeGoodsArray` unchanged. A weapon id and an `itemtext.json` hull name do not appear as entries.  
**Fail:** the book writes a price, restocks a market, appends a name to `tradeGoodsArray`, or lists a weapon or a hull as a commodity.

### Hard gate 2 — A shipment record indexes freight; it does not own the hold

> A shipment record’s id is an existing player contract id (`openContracts[].id` and, when enrolled, `worldCargoBook.contracts` key). The record may copy `good`, `tons`, `originIndex`, `targetIndex`, `targetName`, world-cargo `status`, `mode`, and `lastAttempt.reason` for display. Tons on the record are a copy. The authority for tons is the matching pod on `state.cargoArray` while the pod exists, and the contract’s `tons` field for what was accepted. Indexing does not add a pod, clear a pod, change `cargoCap`, change the ten-slot empty shape (`tons: 0`, `item: 'Nothing'`, `destination: undefined`, `payout: 0`), or call `restoreMissingContractCargo`. A pod matches a shipment only by the landed rule: `contractId` matches, and for a world-cargo id the good and destination index still have to match that contract before anyone may treat the pod as that freight. The book does not invent a second match that would let a loose pod satisfy a contract. A later slice that moves tons, refills a delivered pod, or treats the shipment row as the hold **fails**.

Lane owner (wording): **Number Four**.

**Pass:** after indexing an accepted contract, `cargoArray` deep-equals the pre-index pods, `cargoCap` is unchanged, and the shipment id equals the contract id. Deleting the shipment row (a probe) leaves the pods and the world-cargo contract in place.  
**Fail:** indexing changes any pod field, slot count, or `cargoCap`, or a shipment id that is not a contract id is paid.

### Hard gate 3 — World-cargo delivery stays exactly as landed

> This book does not deliver and does not relax S34. Delivery still completes only at the destination world, under the #74 / #75 rule: loaded system equals `targetIndex`, distance ≤ `getPlanetDockDistance`, mode action matches, `dockedStationId` is null, full tons. Station hail and station dock do not complete. Warp arrival does not complete a book-owned world-cargo id. A cloaked drop of an **open** contract fails `cloak-not-legal`: pods stay aboard, status stays `open`, latinum delta is 0, and the once-token is not written. A covert contract still pays only that contract’s `covertReward` while `isHullCloaked` is true. Uncloaked covert still fails `uncloaked-not-covert`. Restore still trusts a saved `mode` of `open` or `covert` and zeroes the other reward. A valid `completionToken` (`world-cargo:${id}`) still restores as `delivered`. `inspectionCleared` and `customsCleared` still restore false. Indexing, selecting, and restoring **this** book do not call `completeWorldCargo`, `dropWorldCargo`, `expireDueContracts`, `deliverContractIfPossible`, or `tradeAtPlanet`, and do not write `worldCargoBook` status, `mode`, `legalPayout`, `covertReward`, or `completionToken`. A later slice that completes from the commodity panel, pays from a shipment row, retags `open` to `covert`, or lets a cloaked open-contract drop succeed **fails**.

Lane owner (wording): **Number 2** on legal versus covert; **Number Four** on “the book is not the payer.”

**Pass:** with an open world-cargo contract in the destination radius, opening the commodity book and selecting that shipment leaves status `open`, pods aboard, and latinum unchanged. The same fixture’s cloaked drop still returns `cloak-not-legal` and pays 0. A save whose world-cargo row has `mode: 'open'` and both reward figures set still restores `covertReward` 0. A save whose `completionToken` is `world-cargo:${id}` still restores `delivered`.  
**Fail:** any commodity-book call changes world-cargo status, pays latinum, moves a pod, or makes `cloak-not-legal` succeed.

### Hard gate 4 — No standing write; cloak is not customs

> Recording a commodity, recording a shipment, selecting a row, or restoring the book never changes standing. The book does not call `adjustFactionStanding` or `creditWorthwhileTrip`. The only standing the open world-cargo path may still write is the landed +3 once, inside world cargo’s own completion, token `world-cargo:${id}`. This package does not call that path. A covert drop still writes standing 0. The book does not set `inspectionCleared`, `customsCleared`, `compliance_verified`, `access_clearance`, or `inspection_order_active`. It does not call `closeEncounter`. It does not assign `contraband` to false. It does not read `isHullCloaked` to complete or to retag `mode`. It may display a reason the world-cargo contract already stored, including `cloak-not-legal` and the landed sentence that inspection was not cleared. Display is not clearance. Silent running is not a cloak. A later slice that changes `factionStanding` from the book, or that clears inspection because the captain read the row, **fails**.

Lane owner (wording): **Number 2**.

**Pass:** before/after index, select, and restore, `factionStanding` is deep-equal, world-cargo cleared flags are false, and `deriveEncounterFacts` is unchanged. A displayed `cloak-not-legal` line does not set `delivered` on an open contract.  
**Fail:** any standing delta, any cleared flag, any encounter write, or a displayed cloak reason that completes the contract.

### Hard gate 5 — No fire, no third ROE, no boarding change, no prize sale

> The book never grants fire, `firingSolution`, `engagement_authorized`, an ROE change, or pursuit. `ROE_MODES` stays `['return-fire', 'defend']`. `offersProtectAll()` stays false. Do **not** add `protect-all`. `consultDoctrineFire` is not called. Boarding rules stay the landed rules: a boarding attempt still requires combat hull at or under 10% of max; one attempt is still capture XOR scuttle; `tractorIsBoarding()` stays false. The book does not start a boarding, does not scuttle, and does not transfer command. Selling captured or prize goods is **out of scope**. The book has no sell-prize control, no prize-goods price, and no path that copies a captured hull’s cargo onto `state.cargoArray`. Cargo a prize hull already carries under the landed identity preserve stays on that hull. It is not indexed as a player shipment and it is not sold here. The alt item needs its own capture-rules brief before any sale exists. A later slice that adds a ROE mode, boards from the book, or sells prize cargo **fails**.

Lane owner (wording): **Number 2** on fire and prize sale; **Number Four** on hull% / XOR / tractor.

**Pass:** before/after using the book, `ROE_MODES` is the two landed modes, `offersProtectAll` is false, `tractorIsBoarding()` is false, and no prize-hull cargo array was copied onto the player hold. The panel has no control whose action sells a captured good.  
**Fail:** a third ROE, `protect-all`, a boarding start, a tractor-is-board flip, or any latinum gain from prize cargo.

### Hard gate 6 — Old saves load an empty book and do not rewrite world cargo

> Old saves that lack `commodityShipmentBook` load as an empty book (no throw, no payout, no backfill of completions, no invented `delivered` rows). The empty restore does not scan `openContracts` or `cargoArray` by itself. A separate index pass may run **after** load, only once world-cargo restore has already finished, and that pass only copies ids already present. It does not pay, does not call world-cargo completion, and does not change `mode`, rewards, or `completionToken`. The book lives **outside** `systemStates`, on the save payload key `commodityShipmentBook`. `SAVE_SLOT_COUNT` stays **3**. Slot keys stay `bm2_html_save_slot_` + slot. No fourth slot. No second storage key. A tampered shipment field that looks like a payable (`legalPayout`, `covertReward`, `payout`) is not paid on restore. `resetRunState` / new game clears the book. Load does not replay jumps and does not auto-deliver. A later slice that throws on a pre-book save, pays from restore, nests the book under `systemStates`, or rewrites a world-cargo token **fails**.

Lane owner (wording): **Number Four**.

**Pass:** `restore(undefined)` returns empty `commodities` and empty `shipments`, latinum delta 0, standing delta 0. Slot count stays 3. A save payload’s `systemStates` does not contain the book. Restoring a fixture world-cargo contract with `mode: 'covert'` and a positive `legalPayout` still yields `legalPayout` 0 on the **world-cargo** book, whether or not a commodity book is restored beside it. A `completionToken` of `world-cargo:${id}` still restores that world-cargo row as `delivered` without a second pay.  
**Fail:** a missing key throws, restore pays, the book sits inside `systemStates`, or world-cargo mode-trust / token restore changes because this book loaded.

### Hard gate 7 — Standing UI gate

> Commodity and shipment text and controls must fit their boxes. Designated boxes (names can change): host `#commodity-shipment`, commodity list `.commodity-entries`, shipment list `.shipment-records`, detail `.commodity-shipment-detail`. The detail must be able to show a commodity name and a shipment route, including a copied world-cargo status of `open` and a copied `cloak-not-legal` reason when that reason is already stored. Measure at **1280×720** with the no-clip rule now used on this tip: `clippedControls: []`, `occluders: []`, and `pillOverlaps: []` on those designated boxes and on the header pills the new panel could cover. No horizontal overflow of the designated box. The host’s bottom stays above `.bottom-dock`, or the lists use contained `overflow-y: auto` inside a host that itself clears the dock. Text and controls fit their boxes: do not pass by clipping the good name, the destination, or the status word. Do not reopen dockClear CSS. Do not restyle the header strip (#76 / #77) to satisfy this gate. **Engine-PR merge gate:** the later S35 engine pull request **must not merge** unless it attaches **baseline and after screenshots** of this book, plus a **no-clip check** at 1280×720 whose JSON shows `clippedControls: []`, `occluders: []`, and `pillOverlaps: []`. The after shot shows at least one commodity entry and one shipment record. Faction standing totals in the after shot equal the baseline totals (this book does not write them). This docs PR attaches **no** PNGs. An engine PR that lands the panel without those shots, or with a non-empty array, **fails** this gate.

Lane owner (wording): **Number Four** (process).

**Pass (engine PR only):** baseline shot, after shot with a commodity name and a shipment row visible and unclipped, plus overflow JSON at 1280×720 with `clippedControls: []`, `occluders: []`, `pillOverlaps: []`. Standing totals unchanged between the two shots.  
**Fail:** missing baseline or after shot, a non-empty clip / occluder / pill-overlap array, text or a control outside its box, or a standing total that moved because the panel opened.

### Hard gate 8 — Do not reopen #33–#77; blind bake-off

> Do **not** reopen any lock from #33 through #77. Touched systems below are **read, then left unchanged**. Do **not** amend S18.18. Do **not** retune `game_items.json`, EW magnitudes, boarding odds, Flash prices, market magnitudes, Phase 5 tier ordering, the sailor catalog, world-cargo payout math, or the header strip. Do **not** consult, copy, cherry-pick, or `git am` from any other repository, in particular `BM1-remastered-work`. Do **not** invent remastered good ids, ton prices, or shipment tables. `COMMODITY_SHIPMENT_LOCKED_FROM_REMASTERED === false`. Every existing `*_LOCKED_FROM_REMASTERED` stays **false**, including `WORLD_CARGO_LOCKED_FROM_REMASTERED`, `BRIEFING_ARCHIVE_LOCKED_FROM_REMASTERED`, and `BAJORAN_SOLAR_SAILOR_LOCKED_FROM_REMASTERED`. Flipping any remastered-lock to true **fails**.

Lane owner (wording): **Referee / One**.

**Pass:** the new flag is false, every prior remastered-lock flag is false, a preservation replay (S4–S34, doctrine, Phase 10 including S18.18) stays green, and the module cites `docs/commodity-shipment/` plus landed bake-off helpers only.  
**Fail:** a remastered patch, a copied remastered id or price, a lock flag set true, or an edited S34 completion rule.

#### Touched but unchanged

| System | What S35 may read | What stays unchanged |
| --- | --- | --- |
| Cargo hold (`src/main.js`) | Pod `item`, `tons`, `destination`, `destinationIndex`, `contractId`, `payout` | `cargoCap`, ten-slot schema, `addCargoToPods`, `removeCargoFromPods`, `clearCargoPod`, `tradeAtPlanet` |
| `openContracts` | `id`, `goods`, `tons`, route, `payPerTon` as display | `normalizeContract`, accept, decline, `getContractTotal` as the payer |
| World cargo (#74 / #75) | Contract fields after S34 has written them, including `cloak-not-legal` | `completeWorldCargo`, `dropWorldCargo`, `restoreWorldCargoBook` mode-trust and token rule, station/hail refusal, expiry |
| Phase 8 markets (#31), economy (#56 / #57) | Nothing required | Stock, demand, shop sell, jump-farm, loose-cargo sale |
| Standing tiers (#58 / #59) | A standing total, only to assert it did not change | Tier table, `evaluateWiredPurchase`, the +3 callback |
| Phase 6 cloak | Nothing required for completion | `isHullCloaked`, silent ≠ cloak, first-frame cloak |
| Phase 2 ROE | `ROE_MODES`, `offersProtectAll` | Two modes; `protect-all` stays false |
| Boarding (#38 / #39), away-team XP (#65 / #66) | `tractorIsBoarding()` to assert false | ≤10% hull, capture XOR scuttle, prize identity, no sale |
| Briefing archive (#72 / #73) | Nothing required | Cap 24 × 12, knowledge-only produce |
| Header strip (#76 / #77), dockClear (#60 / #61) | The 1280×720 no-clip **rule**, including `pillOverlaps` | Do not reflow those panels |
| Save machinery | `saveGame` / `loadGame` / `resetRunState` slot path | `SAVE_SLOT_COUNT`, prefix, world-cargo key |

### Soft gate 9 — Suites stay green (after a later slice)

> **Soft:** existing suites stay green (Phase 1 / S4–S34 / catalog / doctrine / boarding / Phase 10 / Phase 8 / Phase 9.4 / utility / weapon-ledger / empty-armable / construction / html-catalogs / economy-difficulty / standing-tiers / dock-clear / alerts-active / away-team XP / phase10-roster / bajoran-solar-sailor / briefing-archive / world-cargo / side-lane). A later S35 engine does **not** reopen those locks. Screenshot evidence is gate 7, not a waiver.

Lane owner (wording): **Number Four** (process); **Number Three** scores suite-green **after** a later slice that touches runtime — not this brief.

### Also from the room (score with the gates)

| Room lock | How this brief locks it |
| --- | --- |
| Commodity entry and shipment record defined against landed pods and contracts | Gates 1 and 2. §3. |
| Book relates to world cargo by copy, not by a second completion | Gate 3. |
| Delivery, cloak refusal, mode-trust restore, and `completionToken` stay as #75 | Gate 3. |
| No standing write; cloak is not customs | Gate 4. |
| Two ROE modes; no `protect-all`; boarding ≤10%, XOR, tractor ≠ board; no prize sale | Gate 5. |
| Old saves; three slots; book outside `systemStates` | Gate 6. |
| Standing UI gate: baseline + after shots; 1280×720; `clippedControls: []`, `occluders: []`, `pillOverlaps: []`; text and controls fit | Gate 7. |
| Do not reopen #33–#77; blind; new lock flag false | Gate 8. |
| Suites green; no Referee Pass from this PR | Soft gate 9. |

### Must not break (cite landed work)

| Locked rule | Cite | This brief / later slice must not |
| --- | --- | --- |
| World completion; station hail/dock does not complete | #74 / #75 | Complete from this panel or on warp arrival for a world-cargo id |
| Cloaked drop of an open contract is `cloak-not-legal`; pods stay; pay 0; status stays open | #75 | Treat a logged reason as a successful legal delivery |
| Restore trusts saved `mode` and zeroes the other reward | #75 `restoreOneContract` | Keep both rewards, or retag `open` to `covert` |
| `completionToken` restores as `delivered` | #75 | Drop the token or pay it again from this book |
| Open standing is only the existing +3 once-token | `creditWorthwhileTrip` inside world cargo | Call it from the commodity book |
| Two-mode ROE; `protect-all` hold | Phase 2; #6 | Add a mode |
| ≤10% hull; capture XOR scuttle; tractor ≠ board | #38 / #39 | Board, scuttle, or sell from this book |
| Three save slots; books outside `systemStates` | `saveGame` / `loadGame` | A fourth slot, or a book inside `systemStates` |
| `*_LOCKED_FROM_REMASTERED === false` | #44–#75 | Flip any remastered-lock, including the new flag |
| Header strip and dockClear | #60 / #61 / #76 / #77 | Restyle them to pass gate 7 |

### Process locks (not a change to gates 1–8)

- **Proposal first.** Do not implement the book from this text until Tenth scopes S35 after a brief score.
- **Blind bake-off.** Implement against bake-off `main` (`bc00a86` after #77), **not** remastered. From `docs/commodity-shipment/` + landed read helpers only. Do **not** `git am`.
- **#33–#77 stay locked.** S18.18 stays unamended. S34 rules stay as #75 shipped them.
- **Subscribe, do not fork.** Do not implement a second market book, a second world-cargo book, or a prize shop.
- **No Referee Pass claimed** in `docs/BAKEOFF-STATUS.md` from this PR. Status may say this brief is **in review**.
- **No `src/` edits on this PR.**

### Scoring note

Referee / One score the **eight hard gates** **before** any engine PR. Number 2 scores gates **1** (name versus price), **3** (legal versus covert, including `cloak-not-legal`), **4** (standing and cloak), and **5** (fire, ROE, prize sale). Number Four scores gates **2** (hold ownership), **3** (the book is not the payer), **6** (old saves and world-cargo restore), and **7** (fit + merge gate). Number Three probes **only after** a later S35 slice. **No Referee Pass is claimed by this docs PR.**

## 3. Data shape (gates 1–6)

**Lane owner (wording):** Number Four on the book; Number 2 on which writes would be a market, a customs stamp, or a standing change.

Names can change. The **rules** cannot. World-cargo fields below are the landed #75 fields. This book copies them. It does not redefine them.

### 3.1 Commodity entry

An entry exists only when the name is already on a player pod with `tons > 0` and `item` not `'Nothing'`, or on an accepted player contract (`openContracts` or a `worldCargoBook` contract). The §7 default does **not** pre-seed every string in `tradeGoods`.

```text
commodities[name] = {
  name,                         // the key; exact string
  seenOn: 'pod' | 'contract',   // where the index pass found it
  firstSeenAtStrategicJumps     // read of the strategic-jump count; not a deadline
}
```

No `price`, `stock`, `demand`, `restriction`, `standingMin`, `contrabandCleared`, or `sellable`. A name that is on a pod but absent from the current `tradeGoodsArray` is still recorded (old saves and fixtures). Recording it does not insert it into `tradeGoodsArray`.

### 3.2 Shipment record

One row per contract id. Loose pods (`destination === undefined` and no `contractId`) are **not** shipments under the §7 default. They remain Phase 8 shop cargo.

```text
shipments[contractId] = {
  id,                           // same as the contract id
  contractId,
  good,                         // copy of contract.goods or world-cargo good
  tons,                         // copy; hold remains authority while a matching pod exists
  originIndex,
  targetIndex,
  targetName,
  worldCargoStatus,             // null if the id is not in worldCargoBook;
                                // else copy of 'open' | 'delivered' | 'expired'
  mode,                         // null, or copy of 'open' | 'covert'
  lastAttemptReason,            // copy, including 'cloak-not-legal', or null
  inWorldCargoBook              // boolean copy
}
```

The shipment record does **not** store `legalPayout`, `covertReward`, or `payout` as fields the restore would pay. The panel may **read** `getContractTotal` or the world-cargo reward fields at render time and show the number. That read is not a second purse.

If `inWorldCargoBook` is true, `worldCargoStatus` and `mode` are overwritten from `worldCargoBook` on the next index pass. The shipment row never overwrites the world-cargo contract.

### 3.3 What the player sees

Host `#commodity-shipment` (hidden until opened). Inside it:

- `.commodity-entries` — one line per commodity name.
- `.shipment-records` — one line per shipment: good, tons, origin, destination, and the copied status. An open world-cargo row may show the stored reason when it is `cloak-not-legal`.
- `.commodity-shipment-detail` — the selected row. Selection changes `selectedId` only.

No button on this host calls delivery, drop, shop sell, or prize sale. The existing Inventory cargo-pod list, the contract offer modal, and `#world-cargo` stay the controls they already are. This panel does not replace them.

Empty book copy is a sentence that no commodity has been carried or contracted yet. That sentence is not a payout.

### 3.4 Index pass

`indexCommodityShipment(book, input)` reads `pods`, `openContracts`, and `worldCargoBook` supplied by the caller. It writes only `commodityShipmentBook`. It returns the book. It does not return a latinum delta.

Call it only **after** the landed function has returned:

- after `acceptPendingContract` has enrolled world cargo, if it did;
- after `completeWorldCargo` / `dropWorldCargo` / `expireDueContracts` have returned;
- after `loadGame` has restored world cargo.

Do not call it from inside those functions. Do not call it from `restoreWorldCargoBook`.

### 3.5 Save

```text
commodityShipmentBook = {
  version: 1,
  lockedFromRemastered: false,  // constant; restore forces false
  selectedId: null,
  commodities: { [name]: entry },
  shipments: { [contractId]: record }
}
```

`saveGame` adds `commodityShipmentBook` beside `worldCargoBook` and the other sibling books. `loadGame` restores it with the other books, not from inside `systemStates`. Missing, null, or non-object → empty book. Slot clamp stays 1..3. Loading slot 2 does not import slot 1’s book. Restore forces `lockedFromRemastered` false. Restore drops any payable fields on a shipment row. Load does not run the index pass inside the restore function; the caller may index after both restores have finished, and that index must not pay.

### 3.6 Standing, cloak, and delivery (explicit non-interactions)

| Topic | What the book may do | What it must not do |
| --- | --- | --- |
| Standing | Read `factionStanding` to show that it did not change, in a probe | Call `adjustFactionStanding` or `creditWorthwhileTrip`. Change a tier. |
| Cloak | Show `mode`, `deliveredCloaked`, and a stored `lastAttempt.reason` | Call `setPlayerCloak`. Treat silent running as cloak. Complete or retag from cloak. Clear inspection. |
| Delivery | Show copied `open` / `delivered` / `expired` | Call world-cargo completion, drop, expiry, or the legacy planet deliver. Pay `legalPayout` or `covertReward`. |
| Dock / hail | Show that status is still `open` after a station attempt the world-cargo book already refused | Record `station-not-world` itself, or treat a station as the world. |
| Prize cargo | Nothing | Copy it, price it, or sell it. |

## 4. What a later slice may change

Only if Tenth scopes S35:

- Add `state.commodityShipmentBook` and the index / serialize / restore helpers.
- Call the index pass **after** accept, after world-cargo service returns, and after load. Do not edit the service functions’ payout or status writes.
- Render `#commodity-shipment` and record the gate 7 shots.
- Expose `__BM1_PROBE__.commodityShipment` for the S35 checks.

Leave `completeWorldCargo`, `dropWorldCargo`, `restoreWorldCargoBook`, `deliverContractIfPossible`, shop sell, ROE, and boarding resolve alone.

## 5. Non-goals

- No engine, CSS, probe, or save-format code in **this** PR.
- No second market, no commodity ticker, no futures price, no shop-standing rewrite.
- No change to world-cargo completion, cloak refusal, mode-trust restore, or deliver-once.
- No `protect-all`. No third ROE. No pursuit grant. No gifted `firingSolution`.
- No boarding change. No sale of captured or prize goods. No new capture rule.
- No playable unlock, no `rosterPlayable` flip, no hidden Dominion reveal.
- No fourth save slot. No book inside `systemStates`.
- No dockClear reopen. No header-strip restyle.
- No remastered ids, prices, or `git am`.
- No Referee Pass.

## 6. Acceptance exercises (S35 sketch)

Keep Phase 1 / S4–S34 / doctrine / catalog / boarding / Phase 10 green. **S18.18 stays unamended.** Add **S35** only **after** Tenth scopes a later thin subscribe module. IDs are a sketch; do not promise a final count. **This docs PR does not add S35 to the probe.**

| ID | Exercise | Pass picture |
| --- | --- | --- |
| **S35.1** Name, not a price | Index a pod of `Medical Supplies`. Entry key is that name. `marketBook` prices unchanged. A weapon name is absent. | Gate 1. |
| **S35.2** Index is not the hold | Index an accepted contract. Pods and `cargoCap` unchanged. Shipment id is the contract id. | Gate 2. |
| **S35.3** Does not deliver | Open the book at the destination world. Status stays whatever world cargo already had. Cloaked drop of an open contract is still `cloak-not-legal`, pods aboard, pay 0. | Gate 3. |
| **S35.4** Restore still trusts mode and token | Saved `mode: 'open'` with both rewards restores `covertReward` 0. Saved `completionToken` restores `delivered` on the world-cargo book. Commodity restore does not pay. | Gates 3 and 6. |
| **S35.5** Standing and cloak | Index, select, restore: standing deep-equal, cleared flags false, encounter facts unchanged. | Gate 4. |
| **S35.6** No prize sale, no third ROE | `ROE_MODES` length 2. `offersProtectAll` false. `tractorIsBoarding()` false. No sell-prize control. Player `cargoArray` did not gain a prize hull’s pods. | Gate 5. |
| **S35.7** Old save | `restore(undefined)` empty. Slots stay 3. Book not in `systemStates`. | Gate 6. |
| **S35.8** UI merge gate | Baseline + after shots. Overflow JSON `clippedControls: []`, `occluders: []`, `pillOverlaps: []`. Standing totals unchanged. | Gate 7. |
| **S35.9** Blind | `COMMODITY_SHIPMENT_LOCKED_FROM_REMASTERED === false`. Existing remastered-locks still false. S34 tests still pass. | Gate 8. |

## 7. Open questions

These are **not** locked doctrine. The scoreable default is what a probe may use until Tenth amends the row. A later engine that picks a different answer still has to pass gates 1–8.

| ID | Question | Scoreable default until Tenth amends |
| --- | --- | --- |
| Q1 | Seed every `tradeGoods` string at new game, or only names already on a pod or an accepted contract? | **Only names already on a pod or an accepted contract.** Do not pre-seed the JSON list. Phase 8 already refused a galaxy-wide ticker. This default is not a new price table. |
| Q2 | Do loose pods (no `contractId`, `destination === undefined`), including shop buys and world-cargo expiry leftovers, get shipment records? | **No.** They stay shop cargo. Expiry still clears `contractId` and sets pod `payout` to 0 inside world cargo. This book does not adopt them. |
| Q3 | Is there a retention cap on delivered or expired shipment rows? | **Not locked.** Open shipments are not evicted. Briefing archive’s cap of 24 is **not** copied as a lock. Unbounded history is an open risk. Tenth should set a cap before an engine ships if the list must be bounded. |
| Q4 | After world cargo marks `delivered` or `expired`, does the shipment row stay? | **Yes, as a copy.** The next index pass overwrites status from `worldCargoBook`. The copy cannot be paid. |
| Q5 | Which DOM ids host the panel? | `#commodity-shipment`, `.commodity-entries`, `.shipment-records`, `.commodity-shipment-detail`. Not inside `#world-cargo`. Not a rewrite of the Inventory pod list. |
| Q6 | May the panel show `legalPayout`, `covertReward`, or `getContractTotal`? | **Yes, as a read at render time.** The shipment record does not store a payable field. A tampered payable on the saved row is ignored. |
| Q7 | When does the index pass run? | **After** accept, after world-cargo service returns, and after load. Never inside `restoreWorldCargoBook` or the completion functions. |
| Q8 | Cargo that boarding left on a prize hull, not on `state.cargoArray`? | **Out of scope.** Not indexed. Not sold. The alt capture-rules brief owns any sale. |
| Q9 | May an entry remember a price the player once saw? | **No, not in this slice.** A remembered price would be a second market. |

## 8. Suggested order if a later slice is scoped

1. **Brief score.** Referee / One score the **eight** hard gates. Do not open an engine PR on this document alone.
2. **Tenth scopes** a later thin subscribe module **or** leaves this as docs-only. Blind implement from `docs/commodity-shipment/` against bake-off `main` after #77 (`bc00a86`). Do not crib remastered.
3. **Suggested order if scoped:** name-only entries (S35.1) → index does not touch pods (S35.2) → book does not deliver and `cloak-not-legal` still fails closed (S35.3) → mode-trust and token restore unchanged (S35.4) → standing and cloak unchanged (S35.5) → no prize sale and no third ROE (S35.6) → empty old save (S35.7) → preservation replay (S35.9) → UI shots and no-clip (S35.8) **before merge**.
4. **Number Three** adds/runs S35 after that later slice. Keep S4–S34 green. Do not weaken S18.18 or the world-cargo tests.

| Who | What they score | When |
| --- | --- | --- |
| **Referee / One** | All **eight** hard gates, before engine | This brief |
| **Number 2** | Gates **1, 3, 4, 5** | This brief |
| **Number Four** | Gates **2, 3, 6, 7** | This brief; gate 7 evidence is the later engine PR |
| **Number Three** | Probe gate **after** a later S35 slice (S35; S4–S34 and S18.18 stay green) | Not this brief |

**No Referee Pass is claimed.**

## 9. Where to read next

- This brief’s later-slice checklist: `docs/commodity-shipment/BM1-COMMODITY-SHIPMENT-ENGINE-DEPENDENCIES.md`.
- Landed freight rules this book must not relax: `docs/world-cargo-delivery/BM1-WORLD-CARGO-DELIVERY-PROPOSAL.md` and `src/world-cargo-delivery.js`.
- Status and changelog: `docs/BAKEOFF-STATUS.md`.
- Locked-package list: `docs/revised-development-plan.md` §16 and `docs/GUIDED-CONVERGENCE.md`.
