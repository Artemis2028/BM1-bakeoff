# BM1 Phase 3 — Holding zones and compliance

**Status:** proposal for implementation; no engine changes made by this document.  
**Repository:** `Artemis2028/BM1-remastered-work`  
**Verified planning baseline:** `9e95626badd4e3b7cf65062ced46990239e65170`, head of `fix/manhunt-range-kill-attribution` / PR #1 on 11 September 2026.  
**Recommended writer:** Astra for the state transitions, persistence changes and integration. Sol should independently review the implementation and extend/run the acceptance probe.

The pushed Phase 2 engine and probe match the reviewed files. The recorded baseline is **61 passing checks**: 47 earlier checks and 14 S4 checks. That browser result was reported and independently verified earlier in the project; this planning pass verified the remote files, not a fresh Chromium run. PR #1 remains open; this document does not describe its contents as merged into `main`.

## 1. The result we want

A station asks a visitor to hold for clearance or leave a restricted area. The visitor knows who issued the instruction, where to go, why, and how much time remains. Complying, withdrawing, refusing, losing contact or losing authority produces one definite outcome.

Exercise the same encounter in both directions:

- At a player holding, a player-owned checkpoint handles foreign NPC visitors according to the holding's access policy. The player can manage the checkpoint and its orders.
- At one authored foreign checkpoint, the player receives the same kind of instruction and can comply, request clearance, ask for the instruction again, withdraw or refuse. Foreign enforcement remains under foreign command.

This is local border gameplay. It is not yet cargo law, a galaxy-wide police network, or a new military campaign system.

**Proposed first-release decisions:**

| Question | Proposed answer |
| --- | --- |
| Where does a zone exist? | One active checkpoint per system, anchored to a live installation owned by the authority that holds the system. Player checkpoints are explicitly enabled. |
| What does `challenge` mean? | Hold at a marked point for a short broadcast identity check. No cargo search. |
| What does `closed` mean? | Request withdrawal from the marked area. Leaving completes that request. |
| Does refusing authorize weapons? | No. Record noncompliance; existing ROE and explicit attack orders still determine weapons use. |
| When does time advance? | During active local simulation only. No wall-clock expiry or requirement to make another jump. |
| What happens on capture? | Old orders and clearances end. Retained player policy and checkpoint configuration remain inactive until the player has authority again. |

These are recommendations for this phase, not new decisions attributed to the user.

## 2. Preserve the Phase 1 and Phase 2 contracts

The authority is a political side, not a flag. Player authority requires `isSystemControlled(systemIndex)`; `hasFactionAccessAt` grants commercial privileges, not checkpoint powers. A Klingon flag at Klingon-held Qonos does not give the player jurisdiction.

Ownership and command continue to come from `getStationOwner`, `getNpcSideId` and the existing player-side predicates. A visiting patrol can respond voluntarily without becoming a player escort. A foreign concession cannot become the player's checkpoint merely because it sits inside a player holding.

Keep the two ROEs:

- **Return fire only:** the existing attributable attack evidence in this system, or a matching active raid against the holding, permits defense.
- **Defend:** retain Phase 2's existing hostility and war-flag engagement behavior as well.

An access decision, a deadline, a refusal or a failed identity check must never write `hostile`, change faction standing, create `attackId`, or manufacture aggression evidence. Successful clearance does not erase a real attack, change standing, or stop an unrelated military operation.

Under `defend`, a war-flag vessel may already be a weapons target before a checkpoint says anything. Clearance is an access permission, not a ceasefire. Say this in the UI; use a peaceful pairing for the introductory encounter.

Preserve explicit attack-order precedence and the guard against targeting the player's own assets. Preserve personal arrival protection. No `protect-all` mode, automatic warning shots, boarding combat or new alliance rules in this phase.

## 3. Checkpoint geometry and authority

### Configuration and activation

A checkpoint definition contains a stable zone ID, system index, anchor station ID, purpose, radius, holding-point rule and policy source. Its active authority is validated against current control and current station ownership; an old saved `ownerId` is not enough.

