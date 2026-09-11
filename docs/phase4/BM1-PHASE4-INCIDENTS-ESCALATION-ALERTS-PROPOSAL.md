# BM1 Phase 4 — Incident records, escalation, reports and alerts

**Status:** proposal for implementation; no engine changes made by this document.  
**Repository:** `Artemis2028/BM1-bakeoff`  
**Planning baseline:** `ff82cf4` on `main` (11 September 2026), after Phase 3 holding zones/compliance (`da1604b`) and the Phase 3 changelog row (`1fc2107`).  
**Referee context:** Phase 3 §5 **Pass** on `da1604b`. This brief does not claim a new Referee Pass and does not update `docs/BAKEOFF-STATUS.md`.  
**Companion:** `docs/phase4/BM1-PHASE4-ENGINE-DEPENDENCIES.md` (hooks, risks, probe plan).

Phase 1–3 already landed in this bake-off: political authority, two-mode ROE, and holding zones/compliance. Doctrine v0.2.1 is loaded as a runtime adapter; `evaluateReact` and fire inspection exist, but reactions are not yet acting gameplay. The single `setLog` line is still a replaceable banner.

This is local incident bookkeeping and notification. It is not a galaxy-wide police network, a second standing system, or permission to fire from a checkpoint.

## 1. The result we want

An attributed event becomes one durable incident with a readable history. A visitor, operator or nearby observer can see who was involved, where, under whose jurisdiction, what was known at the time, and how it ended. Consequences are bounded and applied once. Muting alerts never pretends the incident did not happen.

Exercise the same ledger in both directions:

- **At a player holding:** a Phase 3 checkpoint refusal, inability, or a real attributed kill writes an incident the operator can read. Alert mode decides whether a FLASH notice appears. Existing ROE and the kill-standing cascade still decide weapons and standing.
- **At the authored Vulcan checkpoint:** the player’s own refusal or a witnessed destruction produces observer copies. A Vulcan patrol or relief ship may *act* as `investigate` or `rescue`. An unrelated Klingon unit that knows about it may `record_only` and continue.

**Exit condition (plan §4):** attributed incidents have readable histories, bounded consequences and no duplicate punishment.

**Proposed first-release decisions:**

| Question | Proposed answer |
| --- | --- |
| What is the first playable slice? | One durable incident ledger, fed by Phase 3 terminals and by player-credited destruction already in this system. One authored contrast at Vulcan: investigate / rescue / record_only. |
| Where does the ledger live? | `state.incidentLedger`, saved like `securityEncounters`. Never inside `systemStates`. |
| Do refusal or `unable_to_comply` authorize force? | **No.** They remain non-aggression evidence. No raid, standing hit, `attackId`, hostility or fire gate. |
| Can repeated refusal escalate to interception? | **No in Phase 4.** Repeat visits may raise watch/investigate. They never become weapons, raids or standing. |
| When may doctrine responses act? | `record_only` always writes an observer copy. `investigate` and `rescue` may move a *present, eligible* local ship. They do not spawn fleets or authorize fire. |
| What do alert modes do? | Activate the reserved Phase 2 `all` / `incidents` / `silent` values. Silent mutes display only. |
| What is FLASH? | A priority incident-class notice that salvage and background `setLog` must not instantly overwrite. |
| How is standing applied? | Destruction still uses the existing `applyKillStanding` / witness path once. Phase 4 records that token and must not charge again. |

These are recommendations for this phase, not new decisions attributed to the user. Locked bake-off constraints take precedence over older doctrine wording that left “repeated noncompliance → force” open.

## 2. Locked constraints (do not reopen)

The bake-off team locked these before this brief. Implementation and probes must treat them as hard gates.

