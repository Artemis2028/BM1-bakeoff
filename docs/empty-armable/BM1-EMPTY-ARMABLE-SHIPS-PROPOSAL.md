# BM1 empty but armable ships

**Status:** proposal for empty-slot persistence + unarmed-cannot-fire; no engine changes made by this document.  
**Repository:** `Artemis2028/BM1-bakeoff`  
**Planning baseline:** `a3d9611` on `main` (19 September 2026), after weapon / device source ledger engine (PR #49).  
**Referee context:** Phase 4 engine §6 **Pass** on `7f926df`. Phase 9–9.4 EW (PRs #33 / #35 / #37 / #42 / #43 / #44 / #45), boarding (PRs #38 / #39), Phase 10 Dominion-first (PRs #40 / #41), flags / passes (PRs #46 / #47), and the weapon / device source ledger (PRs #48 / #49) are the **locked** baselines — **Keep #33, #35, #37, #38, #39, #40, #41, #42, #43, #44, #45, #46, #47, #48, and #49 locked.** This is an **empty-but-armable brief only**, not a combat retune, not a fire-gate reopen of Phase 9, not a catalog rewire, and **not** a claim that those lanes already had a Referee Pass on the status MD. This brief does **not** claim a new Referee Pass.  
**Companion:** `docs/empty-armable/BM1-EMPTY-ARMABLE-ENGINE-DEPENDENCIES.md` (hooks, risks, later S23 probe sketch).  
**Scoped by:** Tenth Mountain Trooper, 2026-09-19 — proposal first; no engine until Tenth scopes after a brief Pass. Room-locked hard gates (three slots; empty stays empty; unarmed NPC cannot fire; legal install uses installed def only; Tractor stays a slot; no gifted fire; do-not-reopen + named outs + blind) are **in** this one scoreable brief.

Phases 1–10 and Phase 9–9.4 already landed, including closed fire gates (pursuit ≠ permission ≠ per-weapon firing gate), a read-only weapons matrix, a subscribe-only source ledger, a utility inventory book beside the three combat/device slots, and boarding that already preserves empty prize slots (`emptySlotsStayEmpty`). Convergence §3 and plan §16.2 row 3 named the remaining **empty but armable** gap: a hull has **three** combat/device slots; empty stays **empty** across save, load, scene change, and restoration; an unarmed NPC **cannot fire**; doctrine / ROE / hostility do not create a shot from an empty hardpoint. That is the doctrine physical gate (“equipped weapon… readiness”) and plan §11 (“per-weapon firing gate”).

This is **one** persistence + physical-gate brief: publish a **scoreable contract** that `[]` / three empty slots stay empty, that an unarmed NPC never emits a projectile, and that a later legal install fires **that** installed def only. It is not a remastered `git am`, not a Phase 9 matrix rewrite, not a ledger retune, not station-construction visuals, not dockClear polish, not an HTML catalog, and not a Flash price lock.

## 1. The result we want

A reader can **score empty persistence and the physical fire gate** without anyone retuning combat or inventing a fourth hardpoint. Purchase or spawn of an armable hull with `[]` / `[null, null, null]` stays empty after reload. That NPC never emits a projectile while unarmed. After the player or a legal yard installs a weapon, fire uses that installed definition only. Tractor remains a legal **slot** device when mounted.

**Exit condition (GUIDED-CONVERGENCE §3 / plan §16.2 row 3):** purchase or spawn an armable hull with `[]` / three empty slots; reload; slots still empty; that NPC never emits a projectile; after a legal install, fire uses that installed def only.

**Proposed first-release decisions:**

| Question | Proposed answer |
| --- | --- |
| What is the first playable slice? | **Docs-only** scoreable contract under `docs/empty-armable/`. A later thin persistence / physical-gate engine, **if** Tenth scopes it after Pass, **subscribes** to landed `packDefaultWeaponSlots` / `hullIsEmptyButArmable` / `unarmedNpcCannotFire` / boarding `emptySlotsStayEmpty` without rewriting combat numbers or moving Tractor. |
| How many combat/device slots? | **Three.** Canonical empty is `[null, null, null]`. Incoming `[]` **means** three empty — not “unknown, fill a Phaser.” Never a fourth hardpoint. |
| May empty auto-fill a default Type X Phaser because the ship “should have guns”? | **No.** Across save, load, scene change, `systemStates` wipe + restore, security participant restore, and `applyShipDefaultWeapons`. |
| May doctrine fire permission, ROE, or hostility create a shot from an empty hardpoint? | **No.** Physical / per-weapon gate. `consultDoctrineFire` may still inspect; it must not mint a weapon id. |
| After a legal player / yard install? | Fire uses **that** installed def only. Empty remaining slots still cannot fire. |
| May Tractor leave the device slot? | **No.** Id 25 / type Device. Not cargo, not `utilityBook`, not boarding. Empty-armable does not move Tractor. |
| May “empty but armable” gift `firingSolution`, culture fire, or `engagement_authorized`? | **No.** |
| May we reopen EW #33/#35/#37/#42/#43/#44/#45, boarding #38/#39, Phase 10 #40/#41, flags #46/#47, or ledger #48/#49? | **No.** |
| DockClear polish, construction visuals, HTML catalogs, combat retune, Flash price locks? | **Out.** |
| May we `git am` remastered patches or lock remastered constants? | **No.** `EMPTY_ARMABLE_LOCKED_FROM_REMASTERED === false` (name can change). |
| Do existing helpers already close this package? | **No.** Catalog-wire helpers and boarding prize-preserve are **subscribe points**. They are not a scored S23 Pass. Partial `normalizeWeaponLoadout` / `getNpcCombatWeaponId` branches do not make the room’s three acceptance exercises green as a package. |
| Is this a Referee Pass? | **No.** Referee / One / Number 2 / Number Four score the hard gates **before** any engine. Number Three probes only after engine. |

These are recommendations for this persistence package, not new decisions attributed to the user. Locked bake-off constraints take precedence over older flavor that treated an empty hull as “broken until it gets a Phaser,” stuffed Tractor into cargo, or treated doctrine permission as a shot.

Cite GUIDED-CONVERGENCE §3 and plan §16.2 row 3 as the planning sources this brief **reconciles**, not as a second spec:

| Planning source | This brief |
| --- | --- |
| GUIDED §3: a hull has **three** combat/device slots | Gate 1. |
| GUIDED §3: empty stays empty across save, load, scene change, and restoration | Gate 2. |
| GUIDED §3: do not auto-fill a default Phaser because the ship “should have guns” | Gate 2. |
| GUIDED §3: an unarmed NPC cannot fire | Gate 3. |
| GUIDED §3: doctrine / ROE / hostility do not create a shot from an empty hardpoint | Gates 3 and 6. |
| Doctrine “equipped weapon… readiness”; plan §11 per-weapon firing gate | Gates 3, 4, 6. Phase 9 gate 5 **subscribe**, do not reopen. |
| GUIDED §3 acceptance 3: after legal install, fire uses that installed def only | Gate 4. |
| GUIDED §1 / ledger #48/#49: Tractor stays a weapon/device slot | Gate 5. |
| Phase 9 gate 5 / ledger gate 7: never gift FS / culture / `engagement_authorized` | Gate 6. |
| Plan §16.2 rows 1, 2, 4, 5, 9 | **Locked or out.** Do not reopen ledger / flags / boarding. Construction visuals and HTML catalogs stay out. |

## 2. Locked constraints (do not reopen)

The bake-off room locked these before this brief. Implementation and probes must treat **gates 1–8** as **hard gates**. Referee / One score this brief against those **eight** **before** any engine PR. Number Three probes only after engine. EW / boarding / Phase 10 / flags / ledger gates stay **closed**; they are restated only as **gate 7** (preserve / do-not-open), not as a reopen. This docs PR **does not** claim a Referee Pass.

### Hard gate 1 — Three combat / device slots

> A hull has **three** combat/device slots. Canonical empty is `[null, null, null]`. Incoming `[]` **means** three empty slots. Do **not** add a fourth hardpoint. Do **not** steal the dedicated suite slot, `ew_equipment`, `weaponInventory` locker, cargo pods, or `utilityBook` to “hold the missing gun.”

Lane owner (wording): **Number Four**.

`state.weaponSlots` is already length 3. First slice **keeps** that. A probe that “implements empty-armable” by adding slot 4, or by writing the empty state into `utilityBook`, **fails**.

### Hard gate 2 — Empty stays empty

> Empty stays **empty** across save, load, scene change, and restoration. Do **not** auto-fill a default Phaser (Type X id **1** / `DEFAULT_WEAPON_ID`) because the ship “should have guns.” `[]` and `[null, null, null]` are the same empty. `systemStates` wipe on `loadGame` must not refill from `getOriginalShipWeaponSlots` / `getDefaultWeaponId`. Security participant restore and scene realize must not refill.

Lane owner (wording): **Number Four**.

`saveGame` already serializes `weaponSlots` (~14116). `loadGame` already restores them (~14277) then calls `normalizeWeaponLoadout()` (~14332). That restore is **not** enough while normalizers can still write Type X into slot 0. A reload that starts from three empties and ends with id 1 **fails** even if the UI “looks armed.”

### Hard gate 3 — Unarmed NPC cannot fire

> An unarmed NPC **cannot fire**. Doctrine fire permission, ROE, hostility, `playerAggroUntil`, hunt, raid, and pack `protect` do **not** create a shot from an empty hardpoint. This is the **physical** / per-weapon firing gate. No projectile, beam effect, or firing-evidence token from empty slots.

Lane owner (wording): **Number Four** on emit; **Number 2** on “permission ≠ a shot.”

`fireNpcWeapon` already returns when `getNpcCombatWeaponId` is null (~17818–17819). First slice must **keep** that and close the fallback that still calls `getDefaultWeaponId` when the hull is not catalog-tagged empty-but-armable (~16619). A hostile empty shuttle that emits Type X **fails**.

### Hard gate 4 — After legal install, fire uses that installed def only

> After the player or a legal yard installs a weapon, fire uses **that installed definition only**. Empty remaining slots still cannot fire. Do not emit Type X because it is `DEFAULT_WEAPON_ID`. Do not emit a sibling disruptor identity because the installed row “looks like a disruptor.” Tractor mounted in a slot is the Tractor def (device), not a Phaser.

Lane owner (wording): **Number Four**.

Legal install paths already exist: `buyWeapon` may auto-load an empty hardpoint (~11227) and `loadWeaponSlot` writes the purchased id. Those are **legal installs**, not spawn auto-fill. A later engine that blocks the player from loading a bought gun **fails** this gate the other way.

### Hard gate 5 — Tractor stays a weapon / device slot

> **Tractor Beam** stays a **weapon/device slot** item — bake-off **id 25 / type Device / price 3400**. Empty-armable does **not** move Tractor to cargo, `utilityBook`, `weaponInventory` as the only home, or boarding. `tractorIsBoarding()` stays **false**. A hull with Tractor mounted is **not** “unarmed for device use”; it is still **unarmed for projectiles** if no combat weapon is installed (`isCombatWeapon` already excludes Tractor).

Lane owner (wording): **Number Four** on slot class; **Number 2** on “hold ≠ board / ≠ fire token.”

Ledger #48/#49 and flags #46/#47 already forbade stuffing Tractor into the credential book. This brief **repeats** that lock from the empty-slot side.

### Hard gate 6 — Never gift fire from “empty but armable”

> “Empty but armable” status must **never** gift `firingSolution`, culture fire, or `engagement_authorized`. It is not a weapons-free token, not a Phase 3 ceasefire, not a boarding warrant, and not a Dominion discovery write. Pursuit, permission to engage, and the per-weapon firing gate stay the landed three-step.

Lane owner (wording): **Number 2**.

Same doctrine lean as Phase 9 gate 5, Phase 10 stories, flags credentials, and the ledger. An empty hull that is legally hostile may still **pursue**. It must not **shoot**.

### Hard gate 7 — Do not reopen landed lanes

> Do **not** reopen EW #33 / #35 / #37 / #42 / #43 / #44 / #45 (matrix read-only; ghosts book-only; no report wipe; soft numbers ≠ new fire rules; `MAGNITUDES_LOCKED_FROM_REMASTERED === false`). Do **not** reopen boarding #38 / #39 (`tractorIsBoarding()` stays false; capture XOR scuttle; XP `not_tracked_yet`; prize empty slots already preserved). Do **not** reopen Phase 10 #40 / #41 (stories stay knowledge layers). Do **not** reopen flags / passes #46 / #47 (`utilityBook` stays credentials; Thaleron pass **unverified — not shipped**). Do **not** reopen weapon ledger #48 / #49 (Phase 9 matrix read-only; Flash prices source not locks; three disruptor identities; Bajoran Sail / Warp Core deferred).

Lane owner (wording): **Referee / One**.

### Hard gate 8 — Named outs; blind bake-off

> Do **not** open dockClear polish, station construction visuals, HTML catalogs, combat retune, or Flash price locks. Do **not** `git am` remastered patches. `EMPTY_ARMABLE_LOCKED_FROM_REMASTERED === false`. Implement later from bake-off `docs/` + landed catalog helpers — **not** `BM1-remastered-work` engine.

Lane owner (wording): **Referee / One**.

### Soft gate 9 — Suites stay green (after engine)

> **Soft:** existing suites stay green (S4–S22 / catalog / doctrine / boarding / Phase 10 / Phase 9.4 / utility / weapon-ledger). Screenshot / no-clip is **N/A** on this docs PR. A later engine PR attaches UI shots **only if** an empty-slot readout ships; dockClear polish stays **out**.

Lane owner (wording): **Number Four** (process); **Number Three** scores suite-green **after** engine.

### Also from the room (score with the gates)

| Plan / room want | How this brief locks it |
| --- | --- |
| Three combat/device slots | Gate 1. |
| Empty stays empty across save / load / scene / restoration | Gate 2. |
| Unarmed NPC cannot fire; doctrine / ROE / hostility ≠ a shot | Gate 3. |
| After legal install, fire uses installed def only | Gate 4. |
| Tractor stays a slot; not cargo / utility / boarding | Gate 5. |
| Never gift FS / culture / `engagement_authorized` | Gate 6. |
| Do not reopen EW / boarding / Phase 10 / flags / ledger | Gate 7. |
| Named outs; blind; remastered-lock false | Gate 8. |
| Suites green; no Referee Pass from this PR | Soft gate 9. Scoring note below. |

### Must not break (cite landed work)

Score as **preservation**. A later empty-armable Pass that regresses them is a Fail. **#33, #35, #37, #38, #39, #40, #41, #42, #43, #44, #45, #46, #47, #48, and #49 stay locked.**

| Locked rule | Cite | This brief / later engine must not |
| --- | --- | --- |
| Pursuit ≠ permission ≠ per-weapon gate | Phase 9 gate 5; plan §11 | Gift FS / culture / `engagement_authorized` from empty status. Treat doctrine inspect as a shot. |
| Ten-column matrix before overhaul; numbers unchanged | Phase 9 gate 4; S14.12; ledger #48/#49 | Edit live damage / cooldown / range / price “so empty ships can fight.” |
| Three disruptors + Tractor Device slot | S14.13; GUIDED §1; ledger gates 2–3 | Collapse 6/7/12. Move Tractor to cargo / `utilityBook`. |
| Mapping cites fitted / unmounted / inherited-only; no auto-fill | S14.15; `mappingDidNotAutoFill` | Fill empty slots so the matrix “has hosts.” |
| Tractor ≠ boarding | #38 / #39; `tractorIsBoarding() === false` | Tractor-as-capture. Empty prize auto-armed. |
| Prize / command-transfer identity preserved | Boarding S17.10 | Call `applyShipDefaultWeapons` on capture / transfer. |
| Flags/passes are credentials, not slots | #46 / #47 | Move empty-slot state into `utilityBook`. Ship Thaleron **pass**. |
| Ledger subscribe-only; Flash prices not locks | #48 / #49 | Treat Type X 3000 as a live lock that “must be gifted.” |
| Money ≠ standing ≠ Reman | PR #28; Phase 8 | Latinum + an empty hull bypasses `meetPackPurchaseDecision`. |
| Catalog 172 / 38 aliases / Reman **53** | PR #28; S11 | Second Reman id because a gun “needs a host.” |
| `*_LOCKED_FROM_REMASTERED === false` | #44–#49 | Flip EW / boarding / Phase 10 / utility / ledger / new empty-armable lock flags true. |

### Process locks (not a change to gates 1–8)

- **Proposal first.** Do not implement from this text until Tenth scopes the engine lane after a brief Pass.
- **Blind bake-off.** Implement against bake-off `main` (`a3d9611` after #49), **not** remastered `758665e`. From `docs/` + landed catalog helpers only. Do **not** crib `Artemis2028/BM1-remastered-work`.
- **Subscribe, do not fork.** Reuse `packDefaultWeaponSlots`, `hullIsEmptyButArmable`, `unarmedNpcCannotFire`. Do not invent a second slot religion.
- **#33 / #35 / #37 / #38 / #39 / #40 / #41 / #42 / #43 / #44 / #45 / #46 / #47 / #48 / #49 stay locked.**
- **No Pass claimed** in `docs/BAKEOFF-STATUS.md` from this PR.

### Scoring note

Referee / One / Number 2 / Number Four score the **eight hard gates** **before** any engine PR. Number Three probes **only after** engine. **No Referee Pass is claimed by this docs PR.** Room scores the brief before any engine.

## 3. What “empty but armable” means (gates 1–2)

**Lane owner (wording):** Number Four.

| Term | Meaning in this brief |
| --- | --- |
| Armable | The hull has the **three** combat/device hardpoints. It may receive a legal player / yard install. |
| Empty | No installed combat or device id in those three slots. Canonical: `[null, null, null]`. `[]` is the same empty. |
| Empty but armable | Pack (or probe) loadout is three empties **and** the hull may later be fitted. Catalog examples: pack hulls **348** Andorian Cargo Shuttle, **349** Utility Shuttle, **350** Basic Shuttle (`defaultWeaponSlots: [null, null, null]`, `armedByDefault: false`). |
| Unarmed (fire) | No **combat** weapon installed. Tractor-only is unarmed for **projectiles** (`isCombatWeapon` excludes Tractor and cloak). |
| Legal install | Player `buyWeapon` / `loadWeaponSlot`, or a later yard path Tenth already treats as a real fit. Not spawn, not save/load, not scene restore, not `applyShipDefaultWeapons` filler. |
| Default starter Type X | The **current default player start** (`weaponSlots: [1, null, null]` on the starter hull) is **not** this package. Do not strip the starter Phaser from a non-empty-armable starter hull. |

`hullIsEmptyButArmable(ship)` today is `Boolean(packDefaultWeaponSlots(ship)) && !slots.some(Boolean)` (`src/ship-catalog-wire.js`). That helper is a **subscribe point**. First engine may keep it. It must also treat a **live** `[null, null, null]` / `[]` on any armable hull as empty, even when the catalog row is not tagged — otherwise a probe-forced empty NPC on a fitted hull class still auto-fills.

## 4. Persistence surfaces (gate 2)

Empty must survive every restore that bake-off already has. Do not invent a new save format.

| Surface | Landed fact at `a3d9611` | This brief requires |
| --- | --- | --- |
| Player `state.weaponSlots` | Length 3. Init `[DEFAULT_WEAPON_ID, null, null]`. | Unchanged length. Empty-armable purchase / probe must be able to hold `[null, null, null]`. |
| `saveGame` / `loadGame` | Sibling key `weaponSlots` (~14116 / ~14277). Then `normalizeWeaponLoadout()` (~14332). `systemStates = {}` still wipes (~14314). | Restore the three empties. Normalizer must not write id 1. |
| `applyShipDefaultWeapons` / `getOriginalShipWeaponSlots` | Pack empties can stay empty **if** `hullIsEmptyButArmable`. Else slot 0 ← `getDefaultWeaponId` (~11090–11092). `equippedWeaponId` may still fall back to `DEFAULT_WEAPON_ID` (~11105). | Purchase of 348/349/350 (and any other pack-empty hull) stays empty. No Type X gift. `equippedWeaponId` may be `null` when all slots are empty. |
| `normalizeWeaponLoadout` | Has an `emptyByDesign && savedEmpty` early return (~11131–11141) and a `preserveFittedWeaponSlots` boarding path. Other paths fill slot 0 from fallback (~11154–11160). | Those early returns stay. The filler paths must not defeat gate 2 for empty-armable or probe-forced empty. |
| `createNpcShip` | Writes `getNpcDefaultWeaponSlots(shipId)` (~2196). Pack empties already return `[null, null, null]`. | Keep. Do not then overwrite from `getDefaultWeaponId`. |
| Scene realize | Copies `ship.weaponSlots.slice(0, 3)` or defaults (~3225). | Copy empties. Missing array on an empty-armable hull → three nulls, not Type X. |
| Security restore | `reconcileSecurityParticipants` may `createNpcShip` then `applyParticipantSnapshot` (~8177–8198). Snapshot **does not** currently carry `weaponSlots` (~7540). | Restoration must not refill. If the snapshot omits slots, empty-armable / previously-empty live slots stay empty. |
| Boarding / command transfer | Prize and transfer already preserve slots including empty (S17.10). `preserveFittedWeaponSlots` (~5802). | **Subscribe.** Do not call `applyShipDefaultWeapons` on capture. Do not reopen #38/#39. |
| Fleet overlay | `overlayPrizeOnNpc` clones slots when present (~5768). | Keep empties. |

God Mode `grantGodResources` still writes a debug loadout `[1, 15, 25]` (~14034). That path stays **debug / out** of the empty-armable contract (Q6).

## 5. Physical fire gate (gates 3–4, 6)

**Lane owner (wording):** Number 2 on permission ≠ shot; **Number Four** on emit.

Doctrine already separates intent from the shot:

> Choose a guarded intent. Separately enforce live tracking, equipped weapon range, readiness, resources and authorization for each shot.

Phase 9 already locked pursuit ≠ permission ≠ per-weapon gate. This brief **is** the physical half of that last step for empty hulls. It does **not** reopen Phase 9 gate 5.

| Step | May an empty hull do it? | Must not |
| --- | --- | --- |
| Pursue / hold heading / keep aggro | **Yes** (Phase 1 hunters may pursue beyond range) | Emit a projectile “because it is hunting” |
| Doctrine `inspectFire` / ROE / hostility | **Yes**, as a shadow inspect | Write a weapon id, `firingSolution`, or `engagement_authorized` |
| `fireNpcWeapon` / `addProjectile` / beam effect | **No** while no combat id is installed | Fall back to Type X / faction default |
| Player `firePlayerWeapon` on an empty slot | Landed: log “No weapon loaded” and return (~17664–17666) | Call `getWeapon()` with no id (that helper still defaults to Type X — ~10800) |
| After legal install of def D | Fire **D** only from that slot | Fire id 1, a sibling disruptor, or an empty sibling slot |

`consultDoctrineFire` today sets `weaponUsable: true`, `weaponReady: true`, `insideEquippedRange: true` (~8470–8472) and then **deletes** `engagement_authorized` (~8489). First slice must **keep the delete**. A later engine may pass honest `weaponUsable: false` when slots are empty; it must not invert the gate so that a true inspect **creates** a shot.

`getNpcCombatWeaponId` (~16612–16619):

1. Prefer installed combat ids.
2. `unarmedNpcCannotFire` → `null`.
3. `hullIsEmptyButArmable` → `null`.
4. **Else** `getDefaultWeaponId(..., true)` — **this fallback is the load-bearing leak** for a probe-forced empty on a hull that is not catalog-tagged.

First engine closes (4) for empty live slots. It does **not** disarm fitted catalog hulls that actually spawn with pack weapons.

Stations that fall back to `DEFAULT_WEAPON_ID` (`getStationDefenseProfile` ~11019; `fireStationWeapon` ~17919) are **out of this ship package**. Do not “fix” stations here (Q7).

## 6. Legal install (gate 4)

| Path | Is it a legal install? | Afterward |
| --- | --- | --- |
| `buyWeapon` auto-load into first empty compatible slot | **Yes** (player purchase) | That slot fires the bought id only |
| `loadWeaponSlot` / inventory assign | **Yes** | Same |
| Later yard / refit Tenth already treats as a real fit | **Yes** | Same |
| `applyShipDefaultWeapons` filler / `getDefaultWeaponId` | **No** | Must not run for empty-armable / forced-empty |
| `normalizeWeaponLoadout` slot-0 fallback | **No** | Must not refill empty-armable |
| God Mode grant loadout | **Out** (debug) | Must not become the empty-armable rule |
| Boarding capture / command transfer | **Preserve**, not install | Empties stay empty |

Tractor may be the installed def. Firing / holding Tractor is device use, not a projectile, and not boarding.

## 7. Acceptance exercises (S23 sketch)

Keep Phase 1 / S4–S22 / doctrine / catalog / boarding / Phase 10 / Phase 9.4 / utility / weapon-ledger green. **S14 stays Phase 9.** **S17 stays boarding.** **S22 stays ledger.** Add **S23** only **after** Tenth scopes a later thin engine. IDs are a sketch; do not promise a final count. **This docs PR does not add S23 to the probe.**

Number Three owns the probe gate **after** engine, not this brief.

| Case | Required exercise and result (later engine only) |
| --- | --- |
| **S23.1** Purchase / spawn empty; reload still empty | Buy or probe-spawn an armable hull with `[]` / `[null, null, null]` (pack examples 348 / 349 / 350 **or** a forced-empty live hull). `saveGame` / `loadGame`: slots still three empties. `equippedWeaponId` is `null` (or equivalent “none”). No id 1 gift. |
| **S23.2** Scene change + restoration still empty | After S23.1 (or an equivalent NPC spawn), change system / wipe `systemStates` / restore security participant. Slots still empty. `createNpcShip` + `applyParticipantSnapshot` did not fill Type X. |
| **S23.3** Unarmed NPC never emits a projectile | That empty NPC, with hostility / aggro / hunt / doctrine inspect forced as needed: `fireNpcWeapon` does not push a projectile, beam effect, or firing-evidence token. `getNpcCombatWeaponId === null`. |
| **S23.4** Legal install fires installed def only | Install a legal weapon (player buy or probe `loadWeaponSlot`) — e.g. Photon id 15 or pack-legal id. Fire uses **that** id only. Sibling empty slots still cannot fire. Uninstall / empty again → no shot. |
| **S23.5** Tractor still a slot; no fire gift | Tractor id 25 remains Device / slot / not cargo / `tractorIsBoarding() === false`. Empty-armable inject does not write `firingSolution` or `engagement_authorized`. Culture cannot grant fire. |
| **S23.6** Landed lanes preserved | Replay S14–S22 / S17 / S18. No EW / boarding / Phase 10 / flags / ledger reopen. No dockClear / construction / HTML-catalog / combat-retune / Flash-lock work in the diff. `EMPTY_ARMABLE_LOCKED_FROM_REMASTERED === false`. Three slots still length 3. |

Do not claim a Referee Pass from this list.

## 8. Non-goals

This brief will not:

- Implement engine code, UI screenshots, or dockClear polish.
- Retune damage, cooldown, range, or live prices.
- Rewrite the Phase 9 ten-column matrix or reopen fire-gate wording.
- Collapse Canon / Cannon / Turret.
- Move Tractor to cargo, `utilityBook`, or boarding.
- Treat any Flash number as a live price lock.
- Gift `firingSolution`, culture fire, or `engagement_authorized`.
- Strip the default starter Type X from a non-empty-armable starter hull.
- Open station construction visuals or HTML review catalogs.
- Invent Bajoran Sail / Warp Core ids, or ship Thaleron Test Facility.
- Reopen EW PRs #33 / #35 / #37 / #42 / #43 / #44 / #45, boarding #38 / #39, Phase 10 #40 / #41, flags #46 / #47, or ledger #48 / #49.
- `git am` remastered patches, or treat remastered DESIGN as engine source.
- Claim a Referee Pass in `docs/BAKEOFF-STATUS.md`.

## 9. Open questions

Mark these clearly. They do **not** weaken the hard gates.

| ID | Question | Default if a later engine is scoped before an answer |
| --- | --- | --- |
| Q1 | Canonical on-disk form: always `[null, null, null]`, or allow `[]` in saves? | **Either reads as empty.** Writes may canonicalize to three nulls. Must not fill Type X. |
| Q2 | Must every probe use pack hulls 348 / 349 / 350? | **No.** Those are the catalog examples. A forced-empty live hull must also stay empty (gate 2/3). |
| Q3 | Player `equippedWeaponId` when all slots empty? | **`null` / none.** UI may say “unarmed.” Do not keep a ghost Type X id. |
| Q4 | Should `consultDoctrineFire` pass `weaponUsable: false` when empty? | **Allowed** as honesty. Must not create a shot either way. Keep the `engagement_authorized` delete. |
| Q5 | Live 66-hull path without pack `defaultWeaponSlots`? | Treat a live empty array as empty. Do not refill just because pack helpers returned `null`. |
| Q6 | God Mode grant loadout `[1, 15, 25]`? | **Out.** Debug remains debug. Must not become the empty-armable rule. |
| Q7 | Station `DEFAULT_WEAPON_ID` fallback? | **Out.** This package is ships. Do not retune station defense here. |
| Q8 | HTML weapon catalog / construction visuals / dockClear? | **Out.** |

## 10. Implementation sequence and handoff

1. **Brief Pass.** Referee / One score the **eight hard gates**. Number 2 scores gates **3** and **6** (physical gate / no gifted fire) and the doctrine half of **5**. Number Four scores gates **1, 2, 4, 5** and the engine half of **7**, plus soft gate **9** as process. Do not open an engine PR on this document alone.
2. **Tenth scopes** a later thin persistence / physical-gate engine **or** leaves this as docs-only. Blind implement from `docs/empty-armable/` against bake-off `main` after #49 (`a3d9611`).
3. **Suggested order if scoped:** canonicalize `[]` / three nulls + hard-fail Type X auto-fill (S23.1) → scene / restore (S23.2) → close `getNpcCombatWeaponId` fallback (S23.3) → legal install uses installed def (S23.4) → Tractor slot + no FS inject (S23.5) → preservation replay (S23.6). **Do not** retune combat. **Do not** move Tractor. **Do not** reopen #33–#49.
4. **Number Three** adds/runs S23 after engine. Keep S4–S22 green. Do not weaken S14 / S17 / S22 to make S23 pass.
5. Changelog / status Pass wait on Referee after review. This proposal PR may note that the brief is open; it must **not** write a Pass.

## 11. Lanes

| Who | Owns | Scores |
| --- | --- | --- |
| **Number 2** | Doctrine: gates **3, 6** — permission ≠ a shot; no FS / culture / `engagement_authorized`; Tractor hold ≠ board | An empty hardpoint is not a shot |
| **Number Four** | Engine: gates **1, 2, 4, 5** (three slots, persistence, installed-def-only, Tractor slot) plus later S23 subscribe-only hooks. Must not retune `game_items.json` or reopen EW / boarding / flags / ledger | Empties persist; unarmed cannot emit; install fires that def |
| **Number Three** | Probe gate **after** engine (S23; S4–S22 stay green) | Not this brief |
| **Referee / One** | This brief vs the **eight hard gates** in §2. Gates **7–8** (do-not-reopen + named outs + blind). **Do-not-open** check: no #33–#49 reopen; no dockClear / construction / HTML catalogs / combat retune / Flash locks; no `git am`; **no Referee Pass claimed** from this PR | **Before** any engine PR |

This brief is ready to score when a reader can mark Pass/Fail on: three slots; empty stays empty; unarmed NPC cannot fire; legal install uses installed def only; Tractor still a slot; no gifted fire; landed EW / boarding / Phase 10 / flags / ledger not reopened; remastered-lock false and named outs held.

## Sources and precedence

- This brief’s engine checklist: `docs/empty-armable/BM1-EMPTY-ARMABLE-ENGINE-DEPENDENCIES.md`.
- Planning: `docs/GUIDED-CONVERGENCE.md` §3; `docs/revised-development-plan.md` §11, §16.2 row 3.
- Doctrine physical gate: `docs/doctrine/DESIGN-doctrine-v0.2.1.md` “Action and fire.”
- Catalog examples: `bm-ships/ships.json` ids **348 / 349 / 350**; `docs/SHIP-ECONOMY-REVIEW.md` “Equipment and availability.”
- Catalog helpers (subscribe): `src/ship-catalog-wire.js` `packDefaultWeaponSlots` / `hullIsEmptyButArmable` / `unarmedNpcCannotFire`.
- Landed fire / slots: `src/main.js` `weaponSlots`, `applyShipDefaultWeapons`, `normalizeWeaponLoadout`, `getNpcCombatWeaponId`, `fireNpcWeapon`, `firePlayerWeapon`, `consultDoctrineFire`, `saveGame` / `loadGame`.
- Boarding preserve (subscribe, do not reopen): `docs/boarding/`; PRs **#38 / #39**; S17.10.
- Ledger / Tractor / Flash (do not reopen): `docs/weapon-ledger/`; PRs **#48 / #49**.
- Flags/passes (do not stuff slots into the book): `docs/flags-passes/`; PRs **#46 / #47**.
- EW locked: `docs/phase9/`; PRs **#33 / #35 / #37 / #42 / #43 / #44 / #45**; S14–S20.
- Phase 10 locked: `docs/phase10/`; PRs **#40 / #41**; S18.
- Remastered engine / DESIGN: **out of bounds.** Not a patch source. Not a constant lock. Not `758665e`.
- Bake-off process: `docs/BAKEOFF-STATUS.md` (this PR may note the empty-armable brief is open; **no Pass claimed**; #33–#49 remain locked).

Settled Phase 1–10 behavior, Phase 9–9.4 gates, PR #33 / #35 / #37 / #38 / #39 / #40 / #41 / #42 / #43 / #44 / #45 / #46 / #47 / #48 / #49, and these eight hard gates take precedence over older handoff text that auto-filled a Phaser into an empty hull or treated doctrine permission as a shot.