A player can enable a checkpoint only while controlling the system and selecting a live, completed, player-owned station there. No suitable station means no checkpoint. Enabling one does not spawn ships, grant free equipment, seize a concession or rebuild a ruin.

For the authored foreign encounter, use one suitable Vulcan government station at Vulcan. It is active only while Vulcan holds that world and owns that station. Its authored access values are `warFlag: closed`, `independent: challenge`, `other: challenge` and `unknown: open`, subject to the contact limits below. It has no dependency on the player's empire-default policy. Do not install a checkpoint at every foreign world automatically.

One active zone per system is enough for Phase 3. A saved player configuration and an authored foreign definition can coexist, but their authority conditions prevent both being active at once.

### Proposed starting geometry

These values are tuning defaults, to be checked against real ships and station spacing during implementation:

| Element | Starting value / rule |
| --- | --- |
| Protected perimeter | Circle of radius 500 world units around the anchor. |
| Holding point | A reachable point about 350 units from the anchor, inside the perimeter. Choose a clear approach direction and keep it fixed for that order. |
| Hold tolerance | Within 60 units of the assigned point, with navigation in its stopped/holding state. |
| Checkpoint observation/hail range | 750 units, with a valid local contact. This is a simple Phase 3 contact rule, not a completed sensor model. |
| Withdrawal destination | A clear outward point at least 650 units from the anchor. |
| Withdrawal completed | Beyond 600 units; require a physical departure beyond 650 before a later inward crossing can count as another intrusion. |

The first observed inward crossing starts an encounter; a newly observed visitor already inside the perimeter also qualifies. Loading a scene is not an inward crossing. Persist the visitor's previous boundary state.

Changing the anchor or perimeter closes outstanding instructions as `zone_reconfigured` and invalidates their old geometry. Re-evaluate affected visitors with a fresh, explained instruction if needed; moving a boundary cannot itself create noncompliance. Normal anchor movement must carry its assigned markers consistently rather than leave an unreachable holding point behind.

The holding point and exit route must avoid known solid obstacles and be reachable by the actual ship. If no safe route exists, do not issue an impossible instruction or start a violation timer. Show `Checkpoint unavailable: no safe route` to its operator.

Draw the perimeter, anchor, holding point and relevant exit marker in system space and the minimap. Distinguish the legal perimeter from the physical map edge. The perimeter does not grant ownership of enclosed foreign installations or restrict their turrets.

## 4. Access classification and policy resolution

Retain the Phase 2 policy shape and dimension-by-dimension inheritance:

```json
{
  "roe": "defend",
  "access": {
    "warFlag": "open",
    "independent": "open",
    "unknown": "open",
    "other": "open"
  },
  "alerts": "incidents"
}
```

At a player checkpoint, use `getEffectiveSecurityPolicy(systemIndex)`. At the authored foreign checkpoint, use its explicit authored policy. Never apply a player's retained local override to the occupying government.

Separate contact information from simulation identity. The checkpoint knows its own assets, and otherwise uses the visitor's available broadcast information. Current displayed faction information is the initial broadcast source; do not infer nationality from hull art, procedural cargo text, or an undisclosed internal side ID. An encounter may explicitly provide an identified custom polity broadcast.

Apply this precedence:

| Test | Result |
| --- | --- |
| Asset belongs to the checkpoint authority's own side | Exempt from visitor orders. The exemption must use side/ownership, not a matching flag. |
| No identified broadcast is available | `unknown`; return the stored decision with `enforceable: false` in this phase. |
| Identified, recognized broadcast faction is at war with the authority's current flag | `warFlag`. |
| Broadcast explicitly identifies independent status | `independent`. Identified independent ships/worlds remain distinct sides. |
| Everything else identified | `other`, including a same-flag foreigner, an allied visitor, and an identified custom organization. |

A custom government does not become independent or unidentified merely because its ID is absent from the recognized faction table. A missing value does not become an explicit declaration of independence. A neutral player visiting a foreign checkpoint is an independent visitor; a player-owned ship at the player's checkpoint is exempt.

