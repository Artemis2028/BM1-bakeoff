# BM1 Bajoran Solar Sailor (ship brief — reclass from deferred utility)

**Status:** proposal for a **ship** classification; no engine changes made by this document.  
**Repository:** `Artemis2028/BM1-bakeoff`  
**Planning baseline:** `e92db623283b0aa6ef6897e6d787f7d51bbc5ba3` on `main` (24 September 2026), after docs hygiene #69.  
**This is a Bajoran Solar Sailor ship brief.** Flash name **“Bajoran Sail”** is reclassified as a **ship** / hull catalog entry (Bajoran Solar Sailor). It is not a combat/device slot utility, not cargo, and not a flags/passes credential. Ledger #48/#49 gate 5 / §6.1 treated that Flash row as an explicitly deferred **utility**. Tenth Mountain Trooper ruled that call **stale**. This document **supersedes §6.1 for Sail only**. It does **not** reopen the #48/#49 gates, does **not** rewrite the ledger, and does **not** claim a Referee Pass.  
**Referee context:** Phase 4 engine §6 **Pass** on `7f926df`. EW #33 / #35 / #37 / #42 / #43 / #44 / #45, boarding #38 / #39, Phase 10 Dominion-first #40 / #41, flags #46 / #47, ledger #48 / #49, empty-armable #50 / #51, construction #52 / #53, HTML #54 / #55, economy #56 / #57, standing #58 / #59, dockClear #60 / #61, hygiene #62, alertsActive #63 / #64, away-team XP #65 / #66, Phase 10 roster #67 / #68, and hygiene #69 stay **locked**. Phase 10 S18.18 stays **unamended** unless Tenth later scopes a reopen.  
**Companion:** `docs/bajoran-solar-sailor/BM1-BAJORAN-SOLAR-SAILOR-ENGINE-DEPENDENCIES.md` (hooks, risks, later S32 thin-catalog sketch).  
**Scoped by:** Tenth Mountain Trooper, 2026-09-24 — proposal + deps first; room scores the hard gates **before** any engine. Room locked **3a**. Room-locked hard gates (ship not utility; begins unarmed; knowledge/catalog first — no playable unlock / no `rosterPlayable` gift; never gift fire; do-not-reopen #33–#69 except the Sail reclass note; no third ROE; blind — class + empty-arms only; named outs) are **in** this one scoreable brief.

Phases 1–10 and the later subscribe packages already landed, including the weapon/device source ledger (PR #49) and the Phase 10 roster catalog (PR #68). Ledger §6.1 parked Flash **Bajoran Sail** (price 5000, family Utility) as an **explicitly deferred utility**: no weapon id, not cargo, not `utilityBook`, and a candidate for a later slot-utility or hull-module brief. That deferral answered GUIDED §1’s “classify or explicitly defer — do not silently cargo-merge” rule by choosing **defer as a utility**. Room lock **3a** replaces that choice for **Sail only**: the Flash label names a **hull**, the **Bajoran Solar Sailor**.

A coordinator-only remastered-work product dig (this tip stays **blind**) confirmed the product shape: Bajoran faction, shuttle-class sail transport, begins **unarmed**, fragile freighter role. That dig is **class + empty-arms posture** only. It is not permission to copy remastered hull numbers, costs, art paths, or id **345** (alias 23→345) as live locks. Bake-off may choose its own ids and magnitudes as **injectable / TBD**.

Content import #25 already placed a pack row with this **name** on `bm-ships/ships.json` (Bajoran faction, shuttle class, empty default slots, `armedByDefault: false`). That row is **pre-existing content**, not a lock this brief creates. This PR does **not** edit `bm-ships/`, does **not** freeze that row’s id, cost, art, or stat magnitudes, and does **not** add a playable unlock.

This is **one** docs-classification brief: publish a **scoreable contract** that Bajoran Solar Sailor (Flash “Bajoran Sail”) is a **ship**, begins **unarmed**, and is known first as **catalog / knowledge**. A catalog row is not a firing solution, not `engagement_authorized`, not a third ROE, and not `rosterPlayable: true`. It is not a remastered `git am`, not a combat fit, not a Warp Core decision, and not a ledger reopen.

**This PR ships proposal + engine-deps only.** A later thin **subscribe catalog** (S32), if Tenth scopes it after a brief score, is the natural later deliverable. This brief does **not** ship that module and does **not** edit `src/`.

## 1. The result we want

A later writer can treat **Bajoran Solar Sailor** the way the roster brief treated a parked catalog gap: a **named hull classification**, **empty arms**, and **no new fire / unlock / ROE religion**. Flash “Bajoran Sail” stops being a deferred slot utility. Warp Core stays a separate deferred utility. `state.dominionBook.rosterPlayable` stays false. S18.18 stays green **without amendment**.

**Exit condition:** the eight hard gates in §2 are scoreable; Sail is a ship in the scoreable contract; Warp Core remains deferred; no gifted fire; no playable unlock; #33–#69 stay closed except the one-line Sail reclass note on the ledger docs.

**Proposed first-release decisions:**

| Question | Proposed answer |
| --- | --- |
| What is the first playable slice? | **Docs-only** scoreable contract under `docs/bajoran-solar-sailor/`. **This PR does not ship engine.** A later thin subscribe catalog (S32), **if** Tenth scopes it after a brief score, records §3. Name can change (`state.solarSailorBook`). |
| Is a thin subscribe catalog the natural later deliverable? | **Yes.** Analog: `src/phase10-roster.js` (sibling catalog, no campaign rewrite). S32 is **classification**, not a slot-utility item, not a cargo pod, and not a new purchase/spawn unlock. |
| What is the ship? | **Bajoran Solar Sailor.** Flash source name **“Bajoran Sail”** (family label Utility, price **5000** as **source, not a lock**). Class: **Bajoran** faction, **shuttle**-class **sail transport**, **fragile freighter** role. |
| Ship, utility, cargo, or credential? | **Ship / hull catalog entry.** Not a combat/device slot utility. Not cargo. Not `utilityBook`. |
| How does it begin? | **Unarmed.** Empty weapon slots. Do **not** invent a combat fit. |
| May this package unlock it for play or flip `rosterPlayable`? | **No.** Knowledge / catalog first. No playable unlock. No `rosterPlayable` gift. S18.18 stays. |
| May a catalog row gift `firingSolution`, culture fire, or `engagement_authorized`? | **No.** |
| May we reopen #33–#69? | **No.** Ledger #48/#49 stay locked **except** the one-line note that §6.1 Sail-as-utility is superseded. Do not rewrite the ledger. Do not amend S18.18 unless Tenth later scopes that reopen. |
| Third ROE / `protect-all`? | **No.** `protect-all` stays **hold**. Paths ≠ ROE. |
| Warp Core, Flash prices, Thaleron, boarding odds? | **Named outs.** Warp Core stays a **separate** deferred utility leftover. Flash prices stay source, not live locks. Thaleron facility stays unverified. Boarding odds stay injectable. |
| May we `git am` remastered or lock id 345 / costs / art? | **No.** `BAJORAN_SOLAR_SAILOR_LOCKED_FROM_REMASTERED === false`. Existing `*_LOCKED_FROM_REMASTERED` stay false. Port **class + empty-arms posture** only. Ids and magnitudes are **injectable / TBD**. |
| Must a later engine PR prove the catalog? | **Yes**, if Tenth scopes S32. Probe: classification is ship; slots empty; `rosterPlayable` unchanged; fire flags absent; Warp Core still deferred; lock flag false. Replay Phase 10 / doctrine / ledger. **This docs PR adds no S32 probe and no engine.** |
| Screenshot / no-clip? | **N/A.** No UI chrome in this package. DockClear CSS **out**. |
| Is this a Referee Pass? | **No.** Referee / One score the hard gates **before** any engine. Number Three probes only after a later S32 slice. |

These are recommendations for this classification package, not new decisions attributed to the user beyond the room lock. Locked bake-off constraints take precedence over the ledger’s deferred-utility call and over any remastered hull number.

Cite GUIDED §1, ledger §6.1, and plan §16 leftovers as the planning sources this brief **reconciles**, not as a second spec:

| Planning source | This brief |
| --- | --- |
| GUIDED §1: utility Flash rows classified or explicitly deferred — not silent cargo | Gate 1. Sail is **classified as a ship**. Still not cargo. Warp Core stays **deferred utility** (gate 8). |
| Ledger #48/#49 gate 5 / §6.1: Bajoran Sail explicitly deferred **utility** | **Superseded for Sail.** One-line note on the ledger docs. Gates otherwise **closed**. |
| Ledger §6.1: not cargo, not `utilityBook`, no invented weapon id | Still true, and stronger: it is not a weapon row at all. Gate 1. |
| Ledger §6.2 / Q5: Warp Core deferred, ≠ cargo “Warp Cores” | Gate 8. **Not this package.** |
| Empty-armable #50/#51: three slots; empty stays empty; unarmed cannot fire | Gate 2 **subscribes**. Do not reopen. Do not invent a fit. |
| Phase 10 #40/#41 / roster #67/#68; S18.18 `rosterPlayable` false | Gate 3. Do not amend S18.18. |
| Phase 2 two-mode ROE; `protect-all` hold | Gate 6. |
| Content import #25 pack row named Bajoran Solar Sailor | Subscribe **posture** only (faction, shuttle, empty arms, unarmed). Do not freeze its id, cost, art, or magnitudes (gate 7). |
| Flags capacity, Thaleron, Flash prices, boarding odds | Stay **named leftovers**. Gate 8. Not closed by this brief. |

## 2. Locked constraints (do not reopen)

The bake-off room locked these before this brief. Implementation and probes must treat **gates 1–8** as **hard gates**. Referee / One score this brief against those **eight** **before** any engine PR. Number Three probes only after a later S32 slice. EW / boarding / Dominion-first / roster / flags / ledger / empty-armable / construction / HTML / economy / standing / dockClear / hygiene / alertsActive / away-team XP gates stay **closed**; they are restated only as **gate 5** (preserve / do-not-open), not as a reopen. The ledger exception is **one sentence** on the ledger docs: §6.1 Sail-as-utility is superseded. This docs PR **does not** claim a Referee Pass.

### Hard gate 1 — Ship, not utility

> **Bajoran Solar Sailor** (Flash name **“Bajoran Sail”**) is classified as a **ship** / hull catalog entry. It is **not** a combat/device slot utility, **not** cargo, and **not** a flags/passes `utilityBook` credential. A later slice that adds a weapon-catalog id, a `utilityBook` row, a cargo string, or a device-slot mount named Bajoran Sail **fails**. A later slice that leaves the scoreable contract calling Sail an explicitly deferred **utility** **fails**. Warp Core is **not** reclassified by this gate (see gate 8).

Lane owner (wording): **Number Four** on the catalog class; **Referee / One** on the reclass versus ledger §6.1.

Flash family **Utility** and Flash price **5000** stay **source labels**. They do not place the hull in `weaponSlots`, `weaponInventory`, `cargoArray`, or `utilityBook`. “Bajoran Wormhole” map chrome is still not this hull.

### Hard gate 2 — Begins unarmed

> Catalog / knowledge posture: the sail transport **begins unarmed**. Weapon slots are **empty**. Do **not** invent a combat fit (no default Type X, no torpedo, no device “because a freighter should shoot”). An unarmed sailor cannot fire. Empty-armable rules (three slots; empty stays empty; unarmed NPC cannot fire) are **subscribed**, not reopened. A later slice that writes a non-null default weapon, sets `armedByDefault: true`, or auto-fills a Phaser on spawn/save/load **fails**.

Lane owner (wording): **Number Four**.

Legal later install, if some future slice allows it, still uses the landed install path and the installed def only. This package does not specify that install and does not ship a fit.

### Hard gate 3 — Knowledge / catalog first slice

> This package is **docs** plus, later, a **thin catalog subscribe** only. **No playable unlock** in this package. **No `rosterPlayable` gift.** Do not add a player-start card, a yard gift, a spawn injection, or a `dominionBook.rosterPlayable` flag for Bajoran or for this hull. S18.18 stays `scope: 'dominion-first'` and `rosterPlayable` **false**. A later S32 book may **name** the hull and its class. It must not make the hull newly playable and must not flip those flags. A docs PR that edits `src/` **fails**. An engine PR that ships playable unlock “because the brief passed” **fails** unless Tenth scopes that as a **different** slice.

Lane owner (wording): **Number Four** on the catalog; **Referee / One** on no-unlock.

Knowledge here means a probe-visible classification (ship, unarmed, not utility). It is not a map reveal, not a Dominion knowledge layer, and not a purchase tier change.

### Hard gate 4 — Never gift FS / culture / `engagement_authorized`

> Naming the sailor, classifying it, subscribing a catalog row, or noting that it is unarmed must **never** gift `firingSolution`, culture fire, or `engagement_authorized`. Bajoran culture still cannot grant fire. A hull row is not a lock, not a war, not Reman **53**, not a wormhole reveal, and not `mayAutoEngage`. Pursuit ≠ permission ≠ per-weapon gate still holds. An empty slot still cannot mint a shot.

Lane owner (wording): **Number 2**.

`consultDoctrineFire` keeps deleting `engagement_authorized`. Sailor helpers must **not** pass that extra.

### Hard gate 5 — Do not reopen landed lanes (#33–#69)

> Do **not** reopen EW #33 / #35 / #37 / #42 / #43 / #44 / #45. Do **not** reopen boarding #38 / #39 (`tractorIsBoarding()` stays false; away-team XP stays `named_mix`). Do **not** reopen Phase 10 Dominion-first #40 / #41 or roster #67 / #68. **Phase 10 S18.18 stays unamended** unless Tenth later scopes a reopen. Do **not** reopen flags / passes #46 / #47 (Thaleron pass **unverified — not shipped**; `utilityBook` stays credentials). Do **not** reopen ledger #48 / #49 **except** the one-line note that §6.1’s Sail **utility** classification is **superseded** by this brief. Do **not** rewrite the ledger, retune `game_items.json`, or edit `DEFERRED_FLASH_UTILITIES` in this package. Do **not** reopen empty-armable #50 / #51. Do **not** reopen construction #52 / #53. Do **not** reopen HTML catalogs #54 / #55. Do **not** reopen economy / difficulty #56 / #57. Do **not** reopen standing-tiers #58 / #59. Do **not** reopen dockClear #60 / #61. Do **not** reopen hygiene #62 or hygiene #69. Do **not** reopen alertsActive #63 / #64. Do **not** reopen away-team XP #65 / #66. This brief is **not** a Settings HUD rewrite and **not** a dock-overlap pass.

Lane owner (wording): **Referee / One**.

A writer who “finishes the sailor by retuning the ledger,” who amends S18.18 so Bajoran becomes playable inside `dominionBook`, or who treats flags capacity as this package **fails**.

### Hard gate 6 — No third ROE

> **`protect-all` stays hold.** Do not invent a third ROE. Faction paths and this hull’s freighter role are **not** ROE injects. Phase 2 two-mode ROE stays (`return-fire` / `defend` only). A sail transport does not add a mode, does not flip `playerForceMayAutoEngage`, and does not turn pack `protect` into fire (`protect` still folds to `record_only`). A later slice that edits `ROE_MODES` or adds `protect-all` “because the sailor is peaceful” **fails**.

Lane owner (wording): **Number 2**; **Referee / One** on do-not-open Phase 2.

### Hard gate 7 — Blind bake-off

> Do **not** `git am` remastered patches. Do **not** crib `BM1-remastered-work` engine or DESIGN as the hull source. `BAJORAN_SOLAR_SAILOR_LOCKED_FROM_REMASTERED === false`. Every existing `*_LOCKED_FROM_REMASTERED` stays **false**. Do **not** copy remastered hull numbers, costs, art paths, or id **345** (including alias 23→345) as **live locks**. Port **class + empty-arms posture** only: Bajoran faction, shuttle-class sail transport, begins unarmed, fragile freighter role. Bake-off may choose its own ids and magnitudes as **injectable / TBD**. The content-import row that already uses a numeric id is **not** frozen by this brief. Flipping any remastered-lock to true, or writing “id 345 is the bake-off lock,” **fails**.

Lane owner (wording): **Referee / One**.

Coordinator dig informed **posture**. It did not authorize a numbers port. `docs/APPROVED-HULL-MERGES.md` may keep its historical alias line; this brief does not promote that line to a lock and does not edit it.

### Hard gate 8 — Named outs

> **Warp Core** remains a **separate deferred leftover** (ledger §6.2). It is not this package, not cargo “Warp Cores,” and not a ship reclass. **Flash prices** stay **source, not live locks** (Sail 5000 included). **Thaleron** facility stays **unverified — not shipped**. **Boarding success-odds** stay **injectable**. **Flags capacity / activation** stay TBD (#46/#47). Do not close those leftovers by mentioning the sailor. Do not invent a Warp Core id, a Thaleron pin, a capacity table, or a capture percentage in this brief.

Lane owner (wording): **Referee / One**.

### Soft gate 9 — Suites stay green (after a later slice)

> **Soft:** existing suites stay green (Phase 1 / S4–S31 / catalog / doctrine / boarding / Phase 10 / Phase 8 / Phase 9.4 / utility / weapon-ledger / empty-armable / construction / html-catalogs / economy-difficulty / standing-tiers / dock-clear / alerts-active / away-team XP / phase10-roster / side-lane). A later S32 engine does **not** reopen dockClear, EW math, ledger combat numbers, or S18.18.

Lane owner (wording): **Number Four** (process); **Number Three** scores suite-green **after** a later slice that touches runtime — not this brief.

### Also from the room (score with the gates)

| Plan / room want | How this brief locks it |
| --- | --- |
| Room lock **3a**: Sail is a ship, not a utility | Gate 1. §3. |
| Begins unarmed; no invented combat fit | Gate 2. |
| Knowledge / catalog first; no playable unlock; no `rosterPlayable` gift | Gate 3. |
| Never gift FS / culture / `engagement_authorized` | Gate 4. |
| Do not reopen #33–#69; S18.18 unamended; ledger note only | Gate 5. |
| No third ROE; `protect-all` hold; paths ≠ ROE | Gate 6. |
| Blind; class + empty-arms only; id 345 / costs / art not locks | Gate 7. |
| Warp Core, Flash prices, Thaleron, boarding odds (and flags capacity) stay named outs | Gate 8. |
| Suites green; no Referee Pass from this PR | Soft gate 9. Scoring note below. |

### Must not break (cite landed work)

Score as **preservation**. A later sailor Pass that regresses them is a Fail. **#33 through #69 stay locked.**

| Locked rule | Cite | This brief / later slice must not |
| --- | --- | --- |
| Three disruptor identities; Tractor stays a slot; Flash prices not locks | Ledger gates 2–4; #48/#49 | Collapse disruptors. Move Tractor. Lock Flash 5000 as the hull price. |
| Sail not cargo and not `utilityBook` | Ledger §6.1 stores | Put the name in cargo or credentials. The **utility** class is what this brief replaces. |
| Warp Core deferred; ≠ “Warp Cores” | Ledger §6.2 | Reclass Warp Core while touching Sail. |
| Empty stays empty; unarmed cannot fire | #50/#51 | Auto-fill a combat fit on the sailor. |
| `rosterPlayable` false; `scope: 'dominion-first'` | S18.18; #40/#41/#67/#68 | Amend S18.18. Gift a Bajoran playable flag. |
| Paths ≠ ROE; two modes only; `protect` → `record_only` | Phase 2; S6.13 | `protect-all` because the sailor is peaceful. |
| No gifted FS / culture / `engagement_authorized` | Phase 9 gate 5; Phase 10 gate 1 | Write the fact from a catalog row. |
| Credentials ≠ combat slots; Thaleron not shipped | #46/#47 | Stuff the sailor into `utilityBook`. Invent the facility. |
| Away-team XP `named_mix`; tractor ≠ board | #38/#39/#65/#66 | Reopen boarding to “crew the sailor.” |
| Effective `alertsActive` | #63/#64 | Revert the snapshot. |
| `*_LOCKED_FROM_REMASTERED === false` | #44–#69 | Flip any remastered-lock true, including the new sailor flag. |
| Catalog wire; money ≠ standing ≠ Reman | #28 / #58/#59 | Unlock the hull by credits or by naming Bajor. |

### Process locks (not a change to gates 1–8)

- **Proposal first.** Do not implement the catalog from this text until Tenth scopes S32 after a brief score.
- **Blind bake-off.** Implement against bake-off `main` (`e92db62` after #69), **not** remastered. From `docs/bajoran-solar-sailor/` + landed catalog / empty-armable helpers only. Do **not** crib `Artemis2028/BM1-remastered-work`. Do **not** `git am`.
- **#33–#69 stay locked.** S18.18 stays unamended. Ledger body stays; the one-line supersession note is the only ledger edit.
- **Subscribe, do not fork.** Read class and empty-arms posture. Do not implement a second catalog wire, a second incident ledger, or a second utility inventory.
- **No invented id, cost, art path, or combat fit as a locked constant.**
- **No Pass claimed** in `docs/BAKEOFF-STATUS.md` from this PR.
- **No `src/` edits on this PR.**

### Scoring note

Referee / One score the **eight hard gates** **before** any engine PR. Number 2 scores gates **4** and **6**. Number Four scores gates **1–3** and the later-slice shape in gate **7**’s injectable ids. Number Three probes **only after** a later S32 slice. **No Referee Pass is claimed by this docs PR.**

## 3. Class and empty-arms posture (gates 1, 2, 7)

**Lane owner (wording):** Number Four on the row; Number 2 on fire forbids.

Names can change. The **classification** cannot. Magnitudes are **not** in this table — they are injectable / TBD and must not be copied from remastered or frozen from the content-import row.

| Field | Locked posture | Must not |
| --- | --- | --- |
| Identity | **Bajoran Solar Sailor**. Flash label **“Bajoran Sail”** is the same hull’s source name. | A second item that is a slot utility, a cargo pod, or a credential. |
| Faction | **Bajoran** | A neutral tug, a Cardassian prize, or a Dominion core hull. |
| Class | **Shuttle**-class **sail transport** | A battleship, a station, or a weapon family. |
| Role | **Fragile freighter** (peaceful sail transport) | A combat fit, a gunship, or a boarding platform. |
| Arms | **Begins unarmed.** Empty slots. `armedByDefault` false. | Any default weapon id. Type X auto-fill. |
| Store | Hull **catalog** entry | `weaponSlots` as its home, `cargoArray`, `utilityBook`. |
| Play | **Knowledge / catalog only** this package | `rosterPlayable: true`. New start card. Gifted yard stock. |
| Fire | `grantsFire: false` | `firingSolution`, culture fire, `engagement_authorized`. |
| ROE | Paths ≠ ROE | `protect-all` or a third mode. |
| Lock | `BAJORAN_SOLAR_SAILOR_LOCKED_FROM_REMASTERED === false` | Id **345**, alias 23→345, costs, or art paths as live locks. |
| Price label | Flash **5000** is **source, not a lock** | Treating 5000 as the hull’s live cost. |

```js
{
  flashName: 'Bajoran Sail',
  displayName: 'Bajoran Solar Sailor',
  classification: 'ship', // not 'deferred-utility'
  faction: 'bajoran',
  shipClass: 'shuttle',
  role: 'fragile-freighter',
  beginsUnarmed: true,
  defaultWeaponSlots: [null, null, null],
  armedByDefault: false,
  cargo: false,
  utilityBook: false,
  weaponCatalogId: null,
  rosterPlayableGift: false,
  grantsFire: false,
  lockedFromRemastered: false,
  idLocked: false,       // bake-off id is injectable / TBD
  magnitudesLocked: false
}
```

`weaponCatalogId: null` means “not a weapon row.” It does **not** mean “deferred utility.”

## 4. Ledger supersession (gate 5) and Warp Core (gate 8)

Ledger #48/#49 **stay locked**. The scoreable change on those docs is **one line**: §6.1’s classification of Flash Bajoran Sail as an explicitly deferred **utility** is **superseded** by this brief. Q4’s “when does Sail become a live slot utility?” is answered **here**: it does not; it is a ship. Do not edit §6.2.

| Row | After this brief |
| --- | --- |
| Bajoran Sail / Bajoran Solar Sailor | **Ship.** This package. Not a deferred-utility leftover. |
| Warp Core | **Still** an explicitly deferred utility. Separate leftover. Not cargo “Warp Cores.” |
| Flags capacity / activation | Still TBD. Not this package. |
| `protect-all` | Still **hold**. Gate 6. |
| Thaleron facility | Still unverified. |
| Flash prices | Still source, not live locks. |
| Boarding success-odds | Still injectable. |

## 5. Acceptance exercises (S32 sketch)

Keep Phase 1 / S4–S31 / doctrine / catalog / boarding / Phase 10 / utility / weapon-ledger green. **S18.18 stays unamended.** **S22 stays the ledger audit** (Warp Core still deferred). Add **S32** only **after** Tenth scopes a later thin subscribe catalog. IDs are a sketch; do not promise a final count. **This docs PR does not add S32 to the probe.**

Detail, risks, and the minimum snapshot live in the companion engine-deps. Number Three owns the probe gate **after** a later slice, not this brief.

| Case | Required exercise and result (later engine only) |
| --- | --- |
| **S32.1** Ship, not utility | Snapshot `classification === 'ship'`. Not in `utilityBook`. Not in `tradeGoods`. `weaponCatalogId === null`. Flash name still “Bajoran Sail.” |
| **S32.2** Begins unarmed | Empty slots. No invented weapon id. Unarmed sailor does not fire. |
| **S32.3** No playable gift | `rosterPlayable` still false. S18.18 unchanged. No new start card from this module. |
| **S32.4** No gifted fire | No `firingSolution` / `engagement_authorized` / culture fire from the row. |
| **S32.5** Lanes preserved | Replay S14–S31 / S17 / S18 including S18.18 / S22. Ledger combat numbers unchanged. Warp Core still deferred. |
| **S32.6** No third ROE | `ROE_MODES` unchanged. No `protect-all`. |
| **S32.7** Blind | `BAJORAN_SOLAR_SAILOR_LOCKED_FROM_REMASTERED === false`. `idLocked === false`. `magnitudesLocked === false`. |
| **S32.8** Named outs intact | Warp Core classification unchanged. Flash prices not live locks. Thaleron still unshipped. Boarding odds still injectable. |

Do not claim a Referee Pass from this list.

## 6. Non-goals

This brief will not:

- Implement engine code, tests, UI screenshots, or dockClear polish.
- Edit `src/`, `data/game_items.json`, `bm-ships/ships.json`, or HTML catalogs.
- Reopen #33–#69 or amend S18.18.
- Rewrite the weapon ledger beyond the one-line Sail supersession note.
- Reclassify Warp Core, or merge it into cargo “Warp Cores.”
- Invent a combat fit, a weapon id, a cargo string, or a `utilityBook` credential for the sailor.
- Gift a playable unlock or set `rosterPlayable` true.
- Gift `firingSolution`, culture fire, or `engagement_authorized`.
- Add `protect-all` or any third ROE.
- Lock remastered id 345, alias 23→345, costs, art paths, or stat magnitudes.
- `git am` remastered patches.
- Close flags capacity, Thaleron, Flash price locks, or boarding-odds leftovers.
- Claim a Referee Pass in `docs/BAKEOFF-STATUS.md`.

## 7. Open questions

Mark these clearly. They do **not** weaken the hard gates.

| ID | Question | Default if a later catalog is scoped before an answer |
| --- | --- | --- |
| Q1 | Which bake-off hull id does S32 publish? | **TBD / injectable.** Do not lock 345 or any other remastered number. Omit inject ⇒ classification without a frozen id (`idLocked: false`). |
| Q2 | Does S32 point at the existing content-import row or mint a sibling label only? | **Subscribe posture** (name, faction, shuttle, empty arms). Do not copy that row’s cost, art, or magnitudes into locks. Do not spawn a second sailor. |
| Q3 | When (if ever) does the sailor become a playable purchase / traffic hull beyond knowledge? | **Out of this package.** Requires a later Tenth-scoped slice. Default: no unlock, no `rosterPlayable` gift. |
| Q4 | Should a later ledger snapshot change Sail’s `mapping` off `deferred-utility`? | **Only if Tenth scopes that data note.** This docs PR does not edit `src/phase9-weapons-matrix.js`. Warp Core’s mapping stays. |
| Q5 | Does “fragile freighter” set cargo, hull, or speed numbers? | **No.** Role words only. Magnitudes stay injectable / TBD. |
| Q6 | Warp Core follow-on? | **Different brief.** Stays deferred here. |

## 8. Implementation sequence and handoff

1. **Brief score.** Referee / One score the **eight hard gates**. Number 2 scores gates **4** and **6**. Number Four scores gates **1–3** and blind ids (gate **7**). Do not open an engine PR on this document alone.
2. **Tenth scopes** a later thin subscribe catalog **or** leaves this as docs-only. Blind implement from `docs/bajoran-solar-sailor/` against bake-off `main` after #69 (`e92db62`). Do not crib remastered.
3. **Suggested order if scoped:** classification ship (S32.1) → empty arms (S32.2) → no `rosterPlayable` gift (S32.3) → no fire gift (S32.4) → preservation replay including S18.18 and Warp Core still deferred (S32.5–S32.8). **Do not** lock ids or magnitudes. **Do not** amend S18.18.
4. **Number Three** adds/runs S32 after that later slice. Keep S4–S31 green. Do not weaken S22 to make Sail “a utility again,” and do not weaken S18.18 to make it playable.
5. Status may note that the brief is open. It must **not** write a Referee Pass.

## 9. Lanes

| Who | Owns | Scores |
| --- | --- | --- |
| **Number 2** | Doctrine: gates **4** and **6** — no gifted fire; no third ROE; culture on a Bajoran hull still cannot grant fire | A catalog row is not a shot and not `protect-all` |
| **Number Four** | Catalog: gates **1, 2, 3** (ship, unarmed, knowledge-only) and gate **7** injectable ids. Must not edit `src/` in this PR | Class + empty arms; no unlock; no locked 345 |
| **Number Three** | Probe gate **after** a later S32 slice (S32; S4–S31 and S18.18 stay green) | Not this brief |
| **Referee / One** | This brief vs the **eight hard gates** in §2. **Do-not-open** check: #33–#69 closed; ledger note only; Warp Core still deferred; no `git am`; **no Referee Pass claimed** from this PR | **Before** any engine PR |

This brief is ready to score when a reader can mark Pass/Fail on: Sail is a ship not a utility/cargo/credential; it begins unarmed; this package is knowledge/catalog only with no `rosterPlayable` gift; no gifted fire; #33–#69 stay closed except the Sail reclass note and S18.18 stays unamended; no third ROE; blind (class + empty-arms only, id 345 not a lock); Warp Core, Flash prices, Thaleron, and boarding odds stay named outs.

## Sources and precedence

- This brief’s later-slice checklist: `docs/bajoran-solar-sailor/BM1-BAJORAN-SOLAR-SAILOR-ENGINE-DEPENDENCIES.md`.
- Planning: `docs/GUIDED-CONVERGENCE.md` §1 and leftovers; `docs/revised-development-plan.md` §16; `docs/BAKEOFF-STATUS.md`.
- Superseded for Sail only: `docs/weapon-ledger/` §6.1 (one-line note). Warp Core §6.2 remains.
- Subscribed, not reopened: empty-armable #50/#51; Phase 10 S18.18; catalog wire #28.
- Room: Tenth Mountain Trooper, 2026-09-24, lock **3a**. Coordinator dig = class + empty-arms posture only. Tip stays blind.
