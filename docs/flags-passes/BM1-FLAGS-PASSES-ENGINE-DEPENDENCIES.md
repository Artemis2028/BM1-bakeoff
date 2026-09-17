# BM1 flags / passes / utility inventory: engine dependencies

**Reviewed document:** `BM1-FLAGS-PASSES-UTILITY-INVENTORY-PROPOSAL.md`  
**Reviewed against:** `Artemis2028/BM1-bakeoff` at `1e3f67d` on `main` (17 September 2026), after Phase 9.4 EW magnitudes playtest engine (PR #45). Line numbers below refer to this head and may drift.  
**Method:** read the landed `playerFlags` / planet flag shop / `settings.factionFlags` knobs / save-load of `weaponSlots` vs flags / inventory panel / Phase 1 raise-plant / Phase 8 shop-standing / in-repo Thaleron and `_root.asteroidpass` evidence. No engine changes made. This is a dependency/risk checklist for a later writer, not a post-implementation review and not permission to implement before Tenth scopes the lane. **Keep #33, #35, #37, #38, #39, #40, #41, #42, #43, #44, and #45 locked.** Do not reopen EW, boarding, or Phase 10. Do not open empty-but-armable, weapon-ledger retune, construction visuals, dockClear polish, or HTML catalogs.

## Verdict in one paragraph

Flags / passes can be implemented as a **thin utility book** without rewriting combat, EW, boarding, Dominion knowledge layers, or Phase 1 allegiance. Prefer one new module (`src/utility-inventory.js` / `src/flags-passes.js`, name can change) that **aliases** landed `state.playerFlags` for `faction_flag` rows, holds `facility_pass` as **`[]`**, serializes **beside** `weaponSlots`, and hard-fails any write into the three combat/device slots, the weapon locker, cargo pods, the suite slot, or `ew_equipment`. `settings.factionFlags` stay **price knobs** (injectable); live `getFlagPrice()` today returns **1000** and does not read them — do not pretend the Settings chrome is the inventory. **Thaleron Test Facility pass is unverified — not shipped.** Capacity / activation stay unset. `UTILITY_LOCKED_FROM_REMASTERED === false`. The load-bearing risks are all integration mistakes: stuffing a flag into `weaponSlots`; folding the book into `systemStates`; inventing a Nausica facility from a guided note; gifting `firingSolution` / `engagement_authorized`; `git am` remastered; reopening #33–#45.

## What already exists (do not reinvent)

| Need | Engine fact at `1e3f67d` |
| --- | --- |
| Price knobs | `data/game_items.json` `settings.factionFlags`: `basePrice` 1800, `marketMultiplier` 175, `blockedFactions` `["pirate","borg"]`. Mirrored in `src/main.js` `DEFAULT_ITEM_SETTINGS.factionFlags` (~916–920) and `itemSettings` (~962–966). Settings chrome paths (~1781–1783). Debug readout (~9786). |
| Knob reader | `getFactionFlagSettings()` (~3541) → `isFactionFlagBlocked` (~3565). **Used for blocked sales only.** |
| Live flag price | `getFlagPrice()` (~8840–8846) computes `market` / `factionPremium` then **`return 1000`**. Does **not** read `basePrice` / `marketMultiplier`. |
| Planet-only sale | `getLocalFlagOffer()` (~8848): `null` if docked at a station. `buyFactionFlag()` (~12870): refuses stations; `serviceRefusal`; debit latinum; `state.playerFlags.push`. Buy **does not** set `playerFaction` (raise is separate). |
| Owned-flag list | `state.playerFlags` init `[]` (~1246); `normalizePlayerFlags()` (~8554) also inserts current `playerFaction` if purchasable. `hasPlayerFlag`. New game (~22757) `[state.playerFaction]`. `resetRunState` clears (~22543). |
| Raise / plant | `raisePlayerFlag` (~12905) changes allegiance + `retainPoliciesAcrossFlagChange`. `plantFlagForEmpire` (~8629) consumes the flag, writes `factionSystemOverrides`, standing ±, `plantFlagDoesNotGrantMarketTrust()`. `flagShareGrantsSystemControl()` stays false. |
| Three combat slots | `state.weaponSlots` length 3 (~1347). `weaponInventory` + `getWeaponInventoryLimit()` (default 9). Tractor id 25 Device. Suite / `ewEquipmentId` are **dedicated** non-weapon slots. |
| Other inventories | `cargoArray` trade pods; `stationPlans` build plans. Inventory panel already has a **Flags** strip (`renderPlayerFlagsPanel` ~8865) above weapons. |
| Save / load | `saveGame` (~14015) writes `playerFlags` (~14054) **and** `weaponSlots` (~14060) as **sibling** keys, plus `weaponInventory`, `cargoArray`, `stationPlans`, books (`incidentLedger`, `marketBook`, `dominionBook`, `ew94`, …). `loadGame` (~14117) restores `playerFlags` (~14202) then `weaponSlots` (~14216). `state.systemStates = {}` still wipes on load — **do not** put the utility book there. |
| Shop / standing | `serviceRefusal` (~8613) hostile ports + Cardassian/Romulan feat gates + Phase 3 dock deny. `evaluateWiredPurchase` / `meetPackPurchaseDecision` are **hull** paths (PR #28 / Phase 8). Money ≠ standing ≠ Reman. Do not steal them for a pass unlock. |
| Probe surface | `__BM1_PROBE__` already exposes `playerFlags`, `addFlag`, `raiseFlag`, `flagShareGrantsControl`. Phase books: `.phase9` … `.phase94`, `.boarding`, `.phase10`. **S21** should add `.utility` / `.flagsPasses` rather than fork S14–S20. |
| Thaleron evidence | Weapon id 26 only. No pass item. Planet Nausica + station “Nausica Orbital”. **No** “Nausica Orbital Bar.” Guided patch names the pass as **source material to verify**. Flash `_root.asteroidpass` (~`data/fla_actions_index.json`) is a mining-prestige boolean, not an item. |

**Gap this brief closes:** there is no durable `utilityBook` (or equivalent) for credentials, no `facility_pass` home, no probe-visible contract that buy/hold cannot touch the three slots, and no explicit **unverified — not shipped** snapshot for Thaleron. Price knobs exist; a working pass/flag **inventory** does not.

## Hooks the writer will have to touch

Prefer a thin new file rather than growing `buyFactionFlag` into a second religion:

| Proposed module | Responsibility |
| --- | --- |
| `src/utility-inventory.js` (name can change) | `emptyUtilityBook` / `serialize` / `restore`. Alias `playerFlags` into `faction_flag` rows. `facility_pass: []`. `UTILITY_LOCKED_FROM_REMASTERED === false`. Hard-fail slot writes. Snapshot + inject price knobs. Thaleron `shipped: false`. Capacity/activation **unset**. |
| `src/main.js` | Thin: create/restore the book next to other books; `saveGame` / `loadGame` / `resetRunState` / new game; `__BM1_PROBE__.utility`. Keep `buyFactionFlag` as the flag write-path (plus alias). **Do not** invent a Thaleron vendor. Optional Inventory strip for passes — **empty state only**; not dockClear polish; not activation UX. |
| `getFlagPrice` / `getFactionFlagSettings` | Declare the live default. Optional: read knobs **if** inject says so. Do not lock 1800 / 175 / 1000. |
| Offline test | Add `scripts/test-utility-inventory.mjs` (slots unchanged; save/load; lock false; Thaleron not shipped). Do **not** rewrite S14–S20 files. |

Do **not** implement this inside `src/phase9-*.js`, `src/phase94-magnitudes.js`, `src/boarding-*.js`, `src/phase10-*.js`, `src/phase8-markets.js` (except a later subscribe if a sale is book-tied), or `createNpcShip`. Do **not** `git am` remastered patches. Do **not** retune weapon rows in `game_items.json`. Do **not** add EW families.

| Existing path | Required integration |
| --- | --- |
| `buyFactionFlag` / `getLocalFlagOffer` | After a legal buy, slots unchanged; book aliases the new flag. Still planet-only. Still `serviceRefusal`. Buy still ≠ raise. |
| `raisePlayerFlag` / `plantFlagForEmpire` | **Subscribe.** Do not rewrite Phase 1. Plant still consumes the flag. Flag-share still ≠ control. Plant still ≠ market trust. |
| `normalizePlayerFlags` | Keep inserting current faction if purchasable **or** document a change. Book must not drift. |
| `weaponSlots` / `assignWeaponToSlot` / `buyWeapon` | Untouched by credential buys. Fail if a flag id lands in a slot. |
| `weaponInventory` / `cargoArray` / `stationPlans` / suite / `ewEquipmentId` | Untouched. Do not steal locker capacity (`weaponInventoryLimit` is weapons). |
| `saveGame` / `loadGame` / `resetRunState` | New sibling key for `utilityBook`. Load still wipes `systemStates` first. Restore book **with** `playerFlags`, **not** inside slots. No `performance.now()` credential deadlines. Old saves: passes `[]`. |
| `serviceRefusal` / Phase 8 `marketBook` | Flag sale may later subscribe finite stock; first slice may leave the landed latinum debit. Do not convert a missing pass into `hostile` / `attackId`. Price ≠ ban bypass. Credits ≠ Reman. |
| `evaluateWiredPurchase` / `meetPackPurchaseDecision` | **Do not hook** as a flag/pass unlock. |
| `consultDoctrineFire` / `liveFireFactsFromEw` | Pass layer facts only. Keep the delete. A held credential must not flip `mayAutoEngage`. |
| `seedFromReport` / contact book / `dominionBook` | A pass is not a rumor, not a discovery write, not FS. |
| Boarding helpers | A pass is not reach and not ≤10% hull. Tractor still not board. |
| `__BM1_PROBE__` | Add `utility.snapshot` / `inject` (see probe plan). **Fail setup if missing.** Keep `phase9`…`phase94` / `boarding` / `phase10` intact. |
| `.top-left-panel` inventory | Later engine: empty-pass copy is enough. Activation chrome **out** (gate 6). DockClear polish **out**. |

## Risks

### 1. Flag or pass lands in a combat slot (gate 1)

`buyWeapon` already auto-loads an empty hardpoint. A writer who “adds flags to inventory” by pushing onto `weaponInventory` or the first empty `weaponSlots` index fails the room lock even if raise/plant still work.

**Gate:** S21.1.

### 2. Book dies on `loadGame` or lives inside `systemStates` (gate 2)

`systemStates` still wipes on load. Serializing credentials only on the scene cache, or restoring them into `weaponSlots`, fails “separately from the three slots.”

**Gate:** S21.2.

### 3. Knobs treated as the inventory / prices locked (gate 3)

Shipping a Settings-only “we already have flags” claim, or locking 1800 / 175 / 1000 / guided 90,000 as non-overridable constants, fails “knobs ≠ inventory” and the injectable-price rule.

**Gate:** S21.3.

### 4. Invented Thaleron facility / vendor / pin (gate 4)

Nausica exists. Nausica Orbital exists. Bar-type stations exist. The guided patch names “Nausica Orbital Bar” + 90,000. Wiring any of those as a live pass shop from this brief fails verification honesty.

**Gate:** S21.4.

### 5. Credential becomes a fire / identity / campaign token (gate 5)

Using a flag or pass to gift FS, culture fire, `engagement_authorized`, Reman 53, Dominion reveal, or boarding reach fails the knowledge-layer lean (same as EW stories / Phase 10).

**Gate:** S21.5.

### 6. Invented capacity / hotkeys / activation UX (gate 6)

A “4 utility slots” constant, an F-key badge, or “must be fitted in U1” in this slice fails the open-rules lock.

**Gate:** S21.6.

### 7. Landed-lane sneak / remastered crib (gate 7)

Touching EW contest, `tractorIsBoarding`, Dominion pack gates, empty-armable auto-fill, weapon-matrix numbers, construction beams, dockClear, or `git am` remastered patches fails even if the book is green. Flipping any `*_LOCKED_FROM_REMASTERED` to true fails the blind rule.

**Gate:** S21.7.

## Probe plan (S21)

Add `scripts/test-utility-inventory.mjs` for offline slot-unchanged / serialize / lock-false / Thaleron-not-shipped tests, and Chromium S21 on `__BM1_PROBE__.utility`. **Replay S14–S20** via existing injectors; do not break them.

**Minimum probe additions:**

```js
__BM1_PROBE__.utility = {
  snapshot: () => ({
    utilityLockedFromRemastered: false,
    book: /* §3 shape */,
    playerFlags: /* alias, same contents as faction_flag ids */,
    weaponSlots: /* length 3 copy */,
    weaponInventory: /* copy */,
    cargoArray: /* copy */,
    thaleronTestFacilityPass: { shipped: false, verified: false },
    capacity: null,
    activation: 'unset',
    knobs: /* factionFlags settings as resolved */,
    liveFlagPrice: /* declared default or inject */,
    fire: { firingSolutionPresent: false, engagementAuthorizedPresent: false },
    boarding: { tractorIsBoard: false, implemented: true },
    dominion: { rumorGiftedFs: false },
    phase1: { flagShareGrantsControl: false, plantGrantsMarketTrust: false }
  }),
  buyFlag: (faction) => { /* fail setup if helper missing; must not mutate slots */ },
  injectKnobs: (opts) => { /* fail setup if missing; must change snapshot price/knob */ },
};
```

Suggested first Chromium set:

1. **S21.1 / S21.2:** buy/hold off slots; save/load sibling key.
2. **S21.3 / S21.4:** knobs injectable; remastered-lock false; Thaleron not shipped.
3. **S21.5 / S21.6 / S21.7:** no fire gift; capacity/activation unset; preservation replay.

## Recommended implementation order (dependencies)

1. `emptyUtilityBook` + alias `playerFlags` + hard-fail slot writes (S21.1). **Zero** Thaleron rows.
2. `saveGame` / `loadGame` / `resetRunState` sibling key (S21.2). Soft: existing suites still green.
3. Snapshot shape + knob inject + `UTILITY_LOCKED_FROM_REMASTERED === false` (S21.3).
4. Explicit Thaleron `shipped: false` / `verified: false` (S21.4).
5. Doctrine subscribe: no FS / `engagement_authorized`; raise/plant unchanged (S21.5).
6. Leave capacity/activation unset (S21.6).
7. Preservation replay S14–S20 (S21.7). Inventory empty-pass copy **optional**. **Not** dockClear polish. **Not** activation UX.

Skip invented facilities, `git am`, `game_items.json` combat retune, EW / boarding / Phase 10 hooks, empty-armable, construction visuals, HTML catalogs, and “final” price certification entirely.

## Out of scope for the writer of a later slice

Engine work **before** a brief Pass; UI screenshots on this docs PR; dockClear polish; weapon / `game_items.json` combat retune; empty-but-armable; station construction visuals; HTML review catalogs; shipping Thaleron Test Facility (place, quest, pin, or pass); inventing a mining-pass shop from `_root.asteroidpass`; stack limits / hotkeys / activation UX; `BM1-remastered-work` as source; `git am` remastered flags; remastered base `758665e`; claiming a Referee Pass; reopening #33 / #35 / #37 / #38 / #39 / #40 / #41 / #42 / #43 / #44 / #45; a sixth power consumer; gifted FS / `engagement_authorized` from a credential; wiping delivered reports; flipping `tractorIsBoarding`; rewriting `meetPackPurchaseDecision`; a second Reman id; treating a price knob as a live catalog.

## Sources

- Proposal: `docs/flags-passes/BM1-FLAGS-PASSES-UTILITY-INVENTORY-PROPOSAL.md`
- Planning: `docs/GUIDED-CONVERGENCE.md` §2; `docs/revised-development-plan.md` §16.2 row 2
- Knobs: `data/game_items.json` `settings.factionFlags`; `src/main.js` `getFactionFlagSettings` / `getFlagPrice` / `buyFactionFlag` / `saveGame` / `loadGame`
- Phase 1: `flagShareGrantsSystemControl`; `plantFlagDoesNotGrantMarketTrust`
- Flash boolean (not an item): `data/fla_actions_index.json` `_root.asteroidpass`
- Guided unverified note: `docs/incoming/full-roster-v2-guided.patch`
- EW locked: `docs/phase9/`; PR #33 / #35 / #37 / #42 / #43 / #44 / #45; S14–S20
- Boarding locked: `docs/boarding/`; PR #38 / #39; S17
- Phase 10 locked: `docs/phase10/`; PR #40 / #41; S18
- Shop / standing: `docs/phase8/`; `evaluateWiredPurchase`; `meetPackPurchaseDecision`
- Companion shape: `docs/phase9/BM1-PHASE9.4-ENGINE-DEPENDENCIES.md`; `docs/phase10/BM1-PHASE10-ENGINE-DEPENDENCIES.md`