Proposed API:

```js
getVisitorAccessDecision(zone, contact)
// { class, decision, enforceable, reason }
// Exemption is explicit; it is not a fifth configurable access class.
```

Activate controls for `warFlag`, `independent` and `other`. Keep `unknown` stored and merged, but show it only as an unavailable future capability until the contact/sensor model supports unidentified visitors. Do not quietly enforce hidden identity. Keep `alerts` reserved; Phase 3 does not add its controls or implement a notification network.

With all access values `open`, a player checkpoint produces no orders. An open visitor is not inspected and is not assigned an offense.

## 5. The order and its outcomes

One encounter identifies the zone, authority epoch, physical visitor instance and entry episode. It can carry a revised instruction; it must not create a fresh incident every tick or on every hail.

### Challenge

1. Deliver one instruction identifying the authority, zone, reason, holding point and deadline.
2. A cooperating visitor travels to the point. Its ordinary traffic destination must not overwrite this objective.
3. Once stopped within tolerance, accumulate **five active local seconds** of dwell. Leaving the holding condition resets dwell, not the whole travel allowance.
4. Check the declared broadcast fields supported by the current model. Do not claim authenticity verification, contraband detection or a cargo search.
5. Record `cleared`, end the order and resume the visitor's ordinary route. Clearance applies to this physical visit under this authority and relevant access policy.

If required broadcast information is unavailable, return `check_incomplete` for operator review. Do not invent cargo, assume deception, grant verified clearance or automatically authorize fire.

### Closed access

Deliver a withdrawal instruction with an outward destination and deadline. Once the visitor physically leaves the perimeter by the completion rule, record `withdrawn` and end the order.

A cooperating NPC must then choose a permitted destination or depart. Restoring its original destination inside the closed zone would create an endless leave/re-enter loop and is not acceptable.

A withdrawn visitor has not received clearance. A later deliberate, fully separated inward crossing can create a new entry episode. Boundary jitter, reopening a menu, scene restoration and reloading cannot do so.

### Deadline and refusal

Use the ship's actual movement profile and route distance to choose a travel allowance, rather than giving a slow freighter an impossible universal countdown. Starting proposal:

```text
allowance = max(45 seconds, 2 × estimated travel time + required dwell)
```

Include turning/approach time in the estimate. Assign the allowance once on delivery or on a materially changed instruction, not once per update. A clarification repeats the same instruction and remaining time.

Explicit refusal and expiry end the instruction as `refused` or `expired`. Both can set the local outcome `noncompliant`. Neither is attack evidence. Do not automatically restart the demand for the same uninterrupted entry episode.

### Exceptional endings

| Condition | Outcome |
| --- | --- |
| Authority changes | `authority_changed`; cancel old instructions and revoke old clearances. |
| Checkpoint destroyed, unfinished, disabled or no longer owned by its authority | `checkpoint_unavailable`; no fault assigned to the visitor. |
| Visitor physically leaves or completes a departure | `withdrawn` or `departed`, as appropriate; no pursuit objective survives it. |
| Visitor destroyed | `visitor_destroyed`; close the order without granting clearance or assuming who killed it. |
| Engines disabled, tractor-held or route made impossible | `unable_to_comply`; no deadline offense from inability. |
| An immediate combat/safety objective preempts the movement instruction | `interrupted`; terminate this administrative instruction. Existing combat continues under its own rules. |
| Contact lost | `contact_lost`; stop directing movement toward an unobserved position. A recovered contact in the same entry episode does not create a new incident automatically. |
| Operator cancels or waives the check | `canceled` or `waived`; a waiver may permit this visit but is not verified compliance. |

An attack can invalidate a clearance, but its permission to defend comes from existing aggression/raid evidence. Do not copy a security outcome into that evidence path.

### Derived facts

Derive facts from the encounter record rather than maintaining unrelated booleans:

