# BM1 side-lane proposal: engine dependencies

**Reviewed document:** `BM1-SIDE-LANE-REPAIR-REMAN-INDEPENDENCE-PROPOSAL.md`  
**Reviewed against:** `Artemis2028/BM1-bakeoff` at `10c3a7e` on `main` (12 September 2026). Line numbers below refer to this head and may drift.  
**Method:** read the landed Phase 1–4 modules, dock/repair UI, Remus station stock, and the additive `bm-ships/` pack. No engine changes made. This is a dependency/risk checklist for a later writer, not a post-implementation review and not permission to wire the catalog.

## Verdict in one paragraph

The brief can be implemented as three thin gates without a rewrite and without Phase 5. Repair is a missing capability bit on top of `repairHull` / the shared Repair button / the player-sprite draw path. Reman access is a missing durable unlock: today’s Reman Starbase stock list is an instance key waiting to become a landmine. Independence is a mint-a-`sideId` event that must call existing Phase 1 owner/control helpers and Number 2’s explicit inheritance table. **Tenth amend (2026-09-12):** breakaway doctrine/ROE **may diverge** from the parent; temperament axes (`peaceful` / `warlike` / `xenophobic` / `xenophilic`) may shift during the war and rematch profile — they must not clone the parent in silence, freeze at declaration, rewrite concessions, or grant culture fire. The load-bearing risks are all integration mistakes: overlay whenever docked; treating defense-platform dock as repair; deleting Reman access in `destroyStation`; wiring 212 hulls; silent parent-profile copy **or** forced clone; frozen-at-declaration doctrine; retitling concessions.

## What already exists (do not reinvent)

