# BM1 Phase 6.5 — Power budget, passive/active sensors, upgradeable suites

**Status:** proposal for implementation; no engine changes made by this document.  
**Repository:** `Artemis2028/BM1-bakeoff`  
**Planning baseline:** `bcb4a9a` on `main` (13 September 2026), after Phase 6 engine (PR #24) and content hull-merges / full-roster-v2 (PR #25).  
**Referee context:** Phase 4 engine §6 **Pass** on `7f926df`. Phase 6 brief (PR #22) + engine (PR #24) have **no Referee Pass claimed** on this bake-off status MD. This brief does **not** claim a new Referee Pass and does **not** reopen Phase 6 gates 1–8.  
**Companion:** `docs/phase6/BM1-PHASE6.5-ENGINE-DEPENDENCIES.md` (hooks, risks, probe plan).  
**Amends:** `docs/phase6/BM1-PHASE6-SENSORS-CLOAK-SYSTEM-SPACE-PROPOSAL.md` (pointer only — gates stay closed).  
**Scoped by:** Tenth Mountain Trooper, 2026-09-13 — proposal first; no engine until Tenth scopes after a brief Pass.

Phase 6 already landed honest contact knowledge: four info layers, first-frame cloak, hidden stays hidden on both sides, lost tracks drop exact targeting on the same tick, role/equipment/age/power/damage variance, and active scans that are useful and detectable. Purposeful destinations and arrival/spacing/exit stay closed with those gates.

This is the **missing budget and equipment layer** so those sensors have somewhere to live: **hull base power generation**, **passive vs active draw**, and **upgradeable sensor suites**. It is not a rewrite of Phase 6, not Phase 9 EW, not a weapon-matrix pass, and not catalog wire.

## 1. The result we want

Ship **power budget + passive/active sensors + upgradeable sensor suites** so hulls stay unique with **real tradeoffs**, including scout-freighter builds.

Plan §8 already required sensors to vary by role, equipment, age, power and damage, and required active scans to be useful but detectable. Phase 6 implemented the **layers and variance axes**. It did **not** author a per-hull generation budget, did **not** make passive and active different consumers, and did **not** make the suite swappable equipment. Without those, every hull can drift toward “best at everything” and a cargo hull cannot honestly take scout duty.

**Exit condition:** a reader can mark Pass/Fail on the **five locks** in §2, and every Phase 6 hard gate (PR #22 / engine PR #24) still holds.

**Proposed first-release decisions:**

| Question | Proposed answer |
| --- | --- |
| What is the first playable slice? | Authored **base power generation** per hull (reactor upgrades later OK); a single shared budget consumed by propulsion, weapons, cloak, sensors, and a reserved EW slot; **passive** vs **active** as different draws and detectability; **sensor suites as equipment** that a cargo hull can fit for scout duty and **pay** in cargo / power / speed / detectability. |
| Where do the fields live? | Propose injectable fields on the **172 active** PR #25 roster (`bm-ships/ships.json`) plus a small suite catalog. **Do not** invent balance numbers in this brief. **Do not** wire the catalog. |
| Does this reopen Phase 6? | **No.** Detection ≠ identification ≠ track ≠ `firingSolution`. Old report ≠ live lock. Hidden stays hidden. Same-tick UI+AI on lost track. Passive/active still cannot invent ID or a firing solution. |
| Fifth OPS slider? | **Not required.** Hull **generation** is the new authored field. Existing four OPS tanks (reserve / engines / weapons / shields) remain distribution of available energy. Sensors and later EW **draw from the same generated pool**. A dedicated sensors slider stays optional / TBD. |
| Catalog wire / 172 live yards? | **Out.** Content roster 172 is the **field baseline**, not permission to `loadShipCatalog()`. |
| Phase 9 EW in this slice? | **Out** as a suite (jamming, ghosts, fire-control, comms disruption). EW **must** sit on this same power budget when it arrives. Reserve the consumer; do not implement the effects. |
| Reman 53 / hull aliases? | **Unchanged.** Hull **53 / `bm-ship:53`** stays the durable-unlock Reman warbird. The 38 old→survivor aliases from PR #25 stay the alias map. |

These are recommendations for this phase, not new decisions attributed to the user. Locked Phase 6 gates and the five locks below take precedence over older flavor that treated scans as free hail text or hull size as the whole sensor model.

## 2. Locked constraints (do not reopen)

The bake-off team locked these before this brief. Implementation and probes must treat them as **hard gates**. Referee / One score this brief against these **five locks** **before** any engine PR.

Phase 6 gates 1–8 stay **closed**. This section does not replace them.

### Hard gate 1 — Base power generation

> Every hull has an authored **base power generation** (reactor upgrades later may raise it). That generation is the budget for **propulsion, weapons, cloak, sensors, and EW**.

Mass-derived `getPowerMaxEnergy()` (100 + mass × 25) is **not** the authored generation field. A later reactor upgrade may add to base generation; it must not invent a second energy religion. Overdraw is a real constraint: something brown-outs (sensors shrink, cloak collapses, weapons starve, or propulsion fades — exact order **TBD**, not a locked formula).

### Hard gate 2 — Passive vs active

> **Passive** sensors are quieter and weaker. **Active** sensors are stronger and **detectable**. They have **different power draw**.

Phase 6 gate 6 stays: active scans are useful and detectable. This lock adds the **budget**: passive is the low-draw default; active costs more generation and writes the existing scan emission. Passive must not become a silent omniscient dump. Active must not become free.

### Hard gate 3 — Upgradeable sensor suites

> Sensor suites are **equipment**, not only hull-fixed variance. A **cargo hull can fit a high-end suite** for scout duty and **pays** in cargo and/or power and/or speed and/or detectability.

Phase 6 gate 5 stays: capability is still role + equipment + age + power + damage. This lock makes **equipment** a real install/swap, not a name-contains-`'science'` inference. Default suite may follow hull role; it must be replaceable.

### Hard gate 4 — Role-curve tradeoffs

> No dominated “best at everything” hull. Role curves stay distinct: **tank / haul / scout / gun**.

A tank is not also the best scout. A hauler that mounts a science suite becomes a **scout-freighter**: better sensors, worse hold and/or power headroom and/or cruise and/or quieter profile. Ordering fixtures beat invented stat tables.

### Hard gate 5 — EW later, same budget

> Phase 9 EW sits on **this same power budget**. This slice does **not** implement EW.

Reserve a consumer named `ew` (name can change). Do not implement jamming, deceptive contacts, fire-control interference, or communications disruption. Do not invert Phase 6/9 notes: an already-delivered report is not erased by later jamming.

### Must not break (cite Phase 6 and content locks)

Score these as **preservation**. A 6.5 Pass that regresses them is a Fail.

| Locked rule | Cite | 6.5 must not |
| --- | --- | --- |
| Detection ≠ identification ≠ track quality ≠ `firingSolution`. An old report is not a live lock. | Phase 6 hard gate 2 (PR #22); engine PR #24 | Raise layers from power or a suite install alone. Seed `firingSolution` from a Phase 4/5 `lastKnown`. |
| Hidden stays hidden on **both** sides. Lost tracks drop exact targeting on the **same tick** (UI + AI). | Phase 6 gates 3–4; S9.3 / S9.4 / S9.5 | Leak a cloaked hull because a suite is fitted. Keep `combatTargetId` / `liveWeaponTrack` after `firingSolution` drops. |
| Passive / active **never invent** identification or `firingSolution`. Never inject `engagement_authorized` or culture fire. | Phase 6 gates 2 / 6; Phase 1 / doctrine; S9.2 / S9.8 / S9.12 | Treat a suite grade as a fire gate. Pulse FLASH as a scan offense. Let culture or a science role authorize weapons. |
| Reman **53 / `bm-ship:53`** durable unlock unchanged. | Side-lane PR #18; content PR #25; `GUIDED-CONVERGENCE.md` §7 | Merge 53, add a second Reman id, or replace durable unlock with Remus-only access. |
| Hull aliases from PR #25 unchanged. | `docs/APPROVED-HULL-MERGES.md`; `bm-ships/ships.json` `aliases`; `integration-rules.json` `hullAliases` (38 pairs) | Resurrect discarded IDs as extra hulls or rewrite the alias map. |
| Content roster **172 active** (plus two retired) is the hull baseline for power/sensor **fields**. | PR #25; `docs/ship-balance/FULL-ROSTER.md` | Invent per-hull balance numbers in this brief, or treat 172 as live catalog wire. |

Also preserve, without reopening:

- Plan §1: player and NPC sensors follow the **same information rules**.
- Authority is a political side, not a flown flag.
- Two ROE modes unchanged. Phase 3 `unknown` access stays stored, not silently enforced.
- Phase 1 combat credit: only `player` / `playerEscort` final hits reward or blame.
- Phase 4 `protect` fold (S6.13), FLASH append-only (S6.14), and punishment tokens stay closed.
- Phase 5 close-once / overdue ≠ destroyed ≠ attacker stay closed.
- Phase 6 first-frame cloak, purposeful destinations, and arrival/spacing/exit stay closed.
- Soft authored breakaway profiles stay **out**.

### Process locks (implementation locks, not a change to the five gates)

- **Proposal first.** Do not implement from this text until Tenth scopes the engine lane after a brief Pass.
- **Blind bake-off.** Implement from `docs/` only. Do not crib `Artemis2028/BM1-remastered-work`.
- **No invented balance numbers** as locked constants. Field *shape* and role-curve *ordering* are locked; example ids in §7 are labels, not stats.
- **Extend S9; do not rewrite it.** New probes are **S10.x** (or S9.13+ if a writer prefers one series). S9.1–S9.12 stay green.
- **§13 saved timers:** any new power / suite / scan-draw clocks use `localElapsedMs`. Do not persist `performance.now()` as a deadline.
- **No Pass claimed** in `docs/BAKEOFF-STATUS.md` from this PR.

## 3. Base power generation

**Lane owner (wording):** Number Four (gate 1).

### 3.1 What generation is

Simulation truth on the hull (or the fitted reactor, later): how much power this ship **makes**. Visibility of that number in UI is optional for first slice; the **constraint** is not optional.

Consumers that share the pool:

| Consumer | Already in engine (do not reinvent) | 6.5 addition |
| --- | --- | --- |
| **Propulsion** | OPS `engines` factor; impulse/turn already exist | Draw scales with commanded motion against **generation**, not mass alone |
| **Weapons** | OPS `weapons`; `consumeWeaponEnergy` | Same pool; overdraw can starve fire **without** inventing a fire-permission |
| **Cloak** | `updatePowerSystems` already drains cloak; low energy drops cloak | Drain is a budget line, same generation |
| **Sensors** | Phase 6 `powerNorm` shrinks reach/quality | **Passive** and **active** are different lines (gate 2) |
| **EW** | None | **Reserved consumer only** (gate 5). No effects. |

### 3.2 Proposed field shape (injectable / TBD)

Exact names can change in review. **Values stay TBD** unless a later content pass injects them.

```js
// on each of 172 active hulls — propose, do not fill
{
  basePowerGeneration: null, // TBD number; null = injectable / engine default until content lands
  reactorUpgrade: null       // later; must add to base, not replace the budget religion
}
```

Do not treat current `getPowerMaxEnergy()` or `fuelCapacity` as this field. Fuel / antimatter / warp range stay travel stats (PR #25). Generation is the **tactical energy budget**.

### 3.3 Player-facing reasons

- `Reactor output sets the budget. Sensors, cloak, and guns share it.`
- `Power failure: active sensors dropped to passive.`
- `No reserve. Cloak collapsed. Track quality fell with it.`

If two hulls with different authored generation and the same suite/role have identical sensor + cloak + weapon endurance in a fixture, the gate is not ready.

## 4. Passive vs active (budget + detectability)

**Lane owner (wording):** Number Four (gate 2), Number 2 on “never invent a layer.”

Phase 6 already defined the information contract. This section only adds **cost**.

### 4.1 Passive

- Default mode while the observer is not performing an active scan.
- Weaker reach / identification / track quality than that observer’s active mode (same suite, same damage, same generation headroom).
- Lower draw. Does **not** write a scan emission.
- May miss a contact that active would raise. That miss is honest.

### 4.2 Active

- Stronger than that observer’s passive (useful — Phase 6 gate 6).
- Higher draw from the same generation budget.
- Detectable: existing `scanEmission` / `noticeScanEmission` path. Other observers who detect the scanner or the emission know a scan happened.
- Still cannot invent identification or `firingSolution` beyond what sensors earn. Cloaked targets may remain empty-useful.

### 4.3 What a mode change is not

| Must not | Why |
| --- | --- |
| Grant `identification: 'known'` because the suite is expensive | Layers are earned (Phase 6 gate 2) |
| Set `firingSolution: true` from “we painted them once” after the track ages | Lost track still drops lock (Phase 6 gate 4, S9.5) |
| Inject `engagement_authorized` or culture fire | Doctrine / Phase 1 still closed |
| Pulse FLASH as a new offense | Phase 6 Q6: detectable to sensors, not a new offense |
| Dump `buildShipScanReport` flavor as cargo ID | Phase 4/5/6 non-goal stays closed |

### 4.4 Player-facing reasons

- `Passive: low draw, weak picture. Active: stronger picture, they can see the paint.`
- `Active scan aborted — reactor cannot feed the suite.`
- `Emission detected. They know they were painted.`

## 5. Upgradeable sensor suites

**Lane owner (wording):** Number Four (gate 3), Number 2 on scout-freighter wording.

### 5.1 Equipment, not hull paint

A suite is a fitted item (device / system row). Hull role may supply a **default** suite. The player (and, when authored, an NPC) may install a different suite.

A **Kingston / Deforest / Tarellian / Isaac** style hauler can take scout duty by fitting a high-end suite. That is the scout-freighter build. It is legal. It is **not free**.

### 5.2 Payment axes (at least one must move)

When a haul-curve hull fits a scout-grade suite, **at least one** of these gets worse than the same hull on its default suite:

| Payment | Meaning |
| --- | --- |
| **Cargo** | Hold shrinks (mass/volume of the suite) or reserved cargo is blocked while fitted |
| **Power** | Idle + active draw rise; less headroom for cloak / weapons / propulsion |
| **Speed** | Cruise / handling penalty while the suite is fitted |
| **Detectability** | The ship is easier to detect (especially while active), even if it sees farther |

Do not invent the magnitudes. Probes assert **ordering**: default-haul vs scout-fitted-haul.

### 5.3 Proposed suite shape (injectable / TBD)

```js
{
  suiteId: 'suite:example', // label only; not a locked catalog
  grade: 'baseline',        // baseline | survey | science | ...  (names TBD)
  passiveDraw: null,        // TBD
  activeDraw: null,         // TBD
  // mods feed Phase 6 sensorCapability axes only — they do not write layers
  capabilityMod: null,      // TBD; equipment axis, not a fire gate
  detectabilityMod: null,   // TBD
  cargoCost: null,          // TBD
  speedCost: null           // TBD
}
```

Keep **simulation truth** on the hull (generation, damage, cloak). Keep **observer evidence** on the Phase 6 contact book. Installing a suite does not identify anyone and does not grant a lock.

### 5.4 Slot / inventory note

Convergence still has **three** combat/device slots and a later flags/passes inventory. First slice may:

- occupy one of the three slots as a **device**, or
- use a dedicated suite slot if Tenth later prefers not to spend a weapon hardpoint,

but must **not** auto-fill an empty weapon slot with a suite, and must **not** treat a suite as a fourth mystery combat mount. Exact slot home is **TBD** (see §14 Q3). The lock is “equipment you can fit and pay for,” not a new gun.

### 5.5 Player-facing reasons

- `Science suite fitted. Hold reduced. Active draw up. You can scout; you cannot haul as before.`
- `Baseline suite. Cheap on power. Weak picture.`
- `Suite damaged. Variance fell on the equipment axis. Layers still have to be earned.`

## 6. Role curves (no dominated hull)

**Lane owner (wording):** Number Four (gate 4), Number 2 on “no best-at-everything.”

PR #25 already rejected cheaper hulls that match or beat another on hull, shields, cargo, mass, impulse/turn, range, reserve, fitted damage, and devices (`docs/ship-balance/BALANCE-REVIEW.md`). Phase 6.5 extends that idea to **sensors + power**, still without inventing numbers.

| Curve | Should be good at | Must not also win |
| --- | --- | --- |
| **Tank** | Durability / staying power | Best scout picture **and** best hold **and** best gun endurance |
| **Haul** | Cargo / range-as-freighter | Best detection/ID **unless** a paid suite makes it a scout-freighter (and then hold/power/speed/detectability pay) |
| **Scout** | Sensors / speed / quiet passive | Best hold **and** best armor **and** best broadside |
| **Gun** | Weapons endurance / punch | Best passive stealth **and** best cargo **and** best science picture |

Fixtures, not a spreadsheet, prove the curves. Use existing roster **roles as labels** (examples only): Venture / Romulan Scout / Nova Surveyor as scout-ish; Kingston / Deforest / Isaac as haul-ish; Defiant / Vor'cha as gun-ish; heavier capitals as tank-ish. Those names are **not** a balance lock and **not** catalog wire.

## 7. Content baseline (172) — fields only

**Lane owner (wording):** Number 2 (roster identity), Number Four on field names.

### 7.1 What PR #25 locked (do not touch)

- **172 active** hulls, two retired (`#26`, `#63`).
- **38** old→survivor aliases (table in `docs/APPROVED-HULL-MERGES.md`).
- Reman **53 / `bm-ship:53`**: not a merge; durable unlock + later `meetPackPurchaseDecision`; pack may tag `specialVendor: remus-secret` without making Remus the sole key.
- Artwork, crop rectangles, factions, display sizes, five retained variant pairs.

### 7.2 What this brief may propose

Injectable keys on each active record, values **TBD** / omitted until a content pass:

| Field | Purpose |
| --- | --- |
| `basePowerGeneration` | Gate 1 |
| `defaultSensorSuiteId` | Gate 3 default fit |
| (suite catalog rows) | `passiveDraw`, `activeDraw`, payment axes |

A writer may ship the keys as `null` / absent and inject fixture values in probes. Filling 172 numbers in this PR is a **Fail**.

### 7.3 What this brief must not do

- Wire `loadShipCatalog()` or replace the live 66-hull path.
- Rewrite aliases or Reman access.
- Assign sensor stats from hull mass/class alone (Phase 6 gate 5 still closed).
- Claim the 212-hull figure from older deps docs; the content baseline is **172 active**.

## 8. Acceptance exercises (S10)

Keep all existing Phase 1 / S4 / S5 / S6 / S7 / S8 / **S9** / doctrine gates green. S10 **extends** S9; it does not replace S9.1–S9.12.

Number Three owns the probe gate **after** engine, not this brief. IDs are a sketch; do not promise a final count. A writer who prefers one series may number these **S9.13–S9.20** instead; the exercises stay the same.

| Case | Required exercise and result |
| --- | --- |
| **S10.1** Base generation is a budget | Two fixtures, same suite and role, different `basePowerGeneration` (injected). The higher-generation hull sustains cloak and/or active scan longer, or keeps better `powerNorm` under the same load. Mass-only `getPowerMaxEnergy()` must not be the only difference. |
| **S10.2** Passive vs active draw | Same observer: passive draw < active draw. Passive does not write an emission. Active is useful **or** honestly empty, and a second observer records the emission (S9.8 still true). |
| **S10.3** Active cannot invent layers | Active scan does not set `identification` or `firingSolution` beyond what Phase 6 earn rules allow. Report-seeded contacts stay `firingSolution === false`. No `engagement_authorized`. |
| **S10.4** Suite is equipment | Swap default → high-end suite on a **cargo** hull (injected). Sensor capability rises on the equipment axis. At least one of cargo / power headroom / speed / detectability gets worse. |
| **S10.5** Scout-freighter is paid | Haul hull + science suite vs same hull + baseline suite vs a dedicated scout. The fitted hauler can outperform its own baseline sensors and is **not** free vs the dedicated scout on hold+power+speed+quiet. |
| **S10.6** No dominated curve | Injected tank / haul / scout / gun quartet. No hull is first on durability **and** hold **and** sensor score **and** weapons endurance. Ordering only; no magic constants. |
| **S10.7** EW reserved, not implemented | Power snapshot exposes an `ew` (or named) consumer on the same budget. No jamming, ghosts, fire-control interference, or comms disruption APIs that change contacts. |
| **S10.8** Phase 6 preservation | Repeat S9.1–S9.5, S9.7–S9.8, S9.11–S9.12 (or equivalent). First-frame cloak; four layers; hidden both sides; same-tick lock drop; science-can-beat-ordinary still true; `unknown` still unenforced. |
| **S10.9** Reman 53 + aliases | Hull 53 still `bm-ship:53`, not an alias survivor, durable unlock path unchanged. A discarded alias id (example: `304 → 2`) still resolves to the survivor and does not mint a 173rd active hull. |
| **S10.10** No catalog wire / no invented roster | Ordinary traffic/markets still do not require `loadShipCatalog()`. Probe injects fields; it does not claim 172 live yard rows. |

Each case may contain multiple assertions. Include startup smoke. Do not claim a Referee Pass from this list.

## 9. Non-goals

Phase 6.5 will not:

- Reopen or rewrite Phase 6 gates 1–8 (first-frame cloak; four layers; hidden UI/AI; lost-track drop; variance axes; useful+detectable scans; purposeful destinations; arrival/spacing/exit).
- Implement Phase 9 EW (jamming, deceptive contacts, fire-control interference, communications disruption) or the Phase 9 weapon matrix.
- Wire the `bm-ships/` catalog or ship authored breakaway doctrine profiles.
- Invent per-hull generation or suite **numbers** as locked constants.
- Change Reman 53 access or the 38 PR #25 aliases.
- Activate Phase 3 `unknown` access enforcement, or infer nationality from hull art.
- Treat `buildShipScanReport` flavor as a real cargo inventory.
- Inject `engagement_authorized` or allow culture to grant fire.
- Gift the fleet a firing solution from a flagship suite.
- Persist power / suite / scan deadlines on `performance.now()`.
- Require a fifth OPS tank as the only legal design.
- Stretch empty `SYSTEM_W` / `SYSTEM_H`, add deep-space addresses, or retune unrest.
- Touch `Artemis2028/BM1-remastered-work`.
- Claim a Referee Pass in `docs/BAKEOFF-STATUS.md`.

## 10. Implementation sequence and handoff

1. **Brief Pass.** Referee / One score the **five** hard gates. Number Four scores gates 1, 2, 4, 5 wording (generation budget; passive/active draw; role curves; reserved EW consumer). Number 2 scores gate 3 (suite as equipment; scout-freighter payment) and the preservation table (layers; hidden; no invented ID/FS; Reman 53; aliases; 172 fields-only). Do not open an engine PR on this document alone.
2. **Tenth scopes the engine lane** after Pass. Blind implement from `docs/` only.
3. **Suggested order if scoped:** injectable generation + consumer snapshot (S10.1, S10.7) → passive/active draw on the existing Phase 6 scan path (S10.2, S10.3) → suite as swappable equipment with payment axes (S10.4, S10.5) → role-curve fixtures (S10.6) → Reman/alias/catalog-wire regression (S10.9, S10.10) → Phase 6 S9 replay (S10.8).
4. **Number Three** adds/runs S10 after engine. Keep Phase 1 / S4–S9 green.
5. Changelog / status Pass wait on Referee after review. This proposal PR may note that the brief is open; it must not write a Pass.

If one model implements a later slice, reserve a separate review pass. Fable can edit reactor/suite copy after the paths work.

## 11. Open questions

Mark these clearly. They do **not** weaken the hard gates.

| ID | Question | Default if engine is scoped before an answer |
| --- | --- | --- |
| Q1 | Exact generation units / suite draw numbers? | **TBD / injectable.** S10 asserts ordering, not a constant. |
| Q2 | Overdraw brown-out order? | Sensors lose active first, then cloak, then weapons, then propulsion — **recommendation only**. |
| Q3 | Does a suite occupy one of the three combat/device slots? | **TBD.** Must not auto-fill empty weapon slots. Dedicated suite slot is allowed. |
| Q4 | Fifth OPS slider for sensors? | **Not required** for first slice. Generation + draw is enough. |
| Q5 | NPC generation / suite on ambient traffic? | Same information rules. Inject on fixtures; do not wait for catalog wire. |
| Q6 | Reactor upgrade item? | **Later.** Field may exist as `null`. Must add to base generation when scoped. |
| Q7 | Does fitting a suite FLASH or change standing? | **No.** |
| Q8 | May a suite grant cloak-pierce by itself? | Only through Phase 6 `sensorCapability` axes (science + power + damage). No new pierce flag that skips those axes. |
| Q9 | Split engine PRs (budget vs suites)? | Tenth decides after Pass. Gates stay separable. |
| Q10 | Fill 172 rows in the same engine PR? | **No.** Keys + fixtures first. Content numbers are a later injectable pass. |

## 12. Lanes

| Who | Owns | Scores |
| --- | --- | --- |
| **Number Four** | Gates **1, 2, 4, 5** wording (authored generation; passive/active draw; role curves; EW reserved on the same pool) | Budget is real; active costs more and stays detectable; no dominated hull; no EW effects |
| **Number 2** | Gate **3** + preservation table (suite as equipment; scout-freighter payment; layers; hidden; no invented ID/FS; Reman 53; aliases; 172 fields-only) | Cargo hull can scout and pays; Phase 6 book rules unchanged; 53 and aliases untouched |
| **Number Three** | Probe gate **after** engine (S10 on `__BM1_PROBE__` / offline tests; S9 stays green) | Not this brief |
| **Referee / One** | This brief vs the **five hard gates** in §2 | **Before** any engine PR |

## 13. Deferred work remains on the plan

Phase 7 should persist richer fleet orders (hold outside a boundary). Phase 8 should take finite markets. Phase 9 should take EW **on this budget** and the weapon matrix. Catalog wire remains a separate Agreed-next package (`GUIDED-CONVERGENCE.md` §7). Independently addressable deep-space locations remain the plan §8 later add.

Phase 6.5 is ready to score when a reader can mark Pass/Fail on all five locks: base generation as a shared budget; passive quieter/weaker vs active stronger/detectable with different draw; suites as paid equipment (including scout-freighter); role curves with no dominated hull; EW reserved on the same pool and not implemented — while every Phase 6 gate still holds.

## Sources and precedence

- Plan §4 Phase 6 exit, §8 sensor variance / active scans, §11 EW later: `docs/revised-development-plan.md`.
- Plan §1 same information rules for player and NPC sensors / communications / weapon gates.
- Phase 6 brief (do not reopen): `docs/phase6/BM1-PHASE6-SENSORS-CLOAK-SYSTEM-SPACE-PROPOSAL.md` (PR #22).
- Phase 6 engine from that brief: PR #24 (`src/phase6-sensors.js`, S9.1–S9.12). **No Referee Pass claimed.**
- Content roster 172 + aliases + Reman 53: PR #25; `docs/APPROVED-HULL-MERGES.md`; `docs/ship-balance/BALANCE-REVIEW.md`; `docs/GUIDED-CONVERGENCE.md` §7.
- Side-lane Reman durable unlock: `docs/side-lane-repair-reman-independence/`; PR #18.
- Bake-off process: `docs/BAKEOFF-STATUS.md` (this PR may note the brief is open; no Pass claimed).

Settled Phase 1–6 behavior, the side-lane Reman lock, and the PR #25 roster identity take precedence over older flavor that treated power as mass-only, suites as hull names, or EW as a free sensor rewrite.
