# BM1 flags / passes / utility inventory

**Status:** proposal for implementation; no engine changes made by this document.  
**Repository:** `Artemis2028/BM1-bakeoff`  
**Planning baseline:** `1e3f67d` on `main` (17 September 2026), after Phase 9.4 EW magnitudes playtest engine (PR #45).  
**Referee context:** Phase 4 engine §6 **Pass** on `7f926df`. Phase 9–9.4 EW (PRs #33 / #35 / #37 / #42 / #43 / #44 / #45), boarding (PRs #38 / #39), and Phase 10 Dominion-first (PRs #40 / #41) are the **locked** baselines — **Keep #33, #35, #37, #38, #39, #40, #41, #42, #43, #44, and #45 locked.** This is a **flags / passes / utility-inventory brief only**, not a combat retune, not a reopen of EW / boarding / Phase 10, and **not** a claim that those lanes already had a Referee Pass on the status MD. This brief does **not** claim a new Referee Pass.  
**Companion:** `docs/flags-passes/BM1-FLAGS-PASSES-ENGINE-DEPENDENCIES.md` (hooks, risks, probe plan).  
**Scoped by:** Tenth Mountain Trooper, 2026-09-17 — proposal first; no engine until Tenth scopes after a brief Pass. Room-locked hard gates (inventory ≠ combat slots; save/load separate; knobs ≠ inventory + proposed shape; Thaleron verified-or-unverified; knowledge/inventory only; capacity/activation TBD; do-not-reopen + blind) are **in** this one scoreable brief.

Phases 1–10 and Phase 9–9.4 already landed: political authority, two-mode ROE, holding zones, incident ledger / FLASH, persistent convoy/`asset_overdue`, sensors/cloak + power suites, fleet hold-outside, compact finite markets, catalog wire + standing tiers, Phase 9–9.4 EW on the reserved `ew` consumer, boarding capture XOR scuttle / command transfer (`BOARDING_IMPLEMENTED === true`; `tractorIsBoarding() === false`), and Dominion-first knowledge layers. Convergence §2 and plan §16.2 row 2 named the remaining **flags / passes / utility inventory** gap: credentials are inventory, not one of the three combat/device slots; bake-off already has `settings.factionFlags` **price knobs**; that is **not** a working pass/flag inventory; **Thaleron Test Facility pass** is source material **to verify**, not to invent.

This is **one** thin knowledge/inventory brief: publish a **scoreable inventory shape** for faction flags, facility passes, and similar utilities; keep buy/hold off the three combat/device slots; require save/load of that book **beside** (not inside) `weaponSlots`; leave capacity and activation **TBD / injectable**; mark Thaleron **unverified — not shipped**; never gift `firingSolution`, culture fire, or `engagement_authorized` from owning or “activating” a credential. It is not a remastered `git am`, not a weapon-ledger retune, not empty-but-armable, not station-construction visuals, not dockClear polish, and not an HTML catalog.

## 1. The result we want

The player can **buy and hold** faction flags and (only if later verified) facility passes as **inventory credentials**, without spending a weapon/device slot, without stuffing them into cargo pods or the weapon locker, and without being gifted a lock, a war, or a map pin. Existing planet flag sales and `state.playerFlags` allegiance/plant behavior **stay**; this brief does **not** rewrite Phase 1 (flag-share ≠ control; plant ≠ market trust). `settings.factionFlags` knobs stay **price injectables**, not a silent catalog of live items.

**Exit condition (GUIDED-CONVERGENCE §2 / plan §16.2 row 2):** buying or holding a flag/pass does not consume a combat/device slot; save/load preserves the utility inventory separately from the three slots; Thaleron Test Facility pass is either verified from BM1 or marked “unverified — not shipped.” Capacity / activation stay **open**.

**Proposed first-release decisions:**

| Question | Proposed answer |
| --- | --- |
| What is the first playable slice? | One compact **utility inventory book** (`state.utilityBook`, name can change) **outside** `systemStates`, **beside** `weaponSlots` / `weaponInventory` / `cargoArray` / `playerFlags` / `stationPlans`. Buy/hold a flag (and, later, a verified pass) **never** writes a combat/device slot. Save/load restores the book separately from the three slots. |
| Are `settings.factionFlags` knobs the inventory? | **No.** They are **price knobs** (`basePrice` 1800, `marketMultiplier` 175, `blockedFactions` pirate/borg). Live `getFlagPrice()` currently returns a hardcoded **1000** and does not read those knobs. That gap is the point of this brief — knobs stay injectable; they are not a working pass/flag catalog. |
| What already exists that we must **subscribe**, not reinvent? | `state.playerFlags` allegiance charters; planet-only `buyFactionFlag` / `getLocalFlagOffer`; raise (`raisePlayerFlag`) and plant (`plantFlagForEmpire`); Phase 1 `flagShareGrantsSystemControl() === false`; `plantFlagDoesNotGrantMarketTrust()`. First slice **aliases** owned flags through that list. Do **not** fork a second flag store that desyncs raise/plant. |
| What is **missing**? | A durable home for **facility passes** and similar credentials; a named inventory shape distinct from the three slots / locker / cargo; a verification verdict on Thaleron; a live price path that treats knobs as injectables rather than unused settings chrome. |
| Proposed inventory shape (names can change)? | See §3. Rows are `{ kind, id }` credentials. `kind: 'faction_flag'` **subscribes** `playerFlags`. `kind: 'facility_pass'` is **empty** until a pass is verified. No other kinds in first slice. |
| Capacity / stack limits? | **TBD / injectable.** Do not invent. |
| Activation / fitted-vs-held / hotkeys? | **TBD / injectable.** Do not invent UX, keybinds, or “must be actively fitted” rules in this brief. |
| Thaleron Test Facility pass? | **Unverified — not shipped.** See §5. Do not invent a facility, quest, vendor, or map pin from the name. |
| Mining / asteroid pass? | Flash `_root.asteroidpass` is a **boolean prestige gate**, not an inventory item. **Unverified as a sold credential — not shipped.** Do not invent a shop from that one line. |
| May owning/activating a flag or pass gift fire? | **No.** Knowledge / inventory layer only. Never `firingSolution`, culture fire, or `engagement_authorized`. |
| May we reopen EW #33/#35/#37/#42/#43/#44/#45, boarding #38/#39, or Phase 10 #40/#41? | **No.** |
| Empty-but-armable, weapon ledger retune, construction visuals, dockClear, HTML catalogs? | **Out.** |
| May we lock Flash / remastered / guided prices? | **No.** 1800 / 175 / live 1000 / guided 90,000 are **source material or current data**, not final locks. |
| May we `git am` remastered patches or set a remastered-lock true flag? | **No.** `UTILITY_LOCKED_FROM_REMASTERED === false` (name can change). |
| Is this a Referee Pass? | **No.** Referee / One / Number 2 / Number Four score the hard gates **before** any engine PR. Number Three probes only after engine. |

These are recommendations for this inventory package, not new decisions attributed to the user. Locked bake-off constraints take precedence over older flavor that treated a flag as a fourth hardpoint, a price knob as a live catalog, or a named pass as a shipped facility.

Cite GUIDED-CONVERGENCE §2 and plan §16.2 row 2 as the planning sources this brief **reconciles**, not as a second spec:

| Planning source | This brief |
| --- | --- |
| GUIDED §2: flags/passes/utilities are **inventory**, not one of the three combat/device slots | Gate 1. |
| GUIDED §2: save/load preserves the utility inventory separately from the three slots | Gate 2. |
| GUIDED §2: capacity / activation **open** | Gate 6. §8 Q-rows. |
| GUIDED §2: `settings.factionFlags` knobs are **not** a working pass/flag inventory | Gate 3. §3. |
| GUIDED §2: Thaleron Test Facility pass is source material **to verify**, not to invent | Gate 4. §5. |
| GUIDED §1: Tractor stays a **slot** item; Bajoran Sail / Warp Core stay ledger/classify-or-defer | Non-goals. Do not move devices into this book. |
| Phase 1: flag-share ≠ control; plant ≠ market trust; allegiance ≠ ownership | Gate 5 + preservation. Subscribe `playerFlags`. |
| Phase 9 / 10 / boarding: stories and knowledge layers never gift FS / culture / `engagement_authorized` | Gate 5. Same doctrine lean. |
| Plan §16.2 rows 1, 3, 5, 9 | **Out.** Do not open weapon ledger, empty-armable, construction visuals, or HTML catalogs. |

## 2. Locked constraints (do not reopen)

The bake-off room locked these before this brief. Implementation and probes must treat **gates 1–7** as **hard gates**. Referee / One score this brief against those **seven** **before** any engine PR. Number Three probes only after engine. EW / boarding / Phase 10 gates stay **closed**; they are restated only as **gate 7** (preserve / do-not-open), not as a reopen. This docs PR **does not** claim a Referee Pass.

### Hard gate 1 — Inventory, not a combat/device slot

> Buying or holding a faction flag, facility pass, or similar utility **must not** consume one of the **three** combat/device slots. It must not steal a `weaponInventory` locker row, a cargo pod, the dedicated suite slot, or the dedicated `ew_equipment` slot. Tractor Beam stays **id 25 / type Device / slot item**.

Lane owner (wording): **Number Four**.

Bake-off already sells planet flags into `state.playerFlags` without touching `weaponSlots`. First slice must **keep** that and extend it: a later verified pass writes `utilityBook`, not `weaponSlots[n]`. A probe that buys a flag and finds a slot overwritten **fails** even if the UI “looks like inventory.”

### Hard gate 2 — Save/load is a separate book

> Save/load must preserve the utility inventory **separately** from the three combat slots. The book lives **outside** `systemStates` (that cache still wipes on `loadGame`). Old saves without the book start with **empty passes** and **alias** existing `playerFlags`. Loading must not fold credentials into `weaponSlots`, `weaponInventory`, or `cargoArray`.

Lane owner (wording): **Number Four**.

`saveGame` already serializes `playerFlags` beside `weaponSlots` (~14054 / ~14060). That is **not** enough for passes. First slice adds a named key (`utilityBook` / equivalent) restored in `loadGame` / cleared on `resetRunState`. A reload that keeps three slots but drops a held credential **fails**. A reload that stuffs a pass into slot 2 **fails**.

### Hard gate 3 — Price knobs ≠ working inventory; proposed shape is explicit

> `data/game_items.json` `settings.factionFlags` (`basePrice` 1800, `marketMultiplier` 175, `blockedFactions` pirate/borg) are **price knobs**, not a working pass/flag inventory. The first-release shape in §3 is the inventory. Knobs stay **injectable / TBD soft**. Do not treat the Settings chrome “Flag Base / Flag Market” readout as proof that passes exist. Do not lock 1800, 175, the live hardcoded 1000, or any guided Latinum figure as final.

Lane owner (wording): **Number Four** on shape / inject; **Number 2** on “a price is not a credential and not a fire token.”

`getFactionFlagSettings()` feeds `isFactionFlagBlocked` only. `getFlagPrice()` computes `market` / `factionPremium` and then **returns 1000**. That is the gap this brief names. An engine that “implements flags” by retuning those three numbers without a separate book **fails** this gate.

### Hard gate 4 — Thaleron Test Facility pass is unverified — not shipped

> The **Thaleron Test Facility pass** is **unverified — not shipped.** Do **not** invent a facility, a quest, a vendor, or a map pin from the name. Do not stock a pass at Nausica, Nausica Orbital, or any Bar because a guided note mentioned “Nausica Orbital Bar.” If later BM1 evidence verifies existence / vendor / unlock, a follow-on brief may add **one** `facility_pass` row. Until then the pass list stays empty.

Lane owner (wording): **Referee / One**.

§5 lists the in-repo evidence. A writer who ships “Thaleron Test Facility” as a place, a mission, or a sold item from this brief **fails** even if slots and save/load are green.

### Hard gate 5 — Knowledge / inventory only — never gift fire

> Owning or activating a flag or pass must **never** gift `firingSolution`, culture fire, or `engagement_authorized`. It cannot rewrite Phase 1 side, Reman **53**, or `playerFaction` / `playerSide` except through the **already landed** raise-flag allegiance path. A pass is not a weapons-free token, not a Phase 3 ceasefire, not a boarding warrant, and not a Dominion discovery write.

Lane owner (wording): **Number 2**.

Same doctrine lean as Phase 9 EW stories and Phase 10 knowledge layers. Phase 6 already separates detection ≠ identification ≠ track quality ≠ `firingSolution`. Doctrine already forbids injecting `engagement_authorized` from world state. This brief **subscribes**. Raising an owned flag may still change **allegiance** (landed `raisePlayerFlag`); that is not fire permission. Planting still does not grant market trust or system ownership-by-flag-share.

### Hard gate 6 — Capacity and activation stay open

> Capacity, stack limits, fitted-vs-held, hotkeys, and activation UX are **TBD / injectable**. This brief **must not** invent them. First engine may expose empty inject hooks (`capacity: null`, `activation: 'unset'`) so a later slice can fill them. A “utility bar of 4” / “press F to badge” / “must be in slot U1” constant in this package **fails**.

Lane owner (wording): **Referee / One** on do-not-invent; **Number Four** on leaving the hooks unset.

GUIDED §2: “do not invent stack limits or hotkeys in the first brief.” §8 Q-rows carry the open questions. Silence here is **not** permission to lock a number.

### Hard gate 7 — Do not reopen landed lanes; blind bake-off

> Do **not** reopen EW #33 / #35 / #37 / #42 / #43 / #44 / #45 (ghosts book-only; no report wipe; soft numbers ≠ new fire rules; `MAGNITUDES_LOCKED_FROM_REMASTERED === false`). Do **not** reopen boarding #38 / #39 (`tractorIsBoarding()` stays false; capture XOR scuttle; XP `not_tracked_yet`). Do **not** reopen Phase 10 #40 / #41 (stories stay knowledge layers; no gifted FS from rumor). Do **not** open empty-but-armable, weapon-ledger retune, station construction visuals, dockClear polish, or HTML catalogs. Do **not** `git am` remastered patches. `UTILITY_LOCKED_FROM_REMASTERED === false`. Implement later from `docs/` + `data/game_items.json` price knobs only — **not** `BM1-remastered-work` engine.

Lane owner (wording): **Referee / One**.

### Soft gate 8 — Suites stay green (after engine)

> **Soft:** existing suites stay green (S4–S20 / catalog / doctrine / boarding / Phase 10 / Phase 9.4). Screenshot / no-clip is **N/A** on this docs PR. A later engine PR attaches UI shots **only if** a utility-inventory readout ships; dockClear polish stays **out**.

Lane owner (wording): **Number Four** (process); **Number Three** scores suite-green **after** engine.

### Also from the room (score with the gates)

| Plan / room want | How this brief locks it |
| --- | --- |
| Flags / passes / utilities are inventory, not combat slots | Gate 1. |
| Save/load separate from the three slots | Gate 2. |
| `factionFlags` knobs ≠ working inventory; proposed shape | Gate 3. §3. |
| Thaleron verify or “unverified — not shipped”; do not invent | Gate 4. §5. |
| Never gift FS / culture / `engagement_authorized` | Gate 5. |
| Capacity / activation open | Gate 6. §8. |
| Do not reopen EW / boarding / Phase 10; no empty-armable / ledger / construction / dockClear / HTML catalogs; blind; remastered-lock false; prices injectable | Gate 7. |
| Suites green; no Referee Pass from this PR | Soft gate 8. Scoring note below. |

### Must not break (cite landed work)

Score as **preservation**. A later utility-inventory Pass that regresses them is a Fail. **#33, #35, #37, #38, #39, #40, #41, #42, #43, #44, and #45 stay locked.**

| Locked rule | Cite | This brief / later engine must not |
| --- | --- | --- |
| Three combat/device slots; tractor is a slot item | GUIDED §1; Phase 9 gate 4; Phase 6.5 suite ≠ weapon | Move tractor / cloak / Thaleron **Generator** into the utility book. Spend a hardpoint on a flag. |
| Empty stays empty (when later scoped) | GUIDED §3 | Auto-fill a Phaser because a flag was bought. (Empty-armable itself stays **out**.) |
| Flag-share ≠ control; plant ≠ market trust | Phase 1; `flagShareGrantsSystemControl()`; `plantFlagDoesNotGrantMarketTrust()` | Treat owning a flag or pass as system ownership or imperial-market trust. |
| Culture cannot grant fire; `engagement_authorized` never injected | Phase 1 / doctrine; Phase 9 gate 5; Phase 10 gate 1 | Write the fact from `utilityBook` or a pass id. |
| Detection ≠ identification ≠ track ≠ `firingSolution` | Phase 6; Phase 9; Phase 10 | Gift FS from a badge. |
| Ghosts book-only; delivered reports survive | Phase 9–9.4 | Wipe FLASH because a flag raised. Spawn a hull from a pass. |
| Tractor ≠ boarding; capture XOR scuttle | #38 / #39 | Tractor-as-capture. Board because a pass is held. |
| Dominion stories = knowledge layers | #40 / #41 | Reveal Gamma or authorize a deployment because a pass exists. |
| Money ≠ standing ≠ Reman | PR #28; Phase 8 | Credits + a flag bypass `meetPackPurchaseDecision` or standing tiers. |
| Finite markets subscribe-only | Phase 8 | Restock a pass shop from `state.day` / jump. |
| Catalog 172 / 38 aliases / Reman **53** | PR #28; S11 | Second Reman id. Pass-as-Reman-unlock. |
| `MAGNITUDES_LOCKED_FROM_REMASTERED === false` | #44 / #45 | Flip EW / boarding / Phase 10 / new utility lock flags true. |

### Process locks (not a change to gates 1–7)

- **Proposal first.** Do not implement from this text until Tenth scopes the engine lane after a brief Pass.
- **Blind bake-off.** Implement against bake-off `main` (`1e3f67d` after #45), **not** remastered `758665e`. From `docs/` + `data/game_items.json` price knobs only. Do **not** crib `Artemis2028/BM1-remastered-work`.
- **No invented balance numbers as locked constants.** 1800 / 175 / 1000 / guided 90,000 are **not final**.
- **#33 / #35 / #37 / #38 / #39 / #40 / #41 / #42 / #43 / #44 / #45 stay locked.**
- **Subscribe, do not fork.** Alias `playerFlags`. Do not implement a second allegiance religion, a second cargo, or a fourth hardpoint.
- **No Pass claimed** in `docs/BAKEOFF-STATUS.md` from this PR.

### Scoring note

Referee / One / Number 2 / Number Four score the **seven hard gates** **before** any engine PR. Number Three probes **only after** engine. **No Referee Pass is claimed by this docs PR.**

## 3. Proposed inventory shape (gate 3)

**Lane owner (wording):** Number Four.

This is the first-release shape. Names can change. Capacity and activation are **not** in this table — see §8.

### 3.1 The book

A compact `state.utilityBook` (name can change) **outside** `systemStates`:

| Field | Meaning | First slice |
| --- | --- | --- |
| `items[]` | Credential rows `{ kind, id, qty? }` | `kind` is `'faction_flag'` or `'facility_pass'` only. |
| `kind === 'faction_flag'` | Allegiance charter already sold via `buyFactionFlag` | **Subscribe** `state.playerFlags`. `id` is the faction key. Do **not** keep a second write-path that can desync raise/plant. |
| `kind === 'facility_pass'` | Named facility credential | **`[]` until verified.** Thaleron is **not** a row. |
| `qty` | Stack count | **TBD / injectable.** First slice may omit or force `1` **without** publishing a stack cap as a lock. |
| `activation` / fitted | Whether a row must be “on” | **Unset.** See Q2. |
| `UTILITY_LOCKED_FROM_REMASTERED` | Blind-bake-off flag | **`false`.** |

Never store this book inside `weaponSlots`, `weaponInventory`, `cargoArray`, `stationPlans`, `ewEquipmentId`, or `sensorSuiteId`. Those stores stay themselves.

### 3.2 What the current engine already has (gap)

| Surface at `1e3f67d` | What it is | What it is not |
| --- | --- | --- |
| `settings.factionFlags` in `data/game_items.json` | Price knobs + blocked faction list | A catalog of flag/pass **items**. No pass ids. |
| Settings chrome “Flag Base / Flag Market / Blocked Flag Factions” | Debug inject for those knobs | Proof that a pass inventory works. |
| `state.playerFlags` + `buyFactionFlag` / `raisePlayerFlag` / `plantFlagForEmpire` | Allegiance charters sold on **planets** (not stations); raise changes allegiance; plant spends the flag and writes `factionSystemOverrides` | Facility passes. A fourth hardpoint. Ownership (Phase 1). Market trust. |
| `getFlagPrice()` | Live buy price **hardcoded 1000** | A reader of `basePrice` / `marketMultiplier`. |
| `isFactionFlagBlocked` (pirate, borg) | Sale refuse | A pass jurisdiction rule. |
| Inventory panel `renderPlayerFlagsPanel` | Lists owned flags + Raise | A utility book, a pass list, or activation UX. |
| `weaponSlots` length 3 | Combat/device hardpoints | Credentials. |
| `weaponInventory` + `weaponInventoryLimit` (default 9) | Spare **weapons** | Flags/passes. |
| `cargoArray` | Trade pods | Credentials. |
| `stationPlans` | Build plans | Passes. |
| Suite / `ew_equipment` | Dedicated non-weapon slots (Phase 6.5 / 9.1) | Do not steal them for flags. |

### 3.3 Buy / hold contract (first slice)

| Action | Writes | Must not write |
| --- | --- | --- |
| Buy a planet faction flag (landed path) | `playerFlags` + alias into `utilityBook.items` (`faction_flag`) + latinum debit + Phase 8 stock subscribe if the sale is later book-tied | `weaponSlots`, `weaponInventory`, `cargoArray`, `engagement_authorized`, `firingSolution`, Reman unlock, `playerFaction` (buy ≠ raise) |
| Raise an owned flag | Landed `raisePlayerFlag` (allegiance) | Combat slots; fire facts; system control |
| Plant an owned flag | Landed `plantFlagForEmpire` (override + standing; flag consumed) | Market trust; ownership-by-share; fire facts |
| Buy a facility pass | **Not opened** until a pass is verified | A invented Thaleron row; a map pin; a slot |
| Save / load / new game | `utilityBook` beside `playerFlags` / `weaponSlots` | Fold into slots; persist `performance.now()` |

Player-facing line (names can change):

- `Credentials. Inventory — not a weapon slot, not a firing solution.`

If the UI says “weapons free because you hold a pass” / “Thaleron Test Facility unlocked on the map” / “empty hardpoint filled,” the book is not ready.

## 4. Knowledge / inventory only (gate 5)

**Lane owner (wording):** Number 2.

A credential may later (in a **follow-on** brief, after verification and after capacity/activation are answered) exempt a **named, narrow** jurisdiction — GUIDED’s incoming note already warns not to make a pass “blanket permission for every hostile act.” This brief **does not** invent that jurisdiction.

First slice may **not**:

- Gift `firingSolution` / `liveWeaponTrack` / `engagement_authorized` / culture fire.
- Rewrite `playerFaction` / `playerSide` except via landed raise.
- Grant Reman **53**, standing tiers, or `meetPackPurchaseDecision`.
- Reveal Dominion / Gamma chrome, authorize a deployment, or seed a campaign stage.
- Turn a checkpoint refuse into `attackId`, or a pass into Phase 3 ceasefire.
- Board because a pass is held; flip `tractorIsBoarding()`.
- Wipe delivered reports / FLASH; spawn hulls; add a sixth power consumer.
- Treat Flash `_root.asteroidpass` as live inventory or as a fire token.

Owning a flag is a **charter the player holds**. Raising it is **allegiance**. Planting it is **a landed political write**, still not ownership-by-share and not fire.

## 5. Thaleron Test Facility pass — verification

**Lane owner (wording):** Referee / One.  
**Verdict: unverified — not shipped.**

Room lock: verify from bake-off / BM1 source evidence **already in-repo**, or mark unverified. Do **not** invent a facility, quest, or map pin from the name.

### 5.1 What the in-repo record actually says

| Claim | Where | What it proves |
| --- | --- | --- |
| “Thaleron Test Facility pass is source material **to verify** (does it exist, where sold, what unlocks). Do not invent a facility / quest / map pin.” | `docs/GUIDED-CONVERGENCE.md` §2; plan §16.2 row 2 | Planning instruction. **Not** BM1 proof. |
| “Source notes also describe a Thaleron Test Facility pass at the Nausica Orbital Bar for 90,000 Latinum. Record that as source material to verify… do not accidentally make it blanket permission for every hostile act.” | `docs/incoming/full-roster-v2-guided.patch` (guided roadmap excerpt) | A **guided/source-note claim** to verify later. Not a bake-off item. Not a Flash dump. Price **90,000** is **not** a lock. |
| Planet **Nausica** exists | `data/planetData.json` index 16; `data/mapnames.json` | A world. Description is independent traders / “ugly world.” **No** Test Facility, **no** pass shop. |
| Station **Nausica Orbital** exists | `data/stationData.json` | An orbital station named “Nausica Orbital.” **Not** “Nausica Orbital Bar.” |
| Station type **Bar** exists; other bars exist | `data/station_manifest.json` id 76 “Bar”; `stationData.json` Worf’s Bar, Kises Bar, **Nayobek orbital Bar**, etc. | Bars are a station class. **No** Nausica Orbital Bar row. |
| **Thaleron Generator** id 26, price 15500 | `data/game_items.json` weapons; Flash table GUIDED §1 | A **heavy device / cloud weapon**. Not a facility pass. Do not merge them. |
| Reman Warbird pays for cloak + Thaleron **equipment** | `data/starship_manifest.json`; ship-balance docs | Hull fit. Not a pass. |
| `_root.asteroidpass != 1` skips a mining prestige penalty | `data/fla_actions_index.json` Symbol 106 | Flash **boolean** on asteroid harvest. Not named “Thaleron.” Not a sold item. Not an inventory row. |
| No `facility_pass` / “Thaleron Test” item | `data/game_items.json` trade goods + weapons | **Not shipped.** |

### 5.2 What we did **not** treat as verification

- The name “Thaleron Test Facility pass” appearing in GUIDED / the incoming patch.
- Proximity of Nausica + a generic Bar station type + “Nayobek orbital Bar.”
- The Thaleron **Generator** weapon / Reman fit.
- Any `BM1-remastered-work` engine (blind rule — out of bounds for this brief).

### 5.3 First-slice consequence

- Do **not** add a map pin, station, quest, or shop stock for “Thaleron Test Facility.”
- Do **not** sell a pass at Nausica / Nausica Orbital / any Bar from this brief.
- Do **not** lock 90,000 Latinum.
- `utilityBook` `facility_pass` list stays **`[]`**.
- Player-facing copy must not claim the pass exists.
- A later brief may reopen **only this verification row** if new in-repo BM1 evidence arrives.

## 6. Acceptance exercises (S21)

Keep Phase 1 / S4–S20 / doctrine / catalog / boarding / Phase 10 / Phase 9.4 green. **S14 stays Phase 9. S15 stays 9.1. S16 stays 9.2. S17 stays boarding. S18 stays Phase 10. S19 stays 9.3. S20 stays 9.4** — replay, do not rewrite. Add S21 fixtures that fail setup if the utility-book helper is missing.

Number Three owns the probe gate **after** engine, not this brief. IDs are a sketch.

| Case | Required exercise and result |
| --- | --- |
| **S21.1** Buy/hold does not consume a combat slot | Buy a legal planet flag (or probe-grant the same path). `weaponSlots` unchanged (including empties). `weaponInventory` / `cargoArray` / suite / `ew_equipment` unchanged. `utilityBook` (or `playerFlags` alias) gained the flag. |
| **S21.2** Save/load is a separate book | After S21.1, `saveGame` / `loadGame`: `utilityBook` + `playerFlags` persist; `weaponSlots` persist independently. Old save without the book: passes `[]`, flags alias `playerFlags`. `systemStates` wipe does not drop the book. |
| **S21.3** Knobs ≠ inventory; shape present; prices injectable | Snapshot shows `utilityBook` shape from §3. `settings.factionFlags` still knobs (blocked pirate/borg). Inject `basePrice` / a book price override **changes the snapshot**; omit inject ⇒ documented default (live 1000 or knob — **declared**, not silently both). `UTILITY_LOCKED_FROM_REMASTERED === false`. No remastered patch. |
| **S21.4** Thaleron unverified — not shipped | Snapshot `thaleronTestFacilityPass: { shipped: false, verified: false }`. No item id, no vendor, no map pin, no quest flag. Guided 90,000 **absent** as a live lock. |
| **S21.5** Knowledge / inventory only | After buy / (if later) inject-activate: no `firingSolution`; no `engagement_authorized`; no culture fire; `playerFaction` unchanged until landed **raise**; Reman 53 unchanged; `tractorIsBoarding() === false`; Dominion rumor still not a lock. Raise/plant still Phase 1 (flag-share ≠ control; plant ≠ market trust). |
| **S21.6** Capacity / activation unset | Snapshot `capacity: null` (or equivalent unset) and `activation: 'unset'`. No hotkey map. No invented stack cap constant. |
| **S21.7** Landed lanes preserved | Replay S14–S20 / S17 / S18 at defaults. No EW / boarding / Phase 10 reopen. No empty-armable / ledger / construction / dockClear / HTML-catalog work in the diff. |

Do not claim a Referee Pass from this list.

## 7. Non-goals

This brief will not:

- Implement engine code, UI screenshots, or dockClear polish.
- Invent stack limits, hotkeys, or activation UX.
- Ship Thaleron Test Facility (place, quest, pin, or pass).
- Invent a mining-pass shop from `_root.asteroidpass`.
- Gift `firingSolution` or `engagement_authorized` from a flag or pass.
- Move tractor / cloak / Thaleron **Generator** / Bajoran Sail / Warp Core into this book.
- Reopen EW PRs #33 / #35 / #37 / #42 / #43 / #44 / #45, boarding #38 / #39, or Phase 10 #40 / #41.
- Open empty-but-armable, weapon-ledger retune, station construction visuals, or HTML review catalogs.
- Rewrite Phase 1 raise/plant, `meetPackPurchaseDecision`, standing tiers, or Phase 8 restock.
- `git am` remastered patches, or treat remastered DESIGN as engine source.
- Lock Flash / guided / live prices as final.
- Claim a Referee Pass in `docs/BAKEOFF-STATUS.md`.

## 8. Open questions

Mark these clearly. They do **not** weaken the hard gates.

| ID | Question | Default if engine is scoped before an answer |
| --- | --- | --- |
| Q1 | Capacity / stack limits for flags and passes? | **TBD / injectable.** Snapshot leaves `capacity` unset. Do not invent a locker size. |
| Q2 | Activation: held-is-enough vs must-be-fitted? Hotkeys? | **TBD / injectable.** Snapshot leaves `activation: 'unset'`. No keybinds. |
| Q3 | Should `utilityBook.items` **copy** `playerFlags` or only **alias** them? | **Alias** (single write-path through `playerFlags`) unless a probe cannot see the book otherwise. Either is fine if raise/plant cannot desync and slots stay untouched. |
| Q4 | When (if ever) does `getFlagPrice` read `basePrice` / `marketMultiplier`? | **Injectable.** Declare the live default (today: 1000). Do not lock 1800 / 175 / 1000. |
| Q5 | Are station plans, suite, or EW equipment ever “utilities” in this book? | **No** in first slice. They already have stores. |
| Q6 | Mining / asteroid pass from `_root.asteroidpass`? | **Unverified — not shipped.** Same rule as Thaleron: do not invent a shop. |
| Q7 | Jurisdiction / exemption if a pass is later verified? | **Out of this brief.** GUIDED warning stands: not blanket permission for every hostile act. Follow-on only. |
| Q8 | Difficulty knobs / HTML catalogs / construction / empty-armable / weapon matrix? | **Out.** |

## 9. Implementation sequence and handoff

1. **Brief Pass.** Referee / One score the **seven hard gates**. Number 2 scores gate **5** (knowledge/inventory only) and the doctrine half of **3**. Number Four scores gates **1–3** and the engine half of **6–7**, plus soft gate **8** as process. Do not open an engine PR on this document alone.
2. **Tenth scopes the engine lane** after Pass. Blind implement from `docs/` + `data/game_items.json` price knobs against bake-off `main` after #45 (`1e3f67d`).
3. **Suggested order if scoped:** `utilityBook` + alias `playerFlags` (S21.1) → save/load separate key (S21.2) → snapshot shape + injectable knobs + remastered-lock false (S21.3) → Thaleron `shipped: false` (S21.4) → no-fire / Phase 1 subscribe (S21.5) → capacity/activation unset (S21.6) → preservation replay (S21.7). **Do not** ship a Thaleron facility. **Do not** ship hotkeys.
4. **Number Three** adds/runs S21 after engine. Keep S4–S20 green. Do not weaken S14–S20 to make S21 pass.
5. Changelog / status Pass wait on Referee after review. This proposal PR may note that the brief is open; it must **not** write a Pass.

## 10. Lanes

| Who | Owns | Scores |
| --- | --- | --- |
| **Number 2** | Doctrine: gate **5** — knowledge/inventory only; no FS / culture / `engagement_authorized`; Phase 1 raise/plant subscribe; knobs ≠ fire token | A held flag is not a shot and not ownership |
| **Number Four** | Engine: gates **1, 2, 3** (slots, save/load, shape / injectables) plus unset capacity/activation hooks and remastered-lock false. Must not hook EW / boarding / Dominion or invent Thaleron | Buy/hold off slots; book persists; knobs stay knobs |
| **Number Three** | Probe gate **after** engine (S21; S4–S20 stay green) | Not this brief |
| **Referee / One** | This brief vs the **seven hard gates** in §2. Gate **4** (Thaleron unverified). Gate **6** do-not-invent. **Do-not-open** check: no #33/#35/#37/#38/#39/#40/#41/#42/#43/#44/#45 reopen; no empty-armable / ledger / construction / dockClear / HTML catalogs; no `git am`; **no Referee Pass claimed** from this PR | **Before** any engine PR |

This brief is ready to score when a reader can mark Pass/Fail on: inventory ≠ combat slots; save/load separate; knobs ≠ inventory + explicit shape; Thaleron unverified — not shipped; knowledge/inventory only; capacity/activation TBD; landed EW / boarding / Phase 10 not reopened and remastered-lock false.

## Sources and precedence

- This brief’s engine checklist: `docs/flags-passes/BM1-FLAGS-PASSES-ENGINE-DEPENDENCIES.md`.
- Planning: `docs/GUIDED-CONVERGENCE.md` §2; `docs/revised-development-plan.md` §16.2 row 2.
- Guided source-note (unverified): `docs/incoming/full-roster-v2-guided.patch` Thaleron Test Facility pass / Nausica Orbital Bar / 90,000 Latinum.
- Price knobs: `data/game_items.json` `settings.factionFlags`; `src/main.js` `DEFAULT_ITEM_SETTINGS.factionFlags`, `getFlagPrice` (live 1000), `buyFactionFlag`, `playerFlags` save/load.
- Flash asteroid boolean (not an item): `data/fla_actions_index.json` `_root.asteroidpass`.
- Phase 1 flag rules: `flagShareGrantsSystemControl`, `plantFlagDoesNotGrantMarketTrust`, `raisePlayerFlag`, `plantFlagForEmpire`.
- EW locked: `docs/phase9/`; PRs **#33 / #35 / #37 / #42 / #43 / #44 / #45**; S14–S20.
- Boarding locked: `docs/boarding/`; PRs **#38 / #39**; S17; `tractorIsBoarding() === false`.
- Phase 10 locked: `docs/phase10/`; PRs **#40 / #41**; S18. Stories stay knowledge layers.
- Remastered engine / DESIGN: **out of bounds.** Not a patch source. Not a constant lock. Not `758665e`.
- Bake-off process: `docs/BAKEOFF-STATUS.md` (this PR may note the flags/passes brief is open; **no Pass claimed**; #33 / #35 / #37 / #38 / #39 / #40 / #41 / #42 / #43 / #44 / #45 remain locked).

Settled Phase 1–10 behavior, Phase 9–9.4 gates, PR #33 / #35 / #37 / #38 / #39 / #40 / #41 / #42 / #43 / #44 / #45, and these seven hard gates take precedence over older handoff text that treated a flag as a hardpoint, a price knob as a live catalog, or a named Thaleron pass as a shipped facility.
