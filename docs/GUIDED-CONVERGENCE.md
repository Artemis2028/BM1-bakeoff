# Guided remastered-work roadmap — bake-off convergence notes

**Status:** docs-only product knowledge. **Not implemented** on bake-off except where this file says a bake-off Pass already covers the package.  
**Repository:** `Artemis2028/BM1-bakeoff`  
**Planning baseline:** `9d130be` on `main` (12 September 2026).  
**Companion:** `docs/revised-development-plan.md` §16 (short backlog).  
**Source:** guided “BM1 Remastered — game plan and feature roadmap” for `Artemis2028/BM1-remastered-work`, dated 12 September 2026. Ported here so bake-off can converge on a similar end state.  
**Blind bake-off:** implement later work from `docs/` only. Do **not** crib `BM1-remastered-work` engine code.

This file holds the detailed weapons table, boarding rules, standing tiers, and catalog/purchase notes. The development plan keeps the short “Agreed next / Proposed” list and pointers.

## Dual-track

| Track | What it already has | What it may land earlier |
| --- | --- | --- |
| **Bake-off** (`BM1-bakeoff`) | Phase 1–5 **engine**, side-lane **engine** (`repairCapable` + arms overlay, Reman durable unlock, unrest → independence mint), additive `bm-ships/` pack, Phase 6 **brief** scored/merged | Later packages in this file, when Tenth scopes them |
| **Guided** (`BM1-remastered-work`) | Its own engine path | Ships catalog wire and economy/standing may land there first |

Do not treat guided progress as bake-off completion. Do not reopen bake-off Passes because guided numbered the same ideas differently.

## Already complete on bake-off — do not re-propose

These are **done or brief-ready**. They are not “Agreed next from scratch.”

