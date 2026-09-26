# BM1 commodity and shipment book: later-slice dependencies

**Reviewed document:** `BM1-COMMODITY-SHIPMENT-BOOK-PROPOSAL.md`  
**Reviewed against:** `Artemis2028/BM1-bakeoff` at `bc00a867c281139faaa0cd80238072baf0482707` on `main` (26 September 2026), after header-strip polish PR #77. S34 world cargo engine is **merged** PR #75 @ `1b579e54d325656adb716427e23d19c09587b42c`. Line numbers below refer to this head and may drift.  
**Method:** read the player cargo hold, `openContracts`, `worldCargoBook` restore and completion, Phase 8 shop sale of loose pods, standing, cloak, ROE, and boarding prize identity. No engine changes made. This is a dependency/risk checklist for a **later** writer **if** Tenth scopes a thin subscribe module — not a post-implementation review and not permission to implement before Tenth scopes the lane. **Keep #33–#77 locked.** Do not relax the S34 rules. Do not add `protect-all`. Do not sell prize goods. Do not `git am` remastered patches.

## Verdict in one paragraph

The commodity and shipment book can stay **docs-only** on this PR. **This PR ships proposal + deps only.** If Tenth later scopes a thin slice, prefer a **sibling book** (`src/commodity-shipment.js`, name can change) that **reads** pods, `openContracts`, `worldCargoBook`, and the landed per-world `marketBook`, and **writes** `state.commodityShipmentBook`. It does not add a second stock list. A commodity entry is a name. A shipment record is a contract id plus a display copy. Trade goods and contract pods share `cargoArray` and `cargoCap`. A purchase that does not fit is refused. Indexing does not complete, pay, clear inspection, change standing or alert status, or move pods. Each world-cargo contract pays at most once. A cloaked drop of an open contract still fails `cloak-not-legal` inside world cargo (pods stay, status stays open, pays 0). A covert or cloaked delivery never earns `legalPayout`. Restore of world cargo still trusts saved `mode` and zeroes the other reward, and a `completionToken` still restores as `delivered`. Every recorded lot has a source. Book-bought is tagged only when this book bought it. Selling captured, prize, or salvaged goods stays **out** (alt item; own capture-rules brief). Smuggled cargo is not laundered by sell-and-rebuy, a transponder spoof, or a friendly world. A buy, sell, or price move does not write or clear the contact book, delivered reports, FLASH, or the briefing archive. Tractoring a loose pod does not make it sellable through the book, and `tractorIsBoarding()` stays false. Only a lot this book itself sold may be sold back, until the salvage/capture brief locks otherwise. Dominion trade access is the pack `dominion-all` / `dominion-core` scope spawn and purchase already use. An embargo or a price shift does not add an ROE mode, restore `protect-all`, or grant permission to engage. No commodity, price, or route grants culture fire, a firing solution, or `engagement_authorized`, and no Phase 1 text is rewritten to explain the economy. A later buy raises that world’s price and a later sell lowers it, by at most one capped step. Stock and demand do not refill in the trade or on load. Repeated buy/sell cannot mint unbounded credits, and a two-world loop cannot farm stock or a free repair. Prices and limits are tunable config in this repo, not copied from BM1-remastered, and this brief does not retune `PHASE8_MAGNITUDES`. Old saves load an empty book on all three slots. The book has a fixed maximum size. A hand edit cannot mint goods or credits. `SAVE_SLOT_COUNT` stays 3. The book stays outside `systemStates`. `COMMODITY_SHIPMENT_LOCKED_FROM_REMASTERED === false`. The later engine PR **must not merge** without baseline and after screenshots and a 1280×720 no-clip check with `clippedControls: []`, `occluders: []`, and `pillOverlaps: []`, and without overlap of `#phase10-readout`, `#world-cargo`, or `#bottom-dock`. The load-bearing risks are a second payer, a second market, a customs stamp, and a credit loop: paying from a shipment row, completing from the panel, rewriting `mode` or `completionToken`, clearing contraband, writing standing, copying prize cargo aboard, snapping stock to cap, or a reopen of #33–#77.

## Natural later deliverable (say this clearly)

A thin **subscribe module** that publishes proposal §3 (entry, record, index-after, save, lot source) is the natural **S35** deliverable. Indexing does not move market stock. A later buy or sell, if Tenth scopes one, uses the landed per-world market and gates 13 and 14. It does not retune `PHASE8_MAGNITUDES`. World-cargo completion, ROE, boarding resolve, and `rosterPlayable` stay untouched.

