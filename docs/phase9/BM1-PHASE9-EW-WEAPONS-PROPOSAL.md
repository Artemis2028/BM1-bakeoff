# BM1 Phase 9 — EW and separately reviewed weapon behavior

**Status:** proposal for implementation; no engine changes made by this document.  
**Repository:** `Artemis2028/BM1-bakeoff`  
**Planning baseline:** `02addb6` on `main` (13 September 2026), after Phase 8 finite markets / anti-exploit / conquest costs (PR #31).  
**Referee context:** Phase 4 engine §6 **Pass** on `7f926df`. Later slices (Phase 5–8, catalog wire, Phase 6.5) have **no Referee Pass claimed** on this bake-off status MD. This brief does **not** claim a new Referee Pass, does **not** reopen Phase 6 layers or Phase 6.5 power, and does **not** reopen Phase 4/5 delivered reports.  
**Companion:** `docs/phase9/BM1-PHASE9-ENGINE-DEPENDENCIES.md` (hooks, risks, probe plan).  
**Scoped by:** Tenth Mountain Trooper, 2026-09-13 — proposal first; no engine until Tenth scopes after a brief Pass.

Phases 1–8 already landed: political authority, two-mode ROE, holding zones, incident ledger / FLASH, persistent convoy/`asset_overdue`, sensors/cloak + power suites, fleet hold-outside, and compact finite markets. Phase 6 made contact knowledge honest. Phase 6.5 reserved an `ew` consumer at draw **0** with **no** effects. Phase 4/5 already deliver reports that observers keep.

This is **two** connected design surfaces that must stay separately reviewable: **electronic warfare** that sits on the landed contact layers and power budget, and a **weapons matrix** that must exist **before** any overhaul. It is not boarding, not a culture-fire inject, not a second contact book, and not permission to treat Flash prices as live locks.

## 1. The result we want

Both sides can jam, deceive, interfere, and disrupt — and both sides can **name** what happened, what it cost, how long it lasts, how to counter it, and who is politically on the hook. Weapons stay explainable by family before anyone retunes them.

**Exit condition (plan §4):** both sides have intelligible effects, costs, counters and attribution.

**Proposed first-release decisions:**

| Question | Proposed answer |
| --- | --- |
| What is the first playable slice? | Four named EW families on the existing Phase 6 book + Phase 6.5 `ew` consumer; each family ships with cost / duration / counter / attributable consequence. A **reviewed weapons matrix** (docs + injectable rows) before any damage/cooldown/range overhaul. Fire gates stay the Phase 1/doctrine three-step. |
| Where do EW effects live? | Observer **contact-book** rows and a compact `state.ewBook` (name can change) of timed effects. **Never** as fake `npcShips`. **Never** inside `systemStates`. |
| Do ghosts become hulls? | **No.** Ghosts are contact-book rows only. No gifted `firingSolution`. |
| Can jamming unsend a report? | **No.** An already-delivered Phase 4/5 report stays delivered. |
| May weapons be retuned in this slice? | **No** until the matrix is reviewed. Flash prices in `GUIDED-CONVERGENCE.md` §1 are **source material, not final prices**. |
| Boarding / capture / command transfer? | **Out.** Convergence §4 stays a later brief. |
| Culture / `engagement_authorized` from EW or a weapon row? | **Forbidden.** |

These are recommendations for this phase, not new decisions attributed to the user. Locked bake-off constraints take precedence over older flavor that treated ghosts as spawnable hulls, jamming as a journal eraser, or a lore one-off as a universal shield bypass.

## 2. Locked constraints (do not reopen)

The bake-off team locked these before this brief. Implementation and probes must treat them as **hard gates**. Referee / One score this brief against these **six** **before** any engine PR.

### Hard gate 1 — EW sits on Phase 6 layers + Phase 6.5 power

> EW consumes the Phase 6.5 reserved **`ew`** line on the **same** generation budget as propulsion, weapons, cloak, and sensors. Effects write **Phase 6 contact layers** (detection, identification, track quality, firing solution). They do not invent a second sensor religion or a free off-budget suite.

Lane owner (wording): **Number Four**.

Phase 6.5 already reserved the consumer (`POWER_CONSUMERS` includes `ew`; `EW_EFFECTS_IMPLEMENTED === false`; `reservedEwDraw()` is 0). This phase **turns the consumer on**. It does not add a sixth energy religion, a fifth required OPS slider, or a scan that skips `sensorCapability`. Overdraw still brown-outs through the existing order; EW is not immune.

### Hard gate 2 — Ghosts are contact-book rows only

> Deceptive contacts are **bounded sensor records**. They are **not** full simulated ships. They do **not** gift a `firingSolution`.

Lane owner (wording): **Number 2**.

A ghost is a row in `state.contactBook` (or an explicit `ghost: true` / `source: 'ew_ghost'` field on that row). It is not pushed to `state.npcShips`, not given hull/shields/slots, not hailable as a living captain, and not a legal `combatTargetId` for tracking shots. Detection-without-identification remains legal. Identification-without-a-firm-track is still not a lock. `seedFromReport` stays area-only; a ghost must not be a back door to `firingSolution === true`.

### Hard gate 3 — Jamming cannot wipe a delivered report

> An already-delivered Phase 4/5 report is **not** erased, unsent, or forgotten because later jamming lands.

Lane owner (wording): **Number 2**.

`deliverReport` rows, `observerCopies.knownIncidentIds`, FLASH/journal history, and Phase 5 board knowledge that an observer **already has** stay. Jamming may degrade **live** layers on the contact book (firm → coarse → area, drop `firingSolution`, hide a hull the observer has not yet reported). It must not delete `incidentLedger.reports[id]`, flip `delivered` to false, drop a known incident from the observer copy, or un-pulse a FLASH that already fired. Phase 4 append-only / no-second-FLASH (S6.14) still holds: jamming is not a second offense pulse and not a history rewrite.

### Hard gate 4 — Weapons matrix before any overhaul

> Before any weapon overhaul, provide a matrix of **family, range, arc, tracking, shield interaction, hull/subsystem effect, energy/ammunition cost, counters, and faction access**. Identify which claims come from **BM1**, retained **BM2**, broader **Trek** inspiration, or **new** design.

Lane owner (wording): **Number Four**.

The Flash price table in `docs/GUIDED-CONVERGENCE.md` §1 is **source material, not final prices**. Keep Disrupter **Canon / Cannon / Turret** as three identities. Tractor stays a **weapon/device slot** (Flash 3400, bake-off id 25), not cargo and not a fourth mystery slot. Extra bake-off / BM2 rows (Particle Beam, Magnetorp, Biobeam, Tesla Beam, and similar) stay on a separate “inherited, not in this Flash table” list — do not invent Flash prices for them. **Verify hull/loadout mapping** before balancing. **Do not** grant universal shield bypass from an isolated lore exception.

### Hard gate 5 — Pursuit ≠ permission to engage ≠ per-weapon firing gate

> Preserve the distinction between **pursuit**, **permission to engage**, and the **final per-weapon firing gate**. EW and weapon rows must **not** inject culture fire or `engagement_authorized`.

Lane owner (wording): **Number 2**.

Hunters may still pursue beyond firing range (Phase 1). Doctrine / ROE still decide whether the actor **may** engage. The equipped weapon still needs readiness, energy, arc, and a live Phase 6 `firingSolution` before a shot exists. An EW effect that “lights up” a contact does not write `engagement_authorized`. A matrix row that says “this beam bypasses shields in lore” does not open the fire gate. Culture cannot grant fire permission. `consultDoctrineFire` must keep deleting `engagement_authorized` if a writer tries to stuff it in.

### Hard gate 6 — Boarding stays out

> Boarding, capture, scuttle, away-team XP, and fleet command transfer stay **out** of this slice.

Lane owner (wording): **Referee / One** (do-not-open check). Number Four must not hook boarding as an EW or weapon side effect.

Convergence §4 remains a later brief (≤10% hull to board; capture vs scuttle). A tractor hold is **not** boarding. A cutting beam is **not** a capture. An EW ghost is **not** a prize hull.

### Also from the plan (score with the gates; not a seventh religion)

| Plan §11 / convergence want | How this brief locks it |
| --- | --- |
| Each EW effect has cost, duration, counter, attributable political consequence | Gate 1 + §4 table. A family without all four is not ready. |
| Ghosts are bounded sensor records, not full ships | Gate 2. |
| Already-delivered report is not erased by later jamming | Gate 3. Cite Phase 4 `deliverReport` / observer copies and Phase 5 delivered knowledge. |
| Matrix before overhaul; provenance labeled | Gate 4. Flash table is evidence. |
| No universal shield bypass from a lore one-off | Gate 4. Per-row shield interaction only; default is shields-then-hull (today’s `damageNpcShip` path). |
| Verify hull/loadout mapping | Gate 4. Do not balance a weapon the fitted roster does not actually carry. |
| Tractor stays a device slot | Gate 4. Convergence §1 acceptance. |
| Pursuit ≠ permission ≠ per-weapon gate | Gate 5. |
| Boarding deferred | Gate 6. |

### Must not break (cite landed work)

Score these as **preservation**. A Phase 9 Pass that regresses them is a Fail.

| Locked rule | Cite | Phase 9 must not |
| --- | --- | --- |
| Detection ≠ identification ≠ track quality ≠ `firingSolution`. An old report is not a live lock. | Phase 6 hard gate 2; `src/phase6-sensors.js`; S9.2 | Raise layers from EW alone past what the family is allowed to degrade/deceive. Seed `firingSolution` from a ghost or a jammed report. |
| Hidden stays hidden on **both** sides. Lost tracks drop exact targeting on the **same tick**. | Phase 6 gates 3–4; S9.3–S9.5 | Leak a cloaked hull because a ghost row exists. Keep `combatTargetId` / `liveWeaponTrack` after `firingSolution` drops. |
| Passive / active never invent ID or `firingSolution`. Reserved `ew` was draw 0 / no effects. | Phase 6 gate 6; Phase 6.5 gate 5; S10.7 | Spend EW off-budget. Implement effects without turning the reserved consumer on. |
| Already-delivered reports and observer copies persist | Phase 4 `deliverReport` / `observerKnowsIncident`; S6.9; Phase 5 delivered knowledge | Delete, unsend, or rewrite `delivered`. Drop `knownIncidentIds` because a jammer ticked. |
| FLASH append-only; no second offense pulse | Phase 4 §7.3; S6.14 | Pulse FLASH as “jamming happened” unless a **new** FLASH-eligible incident is actually opened. Do not un-acknowledge a prior FLASH. |
| Overdue ≠ destroyed ≠ attacker | Phase 5; S8 | Treat a jammed convoy track as `destroyed` or invent `attackerId`. |
| Punishment tokens; standing once | Phase 4 §8; S6.4 | Charge standing again from an EW notice for a kill already tokenized. |
| Culture cannot grant fire. `engagement_authorized` never injected. | Phase 1 / doctrine; Phase 6; `consultDoctrineFire` | Write the fact from EW, a weapon row, or a ghost ID. |
| Phase 3 refusal / inability are not aggression | Phase 3 / 4 | Turn comms disruption or a jammed hail into `attackId` / fire. |
| Catalog wire: 172 active, 38 aliases, Reman **53** | PR #28; S11 | Resurrect discarded IDs or a second Reman hull because a weapon “needs a host.” |
| Phase 8 markets subscribe-only | PR #31; S13 | Restock, embargo-as-fire, or sell hull 53 from an EW/black-ops flavor row. |

Also preserve, without reopening:

- Authority is a political side (`isSystemControlled`), not a flown flag.
- Two ROE modes unchanged. Access is a permission, not a ceasefire.
- Phase 1 combat credit: only `player` / `playerEscort` final hits reward or blame.
- Phase 6 first-frame cloak, purposeful destinations, arrival/spacing/exit stay closed.
- Phase 6.5 generation / passive-vs-active draw / paid suites / role curves stay closed.
- Phase 7 standing orders persist; EW must not silently supersede `hold_outside`.
- Soft authored breakaway profiles stay **out**.
- Empty-but-armable (convergence §3) is **cited** for mapping, not implemented as a new package here unless Tenth scopes it in the same engine lane.

### Process locks (implementation locks, not a change to gates 1–6)

- **Proposal first.** Do not implement from this text until Tenth scopes the engine lane after a brief Pass.
- **Blind bake-off.** Implement from `docs/` only. Do not crib `Artemis2028/BM1-remastered-work`.
- **No invented balance numbers** as locked constants. Effect *shape*, matrix *columns*, and fire-gate *forbids* are locked. Example draws and Flash prices are recommendations / source material.
- **Matrix before overhaul.** A PR that retunes damage, cooldown, or range without a reviewed matrix fails gate 4 even if EW is green.
- **Subscribe, do not fork.** EW writes call existing Phase 6 layer helpers and Phase 6.5 draw helpers. Do not implement a second contact book. Do not implement a second incident ledger.
- **§13 saved timers:** EW duration uses `localElapsedMs`. Do not persist `performance.now()` as a deadline.
- **No Pass claimed** in `docs/BAKEOFF-STATUS.md` from this PR.

## 3. EW on the landed layers and budget

**Lane owner (wording):** Number Four (gate 1).

### 3.1 Same information rules, both sides

Plan §1: player and NPC sensors, communications, and weapon gates follow the **same** information rules. A player jammer and an NPC jammer spend the same consumer, write the same layer kinds, and face the same counters. There is no “player-only ghost that NPCs treat as a real hull.”

### 3.2 Power

| Already landed (do not reinvent) | Phase 9 addition |
| --- | --- |
| `POWER_CONSUMERS` = propulsion / weapons / cloak / sensors / **`ew`** | `ew` draw becomes **non-zero while an effect is active** |
| `reservedEwDraw()` = 0; `EW_EFFECTS_IMPLEMENTED === false` | Flip the reserved flag only when the four families exist as named, costed effects |
| Brown-out order (active sensors → cloak → weapons → propulsion) | EW is a **budget line**. It can starve or be starved. It does not skip brown-out. |
| Suites move the equipment axis only | Suites still do not invent EW. A science suite is not a jammer. |

Exact watts are **TBD / injectable**. Shape is locked: no effect with draw 0 that still rewrites contacts (that would fail S10.7’s “reserved, not implemented” in reverse — effects without cost).

### 3.3 Layers EW may touch

| Layer | Jamming may | Ghosts may | Fire-control interference may | Comms disruption may |
| --- | --- | --- | --- | --- |
| Detection | Suppress or shrink (hide a real contact the observer had not reported) | Create a **false** detection row | No | No |
| Identification | Degrade known → partial → none | Partial / none only. Never a true faction/name of a hull that is not there | No | No |
| Track quality | Step down firm → coarse → area → none | `area` or worse | Step down; may drop `firingSolution` | No |
| Firing solution | **Drop** if track is no longer firm | **Never** set true | **Drop** | No |
| Delivered Phase 4/5 report | **Never** delete / unsend | **Never** mint a living incident as if the ghost were destroyed | **Never** | May delay a **new** undelivered send; must not retract one already delivered |

`seedFromReport` remains: detection + **area** track, `firingSolution === false`. Jamming a live track does not un-seed the historical report.

## 4. Four EW families (cost, duration, counter, attribution)

**Lane owner (wording):** Number Four on budget/engine; Number 2 on ghost/report/attribution wording.

Plan §11 backlog, in full. Each family is a **named effect**. Names can change; the four-part contract cannot.

| Family | Intelligible effect | Cost (shape) | Duration (shape) | Counter | Attributable political consequence |
| --- | --- | --- | --- | --- | --- |
| **Sensor jamming** | Live layers on the victim observer degrade. Real hulls can fall off that observer’s book. | `ew` draw + (optional) heat/emission the other side can detect | Bounded `localElapsedMs`. Ends on cancel, brown-out, or counter | Direction-find / burn through (active scan already detectable) / break line-of-sight / spend own EW | Using it in a holding / toward a protected asset can open or append a **real** Phase 4 incident if the actor is known. Not a free “scan offense” (Phase 6 Q6 still: detectable ≠ new FLASH by default). |
| **Deceptive contacts (ghosts)** | Extra contact-book rows. Bounded count. Decay like tracks. | `ew` draw; more ghosts cost more | Bounded; rows decay to none and prune | Active scan / closer pass / science suite **may** mark `ghost: true` without granting a lock | A ghost that is fired on is **not** a kill. No standing. No `destroyed` convoy. If the deception is later attributed, the consequence is the **deception**, not a fake hull loss. |
| **Fire-control interference** | Victim’s `firingSolution` / tracking shots drop or fail to form. Pursuit may continue. | `ew` draw; does not spend the victim’s weapon energy as a sneak rewrite | Bounded | Break lock-break (re-acquire through Phase 6 earn rules) / leave range / hard-kill the jammer | Interfering with a lawful defender can be attributed. It does **not** become permission for the jammer to fire. |
| **Communications disruption** | New reports / hails / FLASH **in flight** can be delayed or fail. Already-delivered rows stay. | `ew` draw | Bounded | Relay / second sender / leave the disrupted volume | Blocking a distress **send** that has not been delivered is a sayable act (may feed Phase 4/5 **new** knowledge rules). Unsending a delivered distress is a **Fail**. |

Player-facing lines must name the family:

- `Jamming: your track on the warbird fell from firm to area. The FLASH about the earlier destruction is still in the journal.`
- `Ghost contact. Sensor record only — no hull, no firing solution.`
- `Fire-control interference. You may still pursue. You may not take the shot.`
- `Comms disrupted. The overdue report you already hold is still held.`

If the UI cannot say **which** family, **what it cost**, **when it ends**, **how to counter it**, and **who is blamed**, the family is not ready.

### 4.1 Ghost row shape (gate 2)

Exact names can change:

```js
{
  contactId: 'ctc-40',
  observerKey: 'player',
  subjectKey: 'ghost:ew-7',      // not an npc securityInstanceId of a living hull
  detected: true,
  identification: 'none',        // or partial fake class — never a gifted known living id
  trackQuality: 'area',
  firingSolution: false,         // hard: createContactRecord / upsert must keep this false
  ghost: true,
  source: 'ew_ghost',            // new source; do not overload 'report'
  lastKnown: { x, y, radius, atLocalMs },
  freshnessLocalMs: 0
}
```

Forbidden:

- `state.npcShips.push({ /* fake warbird */ })`
- Copying a real hull’s `securityInstanceId` onto a ghost so doctrine treats it as that ship
- Granting `liveWeaponTrack` / `combatTargetId` / tracking projectiles
- Letting `destroyNpcShip` run on a ghost (no salvage, no standing, no Phase 5 worsen)

A later counter that **reveals** a ghost marks the row (`ghost: true`, identification stays non-living). It does not spawn the “real” ship. If a real hull was being covered, that hull still has to be **detected** under Phase 6 rules.

### 4.2 Store

```js
state.ewBook = {
  version: 1,
  nextEffectId: 1,
  effects: { /* [effectId]: { family, actorKey, victimKey, draw, startedAtLocalMs, endsAtLocalMs, counter, attribution } */ }
};
```

Serialize beside `contactBook` / `incidentLedger`. Initialize on `resetRunState`. Sanitize enums and clocks. Old saves start empty.

**Never** persist inside `systemStates`. Ambient `npc.id` reuse must not transfer a jammer identity (same family as Phase 3/4/5/6).

**Clock:** `localElapsedMs` only. Strategic jumps do not extend or erase an effect unless the actors left the loaded system — then the effect ends; it still does not unsend reports.

## 5. Jamming vs Phase 4/5 reports

**Lane owner (wording):** Number 2 (gate 3).

| Already delivered (must survive) | Still in flight (comms family may touch) |
| --- | --- |
| `incidentLedger.reports[reportId]` with `delivered !== false` | A `deliverReport` call that has not succeeded yet |
| `observerCopies[observer].knownIncidentIds` | A Phase 5 pirate/patrol that has **not** yet received the shortage/distress |
| FLASH queue entries and journal history for that incident | A new FLASH that has not been pushed |
| Phase 5 board facts the observer already knows (assignment, overdue flag, close token) | A new fill/worsen **notice** not yet written |

Subscribe. Do not fork:

- Do **not** add `erasedByJamming` on a delivered report.
- Do **not** clear `knownIncidentIds` in a jammer tick.
- Do **not** set Phase 5 `destroyed` / `attackerId` because a track dropped.
- Do **not** invent a second report ledger “so we can rewind.”

Phase 6 already said: a delivered report may seed detection + last-known **area**; it does not set `firingSolution`. Jamming after that seed may decay the **live** area track. The report row remains.

## 6. Weapons matrix (before any overhaul)

**Lane owner (wording):** Number Four (gate 4).

### 6.1 Columns (locked)

Every combat/device row that can sit in a slot gets a matrix line. Names can change; missing a column fails the gate.

| Column | Means | Must not |
| --- | --- | --- |
| **Family** | Beam / cannon / turret / torpedo / heavy / device — plus the Flash **Canon vs Cannon vs Turret** split for disruptors | Collapse the three disruptor identities |
| **Range** | Effective reach vs the Phase 1 pursuit range | Equate pursuit with “may fire” |
| **Arc** | Where the mount can bear | Invent a 360° lore exception as a silent default |
| **Tracking** | Needs a Phase 6 `firingSolution` or not (dumb fire vs guided) | Gift tracking from a ghost or an old report |
| **Shield interaction** | Shields-then-hull (default), reduced vs shields, reduced vs hull — **per row** | Universal bypass because Trek/Flash flavor mentioned it once |
| **Hull / subsystem** | Hull damage, engine sting, device drain — **per row** | Boarding, capture, or command transfer |
| **Energy / ammunition** | Draws the Phase 6.5 **weapons** consumer and/or a finite ammo count | Spend the `ew` consumer as a hidden gun tax, or print infinite ammo on jump (Phase 8 farm) |
| **Counters** | Cloak, jamming, fire-control interference, range, shields | “No counter” as a default |
| **Faction access** | `stockFactions` / later license — cite catalog wire, do not rewire it | Latinum as a ban bypass (Phase 8 gate 2) |
| **Provenance** | `BM1` / `BM2` / `Trek` / `new` / `bake-off-current` | Treat Flash price as a live lock |

### 6.2 Flash table is evidence

Cite `docs/GUIDED-CONVERGENCE.md` §1 in full as the **price-source** list. Do not copy prices into engine constants as locked balance.

Required identities from that table:

- Phaser Cannon 1300; Type VII Phaser 1500; Disrupter **Canon** 1500; Quantum Pulse Cannon 2000; Photon Torpedo 2500; Disrupter **Cannon** 3000 (dual); Type X Phaser 3000; Tractor Beam 3400 (**slot device**); Plasma Phaser 3800; Bajoran Sail 5000 (classify or defer — not silent cargo); Engine Disrupter 5000; Polaron Phaser 5000; Polaron Torpedo 5300; Quantum Torpedo 6700; Dual Pulse Phasers 7500; Disrupter **Turret** 7800; Tachyon Field Generator 8000; Pulse Turret 8500; Gravimetric Torpedo 9000; Warp Core 12000 (utility — do not merge with trade-good Warp Cores); Transphasic Torpedo 12500; Cloaking Device 13500; Thaleron Generator 15500; Cutting Beam 30000; Plasma Torpedo **not Flash-supplied** (bake-off id 17 @ 7200 is current data, not Flash-certified).

Inherited, not in that Flash table (keep listed, do not invent Flash prices): Particle Beam, Magnetorp Launcher, Biobeam, Tesla Beam, and any other bake-off row.

### 6.3 No universal shield bypass

Today `damageNpcShip` / station damage spend `combatShields` first, remainder to hull. That is the **default** matrix interaction.

Polaron, transphasic, cutting beam, and thaleron may have **row-level** notes (Trek / BM1 / BM2 / new). A note is not a global `bypassShields: true` that every later weapon inherits. Isolated lore (“this one pierced Borg shields in a series episode”) does not rewrite the default.

Thaleron remains a heavy device with a cloud — still not boarding, still not a capture.

### 6.4 Hull / loadout mapping

Before anyone retunes damage:

1. Map each matrix row to bake-off `data/game_items.json` ids **and** to hulls that actually equip them (`weaponSlots`, pack loadouts).
2. Record mismatches (Flash spelling “Disrupter” vs bake-off “Disruptor”; two “Disruptor Cannon” ids 6 and 7).
3. Do not balance a gun that no live hull can mount, and do not silently auto-fill empty slots to make the matrix “feel used” (convergence §3 empty-stays-empty is the cited rule; implementing that package is **not** required to close this brief).

### 6.5 Tractor

Tractor Beam stays **id 25 / type Device / slot item**. Phase 3 already uses tractor as an `unable_to_comply` physical fact. Phase 9 must not move it to cargo, flags/passes inventory, or a fourth mount. A tractor hold is not boarding (gate 6).

## 7. Fire gates stay closed

**Lane owner (wording):** Number 2 (gate 5).

Three steps. EW and the matrix may **feed facts**. They may not collapse the steps.

| Step | Who decides | EW / weapons may | Must not |
| --- | --- | --- | --- |
| **Pursuit** | Phase 1 range / hunter AI | Drop a lock so the hunter still chases an area | Treat “in pursuit range” as `weapon_ready` |
| **Permission to engage** | Doctrine + two-mode ROE + Phase 2 evidence | None. No new fact key | Inject `engagement_authorized`, culture fire, or “ghost ID = war target” |
| **Per-weapon firing gate** | Equipped slot + energy + arc + cooldown + Phase 6 `firingSolution` + `weapon_usable` / `weapon_ready` / `inside_equipped_range` | Fire-control family may **fail** this gate | Succeed the gate from a ghost, a report, or a matrix lore flag |

`consultDoctrineFire` already deletes `engagement_authorized`. Keep that. `liveFireFactsFromContact` must not start returning `engagement_authorized: true` because `ghost === true` or because a jammer is running.

An unarmed slot still cannot fire (doctrine physical gate; convergence §3). This brief **cites** that gate. It does not silently fill Phaser id 1 into empty NPC slots to make the matrix demo easier.

## 8. Acceptance exercises (S14)

Keep all existing Phase 1 / S4–S13 / doctrine / catalog / side-lane gates green. Add S14 fixtures that fail setup if the reserved `ew` consumer, contact-book ghost helper, or matrix row helper is missing. Classification-only asserts are insufficient for “report still delivered” and “ghost is not a hull.”

Number Three owns the probe gate **after** engine, not this brief. IDs are a sketch; do not promise a final count.

| Case | Required exercise and result |
| --- | --- |
| **S14.1** EW on the reserved budget | Snapshot shows `ew` on `POWER_CONSUMERS`. An active jammer (injected) has `ew` draw **> 0**. Total draw still shares generation with sensors/cloak/weapons. Off-budget EW (effects on, draw 0) **fails**. |
| **S14.2** Layers, not a new religion | Jamming steps a **live** firm track down and may drop `firingSolution`. It does not add a fifth layer and does not set identification from flavor text. |
| **S14.3** Ghost is a book row | Inject a ghost. `contactBook` has a `ghost: true` (or `source: 'ew_ghost'`) row. `npcShips` count unchanged. No hull/shields/slots. Hail/scan does not treat it as a living captain. |
| **S14.4** Ghost never gifts a lock | Ghost row stays `firingSolution === false`. `liveWeaponTrack` / tracking projectile / `combatTargetId` absent. Active scan may mark it revealed; it still has no lock. |
| **S14.5** Destroying a ghost is not a kill | Attempted destroy/salvage/standing on the ghost writes **nothing** to Phase 4 tokens, Phase 5 worsen, or latinum salvage. |
| **S14.6** Delivered Phase 4 report survives jamming | `deliverReport` once. Observer `knownIncidentIds` includes the incident. Inject jammer. Report row still present, `delivered` still true, known-id still listed. Live contact layers **may** decay. |
| **S14.7** Delivered Phase 5 knowledge survives | Observer already knows a shortage/distress/overdue. Jamming drops the live track. Board assignment, overdue ≠ destroyed ≠ attacker, and close-once token **unchanged**. |
| **S14.8** In-flight comms ≠ unsend | Comms disruption may fail a **new** `deliverReport` (created: false / delayed). A previously delivered report is untouched. No `erasedByJamming`. |
| **S14.9** No FLASH rewrite | Open a FLASH-eligible incident (or reuse a fixture). Jamming does not un-pulse it and does not fire a second offense FLASH merely because jammer ticked (S6.14 family). A **new** attributed jam incident, if opened, is a distinct `incidentId`. |
| **S14.10** Each family has the four-part contract | Snapshot each family: cost (draw > 0), duration (`endsAtLocalMs` on `localElapsedMs`), named counter, attributable consequence hook (may be `record_only` / no standing). Missing any of the four **fails**. |
| **S14.11** Both sides | NPC jammer vs player observer and player jammer vs NPC observer: same layer rules, same budget consumer, same “ghost is not a hull.” |
| **S14.12** Matrix exists before retune | Probe/offline helper exposes one row per slotted family with all ten columns + provenance. Damage/cooldown/range in `game_items.json` **unchanged** from the engine-lane base unless a later scoped overhaul cites this matrix. |
| **S14.13** Three disruptors + tractor slot | Canon / Cannon / Turret remain three identities. Tractor still type Device, slot-equippable, not cargo. |
| **S14.14** No universal shield bypass | Default hit still spends shields then hull. A lore-flagged row (if any) is **row-scoped**. A fixture “ordinary beam” does not inherit a transphasic/polaron exception. |
| **S14.15** Hull/loadout mapping checked | Matrix rows cite bake-off ids and at least one fitted hull **or** an explicit “unmounted / inherited-only” mark. No silent auto-fill of empty slots. |
| **S14.16** Pursuit ≠ permission ≠ fire | Hunter remains in pursuit range after fire-control drop. `mayAutoEngage` unchanged by EW. Per-weapon gate stays closed without a live `firingSolution` and a ready slot. No `engagement_authorized` on facts. |
| **S14.17** Culture / ROE preserved | EW + matrix writes do not change two-mode ROE, do not set culture fire, do not flip Phase 3 refusal into `attackId`. |
| **S14.18** Boarding still out | No board/capture/scuttle/command-transfer API. Tractor hold ≠ board. Cutting beam ≠ capture. Ghost ≠ prize. |
| **S14.19** Phase 6 / 6.5 preserved | Replay S9.1–S9.5, S9.8, S10.1–S10.3, S10.7 family: first-frame cloak; four layers; hidden both sides; same-tick drop; active still detectable; generation still the shared pool. |
| **S14.20** Phase 4/5/8 / catalog preserved | After EW ticks: S6.4 standing once; S6.14 no second FLASH from append; S8 overdue ≠ destroyed ≠ attacker; S11 Reman 53 / aliases; S13 markets not restocked; `meetPackPurchaseDecision` untouched. |

Each case may contain multiple assertions. Include startup smoke. Do not claim a Referee Pass from this list.

## 9. Non-goals

Phase 9 will not:

- Reopen Phase 6 gates 1–8 or Phase 6.5 gates 1–5 (except turning the reserved `ew` consumer **on** as specified).
- Spawn fake full hulls, gift `firingSolution`, or treat ghosts as salvage.
- Wipe, unsend, or rewrite already-delivered Phase 4/5 reports or observer copies.
- Retune weapon damage, cooldown, range, or prices **before** a reviewed matrix (gate 4).
- Lock Flash prices as live economy (Phase 8 already forbids price-as-permit; this brief forbids price-as-balance-lock).
- Grant universal shield bypass from polaron / transphasic / cutting / thaleron lore.
- Inject `engagement_authorized` or culture fire from EW or a weapon row.
- Collapse pursuit, permission to engage, and the per-weapon gate.
- Implement boarding, capture, scuttle, away-team XP, or fleet command transfer.
- Move tractor out of the device slot, or spend a weapon slot on flags/passes (convergence §2 stays later).
- Implement empty-but-armable as a silent rewrite of NPC default slots unless Tenth scopes that package.
- Reopen Phase 5 clock, close-once, or attacker rules; Phase 8 markets / Reman / standing tiers; catalog aliases.
- Pulse FLASH as a default jammer tick, or treat comms disruption as Phase 3 aggression.
- Activate Phase 3 `unknown` access enforcement.
- Build independently addressable deep-space locations, construction-beam visuals, or difficulty knobs that change political identity.
- Touch `Artemis2028/BM1-remastered-work`.
- Claim a Referee Pass in `docs/BAKEOFF-STATUS.md`.

## 10. Implementation sequence and handoff

1. **Brief Pass.** Referee / One score the **six** hard gates. Number 2 scores gates **2, 3, 5** (ghost / report / fire-gate wording). Number Four scores gates **1, 4** (EW on layers+power; matrix-before-overhaul engine wording) and confirms gate **6** is not hooked. Do not open an engine PR on this document alone.
2. **Tenth scopes the engine lane** after Pass. Blind implement from `docs/` only.
3. **Suggested order if scoped:** reviewed matrix rows + provenance + mapping check (S14.12–S14.15) **with no combat retune** → turn `ew` consumer on with costed durations (S14.1, S14.10) → jamming vs live layers only (S14.2, S14.6–S14.9) → ghosts as book rows (S14.3–S14.5) → fire-control + comms (S14.8, S14.16) → both-sides fixture (S14.11) → preservation (S14.17–S14.20).
4. **Number Three** adds/runs S14 after engine. Keep Phase 1 / S4–S13 / `test:catalog` green.
5. Changelog / status Pass wait on Referee after review. This proposal PR may note that the brief is open; it must not write a Pass.

If one model implements a later slice, reserve a separate review pass. Fable can edit jam/journal copy after the paths work. A **later** weapon overhaul is a different scoped lane that must cite the reviewed matrix.

## 11. Open questions

Mark these clearly. They do **not** weaken the hard gates.

| ID | Question | Default if engine is scoped before an answer |
| --- | --- | --- |
| Q1 | Exact `ew` draw per family / per ghost? | **TBD / injectable.** S14.1 / S14.10 assert draw **> 0** while active, not a wattage. |
| Q2 | New contact `source: 'ew_ghost'` vs a `ghost` boolean on existing sources? | Either is fine if probes can tell a ghost from a living row and `firingSolution` stays false. Do not reuse `report`. |
| Q3 | Does attributed jamming in a holding open a new Phase 4 incident? | **Optional** new kind only if it is FLASH-eligible in the Phase 4 table. Default: `record_only` / journal, no second standing, no `attackId` from the jam alone. |
| Q4 | How many ghosts per observer? | Compact bound (Phase 6 already caps 32 contacts). Drop ghosts before live locks. |
| Q5 | May a science suite help mark ghosts without being a jammer? | **Yes** — equipment axis only (Phase 6.5). No free EW draw of 0. |
| Q6 | Empty-but-armable in the same engine PR? | **No** unless Tenth says so. Mapping check does not auto-fill slots. |
| Q7 | HTML weapon review catalog (convergence §9)? | **Later.** Matrix may be JSON/docs. Flash is not a required viewer. |
| Q8 | Split engine PRs (matrix-docs vs EW)? | Tenth decides after Pass. Gate 4 still precedes combat retune. |
| Q9 | Difficulty knobs? | **Out.** Political identity stays the same. |
| Q10 | Cloaked-blip as a jammer artifact? | Only as a **ghost/area** row, never a living cloaked hull leak (Phase 6 gate 3). |

## 12. Lanes

| Who | Owns | Scores |
| --- | --- | --- |
| **Number 2** | Gates **2, 3, 5** wording (ghosts are book rows / no gifted lock; jamming cannot unsend delivered P4/P5 reports; pursuit ≠ permission ≠ per-weapon gate; no culture / `engagement_authorized` inject) | Ghost ≠ hull; report still delivered; fire facts stay clean |
| **Number Four** | Gates **1, 4** wording (EW on Phase 6 layers + Phase 6.5 `ew` budget; matrix columns + provenance + mapping **before** overhaul). Engine must not hook boarding (gate **6**) | Effects costed on the reserved consumer; no retune without matrix; tractor stays a slot; no universal bypass |
| **Number Three** | Probe gate **after** engine (S14 on `__BM1_PROBE__` / offline tests; S4–S13 stay green) | Not this brief |
| **Referee / One** | This brief vs the **six hard gates** in §2 | **Before** any engine PR |

## 13. Deferred work remains on the plan

Flags/passes as inventory, empty-but-armable persistence, boarding/capture, construction visuals, HTML review catalogs, and difficulty knobs stay on the convergence backlog. Independently addressable deep-space locations remain the plan §8 later add. Activating `unknown` access still waits on a later scoped slice. A **weapon overhaul** waits on a reviewed matrix (this brief) plus a later Tenth-scoped retune.

Phase 9 is ready to score when a reader can mark Pass/Fail on all six gates: EW on layers+budget; ghosts as book rows without a gifted lock; delivered reports survive jamming; matrix before overhaul (Flash table as source, not prices); fire gates and no culture inject; boarding out — while Phase 6 / 6.5 / 4 / 5 still hold.

## Sources and precedence

- Plan §4 Phase 9 exit and §11 EW and weapons: `docs/revised-development-plan.md`.
- Flash weapon price table (source material, not final prices): `docs/GUIDED-CONVERGENCE.md` §1. Tractor slot + no universal bypass: same file §§1 / 11-echo.
- Phase 6 layers / contact book / `seedFromReport`: `docs/phase6/BM1-PHASE6-SENSORS-CLOAK-SYSTEM-SPACE-PROPOSAL.md`; `src/phase6-sensors.js`; PR #24; S9.
- Phase 6.5 reserved EW consumer: `docs/phase6/BM1-PHASE6.5-POWER-SENSORS-SUITES-PROPOSAL.md` gate 5; `src/phase65-power.js` (`POWER_CONSUMERS`, `reservedEwDraw`, `EW_EFFECTS_IMPLEMENTED`); PR #27; S10.7.
- Phase 4 reports / FLASH / tokens: `docs/phase4/`; `src/phase4-incidents.js` (`deliverReport`, `observerKnowsIncident`); PR #13; S6.
- Phase 5 delivered knowledge / overdue ≠ destroyed ≠ attacker: `docs/phase5/`; `src/phase5-objectives.js`; PR #21; S8.
- Fire gates / no `engagement_authorized`: Phase 1; `src/doctrine.js` `deriveLiveFireFacts`; `consultDoctrineFire` in `src/main.js`.
- Bake-off process: `docs/BAKEOFF-STATUS.md` (this PR may note the brief is open; no Pass claimed).

Settled Phase 1–8 behavior, Phase 6 layers, Phase 6.5 power, Phase 4/5 reports, and these six Phase 9 gates take precedence over older handoff text that treated ghosts as ships, jamming as a journal eraser, or a lore one-off as a universal shield bypass.
