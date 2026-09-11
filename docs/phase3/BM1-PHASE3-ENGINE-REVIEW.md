# BM1 Phase 3 proposal: engine review

**Reviewed document:** `BM1-PHASE3-HOLDING-ZONES-AND-COMPLIANCE-PROPOSAL.md`
**Reviewed against:** `Artemis2028/BM1-remastered-work` at `9e95626` (head of `fix/manhunt-range-kill-attribution`, 61/61 probe). All line numbers below refer to `src/main.js` at that commit.
**Method:** read the engine paths the proposal depends on; booted the real game headless and dumped the geometry of four systems (Ferenginar start, Vulcan, Earth, Qonos) to check the proposed zone numbers against actual station, planet and lane positions. No engine changes made.

## Verdict in one paragraph

The proposal's model is right: authority by side, access as permission rather than ceasefire, one encounter per entry episode, evidence never manufactured from refusal, separate ledger with its own clock. Every engine claim it makes about identity and persistence checks out. Its geometry does not: the numbers were written for a system shaped like `SYSTEM_W × SYSTEM_H`, and real systems are not shaped like that. It also has one hole that makes the whole encounter decorative: the player arrives inside dock range of the planet and planet docking is ungated, so at Vulcan the player can ignore the checkpoint entirely and lose nothing. Fix the geometry model (planet-centred zone, markers stored relative to the zone centre), give clearance one concrete effect (docking and services at the authority's installations), do the small Phase 2 evidence fix first, and the rest of the plan can go to the writer as written.

## What checks out

These are the proposal's load-bearing engine claims. All confirmed.

| Claim in proposal | Engine fact |
|---|---|
| Ambient replacement reuses `npc.id` (§8) | `beginAmbientTrafficArrival` (13127) `Object.assign`s the replacement onto the same object; `id` is never touched. |
| Saves keep neither `systemStates` nor runtime NPCs (§8) | `saveGame` (9155) writes neither key. `loadGame` (9233) wipes `state.systemStates` and sets `activeFleetAttack = null`. |
| Docking does not stop NPC simulation (§8) | `tick` (13408) early-returns only for warp and wormhole transit, then calls `updateNpcShips` regardless of `state.docked`. |
| Arrival logic immediately picks a new destination (§6) | `updateNpcShips` (13243): at `distance < 34` a non-combat NPC picks the next lane, sets `waitUntil` 450 to 1750 ms and increments `leg`. A bare destination coordinate is overwritten within one tick of arrival. |
| `systemStates` is invalidated outside travel (§8) | Seven wholesale wipes: data loads (2836, 3869), `syncPlayerBuiltStationDefinitions` (7621, runs on load and on every build), station rebuild (7798), wormhole build (8116), `loadGame` (9337), `resetRunState` (16841). A ledger inside the cache would not survive building a station. |
| Authority is `isSystemControlled`, not `hasFactionAccessAt` (§2) | `isSystemControlled` (6814) is `getSystemControl(i).playerControlled`; `hasFactionAccessAt` (6820) is the commercial privilege. `getEffectiveSecurityPolicy` (4729) already returns `null` without control. |
| Roles `traffic` and `localTraffic` exist (§6) | Assigned in `ensureSystemState` (2326). `isAmbientTrafficWarpEligible` (13093) restricts departures to exactly these two roles. |
| Tractor and engine-disable preempt movement (§6) | Both branches at the top of `updateNpcShips` `continue` before any destination logic and overwrite `npc.destination` with the current position. |
| Ships and stations orbit (§3) | `updateSystemOrbits` (2456) moves every station each frame; `withStationOrbit` (1534) forces planet-anchored stations to at least 115 units and star-anchored to at least 430. |

One more that the proposal relies on implicitly: there is no simulation clock. Every timer in the engine (`waitUntil`, `playerAggroUntil`, `lastAggressionAt`, `ambientWarpAt`, orbits) is `performance.now()`, and `loop` (17179) computes `frameScale` as wall-clock delta clamped to 0.25 to 2.5. When the tab is throttled, movement slows but the timers do not. The proposal's insistence on advancing deadlines from the simulation delta is the correct call and it is available: `tick(frameScale)` already receives it, so `localElapsedMs += frameScale * 16.6667` is the whole clock. Say explicitly that this is the first engine timer not on `performance.now()`, because the writer will be tempted to reuse `waitUntil` for the hold and then the dwell and the deadline run on different clocks.

