# BM1 empty but armable ships: engine dependencies

**Reviewed document:** `BM1-EMPTY-ARMABLE-SHIPS-PROPOSAL.md`  
**Reviewed against:** `Artemis2028/BM1-bakeoff` at `a3d9611` on `main` (19 September 2026), after weapon / device source ledger engine (PR #49). Line numbers below refer to this head and may drift.  
**Method:** read landed three-slot state, `packDefaultWeaponSlots` / `hullIsEmptyButArmable` / `unarmedNpcCannotFire`, `applyShipDefaultWeapons` / `normalizeWeaponLoadout`, NPC spawn / scene realize / security restore, `getNpcCombatWeaponId` / `fireNpcWeapon` / `firePlayerWeapon`, `consultDoctrineFire`, save/load, boarding prize-preserve, Tractor Device, and GUIDED §3. No engine changes made. This is a dependency/risk checklist for a **later** writer **if** Tenth scopes a thin persistence / physical-gate engine — not a post-implementation review and not permission to implement before Tenth scopes the lane. **Keep #33, #35, #37, #38, #39, #40, #41, #42, #43, #44, #45, #46, #47, #48, and #49 locked.** Do not reopen EW, boarding, Phase 10, flags/passes, or the weapon ledger. Do not retune combat. Do not open dockClear polish, construction visuals, HTML catalogs, or Flash price locks.

## Verdict in one paragraph

Empty-but-armable can stay **docs-only**. If Tenth later scopes a thin engine, prefer **one new subscribe module** (`src/empty-armable.js`, name can change) that **canonicalizes** `[]` / `[null, null, null]` as three empty slots, **hard-fails** Type X / `DEFAULT_WEAPON_ID` auto-fill on save/load/scene/restore/`applyShipDefaultWeapons`, and **closes** the `getNpcCombatWeaponId` → `getDefaultWeaponId` fallback when live slots are empty. Subscribe to `packDefaultWeaponSlots` / `hullIsEmptyButArmable` / `unarmedNpcCannotFire` and boarding `emptySlotsStayEmpty`. Keep Tractor id 25 on the device slot. `EMPTY_ARMABLE_LOCKED_FROM_REMASTERED === false`. The load-bearing risks are all integration mistakes: treating helper existence as the Pass; filling slot 0 in `normalizeWeaponLoadout`; restoring security participants without slots and then defaulting a Phaser; letting doctrine inspect mint a weapon id; moving Tractor; `git am` remastered; reopening #33–#49.

## What already exists (do not reinvent)

| Need | Engine fact at `a3d9611` |
| --- | --- |
| Three combat slots | `state.weaponSlots` length 3 (`main.js` ~1369). Init `[DEFAULT_WEAPON_ID, null, null]` on the **starter** hull — not this package. `DEFAULT_WEAPON_ID = 1` Type X (~863). |
| Pack empty examples | `bm-ships/ships.json` **348 / 349 / 350**: `defaultWeaponSlots: [null, null, null]`, `armedByDefault: false`. Cited in `docs/SHIP-ECONOMY-REVIEW.md`. |
| Pack slot helper | `src/ship-catalog-wire.js` `packDefaultWeaponSlots` (~94): first three `defaultWeaponSlots`; empties stay `null`. Returns `null` when the field is missing. |
| Empty-armable helper | `hullIsEmptyButArmable` (~106): pack slots exist **and** none are filled. Offline `scripts/test-catalog-wire.mjs` already asserts one such hull + `unarmedNpcCannotFire`. |
| Unarmed helper | `unarmedNpcCannotFire` (~116): `armedByDefault === false` **or** a non-empty list with no combat id. **Caveat:** `[]` (length 0) does **not** trip the list clause unless `armedByDefault === false`. |
| Combat vs device | `isCombatWeapon` (~10975): damage > 0, not cloak, not Tractor. Tractor-only ⇒ no projectile. |
| NPC default slots | `getNpcDefaultWeaponSlots` (~2131): pack copy, else `getOriginalShipWeaponSlots`, else `[null, null, null]`. `createNpcShip` writes that (~2196). |
| Original-slot filler | `getOriginalShipWeaponSlots` (~11080): if no filled slot **and not** `hullIsEmptyButArmable` **and not** `packSlots`, slot 0 ← `getDefaultWeaponId` (~11090–11092). |
| Player apply / normalize | `applyShipDefaultWeapons` (~11096) then `normalizeWeaponLoadout` (~11109). Empty-by-design + saved-empty early return (~11131–11141). `preserveFittedWeaponSlots` boarding path (~11110). Other paths fill slot 0 (~11154–11160). `equippedWeaponId` may fall back to `DEFAULT_WEAPON_ID` (~11105, ~11169). |
| Legal install | `buyWeapon` (~11193) auto-loads first empty compatible slot (~11227). `loadWeaponSlot` (~11237) writes that id. **Keep** as legal install. |
| Player fire | `firePlayerWeapon` (~17658): empty slot logs and returns (~17664). **Leak:** `getWeapon()` with no id still resolves Type X (~10800). `getPlayerWeaponRange` (~16607) `Math.max` over empty slots still falls through to `PLAYER_WEAPON_RANGE`. |
| NPC fire | `getNpcCombatWeaponId` (~16612): unarmed helper / empty-armable → `null`, **else** `getDefaultWeaponId(..., true)` (~16619). `fireNpcWeapon` (~17817) returns if no id, **then** `consultDoctrineFire` (~17821). |
| Doctrine inspect | `consultDoctrineFire` (~8444): sets `weaponUsable/Ready/insideEquippedRange: true` (~8470–8472); **deletes** `engagement_authorized` (~8489). Inspect ≠ emit. |
| Save / load | `saveGame` writes `weaponSlots` (~14116). `loadGame` restores (~14277), wipes `systemStates` (~14314), `applySystemState` + `reconcileSecurityParticipants`, then `normalizeWeaponLoadout()` (~14332). |
| Scene realize | Cached NPC copy keeps `weaponSlots.slice(0, 3)` or defaults (~3225). |
| Security restore | `applyParticipantSnapshot` (~7540) does **not** copy `weaponSlots`. `reconcileSecurityParticipants` may `createNpcShip` (pack defaults) then overlay snapshot (~8177). |
| Boarding preserve | `emptySlotsStayEmpty: true` on prize identity (`main.js` ~27317; S17.10). `preserveFittedWeaponSlots` around command transfer (~5802–5819). **Do not reopen.** |
| Tractor | Id 25 Device. `TRACTOR_BEAM_WEAPON_ID` (~898). `tractorIsBoarding() === false`. Ledger snapshot already asserts slot / not cargo. |
| Other inventories | `weaponInventory` + limit default 9; `cargoArray`; `utilityBook` (PR #47); suite / `ewEquipmentId` dedicated. |
| Probe surface | `__BM1_PROBE__.phase9` … `.phase94`, `.boarding`, `.phase10`, `.utility`, `.weaponLedger`, `.catalog.emptySlots`. **S23** should add `.emptyArmable` rather than fork S14–S22. |
| Remastered locks | `MAGNITUDES_LOCKED_FROM_REMASTERED === false`; `UTILITY_LOCKED_FROM_REMASTERED === false`; `LEDGER_LOCKED_FROM_REMASTERED === false`. |

**Gap this brief closes (docs now; engine only if scoped):** there is no **scoreable S23 contract** that (a) `[]` and three nulls stay empty across save/load/scene/restoration, (b) an unarmed NPC cannot emit even when doctrine / ROE / hostility are forced, (c) a legal install fires that def only, (d) Tractor stays a slot and empty-armable never gifts FS / `engagement_authorized`. Catalog helpers and boarding prize-preserve are **partial subscribe points**, not the package.

## Hooks the writer will have to touch

**This PR touches none of these.** If Tenth later scopes a thin engine:

Prefer a thin new file rather than growing `normalizeWeaponLoadout` into a second religion:

| Proposed module | Responsibility |
| --- | --- |
| `src/empty-armable.js` (name can change) | Canonicalize `[]` / three nulls. `slotsAreEmpty`. Hard-fail Type X auto-fill. `EMPTY_ARMABLE_LOCKED_FROM_REMASTERED === false`. Physical `mayEmitProjectile(slots)`. Never write FS / `engagement_authorized`. |
| `src/ship-catalog-wire.js` | **Subscribe.** May treat live empty arrays as empty **without** rewriting purchase / Reman / region gates. |
| `src/main.js` | Thin: `getOriginalShipWeaponSlots` / `normalizeWeaponLoadout` / `getNpcCombatWeaponId` / restore paths call the new helpers. `__BM1_PROBE__.emptyArmable`. **Do not** change `buyWeapon` legal auto-load. **Do not** edit `game_items.json`. Optional Inventory “unarmed” copy — **not** dockClear polish. |
| `applyParticipantSnapshot` / scene realize | Persist or re-apply empty slots. Missing snapshot slots on an empty-armable / previously-empty hull must not fill Type X. |
| Offline test | Add `scripts/test-empty-armable.mjs` (three slots; persist; no projectile; installed-def-only; Tractor slot; lock false). Do **not** rewrite S14–S22 files. |

Do **not** implement this inside `src/phase9-*.js`, `src/phase94-magnitudes.js`, `src/weapon-source-ledger.js` (except a later assert that mapping still did not auto-fill), `src/boarding-*.js` (except keep `emptySlotsStayEmpty`), `src/phase10-*.js`, `src/utility-inventory.js` (except a later assert that empty-slot state is absent from the book), or `src/phase8-markets.js`. Do **not** `git am` remastered patches. Do **not** add EW families. Do **not** retune combat.

| Existing path | Required integration (later engine) |
| --- | --- |
| `packDefaultWeaponSlots` / `hullIsEmptyButArmable` / `unarmedNpcCannotFire` | **Subscribe.** Fail setup if helpers missing. Extend “live empty ⇒ empty” so `[]` cannot fall through to Type X. |
| `getOriginalShipWeaponSlots` / `applyShipDefaultWeapons` | No filler when pack-empty **or** live-empty. `equippedWeaponId` may be `null`. |
| `normalizeWeaponLoadout` | Keep empty-by-design and `preserveFittedWeaponSlots`. Stop slot-0 fallback for empty-armable / forced-empty. |
| `buyWeapon` / `loadWeaponSlot` | **Untouched as legal install.** Fail if those paths stop loading a bought gun into an empty slot. |
| `getNpcCombatWeaponId` / `fireNpcWeapon` | No `getDefaultWeaponId` when live slots are empty. No projectile / beam. |
| `firePlayerWeapon` / `getWeapon` | Empty slot still refuses. Do not resolve Type X from a missing id on an unarmed hull. |
| `consultDoctrineFire` / `liveFireFactsFromEw` | Keep the `engagement_authorized` delete. Empty-armable inject must not write `firingSolution`. Optional honest `weaponUsable: false`. |
| `saveGame` / `loadGame` | Slots persist. `systemStates` wipe must not refill. No `performance.now()` deadlines. |
| Scene realize / `applyParticipantSnapshot` | Empties survive restore. |
| Boarding helpers | Subscribe `emptySlotsStayEmpty`. Do not call `applyShipDefaultWeapons` on capture / transfer. |
| `utilityBook` / cargo / suite / `ew_equipment` | Untouched. Fail if empty-slot state or Tractor lands there. |
| `tractorIsBoarding` | Stays false. Tractor hold still Phase 3 inability. |
| `__BM1_PROBE__` | Add `emptyArmable.snapshot` (see probe plan). **Fail setup if missing.** Keep `phase9` … `weaponLedger` intact. |
| `.top-left-panel` inventory | Later engine: “unarmed / three empty” copy optional. DockClear polish **out**. HTML catalog **out**. |

## Risks

### 1. Fourth slot / stolen inventory (gate 1)

Writing flags, Sail, or a “gun locker overflow” into `weaponSlots[3]`, `utilityBook`, or the suite slot fails “three slots.”

**Gate:** S23.1 / S23.6.

### 2. Type X auto-fill on persist / restore (gate 2)

`normalizeWeaponLoadout` slot-0 fallback, `getOriginalShipWeaponSlots` filler, `loadGame` `equippedWeaponId ?? DEFAULT_WEAPON_ID`, or security restore via `createNpcShip` + missing snapshot slots will gift id 1. Treating `[]` as “unknown” is the same fail.

**Gate:** S23.1 / S23.2.

### 3. Doctrine / hostility mints a shot (gate 3)

Leaving `getNpcCombatWeaponId`’s `getDefaultWeaponId` fallback, or moving `consultDoctrineFire` **before** the physical null-check and using inspect success to pick Type X, fails “unarmed cannot fire.”

**Gate:** S23.3.

### 4. Fire ignores the installed def (gate 4)

`getWeapon()` defaulting to Type X, emitting a sibling disruptor, or firing an empty sibling slot after a legal Photon install fails “installed def only.” Blocking `buyWeapon` auto-load fails the other way.

**Gate:** S23.4.

### 5. Tractor leaves the slot (gate 5)

Moving id 25 to cargo, `utilityBook`, or `tractorIsBoarding() === true` because “empty-armable is about guns” fails the slot lock.

**Gate:** S23.5.

### 6. Empty status becomes a fire token (gate 6)

An empty-armable inject that sets `firingSolution` / `engagement_authorized` / culture fire, or a Phase 10 rumor from “unarmed,” fails the knowledge-layer lean.

**Gate:** S23.5.

### 7. Landed-lane sneak / remastered crib (gates 7–8)

Touching EW contest, boarding XOR, Dominion pack gates, flags Thaleron-shipped, ledger combat numbers, construction beams, dockClear, HTML catalogs, Flash price locks, or `git am` remastered patches fails even if S23.1 is green. Flipping any `*_LOCKED_FROM_REMASTERED` to true fails the blind rule. Treating catalog-wire helper tests as the S23 Pass also fails — those tests do not exercise save/load/fire.

**Gate:** S23.6.

## Probe plan (S23)

**Not in this docs PR.** Add `scripts/test-empty-armable.mjs` and Chromium S23 on `__BM1_PROBE__.emptyArmable` **only after** Tenth scopes engine. **Replay S14–S22** via existing injectors; do not break them.

**Minimum probe additions:**

```js
__BM1_PROBE__.emptyArmable = {
  snapshot: () => ({
    emptyArmableLockedFromRemastered: false,
    slotCount: 3,
    weaponSlots: /* length-3 copy */,
    equippedWeaponId: /* null when empty */,
    canonicalEmpty: /* [] and [null,null,null] both read empty */,
    autoFilledDefaultWeapon: false,
    npc: {
      shipId: /* 348/349/350 or forced-empty */,
      weaponSlots: /* three empties */,
      combatWeaponId: null,
      emittedProjectile: false,
    },
    tractor: { id: 25, type: 'Device', slot: true, cargo: false, boarding: false },
    fire: { firingSolutionPresent: false, engagementAuthorizedPresent: false },
    boarding: { tractorIsBoard: false, implemented: true, emptySlotsStayEmpty: true },
  }),
  spawnEmpty: (shipId = 350, slots = [null, null, null]) => { /* fail setup if missing; must not fill Type X */ },
  install: (weaponId, slot = 1) => { /* legal load; fail setup if missing */ },
  tryNpcFire: () => { /* must not emit while empty */ },
};
```

Suggested first Chromium set:

1. **S23.1 / S23.2:** purchase or spawn empty; save/load; scene / restore still empty.
2. **S23.3 / S23.4:** unarmed never emits; legal install fires that def only.
3. **S23.5 / S23.6:** Tractor slot; no fire gift; preservation replay; remastered-lock false.

## Recommended implementation order (later engine only)

1. Canonicalize `[]` / three nulls; snapshot slotCount 3; hard-fail Type X auto-fill (S23.1).
2. Scene + `loadGame` + security restore (S23.2).
3. Close `getNpcCombatWeaponId` fallback; `fireNpcWeapon` emits nothing (S23.3).
4. Legal `loadWeaponSlot` / `buyWeapon` fires installed id only (S23.4).
5. Tractor Device; no FS / `engagement_authorized` (S23.5).
6. Preservation replay S14–S22 (S23.6). Optional “unarmed” inventory copy. **Not** dockClear polish. **Not** HTML catalogs.

Skip invented utilities, `git am`, `game_items.json` combat retune, EW / boarding / Phase 10 / flags / ledger hooks, construction visuals, station defense fallback, and Flash price certification entirely.

## Out of scope for the writer of a later slice

Engine work **before** a brief Pass; UI screenshots on this docs PR; dockClear polish; `game_items.json` combat retune; collapsing disruptors; moving Tractor; locking Flash prices; inventing Bajoran Sail / Warp Core ids; shipping Thaleron Test Facility; station `DEFAULT_WEAPON_ID` fallback; construction visuals; HTML review catalogs; stripping starter Type X from a non-empty-armable starter hull; `BM1-remastered-work` as source; `git am` remastered patches; remastered base `758665e`; claiming a Referee Pass; reopening #33 / #35 / #37 / #38 / #39 / #40 / #41 / #42 / #43 / #44 / #45 / #46 / #47 / #48 / #49; a sixth power consumer; gifted FS / `engagement_authorized` from empty status; wiping delivered reports; flipping `tractorIsBoarding`; rewriting `meetPackPurchaseDecision`; a second Reman id; treating catalog-wire helper tests as S23.

## Sources

- Proposal: `docs/empty-armable/BM1-EMPTY-ARMABLE-SHIPS-PROPOSAL.md`
- Planning: `docs/GUIDED-CONVERGENCE.md` §3; `docs/revised-development-plan.md` §11 / §16.2 row 3
- Doctrine: `docs/doctrine/DESIGN-doctrine-v0.2.1.md` “Action and fire”
- Catalog examples: `bm-ships/ships.json` 348 / 349 / 350; `docs/SHIP-ECONOMY-REVIEW.md`
- Helpers: `src/ship-catalog-wire.js`; `src/main.js` slot / fire / save-load paths at `a3d9611`
- Boarding: `docs/boarding/`; PR #38 / #39; S17.10
- Ledger / Tractor: `docs/weapon-ledger/`; PR #48 / #49; S22
- Flags/passes: `docs/flags-passes/`; PR #46 / #47; S21
- EW locked: `docs/phase9/`; PR #33 / #35 / #37 / #42 / #43 / #44 / #45; S14–S20
- Phase 10 locked: `docs/phase10/`; PR #40 / #41; S18
- Companion shape: `docs/weapon-ledger/BM1-WEAPON-LEDGER-ENGINE-DEPENDENCIES.md`; `docs/flags-passes/BM1-FLAGS-PASSES-ENGINE-DEPENDENCIES.md`
