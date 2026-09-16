# BM1 Phase 9.3 — Scan-poison + DF assist

**Status:** proposal for implementation; no engine changes made by this document.  
**Repository:** `Artemis2028/BM1-bakeoff`  
**Planning baseline:** `2ad94b7` on `main` (16 September 2026), after Phase 10 Dominion-first engine (PR #41).  
**Referee context:** Phase 4 engine §6 **Pass** on `7f926df`. Phase 9 engine (PR #33), Phase 9.1 engine (PR #35), and Phase 9.2 engine (PR #37) are the **locked** EW/weapons baselines — **Keep #33, #35, and #37 Pass locked.** Boarding brief/engine (PR #38 / #39) and Phase 10 brief/engine (PR #40 / #41) stay **closed** — **do not reopen boarding or Dominion.** This is a **9.3 EW amend**, not a reopen of Phase 9’s six hard gates, not a reopen of Phase 9.1’s seven hard gates, not a reopen of Phase 9.2’s eight hard gates, not a reopen of S14 / S15 / S16 / S17 / S18, and **not** a claim that Phase 9–9.2 already had a Referee Pass on the status MD. This brief does **not** claim a new Referee Pass, does **not** reopen Phase 6 layers or Phase 6.5 generation, and does **not** reopen Phase 4/5 delivered reports.  
**Companion:** `docs/phase9/BM1-PHASE9.3-ENGINE-DEPENDENCIES.md` (hooks, risks, probe plan).  
**Scoped by:** Tenth Mountain Trooper, 2026-09-16 — proposal first; no engine until Tenth scopes after a brief Pass. Scan-poison **and** DF assist (direction-finding / emission taxonomy) are **in** this one scoreable brief.

Phases 1–10 already landed: political authority, two-mode ROE, holding zones, incident ledger / FLASH, persistent convoy/`asset_overdue`, sensors/cloak + power suites, fleet hold-outside, compact finite markets, Phase 9 EW on the reserved `ew` consumer with ghosts as contact-book rows, a read-only weapons matrix, closed fire gates, Phase 9.1 spend-to-suppress / burn-through `B × √Q` / residue-before-void / RSS / true-side labels / HoJ matrix row / transponder claim, Phase 9.2 lobes / escort ECCM / spoof catch / comms-delay / heat / decoys / silent-running / dock-fit, boarding capture XOR scuttle (`BOARDING_IMPLEMENTED === true`; `tractorIsBoarding() === false`), and Phase 10 Dominion-first (`state.dominionBook`; stories = knowledge layers). Phase 9.2 **locked EW depth**. It did **not** lock scan-poison of live Focused Scan / confidence / scan-progress, or DF assist as classification / seeker-cue / annotation of known jamming emissions.

This is **one** connected EW amend on the landed Phase 9–9.2 book: a spend-to-suppress that **corrupts live scan layers only** (Focused Scan, contact confidence, scan-progress) without wiping delivered reports or spawning hulls, and a DF assist that **classifies and cues** known paid emissions without gifting a lock, culture fire, or `engagement_authorized`. It is not a remastered `git am`, not a sixth power consumer, not a reopen of PR #33 / #35 / #37, not a reopen of boarding #38 / #39 or Phase 10 #40 / #41, and not permission to lock remastered EU/s, prices, or wattages as constants.

## 1. The result we want

A jammer you paid for can **poison** the other side’s live Focused Scan, contact confidence, and scan-progress — and the book still **names** a residue, whose noise it is, and what they may **not** do with that knowledge (no wiped FLASH, no gifted lock, no auto-fire). A receiver who paid for DF assist can **classify** a known jammer / decoy / heat emission and annotate a seeker cue — without inventing a Romulan from leftover noise, rewriting Phase 1, or perfect-tracking a silent hull.

**Exit condition:** the eight hard gates in §2 are scoreable; magnitudes stay injectable playtest defaults; Phase 9 / #33, Phase 9.1 / #35, and Phase 9.2 / #37 stay closed; boarding / Phase 10 stay closed.

**Proposed first-release decisions:**

| Question | Proposed answer |
| --- | --- |
| What is the first playable slice? | Scan-poison on reserved `ew` that corrupts **live** Focused Scan / contact confidence / scan-progress only; DF assist as classification / cue / annotation of **known paid** jamming emissions. Injectable playtest magnitudes. Screenshot / no-clip process continues for the later engine PR. |
| Where do 9.3 effects live? | Existing Phase 6 `state.contactBook` live marks + Phase 9 `state.ewBook` + Phase 9.1 contest / claim / residue + Phase 9.2 Focused Scan / heat / decoy / share snapshot + a compact poison / cue snapshot (names can change). **Never** as fake `npcShips`. **Never** inside `systemStates`. **Never** as a second sensor religion. **Never** as a rewrite of `state.dominionBook` or boarding prize identity. |
| May scan-poison wipe delivered P4/P5 reports / FLASH / `knownIncidentIds`? | **No.** Corrupt ≠ wipe. Live layers only. |
| May scan-poison spawn a hull or gift `firingSolution` / culture / `engagement_authorized`? | **No.** Book-only. Ghosts / decoys rules unchanged. |
| May DF assist gift a lock or invent identity from noise? | **No.** Classification / cue only, and only from true-side / paid emission already allowed by 9.1 / 9.2. |
| May DF assist rewrite Phase 1 / Reman / the 9.1 claim layer? | **No.** Catch / claim rules from 9.1 / 9.2 stay. |
| May DF assist perfect-track a silent hull? | **No.** HoJ remains emission-only / silence→coast. Cue quality may improve while the field is paid. |
| May we add a sixth power consumer? | **No.** Spend-to-suppress / spend-to-classify on reserved **`ew`**. Brown-out still weakens. |
| May we `git am` remastered EW / lock remastered watts? | **No.** Remastered EW pack / DESIGN is **background shapes only.** §7 proposes **starting injectable playtest defaults** — still TBD/playtest, never remastered EU/s locked via `git am`. |
| May we reopen #33 / #35 / #37, boarding #38 / #39, or Phase 10 #40 / #41? | **No.** |
| Is dockClear polish in scope? | **No.** Separate UI item. Screenshot / no-clip process still continues for the later engine PR (gate 8). |

These are recommendations for this amend, not new decisions attributed to the user. Locked bake-off constraints take precedence over older flavor that treated scan-poison as a report wipe, DF as a gifted firing solution, emission taxonomy as Phase 1 identity, or remastered watts as live locks.

## 2. Locked constraints (do not reopen)

The bake-off room locked these before this brief. Implementation and probes must treat them as **hard gates**. Referee / One score this brief against these **eight** **before** any engine PR. Phase 9’s original six gates, Phase 9.1’s seven gates, and Phase 9.2’s eight gates stay **closed**; they are restated only as **gates 5–6** (preserve), not as a reopen.

### Hard gate 1 — Reserved `ew` only; no sixth consumer

> Scan-poison and DF assist **spend on reserved `ew`**. Brown-out still weakens. Never off-budget. Never a free fifth energy religion. Never a **sixth** `POWER_CONSUMERS` entry. S=0 / starved ships cannot poison or DF. Effects-on-at-draw-0 **fails**.

Lane owner (wording): **Number Four**.

Phase 6.5 already bills five consumers (`propulsion` / `weapons` / `cloak` / `sensors` / `ew`). Phase 9 flipped `EW_EFFECTS_IMPLEMENTED === true`. Phase 9.1 mapped jammer draw `× A × H` onto that same `ew` line. Phase 9.2 added heat / decoy / silent-running extra draw through `phase92ReservedDraw`. This amend **does not** add a consumer. Scan-poison draw and DF-assist draw are extra reserved-`ew` lines (named family/control, four-part contract: cost / duration / counter / attribution). A starved / brown-out / S=0 ship cannot run either family. Focused Scan itself still bills **Sensors** (9.2 catch path); poisoning that scan bills **`ew`** on the emitter, not a hidden sixth pool.

### Hard gate 2 — Book-only effects; no hull gift

> Scan-poison and DF assist are **contact-book / cue-book** effects. They do **not** spawn hulls. Ghosts remain Phase 9 deceptive rows (`ew_ghost`). Decoys remain Phase 9.2 emission lures (`ew_decoy`). Residue remains Phase 9.1 (`ew_residue`). Do not `npcShips.push` a poison ghost, a DF “emitter hull,” or a classified contact as a living ship. Do not gift `firingSolution` because a cue or a poisoned scan exists.

Lane owner (wording): **Number 2** on knowledge bounds; **Number Four** on the book hook.

`createContactRecord` already clamps ghosts / residue / decoys away from FS. This amend **subscribes**. Poison marks live rows. DF writes an annotation / cue on the observer’s book (and/or a compact cue snapshot beside `ew92`). Neither path may copy a living `securityInstanceId` onto a fake hull so doctrine treats the cue as that ship.

### Hard gate 3 — Scan-poison corrupts live layers only; corrupt ≠ wipe

> Scan-poison may degrade **live** Focused Scan dwell/result, **live** contact confidence, and **live** scan-progress. It **must not** wipe delivered Phase 4/5 reports, unsend FLASH, splice `knownIncidentIds`, rewrite `seedFromReport` historical rows, or delete the contact into cloak-void. Residue-before-void still holds: deep poison floors at residue / area-or-detected / emission, same as 9.1 jam.

Lane owner (wording): **Number 2**.

Live layers in this amend (names can change):

| Live layer | What poison may do | What poison must not do |
| --- | --- | --- |
| **Focused Scan** | Stall / jitter / fail a **dwelling** 9.2 scan; mark the result unreliable; block a fresh catch this tick | Delete `ew92.focusedScans`; rewrite Phase 1; auto-fire; skip Sensors emission on a scan that still runs |
| **Contact confidence** | Lower a live observer-row confidence / ident certainty / catch reliability mark | Rewrite delivered `reports[id].confidence`; invent ID; gift FS |
| **Scan-progress** | Stall or confuse `contact.search` dwell / `scanEmission` remaining / Focused Scan `untilLocalMs` | Void the row; invent coordinates; complete a search as a gifted firm lock |

Delivered knowledge is **not** a live layer. `tryDeliverReport` may still delay a **new** send under 9.2 comms-disruption; poison is not a second unsend religion.

### Hard gate 4 — DF assist = classification / cue only; never FS / culture / `engagement_authorized`

> DF assist improves **emitter classification, seeker cues, and annotation** for **known jamming emissions**. It is **not** a gifted lock. It does **not** invent identity from noise alone beyond what true-side / paid emission already allows (9.1 labels). It does **not** rewrite Phase 1 `playerFaction` / `playerSide` / Reman **53** / ROE, and does **not** rewrite the 9.1 transponder claim layer or the 9.2 catch-path rules. HoJ remains emission-only / incarnation-lock / **silence→coast**; DF may improve cue quality while the field is paid, and **must not** perfect-track silent or cloaked hulls. Never culture fire. Never `engagement_authorized`.

Lane owner (wording): **Number 2**.

9.2 heat copy already says loud jam is easier to DF — this amend **names that counter** as a spend-to-classify on reserved `ew`. Classification targets a **paid** emitter (`ew` draw > 0 after A × H, in-lobe if 9.2 lobes apply). Leftover unlabeled N after self-cancel stays unlabeled noise, not a guessed polity. Seeker knowledge stays on the **munition** (9.1 HoJ); DF may feed a cue heading / family tag; it must not write observer `firingSolution` or `liveWeaponTrack`.

### Hard gate 5 — Residue-before-void + burn-through + RSS / lobes / true-side still hold

> Phase 9.1 burn-through `B × √Q`, residue-before-void, RSS of all **paid** (now all-paid **in-lobe**) emitters, and true-side labels still hold. Phase 9.2 lobes still mask `cᵢ` before RSS; friendlies in-lobe still take N. Scan-poison is **not** a cloak-sphere and **not** a Q=0 cheat. DF assist is **not** a second contest religion and **not** an IFF notch that zeros friendly contribution.

Lane owner (wording): **Number Four** on contest; **Number 2** on “not a cloak / not identity.”

Poison that drives Q to 0 for a funded receiver, deletes the contact, or treats out-of-lobe as invisibility **fails** this brief even if the poison UI is green. DF that relabels mixed/unlabeled noise as a faction name **fails** even if the cue heading is green.

### Hard gate 6 — Preserve #33 / #35 / #37; do not reopen boarding or Phase 10

> Ghosts remain contact-book only. Residue-before-void. Burn-through. RSS. HoJ matrix row first; silence→coast; no gifted FS. Transponder claim never rewrites Phase 1. Jamming cannot wipe delivered P4/P5 reports. Weapons matrix before overhaul. Detection-only escort share. Decoys ≠ hulls. Silent-running ≠ cloak. No culture / `engagement_authorized` inject from EW. Do **not** reopen Phase 9’s six hard gates, Phase 9.1’s seven, or Phase 9.2’s eight. Do **not** regress PR #33 / #35 / #37. Do **not** reopen boarding #38 / #39 (`tractorIsBoarding()` stays false; capture XOR scuttle; XP `not_tracked_yet`). Do **not** reopen Phase 10 #40 / #41 (stories stay knowledge layers; no gifted FS from rumor; pack gates stay).

Lane owner (wording): **Referee / One** (do-not-open check). Number 2 scores ghost / report / fire-gate / share / spoof / decoy / DF≠FS / corrupt≠wipe preservation. Number Four scores budget / contest / matrix / no-boarding-hook / no-Dominion-hook / no-remastered-lock.

Cite Phase 9 gates 1–6 in `docs/phase9/BM1-PHASE9-EW-WEAPONS-PROPOSAL.md` §2, Phase 9.1 gates 1–7 in `docs/phase9/BM1-PHASE9.1-EW-ROBUSTNESS-PROPOSAL.md` §2, and Phase 9.2 gates 1–8 in `docs/phase9/BM1-PHASE9.2-EW-DEPTH-PROPOSAL.md` §2 as **already locked**. This amend **subscribes**.

### Hard gate 7 — Magnitudes are injectable playtest defaults, not remastered locks

> §7 proposes **starting injectable defaults** for poison draw / duration / confidence penalty / dwell stall, and DF draw / cue quality / range. They are a **playtest ledger** — explicitly **not** locked remastered constants. Override must change the snapshot. `MAGNITUDES_LOCKED_FROM_REMASTERED` stays **false**. Do **not** `git am` remastered patches. Do **not** copy remastered EU/s / prices / wattages into non-overridable constants. **Soft gate:** existing suites stay green with these defaults (S14–S18 / catalog / doctrine / boarding / Phase 10).

Lane owner (wording): **Number Four**.

Phase 9 / 9.1 / 9.2 already inject via `resolveEwMagnitudes` / `resolvePhase91Defaults` / `resolvePhase92Defaults` / `EW_EQUIPMENT_CATALOG` placeholders. This amend **publishes a starting ledger** so playtest has numbers, and **keeps them injectable**. A later remaster is a different scoped lane.

### Hard gate 8 — Screenshot / no-clip process continues for later engine

> The later engine PR continues the screenshot / no-clip process (1280×720; `clippedControls: []`; no EW control under the dock). This brief **does not** attach PNGs and **does not** open dockClear polish (that is a **separate UI item** / non-goal). An engine PR that lands poison / DF but leaves new 9.3 controls unscored for clip **fails** this brief’s process lock.

Lane owner (wording): **Number Four**.

Process lock is the same family as 9.1 / 9.2 / boarding / Phase 10: JSON overflow dump + NOTES + PNGs **in the engine PR**. Compare with `docs/phase9/screenshots/phase92/` and `docs/phase9/screenshots/baseline-main/`. Do not retune poison/DF numbers to “make the panel shorter.”

### Also from the room (score with the gates; not a ninth religion)

| Plan / room want | How this brief locks it |
| --- | --- |
| Scan-poison corrupts live Focused Scan / confidence / scan-progress | Gates 2–3. Book-only. Corrupt ≠ wipe. |
| Spend-to-suppress on reserved `ew`; no sixth consumer | Gate 1. Brown-out weakens. |
| Contact-book effects only; no hull spawn | Gate 2. Ghosts / decoys unchanged. |
| Never wipe delivered reports / FLASH / `knownIncidentIds` | Gate 3. |
| Never gift FS / culture / `engagement_authorized` | Gates 2–4. |
| DF assist = classification / cue / annotation | Gate 4. Not a lock. Not identity. |
| No identity from noise beyond true-side / paid emission | Gates 4–5. |
| HoJ silence→coast; no perfect silent track | Gate 4 + 9.1 gate 5. |
| Residue / burn-through / RSS / lobes / true-side still hold | Gate 5. |
| Preserve #33 / #35 / #37; do not reopen boarding / Phase 10 | Gate 6. |
| Magnitudes injectable playtest defaults | Gate 7. |
| Screenshot / no-clip continues (later engine) | Gate 8. DockClear polish **out**. |

### Must not break (cite landed work)

Score these as **preservation**. A Phase 9.3 Pass that regresses them is a Fail. **#33, #35, and #37 stay locked.** Boarding #38 / #39 and Phase 10 #40 / #41 stay locked.

| Locked rule | Cite | Phase 9.3 must not |
| --- | --- | --- |
| Detection ≠ identification ≠ track quality ≠ `firingSolution`. An old report is not a live lock. | Phase 6 hard gate 2; `src/phase6-sensors.js`; S9.2; Phase 9 gate 2; 9.1 gates 3 / 5; 9.2 gate 2 | Raise layers from poison / DF cue past what burn-through actually earned. Seed `firingSolution` from residue, emission, ghost, decoy, spoof-catch, escort share, poison, or DF annotation. |
| Hidden stays hidden on **both** sides. Lost tracks drop exact targeting on the **same tick**. | Phase 6 gates 3–4; S9.3–S9.5 | Leak a cloaked hull because a residue, decoy, silent-running, HoJ coast, or DF cue exists. Keep `combatTargetId` / `liveWeaponTrack` after `firingSolution` drops. Treat silent-running or a silenced jammer as still DF-perfect. |
| Passive / active never invent ID or `firingSolution`. `ew` is on the shared pool. | Phase 6 gate 6; Phase 6.5 gate 5; Phase 9 gate 1; 9.1 gate 1; 9.2 gate 1; S10.7 / S14.1 / S15.1 / S16.18 | Spend EW off-budget. Implement 9.3 effects at draw 0. Add a sixth consumer. Gift the flagship a suite from donor share. |
| Escorts share detection / last-known / residue only | Phase 6 §5.2 / Q3; 9.2 gate 2; `shareFormationDetection`; `shareEscortToFlagship`; S9 / S16.4 | Copy `firingSolution` either direction. Let donor share **gift FS** as a poison counter. Share when not in formation / not in range unless the injectable envelope says so. |
| Already-delivered reports and observer copies persist | Phase 4 `deliverReport` / `observerKnowsIncident`; S6.9; Phase 5 delivered knowledge; Phase 9 gate 3; S14.6–S14.8; S15.17; S16.9 | Delete, unsend, or rewrite `delivered`. Drop `knownIncidentIds` because poison ticked. Rewrite delivered `reports[id].confidence`. Let residue-delete wipe a report seed’s historical row. |
| FLASH append-only; no second offense pulse | Phase 4 §7.3; S6.14; S14.9 | Pulse FLASH as “scan-poison happened” unless a **new** FLASH-eligible incident is actually opened. Auto-FLASH from a DF cue or a poisoned scan. Unsend a FLASH that already fired. |
| Overdue ≠ destroyed ≠ attacker | Phase 5; S8 | Treat a poisoned / residue / silent-running / decoy / DF-classified convoy track as `destroyed` or invent `attackerId`. |
| Punishment tokens; standing once | Phase 4 §8; S6.4 | Charge standing again from an EW notice for a kill already tokenized. Charge standing from a DF classification or poisoned scan alone. |
| Culture cannot grant fire. `engagement_authorized` never injected. | Phase 1 / doctrine; Phase 6; Phase 9 gate 5; 9.1 gates 5–6; 9.2 gates 2–5; `consultDoctrineFire`; S14.16 / S15.12 / S16.17 | Write the fact from jam, lobe, residue, HoJ launch, escort share, spoof-catch, heat, decoy, silent-running, scan-poison, DF cue, or a delayed order. |
| Phase 3 refusal / inability are not aggression | Phase 3 / 4 | Turn comms disruption, a jammed hail, a late fleet order, transponder-off, scan-poison, or DF into `attackId` / fire. |
| Ghosts are book rows only; decoys ≠ hulls | Phase 9 gate 2; S14.3–S14.5; 9.1 gate 7; 9.2 gate 5 | Spawn a residue / poison / DF hull. Gift a lock to a ghost because burn-through, a lobe, or a cue exists. |
| Spend-to-suppress; burn-through; residue-before-void; RSS; true-side; HoJ row; claim-only; lobes; detection-only share | 9.1 gates 1–6; 9.2 gates 1–5; S15 / S16 | Drive Q to 0 for E>0. Delete the contact. Strongest-three / % ceiling. Friendly-from-claim. HoJ retune. Rewrite `playerFaction` from spoof, catch, or DF. Perfect-track silence. |
| Weapons matrix before overhaul; no universal shield bypass | Phase 9 gate 4; S14.12–S14.15 | Retune `game_items.json` to “finish DF / HoJ.” Inherit a lore bypass onto ordinary beams. Auto-fill empty weapon slots. |
| Tractor stays a device slot; boarding stays the boarded lane | Phase 9 gates 4 / 6; boarding #38 / #39; S14.13 / S14.18 / S17 | Move tractor; treat HoJ / jam / tractor hold / decoy / DF / poison as board / capture. Flip `tractorIsBoarding()`. Reopen capture XOR scuttle. Ship an XP table. |
| Catalog wire: 172 active, 38 aliases, Reman **53** | PR #28; S11 | Resurrect discarded IDs or a second Reman hull because a DF cue “needs a host.” Rewrite `playerFaction` / Reman unlock from a spoof, catch, or classification. |
| Phase 7 standing orders persist | PR #29; S12; Phase 9 / 9.2 must-not | Silently supersede `hold_outside` because poison or DF ticked. Drop parked stay-behind ships. |
| Phase 8 markets subscribe-only | PR #31; S13 | Restock, embargo-as-fire, or sell hull 53 from an EW flavor row. |
| Suites do not occupy a weapon slot | Phase 6.5 `installSensorSuite`; `occupiesWeaponSlot: false`; 9.1 slot | Steal the suite slot or a weapon mount for poison / DF. Stack two jammers. Treat DF as a second suite. |
| Phase 10 stories are knowledge layers | PR #40 / #41; S18 | Write `firingSolution` / `engagement_authorized` from a Dominion rumor because DF classified an emitter. Reveal Gamma from a cue. Touch `authorizedDeployment` debug defaults. |

Also preserve, without reopening:

- Authority is a political side (`isSystemControlled`), not a flown flag.
- Two ROE modes unchanged. Access is a permission, not a ceasefire.
- Phase 1 combat credit: only `player` / `playerEscort` final hits reward or blame.
- Phase 6 first-frame cloak, purposeful destinations, arrival/spacing/exit stay closed.
- Phase 6.5 generation / passive-vs-active draw / paid suites / role curves stay closed.
- Soft authored breakaway profiles stay **out**.
- Phase 9 four families (sensor jamming, ghosts, fire-control, comms disruption) stay named and costed. 9.3 **adds** named poison / DF controls on the same `ew` consumer; it does not replace the family contract.
- 9.1 dedicated `ew_equipment` slot, A × H spend, spin-up / cooldown on `localElapsedMs` stay.
- 9.2 lobes / escort share / spoof catch / comms-delay / heat / decoys / silent-running stay.
- Boarding: `BOARDING_IMPLEMENTED === true`; `tractorIsBoarding() === false`; away-team XP `not_tracked_yet`.
- Phase 10: `state.dominionBook` outside `systemStates`; stories ≠ FS.

### Process locks (implementation locks, not a change to gates 1–8)

- **Proposal first.** Do not implement from this text until Tenth scopes the engine lane after a brief Pass.
- **Blind bake-off.** Implement against bake-off `main` (**this** head after #41, `2ad94b7`), **not** remastered base `758665e`. Implement from `docs/` only. Do **not** crib `Artemis2028/BM1-remastered-work`.
- **Remastered EW pack / DESIGN is background shapes only.** Do **not** `git am` remastered patches. Do **not** lock remastered catalog EU/s, prices, or wattages as constants.
- **No invented balance numbers as locked constants.** Effect *shape*, poison *layer caps*, DF *cue forbids*, contest *formulas*, and fire-gate *forbids* are locked. §7 starting draws, durations, penalties, cue factors, and clocks are **playtest / TBD / injectable**.
- **#33, #35, and #37 Pass stay locked.** A PR that reopens Phase 9–9.2 gates, regresses S14 / S15 / S16, or “fixes” ghosts-as-hulls by spawning hulls fails this brief even if poison is green.
- **Do not reopen boarding #38 / #39 or Phase 10 #40 / #41.** A PR that flips `tractorIsBoarding`, ships capture-as-`destroyNpcShip`, gifts FS from a Dominion rumor, or retunes pack gates “for DF” fails this brief.
- **Subscribe, do not fork.** 9.3 writes call existing Phase 6 layer helpers (including `performActiveScan` / `resolveSearch` / `shareFormationDetection` / `shareEscortToFlagship`), Phase 6.5 draw / brown-out helpers, Phase 9 `ewBook` / matrix helpers, Phase 9.1 contest / residue / claim / HoJ helpers, Phase 9.2 Focused Scan / heat / decoy / lobe helpers, Phase 7 `fleetOrders`, Phase 3 `makeBroadcast`, Phase 4 `deliverReport`. Do not implement a second contact book, a second incident ledger, a second contest, a second weapons matrix, a second boarding book, or a second `dominionBook`.
- **§13 saved timers:** poison duration, DF dwell, Focused Scan stall, and contest use `localElapsedMs`. Do not persist `performance.now()` as a deadline.
- **Screenshot / no-clip process lock continues** for the later engine PR (gate 8). This brief attaches **no** PNGs. DockClear polish is **out**.
- **No Pass claimed** in `docs/BAKEOFF-STATUS.md` from this PR.

## 3. Scan-poison (gates 1–3)

**Lane owner (wording):** Number 2 on corrupt ≠ wipe; Number Four on `ew` spend / live-layer hooks.

### 3.1 Named family / control, billed on reserved `ew`

Phase 9 four families stay named. Scan-poison is a named **9.3 family or control** (name can change: `scan_poison`) with the four-part contract. It may ride as a sibling of `sensor_jamming` / `fire_control` — it is **not** a sixth `POWER_CONSUMERS` entry and **not** a replacement of the four.

| Piece | Shape | Must not |
| --- | --- | --- |
| Cost | Extra reserved **`ew`** draw (injectable). A × H / brown-out apply | Off-budget poison; a sixth consumer; Sensors-billed poison that skips `ew` |
| Duration | `localElapsedMs` window | `performance.now()` deadline |
| Counter | ECCM Boost / better suite / leave field / donor share (detection / last-known / residue **only**) | Gifted FS from share; cloak-void; wipe reports |
| Attribution | Using poison in a holding may journal; default `record_only` | Auto-fire / second FLASH / standing-from-poison-alone |

S=0 / brown-out-dead / draw-0 + On **fails**. Player and NPC face the same consumer.

### 3.2 Live layers only

Exact names can change:

```js
{
  contactId: 'ctc-41',
  observerKey: 'player',          // victim observer
  subjectKey: 'npc:security-instance-7',
  detected: true,                 // residue floor still true
  identification: 'partial',      // may drop; not a wipe of the row
  trackQuality: 'area',           // may drop toward residue; not none-and-gone
  firingSolution: false,          // may drop; never gifted by poison
  scanConfidence: 0.35,           // name can change; live mark only
  scanProgress: {                 // name can change
    searchStatus: 'running',      // may stall / jitter; not deleted
    focusedScanStatus: 'dwelling',
    stallLocalMs: 800
  },
  focusedScanPoisoned: true,
  residue: true,                  // 9.1 floor still legal
  ghost: false,
  decoy: false,
  source: 'active_scan',          // do not re-source as a new hull
  reportConfidenceUntouched: true
}
```

Focused Scan (`runFocusedScan` / `ew92.focusedScans`): poison may set `status` unreliable, extend `untilLocalMs` (stall), or fail the catch **this tick**. A poisoned dwell that still runs still wrote Sensors emission (9.2). Poison does not skip that emission and does not rewrite `playerFaction`.

`contact.search` (`resolveSearch`): poison may keep `pending: true` past the unpoisoned dwell, or mark `failed` without inventing coordinates. It must not complete the search as `firingSolution: true` the victim did not earn.

`scanEmission`: remaining time may jitter; the emission is still detectable (Phase 6 gate 6). Poison is not a silent omniscience field.

### 3.3 Corrupt ≠ wipe

| In flight (may corrupt) | Already landed (must survive) |
| --- | --- |
| Live Focused Scan dwell / result on the observer row | Delivered `incidentLedger.reports[id]` (`delivered !== false`) |
| Live `scanConfidence` / ident certainty / catch reliability | `knownIncidentIds` / `observerKnowsIncident` |
| Live `contact.search` / `scanEmission` / Focused Scan clocks | FLASH queue entries and journal history already fired |
| Live ID / firm / FS (may degrade toward **residue**) | Phase 5 board facts the observer already knows |
| A **new** deliver still under 9.2 comms-delay rules | `seedFromReport` historical row; report `.confidence` |

`applySensorJamming` already returns `reportsDeleted: false`. Poison **must** keep that contract. `tryDeliverReport` still `erasedByJamming: false`.

### 3.4 Counters (detection-only share still cannot gift FS)

| Counter | Shape | Must not |
| --- | --- | --- |
| **ECCM Boost** | Suite control (9.1). Injectable resist on poison penalty when S>0 | Second jammer; off-budget; resist-at-draw-0 |
| **Better suite** | Equipment axis (Phase 6.5). Higher S / science-survey may shrink poison | Steal the suite slot; a second sensor religion |
| **Leave field** | Out of poison / jammer envelope (range / lobe). Live layers recover under **Phase 6 earn rules** | Instant gifted FS on exit |
| **Donor share** | 9.2 escort → flagship: detection / last-known / residue only | Copy escort FS / ident-known / `engagement_authorized` “because poison” |

Player-facing line (names can change):

- `Scan poisoned. Live Focused Scan / confidence degraded — residue held. Delivered reports still in the journal. Not a cloak, not a firing solution.`

If the UI says “FLASH erased” / “contact deleted” / “weapons free because their scan is junk,” the family is not ready.

### 3.5 What scan-poison must not do

- Skip `ew` draw.
- Drive Q to 0 for a funded receiver.
- Delete contacts; set `detected: false` + prune as the only poison outcome.
- Wipe or rewrite delivered reports / FLASH / `knownIncidentIds`.
- Gift `firingSolution`, culture fire, or `engagement_authorized`.
- Spawn a hull; mark poison as `ghost: true` on a living subject.
- Rewrite Phase 1 / Reman / claim layer.
- Use donor share as a telepathic lock.
- Touch boarding prize identity or `state.dominionBook` knowledge layers.
- Persist stall clocks as `performance.now()`.

## 4. DF assist (gate 4)

**Lane owner (wording):** Number 2 on classification ≠ lock / ≠ identity; Number Four on cue / annotation hooks.

### 4.1 Classification / cue / annotation of known paid emissions

DF assist is a named **9.3 family or control** (name can change: `df_assist`) billed on reserved **`ew`**. It classifies **known jamming emissions** — paid `ew` fields the observer can actually hear (in-lobe, after 9.1 contest / 9.2 mask).

| Product | Allowed | Forbidden |
| --- | --- | --- |
| **Emitter family cue** | `sensor_jamming` / `ew_decoy` / heat-loud / unlabeled-paid (names can change) | Invent `klingon` / Reman / a hull class from leftover N |
| **Bearing / lobe annotation** | Cue heading toward a **paid** emitter; in-beam vs out | Gifted hull `firingSolution`; aim that writes `liveWeaponTrack` |
| **True-side label** | Own / friendly / mixed / unlabeled from 9.1 telemetry | Friendly-from-claim; spoofedFaction as the DF identity |
| **Seeker cue quality** | Improve HoJ heading while emission is paid | Perfect-track when draw → 0 / cloaked / silent-running |
| **Heat readability** | Loud (unsuppressed) easier to classify; quiet (paid suppress) harder | Classify a jammer that is Off / draw 0 |

Exact names can change:

```js
{
  observerKey: 'player',
  subjectKey: 'npc:security-instance-7',  // emitting incarnation — not npc.id
  cue: {
    family: 'sensor_jamming',             // or ew_decoy / heat / unlabeled_paid
    bearing: { x, y },                    // emission geometry, not a lock
    inLobe: true,
    trueSideLabel: 'unlabeled',           // 9.1 labels only
    heatScale: 1.0,
    paidDraw: 1.6,
    silent: false
  },
  firingSolution: false,                  // hard
  liveWeaponTrack: false,
  engagement_authorized: undefined,
  identityInvented: false,
  claimRewritten: false,
  perfectSilentTrack: false,
  source: 'ew_df_assist'
}
```

ECCM Boost on the **suite** may improve cue quality when S>0 (equipment axis). It is not a second jammer and not a gifted ID.

### 4.2 What DF may not invent

- Identity from noise alone beyond true-side / paid emission already allowed by 9.1 gate 4 / 9.2 true-side.
- A transponder claim rewrite (`off` / `true` / `spoofedFaction` stay the 9.1 layer; 9.2 catch stays the catch path).
- Phase 1 `playerFaction` / `playerSide` / Reman **53** / two-mode ROE.
- Culture fire or `engagement_authorized`.
- A hull. A ghost. A decoy-as-lock.
- Classification of a **silent** field (draw 0 / residue-without-emission) as a live emitter.

Quiet leftover N after self-cancel is **noise**, not a guessed Romulan. That 9.1 sentence still holds.

### 4.3 HoJ: cue quality, not perfect silent track

9.1 seeker contract **stays**: emission-only, incarnation-lock on `securityInstanceId`, silence→coast, private munition knowledge, launch ≠ observer FS, launch ≠ `engagement_authorized`.

DF assist may:

- Tag the seeker’s cue with family / bearing **while** `emitterDraw > 0`.
- Improve heading quality by an injectable factor (playtest).

DF assist must not:

- Set `perfectSilentTrack: true`.
- Keep homing after `silenceEmitter` / silent-running / cloak.
- Transfer the cue onto ambient `npc.id` reuse.
- Write the observer contact `firingSolution: true` because a seeker is in flight.

Decoys remain a legal HoJ counter (9.2). DF may classify a decoy emission as `ew_decoy` without converting it into a hull or a lock.

### 4.4 Player-facing line

- `DF assist: paid jammer emission classified. Cue only — not a firing solution, not identity. Silence still coasts.`

If the UI says “lock gifted” / “identity rewritten” / “weapons free because we DFed them” / “still tracking the silent hull,” the family is not ready.

### 4.5 What DF assist must not do

- Skip `ew` draw (or claim it is “just Sensors” while rewriting contacts at draw 0).
- Gift `firingSolution` / `liveWeaponTrack` / `engagement_authorized`.
- Invent identity from unlabeled noise.
- Rewrite the claim layer or Phase 1 / Reman.
- Perfect-track silent / cloaked hulls.
- Spawn a classified hull.
- Replace 9.1 RSS / true-side / 9.2 lobes with a parallel contest.
- Use escort share to copy a cue as a flagship lock.
- Pulse FLASH or charge standing from classification alone.

## 5. Landed contest still holds (gate 5)

**Lane owner (wording):** Number Four.

Scan-poison and DF **subscribe** to the 9.1 / 9.2 contest. They do not replace it.

| Landed piece | 9.3 still |
| --- | --- |
| Paid `cᵢ` after A × H, self-cancel, range falloff | Unpaid / draw-0 / brown-out-dead add 0 |
| Lobe mask before RSS | Out-of-lobe is zero contribution from **that** emitter, not cloak |
| `N = √Σ(cᵢ_lobe²)` | No strongest-three. No % ceiling |
| `Q = E/(E+N)`; RF radius `B × √Q` | Funded receiver ⇒ radius **> 0** |
| Residue-before-void | Poison floors at residue; never delete-the-contact |
| True-side labels | Own / friendly / mixed from `sideId` / `playerSide` / fresh telemetry, never claim, never DF-invented polity |
| Friendlies in-lobe take N | No IFF notch from DF classification |

Player-facing line:

- `Interference. Burn-through available — not a cloak. Scan poisoned / DF cue as marked. Residue held.`

## 6. Preserve P9–9.2, boarding, Phase 10 (gate 6)

**Lane owner (wording):** Referee / One.

Restate only as preservation:

- Phase 9 six gates + S14 + PR #33.
- Phase 9.1 seven gates + S15 + PR #35.
- Phase 9.2 eight gates + S16 + PR #37.
- Boarding eight gates + S17 + PR #38 / #39. `tractorIsBoarding() === false`. Do not open a second prize path from poison / DF.
- Phase 10 seven gates + S18 + PR #40 / #41. Do not classify a Dominion rumor as a live emitter lock. Do not reveal Gamma from a cue.

## 7. Magnitude playtest ledger (gate 7)

**Lane owner (wording):** Number Four.

These are **starting injectable defaults** for playtest. They are **not** remastered watts, **not** locked constants, and **not** a Referee-certified balance. Mark every number **TBD / playtest**. Override must change the snapshot. Soft gate: S4–S18 / catalog / doctrine / boarding / Phase 10 stay green with this ledger loaded as defaults.

### 7.1 How to override

Same pattern as 9.2:

| Hook already landed | 9.3 addition |
| --- | --- |
| `resolveEwMagnitudes(injected)` (`src/phase9-ew.js`) | Optional poison / DF family rows if named on `ewBook` |
| `resolveEwMagnitudes` / `EW_EQUIPMENT_CATALOG` (`src/phase91-ew-slot.js`) | Compact / Tactical / Fleet unchanged as shape |
| `resolvePhase91Defaults(injected)` (`src/phase91-power.js`) | A × H clocks, self-cancel, ECCM boost, B |
| `resolvePhase92Defaults(injected)` (`src/phase92-magnitudes.js`) | Lobes / share / heat / decoy / silent / Focused Scan |
| Probe `__BM1_PROBE__.phase92` magnitudes / defaults | `__BM1_PROBE__.phase93.injectMagnitudes` / `snapshot.magnitudes` |
| `MAGNITUDES_LOCKED_FROM_REMASTERED === false` | **Stays false.** Fail if a “Flash/remastered watt lock” flag appears |

Recommended new helper (name can change): `resolvePhase93Defaults(injected)` merging §7.3. Offline tests assert: inject `{ scanPoisonEwDraw: 0.9 }` ⇒ snapshot poison draw 0.9; omit inject ⇒ playtest default; remastered-lock flag false.

### 7.2 Carry-forward 9.1 / 9.2 placeholders (still playtest)

Do **not** treat these as newly invented remastered EU/s. They are the bake-off injectable placeholders at `2ad94b7`, republished so 9.3 playtest has a single ledger.

| Symbol / tier | Starting playtest default | Notes |
| --- | --- | --- |
| Compact draw / strength / radius | 1.2 / 2 / 400 | `EW_EQUIPMENT_CATALOG.compact` |
| Tactical draw / strength / radius | 2 / 3.5 / 700 | Mid tier |
| Fleet draw / strength / radius | 3.2 / 5 / 1100 | Still one slot |
| Spin-up / cooldown | 1000 / 2000 ms | `localElapsedMs` |
| Self-cancel | 0.25 | Own emitter |
| ECCM Boost | × 1.4 on E | Suite control; S=0 unavailable |
| Burn-through B | 200 | `B × √Q` |
| Lobe half-angle α | 50° | 9.2. 180° reproduces isotropic 9.1 |
| ECCM share radius | 360 | Detection-only share |
| Focused Scan dwell / extra Sensors | 1500 ms / 0.4 | Still Sensors, not hidden `ew` |
| Heat suppress extra `ew` | 0.6 × catalogDraw | Quiet jam harder to DF |
| Family draws (jam / ghost / FC / comms) | 1.6 / 1.4 / 1.8 / 1.5 | Phase 9 `EW_MAGNITUDES` |

Prices remain **null / TBD**.

### 7.3 New 9.3 playtest defaults

| Symbol | Starting playtest default | What it is |
| --- | --- | --- |
| **Scan-poison `ew` draw** | **1.1** | Gate 1. Extra reserved `ew`. |
| **Scan-poison duration** | **7000 ms** | `localElapsedMs`. |
| **Scan-poison confidence factor** | **0.45** | Live confidence scale when poisoned (1 = unpoisoned). |
| **Focused Scan stall extra** | **1200 ms** | Added to dwell while poison is live. |
| **Scan-progress stall factor** | **1.8** | Multiplies remaining search / emission clocks. |
| **ECCM poison resist** | **0.5** | Boost shrinks poison penalty when S>0 (injectable). |
| **DF assist `ew` draw** | **0.8** | Gate 1. Spend-to-classify. |
| **DF assist duration / dwell** | **6000 ms** | `localElapsedMs`. |
| **DF cue quality (loud / paid)** | **0.75** | Heading / family confidence while unsuppressed heat. |
| **DF cue quality (heat-suppressed)** | **0.25** | Quiet jam harder to classify. |
| **DF cue quality (draw 0 / silent)** | **0** | Silence → no live cue; HoJ coasts. |
| **DF range** | **700** | Playtest; still not a lock radius. |

Exact watts and milliseconds remain **TBD / playtest**. Shape is locked: override works; remastered lock flag false; suite green at these defaults.

### 7.4 Soft gate

With this ledger as defaults (no inject):

- `test:phase1` / `test:phase3`–`test:phase9` / `test:phase91` / `test:phase92` / `test:boarding` / `test:phase10` / `test:catalog` / `test:doctrine` stay green.
- S14–S18 replay without wattage asserts becoming hard locks.
- A fixture that **requires** remastered Flash EU/s **fails** this brief.

## 8. Screenshot / no-clip process (gate 8)

**Lane owner (wording):** Number Four.

This brief is **docs-only**. DockClear polish is a **non-goal** (separate UI item). The later engine PR still:

| Check | Pass | Fail |
| --- | --- | --- |
| No-clip | `clippedControls: []` on OPS/EW (including new poison / DF controls), Inventory, Settings, Target | New 9.3 control under the dock |
| Screenshots | 1280×720 before/after in `docs/phase9/screenshots/phase93/` (engine PR, not this brief) | Engine PR with no shots |
| Overflow | Contained `overflow-y: auto` is OK; horizontal overflow is not; clip-out-of-box is not | Horizontal overflow or clipped EW controls |
| Not EW math | Do not retune poison/DF to “make the panel shorter” | Mixing fit into contest numbers |
| Not dockClear polish | Do not treat this brief as the dock-overlap UI lane | Reopening 9.2 gate 7 as if unfinished work belonged here |

## 9. Controls shape

**Lane owner (wording):** Number Four on engine; copy can wait.

Exact widget names can change. If the control cannot say **state**, **why it is limited**, and **whose scan is poisoned / whose emission is classified**, it is not ready.

| Control | States (shape) | Notes |
| --- | --- | --- |
| **Jammer** | Off / On / Spin-up / Cooldown / Power-limited | 9.1. Still slot + S>0 + funded `ew`. |
| **Lobe** | Heading + half-angle (readout) | 9.2. Default hull facing. |
| **ECCM** | Off / Boost via **suite** | Resist poison + help DF cue. Not a second jammer. |
| **Escort share** | In-range / formation vs out | Detection-only. Poison counter, not a gifted-lock toggle. |
| **Transponder** | Off / True / Spoof | 9.1 claim. DF does not rewrite it. |
| **Focused Scan** | Idle / Dwelling / Result / Poisoned | Sensors path. Detectable. Poison may stall / fail result. |
| **Scan-poison** | Off / On / Power-limited | Extra `ew`. Live layers only. |
| **DF assist** | Off / On / Cue-live / No-emission | Extra `ew`. Classification / cue only. |
| **Heat suppress** | Off / Paying | 9.2. Quiet jam harder to DF. |
| **Decoys** | Off / On (count) | Book-only. DF may tag `ew_decoy`. |
| **Silent-running** | Off / On | Not cloak. DF cue quality → 0 when silent. |
| **Receiver** | Clear / Interference + Own / Friendly / Mixed | 9.1 true-side. DF must not invent a polity. |

## 10. Acceptance exercises (S19)

Keep all existing Phase 1 / S4–S18 / doctrine / catalog / side-lane / boarding / Phase 10 gates green. **S14 stays the Phase 9 lock. S15 stays 9.1. S16 stays 9.2. S17 stays boarding. S18 stays Phase 10** — replay, do not rewrite. Add S19 fixtures that fail setup if the scan-poison helper, DF-cue helper, magnitude-override helper, or live-layer-vs-report helper is missing. Classification-only asserts are insufficient for “delivered report still present,” “FS not gifted,” “silent hull not perfect-tracked,” and “override changed poison draw.”

Number Three owns the probe gate **after** engine, not this brief. IDs are a sketch; do not promise a final count. S16.x / S18.x extension numbers are acceptable if Tenth prefers not to mint S19; the **cases** below are the score.

| Case | Required exercise and result |
| --- | --- |
| **S19.1** Scan-poison spends reserved `ew` | Poison On: `ew` draw **increases**, consumer still exactly the five, no sixth name. Off-budget poison (On, draw 0) **fails**. Brown-out / H→0 **weakens**. S=0 unavailable. |
| **S19.2** Book-only; no hull | Inject poison. `npcShips` count unchanged. No new `ew_ghost` hull. Ghost family still book-only (replay S14.3–S14.5). Decoys still `ew_decoy` (replay S16.12). |
| **S19.3** Live Focused Scan corrupts; catch ≠ identity | Start Focused Scan dwell (Sensors emission written). Inject poison: dwell stalls or result unreliable / catch fails this tick. `playerFaction` / `playerSide` / Reman 53 / ROE **unchanged**. **No** `engagement_authorized`. Replay S16.7 family without identity rewrite. |
| **S19.4** Live confidence / scan-progress corrupt; row not voided | Live ident/track/confidence drop toward residue. `contact.search` stalls or fails **without** invented coordinates. Row **still present**. `firingSolution` may drop; never rises from poison. Residue mark legal (replay S15.6–S15.7). |
| **S19.5** Corrupt ≠ wipe delivered reports | Replay S14.6–S14.8 / S15.17 / S16.9 under poison: report still delivered, `knownIncidentIds` still listed, `erasedByJamming: false`, delivered `reports[id].confidence` unchanged. FLASH history untouched. New deliver may still delay under 9.2 comms rules only. |
| **S19.6** Poison counters: ECCM / suite / leave / donor share | ECCM Boost + S>0 shrinks poison penalty. Leave envelope: layers recover only under Phase 6 earn / burn-through. Donor share: flagship may gain detection / last-known / residue; **`firingSolution === false`** until its own earn. Replay S16.4–S16.5. |
| **S19.7** DF assist spends `ew`; cue only | DF On + paid in-lobe jammer: draw > 0, cue present, `firingSolution === false`, `engagement_authorized` absent, `identityInvented === false`. Draw 0 + DF On **fails**. |
| **S19.8** DF does not invent identity from noise | Unpaid / unlabeled leftover N: no polity name, no `spoofedFaction` write, no Phase 1 write. True-side own/friendly/mixed still from telemetry (replay S15.10). Claim layer unchanged (replay S15.14 / S16.7). |
| **S19.9** HoJ cue quality; silence→coast | Launch on paid emission with DF cue: heading may improve. Emitter silences / silent-running On: seeker **coasts**, `perfectSilentTrack === false`, observer FS not set. Replay S15.11–S15.13 / S16.20. Decoy emission may classify as `ew_decoy` without a hull. |
| **S19.10** Burn-through / residue / RSS / lobes still hold | Replay S15.4–S15.10 / S16.1–S16.3 with poison and/or DF live: funded E ⇒ radius > 0; residue survives; RSS in-lobe paid only; friendlies in-lobe take N; no strongest-three; Q not driven to 0 for E>0. |
| **S19.11** Magnitude override / not remastered lock | Inject poison draw / DF cue quality / stall ms. Snapshot matches inject. `MAGNITUDES_LOCKED_FROM_REMASTERED === false`. No remastered patch applied. Defaults from §7 load without suite failure (soft). |
| **S19.12** Fire gates / culture / boarding / Phase 10 preserved | Replay S14.16–S14.18 / S15.12 / S16.17 / S17.5–S17.6 / S18 stories≠FS: no `engagement_authorized` from poison or DF. `tractorIsBoarding() === false`. Boarding APIs unchanged. Dominion rumor still not a lock. No culture fire. |
| **S19.13** Phase 6 / 6.5 / 9 / 9.1 / 9.2 power preserved | Replay S9.1–S9.5, S10.7, S14.1, S15.1–S15.3, S16.18: first-frame cloak; four layers (poison/DF are marks, not a fifth religion); shared generation; `ew` still the reserved consumer; dedicated slot; lobes/share/catch/heat/decoy/silent still behave. |
| **S19.14** Phase 4/5/7/8 / catalog preserved | After 9.3 ticks: S6.4 standing once; S6.13 `protect` still folds; S6.14 no second FLASH from append; S8 overdue ≠ destroyed ≠ attacker; S12 hold-outside persists; S11 Reman 53 / aliases; S13 markets not restocked; `meetPackPurchaseDecision` untouched. |
| **S19.15** Both sides | NPC poison vs player observer and player poison vs NPC observer; NPC DF vs player jammer and player DF vs NPC jammer: same `ew` consumer, same live-only corrupt, same cue ≠ FS, same silence→coast, same no identity rewrite. |
| **S19.16** Screenshot / no-clip (engine PR) | 1280×720: OPS/EW including poison / DF, Inventory, Settings, Target. `clippedControls: []`. Overflow JSON recorded. Horizontal overflow **fails**. Docs-only brief: **N/A** (process lock; no PNGs here). DockClear polish **not** required by this case. |

Each case may contain multiple assertions. Include startup smoke. Do not claim a Referee Pass from this list.

## 11. Non-goals

Phase 9.3 will not:

- `git am` the remastered EW complete patch, or treat remastered DESIGN as engine source.
- Lock remastered wattages / EU/s / prices / HoJ costs as constants (even if §7 playtest defaults exist).
- Reopen Phase 9’s six hard gates, Phase 9.1’s seven, Phase 9.2’s eight, or regress PR #33 / #35 / #37 / S14 / S15 / S16.
- Reopen boarding #38 / #39 or Phase 10 #40 / #41 (capture / scuttle / command transfer / Dominion campaign / pack gates).
- Reopen Phase 6 gates 1–8 or Phase 6.5 gates 1–5 (except continuing to use the reserved `ew` consumer **on**).
- Implement a **fleet jammer net** or **telepathic FS share** (9.2 detection-only share stays the cap).
- Add a **new directional decoy** beyond existing `ew_decoy` (unless a counter **note** that DF may classify the landed decoy).
- Magnitude retune as locked remastered watts.
- **dockClear polish** (separate UI item). Screenshot / no-clip still continues for later engine.
- Gift `firingSolution` or `engagement_authorized` from poison, DF, escort share, decoys, spoof-catch, lobes, heat, silent-running, or HoJ.
- Wipe, unsend, or rewrite already-delivered Phase 4/5 reports or observer copies; unsend FLASH; rewrite delivered report confidence.
- Grant universal shield bypass, or retune weapons / HoJ combat numbers.
- Collapse pursuit, permission to engage, and the per-weapon gate.
- Treat poison / DF / late order as aggression / auto-fire, or pulse FLASH as a default jammer tick.
- Rewrite `playerFaction` / `playerSide` / Reman / catalog access from transponder spoof, catch, or DF classification.
- Treat silent-running or transponder-off as cloak, or residue / decoy / DF cue as a Phase 9 ghost hull.
- Add a sixth power consumer, a fifth required OPS slider, or steal a weapon / suite slot.
- Strongest-three cutoff, 59.2%/35% ceilings, or “delete the contact” as the poison success condition.
- Perfect-track silent / cloaked hulls because DF is On.
- Activate Phase 3 `unknown` access enforcement as a new 9.3 religion.
- Touch `Artemis2028/BM1-remastered-work` as an implementation source.
- Claim a Referee Pass in `docs/BAKEOFF-STATUS.md`.

## 12. Implementation sequence and handoff

1. **Brief Pass.** Referee / One score the **eight** hard gates. Number 2 scores gates **2, 3, 4** (book-only / corrupt≠wipe / DF≠FS) and preservation wording on ghosts / reports / fire / claim. Number Four scores gates **1, 5, 7, 8** (`ew` draw, contest subscribe, magnitudes, screenshot process) and the engine half of **2** / **3**, and confirms gate **6** is not a reopen / no boarding hook / no Dominion hook. Do not open an engine PR on this document alone.
2. **Tenth scopes the engine lane** after Pass. Blind implement from `docs/` against bake-off `main` after #41 (`2ad94b7`). Do not implement from remastered `758665e`.
3. **Suggested order if scoped:** magnitude ledger + override hook (S19.11) → poison spend on reserved `ew` (S19.1) → live-layer corrupt with residue floor (S19.3–S19.4) **before** any “stronger poison” → report-survive (S19.5) → counters including detection-only share (S19.6) → DF cue on paid emission (S19.7–S19.8) → HoJ silence→coast with cue (S19.9) → contest preservation (S19.10) → preservation (S19.12–S19.15) → engine screenshots (S19.16). **Do not** ship contact-delete poison. **Do not** ship DF-as-FS. **Do not** ship silent perfect-track.
4. **Number Three** adds/runs S19 after engine. Keep Phase 1 / S4–S18 / `test:catalog` / `test:boarding` / `test:phase10` green. Do not weaken S14–S18 to make S19 pass.
5. Changelog / status Pass wait on Referee after review. This proposal PR may note that the brief is open; it must not write a Pass.

If one model implements a later slice (fleet jammer net, new directional decoy, dockClear polish, boarding reopen, Dominion reopen), reserve a separate review pass. Fable can edit jam/journal copy after the paths work.

## 13. Open questions

Mark these clearly. They do **not** weaken the hard gates.

| ID | Question | Default if engine is scoped before an answer |
| --- | --- | --- |
| Q1 | Exact playtest numbers beyond §7? | **TBD / injectable.** S19.11 asserts override + no remastered lock, not a wattage freeze. |
| Q2 | Scan-poison as a fifth named `EW_FAMILIES` entry vs a control of `sensor_jamming` / `fire_control`? | **Named 9.3 control / sibling** on reserved `ew`. Do not add a sixth consumer. Do not replace the four Phase 9 families. |
| Q3 | Is `scanConfidence` a new field vs lowering ident / catch reliability in place? | Either is fine if probes can tell live corrupt from delivered-report wipe, and FS stays ungifted. **Not** a fifth Phase 6 information religion. |
| Q4 | DF assist billed on `ew` vs riding suite ECCM only? | **Billed on `ew`.** ECCM Boost may **help** cue quality when S>0. Unavailable at S=0 / draw 0. |
| Q5 | May DF name decoy vs jammer as distinct family tags? | **Yes**, as cue/annotation of paid emission (`ew_decoy` vs jam). Still not a hull and not FS. |
| Q6 | Split engine PRs (poison vs DF vs screenshots)? | Tenth decides after Pass. Gate 6 still forbids regressing #33/#35/#37 and reopening boarding / Phase 10. |
| Q7 | Difficulty knobs? | **Out.** Political identity stays the same. |
| Q8 | Fleet jammer net / telepathic FS share? | **Out** (non-goal). Detection-only escort envelope stays. |
| Q9 | dockClear polish in the same engine PR? | **Out** of this brief. Screenshot / no-clip still required for later engine (S19.16). |

## 14. Lanes

| Who | Owns | Scores |
| --- | --- | --- |
| **Number 2** | Doctrine / knowledge bounds: gates **2, 3, 4** (book-only / corrupt≠wipe / DF≠FS), preservation of ghosts / delivered reports / fire gates / no `engagement_authorized` / claim layer / HoJ silence→coast | Poison ≠ report wipe ≠ hull; DF ≠ gifted FS ≠ identity; jam ≠ auto-fire |
| **Number Four** | Engine: gates **1, 5, 7, 8** (`ew` draw / no sixth consumer, contest subscribe, playtest magnitudes, screenshot process) plus poison/DF **hooks** (scan layers, cue annotations). Engine must not hook boarding or Dominion or reopen #33/#35/#37 | Spend on reserved `ew`; live layers only; cue annotations; override works; no remastered watts locked; later no-clip |
| **Number Three** | Probe gate **after** engine (S19 on `__BM1_PROBE__` / offline tests; S4–S18 stay green) | Not this brief |
| **Referee / One** | This brief vs the **eight hard gates** in §2. **Do-not-open** check: no #33/#35/#37 reopen, no boarding #38/#39 reopen, no Phase 10 #40/#41 reopen, no `git am`, no Referee Pass claimed from this PR | **Before** any engine PR |

## 15. Deferred work remains on the plan

Fleet jammer net / telepathic FS share, a new directional decoy beyond `ew_decoy`, dockClear polish, deeper spoof UI (voice / IFF art), a fitted HoJ catalog id, empty-but-armable persistence, boarding/Dominion **reopen**, construction visuals, HTML review catalogs, and difficulty knobs stay on the convergence backlog. Independently addressable deep-space locations remain the plan §8 later add. Activating `unknown` access still waits on a later scoped slice. A **weapon overhaul** still waits on the reviewed Phase 9 matrix **plus** the HoJ row from 9.1 **plus** a later Tenth-scoped retune.

Phase 9.3 is ready to score when a reader can mark Pass/Fail on all eight gates: reserved `ew` only with no sixth consumer; book-only effects with ghosts/decoys unchanged; scan-poison corrupts live Focused Scan / confidence / scan-progress only and never wipes delivered reports; DF assist is classification/cue only and never gifts FS / culture / `engagement_authorized` or perfect-tracks silence; residue / burn-through / RSS / lobes / true-side from 9.1/9.2 still hold; #33/#35/#37 preserved and boarding / Phase 10 not reopened; injectable playtest magnitudes not remastered locks; screenshot / no-clip process continues for later engine.

## Sources and precedence

- This amend’s engine checklist: `docs/phase9/BM1-PHASE9.3-ENGINE-DEPENDENCIES.md`.
- Phase 9.2 locked baseline (do not reopen): `docs/phase9/BM1-PHASE9.2-EW-DEPTH-PROPOSAL.md`; `docs/phase9/BM1-PHASE9.2-ENGINE-DEPENDENCIES.md`; `src/phase92-*.js`; PR #37 (`f9f077f`); S16.
- Phase 9.1 locked baseline (do not reopen): `docs/phase9/BM1-PHASE9.1-EW-ROBUSTNESS-PROPOSAL.md`; `docs/phase9/BM1-PHASE9.1-ENGINE-DEPENDENCIES.md`; `src/phase91-*.js`; PR #35 (`d1837fe`); S15.
- Phase 9 locked baseline (do not reopen): `docs/phase9/BM1-PHASE9-EW-WEAPONS-PROPOSAL.md`; `docs/phase9/BM1-PHASE9-ENGINE-DEPENDENCIES.md`; `src/phase9-ew.js`; `src/phase9-weapons-matrix.js`; PR #33 (`2b38a14`); S14.
- Boarding locked (do not reopen): `docs/boarding/`; PR #38 / #39; S17. `tractorIsBoarding()` stays false.
- Phase 10 locked (do not reopen): `docs/phase10/`; PR #40 / #41; S18. Stories stay knowledge layers.
- Plan §4 Phase 9 exit and §11 EW and weapons: `docs/revised-development-plan.md`.
- Phase 6 layers / contact book / search / active scan / escort share: `docs/phase6/BM1-PHASE6-SENSORS-CLOAK-SYSTEM-SPACE-PROPOSAL.md`; `src/phase6-sensors.js` (`performActiveScan`, `resolveSearch`, `createScanEmission`, `shareFormationDetection`); PR #24; S9.
- Phase 6.5 reserved EW consumer, suites, brown-out: `docs/phase6/BM1-PHASE6.5-POWER-SENSORS-SUITES-PROPOSAL.md`; `src/phase65-power.js`; PR #27; S10.7.
- Phase 7 fleet orders / hold-outside / comms-delay: `src/phase7-fleet.js`; `src/phase92-comms.js`; PR #29; S12 / S16.10.
- Phase 4 reports / FLASH / tokens / allowlist: `docs/phase4/`; `src/phase4-incidents.js`; PR #13; S6.
- Phase 5 delivered knowledge / overdue ≠ destroyed ≠ attacker: `docs/phase5/`; `src/phase5-objectives.js`; PR #21; S8.
- Phase 3 broadcast / access: `src/phase3-checkpoints.js` `makeBroadcast`; unknown stored, not enforced.
- Fire gates / no `engagement_authorized`: Phase 1; `src/doctrine.js` `deriveLiveFireFacts`; `consultDoctrineFire` in `src/main.js`.
- Phase 1 identity: `state.playerFaction` / `state.playerSide`; Reman **53** via catalog wire + side-lane unlock — not a transponder field, not a DF write, and not a poison write.
- 9.2 Focused Scan / heat (already says loud jam is easier to DF): `src/phase92-spoof-catch.js`; `src/phase92-heat.js` `heatSayable`.
- Remastered EW pack / DESIGN: **background shapes only**. Not a patch source. Not a constant lock. Not `758665e`.
- Bake-off process: `docs/BAKEOFF-STATUS.md` (this PR may note the 9.3 brief is open; no Pass claimed; #33 / #35 / #37 remain the locked Phase 9–9.2 engine baselines; boarding #38/#39 and Phase 10 #40/#41 stay locked).

Settled Phase 1–10 behavior, Phase 9’s six gates, Phase 9.1’s seven gates, Phase 9.2’s eight gates, PR #33, PR #35, PR #37, boarding #38/#39, Phase 10 #40/#41, and these eight Phase 9.3 gates take precedence over older handoff text that treated scan-poison as a report wipe, DF as a gifted firing solution, emission taxonomy as Phase 1 identity, remastered watts as live locks, or HoJ as a perfect silent track.