## What does not check out

### 1. The geometry was sized for a map that does not exist

`SYSTEM_W = 2600` and `SYSTEM_H = 1800` (lines 18 to 19) are the clamp box for traffic lanes, not the extent of the system. Measured positions at `9e95626`:

| System | Planet | Farthest station from star | Stations within 500 of the planet |
|---|---|---|---|
| Ferenginar (start, player-held) | (1041, 2034) | 2626 (Grand Nagus Private Lot, at y = 3505) | 4 of 9 |
| Vulcan | (309, 1605) | 2334 | 3 of 6 (J'lin Center 184, U of Vulcan 179, V'Pek Tar 345, all planet-anchored) |
| Earth | (437, 2028) | 3071 (Alpha Array at (-1552, 17)) | 8 of 18 |
| Qonos | (2370, 314) | 2851 (Plex at y = -1435) | 5 of 14 |

Consequences for the proposed numbers:

The 500-unit perimeter around a planet-anchored station swallows the planet, the other planet-anchored stations and most of the local lanes. At Vulcan a zone on J'lin Center contains the planet (184), U of Vulcan (294), and the approach lanes of J'lin, U of Vulcan, VSU Dorms and Vulcan South U (215 to 460). Every local ship would be challenged on every leg. With `AMBIENT_TRAFFIC_WARP_NEXT_MIN_MS = 12000` and up to 20 traffic ships, that is a new encounter every few seconds at a busy holding.

Traffic lanes are clamped to 130..2470 × 130..1670 (`getTrafficDestinations`, 1561). A station outside that box gets an approach lane pinned to the nearest edge: Alpha Array sits at (-1552, 17) and its approach lane is at (130, 130), 1700 units away. A checkpoint on an outer station sees no traffic at all. The proposal's "one suitable station" rule needs to say: planet-anchored, live, owned by the authority.

