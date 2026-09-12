# BM1 Phase 5 — Persistent objectives and a convoy/distress scenario

**Status:** proposal for implementation; no engine changes made by this document.  
**Repository:** `Artemis2028/BM1-bakeoff`  
**Planning baseline:** `72cc984` on `main` (12 September 2026), after Phases 1–4 and side-lane engine (repair/Reman unlock PR #18; unrest/independence mint PR #19).  
**Referee context:** Phase 4 engine §6 **Pass** on `7f926df`. This brief does **not** claim a new Referee Pass and does **not** reopen side-lane unrest.  
**Companion:** `docs/phase5/BM1-PHASE5-ENGINE-DEPENDENCIES.md` (hooks, risks, probe plan).  
**Scoped by:** Tenth Mountain Trooper, 2026-09-12 — proposal first; no engine until Tenth scopes after a brief Pass.

Phases 1–4 already landed: political authority, two-mode ROE, holding zones/compliance, and incident ledger / FLASH. The side-lane added `repairCapable` / Reman unlock and unrest / lounge+contract civilians / pirates-as-pressure. Doctrine v0.2.1 is loaded; `evaluateReact` can act for allowlisted Phase 4 responses. The strategic jump counter already lives on `incidentLedger.strategicJumps`.

This is **one** connected gameplay loop: a finite shortage, a real cargo convoy, knowledge-scoped pirates and patrols, and a player choice that leaves a persistent outcome. It is not a second civilian economy, not a galaxy-wide mission board, and not permission to treat overdue as destroyed.

## 1. The result we want

One useful gameplay loop survives several jumps and reload without duplication (plan §4 Phase 5 exit; plan §7).

1. A **finite local shortage** creates a delivery opportunity.
2. A **real cargo-bearing convoy** has an origin, destination, assignment and **stable ID**.
3. **Pirates** learn about it through detection or a report and evaluate risk and value.
4. A **patrol or relief** ship responds according to knowledge, interest, equipment and available resources — not omniscience.
5. The **player** can escort, deliver independently, investigate, exploit the situation, or ignore it.
6. **Delivery, loss or rescue** changes supply and leaves a persistent outcome.

Carry doctrine `asset_overdue` (freighters, explorers, refugee transports, tenders, patrols): known assignment + missed milestone; unloading from the scene is not disappearance; overdue is not destroyed; overdue does not identify an attacker.

**Exit condition (plan §4):** one useful gameplay loop survives several jumps and reload without duplication.

**Proposed first-release decisions:**

| Question | Proposed answer |
| --- | --- |
| What is the first playable slice? | One authored shortage, one real convoy (origin / destination / assignment / stable ID), one knowledge-scoped pirate evaluation, one present patrol/relief that may act from delivered knowledge, and a player choice that writes a persistent supply outcome. |
| Where does the board live? | `state.objectiveBoard` (name can change), saved like `incidentLedger` / `unrestIndependence`. **Never** inside `systemStates`. |
| What clock burns deadlines? | Completed player **warp or wormhole** only. The existing `incrementStrategicJumps` path is the subscribe point. Cancel and load do **not** tick. |
| What is a deadline? | **Strategic jumps remaining**, derived from planned warp/wormhole **route cost** versus the player’s current ship antimatter capacity/burn (or the mean of assigned fleet escorts). Tiers apply different budgets. |
| Does overdue mean destroyed? | **No.** And it does not name an attacker. |
| Second civilian sim? | **No.** Reuse Phase 4 incidents + side-lane lounge/contract civilians + pirates-as-pressure. |
| Side-lane unrest rework? | **No.** A Phase 5 outcome **may** call the existing named unrest/relief writers. It must not retune unrest, invent thresholds, or replace lounge+contract coexist. |
| Catalog wire / authored breakaway profiles? | **Out.** Soft leftovers stay out. |
| When may actors act? | From **delivered knowledge** (Phase 4 reports / observer copies / in-system detection). Global board truth is not a fact source. |

These are recommendations for this phase, not new decisions attributed to the user. Locked bake-off constraints take precedence over older doctrine wording that left multi-jump campaign bookkeeping implicit.

## 2. Locked constraints (do not reopen)

The bake-off team locked these before this brief. Implementation and probes must treat them as **hard gates**. Referee / One score this brief against these eight **before** any engine PR.

### Hard gate 1 — Strategic clock

> The strategic clock advances **only** on a **completed** player jump (warp or wormhole). Cancel and load do **not** advance it.

A completed inter-system warp and a completed wormhole transit each tick once. Starting travel, aborting travel, closing the map, dying mid-animation, `loadGame`, and `resetRunState` do not tick. Same-system / `from === to` warp (already skipped by the landed increment) is not a strategic jump.

### Hard gate 2 — Stable ID, close-once, no free replacements

> Every campaign objective has a **stable ID outside `systemStates`**. Close it **once** with a **token** so a second jump cannot respawn the same overdue fact or mint **free replacement assets**.

The token is the same family as Phase 4 `punishmentToken`: one fact, one close. Ambient `npc.id` reuse and `systemStates` wipe must not revive a closed convoy, overdue, or replacement hull.

### Hard gate 3 — `asset_overdue` is not destruction and not an attacker

> Doctrine `asset_overdue` requires a **known assignment** and a **missed milestone**. Unloading a ship from the scene is **not** disappearance. Overdue does **not** mean destroyed. Overdue does **not** identify an attacker.

Number 2 owns this wording (§6). Accident, delay, comms failure, desertion, piracy and covert interference remain possibilities until later evidence says otherwise.

### Hard gate 4 — Delivered knowledge, not global truth

> Pirates and patrol/relief act from **delivered knowledge** (detection or a report they actually received), plus interest, equipment and resources. They do **not** read the objective board as omniscient world truth.

Same contract as Phase 4 observer copies: `event_known === false` → `ignore_unknown`; no journal leak.

### Hard gate 5 — Reuse; do not invent a second civilian sim

> Reuse Phase 4 incidents + side-lane lounge/contract civilians + pirates-as-pressure. Do **not** invent a second civilian simulation.

A convoy is an **assignment on** the existing civilian-purpose contract role (or a fixture that uses it), not a parallel population. Lounge civilians still lounge. Pirates remain the side-lane pressure faction.

### Hard gate 6 — No invented attacker / no double standing

> Do not invent an attacker from overdue, unload, or a burned urgency window. Do not charge standing twice for one destruction (truth vs knowledge; same family as Phase 4 punishment tokens).

Number 2 owns this wording with One’s soft: the hard fail is a second standing write or an invented `attackerId`. A soft non-blocking note is allowed only for journal/UI phrasing that still does not name a killer.

### Hard gate 7 — Reachable urgency

> A deadline is **strategic jumps remaining**, computed from the **planned warp/wormhole route cost** versus the player’s **current ship antimatter capacity/burn** (or the **mean** of assigned fleet escorts). Recalculate on hull or fleet change **without soft-resetting** an already-burned window. Cancel and load do **not** burn the deadline. Burning the window still must not invent an attacker or mark the asset destroyed.

Number Four owns this engine wording (§8).

### Hard gate 8 — Urgency tiers

> Some events are less urgent than others. Tiers have **different deadline budgets** (tight convoy rescue vs softer overdue/patrol). There is **not** one global timer. Close-once and no-soft-reset apply to **every** tier.

Also preserve, without reopening:

- Authority is a political side (`isSystemControlled`), not a flown flag.
- Two ROE modes unchanged. Access is a permission, not a ceasefire.
- Phase 1 combat credit: only `player` / `playerEscort` final hits reward or blame.
- Phase 3 refusal / inability remain non-aggression. Phase 4 still owns that feed.
- Culture cannot grant fire permission.
- `engagement_authorized` is never injected as a world fact.
- Side-lane gates 1–3 and §6 (not a random flip; lounge+contract coexist; pirates as pressure) stay closed.
- Soft authored breakaway profiles and `bm-ships/` catalog wire stay **out**.

### Process locks (implementation locks, not a change to gates 1–8)

- **Proposal first.** Do not implement from this text until Tenth scopes the engine lane after a brief Pass.
- **Blind bake-off.** Implement from `docs/` only. Do not crib `Artemis2028/BM1-remastered-work`.
- **Not a side-lane unrest rework.** Do not retune unrest thresholds, N-jump starve counts, or lounge:contract mix.
- **No invented balance numbers** as locked constants. Tier *shape* is locked; example jump slacks in §8.3 are recommendations.

## 3. The convoy / distress loop

**Lane owner (loop shape):** Number Four for bookkeeping and actor path; Number 2 for the overdue event contract.

This is the plan §7 loop, in order. First slice: **one** authored chain. Do not expand into many disconnected missions.

### 3.1 Finite local shortage

A named world or station is **short** of a good the side-lane already knows (`food` / `fuel` / `parts`, or one authored fixture good). The shortage is **finite**: it can be filled, expire, or worsen from a named write. It is not an infinite spawn pump.

The shortage **creates** the delivery opportunity. It does not, by itself, open `asset_overdue`, name a pirate, or mark a hull destroyed.

Reuse the side-lane commerce-starved / restore-delivery writers for the *political* side-effect when the first slice wants unrest to move. The campaign **assignment** lives on the objective board, not in `unrestIndependence.civilians` as a second ledger.

### 3.2 Real cargo convoy

A convoy is a real assignment, not a `setLog` rumor and not an ambient traffic hop.

Required facts (names can change):

| Field | Rule |
| --- | --- |
| `convoyId` | Stable. Never recycled for a live assignment. Not `npc.id`. |
| `assignmentId` | Known origin, destination, good, and due milestone. |
| `objectiveId` | Board key. Close-once. |
| Cargo | Actually carried or explicitly empty. Do not treat `buildShipScanReport` flavor as a manifest (Phase 4 / Phase 6 still own sensors). |
| Hulls | One or more ships on the assignment. Scene unload does not delete the assignment. |

Player-facing: the player can see that *this* cargo is going from *here* to *there* for *this* shortage. If the UI cannot say that, the convoy is not ready.

Existing `state.openContracts` / `activeContract` (player latinum delivery pods) are **not** this convoy. Do not silently promote them.

### 3.3 Pirates learn and evaluate

Pirates learn by **in-system detection** or a **delivered report** (Phase 4 `deliverReport` / observer copy). They then evaluate **risk and value** from *that* knowledge: cargo known vs unknown, escort present, patrol present, their own gear.

They do **not** roll against the global board. An ignorant pirate continues existing predation / ambient behavior and does not gain a convoy objective.

Acting from knowledge may approach, shadow, or raid **only** under existing Phase 2 fire / predation rules. Phase 5 must not invent a new fire grant.

### 3.4 Patrol / relief respond from knowledge

A present, eligible patrol or relief ship may `investigate` / `rescue` / `record_only` / `defer:*` / `ignore_unknown` using Phase 4 `evaluateIncidentReact` and the doctrine pack. Facts come from **that observer’s** copies.

Capacity still matters: `can_respond`, role, gear, `survivors_known`. Absent actor → defer. Do not spawn a free investigator fleet because a report existed (Phase 4 non-goal, still closed).

### 3.5 Player options

All five are valid first-slice endings. None is required for the others to work.

| Choice | Persistent write (shape) |
| --- | --- |
| **Escort** | Convoy reaches destination under player / player-escort protection; shortage eases; close-once. |
| **Deliver independently** | Player (or player cargo) fills the shortage without the original hulls; assignment closes; original convoy may become overdue if it missed its milestone. |
| **Investigate** | Player or acting NPC records findings; may open or update a Phase 4 incident; does not invent an attacker. |
| **Exploit** | Player raids / steals / lets pirates take it; shortage worsens or supply moves to the exploiter; standing only via existing combat credit. |
| **Ignore** | Clock may burn; overdue may open; supply stays short; no invented killer. |

### 3.6 Delivery / loss / rescue changes supply

Closing writes a **persistent outcome** on the board (and may call a side-lane named unrest/relief write). Reload and a later jump still see the same `objectiveId`, the same close token, and the same supply mark. A second jump must not refill the shortage for free or respawn the convoy.

## 4. Identity, store, and close-once

**Lane owner (wording):** Number Four (gates 1–2).

Phase 3/4 already proved that `npc.id` is reused by ambient replacement and that `systemStates` is wiped on load, data reload, station build, wormhole build and reset. Campaign objectives inherit those rules.

### 4.1 Identity

| Identity | Rule |
| --- | --- |
| `objectiveId` | `obj-${nextObjectiveId}`, monotonic, never recycled for a live record |
| `convoyId` / `assignmentId` / `assetId` | Stable assignment keys. Doctrine `asset_overdue.payloadSchema` already names `asset.assetId` and `assignment`. |
| `closeToken` | One close per assignment fact. See §4.3 |
| `securityInstanceId` | Physical hull in a loaded scene. Replacement via `beginAmbientTrafficArrival` is a new hull, not a new assignment |
| `incidentId` | Phase 4 ledger. An overdue/distress/destruction incident **links** to `objectiveId`; it does not replace it |
| `punishmentToken` | Phase 4 kill-standing token. Destruction still charges there, once |

Do not key a convoy on recycled `npc.id`. Do not treat hull art as a transponder beyond the Phase 3 `broadcast.source` contract.

### 4.2 Store

```js
state.objectiveBoard = {
  version: 1,
  nextObjectiveId: 1,
  nextConvoyId: 1,
  nextAssignmentId: 1,
  objectives: { /* [objectiveId]: record */ },
  convoys: { /* [convoyId]: record */ },
  shortages: { /* [shortageId]: record */ },
  closeTokens: { /* [closeToken]: { objectiveId, reason, atStrategicJumps } */ }
};
```

Serialize and restore beside `incidentLedger` / `unrestIndependence` in `saveGame` / `loadGame`. Initialize on `resetRunState` / new game. Sanitize enums, IDs, clocks and token keys. Old saves start with an empty board.

**Never** persist the board inside `systemStates`. Load still wipes that cache first; reconcile hulls after `reconcileSecurityParticipants`.

Proposed objective shape (names can change):

```js
{
  objectiveId: 'obj-1',
  version: 1,
  kind: 'convoy_delivery', // convoy_delivery | distress_rescue | asset_overdue
  urgencyTier: 'tight',    // tight | standard | soft
  status: 'open',          // open | closed
  convoyId: 'cnv-1',
  assignmentId: 'asg-1',
  shortageId: 'sh-1',
  assetId: 'asset-1',
  closeToken: null,
  clocks: {
    openedAtStrategicJumps: 12,
    deadlineAtStrategicJumps: 16,  // absolute; see §8
    burnedJumps: 0,
    remainingJumps: 4,
    plannedRouteJumps: 3,
    capacityJumps: 5,
    reachable: true
  },
  truth: {
    delivered: false,
    destroyed: false,
    attackerId: null,       // only from credited destruction evidence
    survivorsKnown: false
  },
  links: {
    incidentId: null,
    punishmentToken: null
  },
  history: []
}
```

Keep **simulation truth** on the objective. Keep **observer evidence** on Phase 4 reports / observer copies. A missing hull, a refused hail and a credited kill are not interchangeable.

### 4.3 Close-once token

```text
closeToken = `obj:${kind}:${assignmentId}`
```

When the assignment **closes** (delivered, independently filled, lost-as-destroyed *from credited evidence*, rescued, expired-as-overdue, or explicitly canceled by a named write), stamp the token on the board. Any later jump, scene load, ambient arrival, or shortage tick that would mint the **same** assignment, the same overdue, or a **free replacement** hull for that assignment must refuse with `already_closed`.

Expired-as-overdue **closes the delivery window**. It may **open** a linked `asset_overdue` incident / objective **once**. That overdue uses its **own** token (`obj:asset_overdue:${assignmentId}`). A third jump must not open a second overdue for the same assignment.

NPC-only destruction still does not blame the player (Phase 1). The close token may record `destroyed: true` on truth **only** when a hull was actually destroyed through `destroyNpcShip` / `destroyStation`. Overdue and unload never set that bit.

## 5. Strategic clock

**Lane owner (wording):** Number Four (gate 1).

### 5.1 What ticks

| Event | Clock |
| --- | --- |
| `completeWarpTravel` with `from !== to` | **Tick once** (already calls `incrementStrategicJumps`) |
| `completeWormholeTransit` to another system | **Tick once** (already calls `incrementStrategicJumps`) |
| Start warp / start wormhole | No |
| Cancel / abort travel (existing or future) | **No** |
| `loadGame` / `resetRunState` / new game | **No** (restore the saved counter; do not increment) |
| Same-system warp (`from === to`) | No (already skipped) |
| Ambient NPC warp / `scheduleAmbientTrafficWarp` | **No** — player strategic clock only |
| Local `tick` / `localElapsedMs` | No — that remains the Phase 3/4 tactical clock |

`state.day += 1` on warp completion is flavor. It is **not** the Phase 5 strategic clock and must not burn deadlines by itself.

### 5.2 What the clock is for

- `openedAtStrategicJumps` / `deadlineAtStrategicJumps` / `burnedJumps` / `remainingJumps` on each objective.
- Doctrine `missedMilestone` / `detectedAt` for `asset_overdue` when that contract uses the strategic clock (escort/delivery and investigation/rescue already declare completed strategic jumps in DESIGN “Objectives must end”).
- **Not** Phase 3 hold timers (those stay on `localElapsedMs`).

Cancel and load restore the same `remainingJumps`. They do not consume a jump and do not refresh a burned window.

## 6. Doctrine `asset_overdue`

**Lane owner (wording):** Number 2 (gate 3 + gate 6, with One’s soft on journal phrasing).

This section is the scoring surface for Number 2. It carries DESIGN “A general overdue-asset event” and `eventContracts.asset_overdue` into the campaign loop.

### 6.1 What overdue is

`asset_overdue` means: an observer who **knows the assignment** detects that a **specific milestone** (arrival or check-in) was missed after its deadline plus grace, on the **declared clock** (here: strategic jumps; see §8).

Roles the event already covers: **freighter**, **explorer**, **refugee_transport**, **construction_tender**, **patrol**, plus convoy/fleet as `asset.kind`. First slice should exercise at least a **freighter/convoy** overdue and keep the others legal.

Required payload facts (do not invent a second schema):

| Field | Phase 5 rule |
| --- | --- |
| `asset.assetId` | Stable. Same as the board `assetId`. |
| `assignment` | Known origin / destination / assignment id. **No assignment → no overdue.** |
| `missedMilestone` | Named due + grace on the strategic clock. |
| `detectedAt` | Strictly after deadline + grace, same clock. |
| `lastKnown` | Historical. Not a live firing solution (Phase 6). |
| `cargo` | Knowledge state. Unknown stays null. Do not leak hidden inventory. |

Emit the report **only** for an observer that knows the assignment and the missed milestone. Use asset / assignment / milestone IDs to update **one** persistent incident, not a new mission every tick or jump.

### 6.2 What overdue is not

| Forbidden inference | Why |
| --- | --- |
| Unload / scene change / `systemStates` wipe ⇒ disappeared | Hard gate 3. Ambient replacement is a new hull. |
| Overdue ⇒ `truth.destroyed === true` | Accident, delay, comms, desertion remain open. |
| Overdue ⇒ `truth.attackerId` or pirate/player blame | No invented attacker. |
| Overdue ⇒ `applyKillStanding` / `observedAttacks` / `attackId` | Not destruction. Not aggression. |
| Overdue ⇒ survivors / wreck coordinates | `survivors_known` stays false unless independently reported (doctrine acceptance: overdue transport alone does not prove survivors). |
| Overdue ⇒ Dominion / pact / culture fire | Out of scope; culture still cannot grant fire. |

A later **credited** destruction (Phase 1 `player` / `playerEscort`) may open a Phase 4 `destruction` incident and set truth. That is a **different** fact, linked, not a rewrite of the overdue row into a kill.

### 6.3 No invented attacker / no double standing (gate 6)

Truth vs knowledge, same family as Phase 4 §8:

- **Truth** (objective / incident): the simulation fact. Destruction is true only when `destroyNpcShip` / `destroyStation` ran.
- **Knowledge** (report / observer copy): what *this* actor was told. A pirate rumor is not an `attackerId` on the board.

Standing:

1. Player-credited destruction still uses `applyKillStanding` **once**. Stamp Phase 4 `punishmentToken` on the linked `destruction` incident **and** on the objective `links.punishmentToken`.
2. Reports, overdue opens, doctrine `record_only` / `investigate` / `rescue`, and FLASH must **refuse** a second standing write for that token.
3. NPC-only destruction: token `kill:none:…`, `punishmentApplied = 'none'`. No player blame.
4. Overdue, unload, ignore, and a burned urgency window: **no** standing path at all.

**One’s soft:** Referee / One may note journal copy that is clumsy (“ship missing”) as **soft / non-blocking** if the data model still has `destroyed: false` and `attackerId: null`. A banner that names “pirates destroyed the convoy” with no credited kill is a **hard fail**.

### 6.4 Player-facing reasons

Every overdue notice must be sayable in one line, for example:

- `Freighter assignment asg-1 missed check-in. Overdue — not confirmed destroyed.`
- `Unloading the scene is not evidence the convoy disappeared.`
- `No attacker identified. Standing unchanged.`
- `Vulcan relief has a survivor report and is moving. Klingon patrol recorded the overdue and continued.`

If the UI cannot state that overdue ≠ destroyed and ≠ killer, the event is not ready.

## 7. Knowledge-scoped actors

**Lane owner (wording):** Number Four (gate 4 + actor path).

### 7.1 Fact source

Reuse Phase 4:

- `deliverReport` + `observerCopies`
- `evaluateIncidentReact` / `evaluateReact`
- Allowlist: `record_only`, `investigate`, `rescue`, `defer:investigate`, `defer:rescue`, `ignore_unknown`
- Non-allowlisted pack responses (including `protect`) still fold to `record_only` (S6.13 stays closed)

Map first-slice kinds to doctrine `eventType`:

| Board / incident kind | Doctrine `eventType` |
| --- | --- |
| `asset_overdue` | `asset_overdue` |
| `distress` / `distress_rescue` | `distress` |
| Credited destruction linked to the convoy | `asset_attack` **only if** that observer knows an asset was attacked; else unmatched → `record_only` |
| Shortage alone | Do not feed a combat event |

Facts must be derived from **that observer’s** copies, not from `objectiveBoard.truth`.

### 7.2 Pirates

`pirate` is already the side-lane pressure faction (prey routes, avoid strong military, raise unrest; clearing them relieves). Phase 5 gives them a **campaign job** on a *known* convoy:

- Learn via detection in the loaded system **or** a delivered report.
- Evaluate risk/value from known cargo, known escorts, known patrols.
- May raid only under existing predation / Phase 2 fire facts (`predationOrder`, `credibleCargoIntel`, …).
- Must not read the board when `event_known` is false.
- Must not become an invented `attackerId` because the window burned.

Do not hook `allowsRoutineGenerator` to spawn a pirate navy “so the convoy looks busy.”

### 7.3 Patrol / relief

Present eligible ships only. Movement reuses `npc.incidentObjective` (Phase 4). Immediate combat, tractor and engine-disable still preempt. Do not collide `destinationName` string matching.

`can_respond` / gear / resources false → `defer:*`. Do not spawn.

Ignorant observer → `ignore_unknown`, no journal leak.

## 8. Reachable urgency and tiers

**Lane owner (wording):** Number Four (gates 7–8).

### 8.1 Unit

Deadlines are **strategic jumps remaining**. Not `performance.now()`, not wall clock, not `state.day`, not Phase 3 `localElapsedMs`.

Tactical search (investigate/rescue *in-system*) may still use `localElapsedMs` as a **child** clock (doctrine: local search is tactical). Burning the **strategic** window is a different fact.

### 8.2 Reachable urgency (gate 7)

Compute, for each open objective:

```text
plannedRouteJumps = warp/wormhole plot cost from the relevant origin
                    (player present system → destination, or convoy origin → destination)
                    using the existing route planner’s jump/antimatter cost
                    (getPlottedRoute().antimatter and wormhole legs as 1 jump each unless
                     the planner already priced them)

capacityJumps     = floor(currentAntimatter / burn)
                    burn = current player-ship antimatter use (state.antimatteruse / stats.antimatterUse)
                    if one or more fleet escorts are *assigned to this objective*,
                    use the mean of those escorts’ floor(AM/burn) instead of the flagship alone

reachable         = capacityJumps >= plannedRouteJumps
                    (ship warp-range vs plot distance still uses existing getPlottedRouteStatus;
                     a ship that cannot plot the route is not reachable even if AM math is fine)

tierBudget        = jumps allowed by urgencyTier (§8.3), including route cost + tier slack

deadlineAt        = openedAtStrategicJumps + tierBudget
remainingJumps    = max(0, deadlineAt - currentStrategicJumps)
burnedJumps       = currentStrategicJumps - openedAtStrategicJumps
                    (only completed warp/wormhole increment currentStrategicJumps)
```

**Locked behaviors:**

1. The deadline is this remaining-jump figure, not a second hidden timer.
2. **Recalc** `plannedRouteJumps`, `capacityJumps`, and `reachable` when the player **changes hull** or **assigned fleet escorts**. Update sayable UI (“you can / cannot make this route on current antimatter”).
3. **Do not soft-reset** an already-burned window: `openedAt` and `deadlineAt` do **not** move later because the player bought a tanker. Remaining cannot grow above what the absolute deadline still allows. Recalc must not set `burnedJumps = 0`.
4. Changing hull to a *shorter* reach may flip `reachable` to false; that is not an extra tick and not overdue by itself.
5. **Cancel and load do not burn.** They do not increment `currentStrategicJumps` and do not increment `burnedJumps`.
6. When `remainingJumps` hits 0, the **window is burned**. The assignment may miss its milestone and **may** open `asset_overdue` **once** (if assignment + milestone were known). This still must **not** set `destroyed` or `attackerId`.

First slice may treat wormhole transit as cost `1` strategic jump (matches the landed increment) and warp legs via `getPlottedRoute().antimatter` (already `ceil(distance / WARP_RANGE_PER_ANTIMATTER)`). Do not invent a new galaxy distance formula.

Exact burn-stat field names can change in the engine PR. The contract cannot: route cost vs **current** capacity/burn (or escort mean); recalc without refreshing burned jumps.

### 8.3 Urgency tiers (gate 8)

Not one global timer. Each objective carries its own `urgencyTier` and `deadlineAt`.

| Tier | Typical first-slice use | Budget shape (recommendation, not a locked number) |
| --- | --- | --- |
| `tight` | Active convoy rescue; survivor-known distress; shortage delivery the player already accepted | Route cost + **small** slack (example starting slack: **0–1** jump) |
| `standard` | Overdue freighter / explorer check-in; ordinary delivery | Route cost + **moderate** slack (example: **2–3** jumps) |
| `soft` | Overdue patrol / tender; softer watch | Route cost + **larger** slack (example: **4+** jumps) |

**Locked:** `tight` is stricter than `standard` is stricter than `soft` on the same route. Two objectives in one run may sit on different remaining counts. A global `state.urgencyDeadline` (one number for the galaxy) is a fail.

Close-once, no free replacements, cancel/load-do-not-burn, and no-soft-reset apply to **all three** tiers.

Do not invent the example slacks as balance constants in the first engine slice unless Tenth later scopes knobs. Probes assert **ordering** and **independence**, not a magic number.

### 8.4 Player-facing urgency

- `Tight: 2 jumps remain on this convoy. Current antimatter can make the plotted route.`
- `Soft overdue watch: 5 jumps remain. Changing ships recalculated reach; the burned jump still counts.`
- `Window burned. Assignment overdue — not destroyed, no attacker identified.`
- `Load restored the same remaining jumps. The clock did not tick.`

If the UI cannot distinguish tiers, or treats a burned window as a wreck, the gate is not ready.

## 9. Reuse of Phase 4 and the side-lane

**Lane owner:** Number Four (gate 5).

| Already landed | Phase 5 uses it as |
| --- | --- |
| `incidentLedger`, reports, observer copies, FLASH, alert modes | Overdue / distress / destruction records. Do not fork a second ledger. |
| `incrementStrategicJumps` | Gate 1 subscribe point. |
| `punishmentToken` / `rememberPunishment` | Gate 6 standing once. |
| `evaluateIncidentReact` + `incidentObjective` | Patrol/relief acting. |
| `distress` incident kind | Survivor-known rescue; still requires `survivors_known`. |
| Side-lane `CIVILIAN_PURPOSES` lounge + `commerceContract` | Population. Convoy assignment **attaches** to a contract civilian; lounge remains. |
| Side-lane pirate pressure / relief | Political job. Campaign raid may call `raiseUnrestFromCommerceFailure` / `relieveUnrest`. |
| Side-lane unrest store | Optional named write from delivery/loss. **Not** reworked. |
| `ASSET_OVERDUE_IMPLEMENTED = false` in `src/side-lane-unrest-independence.js` | The flag is the boundary this phase turns. Do not implement overdue bookkeeping inside the unrest module as a sneak path. |

**Do not:**

- Replace every lounge civilian with a convoy timer.
- Invent a second `civilianSim` / `missionPop`.
- Steal unrest eligibility, temperament maps, or Reman / `repairCapable` work.
- Wire `bm-ships/` catalog or authored breakaway profiles.
- Treat player `openContracts` latinum pods as the campaign convoy.

## 10. Acceptance exercises (S8)

Keep all existing Phase 1 / S4 / S5 / S6 / S7 / doctrine gates green. Add S8 fixtures that fail setup if a required shortage, convoy, assignment, observer, or board store is missing. Classification-only asserts are insufficient for clock, close-once, and urgency.

Number Three owns the probe gate **after** engine, not this brief. IDs are a sketch; do not promise a final count.

| Case | Required exercise and result |
| --- | --- |
| **S8.1** Clock ticks only on completed jump | Complete an inter-system warp; `strategicJumps` +1; open-objective `burnedJumps` +1. Complete a wormhole transit; +1 again. |
| **S8.2** Cancel / load do not tick | Start warp or wormhole and cancel/abort if a path exists; counter unchanged. `loadGame` with an open objective: same `strategicJumps`, same `remainingJumps`, no extra burn. `resetRunState` does not increment a leftover counter onto the new run. |
| **S8.3** Stable ID outside `systemStates` | Save with an open convoy. Wipe `systemStates`. Reload. Same `objectiveId` / `convoyId` / `assignmentId`. Ambient `npc.id` reuse does not rebind the assignment. |
| **S8.4** Close-once / no free replacements | Close the assignment (deliver, or expire-as-overdue). Jump again. No second convoy, no second overdue, no free replacement hull for that token. |
| **S8.5** Unload ≠ disappeared | Unload the convoy hulls (leave system / wipe scene cache). No `asset_overdue` from unload alone. Assignment still open. |
| **S8.6** Overdue ≠ destroyed ≠ attacker | Burn the window (or inject missed milestone with known assignment). Overdue opens once. `truth.destroyed === false`, `attackerId === null`. No `applyKillStanding`. Journal does not name a killer. |
| **S8.7** Knowledge-scoped pirates | Same convoy. Pirate **with** delivered report or in-system detection may evaluate / act. Ignorant pirate: no convoy objective, `ignore_unknown`, no journal leak. |
| **S8.8** Knowledge-scoped patrol/relief | Same overdue/distress. Eligible present Vulcan (or authored relief) with facts → `investigate` / `rescue` and moves or writes. Observer without knowledge → `ignore_unknown`. Unrelated Klingon without own-asset interest → `record_only`. No spawn. |
| **S8.9** No double standing | Player-credited convoy hull kill. Existing cascade once; token stamped. Overdue/report/react must not adjust standing again. |
| **S8.10** No second civilian sim | Same system: lounge civilian still present **and** contract/convoy civilian present (side-lane S7.22 coexist). Engine slice must not convert all `traffic` / `localTraffic` into convoy timers. |
| **S8.11** Reachable urgency recalc | Open a tight objective. Snapshot `deadlineAt`, `burnedJumps`, `capacityJumps`. Change hull and/or assigned escorts so capacity changes. `capacityJumps` / `reachable` recalc. `openedAt` / `deadlineAt` / `burnedJumps` do **not** reset. Remaining does not grow past the absolute deadline. |
| **S8.12** Cancel/load do not burn the deadline | After one completed jump (burned ≥ 1), load or cancel. `burnedJumps` unchanged. |
| **S8.13** Burned window is not a wreck | Drive remaining to 0. Overdue may open. Still not destroyed, still no attacker. |
| **S8.14** Urgency tiers differ | Fixture **tight** convoy rescue and **soft** overdue/patrol on comparable routes. Tight `tierBudget` < soft `tierBudget`. Not one shared global timer. Both obey close-once and no-soft-reset. |
| **S8.15** Player loop + supply | Exercise at least two of: escort deliver, independent deliver, ignore-to-overdue. Shortage / supply mark persists across jump + reload. Closed token does not refill for free. |
| **S8.16** Phase 1–4 / side-lane still hold | After Phase 5 writes: `flagShareGrantsSystemControl() === false`; refusal still not aggression; `protect` still folds; lounge+contract coexist; no catalog wire; no authored breakaway-profile sneak-in. |

Each case may contain multiple assertions. Include startup smoke. Do not claim a Referee Pass from this list.

## 11. Non-goals

Phase 5 will not:

- Implement Phase 6 sensors/cloak/live tracks, Phase 7 fleet hold-outside-boundary, Phase 8 embargo economy, or Phase 9 weapon tables.
- Build many disconnected missions, remote deep-space POIs as a required first slice, or a galaxy-wide mission board.
- Invent a second civilian simulation or delete lounge / idle / `localTraffic`.
- Rework side-lane unrest (thresholds, N, temperament maps, Reman, `repairCapable`).
- Wire the `bm-ships/` catalog or ship authored breakaway doctrine profiles (soft leftovers stay out).
- Treat overdue, unload, cancel, load, or a burned window as destruction or as an attacker ID.
- Double-charge standing / latinum / feats for a kill already tokenized in Phase 4.
- Advance the strategic clock on cancel or load.
- Soft-reset a burned urgency window on hull or fleet change.
- Use one global urgency timer for all events.
- Spawn free investigator, pirate, or replacement hulls because a report or jump existed.
- Key objectives by recycled `npc.id` or store them in `systemStates`.
- Enable `protect-all`, boarding combat, warning shots as damage, or new alliances.
- Enforce `unknown` access or treat scan flavor as a real manifest.
- Touch `Artemis2028/BM1-remastered-work`.
- Claim a Referee Pass in `docs/BAKEOFF-STATUS.md`.

## 12. Implementation sequence and handoff

1. **Brief Pass.** Referee / One score the **eight** hard gates. Number Four scores gates 1–2 wording, the knowledge-scoped actor path, and reachable-urgency engine wording. Number 2 scores gate 3 `asset_overdue` wording and gate 6 (no invented attacker / no double standing), with One’s soft on copy. Do not open an engine PR on this document alone.
2. **Tenth scopes the engine lane** after Pass. Blind implement from `docs/` only.
3. **Suggested order if scoped:** board + tokens + save/load (S8.3–S8.4) → subscribe `incrementStrategicJumps` only (S8.1–S8.2, S8.12) → one shortage + one convoy assignment (S8.15) → overdue/distress via Phase 4 ledger (S8.5–S8.6, S8.13) → knowledge-scoped pirate/patrol (S8.7–S8.8) → standing token reuse (S8.9) → reachable urgency + tiers (S8.11, S8.14) → coexist assert (S8.10).
4. **Number Three** adds/runs S8 after engine. Keep Phase 1 / S4 / S5 / S6 / S7 green.
5. Changelog / status Pass wait on Referee after review. This proposal PR may note that the brief is open; it must not write a Pass.

If one model implements a later slice, reserve a separate review pass. Fable can edit FLASH/journal copy after the paths work.

## 13. Open questions

Mark these clearly. They do **not** weaken the hard gates.

| ID | Question | Default if engine is scoped before an answer |
| --- | --- | --- |
| Q1 | Which authored shortage / route is the first fixture? | One probe-injected shortage + convoy is enough to close the loop. |
| Q2 | Exact tier slack numbers? | **TBD.** S8.14 asserts ordering (`tight` < `soft`), not a constant. |
| Q3 | Does independent player delivery close the convoy hull’s assignment as success or leave it to go overdue? | Close the *shortage* as filled; the hull assignment may still miss its milestone and overdue **once**. Do not invent a wreck. |
| Q4 | May a burned window open distress instead of overdue? | Only if `survivors_known` is independently true. Default is overdue. |
| Q5 | Are wormhole legs always cost 1? | **Yes** for first slice (matches landed increment) unless the planner already prices them. |
| Q6 | Escort mean: AM of live scene escorts, or `state.playerFleet` rows assigned to the objective? | Assigned-to-this-objective only. Unassigned fleet does not enter the mean. |
| Q7 | Should Phase 4 FLASH on overdue? | **Yes** if alerts allow, as a newly opened FLASH-eligible incident, once. Append-only updates do not pulse (S6.14 family). |
| Q8 | Deep-space POI for wreck investigation (DESIGN patrol example)? | **Out** of first slice. Phase 6 / later. Last-known is not a live lock. |
| Q9 | Player latinum `openContracts` merge? | **No.** Separate. Do not promote pods to campaign convoys. |
| Q10 | Split engine PRs (clock+board vs actors vs urgency)? | Tenth decides after Pass. Gates stay separable. |

## 14. Lanes

| Who | Owns | Scores |
| --- | --- | --- |
| **Number Four** | Gates **1–2** wording (clock; stable ID / close-once). Knowledge-scoped actor path (gate 4). Reachable-urgency **engine** wording (gate 7) and tier machinery (gate 8 shape) | Clock only on completed warp/wormhole; cancel/load inert; IDs outside `systemStates`; second jump cannot respawn; actors from delivered knowledge; route vs AM/burn (or escort mean); recalc without soft-reset |
| **Number 2** | Gate **3** `asset_overdue` wording. Gate **6** no invented attacker / no double standing | Overdue ≠ destroyed ≠ attacker ID; unload ≠ disappeared; known assignment + missed milestone; standing once (Phase 4 tokens). **One’s soft:** clumsy “missing” copy may be non-blocking if the model does not name a killer |
| **Number Three** | Probe gate **after** engine (S8 on `__BM1_PROBE__` / offline tests) | Not this brief |
| **Referee / One** | This brief vs the **eight hard gates** in §2 | **Before** any engine PR. May attach One’s soft on gate 6 copy only |

## 15. Deferred work remains on the plan

Phase 6 should make identification and last-known honest under cloak. Phase 7 should persist richer fleet orders (hold outside a boundary). Later: cargo inspection evidence, deep-space POIs, embargo, and many missions.

Whether *later* phases ever treat a **confirmed** pirate wreck as `asset_attack` with an identified offender is a future proposal. It is **out of scope** here. The locked rule stands: overdue, unload, and a burned window do not invent an attacker.

Phase 5 is ready to score when a reader can mark Pass/Fail on all eight gates: clock only on completed jump; stable close-once IDs; overdue ≠ destroyed ≠ attacker; knowledge-scoped actors; reuse not a second civilian sim; no double standing; reachable urgency without soft-reset; tiers not one global timer.

## Sources and precedence

- Plan §4 Phase 5 exit and §7 Persistence / first connected gameplay loop: `docs/revised-development-plan.md`.
- Doctrine `asset_overdue` and “one incident, several reactions”: `docs/doctrine/DESIGN-doctrine-v0.2.1.md`; `eventContracts.asset_overdue` in `docs/doctrine/bm1-faction-doctrine.v0.2.1.json`; acceptance fixtures in `docs/doctrine/doctrine-acceptance.json`.
- Phase 4 ledger, reports, tokens, acting allowlist: `docs/phase4/BM1-PHASE4-INCIDENTS-ESCALATION-ALERTS-PROPOSAL.md`; landed `src/phase4-incidents.js`.
- Side-lane lounge/contract coexist and pirates-as-pressure: `docs/side-lane-repair-reman-independence/BM1-SIDE-LANE-REPAIR-REMAN-INDEPENDENCE-PROPOSAL.md` §6; landed `src/side-lane-unrest-independence.js` (`ASSET_OVERDUE_IMPLEMENTED = false`).
- Strategic increment already on completed warp/wormhole: `incrementStrategicJumps` in `src/phase4-incidents.js`; `completeWarpTravel` / `completeWormholeTransit` in `src/main.js`.
- Bake-off process: `docs/BAKEOFF-STATUS.md` (this PR may note the brief is open; no Pass claimed).

Settled Phase 1–4 behavior, the side-lane hard gates, and these eight Phase 5 gates take precedence over older handoff text that left “missions across jumps” unspecified or treated a missing patrol as proof of attack.