1. **Checkpoint `refused` / `expired` (outcome `noncompliant`) and `unable_to_comply` remain non-aggression evidence.** Phase 4 must not turn them into raid flags, standing hits, `observedAttacks` rows, `attackId`, `playerAggroUntil`, hostility, or fire authorization. Phase 3 docking/service denial and the encounter record already exist; that is the administrative consequence.
2. **No double punishment** with the kill-standing cascade (`applyKillStanding` plus witness-patrol `-2`) or any other existing punishment path (latinum payout, feat unlocks, hostile-at-threshold log). An incident may *describe* a kill that already paid standing. It must not pay it again.
3. **Doctrine `investigate` / `rescue` / `record_only` may become acting.** Acting still obeys (1) and (2). Investigation is search and reporting. Rescue is aid when survivors are actually known. `record_only` writes and continues. None of these three is a weapons order.
4. **Proposal first**, then a bounded engine slice. This document plus the engine-dependency checklist are the Phase 3-shaped handoff. Do not implement from this text until Tenth scopes the engine lane.

Also preserve, without reopening:

- Authority is a political side (`isSystemControlled`), not a flown flag.
- Two ROE modes unchanged. Access is a permission, not a ceasefire.
- Phase 1 combat credit: only `player` / `playerEscort` final hits reward or blame. NPC-only destruction creates no player standing.
- `protect-all`, boarding, warning shots as fire, new alliances, cargo inventories, and unidentified-contact enforcement stay deferred.
- Culture cannot grant fire permission.
- `engagement_authorized` is never injected as a world fact.

## 3. What an incident record is

An **incident** is a durable attributed event. It is not a Phase 3 encounter, not a `setLog` string, and not a standing delta.

A Phase 3 **encounter** is one visitor’s instruction during one entry episode. An **incident** is the attributed fact that something happened: an access outcome, a destruction, a distress observation. One encounter episode produces **at most one** access-family incident. Combat may produce a separate destruction incident, linked, not cloned.

### 3.1 Required fields

Proposed shape; exact names can change in review:

```js
{
  incidentId: 'inc-1',
  version: 1,
  kind: 'access_noncompliance', // see catalog
  severity: 'administrative',   // administrative | inability | combat | distress
  status: 'open',               // open | resolved | superseded
  systemIndex: 11,
  locationId: 'system:vulcan',
  jurisdictionId: 'authority:vulcan',
  authoritySide: 'vulcan',
  authorityEpoch: 1,
  actor: {
    instanceId: 'player',       // securityInstanceId, never reused npc.id
    kind: 'player',
    sideId: 'neutral',
    broadcast: { faction: 'ferengi', source: 'declared' },
    role: null
  },
  victim: {
    instanceId: null,           // access incidents may have authority-as-holder, not a hull
    kind: 'authority',
    sideId: 'vulcan'
  },
  action: 'refused_challenge',
  clocks: {
    localElapsedMs: 120000,     // Phase 3 system ledger clock
    strategicJumps: 0,          // completed player warp/wormhole only
    issuedAtLocalMs: 90000
  },
  outcome: 'noncompliant',
  links: {
    encounterId: 'enc-4',
    zoneId: 'authored:vulcan',
    entryEpisode: 1,
    attackId: null,
    punishmentToken: null
  },
  truth: {                      // simulation fact
    identified: true,
    attributed: true,
    confidence: 1,
    notes: 'Visitor refused an issued challenge.'
  },
  history: [                    // bounded, append-only
    { atLocalMs: 90000, type: 'opened', detail: 'challenge refused' }
  ]
}
```

Keep **simulation truth** on the incident. Keep **observer evidence** on report/observer-copy records (section 6). Identification, attribution, confidence, freshness and report provenance are different fields. A disappearance, a refused hail and a credited kill are not interchangeable.

### 3.2 First-slice kind catalog

| `kind` | Severity | Opens when | May escalate to |
| --- | --- | --- | --- |
| `access_noncompliance` | administrative | Encounter ends `refused` or `expired` | notice, watch, `record_only`, `investigate` (search only) |
| `access_inability` | inability | Encounter ends `unable_to_comply` | notice, `record_only`. **Not an offense.** |
| `access_notice` | administrative | Optional informational close (`withdrawn` after prior noncompliance, waiver, cancel). Default: **do not open** | none |
| `destruction` | combat | Player or player-escort credited hull/station kill in this system | notice, `record_only`, `investigate`, `rescue` if survivors known |
| `distress` | distress | Authored or locally observed survivor-capable distress (first slice: fixture or explicit probe inject) | notice, `rescue` if `survivors_known`, else `record_only` |
| `witnessed_aggression` | combat | Existing attributable attack on the player’s side already recorded by Phase 2 | notice only; weapons stay on ROE |

