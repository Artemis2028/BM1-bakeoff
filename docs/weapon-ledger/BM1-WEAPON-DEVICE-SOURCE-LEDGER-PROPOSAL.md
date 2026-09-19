# BM1 weapon / device source ledger

**Status:** proposal for a reviewed source ledger / audit; no engine changes made by this document.  
**Repository:** `Artemis2028/BM1-bakeoff`  
**Planning baseline:** `6dc279b` on `main` (18 September 2026), after flags / passes / utility inventory engine (PR #47).  
**Referee context:** Phase 4 engine §6 **Pass** on `7f926df`. Phase 9–9.4 EW (PRs #33 / #35 / #37 / #42 / #43 / #44 / #45), boarding (PRs #38 / #39), Phase 10 Dominion-first (PRs #40 / #41), and flags / passes (PRs #46 / #47) are the **locked** baselines — **Keep #33, #35, #37, #38, #39, #40, #41, #42, #43, #44, #45, #46, and #47 locked.** The Phase 9 weapons matrix (`src/phase9-weapons-matrix.js`, S14.12–S14.15) stays **read-only**. This is a **source ledger / audit brief only**, not a combat retune, not a fire-gate reopen, and **not** a claim that those lanes already had a Referee Pass on the status MD. This brief does **not** claim a new Referee Pass.  
**Companion:** `docs/weapon-ledger/BM1-WEAPON-LEDGER-ENGINE-DEPENDENCIES.md` (hooks, risks, later S22 probe sketch).  
**Scoped by:** Tenth Mountain Trooper, 2026-09-18 — proposal first; no engine until Tenth scopes after a brief Pass. Room-locked hard gates (audit ≠ retune; three disruptor identities; tractor stays a slot; Flash prices are source not locks; utility Flash rows classified or deferred; inherited-not-in-Flash list explicit; provenance + no universal bypass + no gifted fire; do-not-reopen + blind) are **in** this one scoreable brief.

Phases 1–10 and Phase 9–9.4 already landed, including a **read-only ten-column weapons matrix** in front of `data/game_items.json` (no damage / cooldown / range overhaul). Flags / passes already landed a **utility inventory book** beside the three combat/device slots (Thaleron Test Facility pass **unverified — not shipped**). Convergence §1 and plan §16.2 row 1 named the remaining **weapon / device source ledger** gap: a BM1-versus-inherited-BM2 **audit** with Flash prices as **source material, not final prices**; Disrupter Canon / Cannon / Turret as **three** identities; Tractor as a **slot** item; utility Flash rows classified or deferred; extra bake-off rows kept on a separate inherited list.

This is **one** docs audit: publish a **scoreable source ledger** that cites provenance per claim, classifies Bajoran Sail and Warp Core instead of silently cargo-merging them, lists every inherited-not-in-Flash catalog row, and forbids treating any Flash number as a live price lock. It is not a remastered `git am`, not a Phase 9 matrix rewrite, not empty-but-armable, not station-construction visuals, not dockClear polish, not an HTML catalog, and not a Thaleron facility invent.

## 1. The result we want

A reader can **score identities, provenance, and classification** without anyone retuning combat. Live `game_items.json` numbers stay the **current data** they are today. Flash numbers stay **historical source**. The Phase 9 matrix stays the **behavior ledger** in front of those live numbers. This brief is the **source / identity audit** that plan §11 / §13 and GUIDED §1 asked for before any later overhaul.

**Exit condition (GUIDED-CONVERGENCE §1 / plan §16.2 row 1):** Canon, Cannon, and Turret remain three disruptor identities; Tractor is still equippable in a combat/device slot; utility Flash rows (Bajoran Sail, Warp Core) are classified or explicitly deferred — not silently turned into cargo; no row in the Flash table is treated as a live price lock.

**Proposed first-release decisions:**

| Question | Proposed answer |
| --- | --- |
| What is the first playable slice? | **Docs-only** reviewed ledger under `docs/weapon-ledger/`. A later thin data/audit engine, **if** Tenth scopes it after Pass, **subscribes** to the landed Phase 9 matrix and `game_items.json` without rewriting combat numbers. |
| May we retune damage, cooldown, range, or live prices? | **No.** Phase 9 matrix stays read-only. `BASELINE_COMBAT_NUMBERS` / live catalog stay. |
| May we collapse Disrupter Canon / Cannon / Turret? | **No.** Three identities: bake-off **id 7** (Flash Canon, 1500, single), **id 6** (Flash Cannon, 3000, dual), **id 12** (Flash Turret, 7800). Live display names of ids 6 and 7 both say “Disruptor Cannon” — that is an **audit finding**, not permission to merge the rows. |
| May Tractor leave the device slot? | **No.** Id 25 / type Device. Not cargo, not `utilityBook`, not boarding. |
| Are Flash prices live locks? | **No.** Source material only. `FLASH_PRICES_ARE_LIVE_LOCKS` stays **false**. Plasma Torpedo Flash price was **not supplied**; bake-off id 17 @ 7200 is **current data**, not Flash-certified. |
| Bajoran Sail / Warp Core? | **Explicitly deferred utilities.** Not cargo. Warp Core ≠ trade-good “Warp Cores”. Not flags/passes credentials. No invented item ids in this brief. |
| Extra bake-off rows not in the Flash table? | Keep on a separate **inherited, not in this Flash table** list (§5). Do not invent Flash prices. Do not delete by silence. |
| Universal shield bypass from lore notes? | **Forbidden.** Row-scoped notes only. Default remains shields-then-hull. |
| Provenance per claim? | Required: **BM1 Flash** / **retained BM2** / **bake-off `game_items.json`** / **new design**. |
| May a ledger row gift `firingSolution`, culture fire, or `engagement_authorized`? | **No.** |
| May we reopen EW #33/#35/#37/#42/#43/#44/#45, boarding #38/#39, Phase 10 #40/#41, or flags #46/#47? | **No.** |
| Empty-armable, dockClear, construction visuals, HTML catalogs, Thaleron facility invent? | **Out.** |
| May we `git am` remastered patches or lock remastered prices? | **No.** `LEDGER_LOCKED_FROM_REMASTERED === false` (name can change). |
| Is this a Referee Pass? | **No.** Referee / One / Number 2 / Number Four score the hard gates **before** any engine. Number Three probes only after engine. |

These are recommendations for this audit package, not new decisions attributed to the user. Locked bake-off constraints take precedence over older flavor that treated Flash prices as live locks, collapsed the three disruptors, moved Tractor to cargo, or silently merged Warp Core into “Warp Cores.”

Cite GUIDED-CONVERGENCE §1 and plan §16.2 row 1 as the planning sources this brief **reconciles**, not as a second spec:

| Planning source | This brief |
| --- | --- |
| GUIDED §1: audit BM1 and BM2 defs; merge identical defs; preserve real variants | Audit + list. **Do not merge live rows** in this docs PR. Identical-def merge is a later Tenth-scoped data slice. |
| GUIDED §1: Disrupter Canon / Cannon / Turret remain three identities | Gate 2. §4. |
| GUIDED §1: Tractor stays a weapon/device slot (Flash 3400, Special) | Gate 3. |
| GUIDED §1: Flash prices are source material, not final prices | Gate 4. §3. |
| GUIDED §1: Bajoran Sail / Warp Core classified or explicitly deferred — not silent cargo | Gate 5. §6. |
| GUIDED §1: extra bake-off / BM2 rows on a separate inherited list; do not invent Flash prices | Gate 6. §5. |
| Plan §11: provenance; no universal shield bypass; matrix before overhaul | Gates 1 and 7. Phase 9 matrix already exists and **stays read-only**. |
| Plan §11: pursuit ≠ permission ≠ per-weapon firing gate | Gate 7 (no gifted fire). Do **not** reopen Phase 9 gate 5. |
| Plan §13: BM1 versus inherited BM2 weapon mappings | This audit. Mapping cites landed catalog wire; does not rewire it. |
| Phase 9 gate 4 / S14.12–S14.15 | **Subscribe.** This ledger does not replace the ten-column matrix. |
| GUIDED §2 / flags #46/#47: credentials are inventory, not slots | Non-goals. Do not move weapons into `utilityBook`. |
| Plan §16.2 rows 3, 5, 9 | **Out.** Empty-armable, construction visuals, HTML catalogs. |

## 2. Locked constraints (do not reopen)

The bake-off room locked these before this brief. Implementation and probes must treat **gates 1–8** as **hard gates**. Referee / One score this brief against those **eight** **before** any engine PR. Number Three probes only after engine. EW / boarding / Phase 10 / flags gates stay **closed**; they are restated only as **gate 8** (preserve / do-not-open), not as a reopen. This docs PR **does not** claim a Referee Pass.

### Hard gate 1 — Audit, not retune; Phase 9 matrix stays read-only

> This is a **reviewed source ledger / audit**, not a fire-gate reopen and not a combat overhaul. The Phase 9 weapons matrix stays **read-only**. Do **not** retune damage, cooldown, range, or **live** prices in `data/game_items.json`, `DEFAULT_WEAPON_CATALOG`, or `BASELINE_COMBAT_NUMBERS`. Do not rewrite `src/phase9-weapons-matrix.js` combat columns, shield absorb, or mapping helpers as a “ledger finish.”

Lane owner (wording): **Number Four**.

Phase 9 already shipped the ten-column behavior matrix **before** overhaul (PR #33, S14.12). This brief **cites** that matrix. A writer who “implements the ledger” by editing live combat numbers **fails** even if the docs tables look complete.

### Hard gate 2 — Three disruptor identities (Canon / Cannon / Turret)

> Keep **Disrupter Canon / Cannon / Turret** as **three** disruptor identities. Do **not** collapse them into one “disruptor.” Flash spellings and prices are source: **Canon** 1500 (single-mount), **Cannon** 3000 (dual), **Turret** 7800. Bake-off maps those to **id 7** (`singledisrupt.gif`, live price 1500, `minMass` 0), **id 6** (`dualdisrupt.gif`, live price 3000, `minMass` 2), and **id 12** (`disturrent.gif`, live price 7800). Live **display names** of ids 6 and 7 both read “Disruptor Cannon” — record that mismatch; do **not** treat the shared string as one item.

Lane owner (wording): **Number Four**.

A later rename of id 7’s display string is **out of this brief** (open Q1). Identity is already three catalog ids. Merging id 6 into id 7, or deleting the turret, **fails**.

### Hard gate 3 — Tractor stays a weapon / device slot

> **Tractor Beam** stays a **weapon/device slot** item — bake-off **id 25 / type Device / price 3400**, Flash family Special. It is **not** cargo, **not** `utilityBook`, **not** `weaponInventory` spare-as-the-only-home, and **not** boarding. `tractorIsBoarding()` stays **false**. Phase 3 `unable_to_comply` tractor hold stays the physical fact it already is.

Lane owner (wording): **Number Four** on slot class; **Number 2** on “hold ≠ board / ≠ fire token.”

Flags / passes (#46/#47) already forbade stuffing Tractor into the credential book. This ledger **repeats** that lock from the weapon side.

### Hard gate 4 — Flash prices are source material, not live locks

> Flash prices in GUIDED §1 / §3 of this brief are **source material, not final prices**. No row becomes a live price lock. `FLASH_PRICES_ARE_LIVE_LOCKS` stays **false**. Plasma Torpedo was **not Flash-supplied**; bake-off id 17 @ 7200 is **current data**, not a Flash-certified price. Matching live and Flash numbers (many rows do match) is an **observation**, not certification.

Lane owner (wording): **Referee / One**.

Copying Flash 1300 / 1500 / 3000 / … into non-overridable engine constants, or treating a match as “already locked,” **fails** this gate even if combat is untouched.

### Hard gate 5 — Utility Flash rows classified or explicitly deferred

> **Bajoran Sail** (Flash 5000, Utility) and **Warp Core** (Flash 12000, Utility) must be **classified or explicitly deferred** — not silently turned into cargo or trade goods. Verdict in this brief (§6): both are **explicitly deferred utilities**. Bajoran Sail is **not** in the weapon catalog and **not** a trade good. Warp Core is **not** the cargo string **“Warp Cores.”** Neither is a flags/passes credential. Do **not** invent item ids, shops, or hull modules from the names.

Lane owner (wording): **Referee / One**.

Phase 9 already listed them as `deferred-utility` / `deferred-utility-not-trade-good` with `bakeoffId: null`. This ledger **classifies** that deferral instead of leaving “verify” hanging. Shipping them as cargo, as `utilityBook` rows, or as new weapon ids from this brief **fails**.

### Hard gate 6 — Inherited-not-in-Flash list is explicit

> Extra bake-off / BM2 rows **not** in the Flash table stay on a separate **“inherited, not in this Flash table”** list (§5). Do **not** delete them by silence. Do **not** invent Flash prices for them. Current catalog extras: Particle Beam (2), Magnetorp Launcher (27), Biobeam (28), Tesla Beam (29), Subspace Torpedo (30), Proton Beam (38), Gatling Pulse Turret (39), Wave Pulse (44), Vortex Ray (45). Phase 9.1 HoJ is **new design**, unmounted, not a catalog id, and **not** an inherited Flash-omission.

Lane owner (wording): **Referee / One** on completeness; **Number Four** on “do not retune those rows to invent a Flash price.”

Plasma Torpedo is **Flash-named with price not supplied** — it belongs in §3, not on the inherited extras list.

### Hard gate 7 — Provenance per claim; no universal shield bypass; never gift fire

> Identify the source of each claim: **BM1 Flash** / **retained BM2** / **bake-off `game_items.json`** / **new design**. Do **not** grant universal shield bypass from lore exceptions (Polaron, Transphasic, Cutting Beam, Thaleron notes stay **row-scoped**; default remains shields-then-hull). A ledger row must **never** gift `firingSolution`, culture fire, or `engagement_authorized`. Pursuit, permission to engage, and the per-weapon firing gate stay the landed three-step.

Lane owner (wording): **Number 2** on fire / bypass-as-permission; **Referee / One** on provenance honesty.

`UNIVERSAL_SHIELD_BYPASS` stays **false**. Ordinary Type X / photon still hit shields first. A matrix lore string is not a global `bypassShields: true`.

### Hard gate 8 — Do not reopen landed lanes; blind bake-off; named outs

> Do **not** reopen EW #33 / #35 / #37 / #42 / #43 / #44 / #45 (matrix read-only; ghosts book-only; no report wipe; soft numbers ≠ new fire rules; `MAGNITUDES_LOCKED_FROM_REMASTERED === false`). Do **not** reopen boarding #38 / #39 (`tractorIsBoarding()` stays false; capture XOR scuttle; XP `not_tracked_yet`). Do **not** reopen Phase 10 #40 / #41 (stories stay knowledge layers). Do **not** reopen flags / passes #46 / #47 (`utilityBook` stays credentials; Thaleron pass **unverified — not shipped**; Tractor / Bajoran Sail / Warp Core stay **out** of that book). Do **not** open empty-but-armable, dockClear polish, station construction visuals, HTML catalogs, or Thaleron **facility** invent. Do **not** `git am` remastered patches. `LEDGER_LOCKED_FROM_REMASTERED === false`. Implement later from bake-off `docs/` + `data/game_items.json` + this ledger — **not** `BM1-remastered-work` engine.

Lane owner (wording): **Referee / One**.

### Soft gate 9 — Suites stay green (after engine)

> **Soft:** existing suites stay green (S4–S21 / catalog / doctrine / boarding / Phase 10 / Phase 9.4 / utility). Screenshot / no-clip is **N/A** on this docs PR. A later audit-engine PR attaches UI shots **only if** a ledger readout ships; dockClear polish stays **out**. HTML review catalogs stay **plan §16.2 row 9**, not this slice.

Lane owner (wording): **Number Four** (process); **Number Three** scores suite-green **after** engine.

### Also from the room (score with the gates)

| Plan / room want | How this brief locks it |
| --- | --- |
| Reviewed ledger / audit, not a fire-gate reopen | Gate 1. |
| Phase 9 weapons matrix read-only; no combat retune | Gate 1. |
| Canon / Cannon / Turret remain three identities | Gate 2. |
| Tractor stays a slot item | Gate 3. |
| Flash prices = source, not live locks | Gate 4. §3. |
| Bajoran Sail / Warp Core classified or deferred; not silent cargo | Gate 5. §6. |
| Inherited extras listed; no invented Flash prices | Gate 6. §5. |
| Provenance; no universal bypass; no gifted FS / culture / `engagement_authorized` | Gate 7. |
| Do not reopen EW / boarding / Phase 10 / flags; named outs; blind; remastered-lock false | Gate 8. |
| Suites green; no Referee Pass from this PR | Soft gate 9. Scoring note below. |

### Must not break (cite landed work)

Score as **preservation**. A later ledger Pass that regresses them is a Fail. **#33, #35, #37, #38, #39, #40, #41, #42, #43, #44, #45, #46, and #47 stay locked.**

| Locked rule | Cite | This brief / later engine must not |
| --- | --- | --- |
| Ten-column matrix before overhaul; numbers unchanged | Phase 9 gate 4; S14.12; `BASELINE_COMBAT_NUMBERS` | Edit live damage / cooldown / range / price “to match Flash.” |
| Three disruptors + Tractor Device slot | S14.13; GUIDED §1 | Collapse 6/7/12. Move Tractor to cargo / `utilityBook`. |
| No universal shield bypass | S14.14; plan §11 | `if (name.includes('polaron')) skipShields`. |
| Mapping cites fitted / unmounted / inherited-only; no auto-fill | S14.15; GUIDED §3 | Fill empty slots so the ledger “has hosts.” Open empty-armable. |
| Pursuit ≠ permission ≠ per-weapon gate | Phase 9 gate 5 | Gift FS / culture / `engagement_authorized` from a row. |
| Tractor ≠ boarding | #38 / #39; `tractorIsBoarding() === false` | Tractor-as-capture. Cutting beam as prize. |
| Flags/passes are credentials, not slots | #46 / #47 | Move weapons into `utilityBook`. Ship Thaleron **pass** / **facility**. |
| Money ≠ standing ≠ Reman | PR #28; Phase 8 | Latinum + a Flash price bypasses `meetPackPurchaseDecision`. |
| Catalog 172 / 38 aliases / Reman **53** | PR #28; S11 | Second Reman id because a gun “needs a host.” |
| `MAGNITUDES_LOCKED_FROM_REMASTERED === false` | #44 / #45 | Flip EW / boarding / Phase 10 / utility / new ledger lock flags true. |
| `UTILITY_LOCKED_FROM_REMASTERED === false` | #46 / #47 | Treat remastered DESIGN as the item catalog. |

### Process locks (not a change to gates 1–8)

- **Proposal first.** Do not implement from this text until Tenth scopes the engine lane after a brief Pass.
- **Blind bake-off.** Implement against bake-off `main` (`6dc279b` after #47), **not** remastered `758665e`. From `docs/` + `data/game_items.json` + GUIDED Flash table only. Do **not** crib `Artemis2028/BM1-remastered-work`.
- **No invented flavor copy.** Flash descriptions were **not** in the bake-off source packet. Description cells stay empty until a later packet supplies them.
- **#33 / #35 / #37 / #38 / #39 / #40 / #41 / #42 / #43 / #44 / #45 / #46 / #47 stay locked.**
- **Subscribe, do not fork.** A later audit module reads the landed matrix + catalog. It does not become a second weapon religion.
- **No Pass claimed** in `docs/BAKEOFF-STATUS.md` from this PR.

### Scoring note

Referee / One / Number 2 / Number Four score the **eight hard gates** **before** any engine PR. Number Three probes **only after** engine. **No Referee Pass is claimed by this docs PR.**

## 3. Flash table as source (gate 4)

**Lane owner (wording):** Referee / One on “not a live lock”; **Number Four** on id mapping honesty.

Spellings in **Flash name** are **Flash source spellings** (“Disrupter”). Bake-off often uses “Disruptor.” Mapping comments are observations against `data/game_items.json` at `6dc279b`, **not** a claim that those runtime rows are certified.

**Live lock column is always No.** Matching Flash and live prices is coincidence / current data, not Tenth certification.

Flash descriptions: **not supplied.** Do not invent.

| Flash name | Flash price (source) | Flash family (as supplied) | Bake-off id | Bake-off live name | Bake-off type | Live price (current data) | Slot class | Provenance of identity | Provenance of live numbers | Live price lock? | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Phaser Cannon | 1300 | Pulse | 10 | Phaser Cannon | Cannon | 1300 | combat slot | BM1 Flash | bake-off `game_items.json` | **No** | Flash family Pulse vs live Cannon — observation, not a retune (Q2). |
| Type VII Phaser | 1500 | Pulse | 14 | Type VII Phaser | Turret | 1500 | combat slot | BM1 Flash | bake-off `game_items.json` | **No** | Flash family Pulse vs live Turret — observation (Q2). |
| Disrupter Canon | 1500 | — | 7 | Disruptor Cannon | Cannon | 1500 | combat slot | BM1 Flash | bake-off `game_items.json` | **No** | Single-mount; icon `singledisrupt.gif`; `minMass` 0. **Identity Canon**, despite live name colliding with id 6. |
| Quantum Pulse Cannon | 2000 | — | 8 | Quantum Pulse Cannon | Cannon | 2000 | combat slot | BM1 Flash | bake-off `game_items.json` | **No** | |
| Photon Torpedo | 2500 | — | 15 | Photon Torpedo | Torpedo | 2500 | combat slot | BM1 Flash | bake-off `game_items.json` | **No** | |
| Disrupter Cannon | 3000 | dual | 6 | Disruptor Cannon | Cannon | 3000 | combat slot | BM1 Flash | bake-off `game_items.json` | **No** | Dual-mount; icon `dualdisrupt.gif`; `minMass` 2. **Identity Cannon.** |
| Type X Phaser | 3000 | Beam | 1 | Type X Phaser | Beam | 3000 | combat slot | BM1 Flash | bake-off `game_items.json` | **No** | Default player starter in empty-armable **cite only**; do not auto-fill (GUIDED §3 **out**). |
| Tractor Beam | 3400 | Special | 25 | Tractor Beam | Device | 3400 | **device slot** | BM1 Flash | bake-off `game_items.json` | **No** | Gate 3. Not cargo. Not `utilityBook`. Not boarding. |
| Plasma Phaser | 3800 | — | 4 | Plasma Phaser | Beam | 3800 | combat slot | BM1 Flash | bake-off `game_items.json` | **No** | |
| Bajoran Sail | 5000 | Utility | — | — | — | — | **deferred utility** | BM1 Flash | n/a (no live row) | **No** | Gate 5. §6. Not cargo. No invented id. |
| Engine Disrupter | 5000 | — | 23 | Engine Disruptor | Device | 5000 | device slot | BM1 Flash | bake-off `game_items.json` | **No** | Device drain / engine sting. Not a fire-permission token. |
| Polaron Phaser | 5000 | — | 3 | Polaron Phaser | Beam | 5000 | combat slot | BM1 Flash | bake-off `game_items.json` | **No** | Row-scoped lore note only. **No** universal bypass. |
| Polaron Torpedo | 5300 | — | 19 | Polaron Torpedo | Torpedo | 5300 | combat slot | BM1 Flash | bake-off `game_items.json` | **No** | Same: row note, shields-then-hull default. |
| Quantum Torpedo | 6700 | — | 16 | Quantum Torpedo | Torpedo | 6700 | combat slot | BM1 Flash | bake-off `game_items.json` | **No** | |
| Dual Pulse Phasers | 7500 | — | 9 | Dual Pulse Phasers | Cannon | 7500 | combat slot | BM1 Flash | bake-off `game_items.json` | **No** | |
| Disrupter Turret | 7800 | — | 12 | Disruptor Turret | Turret | 7800 | combat slot | BM1 Flash | bake-off `game_items.json` | **No** | Third disruptor identity. |
| Tachyon Field Generator | 8000 | — | 24 | Tachyon Field Generator | Device | 8000 | device slot | BM1 Flash | bake-off `game_items.json` | **No** | Device. Not a gifted `firingSolution`. |
| Pulse Turret | 8500 | — | 11 | Pulse Turret | Turret | 8500 | combat slot | BM1 Flash | bake-off `game_items.json` | **No** | |
| Gravimetric Torpedo | 9000 | — | 13 | Gravimetric Torpedo | Torpedo | 9000 | combat slot | BM1 Flash | bake-off `game_items.json` | **No** | |
| Warp Core | 12000 | Utility | — | — | — | — | **deferred utility** | BM1 Flash | n/a (no live weapon row) | **No** | Gate 5. **≠** cargo “Warp Cores.” §6. |
| Transphasic Torpedo | 12500 | — | 18 | Transphasic Torpedo | Torpedo | 12500 | combat slot | BM1 Flash | bake-off `game_items.json` | **No** | Row-scoped Borg-shield lore. **No** universal bypass. |
| Cloaking Device | 13500 | — | 22 | Cloaking Device | Device | 13500 | device slot | BM1 Flash | bake-off `game_items.json` | **No** | Phase 6 cloak already landed. Do not reopen P6. Not `utilityBook`. |
| Thaleron Generator | 15500 | — | 26 | Thaleron Generator | Heavy | 15500 | combat/device slot (Heavy) | BM1 Flash | bake-off `game_items.json` | **No** | Cloud weapon. **Not** the Thaleron Test Facility **pass**. Not boarding. Not a facility invent. |
| Cutting Beam | 30000 | — | 5 | Cutting Beam | Beam | 30000 | combat slot | BM1 Flash | bake-off `game_items.json` | **No** | Hull/device cutter. **Not** capture. Not universal bypass. |
| Plasma Torpedo | **not supplied** | — | 17 | Plasma Torpedo | Torpedo | 7200 | combat slot | BM1 Flash (name only) | bake-off `game_items.json` | **No** | Flash **name** in the table; Flash **price not supplied**. Live 7200 is current data, **not** Flash-certified. **Not** an inherited extra. |

`settings.weaponCooldowns` / `settings.devices.*` in `game_items.json` are **runtime knobs**, not Flash-certified prices, and are **not** retuned here.

## 4. Three disruptor identities (gate 2)

| Identity (Flash) | Flash price | Bake-off id | Live display name | Icon | Live price | minMass | Distinct because |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Disrupter **Canon** | 1500 | **7** | Disruptor Cannon | `singledisrupt.gif` | 1500 | 0 | Cheaper single-mount. Flash spelling Canon. |
| Disrupter **Cannon** | 3000 (dual) | **6** | Disruptor Cannon | `dualdisrupt.gif` | 3000 | 2 | Dual-mount. Flash family dual. |
| Disrupter **Turret** | 7800 | **12** | Disruptor Turret | `disturrent.gif` | 7800 | 3 | Turret family. |

Landed probe `disruptorIdentities()` already keys **id 7 / 6 / 12** and compares `flashIdentity` strings. This brief **subscribes**. Do not collapse by renaming all three to “Disruptor.” Do not delete id 7 because the live label collides.

## 5. Inherited, not in this Flash table (gate 6)

These bake-off `weapons[]` rows have **no Flash price in GUIDED §1**. Keep them listed. Do **not** invent Flash prices. Do **not** drop them because the Flash table is silent. Live numbers are **bake-off `game_items.json` current data** (and, where a row is BM2-era content retained on bake-off, **retained BM2** for the *identity* claim — still not a Flash price).

| Bake-off id | Live name | Type | Live price (current data) | stockFactions (live) | Identity provenance | Flash price | Notes |
| --- | --- | --- | --- | --- | --- | --- | --- |
| 2 | Particle Beam | Beam | 9000 | dominion, delpin | retained BM2 / bake-off `game_items.json` | **not in this Flash table** | Named in GUIDED §1 extras list. Fitted on many pack hulls (catalog mapping is landed; do not rewire). |
| 27 | Magnetorp Launcher | Torpedo | 1200 | terran, neutral | retained BM2 / bake-off `game_items.json` | **not in this Flash table** | |
| 28 | Biobeam | Beam | 10000 | sona, promelli | retained BM2 / bake-off `game_items.json` | **not in this Flash table** | |
| 29 | Tesla Beam | Beam | 12000 | sona, terran | retained BM2 / bake-off `game_items.json` | **not in this Flash table** | |
| 30 | Subspace Torpedo | Torpedo | 30000 | sona, vulcan | bake-off `game_items.json` | **not in this Flash table** | Extra row GUIDED called “and similar.” |
| 38 | Proton Beam | Beam | 16500 | nausican, pirate | bake-off `game_items.json` | **not in this Flash table** | |
| 39 | Gatling Pulse Turret | Turret | 35600 | sona, terran | bake-off `game_items.json` | **not in this Flash table** | |
| 44 | Wave Pulse | Turret | 24000 | promelli | bake-off `game_items.json` | **not in this Flash table** | |
| 45 | Vortex Ray | Beam | 35400 | promelli | bake-off `game_items.json` | **not in this Flash table** | |

**Not on this list:**

| Item | Why not here |
| --- | --- |
| Plasma Torpedo id 17 | Flash-**named**; price not supplied. Stays in §3. |
| Bajoran Sail / Warp Core | Flash utilities. §6. No bake-off weapon id. |
| HoJ / anti-emitter | **New design** (Phase 9.1). Unmounted. `provenance: new`. Not a catalog id. Not a Flash omission. |
| Unoccupied catalog holes 20, 21, 31–37, 40–43 | **Vacant ids**, not inherited defs. Do not invent rows to fill them (Q8). |
| Thaleron Test Facility **pass** | Flags/passes lane. Unverified — not shipped. Not a weapon. |
| Cargo “Warp Cores” / “Warp Coils” / “Flags” | Trade goods. Not weapon rows. |

Phase 9 matrix `INHERITED_NOT_IN_FLASH = [2, 27, 28, 29, 30, 38, 39, 44, 45]` already matches this list. This brief **subscribes** and does not add or delete silently.

## 6. Utility Flash rows — classified / deferred (gate 5)

Room lock: classify or explicitly defer. Do not silently cargo-merge.

### 6.1 Bajoran Sail

| Field | Verdict |
| --- | --- |
| Flash | Name Bajoran Sail; price **5000** (source, not a lock); family **Utility** |
| Bake-off weapon id | **None** |
| Bake-off trade good | **None** (no “Bajoran Sail” string in `tradeGoods`) |
| Flags/passes `utilityBook` | **Out.** That book is credentials (`faction_flag` / empty `facility_pass`). #46/#47 already forbade moving Sail into it. |
| Classification | **Explicitly deferred utility.** Candidate for a later slot-utility / hull-module brief **if** BM1 evidence shows Flash sold it into a combat/device slot or a distinct utility mount. |
| First slice | Do **not** invent an id, a shop, a sail-ship cosmetic, or a cargo pod. Do **not** treat “Bajoran Wormhole” map chrome as this item. |

### 6.2 Warp Core

| Field | Verdict |
| --- | --- |
| Flash | Name Warp Core (singular); price **12000** (source, not a lock); family **Utility** |
| Bake-off weapon id | **None** |
| Bake-off trade good | **“Warp Cores”** (plural) is a **cargo** string in `tradeGoods`. That is a **different row**. Do **not** merge. “Warp Coils” is another cargo string — also not this utility. |
| Flags/passes `utilityBook` | **Out.** Same as Sail. |
| Classification | **Explicitly deferred utility.** Candidate for a later engineering / slot-utility brief **if** BM1 evidence shows Flash sold a singular Warp Core as equipment. Until then it is **not** cargo and **not** a live device id. |
| First slice | Do **not** retarget cargo “Warp Cores” price or stock from Flash 12000. Do **not** add weapon id 20 (or any hole) as “Warp Core” from this brief. |

Phase 9 `listDeferredFlashUtilities()` already returns both with `bakeoffId: null`. This ledger **names the class** (deferred utility, not cargo, not credential).

## 7. Stores and slot class (gates 3, 5, 8)

| Store | Holds today | This ledger may | Must not |
| --- | --- | --- | --- |
| `weaponSlots` (length 3) | Combat / device hardpoints, including Tractor id 25 | Cite as the home of slotted weapons/devices | Spend a slot on Bajoran Sail / Warp Core / a flag / HoJ-unmounted |
| `weaponInventory` | Spare **weapon** ids (limit default 9) | Cite | Treat as cargo; stuff credentials |
| `cargoArray` | Trade pods including **“Warp Cores”** | Leave cargo as cargo | Merge Flash Warp Core or Bajoran Sail into it |
| `utilityBook` | Flags / empty facility passes | Leave credentials as credentials | Move Tractor / Cloak / Thaleron **Generator** / Sail / Warp Core here |
| Suite / `ew_equipment` | Dedicated non-weapon slots | Leave | Steal for a gun or a sail |
| `stationPlans` | Build plans | **Out** (construction visuals are row 5) | Treat construction beams as weapons |

Tractor, Cloak, Engine Disruptor, Tachyon Field Generator, Thaleron **Generator** remain **slot** items of their live types.

## 8. Shield notes are not bypass (gate 7)

Landed default: `damageNpcShip` / station damage spend `combatShields` first, remainder to hull. Phase 9 `UNIVERSAL_SHIELD_BYPASS === false`; `bypassShields` is **false** on every matrix row.

| Id | Live name | Allowed note (row-scoped) | Forbidden |
| --- | --- | --- | --- |
| 3 | Polaron Phaser | Trek/BM lore: polaron sometimes pierced Borg shields. **Note only.** | Global skip-shields for “polaron” in the name |
| 19 | Polaron Torpedo | Same, row-scoped | Inherit onto Type X / photon |
| 18 | Transphasic Torpedo | Trek/BM lore: transphasic pierced Borg shields in one episode. **Note only.** | Universal bypass from that episode |
| 5 | Cutting Beam | Hull/device cutter, not capture, not bypass inheritance | Cutting beam as boarding / prize |
| 26 | Thaleron Generator | Heavy cloud — not boarding, not capture, not bypass inheritance | Facility pass; map pin; `bypassShields: true` for later heavies |

Ordinary Type X (id 1) and Photon (id 15) **must** still hit shields first. Isolated lore does not rewrite the default.

## 9. Audit findings (observations, not retunes)

None of these authorize a `game_items.json` edit in this PR or a later audit engine **unless** Tenth scopes a **different** data slice.

1. **Display-name collision:** ids 6 and 7 both live-name “Disruptor Cannon.” Flash identities remain Canon vs Cannon. Icons / prices / minMass still distinguish them.
2. **Flash family vs live type:** Type VII Flash Pulse vs live Turret; Phaser Cannon Flash Pulse vs live Cannon. Record; do not retune type this brief.
3. **Plasma Torpedo provenance nuance:** GUIDED lists the **name** in the Flash table with price not supplied. Phase 9 `FLASH_TABLE` omits id 17, so matrix `provenanceFor(17)` currently returns `bake-off-current`. This ledger classifies identity as **BM1 Flash (name only)** and live price as **bake-off current**. A later audit snapshot **may** expose that split **without** editing combat numbers (Q3).
4. **`DEFAULT_WEAPON_CATALOG`** in `main.js` is a **fallback subset** (ids 1, 15, 22, 23, 25, 26), not the full ledger. Full catalog loads from `game_items.json` `weapons[]`.
5. **Vacant ids** 20, 21, 31–37, 40–43 are holes, not deferred Flash utilities and not inherited defs.
6. **HoJ** is `provenance: new`, unmounted, `catalogId: null`. Keep it off both Flash and inherited lists.
7. **Thaleron Generator ≠ Thaleron Test Facility pass.** Generator is a Heavy slot weapon. The pass stays unverified in the flags lane. This brief must not invent the facility.
8. **Catalog mapping** is already landed (`packDefaultWeaponSlots` + matrix `fitted` / `inherited-only` / `unmounted`). This audit does not re-count hulls and does not auto-fill empties.

## 10. Acceptance exercises (S22 sketch)

Keep Phase 1 / S4–S21 / doctrine / catalog / boarding / Phase 10 / Phase 9.4 / utility green. **S14 stays Phase 9** (matrix read-only). Add **S22** only **after** Tenth scopes a later thin audit engine. IDs are a sketch; do not promise a final count. **This docs PR does not add S22 to the probe.**

Number Three owns the probe gate **after** engine, not this brief.

| Case | Required exercise and result (later engine only) |
| --- | --- |
| **S22.1** Matrix still read-only; combat unchanged | `combatNumbersUnchanged(WEAPON_CATALOG, BASELINE_COMBAT_NUMBERS)`. `game_items.json` damage / cooldown / range / live price untouched vs `6dc279b`. Phase 9 `MATRIX_COLUMNS` still 10. |
| **S22.2** Three disruptors + Tractor slot | Canon id 7 ≠ Cannon id 6 ≠ Turret id 12. Tractor id 25 type Device, `slot === true`, `cargo === false`, `tractorIsBoarding() === false`. |
| **S22.3** Flash prices not live locks | Snapshot `flashPricesAreLiveLocks === false`. Inject must **not** be required to “lock” Flash 1300 et al. Plasma Torpedo `flashCertified === false`. |
| **S22.4** Deferred utilities classified | Bajoran Sail + Warp Core present as deferred utilities; `bakeoffId: null`; not in `tradeGoods`; not in `utilityBook`; Warp Core ≠ “Warp Cores”. |
| **S22.5** Inherited list complete | Ids 2, 27, 28, 29, 30, 38, 39, 44, 45 listed; each `flashPrice: null`; no invented Flash number. HoJ still `provenance: new`. Vacant ids still vacant. |
| **S22.6** Provenance + no bypass + no fire gift | Every snapshot row has provenance in `BM1-flash` / `retained-BM2` / `bake-off-game-items` / `new`. `UNIVERSAL_SHIELD_BYPASS === false`. Ordinary beam still shields-then-hull. No `firingSolution` / `engagement_authorized` from ledger inject. |
| **S22.7** Landed lanes preserved | Replay S14–S21 / S17 / S18. No EW / boarding / Phase 10 / flags reopen. No empty-armable / construction / dockClear / HTML-catalog / Thaleron-facility work in the diff. `LEDGER_LOCKED_FROM_REMASTERED === false`. |

Do not claim a Referee Pass from this list.

## 11. Non-goals

This brief will not:

- Implement engine code, UI screenshots, or dockClear polish.
- Retune damage, cooldown, range, or live prices.
- Rewrite the Phase 9 ten-column matrix or fire gates.
- Collapse Canon / Cannon / Turret.
- Move Tractor to cargo, `utilityBook`, or boarding.
- Treat any Flash number as a live price lock.
- Invent Bajoran Sail or Warp Core item ids, or merge Warp Core into “Warp Cores.”
- Invent Flash prices for inherited extras, or delete extras by silence.
- Grant universal shield bypass.
- Gift `firingSolution`, culture fire, or `engagement_authorized`.
- Open empty-but-armable, station construction visuals, or HTML review catalogs.
- Invent Thaleron Test Facility (place, quest, pin, or pass).
- Reopen EW PRs #33 / #35 / #37 / #42 / #43 / #44 / #45, boarding #38 / #39, Phase 10 #40 / #41, or flags #46 / #47.
- `git am` remastered patches, or treat remastered DESIGN as engine source.
- Claim a Referee Pass in `docs/BAKEOFF-STATUS.md`.

## 12. Open questions

Mark these clearly. They do **not** weaken the hard gates.

| ID | Question | Default if a later audit engine is scoped before an answer |
| --- | --- | --- |
| Q1 | Rename live id 7 display from “Disruptor Cannon” to “Disruptor Canon”? | **Out of this brief.** Identities are already three ids. Display rename is a later data slice. |
| Q2 | Reconcile Flash family Pulse vs live Type VII Turret / Phaser Cannon Cannon? | **Observation only.** Do not retune `type` here. |
| Q3 | Should Plasma Torpedo snapshot provenance split “Flash name / bake-off price”? | **Allowed as a label** on a later audit snapshot. Must not change live 7200. |
| Q4 | When (if ever) does Bajoran Sail become a live slot utility? | **Deferred.** Do not invent an id. Follow-on brief + BM1 evidence only. |
| Q5 | When (if ever) does singular Warp Core become equipment vs stay distinct from cargo Warp Cores? | **Deferred.** Do not merge. Do not invent an id. |
| Q6 | Merge identical defs (GUIDED intent) across Flash / BM2 / bake-off? | **List only** in this audit. Live merge is a later Tenth-scoped data slice. |
| Q7 | HTML weapon review catalog (plan §16.2 row 9)? | **Out.** Flash is evidence, not a required viewer. |
| Q8 | Fill vacant catalog ids 20, 21, 31–37, 40–43? | **No.** Leave vacant. Do not invent. |
| Q9 | Combat overhaul citing this ledger + Phase 9 matrix? | **Later Tenth-scoped lane.** This brief is the audit, not the overhaul. |

## 13. Implementation sequence and handoff

1. **Brief Pass.** Referee / One score the **eight hard gates**. Number 2 scores gate **7** (provenance / no bypass-as-permission / no gifted fire) and the doctrine half of **3**. Number Four scores gates **1–3** and the engine half of **8**, plus soft gate **9** as process. Do not open an engine PR on this document alone.
2. **Tenth scopes** a later thin data/audit engine **or** leaves this as docs-only. Blind implement from `docs/weapon-ledger/` + `data/game_items.json` against bake-off `main` after #47 (`6dc279b`).
3. **Suggested order if scoped:** snapshot that **subscribes** to the landed matrix + catalog (S22.1) → three disruptors + Tractor slot (S22.2) → Flash-not-lock + Plasma uncertified (S22.3) → deferred utilities classified (S22.4) → inherited list complete (S22.5) → provenance / no bypass / no fire gift (S22.6) → preservation replay (S22.7). **Do not** retune combat. **Do not** invent Sail / Warp Core ids. **Do not** ship an HTML catalog.
4. **Number Three** adds/runs S22 after engine. Keep S4–S21 green. Do not weaken S14 to make S22 pass.
5. Changelog / status Pass wait on Referee after review. This proposal PR may note that the brief is open; it must **not** write a Pass.

## 14. Lanes

| Who | Owns | Scores |
| --- | --- | --- |
| **Number 2** | Doctrine: gate **7** — provenance honesty as a fire-token forbid; no universal bypass; no FS / culture / `engagement_authorized`; Tractor hold ≠ board | A ledger row is not a shot |
| **Number Four** | Engine: gates **1, 2, 3** (read-only matrix, three identities, Tractor slot) plus later S22 subscribe-only hooks. Must not retune `game_items.json` or reopen EW / boarding / flags | Combat numbers unchanged; identities distinct; Tractor still Device |
| **Number Three** | Probe gate **after** engine (S22; S4–S21 stay green) | Not this brief |
| **Referee / One** | This brief vs the **eight hard gates** in §2. Gates **4, 5, 6** (Flash not lock; utilities deferred; inherited list). **Do-not-open** check: no #33–#47 reopen; no empty-armable / construction / dockClear / HTML catalogs / Thaleron facility; no `git am`; **no Referee Pass claimed** from this PR | **Before** any engine PR |

This brief is ready to score when a reader can mark Pass/Fail on: audit ≠ retune; three disruptor identities; Tractor still a slot; Flash prices not live locks; Bajoran Sail / Warp Core classified or deferred; inherited extras listed without invented Flash prices; provenance + no universal bypass + no gifted fire; landed EW / boarding / Phase 10 / flags not reopened and remastered-lock false.

## Sources and precedence

- This brief’s engine checklist: `docs/weapon-ledger/BM1-WEAPON-LEDGER-ENGINE-DEPENDENCIES.md`.
- Planning: `docs/GUIDED-CONVERGENCE.md` §1; `docs/revised-development-plan.md` §11, §13, §16.2 row 1.
- Live catalog: `data/game_items.json` `weapons[]` + `tradeGoods` at `6dc279b`.
- Phase 9 matrix (read-only): `src/phase9-weapons-matrix.js`; `docs/phase9/BM1-PHASE9-EW-WEAPONS-PROPOSAL.md` §6; S14.12–S14.15.
- Catalog mapping (subscribe, do not rewire): `src/ship-catalog-wire.js` `packDefaultWeaponSlots`; PR #28.
- Flags/passes (do not stuff weapons into the book): `docs/flags-passes/`; PRs **#46 / #47**.
- EW locked: `docs/phase9/`; PRs **#33 / #35 / #37 / #42 / #43 / #44 / #45**; S14–S20.
- Boarding locked: `docs/boarding/`; PRs **#38 / #39**; S17; `tractorIsBoarding() === false`.
- Phase 10 locked: `docs/phase10/`; PRs **#40 / #41**; S18.
- Remastered engine / DESIGN: **out of bounds.** Not a patch source. Not a constant lock. Not `758665e`.
- Bake-off process: `docs/BAKEOFF-STATUS.md` (this PR may note the weapon-ledger brief is open; **no Pass claimed**; #33–#47 remain locked).

Settled Phase 1–10 behavior, Phase 9–9.4 gates, PR #33 / #35 / #37 / #38 / #39 / #40 / #41 / #42 / #43 / #44 / #45 / #46 / #47, and these eight hard gates take precedence over older handoff text that treated Flash prices as live locks, collapsed the three disruptors, moved Tractor to cargo, or silently merged Warp Core into trade goods.