- `inspection_order_active`: true only while an issued **movement/identity-clearance** instruction is pending. It does not imply cargo inspection.
- `compliance_verified`: true only after the current instruction's measurable requirements were satisfied. Record the scope: `movement_identity` or `withdrawal`.
- `access_clearance`: a separate visit permission, granted by a completed check or explicit waiver. A waiver records its own provenance and never sets `compliance_verified`.

Keep the original noncompliance outcome if the visitor later withdraws. Record the later departure as resolution, without inventing a second offense or rewriting history as verified inspection.

## 6. Movement and player interaction

### NPC visitors

For the first slice, ordinary non-hostile `traffic` and `localTraffic` ships can voluntarily follow the instruction. Give them a dedicated navigation objective with explicit approach, hold and withdraw states. A destination coordinate alone is insufficient: the current arrival logic can immediately choose a new destination.

Do not change `role`, `sideId`, `fleetId`, faction or command membership to make compliance work. Patrols and vessels with military missions retain those missions. They may ignore a hail; being ordered by a checkpoint does not conscript them or make ignoring it an attack.

New ambient departures must not start while a civilian is executing a checkpoint objective. A departure already in progress is not pulled back or teleported into an inspection. Record the actual departure if the encounter ends that way.

Immediate combat, tractor/engine-disable handling and safety behavior retain priority. Administrative objectives terminate with the relevant reason when preempted; they cannot leave a ship frozen indefinitely.

### Player as visitor

Use an incoming hail/order panel available in flight, not only the dock menu. Display authority, zone, reason, instruction, marker and countdown. Provide:

- **Acknowledge / comply:** accept the instruction and mark the holding point; the player flies there using existing controls.
- **Repeat instruction:** show the same terms and exit route; no timer reset.
- **Request clearance:** evaluate the supported check when the player is holding correctly; otherwise explain the unmet condition.
- **Withdraw:** mark the exit destination; completion requires physical movement.
- **Refuse:** close the instruction as refused, with the actual consequence stated before selection.

No instant relocation, automatic player steering or forced surrender. Controls stay available. Completing or refusing this encounter does not cancel the player's fleet orders, allegiance or wider objectives.

The foreign example must be playable with a peaceful visiting flag. The player cannot edit its policy; the same authority checks must reject direct setter calls as well as hide UI buttons.

## 7. UI for the checkpoint operator

Extend the existing **Security** tab at player-controlled worlds:

1. Keep the two ROE controls and empire-default actions.
2. Add the three usable access rows, each with **Open / Challenge / Closed**. Preserve the partial-override merge behavior.
3. Add checkpoint enable/disable and anchor selection from eligible owned installations. Show the active authority and whether the checkpoint is available.
4. Show a small encounter list: ship, reason, instruction, remaining time and current outcome. Selecting an entry highlights its holding/exit marker.
5. Allow an authorized operator to **Waive this check**, **Request withdrawal** or **Cancel instruction**. Waiving affects this visit, not the empire policy.

Changing an instruction updates the existing encounter with a revision and a new, justified travel allowance. It does not erase earlier events. A more restrictive access change must deliver its new instruction and grace period before any noncompliance can be recorded. Relaxing access closes the pending demand as `policy_relaxed`; changing only ROE or the reserved alert field does not invalidate access clearance.

Local orders and their outcomes must remain readable in the encounter panel even if the single global log line changes. Use a bounded local history for this purpose. Do not advertise FLASH alerts, report propagation or configurable alert filtering before Phase 4 implements them.

Suggested explanatory text:

> Challenge requests a movement and identity check. Closed requests withdrawal. Refusal alone does not authorize weapons; your rules of engagement still apply.

## 8. Identity, time and persistence

Two dependencies must be addressed explicitly. Current ambient arrival can reuse an NPC's `id` for a replacement ship. Current saves preserve neither the complete `systemStates` cache nor all runtime NPCs. Attaching an order to `npc.id` and storing a `performance.now()` deadline would therefore be insufficient.

### Minimal durable records

Proposed additional state; exact field names can change during review:

```js
state.securityZones = {
  version: 1,
  nextVisitorInstance: 1,
  systems: {
    // [systemIndex]: { playerConfiguration, authorityEpoch }
  }
};

state.securityEncounters = {
  version: 1,
  systems: {
    // [systemIndex]: {
    //   localElapsedMs,
    //   visitors: { [instanceId]: visitAndBoundaryState },
    //   orders: { [encounterId]: orderAndOutcome },
    //   participants: { [instanceId]: boundedNpcSnapshot },
    //   recentEvents: []
    // }
  }
};
```

An order needs at least: encounter ID, zone ID, authority side and epoch, visitor instance ID, entry episode, relevant policy revision, instruction kind, lifecycle state, reason, assigned points, remaining travel time, accumulated dwell, result and derived-fact inputs.

Give a physical NPC a separate persistent `securityInstanceId`. Preserve it through restoration of that same vessel. Assign a new one when `beginAmbientTrafficArrival` produces a replacement, even if the engine reuses `npc.id`. Do not change Phase 1's political `sideId` to solve encounter identity.

A clearance is tied to that instance, visit, authority epoch and access requirements. It ends on actual departure, relevant policy change, authority change, or independently established aggression. Unloading the scene alone is not departure.

### Clock and restoration

Advance remaining time from the same bounded simulation delta used for local movement. The current dock menu does not stop all NPC simulation: do not assume docking freezes the countdown. Advance only on ticks that actually simulate this local scene; do not charge warp transitions, unloaded systems, a stopped loop or time while the application is closed.

For the first release, off-screen encounters remain dormant. Explain that limit rather than claiming a remote traffic simulation. When the system is restored, continue the same order and remaining time. No deadline resets, catch-up fines, fresh grants of clearance or additional jump needed to finish an order.

Distinguish the actor from the scene: a completed player warp/wormhole trip is an actual departure for the player visitor and closes that local demand. Merely unloading the NPCs left behind does not mean those NPC visitors departed. A canceled jump is neither a departure nor an instruction reset.

Persist the affected NPC participants needed to resume active instructions and valid visit clearances, including identity, position, hull/shields, navigation objective and relevant existing mission/temporary-state data. Merge them with generated ambient traffic by instance and spawn slot to prevent duplicates. The player already has a save representation and must not be restored as an extra NPC.

Rebase any saved temporary combat timers to remaining durations; do not persist raw page-uptime timestamps as meaningful after reload. Security restoration must not manufacture aggression, a matching raid, a new hull or a new commander. This is bounded persistence for encounter participants, not a claim to fix every pre-existing fleet/save issue.

Save the encounter ledger independently of `systemStates`, because cache invalidation also happens outside normal travel. Reconcile participants and validate authority after the generic scene restoration has finished. An invalid/missing participant cancels its order with a recovery reason; it is not replaced with a different ship and declared noncompliant.

### Loss, reclaim and limits

Increment an authority epoch on each actual holder change, even if the player later reclaims the same world. Old instructions and clearances never reactivate. Player policy overrides and checkpoint configuration may reactivate only if the current holder and station-ownership checks allow them; new encounters use the new epoch.

Old saves without these records start with no player checkpoints and no active orders. Sanitize identifiers, enum values, durations and geometry. Prune completed history to a fixed bound, proposed at 32 recent resolved encounters per system; retain live permissions and active orders until they genuinely end. If an active-record cap is necessary, stop issuing new orders at capacity rather than silently dropping one and blaming its visitor.

## 9. Integration points

Prefer a small security module/helper group with explicit inputs and transitions. Keep the current engine's update path as the single movement/combat path.