Do **not** open incidents for: `cleared`, first-time `withdrawn` without prior noncompliance, `waived`, `canceled`, `policy_relaxed`, `zone_reconfigured`, `not_addressed`, `contact_lost`, `checkpoint_unavailable`, `authority_changed`, `interrupted`, scene unload, or ambient replacement.

`visitor_destroyed` closes the encounter without assuming a killer. If `destroyNpcShip` / `destroyStation` also ran with player credit, that path opens the `destruction` incident. Do not open both an access blame incident and a destruction incident for the same hull as if the checkpoint killed them.

### 3.3 Proposed API

```js
openIncident(input)        // { incident, created }
appendIncidentEvent(id, ev)
resolveIncident(id, reason)
linkEncounterToIncident(encounter, kind)
getIncident(id)
listIncidentsForSystem(systemIndex)
listIncidentsForVisitor(instanceId)
```

Idempotency: `(kind, systemIndex, actor.instanceId, encounterId|attackId|destructionKey)` opens once. Tick and hail must not mint a new `incidentId` for the same fact.

## 4. Identity and persistence

Phase 3 already proved that `npc.id` is reused by ambient replacement and that `systemStates` is wiped on load, data reload, station build, wormhole build and reset. Incidents inherit those rules.

### 4.1 Identity

| Identity | Rule |
| --- | --- |
| `incidentId` | `inc-${nextIncidentId}`, monotonic, never recycled for a live record |
| `securityInstanceId` / `visitorInstanceId` | Physical vessel. Replacement via `beginAmbientTrafficArrival` is a new actor. |
| Encounter / entry episode | Access incidents key on these so a revision is not a new crime |
| `authorityEpoch` | Holder change closes jurisdiction-bound access incidents as `authority_changed` |
| `locationId` / `jurisdictionId` | From existing `currentLocationIdentity` / doctrine `locationIdentity`. Do not invent a second gazetteer. |
| `punishmentToken` | Stable key for one standing/reward cascade, see §8 |

Do not change Phase 1 `sideId` to solve incident identity. Do not treat hull art as a transponder beyond the Phase 3 `broadcast.source` contract (`hull` / `declared` / `none`).

### 4.2 Store

```js
state.incidentLedger = {
  version: 1,
  nextIncidentId: 1,
  nextReportId: 1,
  incidents: { /* [incidentId]: record */ },
  reports: { /* [reportId]: report */ },
  observerCopies: {
    // [observerKey]: { knownIncidentIds: [], lastEvaluated: {} }
  },
  alerts: {
    flashQueue: [],     // bounded
    lastAcknowledgedId: null
  }
};
```

Serialize and restore beside `securityEncounters` in `saveGame` / `loadGame`. Initialize on `resetRunState` / new game. Sanitize enums, IDs, clocks and history length. Old saves start with an empty ledger.

**Clock:** reuse the Phase 3 local simulation clock (`localElapsedMs` advanced from `tick(frameScale)`). Do not persist `performance.now()` as a meaningful deadline. Strategic fields increment only on **completed** player warp/wormhole. Canceled travel and load must not advance or duplicate outcomes.

**Bounds (starting proposal):** 48 incidents globally retained after resolve, 16 live `open` incidents, 24 reports, 12 FLASH queue entries, 8 history rows per incident. If a cap would drop a live open record, refuse the new open with `ledger_full` rather than silently blaming a visitor.

**Off-screen:** first slice evaluates only the loaded system, matching Phase 3 dormant remote encounters. Unloading NPCs is not disappearance evidence and is not a new incident.

## 5. How Phase 3 encounters feed incidents