Stations move faster than the hold tolerance allows. A station at orbit distance 430 with a 7-minute period (Tar'jel at Qonos) moves 6.4 units per second; the proposed 60-unit hold tolerance around a fixed point is broken by the anchor's own motion in under ten seconds. Planet-anchored stations are slower (J'lin Center: 184 units, 13 minutes, about 1.5 units per second) but still drift through a hold in under a minute. Markers must be stored as polar offsets from whatever the zone is centred on (angle, distance) and resolved each frame, never as absolute coordinates. The proposal says "carry its assigned markers consistently"; make it the stored representation, not an update rule.

Withdrawal points at "at least 650 from the anchor" will often land outside the lane box. Fine for physics (nothing clamps ship positions), but the NPC will then pick its next lane from `state.trafficDestinations`, which are all inside the box, and fly straight back through the zone. The proposal already forbids restoring the original destination; it should also require choosing the next lane from those outside the perimeter, or departing via `startAmbientTrafficDeparture`.

Recommendation: centre the zone on the planet, not on the station. The planet orbits the star on `PLANET_ORBIT_BASE_MS = 18,500,000` (hours per revolution), so planet-relative markers are effectively stable. The anchor station remains the issuing installation: it must be live, completed and owned by the authority for the checkpoint to exist, and its destruction ends the checkpoint (`checkpoint_unavailable`), exactly as proposed. Derive the radius from the authority's own planet-anchored installations rather than from a constant: measured distances are 179 to 345 at Vulcan, 355 to 413 at Ferenginar, 223 to 285 at Qonos and 292 to 584 at Earth, so no single number fits. Radius = farthest planet-anchored authority station + 60, floored at 300 and capped at 650, gives Vulcan about 405 and Earth about 645, which is the restrictive capital the handoff asks for. Holding point at roughly 70% of the radius on the visitor's approach bearing; withdrawal complete at radius + 80 with re-entry hysteresis at radius + 140. Treat those as tuning defaults to be checked in the probe with the real dump, which I can provide as a fixture.

### 2. The foreign encounter has no teeth

`setCameraNearPlanet` (2512) places the arriving player at planet size × (0.56, 0.34) from the planet centre: roughly 110 to 210 units (planet draw size is clamped to 170 to 315). `getPlanetDockDistance` (2907) is `max(126, size × 0.78)`: 133 to 246 units. The player arrives inside dock range of every planet in the game. `tryDockAtPlanetIndex` (8653) checks only distance; hostile systems, war flags and refused clearance do not stop planet docking. Station docking (`tryDockAtStation`, 11286) refuses only `hostile` stations.

So at the authored Vulcan checkpoint the player spawns inside the zone, already able to dock, and nothing in Phase 3 changes if they ignore the hail, refuse, or let the timer expire. The proposal is explicit that Phase 3 adds no consequences beyond recording noncompliance and defers force to Phase 4. That is right for weapons. It is wrong for access, because access is exactly what a checkpoint controls and the game already has a non-violent lever for it.

Recommendation, as a Phase 3 decision for Rafael, not something the proposal already says: while a visitor has a pending or noncompliant order at an active checkpoint, the authority's own installations refuse docking and services. For the player that means `tryDockAtPlanetIndex` and `tryDockAtStation` return false with the checkpoint's reason ("Hold at the marker for clearance" or "Withdraw from the restricted area") when the planet's controller or the station's owner is the checkpoint authority. Cleared, waived and withdrawn-then-re-entered-and-cleared visits dock normally. Concessions and private stations inside the zone are unaffected, which falls straight out of Phase 1 ownership: a Ferengi concession in Vulcan space still trades with you while Vulcan refuses you. For NPC visitors the equivalent is that a `closed` visitor's permitted destinations exclude the authority's installations, which the proposal already implies.

This also needs one arrival change or the player never sees the perimeter before being inside it: when a system has an active foreign checkpoint, place the arriving player at the zone's outer approach point instead of beside the planet. That is a three-line change in `completeWarpTravel` (10293) and it is the first concrete slice of the handoff's "vary jump arrival positions" item. Without it, "first observed inward crossing" never happens for the player and S5.8 can only test the "already inside" path.

### 3. Broadcast identity does not exist as separate data

§4 says to use "the visitor's available broadcast information" and never to infer nationality from hull art. In the engine, hull art is the only source. Traffic NPCs are created with `faction: 'neutral'` (2349) and then `applySystemState` (2379) sets `faction = getShipFaction(shipId)`, the manufacturer of the hull. There is no transponder field. `deriveNpcSideId` maps a `neutral` faction to `ship:<id>`, so a hull with no recognised builder is simultaneously "no declared allegiance" and "independent".

The classification table therefore cannot be implemented as written: the `unknown` row ("no identified broadcast is available") has no data to trigger it, and the `independent` row ("broadcast explicitly identifies independent status") would fire on every unbranded hull, which is a missing value being read as a declaration, the exact thing §4 forbids.

Recommendation: add `broadcast` to the encounter contact record with an explicit provenance: `{ faction, source: 'hull' | 'declared' | 'none' }`. In Phase 3 every NPC contact is `source: 'hull'` with `faction = npc.faction`, the player contact is `source: 'declared'` with the raised flag, and the authored custom-polity case supplies `declared`. Then define the rule honestly: a hull-derived `neutral` classifies as `independent` for this phase because nothing better exists, and `unknown` is reserved for `source: 'none'`, which no current spawner produces. That keeps the table but stops the document claiming a sensor model the engine does not have.

### 4. `refused` versus `ignored` is undefined for NPCs

§5 gives `refused` and `expired` for a visitor that declines. §6 says patrols and military ships "may ignore a hail" and that ignoring "does not make ignoring it an attack", but not whether it records noncompliance. If it does, every Klingon patrol crossing a `challenge` zone accrues a noncompliance record for doing its job, and Phase 4 will inherit a ledger full of them. If it does not, the writer has to invent the rule.

Recommendation: in Phase 3, issue orders only to `traffic` and `localTraffic` (the same set `isAmbientTrafficWarpEligible` uses), and record every other role as `not_addressed` with no order and no outcome. Player-side ships are exempt by side. This keeps the first slice inside the roles that already have voluntary navigation and leaves military response to Phase 4 where the doctrine pack defines it.

### 5. A pre-existing Phase 2 gap the identity layer would hide

`beginAmbientTrafficArrival` (13127) rewrites hull, name, faction, side, position, combat pools and warp state, and leaves untouched: `lastAggressionAt`, `lastAggressionTargetSide`, `lastAggressionSystemIndex`, `playerAggroUntil`, `playerEscortOrderUntil`, `attackId`, `hailSession`. `isAmbientTrafficWarpEligible` refuses departure while `playerAggroUntil`, `playerEscortOrderUntil` or `attackId` are set, so those three rarely leak. It does not look at `lastAggressionAt`. A ship that fires on the player's escort, is not fired back on, and reaches its departure timer within 15 seconds (`NPC_AGGRESSION_MEMORY_MS`) is replaced by a vessel that inherits live attack evidence against the player's side, and `hasRecentAggressionAgainst` (12719) will name the newcomer as the attacker. The evidence describes a ship that no longer exists.

The proposal's `securityInstanceId` would correctly separate the two vessels for encounter purposes, but the aggression fields are read by `hasRecentAggressionAgainst` (12719) and `isNpcSystemAttacker`, which know nothing about instances. Clear the seven fields in `beginAmbientTrafficArrival`, add one probe case (S4.15: a replacement on a slot with live aggression evidence is neither an attacker nor an escort target), and ship it before Phase 3 step 1. Six lines. I offered this earlier and it stands.

### 6. Smaller corrections

`getNpcHailBlockReason` (9571) decides "combat channel closed" by string-matching `destinationName` (`defend:`, `raid:`, `station target`, `player`). If the navigation objective writes anything into `destinationName`, choose text that cannot collide, or better, keep the objective in its own field (`npc.securityObjective`) and leave `destinationName` as the display label. The proposal's "dedicated navigation objective" should say where it lives.

The hold state does not exist. NPCs are never stationary except through `waitUntil`, and `waitUntil` is also written by the tractor and engine-disable branches every tick (`now + 140`). A hold implemented as a long `waitUntil` will be cut to 140 ms by a tractor beam and then resume. The objective must own the hold and re-assert it each tick, and the proposal's `unable_to_comply` transition must be checked before the hold re-asserts.

`state.activeFleetAttack` is nulled on every `applySystemState` (2445) and on load. The proposal's S5.5 "correctly matched active raid" evidence cannot survive travel or reload, which is Phase 2 behaviour and fine, but S5.11 should not expect it to.

Station names are not unique. Earth has two stations named `PS-102` with different ids. The encounter list and the anchor selector must key on `station.id`.

The Security tab renders once per click (`renderPlanetMenu`, 20 call sites, none per frame). A countdown and a live encounter list in that tab need a keyed refresh, and `updateTargetWindow` (11738) already shows the pattern: rebuild only when a render key changes. The proposal's incoming-order panel should reuse the target window's mechanics, and it should note that the dock menu does not stop the clock so an order can expire while the operator is reading it.

`localTraffic` replacements take the holder's flag (`chooseAmbientTrafficShipId`, 13103 uses `state.systemFaction`). At a player holding these become same-flag foreigners with `sideId` equal to the flag faction, which Phase 1 treats as foreign. They classify as `other`, which is what the proposal wants, but the writer should know most challenged ships at a player holding will be wearing the player's own flag.

## What is missing

The proposal never says what a cleared visit is worth to the visitor, only that the record exists. Section 2 above proposes the answer. Without it the acceptance cases pass and the feature is invisible in play.

There is no operator visibility of `unable_to_comply` and `contact_lost` beyond the outcome enum. The operator panel should show why an order stalled, or the operator will read a tractor-held freighter as a refusal.

The authored Vulcan checkpoint policy (`warFlag: closed`) will fire on a Klingon-flagged player under `defend` while Vulcan turrets may already be shooting. The proposal notes this and says to use a peaceful pairing for the introduction, but the probe fixture should also cover the hostile pairing to prove the checkpoint does not interfere with existing defence, which is S5.16 in spirit but not in its wording.

Nothing covers the player's own escorts and fleet ships at a foreign checkpoint. A Vulcan checkpoint that orders the player to hold has to say what it wants from the three escorts following in formation. Simplest Phase 3 answer: escorts and fleet ships are part of the player's visit and share its clearance and outcome; the checkpoint addresses the flagship. That is consistent with the handoff's later "admit the flagship, hold the escorts outside" idea but does not implement it yet.

## Recommended changes to the plan

1. Phase 2.1 first: clear inherited aggression, aggro, escort-order and `attackId` on ambient replacement, with S4.15. Independent of everything below.
2. Change the zone model to planet-centred perimeter with an issuing installation, planet-relative markers stored as polar offsets, radius derived from the authority's planet-anchored installations (floor 300, cap 650). Keep "one active checkpoint per system".
3. Add the access consequence: pending or noncompliant visitors are refused docking and services at the authority's own installations. Add the arrival change: an active foreign checkpoint places the arriving player at its approach point.
4. Replace the broadcast table with an explicit `broadcast.source` field and the honest Phase 3 mapping (hull-derived; `neutral` hull classifies as `independent`; `unknown` unreachable until sensors exist).
5. Restrict Phase 3 orders to `traffic` and `localTraffic`; everything else is `not_addressed`.
6. Put the navigation objective in its own field and make it own the hold; do not route it through `destinationName` or a bare `waitUntil`.
7. Add to S5: S4.15 as above; the hostile-pairing checkpoint fixture; a "tab throttled" clock test (drive `tick` with `frameScale` 0.25 and confirm the deadline advances at the simulated rate, not wall-clock); an anchor-motion test (a station-relative marker stays inside tolerance across several orbit minutes advanced by faking `now`); a docking-refusal test for the player at Vulcan and a concession-still-docks test.

Everything else in the proposal can go to the writer as written: the ledger shape, the epoch rule, the instance ID, the outcome enum, the merge rules for policy changes, the UI list, and the S5 cases. The implementation sequence in §11 is the right order once step 1 above is inserted before it.

## Reference data

Measured at `9e95626`, Ferengi start, fresh game, before any orbit time has passed. Speeds are units per frame at `frameScale = 1`; multiply by 60 for units per second at full frame rate.

Ferenginar (index 13, player-held): planet (1041, 2034), star (1405, 922). Government stations owned by the player after the start transfer: Contracts End (planet-anchored, 355), Sharp Tooth (planet, 413), Greed Central (star, 1690), Snuff This (star, 1725), The Big Ear (star, 988), Zek's Used Ships (star, 1385), Grand Nagus Casino (star, 1823). Private: Grand Nagus Private Lot, T19 Trade Ring. 12 NPCs (6 localTraffic, 2 patrol, 4 traffic), speeds 0.69 to 1.20.

Vulcan (index 11, controller `vulcan`): planet (309, 1605), star (1193, 865). Government stations: J'lin Center (planet, 184, period 13 min), U of Vulcan (planet, 179, 13 min), V'Pek Tar (planet, 345, 27 min), VSU Dorms (star, 1430), Vulcan South U (star, 1629). Private: Vulcan Surplus Annex (star, 2334). 9 NPCs, speeds 1.04 to 1.37. Lanes within 500 of the planet: planet transfer (355), J'lin Center approach, U of Vulcan approach, V'Pek Tar approach.

Earth (index 0, controller `terran`): planet (437, 2028), star (1387, 906). 18 stations, 8 planet-anchored at 292 to 584, the rest star-anchored at 673 to 3071. Two stations share the name PS-102. 20 NPCs (the cap), speeds 0.75 to 1.43.

Qonos (index 37, controller `klingon`): planet (2370, 314), star (1223, 966). 14 stations, 4 planet-anchored at 223 to 285, star-anchored from 430 (Tar'jel, 7 min period) to 2851. 16 NPCs, speeds 0.86 to 1.36.

NPC flight profile (3192): speed 0.48 to 1.85 per frame, turn rate 0.24 to 1.65, in-system warp multiplier 1.25 to 2.85 applied on legs longer than 760 units. A 400-unit approach at 0.7 per frame is about 10 seconds at 60 fps; the proposed 45-second floor is generous and can stay.
