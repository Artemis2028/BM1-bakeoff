# BM1 weapon / device source ledger: engine dependencies

**Reviewed document:** `BM1-WEAPON-DEVICE-SOURCE-LEDGER-PROPOSAL.md`  
**Sail reclass (one line; body below unchanged; #48/#49 not reopened):** §6.1’s deferred-utility classification of Flash Bajoran Sail is **superseded** by `docs/bajoran-solar-sailor/` (ship / unarmed hull); Warp Core stays deferred; do not retune `DEFERRED_FLASH_UTILITIES` from this note.  
**Reviewed against:** `Artemis2028/BM1-bakeoff` at `6dc279b` on `main` (18 September 2026), after flags / passes / utility inventory engine (PR #47). Line numbers below refer to this head and may drift.  
**Method:** read the landed Phase 9 weapons matrix, `data/game_items.json` weapons + trade goods, catalog `packDefaultWeaponSlots`, Tractor / disruptor probe helpers, flags `utilityBook`, boarding `tractorIsBoarding()`, and GUIDED §1 Flash table. No engine changes made. This is a dependency/risk checklist for a **later** writer **if** Tenth scopes a thin data/audit engine — not a post-implementation review and not permission to implement before Tenth scopes the lane. **Keep #33, #35, #37, #38, #39, #40, #41, #42, #43, #44, #45, #46, and #47 locked.** Do not reopen EW, boarding, Phase 10, or flags/passes. Do not retune combat. Do not open empty-but-armable, construction visuals, dockClear polish, HTML catalogs, or Thaleron facility invent.

## Verdict in one paragraph

The source ledger can stay **docs-only**. If Tenth later scopes a thin audit engine, prefer **one new subscribe module** (`src/weapon-source-ledger.js`, name can change) that **reads** `buildWeaponsMatrix` / `listDeferredFlashUtilities` / `disruptorIdentities` / `tractorRow` / `combatNumbersUnchanged` and `data/game_items.json` **without rewriting them**. Snapshot Flash-vs-live prices as **labels**, keep `FLASH_PRICES_ARE_LIVE_LOCKS === false`, keep `UNIVERSAL_SHIELD_BYPASS === false`, hard-fail any write into live damage / cooldown / range / price, and classify Bajoran Sail / Warp Core as deferred utilities (`bakeoffId: null`) distinct from cargo “Warp Cores” and from `utilityBook`. `LEDGER_LOCKED_FROM_REMASTERED === false`. The load-bearing risks are all integration mistakes: retuning `game_items.json` “to match Flash”; collapsing ids 6/7/12; moving Tractor to cargo or `utilityBook`; inventing Sail / Warp Core ids; inventing Flash prices for inherited extras; gifting `firingSolution` / `engagement_authorized`; `git am` remastered; reopening #33–#47.

## What already exists (do not reinvent)

| Need | Engine fact at `6dc279b` |
| --- | --- |
| Live catalog | `data/game_items.json` `weapons[]` ids 1–19, 22–30, 38, 39, 44, 45 (no 20, 21, 31–37, 40–43). Schema `bm2.game_items.v1`. |
| Live prices / combat | Same file: e.g. Type X id 1 dmg 33 / cd 520 / range 820 / price 3000; Tractor id 25 Device price 3400; both “Disruptor Cannon” ids **6** (3000, `dualdisrupt.gif`) and **7** (1500, `singledisrupt.gif`); Disruptor Turret id 12 price 7800. |
| Trade goods | `tradeGoods` includes **“Warp Cores”** and “Warp Coils”. **No** “Warp Core” singular. **No** “Bajoran Sail”. |
| Runtime device knobs | `settings.devices.tractorBeam` / `cloak` / `engineDisruptor` / `thaleronGenerator`. Not Flash-certified. Do not retune. |
| Fallback catalog | `src/main.js` `DEFAULT_WEAPON_CATALOG` (~995–1002): subset ids 1, 15, 22, 23, 25, 26. Full list loaded via `normalizeWeaponCatalog` from JSON (~3620–3640). |
| Phase 9 matrix (read-only) | `src/phase9-weapons-matrix.js`: ten `MATRIX_COLUMNS`; `FLASH_PRICES_ARE_LIVE_LOCKS === false`; `UNIVERSAL_SHIELD_BYPASS === false`; `BASELINE_COMBAT_NUMBERS` frozen from engine-lane base; `FLASH_TABLE` maps Flash names/prices onto ids; `DEFERRED_FLASH_UTILITIES` Bajoran Sail + Warp Core; `INHERITED_NOT_IN_FLASH = [2, 27, 28, 29, 30, 38, 39, 44, 45]`; `HOJ_MATRIX_ROW` provenance `new`; `disruptorIdentities` keys 7/6/12; `tractorRow` id 25 Device; `combatNumbersUnchanged`; `mappingDidNotAutoFill`. |
| Matrix probe | `__BM1_PROBE__.phase9` exposes `rows`, `disruptors`, `tractor`, `numbersUnchanged`, `mappingAutoFill` (`main.js` ~25091 / ~25124). S14.12–S14.15 already green. **Do not rewrite S14.** |
| Catalog mapping | `src/ship-catalog-wire.js` `packDefaultWeaponSlots` (~94): first three `defaultWeaponSlots`, empties stay `null`. Matrix `attachHullMapping` marks `fitted` / `unmounted` / `inherited-only`. |
| Three combat slots | `state.weaponSlots` length 3. Tractor is a legal slot occupant. `buyWeapon` can auto-load an empty hardpoint — **do not** use that path for Sail / Warp Core / flags. |
| Other inventories | `weaponInventory` + `getWeaponInventoryLimit()` (default 9); `cargoArray`; `utilityBook` (flags/passes, PR #47); suite / `ewEquipmentId` dedicated. |
| Tractor ≠ board | `tractorIsBoarding() === false`. `BOARDING_IMPLEMENTED === true`. Phase 3 tractor hold = `unable_to_comply`. |
| Shield default | `damageNpcShip` shields-then-hull. Matrix `applyDefaultShieldAbsorb` / `applyRowShieldInteraction` never set `bypassedShields: true`. |
| Flags book | `src/utility-inventory.js`: credentials only. Thaleron pass `shipped: false`. Capacity/activation unset. **Do not** put weapons here. |
| Remastered locks | `MAGNITUDES_LOCKED_FROM_REMASTERED === false`; `UTILITY_LOCKED_FROM_REMASTERED === false`. Boarding / Phase 10 same. |
| Probe surface | `__BM1_PROBE__.phase9` … `.phase94`, `.boarding`, `.phase10`, `.utility`. **S22** should add `.weaponLedger` rather than fork S14–S21. |

**Gap this brief closes (docs now; engine only if scoped):** there is no **scoreable source ledger** that (a) prints Flash vs live with provenance columns, (b) **classifies** Bajoran Sail / Warp Core as deferred utilities rather than “verify later” hanging text, (c) lists every inherited extra without invented Flash prices, (d) calls the id 6/7 display-name collision an audit finding without collapsing the rows. Phase 9 already has the **behavior** matrix. Plan §16.2 row 1 still wanted the **source** audit.

## Hooks the writer will have to touch

**This PR touches none of these.** If Tenth later scopes a thin audit engine:

Prefer a thin new file rather than growing `phase9-weapons-matrix.js` into a second religion:

| Proposed module | Responsibility |
| --- | --- |
| `src/weapon-source-ledger.js` (name can change) | Subscribe to matrix + catalog. Snapshot Flash/live/provenance/deferred/inherited. `LEDGER_LOCKED_FROM_REMASTERED === false`. Hard-fail combat-number writes. Classify Sail / Warp Core. Do not invent ids. |
| `src/phase9-weapons-matrix.js` | **Read-only.** May add a label for Plasma Torpedo “Flash name / price unsupplied” **only if** it does not change combat, mapping hosts, or S14 asserts. Prefer keeping the split in the new module. |
| `src/main.js` | Thin: `__BM1_PROBE__.weaponLedger` with `snapshot`. **Do not** change `buyWeapon`, `DEFAULT_WEAPON_CATALOG` combat fields, or `game_items.json`. Optional Inventory / OPS readout of identities — **not** dockClear polish; **not** an HTML catalog. |
| `data/game_items.json` | **Do not edit** damage, cooldown, range, live price, type, or names in the audit engine. A display-rename of id 7 is **Q1 / later data slice**, not this lane. |
| Offline test | Add `scripts/test-weapon-source-ledger.mjs` (unchanged combat; three identities; Tractor slot; Flash-not-lock; deferred utilities; inherited list; lock false). Do **not** rewrite S14–S21 files. |

Do **not** implement this inside `src/phase9-ew.js`, `src/phase94-magnitudes.js`, `src/boarding-*.js`, `src/phase10-*.js`, `src/utility-inventory.js` (except a later assert that Sail / Warp Core / Tractor are absent from the book), `src/phase8-markets.js`, or `createNpcShip`. Do **not** `git am` remastered patches. Do **not** add EW families. Do **not** open empty-armable auto-fill (`hullIsEmptyButArmable` may be **cited**; implementing GUIDED §3 is **out**).

| Existing path | Required integration (later engine) |
| --- | --- |
| `buildWeaponsMatrix` / `listDeferredFlashUtilities` / `disruptorIdentities` / `tractorRow` / `combatNumbersUnchanged` | **Subscribe.** Snapshot must match. Fail setup if helpers missing. |
| `WEAPON_CATALOG` / `normalizeWeaponCatalog` | Read-only source of live rows. |
| `packDefaultWeaponSlots` | Mapping still `fitted` / `unmounted` / `inherited-only`. **No** auto-fill. |
| `buyWeapon` / `assignWeaponToSlot` | Untouched. Fail if Sail / Warp Core / a flag id lands in a slot. |
| `cargoArray` / trade goods | “Warp Cores” stays cargo. Fail if snapshot claims Flash Warp Core **is** that string. |
| `utilityBook` | Credentials only. Fail if Tractor / Sail / Warp Core / Cloak / Thaleron **Generator** appear as `facility_pass` or `faction_flag`. |
| `damageNpcShip` / `applyRowShieldInteraction` | Default shields-then-hull. Fail if `UNIVERSAL_SHIELD_BYPASS` flips true. |
| `consultDoctrineFire` / `liveFireFactsFromEw` | Ledger inject must not write `firingSolution` or `engagement_authorized`. Keep the delete. |
| `tractorIsBoarding` | Stays false. Tractor hold still Phase 3 inability. |
| `saveGame` / `loadGame` | Audit snapshot is **not** run-state. Do not persist Flash prices as live locks. No `performance.now()` deadlines. Do **not** put a ledger book inside `systemStates`. |
| `__BM1_PROBE__` | Add `weaponLedger.snapshot` (see probe plan). **Fail setup if missing.** Keep `phase9` … `phase94` / `boarding` / `phase10` / `utility` intact. |
| `.top-left-panel` inventory | Later engine: identity labels optional. HTML catalog **out**. DockClear polish **out**. |

## Risks

### 1. Combat retune disguised as audit (gate 1)

Editing `game_items.json` / `DEFAULT_WEAPON_CATALOG` / `BASELINE_COMBAT_NUMBERS` “so Flash and live match,” or rewriting matrix combat columns, fails “audit, not retune” even if identities tables look right.

**Gate:** S22.1.

### 2. Collapsing Canon / Cannon / Turret (gate 2)

Merging id 6 and 7 because both live-name “Disruptor Cannon,” or dropping the turret into a generic disruptor family, fails three-identity even if prices still differ.

**Gate:** S22.2.

### 3. Tractor leaves the slot (gate 3)

Moving id 25 to cargo, `utilityBook`, or `tractorIsBoarding() === true` fails the slot lock. Flags/passes already forbade the credential-book path; do not reverse it from this lane.

**Gate:** S22.2.

### 4. Flash numbers locked as live prices (gate 4)

Copying GUIDED prices into non-overridable constants, flipping `FLASH_PRICES_ARE_LIVE_LOCKS` true, or treating Plasma Torpedo 7200 as Flash-certified fails “source, not final.”

**Gate:** S22.3.

### 5. Silent cargo / invented utility ids (gate 5)

Merging Warp Core into “Warp Cores,” adding a Sail weapon id in a vacant hole, or stuffing either into `utilityBook` fails classify-or-defer.

**Gate:** S22.4.

### 6. Inherited extras deleted or given fake Flash prices (gate 6)

Dropping Particle Beam / Magnetorp / Biobeam / Tesla / Subspace / Proton / Gatling / Wave Pulse / Vortex Ray from the snapshot, or printing a invented Flash cell for them, fails the silence rule.

**Gate:** S22.5.

### 7. Lore bypass / gifted fire (gate 7)

`if (name.includes('polaron') || name.includes('transphasic')) skipShields`, or a ledger inject that sets `firingSolution` / `engagement_authorized` / culture fire, fails provenance-as-not-permission.

**Gate:** S22.6.

### 8. Landed-lane sneak / remastered crib (gate 8)

Touching EW contest, boarding XOR, Dominion pack gates, flags Thaleron-shipped, empty-armable auto-fill, construction beams, dockClear, HTML catalogs, or `git am` remastered patches fails even if the snapshot is green. Flipping any `*_LOCKED_FROM_REMASTERED` to true fails the blind rule.

**Gate:** S22.7.

## Probe plan (S22)

**Not in this docs PR.** Add `scripts/test-weapon-source-ledger.mjs` and Chromium S22 on `__BM1_PROBE__.weaponLedger` **only after** Tenth scopes engine. **Replay S14–S21** via existing injectors; do not break them.

**Minimum probe additions:**

```js
__BM1_PROBE__.weaponLedger = {
  snapshot: () => ({
    ledgerLockedFromRemastered: false,
    flashPricesAreLiveLocks: false,
    universalShieldBypass: false,
    combatUnchanged: /* combatNumbersUnchanged vs BASELINE_COMBAT_NUMBERS */,
    matrixColumns: 10,
    disruptors: {
      canon: { id: 7, flashIdentity: 'Disrupter Canon' },
      cannon: { id: 6, flashIdentity: 'Disrupter Cannon' },
      turret: { id: 12, flashIdentity: 'Disrupter Turret' },
      distinct: true
    },
    tractor: { id: 25, type: 'Device', slot: true, cargo: false, boarding: false },
    plasmaTorpedo: { id: 17, livePrice: 7200, flashCertified: false },
    deferredUtilities: [
      { flashName: 'Bajoran Sail', bakeoffId: null, cargo: false, utilityBook: false },
      { flashName: 'Warp Core', bakeoffId: null, cargoNameWarpCoresDistinct: true, utilityBook: false }
    ],
    inheritedNotInFlash: [2, 27, 28, 29, 30, 38, 39, 44, 45],
    hoj: { provenance: 'new', catalogId: null },
    vacantIdsStillVacant: [20, 21, 31, 32, 33, 34, 35, 36, 37, 40, 41, 42, 43],
    fire: { firingSolutionPresent: false, engagementAuthorizedPresent: false },
    boarding: { tractorIsBoard: false, implemented: true }
  })
};
```

Suggested first Chromium set:

1. **S22.1 / S22.2:** combat unchanged; three disruptors; Tractor slot.
2. **S22.3 / S22.4 / S22.5:** Flash not lock; deferred utilities; inherited list complete.
3. **S22.6 / S22.7:** no bypass / no fire gift; preservation replay; remastered-lock false.

## Recommended implementation order (later engine only)

1. Subscribe snapshot; assert `combatNumbersUnchanged` (S22.1). **Zero** JSON combat edits.
2. Three identities + Tractor Device (S22.2).
3. `FLASH_PRICES_ARE_LIVE_LOCKS === false`; Plasma `flashCertified: false` (S22.3).
4. Deferred Sail / Warp Core; cargo “Warp Cores” distinct (S22.4).
5. Inherited extras listed; HoJ still `new`; vacant ids vacant (S22.5).
6. Provenance enum + shields-then-hull + no FS inject (S22.6).
7. Preservation replay S14–S21 (S22.7). Optional identity labels. **Not** dockClear polish. **Not** HTML catalogs. **Not** empty-armable.

Skip invented utilities, `git am`, `game_items.json` combat retune, EW / boarding / Phase 10 / flags hooks, construction visuals, and “final” price certification entirely.

## Out of scope for the writer of a later slice

Engine work **before** a brief Pass; UI screenshots on this docs PR; dockClear polish; `game_items.json` combat retune; collapsing disruptors; moving Tractor; locking Flash prices; inventing Bajoran Sail / Warp Core ids; merging Warp Core into cargo; inventing Flash prices for inherited extras; filling vacant ids; empty-but-armable; station construction visuals; HTML review catalogs; shipping Thaleron Test Facility (place, quest, pin, or pass); `BM1-remastered-work` as source; `git am` remastered patches; remastered base `758665e`; claiming a Referee Pass; reopening #33 / #35 / #37 / #38 / #39 / #40 / #41 / #42 / #43 / #44 / #45 / #46 / #47; a sixth power consumer; gifted FS / `engagement_authorized` from a ledger row; wiping delivered reports; flipping `tractorIsBoarding`; rewriting `meetPackPurchaseDecision`; a second Reman id; universal shield bypass.

## Sources

- Proposal: `docs/weapon-ledger/BM1-WEAPON-DEVICE-SOURCE-LEDGER-PROPOSAL.md`
- Planning: `docs/GUIDED-CONVERGENCE.md` §1; `docs/revised-development-plan.md` §11 / §13 / §16.2 row 1
- Live catalog: `data/game_items.json` at `6dc279b`
- Phase 9 matrix: `src/phase9-weapons-matrix.js`; `docs/phase9/BM1-PHASE9-EW-WEAPONS-PROPOSAL.md` §6; PR #33; S14.12–S14.15
- Catalog wire: `src/ship-catalog-wire.js` `packDefaultWeaponSlots`; PR #28
- Flags/passes: `docs/flags-passes/`; PR #46 / #47; S21
- EW locked: `docs/phase9/`; PR #33 / #35 / #37 / #42 / #43 / #44 / #45; S14–S20
- Boarding locked: `docs/boarding/`; PR #38 / #39; S17
- Phase 10 locked: `docs/phase10/`; PR #40 / #41; S18
- Companion shape: `docs/flags-passes/BM1-FLAGS-PASSES-ENGINE-DEPENDENCIES.md`; `docs/phase9/BM1-PHASE9.4-ENGINE-DEPENDENCIES.md`