Hook **after** a terminal lifecycle is committed on the encounter record (`closeEncounter` / `terminateEncounter`), not on every hail or dwell tick.

| Terminal lifecycle | Incident action |
| --- | --- |
| `refused`, `expired` | Open `access_noncompliance` once for this encounter. Keep encounter `outcome: 'noncompliant'`. |
| `unable_to_comply` | Open `access_inability` once. Detail must include the blocking reason (tractor, engines, no safe route). **No offense flag.** |
| `withdrawn` or `departed` after a recorded noncompliance | Append `departed` to the existing incident history. Do not open a second offense. Do not rewrite the original outcome as verified compliance. |
| `cleared`, `waived`, `canceled`, `policy_relaxed`, `zone_reconfigured` | No incident. Optional operator log line only. |
| `not_addressed` | No incident. Military/patrol ignore remains non-blame, as Phase 3 specified. |
| `contact_lost`, `checkpoint_unavailable`, `authority_changed` | No visitor-blame incident. If an access incident was already open, resolve it `jurisdiction_lost` / `contact_lost` without converting it to combat. |
| `interrupted` | No access incident. Existing combat evidence stays on the Phase 2 / ROE path. |
| `visitor_destroyed` | No access-blame incident. See §3.2 for a separate `destruction` incident. |

Revision of an active instruction (stricter access, operator withdrawal request) updates the encounter; it does not mint a new incident until a **new terminal** of `refused` / `expired` / `unable_to_comply` occurs. A more restrictive policy still delivers grace before noncompliance, per Phase 3.

**Re-entry:** a fully separated later inward crossing is a new encounter episode and *may* open a new access incident if it again refuses or expires. That is a new administrative record, still not aggression. Boundary jitter, reload and menu reopen still must not create episodes (Phase 3 S5.12).

**Player escorts** at a foreign checkpoint remain part of the flagship visit (Phase 3). Access incidents address the flagship instance (`player`). Do not open one incident per escort.

## 6. Escalation ladder

Escalation is a **reasoned administrative or investigative step**. It is not a weapons ladder.

```text
record
  → notice (FLASH / journal, if alerts allow)
    → watch (same visitor, later separated episode; still administrative)
      → doctrine react: record_only | investigate | rescue | defer:* | ignore_unknown
        → resolve on declared clock or explicit close
```

There is **no** next rung “intercept with weapons” or “standing hit” for access-family incidents in this phase.

### 6.1 What each rung may do

| Rung | Who | Allowed effects | Forbidden effects |
| --- | --- | --- | --- |
| `record` | Ledger | Write/update the incident | Standing, hostility, raid, fire |
| `notice` | Player UI | FLASH and/or journal row per alert mode | Suppressing the ledger; inventing compliance |
| `watch` | Same authority | Remember the visitor instance for this epoch; operator can see “prior noncompliance this holding” | New `attackId`; auto-challenge as aggression; infinite pursuit |
| `record_only` | Observer already in scene | Observer copy + optional outgoing report | Movement hijack, fire, standing |
| `investigate` | Eligible present ship | Local approach to last-known, hail, bounded search, write findings | Fire from the incident; spawn ships; punish refusal |
| `rescue` | Eligible present ship | Approach known survivor location and record aid | Punishment; inventing survivor coordinates |

`defer:investigate` and `defer:rescue` write the matched interest and the failed prerequisite (`can_respond`, role, `survivors_known`, etc.). They do not fall through to a different acting response. `ignore_unknown` writes nothing the ignorant observer can read.

### 6.2 Acting doctrine — first slice

Use the existing pack and `evaluateReact(pack, profileId, role, eventType, facts, cultureId)`. Facts must be derived from **that observer’s** copies, not from global incident truth (doctrine design § “Data contract”).

Map incident kinds to event types for the first slice only:

| Incident kind | Doctrine `eventType` |
| --- | --- |
| `destruction` | `asset_attack` if the observer knows an asset was attacked; otherwise treat as unmatched → `record_only` |
| `distress` | `distress` |
| `access_noncompliance` | `border_breach` **only as a known administrative event**. Interest rules may match `investigate` for evidence; they must not enable `protect` / war / predation fire facts. |
| `access_inability` | Do not feed `border_breach`. Unmatched known → `record_only` or skip. |

