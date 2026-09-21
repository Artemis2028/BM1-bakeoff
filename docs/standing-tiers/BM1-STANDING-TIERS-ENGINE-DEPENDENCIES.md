# BM1 faction-wide standing / purchase tiers: later-slice dependencies

**Reviewed document:** `BM1-STANDING-TIERS-PROPOSAL.md`  
**Reviewed against:** `Artemis2028/BM1-bakeoff` at `b73d960` on `main` (21 September 2026), after broader economy / difficulty knobs engine (PR #57). Line numbers below refer to this head and may drift.  
**Method:** read landed catalog-wire purchase helpers, Reman meeting, Phase 8 restriction / shop-standing forbids, Phase 4 `applyStandingOnce`, economy-difficulty overlay, GUIDED §6 + plan §16.2 row 6, and the stale GUIDED §7 “wire later” sentence. No engine changes made. This is a dependency/risk checklist for a **later** writer **if** Tenth scopes a thin subscribe-module slice — not a post-implementation review and not permission to implement before Tenth scopes the lane. **Keep #33, #35, #37, #38, #39, #40, #41, #42, #43, #44, #45, #46, #47, #48, #49, #50, #51, #52, #53, #54, #55, #56, and #57 locked.** Do not reopen EW, boarding, Phase 10, flags/passes, the weapon ledger, empty-armable, construction visuals, HTML catalogs, or economy / difficulty. Do not reopen catalog wire #28 or Reman #18. Do not reopen Phase 8 gates. Do not retune combat. Do not invent unrest / prestige curves beyond the named thresholds. Do not open dockClear polish, Thaleron facility invent, or Flash price locks.

## Verdict in one paragraph

Faction-wide standing / purchase tiers can stay **docs-only** on this PR. **This PR ships proposal + deps only.** Helpers already live on bake-off (PR #28 `PURCHASE_TIER_STANDING` / `evaluateWiredPurchase` / home 20; PR #18 `meetPackPurchaseDecision`; live shop already consults the wire). GUIDED §7 may still say “wire later” — that sentence is **stale**; `CATALOG_WIRED === true`. If Tenth later scopes a thin slice, prefer a **new `src/standing-tiers.js`** (name can change) that **subscribes** to those helpers and **asserts** the GUIDED §6 acceptance gates **without** rewriting the wire, Reman, Phase 8 forbids, or economy-difficulty overlays. That slice is a **named gate surface**, not a second catalog. Do **not** touch `src/ship-catalog-wire.js` gate logic except later **reads**, `meetPackPurchaseDecision`, `src/economy-difficulty.js`, HTML catalogs, or combat JSON. `STANDING_TIERS_LOCKED_FROM_REMASTERED === false`. The load-bearing risks are all honesty / identity mistakes: latinum buying Military; home 20 applied galaxy-wide; Concord sold for credits at Earth; a high bid lifting an embargo; a second kill-standing write; gifting `firingSolution` / `engagement_authorized`; `git am` remastered; reopening #28 / #18 / #33–#57.

## Natural later deliverable (say this clearly)

A thin **subscribe module** that asserts **already-landed** purchase-gate helpers is the natural S27 deliverable. Combat / HTML catalogs / economy-difficulty / Phase 8 forbids stay untouched.

| S27 is | S27 is not |
| --- | --- |
| Named first-pass table + home 20 / Open 0 | A certified prestige-earn curve |
| Subscribe to `evaluateWiredPurchase` | A second catalog or a GUIDED §7 “implement wire” job |
| Independent / Concord standing + vendor | “I have latinum” / `neutral` as a pact |
| Probe `__BM1_PROBE__.standingTiers` (name can change) | A combat probe, dockClear polish, or economy-difficulty reopen |
| `STANDING_TIERS_LOCKED_FROM_REMASTERED === false` | A remastered `git am` or locked remastered constants |

An in-game prestige-graph HUD, if ever wanted, is a **different** Tenth-scoped lane. First S27 should not open dockClear.

## What already exists (do not reinvent)

| Need | Engine / docs fact at `b73d960` |
| --- | --- |
| Catalog wire **landed** | `src/ship-catalog-wire.js`: `CATALOG_WIRED === true`, `CATALOG_WIRE_VERSION = 1`, `PURCHASE_TIER_STANDING` frozen `{ open: 0, trusted: 15, respected: 30, military: 50, strategic: 75, excalibur: 100, concord: 100 }`, `HOME_FACTION_STANDING = 20`, `OPEN_FACTION_STANDING = 0`, `createStartingStandings`, `catalogPurchaseContext` (feeds `tierThresholds`), `evaluateWiredPurchase`. Live shop / escort / garrison call it. S11. **GUIDED §7 “wire later” is stale.** |
| Pack purchase | `bm-ships/catalog.mjs` `getPurchaseDecision`: explicit `purchaseRequirements.factionStanding` wins over `tierThresholds[purchaseTier]`; missing standing **reads as 0**; refuse `faction-standing` / `funds` / `region` / `restricted-stock` / `standing-threshold-unconfigured` / `balance-pending`. |
| New-game start | `src/main.js` `state.factionStanding = createStartingStandings(state.playerFaction)`. Home 20. Other keys unset. Pack treats unset as 0. |
| Reman meeting | `meetPackPurchaseDecision` in `src/side-lane-repair-reman.js`. Hull **53 / `bm-ship:53`**. Remus is a vendor note. Durable unlock ≠ standing 75 ≠ latinum. |
| Concord / Excalibur rows | Concord **60**: `faction: 'neutral'`, explicit standing **100**, `availabilityRegion: 'independent-endgame'`, `specialVendor: 'independent-endgame'`, cost 1,050,000. Excalibur **347**: Terran, explicit **100**, `secret-paso` / `paso-project-x`, cost 1,500,000. |
| Military example | Hull **33**: Terran, `purchaseTier: 'military'`, explicit standing **50**, `shipyardEligible: true`. |
| Vendors | `resolvePackVendor`: X-Base / Project X → `paso-project-x`; Reman Starbase / stock 53 → `remus-secret`; Free Swiss Reserve Exchange → `independent-endgame`. |
| Phase 8 price ≠ ban | `RESTRICTION_KINDS` embargo / license / seller_rule / premium. `higherBidCannotPermit`. Shop cap `TRUSTED_SHOP_STANDING_CAP = PURCHASE_TIER_STANDING.trusted` (15). Reversal writes 0. **Do not reopen.** |
| Single token | `applyStandingOnce` in `src/phase4-incidents.js`. S6.4 / S8.9. Boarding capture ≠ kill cascade. |
| Economy / difficulty | `src/economy-difficulty.js`. Overlay feeds `resolveMagnitudes`. **Must not** retune `PURCHASE_TIER_STANDING` or home 20. `#56 / #57 stay locked.** |
| Identity | Phase 1: flag-share ≠ control; concessions foreign; independents ≠ alliance; Breen–Dominion no static friendship. |
| Remastered locks | `MAGNITUDES_LOCKED_FROM_REMASTERED`, `UTILITY_LOCKED_FROM_REMASTERED`, `LEDGER_LOCKED_FROM_REMASTERED`, `EMPTY_ARMABLE_LOCKED_FROM_REMASTERED`, `CONSTRUCTION_LOCKED_FROM_REMASTERED`, `HTML_CATALOG_LOCKED_FROM_REMASTERED`, `ECONOMY_DIFFICULTY_LOCKED_FROM_REMASTERED` all **false**. |
| Probe surface | `__BM1_PROBE__.phase8` … `.economyDifficulty`. First S27 adds `.standingTiers` only if Tenth scopes the module. |

**Gap this brief closes (docs now; module only if scoped):** there is no **scoreable S27 contract** that GUIDED §6 acceptance is hard, that other factions are declared Open 0, that Independent / Concord is standing + vendor, and that planning drift (“wire later” / “missing as live gates”) is corrected by **subscribing** to the landed helpers rather than reimplementing them.

## Hooks the writer will have to touch

**This PR touches none of these.** If Tenth later scopes a thin subscribe module:

Prefer **new files** rather than growing `src/ship-catalog-wire.js` into a second religion:

| Proposed file | Responsibility |
| --- | --- |
| `src/standing-tiers.js` (name can change) | `STANDING_TIERS_LOCKED_FROM_REMASTERED === false`; re-export / assert the landed table; helpers that evaluate Military / Concord / Excalibur refusals **through** `evaluateWiredPurchase`; start-map Open 0 rule (missing≡0); no-fire / single-token asserts. |
| Optional `scripts/test-standing-tiers.mjs` | Offline: credits-rich standing-poor refuses 33 / 347; home 20; Concord vendor; lock flag false. **Not** a rewrite of S11 / S13 / S26. |
| Optional thin shop-refusal label in `src/main.js` | Independent trade standing copy. **No** dockClear polish. **No** fire write. |

Do **not** implement this by rewriting `getPurchaseDecision`, `evaluateWiredPurchase`, `meetPackPurchaseDecision`, `src/phase8-markets.js` forbids, `src/economy-difficulty.js` overlays, `src/phase5-objectives.js`, `src/phase9-*.js`, `src/weapon-source-ledger.js`, `src/construction-visuals.js`, `src/empty-armable.js`, `src/boarding-*.js`, `src/phase10-*.js`, `src/utility-inventory.js`, or HTML catalog generators. Do **not** `git am` remastered patches. Do **not** add EW families. Do **not** retune combat. Do **not** edit `docs/html-catalogs/*.html`.

| Existing path | Required integration (later S27) |
| --- | --- |
| `evaluateWiredPurchase` / `catalogPurchaseContext` | **Subscribe.** Fail if S27 forks a second shop allow. |
| `PURCHASE_TIER_STANDING` / `HOME_FACTION_STANDING` | **Cite.** Fail if the table is rewritten “as difficulty” or certified as final. |
| `createStartingStandings` | Home 20. Others missing≡0 or explicit 0. Fail if others start at 20 / 100. |
| `meetPackPurchaseDecision` | **Untouched.** Fail if standing 100 or latinum returns allowed for hull 53 without the durable unlock. |
| Concord 60 / Excalibur 347 / hull 33 | **Fixtures.** Fail if credits-only allows them. Fail if Concord sells at Utopia. |
| `shopStandingDelta` / `TRUSTED_SHOP_STANDING_CAP` | **Untouched.** Fail if shop ping-pong reaches Military. |
| `higherBidCannotPermit` / restriction kinds | **Untouched.** Fail if standing 100 lifts an embargo. |
| `applyStandingOnce` | **Untouched.** Fail if a standing-tier label writes a second kill token. |
| `resolveDifficultyMagnitudes` / `src/economy-difficulty.js` | **Untouched.** Fail if Easy / Hard changes the table or home 20. |
| `consultDoctrineFire` / `liveFireFactsFromEw` / Phase 2 ROE | Untouched. Fail if setStanding writes `firingSolution` or `engagement_authorized`. |
| `tractorIsBoarding` | Stays false. |
| `__BM1_PROBE__.catalog` / `.phase8` / `.economyDifficulty` | **Keep.** Add `.standingTiers` snapshot: table, home 20, lock false, purchase reasons, fire flags, token flags. |
| HTML catalogs / `game_items.json` | **Untouched.** Fail if S27 edits catalog HTML or combat JSON. |
| Inventory / dock UI | **Out.** DockClear polish **out**. |

## Risks

### 1. Latinum buys Military / Strategic / Excalibur (gate 1)

`if (credits >= ship.cost) return { allowed: true }` ahead of standing, or folding `faction-standing` into `funds`, fails money ≠ trust.

**Gate:** S27.1.

### 2. Home 20 applied to every faction, or others start Trusted (gate 2)

Writing 20 (or 15 / 100) onto `terran` when the player picked Ferengi, or treating unset as unconfigured refuse, fails the Open 0 default.

**Gate:** S27.2.

### 3. Concord / Independent sold for latinum, or `neutral` becomes a pact (gate 3)

Selling hull 60 at Earth because the captain is rich, treating `neutral` 100 as imperial immunity, or skipping `independent-endgame` because standing is 100, fails standing + vendor.

**Gate:** S27.3.

### 4. High bid / standing lifts a ban (gate 4)

`if (standing >= 100) embargo = false` or a Concord vendor that sells embargoed imperial munitions as “trusted trader” fails plan §10.

**Gate:** S27.4.

### 5. Second standing write (gate 5)

A shop-notice, Concord-unlock toast, or report path that calls `adjustFactionStanding` without `applyStandingOnce` fails the Phase 4 / 5 token rule.

**Gate:** S27.5.

### 6. Standing gifts fire (gate 6)

A handler that sets `engagement_authorized` / `firingSolution` / culture fire because the captain is Military **fails** the knowledge-layer lean.

**Gate:** S27.6.

### 7. Reimplement wire / reopen economy / remastered crib (gates 7–8)

Treating GUIDED §7 “wire later” as a license to rewrite `ship-catalog-wire.js`, retuning the table inside `economy-difficulty.js`, touching EW / boarding / HTML catalogs, inventing an unrest / prestige curve, dockClear, or `git am` remastered patches fails even if the refusals are green. Flipping any `*_LOCKED_FROM_REMASTERED` to true fails the blind rule.

**Gate:** S27.7 / S27.8.

## Probe plan (S27)

**Not in this docs PR.** Add `__BM1_PROBE__.standingTiers` + optional `scripts/test-standing-tiers.mjs` **only after** Tenth scopes the module. **Replay S11 + S13 + S26 + S7 + S14–S25.** Do not break existing injectors.

**Minimum later-slice contract:**

```js
__BM1_PROBE__.standingTiers = {
  snapshot: () => ({
    lockedFromRemastered: false,
    homeStanding: 20,
    othersDefault: 0,
    tiers: { open: 0, trusted: 15, respected: 30, military: 50, strategic: 75, excalibur: 100, concord: 100 },
    purchase: {
      militaryReasonDistinct: true,
      remanReasonDistinct: true,
      concordNeedsVendor: true,
      standingNotFunds: true,
    },
    token: { doubleStandingOnKill: false },
    fire: { firingSolutionPresent: false, engagementAuthorizedPresent: false },
    inventedCurves: { unrest: false, prestigeEarn: false },
  }),
  evaluate: (hullId, context) => { /* fail setup if helper missing; must call evaluateWiredPurchase */ },
};
```

Suggested first check set:

1. **S27.1 / S27.2:** credits-rich standing-poor refuses Military / Excalibur; home 20 / others 0.
2. **S27.3 / S27.4:** Concord vendor + standing; price ≠ ban.
3. **S27.5 / S27.6:** single token; no fire gift.
4. **S27.7 / S27.8:** preservation replay (S11 / S13 / S26 green; wire / Reman / economy / HTML / combat untouched); remastered-lock false.

## Recommended implementation order (later S27 only)

1. Add `src/standing-tiers.js` with `STANDING_TIERS_LOCKED_FROM_REMASTERED === false` and a snapshot of the **landed** table (S27.8).
2. Route probe evaluates through `evaluateWiredPurchase` (S27.1).
3. Start-map fixture: selected faction 20; others Open 0 / missing≡0 (S27.2).
4. Concord 60 + Excalibur 347 vendor / standing fixtures (S27.3).
5. Replay Phase 8 price≠ban under high standing (S27.4).
6. Replay S6.4 single write; no fire inject (S27.5 / S27.6).
7. Preservation: wire / Reman / economy-difficulty / Phase 8 / HTML / EW / boarding modules untouched except reads (S27.7).
8. Optional Independent-trade label. **Not** dockClear polish. **Not** an HTML-catalog price column.

Skip invented utilities, `git am`, `game_items.json` combat retune, Phase 8 gate rewrites, HTML catalog edits, economy-difficulty table retune, EW / boarding / Phase 10 / flags / ledger / empty-armable / construction hooks, and “final” balance certification entirely.

## Out of scope for the writer of a later slice

Engine work **before** a brief Pass; a prestige HUD on **this** docs PR; dockClear polish; HTML catalog reopen (#54 / #55); `game_items.json` combat retune; Flash price locks; inventing unrest / prestige curves beyond the named thresholds; reopening Phase 8 anti-farm or clamp logic; collapsing purchase reasons; a second Reman id; reimplementing catalog wire because GUIDED §7 still says “later”; Easy / Hard standing retune (#56 / #57); shipping Thaleron Test Facility; redoing PR #18 repair arms; reopening construction #52 / #53; `BM1-remastered-work` as source; `git am` remastered patches; claiming a Referee Pass; reopening #33 / #35 / #37 / #38 / #39 / #40 / #41 / #42 / #43 / #44 / #45 / #46 / #47 / #48 / #49 / #50 / #51 / #52 / #53 / #54 / #55 / #56 / #57; gifted FS / `engagement_authorized` from a standing tier; wiping delivered reports; flipping `tractorIsBoarding`; rewriting `meetPackPurchaseDecision`; moving Phase 5 `deadlineAt`; a sixth power consumer.

## Sources

- Proposal: `docs/standing-tiers/BM1-STANDING-TIERS-PROPOSAL.md`
- Planning: `docs/GUIDED-CONVERGENCE.md` §6; §7 landed-state note; `docs/revised-development-plan.md` §10 / §16.2 row 6
- Catalog / standing helpers: `src/ship-catalog-wire.js`; PR #28; `bm-ships/catalog.mjs`; `docs/SHIP-ECONOMY-REVIEW.md`; S11
- Reman / repair: `src/side-lane-repair-reman.js`; PRs #18 / #19
- Phase 8: `docs/phase8/`; PR #31; `src/phase8-markets.js`; S13
- Economy / difficulty (stay locked): `docs/economy-difficulty/`; PRs #56 / #57; S26
- Phase 4 token: `src/phase4-incidents.js`; S6.4
- Phase 5: `src/phase5-objectives.js`; PR #21
- HTML catalogs (stay locked): `docs/html-catalogs/`; PRs #54 / #55; S25
- Construction (stay locked): `docs/construction-visuals/`; PRs #52 / #53; S24
- Empty-armable: `docs/empty-armable/`; PRs #50 / #51; S23
- Flags/passes: `docs/flags-passes/`; PRs #46 / #47; S21
- Ledger: `docs/weapon-ledger/`; PRs #48 / #49; S22
- EW locked: `docs/phase9/`; PRs #33 / #35 / #37 / #42 / #43 / #44 / #45; S14–S20
- Phase 10 locked: `docs/phase10/`; PRs #40 / #41; S18
- Boarding: `docs/boarding/`; PRs #38 / #39; S17
- Companion shape: `docs/economy-difficulty/BM1-ECONOMY-DIFFICULTY-ENGINE-DEPENDENCIES.md`