| S35 is | S35 is not |
| --- | --- |
| Sibling book outside `systemStates` | A second `worldCargoBook` or a second stock list |
| Commodity key = the good’s name string | A price, stock, or demand on the entry; a standing tier; a weapon; or a hull |
| Shipment id = an existing contract id | A second hold, a silent discard, or a loose-pod purse |
| Full purchase returns false | God-mode `cargoCap` growth or an eleventh slot from this book |
| Each contract pays at most once; covert/cloaked never earns `legalPayout` | A second collect from the shipment row |
| Status copied from world cargo after it returns | A call into `completeWorldCargo` or `dropWorldCargo` |
| `restore(undefined)` → empty book | A throw, a payout, or a rewritten `completionToken` |
| Display of a stored `cloak-not-legal` reason | A legal delivery, a cleared inspection, or a standing write |
| UI host + lists + detail that fit at 1280×720 and do not cover `#phase10-readout`, `#world-cargo`, or `#bottom-dock` | A dockClear reopen, a header-strip restyle, or a clipped name |
| `COMMODITY_SHIPMENT_LOCKED_FROM_REMASTERED === false` | A remastered `git am` |
| Replay `test:world-cargo` unchanged | A relaxation of `cloak-not-legal`, mode-trust, or token restore |
| Ordinary log line for a market event | A FLASH, a delivered report, a contact-book write, or a briefing |
| `sales` empty unless this book wrote the `saleId`; every lot has `source` | A tractored, captured, salvaged, or prize lot becoming sellable; `contraband` cleared by spoof or a friendly dock |
| Finite clamped stock and demand; price step at most one configured unit; no refill on trade or load | A second price table, an uncapped jump, or `restockToCap` |
| Round trip and two-world loop stay bounded; no free repair | Unbounded latinum, stock snapped back by the loop, or `freeRepair: true` |
| Empty book on slots 1–3; row cap enforced; hand edit mints nothing | A fourth slot, an uncapped map, or restore calling `addCargoToPods` |
| `tractorIsBoarding() === false` | Tractor-as-board, or tractor-as-sale |
| Read pack `regionAllows` for `dominion-all` / `dominion-core` | A trade-only region, or an embargo that adds an ROE mode |
| No `cultureFire` / `firingSolution` / `engagement_authorized` | A Phase 1 rewrite that explains the economy |

A prize-goods shop, if ever wanted, is a **different** Tenth-scoped lane and needs its own capture-rules brief first.

## What already exists (do not reinvent)