| Package | Bake-off status | Where to read |
| --- | --- | --- |
| Phase 1 political authority | **Passed** engine | Plan §3; [PR #2](https://github.com/Artemis2028/BM1-bakeoff/pull/2) |
| Phase 2 two-mode ROE / Security | **Passed** engine | Plan §3; [PR #6](https://github.com/Artemis2028/BM1-bakeoff/pull/6) |
| Phase 3 holding zones / compliance | **Passed** engine | `docs/phase3/`; [PR #8](https://github.com/Artemis2028/BM1-bakeoff/pull/8) / [PR #9](https://github.com/Artemis2028/BM1-bakeoff/pull/9) |
| Phase 4 incidents / escalation / FLASH | **Passed** engine | `docs/phase4/`; [PR #13](https://github.com/Artemis2028/BM1-bakeoff/pull/13) |
| Phase 5 persistent convoy / distress + `asset_overdue` | **Engine landed** | `docs/phase5/`; [PR #21](https://github.com/Artemis2028/BM1-bakeoff/pull/21) |
| Side-lane: `repairCapable` + repair-arms overlay | **Engine landed** | `docs/side-lane-repair-reman-independence/`; [PR #18](https://github.com/Artemis2028/BM1-bakeoff/pull/18) |
| Side-lane: Reman durable unlock | **Engine landed** (soft `meetPackPurchaseDecision` remains) | Same; [PR #18](https://github.com/Artemis2028/BM1-bakeoff/pull/18) |
| Side-lane: unrest → independence mint | **Engine landed** | Same; [PR #19](https://github.com/Artemis2028/BM1-bakeoff/pull/19) |
| Phase 6 sensors / cloak / contact uncertainty / system space | **Brief ready** (PR #22). Engine **not** implemented. | `docs/phase6/` |
| Additive `bm-ships/` pack | **On main** (PR #15). **Full-roster-v2 content import landed** (approved hull merges + balance docs). **No** catalog wire — live 66-hull path until a later slice. | `bm-ships/README.md`, `docs/APPROVED-HULL-MERGES.md`, `docs/ship-balance/` |

Guided text about incidents, independence, repair arms, and Reman recovery describes work **already on bake-off**. Cite the Pass / merge. Do not open a second incident ledger, a second independence mint, or a second repair-arms overlay.

## 1. Weapon / device source ledger — Locked (engine landed)

**Engine landed** on bake-off (`docs/weapon-ledger/`; brief PR #48, engine PR #49 @ `a3d9611`). **Stay locked** — do not reopen from the empty-armable, construction-visuals, or HTML-catalog briefs. Phase 9 weapons matrix stays **read-only**. Flash prices remain **source material, not final prices**. Disrupter Canon / Cannon / Turret stay **three** identities. Tractor stays a **weapon/device slot**. Bajoran Sail / Warp Core are **explicitly deferred utilities**. `LEDGER_LOCKED_FROM_REMASTERED` stays false. **No Referee Pass claimed.** **Keep #48 / #49 locked.**

### Intent

- Audit BM1 and BM2 definitions.
- Merge **identical** defs.
- Preserve **real variants**. Flash distinguished **Disrupter Canon** (1500), **Disrupter Cannon** (3000, dual), and **Disrupter Turret** (7800). Do not collapse those three into one “disruptor.”
- Tractor Beam stays a **weapon / device slot** item (price 3400, Special), not cargo and not a fourth mystery slot.
- Flash prices and (where later supplied) descriptions are **source material, not final prices**.

### Flash price table (source material)

Spellings below are **Flash source spellings**. Bake-off `data/game_items.json` often uses “Disruptor.” Mapping comments are observations against the bake-off item file, not a claim that those runtime rows are certified.

| Flash name | Flash price | Flash family (as supplied) | Bake-off observation (not a lock) |
| --- | --- | --- | --- |
| Phaser Cannon | 1300 | Pulse | `game_items.json` id 10, price 1300 |
| Type VII Phaser | 1500 | Pulse | id 14, price 1500 |
| Disrupter Canon | 1500 | — | Likely the cheaper single-mount; bake-off has a second “Disruptor Cannon” at 1500 (id 7) |
| Quantum Pulse Cannon | 2000 | — | id 8, price 2000 |
| Photon Torpedo | 2500 | — | id 15, price 2500 |
| Disrupter Cannon | 3000 | dual | Likely the dual mount; bake-off “Disruptor Cannon” id 6, price 3000, icon `dualdisrupt.gif` |
| Type X Phaser | 3000 | Beam | id 1, price 3000 |
| Tractor Beam | 3400 | Special | id 25, type Device, price 3400 — **keep as a slot item** |
| Plasma Phaser | 3800 | — | id 4, price 3800 |
| Bajoran Sail | 5000 | Utility | **Not** in the current weapon catalog. Scoreable ledger: **explicitly deferred utility** — not cargo, not `utilityBook`, no invented id. See `docs/weapon-ledger/` |
| Engine Disrupter | 5000 | — | Bake-off “Engine Disruptor” id 23, price 5000 |
| Polaron Phaser | 5000 | — | id 3, price 5000 |
| Polaron Torpedo | 5300 | — | id 19, price 5300 |
| Quantum Torpedo | 6700 | — | id 16, price 6700 |
| Dual Pulse Phasers | 7500 | — | id 9, price 7500 |
| Disrupter Turret | 7800 | — | Bake-off “Disruptor Turret” id 12, price 7800 |
| Tachyon Field Generator | 8000 | — | id 24, price 8000 |
| Pulse Turret | 8500 | — | id 11, price 8500 |
| Gravimetric Torpedo | 9000 | — | id 13, price 9000 |
| Warp Core | 12000 | Utility | **Not** a current weapon row. Scoreable ledger: **explicitly deferred utility** — distinct from cargo “Warp Cores”; not `utilityBook`; no invented id. See `docs/weapon-ledger/` |
| Transphasic Torpedo | 12500 | — | id 18, price 12500 |
| Cloaking Device | 13500 | — | id 22, type Device, price 13500 |
| Thaleron Generator | 15500 | — | id 26, price 15500 |
| Cutting Beam | 30000 | — | id 5, price 30000 |
| Plasma Torpedo | **not supplied** | — | Bake-off id 17 is priced 7200; treat that as **current data**, not a Flash-certified price |

Flash descriptions were **not** in the bake-off source packet. Do **not** invent flavor copy. If a later packet supplies descriptions, attach them to these rows; until then, description cells stay empty.

### Ledger rules

- Identify the source of each claim: BM1 Flash, retained BM2, bake-off `game_items.json`, or new design.
- Do not grant universal shield bypass from an isolated lore exception (plan §11).
- Do not retune damage, cooldown, or range in the ledger pass. Prices in the table are historical Flash numbers.
- Extra bake-off / BM2 rows (Particle Beam, Magnetorp, Biobeam, Tesla Beam, and similar) stay on a **separate “inherited, not in this Flash table”** list. Do not delete them from this document’s silence, and do not invent Flash prices for them. The scoreable list (ids 2, 27–30, 38, 39, 44, 45) lives in `docs/weapon-ledger/`.

### Acceptance (docs / later engine)

1. Canon, Cannon, and Turret remain three disruptor identities.
2. Tractor is still equippable in a combat/device slot.
3. Utility Flash rows (Bajoran Sail, Warp Core) are classified or explicitly deferred — not silently turned into cargo. **In-repo verdict:** both **explicitly deferred utilities** (`docs/weapon-ledger/`).
4. No row in this table is treated as a live price lock.

## 2. Flags / passes / utility inventory — Locked (engine landed)

**Engine landed** on bake-off (`docs/flags-passes/`; brief PR #46, engine PR #47 @ `6dc279b`). **Stay locked** — do not reopen from the weapon-ledger, empty-armable, construction-visuals, or HTML-catalog briefs. Capacity / activation stay **TBD / injectable**. Thaleron Test Facility pass is **unverified — not shipped**. Knowledge/inventory layer only — no gifted FS / culture / `engagement_authorized`. Tractor / Bajoran Sail / Warp Core stay **out** of `utilityBook`.

**Scoreable brief (docs, 17 September 2026):** [`docs/flags-passes/BM1-FLAGS-PASSES-UTILITY-INVENTORY-PROPOSAL.md`](flags-passes/BM1-FLAGS-PASSES-UTILITY-INVENTORY-PROPOSAL.md) + [`docs/flags-passes/BM1-FLAGS-PASSES-ENGINE-DEPENDENCIES.md`](flags-passes/BM1-FLAGS-PASSES-ENGINE-DEPENDENCIES.md), from `main` @ `1e3f67d` after Phase 9.4 engine PR #45. **Not** a reopen of EW (#33/#35/#37/#42/#43/#44/#45), boarding (#38/#39), or Phase 10 (#40/#41). **No Referee Pass claimed.**

- Faction flags, facility passes, and similar utilities are **inventory**, not one of the **three combat / device slots**.
- Capacity and activation rules are **open** (do not invent stack limits or hotkeys in the first brief).
- Bake-off already has `settings.factionFlags` **price knobs** in `data/game_items.json`. Those remain knobs. The working inventory is `state.utilityBook` (PR #47) — credentials, not combat slots.
- **Thaleron Test Facility pass** is **source material to verify** against BM1 (does the pass exist, where is it sold, what does it unlock). Do not invent a facility, a quest, or a map pin from the name alone. In-repo verdict in the brief: **unverified — not shipped.**

### Acceptance

1. Buying or holding a flag/pass does not consume a weapon/device slot.
2. Save/load preserves the utility inventory separately from the three slots.
3. Thaleron Test Facility pass is either verified from BM1 or marked “unverified — not shipped.”

## 3. Empty but armable ships — Locked (engine landed)

**Engine landed** on bake-off (`docs/empty-armable/`; brief PR #50 @ `38b87fd`, engine PR #51 @ `3933daf`). **Stay locked** — do not reopen from the construction-visuals or HTML-catalog briefs. Three slots; empty stays empty; unarmed NPC cannot fire; legal install uses installed def only; Tractor stays a **slot**; `EMPTY_ARMABLE_LOCKED_FROM_REMASTERED` stays false. **No Referee Pass claimed.** **Keep #50 / #51 locked.**

**Scoreable brief (docs, 19 September 2026) + engine (20 September 2026):** [`docs/empty-armable/BM1-EMPTY-ARMABLE-SHIPS-PROPOSAL.md`](empty-armable/BM1-EMPTY-ARMABLE-SHIPS-PROPOSAL.md) + [`docs/empty-armable/BM1-EMPTY-ARMABLE-ENGINE-DEPENDENCIES.md`](empty-armable/BM1-EMPTY-ARMABLE-ENGINE-DEPENDENCIES.md). **Not** a reopen of EW (#33/#35/#37/#42/#43/#44/#45), boarding (#38/#39), Phase 10 (#40/#41), flags/passes (#46/#47), or weapon ledger (#48/#49). DockClear / construction / HTML catalogs / combat retune / Flash price locks **out**.

- A hull has **three** combat/device slots.
- Empty stays **empty** across save, load, scene change, and restoration. Do not auto-fill a default Phaser because the ship “should have guns.”
- An unarmed NPC **cannot fire**. Doctrine fire permission, ROE, and hostility do not create a shot from an empty hardpoint.
- This is the physical gate in doctrine (“equipped weapon… readiness”) and plan §11 (“per-weapon firing gate”).

### Acceptance

1. Purchase or spawn an armable hull with `[]` / three empty slots; reload; slots still empty.
2. That NPC never emits a projectile.
3. After the player (or a legal yard) installs a weapon, fire uses that installed def only.

## 4. Boarding / capture / command transfer — Locked (engine landed)

**Engine landed** on bake-off (`docs/boarding/`; brief PR #38, engine PR #39 @ `de1f857`). **Stay locked** — do not reopen in Phase 10. Phase 4 / 5 / 6 / 9–9.2 briefs had deferred boarding; that gap is closed. `bm-ships/integration-rules.json` `missingFeatures` text may still list the names; runtime `BOARDING_IMPLEMENTED === true` with `tractorIsBoarding() === false`.

**Do not reopen** from the Phase 10 Dominion-first brief. Success odds and XP magnitudes stay **TBD / injectable** — do not invent percentages or an XP table. **No Referee Pass claimed.** **Keep #38 / #39 locked.**

### Locked enough to write a later brief

| Rule | Decision |
| --- | --- |
| When may boarding start? | Target hull ≤ **10%** of maximum hull. |
| Outcomes | **Capture** (player or acting side takes command) **or** **scuttle** (hull destroyed / rendered unusable by the attempt). Exact success odds **TBD** — do not invent percentages. |
| Away-team XP | **Retain vs lose** on failure / death / scuttle is **TBD**. Do not invent an XP table. |
| Fleet command transfer | Player may transfer command to another owned / captured hull (ship-to-ship transfer). Pack notes this is a separate engine feature from adding `bm-ships/`. |

### Still open (named in the boarding brief; odds/XP still TBD)

Opened as **named defaults + Q-rows** in `docs/boarding/` — not invented odds. Do not treat silence here as permission to lock percentages.

- Away-team size, travel time, and combat resolution — **injectable / TBD** (brief §10; inject outcomes for probes).
- Whether capture preserves installed weapons, cargo, and crew identity — brief **preserves hull identity / slots / cargo-if-real / damage**; crew intern vs prize-crew **TBD** (Q8). Phase 1: existing ships preserve identity; changing holder does not silently refit.
- Standing / incident: capture is not a Phase 4 kill-standing cascade by default; do not double-charge if a scuttle later destroys the hull — **hard gate 5** in the boarding brief.
- Interaction with Phase 3 compliance and Phase 6 cloak (cannot board a hull the actor has not legally reached / detected) — **hard gate 7**.

### Acceptance (boarding brief / later engine)

1. Boarding UI / order refuses above 10% hull.
2. Success writes capture **or** scuttle, never both for the same attempt.
3. Away-team XP rule is explicit (retain, lose, or “not tracked yet”) — not silent.
4. Command transfer does not rewrite Phase 1 ownership of foreign concessions or gift the player another government’s fleet.

## 5. Station construction visuals — Locked (engine landed)

**Engine landed** on bake-off (`docs/construction-visuals/`; brief PR #52 @ `6c70fb0`, engine PR #53 @ `91ecc2c`). **Stay locked** — do not reopen from the HTML-catalog brief. Scaffolds / workbees / **blue** beams mean a station is being built — not combat, repair, or an attributed attack. Repair arms stay the side-lane overlay (PR #18). Construction art must **not** be reused as repair arms. Construction beams must not write `observedAttacks`, standing, or FLASH. Never gift FS / culture / `engagement_authorized`. `CONSTRUCTION_LOCKED_FROM_REMASTERED` stays false. **No Referee Pass claimed.** **Keep #52 / #53 locked.**

**Scoreable brief + engine (20 September 2026):** [`docs/construction-visuals/BM1-STATION-CONSTRUCTION-VISUALS-PROPOSAL.md`](construction-visuals/BM1-STATION-CONSTRUCTION-VISUALS-PROPOSAL.md) + [`docs/construction-visuals/BM1-STATION-CONSTRUCTION-ENGINE-DEPENDENCIES.md`](construction-visuals/BM1-STATION-CONSTRUCTION-ENGINE-DEPENDENCIES.md), from `main` @ `6c70fb0` after construction-visuals brief PR #52. Thin `src/construction-visuals.js` + S24. **Not** a reopen of EW (#33/#35/#37/#42/#43/#44/#45), boarding (#38/#39), Phase 10 (#40/#41), flags/passes (#46/#47), ledger (#48/#49), or empty-armable (#50/#51). DockClear / HTML catalogs / combat retune / Flash price locks **out**.

| Visual | Meaning | Not |
| --- | --- | --- |
| Scaffolds, workbees, **blue** construction beams | A station is being built | Combat, repair, or an attributed attack |
| Repair-arms overlay on the **player ship** | Repair in progress at a `repairCapable` location | Construction |

Side-lane **Pass** ([PR #18](https://github.com/Artemis2028/BM1-bakeoff/pull/18)): overlay `repairarms` on the player ship only while `repairCapable` repair is running. Defense platforms never repair. Construction art (`stationconstructing.gif` and similar) must **not** be reused as repair arms.

Construction beams are **not** Phase 4 combat evidence. They must not write `observedAttacks`, standing, or FLASH as weapons fire.

### Acceptance

1. A constructing station shows scaffold / workbee / blue-beam language, not the repair-arms overlay.
2. Repair still uses the side-lane overlay only.
3. Construction visuals never authorize ROE fire or a kill-standing token.

## 6. Faction-wide standing / purchase tiers — Locked (engine landed)

**Scoreable brief stay-locked (PR #58 @ `02cf587`).** S27 subscribe module **engine stay-locked** (PR #59 @ `52e36d9`) under [`docs/standing-tiers/`](standing-tiers/) and `src/standing-tiers.js`. Money is not trust. **No Referee Pass claimed.** **Keep #58 / #59 locked.** Do not reopen the wire, Reman, or economy / difficulty overlays. DockClear / UI-fit polish (`docs/dock-clear/`) does **not** reopen this lane.

**Actual landed helpers (subscribe, do not reopen):** catalog wire PR #28 already ships `PURCHASE_TIER_STANDING` (Open 0 / Trusted 15 / Respected 30 / Military 50 / Strategic 75 / Excalibur-Concord 100), `HOME_FACTION_STANDING = 20`, `createStartingStandings`, and `evaluateWiredPurchase`. Live shop / escort / garrison already consult the wire. Reman still goes through `meetPackPurchaseDecision` (PR #18). Economy / difficulty #56 / #57 **stay-locked** — Easy / Hard must not retune this table. Pack helper already refuses a sale when `tierThresholds` are missing (`standing-threshold-unconfigured`; older “prestige-threshold-unconfigured” wording is stale). Missing standing **reads as 0**.

The older “not yet implemented as live purchase gates” sentence is **planning drift**. Helpers are landed. This brief is the **scoreable contract** (plan §16.2 row 6), not a second wire.

### First balance pass (source thresholds)

| Tier | Threshold | Notes |
| --- | --- | --- |
| Open | 0 | Anyone who may legally shop there |
| Trusted | 15 | |
| Respected | 30 | |
| Military | 50 | |
| Strategic | 75 | Reman Warbird pack row uses `purchaseTier: "strategic"` |
| Excalibur / Concord | 100 | Pack already: Excalibur world-prestige 100; Concord-class is the independent capital identity |
| New character | **20** with the **selected** starting faction | Not 0, not 100 |

Independent trade standing applies in **neutral / independent** entry. Shared `neutral` is still not an alliance (Phase 1 / doctrine). A high price does not bypass a ban (plan §10).

These numbers are a **first balance pass**, not certified economy. Do not silently replace them with bake-off kill-standing deltas.

Phase 4 / 5 already forbid double standing for one destruction. A later standing-tier system must keep that token rule.

### Acceptance

1. Credits alone cannot buy a Military / Strategic / Excalibur hull.
2. New-game selected faction starts at 20; other factions start at their declared default (**Open 0** — the standing-tiers brief declares this).
3. Independent / Concord access is a standing + vendor rule, not “I have latinum.”

## 7. Catalog wire + purchase rules — Landed (subscribe)

**Actual landed state:** catalog wire **already shipped** ([PR #28](https://github.com/Artemis2028/BM1-bakeoff/pull/28) @ `2b1bb47`, implement tip `d7cf579`). `CATALOG_WIRED === true`. Full-roster-v2 is live (`loadShipCatalog()`; 174 records, 172 active, 38 aliases). `evaluateWiredPurchase` + `meetPackPurchaseDecision` are the purchase meeting points. S11. Standing-tiers brief (`docs/standing-tiers/`) **subscribes** to this wire and does **not** reopen it.

The older planning sentence “catalog wire still later” / “bake-off must still treat wire as future work” is **stale**. Do not start a second wire. Content import remains landed (`bm-ships/` full-roster-v2). Guided may have numbered this package differently; bake-off completion is PR #28.

### What already exists (do not reinvent)

- Pack helpers: `getPurchaseDecision`, `eligibleForSpawn`, `eligibleForStock`, `spawnPool`, alias resolve, region rules in `bm-ships/catalog.mjs`.
- Machine-readable aliases: `ships.json` `aliases` and `integration-rules.json` `hullAliases` (same 38 pairs as `docs/APPROVED-HULL-MERGES.md`).
- Reman soft meeting point from side-lane [PR #18](https://github.com/Artemis2028/BM1-bakeoff/pull/18): `meetPackPurchaseDecision` in `src/side-lane-repair-reman.js`.
  - Hull **53 / `bm-ship:53` remains.** It is not a merge and is not a second Reman id.
  - Durable Reman unlock may satisfy pack `restricted-stock`. Without a vendor context the pack still refuses hull 53 as `restricted-stock` (`shipyardEligible: false`).
  - Pack metadata may tag `specialVendor: remus-secret` as a yard note. That does **not** make Remus station the sole key. Catalog wire is **landed**; the tag is still a yard note, not the Reman key.
  - Standing-threshold-unconfigured is **not** an access fail when the hull already has explicit `purchaseRequirements` (full-roster-v2 does).
  - Granted access **survives** a `region` refuse (destroyed / off-Remus yard).
  - `funds` / `unavailable` / `balance-pending` stay pack refusals.
  - Do **not** invent a second Reman hull id or replace durable unlock with Remus-only access.
- S7.9 **flipped with PR #28**: ordinary traffic/markets now use the wired catalog. Do not flip it back.

### Wire rules (already landed — do not reopen)

- Namespaced `bm-ship:<id>` or an explicit remap. Numeric pack IDs are pack-local. Resolve merge aliases; do not resurrect discarded IDs as extra hulls.
- Empty legal `spawnPool` stays empty. No fallback into reserved Gorn or unknown regions.
- Purchase consults pack decision **and** engine standing / unlock / Phase 1 authority. Money ≠ standing ≠ Reman flag.
- Keep `getShip` distinct from `resolveNewShipId` (owned hulls are not silently refitted).
- Excalibur 347 is now an active balanced pack row; 100 standing alone still does not sell it without funds + `paso-project-x` vendor (wire already landed).

### Acceptance

1. Full 174-hull wire is explicit and testable; S7.9 **already flipped** with PR #28.
2. Reman still goes through `meetPackPurchaseDecision` (soft S7.8 stays the meeting point). Remus is not the sole key.
3. No second Reman id; no silent unlock rewrite.

## 8. Broader economy / difficulty — Locked (engine landed)

Overlaps plan §10 (finite markets, embargoes, fleet costs, conquest obligations) and plan §13 (trade/reputation reversal, jump farming).

**Scoreable brief stay-locked (PR #56 @ `ca5f4c1`).** S26 subscribe overlay **engine landed** (PR #57 @ `b73d960`) under [`docs/economy-difficulty/`](economy-difficulty/) and `src/economy-difficulty.js`. Difficulty is **adjustable tuning** (pacing numbers, not ownership). Political identity stays the same at all difficulties. Do not invent repair prices, unrest thresholds, or prestige curves. Phase 8 anti-farm (PR #31) stays **closed** — cite, do not reopen. Money ≠ standing ≠ Reman. Never gift FS / culture / `engagement_authorized` from a difficulty setting. **Not** a reopen of EW (#33/#35/#37/#42/#43/#44/#45), boarding (#38/#39), Phase 10 (#40/#41), flags/passes (#46/#47), ledger (#48/#49), empty-armable (#50/#51), construction (#52/#53), or HTML catalogs (#54/#55). GUIDED §9 / #54 / #55 **stay-locked**. Standing-tiers brief (`docs/standing-tiers/`) does **not** reopen this lane and must **not** retune `PURCHASE_TIER_STANDING` as Easy / Hard. DockClear / HTML reopen / Thaleron facility invent / combat retune / Flash price locks **out**. `ECONOMY_DIFFICULTY_LOCKED_FROM_REMASTERED` stays false. **Keep #56 / #57 locked.** **No Referee Pass claimed.**

- Difficulty is **adjustable tuning**.
- **Political identity stays the same at all difficulties.** Easy must not collapse Phase 1 (flag-share ≠ control, concessions stay foreign, independents are not one alliance, Breen–Dominion have no static friendship).
- Do not invent repair prices, unrest thresholds, or prestige curves in this docs pass (side-lane already forbade invented balance numbers).

### Acceptance

1. A difficulty knob changes pacing numbers, not ownership rules.
2. Known free-growth exploits (buy/sell prestige, jump farming) are closed or listed before retune.

## 9. Weapon / station review presentation — Working agreement (brief stay-locked; S25 pages shipped)

Review catalogs for weapons and stations are **HTML**, without requiring the original Flash client.

**Scoreable brief stay-locked (PR #54 @ `65579e0`).** S25 static HTML pages stay-locked (PR #55 @ `739e0c1`) under [`docs/html-catalogs/`](html-catalogs/) (`index.html` / `weapons.html` / `stations.html`). Flash is **source evidence**, not a required viewer. Pages must not silently “fix” Flash vs bake-off conflicts; they show both and cite the ledger (#48/#49). Catalogs inspect defs — not a combat retune, not live price locks, not a second shop. Never gift FS / culture / `engagement_authorized` from opening a page. **Not** a reopen of EW (#33/#35/#37/#42/#43/#44/#45), boarding (#38/#39), Phase 10 (#40/#41), flags/passes (#46/#47), ledger (#48/#49), empty-armable (#50/#51), or construction (#52/#53). **Keep #54 / #55 locked.** DockClear / broader economy-difficulty / combat retune / Thaleron facility invent **out**. `HTML_CATALOG_LOCKED_FROM_REMASTERED` stays false. **No Referee Pass claimed.** Economy / difficulty knobs do **not** reopen this lane.

- This is a **working agreement** for how the team inspects defs. The HTML pages now exist as a thin docs slice.
- Do not treat Flash as a required review tool.
- Pages must not silently “fix” Flash vs bake-off conflicts; they show both and cite the ledger.

## 10. Dominion distribution / Gorn reserved / major-threat mission-only — Cross-link

Doctrine already states this. The pack already encodes it. Catalog wire (PR #28) calls pack helpers; **live** spawn/purchase still needs the Phase 10 gates (debug `authorizedDeployment` from role, map/tooltip leaks, hidden campaign).

**Scoreable brief now open (docs-only, 15 September 2026):** [`docs/phase10/BM1-PHASE10-DOMINION-FIRST-PROPOSAL.md`](phase10/BM1-PHASE10-DOMINION-FIRST-PROPOSAL.md) + [`docs/phase10/BM1-PHASE10-ENGINE-DEPENDENCIES.md`](phase10/BM1-PHASE10-ENGINE-DEPENDENCIES.md), from `main` @ `de1f857` after boarding engine PR #39. That brief is **Dominion-first Phase 10**, not a full faction roster and not a reopen of EW (#33/#35/#37) or boarding (#38/#39). Discovery timing, invasion odds, and map-revelation UX stay **TBD / injectable** — do not invent percentages. **No Referee Pass claimed.**

| Rule | Doctrine | Pack |
| --- | --- | --- |
| Gorn routine generation disabled | `DESIGN-doctrine-v0.2.1.md`: no normal traffic/patrol/raid/occupation; survivor events must be authored | `availabilityRegion: "reserved-gorn"` → `regionAllows` false; `spawnPool(..., 'gorn')` is `[]` |
| Dominion remnant vs wider Dominion | Blender remnant is playable and isolated; wider Dominion is hidden under discovery rules; two profiles share runtime key `dominion` | `dominion-all` (Blender / Dominica / core / authorized invasion or mission); `dominion-core` (Dominica / core / authorized); blender routine IDs 30, 206, 322 in `integration-rules.json` |
| Major-threat / mission-only hulls | Borg and similar need assigned operations, not ambient traffic | `availabilityRegion: "mission-only"` requires `role === 'mission'` and `authorizedDeployment` |
| Dominion Battleship | Occupation/campaign, not ambient | Pack: no-ambient-traffic flag retained even in core |

Do not recreate a Gorn state from a leftover name pool. Do not let ordinary Earth traffic spawn Dominion core hulls. Authorized invasion/mission flags must be real operations, not a debug default.

Pointers: doctrine “The wider Dominion's operation”; plan §12 Hidden Dominion campaign; `bm-ships/README.md` “Using it in a browser game”; `bm-ships/integration-rules.json` `dominion` / reserved Gorn; Phase 10 brief `docs/phase10/`.

## Suggested remaining build order (bake-off)

Adapt the guided order to **what bake-off has not done**. Do not restart Phases 1–5 or the side-lane.

1. **Weapon / device ledger** — brief + engine landed (`docs/weapon-ledger/`, PRs #48/#49). Phase 9 matrix stays read-only. **Stay locked.**
2. **Empty-but-armable** three-slot persistence and unarmed-cannot-fire — brief + engine landed (`docs/empty-armable/`, PRs #50/#51). **Stay locked.**
3. **Flags / passes / utility inventory** — brief + engine landed (`docs/flags-passes/`, PRs #46/#47). Thaleron Test Facility pass **unverified — not shipped**. **Stay locked** from the weapon-ledger brief.
4. **Standing tiers** as a named gate surface (Open → Excalibur; new-character 20; Independent trade standing in neutral entry) — **brief #58 stay-locked**; S27 engine **#59 stay-locked** under `docs/standing-tiers/` + `src/standing-tiers.js`. Helpers already landed (PR #28). Economy §8 / #56 / #57 **stay-locked**. DockClear (`docs/dock-clear/`) does **not** reopen this row.
5. **Catalog wire + purchase rules** — **engine landed** (PR #28). Reuse `meetPackPurchaseDecision` and pack region gates. **Subscribe, do not reopen.** Content (merges + full-roster-v2 balance) is already imported.
6. **Boarding / capture / command transfer** (≤10% hull) — brief + engine landed (`docs/boarding/`, PRs #38/#39). **Stay locked.**
7. **Station construction visuals** (scaffolds / workbees / blue beams) — brief + engine landed (`docs/construction-visuals/`, PRs #52/#53). Repair arms stay the side-lane overlay. **Stay locked.**
8. **HTML weapon / station catalogs** for review — brief **#54 stay-locked**; S25 pages **#55 stay-locked** under `docs/html-catalogs/`. Working agreement: HTML; Flash is evidence, not a required viewer.
9. **Broader economy / difficulty knobs** (plan §8 / §10), preserving political identity — brief **#56 stay-locked**; S26 overlay on this tip under `docs/economy-difficulty/` + `src/economy-difficulty.js`.
10. **Phase 6 engine** when Tenth scopes it — brief is already ready; not a new package in this list.

Phase 7 fleet coordination (plan §9) and Phase 9 EW remain on the original roadmap. Boarding/command transfer may feed Phase 7; EW stays after honest contact (Phase 6).

## Acceptance gates (cross-package)

A later engine slice in this backlog is not done until:

1. Phase 1–5 and side-lane probes still pass. No reopened ROE, checkpoint, incident-token, overdue, or `repairCapable` rules.
2. The slice states whether it is **docs**, **data**, or **engine**.
3. Flash / pack numbers used as source material are labeled **not final** unless Tenth locks them.
4. No crib of `BM1-remastered-work` engine.

## Working agreement

- Blind bake-off: `docs/` only; no guided engine.
- HTML review catalogs; Flash is source evidence, not a required viewer.
- Proposal before engine unless Tenth scopes a thin data/audit slice.
- Dual-track: guided may ship catalog/economy first; bake-off already has political, ROE, checkpoints, incidents, convoy/`asset_overdue`, repair arms, Reman unlock, and independence mint.
- This document updates planning knowledge. It does not implement weapons retune. Catalog wire helpers are already landed (PR #28) — GUIDED §7 “wire later” is stale. Standing-tiers **S27 subscribe engine** now lives under `docs/standing-tiers/` + `src/standing-tiers.js` (GUIDED §6) — subscribe to #28 / #18 / #56–#57; brief **#58** and engine **#59 stay-locked**. DockClear / UI-fit **scoreable brief** lives under `docs/dock-clear/` and does **not** reopen §6. Boarding **engine** landed under `docs/boarding/` (PRs #38/#39) — stay locked. Phase 10 Dominion-first **engine** landed under `docs/phase10/` (PRs #40/#41) — stay locked. Flags / passes / utility inventory **engine** landed under `docs/flags-passes/` (PRs #46/#47) — stay locked. Weapon / device source ledger **engine** landed under `docs/weapon-ledger/` (PRs #48/#49) — stay locked. Empty-but-armable **engine** landed under `docs/empty-armable/` (PRs #50/#51) — stay locked. Station construction visuals **engine** landed under `docs/construction-visuals/` (PRs #52/#53) — stay locked. HTML weapon / station review catalogs **docs** now live under `docs/html-catalogs/` — GUIDED §9 / #54 / #55 **stay-locked**. Broader economy / difficulty knobs **engine** now live under `docs/economy-difficulty/` + `src/economy-difficulty.js` — GUIDED §8 / #56 / #57 **stay-locked**.