| Need | Engine / pack fact at `10c3a7e` |
| --- | --- |
| Dock vs distance | `tryDockAtPlanetIndex` (~10518), `tryDockAtStation` (~13186). Hostile stations refuse. Wormhole / construction / destroyed have their own exits. |
| Phase 3 service denial | `visitorDeniedServices` (`src/phase3-checkpoints.js` ~446). `getCheckpointDockRefusal` (`src/main.js` ~5533) blocks authority planet/stations; **private owners return ''**. `checkpointUiSnapshot.playerDenied` (~5975). |
| Repair action | `repairHull` (~12055): `requireDocked()` only; hull 2L/%, shields 1L/%. Menu Repair buttons at ~10357; key `f` (~12836). **No `repairCapable` test.** |
| Player sprite | After NPC loop, `getShipSprite(state.playership)` / `drawRotatedImage` (~18737), then `drawPlayerCloakEffect`. Overlay belongs here, not on station draw. |
| Station types | `data/station_manifest.json`: Maintenance **83**; Defense Platform **86**; Advanced Defense Platform **87** (`sizeClass: 'defense-platform'`). Starbases / shipyards / heavy-shipyards by `sizeClass`. |
| Pack repair notes | `bm-ships/review-decisions.json` `a-231`, `a-74`, `a-78`, `a-79`. Overlay named `repairarms.gif`. **Not shipped** in `bm-ships/` (ships-only; station/repair retained for context). `missingFeatures` includes `repair arms and service capability enforcement`. |
| Reman hull | Pack id **53**, key **`bm-ship:53`**, `availabilityRegion: "secret-remus"`, `shipyardEligible: false`, no `specialVendor`. `catalog.mjs` `regionAllows`: purchase + system `remus` + vendor `remus-secret`. |
| Reman recovery listed | `bm-ships/integration-rules.json` `missingFeatures`: `Reman access recovery mission`. README: quest not implemented. |
| Live Remus instance | `data/stationData.json` **Reman Starbase**, `systemIndex` 29, `stock.shipIds: [53]`. Current market path will look like an instance key. |
| Other Warbirds | Distinct pack records (Classic / Independent / Romulan / D'deridex / Norexan). Not hull 53. |
| Phase 1 side / ownership | `src/phase1-authority.js`: `playerHoldsSystem`, `flagShareGrantsSystemControl()` false, `isStationTransferableFromHolder`, `retainStationOwnerOnControlChange`, `resolveBaseSystemFaction` → `custom:${gov}`, empty-list independents, no Breen–Dominion static friend. |
| Runtime owner / side | `getStationOwner` (~4770), `getNpcSideId` (~4789), `isSystemControlled` (~8636), `losePlayerHolding` / `noteAuthoritySide` (epoch + Phase 4 `resolveAccessIncidentsForEpoch`). |
| Player Security ROE | Phase 2 merge / retain / reclaim. Breakaway NPC polity must not receive it. |
| Doctrine | `stampDoctrineOnActor` / `evaluateReact` in `src/doctrine.js`. Culture `reman` is not an empire (`DESIGN-doctrine-v0.2.1.md`). Culture cannot grant fire permission. |
| Persistence lesson | `state.systemStates = {}` still wipes on load / build / reset. Unlocks and new sides must live **outside** that cache (copy the Phase 3/4 pattern). |
| Probe surface | `globalThis.__BM1_PROBE__`. S7 should extend this object rather than scrape private state. |

## Hooks the writer will have to touch

Prefer small helpers (capability predicate, unlock record, breakaway mint) plus thin `main.js` integration. Do **not** start from a catalog-wide spawn rewrite.

| Existing path | Required integration |
| --- | --- |
| `repairHull` / Repair buttons / key `f` | Gate on `isRepairCapableLocation` **and** Phase 3 service-not-denied. Distinct refuse strings (S7.3). |
| Planet vs station menu HTML (~10354) | Hide or disable Repair when `repairCapable` is false. Do not hide Antimatter/other services solely because repair is false. |
| Player draw (~18737) | Optional overlay while `repairInProgress`. Never on NPC/station draw; never while merely docked. |
| Overlay asset | If `repairarms.gif` (or scoped equivalent) is not in-tree, S7.4 asset-missing — **do not** bind `stationconstructing.gif` / workbee art. |
| `requireDocked` | Keep as “must be docked.” Do not fold capability into this helper (would break refuel/claim). |
| `getCheckpointDockRefusal` / `visitorDeniedServices` | Unchanged contract. Repair consults it; does not replace it. |
| `getStationTypeId` / `sizeClass` / type 83/86/87 | Capability table. Prefer id + `sizeClass` over `name.includes('defense platform')` (~8766 is a precedent landmine). |
| `destroyStation` / ruin / missing Reman Starbase | Must **not** clear Reman unlock. S7.7. |
| Shipyard stock / `getShipPurchaseStatus` / Reman Starbase `stock.shipIds` | Offer hull 53 only through `hasRemanWarbirdAccess` (or equivalent). Stock list is not the key. |
| `bm-ships/catalog.mjs` `getPurchaseDecision` | Hull 53 fails `restricted-stock` today (no `specialVendor`). Wrapper or engine-side check — **do not** silently invent a pack field. S7.8. |
| New unlock store | Serialize next to feats / `securityEncounters` / `incidentLedger`. Init on `resetRunState`. Survive `systemStates` wipe. |
| Independence event | Mint `sideId`; assign **explicit** starting temperament (may differ from parent); `noteAuthoritySide` / epoch; Phase 1 transfer helpers only for holder assets; **do not** loop all stations assigning the new side. |
| Doctrine stamp / relations | Apply §5.3. **Divergence allowed.** Empty-list independent + explicit parent hostility if civil war. No `Object.assign` from parent profile. |
| Civil-war temperament write | Named event → pole change on breakaway (parent optional) → rematch `profileId` via §5.3.4. Must not inject `engagement_authorized` / `attackId` or rewrite owners. |
| Player Security setters | Must ignore breakaway NPC side. Two modes only. If the player later holds the world, existing Phase 2 reclaim applies to the **player** side only. |
| `__BM1_PROBE__` | Snapshot: `repairCapable`, `repairInProgress`, overlay on/off, Reman flag, Reman Starbase alive, breakaway `sideId`, temperament poles, parent vs breakaway `profileId`, concession owner, relations, `mayAutoEngage`, Phase 1 `flagShareGrantsSystemControl`. |

Do **not** hook `buildShipScanReport`, `allowsRoutineGenerator` (to spawn a civil-war navy), or `loadShipCatalog` for general traffic.

## Risks

### 1. Overlay whenever docked (or on the station)

`repairHull` completes instantly today. A writer who draws arms “while `state.docked && repairCapable`” fails S7.4. Need an explicit in-progress window even if the first slice’s mechanical repair stays one-shot (minimum: one simulation tick / visible frame of `repairInProgress`, then clear). Drawing arms on the Maintenance Station hull fails the player-ship rule.

**Gate:** S7.4.

### 2. Defense platform dock ⇒ repair

Phase 3 clearance at a platform is a success path. The Repair button is currently in the shared service grid. Without a type-id/`sizeClass` check, S7.2 fails. Name-includes matching will miss “Advanced Defense Platform” variants or false-positive flavor.

**Gate:** S7.2.

### 3. Collapsing Phase 3 denial into `repairCapable`

If `isRepairCapableLocation` returns false because the visitor is noncompliant, the capability table lies and S7.3 swaps reasons. Keep two predicates.

**Gate:** S7.3.

### 4. Reman access keyed to the live Reman Starbase

`stock.shipIds: [53]` plus `destroyStation` is the obvious implementation. That fails hard gate 2. Same failure if the flag lives on `station.runtime` inside `systemStates`.

**Gate:** S7.6, S7.7.

### 5. `getPurchaseDecision` / missing `specialVendor`

Calling the pack helper unchanged always refuses hull 53 (`shipyardEligible: false`, no `specialVendor`). Fabricating `specialVendor: 'remus-secret'` in `ships.json` is a **pack edit**, not required by this docs-only brief. Engine must not invent a second hull id to dodge the helper.

**Gate:** S7.8, S7.10.

### 6. Catalog wire of 212 hulls

`loadShipCatalog()` for “while we’re here” traffic/markets is out of scope and not needed for the Reman **rule**. Independent Warbird must not be used as a stand-in.

**Gate:** S7.9, S7.10.

### 7. Silent parent doctrine / player ROE copy — or forced clone / freeze

`stampDoctrineOnActor` with the parent `profileId`, or `setEmpireDefaultDimension` on the new side, is still the independence landmine. Tenth’s amend adds two more: treating “explicit inheritance” as “must equal parent,” and storing doctrine only at declaration with no war-mutation path.

Number 2’s table says **mint side + explicit (likely divergent) temperament + assigned-or-deny profile + empty relations + explicit war write**. During war, a named temperament write may rematch profile on the breakaway and **may** on the parent. That rematch must not inject `engagement_authorized`, add a third player ROE mode, or retitle concessions.

**Gate:** S7.13, S7.15, S7.17, S7.18.

### 8. Concession rewrite / Phase 1 reopen

A `for (station of system) station.faction = breakaway` loop fails S7.12 and reopens Phase 1. Use `isStationTransferableFromHolder` only. Do not treat flown flag as `isSystemControlled`.

**Gate:** S7.12, S7.14.

### 9. Culture `reman` as unlock or side

Doctrine notes already warn not to equate Reman culture with an empire. Using it as `hasRemanWarbirdAccess` or as `sideId` fails S7.16 and hard gate 2/3.

### 10. Invented numbers / Phase 5 creep

Changing `repairHull` prices “to feel Flash,” adding convoy overdue loops, or spawning a civil-war fleet to satisfy `evaluateReact` are out of scope.

**Gate:** S7.5; process lock (not Phase 5).

### 11. Persistence and replacements

Unlocks and breakaway sides must not live in `systemStates`. Ambient `npc.id` reuse still applies if civil-war traffic is added later (it should not be, first slice). Use `securityInstanceId` if any visitor is attributed.

## Probe plan (S7)

Add `scripts/test-side-lane-repair-reman-independence.mjs` (or split per gate) for offline capability / unlock / inheritance tests, plus Chromium S7 on `__BM1_PROBE__`.

**Minimum probe additions:**

```js
__BM1_PROBE__.sideLane = {
  snapshot: () => ({
    repairCapable: isRepairCapableLocation(currentDock()),
    repairInProgress: Boolean(state.repairInProgress),
    overlay: Boolean(state.repairOverlayActive),
    remanAccess: { ...state.playerUnlocks?.remanWarbird },
    remanStarbase: { id, destroyed, stock: [...] },
    breakaway: { sideId, parentSideId, relations, doctrineProfile, temperament },
    parent: { sideId, doctrineProfile, temperament },
    concessionOwner: getStationOwner(fixtureConcession),
    flagShareGrantsControl: false,
    standing: { ...state.factionStanding },
    mayAutoEngage: playerForceMayAutoEngage(...)
  }),
  startRepair: () => repairHull(),
  destroyRemanStarbase: () => { /* fail setup if missing */ },
  injectRemanRecovery: () => { /* S7.8 */ },
  declareIndependence: (systemIndex) => { /* fail setup if mint helper missing */ },
  shiftTemperament: (sideId, poles) => { /* S7.17; fail if no write path */ }
};
```

Run, in order: existing `test:phase1`, `test:phase3`, `test:phase4`, `test:doctrine`, `probe` (S4–S6), then new S7. A repair or independence path that changes `mayAutoEngage` without Phase 2 evidence is a blocker.

Suggested first Chromium set (catches fatal integrations):

1. **S7.1 / S7.2 / S7.3:** capable planet vs platform #86/#87; Phase 3 denied planet vs cleared platform — reasons distinct.
2. **S7.4:** overlay off → start repair → overlay on player only → complete → overlay off. Asset-missing allowed.
3. **S7.6 / S7.7:** grant Reman flag → destroy Reman Starbase → save/wipe `systemStates`/reload → flag true.
4. **S7.8 / S7.10:** no base, recovery inject grants same flag; hull 53 only.
5. **S7.11–S7.18:** mint side ≠ parent/flag/culture/`neutral`; concession owner unchanged; doctrine/temperament **explicit and allowed to differ** from parent; relations not cloned; war event may change poles + rematch profile (not frozen); `flagShareGrantsSystemControl` still false; culture `reman` ≠ unlock / fire; player ROE still two modes.

## Recommended implementation order (dependencies)

1. `isRepairCapableLocation` + menu/`repairHull` gates (S7.1–S7.3, S7.5). Overlay last in this group (S7.4).
2. Durable Reman unlock store + destroy-base invariance (S7.6–S7.7). Recovery inject (S7.8). No catalog wire (S7.9–S7.10).
3. Independence mint + Phase 1 transfer-only station updates + §5.3 birth writes (divergent temperament) + one war-mutation write (S7.11–S7.18).

Skip (3) if Number 2’s table is still Fail. Skip catalog work entirely.

## Out of scope for the writer of a later slice

`BM1-remastered-work`; claiming a Referee Pass; doctrine JSON culture→empire edits; weapon tables; `asset_overdue` multi-jump loops; cloak/sensors; wiring 212 hulls; inventing hull IDs or repair prices; setting `hostile` / `attackId` from a repair refuse, an independence declare, or a temperament pole; using construction art as repair arms; inventing temperament shift chances.

## Sources

- Proposal: `docs/side-lane-repair-reman-independence/BM1-SIDE-LANE-REPAIR-REMAN-INDEPENDENCE-PROPOSAL.md` (Tenth amend 2026-09-12 on gate 3)
- Pack: `bm-ships/ships.json` (53), `bm-ships/catalog.mjs`, `bm-ships/integration-rules.json`, `bm-ships/review-decisions.json`
- Repair / dock: `src/main.js` (`repairHull`, `tryDockAtPlanetIndex`, `tryDockAtStation`, `getCheckpointDockRefusal`, player draw)
- Phase 3 services: `src/phase3-checkpoints.js` (`visitorDeniedServices`)
- Phase 1: `src/phase1-authority.js`
- Doctrine: `src/doctrine.js`; `docs/doctrine/DESIGN-doctrine-v0.2.1.md`
- Phase 4 companion shape: `docs/phase4/BM1-PHASE4-ENGINE-DEPENDENCIES.md`