| Existing path | Required integration |
| --- | --- |
| Phase 1 control and ownership resolvers | Validate jurisdiction and eligible anchor ownership on activation and every encounter update. |
| Phase 2 policy setters/resolver | Activate known access classes; preserve dimension merge and detect relevant access changes. |
| `createNpcShip` and first ambient restoration | Assign/preserve a physical visitor instance without changing political identity. |
| `beginAmbientTrafficArrival` | End the previous physical visit and give the replacement its own instance. |
| Ambient departure eligibility and destination-arrival handling | Respect an active civilian compliance objective; prevent automatic departure or route reset from overwriting it. |
| `updateNpcShips` | Execute approach/hold/withdraw through existing movement, with explicit priority and terminal handling. |
| `tick` | Evaluate local encounters and elapsed time once per local simulation step; consume physical movement results consistently. |
| `applySystemState`, cache invalidation and save/load | Restore/reconcile participants, boundary state, orders and remaining time without duplicates. |
| Control transfers, station destruction and reset/new game | Invalidate authority-bound records, close unavailable checkpoints and initialize clean state. |
| Security panel, hail panel, system rendering and `drawMinimap` | Configure authorized checkpoints; expose live instructions, markers and outcomes. |
| Combat target predicates and firing attribution | Preserve existing semantics. Access/refusal never feeds hostility or aggression setters. |

Do not use `buildShipScanReport` as a cargo inventory. Its seeded cargo descriptions are display flavor. A later cargo-inspection patch needs actual manifests and evidence rules first.

## 10. Acceptance probe: S5

Keep all **61 existing checks** passing. Add scenario fixtures that fail setup if a required ship, station, route or authority is missing. Classification assertions alone are insufficient: exercise movement, holding, withdrawal and actual UI clicks through the real game.

| Case | Required exercise and result |
| --- | --- |
| S5.1 Open access | An ordinary visitor crosses an enabled open zone through ticks. No order, inspection fact, offense, standing change or extra shot is created. |
| S5.2 Challenge | A civilian receives exactly one order, navigates to the point, stops for the dwell, receives scoped verified clearance and resumes its route. Ordinary arrival logic cannot overwrite the objective. |
| S5.3 Closed access | A civilian receives one withdrawal instruction, crosses the exit threshold and leaves or selects a permitted destination. No endless pursuit or immediate automated return to the closed destination. |
| S5.4 Refusal and expiry | Under `return-fire`, a calm war-flag visitor refuses or times out. Noncompliance is recorded once, no aggression/raid flags or standing changes appear, and player turrets/escorts do not fire solely for refusal. |
| S5.5 Real aggression | With a closed/challenge policy and `return-fire`, a real shot against the player's side or a correctly matched active raid still permits the existing defense. Expired or remote evidence still does not. |
| S5.6 Authority and ownership | Same-flag foreign control rejects zone/policy mutation. Foreign/private stations cannot be selected as player anchors. Side, owner, role and fleet membership stay unchanged through all outcomes. |
| S5.7 Classification | Own-side exemption, same-flag foreigner, explicit independence, recognized war flag and identified custom polity resolve correctly. An unidentified contact produces no hidden-identity enforcement. |
| S5.8 Player compliance | At the authored foreign checkpoint, actual hail buttons explain the order, retain its timer on clarification, and grant clearance only after the player physically satisfies it. A clearance request before holding is refused with a concrete reason. |
| S5.9 Player withdrawal/refusal | Withdraw marks an exit and resolves only on physical departure; refusal closes the order without granting clearance or inventing an attack. The player cannot edit the foreign checkpoint. |
| S5.10 Time and interruptions | Slow ship allowance is viable. Simulated local time advances while NPCs move; unloaded/paused time does not. Tractor/engine disable, blocked route, contact loss and combat preemption end safely without a fabricated deadline offense. |
| S5.11 Save and scene re-entry | Save during approach and again during dwell; reload/re-enter. Same participant, order, entry episode and remaining time, with no duplicate ship, refilled hull, repeated incident or automatic clearance. Invalidate `systemStates` too. |
| S5.12 Replacement and boundary identity | A real ambient replacement reusing an NPC ID gets a different instance and no inherited clearance. Boundary jitter/reload does not create a new episode; genuine separated departure/re-entry can. |
| S5.13 Capture and reclaim | Use actual fleet capture and claim paths. Old orders/clearances end on capture; retained policy cannot command occupiers. Reclaim may restore eligible configuration, but never old instructions or permits. |
| S5.14 Policy changes and operator UI | Through UI clicks, change one access dimension, waive a check, request withdrawal and cancel an instruction. Preserve unrelated fields; stricter access sends a new revision/grace without duplicating the incident. Relaxation closes the demand. Reconfiguring zone geometry creates no offense. |
| S5.15 Checkpoint loss and legacy save | Destroy/disable the anchor: pending demands end without visitor blame. Old saves load with no active player zone/orders. Invalid serialized records recover without crashing or attaching an order to the wrong vessel. |
| S5.16 End-state isolation | Clearance, waiver and withdrawal end only this demand. Existing hostility, legitimate kill attribution, separate combat evidence and unrelated mission/escort orders are not erased. |

