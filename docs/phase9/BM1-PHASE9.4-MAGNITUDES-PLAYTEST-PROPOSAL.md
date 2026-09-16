# BM1 Phase 9.4 — EW magnitudes playtest ledger

**Status:** proposal for implementation; no engine changes made by this document.  
**Repository:** `Artemis2028/BM1-bakeoff`  
**Planning baseline:** `b67f454` on `main` (16 September 2026), after Phase 9.3 scan-poison + DF assist engine (PR #43).  
**Referee context:** Phase 4 engine §6 **Pass** on `7f926df`. Phase 9 engine (PR #33), Phase 9.1 engine (PR #35), Phase 9.2 engine (PR #37), Phase 9.3 brief (PR #42), and Phase 9.3 engine (PR #43) are the **locked** EW/weapons baselines — **Keep #33, #35, #37, #42, and #43 locked.** Boarding (PR #38 / #39) and Phase 10 (PR #40 / #41) stay **closed**. This is a **magnitudes / playtest amend only**, not a new EW family, not a reopen of Phase 9–9.3 behavioral gates, and **not** a claim that Phase 9–9.3 already had a Referee Pass on the status MD. This brief does **not** claim a new Referee Pass.  
**Companion:** `docs/phase9/BM1-PHASE9.4-ENGINE-DEPENDENCIES.md` (hooks, risks, probe plan).  
**Scoped by:** Tenth Mountain Trooper, 2026-09-16 — proposal first; no engine until Tenth scopes after a brief Pass.

Phases 1–10 already landed, including Phase 9–9.3 EW (reserved `ew`, ghosts book-only, spend-to-suppress, burn-through, residue, RSS/lobes, claim, HoJ, poison≠wipe, DF≠FS) and injectable per-slice magnitude helpers. Those helpers are **split**: family draws, catalog tiers, 9.1 clocks, 9.2 lobes/heat/share, and 9.3 poison/DF each resolve on their own path. Phase 9.3 **locked poison + DF**. It did **not** lock a **central** playtest ledger whose inject is live across that whole book.

This is **one** thin amend: publish a **single injectable playtest ledger** covering draws / radii / strength / heat / poison+DF costs / lobe half-angle / ECCM share ranges **already referenced** in 9.1–9.3, keep every number overridable and TBD/soft, and require that **override changes the snapshot**. It is not a remastered `git am`, not a sixth consumer, not a new EW family, not a weapon retune, and not permission to certify “final” balance.

## 1. The result we want

Playtest can **name one ledger**, **inject a number**, and **see that number on the probe snapshot** (and on the live resolve path that snapshot claims). Soft watts stay soft. Fire / identity / residue / poison / DF **rules** do not move because a draw changed.

**Exit condition:** the five hard gates in §2 are scoreable; gate 6 stays a **soft** process lock; Phase 9–9.3 / #33 / #35 / #37 / #42 / #43 stay closed; boarding / Phase 10 stay closed.

**Proposed first-release decisions:**

| Question | Proposed answer |
| --- | --- |
| What is the first playable slice? | One **central injectable playtest ledger** for 9–9.3 magnitudes already in docs/engine. Override must change the snapshot. Screenshot / no-clip continues later **only if** the engine adds a ledger readout. |
| May we lock remastered EU/s / prices / wattages? | **No.** §3 republishes **starting playtest defaults** — TBD/soft, never remastered constants. |
| May we `git am` remastered patches? | **No.** `MAGNITUDES_LOCKED_FROM_REMASTERED === false` stays false. |
| May changing a draw gift FS, wipe reports, or invent identity? | **No.** Soft numbers ≠ new fire / identity rules. |
| May we add new EW families? | **No.** |
| May we reopen #33 / #35 / #37 / #42 / #43, boarding, or Phase 10? | **No.** |
| Is dockClear polish or weapon retune in scope? | **No.** |
| Is this “final” balance certification? | **No.** Playtest ledger only. |

These are recommendations for this amend, not new decisions attributed to the user. Locked bake-off constraints take precedence over older flavor that treated remastered watts as live locks or a number change as a new EW religion.

## 2. Locked constraints (do not reopen)

The bake-off room locked these before this brief. Implementation and probes must treat **gates 1–5** as **hard gates**. Referee / One score this brief against those **five** **before** any engine PR. Gate 6 is **soft**. Phase 9’s six gates, 9.1’s seven, 9.2’s eight, and 9.3’s eight stay **closed**; they are restated only as **gate 4** (preserve), not as a reopen.

### Hard gate 1 — Injectables only

> Every magnitude in the §3 ledger is **overridable**. No remastered EU/s, prices, or wattages locked as constants. Effect *shape* from Phase 9–9.3 stays locked. Starting defaults are **playtest / TBD / soft**.

Lane owner (wording): **Number Four**.

Phase 9 / 9.1 / 9.2 / 9.3 already inject via `resolveEwMagnitudes` / `resolvePhase91Defaults` / `resolvePhase92Defaults` / `resolvePhase93Defaults` / `EW_EQUIPMENT_CATALOG` placeholders. This amend **centralizes** that book. A later remaster is a different scoped lane.

### Hard gate 2 — `MAGNITUDES_LOCKED_FROM_REMASTERED === false`; no `git am`

> The remastered-lock flag **stays false** on every EW / boarding / Phase 10 module that already exports it. Do **not** `git am` remastered patches. Do **not** copy remastered catalog EU/s / prices / wattages into non-overridable constants. Fail if a “Flash/remastered watt lock” flag appears.

Lane owner (wording): **Number Four**.

Remastered EW pack / DESIGN remains **background shapes only**. Blind bake-off: implement later from `docs/` against bake-off `main` (`b67f454`), **not** remastered base `758665e`.

### Hard gate 3 — Override must change the snapshot

> The inject path is **live** and **probe-visible**. Injecting a ledger key (draw, radius, strength, heat factor, poison/DF cost, lobe half-angle, ECCM share range, …) **must** change the resolved snapshot for that key. Omit inject ⇒ §3 playtest default. A snapshot that ignores inject **fails** even if gameplay “feels right.”

Lane owner (wording): **Number Four**.

Today `phase92.injectMagnitudes` and `phase93.injectMagnitudes` are **split**, and `resolvePhase93Defaults` only merges poison/DF keys. This amend requires **one** playtest inject that the snapshot (and the live helpers it claims) actually honor. Names can change (`resolvePhase94Defaults` / `__BM1_PROBE__.phase94`).

### Hard gate 4 — No P9–9.3 behavioral reopen

> Residue-before-void, burn-through `B × √Q`, RSS / lobes, transponder claim, HoJ emission-only / silence→coast, poison≠wipe, DF≠FS, ghosts book-only, delivered P4/P5 report preservation, and **five power consumers only** all **stay**. Soft numbers are **not** new fire / identity rules. Do **not** reopen Phase 9’s six hard gates, 9.1’s seven, 9.2’s eight, or 9.3’s eight. Do **not** regress PR #33 / #35 / #37 / #42 / #43 or S14–S19.

Lane owner (wording): **Number 2** on “soft numbers ≠ new fire/identity rules”; **Referee / One** on do-not-open.

Cite Phase 9 gates 1–6, 9.1 gates 1–7, 9.2 gates 1–8, and 9.3 gates 1–8 as **already locked**. This amend **subscribes**. Changing Compact draw must not gift `firingSolution`, wipe FLASH, spawn a hull, add a sixth consumer, or rewrite Phase 1.

### Hard gate 5 — No boarding / Phase 10 reopen

> Do **not** reopen boarding #38 / #39 (`tractorIsBoarding()` stays false; capture XOR scuttle; XP `not_tracked_yet`). Do **not** reopen Phase 10 #40 / #41 (stories stay knowledge layers; no gifted FS from rumor; pack gates stay). Boarding / Dominion odds flags stay injectable and **false**-locked from remastered, same as EW.

Lane owner (wording): **Referee / One**.

### Soft gate 6 — Suites stay green; screenshot / no-clip only if UI readout

> **Soft:** existing suites stay green with §3 defaults (S14–S19 / catalog / doctrine / boarding / Phase 10). Screenshot / no-clip continues for a **later engine PR** **only if** the UI shows a new ledger readout (optional). This brief **does not** attach PNGs and **does not** open dockClear polish.

Lane owner (wording): **Number Four** (process); **Number Three** scores suite-green **after** engine.

A fixture that **requires** remastered Flash EU/s **fails** this brief. Retuning poison/DF/lobe numbers to “make the panel shorter” fails “not EW math.”

### Also from the room (score with the gates)

| Plan / room want | How this brief locks it |
| --- | --- |
| Central injectable playtest ledger (draws / radii / strength / heat / poison+DF / lobe α / ECCM share) | Gates 1–3. §3. |
| Starting defaults may be proposed, marked TBD/soft | Gate 1. §3 tables. |
| `MAGNITUDES_LOCKED_FROM_REMASTERED === false`; no `git am` | Gate 2. |
| Override changes the snapshot; inject path live | Gate 3. |
| No P9–9.3 behavioral reopen | Gate 4. Soft numbers ≠ new rules. |
| No boarding / Phase 10 reopen | Gate 5. |
| Suites green at defaults; optional later no-clip | Soft gate 6. |

### Must not break (cite landed work)

Score as **preservation**. A Phase 9.4 Pass that regresses them is a Fail. **#33, #35, #37, #42, and #43 stay locked.** Boarding #38 / #39 and Phase 10 #40 / #41 stay locked.

| Locked rule | Cite | Phase 9.4 must not |
| --- | --- | --- |
| Five consumers only; spend on reserved `ew` | P6.5; P9 gate 1; 9.1–9.3 gate 1 | Add a sixth consumer. Implement effects at draw 0 “because the ledger moved.” |
| Ghosts book-only; decoys ≠ hulls | P9 gate 2; 9.2 gate 5; 9.3 gate 2 | Spawn a hull because a radius changed. |
| Delivered reports / FLASH survive | P9 gate 3; 9.3 gate 3 | Wipe / unsend because a duration changed. |
| Poison ≠ wipe; DF ≠ FS / ≠ identity | 9.3 gates 3–4 | Turn a poison-draw inject into contact-delete or a gifted lock. |
| Residue / burn-through / RSS / lobes / claim / HoJ | 9.1; 9.2; 9.3 gate 5 | Drive Q to 0 for E>0. Perfect-track silence. Rewrite Phase 1 from a watt. |
| Culture / `engagement_authorized` never injected | P9 gate 5; 9.1–9.3 | Write the fact from a ledger inject. |
| Weapons matrix before overhaul | P9 gate 4 | Retune `game_items.json` combat numbers. |
| Tractor ≠ boarding; stories ≠ FS | #38/#39; #40/#41 | Flip `tractorIsBoarding()`. Gift FS from Dominion because the ledger exists. |

### Process locks (not a change to gates 1–5)

- **Proposal first.** Do not implement from this text until Tenth scopes the engine lane after a brief Pass.
- **Blind bake-off.** Implement against bake-off `main` (`b67f454` after #43), **not** remastered `758665e`. From `docs/` only. Do **not** crib `Artemis2028/BM1-remastered-work`.
- **No invented balance numbers as locked constants.** §3 numbers are **playtest / TBD / injectable**.
- **#33 / #35 / #37 / #42 / #43 stay locked.** Do not reopen boarding / Phase 10.
- **Subscribe, do not fork.** Merge existing resolve helpers. Do not implement a second contest, second contact book, or second `ew` consumer.
- **No Pass claimed** in `docs/BAKEOFF-STATUS.md` from this PR.

## 3. Central playtest ledger

**Lane owner (wording):** Number Four.

These are **starting injectable defaults** for playtest, republished from 9.1–9.3 at `b67f454`. They are **not** remastered watts, **not** locked constants, and **not** a Referee-certified balance. Mark every number **TBD / playtest**. Override must change the snapshot.

### 3.1 Catalog tiers (9.1 slot)

| Symbol / tier | Starting playtest default | Notes |
| --- | --- | --- |
| Compact draw / strength / radius | 1.2 / 2 / 400 | `EW_EQUIPMENT_CATALOG.compact` |
| Tactical draw / strength / radius | 2 / 3.5 / 700 | Mid tier |
| Fleet draw / strength / radius | 3.2 / 5 / 1100 | Still one slot |

Prices remain **null / TBD**.

### 3.2 Phase 9 family draws / durations

| Family | Draw | Duration | Notes |
| --- | --- | --- | --- |
| `sensor_jamming` | 1.6 | 8000 ms | Reserved `ew` |
| `deceptive_contacts` | 1.4 | 9000 ms | Ghosts stay book-only |
| `fire_control` | 1.8 | 7000 ms | Not a gifted FS |
| `comms_disruption` | 1.5 | 10000 ms | Delay **new** send only |

### 3.3 Phase 9.1 clocks / contest placeholders

| Symbol | Starting playtest default | What it is |
| --- | --- | --- |
| Spin-up / cooldown | 1000 / 2000 ms | `localElapsedMs` |
| Self-cancel | 0.25 | Own emitter |
| ECCM Boost | × 1.4 on E | Suite control; S=0 unavailable |
| Burn-through B | 200 | `B × √Q` (shape locked; **B** injectable) |
| Clear ratio N/E | 0.05 | Clear vs Interference |

### 3.4 Phase 9.2 depth (lobes / share / heat)

| Symbol | Starting playtest default | What it is |
| --- | --- | --- |
| Lobe half-angle α | 50° | 180° reproduces isotropic 9.1 |
| Sidelobe factor | 0 | Out-of-lobe contribution |
| ECCM share radius | 360 | Detection-only share |
| Formation / player dist | 110 / 300 | Landed envelope |
| Focused Scan dwell / extra Sensors | 1500 ms / 0.4 | Still Sensors, not hidden `ew` |
| Heat suppress extra `ew` | 0.6 × catalogDraw | Quiet jam harder to DF |
| Heat emission unsuppressed / suppressed | 1.0 / 0.25 | Loud vs paid quiet |
| Silent-running `ew` / emission scale | 0.5 / 0.1 | Not cloak |
| Decoy `ew` / duration / max | 1.3 / 8000 ms / 4 | Book-only |
| New fleet-order delay | 2000 ms | Delay **new** send only |

### 3.5 Phase 9.3 poison / DF

| Symbol | Starting playtest default | What it is |
| --- | --- | --- |
| Scan-poison `ew` draw | 1.1 | Extra reserved `ew` |
| Scan-poison duration | 7000 ms | `localElapsedMs` |
| Scan-poison confidence factor | 0.45 | Live mark only |
| Focused Scan stall extra | 1200 ms | Dwell while poison live |
| Scan-progress stall factor | 1.8 | Remaining search / emission clocks |
| ECCM poison resist | 0.5 | Boost shrinks penalty when S>0 |
| DF assist `ew` draw | 0.8 | Spend-to-classify |
| DF assist duration | 6000 ms | `localElapsedMs` |
| DF cue quality loud / suppressed / silent | 0.75 / 0.25 / 0 | Silence → no live cue |
| DF range | 700 | Not a lock radius |

Exact watts and milliseconds remain **TBD / playtest**. Shape is locked: override works; remastered lock flag false; suite green at these defaults (soft).

## 4. Override contract (gate 3)

**Lane owner (wording):** Number Four.

| Hook already landed | 9.4 addition |
| --- | --- |
| `resolveEwMagnitudes` (`src/phase9-ew.js` families; `src/phase91-ew-slot.js` tiers) | Merge into the central ledger |
| `resolvePhase91Defaults` (`src/phase91-power.js`) | Same |
| `resolvePhase92Defaults` (`src/phase92-magnitudes.js`) | Same |
| `resolvePhase93Defaults` (`src/phase93-magnitudes.js`) | Same |
| `phase92.injectMagnitudes` / `phase93.injectMagnitudes` | **One** live inject the snapshot honors for §3 keys |
| `MAGNITUDES_LOCKED_FROM_REMASTERED === false` | **Stays false** |

Recommended helper (name can change): `resolvePhase94Defaults(injected)` returning the **full** §3 ledger. Offline tests assert, for example: inject `{ lobeHalfAngleDeg: 20 }` ⇒ snapshot lobe 20; inject `{ scanPoisonEwDraw: 0.9 }` ⇒ snapshot poison draw 0.9; inject `{ compact: { draw: 9 } }` ⇒ snapshot compact draw 9; omit inject ⇒ playtest default; remastered-lock flag false.

Live contest / draw / poison / DF helpers that **claim** a snapshot key must **read** that resolved value. A pretty snapshot that the jammer ignores **fails** gate 3.

## 5. Soft numbers ≠ new fire / identity rules (gate 4)

**Lane owner (wording):** Number 2.

A playtest inject may change **how strong / how wide / how expensive** a landed family is. It may **not**:

- Gift `firingSolution` / `liveWeaponTrack` / `engagement_authorized` / culture fire.
- Wipe delivered reports, unsend FLASH, or splice `knownIncidentIds`.
- Spawn hulls; treat ghosts / decoys / residue / DF cues as living ships.
- Rewrite `playerFaction` / `playerSide` / Reman **53** / the 9.1 claim layer.
- Perfect-track silent / cloaked hulls; drive Q to 0 for E>0; delete the contact.
- Add a sixth `POWER_CONSUMERS` entry or spend EW off-budget.
- Flip `tractorIsBoarding()` or write Dominion rumor as a lock.

Player-facing line (names can change):

- `Playtest ledger. Magnitudes injectable — not a remastered lock, not a firing solution.`

If the UI says “weapons free because we retuned watts” / “FLASH erased” / “identity rewritten,” the ledger is not ready.

## 6. Acceptance exercises (S20)

Keep Phase 1 / S4–S19 / doctrine / catalog / boarding / Phase 10 green. **S14 stays Phase 9. S15 stays 9.1. S16 stays 9.2. S17 stays boarding. S18 stays Phase 10. S19 stays 9.3** — replay, do not rewrite. Add S20 fixtures that fail setup if the central-ledger helper or live inject is missing.

Number Three owns the probe gate **after** engine, not this brief. IDs are a sketch.

| Case | Required exercise and result |
| --- | --- |
| **S20.1** Injectables only / not remastered lock | Snapshot keys from §3 present. `MAGNITUDES_LOCKED_FROM_REMASTERED === false` on 9 / 9.1 / 9.2 / 9.3 / 9.4 (and boarding / Phase 10 flags unchanged). No remastered patch applied. |
| **S20.2** Override changes the snapshot | Inject lobe α, compact draw, heat factor, poison draw, DF range, share radius (at least one each class). Snapshot **matches inject**. Omit inject ⇒ §3 default. |
| **S20.3** Inject path is live | After S20.2 inject, a probe that reads the **live** helper (lobe mask / reserved `ew` extra / poison draw / DF cue range) sees the injected value — not only a disconnected copy. |
| **S20.4** Soft numbers ≠ new rules | Replay a compact S14.3–S14.8 / S15.4–S15.12 / S16.1–S16.4 / S19.5 / S19.7 family under an injected draw: ghosts still book-only; reports still delivered; no `engagement_authorized`; poison ≠ wipe; DF ≠ FS; five consumers. |
| **S20.5** P9–9.3 / boarding / Phase 10 preserved | Replay S14–S19 / S17 / S18 at §3 defaults. `tractorIsBoarding() === false`. Dominion rumor still not a lock. No sixth consumer. |
| **S20.6** Soft suite-green / optional readout | Defaults from §3 load without suite failure (soft). Docs-only brief: screenshot **N/A**. Later engine: if a ledger readout ships, `clippedControls: []` at 1280×720; dockClear polish **not** required. |

Do not claim a Referee Pass from this list.

## 7. Non-goals

Phase 9.4 will not:

- Add new EW families.
- Open dockClear polish.
- Retune weapons / `game_items.json` combat numbers.
- Invent “final” balance certification or lock remastered watts.
- `git am` remastered patches, or treat remastered DESIGN as engine source.
- Reopen Phase 9–9.3 gates or regress PR #33 / #35 / #37 / #42 / #43 / S14–S19.
- Reopen boarding #38 / #39 or Phase 10 #40 / #41.
- Gift `firingSolution` or `engagement_authorized` from a ledger inject.
- Wipe delivered reports / FLASH; spawn hulls; add a sixth consumer.
- Claim a Referee Pass in `docs/BAKEOFF-STATUS.md`.

## 8. Implementation sequence and handoff

1. **Brief Pass.** Referee / One score the **five hard gates**. Number 2 scores gate **4** (soft numbers ≠ new fire/identity rules) and preservation wording. Number Four scores gates **1–3** and the engine half of **4–5**, plus soft gate **6** as process. Do not open an engine PR on this document alone.
2. **Tenth scopes the engine lane** after Pass. Blind implement from `docs/` against bake-off `main` after #43 (`b67f454`).
3. **Suggested order if scoped:** central ledger + `resolvePhase94Defaults` (S20.1) → override changes snapshot (S20.2) → live helpers read the same values (S20.3) → preservation replay (S20.4–S20.5) → optional readout / no-clip (S20.6) **only if** UI ships. **Do not** ship a remastered watt lock. **Do not** ship new families.
4. **Number Three** adds/runs S20 after engine. Keep S4–S19 green. Do not weaken S14–S19 to make S20 pass.
5. Changelog / status Pass wait on Referee after review. This proposal PR may note that the brief is open; it must **not** write a Pass.

## 9. Open questions

Mark these clearly. They do **not** weaken the hard gates.

| ID | Question | Default if engine is scoped before an answer |
| --- | --- | --- |
| Q1 | Exact playtest numbers beyond §3? | **TBD / injectable.** S20.2 asserts override + no remastered lock, not a wattage freeze. |
| Q2 | One new helper vs merge-only of 9–9.3 resolve functions? | **Either**, if one inject changes the snapshot **and** the live path. Prefer thin `src/phase94-magnitudes.js`. |
| Q3 | UI ledger readout in the same engine PR? | **Optional.** Soft gate 6. DockClear polish still **out**. |
| Q4 | Must `phase92` / `phase93` injectors keep working? | **Yes** as aliases or wrappers so S16.14 / S19.11 stay green. |
| Q5 | Difficulty knobs? | **Out.** |

## 10. Lanes

| Who | Owns | Scores |
| --- | --- | --- |
| **Number 2** | Doctrine: gate **4** — soft numbers ≠ new fire / identity rules; preservation of ghosts / reports / poison≠wipe / DF≠FS / no `engagement_authorized` | A watt change is not a new EW family and not a shot |
| **Number Four** | Engine: gates **1, 2, 3** (injectables, remastered-lock false, live override) plus resolve-helper merge / snapshot. Engine must not hook boarding or Dominion or reopen #33/#35/#37/#42/#43 | Override works; flag stays false; no `git am`; later optional no-clip |
| **Number Three** | Probe gate **after** engine (S20; S4–S19 stay green) | Not this brief |
| **Referee / One** | This brief vs the **five hard gates** in §2. **Do-not-open** check: no #33/#35/#37/#42/#43 reopen, no boarding / Phase 10 reopen, no `git am`, **no Referee Pass claimed** from this PR | **Before** any engine PR |

Phase 9.4 is ready to score when a reader can mark Pass/Fail on: injectables only; remastered-lock false / no `git am`; override changes the snapshot on a live inject path; P9–9.3 behavioral gates preserved (soft numbers ≠ new rules); boarding / Phase 10 not reopened; suites green at defaults (soft); optional later no-clip only if a readout ships.

## Sources and precedence

- This amend’s engine checklist: `docs/phase9/BM1-PHASE9.4-ENGINE-DEPENDENCIES.md`.
- Phase 9.3 locked baseline: `docs/phase9/BM1-PHASE9.3-SCAN-POISON-DF-ASSIST-PROPOSAL.md` §7; `src/phase93-magnitudes.js`; PR #42 / #43; S19.
- Phase 9.2 locked baseline: `docs/phase9/BM1-PHASE9.2-EW-DEPTH-PROPOSAL.md` §8; `src/phase92-magnitudes.js`; PR #37; S16.
- Phase 9.1 locked baseline: `docs/phase9/BM1-PHASE9.1-EW-ROBUSTNESS-PROPOSAL.md`; `src/phase91-power.js`; `src/phase91-ew-slot.js`; PR #35; S15.
- Phase 9 locked baseline: `docs/phase9/BM1-PHASE9-EW-WEAPONS-PROPOSAL.md`; `src/phase9-ew.js`; PR #33; S14.
- Boarding locked: `docs/boarding/`; PR #38 / #39; S17.
- Phase 10 locked: `docs/phase10/`; PR #40 / #41; S18.
- Remastered EW pack / DESIGN: **background shapes only**. Not a patch source. Not a constant lock. Not `758665e`.
- Bake-off process: `docs/BAKEOFF-STATUS.md` (this PR may note the 9.4 brief is open; **no Pass claimed**; #33 / #35 / #37 / #42 / #43 remain locked; boarding / Phase 10 stay locked).

Settled Phase 1–10 behavior, Phase 9–9.3 gates, PR #33 / #35 / #37 / #42 / #43, boarding #38/#39, Phase 10 #40/#41, and these five Phase 9.4 hard gates take precedence over older handoff text that treated remastered watts as live locks or a playtest number as a new fire/identity rule.