Authored contrast (playable, fixture-friendly):

1. **Vulcan system, authored checkpoint still active.** A destruction or distress incident is known to a Vulcan `patrol` / `relief` already in the scene (or a probe-spawned eligible ship that is not a new faction fleet).
2. Vulcan with `survivors_known` → `rescue`. Vulcan with evidence but no survivors → `investigate`.
3. A Klingon `commander` or `patrol` fixture that received the same report **without** `linked_own_losses` / `own_asset_affected` → `record_only` and keeps its existing mission.
4. A Romulan-style “own asset” fixture may `investigate` when the pack says so; if no Romulan ship is present, **defer** — do not spawn one.

Acting movement reuses the Phase 3 lesson: a dedicated objective field (`npc.incidentObjective`), not `destinationName` string matching and not a bare `waitUntil`. Immediate combat, tractor and engine-disable still preempt. The objective ends on: evidence recorded, survivors aided, search clock exhausted, contact lost, ship destroyed, or authority/scene end.

**Fire:** `consultDoctrineFire` / `evaluateFire` stay on existing engagement modes. An incident objective must **not** set `war_order_active`, `attackId`, or `engagement_objective_active` for attack. Investigate/rescue objectives are not engagement objectives.

### 6.3 Player-facing reasons

Every notice and journal row must be sayable in one line, for example:

- `Vulcan checkpoint: Ferengi flagship refused identity check. Administrative record only — weapons unchanged.`
- `Unable to comply: tractor hold. No offense recorded.`
- `Destruction of civilian transport attributed to you. Standing already applied by combat rules.`
- `Vulcan relief is moving to reported survivors.`
- `Klingon patrol recorded the report and continued.`

If the UI cannot state why a rung happened, the rung is not ready to ship.

## 7. Reports and alerts

### 7.1 Reports

A **report** is a delivered message about an incident, not the incident itself.

```js
{
  reportId: 'rep-1',
  incidentId: 'inc-1',
  senderKey: 'npc:vis-12',     // or 'authority:vulcan' / 'player'
  recipientKey: 'player',
  provenance: 'direct_observation' | 'local_broadcast' | 'authority_notice',
  identification: 'known' | 'partial' | 'unknown',
  attribution: 'attributed' | 'unattributed',
  confidence: 0.0,
  freshnessLocalMs: 0,
  payload: { kind, summary, locationId, lastKnown: null },
  delivered: true
}
```

Rules:

- Record sender and recipient. No automatic galaxy-wide knowledge.
- No exact hidden coordinates the sender does not have. Last-known is optional and is not a live lock (Phase 6 still owns sensors).
- Deduplicate `(incidentId, senderKey, recipientKey)`.
- Sending a report is a side action: it must not freeze a freighter or block evasion (doctrine contract).
- First slice: delivery only inside the loaded system (checkpoint authority → player operator; acting observer → its command copy; player journal).

Blame is not inferred from a disappearance. Unloading a ship is not a report.

### 7.2 Activate reserved alert modes

Phase 2 stored `alerts: 'all' | 'incidents' | 'silent'` and `areAlertsActive()` always returned `false`. Phase 3 left the Security copy as “Alert settings remain reserved.” Phase 4 activates **display only**.

| Mode | Player sees | Ledger / orders / ROE |
| --- | --- | --- |
| `all` | Ordinary `setLog` traffic **and** FLASH incident notices | Unchanged |
| `incidents` | FLASH and the incident journal. Background salvage/trade/flavor `setLog` must not replace an unacknowledged FLASH | Unchanged |
| `silent` | No FLASH, no incident `setLog`. Journal still records if the player opens Security | Unchanged. **Not** compliance. **Not** a suppressed incident. |

Default remains the stored value (`all` for new empires). Empire-default and holding override merge by dimension exactly as Phase 2 already does. Changing only `alerts` does not invalidate access clearance (Phase 3 rule).

