# BM1 Phase 10 full roster: later-slice dependencies

**Reviewed document:** `BM1-PHASE10-ROSTER-PROPOSAL.md`  
**Reviewed against:** `Artemis2028/BM1-bakeoff` at `10540aa` on `main` (22 September 2026), after away-team XP S30 engine (PR #66). Line numbers below refer to this head and may drift.  
**Method:** read the landed `dominionBook` roster flags, S18.18, doctrine profile/culture ids, pack faction/region counts, Phase 1 Breen–Dominion strip, `factionDefs` start cards, and the BAKEOFF-STATUS / GUIDED note that left the full roster **deferred**. No engine changes made. This is a dependency/risk checklist for a **later** writer **if** Tenth scopes a thin subscribe catalog — not a post-implementation review and not permission to implement before Tenth scopes the lane. **Keep #33–#66 locked.** Do not reopen EW, boarding combat, Dominion-first hard gates, flags/passes, the weapon ledger, empty-armable, construction visuals, HTML catalogs, economy / difficulty, standing tiers, dockClear, hygiene, alertsActive, or away-team XP. Do not rewrite two-mode ROE. Do not retune combat. Do not invent a Thaleron facility. Do not `git am` remastered patches.

## Verdict in one paragraph

Full-roster completeness can stay **docs-only** on this PR. **This PR ships proposal + deps only.** Dominion-first already recorded the deferral as `scope: 'dominion-first'` plus `rosterPlayable.{independent,ferengi,vulcan}: false` and `rareCommanders: false` (S18.18). The parked residual is the **missing named catalog**: doctrine already has 22 profiles and 9 cultures, and the pack already has 20 faction keys, but Phase 10 does not say which of those are named coverage versus stubs. If Tenth later scopes a thin slice, prefer a **sibling book** (`src/phase10-roster.js`, name can change) that **subscribes** to profile ids, pack faction/region facts, and the landed knowledge/hide/pack gates, exports `PHASE10_ROSTER_LOCKED_FROM_REMASTERED === false`, and **does not write** `dominionBook.scope` or `rosterPlayable`. Do **not** touch `regionAllows`, `ROE_MODES`, `game_items.json`, or dockClear CSS. The load-bearing risks are all identity mistakes: flipping S18.18; gifting `firingSolution` / `engagement_authorized`; revealing Dominica because a path was named; restoring Breen–Dominion friendly; minting Gorn or pirate polities; inventing a locked discovery table; `git am` remastered; reopening #33–#66.

## Natural later deliverable (say this clearly)

A thin **subscribe catalog** that publishes §3 coverage (named / stub / subscribe-dominion-first) is the natural **S31** deliverable. Dominion-first campaign rules, ROE, pack region gates, and away-team XP stay untouched.

| S31 is | S31 is not |
| --- | --- |
| Sibling `factionRosterBook` outside `systemStates` | A rewrite of `state.dominionBook` or an S18.18 amend |
| 22 profiles + 20 pack factions + 9 cultures, each classified | New player-start cards or a `rebel` runtime key |
| `knowledgeCap: 'none'`; `grantsFire: false`; `pactInherit: false` | A rumor, a map reveal, or `engagement_authorized` |
| Gorn / Borg / pirate / rare-commanders / cultures as **stubs** | Ambient Gorn, ambient Borg, or a pirate hull mint |
| Dominion remnant/central as **pointers** | A second stage machine or debug `authorizedDeployment` |
| `PHASE10_ROSTER_LOCKED_FROM_REMASTERED === false` | A remastered `git am` or a locked percent table |
| Replay `test:phase10` (S18.18 unchanged) + doctrine | A Phase 10 hard-gate reopen |

DockClear polish, a Thaleron facility, a combat retune, an ROE rewrite, or an away-team XP reopen, if ever wanted, remain **different** Tenth-scoped lanes.

## What already exists (do not reinvent)

| Need | Engine / docs fact at `10540aa` |
| --- | --- |
| Residual flags | `src/phase10-dominion-book.js` `PHASE10_ROSTER = 'dominion-first'` (~31). `emptyDominionBook` sets `rosterPlayable: { independent: false, ferengi: false, vulcan: false }` and `rareCommanders: false` (~86–91). Restore **re-stamps** those flags (~406–408). Probe mirror in `src/main.js` (~25313). |
| S18.18 | `scripts/test-phase10-dominion.mjs` (~232–234) and `scripts/behavior-probe.mjs` (~4644) require `scope === 'dominion-first'`. **Do not amend.** |
| Knowledge / hide / packs | `src/phase10-discovery.js`, `src/phase10-pack-gates.js`, `src/phase10-agreements.js`, `src/phase10-magnitudes.js`. Rumor ≠ FS. Discovery lists systems. `resolveAuthorizedDeployment` is an operation, not a role. `DISCOVERY_ODDS_LOCKED` / `INVASION_ODDS_LOCKED` false. |
| Doctrine set | `docs/doctrine/bm1-faction-doctrine.v0.2.1.json`: **22** profiles (`terran` … `gorn`, Gorn `dormant`); **9** cultures (`lysian`, `flashian`, `swiss`, `dyson`, `opusab`, `teposian`, `reman`, `trill`, `blender_remnant`). Two Dominion profiles share runtime key `dominion`. |
| Pack set | Active `bm-ships/ships.json` faction keys (**20**): andorian 3 general; bajoran 1; borg 1 mission-only + 1 borg-core; breen 3; cardassian 5; delpin 3; dominion 2 dominion-all + 4 dominion-core; ferengi 3; gorn 3 reserved-gorn; hirogen 3; klingon 10; neutral 38 general + 1 independent-endgame; promelli 2; romulan 10 general + 1 secret-remus; sona 3; suliban 3; tarellian 1; terran 58 general + 2 secret-paso; tholian 5; vulcan 8. **No** `faction: "pirate"` rows. |
| Region gates | `bm-ships/catalog.mjs` `regionAllows`: reserved-gorn / unknown false; mission-only needs role `mission` and `authorizedDeployment`; empty pool stays empty. |
| Phase 1 identity | `src/phase1-authority.js` `applyPhase1RelationContract` strips `dominion`↔`breen` friendly (~68–69). `src/doctrine.js` `applyPhase1Relations` does the same (~328–331). Cardassian/Breen pacts stay scoped on the agreements book (`PACT_IDS` in `src/phase10-agreements.js`). |
| Start cards | `src/main.js` `factionDefs` (~9397): neutral, ferengi, vulcan, romulan, cardassian, terran (`label: 'Terran Rebel'`), klingon, dominion, tholian. Nine starts. Do not add cards in S31 unless Q1 is answered otherwise (default **no**). |
| Pirate string | `getBaseSystemFaction` (~9362) can return `'pirate'` from a place name. That is not a pack polity. |
| Remastered locks | `MAGNITUDES_LOCKED_FROM_REMASTERED`, `UTILITY_LOCKED_FROM_REMASTERED`, `LEDGER_LOCKED_FROM_REMASTERED`, `EMPTY_ARMABLE_LOCKED_FROM_REMASTERED`, `CONSTRUCTION_LOCKED_FROM_REMASTERED`, `HTML_CATALOG_LOCKED_FROM_REMASTERED`, `ECONOMY_DIFFICULTY_LOCKED_FROM_REMASTERED`, `STANDING_TIERS_LOCKED_FROM_REMASTERED`, `DOCK_CLEAR_LOCKED_FROM_REMASTERED`, `ALERTS_ACTIVE_LOCKED_FROM_REMASTERED`, `AWAY_TEAM_XP_LOCKED_FROM_REMASTERED` all **false**. |
| XP / alerts | `src/away-team-xp.js` tracked `named_mix`. `src/alerts-active.js` effective snapshot. **Do not edit.** |

**Gap this brief closes (docs now; catalog only if scoped):** there is no **scoreable S31 contract** that names coverage versus stubs, keeps the dominion book dominion-first, and treats BAKEOFF-STATUS’s “full roster deferred” as a **parked catalog item** rather than permission to rewrite ROE, hide rules, or pack gates.

## Hooks the writer will have to touch

**This PR touches none of these.** If Tenth later scopes a thin subscribe catalog:

Prefer **one new file** rather than growing `phase10-dominion-book.js` into a roster religion:

| Proposed file | Responsibility |
| --- | --- |
| `src/phase10-roster.js` (name can change) | `PHASE10_ROSTER_LOCKED_FROM_REMASTERED === false`; `emptyFactionRosterBook` / serialize / restore; rows from the proposal §3 tables; `factionRosterSnapshot()` with completeness counts, `grantsFire: false`, `knowledgeCap: 'none'`, `pactInherit: false`, `rareCommanders: false`, `separateRebelPolity: false`. **No** dominion-book write. **No** fire write. **No** spawn write. |
| `src/main.js` | Thin: create/restore sibling `state.factionRosterBook` next to `dominionBook`; `saveGame` / `loadGame` / `resetRunState`; `__BM1_PROBE__.phase10Roster`. **Do not** change `factionDefs`, `currentCatalogSpawnContext`, or map hide. **Do not** dockClear-reflow. |
| `src/phase10-dominion-book.js` | **Untouched flags.** Fail if `rosterPlayable` or `scope` changes. Optional read-only import of profile ids is worse than a static row list copied from **this** brief’s §3 (the brief is the contract). Do not parse remastered. |
| Optional `scripts/test-phase10-roster.mjs` | Offline: lock false; 22/20/9; stubs; dominion scope still dominion-first; no fire fields. |
| `scripts/behavior-probe.mjs` | Add S31 **after** scope. **Replay** S18 including S18.18. Do not edit S18.18’s expected `dominion-first`. |

Do **not** implement this inside `src/phase9-*.js`, `src/phase91-*.js`, `src/phase92-*.js`, `src/phase94-magnitudes.js`, `src/away-team-xp.js`, `src/alerts-active.js`, `src/dock-clear.js`, `src/utility-inventory.js`, or `src/standing-tiers.js`. Do **not** `git am` remastered patches. Do **not** retune `game_items.json` or `bm-ships/ships.json`. Do **not** edit `docs/html-catalogs/*.html`.

| Existing path | Required integration (later S31) |
| --- | --- |
| `emptyDominionBook` / `restoreDominionBook` | **Untouched.** Fail if restore stops re-stamping `rosterPlayable: false`. |
| `injectKnowledge` / `injectDiscoveryWrite` | Roster load must not call them. A row is not a layer and not a map pin. |
| `resolveAuthorizedDeployment` / `regionAllows` | **Untouched.** Fail if a named row sets `authorizedDeployment`. |
| `applyPhase1RelationContract` | **Untouched.** Fail if Breen–Dominion friendly returns. |
| `meetPackPurchaseDecision` / `evaluateWiredPurchase` | **Untouched.** Fail if Reman 53 or Excalibur unlocks from a row. |
| `consultDoctrineFire` / `playerForceMayAutoEngage` | Untouched. Fail if a row writes `firingSolution` or `engagement_authorized`. |
| `ROE_MODES` / `getEffectivePolicy` | Untouched. Fail if a path adds `protect-all` or rewrites merge/retain. |
| `saveGame` / `loadGame` / `resetRunState` | New sibling key. Load still wipes `systemStates` first. Restore roster **beside** dominion book, not inside it. No `performance.now()` deadlines. |
| `__BM1_PROBE__.phase10` | Keep. Add `.phase10Roster` snapshot (below). S18.18 still reads dominion scope. |
| `src/away-team-xp.js` / `src/alerts-active.js` / `src/dock-clear.js` | **Untouched.** |

## Risks

### 1. Completeness skipped or S18.18 flipped (gates 1 and 4)

Shipping three `rosterPlayable: true` flags inside `dominionBook`, or omitting Gorn/Borg/pirate/cultures, leaves the residual and reopens the campaign book. Inventing `rebel` or `thaleron` as a faction key fails identity and named outs.

**Gate:** S31.1 / S31.4.

### 2. Named path becomes a fire mode or a map dump (gates 2 and 3)

`mayAutoEngage` because `coverage === 'named'`, or Dominica labels because `bajoran` or `dominion` was catalogued, fails Phase 2 and Dominion-first gates 2–3.

**Gate:** S31.2 / S31.5 / S31.6.

### 3. Pact inheritance / Breen friendship restored (gate 1 identity + gate 4)

`runtimeFaction === 'breen'` copying `dominion_breen_pact` onto every captain, or deleting the Phase 1 strip, fails compartmentation.

**Gate:** S31.7.

### 4. Stub becomes ambient content (gate 4 pack preservation)

Gorn pool fallback, Borg in Earth traffic, a pirate hull minted from the place-name string, or `rareCommanders: true` with a memory table fails the stub table.

**Gate:** S31.3.

### 5. Locked secret table / remastered crib (gates 6 and 8)

A non-overridable discovery percent, `git am` of a remastered faction file, or `PHASE10_ROSTER_LOCKED_FROM_REMASTERED === true` fails even if S18.4 stays green.

**Gate:** S31.8.

### 6. DockClear / ROE / XP / alertsActive reopen (gates 4–5)

Reflowing star-chart CSS, adding a third ROE, reverting `alertsActive`, or editing the XP mix “while factions are open” fails do-not-reopen / named outs.

**Gate:** S31.5 / S31.10.

## Probe plan (S31)

**Not in this docs PR.** Add `__BM1_PROBE__.phase10Roster` + optional `scripts/test-phase10-roster.mjs` **only after** Tenth scopes the slice. **Replay `test:phase10` + `test:doctrine` + S18 including S18.18 + S30.** Do not break existing injectors.

**Minimum later-slice contract:**

```js
__BM1_PROBE__.phase10Roster = {
  snapshot: () => ({
    lockedFromRemastered: false,          // PHASE10_ROSTER_LOCKED_FROM_REMASTERED
    profileCount: 22,
    packFactionCount: 20,
    cultureCount: 9,
    inventedKeys: [],                      // must stay empty
    rareCommanders: false,
    separateRebelPolity: false,
    grantsFire: false,
    firingSolution: false,
    engagement_authorized: undefined,
    knowledgeCap: 'none',
    pactInherit: false,
    discoveryOddsLocked: false,
    invasionOddsLocked: false,
    secretTablePresent: false,
    dominion: {
      scope: 'dominion-first',             // fail if this moved
      rosterPlayableFerengi: false,
      bookForked: false
    },
    stubs: {
      gornPoolEmpty: true,
      borgAmbient: false,
      pirateMinted: false
    }
  }),
  failIfMissing: true
};
```

Fail setup if `phase10Roster` is missing. Fail if `profileCount !== 22` or any §3 named id is absent. Fail if `dominion.scope !== 'dominion-first'`. Fail if `engagement_authorized` is present. Fail if `lockedFromRemastered === true`.

**Screenshot / no-clip (engine PR only, and only if a readout ships):** 1280×720. `clippedControls: []`. Dock-clear. This docs PR attaches **no** PNGs. Probe-only S31: screenshot **N/A**.

## Recommended implementation order (later S31 only)

1. Add `PHASE10_ROSTER_LOCKED_FROM_REMASTERED === false` + empty sibling book (S31.8).
2. Stamp §3 rows (S31.1).
3. Assert fire / ROE / identity forbids (S31.2 / S31.5).
4. Assert stubs and the Dominion pointer (S31.3 / S31.4 / S31.6 / S31.7).
5. Save/load beside `dominionBook` (S31.9).
6. Replay S18 unamended, doctrine, S30 (S31.10).
7. Honest readout **only if** chrome is in scope (S31.11). Otherwise skip shots.

Skip invented polities, `git am`, `ships.json` faction edits, `regionAllows` edits, dominion-book flag edits, ROE edits, dockClear CSS, HTML catalog edits, Thaleron, combat retune, and XP edits entirely.

## Out of scope for the writer of a later slice

Engine work **before** a brief Pass; S31 on **this** docs PR; amending S18.18; forking campaign stage / discovery / agreements; new `factionDefs` starts; `rebel` runtime key; Gorn survivor; Borg assimilation; rare-commander memory; culture-as-fire; restoring Breen–Dominion friendly; Reman or Excalibur unlock from a row; `protect-all`; merge/retain rewrite; EW #33–#45 reopen; boarding #38/#39 reopen; flags/ledger/empty-armable/construction/HTML/economy/standing reopen; dockClear #60/#61 reopen; hygiene #62 un-flip; alertsActive #63/#64 revert; away-team XP #65/#66 reopen; `game_items.json` combat retune; Flash price locks; `BM1-remastered-work` as source; `git am` remastered patches; claiming a Referee Pass; gifted FS / `engagement_authorized` from a catalog row; flipping `tractorIsBoarding`; rewriting `meetPackPurchaseDecision`.

## Sources

- Proposal: `docs/phase10-roster/BM1-PHASE10-ROSTER-PROPOSAL.md`
- Dominion-first residual: `docs/phase10/BM1-PHASE10-DOMINION-FIRST-PROPOSAL.md` non-goals / S18.18; `docs/phase10/BM1-PHASE10-ENGINE-DEPENDENCIES.md`; PRs #40 / #41
- GUIDED §10 / BAKEOFF-STATUS soft residual list
- Landed helpers: `src/phase10-dominion-book.js`; `src/phase10-pack-gates.js`; `src/phase10-agreements.js`; `src/phase1-authority.js`; `src/doctrine.js`
- Doctrine: `docs/doctrine/bm1-faction-doctrine.v0.2.1.json`
- Pack: `bm-ships/ships.json`; `bm-ships/catalog.mjs`
- Probe: `scripts/test-phase10-dominion.mjs`; `scripts/behavior-probe.mjs` S18.18
- Soft-residual analog: `docs/alerts-active/BM1-ALERTS-ACTIVE-ENGINE-DEPENDENCIES.md`; `docs/away-team-xp/BM1-AWAY-TEAM-XP-ENGINE-DEPENDENCIES.md`
