# BM1 side-lane — repairCapable, Reman unlock, independence / civil war

**Status:** proposal for implementation; no engine changes made by this document.  
**Repository:** `Artemis2028/BM1-bakeoff`  
**Planning baseline:** `10c3a7e` on `main` (12 September 2026), after Phases 1–4 and additive `bm-ships/` (PR #15). No catalog wire.  
**Referee context:** Phase 4 engine §6 **Pass** on `7f926df`. This brief does **not** claim a new Referee Pass and is **not** roadmap Phase 5.  
**Companion:** `docs/side-lane-repair-reman-independence/BM1-SIDE-LANE-ENGINE-DEPENDENCIES.md` (hooks, risks, probe IDs).  
**Scoped by:** Tenth Mountain Trooper, 2026-09-12.  
**Tenth amend (docs, 2026-09-12):** hard gate 3 — breakaway doctrine/ROE **may diverge** from the parent; temperament axes may shift during civil war. Gates 1–2 unchanged.

Phases 1–4 already landed: political authority, two-mode ROE, holding zones/compliance, and incident ledger / FLASH. Additive `bm-ships/` is on `main` as a ships-only pack. This brief may reference that pack. It must not require wiring the full 212-hull roster into gameplay.

This is a **side-lane** after Phase 4 / alongside idle Phase 5 (convoy / persistent objectives). Three Flash-shaped repairs that the roadmap never numbered: service capability, a durable Reman access rule, and world independence / civil war.

## 1. The result we want

Three playable facts become true, each behind a hard gate:

1. **Repair is a service, not a dock.** The player can repair only at a `repairCapable` location. While that repair is actually running, repair-arms overlay the **player ship image** and stop when repair ends. Defense platforms never repair.
2. **Reman Warbird access is an unlock**, not a live Remus starbase instance. Destroying that base does not erase access forever. A recovery path exists (mission / alternate unlock / durable player flag).
3. **Worlds can break away.** A declaration of independence mints a **new political side** and can start a civil war. Foreign concessions stay foreign. Doctrine and ROE for the breakaway are **assigned explicitly** and **may (and should be able to) differ** from the parent — never a silent clone. During the war, temperament axes may shift and inform later doctrine/ROE. Phase 1 authority Passes stay closed.

**Exit condition (this side-lane):** the three hard gates in §2 can be scored from the brief, then (only after Tenth scopes an engine lane) exercised by S7 probes without reopening Phase 1–4 Passes or starting Phase 5.

**Proposed first-release decisions:**

| Question | Proposed answer |
| --- | --- |
| Is this Phase 5? | **No.** Phase 5 remains convoy / persistent overdue-asset loops. This is a side-lane. |
| First engine slice, if scoped later? | Prefer three thin gates over one content dump: `repairCapable` + overlay; a durable Reman access flag + recovery hook; independence that mints a side and writes inheritance explicitly. |
| Wire the 212-hull `bm-ships/` catalog? | **No**, unless a later Reman unlock slice truly needs that one hull. Prefer a minimal access rule. |
| Invent repair costs, civil-war timers, or prestige numbers? | **No.** Difficulty knobs may come later. |
| Key Reman access to `Reman Starbase` remaining alive? | **No.** Access is a rule / unlock. The station is one vendor, not the key. |
| Copy parent doctrine/ROE onto a breakaway? | **No silent copy.** Divergence is **allowed and expected**. Number 2’s §5.3 table says which fields may differ at birth and which may mutate in war. |

These are recommendations for this side-lane, not new decisions attributed to the user. Locked gates take precedence.

## 2. Locked constraints (do not reopen)

The bake-off team locked these on 2026-09-12. Implementation and probes must treat them as **hard gates**. Referee / One score this brief against these three before any engine PR.

### Hard gate 1 — Repair arms / service capability

> Overlay repair-arms UI on the **player ship image only** when the player is **repairing** at a **`repairCapable`** location.

`repairCapable` is **true** for:

- planets
- main / starbase stations
- shipyard stations (including heavy shipyards)
- maintenance stations (landed type **#83**, `Maintenance Station`)

`repairCapable` is **false** for:

- **defense platforms** (landed types **#86** `Defense Platform` and **#87** `Advanced Defense Platform`; any `sizeClass: 'defense-platform'`)
- every other station class not listed above (trade, habitat, lab, university, wormhole, comms, research, commerce, civilian, and similar) unless a later scoped brief adds them

**Docking permission ≠ repair service.** Phase 3 already separates the two: `visitorDeniedServices` / `getCheckpointDockRefusal` can refuse docking and services at the **authority’s own** installations while a checkpoint order is pending or noncompliant. That administrative gate remains. Clearing it does **not** make a defense platform repair-capable. Failing it does **not** make a planet un-repairable in the type table — it only withholds service this visit.

Difficulty knobs (cost, duration, animation rate) may come later. **Do not invent balance numbers** in this brief or the first engine slice.

The overlay is a **player-ship effect**, not a station hull, not a workbee, and not `stationconstructing.gif`. Arms appear only while repairing and stop when repair ends.

### Hard gate 2 — Reman Warbird access

> Reman Warbird access must be an **access rule / unlock**, **not** keyed to a live Remus starbase station instance. Destroying that base must **not** erase Reman Warbird access forever.

Prefer a recovery path: mission, alternate unlock, and/or a durable player flag that survives station destruction, scene unload, and save/load.

Pack references (looked up; **do not invent hull IDs**):

| Source | Fact |
| --- | --- |
| `bm-ships/ships.json` | Hull **id `53`**, key **`bm-ship:53`**, name **Reman Warbird**. `availabilityRegion: "secret-remus"`. `shipyardEligible: false`. `purchaseTier: "strategic"`. Pack `faction: "romulan"` is content affiliation, not a Phase 1 side. |
| `bm-ships/ships.json` `accessNote` | “Remus secret access is the imported baseline. A recoverable mission/blueprint access route is required later; this content pack does not implement that quest.” |
| `bm-ships/catalog.mjs` `regionAllows` | `secret-remus` is true only for `role === 'purchase' && systemName === 'remus' && vendor === 'remus-secret'`. That is a **content availability rule**, not a live instance key. |
| `bm-ships/integration-rules.json` `missingFeatures` | Includes **`Reman access recovery mission`** and **`repair arms and service capability enforcement`**. |
| `bm-ships/README.md` | “The imported Reman Warbird access-recovery quest is not implemented here.” |
| Landed `data/stationData.json` | A station named **Reman Starbase** (`systemIndex` 29 / Remus) currently lists stock `shipIds: [53]`. That instance must **not** be the sole, irreplaceable unlock. |

Other pack hulls named Warbird (**Classic Warbird**, **Independent Warbird**, **Romulan Warbird**, **D'deridex Warbird**, **Norexan Warbird**) are **not** this unlock. Do not substitute them.

Doctrine culture `reman` (`docs/doctrine/…` “Reman communities”) is **not** a Reman empire and **must not** be used as the unlock key. Culture cannot grant fire permission (Phase 1 / doctrine lock, still closed).

First engine slice, if scoped: a **minimal Reman access rule** plus a recovery hook. Do **not** require catalog wiring of the full 212 roster.

### Hard gate 3 — World independence / civil war

> Restore the BM1 Flash-style ability for worlds to **declare independence** and start a **civil war**. Breakaways receive a **new political side**.

This must **not** silently rewrite Phase 1 ownership or ROE for foreign concessions.

**Doctrine / ROE inheritance for breakaway polities must be explicit** (Number 2 owns that wording in §5). Silent copy of the parent profile, engagement modes, or player Security ROE is a fail.

Tenth amend (docs, 12 September 2026) — **locked decision on hard gate 3**, not a change to gates 1–2:

- Breakaway polities **may and should be able to have different doctrine/ROE than the parent side**. Inheritance is still **explicit** (never a silent copy). The default expectation is **divergence is allowed**, not a forced parent clone.
- During a civil war, the breakaway’s (and possibly the parent’s) doctrine/ROE **may change depending on the war**. They are **not frozen at declaration** forever.
- Temperament / stance axes (use these labels; exact enum names can be proposed): **peaceful**, **warlike**, **xenophobic**, **xenophilic**. These are polity temperament axes that can shift with war events. They **inform** doctrine/ROE choices.
- Temperament shifts must **not** silently rewrite Phase 1 ownership, foreign concessions, or give culture fire permission.
- The two player Security ROE modes stay (`return-fire` / `defend`). Access remains a permission, not a ceasefire.

Must **not** reopen Phase 1 authority Passes. Preserve, without reopening:

- Authority is a political side (`isSystemControlled` / `playerHoldsSystem`), **not** a flown flag. `flagShareGrantsSystemControl()` remains false.
- Station ownership (`getStationOwner`) is distinct from system control.
- Foreign concessions and private installations **stay foreign** unless transferred by existing Phase 1 rules (`isStationTransferableFromHolder` / `retainStationOwnerOnControlChange`).
- Independent worlds and ships are distinct identities. Shared `neutral` is not an alliance, command, or intelligence network.
- Custom polity IDs remain intact. Unknown origin remains unknown.
- Culture cannot grant fire permission.
- Two ROE modes unchanged. Access is a permission, not a ceasefire.
- Phase 1 combat credit: only `player` / `playerEscort` final hits reward or blame.

### Process locks (implementation locks, not a change to gates 1–3)

- **Proposal first.** Do not implement from this text until Tenth scopes the engine lane after a brief Pass.
- **Blind bake-off.** Implement from `docs/` only. Do not crib `Artemis2028/BM1-remastered-work` guided PR.
- **Not Phase 5.** Do not take convoy / `asset_overdue` / multi-jump persistent objectives in this lane.
- **`bm-ships/` is additive and already merged.** Reference it. Do not treat this brief as permission to wire the catalog.

## 3. Repair arms and `repairCapable`

**Lane owner (wording):** Number Four.

### 3.1 What `repairCapable` is

A location capability bit. It is not docking range, not checkpoint clearance, not “the Repair button exists in the menu HTML,” and not hostility.

```js
isRepairCapableLocation({ kind, station })
// kind: 'planet' | 'station'
// station: live station record or null
// → boolean
```

Proposed resolution (names can change in review):

| Location | Result | Why |
| --- | --- | --- |
| Planet (docked at world, `dockedStationId == null`) | `true` | Hard gate: planets repair. |
| Station `sizeClass === 'starbase'` (main / starbase) | `true` | Hard gate: main stations repair. |
| Station `sizeClass === 'shipyard'` or `'heavy-shipyard'` | `true` | Hard gate: shipyards repair. |
| Station type **83** / name Maintenance Station | `true` | Hard gate: maintenance repairs. Pack review `a-74`. |
| Station type **86** or **87**, or `sizeClass === 'defense-platform'` | `false` | Hard gate: defense platforms cannot repair. Pack review `a-78`, `a-79`, `a-231`. |
| Any other station class | `false` | Not in the locked true-list. Do not invent a lab/trade/habitat exception. |
| Destroyed, incomplete, or missing station | `false` | No live facility. |
| Not docked | `false` | No service in open space. |

Name-matching (`name.includes('defense platform')`) is a landmine: prefer type id + `sizeClass`, with name only as a fallback documented in the engine PR. Do not treat “starbase” in a flavor string as capability if the type is a platform.

### 3.2 Docking vs service (Phase 3 already noted this)

Phase 3 engine review required a concrete access consequence: pending or noncompliant visitors are refused **docking and services** at the authority’s own installations. Concessions and private stations inside the zone remain unaffected (Phase 1 ownership).

Two independent questions:

| Question | Owner | Example |
| --- | --- | --- |
| May this visitor dock / open the menu here? | Phase 3 access (`visitorDeniedServices`, `getCheckpointDockRefusal`) | Refused at Vulcan government planet; Ferengi concession still docks. |
| Does this location offer repair? | This side-lane (`repairCapable`) | Cleared at a defense platform: dock may succeed; Repair must not. |

Both must be true to start a repair. Either false is a refuse with a sayable reason:

- `Clearance required` / checkpoint reason — access, not capability.
- `This facility cannot repair ships` — capability, not access.

Do not reuse the checkpoint reason to explain a platform. Do not reuse the platform reason to explain a refusal at a capable planet.

### 3.3 Overlay

Pack review `a-231` (context only; `bm-ships/` does **not** ship station/repair art):

> `repairarms.gif` is drawn over the player ship during active repairs. It is a repair overlay, not a station, ship hull or construction scaffold. … The arms appear only while repairing and stop when repair ends. … It contains one frame; repair animation must be driven by the game.

Rules:

1. Draw over the **player** sprite (`getShipSprite(state.playership)` path), after the hull, not over NPC ships or stations.
2. Visible only while a repair is **in progress** at a `repairCapable` location that also passed the Phase 3 service gate.
3. Hidden on cancel, completion, undock, scene unload, death, or location becoming non-capable.
4. Do not use workbee / scaffold / construction-beam art as a substitute. Those are construction effects, not weapons and not repair arms (`a-73`, `a-232`, `a-233`).
5. **Asset presence is a probe, not a license to invent.** `repairarms.gif` is named in pack review notes and is **absent** from this repo’s `bm-ships/` (ships-only; station/repair decisions retained for context). If the overlay file is not in-tree when the engine lane is scoped, fail setup or skip the visual with an explicit “overlay asset missing” probe — do not borrow construction GIFs or draw a fake station.

### 3.4 Current engine (do not treat as the spec)

At `10c3a7e`, `repairHull()` requires only `requireDocked()`. Planet and station menus both render a Repair button. `requireDocked()` does not test capability. That is the gap this gate closes. Costs currently live in `repairHull` (hull 2L / %, shields 1L / %). **Leave those numbers alone** unless a later brief sets knobs. This proposal does not bless or retune them.

### 3.5 Non-goals for repair

- Boarding / capture repair, fleet-wide auto-repair, away-team XP.
- Station construction / workbees (pack `missingFeatures`: `station construction/workbees`).
- Inventing latinum discounts beyond the existing Maintenance Station flavor text.
- Showing arms on the station, on escorts, or whenever the player is merely docked.

## 4. Reman Warbird access rule

**Lane owner (wording):** Number Four.

### 4.1 The bug this gate forbids

The landed Remus station **Reman Starbase** stocks hull `53`. A naive slice will write `allowed = stationExists && !station.destroyed && stock.includes(53)`. Destroying that instance then makes the Warbird unrecoverable. That fails the hard gate even if the journal says “secret project lost.”

Access must be a **player-durable rule**, for example:

```js
state.playerUnlocks = {
  version: 1,
  remanWarbird: {
    granted: false,
    source: null,      // 'remus-secret' | 'recovery-mission' | 'alternate' | …
    grantedAt: null,   // simulation clock, not performance.now()
  }
};
```

Exact field names can change. The contract cannot:

| Required | Forbidden |
| --- | --- |
| Persist beside other run unlocks / feats; survive save/load and `systemStates` wipe | Key grant solely to `station.id` of Reman Starbase |
| Remain `granted` after that station is destroyed, ruined, captured, or missing | Clear the flag in `destroyStation` because the vendor died |
| Offer a recovery path if the original vendor is gone or was never visited | “You should have bought it before shooting the base” as the only story |
| Consult pack hull **`bm-ship:53` / id 53** when a catalog is present | Invent a new Reman hull id; swap in Independent Warbird or a Romulan Warbird |
| Treat pack `regionAllows('secret-remus')` as a **content** check | Treat `regionAllows` as political control of Remus or as doctrine culture `reman` |

### 4.2 Minimal first slice (preferred)

Do **not** wire the 212-hull catalog into spawn, market, or traffic.

Enough for the gate:

1. A durable `remanWarbird` (or equivalent) unlock record.
2. An access predicate used by purchase / stock visibility **if and only if** that hull is offered: `hasRemanWarbirdAccess(state)`.
3. Reman Starbase may remain **one** grant source (visit + authored vendor `remus-secret`) without being the **only** source.
4. A recovery hook that can set the same flag: authored mission stub, alternate vendor, or explicit probe inject. Pack `missingFeatures` calls this **`Reman access recovery mission`**. This brief does not author the mission script.
5. Destruction of Reman Starbase leaves `granted === true` if it was already true, and still allows the recovery hook if it was false.

Pack helper note: `getPurchaseDecision` currently refuses `shipyardEligible === false` unless `specialVendor` matches. Hull 53 has **no** `specialVendor` field in `ships.json`. The engine access rule is therefore **not** “call `getPurchaseDecision` and ship it.” Number Four must say how the durable flag and the pack helper meet (wrapper, or engine-side check that does not require a fabricated `specialVendor`). **Probe placeholder S7.8** if the meeting point is still TBD at engine time.

### 4.3 Identity

| Identity | Rule |
| --- | --- |
| Hull | Pack id **53** / `bm-ship:53` only. Numeric `53` in landed `data/starship_manifest.json` / Reman Starbase stock is the same historical hull, not a second ship. |
| Vendor | Authored `remus-secret` is a **rule name**, not `station.id`. |
| World | Remus (`planetData` / `mapnames`) is the named secret-region world. Holding Remus is not automatically the unlock. Losing Remus is not automatically a revoke. |
| Culture | Doctrine `reman` stays a community culture. Not an empire. Not the unlock. |
| Side | Pack `faction: "romulan"` does not give the player Romulan command or Reman statehood. |

### 4.4 Player-facing reasons

- `Reman Warbird access is an unlock. This station is destroyed; your access remains.`
- `Reman Warbird locked. The Remus yard is gone — recovery is a mission / alternate unlock, not a deleted ship.`
- `Defense platform: this facility cannot repair ships.` (repair, not Reman — keep the sentences unmixed)

If the UI cannot say why access survived a destroyed base, the rule is not ready.

## 5. World independence and civil war

**Lane owner (doctrine / ROE inheritance):** Number 2.  
**Engine/content wording for the mint-a-side event:** Number Four, without silently filling Number 2’s table.

### 5.1 The result

A world (or its government) can **declare independence** from its current holder / parent polity. That event:

1. Mints a **new political `sideId`** for the breakaway (a real side, not a flag swap, not a culture rename, not `neutral` reuse).
2. May start a **civil war**: parent and breakaway become opposed by an **explicit** relation write, not by copying the parent’s entire friend/hostile lists.
3. Leaves foreign concessions and private installations on their existing owners unless Phase 1 transfer rules would already move them.
4. Assigns doctrine profile, engagement modes, temperament, and (if the player is involved) Security ROE by the **explicit inheritance table in §5.3**. Silence is a fail. **Divergence from the parent is allowed and expected.**
5. May later **mutate** breakaway (and possibly parent) temperament / doctrine / ROE as the war develops — not a snapshot frozen at declaration.

This is the Flash-shaped political break. It is **not** Phase 5 convoy play, **not** a new alliance system, and **not** permission to treat doctrine culture as a state.

### 5.2 What must not happen (Phase 1 stays closed)

| Tempting shortcut | Why it fails the gate |
| --- | --- |
| Set the world’s `systemFaction` to `neutral` and call it independence | Shared `neutral` is not a side, alliance, or command (Phase 1). |
| Reuse the parent `sideId` and flip a `independent: true` bit | Breakaway must be a **new** political side. |
| Copy parent `doctrineProfile`, `engagementModes`, or `evaluateFire` allowlists in silence | Inheritance must be explicit (§5.3). Divergence is allowed; a silent clone is the fail. |
| Freeze breakaway doctrine/ROE at declaration with no war-mutation path | Tenth lock: temperament / doctrine / ROE **may change depending on the war**. |
| Apply the player’s empire-default ROE to the breakaway NPC polity | Player Security belongs to the player’s side. |
| On declare, retitle every station in-system to the new side | Ownership ≠ control. Concessions stay foreign. |
| Use flown flag (player or parent) as the new side | Authority is a political side, not a flag. |
| Equate Reman culture or any local culture with the new empire | Culture cannot grant fire permission; Reman culture is not an empire. |
| Treat `custom:${gov}` collapse of two worlds as one command | Several worlds sharing an old `governmentId` must not gain a telepathic authority (doctrine design). Each breakaway mint is its own side unless an authored join says otherwise. |

`resolveBaseSystemFaction` already emits `custom:${gov}` for unmapped governments. Independence may **mint** a new custom / breakaway key. It must not silently rewrite existing custom IDs into the parent or into `neutral`.

### 5.3 Explicit doctrine / ROE inheritance (Number 2)

This section is the scoring surface for Number 2. Tenth’s 2026-09-12 amend requires the table to answer three questions:

1. Which fields **may diverge at birth**?
2. Which fields **may mutate during civil war**?
3. How do temperament axes map to doctrine profile / ROE **without reopening Phase 1 Passes**?

Fields not listed default to **do not copy** and **do not mutate**. If a later engine PR needs another field, add a row here first. An engine PR that copies or freezes a field “for convenience” without a row fails this gate.

#### 5.3.1 Temperament axes (locked labels)

Use Tenth’s labels. Exact enum / storage names can be proposed (`temperament.peace` vs four flags, etc.):

| Axis pair (proposed) | Pole A | Pole B |
| --- | --- | --- |
| Conflict stance | **peaceful** | **warlike** |
| Outsider stance | **xenophilic** | **xenophobic** |

These are **polity** temperament axes on the **side**, not on a culture and not on a flown flag. They **inform** which doctrine profile / engagement posture is eligible. They are not themselves fire permission, ownership, or access.

#### 5.3.2 Birth: which fields may diverge

**Default expectation: divergence is allowed.** A breakaway that is a clone of the parent because nobody assigned anything is a fail, unless a §5.3 row explicitly says “same as parent for this named field.”

| Field | At birth (first slice) | May diverge from parent? | Silent parent clone? |
| --- | --- | --- | --- |
| `sideId` | **Mint new** (`breakaway:<origin>:<epoch>` or `custom:<new>`). Never parent `sideId`, never culture id, never flown flag | **Must** (new side) | **Forbidden** |
| Temperament (`peaceful` / `warlike` / `xenophobic` / `xenophilic`) | Explicit authored or probe-assigned starting poles. May match parent **only if written** | **Yes — expected** | **Forbidden** |
| Doctrine `profileId` | Explicit authored breakaway profile **informed by** starting temperament, **or** no pack profile / deny assignment / safe fallback | **Yes — expected** | **Forbidden** |
| `engagementModes` / fire allowlists | From the **assigned** profile only; else none | **Yes** (follows assigned profile) | **Forbidden** |
| `evaluateReact` interests | From the assigned profile only | **Yes** | **Forbidden** — do not feed parent “defend the empire” interests by copy |
| Declared relations (`friendly` / `hostile`) | Phase 1 empty-list independent contract, **plus** an explicit parent↔breakaway `hostile` write **if** civil war is active | **Yes** (empty + war write ≠ parent lists) | **Forbidden** to clone the parent’s friend lists |
| Culture id on the world | **Retain** the world’s culture if it already has one | N/A (not inherited from parent command) | N/A — culture ≠ side |
| Player Security ROE / access / alerts | Unchanged on the **player’s** side. Breakaway NPC polity does **not** receive them | N/A for NPC breakaway | **Forbidden** to install player ROE on the NPC side |
| Phase 3 access class of breakaway ships | Per Phase 3: own-side exempt on **this** side; custom polity visiting a foreign checkpoint is `other` unless they broadcast `independent` | Classification follows the new side, not the parent | **No** silent reclass |
| Station `owner` / `ownerKind` / `privateInstallation` | Unchanged except Phase 1 transferable-from-holder assets of the **previous holder** | **No** (ownership is not doctrine) | Only via existing Phase 1 transfer helpers |
| System control | Contested or transferred by independence / civil-war resolution — **not** by flag share | Control ≠ temperament | N/A |
| `fleetId` / `playerEscort` / combat credit | Unchanged | **No** | **Forbidden** to conscript parent fleets by renaming side |
| Incident ledger / standing | May **describe** the declaration later; no second standing religion | **No** silent standing rewrite | Phase 4 tokens stay on combat credit |

#### 5.3.3 Civil war: which fields may mutate

Tenth lock: doctrine/ROE are **not frozen at declaration**. The breakaway’s (and **possibly** the parent’s) temperament, and the doctrine/ROE those axes inform, **may change depending on the war**.

Mutations are **named writes** (a war event → temperament change → explicit rematch of eligible profile / posture). They are not a silent tick, not a culture grant, and not a Phase 1 ownership rewrite.

| Field | May mutate during civil war? | Who | Notes |
| --- | --- | --- | --- |
| Temperament poles | **Yes** | Breakaway **should**; parent **may** | Shift along the named axes only. Which events move which pole is Q12. |
| Doctrine `profileId` | **Yes**, if an explicit map says the new temperament makes another profile eligible | Same side as the temperament write | Rematch; do not `Object.assign` from the other belligerent. |
| `engagementModes` / fire allowlists | **Yes**, only as a consequence of the rematched profile | Same | Culture still cannot grant fire permission. |
| `evaluateReact` interests | **Yes**, from the rematched profile only | Same | |
| Declared relations | **Yes** only as explicit war/peace writes (parent↔breakaway hostility, later treaty) | Either | Still do not clone the other side’s full lists. |
| Player Security ROE modes | **No new modes** | Player side only | Still only `return-fire` / `defend`. A player who is a belligerent may **change** their stored mode through existing Phase 2 UI; the war does not invent a third mode or copy NPC temperament onto the player. |
| Access values | Policy remains permission, not ceasefire | Player / authored foreign | Temperament must not reinterpret access as ROE or as fire. |
| `sideId` | **No** | — | Do not recycle or merge sides mid-war. |
| Culture id | **No** (culture is not a war stance) | — | Reman communities stay culture. |
| Station ownership / concessions | **No** via temperament | — | Phase 1 transfer helpers only. |
| System control | Only via existing capture / reclaim / authored resolution | — | Not a temperament side-effect. |
| Combat credit / `fleetId` | **No** | — | |

#### 5.3.4 How temperament maps to doctrine / ROE (without reopening Phase 1)

Proposed mapping for Number 2 to score. This is a **recommendation**, not invented numeric thresholds.

```text
temperament poles
  → eligibleDoctrineProfiles(side)     // explicit allowlist, may be empty → deny / safe fallback
    → assigned profileId
      → engagementModes / evaluateReact from that profile only
  → does not touch getStationOwner, concessions, sideId, culture fire, or player ROE catalog
```

| Temperament input | May inform | Must not do |
| --- | --- | --- |
| **peaceful** | Prefer profiles / postures that record, negotiate, or defer; do not add war engagement modes the profile lacks | Must not erase parent↔breakaway hostility already written; must not grant immunity; must not re-own concessions |
| **warlike** | Prefer profiles that already allow military interests (`investigate` / defense-capable modes the pack already has for that profile) | Must not inject `engagement_authorized`, `attackId`, `protect-all`, or a new player ROE mode |
| **xenophilic** | Prefer interests that treat outsiders as `other` / trade / negotiate rather than closed | Must not turn access into a ceasefire; must not share command with foreigners |
| **xenophobic** | Prefer stricter authored access **values** on **that side’s** checkpoints (if it has one) or pack interests that watch borders | Must not enforce `unknown` identity; must not rewrite foreign concession owners; must not grant culture fire |

**Phase 1 / Phase 2 stays closed under every pole:**

- Authority is still a political side, not a flag.
- Station ownership ≠ system control.
- Foreign concessions stay foreign unless Phase 1 transfer applies.
- Culture cannot grant fire permission — a xenophobic Reman **culture** is still not an empire and still not a weapons grant.
- Player Security still has exactly two ROE modes. Access is still a permission, not a ceasefire.
- Temperament is not `sideId` and is not `cultureId`.

**Civil war** in this slice means: parent and breakaway are explicitly opposed; temperament may shift and rematch doctrine/ROE on the sides that the map names; existing attribution still decides weapons; no new `protect-all`; no free spawned invasion fleet required to “make it look like Flash.” If the engine later needs spawned civil-war traffic, that is a scoped follow-up, not a silent parent-doctrine copy.

Number 2 may amend rows and the mapping in review. The lock Number 2 cannot drop: **explicit writes, divergence allowed, war may mutate, four axes named, Phase 1 closed.**

### 5.4 Ownership during the break

Use the Phase 1 helpers; do not reimplement them:

- `getStationOwner` — player / private / faction.
- `isStationTransferableFromHolder` / `retainStationOwnerOnControlChange` — concessions and private yards stay put unless already eligible.
- `playerHoldsSystem` / `isSystemControlled` — player authority is political control, not flag.
- `noteAuthoritySide` / epoch bump — jurisdiction-bound Phase 3 access incidents already resolve `authority_changed` (Phase 4). Independence that changes the holder must go through the same epoch path, not a back door.

A Ferengi concession in a world that breaks away from (e.g.) Romulan control remains Ferengi unless Phase 1 would transfer it. Player policy cannot commandeer it. Same-flag foreigners remain foreigners.

### 5.5 What this brief does not invent

Flash trigger chances, army sizes, day-counts, which named worlds secede first, whether the **player** can press “Declare independence” on a holding they already control, and which war events move which temperament pole are **open questions** (§9). The hard gate is the **shape**: new side; explicit inheritance; **divergence allowed**; war may mutate temperament / informed doctrine/ROE; concessions untouched; Phase 1 closed.

A first engine slice can be as small as: one authored or probe-injected declaration on one world, mint side, assign a temperament **different from the parent**, write the §5.3 table, start explicit parent hostility, then inject one war event that shifts a pole and rematches profile — prove concessions and player ROE catalog unchanged. Galaxy-wide AI secession is not required to close the gate.

## 6. Acceptance exercises (S7)

Keep all existing Phase 1 / S4 / S5 / S6 / doctrine gates green. Add S7 fixtures that fail setup if a required planet, station type, hull id, or unlock record is missing. Classification-only asserts are insufficient for overlay, unlock persistence, and inheritance.

| Case | Required exercise and result |
| --- | --- |
| **S7.1** Planets / main / shipyard / maintenance repair | Dock at a planet, a `starbase`, a shipyard (or heavy shipyard), and Maintenance Station **#83**. Each is `repairCapable === true`. Starting repair is allowed if Phase 3 services are also allowed. |
| **S7.2** Defense platforms cannot repair | Dock (if Phase 3 allows) at type **#86** and **#87**. `repairCapable === false`. Repair button absent or disabled. `repairHull` / equivalent refuses with a capability reason. **No overlay.** |
| **S7.3** Docking ≠ repair | At a `repairCapable` authority planet, a pending or noncompliant Phase 3 order still denies services (`visitorDeniedServices`). At a cleared defense platform, dock may succeed and repair still fails. Reasons must not be swapped. |
| **S7.4** Overlay only while repairing the player | At a capable location, overlay is absent when docked-but-not-repairing, present during an in-progress repair on the **player** sprite, gone on complete/cancel/undock. No overlay on NPCs, stations, workbees, or scaffolds. If overlay art is missing in-tree, the probe records **asset-missing** rather than drawing construction art. |
| **S7.5** No invented balance numbers | First slice does not change `repairHull` latinum rates unless a later scoped knob brief exists. Assert current rates unchanged **or** skip cost asserts and document “knobs deferred.” |
| **S7.6** Reman access is a durable flag | Grant `hasRemanWarbirdAccess` without requiring the Reman Starbase instance to be the stored key. Save, wipe `systemStates`, reload: flag identical. |
| **S7.7** Destroying Reman Starbase does not erase access | With access already granted, `destroyStation` on Reman Starbase (or equivalent ruin/missing). Flag remains `granted`. Purchase/unlock predicate still true. No “forever lost” journal that contradicts the flag. |
| **S7.8** Recovery path exists | With access **false** and the Reman Starbase destroyed or absent, a recovery hook (mission stub, alternate unlock, or probe inject) can set the same flag. **TBD probe** if Number Four has not named the meeting point with pack `getPurchaseDecision` / missing `specialVendor`. |
| **S7.9** No full catalog wire | Engine slice must not require `loadShipCatalog()` for ordinary traffic/markets. If hull 53 is offered, it is a **minimal** Reman rule. Other `bm-ships/` ids stay unwired. |
| **S7.10** Hull identity | Any candidate consults pack **id 53 / `bm-ship:53`**. Independent Warbird and Romulan Warbird variants must not satisfy the unlock. No invented ids. |
| **S7.11** Independence mints a new side | Declaration produces a `sideId` distinct from parent, from flown flag, from culture id, and from shared `neutral`. |
| **S7.12** Foreign concessions unchanged | Fixture a private / foreign concession in the breakaway system. After declare + civil-war start, `getStationOwner` is unchanged unless Phase 1 transfer would already apply. Player cannot command it. |
| **S7.13** Doctrine / ROE inheritance is explicit **and may diverge** | After mint, breakaway `doctrineProfile` / `engagementModes` / temperament are **explicitly assigned**. They **may differ** from the parent (expected). Fail if they match the parent **only because** a silent copy ran (no §5.3 row). Player Security ROE is not installed on an NPC breakaway. Number 2 scores this row. |
| **S7.14** Phase 1 authority still holds | After independence **and** after a temperament shift: `isSystemControlled` is still political control; flag share still does not grant control; station ownership ≠ system control; `flagShareGrantsSystemControl() === false`. Do not reopen Phase 1 Passes. |
| **S7.15** Parent lists are not cloned | Breakaway `friendly` / `hostile` are empty-list independent **plus** the explicit civil-war opposition if active. Parent’s other friends/enemies are not copied. |
| **S7.16** Culture is not an empire / unlock | Doctrine culture `reman` does not grant Reman Warbird access and does not become the breakaway `sideId`. Culture still cannot grant fire permission — including after a **xenophobic** or **warlike** temperament write. |
| **S7.17** War-driven temperament may mutate doctrine/ROE | After declaration, inject a civil-war event. Breakaway temperament poles (`peaceful` / `warlike` / `xenophobic` / `xenophilic`) **may change**; parent poles **may** change. Doctrine profile / informed posture follow the explicit §5.3.4 map. After the shift: concession owners unchanged; no `engagement_authorized` injection; player Security still only `return-fire` / `defend`; access is still not a ceasefire; `mayAutoEngage` unchanged unless Phase 2 evidence already permits. |
| **S7.18** Not frozen at declaration | Snapshot temperament + `profileId` at mint. After S7.17’s war write they are allowed to differ from that snapshot. A design that cannot change them without a new `sideId` fails this lock. |

Each case may contain multiple assertions. Do not promise a final probe count before S7 is written. Number Three owns the probe gate **after** engine, not this brief.

## 7. Non-goals

This side-lane will not:

- Implement Phase 5 convoy / `asset_overdue` campaign loops, remote objectives, or deep-space POIs.
- Wire the full `bm-ships/` 212-hull catalog into spawn, markets, or traffic.
- Invent hull IDs, repair prices, civil-war timers, or prestige thresholds.
- Key Reman access to a live Reman Starbase instance, or delete access when that instance dies.
- Treat Independent Warbird or other Warbird hulls as the Reman unlock.
- Equate doctrine culture `reman` with a Reman empire or with the unlock.
- Silently copy parent doctrine, engagement modes, temperament, or player ROE onto a breakaway — **or** force a parent clone when divergence was not explicitly written.
- Freeze breakaway (or parent) doctrine/ROE at declaration with no war-mutation path for the named temperament axes.
- Reopen Phase 1 authority Passes (side vs flag; ownership vs control; concession transfer rules), including via temperament.
- Add a third player Security ROE mode, or treat access as a ceasefire, because a polity is **warlike** or **xenophobic**.
- Turn Phase 3 docking denial into `repairCapable`, or `repairCapable` into a fire / standing gate.
- Draw repair arms on stations, NPCs, or construction scaffolds; or use workbee art as arms.
- Enable `protect-all`, boarding combat, warning shots as damage, or new alliances (including Breen–Dominion covert pact).
- Build sensors/cloak (Phase 6), fleet hold-outside-boundary (Phase 7), embargo economy (Phase 8), or weapon-table changes (Phase 9).
- Touch `Artemis2028/BM1-remastered-work`.
- Claim a Referee Pass in `docs/BAKEOFF-STATUS.md`.

## 8. Implementation sequence and handoff

1. **Brief Pass.** Referee / One score §2 hard gates. Number Four scores §3–§4 wording. Number 2 scores §5.3. Do not open an engine PR on this document alone.
2. **Tenth scopes the engine lane** (may split the three gates). Blind implement from `docs/` only.
3. **Suggested order if scoped together:** `repairCapable` + overlay (smallest; existing `repairHull` / menu / player draw). Then durable Reman flag + destroy-base + recovery hook (no catalog wire). Then independence mint + §5.3 birth writes (divergent temperament) + concession fixture + one war-mutation write. Prove S7.1–S7.5 before overlay polish; S7.6–S7.10 before any Reman market UI; S7.11–S7.18 before civil-war flavor.
4. **Number Three** adds/runs S7 after engine. Keep Phase 1 / S4 / S5 / S6 green.
5. Changelog / status Pass wait on Referee after review. This proposal PR may note that the brief is open; it must not write a Pass.

If one model implements a later slice, reserve a separate review pass.

## 9. Open questions

Mark these clearly. They do **not** weaken the hard gates.

| ID | Question | Default if engine is scoped before an answer |
| --- | --- | --- |
| Q1 | Which worlds may declare independence (player holdings only, NPC empires, occupied cultures)? | One authored or probe-injected world is enough to close the gate. |
| Q2 | Can the player declare on a world they already control, or only NPC secession? | Probe inject is enough; do not invent a UI mandate. |
| Q3 | How does civil war end (reconquest, treaty, timeout)? | Out of first slice. Hostility write + Phase 1 capture/reclaim remain. |
| Q4 | Does the new side persist after reconquest? | Side id remains in history; control follows Phase 1. Do not recycle `sideId`. |
| Q5 | Overlay asset path once engine is scoped (`repairarms.gif` is not in `bm-ships/`)? | S7.4 asset-missing path. Do not substitute construction art. |
| Q6 | How does the durable Reman flag meet pack `getPurchaseDecision` (hull 53 has no `specialVendor`)? | S7.8 placeholder. Do not fabricate a vendor field in the pack in the first slice unless Number Four’s engine brief says so. |
| Q7 | Recovery mission authorship (script, giver, reward)? | Hook + probe inject. Pack lists the missing feature; this brief does not write the quest. |
| Q8 | Should Phase 4 open an incident on declaration / civil war? | **No** in the first slice unless a later incident brief says so. Do not mint standing from the declare. |
| Q9 | Are trade / habitat / lab stations ever `repairCapable`? | **False** until a later brief adds them. |
| Q10 | Split into three engine PRs or one? | Tenth decides after Pass. Gates stay separable. |
| Q11 | Temperament storage: two bipolar axes vs four independent flags? Exact enum names? | Use the four locked labels. Engine may store two axes (`peaceful`↔`warlike`, `xenophilic`↔`xenophobic`) or four poles; say which in the engine PR. |
| Q12 | Which war events move which temperament pole (losses, occupation, atrocity, stalemate)? | One probe-injected write is enough to close S7.17. Do not invent chances. |
| Q13 | Does the parent always shift, or only when authored? | Parent **may** shift. First slice may mutate breakaway only, with parent mutation as an optional inject. |

## 10. Lanes

| Who | Owns | Scores |
| --- | --- | --- |
| **Number Four** | `repairCapable` gate wording (§3) and Reman access-rule wording (§4) — engine/content | Those two gates |
| **Number 2** | Breakaway doctrine / ROE inheritance (§5.3): birth divergence, war mutation, temperament → profile/ROE map | Silent-copy fail; forced-clone fail; frozen-at-declaration fail; Phase 1 still closed |
| **Number Three** | Probe gate **after** engine (S7 on `__BM1_PROBE__` / offline tests) | Not this brief |
| **Referee / One** | This brief vs the **three hard gates** in §2 | **Before** any engine PR |

## 11. Deferred work remains on the plan

Phase 5 should still take persistent overdue-asset / convoy loops. Phase 6 should make identification honest under cloak. Repair **difficulty knobs**, a authored Reman recovery mission, galaxy-wide secession AI, and catalog wiring of the 212-hull pack are later scopes.

Independence that later needs spawned civil-war fleets, treaties, or player-facing “Declare” UI can be a follow-up. It must still mint a new side, keep §5.3 explicit, **allow divergent doctrine/ROE**, and allow war-driven temperament shifts on the four named axes.

This side-lane is ready to score when a reader can mark Pass/Fail on: overlay-only-while-repairing-at-`repairCapable` (platforms false; dock ≠ repair); Reman unlock durable after the Remus base dies; breakaway new side with **explicit, divergable** inheritance, war-mutable temperament (`peaceful` / `warlike` / `xenophobic` / `xenophilic`), and Phase 1 concessions untouched.

## Sources and precedence

- Tenth Mountain Trooper scope, 2026-09-12 (this side-lane; three hard gates).
- Tenth Mountain Trooper amend, 2026-09-12 (PR #16): gate 3 — divergence allowed; war may mutate doctrine/ROE; temperament axes **peaceful** / **warlike** / **xenophobic** / **xenophilic**. Gates 1–2 unchanged.
- Pack missing features and Reman note: `bm-ships/integration-rules.json`, `bm-ships/README.md`, `bm-ships/ships.json` (hull 53 / `bm-ship:53`), `bm-ships/catalog.mjs` (`secret-remus`).
- Repair overlay / platform / maintenance identification: `bm-ships/review-decisions.json` (`a-231`, `a-74`, `a-78`, `a-79`, `a-73`). Context only; not shipped station art.
- Landed Remus vendor instance: `data/stationData.json` (Reman Starbase, stock `53`); station types in `data/station_manifest.json` (83 / 86 / 87).
- Phase 1 authority: `docs/revised-development-plan.md` §3; `src/phase1-authority.js`.
- Phase 3 docking ≠ hidden identity, concessions, independence broadcast: `docs/phase3/BM1-PHASE3-HOLDING-ZONES-AND-COMPLIANCE-PROPOSAL.md`; engine review docking/services note; `visitorDeniedServices` in `src/phase3-checkpoints.js`.
- Phase 4 process shape: `docs/phase4/BM1-PHASE4-INCIDENTS-ESCALATION-ALERTS-PROPOSAL.md`.
- Doctrine culture ≠ empire: `docs/doctrine/DESIGN-doctrine-v0.2.1.md` (Reman communities); pack profile `reman`.
- Bake-off process: `docs/BAKEOFF-STATUS.md` (this PR may note the brief is open; no Pass claimed).

Settled Phase 1–4 behavior and the three hard gates take precedence over older Flash memory, pack flavor text, and doctrine culture notes that could be misread as a Reman empire or as “destroy the secret yard, lose the ship.”