**Access connection:** Phase 3 already enforces `warFlag` / `independent` / `other`. Phase 4 must not re-interpret access values as alert filters or as ROE. The careful connection is: an access terminal may *emit* an incident that alert mode then *shows*. Access does not become a notification policy, and alerts do not become an access policy.

`unknown` access stays stored and unenforceable until sensors exist.

### 7.3 FLASH

Agreed meaning for this phase:

> **FLASH** is an incident-class notice (priority 1). It stays in a small queue and on the banner until the player acknowledges it, a newer FLASH of equal or higher priority replaces it after a minimum hold, or the alert mode is `silent`.

| Band | Examples | May overwrite FLASH? |
| --- | --- | --- |
| 1 FLASH | New access_noncompliance, destruction attributed to player, acting investigate/rescue started, inability that an operator must see | Only another FLASH after hold |
| 2 operational | Checkpoint hail, “hold at marker”, power failure | No |
| 3 background | Salvage latinum, jump-complete flavor, market chatter | No |

Implementation sketch: `pushFlash(notice)` + `setLog` checks an `alerts` gate. Do not replace `setLog` globally in one sweep; wrap incident-class emitters first. Minimum FLASH hold: **4 local seconds** (simulation clock), then a newer FLASH may replace the banner. The queue retains the last 12 for the journal.

Witness and raid notices that today call `setLog` (“Kill witnessed by…”, salvage line immediately after) must be classified: the **witness/attribution** line is FLASH if it is a new `destruction` incident; the **salvage latinum** line is background and must not clobber it.

### 7.4 UI

Extend the existing Security tab (do not add a second policy religion):

1. Keep ROE, access rows, checkpoint operator and encounter list.
2. Replace “Alert settings remain reserved” with three alert buttons: **All / Incidents / Silent**, empire-default and per-holding override, same merge/retain/reclaim rules as ROE.
3. Add an **Incidents** list: kind, actor label, outcome, age, linked encounter. Selecting one shows history and linked reports.
4. FLASH banner uses the existing top message slot, with a visible `FLASH` prefix and an Acknowledge control when a notice is queued.

Foreign Vulcan checkpoint: the player cannot edit its alerts or access. They can still receive FLASH about *their* visit.

Suggested helper text:

> Alerts change what you are told, not what happened. Silent does not clear a refusal or a kill. Refusal and inability never authorize weapons.

## 8. Bounded consequences and the kill-standing cascade

### 8.1 Existing punishment paths (do not duplicate)

On player-credited ship destruction, `destroyNpcShip` already:

1. Pays latinum salvage.
2. Calls `applyKillStanding(victimFaction, patrol ? -4 : -2)`, which hits the victim and fans out to friends (`-1`) and enemies (`+ceil(|delta|/2)`).
3. Applies witness-patrol `-2` to other nearby patrol factions and logs it.
4. May increment Vex Borg feat / Romulan unlock.

Station destruction uses `applyKillStanding(..., -6)` plus feat checks.

Phase 4 **records** those facts. It does not call `adjustFactionStanding` / `applyKillStanding` for the same destruction.

### 8.2 Punishment token

```text
punishmentToken = `kill:${credit}:${systemIndex}:${victimInstanceId}:${localElapsedMsBucket}`
```

When the combat path applies standing or a feat, stamp the token on the `destruction` incident as `links.punishmentToken` and `links.punishmentApplied = 'kill-standing'`. Any later report, witness copy, or doctrine react that refers to that incident must refuse a second standing write.

NPC-only destruction: token is `kill:none:...` and `punishmentApplied = 'none'` (Phase 1: no player blame). The incident may still exist as simulation truth; observer copies follow knowledge rules.

Access-family incidents: `punishmentToken` is always `none`. Docking denial is Phase 3 access, not a Phase 4 standing hit.

### 8.3 What Phase 4 *may* apply

