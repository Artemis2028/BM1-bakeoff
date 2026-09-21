# BM1 faction-wide standing / purchase tiers

**Status:** proposal for faction-wide standing / purchase **gates**; no engine changes made by this document.  
**Repository:** `Artemis2028/BM1-bakeoff`  
**Planning baseline:** `b73d960` on `main` (21 September 2026), after broader economy / difficulty knobs engine (PR #57).  
**Referee context:** Phase 4 engine §6 **Pass** on `7f926df`. Catalog wire + purchase helpers are **engine-landed** (PR #28) with **no Referee Pass claimed**. Reman `meetPackPurchaseDecision` is **engine-landed** (side-lane PR #18). Phase 8 finite markets / price≠ban / anti-farm are **engine-landed** (PR #31). Broader economy / difficulty knobs are **engine-landed** (brief PR #56 / engine PR #57) — **Keep #56 / #57 locked.** Phase 9–9.4 EW (PRs #33 / #35 / #37 / #42 / #43 / #44 / #45), boarding (PRs #38 / #39), Phase 10 Dominion-first (PRs #40 / #41), flags / passes (PRs #46 / #47), the weapon / device source ledger (PRs #48 / #49), empty-but-armable (PRs #50 / #51), station construction visuals (PRs #52 / #53), and HTML review catalogs (PRs #54 / #55) are the **locked** baselines — **Keep #33, #35, #37, #38, #39, #40, #41, #42, #43, #44, #45, #46, #47, #48, #49, #50, #51, #52, #53, #54, #55, #56, and #57 locked.** This is a **standing / purchase-tier brief only**, not a catalog-wire rewrite, not a Reman rewrite, not an economy-difficulty reopen, not a combat retune, and **not** a claim that those lanes already had a Referee Pass on the status MD. This brief does **not** claim a new Referee Pass.  
**Companion:** `docs/standing-tiers/BM1-STANDING-TIERS-ENGINE-DEPENDENCIES.md` (hooks, risks, later S27 subscribe-module sketch).  
**Scoped by:** Tenth Mountain Trooper, 2026-09-21 — proposal + deps first; room scores the hard gates **before** any engine. Room-locked hard gates (credits cannot buy Military / Strategic / Excalibur; new-game 20 / others Open 0; Independent / Concord = standing + vendor; price ≠ ban; single standing token; never gift fire; subscribe #28 / #18 / #56–#57 and do-not-reopen; named outs + blind) are **in** this one scoreable brief.

Phases 1–10 and Phase 9–9.4 already landed, including **catalog wire helpers** (PR #28: `PURCHASE_TIER_STANDING`, `HOME_FACTION_STANDING = 20`, `createStartingStandings`, `evaluateWiredPurchase`, live shop / escort / garrison consult), Reman `meetPackPurchaseDecision` (PR #18), Phase 8 finite markets / price≠ban / shop-standing cap at Trusted 15 (PR #31), and economy / difficulty pacing overlays that **must not** retune the standing table (PRs #56 / #57). Convergence §6 and plan §16.2 row 6 named the remaining **faction-wide standing / purchase tiers** gap as a **scoreable package**: money is not trust; first-pass thresholds are source, not certified; Independent / Concord access is standing + vendor, not latinum.

**Actual landed state (do not repeat stale planning copy):** GUIDED §7 may still say “catalog wire still later.” Bake-off already has the wire. `CATALOG_WIRED === true`. Full-roster-v2 is live (`loadShipCatalog()`, 174 records / 172 active / 38 aliases). Pack `getPurchaseDecision` already refuses `faction-standing` when current standing is below the required gate, and missing standing **reads as 0**. Live `getShipPurchaseStatus` / fleet / escort already call `evaluateWiredPurchase`. New game already calls `createStartingStandings`. This brief **subscribes** to that wire and to Reman / economy-difficulty. It does **not** reopen them and does **not** invent a second purchase religion.

This is **one** docs-standing brief: publish a **scoreable contract** for later standing-tier work that asserts the GUIDED §6 acceptance gates, keeps Phase 4 / 5’s single standing token, refuses a high-price ban bypass, and never gifts `firingSolution`, culture fire, or `engagement_authorized` from a standing tier. It is not a remastered `git am`, not a wire rewrite, not an economy-difficulty reopen, not dockClear polish, not a Thaleron facility invent, and not a combat retune.

**This PR ships proposal + engine-deps only.** A later thin **subscribe module** that exposes the named gates as a probeable S27 surface is the natural later deliverable. This brief does **not** ship that module and does **not** certify the first-pass numbers as final economy.

## 1. The result we want

A later writer can treat **Open → Excalibur / Concord** as **live purchase gates** on the **already-landed** catalog wire: credits-rich captains still cannot buy Military / Strategic / Excalibur hulls; a new character starts at **20** with the **selected** faction and **Open 0** with the others; Independent / Concord access stays standing + vendor. Trust is not latinum. Shared `neutral` is still not an alliance.

**Exit condition (GUIDED-CONVERGENCE §6 / plan §16.2 row 6):** credits alone cannot buy a Military / Strategic / Excalibur hull; new-game selected faction starts at 20 and other factions start at Open 0; Independent / Concord access is a standing + vendor rule, not “I have latinum.”

**Proposed first-release decisions:**

| Question | Proposed answer |
| --- | --- |
| What is the first playable slice? | **Docs-only** scoreable contract under `docs/standing-tiers/`. **This PR does not ship engine.** A later thin subscribe module (S27), **if** Tenth scopes it after Pass, lives as `src/standing-tiers.js` (name can change) and **subscribes** to landed `evaluateWiredPurchase` / `PURCHASE_TIER_STANDING` / `createStartingStandings` / `meetPackPurchaseDecision` without rewriting the wire, Reman, Phase 8 forbids, or economy-difficulty overlays. |
| Is a thin subscribe module the natural later deliverable? | **Yes.** Analog: economy-difficulty (`src/economy-difficulty.js`) — a named surface over landed helpers, not a second shop. S27 is **gates**, not a prestige-earn curve and not a catalog rewire. Combat / HTML catalogs / repair-arm predicates stay **untouched**. |
| What are the first-pass thresholds? | **Source, not certified:** Open 0, Trusted 15, Respected 30, Military 50, Strategic 75, Excalibur / Concord 100. New character **20** with the **selected** starting faction. Already exported as `PURCHASE_TIER_STANDING` + `HOME_FACTION_STANDING`. Do **not** silently replace them with kill-standing deltas. |
| What does this brief declare for other factions? | **Open 0.** GUIDED §6 allowed “unless a later brief says otherwise.” **This brief says Open 0.** Missing / unset keys **read as 0** at the purchase gate (already true in pack `getPurchaseDecision`). Writing explicit `0` keys is optional. Do **not** start others at 20 or 100. |
| Where does Independent trade standing live? | The existing `neutral` entry, in **neutral / independent** purchase. Commercial trust. **Not** a political side and **not** an alliance (Phase 1). |
| May a high price bypass a ban? | **No.** Plan §10 / Phase 8: embargo / license / seller_rule still refuse. Price is last. |
| May one destruction write standing twice? | **No.** Keep Phase 4 / 5 `applyStandingOnce`. Capture is not a kill-standing cascade. |
| May a standing tier gift `firingSolution`, culture fire, or `engagement_authorized`? | **No.** Trust is not a lock, a war, or a ceasefire. |
| May we reopen catalog wire #28, Reman #18, or economy #56 / #57? | **No. Subscribe, do not reopen.** GUIDED §8 / #56 / #57 **stay-locked.** |
| May we reopen EW #33–#45, boarding #38/#39, Phase 10 #40/#41, flags #46/#47, ledger #48/#49, empty-armable #50/#51, construction #52/#53, or HTML #54/#55? | **No.** |
| DockClear polish, Thaleron facility invent, combat retune, Flash price locks, unrest / prestige curves beyond the named thresholds? | **Out.** |
| May we `git am` remastered patches or lock remastered constants? | **No.** `STANDING_TIERS_LOCKED_FROM_REMASTERED === false` (name can change). |
| Is this a Referee Pass? | **No.** Referee / One / Number 2 / Number Four score the hard gates **before** any engine. Number Three probes only after a later S27 slice. |

These are recommendations for this standing-tier package, not new decisions attributed to the user. Locked bake-off constraints take precedence over older flavor that treated latinum as trust, treated `neutral` as a pact, treated GUIDED §7 “wire later” as current, or treated difficulty as permission to retune the table.

Cite GUIDED-CONVERGENCE §6 and plan §16.2 row 6 as the planning sources this brief **reconciles**, not as a second spec:

| Planning source | This brief |
| --- | --- |
| GUIDED §6: money is not trust; credits cannot buy Military / Strategic / Excalibur | Gate 1. |
| GUIDED §6 first-pass table: Open 0 / Trusted 15 / Respected 30 / Military 50 / Strategic 75 / Excalibur-Concord 100; new character **20** | Gates 1–2. Source, not certified. |
| GUIDED §6: Independent trade standing in **neutral / independent** entry; shared `neutral` is not an alliance | Gate 3. |
| GUIDED §6 / plan §10: a high price does not bypass a ban | Gate 4. Subscribe Phase 8. |
| GUIDED §6: keep Phase 4 / 5 single standing token | Gate 5. |
| GUIDED §6 acceptance 1–3 | Gates 1–3. |
| GUIDED §7 header may still say “wire later” | **Stale planning sentence.** Actual: PR #28 landed. Gate 7. |
| Plan §16.2 row 6: missing as live gates / Agreed next | This brief **is** that scoreable package. Helpers already exist; S27 asserts them. |
| Plan §16.2 row 7 / GUIDED §7: catalog wire | **Landed** (PR #28). Subscribe; do not reopen. |
| Plan §16.2 row 8 / GUIDED §8: economy / difficulty | **Stay locked** (#56 / #57). Do not retune the table as Easy / Hard. |
| Phase 8 gates 2–3 / 6: price ≠ ban; money ≠ standing ≠ Reman | Gates 1, 3, 4. Cite; do not reopen. |
| Side-lane PR #18: `meetPackPurchaseDecision` | Reman only. Gate 7. |
| `docs/SHIP-ECONOMY-REVIEW.md`: faction-wide trust; Independent = `neutral` commercial score; shop trade caps at Trusted 15 | Gates 1–3. Cite; do not invent a prestige ledger. |

## 2. Locked constraints (do not reopen)

The bake-off room locked these before this brief. Implementation and probes must treat **gates 1–8** as **hard gates**. Referee / One score this brief against those **eight** **before** any engine PR. Number Three probes only after a later S27 slice. EW / boarding / Phase 10 / flags / ledger / empty-armable / construction / HTML-catalog / economy-difficulty gates stay **closed**; they are restated only as **gate 7** (preserve / do-not-open), not as a reopen. This docs PR **does not** claim a Referee Pass.

### Hard gate 1 — Credits cannot buy Military / Strategic / Excalibur

> **Money is not trust.** Credits alone cannot buy a **Military / Strategic / Excalibur** hull. A later slice that returns `allowed` for hull **33** (Military, Terran 50), a Strategic hull, or Excalibur **347** because `credits` are huge and standing is 0 / 20 **fails**, even if the price is paid. Refusal reason stays `faction-standing`, not `funds`. Do **not** collapse those reasons.

Lane owner (wording): **Number 2**.

Landed `evaluateWiredPurchase` + pack `getPurchaseDecision` already separate `funds` / `faction-standing` / `access-locked` / `region`. First S27 **asserts** that split on named hulls. It does not invent a second shop check. Reman **53** stays `access-locked` without the durable unlock even at Strategic 75 and infinite latinum.

### Hard gate 2 — New-game 20 / others Open 0

> New-game **selected** faction starts at **20**. Other factions start at the declared default: **Open 0**. **This brief declares Open 0.** Missing / unset keys **read as 0** at the purchase gate. Do **not** start the selected faction at 0 or 100. Do **not** start others at 20 or 100. Do **not** treat `createStartingStandings` leaving other keys unset as a Fail if the purchase gate still reads them as 0.

Lane owner (wording): **Number Four** on the start map; **Number 2** on “20 is home trust, not galaxy-wide trust.”

`HOME_FACTION_STANDING = 20` and `createStartingStandings` already write the home key. Pack `getPurchaseDecision` already uses `Number.isFinite(standings[faction]) ? standings[faction] : 0`. S27 may keep missing≡0 or write explicit 0 keys. Either satisfies this gate.

### Hard gate 3 — Independent / Concord is standing + vendor, not latinum

> Independent / Concord access is a **standing + vendor** rule, not “I have latinum.” Independent trade standing applies in **neutral / independent** entry. Shared `neutral` is **not** an alliance (Phase 1 / doctrine). Concord **60** requires **100** independent trade (`purchaseRequirements.factionStanding: 100`, faction `neutral`) **and** `independent-endgame` vendor (Free Swiss Reserve Exchange). Excalibur **347** requires **100** Terran standing **and** `paso-project-x` (X-Base / Project X). Latinum at Earth / Utopia does not sell either. `neutral` standing does not open an imperial embargo and does not gift system control.

Lane owner (wording): **Number 2**.

`resolvePackVendor` already maps Free Swiss Reserve Exchange → `independent-endgame` and X-Base → `paso-project-x`. S27 **cites** those notes. It does not make Remus the Concord key and does not treat 1,050,000 latinum as a Concord permit.

### Hard gate 4 — A high price does not bypass a ban

> A high price does **not** bypass a ban (plan §10 / Phase 8). Embargo / license / seller_rule still refuse. Premium is a cost, not a permit. Standing 100 does not lift an embargo. Concord vendor access does not grant imperial immunity. Cite PR #31 / `higherBidCannotPermit`. Do **not** reopen Phase 8 gates.

Lane owner (wording): **Number Four** on the restriction kinds; **Number 2** on “price is last.”

This is plan §10 “meaningful trade restrictions.” S27 **replays** the Phase 8 price≠ban fixture. It does not grow a fifth restriction kind and does not let Excalibur standing buy an embargoed wartime good.

### Hard gate 5 — Single standing token

> Keep the Phase 4 / 5 **single standing token**. One destruction writes standing **once**. A later standing-tier system must **not** add a second kill write, a shop-notice write, or a Concord-unlock write for the same destruction. Capture is not a Phase 4 kill-standing cascade. `applyStandingOnce` stays the meeting point. Shop trade still **caps at Trusted 15**; reversal writes **0** (Phase 8). Do **not** invent a parallel prestige ledger.

Lane owner (wording): **Number Four**.

S6.4 / S8.9 / boarding S17.7 already close double-charge. S27 **must not** open a second writer. Construction beams still must not write standing (PR #53).

### Hard gate 6 — Never gift fire from a standing tier

> Crossing, holding, or injecting a standing tier must **never** gift `firingSolution`, culture fire, or `engagement_authorized`. Military 50 is shop trust, not a weapons-free token. Excalibur 100 is not a ceasefire and not a Dominion discovery write. Pursuit, permission to engage, and the per-weapon firing gate stay the landed three-step. Two-mode ROE stays two-mode.

Lane owner (wording): **Number 2**.

Same doctrine lean as Phase 8 wartime exceptions, Phase 9 fire gates, Phase 10 stories, flags credentials, the ledger, empty-armable, construction visuals, HTML catalogs, and economy-difficulty knobs. If a later UI shows “Respected,” it may only label the shop gate — not `mayAutoEngage`.

### Hard gate 7 — Subscribe to landed wire / Reman / economy; do not reopen landed lanes

> **Subscribe, do not reopen.** Cite catalog wire **#28** (`evaluateWiredPurchase`, `PURCHASE_TIER_STANDING`, home **20**). Cite Reman `meetPackPurchaseDecision` (**#18**). Cite economy / difficulty **#56 / #57** — GUIDED §8 **stay-locked**; Easy / Hard must **not** retune this table. Do **not** reopen EW #33 / #35 / #37 / #42 / #43 / #44 / #45. Do **not** reopen boarding #38 / #39 (`tractorIsBoarding()` stays false). Do **not** reopen Phase 10 #40 / #41. Do **not** reopen flags / passes #46 / #47 (Thaleron pass **unverified — not shipped**). Do **not** reopen ledger #48 / #49. Do **not** reopen empty-armable #50 / #51. Do **not** reopen construction #52 / #53. Do **not** reopen HTML catalogs #54 / #55. Do **not** reopen Phase 8 #31 gates.

Lane owner (wording): **Referee / One**.

GUIDED §7 text that still says “wire later” is **planning drift**. Actual bake-off state is the PR #28 wire. A writer who “implements catalog wire from scratch” or who retunes `PURCHASE_TIER_STANDING` “as difficulty” **fails**.

### Hard gate 8 — Named outs + blind bake-off

> Do **not** open dockClear polish, invent a Thaleron **facility** (place, quest, pin, or pass), retune combat weapons, or treat any Flash number as a live price lock. Do **not** invent unrest / prestige **curves** beyond the **named** tier thresholds in §3. Do **not** `git am` remastered patches. Do **not** crib `BM1-remastered-work` engine or DESIGN as the standing source. `STANDING_TIERS_LOCKED_FROM_REMASTERED === false`. Implement later from bake-off `docs/` + landed wire / Reman / Phase 8 helpers only.

Lane owner (wording): **Referee / One**.

The named thresholds are a **first balance pass**. Publishing a kill-to-Excalibur earn schedule, an unrest-N table, or a repair-price table **fails** this gate even if the shop refusals are green.

### Soft gate 9 — Suites stay green (after a later slice)

> **Soft:** existing suites stay green (S4–S26 / catalog / doctrine / boarding / Phase 10 / Phase 8 / Phase 9.4 / utility / weapon-ledger / empty-armable / construction / html-catalogs / economy-difficulty / side-lane). Screenshot / no-clip is **N/A** on this docs PR. A later S27 engine may attach a thin shop-refusal string screenshot if a named label ships; dockClear polish stays **out**.

Lane owner (wording): **Number Four** (process); **Number Three** scores suite-green **after** a later slice that touches runtime — not this brief.

### Also from the room (score with the gates)

| Plan / room want | How this brief locks it |
| --- | --- |
| Credits cannot buy Military / Strategic / Excalibur | Gate 1. |
| New-game selected faction 20; others Open 0 | Gate 2. |
| Independent / Concord = standing + vendor; `neutral` ≠ alliance | Gate 3. |
| High price ≠ ban bypass | Gate 4. |
| Phase 4 / 5 single standing token | Gate 5. |
| Never gift FS / culture / `engagement_authorized` from a standing tier | Gate 6. |
| Subscribe #28 / #18 / #56–#57; do not reopen EW / boarding / Phase 10 / flags / ledger / empty-armable / construction / HTML / Phase 8 / economy | Gate 7. |
| Named outs + blind; `STANDING_TIERS_LOCKED_FROM_REMASTERED === false` | Gate 8. |
| Suites green; no Referee Pass from this PR | Soft gate 9. Scoring note below. |

### Must not break (cite landed work)

Score as **preservation**. A later standing-tier Pass that regresses them is a Fail. **#33, #35, #37, #38, #39, #40, #41, #42, #43, #44, #45, #46, #47, #48, #49, #50, #51, #52, #53, #54, #55, #56, and #57 stay locked.**

| Locked rule | Cite | This brief / later slice must not |
| --- | --- | --- |
| `evaluateWiredPurchase` / `catalogPurchaseContext` | PR #28; `src/ship-catalog-wire.js`; S11 | Fork a second purchase path. Treat GUIDED §7 “wire later” as current. |
| `PURCHASE_TIER_STANDING` 0 / 15 / 30 / 50 / 75 / 100; home **20** | PR #28; GUIDED §6 | Retune the table “as difficulty” or as certified economy. |
| `meetPackPurchaseDecision` only Reman **53** | PR #18; S7.8 / S11 | Credits or standing 100 buy hull 53. Remus as sole key. Second Reman id. |
| Shop standing cap Trusted 15; reversal writes 0 | Phase 8 PR #31; S13.9 | Re-enable buy/sell prestige to reach Military. |
| Price ≠ ban; four restriction kinds | Phase 8 gate 2; S13.4–S13.5 | Let Excalibur standing or a high bid lift an embargo. |
| Independents are not one alliance; `neutral` is commercial trust | Phase 1; `SHIP-ECONOMY-REVIEW.md`; Phase 8 gate 3 | Treat Concord access as a pact or as imperial immunity. |
| `applyStandingOnce`; S6.4 single write | Phase 4; Phase 5 S8.9 | Double-charge a kill, a report, and a shop notice. |
| Capture ≠ kill-standing cascade | Boarding #38 / #39 | Charge standing again on prize credit. |
| Difficulty is pacing, not ownership | #56 / #57; GUIDED §8 | Easy unlocks Military. Hard rewrites home 20. |
| Flag-share ≠ control | Phase 1 | Standing 100 grants `isSystemControlled`. |
| Ten-column matrix; Flash prices source not locks | Ledger #48/#49; HTML #54/#55 | Combat retune or Flash live lock from a standing label. |
| Tractor ≠ boarding | #38 / #39 | Standing-as-capture. |
| `*_LOCKED_FROM_REMASTERED === false` | #44–#57 | Flip EW / utility / ledger / empty-armable / construction / HTML / economy / new standing-tier lock flags true. |

### Process locks (not a change to gates 1–8)

- **Proposal first.** Do not implement an engine module from this text until Tenth scopes S27 after a brief Pass.
- **Blind bake-off.** Implement against bake-off `main` (`b73d960` after #57), **not** remastered. From `docs/` + landed wire / Reman / Phase 8 helpers only. Do **not** crib `Artemis2028/BM1-remastered-work`.
- **No invented prestige / unrest curves.** Named thresholds are source. Earn *shape* already landed (shop cap 15; attributed combat; no parallel prestige ledger). Do not publish a new earn table.
- **#33 / #35 / #37 / #38 / #39 / #40 / #41 / #42 / #43 / #44 / #45 / #46 / #47 / #48 / #49 / #50 / #51 / #52 / #53 / #54 / #55 / #56 / #57 stay locked.** Phase 8 PR #31 and catalog wire PR #28 stay locked.
- **Subscribe, do not fork.** A later module calls `evaluateWiredPurchase`. It does not become a second catalog or a second Reman meeting.
- **No Pass claimed** in `docs/BAKEOFF-STATUS.md` from this PR.

### Scoring note

Referee / One / Number 2 / Number Four score the **eight hard gates** **before** any engine PR. Number Three probes **only after** a later S27 slice. **No Referee Pass is claimed by this docs PR.** Room scores the brief before any engine.

## 3. Named first-pass thresholds (source, not certified)

**Lane owner (wording):** Referee / One on honesty; **Number Four** on “do not replace these with kill deltas.”

These numbers are a **first balance pass**, not certified economy. They already live on bake-off as `PURCHASE_TIER_STANDING` + `HOME_FACTION_STANDING`. Pack rows may also set explicit `purchaseRequirements.factionStanding` (explicit wins over the tier key). Concord **60** and Excalibur **347** already set explicit **100**.

| Tier | Threshold | Landed key / note |
| --- | --- | --- |
| Open | 0 | `open`. Anyone who may legally shop there. **This brief’s default for non-home factions.** |
| Trusted | 15 | `trusted`. Phase 8 shop-trade **cap** (`TRUSTED_SHOP_STANDING_CAP`). |
| Respected | 30 | `respected`. |
| Military | 50 | `military`. Credits cannot buy. Example: hull **33** (Terran, explicit 50). |
| Strategic | 75 | `strategic`. Reman Warbird pack row uses this tier **and** still needs the durable unlock. |
| Excalibur / Concord | 100 | `excalibur` / `concord` keys both 100. Pack already: Excalibur **347** world-prestige 100 + `paso-project-x`; Concord **60** independent capital + `independent-endgame`. |
| New character | **20** | `HOME_FACTION_STANDING`. Selected starting faction only. Not 0, not 100. |

Independent trade standing applies in **neutral / independent** entry. Shared `neutral` is still not an alliance.

Do **not** silently replace these with bake-off kill-standing deltas. Do **not** invent an unrest / prestige **curve** that climbs these rungs. Shop ping-pong still stops at Trusted 15.

Pack refuse when thresholds are missing is `standing-threshold-unconfigured` (GUIDED’s older “prestige-threshold-unconfigured” name is **stale wording** for the same fail). Full-roster-v2 rows already have explicit requirements or a `purchaseTier`; unconfigured is not an access fail on those rows.

## 4. What already exists — subscribe, do not reinvent

**Lane owner (wording):** Number Four.

| Already live | Standing-tiers uses it as |
| --- | --- |
| `PURCHASE_TIER_STANDING` + home **20** | The named gate table. Do **not** retune as Easy / Hard. |
| `createStartingStandings` | Home 20. Others missing ≡ Open 0 at the gate. |
| `evaluateWiredPurchase` / `catalogPurchaseContext` | Money / standing / region / vendor reasons stay distinct. `tierThresholds` already defaults to the table. |
| Live shop / escort / garrison | Already consult the wire. S27 must not bypass them with a credits-only check. |
| `meetPackPurchaseDecision` | Only Reman **53**. Soft leftover stays the meeting point. Remus is a vendor **note**. |
| Concord **60** / Excalibur **347** pack rows | Explicit 100 + vendor / region. Latinum is not enough. |
| Independent trade standing in `neutral` | Commercial trust. Not a side, not a pact, not immunity. |
| Phase 8 four restriction kinds | Price still last. Standing 100 ≠ embargo lift. |
| Phase 8 `shopStandingDelta` | Reversal 0; shop writes cap at Trusted 15. |
| Phase 4 `applyStandingOnce` | Standing-tiers must not add a second kill write. |
| Economy-difficulty overlay | Pacing only. **Stay locked.** Must not rewrite this table. |

Credits alone still cannot buy Military / Strategic / Excalibur / Concord. Standing alone still cannot buy Reman. Remus is still a vendor note. Easy does not change that sentence.

## 5. Acceptance exercises (S27 sketch)

Keep Phase 1 / S4–S26 / doctrine / catalog / boarding / Phase 10 / Phase 8 / Phase 9.4 / utility / weapon-ledger / empty-armable / construction / html-catalogs / economy-difficulty / side-lane green. **S11 stays catalog wire.** **S13 stays Phase 8.** **S26 stays economy-difficulty.** Add **S27** only **after** Tenth scopes a later thin subscribe module. IDs are a sketch; do not promise a final count. **This docs PR does not add S27 to the probe and does not add engine.**

Number Three owns the probe gate **after** a later slice, not this brief.

| Case | Required exercise and result (later S27 only) |
| --- | --- |
| **S27.1** Credits ≠ Military / Strategic / Excalibur | Credits `9e9`, standing 0 or home 20 only: hull **33** (Military) → `faction-standing`; a Strategic hull → `faction-standing`; Excalibur **347** → `faction-standing` (and still `region` / vendor-miss at a non-Paso yard). Reason is **not** `funds`. |
| **S27.2** New-game 20 / others Open 0 | `createStartingStandings('ferengi')` (or live new-game): `ferengi === 20`. Other factions missing or 0. Purchase of a Terran Military hull still refuses as `faction-standing` with `currentStanding` 0. Do **not** require every faction key to be written if missing≡0. |
| **S27.3** Independent / Concord = standing + vendor | Credits-rich / `neutral` 0 at Free Swiss: Concord **60** → `faction-standing`. `neutral` 100 at Utopia / Earth: Concord still not sold (`region` / vendor). `neutral` 100 + `independent-endgame`: standing gate passes; latinum still required separately. `neutral` is not a pact; imperial embargo still refuses. |
| **S27.4** Price ≠ ban | Replay Phase 8 S13.4 shape: embargo / license / seller_rule refuse at any price; standing 100 does not flip them to `allowed`. |
| **S27.5** Single standing token | Destroy once; standing writes **once**. Report / shop notice / Concord label add **no** second write. Capture token family does not charge kill-standing. `applyStandingOnce` still returns `already-charged` on repeat. |
| **S27.6** Standing does not gift fire | After inject Military / Strategic / Excalibur standing: no `firingSolution`; no `engagement_authorized`; no culture fire; two-mode ROE unchanged; `tractorIsBoarding() === false`. |
| **S27.7** Landed lanes preserved | Replay S11 / S13 / S26 / S7 / S14–S25. Diff does **not** reopen wire #28, Reman #18, economy #56/#57, EW / boarding / Phase 10 / flags / ledger / empty-armable / construction / HTML. No dockClear / combat-retune / Flash-lock / Thaleron-facility / unrest-curve / `git am` work. |
| **S27.8** Blind lock false | `STANDING_TIERS_LOCKED_FROM_REMASTERED === false`. Thresholds remain first-pass / overridable source, not remastered crib. No `git am`. |

Do not claim a Referee Pass from this list.

## 6. Non-goals

This brief will not:

- Implement engine code, ship a prestige HUD, or attach UI screenshots.
- Reopen catalog wire #28, rewrite `evaluateWiredPurchase`, or treat GUIDED §7 “wire later” as a new implementation job.
- Reopen Reman `meetPackPurchaseDecision` (#18), invent a second Reman hull, or make Remus the sole key.
- Reopen economy / difficulty #56 / #57 or retune `PURCHASE_TIER_STANDING` as Easy / Hard.
- Reopen Phase 8 finite-market / anti-farm / conquest gates, or raise the shop standing cap above Trusted 15.
- Invent unrest thresholds or prestige-earn curves beyond the named tier thresholds.
- Collapse independents into one alliance, or treat `neutral` as imperial immunity.
- Gift system control from standing or from flag-share.
- Gift `firingSolution`, culture fire, or `engagement_authorized`.
- Double-charge standing for one destruction.
- Reopen EW PRs #33 / #35 / #37 / #42 / #43 / #44 / #45, boarding #38 / #39, Phase 10 #40 / #41, flags #46 / #47, ledger #48 / #49, empty-armable #50 / #51, construction #52 / #53, or HTML catalogs #54 / #55.
- Redo repair arms (PR #18) or construction-site language (PR #53).
- Open dockClear polish.
- Invent Thaleron Test Facility (place, quest, pin, or pass).
- Retune combat weapons or treat any Flash number as a live price lock.
- `git am` remastered patches, or treat remastered DESIGN as engine source.
- Claim a Referee Pass in `docs/BAKEOFF-STATUS.md`.

## 7. Open questions

Mark these clearly. They do **not** weaken the hard gates.

| ID | Question | Default if a later S27 slice is scoped before an answer |
| --- | --- | --- |
| Q1 | Write explicit `0` keys for every known faction at new-game, or keep missing≡0? | **Missing ≡ Open 0** is enough. Explicit zeros allowed. Do not write 20 / 100 on non-home factions. |
| Q2 | Shop UI label for `neutral` (“independent trade standing”)? | **Optional thin label.** DockClear polish **out**. Probe reason `faction-standing` + `requiredFaction: 'neutral'` is enough for first S27. |
| Q3 | Exact list of Military / Strategic probe hulls besides 33 / 347 / 60? | **Any** pack row whose required standing is 50 / 75 / 100. Prefer 33 / a non-Reman Strategic / 347. Reman **53** stays the Reman fixture, not the Strategic-only fixture. |
| Q4 | May S27 change `PURCHASE_TIER_STANDING` literals? | **No** as certified locks. First-pass numbers stay the landed table. Inject / override allowed the same way Phase 8 magnitudes are injectable — **not** as Easy/Hard retune (#56/#57 stay locked). |
| Q5 | Split engine PRs (assert module vs UI label)? | Tenth decides after Pass. Gates stay separable. Assert-without-UI is enough. |
| Q6 | Does crossing Military silence Phase 4 FLASH? | **No.** Tokens stay. |
| Q7 | Does Concord 100 authorize Dominion core stock? | **No.** Phase 10 pack gates stay. |
| Q8 | Cargo-contract +5 / +2 from `SHIP-ECONOMY-REVIEW.md`? | **Out of first S27** unless Tenth scopes commerce. Shop cap 15 and kill-token rules stay. Do not invent the curve here. |

## 8. Implementation sequence and handoff

1. **Brief Pass.** Referee / One score the **eight hard gates**. Number 2 scores gates **1, 3, 6** (money ≠ trust; Independent / Concord; no gifted fire). Number Four scores gates **2, 4, 5** (start map; price ≠ ban; single token) and the engine half of **7**, plus soft gate **9** as process. Do not open an S27 PR on this document alone.
2. **Tenth scopes** a later thin subscribe module **or** leaves this as docs-only. Blind implement from `docs/standing-tiers/` against bake-off `main` after #57 (`b73d960`).
3. **Suggested order if scoped:** remastered-lock false (S27.8) → subscribe `evaluateWiredPurchase` without a second shop (S27.1) → start map 20 / Open 0 (S27.2) → Concord / Independent vendor (S27.3) → price≠ban replay (S27.4) → single token (S27.5) → no fire gift (S27.6) → preservation replay (S27.7). **Do not** reopen #28 / #18 / #56 / #57. **Do not** reopen #33–#55. **Do not** reopen Phase 8.
4. **Number Three** adds/runs S27 after the later slice. Keep S11 / S13 / S26 green. Do not weaken S11 to make a credits-only buy pass.
5. Changelog / status Pass wait on Referee after review. This proposal PR may note that the brief is open; it must **not** write a Pass.

## 9. Lanes

| Who | Owns | Scores |
| --- | --- | --- |
| **Number 2** | Doctrine: gates **1, 3, 6** — money ≠ trust; Independent / Concord ≠ latinum / ≠ alliance; standing is not FS / culture / `engagement_authorized` | Credits-rich still refused; `neutral` is not a pact |
| **Number Four** | Later module: gates **2, 4, 5** (start 20 / Open 0; price ≠ ban; single token) plus later S27 subscribe. Must not fork `evaluateWiredPurchase` or reopen #28 / #18 / #56 / #57 | Helpers stay the meeting point |
| **Number Three** | Probe gate **after** a later S27 slice (S27; S4–S26 / S11 / S13 stay green) | Not this brief |
| **Referee / One** | This brief vs the **eight hard gates** in §2. Gates **7–8** (subscribe + do-not-reopen + named outs + blind). **Do-not-open** check: no #28 / #18 / #33–#57 reopen; no dockClear / combat retune / Flash locks / Thaleron facility; no invented unrest / prestige curves; no `git am`; **no Referee Pass claimed** from this PR | **Before** any engine PR |

This brief is ready to score when a reader can mark Pass/Fail on: credits cannot buy Military / Strategic / Excalibur; new-game 20 / others Open 0; Independent / Concord is standing + vendor; price ≠ ban; single standing token; standing never gifts fire; landed wire / Reman / economy / EW / boarding / Phase 10 / flags / ledger / empty-armable / construction / HTML not reopened; remastered-lock false and named outs held.

## Sources and precedence

- This brief’s later-slice checklist: `docs/standing-tiers/BM1-STANDING-TIERS-ENGINE-DEPENDENCIES.md`.
- Planning: `docs/GUIDED-CONVERGENCE.md` §6 (reconcile) and §7 **landed-state note**; `docs/revised-development-plan.md` §10 / §16.2 row 6.
- Catalog wire (subscribe, do not reopen): PR **#28**; `src/ship-catalog-wire.js`; `bm-ships/catalog.mjs`; S11.
- Reman meeting: `src/side-lane-repair-reman.js` (`meetPackPurchaseDecision`); side-lane brief; PR **#18**; S7.8 / S11.
- Economy / difficulty (stay locked): `docs/economy-difficulty/`; PRs **#56 / #57**; GUIDED §8; S26.
- Phase 8 (subscribe, do not reopen): `docs/phase8/`; PR **#31**; `src/phase8-markets.js`; S13.
- Standing review copy: `docs/SHIP-ECONOMY-REVIEW.md` (faction-wide trust; Independent = `neutral`; shop cap 15; no parallel prestige ledger).
- Phase 4 token: `src/phase4-incidents.js` `applyStandingOnce`; S6.4.
- Phase 1 identity: plan §3; PR **#2**.
- HTML catalogs (stay locked): `docs/html-catalogs/`; PRs **#54 / #55**; GUIDED §9; S25.
- Construction visuals (stay locked): `docs/construction-visuals/`; PRs **#52 / #53**; S24.
- Empty-armable (do not reopen): `docs/empty-armable/`; PRs **#50 / #51**; S23.
- Flags/passes (do not ship Thaleron): `docs/flags-passes/`; PRs **#46 / #47**.
- Ledger / Flash-not-lock: `docs/weapon-ledger/`; PRs **#48 / #49**.
- EW locked: `docs/phase9/`; PRs **#33 / #35 / #37 / #42 / #43 / #44 / #45**; S14–S20.
- Phase 10 locked: `docs/phase10/`; PRs **#40 / #41**; S18.
- Boarding locked: `docs/boarding/`; PRs **#38 / #39**; S17.
- Remastered engine / DESIGN: **out of bounds.** Not a patch source. Not a constant lock.
- Bake-off process: `docs/BAKEOFF-STATUS.md` (this PR may note the standing-tiers brief is open; **no Pass claimed**; #33–#57 remain locked).

Settled Phase 1–10 behavior, catalog wire PR #28, Reman PR #18, Phase 8 PR #31, economy / difficulty #56 / #57, PR #33 / #35 / #37 / #38 / #39 / #40 / #41 / #42 / #43 / #44 / #45 / #46 / #47 / #48 / #49 / #50 / #51 / #52 / #53 / #54 / #55, and these eight hard gates take precedence over older handoff text that treated latinum as trust, treated GUIDED §7 “wire later” as current, treated `neutral` as a pact, or invented unrest / prestige curves in a docs pass.
