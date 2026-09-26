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

**Exit condition:** the fourteen hard gates in §2 are one scoreable list. Doctrine, engine, and red-team asks are merged into that list. A duplicate ask is not a second gate. The entry, the record, the panel, and the save rule in §3 are the contract. #33–#77 and the landed S34 rules stay closed. No Referee Pass from this PR.

**Proposed first-release decisions:**

| Question | Proposed answer |
| --- | --- |
| What is the first playable slice? | **Docs-only** scoreable contract under `docs/commodity-shipment/`. **This PR does not ship engine.** A later thin subscribe module (S35), **if** Tenth scopes it after a brief score, records §3. Name can change (`state.commodityShipmentBook`). |
| Is a thin subscribe module the natural later deliverable? | **Yes.** Analog: `src/briefing-archive.js` (sibling book, no campaign rewrite) beside `src/world-cargo-delivery.js` (the freight authority this book **reads**). S35 **reads** pods, `openContracts`, `worldCargoBook`, and the landed per-world market. The index pass **writes only** the commodity book. A later buy or sell, if scoped, may move that landed market by the gate 13 step. It does not write a second stock list. |
| What is a commodity entry? | A name-keyed row. The key is the good’s display string as already stored on a player pod (`pod.item`) or a player contract (`openContracts[].goods` or `worldCargoBook.contracts[].good`). It is not a weapon, not a hull from `itemtext.json`, not a market price, and not a standing tier. |
| What is a shipment record? | One display row per existing player freight **contract id**. It points at that id. It copies route and status for reading. It does not own pods, tons, or payout. |
| How does it relate to world cargo? | If that id is in `worldCargoBook`, the shipment row’s status, `mode`, and `lastAttempt.reason` are a **copy** of that contract. The world-cargo contract remains the authority. On disagreement, the world-cargo contract wins and the next index pass overwrites the copy. |
| How does it relate to pods? | A pod matches the shipment when `pod.contractId` equals the shipment’s contract id, the same way `podMatches` already matches a world-cargo contract. Trade goods and delivery pods share one hold: `cargoArray` and `cargoCap`. There is no second hold. A purchase that does not fit is refused. Indexing does not call `clearCargoPod`, `addCargoToPods`, or `removeCargoFromPods`. |
| What does the player see? | A sibling panel: commodity names, shipment rows (good, tons, origin, destination, copied status), and a detail line. No Deliver control. No Sell Prize control. Delivery stays on `#world-cargo` and on the landed dock / drop actions. The host does not overlap `#phase10-readout`, `#world-cargo`, or `#bottom-dock`. |
| Save? | Sibling key `commodityShipmentBook` on the existing 3-slot save, **outside** `systemStates`. Missing key → empty book on every slot. The book has a fixed maximum size. A hand edit cannot mint goods or credits. Restore does not pay, does not enroll world cargo, and does not rewrite `mode` or `completionToken`. `SAVE_SLOT_COUNT` stays **3**. |
| Standing? | **No write.** The book does not call `adjustFactionStanding` or `creditWorthwhileTrip`. It does not change alert status. The landed open-delivery +3 stays inside world cargo only. |
| Cloak? | **No write.** The book does not read `isHullCloaked` in order to complete, retag, or clear. It may **show** `mode`, `deliveredCloaked`, and a stored `cloak-not-legal` reason. Silent running is still not a cloak. |
| Delivery? | **Unchanged.** Each world-cargo contract pays at most once. A covert or cloaked delivery never earns the legal payout. This book is not a second way to collect. It never calls `completeWorldCargo`, `dropWorldCargo`, `noteStationNotWorld`, `expireDueContracts`, `deliverContractIfPossible`, or `tradeAtPlanet`. |
| Prize / captured goods? | **Out.** Every good records a source. Book-bought goods are tagged only when this book bought them. Tractoring a loose pod does not make it sellable. Boarding, prize, capture, and salvage goods are not sellable through this book until the separate salvage/capture brief locks otherwise. Smuggled cargo stays smuggled: sell-and-rebuy, a transponder spoof, and a friendly world do not launder it. `tractorIsBoarding()` stays false. |
| Finite markets? | **One settle rule on the landed market.** Each world keeps limited stock and limited demand on `marketBook`. A buy pays the post-move raised price. A sell receives the post-move lowered price and lowers demand by the tons sold. A sell at the demand floor pays 0. Stored `market.price` is clamped between a configured floor (≥ 1) and a configured cap, in the same config as the step. Book and Phase 8 shop use that same rule on that same price. Stock and demand do not refill in the trade or on load. Recovery uses a new config value in this package. `PHASE8_MAGNITUDES.tickDrift` stays 0. |
| Money machine? | **Closed.** A same-world buy-then-sell nets ≤ 0. No per-trip gain, bounded or not. A mixed book/shop round trip nets ≤ 0 and leaves the price where it started. A two-world loop cannot farm profit, stock, or a free repair. |
| Trade versus reports? | A buy, a sell, or a price move does not write or clear the contact book, delivered reports, FLASH, or the briefing archive. A market event may be an ordinary log line only. |
| Who may trade? | Dominion world and faction access is the landed pack `regionAllows` scope for `dominion-all` and `dominion-core`, the same scope spawn and purchase already use. An embargo or a price shift does not add an ROE mode, restore `protect-all`, or grant permission to engage. |
| Culture? | No commodity, price, or trade route grants culture fire, a firing solution, or `engagement_authorized`. No Phase 1 text is rewritten to explain the economy. |
| May we reopen #33–#77 or relax S34? | **No.** Touched systems in §4 stay **unchanged**, including the #75 restore rules. |
| May we `git am` remastered or invent remastered ids / prices? | **No.** `COMMODITY_SHIPMENT_LOCKED_FROM_REMASTERED === false`. Every existing `*_LOCKED_FROM_REMASTERED` stays false. |
| Must a later engine PR prove the UI? | **Yes.** Baseline and after screenshots, plus a no-clip check at 1280×720 with `clippedControls: []`, `occluders: []`, and `pillOverlaps: []`. The book does not overlap the campaign readout, the world-cargo panel, or the dock. The longest good name and world name show in full or wrap inside the row. Text and controls fit their boxes. This docs PR attaches no PNGs. |
| Where do prices and limits come from? | **Tunable config in this repository.** Not copied from `BM1-remastered`. This brief does not pick the integers and does not retune `PHASE8_MAGNITUDES`. |
| Is this a Referee Pass? | **No.** Referee / One score the hard gates **before** any engine. Number Three probes only after a later S35 slice. |

These are recommendations for this package, not new decisions attributed to the user beyond the room locks. Locked bake-off constraints take precedence over any wish that the book complete freight, that a cloak become legal by being written down, or that a captured hull’s hold become a shop.

Cite landed stores as the sources this brief **subscribes to**, not as a second spec:

| Planning source | This brief |
| --- | --- |
| `state.tradeGoodsArray` from `normalizeTradeGoods` / `data/game_items.json` `tradeGoods`; fallback `DEFAULT_TRADE_GOODS` | Gate 1. Names already on a pod or contract may be recorded. The book does not edit the JSON or the array. |
| `itemtext.json` hull rows; `game_items.json` `weapons` | Gate 1. Not commodities. |
| Hold `cargoArray`; `clearCargoPod`; ten slots; `cargoCap`; `addCargoToPods` returns false when the hold cannot take the tons | Gate 2. One shared hold. A full purchase is a refusal. Do not discard a pod to make room. Do not raise `cargoCap`. |
| `openContracts` / `normalizeContract` / `getContractTotal` | Gates 2 and 3. A shipment id is a contract id. Payout stays on the contract. |
| `worldCargoBook` (#74 / #75): world-body completion, `cloak-not-legal`, mode-trust restore, `completionToken` → `delivered`, deliver-once | Gate 3. Copy for display. Each contract pays at most once. A covert or cloaked delivery never earns `legalPayout`. This book is not a second collector. |
| Phase 8 `marketBook`: clamped `stock` / `demand`, `applyShopBuy` / `applyShopSell` (stock ±1, price unchanged today), `dealResult` and restore floor a price at 1, `tickDrift` is 0, `tickMarketBook` refuses `restockToCap`, `restockOnLoadForbidden`, `jumpMustNotReprintInfinity` | Gates 1, 13, and 14. One post-move settle rule for book and shop. No second stock table. No instant refill. No same-world per-trip gain. Do not retune `PHASE8_MAGNITUDES`. |
| Standing tiers (#58 / #59); open +3 via `creditWorthwhileTrip` inside world cargo only; `alertsActive` / `areAlertsActive` | Gate 4. No standing write. No alert-status write. |
| Phase 6 `isHullCloaked`; silent ≠ cloak | Gate 4. Display a stored reason. Do not complete from cloak. |
| Phase 2 `ROE_MODES` (`return-fire`, `defend`); `offersProtectAll() === false` | Gates 5 and 11. An embargo or a price does not add a mode. |
| Phase 4 delivered reports / FLASH; Phase 6 contact book; briefing archive `produceArrivalBriefing` | Gate 9. Trade does not write or clear them. A market event is a log line only. |
| `tractorIsBoarding()`; loose pods (`destination === undefined`); contract `contraband`; Phase 9.1 `TRANSPONDER_MODES` includes `spoof` | Gate 10. Source is recorded. Tractor, capture, salvage, and a spoof or a friendly dock do not make a lot sellable or legal. |
| Pack `regionAllows` for `dominion-all` / `dominion-core`; spawn and purchase contexts | Gate 11. No second trade map. |
| `cultureFireFromMarketForbidden`; `consultDoctrineFire`; Phase 1 identity text | Gate 12. No culture gift. No Phase 1 rewrite. |
| Boarding #38 / #39: ≤10% hull; capture XOR scuttle; tractor ≠ board; prize identity | Gate 5. No prize sale. No new boarding start. |
| Save slots: `SAVE_SLOT_COUNT = 3`; books outside `systemStates` | Gate 6. Empty on every old slot. Fixed maximum size. A hand edit does not mint goods or credits. |
| Phase 9 / dockClear / header-strip no-clip (1280×720; `clippedControls`, `occluders`, `pillOverlaps`); `#phase10-readout`; `#world-cargo`; `#bottom-dock` | Gate 7. Engine-PR merge gate. The book overlaps none of those three. Do not reopen dockClear or the header strip. |

## 2. Locked constraints (do not reopen)

The bake-off room locked world cargo, ROE, standing, and boarding before this brief. Doctrine, engine, and red-team lanes asked for further locks. Those asks are **one** numbered list below. Where two lanes said the same thing, the brief keeps **one** gate and states both wordings inside it.

| Lane ask | This list |
| --- | --- |
| Doctrine: trade never touches reports or FLASH | Gate 9 |
| Doctrine: loose cargo is not a capture/salvage bypass | Gate 10, with provenance |
| Doctrine: market access follows Dominion `dominion-all` / `dominion-core` | Gate 11 |
| Doctrine: no gifts from culture; no Phase 1 rewrite | Gate 12 |
| Engine: finite markets | Gate 13 |
| Engine: no money machine | Gate 14 |
| Engine: delivery contracts unchanged | Gate 3. Not a second delivery gate |
| Engine: save safety | Gate 6. Not a second save gate |
| Red-team: provenance, and no laundering | Gate 10. Not a second sell-back gate |
| Red-team: one shared hold | Gate 2. Not a second hold gate |
| Red-team: no standing or combat side effects | Gates 4, 5, 11, and 12. Alert status is gate 4 |
| Red-team: prices and limits are tunable config, not copied from BM1-remastered | Gate 8 |
| Red-team: UI fit, including no overlap with campaign, world cargo, or dock | Gate 7 |

Implementation and probes must treat **gates 1–14** as **hard gates**. Referee / One score this brief against those **fourteen** **before** any engine PR. Number Three probes only after a later S35 slice. EW / boarding / Dominion-first / roster / flags / ledger / empty-armable / construction / HTML / economy / standing / dockClear / hygiene / alertsActive / away-team XP / sailor / briefing / world-cargo / header-strip gates stay **closed**; they are restated only as **gate 8** (preserve / do-not-open), not as a reopen. This docs PR **does not** claim a Referee Pass.

### Hard gate 1 — A commodity entry is a name, not a market

> A commodity entry’s identity is the good’s **name string**. The string is one already stored on a player pod (`pod.item`, and not the empty-pod placeholder `'Nothing'`) or on a player contract (`goods` / world-cargo `good`). The landed catalog of trade-good names is `state.tradeGoodsArray`: `normalizeTradeGoods` reads `data/game_items.json` `tradeGoods` (a string list; no prices), and if that list is missing the fallback is `DEFAULT_TRADE_GOODS` (`Medical Supplies`, `Food Stuffs`, `Warp Coils`, `Dilithium`, `Raw Latinum`). `itemtext.json` rows are hulls. `game_items.json` `weapons` are weapons. Neither becomes a commodity entry. An entry stores the name and a seen-from tag (`pod` or `contract`). It does **not** store a price, stock, demand, restriction, standing minimum, or a contraband clearance. Creating or restoring an entry does not change `tradeGoodsArray`, does not edit `game_items.json`, and does not call `applyShopBuy` or `applyShopSell`. The string `Warp Cores` in `tradeGoods`, if it is already on a pod or contract, is a commodity **name**. It is not the deferred Warp Core utility (ledger §6.2). A later slice that files a weapon, a hull, a price, or a standing tier as a commodity **fails**.

Lane owner (wording): **Number Four** on the key; **Number 2** on “not a market.”

**Pass:** a pod whose `item` is `Medical Supplies` indexes one entry keyed `Medical Supplies`, with no `price`, `stock`, or `demand` field on that entry. Indexing leaves `marketBook` stock, demand, and price unchanged, and leaves `tradeGoodsArray` unchanged. A weapon id and an `itemtext.json` hull name do not appear as entries. A later buy may move the landed per-world price only under gate 13, and that move is not a field on this entry.  
**Fail:** the commodity entry stores a price, stock, or demand; indexing restocks a market; the book appends a name to `tradeGoodsArray`; or a weapon or a hull is listed as a commodity.

### Hard gate 2 — One shared hold; a shipment record does not own it

> Trade goods and delivery-contract pods draw from the same cargo capacity. The hold is `state.cargoArray` (ten slots) and `state.cargoCap` (default 20). There is no second hold on this book, no ghost tons, and no free capacity that only the book can see. A shipment record’s id is an existing player contract id (`openContracts[].id` and, when enrolled, `worldCargoBook.contracts` key). The record may copy `good`, `tons`, `originIndex`, `targetIndex`, `targetName`, world-cargo `status`, `mode`, and `lastAttempt.reason` for display. Tons on the record are a copy. The authority for tons is the matching pod on `state.cargoArray` while the pod exists, and the contract’s `tons` field for what was accepted. Indexing does not add a pod, clear a pod, change `cargoCap`, change the ten-slot empty shape (`tons: 0`, `item: 'Nothing'`, `destination: undefined`, `payout: 0`), or call `restoreMissingContractCargo`. When the hold is full, a purchase is refused. Landed `addCargoToPods` already returns false when `state.cargo + amount` exceeds `cargoCap`, and returns false when no slot can take the good. This package does not replace that refusal with a silent discard of another pod, and it does not use the god-mode branch that raises `cargoCap` or pushes an eleventh slot. A pod matches a shipment only by the landed rule: `contractId` matches, and for a world-cargo id the good and destination index still have to match that contract before anyone may treat the pod as that freight. The book does not invent a second match that would let a loose pod satisfy a contract. A later slice that moves tons, refills a delivered pod, discards cargo to make a purchase fit, or treats the shipment row as the hold **fails**.

Lane owner (wording): **Number Four**.

**Pass:** after indexing an accepted contract, `cargoArray` deep-equals the pre-index pods, `cargoCap` is unchanged, and the shipment id equals the contract id. A purchase whose tons would exceed `cargoCap`, or that finds no free slot, returns false and leaves every existing pod in place. Deleting the shipment row (a probe) leaves the pods and the world-cargo contract in place.  
**Fail:** indexing changes any pod field, slot count, or `cargoCap`; a full purchase deletes or overwrites another good; a second capacity appears on the book; or a shipment id that is not a contract id is paid.

### Hard gate 3 — Delivery contracts stay unchanged, and this book is not a second collector

> World-cargo contracts keep their own rules. This book does not deliver and does not relax S34. Delivery still completes only at the destination world, under the #74 / #75 rule: loaded system equals `targetIndex`, distance ≤ `getPlanetDockDistance`, mode action matches, `dockedStationId` is null, full tons. Station hail and station dock do not complete. Warp arrival does not complete a book-owned world-cargo id. Each contract pays at most once. A second dock, a reload, or a row in this book does not pay it again. A cloaked drop of an **open** contract fails `cloak-not-legal`: pods stay aboard, status stays `open`, latinum delta is 0, and the once-token is not written. A covert contract still pays only that contract’s `covertReward` while `isHullCloaked` is true. A covert delivery and a cloaked delivery never earn `legalPayout`. Uncloaked covert still fails `uncloaked-not-covert`. Restore still trusts a saved `mode` of `open` or `covert` and zeroes the other reward. A valid `completionToken` (`world-cargo:${id}`) still restores as `delivered` without a second pay. `inspectionCleared` and `customsCleared` still restore false. Indexing, selecting, and restoring **this** book do not call `completeWorldCargo`, `dropWorldCargo`, `expireDueContracts`, `deliverContractIfPossible`, or `tradeAtPlanet`, and do not write `worldCargoBook` status, `mode`, `legalPayout`, `covertReward`, or `completionToken`. The shipment row is not a purse and not a second path onto that contract. A later slice that completes from the commodity panel, pays from a shipment row, pays a contract twice, pays `legalPayout` on a covert or cloaked delivery, retags `open` to `covert`, or lets a cloaked open-contract drop succeed **fails**.

Lane owner (wording): **Number 2** on legal versus covert; **Number Four** on “the book is not the payer.”

**Pass:** with an open world-cargo contract in the destination radius, opening the commodity book and selecting that shipment leaves status `open`, pods aboard, and latinum unchanged. The same fixture’s cloaked drop still returns `cloak-not-legal` and pays 0. A covert completion pays `covertReward` only, from world cargo, and `legalPayout` stays 0. A save whose world-cargo row has `mode: 'open'` and both reward figures set still restores `covertReward` 0. A save whose `completionToken` is `world-cargo:${id}` still restores `delivered` and a second collect from this book pays 0.  
**Fail:** any commodity-book call changes world-cargo status, pays latinum, pays a contract twice, pays the legal figure on a covert or cloaked delivery, moves a pod, or makes `cloak-not-legal` succeed.

### Hard gate 4 — No standing write, no alert write; cloak is not customs

> Recording a commodity, recording a shipment, a buy, a sell, a price move, selecting a row, or restoring the book never changes standing or alert status. The book does not call `adjustFactionStanding` or `creditWorthwhileTrip`. It does not call `areAlertsActive` in order to flip it, and it does not write `alertsActive`. The only standing the open world-cargo path may still write is the landed +3 once, inside world cargo’s own completion, token `world-cargo:${id}`. This package does not call that path. A covert drop still writes standing 0. The book does not set `inspectionCleared`, `customsCleared`, `compliance_verified`, `access_clearance`, or `inspection_order_active`. It does not call `closeEncounter`. It does not assign `contraband` to false. It does not read `isHullCloaked` to complete or to retag `mode`. It may display a reason the world-cargo contract already stored, including `cloak-not-legal` and the landed sentence that inspection was not cleared. Display is not clearance. Silent running is not a cloak. A later slice that changes `factionStanding` or alert status from the book, or that clears inspection because the captain read the row, **fails**.

Lane owner (wording): **Number 2**.

**Pass:** before/after index, select, restore, a buy, and a sell, `factionStanding` is deep-equal, the alerts-active snapshot is unchanged, world-cargo cleared flags are false, and `deriveEncounterFacts` is unchanged. A displayed `cloak-not-legal` line does not set `delivered` on an open contract.  
**Fail:** any standing delta, any alert-status change, any cleared flag, any encounter write, or a displayed cloak reason that completes the contract.

### Hard gate 5 — No fire, no third ROE, no boarding change, no prize sale

> The book never grants fire, `firingSolution`, `engagement_authorized`, an ROE change, or pursuit. `ROE_MODES` stays `['return-fire', 'defend']`. `offersProtectAll()` stays false. Do **not** add `protect-all`. `consultDoctrineFire` is not called. Boarding rules stay the landed rules: a boarding attempt still requires combat hull at or under 10% of max; one attempt is still capture XOR scuttle; `tractorIsBoarding()` stays false. The book does not start a boarding, does not scuttle, and does not transfer command. Selling captured or prize goods is **out of scope**. The book has no sell-prize control, no prize-goods price, and no path that copies a captured hull’s cargo onto `state.cargoArray`. Cargo a prize hull already carries under the landed identity preserve stays on that hull. It is not indexed as a player shipment and it is not sold here. The alt item needs its own capture-rules brief before any sale exists. A later slice that adds a ROE mode, boards from the book, or sells prize cargo **fails**.

Lane owner (wording): **Number 2** on fire and prize sale; **Number Four** on hull% / XOR / tractor.

**Pass:** before/after using the book, `ROE_MODES` is the two landed modes, `offersProtectAll` is false, `tractorIsBoarding()` is false, and no prize-hull cargo array was copied onto the player hold. The panel has no control whose action sells a captured good.  
**Fail:** a third ROE, `protect-all`, a boarding start, a tractor-is-board flip, or any latinum gain from prize cargo.

### Hard gate 6 — Save safety: empty old slots, a fixed maximum, no minted goods or credits

> Old saves that lack `commodityShipmentBook` load as an empty book on **all three** slots (no throw, no payout, no backfill of completions, no invented `delivered` rows, no invented pods). The empty restore does not scan `openContracts` or `cargoArray` by itself. A separate index pass may run **after** load, only once world-cargo restore has already finished, and that pass only copies ids already present. It does not pay, does not call world-cargo completion, does not call `addCargoToPods`, and does not change `mode`, rewards, or `completionToken`. The book lives **outside** `systemStates`, on the save payload key `commodityShipmentBook`. `SAVE_SLOT_COUNT` stays **3**. Slot keys stay `bm2_html_save_slot_` + slot. No fourth slot. No second storage key. The book has a **fixed maximum size**: commodity entries, shipment rows, lot rows, and sale rows each stop at one finite cap owned by this package. The integer is tunable config in this repository. It is not copied from BM1-remastered, and it is not the briefing archive’s cap of 24 copied across as a lock. This brief does not choose the integer. Restore keeps at most that many rows and drops the rest. When a shipment map is over the cap, drop `delivered` and `expired` rows first, oldest first. Never drop an `open` shipment to make room. Dropped rows are not paid and are not turned into pods. A hand-edited save cannot mint goods or credits. A name that is only in the edited book does not become a pod. A `latinum`, `credits`, `legalPayout`, `covertReward`, or `payout` field on the book or on a shipment row is ignored. `soldByBook` without a matching `saleId` does not pay. `resetRunState` / new game clears the book. Load does not replay jumps and does not auto-deliver. A later slice that throws on a pre-book save, pays from restore, grows the book without a cap, nests the book under `systemStates`, mints a pod or latinum from a hand edit, or rewrites a world-cargo token **fails**.

Lane owner (wording): **Number Four**.

**Pass:** `restore(undefined)` returns empty `commodities`, empty `shipments`, empty `lots`, and empty `sales`, latinum delta 0, standing delta 0, and `cargoArray` unchanged, on a load of slot 1, slot 2, and slot 3. Slot count stays 3. A save payload’s `systemStates` does not contain the book. A hand-edited book with an extra good name and a latinum figure restores without that pod and without that latinum. Rows past the cap are absent after restore and were not paid. Restoring a fixture world-cargo contract with `mode: 'covert'` and a positive `legalPayout` still yields `legalPayout` 0 on the **world-cargo** book, whether or not a commodity book is restored beside it. A `completionToken` of `world-cargo:${id}` still restores that world-cargo row as `delivered` without a second pay.  
**Fail:** a missing key throws, restore pays, restore calls `addCargoToPods`, the book has no maximum, the book sits inside `systemStates`, or world-cargo mode-trust / token restore changes because this book loaded.

### Hard gate 7 — Standing UI gate

> Commodity and shipment text and controls must fit their boxes. Designated boxes (names can change): host `#commodity-shipment`, commodity list `.commodity-entries`, shipment list `.shipment-records`, detail `.commodity-shipment-detail`. The detail must be able to show a commodity name and a shipment route, including a copied world-cargo status of `open` and a copied `cloak-not-legal` reason when that reason is already stored. The host does not overlap the campaign panel (`#phase10-readout`), the world-cargo / delivery panel (`#world-cargo`), or the dock (`#bottom-dock`). Measure at **1280×720** with the no-clip rule now used on this tip: `clippedControls: []`, `occluders: []`, and `pillOverlaps: []` on those designated boxes and on the header pills the new panel could cover. No horizontal overflow of the designated box. No clipped control. The longest good name and the longest world name in the fixture show in full or wrap cleanly inside their row. Do not pass by clipping the good name, the destination, or the status word. The host’s bottom stays above `.bottom-dock`, or the lists use contained `overflow-y: auto` inside a host that itself clears the dock. Do not reopen dockClear CSS. Do not restyle the header strip (#76 / #77), `#phase10-readout`, or `#world-cargo` to satisfy this gate. **Engine-PR merge gate:** the later S35 engine pull request **must not merge** unless it attaches **baseline and after screenshots** of this book, plus a **no-clip check** at 1280×720 whose JSON shows `clippedControls: []`, `occluders: []`, and `pillOverlaps: []`. The after shot shows at least one commodity entry and one shipment record, with the longest names still readable inside the row, and with the campaign readout, the world-cargo panel, and the dock unobscured when they are open. Faction standing totals in the after shot equal the baseline totals (this book does not write them). This docs PR attaches **no** PNGs. An engine PR that lands the panel without those shots, with a non-empty array, or with an overlap of those three surfaces, **fails** this gate.

Lane owner (wording): **Number Four** (process).

**Pass (engine PR only):** baseline shot, after shot with a commodity name and a shipment row visible and unclipped, longest good and world names fully shown or wrapped inside the row, no overlap of `#phase10-readout`, `#world-cargo`, or `#bottom-dock`, plus overflow JSON at 1280×720 with `clippedControls: []`, `occluders: []`, `pillOverlaps: []`. Standing totals unchanged between the two shots.  
**Fail:** missing baseline or after shot, a non-empty clip / occluder / pill-overlap array, a clipped control, text or a control outside its box, a name cut off with no wrap, an overlap of the campaign readout, the world-cargo panel, or the dock, or a standing total that moved because the panel opened.

### Hard gate 8 — Do not reopen #33–#77; blind bake-off

> Do **not** reopen any lock from #33 through #77. Touched systems below are **read, then left unchanged**. Do **not** amend S18.18. Do **not** retune `game_items.json`, EW magnitudes, boarding odds, Flash prices, `PHASE8_MAGNITUDES`, Phase 5 tier ordering, the sailor catalog, world-cargo payout math, or the header strip. Prices, stock caps, demand caps, the per-trade price step, the recovery step, and this book’s row cap are **tunable config in this repository** when a later slice needs a number. None of those numbers is copied from `BM1-remastered` or from `BM1-remastered-work`. This brief does not set them. Do **not** consult, copy, cherry-pick, or `git am` from any other repository. Do **not** invent remastered good ids, ton prices, or shipment tables. `COMMODITY_SHIPMENT_LOCKED_FROM_REMASTERED === false`. Every existing `*_LOCKED_FROM_REMASTERED` stays **false**, including `WORLD_CARGO_LOCKED_FROM_REMASTERED`, `BRIEFING_ARCHIVE_LOCKED_FROM_REMASTERED`, and `BAJORAN_SOLAR_SAILOR_LOCKED_FROM_REMASTERED`. Flipping any remastered-lock to true **fails**.

Lane owner (wording): **Referee / One**.

**Pass:** the new flag is false, every prior remastered-lock flag is false, a preservation replay (S4–S34, doctrine, Phase 10 including S18.18) stays green, `PHASE8_MAGNITUDES` is unchanged, and the module cites `docs/commodity-shipment/` plus landed bake-off helpers only. Any new numeric limit is a config value in this repo and is not a paste from another repository.  
**Fail:** a remastered patch, a copied remastered id or price, a lock flag set true, a retuned Phase 8 magnitude, or an edited S34 completion rule.

### Hard gate 9 — Trade never touches reports or FLASH

> A buy, a sell, or a price move does not write to or clear the contact book, delivered reports, FLASH, or the briefing archive. Indexing a commodity, indexing a shipment, restoring this book, and any later sell-back that passes gate 10 do not call `listContacts` in order to add or delete a row, do not write `observerCopies` / `knownIncidentIds`, do not call the Phase 4 report path, do not call `setLog` with `band: 'flash'`, do not enqueue a `FLASH_ELIGIBLE_KINDS` row, and do not call `produceArrivalBriefing`. They do not delete a delivered report. Jamming still cannot unsend a report that already exists; this book does not clear one either. A market event may appear as an ordinary log line only (`setLog` with no flash band and no incident class). That line is never a FLASH and never a report. A later slice that files a trade as FLASH, wipes a delivered report because a price moved, or produces a briefing because a good was bought **fails**.

Lane owner (wording): **Number 2**.

**Pass:** before/after a buy, a sell, and a price move, the contact book, `knownIncidentIds`, the FLASH queue, and `briefingArchive` are deep-equal. The only new player-visible line, if any, is an ordinary log line.  
**Fail:** any contact row appears or disappears, any delivered report is added or cleared, any FLASH is queued, or the briefing archive gains or loses a row because of the trade.

### Hard gate 10 — Provenance; loose cargo is not a capture/salvage bypass; smuggled cargo is not laundered

> Every good this book records has a source. A lot indexed from a player pod records `source: 'pod'`. A lot indexed from an accepted contract records `source: 'contract'`. A lot the player bought through this book records `source: 'book-bought'` and a `saleId` this book wrote on that buy. This docs brief does not add the buy that would write `book-bought`. Indexing, a Phase 8 shop buy, world-cargo delivery, world-cargo expiry, tractor, capture, and salvage do not write `book-bought`. Tractoring a loose cargo pod does not make its goods sellable through this book. `tractorIsBoarding()` stays **false**. Tractor is not boarding, not capture, and not a sale. Sell-back accepts the player’s `book-bought` lot identified by that `saleId`, not “a lot the book itself sold.” The matching tons must actually be aboard on a pod tagged with that lot. Sell-back removes those tons and consumes the `saleId` once, the way a `completionToken` pays once. A second attempt on that `saleId` pays 0. If the pod is gone, including after Phase 8 `removeCargoFromPods`, the sale row pays 0 and is dropped, and the `saleId` stays consumed. A hand-edited or forged sale row with no matching tons aboard pays 0 and is dropped. A tampered `soldByBook: true` with no matching `saleId`, or a pod that only shares the good’s name, restores as not sellable. Until the separate salvage/capture brief locks otherwise, boarding goods, prize goods, captured goods, and salvaged goods are not sellable through this book. A contract or offer with `contraband === true` keeps that mark on the lot. Sell-and-rebuy does not clear it. A transponder claim of `spoof` (`TRANSPONDER_MODES`) does not clear it and does not retag the lot `book-bought`. Routing the same tons through a friendly world or a friendly faction does not clear it and does not make the lot a legal book sale. This gate does not replace Phase 8 `applyShopSell` / `removeCargoFromPods`, Phase 9.1 transponder, or Phase 9.2 spoof catch, and it does not add a prize-goods price. A later slice that pays latinum for a tractored loose pod, a prize hull’s cargo, a captured or salvaged lot, a name-only match, a missing pod, or a consumed `saleId`, or that clears `contraband` by a sale, a spoof, or a friendly dock, **fails**.

Lane owner (wording): **Number 2** on sell-back, provenance, and laundering; **Number Four** on `tractorIsBoarding() === false`.

**Pass:** tractor a loose pod whose `item` is a trade good. `tractorIsBoarding()` is false. The book’s `sales` map does not gain an id. The lot’s source is not `book-bought`. A sell-back of that good through the book pays 0 and does not clear the pod. A player `book-bought` lot pays only when a pod tagged with that lot still holds the sale’s tons; that pay removes those tons and consumes the `saleId`. The same `saleId` pays 0 the second time. After `removeCargoFromPods` takes that pod, the row pays 0 and is dropped. A forged sale row with no tagged pod aboard pays 0 and is dropped. A pod that merely shares the name cannot. A `contraband: true` contract stays `contraband: true` after a sell-and-rebuy attempt, after a spoof claim, and after the player is at a friendly world. Captured and salvaged cargo pay 0 through this book.  
**Fail:** `tractorIsBoarding()` becomes true, a tractored, captured, salvaged, or prize lot becomes sellable through the book, a source is missing on a recorded lot, a sale pays without the tagged tons aboard, a consumed `saleId` pays again, a forged row mints latinum, or `contraband` flips false because of a sale, a spoof, or a friendly route.

### Hard gate 11 — Market access follows the Dominion rule

> Which worlds and factions trade with the player, where the question is Dominion scope, is decided by the same `dominion-all` / `dominion-core` rule pack spawn and purchase already use. That rule is `regionAllows` in `bm-ships/catalog.mjs`: `dominion-all` allows Blender, Dominica, a context whose `region` is `dominion-core`, or a live authorized invasion or mission; `dominion-core` allows Dominica, `region === 'dominion-core'`, or that same authorized invasion or mission. Spawn reads it through `spawnPool` / `catalogSpawnContext` / `spawnIdsLive`. Purchase reads it through `catalogPurchaseContext` / `stockIdsLive` / `evaluateWiredPurchase`. This book **reads** that predicate. It does not publish a second world list, a second faction list, or a trade-only region. An unknown region still does not silently authorize. An embargo or a price shift does not add an ROE mode beyond `return-fire` and `defend`, does not bring back `protect-all`, and does not grant permission to engage (`engagement_authorized`, `mayAutoEngage`, pursuit). `embargoNoticeStandingWrite()` stays a non-attack. Phase 8 price-is-not-a-ban stays. A later slice that opens Dominica trade because a price rose, or that treats an embargo as a weapons grant, **fails**.

Lane owner (wording): **Number 2** on embargo versus permission to engage; **Number Four** on the pack predicate.

**Pass:** a world the pack would refuse for `dominion-core` ambient traffic is not given a trade right by this book. Before/after an embargo refusal and a price change, `ROE_MODES` is still the two landed modes, `offersProtectAll()` is false, and `engagement_authorized` is unchanged.  
**Fail:** a new region string, a third ROE mode, `protect-all`, or `engagement_authorized` set true because of an embargo or a price.

### Hard gate 12 — No gifts from culture

> No commodity, no price, and no trade route grants culture fire, a firing solution, or `engagement_authorized`. The book does not call `consultDoctrineFire`. It does not set `cultureFire`, `firingSolution`, or `engagement_authorized` on the player, a contact, or a deal. `cultureFireFromMarketForbidden` stays the Phase 8 refusal (a market deal does not carry the forbidden fire inject). Showing a route in `.shipment-records` does not arm it. No Phase 1 text is rewritten to explain the economy: doctrine JSON, Phase 1 political-identity copy, and the landed “who owns this world” sentences stay byte-for-byte. A price, a commodity name, or a route is not a reason to edit them. A later slice that gifts culture fire from a good, or that rewrites Phase 1 copy so a trade “makes sense,” **fails**.

Lane owner (wording): **Number 2**.

**Pass:** before/after index, a price move, and a route display, `cultureFire` is not set, `firingSolution` is unchanged, `engagement_authorized` is unchanged, and a hash of the Phase 1 doctrine text and the Phase 1 identity sentences is unchanged.  
**Fail:** any of those fire bits flips, or any Phase 1 sentence changes because of this package.

### Hard gate 13 — Finite markets

> Each world holds limited stock of each good and limited demand. That limit is the landed Phase 8 market row: `stock` and `demand` are clamped between the good’s floor and its `stockCap` / `demandCap`. This book does not publish a second stock list, a second demand list, or a price on the commodity entry. Indexing leaves `market.stock`, `market.demand`, and `market.price` unchanged. One settle rule covers every trade path at that world, the book and the Phase 8 shop, on the same stored `market.price`. A buy lowers stock and raises price by at most one configured step, then the buyer pays that post-move price. A sell raises stock, not past the cap, lowers price by at most one configured step, lowers demand by the tons sold, then the seller receives that post-move price. A same-world buy-then-sell therefore nets ≤ 0 by construction (gate 14). A sell when demand is already at its floor, or whose tons would put demand under that floor, is refused and pays 0: demand stays where it was, stock and price do not move. Stored `market.price` is clamped between a configured floor (≥ 1) and a configured cap, in the same config as the step. This brief does not choose those integers. Landed code only floors a price at 1 inside `dealResult` and on restore (`sanitizeMarket`); it does not clamp the live stored `market.price` to a cap, and `applyShopBuy` / `applyShopSell` today change stock by one unit and do not change `price`. This docs PR does not edit those functions or `PHASE8_MAGNITUDES`. A later slice fails if the book steps `market.price` while the shop still settles at the pre-move price. Stock and demand do not recover inside the trade, on load, or by snapping to cap. `tickMarketBook` still refuses `restockToCap`. `restockOnLoadForbidden` still holds. `PHASE8_MAGNITUDES.tickDrift` stays **0**. Recovery, when a later tick moves stock or demand, uses a new config value owned by this package, not `tickDrift`, and is a bounded drift, not an instant refill. A later slice that gives a world infinite stock or demand, moves price by more than the configured step, leaves stored price outside the floor and cap, pays a sell at the demand floor, refills stock or demand in the trade or on load, retunes `tickDrift`, or stores a shop price on the commodity entry **fails**.

Lane owner (wording): **Number 2** on the post-move price and the demand floor; **Number Four** on the stored clamp and the no-refill rule.

**Pass:** after index, every market row’s stock, demand, and price are unchanged. A buy of one unit leaves stock lower, stored price higher by at most one step and inside the configured floor and cap, and the latinum paid equals that post-move price. A sell leaves price lower by at most one step, inside that clamp, demand lower by the tons sold, and the latinum received equals that post-move price. Stock does not pass the cap. The next sell after demand is at its floor pays 0 and leaves demand, stock, and price unchanged. A sell of more tons than demand still above the floor pays 0 and does not move the row. Load does not restock. `tickDrift` is still 0.  
**Fail:** uncapped stock, a stored price outside the configured floor and cap, a price jump larger than one configured step, a buy or sell that settles at the pre-move price, a shop path that steps a different price from the book, a sell at the demand floor that pays, an instant refill, a `tickDrift` retune, a second price on the commodity entry, or a retune of `PHASE8_MAGNITUDES` to force the step.

### Hard gate 14 — No money machine

> No per-trip gain on a same-world round trip, bounded or not. Each trade settles at its own post-move price (gate 13): a buy pays the raised price, a sell receives the lowered price, so a same-world buy-then-sell nets ≤ 0 by construction. That is not a capped positive spread. More same-world round trips than `stockCap` still net ≤ 0 in total, and no single one of them increases latinum. The same rule binds mixed paths on that world. Book buy then Phase 8 shop sell nets ≤ 0, and shop buy then book sell nets ≤ 0. After either mixed trip the stored price is the price from before the trip. A book step that the shop does not reverse, or a shop trade that does not use the post-move price, is a price pump and **fails**. A two-world loop must not farm profit, stock, or a free repair, must not push stock above the cap, and must not refill stock the first trade consumed. `evaluateDockService` still refuses repair and refuel when holding supply is unmet. `jumpMustNotReprintInfinity` still reports `freeRepair: false`. This package does not zero a repair price, does not call a repair from a commodity row, and does not raise `salvageLatinumCap` or `transportLatinumCap`. A later slice that lets any same-world or mixed round trip increase latinum, leaves price a step away after a mixed trip, refills stock because the player flew to a second world and back, or grants a free repair from the loop **fails**.

Lane owner (wording): **Number 2**.

**Pass:** more same-world buy-then-sell trips than that market’s `stockCap` leave latinum no higher than at the start. Each of those trips nets ≤ 0. Book buy then shop sell nets ≤ 0 and the stored price equals the pre-trip price. Shop buy then book sell nets ≤ 0 and the stored price equals the pre-trip price. A two-world loop of the same good does not snap either stock to cap and does not set a repair to free. `freeRepair` stays false.  
**Fail:** any same-world or mixed trip with a positive latinum delta, a mixed trip whose price does not return, stock restored by a two-world loop, or a repair price of 0 or a repair granted because of the trade.

#### Touched but unchanged

| System | What S35 may read | What stays unchanged |
| --- | --- | --- |
| Cargo hold (`src/main.js`) | Pod `item`, `tons`, `destination`, `destinationIndex`, `contractId`, `payout`; `addCargoToPods` false when full | `cargoCap`, ten-slot schema, `removeCargoFromPods`, `clearCargoPod`, `tradeAtPlanet`. No second hold. No silent discard |
| `openContracts` | `id`, `goods`, `tons`, route, `payPerTon` as display | `normalizeContract`, accept, decline, `getContractTotal` as the payer |
| World cargo (#74 / #75) | Contract fields after S34 has written them, including `cloak-not-legal` | `completeWorldCargo`, `dropWorldCargo`, `restoreWorldCargoBook` mode-trust and token rule, station/hail refusal, expiry |
| Phase 8 markets (#31), economy (#56 / #57) | Clamped stock and demand; `restockOnLoadForbidden`; `jumpMustNotReprintInfinity` | Do not retune `PHASE8_MAGNITUDES`. Do not instant-refill. Do not add a second price table. Shop sell of loose cargo stays Phase 8 |
| Standing tiers (#58 / #59); alertsActive (#63 / #64) | Standing and alert snapshots, only to assert they did not change | Tier table, `evaluateWiredPurchase`, the +3 callback, alert policy |
| Phase 6 contact book; Phase 4 reports / FLASH | Digests, to assert a trade did not write them | Contact rows, `knownIncidentIds`, FLASH queue, `FLASH_ELIGIBLE_KINDS` |
| Phase 6 cloak | Nothing required for completion | `isHullCloaked`, silent ≠ cloak, first-frame cloak |
| Phase 2 ROE; `consultDoctrineFire` | `ROE_MODES`, `offersProtectAll` | Two modes; `protect-all` stays false; no culture fire from a good |
| Phase 1 identity / doctrine text | A hash, to assert it did not change | No rewrite to explain a price or a route |
| Pack `regionAllows` (`dominion-all` / `dominion-core`) | The landed spawn/purchase predicate | No trade-only region. No ambient core authorization |
| Boarding (#38 / #39), away-team XP (#65 / #66); Phase 9.1 transponder; Phase 9.2 spoof | `tractorIsBoarding()` to assert false; `contraband`; spoof claim | ≤10% hull, capture XOR scuttle, prize identity. No sale of tractored, captured, or salvaged goods. Spoof and a friendly dock do not clear `contraband` |
| Briefing archive (#72 / #73) | A digest, to assert a trade did not file one | Cap 24 × 12, knowledge-only produce. No `produceArrivalBriefing` from a buy, sell, or price |
| Header strip (#76 / #77), dockClear (#60 / #61), `#phase10-readout`, `#world-cargo` | The 1280×720 no-clip **rule**, including `pillOverlaps` | Do not reflow those panels. The book host does not cover them |
| Save machinery | `saveGame` / `loadGame` / `resetRunState` slot path | `SAVE_SLOT_COUNT`, prefix, world-cargo key |

### Soft gate 15 — Suites stay green (after a later slice)

> **Soft:** existing suites stay green (Phase 1 / S4–S34 / catalog / doctrine / boarding / Phase 10 / Phase 8 / Phase 9.4 / utility / weapon-ledger / empty-armable / construction / html-catalogs / economy-difficulty / standing-tiers / dock-clear / alerts-active / away-team XP / phase10-roster / bajoran-solar-sailor / briefing-archive / world-cargo / side-lane). A later S35 engine does **not** reopen those locks. Screenshot evidence is gate 7, not a waiver. Finite markets and the money-machine refusal are gates 13 and 14, not a retune of Phase 8.

Lane owner (wording): **Number Four** (process); **Number Three** scores suite-green **after** a later slice that touches runtime — not this brief.

### Also from the room (score with the gates)

| Room lock | How this brief locks it |
| --- | --- |
| Commodity entry and shipment record defined against landed pods and contracts | Gates 1 and 2. §3. |
| One shared hold. A full purchase is refused, not a silent discard | Gate 2. |
| Book relates to world cargo by copy, not by a second completion | Gate 3. |
| Delivery, cloak refusal, mode-trust restore, and `completionToken` stay as #75. Each contract pays at most once. Covert or cloaked delivery never earns the legal payout | Gate 3. |
| No standing write. No alert write. Cloak is not customs | Gate 4. |
| Two ROE modes; no `protect-all`; boarding ≤10%, XOR, tractor ≠ board; no prize sale | Gate 5. |
| Old saves empty on all three slots; fixed maximum size; hand edits cannot mint goods or credits; book outside `systemStates` | Gate 6. |
| UI fit: baseline + after shots; 1280×720; no overlap of campaign, world cargo, or dock; names show or wrap; `clippedControls: []`, `occluders: []`, `pillOverlaps: []` | Gate 7. |
| Do not reopen #33–#77; blind; prices and limits are tunable config, not copied from remastered; new lock flag false | Gate 8. |
| Trade never writes or clears the contact book, delivered reports, FLASH, or the briefing archive. A market event is a log line only | Gate 9. |
| Every good records a source. Sell-back is the player’s `book-bought` lot for that `saleId`, tons aboard, single-use. A missing pod pays 0 and drops the row. Tractor, capture, salvage, and prize lots are not sellable here. Smuggled cargo is not laundered. `tractorIsBoarding() === false` | Gate 10. |
| Dominion trade access is pack `dominion-all` / `dominion-core`. An embargo or a price does not add an ROE mode, `protect-all`, or permission to engage | Gate 11. |
| No culture fire, firing solution, or `engagement_authorized` from a commodity, price, or route. No Phase 1 rewrite | Gate 12. |
| Finite per-world stock and demand. Post-move settle on one price for book and shop. Stored price clamped. A sell consumes demand and pays 0 at the floor. Recovery config is this package’s, not `tickDrift`. No instant refill | Gate 13. |
| Same-world and mixed round trips net ≤ 0. No per-trip gain. Mixed trips return the price. No two-world farm of profit, stock, or free repairs | Gate 14. |
| Suites green; no Referee Pass from this PR | Soft gate 15. |

### Must not break (cite landed work)

| Locked rule | Cite | This brief / later slice must not |
| --- | --- | --- |
| World completion; station hail/dock does not complete | #74 / #75 | Complete from this panel or on warp arrival for a world-cargo id |
| Cloaked drop of an open contract is `cloak-not-legal`; pods stay; pay 0; status stays open | #75 | Treat a logged reason as a successful legal delivery |
| Restore trusts saved `mode` and zeroes the other reward | #75 `restoreOneContract` | Keep both rewards, or retag `open` to `covert` |
| `completionToken` restores as `delivered` | #75 | Drop the token or pay it again from this book |
| Open standing is only the existing +3 once-token | `creditWorthwhileTrip` inside world cargo | Call it from the commodity book |
| Two-mode ROE; `protect-all` hold | Phase 2; #6 | Add a mode |
| ≤10% hull; capture XOR scuttle; tractor ≠ board | #38 / #39; `tractorIsBoarding()` | Board, scuttle, or sell a tractored or captured lot from this book |
| Delivered reports stay; jamming cannot unsend; FLASH is not a trade ticker | Phase 4; Phase 9 | File or clear a report or a FLASH from a buy, sell, or price |
| Briefing archive is knowledge-only on arrival | #72 / #73 | `produceArrivalBriefing` from a market event |
| `dominion-all` / `dominion-core` spawn and purchase | Phase 10; `regionAllows` | A second trade map, or a price that authorizes core traffic |
| Culture fire is not a market outcome | Phase 8 `cultureFireFromMarketForbidden`; Phase 1 text | Gift `cultureFire`, `firingSolution`, or `engagement_authorized`, or rewrite Phase 1 to explain a price |
| Three save slots; books outside `systemStates`; no mint from a hand edit | `saveGame` / `loadGame` | A fourth slot, a book inside `systemStates`, an uncapped book, or restore that creates pods or latinum |
| Finite stock and demand; no instant restock; no free repair from a jump | Phase 8 `tickMarketBook`, `restockOnLoadForbidden`, `jumpMustNotReprintInfinity` | A second price table, a snap to cap, or a repair granted by a trade loop |
| One hold; full purchase returns false | `addCargoToPods` | A second capacity, or a purchase that deletes another pod |
| `*_LOCKED_FROM_REMASTERED === false` | #44–#75 | Flip any remastered-lock, including the new flag |
| Header strip and dockClear | #60 / #61 / #76 / #77 | Restyle them to pass gate 7 |

### Process locks (not a change to gates 1–14)

- **Proposal first.** Do not implement the book from this text until Tenth scopes S35 after a brief score.
- **Blind bake-off.** Implement against bake-off `main` (`bc00a86` after #77), **not** remastered. From `docs/commodity-shipment/` + landed read helpers only. Do **not** `git am`.
- **#33–#77 stay locked.** S18.18 stays unamended. S34 rules stay as #75 shipped them.
- **Subscribe, do not fork.** Do not implement a second market book, a second world-cargo book, or a prize shop.
- **No Referee Pass claimed** in `docs/BAKEOFF-STATUS.md` from this PR. Status may say this brief is **in review**.
- **No `src/` edits on this PR.**

### Scoring note

Referee / One score the **fourteen hard gates** **before** any engine PR. Number 2 scores gates **1** (name versus a second price), **3** (legal versus covert, including `cloak-not-legal` and pay-once), **4** (standing, alert, and cloak), **5** (fire, ROE, prize sale), **9** (reports and FLASH), **10** (provenance, sell-back, laundering), **11** (embargo is not permission to engage), **12** (no culture gift, no Phase 1 rewrite), **13** (the price step), and **14** (no money machine). Number Four scores gates **2** (one hold), **3** (the book is not the payer), **6** (old saves, the cap, no mint), **7** (fit + merge gate), **8** (tunable config, not a remastered paste), **10** (`tractorIsBoarding() === false` and the sale id), **11** (the pack `regionAllows` predicate, not a new list), and **13** (clamps, no instant refill). Number Three probes **only after** a later S35 slice. **No Referee Pass is claimed by this docs PR.**

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

No `price`, `stock`, `demand`, `restriction`, `standingMin`, `contrabandCleared`, or `sellable` on the entry. Per-world price, stock, and demand stay on `marketBook` (gate 13). A name that is on a pod but absent from the current `tradeGoodsArray` is still recorded (old saves and fixtures). Recording it does not insert it into `tradeGoodsArray`.

A recorded lot carries provenance (gate 10). The name entry does not.

```text
lots[lotId] = {
  lotId,
  good,                         // the commodity name
  source,                       // 'pod' | 'contract' | 'book-bought'
  contraband,                   // copy of the contract or offer flag; default false
  saleId                        // null unless this book wrote the sale
}
```

`source: 'book-bought'` is written only by a buy this book performs. This docs brief does not add that buy, so a restore of an indexed pod or contract never arrives as `book-bought`. `contraband: true` is not cleared by a later sell, a spoof claim, or a friendly world.

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
  shipments: { [contractId]: record },
  lots: { [lotId]: lot },
  sales: { [saleId]: { saleId, lotId, good, tons, soldByBook: true } }
}
```

`sales` is the only sell-back list (gate 10). An empty book has `sales` empty. A sale row names the player’s `book-bought` lot (`saleId`, `lotId`, `good`, `tons`). Sell-back pays only when a pod tagged with that lot still holds those tons, then removes them and consumes the `saleId`. Restore drops a sale row whose `soldByBook` is not true, drops a row with no matching tons aboard, and remembers a consumed `saleId` so a forged copy pays 0. Index, tractor, capture, and salvage do not insert a sale row. This brief does not add the action that would write one.

Commodity entries, shipment rows, lot rows, and sale rows each have one finite maximum (gate 6). The integer is config. It is not chosen here, not copied from remastered, and not the briefing cap of 24. Restore drops rows past the cap. Shipment overflow drops `delivered` and `expired` rows first, oldest first, and never drops an `open` shipment. It does not pay the dropped rows and does not call `addCargoToPods` for them. A `latinum` or `credits` field on the book is dropped.

`saveGame` adds `commodityShipmentBook` beside `worldCargoBook` and the other sibling books. `loadGame` restores it with the other books, not from inside `systemStates`. Missing, null, or non-object → empty book. Slot clamp stays 1..3. Loading slot 2 does not import slot 1’s book. Restore forces `lockedFromRemastered` false. Restore drops any payable fields on a shipment row. Load does not run the index pass inside the restore function; the caller may index after both restores have finished, and that index must not pay.

### 3.6 Standing, cloak, and delivery (explicit non-interactions)

| Topic | What the book may do | What it must not do |
| --- | --- | --- |
| Standing | Read `factionStanding` to show that it did not change, in a probe | Call `adjustFactionStanding` or `creditWorthwhileTrip`. Change a tier. |
| Cloak | Show `mode`, `deliveredCloaked`, and a stored `lastAttempt.reason` | Call `setPlayerCloak`. Treat silent running as cloak. Complete or retag from cloak. Clear inspection. |
| Delivery | Show copied `open` / `delivered` / `expired` | Call world-cargo completion, drop, expiry, or the legacy planet deliver. Pay `legalPayout` or `covertReward`. |
| Dock / hail | Show that status is still `open` after a station attempt the world-cargo book already refused | Record `station-not-world` itself, or treat a station as the world. |
| Prize cargo | Nothing | Copy it, price it, or sell it. |
| Reports / FLASH / briefing | An ordinary log line, with no flash band | Write or clear the contact book, a delivered report, FLASH, or `briefingArchive`. |
| Loose pod / tractor | Show the pod in Inventory as the hold already does | Write `soldByBook`. Treat tractor as boarding. Sell that lot back through this book. |
| Dominion access | Read pack `regionAllows` for `dominion-all` / `dominion-core` | Invent a trade region. Let an embargo or a price add an ROE mode or `engagement_authorized`. |
| Culture | Nothing | Set `cultureFire`, `firingSolution`, or `engagement_authorized`. Rewrite Phase 1 text. |
| Hold | Read pods | Add a second capacity. Discard a pod so a purchase fits. Raise `cargoCap`. |
| Alerts | Read the snapshot in a probe | Write `alertsActive` or flip `areAlertsActive`. |
| Finite market | Read `marketBook` stock, demand, and price | Store a second price on the entry. Settle at the pre-move price. Leave stored price outside the configured floor and cap. Pay a sell at the demand floor. Snap stock or demand to cap. Recover by retuning `tickDrift`. |
| Round trip | Nothing | A same-world or mixed trip with a positive latinum delta. A mixed trip that does not return the price. Refill stock by ping-pong, or grant a free repair. |
| Provenance | Copy `contraband` and the source tag | Clear `contraband` by sell-and-rebuy, spoof, or a friendly world. Tag tractor, capture, or salvage as `book-bought`. |

## 4. What a later slice may change

Only if Tenth scopes S35:

- Add `state.commodityShipmentBook` and the index / serialize / restore helpers, including lot source and the row cap.
- Call the index pass **after** accept, after world-cargo service returns, and after load. Do not edit the service functions’ payout or status writes.
- If a buy or sell is scoped, book and Phase 8 shop settle on the same post-move `market.price` (gate 13). Do not retune `PHASE8_MAGNITUDES` or `tickDrift`. This docs PR does not edit `applyShopBuy` or `applyShopSell`. A later slice must not leave those shop paths on the pre-move price while the book steps the same market.
- Render `#commodity-shipment` and record the gate 7 shots, including the no-overlap check.
- Expose `__BM1_PROBE__.commodityShipment` for the S35 checks.

Leave `completeWorldCargo`, `dropWorldCargo`, `restoreWorldCargoBook`, `deliverContractIfPossible`, ROE, and boarding resolve alone.

## 5. Non-goals

- No engine, CSS, probe, or save-format code in **this** PR.
- No second market, no commodity ticker, no futures price, no shop-standing rewrite. No price, stock, or demand stored on the commodity entry.
- No infinite stock or demand. No price step larger than the configured step. Stored price stays inside the configured floor and cap. No sell paid at the demand floor. No refill inside the trade or on load. No recovery by editing `tickDrift`.
- No same-world or mixed round trip that increases latinum. No mixed trip that leaves price a step away. No two-world loop that farms profit, stock, or a free repair.
- No second hold. No purchase that silently discards cargo. No god-mode cap raise from this book.
- No change to world-cargo completion, cloak refusal, mode-trust restore, or deliver-once.
- No `protect-all`. No third ROE. No pursuit grant. No gifted `firingSolution`.
- No boarding change. No sale of captured, salvaged, or tractored goods through this book. No new capture rule. `tractorIsBoarding()` stays false.
- No trade write into the contact book, delivered reports, FLASH, or the briefing archive.
- No missing source on a recorded lot. No laundering of `contraband` by a sale, a transponder spoof, or a friendly world.
- No standing write and no alert-status write from a trade.
- No trade-only Dominion map. No embargo or price that adds an ROE mode, `protect-all`, or permission to engage.
- No culture fire, firing solution, or `engagement_authorized` from a commodity, a price, or a route. No Phase 1 rewrite to explain the economy.
- No playable unlock, no `rosterPlayable` flip, no hidden Dominion reveal.
- No fourth save slot. No book inside `systemStates`. No uncapped book. No goods or credits minted from a hand-edited save.
- No dockClear reopen. No header-strip restyle.
- No remastered ids, prices, or `git am`.
- No Referee Pass.

## 6. Acceptance exercises (S35 sketch)

Keep Phase 1 / S4–S34 / doctrine / catalog / boarding / Phase 10 green. **S18.18 stays unamended.** Add **S35** only **after** Tenth scopes a later thin subscribe module. IDs are a sketch; do not promise a final count. **This docs PR does not add S35 to the probe.**

| ID | Exercise | Pass picture |
| --- | --- | --- |
| **S35.1** Name, not a price | Index a pod of `Medical Supplies`. Entry key is that name. `marketBook` prices unchanged. A weapon name is absent. | Gate 1. |
| **S35.2** One hold | Index an accepted contract. Pods and `cargoCap` unchanged. A purchase that does not fit returns false and discards nothing. Shipment id is the contract id. | Gate 2. |
| **S35.3** Does not deliver, and does not collect twice | Open the book at the destination world. Status stays whatever world cargo already had. Cloaked drop of an open contract is still `cloak-not-legal`, pods aboard, pay 0. A covert delivery does not pay `legalPayout`. A second collect from the shipment row pays 0. | Gate 3. |
| **S35.4** Restore still trusts mode and token | Saved `mode: 'open'` with both rewards restores `covertReward` 0. Saved `completionToken` restores `delivered` on the world-cargo book. Commodity restore does not pay. | Gates 3 and 6. |
| **S35.5** Standing, alert, and cloak | Index, select, restore, buy, sell: standing deep-equal, alerts snapshot unchanged, cleared flags false, encounter facts unchanged. | Gate 4. |
| **S35.6** No prize sale, no third ROE | `ROE_MODES` length 2. `offersProtectAll` false. `tractorIsBoarding()` false. No sell-prize control. Player `cargoArray` did not gain a prize hull’s pods. | Gate 5. |
| **S35.7** Save safety | `restore(undefined)` empty on slots 1–3. Slots stay 3. Book not in `systemStates`. Rows past the cap are dropped and unpaid. A hand-edited name and latinum figure do not become a pod or credits. | Gate 6. |
| **S35.8** UI merge gate | Baseline + after shots. No overlap of `#phase10-readout`, `#world-cargo`, or `#bottom-dock`. Longest good and world names show or wrap. Overflow JSON `clippedControls: []`, `occluders: []`, `pillOverlaps: []`. Standing totals unchanged. | Gate 7. |
| **S35.9** Blind | `COMMODITY_SHIPMENT_LOCKED_FROM_REMASTERED === false`. Existing remastered-locks still false. S34 tests still pass. | Gate 8. |
| **S35.10** Trade is not a report | Buy, sell, and a price move leave the contact book, `knownIncidentIds`, the FLASH queue, and `briefingArchive` unchanged. Any new line is an ordinary log line. | Gate 9. |
| **S35.11** Provenance; tractor is not a sale | Tractor a loose pod. `tractorIsBoarding()` is false. Source is not `book-bought`. `sales` does not gain an id. Sell-back pays 0. `contraband: true` survives sell-and-rebuy, a spoof claim, and a friendly world. Capture and salvage pay 0. | Gate 10. |
| **S35.12** Dominion scope, not a new ROE | A world `regionAllows` would refuse for ambient `dominion-core` is not opened by a price. Embargo leaves `ROE_MODES` at two and `offersProtectAll` false. `engagement_authorized` unchanged. | Gate 11. |
| **S35.13** No culture gift | Commodity, price, and route leave `cultureFire`, `firingSolution`, and `engagement_authorized` unset. Phase 1 text hash unchanged. | Gate 12. |
| **S35.14** Finite market | Index does not move stock, demand, or price. A buy pays the post-move price, at most one step, and the stored price stays inside the configured floor and cap. A sell receives the post-move price, lowers demand by the tons sold, and does not pass the stock cap. The next sell after demand is at its floor pays 0. Load does not restock. Recovery does not change `tickDrift`. | Gate 13. |
| **S35.15** No money machine | More same-world buy-then-sell trips than `stockCap` each net ≤ 0. No per-trip gain. Book buy then shop sell, and shop buy then book sell, each net ≤ 0 and leave the stored price where it started. A two-world loop does not refill stock or grant a free repair. | Gate 14. |

## 7. Open questions

These are **not** locked doctrine. The scoreable default is what a probe may use until Tenth amends the row. A later engine that picks a different answer still has to pass gates 1–14. Gates 9–14 are locks, not rows in this table. The row cap’s integer and the price-step integer are config (gates 6, 8, and 13), not open questions about whether a cap or a step exists.

| ID | Question | Scoreable default until Tenth amends |
| --- | --- | --- |
| Q1 | Seed every `tradeGoods` string at new game, or only names already on a pod or an accepted contract? | **Only names already on a pod or an accepted contract.** Do not pre-seed the JSON list. Phase 8 already refused a galaxy-wide ticker. This default is not a new price table. |
| Q2 | Do loose pods (no `contractId`, `destination === undefined`), including shop buys and world-cargo expiry leftovers, get shipment **display** rows? | **No.** They stay off the shipment list. Sell-back is not this question: gate 10 already locks that a tractored loose pod is not sellable through the book. |
| Q3 | What integer is the book’s maximum row count? | **The existence of a maximum is gate 6.** The integer is tunable config in this repo. It is not copied from remastered and it is not the briefing archive’s 24. This table does not pick it. Overflow drops delivered and expired shipment rows first, oldest first. An open shipment is not evicted. |
| Q4 | After world cargo marks `delivered` or `expired`, does the shipment row stay? | **Yes, as a copy.** The next index pass overwrites status from `worldCargoBook`. The copy cannot be paid. |
| Q5 | Which DOM ids host the panel? | `#commodity-shipment`, `.commodity-entries`, `.shipment-records`, `.commodity-shipment-detail`. Not inside `#world-cargo`. Not a rewrite of the Inventory pod list. |
| Q6 | May the panel show `legalPayout`, `covertReward`, or `getContractTotal`? | **Yes, as a read at render time.** The shipment record does not store a payable field. A tampered payable on the saved row is ignored. |
| Q7 | When does the index pass run? | **After** accept, after world-cargo service returns, and after load. Never inside `restoreWorldCargoBook` or the completion functions. |
| Q8 | Cargo that boarding left on a prize hull, not on `state.cargoArray`? | **Out of scope for a sale.** Not sold through this book (gate 10). The salvage/capture brief owns any later exception. Whether a name already on the player hold is indexed is Q1, and indexing still does not write `soldByBook`. |
| Q9 | May a commodity entry remember a price? | **No.** Price, stock, and demand stay on the landed per-world `marketBook` (gate 13). A remembered price on the entry would be a second market. |

## 8. Suggested order if a later slice is scoped

1. **Brief score.** Referee / One score the **fourteen** hard gates. Do not open an engine PR on this document alone.
2. **Tenth scopes** a later thin subscribe module **or** leaves this as docs-only. Blind implement from `docs/commodity-shipment/` against bake-off `main` after #77 (`bc00a86`). Do not crib remastered.
3. **Suggested order if scoped:** name-only entries (S35.1) → one hold, full purchase refused (S35.2) → book does not deliver, does not pay twice, and `cloak-not-legal` still fails closed (S35.3) → mode-trust and token restore unchanged (S35.4) → standing, alert, and cloak unchanged (S35.5) → no prize sale and no third ROE (S35.6) → trade is not a report (S35.10) → provenance, tractor is not a sale, contraband stays (S35.11) → Dominion scope is not a new ROE (S35.12) → no culture gift (S35.13) → finite step, no instant refill (S35.14) → no money machine (S35.15) → save safety (S35.7) → preservation replay (S35.9) → UI shots and no-clip (S35.8) **before merge**.
4. **Number Three** adds/runs S35 after that later slice. Keep S4–S34 green. Do not weaken S18.18 or the world-cargo tests.

| Who | What they score | When |
| --- | --- | --- |
| **Referee / One** | All **fourteen** hard gates, before engine | This brief |
| **Number 2** | Gates **1, 3, 4, 5, 9, 10, 11, 12, 13, 14** | This brief |
| **Number Four** | Gates **2, 3, 6, 7, 8, 10, 11, 13** | This brief; gate 7 evidence is the later engine PR |
| **Number Three** | Probe gate **after** a later S35 slice (S35; S4–S34 and S18.18 stay green) | Not this brief |

**No Referee Pass is claimed.**

## 9. Where to read next

- This brief’s later-slice checklist: `docs/commodity-shipment/BM1-COMMODITY-SHIPMENT-ENGINE-DEPENDENCIES.md`.
- Landed freight rules this book must not relax: `docs/world-cargo-delivery/BM1-WORLD-CARGO-DELIVERY-PROPOSAL.md` and `src/world-cargo-delivery.js`.
- Status and changelog: `docs/BAKEOFF-STATUS.md`.
- Locked-package list: `docs/revised-development-plan.md` §16 and `docs/GUIDED-CONVERGENCE.md`.