| Need | Engine / docs fact at `bc00a86` |
| --- | --- |
| Trade-good names | `DEFAULT_TRADE_GOODS` is five strings (`src/main.js`). `normalizeTradeGoods` replaces that with `data/game_items.json` `tradeGoods` when the JSON loads. The JSON list has no prices. Weapons in the same file are not goods. |
| Hull text | `data/itemtext.json` rows are ships (`schema` `bm2.itemtext.v1`). Not commodities. |
| Hold | `state.cargoArray`, length 10. Empty pod `{ tons: 0, item: 'Nothing', destination: undefined, payout: 0 }`. Filled pods may add `destinationIndex` and `contractId`. `cargoCap` default 20. |
| Loose cargo | `getLooseCargoPods`: tons > 0, item not `'Nothing'`, `destination === undefined`. `removeCargoFromPods` sells only that shape. Shop buy uses `addCargoToPods(..., destination undefined)`. |
| Contracts | `normalizeContract` requires `goods` and a target name. Fields include `id`, `tons`, `payPerTon`, `hazardPay`, origin, employer. `getContractTotal` is `payPerTon * tons`. Accept is dock-gated and calls `enrollAcceptedWorldCargo(offer, 'open')`. |
| World cargo | `src/world-cargo-delivery.js`. `emptyWorldCargoBook`, `restoreWorldCargoBook`, `enrollWorldCargoContract`, `completeWorldCargo`, `dropWorldCargo`, `expireDueContracts`. `WORLD_CARGO_LOCKED_FROM_REMASTERED === false`. |
| Cloaked open drop | `dropWorldCargo` on `mode: 'open'` while cloaked returns reason `cloak-not-legal`, outcome `OPEN_CLOAK_FAIL_COPY`, pods not cleared, status stays `open`, latinum 0. |
| Mode-trust restore | `restoreOneContract`: saved `mode === 'open'` zeroes `covertReward`; saved `mode === 'covert'` zeroes `legalPayout`. Missing mode infers from which reward is positive and will not keep both. |
| Token restore | `completionToken === 'world-cargo:' + id` forces `status = 'delivered'`. A `delivered` status without a token receives that token. |
| Cleared flags | `forceCleared` sets `inspectionCleared` and `customsCleared` false on every restore. |
| Open standing | Only `applyWorldCargoEconomy` calls `creditWorthwhileTrip` when world cargo sets `requestTrip`, callback `adjustFactionStanding(..., 3)`. Covert does not set that request. |
| Planet versus station | `getPlanetDockDistance` / `tryDockAtPlanetIndex` / `tryDockAtStation`. Station and hail do not complete world cargo. |
| Inventory UI | `renderTopLeftPanel` lists cargo pods and `renderOpenContractsPanel`. `#world-cargo` is the delivery panel (`index.html`). This book is a third surface, not a replacement. |
| Standing | `state.factionStanding`. Tiers in `src/standing-tiers.js`. No dedicated commodity standing editor. |
| ROE | `ROE_MODES` is `return-fire` and `defend`. `offersProtectAll()` is false. |
| Boarding | ≤10% combat hull to start. Capture XOR scuttle. `tractorIsBoarding()` false. Prize identity may keep a hull `cargo` / `cargoArray` on that hull (`src/boarding-identity.js`). That is not the player hold. |
| Save slots | `SAVE_SLOT_COUNT = 3`. Payload already includes `worldCargoBook` and `briefingArchive` beside each other, outside `systemStates`. |
| UI measure | World-cargo overflow JSON and header-strip `noclip.json` at 1280×720 report `clippedControls: []`, `occluders: []`. Header strip also reports `pillOverlaps: []`. Campaign readout is `#phase10-readout`. Delivery panel is `#world-cargo`. Dock is `#bottom-dock`. DockClear #60 / #61 and header #76 / #77 stay locked. |
| Reports and FLASH | Phase 4 incident ledger, `observerCopies.knownIncidentIds`, `setLog(..., { band: 'flash' })`, `FLASH_ELIGIBLE_KINDS`. A trade must not call these. An ordinary `setLog` line has no flash band. |
| Briefing archive | `produceArrivalBriefing` runs on completed warp/wormhole only (#73). A buy, sell, or price move must not call it. |
| Contact book | Phase 6 `listContacts` / contact rows. A trade must not add or delete a row. |
| Tractor | `tractorIsBoarding()` in `src/phase9-ew.js` returns false. Do not flip it. Towing a loose pod does not write `sales`. |
| Dominion scope | `regionAllows` in `bm-ships/catalog.mjs` for `dominion-all` and `dominion-core`. Spawn: `spawnPool` / `catalogSpawnContext` / `spawnIdsLive`. Purchase: `catalogPurchaseContext` / `stockIdsLive` / `evaluateWiredPurchase`. Read that predicate. Do not copy it into a trade table. |
| Embargo is not fire | Phase 8 `embargoNoticeStandingWrite()` returns `standingWrite: false` and `attackId: null`. `ROE_MODES` stays two. `offersProtectAll()` stays false. |
| Culture | `cultureFireFromMarketForbidden` in `src/phase8-markets.js`. `consultDoctrineFire` is not this book’s to call. Phase 1 doctrine text stays unedited. |
| Finite market | `PHASE8_MAGNITUDES` clamps (`stockCap` 8, `demandCap` 8, `floor` 0, `listPrice` 6, `tickDrift` 0). Those integers stay Phase 8’s. This package does not retune them and does not copy a remastered curve. `applyShopBuy` / `applyShopSell` change stock by one and do not change `price` today. `tickMarketBook` returns `restock-forbidden` when `restockToCap` is set. `restockOnLoadForbidden` is `lastLoadRestocked !== true`. |
| Anti-farm | `boundTravelSalvage`, `boundTransportLatinum`, `jumpMustNotReprintInfinity` (`freeRepair: false`). `evaluateDockService` refuses repair when supply is unmet. |
| Hold refusal | `addCargoToPods` returns false when `cargo + amount` exceeds `cargoCap`, and when no slot can take the good, unless god mode. This package does not take the god-mode branch. |
| Contraband and spoof | World-cargo contracts copy `contraband`. `TRANSPONDER_MODES` is `off` / `true` / `spoof`. A spoof is not a customs clear. |
| Alerts | `areAlertsActive` / the alerts snapshot. A trade does not write them. |
| Remastered locks | `MAGNITUDES_LOCKED_FROM_REMASTERED`, `UTILITY_LOCKED_FROM_REMASTERED`, `LEDGER_LOCKED_FROM_REMASTERED`, `EMPTY_ARMABLE_LOCKED_FROM_REMASTERED`, `CONSTRUCTION_LOCKED_FROM_REMASTERED`, `HTML_CATALOG_LOCKED_FROM_REMASTERED`, `ECONOMY_DIFFICULTY_LOCKED_FROM_REMASTERED`, `STANDING_TIERS_LOCKED_FROM_REMASTERED`, `DOCK_CLEAR_LOCKED_FROM_REMASTERED`, `ALERTS_ACTIVE_LOCKED_FROM_REMASTERED`, `AWAY_TEAM_XP_LOCKED_FROM_REMASTERED`, `PHASE10_ROSTER_LOCKED_FROM_REMASTERED`, `BAJORAN_SOLAR_SAILOR_LOCKED_FROM_REMASTERED`, `BRIEFING_ARCHIVE_LOCKED_FROM_REMASTERED`, `WORLD_CARGO_LOCKED_FROM_REMASTERED` all **false**. |

**Gap this brief closes (docs now; module only if scoped):** there is no scoreable book that lists a commodity name and a shipment record without becoming a second payer, a second market, or a prize shop.

## Hooks the writer will have to touch

**This PR touches none of these.** If Tenth later scopes a thin subscribe module:

Prefer **one new file** rather than growing `world-cargo-delivery.js` or `phase8-markets.js` into a catalog:

| Proposed file | Responsibility |
| --- | --- |
| `src/commodity-shipment.js` (name can change) | `COMMODITY_SHIPMENT_LOCKED_FROM_REMASTERED === false`; `emptyCommodityShipmentBook` / serialize / restore (drops payable fields; forces the lock flag false); `indexCommodityShipment` (read-only inputs; writes the book only). **No** completion. **No** standing write. **No** pod write. |
| `src/main.js` | Thin: create/restore sibling `state.commodityShipmentBook` **beside** `worldCargoBook`; call index **after** accept, **after** world-cargo service returns, and **after** load. `saveGame` / `loadGame` / `resetRunState`. `__BM1_PROBE__.commodityShipment`. **Do not** change `SAVE_SLOT_COUNT`. **Do not** edit `restoreWorldCargoBook`, `completeWorldCargo`, or `dropWorldCargo`. **Do not** restyle the header strip. |
| Panel markup / CSS | Host `#commodity-shipment`, `.commodity-entries`, `.shipment-records`, `.commodity-shipment-detail`. Fit only. |
| Optional `scripts/test-commodity-shipment.mjs` | Offline: name not a price; index does not touch pods; book does not deliver; `cloak-not-legal` still fails; mode-trust and token restore unchanged; standing unchanged; no prize copy; `restore(undefined)` empty; lock false. |
| `scripts/behavior-probe.mjs` | Add S35 **after** scope. **Replay** S34 and S18 including S18.18. Do not edit S34 expected reasons or S18.18’s expected `dominion-first`. |

Do **not** implement this inside `src/world-cargo-delivery.js`, `src/phase8-markets.js`, `src/phase2-security.js`, or `src/boarding-*.js` beyond a **read**. Do **not** `git am` remastered patches.

| Existing path | Required integration (later S35) |
| --- | --- |
| `cargoArray` / `openContracts` | **Read** after the landed mutator returns. Fail if a pod field changes inside the index function. |
| `restoreWorldCargoBook` | **Do not edit.** Call commodity restore beside it. Fail if mode-trust or `completionToken` → `delivered` changes. |
| `completeWorldCargo` / `dropWorldCargo` / `expireDueContracts` | **Do not edit.** Index after they return. Fail if a cloaked open drop no longer yields `cloak-not-legal` with pods aboard and pay 0. |
| `applyWorldCargoEconomy` / `creditWorthwhileTrip` | **Untouched.** Fail if the commodity book calls them. |
| `applyShopSell` / `removeCargoFromPods` | **Untouched** as the loose-cargo shop. Fail if the book sells a lot it did not sell, or if a full purchase discards a pod. |
| `adjustFactionStanding` / `areAlertsActive` | **Untouched** by this package. Fail if a book call changes `factionStanding` or the alerts snapshot. |
| `ROE_MODES` / `offersProtectAll` / `tractorIsBoarding` | **Untouched.** Fail if any changes, including after an embargo or a price move. Fail if a tractored loose pod becomes sellable. |
| Contact book / delivered reports / FLASH / `produceArrivalBriefing` | **Untouched** by buy, sell, and price. Fail if any of those stores change. An ordinary log line is the only allowed notice. |
| `regionAllows` / `spawnIdsLive` / `evaluateWiredPurchase` | **Read** for Dominion trade access. Fail if this book authorizes a world the pack would refuse, or adds a region string. |
| `cultureFireFromMarketForbidden` / Phase 1 text | **Untouched.** Fail if `cultureFire`, `firingSolution`, or `engagement_authorized` is set, or if Phase 1 copy changes. |
| Prize hull `cargo` / `cargoArray` | **Do not copy** onto the player hold. Fail if indexing a capture increases player tons. |
| `saveGame` / `loadGame` / `resetRunState` | New sibling key. Missing key → empty on all three slots. Enforce the row cap. Ignore payable and latinum fields. Do not call `addCargoToPods` from restore. `SAVE_SLOT_COUNT` stays 3. |
| `marketBook` / `tickMarketBook` / `restockOnLoadForbidden` | **Read** clamps. Fail if this package instant-refills, stores a second price, or retunes `PHASE8_MAGNITUDES`. A later buy/sell moves price by at most one configured step. |
| `jumpMustNotReprintInfinity` / `evaluateDockService` | **Untouched.** Fail if a round trip or a two-world loop refills stock or grants a free repair. |
| `__BM1_PROBE__.worldCargo` | Keep. Add `.commodityShipment`. S34 checks still read world cargo. |

## Risks

| Risk | Why it fails a gate |
| --- | --- |
| Shipment row stores `legalPayout` and restore adds it to latinum | Gates 3 and 6. The row is not a purse. |
| Index runs inside `dropWorldCargo` and clears pods on `cloak-not-legal` | Gate 3. Pods must stay aboard. |
| Commodity restore rewrites `worldCargoBook.mode` | Gate 3. Mode-trust belongs to world cargo alone. |
| Opening the panel calls `completeWorldCargo` | Gate 3. The panel is a reader. |
| Book calls `adjustFactionStanding` when a shipment is filed | Gate 4. Standing stays the world-cargo +3 path only. |
| Displaying `cloak-not-legal` sets `inspectionCleared` | Gate 4. Display is not customs. |
| A sell control prices a prize hull’s cargo | Gate 5. Alt item. Out of scope. |
| Book nested under `systemStates` | Gate 6. Load wipes that cache. |
| `pillOverlaps` non-empty because the panel covers a header pill | Gate 7. Fit the host. Do not restyle the strip to hide the overlap. |
| Editing `restoreOneContract` so both rewards survive | Gate 8. That is an S34 reopen. |
| Copying a remastered price table or flipping a lock flag | Gate 8. |
| A price move queues FLASH or files a briefing | Gate 9. |
| Tractor writes `soldByBook` or `tractorIsBoarding()` returns true | Gate 10. |
| An embargo adds `protect-all` or sets `engagement_authorized` | Gate 11. |
| A route display sets `cultureFire` or edits Phase 1 text | Gate 12. |
| A buy snaps stock to cap or writes `price` on the commodity entry | Gate 13. |
| Same-world round trips add the spread forever, or a two-world loop refills stock or repairs free | Gate 14. |
| A full purchase deletes another pod, or restore of a hand edit calls `addCargoToPods` | Gates 2 and 6. |
| Sell-and-rebuy, a spoof claim, or a friendly world clears `contraband` | Gate 10. |

## Probe hook sketch (later)

`__BM1_PROBE__.commodityShipment` may expose `index`, `restore`, `snapshot`. Snapshot fields a scorer needs: `commodityNames`, `shipmentIds`, `podDigest` (so a probe can see the hold did not change), `purchaseRefused`, `cargoCap`, `worldCargoStatus`, `mode`, `lastAttemptReason`, `latinumDelta`, `standingDelta`, `alertsActive`, `inspectionCleared`, `customsCleared`, `contraband`, `wroteWorldCargo`, `prizeCargoCopied`, `lots`, `source`, `sales`, `soldByBook`, `marketPrice`, `marketStock`, `marketDemand`, `priceStep`, `restockedToCap`, `freeRepair`, `contactBookDigest`, `knownIncidentIds`, `flashQueued`, `briefingArchiveDigest`, `logBand`, `regionAllowsRefused`, `cultureFire`, `firingSolution`, `engagement_authorized`, `phase1TextUnchanged`, `roeModes`, `offersProtectAll`, `tractorIsBoarding`, `saveSlotCount`, `rowCapEnforced`, `mintedFromSave`, `bookInsideSystemStates`, `lockedFromRemastered`. This docs PR does not add the hook.

World-cargo snapshot fields the S35 replay must still see unchanged: `reason` `cloak-not-legal` on a cloaked open drop, `latinumDelta` 0, status `open`, and on restore a trusted `mode` with the other reward zeroed and `completionToken` forcing `delivered`.
