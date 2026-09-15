# BM1 boarding — capture, scuttle, command transfer

**Status:** proposal for implementation; no engine changes made by this document.  
**Repository:** `Artemis2028/BM1-bakeoff`  
**Planning baseline:** `f9f077f` on `main` (15 September 2026), after Phase 9.2 EW-depth engine (PR #37).  
**This is a boarding brief, not Phase 10 / Dominion / faction-slice content.** Convergence §4 called this package **Agreed next**. Phases 4–9.2 explicitly **deferred** it. This document **opens** that package as a scoreable brief. It does **not** open Phase 10 wider faction / Dominion campaign.  
**Referee context:** Phase 4 engine §6 **Pass** on `7f926df`. Phase 9 engine (PR #33), Phase 9.1 engine (PR #35), and Phase 9.2 engine (PR #37) are the **locked** EW/weapons baselines — **Keep #33, #35, and #37 Pass locked.** EW / weapons / fire-gate / ghosts-as-book / boarding-was-out stay closed as *preservation*; this brief is the **first** scoped boarding surface, not a reopen of EW. This brief does **not** claim a new Referee Pass, does **not** reopen Phase 6 layers or Phase 6.5 generation, and does **not** reopen Phase 4/5 delivered reports or kill-standing tokens.  
**Companion:** `docs/boarding/BM1-BOARDING-ENGINE-DEPENDENCIES.md` (hooks, risks, probe plan).  
**Scoped by:** Tenth Mountain Trooper, 2026-09-15 — proposal first; no engine until Tenth scopes after a brief Pass. Room-locked hard gates (≤10% hull, capture XOR scuttle, tractor ≠ board, no gifted FS / culture / `engagement_authorized`, prize credit explicit, Phase 1 identity, legal reach / detection, away-team XP explicit) are **in** this one scoreable brief.

Phases 1–9.2 already landed: political authority, two-mode ROE, holding zones, incident ledger / FLASH, persistent convoy/`asset_overdue`, sensors/cloak + power suites, fleet hold-outside, compact finite markets, Phase 9 EW on the reserved `ew` consumer with ghosts as contact-book rows, a read-only weapons matrix, closed fire gates, Phase 9.1 spend-to-suppress / burn-through / residue-before-void / RSS / HoJ / transponder claim, and Phase 9.2 lobes / escort ECCM / spoof catch / comms-delay / heat / decoys / silent-running / dock-fit. **Boarding, capture, scuttle, away-team XP, and fleet command transfer were explicitly out** of Phase 9–9.2 (`BOARDING_IMPLEMENTED === false`; S14.18 / S15.18 / S16.17). Convergence §4 and `bm-ships/integration-rules.json` `missingFeatures` (`boarding/capture`, `fleet transfer`, `away-team XP`) named the gap. This brief is that gap.

This is **one** connected boarding / prize / command-transfer surface: a hull that is **≤10% of maximum hull** may be the target of a **boarding order** that is not a tractor hold and not a shot; one attempt writes **capture or scuttle, never both**; prize standing / incident / credit is **named** and is **not** a Phase 4 kill-standing cascade by default; capture does **not** silently refit or gift another government’s fleet; command transfer among **owned / captured** hulls is a **separate** operation from the boarding attempt; away-team XP is **explicitly “not tracked yet”** until a later inject. Magnitudes, success odds, away-team size, travel time, and combat resolution stay **injectable / TBD**. It is not a remastered `git am`, not Phase 10 Dominion, not a weapon overhaul, and not permission to invent locked success percentages or an XP table.

## 1. The result we want

A crippled hull can be **boarded**. The attempt has one terminal write: **capture** (the acting side takes command of that hull as a prize) **or** **scuttle** (that hull is destroyed / rendered unusable by the attempt). Tractor hold remains a device hold. Capture is not a kill. Scuttle of a hull that was already captured must not double-charge the original kill-standing token. The player may later **transfer command** to another hull they already own or have captured, without rewriting Phase 1 identity or foreign concessions.

**Exit condition:** the eight hard gates in §2 are scoreable; magnitudes / odds / XP stay injectable or explicitly “not tracked yet”; EW / #33 / #35 / #37 stay closed.

**Proposed first-release decisions:**

| Question | Proposed answer |
| --- | --- |
| What is the first playable slice? | Player-initiated boarding order against a **detected, legally reached ship hull** at **≤10% max hull**; one attempt → capture **XOR** scuttle; prize credit path named; command transfer among owned/captured hulls; away-team XP **not tracked yet**. |
| Where do boarding facts live? | A compact `state.boardingBook` (name can change) **outside** `systemStates`, keyed on `securityInstanceId`. Prize hulls join `state.playerFleet` (or an explicit prize roster beside it). **Never** as a fake `npc.id` recycle. **Never** inside `systemStates`. |
| When may boarding start? | Target **ship hull** `combatHull / maxCombatHull ≤ 0.10`. UI and order **refuse** above that. Stations are **out** (Phase 1 already owns station capture/reclaim). |
| Capture or scuttle? | **XOR.** One attempt writes one terminal outcome. Exact success odds **TBD — do not invent percentages.** First slice may resolve by **named inject** (capture / scuttle / fail) so probes can score the write without a chance table. |
| Is tractor boarding? | **No.** Existing tractor hold (device id 25) is not a boarding start, not a capture, and not a scuttle. |
| Does boarding inject fire / culture / `engagement_authorized`? | **No.** Pursuit ≠ permission ≠ per-weapon gate still holds. |
| Is capture a Phase 4 kill-standing cascade? | **No by default.** Capture uses a **capture** token family. Scuttle of the *original* hull (no prior capture) may subscribe to existing destruction standing **once**. Later destroy/scuttle of a **prize** must not double-charge the original victim. |
| Does capture silently refit / gift a fleet / rewrite concessions? | **No.** Hull identity, installed slots, and crew-as-on-hull are preserved. Command of **that hull** is not command of the former government’s fleet or stations. |
| May we board a hull we have not detected / legally reached? | **No.** Phase 3 compliance + Phase 6 cloak/contact layers. Detection required. `firingSolution` **not** required (boarding is not a shot). Cloaked-and-hidden = refuse. |
| Away-team XP? | **Not tracked yet.** Explicit. Magnitudes / retain-vs-lose **TBD / injectable**. Do not invent an XP table. Silent XP is a fail. |
| Command transfer? | **In this brief**, separate from the boarding attempt. Player may transfer flagship command to another **owned or captured** hull. Not a gift of a foreign fleet. |
| Phase 5 prizes / convoys? | Capture ≠ destroyed ≠ overdue. Subscribe to close-once tokens. Do not invent an attacker from capture. |
| Success % / away-team size / travel / combat math? | **Injectable / TBD.** Shape locked; numbers not locked. |
| May we reopen EW / #33 / #35 / #37, or crib remastered? | **No.** Blind bake-off: `docs/` only. |

These are recommendations for this boarding package, not new decisions attributed to the user. Locked bake-off constraints take precedence over older flavor that treated tractor as boarding, a cutting beam as capture, an EW ghost as a prize, capture as a kill, or changing holder as a silent refit.

Cite `docs/GUIDED-CONVERGENCE.md` §4 as the planning source this brief **reconciles**, not as a second spec:

| Convergence §4 | This brief |
| --- | --- |
| Target hull ≤ **10%** of maximum hull | Hard gate 1. |
| Outcomes: **capture or scuttle**. Exact success odds **TBD** | Hard gate 2. Odds stay TBD / injectable. |
| Away-team XP retain vs lose is **TBD**. Do not invent an XP table | Hard gate 8: explicit **not tracked yet**. |
| Fleet command transfer is a **separate** engine feature | §12. Not the boarding attempt. |
| Open: away-team size, travel, combat resolution | §10. Injectable shape; no invented table. |
| Open: preserve weapons / cargo / crew identity | Gate 6 + §8: preserve hull identity; no silent refit. Crew intern vs prize-crew **TBD** (identity of the hull is not TBD). |
| Open: standing / incident — capture is not a kill cascade; no double-charge if scuttle later destroys | Hard gate 5. |
| Open: Phase 3 + Phase 6 legal reach / detection | Hard gate 7. |
| Acceptance: refuse above 10%; XOR write; XP explicit; command transfer does not rewrite Phase 1 / gift a fleet | Gates 1, 2, 8, 6. |

## 2. Locked constraints (do not reopen)

The bake-off room locked these before this brief. Implementation and probes must treat them as **hard gates**. Referee / One score this brief against these **eight** **before** any engine PR. Phase 9 / 9.1 / 9.2 EW gates stay **closed**; they are restated only as **preservation** (must-not-break + non-goals), not as a reopen.

### Hard gate 1 — ≤10% hull to start

> Boarding UI / order **refuses** unless the target ship hull is at or below **10% of maximum hull**. Above 10%, the control is absent or disabled and the order helper returns a sayable refuse. Do not start boarding from a tractor hold, a cutting-beam hit, an EW ghost, a Phase 5 overdue, or a cloak residue.

Lane owner (wording): **Number Four**.

NPC / live combat hulls already expose `combatHull` / `maxCombatHull` (`src/main.js`). The gate is `combatHull / maxCombatHull ≤ 0.10` (inclusive at 10%). A hull at 0 is already a destruction path — boarding a wreck is **out** (open Q3; default: refuse if `destroyed` or `combatHull ≤ 0`). Player hull, if an NPC boarding path is later scoped, uses `state.hull` which is already 0–100 percent: refuse above **10**. Do not invent a second health religion. Do not use shield percent as a substitute. Stations / defense platforms are **not** boarding targets in this slice (Phase 1 capture/reclaim already owns installations).

### Hard gate 2 — Capture XOR scuttle

> One boarding **attempt** writes **capture** or **scuttle**, never both. Capture takes command of that hull as a prize. Scuttle destroys / renders that hull unusable **by the attempt**. Exact success odds remain **TBD — do not invent percentages.** A failed attempt that writes neither capture nor scuttle is legal (the hull remains the original holder’s, still ≤10% if it was). A path that stamps `captured: true` and `destroyed: true` on the same attempt **fails**.

Lane owner (wording): **Number Four** on the write; **Number 2** on “capture is not a kill.”

First slice may resolve the attempt by **named inject** (`outcome: 'capture' | 'scuttle' | 'fail'`) so S17 can score the XOR without a chance table. When a later playtest injects odds, they remain overrideable. `MAGNITUDES_LOCKED_FROM_REMASTERED` style lock stays **false** (no remastered boarding table).

### Hard gate 3 — Tractor ≠ board

> Existing tractor hold is **not** boarding, capture, or scuttle. Cutting beam is **not** capture. An EW ghost / decoy is **not** a prize hull. `tractorIsBoarding()` remains **false**. Tractor stays a **weapon/device slot** item (id 25). A tractor-held hull may *also* be a legal boarding target if gates 1 and 7 pass; hold is neither necessary nor sufficient.

Lane owner (wording): **Number Four**.

Phase 9 already locked this (gate 6 / S14.13 / S14.18). This brief **does not** flip `tractorIsBoarding`. It **adds** a distinct boarding order. Probe `tractorHold` remains the Phase 3 inability path (`unable_to_comply`), not a prize path.

### Hard gate 4 — No gifted FS / culture / `engagement_authorized`

> Boarding does **not** inject fire permission, culture fire, or `engagement_authorized`. Pursuit ≠ permission to engage ≠ per-weapon firing gate still holds. A captured prize does not auto-fire, does not inherit a gifted `firingSolution` on remaining hostiles, and does not rewrite `consultDoctrineFire`. Culture on the prize hull cannot grant fire. Pack `protect` still folds.

Lane owner (wording): **Number 2**.

`consultDoctrineFire` must keep deleting `engagement_authorized` if a writer tries to stuff it in from a boarding result, a prize crew, or a command-transfer. Capturing a hull is **command of that hull**, not a war declaration and not a weapons-free token.

### Hard gate 5 — Prize credit path explicit

> Who owns standing / incident / credit is **named** for capture vs scuttle. **Capture is not a Phase 4 kill-standing cascade by default.** Do **not** double-charge if a later scuttle or destroy finishes the hull. Subscribe to Phase 4 `punishmentToken` discipline: one fact, one token family.

Lane owner (wording): **Number 2** on standing / incident; **Number Four** on the token hook.

| Terminal write | Standing | Incident | Token family | Phase 5 |
| --- | --- | --- | --- | --- |
| **Capture** (no prior capture) | **Do not** call `applyKillStanding` / witness-patrol `-2` for the original victim. Capture is not a kill. Later “prize prestige” is **TBD / not invented here**. | May open a `capture` (name can change) incident that **describes** the prize. Default FLASH: **no** (not a destruction). | `capture:${credit}:${systemIndex}:${victimInstanceId}:${bucket}` — records the prize; **forbids** a later `kill:` token against the **original** victim for this hull | Not `destroyed`. Close-once as **captured** if the hull was an assignment. Overdue still ≠ destroyed ≠ attacker. |
| **Scuttle** of the **original** hull (same attempt; never captured) | May subscribe to existing `destroyNpcShip` player-credited standing **once** (scuttle is destruction of the original). NPC-only scuttle: no player standing (Phase 1 credit). | Existing `destruction` incident + token | Existing `kill:${credit}:…` | `markAssignmentDestroyed` if assigned — **only** because the hull was actually destroyed |
| **Later destroy / scuttle of a prize** (hull already captured) | **Not** a second kill of the original faction. Destroying your own prize does not re-run `applyKillStanding` against the former holder. | Not a second `destruction` of the original victim. Optional prize-loss journal. | Capture token already spent; do **not** mint `kill:` for the original `victimInstanceId` | Assignment already closed as captured; do not reopen as destroyed-of-original |
| **Fail** (neither) | No standing. | No capture / destruction incident from this attempt. | No token. | Unchanged. |

Phase 1 combat credit still holds: only `player` / `playerEscort` final **hits** (and, for scuttle-of-original, the player-credited scuttle write) reward or blame. A prize hull that later fires does so as `player` / `playerEscort` once command has transferred — that is a **new** fact, not a back-dated kill of the prize’s former self.

Salvage latinum on `destroyNpcShip` is a **destruction** payout. Capture must **not** pay that salvage as if the hull exploded. Scuttle-of-original may keep the existing salvage path (it is destruction). Do not invent a new salvage table here.

### Hard gate 6 — Phase 1 identity

> Capture and command transfer do **not** silently refit; do **not** rewrite foreign concessions; do **not** gift another government’s fleet. Preserve hull / crew identity rules per Phase 1. Changing holder is not `resolveNewLiveShipId`. Empty slots stay empty. Reman **53** / catalog wire / `playerFaction` / `playerSide` are not boarding writes.

Lane owner (wording): **Number 2** on ownership / concessions / fleet gift; **Number Four** on hull instance fields.

Phase 1 already has `shouldPreserveNpcIdentity` / `preserveNpcIdentityFields` (`shipId`, `name`, `faction` as hull record, `role`, `fleetId`, …). Convergence: existing ships preserve identity; changing holder does not silently refit; keep `getShip` distinct from `resolveNewShipId`. On capture:

| Preserve | Do not |
| --- | --- |
| `securityInstanceId` (new prize id is allowed as a **command** id; the physical hull instance must remain traceable — do not recycle ambient `npc.id`) | Reuse a live ambient slot’s `npc.id` as the prize |
| `shipId` / catalog hull identity | Call `applyShipDefaultWeapons` / `resolveNewLiveShipId` / auto-fill empty `weaponSlots` |
| Installed `weaponSlots`, suite, `ew_equipment` as currently fitted (including empty) | Gift a default Phaser because the prize “should have guns” |
| Cargo actually on the hull, if any store exists; do not invent a manifest from `buildShipScanReport` | Treat scan flavor as inventory (Phase 4 / 6 still own that forbid) |
| Hull damage (≤10% remains until repaired at a `repairCapable` location) | Full repair as a capture bonus |
| Foreign concessions / station owners in-system | `for (station of system) station.faction = player` |
| Former government’s other hulls, doctrine, checkpoints | Conscript the fleet because one prize was taken |
| `state.playerFaction` / `playerSide` / Reman unlock / two-mode ROE | Rewrite identity from the prize’s former faction or culture |
| Culture id on the hull as **culture**, not empire | Culture fire; Reman culture as unlock |

Crew: **identity of the hull is preserved.** Whether NPC crew is interned, removed, or retained as prize crew is **TBD** (Q8). Whatever the later inject, it must not mint the player a second government’s officer roster or stamp player Security ROE onto a foreign NPC polity.

Command transfer (§12) is the same identity contract on hulls the player **already** owns or has captured.

### Hard gate 7 — Legal reach / detection

> The actor cannot board a hull they have not **legally reached** and **detected**. Phase 3 compliance + Phase 6 cloak / contact layers. Hidden stays hidden. A Phase 4 report is not a live boarding lock. Tractor hold is not reach.

Lane owner (wording): **Number 2** on knowledge bounds; **Number Four** on the order helper.

Required to **issue** a boarding order (all of):

1. **Detection** on the actor’s contact row (`detected: true`). Identification may be partial or none; do not require `firingSolution` (boarding is not a shot; do not gift a lock to make the UI work).
2. **Not cloaked-hidden** from this observer (Phase 6 gates 1 / 3 / 4). Cloak truth hidden ⇒ refuse. Residue / last-known / area track without live detection ⇒ refuse.
3. **In boarding range** of the acting hull (injectable; default envelope TBD — not a locked meter). Out of range ⇒ refuse.
4. **Phase 3:** a pending / noncompliant checkpoint order does **not** authorize boarding as “enforcement.” Refusal / `unable_to_comply` remain non-aggression. Boarding is not a substitute raid flag. Visitor-denied services at a dock are irrelevant in open space; do not fold boarding into `repairCapable`.
5. **Same loaded system.** Do not board through a report from another system. Phase 7 parked stay-behind hulls do not telepathically board into another scene.

Hail without detection is already denied under Phase 6. Boarding follows that family. Escort ECCM share (9.2) still cannot gift `firingSolution`; it also **cannot** gift a boarding lock the flagship did not detect (shared detection **may** satisfy (1) if the flagship row actually received `detected` — same cap as 9.2 gate 2; still no FS).

### Hard gate 8 — Away-team XP rule explicit

> Away-team XP is **not silent**. This brief locks the first-slice rule as **not tracked yet**. Retain vs lose on failure / death / scuttle remains **TBD / injectable**. Do **not** invent an XP table or locked success percentages. An engine that awards or strips XP without a named rule **fails**. An engine that leaves XP unmentioned in the snapshot **fails**.

Lane owner (wording): **Referee / One** (explicitness); **Number Four** on the snapshot field.

Proposed snapshot contract (names can change):

```js
awayTeamXp: {
  tracked: false,          // first slice
  rule: 'not_tracked_yet', // retain | lose | not_tracked_yet
  magnitudesInjectable: true,
  tablePresent: false      // fail if an invented table appears
}
```

When a later scoped slice tracks XP, it must pick **retain**, **lose**, or a named mix **in the brief first**. Magnitudes stay injectable.

### Also from convergence / the room (score with the gates; not a ninth religion)

| Room / convergence want | How this brief locks it |
| --- | --- |
| ≤10% hull to start | Gate 1. |
| Capture XOR scuttle; odds TBD | Gate 2. |
| Tractor ≠ board | Gate 3. |
| No gifted FS / culture / `engagement_authorized` | Gate 4. |
| Prize credit explicit; capture ≠ kill cascade; no double-charge | Gate 5. |
| Phase 1 identity; no silent refit; no gifted foreign fleet | Gate 6. |
| Legal reach / detection (P3 + P6) | Gate 7. |
| Away-team XP explicit; magnitudes/odds TBD | Gate 8. |
| Command transfer among owned/captured hulls | §12 (identity = gate 6). |
| Phase 5 objectives / prizes | §11 (credit = gate 5). |
| Screenshot / no-clip continues | Process lock; later engine. |

### Must not break (cite landed work)

Score these as **preservation**. A boarding Pass that regresses them is a Fail. **#33, #35, and #37 stay locked.**

| Locked rule | Cite | Boarding must not |
| --- | --- | --- |
| Detection ≠ identification ≠ track quality ≠ `firingSolution`. An old report is not a live lock. | Phase 6 hard gate 2; Phase 9 gate 2; 9.2 share caps | Require or gift `firingSolution` to board. Seed a lock from a prize, a scuttle flash, or an away-team. |
| Hidden stays hidden. Lost tracks drop exact targeting same tick. | Phase 6 gates 3–4 | Board a cloaked-hidden hull. Keep `combatTargetId` after FS drops because “we’re boarding.” |
| Culture cannot grant fire. `engagement_authorized` never injected. | Phase 1 / doctrine; Phase 9 gate 5; `consultDoctrineFire` | Write the fact from capture, scuttle, prize crew, or command transfer. |
| Pursuit ≠ permission ≠ per-weapon gate | Phase 1; Phase 9 gate 5 | Treat boarding as a shot, or a prize as weapons-free. |
| Checkpoint refusal / inability are not aggression | Phase 3 / 4; S6.1 / S6.2 | Turn boarding refuse, tractor hold, or `unable_to_comply` into `attackId` / fire. |
| Punishment tokens; standing once | Phase 4 §8; S6.4 | Call `applyKillStanding` on capture. Double-charge if a prize is later destroyed. |
| FLASH append-only; no second offense pulse | Phase 4 §7.3; S6.14 | Pulse FLASH as “boarding happened” unless a **new** FLASH-eligible incident actually opened. Capture default is **not** FLASH. |
| Overdue ≠ destroyed ≠ attacker | Phase 5; S8 | Treat capture or overdue as `destroyed`. Invent `attackerId` from a boarding fail. |
| Ghosts are book rows only; decoys ≠ hulls | Phase 9 gate 2; 9.2 gate 5 | Board a ghost. Capture a decoy. Prize an `ew_ghost` / `ew_decoy` row. |
| Tractor stays a device slot | Convergence §1; Phase 9 gate 4; S14.13 | Move tractor to cargo; set `tractorIsBoarding() === true`. |
| Weapons matrix before overhaul; no universal shield bypass | Phase 9 gate 4 | Retune `game_items.json` so boarding “bypasses shields.” Auto-fill empty slots on capture. |
| Catalog wire: 172 active, 38 aliases, Reman **53** | PR #28; S11 | Resurrect discarded IDs. Grant Reman unlock because a prize hull is 53. Rewrite `playerFaction`. |
| Phase 7 standing orders persist | PR #29; S12 | Silently supersede `hold_outside` because a prize joined. Drop parked stay-behind ships. |
| Phase 8 markets subscribe-only | PR #31; S13 | Restock, embargo-as-fire, or sell hull 53 from a prize flavor row. |
| Empty stays empty; unarmed cannot fire | Convergence §3 | `applyShipDefaultWeapons` on capture / command transfer. |
| Repair arms / `repairCapable` | Side-lane PR #18 | Repair overlay from boarding. Capture-bonus full repair. |
| Independence / concessions | Side-lane; Phase 1 | Retitle stations because a hull was captured. |
| EW spend-to-suppress / residue-before-void / lobes / claim-only spoof | #33 / #35 / #37 | Reopen EW. Treat silent-running or transponder-off as boardable cloak-void. |

Also preserve, without reopening:

- Authority is a political side (`isSystemControlled`), not a flown flag.
- Two ROE modes unchanged. Access is a permission, not a ceasefire.
- Phase 1 combat credit: only `player` / `playerEscort` final hits reward or blame (scuttle-of-original may use that path; capture does not).
- Phase 6 first-frame cloak, purposeful destinations, arrival/spacing/exit stay closed.
- Phase 6.5 generation / passive-vs-active / paid suites / reserved `ew` stay closed.
- Soft authored breakaway profiles stay **out**.
- Phase 9 four EW families stay named; 9.2 lobes / share / catch / heat / decoy / silent stay. Boarding is **not** a fifth EW family.

### Process locks (implementation locks, not a change to gates 1–8)

- **Proposal first.** Do not implement from this text until Tenth scopes the engine lane after a brief Pass.
- **Blind bake-off.** Implement against bake-off `main` (**this** head after #37, `f9f077f`), **not** remastered. Implement from `docs/` only. Do **not** crib `Artemis2028/BM1-remastered-work`.
- **No invented success % or XP tables as locked constants.** Outcome *shape*, XOR *write*, hull% *gate*, credit *token families*, identity *forbids*, and reach *forbids* are locked. Away-team size, travel ms, combat resolution, success odds, and XP magnitudes are **TBD / injectable**.
- **#33, #35, and #37 stay locked.** A PR that reopens EW gates, regresses S14–S16, or “fixes” boarding by making tractor a capture **fails** this brief even if hull% is green.
- **Subscribe, do not fork.** Boarding writes call existing Phase 1 identity helpers, Phase 3 encounter/reach, Phase 4 `openIncident` / `rememberPunishment`, Phase 5 close-once / `markAssignmentDestroyed` only for real destruction, Phase 6 contact layers, Phase 7 `playerFleet` / orders, Phase 9 `BOARDING_IMPLEMENTED` **flip** (today `false`), tractor helpers **unchanged**. Do not implement a second incident ledger, a second standing religion, or a second fleet roster that bypasses `playerFleet`.
- **§13 saved timers:** away-team travel / attempt clocks use `localElapsedMs`. Do not persist `performance.now()` as a deadline. (Tractor probe still uses `performance.now()` today; do **not** copy that pattern into boarding.)
- **Screenshot / no-clip process lock continues** for a later engine PR (1280×720; `clippedControls: []`; dock-clear). This docs PR does **not** attach those PNGs.
- **No Pass claimed** in `docs/BAKEOFF-STATUS.md` from this PR.
- **Not Phase 10.** Do not title, store, or implement this as Dominion / wider-faction content.

## 3. Hull threshold (gate 1)

**Lane owner (wording):** Number Four.

### 3.1 What 10% means

```text
boardingEligibleHull(target) iff
  !target.destroyed
  && target.maxCombatHull > 0
  && target.combatHull > 0
  && target.combatHull / target.maxCombatHull <= 0.10
```

Player flagship, if later boarded: `state.hull <= 10` (already percent). Do not convert NPC ratios through `state.hull`.

UI / order:

- Above 10%: control absent or disabled; helper `{ ok: false, reason: 'hull-above-threshold' }` (name can change).
- At or below 10%, other gates failing: distinct reasons (`not-detected`, `cloaked-hidden`, `out-of-range`, `checkpoint-does-not-authorize`, `tractor-is-not-board`, `ghost-not-hull`, `station-not-boardable`).
- Do not reuse the tractor inability string (`unable_to_comply`) as a boarding refuse.

Player-facing line:

- `Hull above 10%. Boarding refused.`
- `Hull at or below 10%. Boarding available — tractor hold is not a capture.`

### 3.2 What the threshold must not do

- Start boarding because shields are down.
- Start boarding because a tractor is attached.
- Start boarding because Phase 5 is overdue.
- Round 11% down to 10% in UI only (the helper must use the real ratio).
- Treat a station `combatHull` as a ship boarding target.

## 4. Capture XOR scuttle (gate 2)

**Lane owner (wording):** Number Four on the write; Number 2 on capture ≠ kill.

### 4.1 One attempt, one terminal write

```js
{
  attemptId: 'brd-1',
  actorInstanceId: 'player',
  victimInstanceId: 'npc:security-instance-9',
  hullRatioAtStart: 0.08,
  outcome: 'capture' | 'scuttle' | 'fail',
  captured: false,
  scuttled: false,
  // invariant: captured && scuttled === false
  firedAtLocalMs: 0,
  resolvedAtLocalMs: null
}
```

| Outcome | `captured` | `scuttled` | Hull after |
| --- | --- | --- | --- |
| `capture` | true | **false** | Live prize; same `shipId` / slots / damage |
| `scuttle` | **false** | true | Destroyed / unusable; subscribe to `destroyNpcShip` if this is the original hull |
| `fail` | false | false | Original holder; still the same instance |

A second attempt on the same live hull is a **new** `attemptId` if the first failed. A captured prize is no longer a boarding target for the capturing side (command transfer applies instead). A scuttled hull is gone.

### 4.2 Odds stay TBD

Do **not** ship a locked 40/60 or any other percentage. Probe inject:

```js
injectBoardingAttempt({ victimInstanceId, outcome: 'capture' | 'scuttle' | 'fail' })
```

Fail setup if the helper is missing. Fail the case if both flags stamp true. When a later playtest injects odds, override must change the snapshot (same family as 9.2 magnitudes).

### 4.3 Player-facing lines

- `Away team reports: prize taken. Hull captured — not destroyed.`
- `Away team reports: scuttled. Hull destroyed by the attempt.`
- `Away team failed. Hull remains theirs. Not a kill token.`

If the UI says “destroyed and captured,” the XOR is not ready.

## 5. Tractor is not boarding (gate 3)

**Lane owner (wording):** Number Four.

Landed facts to **subscribe**, not replace:

| Fact | Where |
| --- | --- |
| Tractor id 25, `type: Device`, slot item | `data/game_items.json`; Phase 9 matrix; `TRACTOR_BEAM_WEAPON_ID` |
| Hold tows / anchors; not a prize | `state.tractorBeams`; `tractorHold` probe |
| Tractor / engine-disable ⇒ `unable_to_comply` | Phase 3 / S5.10 / S6.2 — **non-aggression** |
| `tractorIsBoarding() === false` | `src/phase9-ew.js` |
| Cutting beam ≠ capture; ghost ≠ prize | `cuttingBeamIsCapture()`, `ghostIsPrize()` |

Boarding UI is a **distinct** control / order. A tractor-held, ≤10%, detected hull may be boarded **if the boarding order is issued**. Completing a tractor hold never writes `captured` or `scuttled`.

## 6. Fire gates stay closed (gate 4)

**Lane owner (wording):** Number 2.

| Event | May do | Must not do |
| --- | --- | --- |
| Issue boarding order | Check hull%, detection, range | Set `engagement_authorized`, `attackId`, `mayAutoEngage` |
| Capture | Take command of **that** hull; prize may later fire under existing player/escort credit **once it is a player-side hull** using **its installed weapons** and a **live** FS it **earns** | Gift FS on capture tick; culture fire; auto-engage remaining hostiles because “we boarded” |
| Scuttle | Destroy that hull (original-scuttle path) | Authorize a second shot / raid on bystanders |
| Command transfer | Change which owned hull is flagship | Rewrite ROE modes; inject `engagement_authorized` |
| Prize crew / culture | Remain culture | Grant fire; become an empire; unlock Reman |

`liveFireFactsFromEw` / `consultDoctrineFire` delete `engagement_authorized`. Boarding helpers must **not** pass that extra. Pack `protect` still folds to `record_only`.

## 7. Prize credit (gate 5)

**Lane owner (wording):** Number 2 on doctrine/standing; Number Four on the hook.

### 7.1 Capture is not a kill

`destroyNpcShip` today: salvage latinum, `applyKillStanding` (patrol −4 / other −2 + friend/enemy fan-out), witness-patrol −2, optional Vex Borg feat, `openIncident(kind: 'destruction')`, `rememberPunishment`, Phase 5 `markAssignmentDestroyed`.

**Capture must not enter that function** for the original hull. Prefer a `capturePrizeHull` (name can change) that:

1. Stamps the capture token.
2. Optionally opens a **non-FLASH-by-default** `capture` incident (Q10).
3. Moves command of that instance onto the acting side (§8).
4. Leaves `applyKillStanding` untouched.
5. Does not pay destruction salvage.

### 7.2 Scuttle of original vs later prize loss

- **XOR scuttle on the original:** calling `destroyNpcShip` (or a wrapper that is the same standing/incident path) is **legal** because the hull was never a prize. Token is `kill:`.
- **Prize later destroyed:** wrapper must see the capture token for that `victimInstanceId` and **skip** original-faction kill-standing and skip a second original-victim `destruction` blame. Player-credited destruction of *their own* prize is not a foreign kill.

### 7.3 Who is credited

| Actor | Capture credit | Scuttle-of-original credit |
| --- | --- | --- |
| Player away-team from flagship | `player` | `player` (destruction path) |
| Player escort away-team (if later allowed) | `playerEscort` | `playerEscort` |
| NPC-only | no player standing (Phase 1) | no player standing |

Do not credit ambient replacements that reused `npc.id`.

## 8. Identity on capture (gate 6)

**Lane owner (wording):** Number 2 on politics; Number Four on instance fields.

### 8.1 Prize roster

Captured hull becomes a **player-owned** instance:

- Travelling prize / escort-like assignment, **or**
- System defense fleet row if the player holds the system (existing `playerFleet` commission rules — do **not** bypass “only in systems you control” by capture; a prize taken in a foreign system still belongs to the player as a **hull**, but does not seize the system or its concessions).

Suggested row (names can change):

```js
{
  id: 'pz-…',                 // command id; not ambient npc.id
  sourceInstanceId: 'npc:…',  // original securityInstanceId
  shipId: 41,                 // preserved
  name: '…',                  // preserved (Q9 may allow a rename later; default preserve)
  formerFaction: 'klingon',
  faction: /* player side affiliation for *command*, not a silent hull-type rewrite */,
  weaponSlots: [ /* same as at capture */ ],
  combatHull: /* same ratio */,
  capturedAtLocalMs: 0,
  captured: true,
  assignment: 'escort' | 'prize' | 'fleet'
}
```

`faction` on a player-commanded hull already exists on commissioned fleet rows (`state.playerFaction`). Using that for **command affiliation** is allowed. Using it to **change `shipId`**, fill weapons, or mint Reman access is not.

### 8.2 Weapons, cargo, crew

| Asset | First-slice lock | TBD |
| --- | --- | --- |
| Installed weapons / devices / suite / EW slot | **Preserve as fitted, including empty** | — |
| Cargo actually stored on the hull | **Preserve if a real store exists**; do not invent from scan flavor | Whether boarding can loot without capturing (out) |
| Crew identity | Hull keeps its identity fields | Intern vs retain prize crew (Q8) |
| Damage | **Preserve** | — |

### 8.3 Not a fleet gift / not a concession rewrite

Capturing **one** hull:

- Does **not** transfer other hulls of that side.
- Does **not** call Phase 1 station transfer helpers except where those helpers would already apply (they should **not** apply because a ship was boarded).
- Does **not** mint independence, retitle a world, or rewrite `isSystemControlled`.
- Does **not** install player Security ROE on a foreign NPC polity.

## 9. Legal reach and detection (gate 7)

**Lane owner (wording):** Number 2 on knowledge; Number Four on the helper.

| Check | Pass | Fail |
| --- | --- | --- |
| Contact `detected` | Observer row true | Report-seed area only; residue-only; ghost; decoy |
| Cloak | Observer has detection of an uncloaked or detected-despite-cloak hull under Phase 6 rules | First-frame hidden; lost track; silent-running **as if** cloak (silent-running is not cloak — but detection is still required) |
| Range | Acting hull within injectable boarding range | Tractor range used as a substitute without a boarding check |
| Phase 3 | Boarding is not issued as checkpoint “enforcement fire” | `noncompliant` → auto-board; inability → auto-scuttle |
| System | Both in loaded system | Other-system report; parked escort in another system boards by telepathy |
| `firingSolution` | **Not required** | Gifting FS so the Board button lights up |

Player-facing:

- `No detection. Cannot board a hull you have not found.`
- `Target cloaked from you. Boarding refused.`
- `Checkpoint refusal is not a boarding warrant.`

## 10. Away team (gate 8 + open magnitudes)

**Lane owner (wording):** Number Four on clocks / inject; Referee / One on XP explicitness.

### 10.1 Shape (locked) vs numbers (not locked)

| Piece | Shape | First-slice number |
| --- | --- | --- |
| Size | Named count of away-team members | **TBD / injectable** — do not invent |
| Travel time | Delay before resolution on `localElapsedMs` | **TBD / injectable** — inject 0 ms for probes |
| Combat resolution | Named outcome write: capture XOR scuttle XOR fail | **No percentage table.** Inject outcome. |
| XP | `not_tracked_yet` | No table |

A later playtest may inject `{ awayTeamSize: N, travelMs: T, pCapture: … }` **only as overrides**. This brief does **not** publish a starting odds ledger (unlike Phase 9.2 §8, which had EW playtest defaults). Boarding odds were **explicitly** left TBD in convergence §4.

### 10.2 Attempt lifecycle

```text
eligible (gates 1, 3, 7) → order issued → away-team in transit (localElapsedMs)
  → resolve(outcome inject or later odds) → XOR write (gate 2) → credit (gate 5) / identity (gate 6)
```

Cancel / actor destroyed / scene unload: **fail** the attempt, do not write capture+scuttle, do not charge standing. Persist in-flight attempts **outside** `systemStates`. Do not use `performance.now()` deadlines.

## 11. Phase 5 objectives / prizes

**Lane owner (wording):** Number 2 on overdue ≠ destroyed; Number Four on close-once.

| Phase 5 fact | On capture | On scuttle-of-original |
| --- | --- | --- |
| Assignment hull captured | Close-once as **captured** (new reason, not `destroyed`). Cargo may remain on the prize (preserve). Shortage is **not** auto-filled. | Existing destroyed path |
| `truth.destroyed` | **false** | true, from real destruction |
| `attackerId` | **not** invented from capture | only from credited scuttle/destroy |
| Overdue window | Unchanged by capture of a *different* hull; this assignment closes captured | Unchanged rules |
| Ghost / decoy | Never an assignment prize | n/a |

Do not mint a free replacement convoy hull because the original was captured (Phase 5 gate 2 close-once / no free replacements). Do not treat a prize as `ghostIsPrize`.

Player latinum `openContracts` / `activeContract` pods are **not** this prize path.

## 12. Player ship-to-ship command transfer

**Lane owner (wording):** Number Four on the swap; Number 2 on “not a foreign fleet gift.”

Convergence: the player may transfer command to another **owned / captured** hull. Pack lists `fleet transfer` as a missing feature **separate** from adding `bm-ships/`. This brief **includes** that operation. It is **not** a boarding attempt and does **not** require ≤10% hull.

### 12.1 Who may receive command

| Eligible | Not eligible |
| --- | --- |
| Current flagship (no-op) | Foreign NPC hull not captured |
| Travelling escort in `playerFleet` (`assignment: 'escort'`) | Another government’s fleet / patrol / concession ship |
| Defense fleet row the player already commissioned | Station / planet |
| Captured prize hull the player holds | Ghost, decoy, wreck (`destroyed`) |
| | Ambient traffic that “looks like” the player’s faction |

Default envelope (injectable): **same loaded system** (or docked together). Do not transfer command across systems in the first slice (Q12).

### 12.2 What transfer does

1. Target hull becomes `state.playership` **instance** (the flown ship), keeping **its** `shipId`, slots, hull damage, cargo, suite, EW slot.
2. Previous flagship becomes a `playerFleet` row (escort or parked), keeping **its** identity — not `resolveNewLiveShipId`.
3. `state.playerFaction` / `playerSide` / Reman unlock / ROE **unchanged**.
4. Phase 7 orders on other hulls persist. Flagship-follow semantics may retarget to the new flagship (named write, not a silent wipe of `hold_outside` on parked ships).
5. Phase 5 urgency recalc on hull/fleet change already exists — **subscribe; do not soft-reset** a burned window (Phase 5 gate 7).

### 12.3 What transfer must not do

- Gift command of a hull the player does not own or has not captured.
- Refit either hull; fill empty slots; swap catalog ids through alias repair.
- Rewrite foreign concessions or system control.
- Inject `engagement_authorized` / culture fire.
- Require a boarding attempt or ≤10% on the target.
- Use tractor hold as the transfer control.

Player-facing:

- `Command transferred to <name>. Former flagship remains yours.`
- `Cannot take command of a foreign hull you have not captured.`

## 13. Controls and screenshot / no-clip

**Lane owner (wording):** Number Four. Copy can wait.

Exact widget names can change. If the control cannot say **why boarding is refused**, **capture vs scuttle**, and **that tractor is not capture**, it is not ready.

| Control | States (shape) | Notes |
| --- | --- | --- |
| **Board** | Hidden / disabled (reason) / available / in-transit / resolved | Distinct from tractor Fire/Hold |
| **Outcome** | Capture / scuttle / fail (readout) | XOR visible |
| **Command transfer** | Pick owned/captured hull | Not on foreign contacts |
| **Away-team XP** | `Not tracked yet` | Must be sayable in UI or probe snapshot |
| **Tractor** | Unchanged device hold | Must not relabel as Board |

Later engine PR: 1280×720 shots of Target / any boarding panel / Inventory / OPS / Settings with `clippedControls: []` and dock-clear (`docs/phase9/screenshots/phase92/` process). **This brief does not attach PNGs.**

## 14. Acceptance exercises (S17)

Keep all existing Phase 1 / S4–S16 / doctrine / catalog / side-lane gates green. **S14 stays the Phase 9 lock. S15 stays 9.1. S16 stays 9.2** — replay, do not rewrite. Add S17 fixtures that fail setup if the boarding helper, XOR writer, capture-token helper, command-transfer helper, or XP-rule snapshot is missing. Classification-only asserts are insufficient for “hull 11% refused,” “captured and not kill-standing,” and “tractor did not capture.”

Number Three owns the probe gate **after** engine, not this brief. IDs are a sketch; do not promise a final count.

| Case | Required exercise and result |
| --- | --- |
| **S17.1** Hull above 10% refuses | Fixture hull at **>10%** max. Board UI/order refuses with hull-threshold reason. No attempt row. Tractor hold on the same hull still works and does **not** capture. |
| **S17.2** Hull at 10% / below may start (other gates passing) | Fixture at **10%** and at **<10%**, detected, in range, not cloaked-hidden. Order accepted (or inject starts). Fixture at **11%** still refuses. `destroyed` / `combatHull ≤ 0` refuses (default). |
| **S17.3** Capture XOR scuttle | Inject `outcome: 'capture'`: `captured === true`, `scuttled === false`, hull live, `destroyed !== true`. Inject `outcome: 'scuttle'`: opposite; hull unusable. Inject both-flags write **fails** the case if the engine allows it. Fail outcome: neither flag, original holder. |
| **S17.4** Odds / XP not invented | Snapshot `awayTeamXp.rule === 'not_tracked_yet'`, `tracked === false`, `tablePresent === false`. No locked success-percent constant. Inject outcome still XOR-writes. |
| **S17.5** Tractor ≠ board | Replay S14.13 / S14.18 / S16.17: tractor device slot; `tractorIsBoarding() === false`; cutting beam ≠ capture; ghost ≠ prize. New: tractor hold at ≤10% **without** boarding order leaves holder unchanged. |
| **S17.6** No gifted FS / `engagement_authorized` / culture fire | After capture inject: `engagement_authorized` absent; `mayAutoEngage` unchanged unless Phase 2 evidence already permits; prize does not spawn with gifted FS on bystanders; culture on prize ≠ fire. Replay S14.16 / S15.12 / S16.17. |
| **S17.7** Capture is not kill-standing | Snapshot `factionStanding` before/after capture inject: **no** `applyKillStanding` / witness −2 for original faction. No destruction salvage latinum from capture. Capture token present; `kill:` token for that victimInstance **absent**. |
| **S17.8** Scuttle-of-original may use destruction once | Inject scuttle without prior capture: existing destruction incident + kill token **once**. Report delivery must not charge again (S6.4 family). |
| **S17.9** Later prize destroy does not double-charge | Capture inject, then destroy the prize. Original faction standing **does not** take a second kill cascade. No second original-victim `kill:` token. |
| **S17.10** Identity preserved / no silent refit | Capture: `shipId`, `weaponSlots` (including empty), damage ratio, name preserved. `applyShipDefaultWeapons` not called. `playerFaction` / `playerSide` / Reman 53 unlock unchanged. Concession owner fixture unchanged. Other foreign hulls not conscripted. |
| **S17.11** Command transfer | Two owned/captured hulls in-system. Transfer: new flagship is the target instance (same `shipId`/slots); old flagship remains owned. Foreign uncaptured hull refuses. No ROE rewrite. `hold_outside` on a parked ship persists. |
| **S17.12** Legal reach / cloak / report | No detection ⇒ refuse. Cloaked-hidden ⇒ refuse. Report-seed area-only ⇒ refuse. Out of system ⇒ refuse. FS false with detection true ⇒ **may** board (do not gift FS). |
| **S17.13** Phase 3 non-aggression | Checkpoint refuse / tractor `unable_to_comply` still not `attackId`. Boarding refuse is not aggression. Do not auto-board from noncompliant. |
| **S17.14** Phase 5 captured ≠ destroyed | Assignment hull capture-inject: close-once captured, `destroyed === false`, `attackerId` not invented. Scuttle-of-original still destroyed. No free replacement hull. Ghost/decoy cannot close an assignment as prize. |
| **S17.15** Persistence | In-flight attempt + captured prize: save, wipe `systemStates`, reload. Same attemptId / prize identity / tokens. Ambient `npc.id` reuse does not steal the prize. Clocks are `localElapsedMs`. |
| **S17.16** Both-sides / NPC path (minimal) | If first slice is player-only, snapshot says `npcBoardingImplemented: false` **explicitly**. If NPC boarding is on, same hull% / XOR / no FS inject. Do not silent-omit. |
| **S17.17** EW / catalog / markets preserved | Replay S14–S16 boarding-out **except** `BOARDING_IMPLEMENTED` may become true **without** tractor-is-board. S11 Reman 53; S13 no restock; S12 hold-outside; S6.4 / S6.14; S9 cloak. |
| **S17.18** Dock / no-clip (engine PR) | 1280×720 Target + boarding chrome: `clippedControls: []`, dock-clear. Docs-only brief: **N/A** (process lock). |

Each case may contain multiple assertions. Include startup smoke. Do not claim a Referee Pass from this list.

## 15. Non-goals

This boarding brief will not:

- Open **Phase 10** wider faction / Dominion campaign, Gorn reserved live spawn, or hidden Dominion discovery.
- Reopen EW / PR #33 / #35 / #37, remastered watts, or `git am` remastered patches.
- Weapon overhaul, HoJ combat retune, or universal shield bypass (including “boarding ignores shields”).
- Invent locked success percentages or an away-team XP table.
- Treat tractor hold, cutting beam, Thaleron, ghosts, or decoys as capture.
- Inject `engagement_authorized` or culture fire.
- Make capture a default Phase 4 kill-standing cascade, or double-charge when a prize is later destroyed.
- Silently refit prizes; auto-fill empty `weaponSlots`; rewrite foreign concessions; gift another government’s fleet.
- Board stations, wrecks (`combatHull ≤ 0` default), or cloaked-hidden hulls.
- Steal Phase 5 overdue bookkeeping or mint free replacement convoys.
- Key boarding inside `systemStates` or on recycled `npc.id`.
- Persist `performance.now()` as an away-team deadline.
- Activate Phase 3 `unknown` access enforcement as a boarding religion.
- Flags/passes inventory, construction visuals, difficulty knobs that change political identity.
- Touch `Artemis2028/BM1-remastered-work` as an implementation source.
- Claim a Referee Pass in `docs/BAKEOFF-STATUS.md`.

## 16. Implementation sequence and handoff

1. **Brief Pass.** Referee / One score the **eight** hard gates. Number 2 scores gates **4, 5, 6, 7** (fire / credit / identity / reach) and capture≠kill wording on **2**. Number Four scores gates **1, 2, 3** (hull%, XOR write, tractor≠board), the engine half of **5–7**, command-transfer hooks, and gate **8** snapshot explicitness. Do not open an engine PR on this document alone.
2. **Tenth scopes the engine lane** after Pass. Blind implement from `docs/` against bake-off `main` after #37 (`f9f077f`). Do not implement from remastered.
3. **Suggested order if scoped:** hull% refuse helper (S17.1–S17.2) → distinct boarding order ≠ tractor (S17.5) → XOR writer + inject (S17.3–S17.4) → capture prize identity (S17.10) → capture token / no kill-standing (S17.7–S17.9) → reach/cloak (S17.12–S17.13) → Phase 5 captured≠destroyed (S17.14) → command transfer (S17.11) → persistence (S17.15) → preservation (S17.6, S17.17). **Do not** ship tractor-as-capture. **Do not** ship capture-as-`destroyNpcShip`. **Do not** ship an XP table.
4. **Number Three** adds/runs S17 after engine. Keep Phase 1 / S4–S16 / `test:catalog` green. Do not weaken S14–S16 to make S17 pass — except `BOARDING_IMPLEMENTED` may flip true **with** `tractorIsBoarding` still false.
5. Changelog / status Pass wait on Referee after review. This proposal PR may note that the boarding brief is open; it must not write a Pass.

If one model implements NPC boarding, loot-without-capture, or an XP table, reserve a separate review pass. Fable can edit boarding/journal copy after the paths work.

## 17. Open questions

Mark these clearly. They do **not** weaken the hard gates.

| ID | Question | Default if engine is scoped before an answer |
| --- | --- | --- |
| Q1 | Exact success odds / away-team size / travel ms / combat resolution math? | **TBD / injectable.** S17.3–S17.4 inject outcomes. **No** locked %. |
| Q2 | Player-only boarding first, or NPC boarding of the player too? | **Player-initiated first.** Snapshot `npcBoardingImplemented: false` explicitly (S17.16). |
| Q3 | Board a 0% / wreck / escape-pod? | **Refuse** if `destroyed` or `combatHull ≤ 0`. Scuttle already covers “rendered unusable.” |
| Q4 | Board stations / outposts? | **Out.** Phase 1 station capture/reclaim remains the installation path. |
| Q5 | Must tractor hold be on to board? | **No.** Neither necessary nor sufficient. |
| Q6 | Boarding range meters? | **Injectable TBD.** Probes may inject “in range” / “out of range.” Do not lock tractor range as boarding range. |
| Q7 | Does capture FLASH? | **No by default.** Destruction FLASH stays on scuttle-of-original / kill path. |
| Q8 | Prize crew interned vs retained? | **TBD.** Hull identity preserved either way. Must not gift a foreign officer roster or culture fire. |
| Q9 | Rename a prize hull? | **Preserve name** first. Rename is extra UI, not identity rewrite. |
| Q10 | New incident `kind: 'capture'` vs append on a combat incident? | Prefer a **distinct capture kind** so kill-standing probes cannot confuse it with `destruction`. First slice may journal-only if the capture token still exists. |
| Q11 | Can escorts launch the away-team? | **Flagship first.** Escort-launch is a later inject; credit would be `playerEscort`. |
| Q12 | Command transfer across systems / while jumping? | **Same loaded system** first. Jump policy stays Phase 7 (follow vs stay). |
| Q13 | Does capturing hull 53 grant Reman purchase access? | **No.** Durable Reman unlock unchanged. |
| Q14 | Loot cargo without capturing the hull? | **Out.** |
| Q15 | Split engine PRs (hull% vs prize credit vs transfer)? | Tenth decides after Pass. Gates 2+5 still forbid capture+scuttle and double-charge. |
| Q16 | Difficulty knobs? | **Out.** Political identity stays the same. |
| Q17 | Away-team shown as a sprite / shuttle hull? | **Not required.** Book + clocks are enough. Do not spawn a fake combat hull that can be mistaken for a ghost prize. |

## 18. Lanes

| Who | Owns | Scores |
| --- | --- | --- |
| **Number 2** | Doctrine / standing / incident / **no `engagement_authorized`**: gates **4, 5, 6, 7** (fire, prize credit, Phase 1 identity / no gifted fleet, legal reach). Capture ≠ kill wording on **2**. Phase 5 captured ≠ destroyed. | No culture fire; capture token ≠ `kill:`; concessions untouched; no board without detection; command transfer ≠ foreign fleet gift |
| **Number Four** | Engine hooks: gates **1, 2, 3** (hull%, XOR write, tractor≠board), prize-credit **hook**, identity **fields**, reach **helper**, command-transfer swap, XP snapshot, later no-clip | 10% refuse; XOR; tractor unchanged; no silent refit; inject outcomes; `BOARDING_IMPLEMENTED` may flip without `tractorIsBoarding` |
| **Number Three** | Probe gate **after** engine (S17 on `__BM1_PROBE__` / offline tests; S4–S16 stay green) | Not this brief |
| **Referee / One** | This brief vs the **eight hard gates** in §2. **Do-not-open** check: not Phase 10, no EW reopen, no invented % / XP table, **no Referee Pass claimed** from this PR | **Before** any engine PR |

## 19. Deferred work remains on the plan

NPC boarding of the player, loot-without-capture, authored away-team XP tables, boarding odds playtest ledger, station boarding, shuttle sprites, and cross-system command transfer stay **out** until scoped. Phase 10 wider faction / Dominion, construction visuals, HTML review catalogs, flags/passes inventory, empty-but-armable *engine if still incomplete*, and difficulty knobs stay on the convergence backlog. Weapon overhaul still waits on the reviewed Phase 9 matrix **plus** a later Tenth-scoped retune. Independently addressable deep-space locations remain the plan §8 later add.

This boarding brief is ready to score when a reader can mark Pass/Fail on all eight gates: ≤10% hull to start; capture XOR scuttle with odds TBD; tractor ≠ board; no gifted FS / culture / `engagement_authorized`; prize credit explicit (capture ≠ kill cascade; no double-charge); Phase 1 identity (no silent refit / no gifted foreign fleet / no concession rewrite); legal reach / detection (Phase 3 + Phase 6); away-team XP explicit as **not tracked yet**. Magnitudes and success odds remain injectable / TBD. **No Referee Pass is claimed.**

## Sources and precedence

- This brief’s engine checklist: `docs/boarding/BM1-BOARDING-ENGINE-DEPENDENCIES.md`.
- Planning source (reconcile, do not invent odds/XP): `docs/GUIDED-CONVERGENCE.md` §4; plan §16.2 row 4; `bm-ships/integration-rules.json` `missingFeatures` (`boarding/capture`, `fleet transfer`, `away-team XP`); `bm-ships/README.md`.
- Phase 9 boarding-out lock (this brief **opens boarding**, does **not** reopen EW): `docs/phase9/BM1-PHASE9-EW-WEAPONS-PROPOSAL.md` gate 6; `src/phase9-ew.js` `BOARDING_IMPLEMENTED`, `tractorIsBoarding`, `boardingApis`; S14.18. Phase 9.1 S15.18; Phase 9.2 S16.17; PRs **#33 / #35 / #37**.
- Tractor device: `data/game_items.json` id 25; `src/main.js` `tractorHold` / `TRACTOR_BEAM_WEAPON_ID`; Phase 3 inability S5.10; Phase 4 S6.2.
- Phase 1 identity / credit / concessions: `src/phase1-authority.js` (`shouldPreserveNpcIdentity`, `preserveNpcIdentityFields`, `isStationTransferableFromHolder`); `resolveShipId` vs `resolveNewLiveShipId` in `src/main.js`; combat credit `grantsPlayerCombatCredit`.
- Phase 3 reach / non-aggression: `docs/phase3/`; `src/phase3-checkpoints.js`.
- Phase 4 incidents / tokens / FLASH: `docs/phase4/`; `src/phase4-incidents.js` (`openIncident`, `rememberPunishment`, `applyKillStanding` lives in `main.js` `destroyNpcShip`).
- Phase 5 captured ≠ destroyed: `docs/phase5/`; `src/phase5-objectives.js` `markAssignmentDestroyed`.
- Phase 6 detection / cloak: `docs/phase6/`; `src/phase6-sensors.js`.
- Phase 7 fleet / command surface: `src/phase7-fleet.js`; `state.playerFleet`; PR #29.
- Fire facts: `src/doctrine.js` `deriveLiveFireFacts`; `consultDoctrineFire` in `src/main.js`.
- Reman / catalog: PR #28; hull **53** / `meetPackPurchaseDecision`.
- UI process: `docs/phase9/screenshots/phase92/NOTES.md` (later engine; dock-clear / no-clip continues).
- Remastered boarding / capture: **not a patch source**. Blind bake-off.
- Bake-off process: `docs/BAKEOFF-STATUS.md` (this PR may note the boarding brief is open; no Pass claimed; #33 / #35 / #37 remain locked EW baselines).

Settled Phase 1–9.2 behavior, EW Passes #33 / #35 / #37, and these eight boarding gates take precedence over older handoff text that treated tractor as boarding, capture as a kill, changing holder as a silent refit, an EW ghost as a prize, or this package as Phase 10 Dominion.
