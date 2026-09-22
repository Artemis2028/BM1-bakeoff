# BM1 Phase 10 full faction roster (Dominion-first soft residual)

**Status:** proposal for the parked Phase 10 **soft residual**; no engine changes made by this document.  
**Repository:** `Artemis2028/BM1-bakeoff`  
**Planning baseline:** `10540aa` on `main` (22 September 2026), after away-team XP S30 engine (PR #66) on `main` @ `10540aa` (brief #65).  
**This is a Phase 10 full-roster brief.** It opens **roster completeness only**: which factions, pack keys, and discovery-layer caps get **full named coverage** versus **deferred stubs**. It does **not** reopen the seven Dominion-first hard gates, does **not** rewrite two-mode ROE, does **not** open a new alert religion, and does **not** retune combat.  
**Referee context:** Phase 4 engine §6 **Pass** on `7f926df`. Phase 10 Dominion-first brief #40 / engine #41 are the **locked** campaign baselines — **Keep #40 and #41 locked.** Stories stay knowledge layers. The wider Dominion stays hidden until a discovery write. Paths stay ≠ ROE injects. Pack `dominion-all` / `dominion-core` / reserved Gorn / mission-only stay live. The staged campaign and compartmented covert knowledge stay as landed. EW + boarding stay locked. This brief does **not** claim a Referee Pass.  
**Companion:** `docs/phase10-roster/BM1-PHASE10-ROSTER-ENGINE-DEPENDENCIES.md` (hooks, risks, later S31 thin-catalog sketch).  
**Scoped by:** Tenth Mountain Trooper, 2026-09-22 — proposal + deps first; room scores the hard gates **before** any engine. Room-locked hard gates (named coverage without collapsing Phase 1 identity; paths ≠ ROE / no protect-all / no merge-retain rewrite; never gift fire; do-not-reopen #33–#66; named outs; blind; later thin catalog + probes; injectable magnitudes / no locked secret tables) are **in** this one scoreable brief.

Phases 1–10 and the later subscribe packages already landed, including away-team XP (`tracked: true`, `rule: 'named_mix'`). Dominion-first (PR #41) shipped a compact `state.dominionBook` **outside** `systemStates` and an explicit non-goal:

```js
scope: 'dominion-first',
rosterPlayable: { independent: false, ferengi: false, vulcan: false },
rareCommanders: false
```

S18.18 / `scripts/test-phase10-dominion.mjs` assert that triple. Plan §4 Phase 10 named “wider faction content, rare commanders and Dominion operations.” PR #40 took **only** the hidden campaign plus pack gates and deferred the roster. BAKEOFF-STATUS / GUIDED §10 have kept “full faction roster deferred” as the soft residual. This document **opens** that residual as a scoreable brief. It does **not** flip those three dominion-book flags.

This is **one** docs-roster brief: publish a **scoreable contract** that a later sibling catalog names every doctrine profile and every pack faction key already on bake-off `main`, classifies each as **named**, **stub**, or **subscribe-dominion-first**, and subscribes to landed knowledge layers, hide rules, pack region gates, and Phase 1 identity. A catalog row is **not** a firing solution, **not** a map reveal, **not** `engagement_authorized`, and **not** a third ROE. It is not a remastered `git am`, not a ROE rewrite, not a new alert religion, and not permission to invent locked discovery percentages or invasion odds.

**This PR ships proposal + engine-deps only.** A later thin **subscribe catalog** (S31), if Tenth scopes it after Pass, is the natural later deliverable. This brief does **not** ship that module and does **not** edit `src/`.

## 1. The result we want

A later writer can treat **roster completeness** the way alertsActive treated a parked readout: a **named sibling catalog**, **probe-visible coverage**, and **no new fire / identity / campaign religion**. `state.dominionBook` stays `scope: 'dominion-first'`. S18.1–S18.18 stay green **without amendment**. The new book answers “is this path named, stubbed, or still the locked Dominion campaign?” It does not answer “may this faction auto-engage?”

**Exit condition:** the eight hard gates in §2 are scoreable; Dominion-first gates 1–7 stay closed; Phase 1 political identity stays intact; no gifted fire; #33–#66 stay closed.

**Proposed first-release decisions:**

| Question | Proposed answer |
| --- | --- |
| What is the first playable slice? | **Docs-only** scoreable contract under `docs/phase10-roster/`. **This PR does not ship engine.** A later thin subscribe catalog (S31), **if** Tenth scopes it after Pass, lists §3 coverage. Name can change (`state.factionRosterBook`). |
| Is a thin subscribe catalog the natural later deliverable? | **Yes.** Analog: `src/alerts-active.js` / `src/standing-tiers.js`. S31 is **catalog completeness**, not a second `dominionBook`, not a ROE rewrite, and not a combat retune. |
| Where does the catalog live? | **Beside** `dominionBook`, **outside** `systemStates`. It **points** at remnant / central rows. It does **not** copy stage, discovery, agreements, or `authorizedDeployment`. |
| Do we flip `dominionBook.rosterPlayable`? | **No.** Those flags stay **false**. S18.18 stays. Named coverage is `coverage: 'named'` on the sibling, not `rosterPlayable: true` (that boolean meant “do not ship playable paths inside the campaign book”). |
| What gets full named coverage? | §3.1. Active doctrine profiles that already have a legal non-reserved pack pool, **except** the two Dominion profiles (they stay the locked campaign). |
| What stays a deferred stub? | §3.2. Reserved Gorn, mission-only Borg, pirate (no pack faction), rare commanders, nine local cultures, and the Terran start-card label “Terran Rebel” (not a new runtime key). |
| Do new player-start cards ship? | **No this slice.** Existing `factionDefs` starts stay (neutral, ferengi, vulcan, romulan, cardassian, terran, klingon, dominion, tholian). Catalog rows for breen / bajoran / andorian / … are **coverage**, not new start buttons. |
| Does naming a path reveal Gamma or raise a knowledge layer? | **No.** Default knowledge cap toward `wider_dominion` is **`none`**, per observer. A layer rises only through the landed knowledge inject. Map reveal stays a **separate** discovery write (Dominion-first gate 2). |
| Do faction paths change ROE / fire permission? | **No.** Objectives via roles, knowledge, and constraints. Two-mode Phase 2 ROE stays. No `protect-all`. No Phase 2 merge / retain / reclaim rewrite. |
| May a roster unlock or discovery gift `firingSolution`, culture fire, or `engagement_authorized`? | **No.** |
| May we reopen #33–#66? | **No.** Dominion-first **hard gates** stay locked. Away-team XP S30 stays locked. This brief is **only** the roster residual. |
| Thaleron facility, combat retune, Flash price locks, dockClear reopen, ROE rewrite, away-team XP reopen? | **Out.** |
| May we `git am` remastered patches or lock secret tables? | **No.** `PHASE10_ROSTER_LOCKED_FROM_REMASTERED === false`. Existing `*_LOCKED_FROM_REMASTERED` stay false. Discovery % / invasion odds stay injectable / TBD. |
| Must a later engine PR prove the catalog? | **Yes.** Probe: every doctrine profile id and every pack faction key is present once; stubs do not spawn; dominion book unchanged; fire flags absent. Replay Phase 10 / doctrine. |
| Screenshot / no-clip? | **Only if** UI chrome is touched (a roster readout). Else **N/A**. DockClear CSS **out**. |
| Is this a Referee Pass? | **No.** Referee / One score the hard gates **before** any engine. Number Three probes only after a later S31 slice. |

These are recommendations for this roster package, not new decisions attributed to the user. Locked bake-off constraints take precedence over older flavor that treated a named faction as weapons-free, a Dominion start as omniscient, `rosterPlayable: true` as a fire mode, or a remastered invasion table as the roster.

Cite plan §4 / §12, Dominion-first gates, and GUIDED §10 as the planning sources this brief **reconciles**, not as a second spec:

| Planning source | This brief |
| --- | --- |
| Plan §4 Phase 10: wider faction + rare commanders + Dominion operations | Dominion operations **stay** #40/#41. This brief names the wider-faction **catalog**. Rare commanders stay a **stub**. |
| Plan §12: factions differ via roles, knowledge, constraints; civilian ≠ empire military permissions | Gates 1–3. §3 rows point at doctrine priorities. They do not inject ROE. |
| Plan §12 table (Independent, Ferengi, Vulcan, Romulan, Cardassian, Terran, Klingon, Tholian, Dominion Remnant) | Named rows or the Dominion **pointer**. Remnant is not reimplemented here. |
| Plan §12: “clarify the existing Rebel label” | Stub note on `terran`. Label stays. No `rebel` runtime key. |
| Dominion-first gates 1–7; S18.18 roster not inside the campaign book | Gate 4. **Do not amend S18.18.** Sibling catalog. |
| GUIDED §10: `dominion-all` / `dominion-core`; reserved Gorn; mission-only; Battleship not ambient | §3.2 stubs + preservation. Pack shapes stay. |
| Doctrine: 22 profiles / 21 runtime keys; two Dominion profiles share `dominion`; Gorn dormant; culture cannot grant fire | §3 completeness set. Do not load a second doctrine pack. |
| Pack at `10540aa`: 20 faction keys; Gorn `reserved-gorn`; Borg `mission-only` + `borg-core` | Gate 1 catalog must list those keys. Empty legal pools stay empty. |
| Phase 1: flag-share ≠ control; shared `neutral` ≠ alliance; Breen–Dominion friendly stripped both ways | Gate 1 identity. Do not restore the friendship because Breen is now “named.” |
| Away-team XP #65/#66; alertsActive #63/#64 | Stay locked. Roster is a **different** residual. |

## 2. Locked constraints (do not reopen)

The bake-off room locked these before this brief. Implementation and probes must treat **gates 1–8** as **hard gates**. Referee / One score this brief against those **eight** **before** any engine PR. Number Three probes only after a later S31 slice. EW / boarding / Dominion-first / utility / ledger / empty-armable / construction / HTML / economy / standing / dockClear / hygiene / alertsActive / away-team XP gates stay **closed**; they are restated only as **gate 4** (preserve / do-not-open), not as a reopen. This docs PR **does not** claim a Referee Pass.

### Hard gate 1 — Named coverage and pack completeness, without collapsing Phase 1 identity

> The full roster **expands named Dominion-path coverage and pack catalog completeness**. A later catalog must list **every** doctrine profile id in `docs/doctrine/bm1-faction-doctrine.v0.2.1.json` and **every** active pack `faction` key in `bm-ships/ships.json` **exactly once**, each classified `named`, `stub`, or `subscribe-dominion-first` as §3 locks. It must **not** collapse Phase 1 political identity: flag-share is not system control; concessions stay foreign; shared `neutral` is not an alliance or intelligence net; independents are not one empire; Breen–Dominion static friendship stays **stripped both ways**; `playerFaction` / `playerSide` / Reman **53** do not change because a row was named. A catalog that omits a pack key, invents a faction key, sets `dominionBook.rosterPlayable.*` true, or rewrites `playerFaction` from a row **fails**.

Lane owner (wording): **Number Four** on the catalog; **Number 2** on identity.

Completeness is a **list**, not a new polity generator. `getBaseSystemFaction` name-matching is not permission to mint Gorn or pirate states. Secret-remus, secret-paso, and independent-endgame stay **landed purchase regions**. This brief does not retune who may buy them.

### Hard gate 2 — Paths still ≠ ROE injects; no protect-all / merge-retain rewrite

> Faction paths remain **objectives via roles, knowledge, and constraints**. They are not ROE injects. Phase 2 two-mode ROE stays (`return-fire` / `defend` only). No `protect-all`. No Phase 2 merge / retain / reclaim rewrite. A remnant merchant still does not inherit central strike modes. A named Ferengi, Vulcan, Cardassian, or Independent row does not add a mode, does not flip `playerForceMayAutoEngage`, and does not turn `protect` back into fire (`protect` still folds to `record_only`). Access is still a permission, not a ceasefire. A later slice that edits `ROE_MODES`, holding-zone merge math, or `recordObservedAttack` to “express” a faction path **fails**, even if the catalog is complete.

Lane owner (wording): **Number 2**; **Referee / One** on do-not-open Phase 2.

### Hard gate 3 — Never gift FS / culture / `engagement_authorized` from roster unlock or discovery

> Naming a path, unlocking a catalog row, raising a knowledge cap, or running a discovery inject through the roster helper must **never** gift `firingSolution`, culture fire, or `engagement_authorized`. Culture on a named society still cannot grant fire. A roster “unlock” is not a lock, not a war, not Reman **53**, not a Gamma map dump, and not `mayAutoEngage`. Pursuit ≠ permission ≠ per-weapon gate still holds. Default knowledge cap is **`none`**. Contact is still not a map reveal. Discovery stays a **separate** write that lists systems (Dominion-first gate 2).

Lane owner (wording): **Number 2**.

`consultDoctrineFire` keeps deleting `engagement_authorized`. Roster helpers must **not** pass that extra.

### Hard gate 4 — Do not reopen landed lanes (#33–#66), including Dominion-first hard gates

> Do **not** reopen EW #33 / #35 / #37 / #42 / #43 / #44 / #45. Do **not** reopen boarding combat #38 / #39 (`tractorIsBoarding()` stays false). Do **not** reopen Phase 10 Dominion-first **hard gates** #40 / #41 (stories = knowledge layers; hidden wider Dominion; paths ≠ ROE; pack spawn/purchase gates including reserved Gorn and mission-only; staged campaign; compartmented covert knowledge; EW + boarding preserved). Do **not** amend S18.18 to sneak playable flags into `dominionBook`. Do **not** reopen flags / passes #46 / #47 (Thaleron pass **unverified — not shipped**). Do **not** reopen ledger #48 / #49. Do **not** reopen empty-armable #50 / #51. Do **not** reopen construction #52 / #53. Do **not** reopen HTML catalogs #54 / #55. Do **not** reopen economy / difficulty #56 / #57. Do **not** reopen standing-tiers #58 / #59. Do **not** reopen dockClear #60 / #61. Do **not** reopen hygiene #62. Do **not** reopen alertsActive #63 / #64. Do **not** reopen away-team XP #65 / #66 (`tracked: true`, `rule: 'named_mix'` stays). This brief is **not** a Settings HUD rewrite and **not** a dock-overlap pass.

Lane owner (wording): **Referee / One**.

A writer who “finishes the roster by restoring a Breen alliance,” who retunes `authorizedDeployment` back into a role bit, or who treats away-team XP as unfinished work **fails**.

### Hard gate 5 — Named outs

> Do **not** invent a Thaleron **facility** (place, quest, pin, or pass). Do **not** retune combat weapons. Do **not** treat any Flash number as a live price lock. Do **not** reopen dockClear / UI-fit. Do **not** rewrite two-mode ROE. Do **not** reopen away-team XP (no new mix, no XP table, no hull% / XOR / tractor edit). Cite those as **other** residuals / locked packages. Do **not** reopen Phase 8 clamps, catalog wire, or Reman `meetPackPurchaseDecision`. Do **not** ship rare commanders as playable memory. Do **not** author a Gorn survivor event in this slice.

Lane owner (wording): **Referee / One**.

### Hard gate 6 — Blind bake-off

> Do **not** `git am` remastered patches. Do **not** crib `BM1-remastered-work` engine, DESIGN, invasion timing, or faction tables as the roster source. `PHASE10_ROSTER_LOCKED_FROM_REMASTERED === false`. Implement later from bake-off `docs/phase10-roster/` + landed doctrine / pack / `dominionBook` only. Flipping any existing `*_LOCKED_FROM_REMASTERED` to true **fails**.

Lane owner (wording): **Referee / One**.

### Hard gate 7 — Later engine: thin subscribe catalog + probes; replay Phase 10 / doctrine; shots only if chrome

> A later engine PR **must** be a **thin** subscribe catalog plus probes that assert: §3 coverage is complete (gate 1), no ROE / fire writes (gates 2–3), `dominionBook` scope and `rosterPlayable` are unchanged (gate 4), and the remastered-lock flag is false (gate 6). It **must** replay Phase 10 (`test:phase10` / S18, including S18.18 **unchanged**) and doctrine green. An engine PR that lands a helper without the completeness probe **fails**. An engine PR that forks a second campaign book or rewrites pack `regionAllows` **fails**. **This docs PR adds no S31 to the probe and no engine.**

**Screenshots:** baseline + after **only if** UI chrome is touched (a roster readout). If no chrome: **N/A**, like alertsActive. DockClear CSS / overflow JSON **out**.

Lane owner (wording): **Number Four** (catalog + process); **Number Three** scores the probe **after** a later slice.

### Hard gate 8 — Magnitudes, discovery %, and invasion odds stay injectable; no locked secret tables

> Discovery percentages, invasion odds, stage clocks, and any per-path “how often they notice the Dominion” rates stay **injectable playtest / TBD**. Do **not** ship a locked secret table copied from remastered. `discoveryOddsLocked` / `invasionOddsLocked` stay **false** on the campaign book. The roster catalog must not add a second odds lock. Override, if a later slice exposes a rate at all, **must** change the snapshot. Omit inject ⇒ default knowledge cap **`none`** (not a hidden percent). A frozen “Ferengi discover at 12%” constant **fails**.

Lane owner (wording): **Number Four** on inject; **Referee / One** on do-not-invent-a-table.

### Soft gate 9 — Suites stay green (after a later slice)

> **Soft:** existing suites stay green (Phase 1 / S4–S30 / catalog / doctrine / boarding / Phase 10 / Phase 8 / Phase 9.4 / utility / weapon-ledger / empty-armable / construction / html-catalogs / economy-difficulty / standing-tiers / dock-clear / alerts-active / away-team XP / side-lane). A later S31 engine does **not** reopen dockClear, EW math, or boarding combat.

Lane owner (wording): **Number Four** (process); **Number Three** scores suite-green **after** a later slice that touches runtime — not this brief.

### Also from the room (score with the gates)

| Plan / room want | How this brief locks it |
| --- | --- |
| Named Dominion-path coverage + pack completeness; Phase 1 identity intact | Gate 1. §3. |
| Paths ≠ ROE; no protect-all; no merge-retain rewrite | Gate 2. |
| Never gift FS / culture / `engagement_authorized` from roster unlock or discovery | Gate 3. |
| Do not reopen #33–#66, including Dominion-first hard gates and away-team XP | Gate 4. |
| Named outs: Thaleron, combat retune, Flash locks, dockClear, ROE, away-team XP | Gate 5. |
| Blind; `PHASE10_ROSTER_LOCKED_FROM_REMASTERED === false` | Gate 6. |
| Later engine: thin catalog + probes; replay Phase 10 / doctrine; shots only if chrome | Gate 7. |
| Magnitudes / discovery % / invasion odds injectable; no locked secret tables | Gate 8. |
| Suites green; no Referee Pass from this PR | Soft gate 9. Scoring note below. |

### Must not break (cite landed work)

Score as **preservation**. A later roster Pass that regresses them is a Fail. **#33 through #66 stay locked.**

| Locked rule | Cite | This brief / later slice must not |
| --- | --- | --- |
| Stories = knowledge layers; no gifted FS from rumor / contact | Dominion-first gate 1; S18.1–S18.3 | Treat a catalog row as a firing solution or FLASH. |
| Hidden wider Dominion; start does not auto-reveal | Dominion-first gate 2; S18.4–S18.5 | Name Dominica because Bajora or Dominion was catalogued. |
| Paths ≠ ROE injects | Dominion-first gate 3; Phase 2 | Add a mode per named path. |
| Pack `dominion-all` / `dominion-core` / reserved Gorn / mission-only; empty pool stays empty; `authorizedDeployment` is a real operation | Dominion-first gate 4; GUIDED §10; S18.6–S18.9 | Ambient core / Battleship / Gorn / Tactical Cube. Fallback spawn. |
| Staged campaign; weakness ≠ invasion; finite prep | Dominion-first gate 5; S18.10–S18.12 | Jump to `fronts` because a faction was named. |
| Compartmented covert knowledge; ordinary captains ≠ pact | Dominion-first gate 6; S18.13 | `runtimeFaction === 'cardassian'` inherits the invasion plan. |
| EW + boarding preserved; tractor ≠ board | Dominion-first gate 7; #33–#39 | Board a catalog row. Flip `tractorIsBoarding`. |
| `scope: 'dominion-first'`; `rosterPlayable` false; `rareCommanders` false | S18.18 | Amend those fields to “ship the roster.” |
| Phase 1 identity; Breen–Dominion not friendly | Phase 1; `applyPhase1RelationContract` | Restore `breen`↔`dominion` friendly because the row is named. |
| Reman **53** via `meetPackPurchaseDecision` | PR #18 / #28 | Unlock 53 from a Romulan or Reman culture row. |
| Standing tiers; money ≠ standing | #58 / #59 | Credits buy Military because the faction is named. |
| Away-team XP `named_mix` | #65 / #66 | Reopen XP while “touching factions.” |
| Effective `alertsActive` | #63 / #64 | Revert the snapshot to raw `playerSecurity`. |
| Two ROE modes; `protect` → `record_only` | Phase 2; S6.13 | `protect-all` as an Independent path. |
| `*_LOCKED_FROM_REMASTERED === false` | #44–#66 | Flip any remastered-lock true, including the new roster flag. |

### Process locks (not a change to gates 1–8)

- **Proposal first.** Do not implement the catalog from this text until Tenth scopes S31 after a brief Pass.
- **Blind bake-off.** Implement against bake-off `main` (`10540aa` after #66), **not** remastered. From `docs/phase10-roster/` + landed helpers only. Do **not** crib `Artemis2028/BM1-remastered-work`. Do **not** `git am`.
- **#33–#66 stay locked.** Dominion-first hard gates stay locked. S18.18 stays unamended.
- **Subscribe, do not fork.** Read doctrine profile ids and pack faction/region facts. Do not implement a second incident ledger, a second standing religion, a second catalog wire, or a second Dominion campaign.
- **No invented discovery % or invasion odds as locked constants.**
- **No Pass claimed** in `docs/BAKEOFF-STATUS.md` from this PR.
- **No `src/` edits on this PR.**

### Scoring note

Referee / One / Number Four score the **eight hard gates** **before** any engine PR. Number 2 scores gates **1 (identity), 2, and 3**. Number Three probes **only after** a later S31 slice. **No Referee Pass is claimed by this docs PR.**

## 3. Coverage catalog (gates 1 and 8)

**Lane owner (wording):** Number Four on rows; Number 2 on knowledge caps and fire forbids.

Names can change. The **classification** cannot: a row this section marks `named` must not ship as a silent omission, and a row marked `stub` must not become ambient traffic or a new polity. Every row shares these hard fields:

```js
{
  grantsFire: false,
  engagement_authorized: undefined, // must remain absent
  firingSolution: false,
  mapRevealed: false,
  rewritesPlayerFaction: false,
  pactInherit: false,               // faction key ≠ scoped agreement roster
  knowledgeCap: 'none',             // wider_dominion; per observer, not per faction
  magnitudesLocked: false
}
```

`knowledgeCap: 'none'` means the catalog does not raise rumor / evidence / contact. A later inject may still use the **landed** Dominion-first writer for a **named observer**. The catalog must not fan that write out to every ship of the runtime faction.

### 3.1 Named coverage

These profiles already exist as **active** doctrine and already have a non-empty legal pack pool that is not reserved-gorn and not mission-only. Naming them records Dominion-campaign **coverage** (objectives pointer + knowledge cap). It does not add a start card and does not change pack regions.

| Profile id | Runtime key | Pack fact at `10540aa` (subscribe) | Objectives pointer (doctrine / plan §12) | Must not |
| --- | --- | --- | --- | --- |
| `neutral` | `neutral` | 38 `general` + 1 `independent-endgame` | Trade, refuge, private security; stay independent or choose a patron. Shared `neutral` ≠ alliance. | Collapse Lysian / New Swiss / Delpin into one empire. Retune independent-endgame purchase. |
| `ferengi` | `ferengi` | 3 `general` | Contracts, brokerage; merchants ≠ pirates. | Gift a lock for selling a rumor. |
| `vulcan` | `vulcan` | 8 `general` | Armed restraint, rescue, diplomacy, defense. Doctrine denies a Vulcan `raider` role. | Disarm the start. Add raider. |
| `romulan` | `romulan` | 10 `general` + 1 `secret-remus` | Frontier, intelligence, selective disclosure. | Unlock Reman **53** from the row. `secret-remus` stays `meetPackPurchaseDecision`. |
| `cardassian` | `cardassian` | 5 `general` | Reconstruction, corridors, leverage. | Ordinary captains inherit `dominion_cardassian_pact`. |
| `terran` | `terran` | 58 `general` + 2 `secret-paso` | Imperial war, infrastructure, civilian survival. | Mint a `rebel` key (see stub note). Retune `secret-paso` / Excalibur vendor. |
| `klingon` | `klingon` | 10 `general` | Campaigns, raids, regroup. Honor is not a fire inject. | Battlefield prestige becomes a second standing religion. |
| `tholian` | `tholian` | 5 `general` | Industry, restricted space. Exposure ≠ automatic coalition. | Construction visuals reopen. |
| `breen` | `breen` | 3 `general` | Guard assets; ordinary captains stay commercial. | Restore Breen–Dominion friendly. Auto-brief the pact. |
| `bajoran` | `bajoran` | 1 `general` | Communities, autonomy, wormhole **approaches**. | Say “Dominica” on an unearned observer. |
| `andorian` | `andorian` | 3 `general` | Yards and commercial independence. | A customer becomes a mutual-defense ally. |
| `delpin` | `delpin` | 3 `general` | Science, evade, report what was found. | Naming the path makes them a combat ally. |
| `sona` | `sona` | 3 `general` | Local defense; outside the war until a **local** interest. | Auto-join a front because the row exists. |
| `tarellian` | `tarellian` | 1 `general` | Exploration and delivered reports. | Discovery sharing without travel / a report. |
| `promelli` | `promelli` | 2 `general` | Biotech research. Doctrine: no weapon effects and no Dominion secrets from the profile. | Invent a weapon or a pact. |
| `hirogen` | `hirogen` | 3 `general` | Finite hunt of a specific quarry. | Investigate every overdue ship. Join a coalition. |
| `suliban` | `suliban` | 3 `general` | Compartmented cells. | Automatic Dominion allegiance or full-plan knowledge. |

Seventeen named profiles. Existing player starts inside this set stay the landed `factionDefs` cards. Breen, Bajoran, Andorian, Delpin, Son'a, Tarellian, Promelli, Hirogen, and Suliban are **named in the catalog** and **not** new start buttons (open question Q1 default).

**Terran label note (not a row):** `factionDefs.terran.label` is already `'Terran Rebel'` while `faction` is `terran`. Plan §12 asks to clarify that label. This brief clarifies it as a **start-card string**. `separatePolity: false`. Do not add runtime key `rebel`. Do not rename the card in this docs PR.

### 3.2 Deferred stubs

Listed so silence is not a ship. A stub is **not** playable content and **not** a spawn bypass.

| Id | Kind | Why it is a stub | Live rule that stays |
| --- | --- | --- | --- |
| `gorn` | profile + pack faction | Doctrine status **dormant**. Pack `reserved-gorn` (3 hulls). | `spawnPool(..., 'gorn')` stays `[]`. No name-pool polity. Survivor event **out**. |
| `borg` | profile + pack faction | 1 `mission-only` + 1 `borg-core`. Assimilation is a separate implementation in doctrine. | Not ambient. Mission spawn still needs `role === 'mission'` **and** a live `authorizedDeployment`. Not a default anti-Dominion ally. |
| `pirate` | profile only | Doctrine profile `pirate` is active. Pack has **no** `faction: "pirate"` hulls. `getBaseSystemFaction` can still **say** pirate from a place name. | Do not mint a pirate polity from that string. Do not rewrite `factionRelations` in this slice. |
| rare commanders | content candidate | Plan §12 / Dominion-first §16. | `rareCommanders: false` on **both** books. No memory table. No gifted FS from “they remember you.” |
| `lysian`, `flashian`, `swiss`, `dyson`, `opusab`, `teposian`, `reman`, `trill`, `blender_remnant` | cultures (9) | Culture changes interest and tone. It is not a runtime empire. | Culture cannot grant fire. Reman culture ≠ hull **53**. Blender remnant culture does not reveal Gamma. New Swiss stays under `neutral`, not a second empire. |

### 3.3 Subscribe-dominion-first (pointer only)

| Profile id | Runtime key | Catalog value | Must not |
| --- | --- | --- | --- |
| `dominion_remnant` | `dominion` | `subscribe-dominion-first` | Fork stage, hide, or pack gates. Blender stays playable and isolated. |
| `dominion_central` | `dominion` | `subscribe-dominion-first` | Auto-reveal Dominica. Share the map because the runtime key matches. |

Pack faction `dominion` (2 `dominion-all` blender routine + 4 `dominion-core`) is **one** catalog pointer at those two profiles, not a third polity. Core hulls **48, 65, 216, 238** stay illegal at Blender. Battleship **65** stays non-ambient. `authorizedDeployment` stays a live operation id on `dominionBook`.

### 3.4 Completeness set (fail if drifted)

At `10540aa` the catalog must account for:

- **22** doctrine profile ids (21 runtime keys; two Dominion profiles share `dominion`; Gorn dormant).
- **20** pack faction keys: `andorian`, `bajoran`, `borg`, `breen`, `cardassian`, `delpin`, `dominion`, `ferengi`, `gorn`, `hirogen`, `klingon`, `neutral`, `promelli`, `romulan`, `sona`, `suliban`, `tarellian`, `terran`, `tholian`, `vulcan`.
- **9** culture ids.
- **0** invented keys (no `rebel`, no `thaleron`, no remastered-only polity).

A later pack import that adds a faction key **fails closed** until this catalog names it `named` or `stub`. Do not auto-classify unknowns as `named`.

### 3.5 Player-facing lines (only if a later readout ships)

- `Path catalogued. Not a firing solution, not a map, not engagement authorized.`
- `Gorn reserved. Borg mission-only. Rare commanders not in this slice.`
- `Dominion campaign stays on the Dominion book. This list does not reveal the Gamma region.`

If the UI says “weapons free because your faction is on the roster,” the family is not ready.

## 4. Acceptance exercises (S31)

Keep all existing Phase 1 / S4–S30 / doctrine / catalog / Phase 10 gates green. **S18 stays Phase 10 Dominion-first, including S18.18 unamended.** **S30 stays away-team XP.** Add S31 fixtures only **after** engine. IDs are a sketch; do not promise a final count. **This docs PR does not add S31 to the probe.**

| Case | Required exercise and result |
| --- | --- |
| **S31.1** Completeness | Snapshot lists 22 profile ids, 20 pack faction keys, 9 cultures. No extra keys. `neutral` is not an alliance flag. |
| **S31.2** Named ≠ fire / ≠ identity | Every named row: `grantsFire === false`, `firingSolution === false`, `engagement_authorized` absent, `rewritesPlayerFaction === false`, `knowledgeCap === 'none'`. `playerFaction` / `playerSide` / Reman 53 unchanged after catalog load. |
| **S31.3** Stubs do not spawn | Gorn pool empty. Borg not in Earth ambient. `rareCommanders === false`. Culture row cannot grant fire. No new pirate hulls from the catalog. |
| **S31.4** Dominion book untouched | `dominionBook.scope === 'dominion-first'`. `rosterPlayable.independent/ferengi/vulcan === false`. Stage / discovery / agreements not copied onto the roster book. Weakness still does not authorize. |
| **S31.5** Paths ≠ ROE | `ROE_MODES` length unchanged. `mayAutoEngage` not flipped by a named row. `protect` still `record_only`. No merge/retain rewrite. |
| **S31.6** Discovery is not a roster unlock | Injecting a roster row does not set `mapRevealed`. A landed discovery write still lists systems only. Unearned observer still lacks Dominica labels. |
| **S31.7** Compartmentation | Breen and Cardassian named rows: `pactInherit === false`. Ordinary captain still does not know the pact. Phase 1 Breen–Dominion friendly still stripped. |
| **S31.8** Lock + magnitudes | `PHASE10_ROSTER_LOCKED_FROM_REMASTERED === false`. `discoveryOddsLocked === false`. `invasionOddsLocked === false`. No secret percent table. Sibling remastered-locks stay false. |
| **S31.9** Persistence | Roster book survives save, `systemStates` wipe, reload. Ambient `npc.id` reuse does not steal a row onto a newcomer. |
| **S31.10** Landed lanes | Replay S18 (S18.18 unchanged), doctrine, S30 (`tracked` / `named_mix`). Tractor not board. No dockClear / XP / alertsActive diff required for a probe-only slice. |
| **S31.11** Dock / no-clip | **N/A** unless a readout ships. If chrome: 1280×720, `clippedControls: []`, dock-clear. |

Each case may contain multiple assertions. Include startup smoke. Do not claim a Referee Pass from this list.

## 5. Non-goals

This roster brief will not:

- Reopen Dominion-first gates 1–7 or amend S18.18.
- Ship rare commanders, a Gorn survivor, Borg assimilation, or new player-start cards.
- Invent a `rebel` runtime faction or rename the Terran start card in engine.
- Restore a static Breen–Dominion alliance or brief every Cardassian because the path is named.
- Gift `firingSolution`, culture fire, or `engagement_authorized`.
- Rewrite Phase 2 ROE, `protect-all`, or merge / retain / reclaim.
- Retune combat, Flash prices, standing tiers, Reman unlock, or pack `regionAllows`.
- Reopen EW, boarding, utility, ledger, empty-armable, construction, HTML catalogs, economy, dockClear, hygiene, alertsActive, or away-team XP.
- Invent locked discovery percentages or invasion odds.
- Touch `Artemis2028/BM1-remastered-work` as an implementation source.
- Claim a Referee Pass in `docs/BAKEOFF-STATUS.md`.

## 6. Implementation sequence and handoff

1. **Brief Pass.** Referee / One score the **eight** hard gates. Number 2 scores identity on **1** and gates **2–3**. Number Four scores catalog shape on **1**, preservation plumbing on **4**, and gates **7–8**. Do not open an engine PR on this document alone.
2. **Tenth scopes S31** after Pass. Blind implement from `docs/phase10-roster/` against bake-off `main` after #66 (`10540aa`). Do not implement from remastered.
3. **Suggested order if scoped:** empty sibling book + lock flag false (S31.8) → completeness rows (S31.1) → fire/identity forbids (S31.2, S31.5–S31.7) → stubs and Dominion pointer (S31.3–S31.4) → persistence (S31.9) → replay S18 / doctrine / S30 (S31.10) → shots only if chrome (S31.11). **Do not** edit `dominionBook.rosterPlayable`. **Do not** ship debug-all deployments.
4. **Number Three** adds/runs S31 after engine. Keep Phase 1 / S4–S30 / `test:phase10` / `test:doctrine` green. Do not weaken S18 to make S31 pass.
5. Changelog / status Pass wait on Referee after review. This proposal PR may note that the roster brief is open; it must **not** write a Pass.

## 7. Open questions

Mark these clearly. They do **not** weaken the hard gates.

| ID | Question | Default if engine is scoped before an answer |
| --- | --- | --- |
| **Q1** | New player-start cards for named paths that are not in `factionDefs` today (Breen, Bajoran, Andorian, …)? | **No.** Catalog only. Existing nine starts stay. |
| **Q2** | Any named path with default knowledge cap above `none`? | **No.** Cap stays `none` until a landed per-observer inject. |
| **Q3** | Delete the pirate string in `getBaseSystemFaction`? | **Leave it.** Do not mint hulls. Spawn rewrite is out. |
| **Q4** | Rename the Terran Rebel start-card label? | **Keep the string.** `separatePolity: false`. |
| **Q5** | Activate Breen/Cardassian pacts because those paths are named? | **No.** `agreementsLive` default stays false. `pactInherit: false`. |
| **Q6** | Put coverage inside `dominionBook` and amend S18.18? | **No.** Sibling book. S18.18 unamended. |
| **Q7** | Retune `secret-remus` / `secret-paso` / `independent-endgame`? | **Out.** Standing + Reman + vendor rules stay. |
| **Q8** | Difficulty or economy curves per named path? | **Out.** Political identity stays the same at all difficulties. |

## 8. Lanes

| Who | Owns | Scores |
| --- | --- | --- |
| **Number 2** | Identity, paths ≠ ROE, no gifted fire: gates **2, 3**, identity half of **1**, compartmentation on stubs. | Named ≠ war; culture ≠ fire; Breen not re-friended; neutral ≠ alliance |
| **Number Four** | Catalog rows, pack subscribe, sibling book: gate **1** shape, gates **7–8**, plumbing that must not touch `dominionBook` flags. | 22 / 20 / 9 complete; Gorn empty; S18.18 still dominion-first |
| **Number Three** | Probe gate **after** engine (S31; S18 and S30 stay green) | Not this brief |
| **Referee / One** | This brief vs the **eight hard gates** in §2. **Do-not-open** check: #33–#66 including Dominion-first hard gates and away-team XP; no invented % / odds; **no Referee Pass claimed** from this PR | **Before** any engine PR |

## 9. Deferred work / later sketch

Still out after this catalog, even if S31 lands:

- Rare recurring commanders with bounded memory (stub only here).
- Gorn survivor authored exception.
- Borg assimilation mechanics.
- New player-start cards (Q1).
- Rescue / evacuation / salvage / smuggling / bounty content chains (plan §12 content candidates).
- Locked discovery percentages and invasion odds (only if Tenth later asks for a playtest ledger — still injectable, still not remastered).

This roster brief is ready to score when a reader can mark Pass/Fail on all eight gates: named coverage and pack completeness without collapsing Phase 1 identity; paths ≠ ROE injects and no protect-all or merge-retain rewrite; no gifted FS / culture / `engagement_authorized` from roster unlock or discovery; #33–#66 including Dominion-first hard gates and away-team XP stay closed; named outs hold; `PHASE10_ROSTER_LOCKED_FROM_REMASTERED === false`; a later thin catalog replays Phase 10 / doctrine and takes shots only if chrome changes; magnitudes, discovery %, and invasion odds stay injectable with no locked secret tables. Dominion-first `scope` stays `dominion-first`. **No Referee Pass is claimed.**

## Sources and precedence

- This brief’s engine checklist: `docs/phase10-roster/BM1-PHASE10-ROSTER-ENGINE-DEPENDENCIES.md`.
- Dominion-first locked: `docs/phase10/BM1-PHASE10-DOMINION-FIRST-PROPOSAL.md`; `docs/phase10/BM1-PHASE10-ENGINE-DEPENDENCIES.md`; PRs **#40 / #41**; S18.
- Plan §4 Phase 10 row; plan §12 faction table + Hidden Dominion campaign: `docs/revised-development-plan.md`.
- GUIDED §10: `docs/GUIDED-CONVERGENCE.md`.
- Doctrine profiles / cultures: `docs/doctrine/DESIGN-doctrine-v0.2.1.md`; `docs/doctrine/bm1-faction-doctrine.v0.2.1.json` (22 profiles, 9 cultures).
- Pack regions: `bm-ships/catalog.mjs` `regionAllows` / `spawnPool`; `bm-ships/ships.json` faction keys at `10540aa`.
- Phase 1 Breen strip: `src/phase1-authority.js` `applyPhase1RelationContract`; `src/doctrine.js` `applyPhase1Relations`.
- Campaign book flags: `src/phase10-dominion-book.js` `PHASE10_ROSTER`, `rosterPlayable`, `rareCommanders`.
- Start cards: `src/main.js` `factionDefs` (nine starts; Terran label `Terran Rebel`).
- Soft-residual analog: `docs/alerts-active/`; `docs/away-team-xp/`; PRs **#63–#66**.
- Remastered faction / invasion tables: **not a patch source**. Blind bake-off.
- Bake-off process: `docs/BAKEOFF-STATUS.md` (this PR may note the roster brief is open; no Pass claimed; #33–#66 remain locked).

Settled Phase 1 identity, the seven Dominion-first gates, and these eight roster gates take precedence over older handoff text that treated the full roster as permission to rewrite ROE, reveal Gamma, restore a Breen alliance, or crib a remastered discovery table.
