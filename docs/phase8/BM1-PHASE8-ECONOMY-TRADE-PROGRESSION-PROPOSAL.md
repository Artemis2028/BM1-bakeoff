# BM1 Phase 8 — Economy, trade permissions, and progression

**Status:** proposal for implementation; no engine changes made by this document.  
**Repository:** `Artemis2028/BM1-bakeoff`  
**Planning baseline:** `ca2645d` on `main` (13 September 2026), after catalog wire + standing tiers (PR #28) and Phase 7 fleet orders (PR #29).  
**Referee context:** Phase 4 engine §6 **Pass** on `7f926df`. Later slices (Phase 5–7, catalog wire, Phase 6.5) have **no Referee Pass claimed** on this bake-off status MD. This brief does **not** claim a new Referee Pass, does **not** reopen Phase 5 convoy outcomes, and does **not** reopen catalog wire / Reman meeting.  
**Companion:** `docs/phase8/BM1-PHASE8-ENGINE-DEPENDENCIES.md` (hooks, risks, probe plan).  
**Scoped by:** Tenth Mountain Trooper, 2026-09-13 — proposal first; no engine until Tenth scopes after a brief Pass.

Phases 1–7 already landed: political authority, two-mode ROE, holding zones, incident ledger / FLASH, persistent convoy/`asset_overdue`, sensors/cloak + power suites, and fleet hold-outside. The side-lane added `repairCapable` / Reman durable unlock and unrest / lounge+contract civilians. **Catalog wire and standing tiers are live** (`src/ship-catalog-wire.js`, S11): `PURCHASE_TIER_STANDING`, new-character home **20**, `evaluateWiredPurchase` + `meetPackPurchaseDecision`. Money ≠ standing ≠ Reman flag already on the hull-buy path.

This is **one** connected economy loop: compact finite markets that feel Phase 5 deliveries and losses, trade permissions that a price cannot pretend to lift, closed prestige/jump-farm loops, and holdings that cost to keep. It is not a second catalog, not a second Reman unlock, not a galaxy-wide commodity sim, and not permission to retune convoy overdue.

## 1. The result we want

Deliveries and losses move **finite** stock and demand. Exploits that print prestige, stock, income, reinforcements, or free repair stop working. Conquest snowballing is constrained because a holding is a **responsibility**.

**Exit condition (plan §4):** deliveries and losses affect finite markets; exploits and conquest snowballing are constrained.

**Proposed first-release decisions:**

| Question | Proposed answer |
| --- | --- |
| What is the first playable slice? | One compact market book (few goods, few locations), subscribed to existing Phase 5 shortage fill/worsen writes; four named restriction kinds; buy/sell prestige closed; jump-farm income/stock/repair/reinforcements bounded; one holding with garrison/supply/reconstruction/stabilization cost so occupation is not free income. |
| Where does the book live? | `state.marketBook` (name can change), saved like `incidentLedger` / `objectiveBoard` / `unrestIndependence`. **Never** inside `systemStates`. |
| Do Phase 5 convoy outcomes change? | **No.** Subscribe to the named fill / worsen / close-once writes already on the board. Do not retune clock, overdue, tokens, or attacker rules. |
| Does this rewire the catalog? | **No.** Hull identity, aliases, 172 active, Reman **53**, and `evaluateWiredPurchase` stay closed. |
| May latinum buy a banned good or a Reman hull? | **No.** Price is never a ban bypass. Credits never replace Reman unlock or standing tier. |
| Exact fleet / garrison / repair numbers? | **TBD / injectable.** Shape is locked; constants are not. |
| Player `openContracts` latinum pods? | **Separate.** Do not promote them to campaign convoys or to market-book stock. |
| Second civilian sim? | **No.** Reuse Phase 5 + side-lane lounge/contract. |

These are recommendations for this phase, not new decisions attributed to the user. Locked bake-off constraints take precedence over older flavor that treated markets as infinite price lists or holdings as loot.

## 2. Locked constraints (do not reopen)

The bake-off team locked these before this brief. Implementation and probes must treat them as **hard gates**. Referee / One score this brief against these **six** **before** any engine PR.

### Hard gate 1 — Finite stock and demand

> Markets keep **persistent, compact** stock and demand. Deliveries and losses have **bounded** effects. A second jump must not refill stock, reset demand, or reprint the same shortage for free.

Lane owner (wording): **Number Four**.

The book is small on purpose: a handful of goods and locations, not a galaxy ticker. Phase 5 fill eases demand / raises stock within a cap. Phase 5 loss or worsen tightens demand / lowers stock within a floor. Effects saturate; they do not run away.

### Hard gate 2 — Price is not a ban bypass

> Distinguish **embargoes**, **licenses**, **local seller rules**, and **price premiums**. A high price does **not** bypass every ban.

Lane owner (wording): **Number 2**.

Paying more never converts `refused` into `allowed` for an embargo, a missing license, or a seller who will not deal. A premium is a cost. It is not a permit. Earth–Klingon wartime restrictions use this taxonomy: imperial markets stay restricted; costly or risky exceptions belong only in **neutral / black-market** contexts that the UI can name.

### Hard gate 3 — Money ≠ standing ≠ Reman flag; independent ≠ alliance

> **Money ≠ standing ≠ Reman flag.** Independent trade is **not** one alliance and **not** universal immunity. Restrictions stay **local** and **explainable**.

Lane owner (wording): **Number 2**.

Catalog wire already separates `funds`, `faction-standing`, and Reman `access-locked` on hull purchase (PR #28; `meetPackPurchaseDecision`). Phase 8 must **cite** that meeting point, not invent a second one. Shared `neutral` / independent trade standing is a commercial trust score, not a political side (Phase 1; `docs/SHIP-ECONOMY-REVIEW.md`). An independent seller may still embargo, require a license, or refuse a wartime good. The player-facing line must say *which* rule blocked the deal.

### Hard gate 4 — No prestige loops; no jump-farm infinity

> A buy/sell reversal must **not** create prestige without useful activity. Repeated safe jumps must **not** yield unlimited income, fresh stock, reinforcements, or repair without costs or limits.

Lane owner (wording): **Number Four**.

Today `buyMarketGood` / `sellMarketGood` each silently `adjustFactionStanding(..., 1)`. That loop closes. Ordinary shop trade must not climb past **Trusted (15)** — the economy review already named this cap; Phase 8 makes it a gate. Jump completion, travel flavor, and dock services may not reprint infinite stock, latinum, escort hulls, or full repair/refuel as a no-cost farm. Exact repair / maintenance / escort-upkeep numbers are **TBD / injectable**; zero forever is a fail.

### Hard gate 5 — Conquest costs

> Garrison, supply, reconstruction, and stabilization make holdings **responsibilities** as well as income.

Lane owner (wording): **Number Four**.

A charter fee (`getSystemClaimCost` today) is not enough. After claim or occupation, the holding needs ongoing **garrison / supply / reconstruction / stabilization** (names can change). Neglect has a bounded, sayable cost — lost income, unrest pressure via *existing* named writers, or a stabilization clock — not a free tax farm and not an unwinnable wipe. Exact magnitudes are **TBD / injectable**.

### Hard gate 6 — Do not reopen Phase 5 or catalog wire; no second Reman/money bypass

> Do **not** reopen Phase 5 convoy outcomes or catalog wire. Do **not** invent a second Reman unlock or a money bypass around standing / Reman / embargo.

Lane owner (wording): **Number 2** (Reman / standing / catalog identity) and **Number Four** (Phase 5 subscribe-only). Referee / One score the “do not reopen” check.

Phase 5 close-once, overdue ≠ destroyed ≠ attacker, delivered knowledge, and the strategic clock stay closed. Catalog wire S11 (aliases, 172, Gorn empty, Reman unlock, home standing 20) stays closed. A wartime black market may sell **embargoed goods** at a premium and a risk; it must not sell hull **53** for latinum, mint a second Reman id, or treat standing 100 as Reman access.

### Also from the plan (score with the gates; not a seventh religion)

| Plan §10 / §13 want | How this brief locks it |
| --- | --- |
| Slower ship progression; wider useful steps; roles for smaller ships | Availability / license / stock steps inside a class stay useful. Do **not** invent a locked price table. Do **not** rewrite the 172-hull roster. |
| Fleet costs create choices | Escorts and parked fleet consume supply / repair / maintenance. Numbers **TBD / injectable**. |
| Earth–Klingon wartime restrictions | Gate 2. Exceptions only in named neutral / black-market contexts. |
| Progression by worthwhile trips / activities | Standing and income come from completed deliveries, escorts, licensed work, and credited combat — not shop ping-pong or jump flavor. |
| Recovery so a setback is not unwinnable | Lost holding, burned market, or embargo leaves a legal recovery path (trade elsewhere, restabilize, recover Reman by the **existing** durable unlock). Not a second Reman/money cheat. |

### Must not break (cite landed work)

Score these as **preservation**. A Phase 8 Pass that regresses them is a Fail.

| Locked rule | Cite | Phase 8 must not |
| --- | --- | --- |
| Phase 5 fill / worsen / close-once / overdue ≠ destroyed ≠ attacker | `docs/phase5/`; PR #21; S8 | Rewrite convoy outcomes, invent an attacker from a market dip, or refill a closed shortage because a market ticked. |
| Catalog wire: 172 active, 38 aliases, `loadShipCatalog` live | PR #28; `src/ship-catalog-wire.js`; S11 | Resurrect discarded IDs, empty-pool fallback into Gorn, or a second roster. |
| Reman **53 / `bm-ship:53`** via `meetPackPurchaseDecision` | Side-lane PR #18; wire PR #28; S7.8 / S11.2–S11.3 | Credits-only Reman, Remus-as-sole-key, or a second Reman hull. |
| Standing tiers Open 0 / Trusted 15 / Respected 30 / Military 50 / Strategic 75 / Excalibur·Concord 100; home **20** | Wire `PURCHASE_TIER_STANDING`; `SHIP-ECONOMY-REVIEW.md`; `GUIDED-CONVERGENCE.md` §6 | Replace tiers with kill-standing deltas, or let latinum skip a tier. |
| Independents are not one alliance; flag-share ≠ control | Phase 1; doctrine | Treat `neutral` standing as a pact or as universal market immunity. |
| Phase 4 punishment tokens; no double standing on one kill | Phase 4 §8; S6.4 | Charge standing again from a market or embargo notice. |
| Phase 3 refusal / inability are not aggression | Phase 3 / 4 | Turn an embargo or license refuse into `attackId` / fire. |
| Phase 7 orders persist; hold-outside stays outside | PR #29; S12 | Tax or upkeep that silently erases a standing fleet order. |

Also preserve, without reopening:

- Authority is a political side (`isSystemControlled`), not a flown flag.
- Two ROE modes unchanged. Access is a permission, not a ceasefire.
- Phase 1 combat credit: only `player` / `playerEscort` final hits reward or blame.
- Culture cannot grant fire permission. `engagement_authorized` is never injected.
- Side-lane gates (not a random flip; lounge+contract coexist; pirates as pressure; `repairCapable`) stay closed.
- Soft authored breakaway profiles stay **out**.

### Process locks (implementation locks, not a change to gates 1–6)

- **Proposal first.** Do not implement from this text until Tenth scopes the engine lane after a brief Pass.
- **Blind bake-off.** Implement from `docs/` only. Do not crib `Artemis2028/BM1-remastered-work`.
- **No invented balance numbers** as locked constants. Restriction *kinds*, finite *shape*, and anti-farm *forbids* are locked. Example prices in §8 are recommendations.
- **Subscribe, do not fork.** Market writes call existing Phase 5 / side-lane named functions. Do not implement a second shortage ledger.
- **No Pass claimed** in `docs/BAKEOFF-STATUS.md` from this PR.

## 3. Compact finite markets

**Lane owner (wording):** Number Four (gate 1).

### 3.1 What a market is

A **market** is persistent stock + demand + a sayable price at a **location** (world or named station), for a **small** good set the side-lane / Phase 5 already know (`food` / `fuel` / `parts`, or one authored fixture good). It is not eight immortal price rows (`state.planetMarkets` today) and not a flavor scan (`buildShipScanReport`).

Required facts (names can change):

| Field | Rule |
| --- | --- |
| `marketId` / `locationId` | Stable. Not `npc.id`. Not a `systemStates` key. |
| `good` | Named. Unknown stays unnamed; do not leak hidden cargo. |
| `stock` | Finite integer (or compact bucket). Buy lowers it. Delivery may raise it **up to a cap**. |
| `demand` | Finite. Loss / worsen may raise it **up to a cap**. Fill lowers it **to a floor**. |
| `price` | Derived or stored; a **premium** overlay is a restriction kind (gate 2), not stock. |
| `restriction` | One of the four kinds in §4, or `open`. |

Player-facing: the player can see that *this* port is short (or glutted) of *this* good, and that delivering or losing a cargo **moved the number**. If the UI cannot say that, the market is not ready.

### 3.2 Subscribe to Phase 5 — do not rewrite it

| Phase 5 write (already landed) | Market book effect (shape) |
| --- | --- |
| Shortage **filled** (escort deliver or independent deliver) | Demand down, stock up, both **clamped**. Close-once still owns the assignment. |
| Shortage **worsened** (exploit / loss) | Demand up, stock down, both **clamped**. No invented `attackerId`. |
| Overdue / ignore / burned window | Demand may stay tight or tick once toward worsen. Still **not** destroyed, still **no** attacker. |
| Closed token | A later jump must not reprint that shortage’s stock as if the delivery never happened. |

Do not open a second `objectiveBoard`. Do not move deadlines. Do not treat a market dip as `asset_overdue`.

### 3.3 Store

```js
state.marketBook = {
  version: 1,
  nextMarketId: 1,
  markets: { /* [marketId]: record */ },
  goods: { /* [goodId]: { stockCap, demandCap, floor } */ },
  writeTokens: { /* [token]: { marketId, reason, atStrategicJumps } */ }
};
```

Serialize beside `objectiveBoard`. Initialize on `resetRunState`. Sanitize enums, IDs, and clamps. Old saves start with an empty book; first visit **mints** compact rows from authored fixtures or probe inject — it does not regenerate infinite stock on every dock.

`state.planetMarkets` price rows may remain as a **display fallback** until the book covers that port. They must not remain the source of truth for stock, demand, or standing.

**Clock:** stock/demand ticks, if any, use the Phase 5 strategic jump counter (`incrementStrategicJumps` on completed warp/wormhole only). Cancel and load do **not** restock. `state.day += 1` and `updatePlanetMarketVariance()` are **not** a restock pump.

### 3.4 Bounds

Starting proposal, not locked constants: a few live markets per run, a few goods per market, stock/demand in small integers. If a write would overflow a cap, **clamp** and record `saturated` — do not mint a new market to “make room.”

## 4. Restriction kinds

**Lane owner (wording):** Number 2 (gate 2).

Four kinds. A deal evaluates them **in order**. Price is last, never first.

| Kind | Means | Price may? | Example sayable |
| --- | --- | --- | --- |
| `embargo` | Authority forbids this good (or this counterpart) here | **No** — refuse | `Earth embargo: Klingon munitions not sold at Utopia. A higher bid is not a license.` |
| `license` | A named permit / wartime exception is required | **No** — refuse until the license exists | `License required. Neutral broker on Orion can offer a costly wartime exception.` |
| `seller_rule` | This local seller will not deal (hostility, policy, independent shop rule) | **No** — refuse | `Local seller refuses. Independent shop — not a pact, not imperial immunity.` |
| `premium` | Legal to buy/sell; the price is worse | **Yes** — that *is* the cost | `Black-market premium at this neutral dock. Not an Earth yard.` |

`serviceRefusal` today (hostile ports, Cardassian/Romulan feat gates) is a **seller_rule** / access ancestor. Keep it. Do not collapse it into “everything costs more.”

Phase 3 docking denial remains administrative. An embargo is not an `attackId`. A license refuse is not inability-as-offense.

### 4.1 Earth–Klingon wartime

When Earth and Qonos are at wartime restriction (authored fixture or existing war-flag fact — do **not** invent a new alliance):

- Imperial Earth / Klingon yards: embargo or license on the wartime good set. No “pay 10× and the imperial clerk sells it.”
- Neutral / independent / named black-market docks: may offer a **premium** and/or a **license** exception. Costly, local, explainable, risky (existing pirate / unrest pressure may apply). Not unrestricted imperial stock.
- The exception never grants Reman **53**, never skips a purchase tier, and never writes `engagement_authorized`.

### 4.2 Independent shops

Independence is **not** universal immunity (gate 3). An independent market may still embargo a wartime good, require a license, or refuse a hostile captain. Concord / Free Swiss access remains the **landed** vendor + standing rule (`independent-endgame`, `neutral` standing, Excalibur/Concord 100). Phase 8 must not turn that vendor into “anyone with latinum.”

## 5. Identity already landed — cite, do not reinvent

**Lane owner (wording):** Number 2 (gate 3 + gate 6 catalog/Reman).

| Already live | Phase 8 uses it as |
| --- | --- |
| `PURCHASE_TIER_STANDING` + `createStartingStandings` (home 20) | Hull trust gates. Do not retune the table in this brief. |
| `evaluateWiredPurchase` / `catalogPurchaseContext` | Money / standing / region / vendor reasons. Add **good** restrictions beside them, not instead of them. |
| `meetPackPurchaseDecision` (S7.8) | Only Reman **53**. Soft leftover stays the meeting point. |
| Independent trade standing in `neutral` | Commercial trust. Not a side, not a pact, not immunity. |
| Phase 4 `punishmentToken` / `applyStandingOnce` | Any standing write from trade must be tokenized or capped; kills stay once. |

Credits alone still cannot buy Military / Strategic / Excalibur / Concord. Standing alone still cannot buy Reman. Remus is still a vendor **note**.

## 6. Close the farms

**Lane owner (wording):** Number Four (gate 4).

### 6.1 Buy/sell must not print prestige

| Path | Today | Phase 8 rule |
| --- | --- | --- |
| `buyMarketGood` / `sellMarketGood` | `adjustFactionStanding(..., 1)` each time | **No** standing from a shop reversal. Ordinary trade, if it writes standing at all, **caps at Trusted (15)** and must not rise from buy-then-sell of the same ton. |
| Hail ship one-shot trade | Latinum only (no standing) | Keep: no standing. Goods come from **stock** if the book covers that seller; otherwise one compact offer, not an infinite hold. |
| Contract / Phase 5 delivery | +3 on player latinum deliver; Phase 5 may call unrest relief | **Worthwhile trip.** Consumed-once (existing contract id / close token). May write standing to the destination’s **controlling** faction and a smaller amount to the issuer when different (`SHIP-ECONOMY-REVIEW.md`). Player holdings use origin faction; private sellers build **independent** trade trust. Custom governments are not silently mapped to `neutral`. |
| Credited kill | Phase 4 cascade + token | Unchanged. Market notices must not add a second write. |

The local-world-prestige placeholder is already gone. Do not bring it back.

### 6.2 Jump-farm infinity

A completed strategic jump may tick markets (gate 1 clock) and may roll existing travel flavor. It must **not**, by itself, do all of: refill stock to cap, pay unbounded latinum, spawn free escorts/garrisons, and fully repair/refuel for free.

| Farm | Bound (shape; numbers TBD) |
| --- | --- |
| `randomTravelEvent` salvage latinum | Cap per run / diminishing / costed repair after hits — **some** limit. Flavor pirate cargo loss still **must not** set `attackerId` (Phase 5). |
| Transport-mission latinum | Same family: not an infinite dock button. |
| `updatePlanetMarketVariance` | Price wobble only. **Not** a stock reprint. |
| Dock repair / refuel / escort hire at a holding | Costs scale with fleet size / damage; holdings without supply pay more or refuse (gate 5). `repairCapable` stays the physical gate (side-lane). |
| Ambient / garrison reinforcements | No free reprint on jump because the system is owned. |

### 6.3 Fleet costs create choices

Parked escorts, hold-outside wings (Phase 7), and extra hulls consume **supply / repair / maintenance**. Exact costs await pacing targets and stay **injectable**. A player who leaves a wing parked must feel a choice: pay, recall, or watch readiness drop. Upkeep must **not** silently supersede a Phase 7 standing order (S12.7 family).

## 7. Conquest obligations

**Lane owner (wording):** Number Four (gate 5).

Claim / occupy already spends a charter (`SYSTEM_CLAIM_LATINUM_COST` × multiplier, plus duranium) and writes control. That is the **entry** fee.

After control, the holding carries four obligation lanes (names can change; first slice may implement them as **one** compact upkeep record with four sayable reasons):

| Obligation | Failure (bounded) | Success |
| --- | --- | --- |
| **Garrison** | Readiness drops; unrest writer *may* be called; not an instant revolt table | Holding can defend without free spawned navies |
| **Supply** | Markets stay tight; repair/refuel premium or refuse | Local stock can recover within caps |
| **Reconstruction** | Stations/yards stay degraded; no free income | Services return on a strategic-jump clock |
| **Stabilization** | Political pressure; existing unrest/independence writers only | Income and access become reliable |

Holdings may produce income **only** while obligations are met (or while a named grace window remains). Income must not exceed a compact cap. Losing the holding retains Phase 2 overrides as **inactive** (already landed); it does not erase recovery.

**Recovery:** a neglected or lost holding can be restabilized by worthwhile trips (supply convoy via Phase 5, garrison assignment via Phase 7, reconstruction spend). A setback must not require a new save. Reman recovery stays the **existing** durable unlock — not a conquest prize.

Planting a flag (`plantFlagForEmpire`) still must not grant trust exemptions or catalog standing (economy review: raising a flag does not grant trust). Phase 8 must not add a “flag = open imperial market” write.

## 8. Progression without a spreadsheet

Wider useful steps inside a class: a cheaper hull remains worth flying because licenses, stock, wartime access, and fleet upkeep make the expensive hull a **choice**, not an automatic upgrade. Do not lock a new price list in this brief. Do not dominate smaller ships by giving capitals free upkeep and free stock.

Measure progress in **completed activities**: delivered shortages, licensed exceptions actually used, holdings kept stable, escorts maintained. Currency multipliers alone are not the exit.

## 9. Acceptance exercises (S13)

Keep all existing Phase 1 / S4–S12 / doctrine / catalog / side-lane gates green. Add S13 fixtures that fail setup if a required market, restriction, or holding-upkeep helper is missing. Classification-only asserts are insufficient for stock clamps and standing caps.

Number Three owns the probe gate **after** engine, not this brief. IDs are a sketch; do not promise a final count.

| Case | Required exercise and result |
| --- | --- |
| **S13.1** Finite stock / demand | Inject a compact market. Buy lowers stock. A Phase 5 **fill** write raises stock / eases demand **within caps**. Repeat fill does not grow past the cap (`saturated`). |
| **S13.2** Losses are bounded | Phase 5 **worsen** / loss lowers stock / raises demand **within floors/caps**. A second jump does not reprint the pre-loss stock. |
| **S13.3** Close-once shortage still closed | Closed Phase 5 token: market tick / jump must not reopen that assignment or mint free replacement cargo for it. |
| **S13.4** Price ≠ embargo / license / seller | Same good: embargo port refuses at any price; license port refuses without the permit; seller_rule refuses a hostile/independent-local case; premium port **allows** at a worse price. Assert `allowed` vs `refused` per kind, not only a larger number. |
| **S13.5** Earth–Klingon wartime | Fixture wartime restriction. Imperial Earth (or Klingon) yard refuses the wartime good even with huge credits. Named neutral / black-market dock offers premium and/or license only. Sayable names the kind. |
| **S13.6** Money ≠ standing ≠ Reman | Credits-rich, standing-poor: Military/Strategic/Excalibur hull still `faction-standing`. Standing-rich, no Reman flag: hull **53** still `access-locked`. Reman granted, broke: `funds`. Reasons stay distinct. |
| **S13.7** Independent ≠ alliance / ≠ immunity | Independent market can still embargo or seller-refuse. `neutral` standing does not open an imperial embargo. Concord / Swiss vendor rules unchanged (not “anyone with latinum”). |
| **S13.8** Restrictions are local and sayable | Two ports, same good: one open or premium, one embargo. UI/probe string names the **local** rule. No galaxy-wide silent ban from one port’s embargo. |
| **S13.9** No buy/sell prestige loop | Snapshot standing. Buy then sell the same good (or reverse). Standing does not rise above **15** from shop trade and does not rise from the reversal. |
| **S13.10** No jump-farm infinity | Complete several safe jumps. Stock does not return to cap for free every jump; latinum from travel flavor is bounded; no free escort/garrison reprint; repair/refuel still costed (or refuse without supply). |
| **S13.11** Conquest is not free income | Claim or inject a holding. Without garrison/supply/reconstruction/stabilization, income does not snowball (zero or decaying / capped). Meeting the obligations (injected) allows bounded income. |
| **S13.12** Holding remains a responsibility | Neglect produces a sayable penalty and may call an **existing** unrest writer. It does not spawn a free navy and does not wipe the save. |
| **S13.13** Recovery is possible | After neglect or a lost holding, a named recovery path restores stability or access without a Reman/money cheat and without rewriting durable unlock. |
| **S13.14** Phase 5 / catalog / Reman preserved | After market writes: overdue still ≠ destroyed ≠ attacker; S8 clock still completed-jump only; S11 aliases / 172 / Gorn empty / Reman unlock still hold; `meetPackPurchaseDecision` still the only Reman meeting point. |
| **S13.15** No second bypass / no double standing | Wartime black market cannot sell hull 53 for latinum. Embargo FLASH/notice does not `adjustFactionStanding` for a kill already tokenized. Phase 3 refuse still not aggression. |
| **S13.16** Fleet upkeep does not eat orders | Inject parked / hold-outside escorts. Upkeep may charge or degrade readiness. Phase 7 standing kind remains `hold_outside` (S12.7 family). |
| **S13.17** Worthwhile trip still pays | A consumed Phase 5 or contract delivery may write standing / latinum **once**. Replay of the same token does not pay again. Shop ping-pong does not match that payout. |
| **S13.18** Smaller hulls still useful | Fixture: cheaper hull can complete a licensed / stocked job a capital cannot take for free (upkeep, license, or stock). Ordering only; no magic prices. |

Each case may contain multiple assertions. Include startup smoke. Do not claim a Referee Pass from this list.

## 10. Non-goals

Phase 8 will not:

- Reopen Phase 5 clock, close-once, overdue, knowledge-scoped pirates/patrols, or urgency tiers.
- Rewire `loadShipCatalog()`, aliases, 172 active hulls, Paso/Swiss/Remus vendors, or `meetPackPurchaseDecision`.
- Invent a second Reman hull, a credits-only Reman, or Remus-as-sole-key.
- Invent a second civilian sim or promote `openContracts` pods to campaign convoys.
- Build a galaxy-wide commodity ticker, futures market, or many disconnected trade missions.
- Invent locked repair / unrest / prestige / garrison **numbers** (shape only).
- Retune `PURCHASE_TIER_STANDING` or new-character 20.
- Implement Phase 9 EW / weapon matrix, boarding, construction-beam visuals, or flags/passes inventory.
- Turn embargo into ROE fire, `attackId`, or `engagement_authorized`.
- Treat `buildShipScanReport` flavor as a real manifest.
- Collapse independents into one alliance or treat `neutral` as imperial immunity.
- Persist markets inside `systemStates` or key them on recycled `npc.id`.
- Restock on `loadGame`, cancel, or `state.day` alone.
- Touch `Artemis2028/BM1-remastered-work`.
- Claim a Referee Pass in `docs/BAKEOFF-STATUS.md`.

## 11. Implementation sequence and handoff

1. **Brief Pass.** Referee / One score the **six** hard gates. Number 2 scores gates **2–3** and gate **6** Reman/catalog identity. Number Four scores gates **1, 4, 5** and gate **6** Phase 5 subscribe-only. Do not open an engine PR on this document alone.
2. **Tenth scopes the engine lane** after Pass. Blind implement from `docs/` only.
3. **Suggested order if scoped:** empty `marketBook` + save/load + clamps (S13.1–S13.3) → subscribe Phase 5 fill/worsen only → restriction kinds + wartime fixture (S13.4–S13.5, S13.8) → standing/Reman reasons unchanged (S13.6–S13.7, S13.14–S13.15) → close buy/sell + jump-farm (S13.9–S13.10, S13.17) → holding upkeep (S13.11–S13.13, S13.16) → useful-step fixture (S13.18).
4. **Number Three** adds/runs S13 after engine. Keep Phase 1 / S4–S12 / `test:catalog` green.
5. Changelog / status Pass wait on Referee after review. This proposal PR may note that the brief is open; it must not write a Pass.

If one model implements a later slice, reserve a separate review pass. Fable can edit embargo/journal copy after the paths work.

## 12. Open questions

Mark these clearly. They do **not** weaken the hard gates.

| ID | Question | Default if engine is scoped before an answer |
| --- | --- | --- |
| Q1 | Which goods / ports are the first fixtures? | One probe-injected good + two ports (imperial vs neutral) is enough. |
| Q2 | Exact stock caps, premiums, garrison fees, fleet upkeep? | **TBD / injectable.** S13 asserts clamps, refuse-vs-premium, and non-zero upkeep — not a constant. |
| Q3 | Does `planetMarkets` die in the same PR? | Keep as display fallback until the book covers the port; it must not write standing or infinite stock. |
| Q4 | Wartime: require an existing Earth–Klingon war flag, or an authored fixture? | Authored / probe fixture for first slice. Do not invent a new alliance. |
| Q5 | May a license be an inventory flag/pass (convergence §2)? | **Later.** First slice may use a probe-granted `licenseId` on the book. Do not spend a weapon slot. |
| Q6 | Holding income formula? | Bounded payout only while obligations met (or during a short grace). Zero if neglected. |
| Q7 | Does neglect call side-lane unrest? | **Optional** named writer only. Do not retune unrest thresholds. |
| Q8 | Transport-mission / salvage: remove or cap? | **Cap / diminish.** Do not leave unbounded. |
| Q9 | Split engine PRs (book vs restrictions vs conquest)? | Tenth decides after Pass. Gates stay separable. |
| Q10 | Difficulty knobs (convergence §8)? | **Out** of first slice. Political identity stays the same at all difficulties when they arrive. |

## 13. Lanes

| Who | Owns | Scores |
| --- | --- | --- |
| **Number Four** | Gates **1, 4, 5** wording (finite stock/demand; anti-farm / jump-farm; conquest obligations). Gate **6** Phase 5 subscribe-only | Deliveries/losses clamp; no prestige/jump infinity; holdings cost; convoy outcomes untouched |
| **Number 2** | Gates **2–3** (price ≠ ban; money ≠ standing ≠ Reman; independent ≠ alliance; local sayable restrictions). Gate **6** catalog / Reman identity | Four kinds distinct; no second Reman/money bypass; `neutral` is not a pact |
| **Number Three** | Probe gate **after** engine (S13 on `__BM1_PROBE__` / offline tests; S4–S12 stay green) | Not this brief |
| **Referee / One** | This brief vs the **six hard gates** in §2 | **Before** any engine PR |

## 14. Deferred work remains on the plan

Phase 9 should take EW **on the Phase 6.5 budget** and the weapon matrix. Flags/passes as inventory, boarding, and construction visuals stay on the convergence backlog. Difficulty knobs stay proposed and must not change political identity. Independently addressable deep-space locations remain the plan §8 later add.

Phase 8 is ready to score when a reader can mark Pass/Fail on all six gates: finite clamped markets; price ≠ ban; money ≠ standing ≠ Reman and independent ≠ alliance; no prestige/jump farms; conquest costs; Phase 5 + catalog wire + Reman meeting left closed.

## Sources and precedence

- Plan §4 Phase 8 exit and §10 Economy table + exploit paragraph: `docs/revised-development-plan.md`.
- Standing tiers + catalog wire (already landed): `src/ship-catalog-wire.js`; `docs/GUIDED-CONVERGENCE.md` §6–§7; `docs/SHIP-ECONOMY-REVIEW.md`; PR #28; S11.
- Reman meeting: `src/side-lane-repair-reman.js` (`meetPackPurchaseDecision`); side-lane brief; S7.8 / S11.2–S11.3.
- Phase 5 shortage fill/worsen / close-once: `docs/phase5/`; `src/phase5-objectives.js`; PR #21.
- Phase 4 tokens / no double standing: `docs/phase4/`; `src/phase4-incidents.js`.
- Phase 7 standing orders (do not erase): `src/phase7-fleet.js`; PR #29.
- Bake-off process: `docs/BAKEOFF-STATUS.md` (this PR may note the brief is open; no Pass claimed).

Settled Phase 1–7 behavior, catalog wire, Reman unlock, and these six Phase 8 gates take precedence over older handoff text that left markets infinite, treated price as a permit, or treated occupation as free income.
