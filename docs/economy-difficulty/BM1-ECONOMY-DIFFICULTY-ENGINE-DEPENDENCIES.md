# BM1 broader economy / difficulty knobs: later-slice dependencies

**Reviewed document:** `BM1-ECONOMY-DIFFICULTY-PROPOSAL.md`  
**Reviewed against:** `Artemis2028/BM1-bakeoff` at `739e0c1` on `main` (20 September 2026), after HTML weapon / station review catalogs S25 pages (PR #55). Line numbers below refer to this head and may drift.  
**Method:** read landed Phase 8 market book / `PHASE8_MAGNITUDES`, catalog-wire purchase reasons, Reman meeting, side-lane repair / unrest predicates, Phase 1 identity rules, and GUIDED §8 + plan §10 / §13 / §16.2 row 8. No engine changes made. This is a dependency/risk checklist for a **later** writer **if** Tenth scopes a thin subscribe-module slice — not a post-implementation review and not permission to implement before Tenth scopes the lane. **Keep #33, #35, #37, #38, #39, #40, #41, #42, #43, #44, #45, #46, #47, #48, #49, #50, #51, #52, #53, #54, and #55 locked.** Do not reopen EW, boarding, Phase 10, flags/passes, the weapon ledger, empty-armable, construction visuals, or HTML catalogs. Do not reopen Phase 8 gates. Do not retune combat. Do not invent repair / unrest / prestige tables. Do not open dockClear polish, Thaleron facility invent, or Flash price locks.

## Verdict in one paragraph

Economy / difficulty knobs can stay **docs-only** on this PR. **This PR ships proposal + deps only.** If Tenth later scopes a thin slice, prefer a **new `src/economy-difficulty.js`** (name can change) that **selects a named profile** and **feeds** landed `resolveMagnitudes` / jump-farm caps / holding-grace / fleet-upkeep **without** writing ownership, standing tiers, Reman, unrest thresholds, or fire tokens. That slice is **tuning**, not a second market book — the natural analog is Phase 9.4’s central magnitudes inject. Do **not** touch `src/phase8-markets.js` gate logic, `meetPackPurchaseDecision`, `PURCHASE_TIER_STANDING`, HTML catalogs, or combat JSON. `ECONOMY_DIFFICULTY_LOCKED_FROM_REMASTERED === false`. The load-bearing risks are all identity / farm / honesty mistakes: Easy collapsing Phase 1; Easy reopening buy/sell prestige or jump farms; inventing a locked repair / unrest / prestige table; latinum skipping Reman; gifting `firingSolution` / `engagement_authorized`; `git am` remastered; reopening #33–#55 or Phase 8.

## Natural later deliverable (say this clearly)

A thin **subscribe module** that overlays **already-injectable** Phase 8 magnitudes is the natural S26 deliverable. Combat / HTML catalogs / Phase 8 forbids stay untouched.

| S26 is | S26 is not |
| --- | --- |
| Named profiles (Easy / Standard / Hard, names can change) | A political mode or second ROE |
| Overlay on `PHASE8_MAGNITUDES` / jump-farm caps / grace / upkeep | A second `marketBook` or a Phase 8 rewrite |
| Injectable / overridable pacing | Certified repair / unrest / prestige numbers |
| Optional thin new-game label | DockClear polish / in-game economy HUD work |
| Probe `__BM1_PROBE__.economyDifficulty` (name can change) | A combat probe or HTML-catalog reopen |

An in-game sliders-and-graphs economy screen, if ever wanted, is a **different** Tenth-scoped lane. First S26 should not open dockClear.

## What already exists (do not reinvent)

| Need | Engine / docs fact at `739e0c1` |
| --- | --- |
| Phase 8 magnitudes inject | `src/phase8-markets.js`: `PHASE8_MAGNITUDES` frozen playtest defaults (`stockCap` 8, `demandCap` 8, `fillDelta` 2, `worsenDelta` 2, `salvageLatinumCap` 40, `transportLatinumCap` 80, `holdingIncomeWhenMet` 8, `holdingIncomeCap` 25, `holdingGraceJumps` 1, `fleetUpkeepPerParked` 1, `readinessDropPerJump` 8, `reconstructionSpend` 50, `repairPremiumWithoutSupply` 2, …). `resolveMagnitudes(injected)` merges overlays. **Shape locked; numbers not certified.** |
| Anti-farm already closed | `shopStandingDelta` — reversal 0, shop cap `TRUSTED_SHOP_STANDING_CAP` = Trusted **15**. `boundTravelSalvage` / `boundTransportLatinum` / `jumpMustNotReprintInfinity` / `restockOnLoadForbidden`. Hail trade: no standing. **Do not reopen.** |
| Restriction kinds | `RESTRICTION_KINDS` = embargo / license / seller_rule / premium. `higherBidCannotPermit`. Wartime imperial refuse vs named exception. `wartimeExceptionSellsHull(53)` false. |
| Catalog + standing | `src/ship-catalog-wire.js`: `PURCHASE_TIER_STANDING` 0/15/30/50/75/100, `HOME_FACTION_STANDING = 20`, `evaluateWiredPurchase`. Reasons: `funds` / `faction-standing` / `access-locked` / `region`. S11. |
| Reman meeting | `meetPackPurchaseDecision` in `src/side-lane-repair-reman.js`. Hull **53 / `bm-ship:53`**. Remus is a vendor note. |
| Repair physical gate | `REPAIR_CAPABLE_SIZE_CLASSES` = starbase / shipyard / heavy-shipyard; type **83** yes; types **86 / 87** never. **Cite; do not invent a price table.** |
| Unrest | `src/side-lane-unrest-independence.js`. Thresholds **not** to be invented here. Phase 8 may call a **named** writer only. |
| Holdings / fleet | `mintHoldingOnClaim` / `evaluateHoldingIncome` / `applyFleetUpkeep` / `upkeepMustNotSupersedeOrder`. |
| Phase 5 subscribe-only | `applyPhase5Fill` / `applyPhase5Worsen` / `closedShortageMustNotReprint`. Clock = completed strategic jump. |
| Identity | Phase 1: flag-share ≠ control; concessions foreign; independents ≠ alliance; Breen–Dominion no static friendship. Doctrine Phase 1 removes Breen–Dominion friendship both ways. |
| Magnitudes analog | `src/phase94-magnitudes.js` — central injectable ledger, remastered-lock **false**. **Pattern only.** Do not reopen EW. |
| HTML catalogs | `docs/html-catalogs/` S25 pages; `HTML_CATALOG_LOCKED_FROM_REMASTERED === false`. **Stay locked.** |
| Remastered locks | `MAGNITUDES_LOCKED_FROM_REMASTERED`, `UTILITY_LOCKED_FROM_REMASTERED`, `LEDGER_LOCKED_FROM_REMASTERED`, `EMPTY_ARMABLE_LOCKED_FROM_REMASTERED`, `CONSTRUCTION_LOCKED_FROM_REMASTERED`, `HTML_CATALOG_LOCKED_FROM_REMASTERED` all **false**. |
| Probe surface | `__BM1_PROBE__.phase8` … `.phase94`, `.boarding`, `.phase10`, `.utility`, `.weaponLedger`, `.emptyArmable`, `.constructionVisuals`. First S26 adds `.economyDifficulty` only if Tenth scopes the module. |

**Gap this brief closes (docs now; module only if scoped):** there is no **scoreable S26 contract** that difficulty is pacing-not-ownership, that Easy preserves Phase 1, that Phase 8 farms stay closed, and that this docs pass invents no repair / unrest / prestige tables.

## Hooks the writer will have to touch

**This PR touches none of these.** If Tenth later scopes a thin subscribe module:

Prefer **new files** rather than growing `src/phase8-markets.js` into a second religion:

| Proposed file | Responsibility |
| --- | --- |
| `src/economy-difficulty.js` (name can change) | Profile enum; `ECONOMY_DIFFICULTY_LOCKED_FROM_REMASTERED === false`; `resolveDifficultyMagnitudes(profile, inject)` that **only** overlays allowed Phase 8 families; helpers that assert identity / farm / fire invariants. |
| Optional `scripts/test-economy-difficulty.mjs` | Offline: Easy does not change ownership; farms stay closed; lock flag false; no invented tables on the snapshot. **Not** a rewrite of S13 / S25. |
| Optional thin new-game label in `src/main.js` | Read-only display of the selected profile. **No** dockClear polish. **No** fire write. |

Do **not** implement this inside `src/phase8-markets.js` (except a later **read** of `resolveMagnitudes` / passing an overlay), `src/phase5-objectives.js`, `src/ship-catalog-wire.js`, `src/side-lane-repair-reman.js`, `src/side-lane-unrest-independence.js`, `src/phase9-*.js`, `src/weapon-source-ledger.js`, `src/construction-visuals.js`, `src/empty-armable.js`, `src/boarding-*.js`, `src/phase10-*.js`, `src/utility-inventory.js`, or HTML catalog generators. Do **not** `git am` remastered patches. Do **not** add EW families. Do **not** retune combat. Do **not** edit `docs/html-catalogs/*.html`.

| Existing path | Required integration (later S26) |
| --- | --- |
| `resolveMagnitudes` / `PHASE8_MAGNITUDES` | **Subscribe.** Profile overlay is an inject argument (or a merge applied before call). Fail if S26 forks a second stock ledger. |
| `shopStandingDelta` / jump-farm binders | **Untouched forbids.** Easy may raise a **cap**; it may not delete the binder. Fail if Easy standing rises from buy/sell. |
| `evaluateWiredPurchase` / `meetPackPurchaseDecision` | **Untouched.** Fail if Easy returns allowed for hull 53 without the durable unlock, or collapses refusal reasons. |
| `PURCHASE_TIER_STANDING` / home 20 | **Untouched.** Fail if the table is rewritten “as difficulty.” |
| `isSystemControlled` / concession holder / independence mint | **Untouched.** Fail if Easy writes control from flag-share or retitles a concession. |
| Doctrine Breen–Dominion | **Untouched.** Fail if any profile writes static friendship. |
| `isRepairCapableLocation` / types 86 / 87 | **Cite only.** Overlay may scale `repairPremiumWithoutSupply`. Fail if a price table appears or a defense platform becomes repair-capable. |
| Unrest writers | Optional **named** call already allowed by Phase 8. Fail if S26 ships a locked unrest-N table. |
| `consultDoctrineFire` / `liveFireFactsFromEw` / Phase 2 ROE | Untouched. Fail if setDifficulty writes `firingSolution` or `engagement_authorized`. |
| `tractorIsBoarding` | Stays false. |
| `__BM1_PROBE__.phase8` | **Keep.** Add `.economyDifficulty` snapshot: `profile`, `overlay`, `lockedFromRemastered: false`, identity flags, farm flags, fire flags. |
| HTML catalogs / `game_items.json` | **Untouched.** Fail if S26 edits catalog HTML or combat JSON. |
| Inventory / dock UI | **Out.** DockClear polish **out**. |

## Risks

### 1. Easy collapses Phase 1 (gates 1–2)

`if (difficulty === 'easy') controlled = true` on same-flag worlds, Easy commandeering concessions, Easy mapping every independent to one pact, or Easy writing Breen–Dominion friendship **fails** identity invariance.

**Gate:** S26.1 / S26.2.

### 2. Overlay becomes a second market book (gate 1)

Copying `createMarketBook` into the difficulty module, restocking on profile change, or ticking `state.day` as a restock pump fails finite markets and the jump-farm gate.

**Gate:** S26.1 / S26.4 / S26.7.

### 3. Invented locked curves (gate 3)

Shipping `REPAIR_PRICE_BY_DIFFICULTY`, `UNREST_THRESHOLD_EASY = 3`, or a prestige-per-jump table as non-overridable constants fails the docs-pass forbid even if the overlay otherwise looks clean.

**Gate:** S26.3.

### 4. Easy reopens farms (gate 4)

Deleting `shopStandingDelta` on Easy, raising Trusted cap to 100, or setting `salvageLatinumCap` to `Infinity` / omitting the binder fails “closed or listed before retune.”

**Gate:** S26.4.

### 5. Latinum / Easy skips Reman or a standing tier (gate 5)

`if (easy) return { allowed: true }` on hull 53, or folding `faction-standing` into `funds`, fails money ≠ standing ≠ Reman.

**Gate:** S26.5.

### 6. Difficulty gifts fire (gate 6)

A settings handler that sets `engagement_authorized` / `firingSolution` / culture fire because Hard “means war” or Easy “means safe” fails the knowledge-layer lean.

**Gate:** S26.6.

### 7. Landed-lane sneak / remastered crib (gates 7–8)

Touching EW contest, boarding XOR, Dominion pack gates, flags Thaleron-shipped, ledger combat numbers, empty-armable auto-fill, construction beams, HTML catalog pages, Phase 8 clamp logic, dockClear, or `git am` remastered patches fails even if the overlay is green. Flipping any `*_LOCKED_FROM_REMASTERED` to true fails the blind rule.

**Gate:** S26.7 / S26.8.

### 8. Mid-run change as a restock cheat (process + gate 4)

If Q3 allows a mid-run change, applying Easy must **not** refill stock, reset `jumpFarm.salvagePaid`, or re-grant shop standing. Default first slice: new-run only.

**Gate:** S26.4 + proposal Q3.

## Probe plan (S26)

**Not in this docs PR.** Add `__BM1_PROBE__.economyDifficulty` + optional `scripts/test-economy-difficulty.mjs` **only after** Tenth scopes the module. **Replay S13 + S7 + S11 + S14–S25.** Do not break existing injectors.

**Minimum later-slice contract:**

```js
__BM1_PROBE__.economyDifficulty = {
  snapshot: () => ({
    profile: /* 'easy' | 'standard' | 'hard' */,
    lockedFromRemastered: false,
    overlay: resolveDifficultyMagnitudes(/* profile */),
    identity: {
      flagShareIsControl: false,
      concessionForeign: true,
      independentsAreAlliance: false,
      breenDominionStaticFriendship: false,
    },
    farms: {
      shopReversalStanding: 0,
      shopStandingCap: 15,
      jumpRestocksToCap: false,
      salvageCapped: true,
    },
    purchase: {
      remanReasonDistinct: true,
      standingReasonDistinct: true,
    },
    fire: { firingSolutionPresent: false, engagementAuthorizedPresent: false },
    inventedTables: { repairPrices: false, unrestThresholds: false, prestigeCurve: false },
  }),
  setProfile: (name) => { /* fail setup if helper missing */ },
};
```

Suggested first check set:

1. **S26.1 / S26.2:** ownership + Phase 1 identity unchanged on Easy / Hard.
2. **S26.3 / S26.4:** no invented tables; farms stay closed on Easy.
3. **S26.5 / S26.6:** three purchase reasons; no fire gift.
4. **S26.7 / S26.8:** preservation replay (S13 / S25 green; HTML / combat / Phase 8 forbids untouched); remastered-lock false.

## Recommended implementation order (later S26 only)

1. Add `src/economy-difficulty.js` with `ECONOMY_DIFFICULTY_LOCKED_FROM_REMASTERED === false` and a Standard profile that **equals** current `PHASE8_MAGNITUDES` (S26.8).
2. Easy / Hard overlays on **allowed families only**; feed `resolveMagnitudes` (S26.1).
3. Identity fixture: independents / concessions / Breen–Dominion / flag-share (S26.2).
4. Snapshot refuses repair-price / unrest-threshold / prestige-curve tables (S26.3).
5. Replay Phase 8 farm probes under Easy (S26.4).
6. Replay Reman / standing / funds reasons (S26.5). Confirm no fire inject (S26.6).
7. Preservation: Phase 8 / HTML / EW / boarding modules untouched except the magnitudes inject argument (S26.7).
8. Optional new-game label. **Not** dockClear polish. **Not** an HTML-catalog price column.

Skip invented utilities, `git am`, `game_items.json` combat retune, Phase 8 gate rewrites, HTML catalog edits, EW / boarding / Phase 10 / flags / ledger / empty-armable / construction hooks, and “final” balance certification entirely.

## Out of scope for the writer of a later slice

Engine work **before** a brief Pass; a settings HUD on **this** docs PR; dockClear polish; HTML catalog reopen (#54 / #55); `game_items.json` combat retune; Flash price locks; inventing repair prices / unrest thresholds / prestige curves; reopening Phase 8 anti-farm or clamp logic; collapsing purchase reasons; a second Reman id; Easy flag-share-as-control; Easy independents-as-alliance; Easy Breen–Dominion friendship; shipping Thaleron Test Facility; redoing PR #18 repair arms; reopening construction #52 / #53; `BM1-remastered-work` as source; `git am` remastered patches; claiming a Referee Pass; reopening #33 / #35 / #37 / #38 / #39 / #40 / #41 / #42 / #43 / #44 / #45 / #46 / #47 / #48 / #49 / #50 / #51 / #52 / #53 / #54 / #55; gifted FS / `engagement_authorized` from a difficulty setting; wiping delivered reports; flipping `tractorIsBoarding`; rewriting `meetPackPurchaseDecision`; moving Phase 5 `deadlineAt`; a sixth power consumer.

## Sources

- Proposal: `docs/economy-difficulty/BM1-ECONOMY-DIFFICULTY-PROPOSAL.md`
- Planning: `docs/GUIDED-CONVERGENCE.md` §8; `docs/revised-development-plan.md` §3 / §10 / §13 / §16.2 row 8
- Phase 8: `docs/phase8/`; PR #31; `src/phase8-markets.js`; S13
- Catalog / standing: `src/ship-catalog-wire.js`; PR #28; `docs/SHIP-ECONOMY-REVIEW.md`; S11
- Reman / repair: `src/side-lane-repair-reman.js`; PRs #18 / #19
- Phase 5: `src/phase5-objectives.js`; PR #21
- HTML catalogs (stay locked): `docs/html-catalogs/`; PRs #54 / #55; S25
- Construction (stay locked): `docs/construction-visuals/`; PRs #52 / #53; S24
- Empty-armable: `docs/empty-armable/`; PRs #50 / #51; S23
- Flags/passes: `docs/flags-passes/`; PRs #46 / #47; S21
- Ledger: `docs/weapon-ledger/`; PRs #48 / #49; S22
- EW locked: `docs/phase9/`; PRs #33 / #35 / #37 / #42 / #43 / #44 / #45; S14–S20
- Phase 10 locked: `docs/phase10/`; PRs #40 / #41; S18
- Boarding: `docs/boarding/`; PRs #38 / #39; S17
- Magnitudes-analog shape: `docs/phase9/BM1-PHASE9.4-ENGINE-DEPENDENCIES.md`
- Companion shape: `docs/phase8/BM1-PHASE8-ENGINE-DEPENDENCIES.md`; `docs/html-catalogs/BM1-HTML-CATALOGS-ENGINE-DEPENDENCIES.md`
