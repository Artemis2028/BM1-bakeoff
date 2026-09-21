# BM1 Remastered — revised development plan

Updated: 21 September 2026 (hygiene vs `main` @ `74f574b` after dockClear engine PR #61).  
Checkpoint: Phase 1–10 Dominion-first, side-lane, catalog wire, EW 9–9.4, boarding, flags/utility, ledger, empty-armable, construction, HTML catalogs, economy/difficulty, standing-tiers, and dockClear S28 are on bake-off `main`. Phase 6 sensors/cloak engine landed [PR #24](https://github.com/Artemis2028/BM1-bakeoff/pull/24) @ `749393b`. **No Referee Pass claimed** on the post-Phase-4 packages. Product knowledge lives in **§16** and `docs/GUIDED-CONVERGENCE.md`. Do not treat Passed Phase 1–6 briefs, the side-lane, or later locked engines as incomplete.

This is the current roadmap for what we have completed, what we need to add, and what we would like to build later. It carries forward the cloud handoff and faction-doctrine work, with the decisions made during the Phase 1 and Phase 2 reviews taking precedence. The later milestones were proposed implementation slices, not approval to implement every idea at once. Sections 3–15 retain the original design text; **§16 is the bake-off-relative status** and takes precedence when older “Pending / next / Agreed next” lines disagree with landed Passes. Hygiene 21 September 2026 flipped the §2 holding-zones **Pending** row and the §16.2 Phase 10 / catalog-not-wired claims.

## 1. The game we want

A persistent, reactive BM1 universe where trading, exploration, away teams, fleet decisions and conquest affect what happens next. Factions should have different interests, civilians should behave differently from military ships, and consequences should follow what participants actually know.

Progression should involve worthwhile choices between ship purchases and conquests. Higher prices alone will not fix shallow gameplay or runaway growth.

Keep these constraints throughout:

- The finished game runs locally and offline on a laptop, without cloud AI or an always-running backend.
- Completed jumps advance strategic time. Local combat, inspection deadlines and searches use tactical time; they must not require the player to jump to end.
- Events survive travel and reload. Loading or canceled travel must not advance them or duplicate their outcomes.
- Player and NPC sensors, communications and weapon gates follow the same information rules.
- Every selectable starting path remains viable. Do not design the campaign around universal Earth access.
- Preserve BM1's alternate imperial setting, armed Vulcans, and the Dominion Remnant start in Blender.
- Explain and agree weapon behavior, including shield exceptions, before changing weapons.
- Keep named commanders uncommon, histories bounded, and performance budgets measured.

## 2. Current status

“Reviewed” means no blocking findings remain in the supplied patch review. It is distinct from a confirmed push, merge, release or independent full-browser test.

| Area | Status at this checkpoint | What that establishes |
| --- | --- | --- |
| Combat attribution and pursuit/range baseline | Accepted earlier; retained in the behavioral probe | NPC-only destruction gives no player reward/blame/feat. Player and escort final hits retain the chosen credit rule. Hunters may pursue beyond firing range. |
| Phase 1 — relationships and political authority | Pushed, per the conversation | System control, allegiance, station ownership and ship command identity are separate. Capture, reclaim, flag changes, arrival protection and restoration have acceptance coverage. |
| Phase 2 — player security policies | **Passed** engine ([PR #6](https://github.com/Artemis2028/BM1-bakeoff/pull/6)). 11 September “push not confirmed here” is **stale**. | Two ROE modes, defaults/overrides, ownership-safe defense alerts and orders, and the Security UI. |
| Doctrine bundle | Authored design/reference material; loader wired (PR #1) | Faction and role intentions, knowledge rules and objective contracts exist as design. Full doctrine still does not drive every AI role. |
| Holding zones, access enforcement, incident escalation and FLASH alerts | **Landed** — Phase 3 engine [PR #8](https://github.com/Artemis2028/BM1-bakeoff/pull/8) / [PR #9](https://github.com/Artemis2028/BM1-bakeoff/pull/9); Phase 4 engine [PR #13](https://github.com/Artemis2028/BM1-bakeoff/pull/13). Older “Pending” checkpoint text is **stale**. Not a reopen. | Holding / compliance / incidents / FLASH are on `main`. Soft residual `alertsActive` snapshot: brief #63 stay-locked; S29 engine on this PR (not a Referee Pass). |
| Broader economy, sensors, fleet coordination and Dominion campaign | **Engines landed** on bake-off (see §16). Older “requested direction” is **stale checkpoint text**, not a reopen. | Phase 6 PR #24; Phase 7 PR #29; Phase 8 PR #31 + economy #56/#57; Phase 10 Dominion-first #40/#41 (full roster **deferred**). |

Latest reviewed Phase 2 pair (historical 11 September evidence; bake-off `main` is past Phase 2 — PR #6):

- Engine: `fcca80155170239850f31b39e93a05b795ab0e3c`.
- Probe: `daced26da3c1f8a0d22977a5aadc392c25a1cdea`.
- Reported by Claude: **61/61** behavioral checks.
- Independently checked in this review: the revised diffs, probe syntax, and uploaded probe matching the patch's resulting blob. Codex did not independently rerun the full Chromium suite.

Historical 11 September instruction (superseded): before the next engine branch, confirm the actual pushed head contains this reviewed pair or its equivalent. Keep earlier audits as historical evidence; revalidate their unresolved findings against that head. Bake-off `main` @ `74f574b` already contains Phase 2 and later locked engines.

## 3. Decisions we have settled

### Political identity and ownership

- The player's stable side is separate from the flag being flown.
- Sharing a flag can grant faction access; it does not give the player control of another government's world or command of its ships.
- Foreign concessions and private installations retain their owners when control changes, except assets explicitly eligible for transfer from the previous holder.
- Independent worlds and ships are distinct identities. Shared `neutral` status is not an alliance, command or intelligence network.
- Custom polity IDs remain intact. Unknown origin remains unknown.
- Existing ships preserve their identity on re-entry; changing the holder does not silently refit them.
- Arrival protection is personal. It must not delete hostile fleets, erase orders or rewrite ownership.
- Breen and Dominion have no static alliance in Phase 1. Any future covert pact must be scoped and deliberately introduced.

### Player security policy

| Mode | Automatic engagement by the player's forces |
| --- | --- |
| `return-fire` | Attributable attacks on the player's side observed in this system, and a matching active raid against the holding. Hostility or a war flag alone is insufficient. |
| `defend` | Retains the Phase 1 behavior, including hostility toward the player and war with the player's flag. |

Explicit escort attack orders override ROE for eligible foreign targets. Player-owned installations and player-side ships are protected before the order function mutates them.

Policies belong to the player's side, survive flag changes, and merge by dimension. Local overrides are inactive but retained when a holding is lost, then reactivate on reclaim. Outside holdings, player forces use the empire-default ROE as standing orders.

`access` and `alerts` were reserved data at the 11 September checkpoint. Phase 3 (PR #8 / #9) implements holding / access / compliance; Phase 4 (PR #13) implements incidents / FLASH. Do **not** present those as still reserved. Soft residual `alertsActive` snapshot: brief #63 stay-locked; S29 engine on this PR (not a Referee Pass). `protect-all` remains deferred until the engine can distinguish an aggressor from someone returning fire.

## 4. Proposed delivery order

The numbering below preserves the Phase 1 and Phase 2 names already used in commits. It replaces the older handoff's suggested phase numbering.

| Step | Deliverable | Exit condition |
| --- | --- | --- |
| Close Phase 2 | Confirm the reviewed patch pair in the intended branch | Recorded head, passing probe and clean startup for that build. |
| Phase 3 | Holding zones, access decisions and compliance | A visitor receives a clear instruction, can comply or leave, and enforcement ends correctly. |
| Phase 4 | Incident records, escalation, reports and alerts | Attributed incidents have readable histories, bounded consequences and no duplicate punishment. |
| Phase 5 | Persistent objectives and a convoy/distress scenario | One useful gameplay loop survives several jumps and reload without duplication. |
| Phase 6 | Sensors, cloak, contact uncertainty and purposeful system space | Hidden objects stay hidden across UI and AI; lost tracks stop exact targeting. |
| Phase 7 | Fleet coordination and richer border encounters | Orders persist; escorts can hold outside a boundary while the flagship proceeds. |
| Phase 8 | Economy, trade permissions and progression | Deliveries and losses affect finite markets; exploits and conquest snowballing are constrained. |
| Phase 9 | EW and separately reviewed weapon behavior | Both sides have intelligible effects, costs, counters and attribution. |
| Phase 10 | Wider faction content, rare commanders and Dominion operations | Persistent stories and supplied campaigns respond to player and NPC actions. |

Dependency repairs are gates, not features to postpone blindly until their numbered phase. Phase 3 needs a minimal durable order and incident identity. Phase 5 needs safe persistence. Phase 9 needs contact and reporting rules. A narrow sensor, economy or fleet slice can move earlier when a concrete scenario requires it.

## 5. Next milestone: holding zones and compliance

**Status (hygiene, 21 September 2026):** Phase 3 engine **landed** ([PR #8](https://github.com/Artemis2028/BM1-bakeoff/pull/8) / [PR #9](https://github.com/Artemis2028/BM1-bakeoff/pull/9)). This section is the original proposal text. **Do not reopen.**

**Historical deliverable (already shipped):** a bounded proposal then engine. Start with one visible holding/inspection area and one encounter that can resolve cleanly. Do not start with a galaxy-wide police simulation.

### Add

- A stable zone ID, system/location, boundary, controlling authority and purpose. A legal boundary is distinct from the physical map edge.
- Readable map/UI markings, the instruction, its reason, remaining time and a viable exit route.
- Effective access decisions using the reserved `warFlag`, `independent`, `unknown` and `other` classes and `open`, `challenge`, `closed` values.
- Classification based on legitimate knowledge. Define how unidentified contacts work before activating `unknown`; do not silently use hidden identity.
- A concrete enforcement order tied to the visitor, authority, location and incident. Track inspection/order/compliance facts explicitly, including the intended `inspection_order_active` and `compliance_verified` concepts.
- Clear termination: instruction satisfied, visitor leaves, authority changes, order canceled, deadline reached or threat resolved.
- A player response: comply, ask for clarification/clearance where supported, move to the holding point, withdraw, or deliberately refuse.

### Boundaries of the first implementation

- Access denial alone is not an observed attack. A closed border must not silently override `return-fire`; define the separate escalation authorization first.
- Inspection uses actual cargo or explicitly supported checks. Do not treat procedural scan flavor as a real inventory.
- Compliance closes the relevant demand. It does not erase a separate attack or magically end a military operation.
- Re-entry, leaving a scene and save/load must not duplicate an order or grant automatic clearance.
- On loss of control, the player's authority to issue local enforcement ends; retained policy overrides do not give orders to the occupier.
- Foreign concessions retain their own defense and command. Player policy cannot commandeer them.

### Acceptance exercises

1. An open visitor passes without an invented offense.
2. A challenged visitor receives one clear order; satisfying it produces clearance and ends that order.
3. A denied visitor that leaves in time is not pursued forever or immediately challenged again under a new ID for the same resolved incident.
4. A hostile flag under `return-fire` does not become automatic permission to fire solely because access is closed.
5. A genuine attack still permits the appropriate immediate defense.
6. A same-flag foreign world does not accept player-issued holding policy without player control.
7. Foreign/private ownership and player command membership remain unchanged.
8. The order survives reload/re-entry with the correct remaining time and outcome.
9. Capture cancels or invalidates enforcement by the old holder according to the agreed rule.

Decide for this proposal: zone placement, visitor classification precedence, instruction sequence, tactical deadlines, refusal consequences, and whether the first encounter supports cargo inspection or only movement/identity clearance. NPC compliance needs an executable objective that ordinary movement AI will not overwrite.

## 6. Incident escalation, evidence and alerts

Turn the single replaceable log line into a bounded, useful record of events. Keep immediate local safety working while adding richer evidence and reporting.

- Store incident identity, actor, victim, location/jurisdiction, action, clock, outcome and links to resulting orders.
- Keep simulation truth separate from an observer's evidence: identification, attribution, confidence, freshness and report provenance are different fields.
- Record who sent and received a report. No automatic galaxy-wide knowledge, exact hidden coordinates or blame inferred from a disappearance.
- Separate war, player standing, local offenses, access restrictions and immediate aggression.
- Define when a warning escalates to interception or force, with a reason the player can understand.
- Give FLASH alerts an agreed meaning and priority; ensure witness and raid notices are not instantly overwritten by salvage/background messages.
- Activate `all`, `incidents`, `silent` only when their behavior exists. Muting notifications must not suppress the underlying incident or simulate compliance.
- Apply consequences once. Do not charge both the existing kill-standing cascade and a new report penalty for the same consequence.
- End searches and demands on their own declared clocks, with bounded retries and history.

Use the doctrine's “one incident, different reactions” cases: an affected Romulan patrol investigates; an unrelated Klingon unit may record and continue its mission; a relief ship responds only when it has usable information and capacity.

## 7. Persistence and the first connected gameplay loop

Build one convoy/distress scenario before expanding into many disconnected missions:

1. A finite local shortage creates a delivery opportunity.
2. A real cargo-bearing convoy has an origin, destination, assignment and stable ID.
3. Pirates learn about it through detection or a report and evaluate risk and value.
4. A patrol or relief ship responds according to knowledge, interest, equipment and available resources.
5. The player can escort, deliver independently, investigate, exploit the situation or ignore it.
6. Delivery, loss or rescue changes supply and leaves a persistent outcome.

Requirements: successful warp and wormhole travel advance strategic state exactly once; canceled travel and loading do not. Objectives survive scene changes and saves, close once, and do not spawn free replacement assets merely because another jump occurred.

Carry forward the doctrine's general `asset_overdue` event. It covers freighters, explorers, refugee transports, tenders and patrols. It requires a known assignment and missed milestone; unloading a ship from the scene is not evidence that it disappeared. Overdue does not mean destroyed or identify an attacker.

Introduce faction doctrine through a small adapter and a non-acting comparison pass before enabling a few roles. Preserve native role/credit fields such as `playerEscort` and `fleetId`.

## 8. Sensors, cloak and system space

- Initialize cloak state before the first render, minimap, target list or AI acquisition.
- Distinguish detection, identification, track quality and firing solution. An old report is not a live lock.
- Let contacts decay into last-known areas; searches consume time and can fail.
- Vary sensors by role, equipment, age, power and damage. Science specialists can outperform larger ordinary ships.
- Make active scans useful but detectable.
- Enlarge systems through purposeful destinations: lanes, belts, relays, wrecks, research sites, restricted facilities and anomalies, rather than empty distance.
- Vary arrival points by route and local conditions, preserve fleet spacing and retain an exit path.
- Later add independently addressable deep-space locations; a wreck outside Romulan space should not require loading Romulus to investigate it.

Acceptance must check both player and NPC knowledge, including minimap/tooltips/selection leaks, loss of lock, and first-frame cloak visibility.

## 9. Fleet coordination and border encounters

- Persistent hold, rally/move, follow, escort, defend-area, focus-target, regroup and withdraw objectives.
- Visible destinations and order status; minimap placement and/or a compact order panel, with the interaction design settled first.
- Allow a flagship to approach while escorts remain outside the holding boundary.
- Define whether ships holding elsewhere follow a jump, stay behind, or require recall.
- Shared fleet objectives with roles such as screen, scout, support and withdrawal cover.
- Explicit interruption rules: immediate defense, retreat and new orders must not silently erase the standing assignment.
- Later communications failures may delay orders; ships continue their last received orders and local self-preservation.
- Tension responds to known force size, posture, recent incidents and compliance, with a visible reason.

The older “peaceful escort immediately returns to formation instead of holding rendezvous” finding must be rechecked. If it remains, repair it before relying on fleet holding orders for border gameplay.

## 10. Economy, trade, progression and conquest

| Wanted addition | Design requirement |
| --- | --- |
| Finite production, consumption, stock and demand | Persistent compact market state; deliveries and losses have bounded effects. |
| Meaningful trade restrictions | Distinguish embargoes, licenses, local seller rules and price premiums. A high price does not bypass every ban. |
| Broad independent trade opportunities | Independence is not universal immunity; restrictions remain local and explainable. |
| Earth–Klingon wartime restrictions | Costly or risky exceptions belong in appropriate neutral/black-market contexts, not unrestricted imperial markets. |
| Slower ship progression | Wider useful price/availability steps within classes, with roles for smaller ships. |
| Fleet costs | Supplies, repair and maintenance create choices; exact costs await pacing targets. |
| Conquest obligations | Garrison, supply, reconstruction and stabilization make holdings responsibilities as well as income. |

Remove reproducible transaction/reputation exploits before tuning prices. A buy/sell reversal must not create prestige without useful activity. Repeated safe jumps must not yield unlimited income, fresh stock, reinforcements and repair without costs or limits.

Measure progression in worthwhile trips or completed activities, not only currency multipliers. Preserve recovery options so a setback does not leave an unwinnable save.

## 11. EW and weapons — separate design approval

EW backlog: sensor jamming, deceptive contacts, fire-control interference and communications disruption. Each needs a cost, duration, counter and attributable political consequence. Ghost contacts should be bounded sensor records, not full simulated ships. An already-delivered report is not erased by later jamming.

Before any weapon overhaul, provide a matrix of family, range, arc, tracking, shield interaction, hull/subsystem effect, energy/ammunition cost, counters and faction access. Identify which claims come from BM1, retained BM2 material, broader Star Trek inspiration or new design.

Verify hull/loadout mapping before balancing. Do not grant universal shield bypass based on an isolated lore exception. Preserve the distinction between pursuit, permission to engage and the final per-weapon firing gate.

## 12. Factions, stories and longer-term wants

Give factions different objectives through roles, knowledge and constraints—not just different hails. A civilian merchant must not inherit all its empire's military permissions.

| Path | Direction to build toward |
| --- | --- |
| Independent / New Switzerland | Trade, exploration, mediation, refuge and private security; remain independent or choose a patron. |
| Ferengi / Ferenginar | Contracts, shortages, brokerage and commercial influence; merchants remain distinct from pirates. |
| Vulcan / Vulcan | Armed restraint, science, rescue, relief, diplomacy and defense. |
| Romulan / Romulus | Reconnaissance, frontier control, intelligence recovery and selective disclosure. |
| Cardassian / Cardassia | Reconstruction, supply corridors, political leverage and compartmented covert assignments. |
| Terran / Earth | Imperial war, infrastructure, civilian survival and choices around service or resistance; clarify the existing Rebel label. |
| Klingon / Qonos | Military campaigns, logistics raids, regrouping and meaningful battlefield prestige. |
| Dominion Remnant / Blender | Scarce supplies, local survival, autonomy and eventual choices about the wider Dominion. |
| Tholian / Tholia | Industry, shipbuilding, protected routes and clearly marked restricted space. |

Keep minor-faction and local-culture distinctions from the doctrine. Shared independence does not erase Lysian, New Swiss, Delpin or other community interests. Gorn routine generation remains disabled in the proposed doctrine; survivors need a deliberate authored exception.

Content candidates, after their supporting systems exist:

- Rescue, evacuation, refugee transport and hospital supply.
- Away-team chains involving ruins, quarantine, science, negotiations or sabotage investigations.
- Surveys, anomaly research and selling discoveries.
- Wreck investigation, salvage rights, recovery and towing.
- Smuggling, inspection avoidance and bounded black-market opportunities.
- Bounty investigation, capture/disable options and prisoner exchange.
- Relay repair, reconstruction, route reopening and occupation resistance.
- Rare recurring commanders who remember a few significant encounters, with believable travel and bounded records.

### Hidden Dominion campaign

Preserve Blender as the playable remnant. Keep the wider Dominion region hidden under explicit discovery rules, including map labels, route previews and tooltips. Starting as Dominion must not reveal the distant region automatically.

Build a staged possibility: rumors, corroborating evidence, contact, procurement, access preparation, coordinated fronts, then supplied occupation or withdrawal. Opponent weakness creates opportunity; it must not instantly conjure an invasion. Preparation consumes finite assets and can be exposed, delayed, sabotaged or abandoned.

Any covert Breen/Cardassian arrangements require scoped agreements and compartmented knowledge. Ordinary captains do not inherit secret campaign knowledge. Discovery timing, map revelation and whether an undiscovered Dominion can act remain decisions for that later proposal.

## 13. Technical and regression backlog

These are unresolved historical review leads or broader verification needs, not claims that every defect still exists in the latest head.

| Recheck | Why it matters / when to gate work |
| --- | --- |
| BM1 versus inherited BM2 hull, weapon, stock, image and unlock mappings | Prevent balancing or selling the wrong assets; gate weapon and progression work. |
| BM1 save namespace, scenario/schema identity and migration | Avoid same-origin collisions and unsafe imports; gate durable campaign features. |
| Saved timers using page-relative timestamps | Restore remaining durations correctly; gate persistent orders, incidents and cooldowns. |
| Raids/operations across travel and load | Stable actor identity alone does not establish full operation persistence. |
| Trade/reputation reversal and jump farming | Fix reproducible free-growth loops before economic tuning. |
| Fleet orders overwritten by ordinary movement | Gate holding, escort and convoy objectives. |
| Personal player hostility leaking into unrelated station attacks | Own-asset protections do not prove every foreign NPC target choice is justified. |
| Service access for every starting path | A friendly start must have the services promised by its role. |
| Offline manifest and cache readiness | Report readiness only after required assets are available; verify generated packages. |
| Blender's legal/local political status | Preserve origin, actual holder and remnant identity; do not hide a disputed claim behind a neutral fallback. |

Measure a representative laptop before setting ship/contact/event caps. Keep only the current system fully tactical, stagger decisions, bound journals and exceptional actors, and extract small modules as touched. Avoid a speculative rewrite of the whole engine.

## 14. How we work and what counts as done

Working handoff: Claude implements and supplies patches/probes/screenshots; Codex reviews; Grok handles the push workflow with the user. A review result does not itself push or merge changes.

For each milestone:

1. Confirm the base head and a bounded proposal, including unresolved behavior choices.
2. Implement one reviewable slice, preserving accepted identity and attribution rules.
3. Keep engine and meaningful probe changes separately reviewable.
4. Run startup and the relevant behavioral suite on the exact submitted head.
5. Use live fixtures with explicit prerequisites. Do not let destroyed objects or direct state assignments bypass the behavior the test claims to exercise.
6. Exercise real order/capture/claim and tick paths where side effects matter; include persistence and authority boundaries.
7. Supply the patch pair, matching complete probe, result details and UI screenshot when applicable.
8. Record the reviewed and pushed heads separately. Stop expanding tests when the concrete risk is resolved.

Keep the accepted regression baseline: NPC attribution, escort projectile credit, Bajora feat attribution, pursuit versus range, same-flag raids, custom governments, foreign ownership, capture/reclaim blockers, identity on restoration, arrival protection, policy inheritance, and protection of own assets from orders and defense alerts.

## 15. Immediate checklist and decisions still open

Hygiene 21 September 2026: the 11 September open boxes below are **done** on bake-off `main`. They are **not** Agreed next.

- [x] Confirm the latest reviewed Phase 2 pair is on the intended pushed branch. — **Passed** engine [PR #6](https://github.com/Artemis2028/BM1-bakeoff/pull/6).
- [x] Record the matching 61-check run and startup result for that head. — Superseded by later probe counts; see `docs/BAKEOFF-STATUS.md`.
- [x] Draft the Phase 3 holding-zone/compliance proposal, with one playable encounter and the nine acceptance exercises above. — Landed `docs/phase3/` + [PR #8](https://github.com/Artemis2028/BM1-bakeoff/pull/8) / [PR #9](https://github.com/Artemis2028/BM1-bakeoff/pull/9).
- [x] Recheck only the persistence/order defects that can invalidate that encounter; repair them in bounded changes. — Phase 3 / 5 engines landed.
- [x] Settle zone geometry, visitor classification, warning/deadline behavior, and the relationship between access refusal and ROE before implementation. — Phase 3 landed; do not reopen.

Later decisions to retain: default BM1 versus optional BM2-derived roster; upgrade pacing and maintenance; fleet controls and ships left behind; sensor presentation; scope of lawful trade exceptions; Blender's legal claim; hidden-region revelation and invasion timing; weapon roles and shield exceptions. Do not reopen the settled two-mode Phase 2 ROE merely to match older terminology. Named **soft residuals** (not new packages): away-team XP S30 engine is on this PR (`named_mix`, not a Referee Pass); Phase 10 full roster deferred; magnitudes injectable. `alertsActive` snapshot S29 engine is landed (not a Referee Pass).

## Source and precedence notes

This roadmap combines `BM1-CLOUD-PROJECT-HANDOFF.md`, `BM1-CURRENT-REVIEW-AND-AI-PLAN.md`, `BM1-FACTION-DOCTRINE-v0.2.1.md`, the later integration handoffs discussed in this conversation, and the Phase 1/Phase 2 patch reviews. Older audit findings remain dated leads. The latest explicit decisions and reviewed behavior supersede conflicting earlier proposals—for example armed Vulcans, personal arrival protection, separated political identities, and two-mode player ROE.

This document updates planning and status. It makes no engine changes and does not claim a fresh remote-head check, full-browser run, release build or balance certification.

The 21 September 2026 hygiene pass aligns §2 / §16 with `main` @ `74f574b` (after dockClear engine PR #61). That pass does not replace this plan, does not mark unfinished bake-off work done, does not claim a Referee Pass, and does not reopen Phase 1–10 / EW / boarding / utility / ledger / empty-armable / construction / HTML / economy / standing / dockClear gates.

## 16. Convergence backlog (from guided remastered-work roadmap)

Added: 12 September 2026. Hygiene: 21 September 2026 vs `main` @ `74f574b`. **Docs only.** Detail, Flash weapon table, boarding rules, and standing numbers live in [`docs/GUIDED-CONVERGENCE.md`](GUIDED-CONVERGENCE.md).

**Dual-track:** guided `BM1-remastered-work` may have numbered catalog wire and economy/standing differently. Bake-off already has Phase 1–10 Dominion-first engine, the side-lane, additive `bm-ships/` **and catalog wire (PR #28)**, EW 9–9.4, boarding, flags/utility, ledger, empty-armable, construction, HTML catalogs, economy/difficulty, standing-tiers, and dockClear S28. Do not crib guided engine code.

### 16.1 Already complete on bake-off — skip / mark done

Do **not** list these as Agreed next. Hygiene 21 September 2026 flipped the §2 holding-zones **Pending** row. Remaining §4 / §5 historical wording is original proposal text, not a reopen.

| Package | Bake-off status | Pointer |
| --- | --- | --- |
| Phase 1 political authority | **Passed** | §3; PR #2 |
| Phase 2 ROE / Security | **Passed** | §3; PR #6 |
| Phase 3 checkpoints / holding zones | **Passed** | §5; `docs/phase3/`; PR #8 / #9 |
| Phase 4 incidents / escalation / alerts | **Passed** | §6; `docs/phase4/`; PR #13 |
| Phase 5 persistent convoy / distress + `asset_overdue` | **Engine landed** | §7; `docs/phase5/`; PR #21 |
| Side-lane `repairCapable` + arms overlay | **Engine landed** | `docs/side-lane-repair-reman-independence/`; PR #18 |
| Side-lane Reman durable unlock | **Engine landed** (soft `meetPackPurchaseDecision` remains) | Same; PR #18 |
| Side-lane unrest → independence mint | **Engine landed** | Same; PR #19 |
| Phase 6 sensors / cloak / contact uncertainty / system space | **Engine landed** (brief PR #22, engine PR #24 @ `749393b`). **No Referee Pass claimed.** Do not rewrite as a new brief. | §8; `docs/phase6/` |
| Additive `bm-ships/` pack | **On main** (PR #15). **Catalog wire landed** (PR #28 @ `2b1bb47`). Older “full catalog not wired” copy is **stale**. | `bm-ships/`; `docs/INSTALL-SHIPS-PATCH.md` |

Guided copy about incidents, independence, repair arms, or Reman recovery is **already satisfied on bake-off**. Cite the merge; do not start a second implementation.

### 16.2 Convergence packages — Locked (engine-landed)

Rows below are **locked** on `main` @ `74f574b`. They are **not** Agreed next. Do not reopen closed gates.

| # | Package | Status on bake-off | Class | Overlap / pointer |
| --- | --- | --- | --- | --- |
| 1 | Weapon / device source ledger | **Engine landed** (`docs/weapon-ledger/`; PR #48 brief / PR #49 engine @ `a3d9611`). **Stay locked** — do not reopen from empty-armable, construction visuals, or HTML catalogs. | **Locked** | §11 / §13 BM1–BM2 audit. Flash prices are **source material, not final prices**. Three disruptor identities. Tractor stays a slot. Bajoran Sail / Warp Core **explicitly deferred utilities**. Phase 9 matrix **read-only**. **Not** a reopen of EW / boarding / Phase 10 / flags. |
| 2 | Flags / passes / utility inventory | **Engine landed** (`docs/flags-passes/`; PR #46 brief / PR #47 engine @ `6dc279b`). **Stay locked** — do not reopen from empty-armable, construction visuals, or HTML catalogs. | **Locked** | Separate from the three combat/device slots. Capacity / activation **TBD / injectable**. Thaleron Test Facility pass **unverified — not shipped**. **Not** a reopen of EW / boarding / Phase 10. |
| 3 | Empty but armable ships | **Engine landed** (`docs/empty-armable/`; PR #50 brief / PR #51 engine @ `3933daf`). **Stay locked** — do not reopen from construction visuals or HTML catalogs. | **Locked** | Three slots; empty stays empty across save/load/scene/restoration; unarmed NPC cannot fire; legal install uses installed def only. Doctrine physical fire gate; §11 per-weapon gate. **Not** a reopen of EW / boarding / Phase 10 / flags / ledger. |
| 4 | Boarding / capture / command transfer | **Engine landed** (`docs/boarding/`; PR #38 brief / PR #39 engine @ `de1f857`). **Stay locked** — do not reopen in Phase 10. | **Locked** | ≤10% hull; capture XOR scuttle; tractor ≠ board; away-team XP brief **#65 stay-locked**; S30 engine **on this PR** (`named_mix`). See `GUIDED-CONVERGENCE.md` §4 and `docs/away-team-xp/`. **Not** Phase 10. |
| 5 | Station construction visuals | **Engine landed** (`docs/construction-visuals/`; PR #52 brief / PR #53 engine @ `91ecc2c`). **Stay locked** — do not reopen from HTML catalogs. | **Locked** | Scaffolds, workbees, **blue** construction beams ≠ combat evidence. **Do not redo repair arms** (side-lane Pass, PR #18). Construction art ≠ repair arms. Beams must not write `observedAttacks` / standing / FLASH. **Not** a reopen of EW / boarding / Phase 10 / flags / ledger / empty-armable. |
| 6 | Faction-wide standing / purchase tiers | **Engine landed** (`docs/standing-tiers/`; PR #58 brief / PR #59 engine @ `52e36d9`). Helpers already landed (PR #28). **Stay locked.** | **Locked** | Money ≠ trust. First balance pass: Open 0, Trusted 15, Respected 30, Military 50, Strategic 75, Excalibur/Concord 100; new character **20** with selected faction; others Open 0. Independent trade standing in neutral entry. §10 trade restrictions. Cite wire #28 + Reman #18 + economy #56/#57 — subscribe, do not reopen. GUIDED §7 “wire later” is stale. **Not** a reopen of EW / boarding / Phase 10 / flags / ledger / empty-armable / construction / HTML / economy. |
| 7 | Catalog wire + purchase rules | **Engine landed** (PR #28 @ `2b1bb47`). **Stay locked** — standing-tiers brief subscribes, does not reopen. | **Locked** | `CATALOG_WIRED === true`. `evaluateWiredPurchase` + `meetPackPurchaseDecision` (soft from PR #18). Pack `getPurchaseDecision` + region rules. GUIDED §7 “wire later” is stale planning copy. |
| 8 | Broader economy / difficulty | **Engine landed** (`docs/economy-difficulty/`; PR #56 brief / PR #57 engine @ `b73d960`). **Stay locked** — do not reopen from standing-tiers. | **Locked** | §10 / §13. Adjustable tuning; **preserve political identity at all difficulties**. No invented unrest / repair / prestige curves here. Phase 8 anti-farm already landed (PR #31) — cite, do not reopen. Do **not** retune `PURCHASE_TIER_STANDING` as Easy / Hard. **Not** a reopen of EW / boarding / Phase 10 / flags / ledger / empty-armable / construction / HTML #54–#55. |
| 9 | Weapon / station review presentation | **Brief stay-locked** (PR #54). S25 pages **stay-locked** (PR #55 @ `739e0c1`) under `docs/html-catalogs/` | **Working agreement** | HTML catalogs **without** requiring Flash. Inspect defs only — not a combat retune, not live price locks, not a second shop. Subscribe ledger #48/#49 + `game_items.json` / station JSON read-only. Show both Flash and bake-off; cite the ledger. Never gift FS / culture / `engagement_authorized`. **Keep #54 / #55 locked.** **Not** a reopen of EW / boarding / Phase 10 / flags / ledger / empty-armable / construction. Economy / difficulty knobs do **not** reopen this lane. |
| 10 | Dominion distribution / Gorn reserved / major-threat mission-only + hidden Dominion campaign | **Engine landed** (`docs/phase10/`; PR #40 brief / PR #41 engine @ `2ad94b7`). Catalog helpers wired (PR #28). Live spawn/purchase + hide + campaign book **implemented** (S18). **Stay locked.** | **Locked** — Dominion-first; full roster **deferred** | Doctrine Gorn absence + hidden Dominion campaign (§12). Pack `reserved-gorn`, `dominion-all` / `dominion-core`, `mission-only`. Short write-up: `GUIDED-CONVERGENCE.md` §10. Magnitudes / discovery % / invasion odds **TBD / injectable**. **Not** a reopen of EW or boarding. Older “brief open / spawn not implemented” copy is **stale**. |
| 11 | DockClear / UI-fit polish | **Engine landed** (`docs/dock-clear/`; PR #60 brief @ `3bdc18a` / PR #61 engine @ `74f574b`). **Stay locked.** | **Locked** | Fit only — target / map / related dock chrome. No gameplay rewrite. Does **not** reopen GUIDED §6 / #33–#60. `DOCK_CLEAR_LOCKED_FROM_REMASTERED` stays false. Soft `alertsActive` snapshot is **out** of this lane. |

### 16.3 Landed / stay-locked order (bake-off only)

1. Weapon/device ledger — engine landed (`docs/weapon-ledger/`; PRs #48/#49). **Stay locked.**
2. Empty-but-armable persistence + unarmed-cannot-fire — engine landed (`docs/empty-armable/`; PRs #50/#51). **Stay locked.**
3. Flags / passes / utility inventory — engine landed (`docs/flags-passes/`; PRs #46/#47; Thaleron Test Facility pass **unverified — not shipped**). **Stay locked.**
4. Standing-tier named gates (Open → Excalibur; new char 20) — **brief #58 stay-locked**; S27 engine **#59 stay-locked** @ `52e36d9` (`docs/standing-tiers/` + `src/standing-tiers.js`). Helpers already landed (PR #28).
5. Catalog wire + purchase rules (`meetPackPurchaseDecision` + pack regions) — **engine landed** (PR #28). **Stay locked.** Older “wire later” copy is **stale**.
6. Boarding / capture / command transfer — engine landed (`docs/boarding/`; PRs #38/#39). Away-team XP brief **#65 stay-locked**; S30 engine **on this PR**. **Stay locked.**
7. Station construction visuals (not repair arms) — engine landed (`docs/construction-visuals/`; PRs #52/#53). **Stay locked.**
8. HTML weapon/station review catalogs — brief **#54 stay-locked**; S25 pages **#55 stay-locked** under `docs/html-catalogs/`.
9. Broader economy / difficulty knobs, identity unchanged — brief **#56 stay-locked**; S26 engine **#57 stay-locked** under `docs/economy-difficulty/`.
10. Phase 6 **engine** — **engine landed** (PR #24). Brief already existed. **Stay locked.**
11. Phase 10 Dominion-first — engine landed (`docs/phase10/`; PRs #40/#41). Full roster **deferred**. **Stay locked.**
12. DockClear / UI-fit S28 — brief **#60 stay-locked**; engine **#61 stay-locked** @ `74f574b` under `docs/dock-clear/`.

### 16.4 Working agreement (this backlog)

- Blind: implement from `docs/` only.
- HTML for weapon/station review; Flash is evidence, not a required viewer. Brief **#54 stay-locked**; S25 pages **#55 stay-locked** under `docs/html-catalogs/`. Broader economy / difficulty knobs: **#56 / #57 stay-locked** under `docs/economy-difficulty/`. Standing / purchase tiers: brief **#58 stay-locked**; S27 engine **#59 stay-locked** @ `52e36d9` under `docs/standing-tiers/`. DockClear / UI-fit: brief **#60 stay-locked**; engine **#61 stay-locked** @ `74f574b` under `docs/dock-clear/`.
- Label Flash / pack numbers as source material until Tenth locks them.
- Do not reopen Phase 1–6 briefs, the side-lane, EW, boarding, Phase 10, flags/utility, ledger, empty-armable, construction, HTML, economy, standing, or dockClear as incomplete.
- Construction visuals **engine** landed (`docs/construction-visuals/`; PRs #52/#53) — stay locked.
- Soft residuals stay explicit: away-team XP S30 engine is on this PR (`named_mix`); Phase 10 full roster deferred; magnitudes injectable. `alertsActive` snapshot S29 engine is landed. **No Referee Pass claimed.**
