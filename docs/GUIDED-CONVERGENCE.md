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

## 1. Weapon / device source ledger — Agreed next

**Not yet implemented on bake-off as a reviewed ledger.** Plan §11 and §13 already require a BM1-versus-inherited-BM2 audit before a weapon overhaul. This section supplies the Flash **price** table as source material.

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
| Bajoran Sail | 5000 | Utility | **Not** in the current weapon catalog; verify whether Flash sold this as a slot utility |
| Engine Disrupter | 5000 | — | Bake-off “Engine Disruptor” id 23, price 5000 |
| Polaron Phaser | 5000 | — | id 3, price 5000 |
| Polaron Torpedo | 5300 | — | id 19, price 5300 |
| Quantum Torpedo | 6700 | — | id 16, price 6700 |
| Dual Pulse Phasers | 7500 | — | id 9, price 7500 |
| Disrupter Turret | 7800 | — | Bake-off “Disruptor Turret” id 12, price 7800 |
| Tachyon Field Generator | 8000 | — | id 24, price 8000 |
| Pulse Turret | 8500 | — | id 11, price 8500 |
| Gravimetric Torpedo | 9000 | — | id 13, price 9000 |
| Warp Core | 12000 | Utility | **Not** a current weapon row; “Warp Cores” exists as a trade good — do not silently merge those |
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
- Extra bake-off / BM2 rows (Particle Beam, Magnetorp, Biobeam, Tesla Beam, and similar) stay on a **separate “inherited, not in this Flash table”** list. Do not delete them from this document’s silence, and do not invent Flash prices for them.

### Acceptance (docs / later engine)

1. Canon, Cannon, and Turret remain three disruptor identities.
2. Tractor is still equippable in a combat/device slot.
3. Utility Flash rows (Bajoran Sail, Warp Core) are classified or explicitly deferred — not silently turned into cargo.
4. No row in this table is treated as a live price lock.

## 2. Flags / passes / utility inventory — Agreed next

**Not yet implemented on bake-off.**

- Faction flags, facility passes, and similar utilities are **inventory**, not one of the **three combat / device slots**.
- Capacity and activation rules are **open** (do not invent stack limits or hotkeys in the first brief).
- Bake-off already has `settings.factionFlags` **price knobs** in `data/game_items.json`. That is not a working pass/flag inventory.
- **Thaleron Test Facility pass** is **source material to verify** against BM1 (does the pass exist, where is it sold, what does it unlock). Do not invent a facility, a quest, or a map pin from the name alone.

### Acceptance

1. Buying or holding a flag/pass does not consume a weapon/device slot.
2. Save/load preserves the utility inventory separately from the three slots.
3. Thaleron Test Facility pass is either verified from BM1 or marked “unverified — not shipped.”

## 3. Empty but armable ships — Agreed next

**Not yet implemented on bake-off.**

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

## 5. Station construction visuals — Agreed next

**Not yet implemented on bake-off.** Repair arms **are** implemented — do not redo them.

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

## 6. Faction-wide standing / purchase tiers — Agreed next

**Not yet implemented on bake-off as live purchase gates.** Pack helper already refuses a sale when `tierThresholds` are missing (`prestige-threshold-unconfigured`). Money is not trust.

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
2. New-game selected faction starts at 20; other factions start at their declared default (Open 0 unless a later brief says otherwise).
3. Independent / Concord access is a standing + vendor rule, not “I have latinum.”

## 7. Catalog wire + purchase rules — Agreed next

**Content import landed; catalog wire still later.** `bm-ships/` now holds the
full-roster-v2 pack (174 records, 172 active, 38 old→survivor aliases). Ambient
traffic, yards, and markets still use the pre-pack 66-hull roster. Guided may
wire the catalog earlier; bake-off must still treat wire as future work.

### What already exists (do not reinvent)

