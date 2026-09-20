# BM1 broader economy / difficulty knobs

**Status:** proposal for adjustable economy / difficulty **tuning**; no engine changes made by this document.  
**Repository:** `Artemis2028/BM1-bakeoff`  
**Planning baseline:** `739e0c1` on `main` (20 September 2026), after HTML weapon / station review catalogs S25 pages (PR #55).  
**Referee context:** Phase 4 engine §6 **Pass** on `7f926df`. Phase 8 finite markets / anti-farm / conquest costs are **engine-landed** (PR #31) with **no Referee Pass claimed**. Phase 9–9.4 EW (PRs #33 / #35 / #37 / #42 / #43 / #44 / #45), boarding (PRs #38 / #39), Phase 10 Dominion-first (PRs #40 / #41), flags / passes (PRs #46 / #47), the weapon / device source ledger (PRs #48 / #49), empty-but-armable (PRs #50 / #51), station construction visuals (PRs #52 / #53), and HTML review catalogs (brief PR #54 / S25 pages PR #55) are the **locked** baselines — **Keep #33, #35, #37, #38, #39, #40, #41, #42, #43, #44, #45, #46, #47, #48, #49, #50, #51, #52, #53, #54, and #55 locked.** This is an **economy / difficulty-knob brief only**, not a Phase 8 reopen, not a standing-tier rewrite, not a combat retune, not an HTML-catalog reopen, and **not** a claim that those lanes already had a Referee Pass on the status MD. This brief does **not** claim a new Referee Pass.  
**Companion:** `docs/economy-difficulty/BM1-ECONOMY-DIFFICULTY-ENGINE-DEPENDENCIES.md` (hooks, risks, later S26 subscribe-module sketch).  
**Scoped by:** Tenth Mountain Trooper, 2026-09-20 — proposal + deps first; room scores the hard gates **before** any engine. Room-locked hard gates (tuning ≠ ownership; political identity invariant; no invented repair / unrest / prestige curves; exploits closed or listed first; money ≠ standing ≠ Reman; never gift fire; do-not-reopen + named outs + blind) are **in** this one scoreable brief.

Phases 1–10 and Phase 9–9.4 already landed, including **catalog wire + standing tiers** (PR #28), **Phase 8 finite markets / anti-farm / conquest costs** (PR #31; `src/phase8-markets.js`, `PHASE8_MAGNITUDES` injectable), side-lane `repairCapable` / Reman unlock / unrest mint, and HTML review catalogs that inspect defs without becoming a shop (PRs #54 / #55). Convergence §8 and plan §10 / §13 / §16.2 row 8 named the remaining **broader economy / difficulty** gap: difficulty is **adjustable tuning**; political identity stays the same at every setting; known free-growth exploits are closed or listed **before** any retune.

This is **one** docs-tuning brief: publish a **scoreable contract** for later difficulty knobs that scale **already-injectable pacing numbers**, preserve Phase 1 identity and Phase 8 / catalog / Reman locks, refuse invented repair prices / unrest thresholds / prestige curves, and never gift `firingSolution`, culture fire, or `engagement_authorized` from a difficulty setting. It is not a remastered `git am`, not a Phase 8 reopen, not a combat retune, not dockClear polish, not an HTML-catalog reopen, and not a Thaleron facility invent.

**This PR ships proposal + engine-deps only.** A later thin **subscribe module** that selects a named profile of Phase 8 injectables is the natural S26 deliverable. This brief does **not** ship that module and does **not** lock a balance table.

## 1. The result we want

A later writer can expose **Easy / Standard / Hard** (names can change) as **pacing overlays** on landed Phase 8 magnitudes — more slack or more pressure — without changing who owns a world, who is an ally, who may fire, or how Reman / standing / embargoes work. Easy is a slower tax, not a friendlier galaxy. Hard is a tighter cap, not a new political order.

**Exit condition (GUIDED-CONVERGENCE §8 / plan §10 / §13 / §16.2 row 8):** a difficulty knob changes **pacing numbers, not ownership rules**; political identity is the same at all difficulties; known buy/sell-prestige and jump-farm exploits are **closed or listed** before any retune; this docs pass invents **no** repair prices, unrest thresholds, or prestige curves.

**Proposed first-release decisions:**

| Question | Proposed answer |
| --- | --- |
| What is the first playable slice? | **Docs-only** scoreable contract under `docs/economy-difficulty/`. **This PR does not ship engine.** A later thin subscribe module (S26), **if** Tenth scopes it after Pass, lives as `src/economy-difficulty.js` (name can change) and **selects** a named overlay for **already-injectable** `PHASE8_MAGNITUDES` / jump-farm caps / holding-grace / fleet-upkeep without rewriting ownership, standing tiers, Reman, or Phase 8 gates. |
| Is a thin subscribe module the natural later deliverable? | **Yes.** Analog: Phase 9.4 magnitudes ledger (`src/phase94-magnitudes.js`) — a central inject, not a new religion. S26 is **tuning**, not a second market book. Combat / HTML catalogs / repair-arm predicates stay **untouched**. |
| What may a knob change? | **Pacing families already injectable on Phase 8:** stock/demand slack, fill/worsen deltas, salvage/transport **caps**, holding income / grace jumps, fleet upkeep / readiness drop, reconstruction spend, repair **premium multiplier** (not a price table). Starting-funds slack is allowed **only** as a later start-kit overlay, not as standing or Reman. |
| What must stay the same at Easy? | Phase 1 identity (flag-share ≠ control; concessions stay foreign; independents are not one alliance; Breen–Dominion have no static friendship). Phase 8 anti-farm. Money ≠ standing ≠ Reman. Embargo / license / seller_rule still refuse. |
| May this brief invent repair prices, unrest thresholds, or prestige curves? | **No.** Side-lane already forbade invented balance numbers. Phase 8 already forbade locked repair / unrest / prestige / garrison **numbers**. Shape is locked; constants stay **TBD / injectable**. |
| Are buy/sell prestige and jump farming still open? | **No — already closed on Phase 8 (PR #31).** Cite `shopStandingDelta` / Trusted cap 15 / reversal writes 0; `boundTravelSalvage` / `boundTransportLatinum` / `jumpMustNotReprintInfinity`. A later S26 **must not reopen** them on Easy. Any **new** free-growth leak found during S26 is **listed** before that retune ships. |
| May a difficulty setting gift `firingSolution`, culture fire, or `engagement_authorized`? | **No.** A pacing overlay is not a lock, a war, or a ceasefire. |
| May we reopen EW #33–#45, boarding #38/#39, Phase 10 #40/#41, flags #46/#47, ledger #48/#49, empty-armable #50/#51, construction #52/#53, or HTML catalogs #54/#55? | **No.** HTML §9 / #54 / #55 **stay-locked**. |
| DockClear polish, HTML catalog reopen, Thaleron facility invent, combat weapon retune, Flash price locks, remastered crib / `git am`? | **Out.** |
| May we `git am` remastered patches or lock remastered constants? | **No.** `ECONOMY_DIFFICULTY_LOCKED_FROM_REMASTERED === false` (name can change). |
| Is this a Referee Pass? | **No.** Referee / One / Number 2 / Number Four score the hard gates **before** any engine. Number Three probes only after a later S26 slice. |

These are recommendations for this difficulty package, not new decisions attributed to the user. Locked bake-off constraints take precedence over older flavor that treated Easy as “everyone is friendly,” treated Hard as “independents collapse into one enemy,” or treated difficulty as permission to reopen Phase 8 farms.

Cite GUIDED-CONVERGENCE §8 and plan §10 / §13 / §16.2 row 8 as the planning sources this brief **reconciles**, not as a second spec:

| Planning source | This brief |
| --- | --- |
| GUIDED §8: difficulty is **adjustable tuning** | Gate 1. |
| GUIDED §8: political identity stays the same at all difficulties; Easy must not collapse Phase 1 | Gate 2. |
| GUIDED §8: do not invent repair prices, unrest thresholds, or prestige curves in this docs pass | Gate 3. |
| GUIDED §8 acceptance: a knob changes pacing numbers, not ownership rules | Gate 1. |
| GUIDED §8 acceptance: known free-growth exploits closed or listed before retune | Gate 4. Cite Phase 8 PR #31. |
| Plan §10: finite markets, embargoes, fleet costs, conquest obligations; remove exploits before tuning prices | Gates 1, 4, 5. Subscribe to Phase 8; do not reinvent. |
| Plan §13: trade/reputation reversal and jump farming — fix reproducible free-growth loops before economic tuning | Gate 4. Already landed; do not reopen. |
| Plan §16.2 row 8: adjustable tuning; preserve political identity; no invented unrest / repair / prestige curves | Gates 1–3. |
| Plan §3 Phase 1: flag-share ≠ control; concessions stay foreign; independents ≠ alliance; Breen–Dominion no static friendship | Gate 2. |
| Phase 8 Q10: difficulty knobs **out** of first Phase 8 slice | This brief **is** that later package. It does **not** reopen Phase 8 gates. |
| GUIDED §9 / HTML #54 / #55 | **Stay locked.** Gate 7. |

## 2. Locked constraints (do not reopen)

The bake-off room locked these before this brief. Implementation and probes must treat **gates 1–8** as **hard gates**. Referee / One score this brief against those **eight** **before** any engine PR. Number Three probes only after a later S26 slice. EW / boarding / Phase 10 / flags / ledger / empty-armable / construction / HTML-catalog gates stay **closed**; they are restated only as **gate 7** (preserve / do-not-open), not as a reopen. This docs PR **does not** claim a Referee Pass.

### Hard gate 1 — Difficulty is adjustable tuning, not ownership

> A difficulty knob changes **pacing numbers**, not ownership rules. Easy / Standard / Hard (names can change) may overlay **injectable** Phase 8 magnitudes. They must **not** rewrite `isSystemControlled`, flown-flag access, claim/occupy legality, concession holders, catalog region gates, or who is a political side. A later slice that makes Easy “you control every same-flag world” **fails** even if the latinum feels kinder.

Lane owner (wording): **Number Four** on the overlay; **Number 2** on “pacing ≠ ownership.”

`PHASE8_MAGNITUDES` is already injectable (`resolveMagnitudes`). First S26 **selects a profile** that feeds that inject. It does not grow a second `marketBook` and does not fork claim / plant / independence mint.

### Hard gate 2 — Political identity stays the same at all difficulties

> **Political identity stays the same at all difficulties.** Easy must **not** collapse Phase 1: flag-share ≠ control; concessions stay foreign; independents are not one alliance; Breen–Dominion have no static friendship. Hard must **not** invent a blanket war or merge independents into one enemy. Custom polity IDs stay intact. Unknown origin stays unknown. Arrival protection stays personal.

Lane owner (wording): **Number 2**.

Plan §3 and doctrine already locked these. Difficulty is not a Phase 1 rewrite. A fixture that starts Easy with `breen` friendly-to-`dominion`, or that treats `neutral` as a pact because the player picked Easy, **fails**.

### Hard gate 3 — Do not invent repair / unrest / prestige numbers here

> Do **not** invent repair prices, unrest thresholds, or prestige curves in this docs pass. Side-lane already forbade invented balance numbers. Phase 8 already locked **shape** (repair premium / refuse without supply; optional named unrest writer; shop standing cap at Trusted 15) and left **constants TBD / injectable**. This brief may **name the families** a later overlay may scale. It must not publish a locked price table, an unrest-N table, or a prestige-earn schedule and call those “the difficulty numbers.”

Lane owner (wording): **Referee / One** on honesty; **Number Four** on “no new locked constants.”

Example multipliers in §4 are **recommendations / TBD**, the same way Phase 8 §8 / `PHASE8_MAGNITUDES` comments are playtest defaults, not certification. Copying them into non-overridable constants **fails** this gate.

### Hard gate 4 — Exploits closed or listed before any retune; do not reopen Phase 8

> Known free-growth exploits (**buy/sell prestige**, **jump farming**) are **closed or listed** before any retune. Phase 8 already **closed** them: shop reversal writes **0** standing; ordinary shop trade **caps at Trusted (15)**; salvage / transport latinum is **capped**; a jump must **not** reprint stock, escorts, or free repair. Cite PR #31 / `src/phase8-markets.js`. Do **not** reopen Phase 8 gates 1–6. Easy must **not** turn farms back on as “forgiveness.” If a writer finds a **new** leak during S26, it is **listed** (and closed or explicitly deferred) **before** that retune ships.

Lane owner (wording): **Number Four**.

This is GUIDED §8 acceptance 2 and plan §13. Tuning prices or caps while a shop ping-pong still prints prestige **fails**, even on Easy.

### Hard gate 5 — Money ≠ standing ≠ Reman; independent ≠ alliance

> **Money ≠ standing ≠ Reman flag.** Independent trade is **not** one alliance and **not** universal immunity. Preserve Phase 8 / catalog wire / Reman locks. Credits-rich Easy still cannot skip a standing tier or buy hull **53**. Hard must not collapse `funds` / `faction-standing` / `access-locked` into one “too poor” string. `neutral` standing stays commercial trust.

Lane owner (wording): **Number 2**.

Catalog wire (`evaluateWiredPurchase`, `PURCHASE_TIER_STANDING`, home **20**) and `meetPackPurchaseDecision` stay the meeting points. Difficulty must **cite** them, not invent a second Reman path or a “Easy unlocks Military.”

### Hard gate 6 — Never gift fire from a difficulty setting

> Choosing, changing, or injecting a difficulty setting must **never** gift `firingSolution`, culture fire, or `engagement_authorized`. Difficulty is not a weapons-free token, not a Phase 3 ceasefire, not a boarding warrant, and not a Dominion discovery write. Pursuit, permission to engage, and the per-weapon firing gate stay the landed three-step. Two-mode ROE stays two-mode.

Lane owner (wording): **Number 2**.

Same doctrine lean as Phase 8 wartime exceptions, Phase 9 fire gates, Phase 10 stories, flags credentials, the ledger, empty-armable, construction visuals, and HTML catalogs. If Easy “relaxes combat,” it may only scale **economy pacing** named in §4 — not `mayAutoEngage`.

### Hard gate 7 — Do not reopen landed lanes

> Do **not** reopen EW #33 / #35 / #37 / #42 / #43 / #44 / #45 (matrix read-only; ghosts book-only; no report wipe; soft numbers ≠ new fire rules; `MAGNITUDES_LOCKED_FROM_REMASTERED === false`). Do **not** reopen boarding #38 / #39 (`tractorIsBoarding()` stays false; capture XOR scuttle; XP `not_tracked_yet`). Do **not** reopen Phase 10 #40 / #41 (stories stay knowledge layers). Do **not** reopen flags / passes #46 / #47 (`utilityBook` stays credentials; Thaleron pass **unverified — not shipped**). Do **not** reopen weapon ledger #48 / #49 (Phase 9 matrix read-only; Flash prices source not locks; three disruptor identities; Bajoran Sail / Warp Core deferred). Do **not** reopen empty-armable #50 / #51 (three slots; empty stays empty; unarmed cannot fire). Do **not** reopen construction visuals #52 / #53 (scaffolds / workbees / **blue** beams mean being built; repair arms stay PR #18; `CONSTRUCTION_LOCKED_FROM_REMASTERED === false`). Do **not** reopen HTML catalogs #54 / #55 (GUIDED §9 stay-locked; Flash is evidence; inspect ≠ shop; `HTML_CATALOG_LOCKED_FROM_REMASTERED === false`). Do **not** reopen Phase 8 #31 gates (finite clamps; price ≠ ban; anti-farm; conquest costs; subscribe-only Phase 5).

Lane owner (wording): **Referee / One**.

### Hard gate 8 — Named outs + blind bake-off

> Do **not** open dockClear polish, HTML catalog reopen, Thaleron **facility** invent (place, quest, pin, or pass), combat weapon retune, or live Flash price locks. Do **not** `git am` remastered patches. Do **not** crib `BM1-remastered-work` engine or DESIGN as the difficulty source. `ECONOMY_DIFFICULTY_LOCKED_FROM_REMASTERED === false`. Implement later from bake-off `docs/` + landed Phase 8 injectables only.

Lane owner (wording): **Referee / One**.

### Soft gate 9 — Suites stay green (after a later slice)

> **Soft:** existing suites stay green (S4–S25 / catalog / doctrine / boarding / Phase 10 / Phase 8 / Phase 9.4 / utility / weapon-ledger / empty-armable / construction / html-catalogs / side-lane). Screenshot / no-clip is **N/A** on this docs PR. A later S26 engine may attach a settings-strip screenshot if a named control ships; dockClear polish stays **out**.

Lane owner (wording): **Number Four** (process); **Number Three** scores suite-green **after** a later slice that touches runtime — not this brief.

### Also from the room (score with the gates)

| Plan / room want | How this brief locks it |
| --- | --- |
| Difficulty is adjustable tuning; pacing ≠ ownership | Gate 1. |
| Political identity unchanged at Easy / Hard | Gate 2. |
| No invented repair / unrest / prestige curves in this docs pass | Gate 3. |
| Buy/sell prestige + jump farm closed or listed before retune; Phase 8 stays closed | Gate 4. |
| Money ≠ standing ≠ Reman; independent ≠ alliance | Gate 5. |
| Never gift FS / culture / `engagement_authorized` from a difficulty setting | Gate 6. |
| Do not reopen EW / boarding / Phase 10 / flags / ledger / empty-armable / construction / HTML #54–#55 / Phase 8 | Gate 7. |
| Named outs + blind; `ECONOMY_DIFFICULTY_LOCKED_FROM_REMASTERED === false` | Gate 8. |
| Suites green; no Referee Pass from this PR | Soft gate 9. Scoring note below. |

### Must not break (cite landed work)

Score as **preservation**. A later difficulty Pass that regresses them is a Fail. **#33, #35, #37, #38, #39, #40, #41, #42, #43, #44, #45, #46, #47, #48, #49, #50, #51, #52, #53, #54, and #55 stay locked.**

| Locked rule | Cite | This brief / later slice must not |
| --- | --- | --- |
| Flag-share ≠ control; flown flag ≠ `isSystemControlled` | Phase 1; plan §3 | Easy grants system control from a shared flag. |
| Foreign concessions stay foreign | Phase 1; side-lane independence | Easy commandeers concession defense or retitles them. |
| Independents are not one alliance; `neutral` is commercial trust | Phase 1; `SHIP-ECONOMY-REVIEW.md`; Phase 8 gate 3 | Easy treats all independents as one pact. Hard merges them into one enemy. |
| Breen–Dominion have no static friendship | Phase 1; doctrine; Phase 10 gate 6 | Easy (or Hard) writes a blanket alliance. |
| Finite stock/demand; no restock on load / day / jump alone | Phase 8 gate 1; S13.1–S13.3 | Easy reprints cap stock every jump. |
| Price ≠ ban; four restriction kinds | Phase 8 gate 2; S13.4–S13.5 | Easy lets a high bid lift an embargo. |
| Shop standing cap Trusted 15; reversal writes 0 | Phase 8 gate 4; S13.9 | Easy re-enables buy/sell prestige. |
| Jump-farm latinum / stock / repair / garrison bounded | Phase 8 gate 4; S13.10 | Easy removes caps “because it is Easy.” |
| Holdings are responsibilities | Phase 8 gate 5; S13.11–S13.13 | Easy makes conquest free income with no obligation record. |
| Money ≠ standing ≠ Reman; `meetPackPurchaseDecision` only Reman meeting | PR #28; Phase 8 gates 3 / 6; S11 / S13.6 | Easy latinum buys hull 53 or skips Military. |
| `PURCHASE_TIER_STANDING` 0 / 15 / 30 / 50 / 75 / 100; home **20** | Catalog wire; GUIDED §6 | Retune the table “as difficulty.” |
| `repairCapable` predicate; types 86 / 87 never repair | Side-lane PR #18 | Invent a repair-price table. Mark defense platforms repair-capable. |
| Unrest mint is not a random flip; thresholds not invented here | Side-lane §6; Phase 8 Q7 | Publish an unrest-N table and lock it. |
| Ten-column matrix; Flash prices source not locks | Ledger #48/#49; HTML #54/#55 | Combat retune or Flash live lock from a difficulty profile. |
| Tractor ≠ boarding | #38 / #39 | Difficulty-as-capture. |
| HTML catalogs inspect defs; not a shop | #54 / #55; GUIDED §9 | Reopen pages to “show difficulty prices.” |
| `*_LOCKED_FROM_REMASTERED === false` | #44–#55 | Flip EW / utility / ledger / empty-armable / construction / HTML / new economy-difficulty lock flags true. |

### Process locks (not a change to gates 1–8)

- **Proposal first.** Do not implement an engine module from this text until Tenth scopes S26 after a brief Pass.
- **Blind bake-off.** Implement against bake-off `main` (`739e0c1` after #55), **not** remastered. From `docs/` + landed Phase 8 injectables only. Do **not** crib `Artemis2028/BM1-remastered-work`.
- **No invented locked constants.** Overlay *shape* and exploit *forbids* are locked. Example multipliers in §4 are recommendations.
- **#33 / #35 / #37 / #38 / #39 / #40 / #41 / #42 / #43 / #44 / #45 / #46 / #47 / #48 / #49 / #50 / #51 / #52 / #53 / #54 / #55 stay locked.** Phase 8 PR #31 gates stay locked.
- **Subscribe, do not fork.** A later module feeds `resolveMagnitudes` (or the same inject path). It does not become a second market book or a second Reman meeting.
- **No Pass claimed** in `docs/BAKEOFF-STATUS.md` from this PR.

### Scoring note

Referee / One / Number 2 / Number Four score the **eight hard gates** **before** any engine PR. Number Three probes **only after** a later S26 slice. **No Referee Pass is claimed by this docs PR.** Room scores the brief before any engine.

## 3. What a difficulty knob is (gates 1–2)

**Lane owner (wording):** Number Four on the overlay; **Number 2** on identity invariance.

| Term | Meaning in this brief |
| --- | --- |
| Difficulty knob | A **named profile** (Easy / Standard / Hard, names can change) that selects **pacing overlays** for already-injectable Phase 8 magnitudes. Not a political mode. Not a second ROE. |
| Pacing number | A magnitude Phase 8 already treats as injectable: caps, deltas, grace jumps, upkeep, premiums, income bounds. |
| Ownership rule | Who controls a system, who holds a concession, who is a side, who may buy hull 53, who is embargoed, who may fire. **Out of the knob.** |
| Easy | More slack inside **the same rules**: slower upkeep, looser (still finite) stock, kinder grace, still-capped jump flavor. **Same** embargoes, Reman lock, independents, Breen–Dominion, concessions. |
| Standard | Landed Phase 8 playtest defaults (`PHASE8_MAGNITUDES` as injectable defaults — **not** certified balance). |
| Hard | Tighter caps / faster upkeep / shorter grace inside **the same rules**. Still recoverable. Still not an invented prestige curve. |
| Identity invariance | The Phase 1 / doctrine facts in the table below hold on **every** profile, including after save/load and after changing the knob mid-run (if a later slice allows a change). |

### 3.1 Identity invariance (must hold on Easy and Hard)

| Fact | Easy must not | Hard must not |
| --- | --- | --- |
| Sharing a flag grants access, not control | Grant `isSystemControlled` from flag-share | Strip access that Phase 1 already grants from a legal flag |
| Foreign concessions retain owners | Gift concession command to the player | Seize them as a difficulty tax without a landed transfer rule |
| Independents are distinct; shared `neutral` ≠ alliance | Collapse independents into one Easy pact | Collapse them into one Hard enemy net |
| Custom polity IDs / unknown origin | Silently map to `neutral` | Silently map to a major empire |
| Breen and Dominion have no static alliance | Write friendship both ways | Write hostility as a static Phase 1 fact |
| Arrival protection is personal | Delete hostile fleets “to be nice” | Erase orders or rewrite ownership |
| Two-mode ROE | Inject `engagement_authorized` | Collapse `return-fire` into `defend` as “Hard” |

Changing the knob later, if allowed, **recomputes pacing** and leaves identity / tokens / close-once shortages / Reman unlock **untouched**.

## 4. What may be scaled later (gates 1, 3)

**Lane owner (wording):** Number Four. Constants remain **TBD / injectable**.

First S26 **subscribes** to `PHASE8_MAGNITUDES` / `resolveMagnitudes`. It does not replace `src/phase8-markets.js` and does not retune `PURCHASE_TIER_STANDING`.

### 4.1 Allowed families (already injectable)

| Family | Landed hook | Easy may (shape) | Hard may (shape) | Must not |
| --- | --- | --- | --- | --- |
| Stock / demand slack | `stockCap`, `demandCap`, `fillDelta`, `worsenDelta`, `floor` | Wider caps / gentler worsen | Tighter caps / sharper worsen | Remove clamps; restock on load / day / jump |
| Jump-farm **caps** | `salvageLatinumCap`, `transportLatinumCap` | Higher cap (still a cap) | Lower cap | Unbounded flavor income |
| Holding income / grace | `holdingIncomeWhenMet`, `holdingIncomeCap`, `holdingGraceJumps` | Longer grace / lower income pressure | Shorter grace / lower income cap | Charter-only free tax farm; unwinnable wipe |
| Fleet upkeep / readiness | `fleetUpkeepPerParked`, `readinessDropPerJump` | Slower drain | Faster drain | Supersede Phase 7 `hold_outside` |
| Reconstruction spend | `reconstructionSpend` | Lower spend | Higher spend | Invent a full repair-price table |
| Repair **premium** (not a price list) | `repairPremiumWithoutSupply` | Smaller premium | Larger premium | Rewrite `repairCapable`; invent latinum-per-percent as a locked curve |
| Market tick drift | `tickDrift`, `overdueDemandTick` | Toward authored equilibrium, still clamped | Same | Reprint a closed Phase 5 shortage |
| Starting-funds slack | No dedicated hook yet | Optional later start-kit overlay | Optional later tighter start | Standing-tier rewrite; Reman gift; home 20 rewrite |

Exact multipliers stay **TBD**. A later writer may ship **named overlays** whose numbers are injectable and overridable. Publishing them as certified balance **fails** gate 3.

### 4.2 Forbidden invented tables (this docs pass and first S26)

| Invented table | Why forbidden |
| --- | --- |
| Repair latinum-per-percent / duration / animation-rate locks | Side-lane: difficulty knobs may come later; **do not invent** here. Physical gate stays `repairCapable`. |
| Unrest threshold / starve / N-jump-to-breakaway table | Side-lane §6 + Phase 8 Q7: optional named writer only; do not retune thresholds. |
| Prestige-earn curve / kill-standing rewrite | Economy review + Phase 8: shop cap 15; worthwhile trips tokenized; no parallel prestige ledger. |
| Flash weapon / station price locks | Ledger #48/#49; HTML #54/#55. Source, not live locks. |
| Combat damage / cooldown / range overlay | Named out. Not this package. |

### 4.3 Example overlays (recommendations only — not locked)

These numbers are **illustrative**, the same class as Phase 8 playtest defaults. First S26 may replace them. Tests assert **direction + invariants** (Easy slack ≥ Standard slack; Hard pressure ≥ Standard pressure; farms still closed; identity unchanged), **not** these literals.

| Injectable | Easy (example) | Standard (landed default) | Hard (example) |
| --- | --- | --- | --- |
| `holdingGraceJumps` | 2 | 1 | 0 |
| `fleetUpkeepPerParked` | 1 (same or lower) | 1 | 2 |
| `salvageLatinumCap` | 60 | 40 | 20 |
| `repairPremiumWithoutSupply` | 1 | 2 | 3 |

A test that hard-fails because Easy is 2 instead of 3 **fails this brief**, not the engine. A test that hard-fails because Easy standing rose from buy/sell **passes this brief**.

## 5. Exploits first (gate 4)

**Lane owner (wording):** Number Four.

Plan §10 / §13: remove reproducible transaction / reputation exploits **before** tuning prices. GUIDED §8: close or list them before retune.

### 5.1 Already closed on Phase 8 — cite; do not reopen

| Exploit | Landed close | Easy must still |
| --- | --- | --- |
| Buy then sell (or reverse) prints standing | `shopStandingDelta`: reversal **0**; shop writes cap at **Trusted 15** | Keep 0 / cap 15 |
| Shop ping-pong to Military / Excalibur | Same + catalog tiers untouched | Keep tiers |
| Jump reprints stock to cap | `tickMarketBook` refuses `restockToCap`; `jumpMustNotReprintInfinity` | Keep clamps |
| Jump / travel flavor unbounded latinum | `boundTravelSalvage` / `boundTransportLatinum` | Keep a cap (may be higher) |
| Jump reprints free escorts / garrison navy | Phase 8 gate 4 / 5; no `allowsRoutineGenerator` farm | Keep |
| Load / cancel / `state.day` restock | `restockOnLoadForbidden`; clock = completed strategic jump only | Keep |
| Hail trade standing | Phase 8: latinum only | Keep no standing |
| Wartime black market sells Reman 53 | `wartimeExceptionSellsHull` false | Keep |

Do **not** reopen Phase 8 gates 1–6 to “make Easy nicer.” Slack lives in **caps and grace**, not in deleted forbids.

### 5.2 List-before-retune rule for anything still open

If S26 work discovers a **new** free-growth loop (for example a start-kit that can be re-applied, a difficulty change that refills stock, or a dock service that ignores the jump-farm book), the writer **lists** it in the S26 changelog / probe notes and **closes or explicitly defers** it **before** shipping that retune. Silent “we will patch farms later” **fails** gate 4.

This brief does **not** claim Phase 8 certified every possible farm — it claims the **named** ones are closed and the **rule** for new ones is list-then-close.

## 6. Identity already landed — cite, do not reinvent (gate 5)

**Lane owner (wording):** Number 2.

| Already live | Difficulty uses it as |
| --- | --- |
| `PURCHASE_TIER_STANDING` + home **20** | Hull trust gates. Do **not** retune the table as Easy/Hard. |
| `evaluateWiredPurchase` / `catalogPurchaseContext` | Money / standing / region / vendor reasons stay distinct. |
| `meetPackPurchaseDecision` | Only Reman **53**. Soft leftover stays the meeting point. |
| Independent trade standing in `neutral` | Commercial trust. Not a side, not a pact, not immunity — on every profile. |
| Phase 8 four restriction kinds | Price still last. Easy premium ≠ embargo lift. |
| Phase 4 `applyStandingOnce` | Difficulty must not add a second kill write. |
| Phase 5 fill / worsen / close-once | Subscribe only. Difficulty must not reprint a closed shortage. |

Credits alone still cannot buy Military / Strategic / Excalibur / Concord. Standing alone still cannot buy Reman. Remus is still a vendor **note**. Easy does not change that sentence.

## 7. Acceptance exercises (S26 sketch)

Keep Phase 1 / S4–S25 / doctrine / catalog / boarding / Phase 10 / Phase 8 / Phase 9.4 / utility / weapon-ledger / empty-armable / construction / html-catalogs / side-lane green. **S13 stays Phase 8.** **S25 stays HTML catalogs.** Add **S26** only **after** Tenth scopes a later thin subscribe module. IDs are a sketch; do not promise a final count. **This docs PR does not add S26 to the probe and does not add engine.**

Number Three owns the probe gate **after** a later slice, not this brief.

| Case | Required exercise and result (later S26 only) |
| --- | --- |
| **S26.1** Knob is pacing, not ownership | Inject Easy then Hard. `isSystemControlled` / concession holder / `playerFaction` / custom polity id unchanged. Flag-share still ≠ control. |
| **S26.2** Phase 1 identity on Easy | Easy fixture: independents still distinct (`neutral` not a pact); concession stays foreign; Breen–Dominion friendship **false** both ways; arrival protection does not delete a hostile fleet. |
| **S26.3** No invented locked curves | Snapshot exposes overlay injectables. Repair **price table** absent. Unrest **threshold table** absent. Prestige **earn curve** absent. `repairCapable` predicate unchanged; types 86 / 87 never repair. |
| **S26.4** Farms stay closed on Easy | Easy: buy then sell → standing does not rise; shop cap still 15. Several safe jumps → stock not at cap for free; salvage/transport still bounded; no free garrison reprint. |
| **S26.5** Money ≠ standing ≠ Reman on every profile | Easy credits-rich / standing-poor: Military still `faction-standing`. Standing-rich / no Reman: hull **53** still `access-locked`. Hard does not collapse reasons. Independent market can still embargo. |
| **S26.6** Difficulty does not gift fire | After set/inject Easy or Hard: no `firingSolution`; no `engagement_authorized`; no culture fire; two-mode ROE unchanged; `tractorIsBoarding() === false`. |
| **S26.7** Landed lanes preserved | Replay S13 / S14–S25 / S7 / S11. Diff does **not** reopen EW / boarding / Phase 10 / flags / ledger / empty-armable / construction / HTML #54–#55 / Phase 8 gates. No dockClear / combat-retune / Flash-lock / Thaleron-facility / `git am` work. |
| **S26.8** Blind lock false | `ECONOMY_DIFFICULTY_LOCKED_FROM_REMASTERED === false`. Overlay numbers injectable / overridable. No remastered crib. |

Do not claim a Referee Pass from this list.

## 8. Non-goals

This brief will not:

- Implement engine code, ship a settings control, or attach UI screenshots.
- Reopen Phase 8 finite-market / anti-farm / conquest gates, or reprint stock on Easy.
- Retune `PURCHASE_TIER_STANDING` or new-character 20.
- Invent a second Reman hull, a credits-only Reman, or Remus-as-sole-key.
- Invent repair prices, unrest thresholds, or prestige curves.
- Collapse independents into one alliance, or restore a static Breen–Dominion friendship.
- Gift system control from flag-share, or commandeer foreign concessions.
- Gift `firingSolution`, culture fire, or `engagement_authorized`.
- Reopen EW PRs #33 / #35 / #37 / #42 / #43 / #44 / #45, boarding #38 / #39, Phase 10 #40 / #41, flags #46 / #47, ledger #48 / #49, empty-armable #50 / #51, construction #52 / #53, or HTML catalogs #54 / #55.
- Redo repair arms (PR #18) or construction-site language (PR #53).
- Reopen GUIDED §9 HTML pages (inspect / show-both / Flash-as-evidence).
- Open dockClear polish.
- Invent Thaleron Test Facility (place, quest, pin, or pass).
- Retune combat weapons or treat any Flash number as a live price lock.
- `git am` remastered patches, or treat remastered DESIGN as engine source.
- Claim a Referee Pass in `docs/BAKEOFF-STATUS.md`.

## 9. Open questions

Mark these clearly. They do **not** weaken the hard gates.

| ID | Question | Default if a later S26 slice is scoped before an answer |
| --- | --- | --- |
| Q1 | Profile names and count (Easy / Standard / Hard vs a single slider)? | **Three named profiles.** A slider is allowed if it only interpolates **allowed families** in §4.1 and still fails identity / farm probes at the Easy end. |
| Q2 | Exact overlay magnitudes? | **TBD / injectable.** S26 asserts direction + invariants, not literals. |
| Q3 | May the player change difficulty mid-run? | **Allowed** if change recomputes pacing only (gate 1) and does not restock, refill jump-farm budgets, rewrite standing, or mint Reman. Default: change at **new run** first. |
| Q4 | Starting-funds overlay in first S26? | **Optional.** If present, funds only — not standing, not Reman, not a shop prestige write. |
| Q5 | Settings / new-game UI chrome? | **Optional thin label.** DockClear polish **out**. A probe inject is enough for first S26. |
| Q6 | Does Hard shorten Phase 5 overdue clocks? | **No.** Phase 5 outcomes stay subscribe-only. Difficulty does not move `deadlineAt`. |
| Q7 | Does Easy silence Phase 4 FLASH / standing once? | **No.** Tokens stay. |
| Q8 | HTML catalog “difficulty price” column? | **Out.** #54 / #55 stay locked. Flash prices stay source labels. |
| Q9 | Split engine PRs (overlay vs UI)? | Tenth decides after Pass. Gates stay separable. Overlay-without-UI is enough. |

## 10. Implementation sequence and handoff

1. **Brief Pass.** Referee / One score the **eight hard gates**. Number 2 scores gates **2, 5, 6** (identity; money ≠ standing ≠ Reman; no gifted fire). Number Four scores gates **1, 3, 4** (tuning overlay; no invented curves; farms closed / listed) and the engine half of **7**, plus soft gate **9** as process. Do not open an S26 PR on this document alone.
2. **Tenth scopes** a later thin subscribe module **or** leaves this as docs-only. Blind implement from `docs/economy-difficulty/` against bake-off `main` after #55 (`739e0c1`).
3. **Suggested order if scoped:** profile enum + remastered-lock false (S26.8) → overlay feeds `resolveMagnitudes` without touching ownership (S26.1) → Easy identity fixture (S26.2) → no invented tables (S26.3) → Easy farm replay (S26.4) → purchase-reason replay (S26.5) → no fire gift (S26.6) → preservation replay (S26.7). **Do not** reopen Phase 8. **Do not** reopen #33–#55.
4. **Number Three** adds/runs S26 after the later slice. Keep S4–S25 / S13 green. Do not weaken S13 to make Easy pass.
5. Changelog / status Pass wait on Referee after review. This proposal PR may note that the brief is open; it must **not** write a Pass.

## 11. Lanes

| Who | Owns | Scores |
| --- | --- | --- |
| **Number 2** | Doctrine: gates **2, 5, 6** — identity invariant; money ≠ standing ≠ Reman; difficulty is not FS / culture / `engagement_authorized` | Easy is not a friendlier galaxy |
| **Number Four** | Overlay / later module: gates **1, 3, 4** (pacing ≠ ownership; no invented curves; farms stay closed) plus later S26 inject. Must not fork `marketBook` or reopen Phase 8 / HTML catalogs | Knobs scale injectables; forbids remain |
| **Number Three** | Probe gate **after** a later S26 slice (S26; S4–S25 / S13 stay green) | Not this brief |
| **Referee / One** | This brief vs the **eight hard gates** in §2. Gates **7–8** (do-not-reopen + named outs + blind). **Do-not-open** check: no #33–#55 reopen; no Phase 8 reopen; no dockClear / HTML reopen / combat retune / Flash locks / Thaleron facility; no invented repair / unrest / prestige tables; no `git am`; **no Referee Pass claimed** from this PR | **Before** any engine PR |

This brief is ready to score when a reader can mark Pass/Fail on: knobs are pacing not ownership; Phase 1 identity holds on Easy; no invented repair / unrest / prestige curves; Phase 8 farms stay closed (or new leaks are listed); money ≠ standing ≠ Reman; difficulty never gifts fire; landed EW / boarding / Phase 10 / flags / ledger / empty-armable / construction / HTML #54–#55 not reopened; remastered-lock false and named outs held.

## Sources and precedence

- This brief’s later-slice checklist: `docs/economy-difficulty/BM1-ECONOMY-DIFFICULTY-ENGINE-DEPENDENCIES.md`.
- Planning: `docs/GUIDED-CONVERGENCE.md` §8; `docs/revised-development-plan.md` §3 / §10 / §13 / §16.2 row 8.
- Phase 8 (subscribe, do not reopen): `docs/phase8/`; PR **#31**; `src/phase8-markets.js`; S13.
- Catalog / standing (cite, do not retune): PR **#28**; `src/ship-catalog-wire.js`; `docs/SHIP-ECONOMY-REVIEW.md`; GUIDED §6–§7; S11.
- Reman meeting: `src/side-lane-repair-reman.js` (`meetPackPurchaseDecision`); side-lane brief; S7.8 / S11.2–S11.3.
- Side-lane repair / unrest (cite; no invented numbers): `docs/side-lane-repair-reman-independence/`; PRs **#18 / #19**.
- Phase 5 subscribe-only: `docs/phase5/`; PR **#21**.
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
- Bake-off process: `docs/BAKEOFF-STATUS.md` (this PR may note the economy-difficulty brief is open; **no Pass claimed**; #33–#55 remain locked).

Settled Phase 1–10 behavior, Phase 8 gates, PR #33 / #35 / #37 / #38 / #39 / #40 / #41 / #42 / #43 / #44 / #45 / #46 / #47 / #48 / #49 / #50 / #51 / #52 / #53 / #54 / #55, and these eight hard gates take precedence over older handoff text that treated Easy as collapsed politics, treated difficulty as a Phase 8 reopen, or invented repair / unrest / prestige tables in a docs pass.
