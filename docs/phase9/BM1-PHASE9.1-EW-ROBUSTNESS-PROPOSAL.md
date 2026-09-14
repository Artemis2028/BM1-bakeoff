# BM1 Phase 9.1 — Robust EW, burn-through, HoJ, transponder claim

**Status:** proposal for implementation; no engine changes made by this document.  
**Repository:** `Artemis2028/BM1-bakeoff`  
**Planning baseline:** `2b38a14` on `main` (14 September 2026), after Phase 9 EW / weapons engine (PR #33).  
**Referee context:** Phase 4 engine §6 **Pass** on `7f926df`. Phase 9 engine (PR #33) is the **locked** EW/weapons baseline — **Keep #33 Pass locked.** This is a **9.1 amend**, not a reopen of Phase 9’s six hard gates, not a reopen of S14, and **not** a claim that Phase 9 already had a Referee Pass on the status MD. This brief does **not** claim a new Referee Pass, does **not** reopen Phase 6 layers or Phase 6.5 generation, and does **not** reopen Phase 4/5 delivered reports.  
**Companion:** `docs/phase9/BM1-PHASE9.1-ENGINE-DEPENDENCIES.md` (hooks, risks, probe plan).  
**Scoped by:** Tenth Mountain Trooper, 2026-09-14 — proposal first; no engine until Tenth scopes after a brief Pass.

Phases 1–9 already landed: political authority, two-mode ROE, holding zones, incident ledger / FLASH, persistent convoy/`asset_overdue`, sensors/cloak + power suites, fleet hold-outside, compact finite markets, and Phase 9 EW on the reserved `ew` consumer with ghosts as contact-book rows, a read-only weapons matrix, and closed fire gates. Phase 9 **turned `ew` on**. It did **not** lock spend-to-suppress robustness, burn-through geometry, residue-before-void, RSS stacking, true-side friendly labels, a HoJ matrix row, or a transponder claim layer.

This is **one** connected robustness amend on the landed Phase 9 book: electronic warfare that **costs** on reserved `ew`, **always leaves a burn-through path** for a funded receiver, **never cloaks a contact into void**, stacks paid emitters by **root-sum-square**, labels own-fleet noise from **true side**, treats Home-on-Jam as a **weapons-matrix row first**, and treats transponder On/Off/Spoof as a **claim** — never as Phase 1 identity. It is not a remastered `git am`, not a fifth energy religion, not a reopen of PR #33, and not permission to lock remastered EU/s, prices, or wattages as constants.

## 1. The result we want

A jammer you paid for can suppress live ID / firm track / `firingSolution` — and the other side can still **name** what they see (a residue, a burn-through radius, whose noise it is), what it cost, and what they may **not** do with that knowledge (no gifted lock, no auto-fire, no Phase 1 rewrite).

**Exit condition:** the seven hard gates in §2 are scoreable; magnitudes stay injectable; Phase 9 / #33 stays closed.

**Proposed first-release decisions:**

| Question | Proposed answer |
| --- | --- |
| What is the first playable slice? | Spend-to-suppress on reserved `ew` + dedicated empty-by-default EW slot; RF burn-through `B × √Q` always positive for a funded receiver; residue row instead of contact-delete; RSS of all paid emitters; true-side friendly labels; HoJ as a matrix row (no retune); transponder claim layer only. |
| Where do 9.1 effects live? | Existing Phase 6 `state.contactBook` layers + Phase 9 `state.ewBook` + a compact claim/residue/contest snapshot (names can change). **Never** as fake `npcShips`. **Never** inside `systemStates`. **Never** as a second sensor religion. |
| Can jam invent invisibility? | **No.** Burn-through is always *available* (not always strong). Residue stays. Silent ≠ cloak. |
| May we `git am` remastered EW? | **No.** Remastered EW pack / DESIGN is **background shapes only**. |
| May we lock remastered EU/s, prices, wattages? | **No.** Shapes + formulas only. Magnitudes injectable / TBD. |
| May we reopen Phase 9 six gates or regress #33? | **No.** Ghosts stay book-only; delivered P4/P5 reports stay; matrix before overhaul; boarding out; no culture / `engagement_authorized` inject. |
| Culture / `engagement_authorized` from jam, HoJ, or a mismatched transponder? | **Forbidden.** Jam alone ≠ aggression / auto-fire. Launching on emission is not gifted `firingSolution` and not permission. |

These are recommendations for this amend, not new decisions attributed to the user. Locked bake-off constraints take precedence over older flavor that treated jamming as a cloak-void, strongest-three ceiling, transponder-as-identity, or HoJ-as-perfect-track.

## 2. Locked constraints (do not reopen)

The bake-off room locked these before this brief. Implementation and probes must treat them as **hard gates**. Referee / One score this brief against these **seven** **before** any engine PR. Phase 9’s original six gates stay **closed**; they are restated only as **gate 7** (preserve), not as a reopen.

### Hard gate 1 — Spend-to-suppress on reserved `ew`

> Jammer / EW draw maps onto Phase 6.5 reserved **`ew`** + the Sensors **A × H** shape. Brown-out still weakens. Never off-budget. Never a free fifth energy religion. Dedicated EW equipment slot (empty by default, one jammer, no stack) — does **not** steal a weapon mount or the sensor suite slot.

Lane owner (wording): **Number Four**.

Phase 9 already flipped `EW_EFFECTS_IMPLEMENTED === true` and bills `reservedEwDraw(activeDraw)` while an effect runs (`src/phase9-ew.js` `actorEwDraw` / `snapshotEwPower`; `src/phase65-power.js` `POWER_CONSUMERS` includes `'ew'`; `applyBrownout` can drop `ew` to 0). This amend **does not** add a sixth consumer. It **does** make the spend honest: jammer draw is `× A × H` on that same `ew` line; a starved / brown-out / S=0 ship cannot jam or ECCM; the slot is a new `ew_equipment` kind beside `sensor_suite`, not a fourth weapon mount and not a suite rewrite.

### Hard gate 2 — Burn-through always available

> Shape: **RF burn-through radius = B × √Q**, with **Q** from the receiver contest. For any finite field and a **funded** receiver, RF radius is **positive** → burn-through is always *available* (not always strong). Jam may degrade live contact layers; it must **never** invent permanent invisibility / cloak-void.

Lane owner (wording): **Number Four** on contest math; **Number 2** on “not a cloak” wording.

A funded receiver means Sensors points **S > 0** and the receiver is not brown-out dead (`E > 0` after A × H). Finite field means jammer noise **N** is finite. Then `Q = E / (E + N)` is in `(0, 1]` and `√Q > 0`, so radius `B × √Q > 0` for any injectable **B > 0**. Deep jam may still drop ID / firm track / `firingSolution`. It may not delete the contact into nothing, and it may not claim “unfindable at every range.”

### Hard gate 3 — Residue-before-void

> Deep jam may black out ID / firm track / `firingSolution`, but the contact book **keeps a residue** (emission / “something here” / area-or-detected row). Never delete-the-contact into cloak invisibility. Jamming tells you something is there even without knowing exactly what.

Lane owner (wording): **Number 2**.

Today `degradeLiveLayers` (`src/phase9-ew.js`) can set `trackQuality: 'none'` and `detected: false` — that is the void this gate forbids as a *jam outcome*. A residue is still a Phase 6 contact-book row on the **same four layers**: `detected` stays true **or** the row remains as `trackQuality: 'area'` (or an explicit `residue` / `source: 'ew_residue'` mark). Identification may fall to `none`. `firingSolution` must stay false unless the receiver **burns through** under gate 2 and re-earns a firm lock under Phase 6 rules. Do **not** add a fifth layer. Do **not** spawn a hull. Do **not** treat residue as a ghost (ghosts remain the Phase 9 deceptive family).

### Hard gate 4 — RSS all-paid emitters + true-side friendly interference

> Aggregate paid contributions with **root-sum-square** (diminishing returns). **No** strongest-three cutoff. **No** old percentage ceiling (including leftover flavors like 59.2% / 35%). Own-fleet interference labels come from **actual side / fresh own-side telemetry**, never from a transponder claim. Do not invent foreign identity from remaining measured noise.

Lane owner (wording): **Number Four** on RSS; **Number 2** on true-side vs claim.

`N = √Σ(cᵢ²)` over **all paid** jammer contributions that actually drew `ew` this tick (after A × H, after self-cancellation). Unpaid / draw-0 / brown-out-dead emitters contribute **0**. Own-emitter self-cancellation is a shape (~0.25, injectable). Friendly / own / mixed labels use `playerSide` / `sideId` / `securityInstanceId` — the Phase 1 political side and fresh telemetry — **not** `broadcast` / transponder claim (gate 6). Remaining noise after cancel is **noise**, not a guessed Romulan.

### Hard gate 5 — Home-on-jam as matrix row first

> Optional specialized anti-emitter / HoJ weapon is a **weapons-matrix row** (family / range / tracking / cost / counters / provenance) **before any retune**. Seeker: emission-only, incarnation-lock, silence→coast (no perfect track of silent/cloaked hull), private seeker knowledge, physical collateral hits with existing credit paths. Launching on emission is **not** gifted `firingSolution` and **not** `engagement_authorized`. Pursuit ≠ permission ≠ per-weapon fire still holds. Jam alone ≠ aggression / auto-fire.

Lane owner (wording): **Number Four** on the matrix row; **Number 2** on seeker / fire-gate wording.

Phase 9 gate 4 is **closed**: `src/phase9-weapons-matrix.js` already exposes ten columns + provenance and forbids combat-number retune (`BASELINE_COMBAT_NUMBERS`, `combatNumbersUnchanged`). A HoJ / anti-emitter family is a **new row** (or an explicit “unmounted / proposed” mark) on that ledger. Tracking column: **emission-only**. It does **not** need a Phase 6 hull `firingSolution` to *pursue an emitter*, and it does **not** write one. Silence (emitter draw → 0, residue without a live paid field) → coast; no magic track of a silent or cloaked hull. Seeker knowledge stays on the **munition**, not as a shared book lock. Collateral hull hits use existing Phase 1 `player` / `playerEscort` credit paths — no new blame religion. Do **not** implement a HoJ gun that retunes `game_items.json` before the row is reviewed.

### Hard gate 6 — Transponder On/Off/Spoof = claim layer only

> Contact-book **claim** (`off` / `true` / `spoofedFaction`). Never rewrites Phase 1 `playerFaction` / ownership / Reman / ROE side. Silent ≠ cloak (residue rules still apply). Forgetting has teeth: suspicion → challenge → access denial → optional Phase 4 incident **allowlist** — **never** auto-`engagement_authorized` from a mismatched blip. Penalty magnitudes injectable.

Lane owner (wording): **Number 2**.

Phase 3 already has `makeBroadcast({ faction, source })` with `hull` / `declared` / `none` (`src/phase3-checkpoints.js`). Phase 1 identity is `state.playerFaction` / `state.playerSide` (`src/main.js`). Reman **53** / `bm-ship:53` stays the catalog unlock. A transponder claim is an extra field on the **observer’s contact row** (and/or the subject’s declared broadcast), not a write to those stores. `off` is silent: residue / emission may still exist (gate 3); it is not Phase 6 cloak. `true` claims the actual side. `spoofedFaction` claims some other faction string. Mismatch vs true side may feed **suspicion** (UI / journal), a **challenge** (hail / checkpoint), **access denial** (Phase 3 `unknown` / `other` / policy — still not activating `unknown` enforcement as a new religion), and only then an optional Phase 4 kind on the **existing allowlist** (`access_notice` / `access_noncompliance` family, `record_only` default). A mismatched blip must not set `engagement_authorized`, `attackId`, culture fire, or `mayAutoEngage`.

### Hard gate 7 — Preserve Phase 9 / earlier locks

> Ghosts remain contact-book only (Phase 9 families stay). Jamming cannot wipe delivered P4/P5 reports. Weapons matrix before overhaul. Boarding out. No culture / `engagement_authorized` inject from EW. Do not reopen Phase 9’s six hard gates or regress PR #33.

Lane owner (wording): **Referee / One** (do-not-open check). Number 2 scores ghost / report / fire-gate preservation. Number Four scores budget / matrix / no-boarding-hook.

Cite Phase 9 gates 1–6 in `docs/phase9/BM1-PHASE9-EW-WEAPONS-PROPOSAL.md` §2 as **already locked**. This amend **subscribes**. It does not replace four EW families, does not spawn ghost hulls, does not unsend `deliverReport`, does not retune damage/cooldown/range, does not open boarding, and does not let HoJ / residue / claim collapse pursuit ≠ permission ≠ per-weapon fire.

### Also from the plan (score with the gates; not an eighth religion)

| Plan / room want | How this brief locks it |
| --- | --- |
| EW costs on the same budget as sensors | Gate 1. Draw on reserved `ew`; A × H; brown-out weakens. |
| Burn-through always available for funded receivers | Gate 2. `B × √Q`; Q from contest; never cloak-void. |
| Jam is not invisibility | Gates 2–3. Positive RF radius + residue row. |
| Stacking diminishing returns, all paid emitters | Gate 4. RSS; no strongest-three; no % ceiling. |
| Friendly labels are true-side | Gate 4 + 6. Telemetry / `sideId`, never claim. |
| HoJ is a named weapon with counters, not a lore skip | Gate 5. Matrix row first; emission-only seeker; silence→coast. |
| Transponder is a claim | Gate 6. `off` / `true` / `spoofedFaction`. Forgetting has teeth; no auto-fire. |
| Phase 9 six gates + #33 stay closed | Gate 7. |

### Must not break (cite landed work)

Score these as **preservation**. A Phase 9.1 Pass that regresses them is a Fail. **#33 stays locked.**

| Locked rule | Cite | Phase 9.1 must not |
| --- | --- | --- |
| Detection ≠ identification ≠ track quality ≠ `firingSolution`. An old report is not a live lock. | Phase 6 hard gate 2; `src/phase6-sensors.js`; S9.2; Phase 9 gate 2 | Raise layers from jam / HoJ / claim past what burn-through actually earned. Seed `firingSolution` from residue, emission, ghost, or spoof. |
| Hidden stays hidden on **both** sides. Lost tracks drop exact targeting on the **same tick**. | Phase 6 gates 3–4; S9.3–S9.5 | Leak a cloaked hull because a residue or HoJ coast exists. Keep `combatTargetId` / `liveWeaponTrack` after `firingSolution` drops. Treat silent ≠ cloak as “therefore cloaked.” |
| Passive / active never invent ID or `firingSolution`. `ew` is on the shared pool. | Phase 6 gate 6; Phase 6.5 gate 5; Phase 9 gate 1; S10.7 / S14.1 | Spend EW off-budget. Implement 9.1 effects at draw 0. Add a sixth consumer. |
| Already-delivered reports and observer copies persist | Phase 4 `deliverReport` / `observerKnowsIncident`; S6.9; Phase 5 delivered knowledge; Phase 9 gate 3; S14.6–S14.8 | Delete, unsend, or rewrite `delivered`. Drop `knownIncidentIds` because a jammer ticked. Let residue-delete wipe a report seed’s historical row. |
| FLASH append-only; no second offense pulse | Phase 4 §7.3; S6.14; S14.9 | Pulse FLASH as “jamming happened” unless a **new** FLASH-eligible incident is actually opened. Auto-FLASH from a spoofed blip. |
| Overdue ≠ destroyed ≠ attacker | Phase 5; S8 | Treat a jammed / residue convoy track as `destroyed` or invent `attackerId`. |
| Punishment tokens; standing once | Phase 4 §8; S6.4 | Charge standing again from an EW notice for a kill already tokenized. Charge standing from a transponder mismatch alone. |
| Culture cannot grant fire. `engagement_authorized` never injected. | Phase 1 / doctrine; Phase 6; Phase 9 gate 5; `consultDoctrineFire`; S14.16 | Write the fact from jam, residue, HoJ launch, or a mismatched claim. |
| Phase 3 refusal / inability are not aggression | Phase 3 / 4 | Turn comms disruption, a jammed hail, or transponder-off into `attackId` / fire. |
| Ghosts are book rows only | Phase 9 gate 2; S14.3–S14.5 | Spawn a residue hull. Gift a lock to a ghost because burn-through exists. |
| Weapons matrix before overhaul; no universal shield bypass | Phase 9 gate 4; S14.12–S14.15 | Retune `game_items.json` to “finish HoJ.” Inherit a lore bypass onto ordinary beams. Auto-fill empty weapon slots. |
| Tractor stays a device slot; boarding out | Phase 9 gates 4 / 6; S14.13 / S14.18 | Move tractor; treat HoJ / jam / tractor hold as board / capture. |
| Catalog wire: 172 active, 38 aliases, Reman **53** | PR #28; S11 | Resurrect discarded IDs or a second Reman hull because HoJ “needs a host.” Rewrite `playerFaction` / Reman unlock from a spoof. |
| Phase 8 markets subscribe-only | PR #31; S13 | Restock, embargo-as-fire, or sell hull 53 from an EW flavor row. |
| Suites do not occupy a weapon slot | Phase 6.5 `installSensorSuite`; `occupiesWeaponSlot: false` | Steal the suite slot or a weapon mount for the jammer. Stack two jammers in one slot. |

Also preserve, without reopening:

- Authority is a political side (`isSystemControlled`), not a flown flag.
- Two ROE modes unchanged. Access is a permission, not a ceasefire.
- Phase 1 combat credit: only `player` / `playerEscort` final hits reward or blame.
- Phase 6 first-frame cloak, purposeful destinations, arrival/spacing/exit stay closed.
- Phase 6.5 generation / passive-vs-active draw / paid suites / role curves stay closed.
- Phase 7 standing orders persist; EW must not silently supersede `hold_outside`.
- Soft authored breakaway profiles stay **out**.
- Phase 9 four families (sensor jamming, ghosts, fire-control, comms disruption) stay named and costed. 9.1 **amends** how jamming spends and what the book keeps; it does not replace the family contract.

### Process locks (implementation locks, not a change to gates 1–7)

- **Proposal first.** Do not implement from this text until Tenth scopes the engine lane after a brief Pass.
- **Blind bake-off.** Implement against bake-off `main` (**this** head after #33), **not** remastered base `758665e`. Implement from `docs/` only. Do **not** crib `Artemis2028/BM1-remastered-work`.
- **Remastered EW pack / DESIGN is background shapes only.** Do **not** `git am` remastered patches. Do **not** lock remastered catalog EU/s, prices, or wattages as constants.
- **No invented balance numbers as locked constants.** Effect *shape*, contest *formulas*, matrix *columns*, claim *enums*, and fire-gate *forbids* are locked. Example draws, radii, strengths, HoJ costs, forgetting penalties, self-cancellation 0.25, spin-up ~1s, cooldown ~2s are **recommendations / TBD**.
- **#33 Pass stays locked.** A PR that reopens Phase 9 six gates, regresses S14, or “fixes” ghosts-as-hulls by spawning hulls fails this brief even if RSS is green.
- **Subscribe, do not fork.** 9.1 writes call existing Phase 6 layer helpers, Phase 6.5 draw / brown-out helpers, Phase 9 `ewBook` / matrix helpers, Phase 3 `makeBroadcast`, Phase 4 `deliverReport`. Do not implement a second contact book, a second incident ledger, or a second weapons matrix.
- **§13 saved timers:** spin-up, cooldown, contest, and seeker coast use `localElapsedMs`. Do not persist `performance.now()` as a deadline.
- **No Pass claimed** in `docs/BAKEOFF-STATUS.md` from this PR.

## 3. Spend-to-suppress (gate 1)

**Lane owner (wording):** Number Four.

### 3.1 Same budget, both sides

Player jammer and NPC jammer spend the same `ew` consumer, face the same A × H multiplier, the same brown-out, and the same “no slot / S=0 → unavailable.” There is no player-only free jam.

### 3.2 Power shape (injectable numbers, not locked constants)

Let **S** be Sensors points on the landed Phase 6.5 **equipment / capability axis** (suite + `capabilityMod` / `sensorCapability` — **not** a new energy religion). Mapping of suite grade → S is **injectable / TBD**.

| Symbol | Shape | Notes |
| --- | --- | --- |
| **S** | Sensors points | **S = 0** → jammer and ECCM **unavailable**. |
| **A** | `A = 0.5 + 0.1 × S` when **S > 0** | Availability / aperture. Not a second generation pool. |
| **H** | Funded health / brown-out fraction in `[0, 1]` | Maps onto existing `powerNorm` / `applyBrownout` / `ewStarved`. Brown-out **weakens** (H → 0); it does not invent off-budget EW. |
| **f** | Jammer funding fraction in `[0, 1]` | Commanded On vs power-limited. Injectable. |
| **Draw** | catalogDraw × **A** × **H** | Billed on reserved **`ew`**. Draw 0 with effects on **fails**. |
| **Strength** | catalogStrength × **A** × **f** | Paid contribution `cᵢ` into RSS (gate 4). |
| **Radius** | catalogRadius × **√A** × **√f** | Emitter coverage. Not burn-through (gate 2 uses **B × √Q**). |
| **Spin-up** | ~1 s funded (`localElapsedMs`) | Shape only. Unfunded / S=0 does not spin. |
| **Restart cooldown** | ~2 s (`localElapsedMs`) | After Off / brown-out drop / cancel. Shape only. |

Exact watts, S tables, and milliseconds are **TBD / injectable**. Shape is locked: no effect that rewrites contacts at draw 0; no jammer that skips `ew`; no jammer that skips brown-out.

### 3.3 Dedicated EW equipment slot

Mirror the Phase 6.5 suite pattern (`slotKind: 'sensor_suite'`, `occupiesWeaponSlot: false`):

```js
{
  slotKind: 'ew_equipment',        // name can change
  occupiesWeaponSlot: false,
  occupiesSensorSuiteSlot: false,
  default: null,                   // empty by default
  maxFitted: 1,                    // one jammer, no stack
  catalogTiers: ['compact', 'tactical', 'fleet']
}
```

Forbidden:

- Fitting the jammer into `weaponSlots[0..2]`
- Replacing `sensorSuiteId` with a jammer
- Stacking two jammers for a free RSS double-dip
- Treating a science suite as a jammer (Phase 9 Q5 still: suite may **mark** ghosts / run ECCM **boost** as equipment axis, not as a second jammer)

### 3.4 Catalog shape (Compact / Tactical / Fleet)

Standing gates may apply (cite catalog wire / Phase 8 standing — do **not** invent a new prestige loop). **Prices, draws, radius, strength are injectable proposals, clearly marked TBD.** Do not copy remastered EU/s into engine constants.

| Tier | Standing gate (shape) | Slot | Stack | Notes |
| --- | --- | --- | --- | --- |
| **Compact** | Lowest / default-legal TBD | `ew_equipment` | No | Short radius, small draw. |
| **Tactical** | Mid standing TBD | `ew_equipment` | No | Mid radius / strength. |
| **Fleet** | High standing TBD | `ew_equipment` | No | Large radius / strength; still one slot. |

ECCM is **not** a second jammer SKU. ECCM Off / Boost rides the **sensor suite** (gate 1 + §5.4). Boost factor is injectable.

## 4. Receiver contest and burn-through (gates 2, 4)

**Lane owner (wording):** Number Four.

### 4.1 Contest shape

For a receiver with funded energy **E** (Sensors / aperture after A × H; **E = 0** if S=0 or brown-out dead) and jammer noise **N**:

| Piece | Shape | Locked meaning |
| --- | --- | --- |
| Falloff | Injectable range falloff on each contribution `cᵢ` | Finite field. No infinite-N cloak. |
| Self-cancellation | Own emitter contribution × ~**0.25** (injectable) | You do not fully deafen yourself. |
| RSS | `N = √Σ(cᵢ²)` over **all paid** contributions | Diminishing returns. No strongest-three. No 59.2% / 35% ceiling. |
| Quality | `Q = E / (E + N)` | **Q = 0** only if **E = 0** (unfunded). Finite N never drives Q to 0. |
| ECCM | Boost factor on **E** or on Q (injectable) | Suite control, not a free `ew` draw of 0. |
| Burn-through | **RF radius = B × √Q** | **B > 0** injectable. Funded receiver ⇒ radius **> 0**. |

### 4.2 Always available, not always strong

- **Unfunded receiver (E = 0):** no RF burn-through. Residue rules still apply if the observer already had a row (gate 3) — you do not gain a magic detect, and you do not owe a cloak-void either.
- **Funded receiver, heavy N:** Q small, radius small. ID / firm / `firingSolution` may still be blacked out at typical combat range.
- **Funded receiver, light N:** Q large, burn-through can re-earn Phase 6 layers **under Phase 6 earn rules**. Jam does not gift `firingSolution`; it only fails to hide the hull inside the RF radius.

Player-facing line (names can change):

- `Interference. Burn-through available — not a cloak. Track degraded; residue held.`

If the UI says “vanished” / “cloaked” because a jammer ticked, the family is not ready.

### 4.3 Interference labels (true-side)

Receiver presentation:

| Label | When | Must not |
| --- | --- | --- |
| **Clear** | N negligible vs E (injectable threshold) | Invent a faction from quiet noise |
| **Interference** | N material | Guess identity from the hash of N |
| **Own** | Dominant paid contributors are this observer’s own emitter (after self-cancel) | Use transponder claim |
| **Friendly** | Dominant paid contributors share **actual** `sideId` / `playerSide` / fresh own-side telemetry | Use `spoofedFaction` or hull art |
| **Mixed** | Own/friendly and foreign paid contributors both material | Collapse mixed → foreign ID |

“Fresh own-side telemetry” means a living ally whose `ew` draw is actually on this tick (serialize beside `ewBook`, keyed on `securityInstanceId`, not `npc.id`, not `systemStates`). Stale / jumped-out / brown-out-dead allies drop off the friendly sum.

## 5. Residue, ghosts, and reports (gates 3, 7)

**Lane owner (wording):** Number 2.

### 5.1 Residue row shape (gate 3)

Exact names can change:

```js
{
  contactId: 'ctc-41',
  observerKey: 'player',
  subjectKey: 'npc:security-instance-7',  // still the living hull's instance — not deleted
  detected: true,                         // or equivalent residue mark
  identification: 'none',                 // ID may black out
  trackQuality: 'area',                   // not none-and-gone
  firingSolution: false,
  ghost: false,                           // residue is not a Phase 9 ghost
  residue: true,
  source: 'ew_residue',                   // or keep prior source + residue flag
  lastKnown: { x, y, radius, atLocalMs },
  emission: true,                         // “something here”
  transponderClaim: 'off' | 'true' | { spoofedFaction },
  freshnessLocalMs: 0
}
```

Forbidden:

- `delete observer.contacts[id]` because jammer ticked
- `detected: false` + prune as the **only** jam outcome
- Copying residue onto a new `npcShips` hull
- Setting `ghost: true` on a real hull because it is jammed (ghosts stay the deceptive family)
- Granting `firingSolution` because residue exists

`seedFromReport` remains: detection + **area** track, `firingSolution === false`. Jamming after that seed may decay the **live** layers to residue; the Phase 4 report row remains (Phase 9 gate 3).

### 5.2 Ghosts stay Phase 9

Phase 9 ghost contract is **unchanged**: `ghost: true` / `source: 'ew_ghost'`, `firingSolution === false`, not a hull, not a kill. Burn-through does not turn a ghost into a living lock. Residue does not become a second ghost religion.

### 5.3 Delivered reports

Subscribe. Do not fork. Same table as Phase 9 §5: delivered rows / `knownIncidentIds` / FLASH history / Phase 5 board facts **survive**. Comms family may still delay a **new** send. Residue-before-void is about the **contact book**, not a license to rewrite the ledger.

## 6. Home-on-jam (gate 5)

**Lane owner (wording):** Number Four on the row; Number 2 on seeker / permission.

### 6.1 Matrix row first (no retune)

Add a reviewed row to `src/phase9-weapons-matrix.js` / the ten-column ledger **before** any `game_items.json` damage/cooldown/range/price edit. Proposed columns (names can change; missing a locked column fails Phase 9 gate 4):

| Column | HoJ / anti-emitter proposal (shape, not a lock) |
| --- | --- |
| **Family** | `anti-emitter` / HoJ (do not collapse disruptor Canon / Cannon / Turret) |
| **Range** | Seeker range vs emitter coverage — **not** equated to pursuit permission |
| **Arc** | Forward or dedicated mount — no silent 360° lore default |
| **Tracking** | **Emission-only.** Incarnation-lock on the emitting `securityInstanceId`. Silence→coast. Does **not** need and does **not** write hull `firingSolution` |
| **Shield interaction** | Default shields-then-hull. No universal bypass |
| **Hull / subsystem** | Physical hit on whatever hull is actually there (collateral legal). Not boarding |
| **Energy / ammunition** | **Weapons** consumer and/or finite ammo — **not** billed as hidden `ew` |
| **Counters** | Silence, cloak (no perfect silent/cloak track), leave volume, decoy emitters, ECCM |
| **Faction access** | Cite catalog wire / standing; do not rewire Reman 53 |
| **Provenance** | `new` (bake-off 9.1). Remastered HoJ flavor is background only — not a Flash price lock |

Mapping: mark **unmounted / proposed** until a later scoped catalog id exists. Do **not** auto-fill empty `weaponSlots` to host it. Do **not** invent a Flash price.

### 6.2 Seeker contract

| Rule | Meaning | Must not |
| --- | --- | --- |
| Emission-only | Guides on a **paid** `ew` field (draw > 0 after A × H) | Guide on transponder claim, ghost row, or residue-without-emission |
| Incarnation-lock | Lock the emitting `securityInstanceId` at launch | Follow ambient `npc.id` reuse after the emitter left / despawned |
| Silence→coast | When that incarnation’s paid field drops to 0, seeker **coasts** (ballistic / last heading) | Perfect track of a silent or cloaked hull |
| Private seeker knowledge | Munition knows its lock; the launch ship’s contact book does **not** inherit `firingSolution` | Gifted FS / `liveWeaponTrack` on the observer |
| Collateral | Physical hits use existing Phase 1 credit paths | New blame religion; board/capture; standing from a ghost |
| Fire gates | Launch still needs doctrine **permission** + a ready slot + energy/ammo | `engagement_authorized` from “they are jamming”; jam-alone auto-fire |

`consultDoctrineFire` already deletes `engagement_authorized`. Keep that. `liveFireFactsFromEw` / `liveFireFactsFromContact` must not start returning `engagement_authorized: true` because a HoJ seeker is in flight or because residue.emission is true.

Jam alone ≠ aggression. Interfering can be attributed (`record_only` default, same as Phase 9 Q3). It does not open fire.

## 7. Transponder claim (gate 6)

**Lane owner (wording):** Number 2.

### 7.1 Claim enum

```js
transponderClaim: 'off' | 'true' | { mode: 'spoof', spoofedFaction: 'klingon' }
```

| Claim | Book meaning | Must not |
| --- | --- | --- |
| **off** | Silent. No declared faction on the claim layer. Residue / emission may still exist | Rewrite `playerFaction` / `playerSide`. Become Phase 6 cloak. Delete the contact |
| **true** | Claims the subject’s **actual** side | Use claim as ROE side if it later mismatches (it should not, if honest) |
| **spoof** | Claims `spoofedFaction` | Rewrite ownership, Reman unlock, catalog access, or `state.playerFaction` |

Phase 1 `playerFaction` / `playerSide`, Reman **53** durable unlock, and two-mode ROE **do not read this field as identity**. Phase 3 access may **read the claim as broadcast-like evidence** (alongside `makeBroadcast`), then apply the forgetting ladder — it must not treat spoof as a successful `sideId` change.

### 7.2 Forgetting has teeth (magnitudes injectable)

| Step | Shape | Must not |
| --- | --- | --- |
| **Suspicion** | Journal / UI: claim ≠ true-side telemetry (when the observer can know) | Auto-hostile, auto-`attackId` |
| **Challenge** | Hail / checkpoint challenge (Phase 3 family) | Skip to fire |
| **Access denial** | Holding / station access refuses or holds (Phase 3 policy). `unknown` enforcement stays **stored, not newly activated as a 9.1 religion** | Treat denial as aggression |
| **Optional P4 allowlist** | `access_notice` / `access_noncompliance` (or a later scoped kind on the **same** allowlist). Default `record_only`. FLASH only if the kind is already FLASH-eligible **and** a **new** incident is opened | `engagement_authorized`, standing-from-blip, second FLASH for the same offense, `protect` → fire (S6.13 still folds) |

Penalty magnitudes (suspicion dwell, challenge timeout, standing, latinum fine) are **TBD / injectable**.

Silent ≠ cloak: a transponder-off hull that is still emitting / still in RF burn-through / still a residue is **detectable as something**. A cloaked hull still uses Phase 6 cloak truth. Do not merge the two.

## 8. Controls shape

**Lane owner (wording):** Number Four on engine; copy can wait.

Exact widget names can change. If the control cannot say **state**, **why it is limited**, and **whose noise it is**, it is not ready.

| Control | States (shape) | Notes |
| --- | --- | --- |
| **Jammer** | Off / On / Spin-up / Cooldown / Power-limited | On requires slot + S>0 + funded `ew`. Power-limited is brown-out / H<1, not a secret fourth state that still jams at full strength. |
| **ECCM** | Off / Boost via **suite** | Boost factor injectable. Unavailable at S=0. Not a second jammer. |
| **Receiver** | Clear / Interference | From contest N vs E. |
| **Interference source** | Own / Friendly / Mixed / (unlabeled foreign noise) | True-side only. Never “Romulan” from a spoof or from leftover N. |

## 9. Acceptance exercises (S15)

Keep all existing Phase 1 / S4–S14 / doctrine / catalog / side-lane gates green. **S14 stays the Phase 9 lock** — replay, do not rewrite. Add S15 fixtures that fail setup if the EW slot helper, contest/RSS helper, residue helper, HoJ matrix row, or transponder-claim helper is missing. Classification-only asserts are insufficient for “residue survived,” “radius > 0,” and “claim did not rewrite `playerFaction`.”

Number Three owns the probe gate **after** engine, not this brief. IDs are a sketch; do not promise a final count. S14.x extension numbers are acceptable if Tenth prefers not to mint S15; the **cases** below are the score.

| Case | Required exercise and result |
| --- | --- |
| **S15.1** Spend-to-suppress / brown-out | Fitted jammer On: `ew` draw **> 0** and equals catalogDraw × A × H (injected). Shared generation still includes propulsion/weapons/cloak/sensors/`ew`. Off-budget jam (effects on, draw 0) **fails**. Brown-out / H→0 **weakens** strength and draw; starved jammer does not keep full field. |
| **S15.2** Slot is dedicated | `ew_equipment` empty by default. Fitting Compact/Tactical/Fleet does **not** change `weaponSlots` or `sensorSuiteId`. Second jammer in the same slot **rejected**. Science suite is not a jammer. |
| **S15.3** S=0 unavailable | Actor with S=0 (no Sensors points / no funded suite mapping): jammer On and ECCM Boost **fail**; `ew` draw 0; no field. |
| **S15.4** Burn-through positive for funded receiver | Finite N, E>0: `Q = E/(E+N)` in (0,1], RF radius `B × √Q` **> 0**. Deep jam may still drop ID/firm/FS at a test range **outside** that radius. UI must not say cloak-void. |
| **S15.5** Unfunded receiver is the only Q=0 | E=0: radius 0. Do **not** treat this as invisibility for a *different* funded observer. |
| **S15.6** Residue row survives deep jam | Start a live known+firm+FS contact. Inject deep jam. ID / firm / `firingSolution` may black out. Row **still present** as residue / area-or-detected / emission. `npcShips` unchanged. Not `ghost: true` unless it was already a Phase 9 ghost. |
| **S15.7** Residue ≠ gifted lock | Residue stays `firingSolution === false` until burn-through + Phase 6 earn rules actually restore firm. No `liveWeaponTrack` / `combatTargetId` from residue alone. |
| **S15.8** RSS stacking | Two (or more) **paid** emitters: N = √Σ(c²), **not** max, **not** sum, **not** strongest-three, **not** a 59.2%/35% cap. A draw-0 / brown-out-dead emitter adds 0. |
| **S15.9** Self-cancellation | Own emitter contribution reduced by injectable ~0.25 shape. Own label may apply; receiver is not fully deaf. |
| **S15.10** True-side friendly labels | Two allies jamming (actual `sideId` / `playerSide` match) → own/friendly, **not** foreign ID. A spoofed transponder on one ally must **not** retarget the label. Remaining N after cancel is unlabeled noise, not an invented faction. |
| **S15.11** HoJ matrix row before retune | Ledger exposes an anti-emitter / HoJ row with all ten columns + provenance `new` (or explicit unmounted/proposed). `game_items.json` combat numbers **unchanged** vs Phase 9 baseline. Tractor / three disruptors still distinct. |
| **S15.12** HoJ silence→coast + no gifted FS / `engagement_authorized` | Launch on a paid emission (injected). Emitter silences (draw 0): seeker **coasts**, does not perfect-track a silent/cloaked hull. Launching ship’s contact `firingSolution` **not** set by launch. `engagement_authorized` absent. `mayAutoEngage` unchanged. Jam-only fixture does **not** fire. |
| **S15.13** HoJ incarnation-lock | Emitter despawn / `npc.id` reuse after silence: coast / miss, not a transfer onto the newcomer. Collateral hit (if any) uses existing player/escort credit only. |
| **S15.14** Transponder claim never rewrites Phase 1 identity | Set claim `off` / `true` / `spoofedFaction`. `playerFaction`, `playerSide`, Reman 53 unlock, ROE mode **unchanged**. Spoof does not mint a new `sideId`. |
| **S15.15** Silent ≠ cloak | Transponder off + residue/emission: still a book row (gate 3). Cloak fixture still hidden under Phase 6 rules; claim-off does not uncloak and does not cloak. |
| **S15.16** Forgetting teeth, no auto-fire | Mismatched spoof: suspicion → challenge → access denial path available. Optional P4 allowlist may open `access_notice` / `access_noncompliance` as `record_only`. **No** `engagement_authorized`, **no** `attackId`, **no** standing-from-blip-alone, **no** second FLASH (S6.14 family). |
| **S15.17** Delivered reports untouched | Replay S14.6–S14.8 under 9.1 jam + residue: report still delivered, `knownIncidentIds` still listed, no `erasedByJamming`. Live layers may be residue. |
| **S15.18** Ghosts / matrix / boarding / culture preserved | Replay S14.3–S14.5, S14.12–S14.18: ghosts not hulls; no universal bypass; tractor slot; boarding APIs absent; no culture fire. |
| **S15.19** Phase 6 / 6.5 / 9 power preserved | Replay S9.1–S9.5, S9.8, S10.1–S10.3, S10.7, S14.1, S14.19: first-frame cloak; four layers (residue is not a fifth); shared generation; `ew` still the reserved consumer. |
| **S15.20** No `git am` / no remastered watts locked | Offline/docs probe: no remastered patch applied; engine constants for draw/radius/strength/HoJ cost/forgetting penalties are injectable (override changes the snapshot; absence of a “Flash/remastered watt lock” flag). Catalog tiers exist as **shape** with TBD magnitudes. |
| **S15.21** Both sides | NPC jammer vs player observer and player jammer vs NPC observer: same draw consumer, same residue, same RSS, same true-side labels, same “claim is not identity.” |
| **S15.22** Phase 4/5/8 / catalog preserved | After 9.1 ticks: S6.4 standing once; S6.13 `protect` still folds; S6.14 no second FLASH from append; S8 overdue ≠ destroyed ≠ attacker; S11 Reman 53 / aliases; S13 markets not restocked; `meetPackPurchaseDecision` untouched. |

Each case may contain multiple assertions. Include startup smoke. Do not claim a Referee Pass from this list.

## 10. Non-goals

Phase 9.1 will not:

- `git am` the remastered EW complete patch, or treat remastered DESIGN as engine source.
- Lock remastered wattages / EU/s / prices / HoJ costs as constants.
- Reopen Phase 9’s six hard gates or regress PR #33 / S14.
- Reopen Phase 6 gates 1–8 or Phase 6.5 gates 1–5 (except continuing to use the reserved `ew` consumer **on**, as Phase 9 already did).
- Invent lobes / shared ECCM mesh / deeper spoof UI beyond the claim layer (unless a minimal On/Off/Spoof control is required to set the claim).
- Wipe, unsend, or rewrite already-delivered Phase 4/5 reports or observer copies.
- Gift `firingSolution` or `engagement_authorized` from HoJ, ghosts, residue, or a mismatched blip.
- Implement boarding, capture, scuttle, away-team XP, or fleet command transfer.
- Grant universal shield bypass, or retune weapons before a HoJ matrix row.
- Collapse pursuit, permission to engage, and the per-weapon gate.
- Treat jam alone as aggression / auto-fire, or pulse FLASH as a default jammer tick.
- Rewrite `playerFaction` / `playerSide` / Reman / catalog access from transponder spoof.
- Treat silent transponder as cloak, or residue as a Phase 9 ghost hull.
- Add a sixth power consumer, a fifth required OPS slider, or steal a weapon / suite slot.
- Strongest-three cutoff, 59.2%/35% ceilings, or “delete the contact” as the jam success condition.
- Activate Phase 3 `unknown` access enforcement as a new 9.1 religion.
- Touch `Artemis2028/BM1-remastered-work` as an implementation source.
- Claim a Referee Pass in `docs/BAKEOFF-STATUS.md`.

## 11. Implementation sequence and handoff

1. **Brief Pass.** Referee / One score the **seven** hard gates. Number 2 scores gates **3, 5 (seeker/permission), 6** and preservation wording on ghosts/reports/fire. Number Four scores gates **1, 2, 4, 5 (matrix row)** and confirms gate **7** is not a reopen / no boarding hook. Do not open an engine PR on this document alone.
2. **Tenth scopes the engine lane** after Pass. Blind implement from `docs/` against bake-off `main` after #33. Do not implement from remastered `758665e`.
3. **Suggested order if scoped:** EW slot + spend-to-suppress A × H on reserved `ew` (S15.1–S15.3) → contest RSS + Q + burn-through (S15.4–S15.5, S15.8–S15.10) → residue-before-void (S15.6–S15.7) **before** any “stronger jam” → transponder claim layer (S15.14–S15.16) → HoJ matrix row with **zero** combat retune (S15.11) → seeker silence→coast (S15.12–S15.13) → preservation (S15.17–S15.22).
4. **Number Three** adds/runs S15 after engine. Keep Phase 1 / S4–S14 / `test:catalog` green. Do not weaken S14 to make S15 pass.
5. Changelog / status Pass wait on Referee after review. This proposal PR may note that the brief is open; it must not write a Pass.

If one model implements a later slice (lobes, ECCM mesh, catalog HoJ id, deeper spoof UI), reserve a separate review pass. Fable can edit jam/journal copy after the paths work.

## 12. Open questions

Mark these clearly. They do **not** weaken the hard gates.

| ID | Question | Default if engine is scoped before an answer |
| --- | --- | --- |
| Q1 | Exact catalog draws / radii / strengths / prices for Compact / Tactical / Fleet? | **TBD / injectable.** S15.1 / S15.20 assert shape + draw > 0, not a wattage lock. |
| Q2 | How does bake-off suite grade map to Sensors points **S**? | Injectable table. **S = 0** when no funded sensors; jammer/ECCM off. Do not invent a sixth consumer. |
| Q3 | Exact self-cancellation, ECCM boost, B, falloff, spin-up ms, cooldown ms, forgetting penalties? | **TBD / injectable.** Shapes in §3–§4 and §7.2. ~0.25 / ~1 s / ~2 s are recommendations. |
| Q4 | Residue as `residue: true` vs new `source: 'ew_residue'` vs keeping `detected` + `area`? | Any is fine if probes can tell residue from void and from a Phase 9 ghost, and `firingSolution` stays false until earned. |
| Q5 | Does attributed jamming / spoof in a holding open a new Phase 4 incident? | **Optional** allowlisted kind only. Default: `record_only` / journal. No `attackId`, no auto-`engagement_authorized`, no second standing, no second FLASH. |
| Q6 | HoJ catalog id / fitted hull in the same engine PR? | **No** unless Tenth says so. Matrix row + unmounted/proposed mark is enough to close gate 5. Mapping must not auto-fill slots. |
| Q7 | Shared ECCM mesh / lobes / directional antennas? | **Later** (non-goal). Isotropic finite field is enough for RSS + burn-through. |
| Q8 | Deeper spoof UI (voice, IFF panel art)? | **Later.** On/Off/Spoof claim enum is enough. |
| Q9 | Split engine PRs (slot+contest vs residue vs HoJ row vs claim)? | Tenth decides after Pass. Gate 5 still precedes HoJ combat retune. Residue-before-void still precedes “stronger jam.” |
| Q10 | Difficulty knobs? | **Out.** Political identity stays the same. |
| Q11 | May a science suite Boost ECCM without being a jammer? | **Yes** — equipment axis only (Phase 6.5). No free EW draw of 0. Unavailable at S=0. |

## 13. Lanes

| Who | Owns | Scores |
| --- | --- | --- |
| **Number 2** | Gates **3, 6**, seeker/permission wording on **5**, and preservation of Phase 9 ghosts / delivered reports / fire gates / no `engagement_authorized` | Residue ≠ void ≠ cloak; claim ≠ Phase 1 identity; HoJ launch ≠ gifted FS / permission; jam ≠ auto-fire |
| **Number Four** | Gates **1, 2, 4**, matrix-row half of **5** (`ew` draw, A × H, slot, contest RSS + Q + burn-through, HoJ row before retune). Engine must not hook boarding or reopen #33 | Spend on reserved `ew`; radius > 0 for funded receiver; RSS all-paid; no remastered watts locked; no slot theft |
| **Number Three** | Probe gate **after** engine (S15 on `__BM1_PROBE__` / offline tests; S4–S14 stay green) | Not this brief |
| **Referee / One** | This brief vs the **seven hard gates** in §2. **Do-not-open** check: no #33 reopen, no `git am`, no Referee Pass claimed from this PR | **Before** any engine PR |

## 14. Deferred work remains on the plan

Lobes / beam patterns, shared ECCM mesh, deeper spoof UI, a fitted HoJ catalog id, empty-but-armable persistence, boarding/capture, construction visuals, HTML review catalogs, and difficulty knobs stay on the convergence backlog. Independently addressable deep-space locations remain the plan §8 later add. Activating `unknown` access still waits on a later scoped slice. A **weapon overhaul** still waits on the reviewed Phase 9 matrix **plus** the HoJ row in this brief **plus** a later Tenth-scoped retune.

Phase 9.1 is ready to score when a reader can mark Pass/Fail on all seven gates: spend-to-suppress on reserved `ew` with a dedicated slot; burn-through always available for a funded receiver; residue-before-void; RSS all-paid + true-side labels; HoJ matrix row before retune with silence→coast and no gifted FS/permission; transponder claim never rewrites Phase 1 identity; Phase 9 / #33 / delivered reports / ghosts / boarding-out preserved — while magnitudes stay injectable and remastered patches stay unapplied.

## Sources and precedence

- This amend’s engine checklist: `docs/phase9/BM1-PHASE9.1-ENGINE-DEPENDENCIES.md`.
- Phase 9 locked baseline (do not reopen): `docs/phase9/BM1-PHASE9-EW-WEAPONS-PROPOSAL.md`; `docs/phase9/BM1-PHASE9-ENGINE-DEPENDENCIES.md`; `src/phase9-ew.js`; `src/phase9-weapons-matrix.js`; PR #33 (`2b38a14`); S14.
- Plan §4 Phase 9 exit and §11 EW and weapons: `docs/revised-development-plan.md`.
- Phase 6 layers / contact book / `seedFromReport`: `docs/phase6/BM1-PHASE6-SENSORS-CLOAK-SYSTEM-SPACE-PROPOSAL.md`; `src/phase6-sensors.js`; PR #24; S9.
- Phase 6.5 reserved EW consumer, suites, brown-out: `docs/phase6/BM1-PHASE6.5-POWER-SENSORS-SUITES-PROPOSAL.md`; `src/phase65-power.js` (`POWER_CONSUMERS`, `reservedEwDraw`, `EW_EFFECTS_IMPLEMENTED`, `applyBrownout`, `installSensorSuite`); PR #27; S10.7.
- Phase 4 reports / FLASH / tokens / allowlist: `docs/phase4/`; `src/phase4-incidents.js` (`deliverReport`, `observerKnowsIncident`, `INCIDENT_KINDS`, `ACTING_ALLOWLIST`); PR #13; S6.
- Phase 5 delivered knowledge / overdue ≠ destroyed ≠ attacker: `docs/phase5/`; `src/phase5-objectives.js`; PR #21; S8.
- Phase 3 broadcast / access: `src/phase3-checkpoints.js` `makeBroadcast` (`hull` / `declared` / `none`); unknown stored, not enforced.
- Fire gates / no `engagement_authorized`: Phase 1; `src/doctrine.js` `deriveLiveFireFacts`; `consultDoctrineFire` in `src/main.js`.
- Phase 1 identity: `state.playerFaction` / `state.playerSide`; Reman **53** via catalog wire + side-lane unlock — not a transponder field.
- Remastered EW pack / DESIGN: **background shapes only**. Not a patch source. Not a constant lock. Not `758665e`.
- Bake-off process: `docs/BAKEOFF-STATUS.md` (this PR may note the 9.1 brief is open; no Pass claimed; #33 remains the locked Phase 9 engine baseline).

Settled Phase 1–9 behavior, Phase 9’s six gates, PR #33, and these seven Phase 9.1 gates take precedence over older handoff text that treated jamming as cloak-void, strongest-three ceilings, transponder-as-identity, remastered watts as live locks, or HoJ as a gifted firing solution.
