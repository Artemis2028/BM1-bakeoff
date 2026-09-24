# BM1 Bajoran Solar Sailor: later-slice dependencies

**Reviewed document:** `BM1-BAJORAN-SOLAR-SAILOR-PROPOSAL.md`  
**Reviewed against:** `Artemis2028/BM1-bakeoff` at `e92db623283b0aa6ef6897e6d787f7d51bbc5ba3` on `main` (24 September 2026), after docs hygiene #69. Line numbers below refer to this head and may drift.  
**Method:** read ledger §6.1’s deferred-utility call, `DEFERRED_FLASH_UTILITIES`, the content-import hull **name** and empty-arms fields, `rosterPlayable` / S18.18, empty-armable slot helpers, and the BAKEOFF-STATUS leftover that still paired Sail with Warp Core. No engine changes made. This is a dependency/risk checklist for a **later** writer **if** Tenth scopes a thin subscribe catalog — not a post-implementation review and not permission to implement before Tenth scopes the lane. **Keep #33–#69 locked.** Do not reopen EW, boarding, Dominion-first, the roster catalog, flags/passes, the weapon ledger (beyond the one-line Sail note already on the ledger docs), empty-armable, construction visuals, HTML catalogs, economy / difficulty, standing tiers, dockClear, hygiene, alertsActive, or away-team XP. Do not amend S18.18 unless Tenth later scopes that reopen. Do not rewrite two-mode ROE. Do not retune combat. Do not invent a Thaleron facility. Do not `git am` remastered patches. Do not lock id 345, costs, or art paths.

## Verdict in one paragraph

Sail reclassification can stay **docs-only** on this PR. **This PR ships proposal + deps only.** Ledger §6.1 parked Flash “Bajoran Sail” as a deferred **utility**; room lock **3a** replaces that class with a **ship** (Bajoran Solar Sailor) that **begins unarmed**. If Tenth later scopes a thin slice, prefer a **sibling book** (`src/bajoran-solar-sailor.js`, name can change) that **subscribes** to class + empty-arms posture, exports `BAJORAN_SOLAR_SAILOR_LOCKED_FROM_REMASTERED === false`, records `classification: 'ship'`, and **does not** write `weaponSlots`, `utilityBook`, cargo, `dominionBook.rosterPlayable`, or `ROE_MODES`. Ids and magnitudes stay **injectable / TBD**. Do **not** copy remastered hull numbers, costs, art paths, or id **345** as live locks. Do **not** touch `game_items.json`, `DEFERRED_FLASH_UTILITIES`, or dockClear CSS in that slice unless Tenth explicitly scopes a ledger-label follow-up (proposal Q4 default: do not). The load-bearing risks are all classification mistakes: leaving Sail a deferred utility; inventing a combat fit; gifting `rosterPlayable` or a playable unlock; gifting `firingSolution` / `engagement_authorized`; adding `protect-all`; locking 345; reclassing Warp Core; `git am` remastered; reopening #33–#69.

## Natural later deliverable (say this clearly)

A thin **subscribe catalog** that publishes §3 posture (ship, Bajoran, shuttle sail transport, fragile freighter, begins unarmed) is the natural **S32** deliverable. Ledger combat numbers, Warp Core’s deferral, ROE, pack purchase gates, and `rosterPlayable` stay untouched.

| S32 is | S32 is not |
| --- | --- |
| Sibling classification book outside `systemStates` | A weapon id, a cargo string, or a `utilityBook` credential |
| `classification: 'ship'`; Flash name “Bajoran Sail” as a **label** | `mapping: 'deferred-utility'` left as the scoreable class |
| Empty slots; `armedByDefault: false`; `beginsUnarmed: true` | An invented combat fit or Type X auto-fill |
| `rosterPlayableGift: false`; S18.18 unread-as-amended | A playable unlock or `rosterPlayable: true` |
| `grantsFire: false` | `firingSolution` or `engagement_authorized` |
| `idLocked: false`; `magnitudesLocked: false` | Id **345**, alias 23→345, costs, or art paths as locks |
| Warp Core still deferred (read-only) | A Warp Core ship reclass |
| `BAJORAN_SOLAR_SAILOR_LOCKED_FROM_REMASTERED === false` | A remastered `git am` |
| Replay `test:phase10` (S18.18 unchanged) + doctrine + ledger | A Phase 10 or ledger hard-gate reopen |