Each case can contain multiple assertions. Do not promise a final pass count before the probe is implemented. Include a startup smoke check and screenshots of the operator panel, incoming player order and map markers for the reviewed commit.

## 11. Implementation sequence and handoff

1. **Astra: identity and persistence foundation.** Add versioned encounter records, instance IDs, local time, authority epochs and bounded participant restoration. Verify reload and ambient replacement before building more encounter UI.
2. **Astra: encounter and navigation behavior.** Implement zone activation, access resolution, order transitions, voluntary civilian objectives and the authored player-as-visitor encounter. Keep combat semantics separate.
3. **Astra: UI and integration.** Add operator controls, player hail responses and map markers. Check readable reasons, reachable routes and all terminal states in the real game.
4. **Sol: independent review and S5 probe.** Write exercises from this contract, check ownership/identity leakage and save restoration, and run the complete probe against the exact proposed head. Feed failures back for fixes.
5. **Commit and publish only within the authorized workflow.** Keep engine changes and probe additions reviewable, record the tested head and disclose remaining limits. This proposal itself authorizes no merge or branch rewrite.

If one model must do the whole implementation, choose Astra and reserve a separate review pass with Sol. No need to allocate lore writing yet; once the actual instruction/outcome paths work, Fable can take the authored checkpoint dialogue for an editorial pass.

## 12. Deferred work remains on the plan

Phase 4 should define incident attribution, witnesses, escalation authorization, report propagation, bounded consequences and FLASH alerts. That is where we decide whether repeated noncompliance can ever justify interception or force, with a clear distinction between an aggressor and someone returning fire.

Later slices add actual cargo inventories and inspections; configurable unidentified-contact access after sensors exist; military negotiation/surrender; escort-out fleet assignments; checkpoints at more faction borders; persistent remote objectives; trade permits and jurisdiction exceptions for concessions; and richer faction-specific dialogue and doctrine.

Phase 3 is complete when the two directions of the encounter work, every demand ends intelligibly, persistence cannot transfer an order to the wrong ship, and access policy cannot silently become permission to attack.

## Sources and precedence

- [Verified Phase 2 head](https://github.com/Artemis2028/BM1-remastered-work/commit/9e95626badd4e3b7cf65062ced46990239e65170).
- [Engine at that head](https://github.com/Artemis2028/BM1-remastered-work/blob/9e95626badd4e3b7cf65062ced46990239e65170/src/main.js), including policy resolution, NPC movement, ambient replacement and save/load.
- [Acceptance probe at that head](https://github.com/Artemis2028/BM1-remastered-work/blob/9e95626badd4e3b7cf65062ced46990239e65170/scripts/behavior-probe.mjs).
- [Doctrine integration guide at that head](https://github.com/Artemis2028/BM1-remastered-work/blob/9e95626badd4e3b7cf65062ced46990239e65170/docs/doctrine/DESIGN-doctrine-v0.2.1.md).
- Project planning context: `BM1-REVISED-DEVELOPMENT-PLAN-2026-09-11.md`, `BM1-CLOUD-PROJECT-HANDOFF.md`, `BM1-CURRENT-REVIEW-AND-AI-PLAN.md`, and the later decisions in this conversation.

The settled Phase 1/2 behavior and the user's latest decisions take precedence over older doctrine wording. Geometry, deadlines, the single foreign encounter and the implementation structure above are proposed Phase 3 choices, not existing engine behavior.