- Pack helpers: `getPurchaseDecision`, `eligibleForSpawn`, `eligibleForStock`, `spawnPool`, alias resolve, region rules in `bm-ships/catalog.mjs`.
- Machine-readable aliases: `ships.json` `aliases` and `integration-rules.json` `hullAliases` (same 38 pairs as `docs/APPROVED-HULL-MERGES.md`).
- Reman soft meeting point from side-lane [PR #18](https://github.com/Artemis2028/BM1-bakeoff/pull/18): `meetPackPurchaseDecision` in `src/side-lane-repair-reman.js`.
  - Hull **53 / `bm-ship:53` remains.** It is not a merge and is not a second Reman id.
  - Durable Reman unlock may satisfy pack `restricted-stock`. Without a vendor context the pack still refuses hull 53 as `restricted-stock` (`shipyardEligible: false`).
  - Pack metadata may tag `specialVendor: remus-secret` as a yard note. That does **not** make Remus station the sole key. Do not treat the tag as live stock until catalog wire.
  - Standing-threshold-unconfigured is **not** an access fail when the hull already has explicit `purchaseRequirements` (full-roster-v2 does).
  - Granted access **survives** a `region` refuse (destroyed / off-Remus yard).
  - `funds` / `unavailable` / `balance-pending` stay pack refusals.
  - Do **not** invent a second Reman hull id or replace durable unlock with Remus-only access.
- S7.9: ordinary traffic/markets must not require `loadShipCatalog()` until this wire slice.

### Wire rules (when Tenth scopes)

- Namespaced `bm-ship:<id>` or an explicit remap. Numeric pack IDs are pack-local. Resolve merge aliases; do not resurrect discarded IDs as extra hulls.
- Empty legal `spawnPool` stays empty. No fallback into reserved Gorn or unknown regions.
- Purchase consults pack decision **and** engine standing / unlock / Phase 1 authority. Money ≠ standing ≠ Reman flag.
- Keep `getShip` distinct from `resolveNewShipId` (owned hulls are not silently refitted).
- Excalibur 347 is now an active balanced pack row; 100 standing alone still does not sell it without the later wire + funds/vendor checks.

### Acceptance

1. Full 174-hull wire is explicit and testable; S7.9 flips only in that slice.
2. Reman still goes through `meetPackPurchaseDecision` (soft S7.8 stays the meeting point). Remus is not the sole key.
3. No second Reman id; no silent unlock rewrite.

## 8. Broader economy / difficulty — Proposed

Overlaps plan §10 (finite markets, embargoes, fleet costs, conquest obligations) and plan §13 (trade/reputation reversal, jump farming).

- Difficulty is **adjustable tuning**.
- **Political identity stays the same at all difficulties.** Easy must not collapse Phase 1 (flag-share ≠ control, concessions stay foreign, independents are not one alliance, Breen–Dominion have no static friendship).
- Do not invent repair prices, unrest thresholds, or prestige curves in this docs pass (side-lane already forbade invented balance numbers).

### Acceptance

1. A difficulty knob changes pacing numbers, not ownership rules.
2. Known free-growth exploits (buy/sell prestige, jump farming) are closed or listed before retune.

## 9. Weapon / station review presentation — Working agreement

Review catalogs for weapons and stations are **HTML**, without requiring the original Flash client.

- This is a **working agreement** for how the team inspects defs, not a claim that those HTML pages exist on bake-off.
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

1. **Weapon / device ledger** (docs + audit). No live retune.
2. **Empty-but-armable** three-slot persistence and unarmed-cannot-fire.
3. **Flags / passes / utility inventory** (verify Thaleron Test Facility pass).
4. **Standing tiers** as data (Open → Excalibur) plus new-character 20. Independent trade standing in neutral entry.
5. **Catalog wire + purchase rules**, reusing `meetPackPurchaseDecision` and pack region gates (Dominion / Gorn / mission-only). Content (merges + full-roster-v2 balance) is already imported.
6. **Boarding / capture / command transfer** (≤10% hull) — brief + engine landed (`docs/boarding/`, PRs #38/#39). **Stay locked.**
7. **Station construction visuals** (scaffolds / workbees / blue beams). Repair arms stay the side-lane overlay.
8. **HTML weapon / station catalogs** for review (working agreement).
9. **Broader economy / difficulty knobs** (plan §8 / §10), preserving political identity.
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
- This document updates planning knowledge. It does not implement weapons retune. Catalog wire and standing tiers are already landed. Boarding **engine** landed under `docs/boarding/` (PRs #38/#39) — stay locked. Phase 10 Dominion-first **docs** now live under `docs/phase10/`.
