# BM1 Phase 9.2 — Lobes, escort ECCM, EW depth finish

**Status:** proposal for implementation; no engine changes made by this document.  
**Repository:** `Artemis2028/BM1-bakeoff`  
**Planning baseline:** `d1837fe` on `main` (14 September 2026), after Phase 9.1 robust-EW engine (PR #35).  
**Referee context:** Phase 4 engine §6 **Pass** on `7f926df`. Phase 9 engine (PR #33) and Phase 9.1 engine (PR #35) are the **locked** EW/weapons baselines — **Keep #33 and #35 Pass locked.** This is a **9.2 depth amend**, not a reopen of Phase 9’s six hard gates, not a reopen of Phase 9.1’s seven hard gates, not a reopen of S14 or S15, and **not** a claim that Phase 9 or 9.1 already had a Referee Pass on the status MD. This brief does **not** claim a new Referee Pass, does **not** reopen Phase 6 layers or Phase 6.5 generation, and does **not** reopen Phase 4/5 delivered reports.  
**Companion:** `docs/phase9/BM1-PHASE9.2-ENGINE-DEPENDENCIES.md` (hooks, risks, probe plan).  
**Scoped by:** Tenth Mountain Trooper, 2026-09-14 — proposal first; no engine until Tenth scopes after a brief Pass. Room +1 (directional lobes, shared escort ECCM) **and** folded EW depth (items 1–5 + “all that EW stuff”) are **in** this one scoreable brief.

Phases 1–9.1 already landed: political authority, two-mode ROE, holding zones, incident ledger / FLASH, persistent convoy/`asset_overdue`, sensors/cloak + power suites, fleet hold-outside, compact finite markets, Phase 9 EW on the reserved `ew` consumer with ghosts as contact-book rows, a read-only weapons matrix, closed fire gates, and Phase 9.1 spend-to-suppress, burn-through `B × √Q`, residue-before-void, RSS, true-side labels, HoJ matrix row, and transponder claim On/Off/Spoof. Phase 9.1 **locked robustness**. It did **not** lock directional lobes, escort→flagship ECCM share, a spoof catch-path under Focused Scan, a Phase 7 comms-delay hook, named jammer-heat / decoy / silent-running families, a playtest magnitude ledger, or dock-overlap UI polish.

This is **one** connected depth amend on the landed Phase 9 / 9.1 book: jam/contest that is **conical/arc × paid strength**, escort ECCM that can feed the flagship **detection / last-known / residue only**, a **catch path** that exposes spoof without rewriting Phase 1, EW that may delay a **new** deliver or fleet-order send without unsending FLASH, named **heat / decoy / silent-running** families on reserved `ew`, **injectable playtest defaults** (not remastered watt locks), and **dock-overlap UI fit** so the screenshot / no-clip gate can close. It is not a remastered `git am`, not a fifth energy religion, not a reopen of PR #33 or #35, and not permission to lock remastered EU/s, prices, or wattages as constants.

## 1. The result we want

A jammer you paid for has a **lobe**, not a cloak-sphere: receivers in the cone take the contest, friendlies in-lobe still hear the noise, and burn-through / residue / RSS / true-side labels from 9.1 still name what remains. Escorts can share **what they detected**, not a gifted lock. A spoofed blip can be **caught** by Focused Scan / silhouette / ECCM without becoming a new identity or an auto-shot. Comms EW can make a **new** order or report late. Heat, decoys, and silent-running are sayable spend-to-suppress trades on reserved `ew`. Magnitudes start as a playtest ledger you can override. The centered operator panel no longer hides its lower edge under the dock.

**Exit condition:** the eight hard gates in §2 are scoreable; magnitudes stay injectable playtest defaults; Phase 9 / #33 and Phase 9.1 / #35 stay closed.

**Proposed first-release decisions:**

| Question | Proposed answer |
| --- | --- |
| What is the first playable slice? | Directional lobes on the landed 9.1 contest; escort→flagship share of detection / last-known / residue (ECCM products, never FS); spoof catch-path under Focused Scan; comms-delay hook for **new** deliver / fleet-order latency; named heat / decoy / silent-running families on reserved `ew`; injectable playtest magnitude ledger; dock-overlap UI polish. |
| Where do 9.2 effects live? | Existing Phase 6 `state.contactBook` layers + Phase 9 `state.ewBook` + Phase 9.1 contest / claim / residue snapshot + a compact lobe / share / heat / decoy / silent snapshot (names can change). **Never** as fake `npcShips`. **Never** inside `systemStates`. **Never** as a second sensor religion. |
| Can a lobe invent invisibility? | **No.** Out-of-lobe is “this emitter does not contribute to that receiver,” not cloak-void. Residue / burn-through / RSS from 9.1 still hold for whatever paid field actually lands. |
| May escorts gift a lock via ECCM share? | **No.** Detection / last-known / residue only. Never `firingSolution`. Never `engagement_authorized`. Never an off-budget suite. |
| May spoof-catch rewrite Phase 1 / Reman? | **No.** Catch marks the **claim**. Forgetting teeth stay. No auto-fire. |
| May comms EW unsend FLASH or a delivered report? | **No.** Delay / fail a **new** send only. Standing Phase 7 orders persist. No culture fire. |
| Are decoys hulls? Is silent-running a cloak? | **No** and **no.** Decoys are book-only emission lures. Silent-running is a spend/emission tradeoff. Residue-before-void still applies. |
| May we `git am` remastered EW / lock remastered watts? | **No.** Remastered EW pack / DESIGN is **background shapes only.** §8 proposes **starting injectable playtest defaults** — still TBD/playtest, never remastered EU/s locked via `git am`. |
| May we reopen Phase 9 six gates, 9.1 seven gates, or regress #33 / #35? | **No.** Ghosts stay book-only; residue-before-void; burn-through; RSS; HoJ matrix; claim-only spoof; boarding out; delivered P4/P5 reports stay; no culture / `engagement_authorized` inject. |
| Is dock-overlap in scope? | **Yes** — UI fit / screenshot / no-clip process. Not EW math. Required to close this brief’s engine lane. |

These are recommendations for this amend, not new decisions attributed to the user. Locked bake-off constraints take precedence over older flavor that treated jamming as an isotropic cloak-sphere, escort share as a telepathic firing solution, spoof-catch as identity rewrite, decoys as spawnable hulls, silent-running as cloak-void, or remastered watts as live locks.

## 2. Locked constraints (do not reopen)

The bake-off room locked these before this brief. Implementation and probes must treat them as **hard gates**. Referee / One score this brief against these **eight** **before** any engine PR. Phase 9’s original six gates and Phase 9.1’s seven gates stay **closed**; they are restated only as **gate 8** (preserve), not as a reopen.

### Hard gate 1 — Directional lobes on the landed contest

> Jam / contest is **conical / arc × paid strength** on the landed 9.1 receiver contest. An emitter contributes to a receiver only when that receiver is **in-lobe** (bearing inside the injectable half-angle, after paid draw / A × H / falloff). **Friendlies in-lobe still take interference.** Out-of-lobe is zero contribution from **that** emitter, not invisibility. Burn-through `B × √Q`, residue-before-void, RSS of all **in-lobe paid** emitters, and true-side labels from 9.1 **still hold**. Never off-budget. Never a free fifth energy religion.

Lane owner (wording): **Number Four** on lobe × contest math; **Number 2** on “friendlies in-lobe still take it” / not-a-cloak wording.

Phase 9.1 already computes `cᵢ` (paid strength after A × H, self-cancel, range falloff), `N = √Σ(cᵢ²)`, `Q = E/(E+N)`, RF radius `B × √Q` (`src/phase91-contest.js`). This amend **does not** replace that contest. It **masks** each `cᵢ` by a lobe test before RSS. Isotropic 9.1 field is the fallback when lobe half-angle is 180° / disabled. A starved / brown-out / S=0 ship still cannot jam. Draw still bills reserved `ew`.

### Hard gate 2 — Shared escort ECCM is detection / last-known / residue only

> The flagship contact book **may receive** detection, last-known, and residue from escorts (ECCM products / escort sensors). **Detection-only share.** Never gifted `firingSolution`. Never `engagement_authorized`. Never a second sensor religion or an off-budget suite. Share range is injectable playtest. Formation / in-range checks subscribe to the landed Phase 6 / 7 escort helpers — do not invent a telepathic fleet net.

Lane owner (wording): **Number 2** on knowledge bounds; **Number Four** on the share hook.

Phase 6 already copies **flagship → escort** as detection / last-known, never FS (`shareFormationDetection` in `src/phase6-sensors.js`; proposal Q3 / §5.2). This amend **adds escort → flagship** for the same three products **plus residue** (9.1 gate 3). It does not copy identification-known, firm track, or `firingSolution`. The flagship still **earns** those layers under Phase 6 rules from **its own** sensors / burn-through. Escorts still pay their own Sensors / `ew`. Sharing is not a free ECCM Boost on the flagship suite.

### Hard gate 3 — Spoof catch-path never rewrites Phase 1 / never auto-fires

> Transponder On/Off/Spoof remains the 9.1 **claim** layer. This amend adds the **catch path**: Focused Scan, silhouette mismatch, and/or ECCM may **expose** a spoof. Forgetting teeth stay (suspicion → challenge → access denial → optional Phase 4 allowlist). **Never** rewrite Phase 1 `playerFaction` / `playerSide` / Reman **53** / ROE side. **Never** auto-`engagement_authorized` from a mismatch. Catch is knowledge, not identity and not a shot.

Lane owner (wording): **Number 2**.

Phase 9.1 already stores `off` / `true` / `spoofedFaction` and forbids identity rewrite (`src/phase91-transponder.js`). Phase 6 `performActiveScan` / `scanSelectedShip` can raise layers and writes a detectable emission — it does **not** yet compare claim vs silhouette. This amend names **Focused Scan** as a dwell / mode of that active path (Sensors consumer, detectable) that may mark `spoof_exposed` (name can change) on the **observer’s contact row**. Silhouette is visual-class / hull-shape evidence the observer actually earned — not a lore dump and not `buildShipScanReport` cargo flavor. ECCM Boost may help the comparison (equipment axis); it is not a second jammer and not a gifted ID.

### Hard gate 4 — Comms-delay hooks Phase 7; never unsends delivered reports

> EW may delay or fail a **new** `deliverReport` and a **new** fleet-order send (Phase 7 latency). It **cannot** wipe delivered Phase 4/5 reports, unsend FLASH, rewrite `knownIncidentIds`, or silently supersede a standing `hold_outside`. Ships continue last-received orders plus local self-preservation. No culture fire inject. No `engagement_authorized` from a late order.

Lane owner (wording): **Number 2** on report / order knowledge bounds; **Number Four** on the hook.

Phase 9 `tryDeliverReport` already delays a **new** deliver under `comms_disruption` and returns `erasedByJamming: false`. Phase 7 still has `COMMS_FAILURES_IMPLEMENTED === false` (`src/phase7-fleet.js` `commsFailureNote`: ships continue last received orders). This amend **flips that stub on** for EW-caused latency of **new** order delivery only. Standing / interrupted / parked orders already on `state.fleetOrders` persist. FLASH history and delivered rows stay. A jammed hail is still not aggression (Phase 3 / 9).

### Hard gate 5 — Heat / decoys / silent-running on reserved `ew`

> Jammer **heat**, **decoys**, and **silent-running** ship as named EW families or controls, each with cost / duration / counter / attribution. Spend-to-suppress stays on reserved **`ew`**. Decoys are **not** hulls and **not** a gifted `firingSolution`. Ghosts remain the Phase 9 deceptive family (book-only). Silent-running is **not** cloak-void: residue-before-void and burn-through still apply. Heat is a spend / emission tradeoff (quieter jam costs more `ew`, louder jam is cheaper to run and easier to DF). Never a sixth power consumer.

Lane owner (wording): **Number Four** on `ew` spend / families; **Number 2** on decoy ≠ hull / silent ≠ cloak / no gifted FS.

Phase 9 four families stay named. Heat rides the **jammer** (property / control of `sensor_jamming`, not a fifth family that skips the slot). Decoys are a named sibling of deceptive contacts: `source: 'ew_decoy'` (name can change), emission lure, book row, legal HoJ counter (the 9.1 matrix already lists `decoy-emitters`). Silent-running is an actor control (Off / On) billed on `ew` that suppresses **emission scale**; it does not set Phase 6 cloak and does not delete residue.

### Hard gate 6 — Magnitudes are injectable playtest defaults, not remastered locks

> §8 proposes **starting injectable defaults** for draws, radius, strength, lobe arc, and ECCM share ranges. They are a **playtest ledger** — explicitly **not** locked remastered constants. Override must change the snapshot. `MAGNITUDES_LOCKED_FROM_REMASTERED` stays **false**. Do **not** `git am` remastered patches. Do **not** copy remastered EU/s / prices / wattages into non-overridable constants. **Soft gate:** existing suites stay green with these defaults (S14 / S15 / S4–S13 / catalog / doctrine).

Lane owner (wording): **Number Four**.

Phase 9 / 9.1 already inject via `resolveEwMagnitudes` / `resolvePhase91Defaults` / `EW_EQUIPMENT_CATALOG` placeholders. This amend **publishes a starting ledger** so playtest has numbers, and **keeps them injectable**. A later remaster is a different scoped lane.

### Hard gate 7 — Dock-overlap UI polish (fit / screenshot / no-clip)

> Fix or mitigate the known baseline residual where the **bottom dock overlaps the lower edge of the centered operator panel** (noted on 9.1 after-implementation screenshots; same family as baseline Settings). Process lock continues: screenshots + **no-clip** (`clippedControls: []`, no EW control under the dock). This gate is **UI fit**, not EW math. An engine PR that lands lobes but leaves Close / last EW controls under the dock **fails** this brief.

Lane owner (wording): **Number Four**.

`.top-left-panel` is centered (`left: 50vw; top: 50vh; transform: translate(-50%, -50%)`; `max-height: min(680px, calc(100vh - 132px))`; `z-index: 71`). `.bottom-dock` is `position: fixed; bottom: 14px; z-index: 30`. 9.1 compacting moved Close/HoJ up so they were not under the dock; the geometric overlap remained. 9.2 must reserve bottom inset / reduce panel max-height / raise dock-clear padding so the designated box and the dock do not fight, at least at the 9.1 screenshot viewport (1280×720).

### Hard gate 8 — Preserve Phase 9 / 9.1 / earlier locks

> Ghosts remain contact-book only. Residue-before-void. Burn-through always available for a funded receiver. RSS all-paid (now all-paid **in-lobe**). True-side labels. HoJ matrix row first; silence→coast; no gifted FS. Transponder claim never rewrites Phase 1. Jamming cannot wipe delivered P4/P5 reports. Weapons matrix before overhaul. Boarding out. No culture / `engagement_authorized` inject from EW. Do **not** reopen Phase 9’s six hard gates or Phase 9.1’s seven hard gates. Do **not** regress PR #33 or PR #35.

Lane owner (wording): **Referee / One** (do-not-open check). Number 2 scores ghost / report / fire-gate / share / spoof / decoy preservation. Number Four scores budget / contest / matrix / no-boarding-hook / no-remastered-lock.

Cite Phase 9 gates 1–6 in `docs/phase9/BM1-PHASE9-EW-WEAPONS-PROPOSAL.md` §2 and Phase 9.1 gates 1–7 in `docs/phase9/BM1-PHASE9.1-EW-ROBUSTNESS-PROPOSAL.md` §2 as **already locked**. This amend **subscribes**. It does not replace four EW families, does not spawn ghost or decoy hulls, does not unsend `deliverReport`, does not retune damage/cooldown/range, does not open boarding, and does not let lobes / share / catch / heat collapse pursuit ≠ permission ≠ per-weapon fire.

### Also from the plan (score with the gates; not a ninth religion)

| Plan / room want | How this brief locks it |
| --- | --- |
| Directional lobes on jam/contest | Gate 1. Arc × paid strength; friendlies in-lobe affected. |
| Shared escort ECCM | Gate 2. Detection / last-known / residue only. |
| Spoof-depth under Focused Scan | Gate 3. Catch path; claim layer stays; no identity rewrite; no auto-fire. |
| Comms-delay hook to Phase 7 | Gate 4. New deliver / new order latency; no unsend. |
| Jammer heat / decoys / silent-running | Gate 5. Named; costed on `ew`; decoys ≠ hulls; silent ≠ cloak. |
| Magnitude playtest pass | Gate 6. Injectable starting defaults; not remastered locks. Soft: suite stays green. |
| Dock-overlap UI polish | Gate 7. Fit / screenshot / no-clip. |
| Phase 9 six gates + 9.1 seven gates + #33 + #35 stay closed | Gate 8. |

### Must not break (cite landed work)

Score these as **preservation**. A Phase 9.2 Pass that regresses them is a Fail. **#33 and #35 stay locked.**

| Locked rule | Cite | Phase 9.2 must not |
| --- | --- | --- |
| Detection ≠ identification ≠ track quality ≠ `firingSolution`. An old report is not a live lock. | Phase 6 hard gate 2; `src/phase6-sensors.js`; S9.2; Phase 9 gate 2; 9.1 gates 3 / 5 | Raise layers from lobe / share / catch / decoy / heat past what burn-through actually earned. Seed `firingSolution` from residue, emission, ghost, decoy, spoof-catch, or escort share. |
| Hidden stays hidden on **both** sides. Lost tracks drop exact targeting on the **same tick**. | Phase 6 gates 3–4; S9.3–S9.5 | Leak a cloaked hull because a residue, decoy, silent-running, or HoJ coast exists. Keep `combatTargetId` / `liveWeaponTrack` after `firingSolution` drops. Treat silent-running as cloak. |
| Passive / active never invent ID or `firingSolution`. `ew` is on the shared pool. | Phase 6 gate 6; Phase 6.5 gate 5; Phase 9 gate 1; 9.1 gate 1; S10.7 / S14.1 / S15.1 | Spend EW off-budget. Implement 9.2 effects at draw 0. Add a sixth consumer. Gift the flagship a suite from escort share. |
| Escorts share detection / last-known only (flagship → escort already landed) | Phase 6 §5.2 / Q3; `shareFormationDetection`; S9 | Copy `firingSolution` either direction. Share when not in formation / not in range unless the injectable envelope says so. |
| Already-delivered reports and observer copies persist | Phase 4 `deliverReport` / `observerKnowsIncident`; S6.9; Phase 5 delivered knowledge; Phase 9 gate 3; S14.6–S14.8; S15.17 | Delete, unsend, or rewrite `delivered`. Drop `knownIncidentIds` because a jammer or comms tick ran. Let residue-delete wipe a report seed’s historical row. |
| FLASH append-only; no second offense pulse | Phase 4 §7.3; S6.14; S14.9 | Pulse FLASH as “jamming happened” unless a **new** FLASH-eligible incident is actually opened. Auto-FLASH from a spoofed blip or a late order. Unsend a FLASH that already fired. |
| Overdue ≠ destroyed ≠ attacker | Phase 5; S8 | Treat a jammed / residue / silent-running / decoy convoy track as `destroyed` or invent `attackerId`. |
| Punishment tokens; standing once | Phase 4 §8; S6.4 | Charge standing again from an EW notice for a kill already tokenized. Charge standing from a transponder mismatch or spoof-catch alone. |
| Culture cannot grant fire. `engagement_authorized` never injected. | Phase 1 / doctrine; Phase 6; Phase 9 gate 5; 9.1 gates 5–6; `consultDoctrineFire`; S14.16 / S15.12 | Write the fact from jam, lobe, residue, HoJ launch, escort share, spoof-catch, heat, decoy, silent-running, or a delayed order. |
| Phase 3 refusal / inability are not aggression | Phase 3 / 4 | Turn comms disruption, a jammed hail, a late fleet order, or transponder-off into `attackId` / fire. |
| Ghosts are book rows only | Phase 9 gate 2; S14.3–S14.5; 9.1 gate 7 | Spawn a residue hull or a decoy hull. Gift a lock to a ghost because burn-through or a lobe exists. |
| Spend-to-suppress; burn-through; residue-before-void; RSS; true-side; HoJ row; claim-only | 9.1 gates 1–6; S15 | Drive Q to 0 for E>0. Delete the contact. Strongest-three / % ceiling. Friendly-from-claim. HoJ retune. Rewrite `playerFaction` from spoof or catch. |
| Weapons matrix before overhaul; no universal shield bypass | Phase 9 gate 4; S14.12–S14.15 | Retune `game_items.json` to “finish decoys / HoJ.” Inherit a lore bypass onto ordinary beams. Auto-fill empty weapon slots. |
| Tractor stays a device slot; boarding out | Phase 9 gates 4 / 6; S14.13 / S14.18 | Move tractor; treat HoJ / jam / tractor hold / decoy as board / capture. |
| Catalog wire: 172 active, 38 aliases, Reman **53** | PR #28; S11 | Resurrect discarded IDs or a second Reman hull because a decoy “needs a host.” Rewrite `playerFaction` / Reman unlock from a spoof or catch. |
| Phase 7 standing orders persist | PR #29; S12; Phase 9 must-not | Silently supersede `hold_outside` because comms EW ticked. Drop parked stay-behind ships. |
| Phase 8 markets subscribe-only | PR #31; S13 | Restock, embargo-as-fire, or sell hull 53 from an EW flavor row. |
| Suites do not occupy a weapon slot | Phase 6.5 `installSensorSuite`; `occupiesWeaponSlot: false`; 9.1 slot | Steal the suite slot or a weapon mount for lobes / decoys / heat. Stack two jammers. Treat escort share as a second suite. |

Also preserve, without reopening:

- Authority is a political side (`isSystemControlled`), not a flown flag.
- Two ROE modes unchanged. Access is a permission, not a ceasefire.
- Phase 1 combat credit: only `player` / `playerEscort` final hits reward or blame.
- Phase 6 first-frame cloak, purposeful destinations, arrival/spacing/exit stay closed.
- Phase 6.5 generation / passive-vs-active draw / paid suites / role curves stay closed.
- Soft authored breakaway profiles stay **out**.
- Phase 9 four families (sensor jamming, ghosts, fire-control, comms disruption) stay named and costed. 9.2 **amends** geometry, share, catch, latency, and named heat/decoy/silent controls; it does not replace the family contract.
- 9.1 dedicated `ew_equipment` slot, A × H spend, spin-up / cooldown on `localElapsedMs` stay.

### Process locks (implementation locks, not a change to gates 1–8)

- **Proposal first.** Do not implement from this text until Tenth scopes the engine lane after a brief Pass.
- **Blind bake-off.** Implement against bake-off `main` (**this** head after #35, `d1837fe`), **not** remastered base `758665e`. Implement from `docs/` only. Do **not** crib `Artemis2028/BM1-remastered-work`.
- **Remastered EW pack / DESIGN is background shapes only.** Do **not** `git am` remastered patches. Do **not** lock remastered catalog EU/s, prices, or wattages as constants.
- **No invented balance numbers as locked constants.** Effect *shape*, contest *formulas*, lobe *test*, share *layer caps*, catch *forbids*, family *contracts*, and fire-gate *forbids* are locked. §8 starting draws, radii, strengths, lobe arc, share ranges, heat factors, and clocks are **playtest / TBD / injectable**.
- **#33 and #35 Pass stay locked.** A PR that reopens Phase 9 six gates, reopens 9.1 seven gates, regresses S14 or S15, or “fixes” ghosts-as-hulls by spawning hulls fails this brief even if lobes are green.
- **Subscribe, do not fork.** 9.2 writes call existing Phase 6 layer helpers (including `shareFormationDetection`), Phase 6.5 draw / brown-out helpers, Phase 9 `ewBook` / matrix helpers, Phase 9.1 contest / residue / claim / slot helpers, Phase 7 `fleetOrders`, Phase 3 `makeBroadcast`, Phase 4 `deliverReport`. Do not implement a second contact book, a second incident ledger, a second contest, or a second weapons matrix.
- **§13 saved timers:** lobe dwell, focused-scan dwell, heat, decoy duration, silent-running, comms delay, and contest use `localElapsedMs`. Do not persist `performance.now()` as a deadline.
- **Screenshot / no-clip process lock continues.** Engine PR captures 1280×720 shots of OPS/EW, Inventory, Settings, Target (and any new 9.2 controls) with `clippedControls: []` and dock-clear. Compare with `docs/phase9/screenshots/phase91/` and `docs/phase9/screenshots/baseline-main/`.
- **No Pass claimed** in `docs/BAKEOFF-STATUS.md` from this PR.

## 3. Directional lobes (gate 1)

**Lane owner (wording):** Number Four.

### 3.1 Same contest, masked by arc

Player jammer and NPC jammer use the same 9.1 contest. The only new geometry is **whether this emitter contributes to this receiver**.

For emitter heading **θ**, receiver bearing **β**, injectable half-angle **α** (playtest default in §8):

| Piece | Shape | Locked meaning |
| --- | --- | --- |
| In-lobe test | `angularDistance(θ, β) ≤ α` | Conical / arc. Names can change. |
| Contribution | `cᵢ_lobe = inLobe ? cᵢ : 0` (optional sidelobe factor injectable, **default 0**) | Out-of-lobe is “this emitter is not in this receiver’s N,” not cloak. |
| RSS | `N = √Σ(cᵢ_lobe²)` over **all paid in-lobe** contributions | 9.1 RSS unchanged except the mask. No strongest-three. No % ceiling. |
| Quality / burn-through | `Q = E/(E+N)`; RF radius `B × √Q` | Funded receiver ⇒ radius **> 0** still. |
| Friendly in-lobe | Own-side receivers inside the cone **do** take N (after 9.1 self-cancel if it is their own emitter) | No IFF notch that zeros friendly contribution. True-side labels still apply. |
| Draw | catalog × A × H on reserved **`ew`** | Off-budget field **fails**. S=0 / brown-out still unavailable / weakens. |

Heading is the emitter hull’s actual facing (or an explicit jammer-aim, injectable; default = hull heading). Do not require a gifted `firingSolution` to *aim* a jammer.

### 3.2 Always a contest, never a cloak-sphere

- **Receiver outside every live lobe:** N from those emitters is 0. Other paid in-lobe emitters may still contribute. Residue / prior detection is unchanged.
- **Friendly in-lobe:** label may be own / friendly / mixed under 9.1 true-side rules. Interference still degrades **that** observer’s live layers under Phase 9 jam rules, still stopping at residue.
- **UI** must be able to say the lobe, whose noise it is, and that burn-through remains available. If the UI says “cloaked because you were out of their beam,” the family is not ready.

Player-facing line (names can change):

- `Jamming lobe. In-beam: interference. Burn-through available — not a cloak. Friendlies in-lobe take it.`

### 3.3 What lobes must not do

- Skip `ew` draw because the beam is “narrow.”
- Drive Q to 0 for a funded receiver.
- Delete contacts out-of-lobe (out-of-lobe ≠ void).
- Ignore friendlies in the cone.
- Key the lobe on `npc.id` or store it in `systemStates`.
- Treat transponder claim as aim / IFF.

## 4. Shared escort ECCM (gate 2)

**Lane owner (wording):** Number 2 on bounds; Number Four on the hook.

### 4.1 What may be shared

Subscribe to Phase 6 `shareFormationDetection`. **Add** escort → flagship. Caps:

| Product | Escort → flagship | Flagship → escort (already landed) | Must not |
| --- | --- | --- | --- |
| **Detection** | Yes, if escort has `detected` | Yes | Invent detection the escort never earned |
| **Last-known** | Yes (area) | Yes | Write exact hull truth the escort does not have |
| **Residue** | Yes (9.1 residue / emission / area) | Yes if the escort row is residue | Treat residue as a lock |
| **Identification** | **No** raise from share | **No** | Copy `known` from escort ECCM |
| **Track quality** | Cap at **area** | Cap at **area** | Copy firm |
| **`firingSolution`** | **Never** | **Never** | Gifted lock |
| **`engagement_authorized`** | **Never** | **Never** | Share as permission |
| **Suite / S / E** | **Never** | **Never** | Off-budget second religion |

Exact names can change:

```js
{
  fromObserverKey: 'escort:security-instance-4',
  toObserverKey: 'player',
  subjectKey: 'npc:security-instance-9',
  detected: true,
  trackQuality: 'area',          // cap
  firingSolution: false,         // hard
  residue: true,                 // allowed
  lastKnown: { x, y, radius, atLocalMs },
  source: 'escort_share',        // or keep prior source + sharedFrom
  giftedLock: false
}
```

### 4.2 When share is legal

Default envelope (injectable, §8):

- Escort is a **player escort** (existing `isPlayerEscortNpc` / fleet assignment).
- **In formation** (landed check: formation point dist or player dist) **or** within injectable `shareRadius`.
- Both observers in the **loaded system**. Jump / parked stay-behind does **not** telepathically share into another system.
- Escort Sensors **S > 0** (or the escort actually holds a residue / detection row). A brown-out-dead escort shares nothing new this tick.

ECCM Boost on the **escort** may help **that escort** earn detection / residue; the flagship receives the **product**, not the Boost factor. Flagship ECCM Boost still rides the flagship suite (9.1 §3.4 / Q11).

### 4.3 Forbidden

- `firingSolution: true` on the flagship because an escort burned through.
- `liveWeaponTrack` / `combatTargetId` from a shared area.
- Copying escort `ew` draw onto the flagship (or vice versa) as a free field.
- A mesh that makes every friendly a shared observer without range / formation.
- Sharing ghosts as living hulls, or sharing decoys as locks.
- Using transponder claim to decide who is an escort.

## 5. Spoof-depth catch path (gate 3)

**Lane owner (wording):** Number 2.

### 5.1 Claim layer stays; catch is extra teeth

9.1 enum unchanged:

```js
transponderClaim: 'off' | 'true' | { mode: 'spoof', spoofedFaction: 'klingon' }
```

Catch writes **observer knowledge**, not identity:

```js
{
  transponderClaim: { mode: 'spoof', spoofedFaction: 'klingon' },
  spoofExposed: true,            // name can change
  catchPath: 'focused_scan' | 'silhouette' | 'eccm',
  suspicion: true,
  firingSolution: false,         // catch does not gift a lock
  engagement_authorized: undefined
}
```

`state.playerFaction` / `state.playerSide` / Reman **53** / two-mode ROE **do not change**.

### 5.2 Focused Scan / silhouette / ECCM

| Path | Shape | Must not |
| --- | --- | --- |
| **Focused Scan** | Named dwell of active scan. Bills **Sensors** (detectable emission, Phase 6 gate 6). Compares claim vs true-side and/or silhouette the observer earned. May set `spoofExposed`. | Silent omniscience. Skip `performActiveScan` emission. Gift `firingSolution`. Auto-fire. Rewrite Phase 1. |
| **Silhouette mismatch** | Claimed faction / class vs observed visual class / hull-shape evidence actually on the contact. | Use `buildShipScanReport` flavor cargo / government as proof. Invent a silhouette the observer has not scanned. |
| **ECCM** | Boost on the **suite** (9.1) may improve the comparison when S>0. | Second jammer. Off-budget. Catch-at-draw-0. |

Forgetting ladder from 9.1 §7.2 **stays**: suspicion → challenge → access denial → optional P4 allowlist (`record_only` default). Catch is the **evidence** that feeds suspicion; it is not a skip-to-fire.

### 5.3 Player-facing line

- `Focused Scan: transponder claim does not match silhouette. Suspicion only — not a firing solution, not identity.`

If the UI says “identity rewritten” / “weapons free because spoof,” the family is not ready.

## 6. Comms-delay hook to Phase 7 (gate 4)

**Lane owner (wording):** Number 2 on bounds; Number Four on the hook.

### 6.1 What EW may delay

| In flight (may delay / fail) | Already landed (must survive) |
| --- | --- |
| A `deliverReport` call that has not succeeded yet | `incidentLedger.reports[id]` with `delivered !== false` |
| A **new** fleet-order send (`issueOrder` / equivalent) while `comms_disruption` is live on sender or recipient | Standing / interrupted / parked rows already on `state.fleetOrders` |
| A new FLASH that has not been pushed | FLASH queue entries and journal history already fired |
| A Phase 5 notice not yet written | Phase 5 board facts the observer already knows |

Phase 7 stub today: `COMMS_FAILURES_IMPLEMENTED === false`; `commsFailureNote()` says ships continue last received orders plus local self-preservation. 9.2 **implements that note** for EW latency:

- New order may be `delayed` / `created: false` with `reason: 'comms-disrupted'`.
- Last received order **remains** (`hold_outside` stays `hold_outside`).
- Local self-preservation interrupts still use the landed Phase 7 interrupt table (defense / retreat / new_order) — EW is not a new interrupt kind that wipes standing.
- `tryDeliverReport` contract unchanged: `erasedByJamming: false`.

### 6.2 Forbidden

- `delivered = false` on an existing report.
- Splice `knownIncidentIds`.
- Un-pulse FLASH.
- `engagement_authorized` / culture fire because an order was late.
- Silently replacing `hold_outside` with `follow` “because comms died.”
- Persisting delay deadlines as `performance.now()`.

Player-facing line:

- `Comms disrupted. New order delayed. Hold-outside still held. The FLASH you already have is still in the journal.`

## 7. Jammer heat, decoys, silent-running (gate 5)

**Lane owner (wording):** Number Four on spend; Number 2 on knowledge bounds.

Each named item ships with the Phase 9 four-part contract: **cost, duration, counter, attribution**. Default attribution `record_only`. Draw on reserved **`ew`**. Brown-out weakens. S=0 unavailable where the control needs Sensors.

### 7.1 Jammer heat (spend / emission tradeoff)

| Piece | Shape | Must not |
| --- | --- | --- |
| Heat / DF-able emission | Scales with paid jammer strength (and inverse with suppress spend) | Heat with jammer Off / draw 0 |
| Suppress | Extra `ew` draw (injectable factor) **reduces** emission scale; contest `cᵢ` stays the paid jam strength unless a later playtest says otherwise | Free quiet jam |
| Counter | Direction-find / burn-through / leave lobe / silence | Cloak-void |
| Attribution | Using a loud jammer in a holding may journal; default `record_only` | Auto-fire / second FLASH |

Quiet jam is **expensive**. Loud jam is cheaper and easier to DF. That is the tradeoff.

### 7.2 Decoys (book-only emission lures)

```js
{
  contactId: 'ctc-41',
  observerKey: 'player',
  subjectKey: 'decoy:ew-3',     // not a living securityInstanceId
  detected: true,
  identification: 'none',
  trackQuality: 'area',
  firingSolution: false,        // hard
  ghost: false,                 // decoys are not the Phase 9 ghost family
  decoy: true,
  source: 'ew_decoy',
  emission: true,               // HoJ may home on this lure
  lastKnown: { x, y, radius, atLocalMs }
}
```

Forbidden:

- `state.npcShips.push` a decoy hull
- Gifted `firingSolution` / `liveWeaponTrack`
- Salvage / standing / Phase 5 `destroyed` on a decoy
- Treating a decoy as a Phase 9 ghost (ghosts stay `ew_ghost`)
- Copying a living `securityInstanceId` onto a decoy so doctrine treats it as that ship

Counters: closer pass / active scan / ECCM may mark `decoy: true` without granting a lock. HoJ may pursue the **emission** (9.1 seeker contract); hitting a decoy is not a hull kill.

### 7.3 Silent-running (not cloak-void)

| Piece | Shape | Must not |
| --- | --- | --- |
| Control | Off / On. Bills `ew`. Lowers own emission scale (jammer / active-scan / heat) | Set `isPlayerCloaked` / NPC cloak clocks |
| Residue | Prior rows stay residue / area / emission-as-allowed-by-9.1 | Delete-the-contact |
| Burn-through | Still available for a funded receiver against whatever field remains | Claim unfindable at every range |
| Counter | Active scan / closer pass / burn-through / leave silent | Perfect hide |

Silent-running + transponder `off` is still **not** Phase 6 cloak. A cloaked hull still uses cloak truth. Do not merge the three (claim-off, silent-running, cloak).

### 7.4 Player-facing lines

- `Jammer heat high. Paying ew to suppress emission.`
- `Decoy contact. Sensor record only — emission lure, no hull, no firing solution.`
- `Silent-running. Residue held. Not a cloak.`

If the UI cannot name **which** control, **what it cost**, **when it ends**, **how to counter it**, and **who is blamed**, the family is not ready.

## 8. Magnitude playtest ledger (gate 6)

**Lane owner (wording):** Number Four.

These are **starting injectable defaults** for playtest. They are **not** remastered watts, **not** locked constants, and **not** a Referee-certified balance. Mark every number **TBD / playtest**. Override must change the snapshot. Soft gate: S4–S15 / catalog / doctrine stay green with this ledger loaded as defaults.

### 8.1 How to override

Same pattern as 9.1:

| Hook already landed | 9.2 addition |
| --- | --- |
| `resolveEwMagnitudes(injected)` (`src/phase9-ew.js`) | Family draws / durations; add decoy family row if named |
| `resolveEwMagnitudes` / `EW_EQUIPMENT_CATALOG` (`src/phase91-ew-slot.js`) | Compact / Tactical / Fleet draw / strength / radius |
| `resolvePhase91Defaults(injected)` (`src/phase91-power.js`) | A × H clocks, self-cancel, ECCM boost, B |
| Probe `__BM1_PROBE__.phase91` magnitudes / defaults | `__BM1_PROBE__.phase92.injectMagnitudes` / `snapshot.magnitudes` |
| `MAGNITUDES_LOCKED_FROM_REMASTERED === false` | **Stays false.** Fail if a “Flash/remastered watt lock” flag appears |

Recommended new helper (name can change): `resolvePhase92Defaults(injected)` merging §8.2–§8.3. Offline tests assert: inject `{ lobeHalfAngleDeg: 20 }` ⇒ snapshot lobe width 20; omit inject ⇒ playtest default; remastered-lock flag false.

### 8.2 Carry-forward 9.1 placeholders (still playtest)

Do **not** treat these as newly invented remastered EU/s. They are the bake-off 9.1 injectable placeholders at `d1837fe`, republished so 9.2 playtest has a single ledger.

| Symbol / tier | Starting playtest default | Notes |
| --- | --- | --- |
| Compact draw / strength / radius | 1.2 / 2 / 400 | `EW_EQUIPMENT_CATALOG.compact` |
| Tactical draw / strength / radius | 2 / 3.5 / 700 | Mid tier |
| Fleet draw / strength / radius | 3.2 / 5 / 1100 | Still one slot |
| Spin-up / cooldown | 1000 / 2000 ms | `localElapsedMs` |
| Self-cancel | 0.25 | Own emitter |
| ECCM Boost | × 1.4 on E | Suite control; S=0 unavailable |
| Burn-through B | 200 | `B × √Q` |
| Clear ratio N/E | 0.05 | Clear vs Interference |
| Family draws (jam / ghost / FC / comms) | 1.6 / 1.4 / 1.8 / 1.5 | Phase 9 `EW_MAGNITUDES` |
| Family durations | 8 / 9 / 7 / 10 s | `localElapsedMs` |

Prices remain **null / TBD**. Standing gates remain **shape** (0 / 20 / 50) until a later catalog pass.

### 8.3 New 9.2 playtest defaults

| Symbol | Starting playtest default | What it is |
| --- | --- | --- |
| **Lobe half-angle α** | **50°** (100° cone) | Gate 1. 180° reproduces isotropic 9.1. |
| **Sidelobe factor** | **0** | Out-of-lobe contribution. |
| **ECCM share radius** | **360** world units | Gate 2, plus landed formation envelope (formation dist 110 / player dist 300). |
| **Focused Scan dwell** | **1500 ms** | Gate 3. Sensors draw, not hidden `ew`. |
| **Focused Scan extra sensors draw** | **0.4** | On top of active-scan draw. |
| **Heat suppress extra `ew`** | **0.6 × catalogDraw** | Gate 5. Quiet jam. |
| **Heat emission scale when unsuppressed** | **1.0** | Loud default. |
| **Heat emission scale when suppressed** | **0.25** | Paid quiet. |
| **Silent-running `ew` draw** | **0.5** | Gate 5. Not cloak. |
| **Silent-running emission scale** | **0.1** | Residue still allowed. |
| **Decoy `ew` draw / duration** | **1.3 / 8000 ms** | Gate 5. Book-only. |
| **Max decoys per observer** | **4** | Bound; drop decoys before live locks (Phase 6 cap 32 still). |
| **New fleet-order delay** | **2000 ms** | Gate 4. Or fail-new-send while disruption live (either is scoreable). |

Exact watts and milliseconds remain **TBD / playtest**. Shape is locked: override works; remastered lock flag false; suite green at these defaults.

### 8.4 Soft gate

With this ledger as defaults (no inject):

- `test:phase1` / `test:phase3`–`test:phase9` / `test:phase91` / `test:catalog` / `test:doctrine` stay green.
- S14 and S15 replay without wattage asserts becoming hard locks.
- A fixture that **requires** remastered Flash EU/s **fails** this brief.

## 9. Dock-overlap UI polish (gate 7)

**Lane owner (wording):** Number Four.

### 9.1 Residual to close

Cited: `docs/phase9/screenshots/phase91/NOTES.md` (and baseline Settings in `docs/phase9/screenshots/baseline-main/NOTES.md`).

- Centered `.top-left-panel` lower edge vs `.bottom-dock` at 1280×720.
- 9.1 moved Close/HoJ up so **controls** were not under the dock; geometric overlap remained.
- Target-window last line can sit near the dock.

### 9.2 Required outcome (UI fit, not EW math)

| Check | Pass | Fail |
| --- | --- | --- |
| No-clip | `clippedControls: []` on OPS/EW, Inventory, Settings, Target, any new 9.2 controls | Last button / Close / HoJ / lobe / silent-running control under the dock |
| Dock-clear | Panel content box reserved so the dock does not cover the designated lower chrome (padding, max-height, or bottom inset — writer’s choice) | “We moved copy up again” without a durable inset |
| Screenshots | 1280×720 before/after in `docs/phase9/screenshots/phase92/` (engine PR, not this brief) | Engine PR with no shots |
| Overflow | Contained `overflow-y: auto` is OK; horizontal overflow is not; clip-out-of-box is not | Horizontal overflow or clipped EW controls |
| Not EW math | Do not retune lobes to “make the panel shorter” | Mixing fit into contest numbers |

Process lock is the same family as 9.1: JSON overflow dump + NOTES + PNGs. This brief **does not** attach those PNGs (docs-only).

## 10. Controls shape

**Lane owner (wording):** Number Four on engine; copy can wait.

Exact widget names can change. If the control cannot say **state**, **why it is limited**, and **whose noise / whose share / whose claim it is**, it is not ready.

| Control | States (shape) | Notes |
| --- | --- | --- |
| **Jammer** | Off / On / Spin-up / Cooldown / Power-limited | 9.1. Still slot + S>0 + funded `ew`. |
| **Lobe** | Heading + half-angle (readout). Optional aim. | Default hull facing. Show in-lobe vs out. |
| **ECCM** | Off / Boost via **suite** | 9.1. Share is not a third ECCM state. |
| **Escort share** | In-range / formation vs out | Read-only status. Not a gifted-lock toggle. |
| **Transponder** | Off / True / Spoof | 9.1 claim. |
| **Focused Scan** | Idle / Dwelling / Result (clear / mismatch / exposed) | Sensors path. Detectable. |
| **Heat suppress** | Off / Paying | Extra `ew`. Emission scale readout. |
| **Decoys** | Off / On (count) | Book-only. Never “launch hull.” |
| **Silent-running** | Off / On | Not cloak. Residue copy stays honest. |
| **Receiver** | Clear / Interference + Own / Friendly / Mixed | 9.1 true-side. |

## 11. Acceptance exercises (S16)

Keep all existing Phase 1 / S4–S15 / doctrine / catalog / side-lane gates green. **S14 stays the Phase 9 lock. S15 stays the Phase 9.1 lock** — replay, do not rewrite. Add S16 fixtures that fail setup if the lobe helper, escort-share helper, spoof-catch helper, comms-delay helper, heat/decoy/silent helper, magnitude-override helper, or dock-fit probe is missing. Classification-only asserts are insufficient for “friendly in-lobe took N,” “flagship FS not gifted,” “report still delivered,” and “override changed α.”

Number Three owns the probe gate **after** engine, not this brief. IDs are a sketch; do not promise a final count. S15.x extension numbers are acceptable if Tenth prefers not to mint S16; the **cases** below are the score.

| Case | Required exercise and result |
| --- | --- |
| **S16.1** Lobe masks contest | Paid jammer, receiver **in-lobe**: `cᵢ_lobe > 0`, N includes it, draw on `ew` > 0. Receiver **out-of-lobe**: that emitter’s contribution **0**, other in-lobe paid emitters still RSS. Off-budget jam **fails**. |
| **S16.2** Friendlies in-lobe take interference | Ally (actual `sideId` match) inside the cone: that observer’s contest N **includes** the friendly emitter (after 9.1 self-cancel if own). Label own/friendly/mixed as true-side, **not** “immune because friend.” Live layers may degrade to residue; row not voided. |
| **S16.3** Burn-through / residue / RSS / true-side still hold under lobes | Replay S15.4–S15.10 with a non-180° lobe: funded E ⇒ radius > 0; residue survives deep in-lobe jam; RSS of in-lobe paid only; unpaid / out-of-lobe / brown-out-dead add 0; no strongest-three. |
| **S16.4** Escort → flagship share is detection / last-known / residue only | Escort in formation / in `shareRadius` holds detected + residue + last-known, **no** FS. Flagship book gains detected + area last-known + residue. Flagship `firingSolution === false` until **its own** Phase 6 earn / burn-through. `engagement_authorized` absent. |
| **S16.5** Share is not a second suite / not off-budget | Flagship `ew` draw and `sensorSuiteId` **unchanged** by share. Escort still bills its own Sensors/`ew`. Out of range / not in formation (beyond injectable envelope): no new shared row. Parked other-system escort does not share. |
| **S16.6** Flagship → escort path preserved | Replay Phase 6 share: escorts still receive detection/last-known only; still no gifted FS. |
| **S16.7** Spoof catch-path | Claim spoof. Focused Scan dwell completes (Sensors emission written). `spoofExposed` (or equivalent) true on **observer row**. `playerFaction` / `playerSide` / Reman 53 / ROE **unchanged**. Forgetting ladder available. **No** `engagement_authorized`, **no** `attackId`, **no** `mayAutoEngage` flip, **no** auto-fire. |
| **S16.8** Silhouette / ECCM catch without identity rewrite | Silhouette mismatch and/or ECCM Boost path sets suspicion / exposed. Still no Phase 1 write. Silent transponder still ≠ cloak (replay S15.15). |
| **S16.9** Comms delay new deliver only | Replay S14.6–S14.8 / S15.17: delivered report survives. New `tryDeliverReport` under disruption: `created: false` / delayed, `erasedByJamming: false`. FLASH history untouched. |
| **S16.10** Comms delay new fleet order; standing persists | `COMMS_FAILURES_IMPLEMENTED` path live for EW. New order while disrupted: delayed or failed send. Existing `hold_outside` still standing. No culture fire. No silent supersede. |
| **S16.11** Heat spend-to-suppress | Jammer On: emission scale default. Heat-suppress On: `ew` draw **increases**, emission scale **drops**. Draw 0 + suppress On **fails**. Brown-out weakens both jam and suppress. |
| **S16.12** Decoys ≠ hulls ≠ gifted FS | Inject decoy. Contact-book row `decoy: true` / `source: 'ew_decoy'`. `npcShips` count unchanged. `firingSolution === false`. Destroy/salvage/standing **noop**. Not `ghost: true` unless it was already a Phase 9 ghost. Ghost family still book-only (replay S14.3–S14.5). |
| **S16.13** Silent-running ≠ cloak-void | Silent-running On: `ew` draw > 0, emission scale down. Prior contact remains residue / detected-or-area. Cloak fixture still hidden under Phase 6. Silent-running does not uncloak and does not cloak. Funded observer burn-through radius still > 0 against remaining field. |
| **S16.14** Magnitude override / not remastered lock | Inject lobe α / share radius / compact draw. Snapshot matches inject. `MAGNITUDES_LOCKED_FROM_REMASTERED === false`. No remastered patch applied. Defaults from §8 load without suite failure (soft). |
| **S16.15** Dock-overlap / no-clip | 1280×720: OPS/EW, Inventory, Settings, Target. `clippedControls: []`. Panel lower chrome dock-clear (inset or equivalent). Overflow JSON recorded. Horizontal overflow **fails**. |
| **S16.16** Both sides | NPC jammer lobe vs player observer and player jammer lobe vs NPC observer: same draw consumer, same in-lobe/out-lobe, same friendly-in-lobe, same share caps (NPC escorts if present), same catch ≠ identity, same decoy ≠ hull. |
| **S16.17** Fire gates / culture / boarding preserved | Replay S14.16–S14.18 / S15.12 / S15.16 / S15.18: no `engagement_authorized` from lobe, share, catch, heat, decoy, silent-running, or delayed order. Boarding APIs absent. Tractor slot. No universal bypass. |
| **S16.18** Phase 6 / 6.5 / 9 / 9.1 power preserved | Replay S9.1–S9.5, S9.8, S10.1–S10.3, S10.7, S14.1, S14.19, S15.1–S15.3, S15.19: first-frame cloak; four layers (residue / decoy are marks, not a fifth religion); shared generation; `ew` still the reserved consumer; dedicated slot. |
| **S16.19** Phase 4/5/7/8 / catalog preserved | After 9.2 ticks: S6.4 standing once; S6.13 `protect` still folds; S6.14 no second FLASH from append; S8 overdue ≠ destroyed ≠ attacker; S12 hold-outside persists; S11 Reman 53 / aliases; S13 markets not restocked; `meetPackPurchaseDecision` untouched. |
| **S16.20** HoJ still emission-only / silence→coast / decoy is a counter | Replay S15.11–S15.13. Seeker may home a **paid decoy emission**; miss/coast on silence; launch still does not gift observer FS or `engagement_authorized`. Matrix row still unmounted/proposed unless a later scoped catalog id exists. **Zero** combat retune. |

Each case may contain multiple assertions. Include startup smoke. Do not claim a Referee Pass from this list.

## 12. Non-goals

Phase 9.2 will not:

- `git am` the remastered EW complete patch, or treat remastered DESIGN as engine source.
- Lock remastered wattages / EU/s / prices / HoJ costs as constants (even if §8 playtest defaults exist).
- Reopen Phase 9’s six hard gates, Phase 9.1’s seven hard gates, or regress PR #33 / PR #35 / S14 / S15.
- Reopen Phase 6 gates 1–8 or Phase 6.5 gates 1–5 (except continuing to use the reserved `ew` consumer **on**, as Phase 9 already did).
- Implement boarding, capture, scuttle, away-team XP, or fleet command transfer (**park** — separate brief).
- Open Phase 10 wider faction / Dominion campaign.
- Gift `firingSolution` or `engagement_authorized` from escort share, decoys, spoof-catch, lobes, heat, silent-running, or HoJ.
- Wipe, unsend, or rewrite already-delivered Phase 4/5 reports or observer copies; unsend FLASH.
- Grant universal shield bypass, or retune weapons / HoJ combat numbers.
- Collapse pursuit, permission to engage, and the per-weapon gate.
- Treat jam / catch / late order as aggression / auto-fire, or pulse FLASH as a default jammer tick.
- Rewrite `playerFaction` / `playerSide` / Reman / catalog access from transponder spoof or catch.
- Treat silent-running or transponder-off as cloak, or residue / decoy as a Phase 9 ghost hull.
- Add a sixth power consumer, a fifth required OPS slider, or steal a weapon / suite slot.
- Strongest-three cutoff, 59.2%/35% ceilings, or “delete the contact” as the jam success condition.
- Activate Phase 3 `unknown` access enforcement as a new 9.2 religion.
- A full ECCM mesh / every-friendly telepathy beyond the escort envelope.
- Deeper spoof UI (voice, IFF panel art) beyond Focused Scan / silhouette / ECCM catch.
- Touch `Artemis2028/BM1-remastered-work` as an implementation source.
- Claim a Referee Pass in `docs/BAKEOFF-STATUS.md`.

## 13. Implementation sequence and handoff

1. **Brief Pass.** Referee / One score the **eight** hard gates. Number 2 scores gates **2, 3, 4** (share / spoof / comms knowledge) and decoy/silent wording on **5**. Number Four scores gates **1, 5, 6, 7** (lobes, heat/`ew`, magnitudes, dock) and the engine half of **2** / **4**, and confirms gate **8** is not a reopen / no boarding hook. Do not open an engine PR on this document alone.
2. **Tenth scopes the engine lane** after Pass. Blind implement from `docs/` against bake-off `main` after #35 (`d1837fe`). Do not implement from remastered `758665e`.
3. **Suggested order if scoped:** magnitude ledger + override hook (S16.14) → lobes on contest (S16.1–S16.3) → escort share escort→flagship (S16.4–S16.6) → spoof catch-path (S16.7–S16.8) → comms-delay Phase 7 hook (S16.9–S16.10) → heat / decoys / silent-running (S16.11–S16.13) → dock-overlap polish + screenshots (S16.15) → preservation (S16.16–S16.20). **Do not** ship a stronger jam on top of contact-delete. **Do not** ship decoy hulls. **Do not** ship dock-clip as “later.”
4. **Number Three** adds/runs S16 after engine. Keep Phase 1 / S4–S15 / `test:catalog` green. Do not weaken S14 or S15 to make S16 pass.
5. Changelog / status Pass wait on Referee after review. This proposal PR may note that the brief is open; it must not write a Pass.

If one model implements a later slice (fitted HoJ catalog id, full ECCM mesh, deeper spoof UI, boarding), reserve a separate review pass. Fable can edit jam/journal copy after the paths work.

## 14. Open questions

Mark these clearly. They do **not** weaken the hard gates.

| ID | Question | Default if engine is scoped before an answer |
| --- | --- | --- |
| Q1 | Exact playtest numbers beyond §8? | **TBD / injectable.** S16.14 asserts override + no remastered lock, not a wattage freeze. |
| Q2 | Jammer aim = hull heading, or a separate aim control? | **Hull heading** first. Optional aim is extra UI, not a gifted FS. |
| Q3 | Sidelobe leakage or hard-zero out-of-lobe? | **Hard-zero** (factor 0). Injectable if playtest wants leakage. |
| Q4 | Share identification-partial from escorts? | **No** in first slice. Detection / last-known / residue only. |
| Q5 | Focused Scan vs ordinary active scan — same button, longer dwell? | Either is fine if probes can tell the catch path ran, emission was written, and FS was not gifted. |
| Q6 | New order delay vs fail-while-disrupted? | Either is scoreable. Standing orders persist. `localElapsedMs` only. |
| Q7 | Heat as jammer property vs a fifth named family? | **Property / control of sensor_jamming** (gate 5). Do not add a sixth consumer. |
| Q8 | Decoy vs ghost — one family with a flag? | **Separate source** (`ew_decoy` vs `ew_ghost`) so probes cannot confuse lure-with-emission and deceptive-without-hull-kill. Both book-only, both no FS. |
| Q9 | Silent-running draw billed even with jammer Off? | **Yes**, if the control is On — that is the spend-to-suppress. Draw 0 + On **fails**. |
| Q10 | Dock fix: max-height vs padding vs dock z-index? | Writer’s choice if S16.15 is green. Do not cover EW math. |
| Q11 | Split engine PRs (lobes vs share vs catch vs UI)? | Tenth decides after Pass. Gate 8 still forbids regressing #33/#35. Dock-overlap still required before calling the UI lane done. |
| Q12 | Difficulty knobs? | **Out.** Political identity stays the same. |
| Q13 | Full friendly ECCM mesh (non-escort allies)? | **Out** (non-goal). Escort envelope only. |

## 15. Lanes

| Who | Owns | Scores |
| --- | --- | --- |
| **Number 2** | Doctrine / knowledge bounds: gates **2, 3, 4** (escort share / spoof catch / comms-delay), decoy ≠ hull and silent ≠ cloak wording on **5**, preservation of ghosts / delivered reports / fire gates / no `engagement_authorized` | Share ≠ gifted FS; catch ≠ Phase 1 rewrite / auto-fire; delay ≠ unsend; decoy ≠ hull; jam ≠ auto-fire |
| **Number Four** | Engine: gates **1, 5, 6, 7** (lobes/contest, heat/`ew`/decoy spend, playtest magnitudes, dock UI) plus share/comms **hooks**. Engine must not hook boarding or reopen #33/#35 | In-lobe mask on paid contest; friendlies take N; no off-budget; override works; dock-clear / no-clip; no remastered watts locked |
| **Number Three** | Probe gate **after** engine (S16 on `__BM1_PROBE__` / offline tests; S4–S15 stay green) | Not this brief |
| **Referee / One** | This brief vs the **eight hard gates** in §2. **Do-not-open** check: no #33/#35 reopen, no `git am`, no Referee Pass claimed from this PR | **Before** any engine PR |

## 16. Deferred work remains on the plan

Full ECCM mesh beyond escorts, deeper spoof UI (voice / IFF art), a fitted HoJ catalog id, empty-but-armable persistence, boarding/capture (**parked — separate brief**), Phase 10 wider faction / Dominion, construction visuals, HTML review catalogs, and difficulty knobs stay on the convergence backlog. Independently addressable deep-space locations remain the plan §8 later add. Activating `unknown` access still waits on a later scoped slice. A **weapon overhaul** still waits on the reviewed Phase 9 matrix **plus** the HoJ row from 9.1 **plus** a later Tenth-scoped retune.

Phase 9.2 is ready to score when a reader can mark Pass/Fail on all eight gates: directional lobes on the landed contest with friendlies in-lobe affected and no off-budget field; escort ECCM share of detection / last-known / residue only; spoof catch-path without Phase 1 rewrite or auto-fire; comms-delay of new deliver / new order without unsending reports; heat / decoys / silent-running costed on `ew` with decoys ≠ hulls and silent ≠ cloak; injectable playtest magnitudes not remastered locks; dock-overlap UI polish for the screenshot / no-clip gate; Phase 9 / 9.1 / #33 / #35 / delivered reports / ghosts / boarding-out preserved.

## Sources and precedence

- This amend’s engine checklist: `docs/phase9/BM1-PHASE9.2-ENGINE-DEPENDENCIES.md`.
- Phase 9.1 locked baseline (do not reopen): `docs/phase9/BM1-PHASE9.1-EW-ROBUSTNESS-PROPOSAL.md`; `docs/phase9/BM1-PHASE9.1-ENGINE-DEPENDENCIES.md`; `src/phase91-*.js`; PR #35 (`d1837fe`); S15. UI residual: `docs/phase9/screenshots/phase91/NOTES.md`.
- Phase 9 locked baseline (do not reopen): `docs/phase9/BM1-PHASE9-EW-WEAPONS-PROPOSAL.md`; `docs/phase9/BM1-PHASE9-ENGINE-DEPENDENCIES.md`; `src/phase9-ew.js`; `src/phase9-weapons-matrix.js`; PR #33 (`2b38a14`); S14.
- Plan §4 Phase 9 exit, §9 fleet, and §11 EW and weapons: `docs/revised-development-plan.md`.
- Phase 6 layers / contact book / escort share Q3: `docs/phase6/BM1-PHASE6-SENSORS-CLOAK-SYSTEM-SPACE-PROPOSAL.md` §5.2; `src/phase6-sensors.js` (`shareFormationDetection`, `performActiveScan`); PR #24; S9.
- Phase 6.5 reserved EW consumer, suites, brown-out: `docs/phase6/BM1-PHASE6.5-POWER-SENSORS-SUITES-PROPOSAL.md`; `src/phase65-power.js`; PR #27; S10.7.
- Phase 7 fleet orders / hold-outside / comms-failure stub: `src/phase7-fleet.js` (`COMMS_FAILURES_IMPLEMENTED`, `commsFailureNote`); PR #29; S12.
- Phase 4 reports / FLASH / tokens / allowlist: `docs/phase4/`; `src/phase4-incidents.js`; PR #13; S6.
- Phase 5 delivered knowledge / overdue ≠ destroyed ≠ attacker: `docs/phase5/`; `src/phase5-objectives.js`; PR #21; S8.
- Phase 3 broadcast / access: `src/phase3-checkpoints.js` `makeBroadcast`; unknown stored, not enforced.
- Fire gates / no `engagement_authorized`: Phase 1; `src/doctrine.js` `deriveLiveFireFacts`; `consultDoctrineFire` in `src/main.js`.
- Phase 1 identity: `state.playerFaction` / `state.playerSide`; Reman **53** via catalog wire + side-lane unlock — not a transponder field and not a catch-path write.
- UI: `styles.css` `.top-left-panel` / `.bottom-dock`; 9.1 screenshot process.
- Remastered EW pack / DESIGN: **background shapes only**. Not a patch source. Not a constant lock. Not `758665e`.
- Bake-off process: `docs/BAKEOFF-STATUS.md` (this PR may note the 9.2 brief is open; no Pass claimed; #33 and #35 remain the locked Phase 9 / 9.1 engine baselines).

Settled Phase 1–9.1 behavior, Phase 9’s six gates, Phase 9.1’s seven gates, PR #33, PR #35, and these eight Phase 9.2 gates take precedence over older handoff text that treated jamming as an isotropic cloak-sphere, escort share as a gifted firing solution, spoof-catch as identity, decoys as ships, silent-running as cloak-void, remastered watts as live locks, or HoJ as a gifted firing solution.