DockClear polish, a Thaleron facility, a combat retune, an ROE rewrite, a flags-capacity table, or a boarding-odds table, if ever wanted, remain **different** Tenth-scoped lanes.

## What already exists (do not reinvent)

| Need | Engine / docs fact at `e92db62` |
| --- | --- |
| Stale class | `docs/weapon-ledger/` §6.1: Flash Bajoran Sail, price 5000 (source), family Utility, **explicitly deferred utility**, no weapon id, not cargo, not `utilityBook`. **Superseded for Sail** by the proposal. One-line note on that file. Do not rewrite the section. |
| Matrix label (do not edit this PR) | `src/phase9-weapons-matrix.js` `DEFERRED_FLASH_UTILITIES`: Bajoran Sail `mapping: 'deferred-utility'`, `bakeoffId: null`; Warp Core `deferred-utility-not-trade-good`. S14.12 / S22.4 still assert Sail is in that list. A later label change is proposal **Q4** and is **not** S32’s default. |
| Ledger snapshot | `src/weapon-source-ledger.js` copies Sail as `classification: 'deferred-utility'`. **Do not retune** in this package. Warp Core stays distinct from cargo “Warp Cores.” |
| Pack posture (not a lock) | `bm-ships/ships.json` already has a hull **named** Bajoran Solar Sailor: `faction: 'bajoran'`, `shipClass: 'shuttle'`, `role` sail transport, `defaultWeaponSlots: [null, null, null]`, `armedByDefault: false`, `assetType: 'ship'`. Content import #25. **Do not** treat its numeric id, `cost`, art path, hull/shield/speed, or `mergedFrom` alias as locks this brief creates. Do not edit the JSON. |
| Historical alias | `docs/APPROVED-HULL-MERGES.md` records `23 → 345` for this name. `bm-ships/ships.json` `aliases` and `integration-rules.json` `hullAliases` map `"23"` the same way. Historical content. **Not** a live lock. Do not edit the merge table. |
| Empty arms helpers | `src/ship-catalog-wire.js` `packDefaultWeaponSlots` / `hullIsEmptyButArmable` / `unarmedNpcCannotFire`. `src/empty-armable.js` subscribes. **Subscribe.** Do not reopen #50/#51. |
| No playable gift | `src/phase10-dominion-book.js` `rosterPlayable: { independent: false, ferengi: false, vulcan: false }`. S18.18 in `scripts/test-phase10-dominion.mjs` requires `scope === 'dominion-first'`. **Do not amend.** |
| Roster sibling | `src/phase10-roster.js` `factionRosterBook` names `bajoran` as catalog coverage, not a start card. Do not add a sailor unlock there. |
| Catalog wire | `src/ship-catalog-wire.js` `CATALOG_WIRED === true` (PR #28). Purchase still goes through `meetPackPurchaseDecision` / standing tiers. S32 must not add a bypass. |
| Remastered locks | `MAGNITUDES_LOCKED_FROM_REMASTERED`, `UTILITY_LOCKED_FROM_REMASTERED`, `LEDGER_LOCKED_FROM_REMASTERED`, `EMPTY_ARMABLE_LOCKED_FROM_REMASTERED`, `CONSTRUCTION_LOCKED_FROM_REMASTERED`, `HTML_CATALOG_LOCKED_FROM_REMASTERED`, `ECONOMY_DIFFICULTY_LOCKED_FROM_REMASTERED`, `STANDING_TIERS_LOCKED_FROM_REMASTERED`, `DOCK_CLEAR_LOCKED_FROM_REMASTERED`, `ALERTS_ACTIVE_LOCKED_FROM_REMASTERED`, `AWAY_TEAM_XP_LOCKED_FROM_REMASTERED`, `PHASE10_ROSTER_LOCKED_FROM_REMASTERED` all **false**. |
| Fire / ROE | `consultDoctrineFire` deletes `engagement_authorized`. `ROE_MODES` is two-mode. Pack `protect` folds to `record_only` (S6.13). |

**Gap this brief closes (docs now; catalog only if scoped):** there is no **scoreable S32 contract** that calls Bajoran Solar Sailor a **ship**, records empty arms, and removes Sail from the **deferred-utility leftover list** without locking remastered numbers or gifting play. The ledger’s §6.1 sentence is the stale call. Phase 9’s matrix label can stay until Tenth scopes Q4.

## Hooks the writer will have to touch

**This PR touches none of these.** If Tenth later scopes a thin subscribe catalog:

Prefer **one new file** rather than growing `phase9-weapons-matrix.js` or `weapon-source-ledger.js` into a hull religion:

| Proposed file | Responsibility |
| --- | --- |
| `src/bajoran-solar-sailor.js` (name can change) | `BAJORAN_SOLAR_SAILOR_LOCKED_FROM_REMASTERED === false`; `emptySolarSailorBook` / serialize / restore; row from proposal §3; `solarSailorSnapshot()` with `classification: 'ship'`, `beginsUnarmed: true`, `rosterPlayableGift: false`, `grantsFire: false`, `idLocked: false`, `magnitudesLocked: false`. **No** weapon-slot write. **No** fire write. **No** spawn write. **No** `rosterPlayable` write. |
| `src/main.js` | Thin: create/restore sibling `state.solarSailorBook` **beside** existing books; `saveGame` / `loadGame` / `resetRunState`; `__BM1_PROBE__.solarSailor`. **Do not** change `factionDefs`, catalog spawn, or map hide. **Do not** dockClear-reflow. |
| `src/phase9-weapons-matrix.js` / `src/weapon-source-ledger.js` | **Untouched by default.** Fail if Sail is deleted from the Flash **source** table or if Warp Core’s class changes. A mapping-label edit is Q4, separately scoped, and must not retune combat numbers. |
| Optional `scripts/test-bajoran-solar-sailor.mjs` | Offline: lock false; classification ship; empty slots; roster flags unchanged; Warp Core still deferred; no fire fields. |
| `scripts/behavior-probe.mjs` | Add S32 **after** scope. **Replay** S18 including S18.18 and S22. Do not edit S18.18’s expected `dominion-first`. Do not edit S22 to drop Warp Core. |

Do **not** implement this inside `src/phase9-*.js`, `src/phase10-*.js`, `src/empty-armable.js`, `src/utility-inventory.js`, `src/weapon-source-ledger.js`, or `src/ship-catalog-wire.js` beyond a **read**. Do **not** `git am` remastered patches. Do **not** retune `game_items.json` or `bm-ships/ships.json`. Do **not** edit `docs/APPROVED-HULL-MERGES.md` to “make 345 official.”

| Existing path | Required integration (later S32) |
| --- | --- |
| `packDefaultWeaponSlots` / `hullIsEmptyButArmable` | **Read.** Fail if the snapshot reports a non-empty default fit. |
| `unarmedNpcCannotFire` | **Read.** Fail if the sailor emits a projectile while unarmed. |
| `listDeferredFlashUtilities` | **Do not retune** in the default slice. Warp Core must remain. Sail’s scoreable class lives on the **new** book even while the matrix label is still the old string (Q4). |
| `emptyDominionBook` / `restoreDominionBook` | **Untouched.** Fail if `rosterPlayable` or `scope` changes. |
| `meetPackPurchaseDecision` / `evaluateWiredPurchase` | **Untouched.** Fail if naming the sailor unlocks a hull or Reman 53. |
| `consultDoctrineFire` / `playerForceMayAutoEngage` | Untouched. Fail if the row writes `firingSolution` or `engagement_authorized`. |
| `ROE_MODES` / `getEffectivePolicy` | Untouched. Fail if the freighter role adds `protect-all`. |
| `saveGame` / `loadGame` / `resetRunState` | New sibling key. Restore **beside** other books, not inside `utilityBook` or `weaponSlots`. |
| `__BM1_PROBE__.weaponLedger` / `.phase10` | Keep. Add `.solarSailor` (below). S22.4 still sees Warp Core deferred. S18.18 still reads dominion scope. |

## Risks

### 1. Sail left a deferred utility, or stuffed into a slot (gate 1)

Shipping another “explicitly deferred utility” sentence, a weapon id, a cargo good, or a `utilityBook` row fails room lock **3a**.

**Gate:** S32.1.

### 2. Invented combat fit (gate 2)

Writing Type X (or any id) into `defaultWeaponSlots`, or setting `armedByDefault: true` because the content-import description says “poorly suited to heavy combat,” fails empty-arms.

**Gate:** S32.2.

### 3. Playable unlock / `rosterPlayable` gift (gates 3 and 5)

Flipping S18.18, adding a Bajoran start card, or stocking a yard “so the brief is playable” reopens Phase 10 and skips the knowledge-first slice.

**Gate:** S32.3.

### 4. Catalog row becomes a fire mode (gate 4)

`mayAutoEngage` or `engagement_authorized` because `classification === 'ship'` fails Phase 9 / Phase 10 fire gates.

**Gate:** S32.4.

### 5. Ledger or Warp Core rewritten (gates 5 and 8)

Deleting Warp Core from `DEFERRED_FLASH_UTILITIES`, locking Flash 5000 as a hull price, or retuning disruptor rows “while Sail is open” fails do-not-reopen and named outs.

**Gate:** S32.5 / S32.8.

### 6. Third ROE (gate 6)

`protect-all` because the role says peaceful fails Phase 2.

**Gate:** S32.6.

### 7. Id 345 / art / cost locked, or remastered crib (gate 7)

A non-overridable `id: 345`, a copied art path, a frozen `cost`, `git am` of a remastered hull file, or `BAJORAN_SOLAR_SAILOR_LOCKED_FROM_REMASTERED === true` fails even if the class words are right. The coordinator dig’s hull number is **not** a bake-off lock.

**Gate:** S32.7.

### 8. DockClear / flags capacity / Thaleron / boarding odds (gates 5 and 8)

Reflowing star-chart CSS, inventing a capacity table, a Thaleron pin, or a capture percentage “while the sailor is open” fails named outs.

**Gate:** S32.8.

## Probe plan (S32)

**Not in this docs PR.** Add `__BM1_PROBE__.solarSailor` + optional `scripts/test-bajoran-solar-sailor.mjs` **only after** Tenth scopes the slice. **Replay `test:phase10` + `test:doctrine` + `test:weapon-ledger` + S18 including S18.18 + S22.** Do not break existing injectors. Do not require a screenshot pass (no chrome).

**Minimum later-slice contract:**

```js
__BM1_PROBE__.solarSailor = {
  lockedFromRemastered: false, // BAJORAN_SOLAR_SAILOR_LOCKED_FROM_REMASTERED
  flashName: 'Bajoran Sail',
  displayName: 'Bajoran Solar Sailor',
  classification: 'ship',
  faction: 'bajoran',
  shipClass: 'shuttle',
  role: 'fragile-freighter',
  beginsUnarmed: true,
  defaultWeaponSlots: [null, null, null],
  armedByDefault: false,
  cargo: false,
  utilityBook: false,
  weaponCatalogId: null,
  rosterPlayableGift: false,
  grantsFire: false,
  idLocked: false,
  magnitudesLocked: false,
  // id, if exposed at all, is injectable and omitted-by-default.
  // cost, art path, hull, shields, speed are not fields of this snapshot.
};
```

Suggested asserts (later only):

1. **S32.1:** `classification === 'ship'`; cargo false; utilityBook false; weaponCatalogId null.
2. **S32.2:** three null slots; `beginsUnarmed === true`; no projectile while unarmed.
3. **S32.3:** dominion `scope` still `dominion-first`; `rosterPlayable` values still false; `rosterPlayableGift === false`.
4. **S32.4:** snapshot has no `firingSolution` and does not set `engagement_authorized`.
5. **S32.5 / S32.8:** weapon-ledger snapshot still lists Warp Core as deferred and not equal to “Warp Cores”; Flash prices still not live locks; combat numbers unchanged.
6. **S32.6:** `ROE_MODES` length and names unchanged.
7. **S32.7:** `lockedFromRemastered === false`; `idLocked === false`; `magnitudesLocked === false`. Inject, if offered, changes only an explicit injectable field and cannot set `idLocked: true`.

Screenshot / no-clip: **N/A** (no sailor chrome). DockClear CSS **out**.

## Out of scope for this docs PR

Engine work; tests; screenshots; `src/` edits; `bm-ships/` edits; `game_items.json` edits; HTML catalog rewrites; locking id 345 or any cost/art/magnitude; `git am` remastered; a Referee Pass; reopening #33–#69; amending S18.18; a Warp Core decision; flags capacity; Thaleron; boarding odds; `protect-all`.
