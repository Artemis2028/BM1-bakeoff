# BM1 Phase 6 — Sensors, cloak, contact uncertainty and purposeful system space

**Status:** proposal for implementation; no engine changes made by this document.  
**Repository:** `Artemis2028/BM1-bakeoff`  
**Planning baseline:** `9470a66` on `main` (12 September 2026), after Phases 1–5 and side-lane engine (Phase 5 convoy/distress merge PR #21).  
**Referee context:** Phase 4 engine §6 **Pass** on `7f926df`. Phase 5 brief/engine have **no Referee Pass claimed** on this bake-off status MD. This brief does **not** claim a new Referee Pass.  
**Companion:** `docs/phase6/BM1-PHASE6-ENGINE-DEPENDENCIES.md` (hooks, risks, probe plan).  
**Phase 6.5 amend (do not reopen):** power budget, passive/active draw, and upgradeable suites live in `docs/phase6/BM1-PHASE6.5-POWER-SENSORS-SUITES-PROPOSAL.md`. Gates 1–8 in §2 stay closed.  
**Scoped by:** Tenth Mountain Trooper, 2026-09-12 — proposal first; no engine until Tenth scopes after a brief Pass.

Phases 1–5 already landed: political authority, two-mode ROE, holding zones/compliance, incident ledger / FLASH, and one persistent convoy/distress loop. The side-lane added `repairCapable` / Reman unlock and unrest / lounge+contract civilians / pirates-as-pressure. Doctrine v0.2.1 is loaded; Phase 4 observer copies and Phase 5 board knowledge still treat `lastKnown` as historical text, not a live track.

This is **honest contact knowledge** plus a **first slice of purposeful system space**. It is not a full EW suite, not a weapon-matrix rewrite, and not independently addressable deep-space locations.

## 1. The result we want

Hidden objects stay hidden across UI and AI; lost tracks stop exact targeting (plan §4 Phase 6 exit; plan §8).

Plan §8, in order — this brief implements **these** bullets, not a different Phase 6:

1. Initialize cloak state before the first render, minimap, target list or AI acquisition.
2. Distinguish detection, identification, track quality and firing solution. An old report is not a live lock.
3. Let contacts decay into last-known areas; searches consume time and can fail.
4. Vary sensors by role, equipment, age, power and damage. Science specialists can outperform larger ordinary ships.
5. Make active scans useful but detectable.
6. Enlarge systems through purposeful destinations: lanes, belts, relays, wrecks, research sites, restricted facilities and anomalies, rather than empty distance.
7. Vary arrival points by route and local conditions, preserve fleet spacing and retain an exit path.
8. Later add independently addressable deep-space locations — **out of this phase**.

Acceptance must check both **player and NPC** knowledge, including minimap/tooltips/selection leaks, loss of lock, and first-frame cloak visibility.

**Exit condition (plan §4):** Hidden objects stay hidden across UI and AI; lost tracks stop exact targeting.

**Proposed first-release decisions:**

| Question | Proposed answer |
| --- | --- |
| What is the first playable slice? | One per-observer contact book, cloak initialized before first consumer, four info layers, decaying tracks that drop firing solutions, role/equipment/age/power/damage sensor variance (science can beat a larger ordinary hull), detectable active scans, stub purposeful destinations in the loaded system, and arrival that varies by route/local conditions while keeping escort spacing and an exit. |
| Where does the book live? | `state.contactBook` (name can change), saved like `incidentLedger` / `objectiveBoard`. **Never** inside `systemStates`. |
| Who is an observer? | Player flagship, each NPC hull (`securityInstanceId`), and each station that already fires or reports. Same information rules on both sides (plan §1). |
| Does a Phase 4/5 report grant a live lock? | **No.** A delivered report may seed detection + last-known **area**. It does not set `firingSolution`. |
| Does first-slice activate Phase 3 `unknown` access enforcement? | **No.** Unidentified contacts become real sensor facts. `unknown` access stays stored and unenforceable until a later scoped slice (plan §5: define unidentified contacts **before** activating `unknown`; do not silently use hidden identity). |
| May the first engine slice stub destinations? | **Yes.** Markers / destination records for lanes, belts, relays, wrecks, research sites, restricted facilities and anomalies. No independent deep-space `locationId` that can be warped to without loading a system. |
| Catalog wire / Phase 7 fleet orders? | **Out**, except arrival spacing and retaining an exit path. |
| Clock for decay / search / cloak duration? | Phase 3 **`localElapsedMs`** (and cloak remaining on that clock). Not `performance.now()` as a persisted deadline (plan §13 saved-timer reccheck). |

These are recommendations for this phase, not new decisions attributed to the user. Locked bake-off constraints take precedence over older flavor copy that treated cloak as a player-only fade and scans as silent hail text.

## 2. Locked constraints (do not reopen)

The bake-off team locked these before this brief. Implementation and probes must treat them as **hard gates**. Referee / One score this brief against these eight **before** any engine PR.

### Hard gate 1 — First-frame cloak

> Cloak state is initialized **before** the first render, minimap, target list, or AI acquisition. There is **no** first-frame leak.

A hull that is cloaked on spawn, scene apply, escort materialize, ambient arrival, load, or new-game start must already be cloaked **before** `drawMinimap`, `updateTargetWindow`, click-select, cycle/closest contact, `updateNpcShips`, station defenses, or `consultDoctrineFire` can see it. Setting cloak on the next tick is a fail.

### Hard gate 2 — Info layers

> Distinguish **detection**, **identification**, **track quality**, and **firing solution**. An old report is **not** a live lock.

These are different fields. Detection-without-identification is a legal contact. Identification-without-a-firm-track is not a firing solution. A Phase 4/5 `lastKnown` / overdue report is historical.

### Hard gate 3 — Hidden stays hidden

> Cloaked or unknown contacts must **not** leak via UI (minimap, tooltips, selection, target window, scan flavor) or NPC AI knowledge.

If the observer does not have detection, the subject is absent from that observer’s minimap, click-select, cycle lists, hail/scan chrome, and AI acquisition. Hull art, faction color, name, and attitude are identification — they must not appear on a detection-only contact.

### Hard gate 4 — Lost tracks

> Contacts decay into **last-known areas**. Searches consume **time** and **can fail**. Lost tracks **stop exact targeting** and **stop a firing solution**.

A stale contact may leave an area marker. It must not keep `combatTargetId`, auto-aim, tracking projectiles, or `liveWeaponTrack` as if the hull were still locked.

### Hard gate 5 — Sensor variance

> Sensors vary by **role**, **equipment**, **age**, **power**, and **damage**. A **science specialist** can outperform a **larger ordinary** ship.

Hull mass / class alone does not win. A damaged battleship with no science fit can lose to a smaller science hull that still has power and sensors.

### Hard gate 6 — Active scans

> Active scans are **useful** and **detectable**.

Useful: they can raise identification and/or track quality beyond the observer’s passive capability. Detectable: other observers with detection of the scanner (or of the scan emission) can know a scan happened. A silent, omniscient hail-range dump is a fail.

### Hard gate 7 — Purposeful system space (first slice)

> Enlarge the loaded system through **purposeful destinations** — lanes, belts, relays, wrecks, research sites, restricted facilities, anomalies — rather than empty distance. First engine slice **may stub destination markers**. Independently addressable deep-space locations stay **later** (plan §8 “Later add…”).

Do not “fix” space by stretching `SYSTEM_W` / `SYSTEM_H` with nothing in it. Do not require a wreck outside Romulan space to be a separate warp-to address in this phase.

### Hard gate 8 — Arrival / exit

> Arrival varies by **route** and **local conditions**. **Fleet spacing** is preserved. An **exit path** is retained.

Escorts must not stack on the flagship. The player must still be able to leave (warp, wormhole, or the Phase 3 withdrawal path when a checkpoint is active).

Also preserve, without reopening:

- Plan §1: player and NPC sensors, communications and weapon gates follow the **same information rules**.
- Authority is a political side (`isSystemControlled`), not a flown flag.
- Two ROE modes unchanged. Access is a permission, not a ceasefire.
- Phase 1 combat credit: only `player` / `playerEscort` final hits reward or blame.
- Phase 3 refusal / inability remain non-aggression. Phase 3 `unknown` access stays stored, not silently enforced from hidden identity.
- Phase 4 `protect` fold (S6.13), FLASH append-only (S6.14), and punishment tokens stay closed.
- Phase 5 close-once / overdue ≠ destroyed ≠ attacker stay closed.
- Culture cannot grant fire permission.
- `engagement_authorized` is never injected as a world fact.
- Soft authored breakaway profiles and `bm-ships/` catalog wire stay **out**.

### Process locks (implementation locks, not a change to gates 1–8)

- **Proposal first.** Do not implement from this text until Tenth scopes the engine lane after a brief Pass.
- **Blind bake-off.** Implement from `docs/` only. Do not crib `Artemis2028/BM1-remastered-work`.
- **No invented balance numbers** as locked constants. Layer *shape* and variance *axes* are locked; example ranges in §7 are recommendations.
- **§13 saved timers:** cloak remaining, track freshness, and search clocks must not persist `performance.now()` as a meaningful deadline. Use `localElapsedMs` (and strategic jumps only where a report already does).
- **§13 first-frame:** the table does not list a separate cloak row. First-frame is **this** phase’s gate 1, from plan §8, not a new backlog invention.

## 3. Cloak before first consumer

**Lane owner (wording):** Number Four (gate 1).

Cloak is simulation truth on the hull. Visibility is per-observer knowledge (gate 3). The first-frame rule is about **initialization order**, not about making the player omniscient.

### 3.1 When cloak must already be set

| Moment | Required order |
| --- | --- |
| `createNpcShip` / authored spawn | Cloak fields written on the object **before** it is pushed to `state.npcShips` or a system-state cache that `applySystemState` will copy. |
| `applySystemState` | Realize cloak on every traffic / fleet / escort hull **before** the function returns. `render` currently calls `drawMinimap` and `updateTargetWindow` immediately after travel completes. |
| Escort / fleet materialize | `getPlayerEscortNpcShips` / `getPlayerFleetNpcShips` write cloak before the spread into `state.npcShips`. |
| `beginAmbientTrafficArrival` | New instance gets its **own** cloak init. It does not inherit the previous slot’s visibility, contacts, or target lock. |
| `loadGame` / `resetRunState` / new game | Restore or reset cloak, then restore the contact book, **then** the first `render` / `tick`. Do not paint, then cloak. |
| Player device toggle | `setPlayerCloak` updates truth **before** the next minimap / target / AI read in the same frame. |

A probe that starts a cloaked fixture and reads minimap/target/AI on the **first** frame after apply must see hidden, not a one-frame flash.

### 3.2 What cloak is (first slice)

Cloak is a hull/device state: `active`, remaining duration on the **local** clock, and fade only as a **presentation** of an already-hidden contact — not a leak window.

- Player cloak already exists as `state.cloak` and already drops some player-as-target AI. First slice must extend the **same rules** to NPC cloak and to every UI consumer, not only `updateNpcShips`’s `playerCloaked` branch.
- An observer who has **not** detected a cloaked hull has no contact. They do not get a “cloaked blip” unless a later EW slice (Phase 9) defines one.
- Firing, tractor, and hail at a cloaked hull the observer cannot detect are denied. Firing **breaks** the firer’s own cloak (existing player behavior may stay); it does not reveal a *different* cloaked hull.
- Fade-in/fade-out must not temporarily add the hull to another observer’s minimap, target list, or AI acquisition.

### 3.3 Player-facing reasons

- `Cloak initialized before sensors painted. No first-frame contact.`
- `Warbird is cloaked. It is not on your minimap, target cycle, or escort acquisition.`
- `Your cloak collapsed. Contacts that already had a track may re-acquire; others still have to detect you.`

If the first painted frame can name, click, or hunt a cloaked hull, the gate is not ready.

## 4. Info layers (detection ≠ identification ≠ track ≠ lock)

**Lane owner (wording):** Number 2 (gate 2) with Number Four on the live-track fields.

This is the scoring surface that makes plan §8 “distinguish…” and plan §1 “same information rules” executable. It reuses Phase 4 report vocabulary; it does not invent a second knowledge religion.

### 4.1 Four layers

| Layer | Means | Does **not** mean |
| --- | --- | --- |
| **Detection** | The observer has a contact: something is there. | Name, faction, class, attitude, cargo, or a fire gate. |
| **Identification** | The observer knows who/what (partial or known). | A live position lock. Hull art is not a transponder (Phase 3 `broadcast.source` still applies). |
| **Track quality** | How fresh and precise the position/heading estimate is (`none` / `area` / `coarse` / `firm`). | Permission to fire. A firm track can still lack identification. |
| **Firing solution** | A **live** lock sufficient for exact targeting (`liveWeaponTrack`, auto-aim, tracking shots). | An old report, an area search, or “we know they exist.” |

An old Phase 4 report / Phase 5 `lastKnown` may create or refresh **detection** and an **area** track. It must leave `firingSolution === false` until a live sensor pass earns it.

### 4.2 Proposed contact shape

Exact names can change in review:

```js
{
  contactId: 'ctc-1',
  observerKey: 'player',          // or `npc:${securityInstanceId}` / `station:${id}`
  subjectKey: 'npc:vis-12',       // stable instance, never recycled npc.id
  detected: true,
  identification: 'none',         // none | partial | known
  trackQuality: 'area',           // none | area | coarse | firm
  firingSolution: false,
  cloakTruthKnown: false,         // observer does not learn cloak from a hole in the map
  lastKnown: { x, y, radius, atLocalMs },
  freshnessLocalMs: 0,
  source: 'passive',              // passive | active_scan | report | visual
  scanEmission: null              // see §8
}
```

Keep **simulation truth** on the hull (`cloak.active`, real x/y, real faction). Keep **observer evidence** on the contact. A disappearance from the observer’s book is not a destruction incident (Phase 5 gate 3 still closed).

### 4.3 Store

```js
state.contactBook = {
  version: 1,
  nextContactId: 1,
  observers: { /* [observerKey]: { contacts: { [contactId]: record } } */ }
};
```

Serialize beside `incidentLedger` / `objectiveBoard`. Initialize on `resetRunState` / new game. Sanitize enums, IDs, and clocks. Old saves start empty: **no** inherited omniscience.

**Never** persist the book inside `systemStates`. Ambient `npc.id` reuse must not transfer contacts (same family as Phase 3/4/5).

**Bounds (starting proposal):** 32 contacts per observer, 24 observers retained. Drop **stale** contacts first, never a live `firingSolution` in order to hide a leak.

## 5. Hidden stays hidden

**Lane owner (wording):** Number 2 (gate 3) with Number Four on each consumer.

Plan §8 acceptance: minimap / tooltips / selection leaks, both player and NPC knowledge.

### 5.1 UI consumers that must ask the book

Today these iterate `state.npcShips` / living hulls with no knowledge gate. First slice must filter by **that viewer’s** contacts:

| Consumer | Hidden rule |
| --- | --- |
| `drawMinimap` NPC dots | No detection → no dot. Detection-only → unclassified mark, not faction color. |
| `findNpcAtScreen` / click-select | No detection → not selectable. Identification-none → no name/faction/attitude in the lock line. |
| `cycleCombatTarget` / `selectClosestContact` / `cycleAllContacts` | Only detected contacts. “No contacts in this system” must not mean “I secretly counted cloaked hulls.” |
| `updateTargetWindow` / hail / scan chrome | Identification-none: no hull name, faction, government, or invented cargo. Firing-solution-false: no “Target locked” exact-fire copy. |
| Tooltips / `title` / callouts / `setLog` lock lines | Same layers. A tooltip that names a cloaked warbird is a leak. |
| Scan report | Only what the scan earned (gate 6). `buildShipScanReport` flavor cargo / government is **not** identification. |

The player’s **own** cloak may still show a local fade on the player sprite (the player knows they cloaked). That is not permission to show other cloaked hulls.

### 5.2 AI / weapon consumers

| Consumer | Hidden rule |
| --- | --- |
| `updateNpcShips` acquisition | An NPC only hunts what **it** has detected. Player cloak already clears some `destinationName === 'player'` paths; NPC cloak and unknown contacts must use the same book. |
| Escorts / defense / self-defense | Player-side ships are observers. They do not inherit the player’s contacts for free unless a later comms slice (Phase 7/9) delivers a report. First slice: flagship sensors are **not** a telepathic fleet net. Escorts may share the flagship book **only** while in formation and only as **detection / last-known**, not a gifted firing solution. |
| `updateStationDefenses` | Stations skip hulls they have not detected. Current code already skips a cloaked **player** for station fire; it still picks any living NPC in range. |
| `consultDoctrineFire` / `liveWeaponTrack` | `liveWeaponTrack` is **firing solution**, not detection. Cloak or a lost track must set it false. |
| `getCombatTarget` / auto-target | Cannot lock a hull the player has not detected, and cannot keep a lock after `firingSolution` drops. |
| Phase 4/5 `evaluateReact` | Still from observer copies. A cloaked hull is not `event_known` just because it is in `state.npcShips`. |

### 5.3 Same rules both sides (plan §1)

If the player cannot see a cloaked NPC on the minimap, an NPC cannot see a cloaked player (or another cloaked NPC) on its acquisition list. If a science NPC can detect the player, the player with equal or better sensors can detect that NPC. Do not special-case “player UI is omniscient, AI is honest.”

## 6. Lost tracks and failed searches

**Lane owner (wording):** Number Four (gate 4).

### 6.1 Decay

Track quality decays on `localElapsedMs` while the observer lacks a fresh passive or active update:

```text
firm  → coarse  → area  → none
firingSolution requires firm (or an explicit first-slice equivalent)
when quality drops below firm: firingSolution = false
when quality is area or none: exact targeting stops
```

`lastKnown` becomes an **area** (center + radius), not a moving hull. Radius may grow as the track ages. The hull’s true position may leave the area; that is expected.

A Phase 4 investigate objective may still steam to `lastKnown`. That is a **search**, not a lock (already stated in Phase 4/5). It must not set `attackId` or `liveWeaponTrack`.

### 6.2 Search

A search is a timed local action (tactical clock). It costs time. It can fail.

| Result | Effect |
| --- | --- |
| Success | May raise track quality and/or identification from what sensors actually earn at the search point. |
| Fail | Area remains; no invented coordinates; no attacker ID; no firing solution. |
| Clock exhausted | Search ends. Contact may stay as `area` or drop to `none`. |

Do not spawn a free scout because a search failed (Phase 4/5 spawn rule still closed).

### 6.3 Exact targeting stops

When `firingSolution` is false:

- Player auto-target / `getCombatTarget` must not treat the hull as a live aim point.
- Tracking projectiles already in flight may go inert or fly last heading; they must not keep home-on-truth for a lost track.
- NPC `fireNpcWeapon` / station fire / escort priority must drop that subject.
- The target window may keep an **area** contact (“last known, lock lost”) but must not read as a live lock.

### 6.4 Player-facing reasons

- `Lock lost. Last known is an area, not a firing solution.`
- `Search failed after the dwell. Contact remains overdue-area only.`
- `Old convoy report is not a live track.`

If the UI cannot say that a lost track is not a lock, the gate is not ready.

## 7. Sensor variance

**Lane owner (wording):** Number Four (gate 5), Number 2 on the science-specialist wording.

### 7.1 Axes (locked)

Capability is a function of **all five** axes, not hull size alone:

| Axis | First-slice source (recommendation) |
| --- | --- |
| **Role** | Doctrine/runtime role (`patrol`, `explorer`, `science`, `traffic`, …) and `formatShipClass` / visual class. A science role is a specialist. |
| **Equipment** | Fitted sensors / science devices if present; otherwise a role default. Do not treat `buildShipScanReport` as a manifest. |
| **Age** | Existing hull age / condition field if one exists; otherwise a stored `sensorAge` on the contact-capable actor (recommendation, not a locked formula). |
| **Power** | Current energy / power distribution. Low reserve already collapses player cloak; low power must also shrink sensor reach / quality. |
| **Damage** | Hull/subsystem damage. A battered science ship may fall back to ordinary; a fresh science specialist may still beat a larger undamaged cruiser. |

**Locked outcome:** there exist fixtures where a **smaller science specialist** detects or identifies a contact that a **larger ordinary** ship (same range, worse role/equipment) misses. Probes assert that **ordering**, not a magic range number.

### 7.2 What not to invent

- No fifth OPS tank unless Tenth later scopes a sensors slider. First slice may read existing reserve/energy and damage.
- No catalog wire of 212 hulls to assign sensor stats.
- No EW (jamming, ghosts, fire-control interference) — Phase 9.

## 8. Active scans

**Lane owner (wording):** Number Four (gate 6).

### 8.1 Useful

An active scan, in range, may:

- raise `identification` (none → partial or partial → known) **and/or**
- raise `trackQuality` (area/coarse → firmer),

subject to the scanner’s variance (gate 5) and the target’s cloak. A cloaked target may remain undetected; the scan is then useful-but-empty, not a leak.

Active scan is **not** a real cargo inventory. Phase 4/5 already forbade treating `buildShipScanReport` flavor as a manifest. That stays closed.

### 8.2 Detectable

Performing the scan writes a short-lived **scan emission** on the scanner (local clock). Any other observer who has **detection** of the scanner, or who can detect the emission with their own sensors, learns that an active scan occurred (and may gain detection of the scanner if they had none).

It does not:

- reveal the scanner’s cloak-hidden friends,
- erase a Phase 4 report (Phase 9 EW note: an already-delivered report is not erased by later jamming — out of scope, do not invert it here),
- authorize fire,
- pulse FLASH as a new offense.

### 8.3 Player-facing reasons

- `Active scan: identification raised to partial. Emission detectable.`
- `Scan detected by the science ship. They know they were painted.`
- `Scan found nothing. Cloaked contact (if any) stayed hidden.`

## 9. Purposeful system space (first slice)

**Lane owner (wording):** Number Four (gate 7).

### 9.1 Destinations, not empty distance

Plan §8 enlarges systems by **placing reasons to go**, not by stretching the clamp box.

First-slice catalog (stub markers allowed):

| Kind | Purpose in the loaded system |
| --- | --- |
| `lane` | Existing traffic / transfer lanes become named destinations, not only AI wander points. |
| `belt` | Asteroid field / belt as a place, not only harvest dots. |
| `relay` | Communications / navigation relay marker. |
| `wreck` | A wreck **in this system** (stub). Not a deep-space address. |
| `research` | Research site marker. |
| `restricted` | Restricted facility marker (may sit near a Phase 3 zone; it does not rewrite ROE). |
| `anomaly` | Anomaly marker. |

These may be `state.systemDestinations` (name can change) realized in `ensureSystemState` / `applySystemState`, drawn on the minimap as **places**, and usable as traffic / escort / search destinations.

### 9.2 What stays later

Independently addressable deep-space locations — “a wreck outside Romulan space should not require loading Romulus” — remain the plan §8 **Later add**. First slice must not pretend a stub wreck is a new galaxy `locationId` you can plot without a system.

Do not require Phase 10 hidden-Dominion map rules here. Do not require Phase 7 hold-outside-boundary except as “spacing + exit” (gate 8).

## 10. Arrival and exit

**Lane owner (wording):** Number Four (gate 8).

### 10.1 Vary arrival

| Today | Phase 6 first slice |
| --- | --- |
| Inter-system warp: `setCameraNearPlanet` (checkpoint approach if a foreign zone is active, else a fixed planet offset) | Offset by **inbound route** (from-system bearing / plotted-leg direction) **and** local conditions (checkpoint still wins when Phase 3 says so; otherwise lane, belt, or a stub destination on the approach side — not always the same planet corner). |
| Wormhole: `wormhole + (90, 60)` or planet fallback | Keep a wormhole-adjacent drop, but do not stack the fleet on one pixel; apply spacing (below). |
| Same-system warp | Not a new strategic jump (Phase 5). Arrival offset may still apply locally; it must not tick the Phase 5 clock. |

Local conditions include: active checkpoint, nebula flag, traffic density at the drop, and whether a purposeful destination sits on the inbound bearing. Do not invent a second galaxy distance formula.

### 10.2 Preserve fleet spacing

`getPlayerEscortFormationPoint` already rings escorts around the player. After arrival apply, escorts must land on **formation points**, not on the flagship origin. Fleet ships that are in-system but not escorts keep their existing spacing rules; this slice does not add Phase 7 hold/rally orders.

### 10.3 Retain an exit path

Every authored / generated drop must leave at least one of:

- a warp-capable heading back to the plotted inbound lane,
- a wormhole approach if a wormhole exists,
- the Phase 3 withdrawal / approach path when a checkpoint is active.

Do not spawn the player inside a closed pocket with no legal withdraw (Phase 3 already forbids decorative checkpoints). A restricted-facility stub must not delete the exit.

## 11. Acceptance exercises (S9)

Keep all existing Phase 1 / S4 / S5 / S6 / S7 / S8 / doctrine gates green. Add S9 fixtures that fail setup if a required cloaked hull, observer, destination stub, or contact book is missing. Classification-only asserts are insufficient for first-frame, leaks, and loss of lock.

Number Three owns the probe gate **after** engine, not this brief. IDs are a sketch; do not promise a final count.

| Case | Required exercise and result |
| --- | --- |
| **S9.1** First-frame cloak | Spawn or apply a cloaked NPC (and, separately, a cloaked player if the fixture starts cloaked). On the **first** frame after apply — before a second tick — player minimap, target cycle, click-select, and NPC/station AI acquisition must not see the cloaked hull. A one-frame flash is a fail. |
| **S9.2** Info layers | Same hull: detection-only contact has no name/faction. Identification-without-firm-track has no `firingSolution`. A Phase 4/5 report seeds last-known **area** only; `firingSolution` stays false. |
| **S9.3** Hidden stays hidden (player UI) | Cloaked or undetected hull: absent from minimap dots, tooltips, selection, target window, and scan chrome. No faction color leak. |
| **S9.4** Hidden stays hidden (NPC AI) | Ignorant NPC / station does not acquire, hail, or fire at a cloaked/undetected player or NPC. A knowing observer (earned detection) may. Same book rules both sides. |
| **S9.5** Lost track drops lock | Establish a live firing solution, then age the track past firm (or inject decay). `firingSolution` false; auto-target / NPC fire / tracking home-on-truth stop. Last-known area may remain. |
| **S9.6** Search costs time and can fail | Start a search on an area contact. Before the dwell completes, no free re-lock. Inject fail → still no firing solution, no invented coordinates. |
| **S9.7** Sensor variance / science specialist | Fixture a science specialist and a larger ordinary hull against the same cloaked or distant contact. Science detects or identifies; ordinary does not (or does worse). Damage or power drop on the science hull can reverse that. |
| **S9.8** Active scan useful + detectable | Passive miss, then active scan: identification or track quality rises **or** honestly finds nothing. A second observer with detection of the scanner records the emission. Scan is not a silent omniscient cargo dump. |
| **S9.9** Purposeful destinations, not empty stretch | Loaded system exposes stub or real markers for at least two of: lane, belt, relay, wreck, research, restricted, anomaly. No new independently addressable deep-space `locationId`. `SYSTEM_W`/`SYSTEM_H` is not the enlargement. |
| **S9.10** Arrival varies; spacing; exit | Complete warp from two different origins (or inject two inbound bearings). Drop points differ. Escorts are on formation points, not stacked on the flagship. An exit (warp, wormhole, or Phase 3 withdraw) remains. Checkpoint-present systems still use the Phase 3 approach when that rule applies. |
| **S9.11** Load / ambient reuse | Save with a contact book + cloaked hull. Wipe `systemStates`. Reload. Cloak still initialized before first paint. Replacement `npc.id` does not inherit the old contact or leak. |
| **S9.12** Phase 1–5 / side-lane still hold | After Phase 6 writes: refusal still not aggression; `protect` still folds; overdue still ≠ destroyed ≠ attacker; lounge+contract coexist; no catalog wire; `unknown` access still not silently enforced from hidden identity; Phase 5 clock still ticks only on completed jump. |

Each case may contain multiple assertions. Include startup smoke. Do not claim a Referee Pass from this list.

## 12. Non-goals

Phase 6 will not:

- Implement Phase 9 EW (jamming, deceptive contacts, fire-control interference, communications disruption) or the Phase 9 weapon matrix. Deferred; may be noted only.
- Add independently addressable deep-space locations (plan §8 “Later add…”).
- Wire the `bm-ships/` catalog or ship authored breakaway doctrine profiles.
- Implement Phase 7 fleet hold / rally / follow / escort-out-of-boundary beyond **spacing** and **exit** on arrival.
- Activate Phase 3 `unknown` access enforcement, or infer nationality from hull art.
- Treat `buildShipScanReport` flavor as a real cargo inventory.
- Soft-reset Phase 5 urgency, retune unrest, or invent a second civilian sim.
- Double-charge standing or invent an attacker from a lost track or a failed search.
- Key contacts by recycled `npc.id` or store them in `systemStates`.
- Persist cloak / track / search deadlines on `performance.now()`.
- Gift the whole fleet a firing solution from the flagship book.
- Stretch empty `SYSTEM_W` / `SYSTEM_H` and call it system space.
- Enable `protect-all`, boarding combat, warning shots as damage, or new alliances.
- Touch `Artemis2028/BM1-remastered-work`.
- Claim a Referee Pass in `docs/BAKEOFF-STATUS.md`.

## 13. Implementation sequence and handoff

1. **Brief Pass.** Referee / One score the **eight** hard gates. Number Four scores gates 1, 4, 5, 6, 7, 8 wording (init order, decay/search, variance, scans, destinations, arrival). Number 2 scores gates 2–3 (layers; hidden knowledge; same rules both sides) and the “old report is not a lock” contract. Do not open an engine PR on this document alone.
2. **Tenth scopes the engine lane** after Pass. Blind implement from `docs/` only.
3. **Suggested order if scoped:** cloak init on all spawn/apply/load paths (S9.1, S9.11) → contact book + four layers (S9.2) → UI/AI consumers (S9.3–S9.4) → decay / search / drop lock (S9.5–S9.6) → variance + science fixture (S9.7) → active scan emission (S9.8) → destination stubs (S9.9) → arrival bearing + escort spacing + exit (S9.10) → regression (S9.12).
4. **Number Three** adds/runs S9 after engine. Keep Phase 1 / S4–S8 green.
5. Changelog / status Pass wait on Referee after review. This proposal PR may note that the brief is open; it must not write a Pass.

If one model implements a later slice, reserve a separate review pass. Fable can edit sensor/journal copy after the paths work.

## 14. Open questions

Mark these clearly. They do **not** weaken the hard gates.

| ID | Question | Default if engine is scoped before an answer |
| --- | --- | --- |
| Q1 | Which authored system is the first cloak + destination fixture? | Romulan or Vulcan plus one probe-injected cloaked hull and two destination stubs is enough. |
| Q2 | Exact decay times / scan ranges / science bonus? | **TBD.** S9.5–S9.7 assert ordering and layer drops, not a constant. |
| Q3 | Do escorts share the flagship contact book? | **Detection and last-known only**, while in formation. No gifted firing solution (see §5.2). |
| Q4 | Does player cloak persist across warp? | **No** for first slice unless a fixture starts cloaked after apply. Init-before-paint still applies on the far side. |
| Q5 | May a restricted-facility stub issue a Phase 3 order? | **No.** Marker only. Checkpoints stay on existing zones. |
| Q6 | Does an active scan FLASH? | **No.** Detectable to sensors, not a new offense pulse. |
| Q7 | When does `unknown` access become enforceable? | **Later.** Phase 6 defines unidentified contacts; it does not flip the Phase 3 lock. |
| Q8 | Deep-space wreck address? | **Out.** Stub in-system only. |
| Q9 | Split engine PRs (cloak+book vs space+arrival)? | Tenth decides after Pass. Gates stay separable. |
| Q10 | Sensor presentation UI (plan §15 later decision)? | First slice may reuse minimap + target window. A dedicated sensor pane is **not** required to close the gates. |

## 15. Lanes

| Who | Owns | Scores |
| --- | --- | --- |
| **Number Four** | Gates **1, 4, 5, 6, 7, 8** wording (first-frame init; decay/search/drop-lock; variance axes; useful+detectable scans; destination stubs; route-varied arrival, spacing, exit) | Cloak set before first consumer; lost track ≠ exact targeting; science can beat larger ordinary; scan emission exists; no empty-distance enlarge; escorts spaced; exit retained |
| **Number 2** | Gates **2–3** (four layers; old report ≠ live lock; hidden across UI and AI; same information rules both sides) | Detection ≠ identification ≠ track ≠ firing solution; no minimap/tooltip/selection/AI leak; player and NPC knowledge match |
| **Number Three** | Probe gate **after** engine (S9 on `__BM1_PROBE__` / offline tests) | Not this brief |
| **Referee / One** | This brief vs the **eight hard gates** in §2 | **Before** any engine PR |

## 16. Deferred work remains on the plan

Phase 7 should persist richer fleet orders (hold outside a boundary). Phase 8 should take finite markets. Phase 9 should take EW and the weapon matrix. Independently addressable deep-space locations remain the §8 later add. Activating `unknown` access waits until unidentified contacts are real **and** a later slice explicitly scopes enforcement.

Whether *later* phases ever grant a shared fleet firing solution over comms is a future proposal. It is **out of scope** here. The locked rule stands: hidden stays hidden, and an old report is not a live lock.

Phase 6 is ready to score when a reader can mark Pass/Fail on all eight gates: first-frame cloak; four layers; hidden across UI and AI; lost tracks drop exact targeting; sensor variance including science specialists; active scans useful and detectable; purposeful destinations not empty distance; arrival varies, spacing holds, exit remains.

## Sources and precedence

- Plan §4 Phase 6 exit and §8 Sensors, cloak and system space: `docs/revised-development-plan.md`.
- Plan §1 same information rules for player and NPC sensors / communications / weapon gates.
- Plan §5 unidentified contacts before activating `unknown`; do not silently use hidden identity.
- Plan §13 saved-timer reccheck (page-relative timestamps) — applies to cloak/track/search clocks; no separate first-frame row is listed there.
- Doctrine knowledge / `lastKnown` is historical: `docs/doctrine/DESIGN-doctrine-v0.2.1.md`.
- Phase 3 `broadcast.source` and reserved `unknown` access: `docs/phase3/BM1-PHASE3-HOLDING-ZONES-AND-COMPLIANCE-PROPOSAL.md`.
- Phase 4 reports / lastKnown / not a live lock: `docs/phase4/BM1-PHASE4-INCIDENTS-ESCALATION-ALERTS-PROPOSAL.md`.
- Phase 5 lastKnown / overdue ≠ lock: `docs/phase5/BM1-PHASE5-PERSISTENT-CONVOY-DISTRESS-PROPOSAL.md`.
- Bake-off process: `docs/BAKEOFF-STATUS.md` (this PR may note the brief is open; no Pass claimed).

Settled Phase 1–5 behavior, the side-lane hard gates, and these eight Phase 6 gates take precedence over older flavor that treated cloak as a player-only fade, scans as silent hail text, or system size as an empty clamp box.