| Source | Allowed Phase 4 consequence |
| --- | --- |
| `access_noncompliance` | Ledger + notice + optional watch/investigate movement |
| `access_inability` | Ledger + operator-visible reason |
| `destruction` with player credit | Ledger + FLASH; standing already applied upstream |
| `distress` | Ledger + rescue movement if eligible |
| Acting `investigate` / `rescue` | Local objective + report |

No new latinum fine, no prestige farm, no automatic war declaration, no `hostile` write from incidents.

## 9. Acceptance exercises (S6)

Keep all existing Phase 1 / S4 / S5 / doctrine gates green. Add S6 fixtures that fail setup if a required ship, station, zone or authority is missing. Classification-only asserts are insufficient for acting and UI cases.

| Case | Required exercise and result |
| --- | --- |
| S6.1 Refusal is not aggression | Under `return-fire`, a calm visitor (player at Vulcan or NPC at a player checkpoint) refuses or expires. Exactly one `access_noncompliance` incident. No `observedAttacks` row, `attackId`, hostility, raid, standing delta, or extra shot. Turrets/escorts do not fire for the refusal. |
| S6.2 Inability is not an offense | Tractor or engine-disable forces `unable_to_comply`. One `access_inability` incident. Operator text shows the block. No noncompliance-as-aggression, no standing, no restart of the demand as a new incident. |
| S6.3 Phase 3 feed is once-per-encounter | Challenge issued, hail repeated, instruction revised, then refused. One encounter, one incident. Later fully separated re-entry may open a second administrative incident, still without fire. Reload/jitter create neither. |
| S6.4 Kill standing is not doubled | Player-credited civilian or patrol kill in a live system. Existing cascade runs once (victim + relation fan-out + witness if applicable). `destruction` incident carries the same `punishmentToken`. A delivered report and a doctrine `record_only` / `investigate` must not call `adjustFactionStanding` again. NPC-only kill: no player standing, incident may still exist. |
| S6.5 Alert modes | Through Security UI: `all` shows FLASH + ordinary log; `incidents` keeps FLASH while a background salvage `setLog` cannot replace it before acknowledge/hold; `silent` hides FLASH but the incident remains in the journal and the encounter outcome is unchanged. Muting is not clearance. |
| S6.6 FLASH priority | Trigger a destruction or access FLASH, then immediately run the salvage/background logger. Banner still shows the FLASH (or queued FLASH), not only “Salvage recovered…”. |
| S6.7 Doctrine contrast (acting) | Same `destruction` or `distress` fact. Vulcan eligible ship with required facts → `investigate` or `rescue` and actually moves / writes a finding. Klingon observer without linked own losses → `record_only`, mission unchanged, no new objective. Ignorant observer (`event_known` false) → `ignore_unknown`, no journal leak. |
| S6.8 Investigate/rescue are not weapons | While a Vulcan ship is acting `investigate` or `rescue` from an access or distress incident, `playerForceMayAutoEngage` / station fire / `evaluateFire` do not gain new true facts from that incident. A genuine Phase 2 attributed shot or matching raid still permits the existing defense. |
| S6.9 Persistence | Save with an open access incident and a queued FLASH; wipe `systemStates`; reload. Same `incidentId`, clocks, links, observer copies. No duplicate incident, no second standing, no transferred blame onto an ambient replacement that reused `npc.id`. |
| S6.10 Authority and ownership | Capture/reclaim uses real control paths. Old access incidents resolve `authority_changed`. Occupier cannot be commanded by retained player alerts. Same-flag foreign world still rejects player jurisdiction. Side/role/`fleetId` unchanged by acting responses. |
| S6.11 Ledger caps and legacy | Invalid serialized incidents sanitize without attaching to the wrong instance. Empty legacy save. At cap, a new open is refused (`ledger_full`) rather than dropping a live record and blaming its visitor. |
| S6.12 End-state isolation | Clearance, waiver, withdrawal, investigate complete and rescue complete end only their own demand/objective. Unrelated escort orders, war flags, legitimate kill attribution and Phase 3 docking rules remain. |

Each case may contain multiple assertions. Do not promise a final probe count before S6 is written. Include startup smoke and screenshots of Security (alert controls + incident list) and a FLASH banner.

