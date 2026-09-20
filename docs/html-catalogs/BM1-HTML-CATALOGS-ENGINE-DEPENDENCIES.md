# BM1 HTML weapon / station review catalogs: later-slice dependencies

**Reviewed document:** `BM1-HTML-WEAPON-STATION-REVIEW-CATALOGS-PROPOSAL.md`  
**Reviewed against:** `Artemis2028/BM1-bakeoff` at `91ecc2c` on `main` (20 September 2026), after station construction visuals engine (PR #53). Line numbers below refer to this head and may drift.  
**Method:** read landed weapon ledger / Phase 9 matrix / `data/game_items.json`, `data/station_manifest.json` / `data/stationData.json`, hull `docs/ship-balance/REVIEW.html` as a medium analog, construction-visuals subscribe module, side-lane repair predicates, and GUIDED §9. No engine changes made. No HTML pages shipped. This is a dependency/risk checklist for a **later** writer **if** Tenth scopes a thin **static HTML** (or docs-generator) slice — not a post-implementation review and not permission to implement before Tenth scopes the lane. **Keep #33, #35, #37, #38, #39, #40, #41, #42, #43, #44, #45, #46, #47, #48, #49, #50, #51, #52, and #53 locked.** Do not reopen EW, boarding, Phase 10, flags/passes, the weapon ledger, empty-armable, or construction visuals. Do not retune combat. Do not open dockClear polish, broader economy / difficulty knobs, or Flash price locks.

## Verdict in one paragraph

HTML review catalogs can stay **docs-only**. **This PR ships proposal + deps only.** If Tenth later scopes a thin slice, prefer a **static HTML page set under `docs/html-catalogs/`** (index + weapons + stations; names can change) that **reads** `snapshotWeaponLedger` / `docs/weapon-ledger/` / `data/game_items.json` / `data/station_manifest.json` / `data/stationData.json` and **writes HTML only**. That slice is **docs**, not combat — the natural analog is `docs/ship-balance/REVIEW.html`. Do **not** touch `src/main.js` fire paths, `game_items.json` combat fields, station runtime, repair arms, or construction-site language. `HTML_CATALOG_LOCKED_FROM_REMASTERED === false`. The load-bearing risks are all honesty / integration mistakes: requiring Flash as the viewer; treating the page as a shop; locking Flash prices; silently merging Canon / Cannon / Turret; inventing defs for vacant station-stock ids; gifting `firingSolution` / `engagement_authorized`; `git am` remastered; reopening #33–#53.

## Natural later deliverable (say this clearly)

A thin **static HTML review page set** is the natural S25 deliverable for a **docs** PR. Combat / engine stay untouched.

| S25 is | S25 is not |
| --- | --- |
| Static HTML under `docs/html-catalogs/` | A combat engine |
| Read-only inspect of defs | A live shop, dock, or loadout editor |
| Flash vs bake-off both visible | A silent reconcile / retune |
| Optional offline generator that writes `docs/` HTML | A writer of `game_items.json` or station runtime |
| Optional screenshot of the HTML pages themselves | DockClear polish / in-game HUD work |

An in-game review panel, if ever wanted, is a **different** Tenth-scoped lane. First S25 should not open `src/`.

## What already exists (do not reinvent)

| Need | Engine / docs fact at `91ecc2c` |
| --- | --- |
| Weapon source ledger | `src/weapon-source-ledger.js`: `snapshotWeaponLedger`, `LEDGER_LOCKED_FROM_REMASTERED === false`, `FLASH_PRICES_ARE_LIVE_LOCKS` subscribed false, three disruptors 7 / 6 / 12, Tractor id 25 Device, Plasma 17 uncertified, deferred Sail / Warp Core, inherited `[2, 27, 28, 29, 30, 38, 39, 44, 45]`, vacant `[20, 21, 31–37, 40–43]`, `ledgerInjectMustNotGiftFire`. Offline `npm run test:weapon-ledger`. Probe `__BM1_PROBE__.weaponLedger`. |
| Ledger docs | `docs/weapon-ledger/BM1-WEAPON-DEVICE-SOURCE-LEDGER-PROPOSAL.md` §§3–6 (Flash table, identities, inherited list, deferred utilities). |
| Phase 9 matrix (read-only) | `src/phase9-weapons-matrix.js`: ten `MATRIX_COLUMNS`; `UNIVERSAL_SHIELD_BYPASS === false`; `BASELINE_COMBAT_NUMBERS` frozen. **Do not rewrite.** |
| Live items | `data/game_items.json` schema `bm2.game_items.v1`. `weapons[]` **32** rows (ids 1–19, 22–30, 38, 39, 44, 45). Fields: `id`, `name`, `type`, `price`, `damage`, `cooldown`, `range`, `icon`, `minMass`, `stockFactions`, `color`, `speed`. `tradeGoods` includes **“Warp Cores”** (plural). Device knobs under `settings.devices.*`. |
| Station types | `data/station_manifest.json`: **36** stations, ids **70–90, 106–113, 119, 200–205**. Fields include `name`, `description`, `sizeClass`, `cost`, `hull`, `shields`, `mass`, `cargoCapacity`, `image`. Costs are **current data** (e.g. Human Starbase 70 @ 50000). **No Flash station-price table in GUIDED.** |
| Station placements | `data/stationData.json` schema `bm2.station-data.v1`: **269** rows, **69** systems. `stock.weaponIds` include live ids **and** vacant / unknown ids (20, 21, 31–37, 40–43, **46, 47, 48, 50, 51, 52, 58**). |
| Hull HTML analog | `docs/ship-balance/REVIEW.html` — searchable static HTML, inlined JSON, dark review chrome. **Medium analog only.** Do not copy hull standing / price copy as weapon or station locks. |
| Construction visuals | `src/construction-visuals.js`; S24; `CONSTRUCTION_LOCKED_FROM_REMASTERED === false`. Scaffold / workbee / **blue** beam language already landed. **Stay locked.** |
| Repair predicates | `src/side-lane-repair-reman.js`: `REPAIR_CAPABLE_SIZE_CLASSES` = `starbase` / `shipyard` / `heavy-shipyard`; `REPAIR_MAINTENANCE_TYPE_ID = 83`; `REPAIR_DEFENSE_PLATFORM_TYPE_IDS = [86, 87]`. **Cite; do not redo.** |
| Utility / Thaleron | `src/utility-inventory.js`; Thaleron pass **unverified — not shipped**. |
| Remastered locks | `MAGNITUDES_LOCKED_FROM_REMASTERED`, `UTILITY_LOCKED_FROM_REMASTERED`, `LEDGER_LOCKED_FROM_REMASTERED`, `EMPTY_ARMABLE_LOCKED_FROM_REMASTERED`, `CONSTRUCTION_LOCKED_FROM_REMASTERED` all **false**. |
| Probe surface | `__BM1_PROBE__.phase9` … `.phase94`, `.boarding`, `.phase10`, `.utility`, `.weaponLedger`, `.emptyArmable`, `.constructionVisuals`. First S25 should **not** add a combat probe unless a runtime panel is scoped. |

**Gap this brief closes (docs now; static HTML only if scoped):** there is no **scoreable S25 contract** that weapon / station review happens in HTML without Flash, that pages inspect without retuning or shopping, and that Flash vs bake-off stays visible and ledger-cited.

## Hooks the writer will have to touch

**This PR touches none of these.** If Tenth later scopes a thin static/docs slice:

Prefer **new files under `docs/html-catalogs/`** rather than growing `src/main.js` or the ledger module into a second religion:

| Proposed file | Responsibility |
| --- | --- |
| `docs/html-catalogs/index.html` (name can change) | Entry page. States: HTML review; Flash is evidence; not a shop; Flash prices not locks; `HTML_CATALOG_LOCKED_FROM_REMASTERED === false`. Links to weapons / stations. |
| `docs/html-catalogs/weapons.html` | Weapon / device inspect table. Subscribe to ledger snapshot + `game_items.json`. Show Flash **and** live. Cite `docs/weapon-ledger/`. |
| `docs/html-catalogs/stations.html` | Station **type** inspect table from `station_manifest.json` (36). Optional placements page/section from `stationData.json`. Label vacant / unknown stock ids. |
| Optional `scripts/build-html-catalogs.mjs` | Read-only generator. Writes the HTML files above. **Must not** write `data/game_items.json`, station JSON, or `src/`. |
| Optional offline assert | `scripts/test-html-catalogs.mjs`: pages exist; required columns; three identities; Tractor Device; Flash-not-lock banner; 36 types; vacant stock labeled; lock flag false. **Not** a rewrite of S14–S24. |

Do **not** implement this inside `src/phase9-*.js`, `src/weapon-source-ledger.js` (except a later **read** of `snapshotWeaponLedger` from a Node generator), `src/construction-visuals.js`, `src/empty-armable.js`, `src/boarding-*.js`, `src/phase10-*.js`, `src/utility-inventory.js`, `src/phase8-markets.js`, `src/side-lane-repair-reman.js`, or `src/main.js`. Do **not** `git am` remastered patches. Do **not** add EW families. Do **not** retune combat. Do **not** invent weapon or station ids.

| Existing path | Required integration (later S25) |
| --- | --- |
| `snapshotWeaponLedger` / ledger docs | **Subscribe.** Weapon page columns must match identities / deferred / inherited / Plasma-uncertified. Fail if the page collapses 6/7/12. |
| `data/game_items.json` | **Read-only.** Fail the S25 diff if damage / cooldown / range / live price / type / name change. |
| `data/station_manifest.json` / `data/stationData.json` | **Read-only.** Fail if costs, type ids, or stock arrays are rewritten “for the catalog.” |
| `docs/ship-balance/REVIEW.html` | Cite as medium analog. **Do not** edit hull balance copy as part of this lane. |
| `src/construction-visuals.js` / S24 | **Untouched.** Catalogs do not draw scaffolds. |
| `shouldDrawRepairOverlay` / types 86 / 87 | **Cite only.** Fail if a catalog row marks a defense platform repair-capable. |
| `utilityBook` / Thaleron | Untouched. Fail if a station named “research” ships a facility pass. |
| `consultDoctrineFire` / `liveFireFactsFromEw` | Untouched. Fail if opening a page writes `firingSolution` or `engagement_authorized`. |
| `buyWeapon` / Phase 8 `marketBook` | Untouched. Fail if the HTML grows a Buy control that calls them. |
| `tractorIsBoarding` | Stays false. |
| `__BM1_PROBE__` | First S25: **do not require** a new combat namespace. Keep `.weaponLedger` / `.constructionVisuals` intact. A runtime panel (later, out of first S25) would add `.htmlCatalogs` only if Tenth scopes it. |
| Inventory / dock UI | **Out.** DockClear polish **out**. |

## Risks

### 1. Flash treated as the required viewer (gate 1)

Shipping “review in the original client” or a SWF embed as the catalog **fails** HTML-without-Flash. A markdown table in this proposal folder is **not** the S25 catalog once pages are scoped.

**Gate:** S25.1.

### 2. Catalog becomes a shop or a live price lock (gate 2)

Buy / Equip / restock chrome, copying Flash 1300 into a non-overridable constant, flipping `FLASH_PRICES_ARE_LIVE_LOCKS`, or rewriting `game_items.json` / station `cost` “to match the page” fails inspect-only.

**Gate:** S25.2.

### 3. Silent reconcile of Flash vs bake-off (gate 3)

Merging ids 6 and 7 because both live-name “Disruptor Cannon,” inventing Flash prices for inherited extras, filling vacant ids, inventing defs for placement stock 46 / 47 / 48 / 50 / 51 / 52 / 58, or dropping those stock cells “because they look dirty” fails show-both / cite-ledger.

**Gate:** S25.3.

### 4. Opening a page gifts fire (gate 4)

A generator or in-game panel that sets `firingSolution` / `engagement_authorized` / culture fire because a row was rendered fails the knowledge-layer lean.

**Gate:** S25.4.

### 5. Landed-lane sneak / remastered crib (gates 5–7)

Touching EW contest, boarding XOR, Dominion pack gates, flags Thaleron-shipped, ledger combat numbers, empty-armable auto-fill, construction beams, repair arms, dockClear, economy knobs, or `git am` remastered patches fails even if the HTML is green. Flipping any `*_LOCKED_FROM_REMASTERED` to true fails the blind rule. Treating hull `REVIEW.html` as a weapon/station source also fails.

**Gate:** S25.5 / S25.6.

### 6. Runtime panel disguised as S25 (process)

Growing `src/main.js` so dockClear hosts the catalog, or wiring Phase 8 stock from the HTML, is **not** the first slice. First S25 stays under `docs/`.

**Gate:** S25.5 + named outs.

## Probe plan (S25)

**Not in this docs PR.** Add offline `scripts/test-html-catalogs.mjs` (or equivalent file-contract checks) **only after** Tenth scopes the static page set. **Replay S7 + S14–S24** if any runtime file is touched (it should not be). Do not break existing injectors.

**Minimum later-slice contract (static pages):**

```js
// Offline / file-contract sketch — not a combat probe.
{
  htmlCatalogLockedFromRemastered: false,
  flashRequired: false,
  flashPricesAreLiveLocks: false,
  shopControls: false,
  weapons: {
    disruptors: { canon: 7, cannon: 6, turret: 12, distinct: true },
    tractor: { id: 25, type: 'Device', slot: true },
    plasmaTorpedo: { id: 17, livePrice: 7200, flashCertified: false },
    deferredUtilities: ['Bajoran Sail', 'Warp Core'],
    inheritedNotInFlash: [2, 27, 28, 29, 30, 38, 39, 44, 45],
    vacantStillVacant: [20, 21, 31, 32, 33, 34, 35, 36, 37, 40, 41, 42, 43],
  },
  stations: {
    typeCount: 36,
    unknownStockIdsLabeled: [46, 47, 48, 50, 51, 52, 58],
    defensePlatformsNeverRepair: [86, 87],
  },
  fire: { firingSolutionPresent: false, engagementAuthorizedPresent: false },
  srcCombatUntouched: true,
}
```

Suggested first check set:

1. **S25.1 / S25.2:** HTML exists; no Flash; no shop; no live lock; no JSON combat writes.
2. **S25.3 / S25.4:** three identities + Tractor + deferred + inherited + labeled vacant stock; no fire gift.
3. **S25.5 / S25.6:** preservation replay (suites green; `src/` combat untouched); remastered-lock false.

## Recommended implementation order (later S25 only)

1. Add `docs/html-catalogs/index.html` banner: HTML review; Flash evidence; not a shop; lock false (S25.1 / S25.6).
2. Weapons page from ledger + `game_items.json` (S25.2 / S25.3). **Zero** JSON combat edits.
3. Stations type page from `station_manifest.json`; optional placements with labeled unknown stock (S25.3).
4. Confirm no Buy chrome and no fire inject (S25.2 / S25.4).
5. Preservation: `src/` combat / construction / ledger modules untouched; S14–S24 still green (S25.5).
6. Optional generator + offline assert. **Not** dockClear polish. **Not** an in-game panel.

Skip invented utilities, `git am`, `game_items.json` combat retune, EW / boarding / Phase 10 / flags / ledger / empty-armable / construction hooks, economy knobs, and “final” price certification entirely.

## Out of scope for the writer of a later slice

Engine work **before** a brief Pass; HTML pages on **this** docs PR; dockClear polish; `game_items.json` combat retune; collapsing disruptors; moving Tractor; locking Flash prices; inventing Bajoran Sail / Warp Core ids; inventing defs for vacant / unknown station-stock ids; shipping Thaleron Test Facility; redoing PR #18 repair arms; reopening construction #52 / #53; broader economy / difficulty knobs; in-game shop / loadout editor; `BM1-remastered-work` as source; `git am` remastered patches; remastered base `758665e`; claiming a Referee Pass; reopening #33 / #35 / #37 / #38 / #39 / #40 / #41 / #42 / #43 / #44 / #45 / #46 / #47 / #48 / #49 / #50 / #51 / #52 / #53; a sixth power consumer; gifted FS / `engagement_authorized` from opening a page; wiping delivered reports; flipping `tractorIsBoarding`; rewriting `meetPackPurchaseDecision`; a second Reman id; treating hull `REVIEW.html` as a weapon/station number source.

## Sources

- Proposal: `docs/html-catalogs/BM1-HTML-WEAPON-STATION-REVIEW-CATALOGS-PROPOSAL.md`
- Planning: `docs/GUIDED-CONVERGENCE.md` §9; `docs/revised-development-plan.md` §16.2 row 9
- Weapon ledger: `docs/weapon-ledger/`; PR #48 / #49; `src/weapon-source-ledger.js`; S22
- Phase 9 matrix: `src/phase9-weapons-matrix.js`; PR #33; S14.12–S14.15
- Live items: `data/game_items.json` at `91ecc2c`
- Station JSON: `data/station_manifest.json`; `data/stationData.json` at `91ecc2c`
- Hull HTML analog: `docs/ship-balance/REVIEW.html`
- Construction (stay locked): `docs/construction-visuals/`; PR #52 / #53; S24
- Repair cite: `src/side-lane-repair-reman.js`; PR #18
- Empty-armable: `docs/empty-armable/`; PR #50 / #51; S23
- Flags/passes: `docs/flags-passes/`; PR #46 / #47; S21
- EW locked: `docs/phase9/`; PR #33 / #35 / #37 / #42 / #43 / #44 / #45; S14–S20
- Phase 10 locked: `docs/phase10/`; PR #40 / #41; S18
- Boarding: `docs/boarding/`; PR #38 / #39; S17
- Companion shape: `docs/weapon-ledger/BM1-WEAPON-LEDGER-ENGINE-DEPENDENCIES.md`; `docs/construction-visuals/BM1-STATION-CONSTRUCTION-ENGINE-DEPENDENCIES.md`