## 10. Non-goals

Phase 4 will not:

- Implement Phase 5 convoy / `asset_overdue` campaign loop, remote objectives, or deep-space POIs.
- Build the sensor/cloak/track model (Phase 6) or treat an old report as a live firing solution.
- Add fleet hold-outside-the-boundary (Phase 7) or economy/embargo systems (Phase 8).
- Change weapons, EW, or shield exceptions (Phase 9).
- Enable `protect-all`, boarding combat, warning shots as damage, or new alliances (including Breen–Dominion covert pact).
- Enforce `unknown` access or invent broadcast identity beyond Phase 3 `broadcast.source`.
- Turn cargo-scan flavor (`buildShipScanReport`) into a real manifest.
- Spawn free investigator fleets, reinforcements, or replacement hulls because a report existed.
- Charge standing, latinum fines, or raid authorization for refusal, expiry, or inability.
- Put the ledger inside `systemStates` or key actors by recycled `npc.id`.
- Activate alert modes as a silent no-op, or advertise FLASH before the queue exists.
- Update `docs/BAKEOFF-STATUS.md` (changelog waits on Referee Pass after review).
- Touch `Artemis2028/BM1-remastered-work`.

## 11. Implementation sequence and handoff

1. **Ledger and tokens.** Versioned `incidentLedger`, save/load, punishment tokens wired next to `destroyNpcShip` / `destroyStation` / `applyKillStanding` without changing their deltas. Prove reload and `systemStates` wipe.
2. **Phase 3 feed.** Terminal encounter → at most one access-family incident. Prove S6.1–S6.3 before any acting AI.
3. **Alerts and FLASH.** Implement `areAlertsActive` for real, Security controls, banner/queue priority. Prove S6.5–S6.6.
4. **Doctrine acting (narrow).** Observer copies + `evaluateReact` for present ships only. Vulcan vs Klingon contrast. Dedicated `incidentObjective`. Prove S6.7–S6.8.
5. **Independent review and S6 probe.** Keep engine and probe reviewable. Record the tested head. Do not merge on this proposal alone.

If one model implements the slice, reserve a separate review pass. Fable can edit FLASH/journal copy after the paths work; lore expansion is not required to close Phase 4.

## 12. Deferred work remains on the plan

Phase 5 should take persistent overdue-asset / convoy loops and multi-jump report travel. Phase 6 should make identification and last-known honest under cloak. Later: cargo inspection evidence, configurable unknown access, military negotiation, escort-out borders, and richer faction dialogue.

Whether *later* phases ever authorize force from **repeated armed provocation** is a future proposal. It is **out of scope** for Phase 4 access records. The locked rule stands: checkpoint refusal and inability are not that provocation.

Phase 4 is complete when an attributed incident can be read after travel and reload, its consequences happened once, FLASH is not eaten by salvage, alert `silent` does not erase history, and a Vulcan investigator can move without anyone treating a refused hail as a raid.

## Sources and precedence

- Plan §4 exit and §6 incident/alert rules: `docs/revised-development-plan.md`.
- Phase 3 encounter contract and non-aggression stance: `docs/phase3/BM1-PHASE3-HOLDING-ZONES-AND-COMPLIANCE-PROPOSAL.md` and the landed `src/phase3-checkpoints.js`.
- Reserved alert data: `src/phase2-security.js` (`ALERT_MODES`, `areAlertsActive`).
- Kill-standing cascade: `applyKillStanding` / `destroyNpcShip` / `destroyStation` in `src/main.js`.
- Doctrine reactions: `evaluateReact` in `src/doctrine.js`; pack `responseCatalog` and `doctrine-acceptance.json` (`investigate`, `rescue`, `record_only`).
- Bake-off process: `docs/BAKEOFF-STATUS.md` (do not edit in this PR).

Settled Phase 1–3 behavior and the four locked constraints take precedence over older handoff text that left “noncompliance → interception” undecided. Geometry, Vulcan authorship and ROE are already implemented; this brief must not rewrite them.
