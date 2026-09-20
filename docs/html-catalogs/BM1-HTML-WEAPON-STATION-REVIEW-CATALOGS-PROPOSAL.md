# BM1 HTML weapon / station review catalogs

**Status:** Passed brief — **stay locked.** S25 static HTML pages now live under this folder (`index.html` / `weapons.html` / `stations.html`). This document remains the scoreable contract. **No Referee Pass claimed.** Do not reopen #33–#54.  
**Repository:** `Artemis2028/BM1-bakeoff`  
**Planning baseline:** `91ecc2c` on `main` (20 September 2026), after station construction visuals engine (PR #53).  
**Referee context:** Phase 4 engine §6 **Pass** on `7f926df`. Phase 9–9.4 EW (PRs #33 / #35 / #37 / #42 / #43 / #44 / #45), boarding (PRs #38 / #39), Phase 10 Dominion-first (PRs #40 / #41), flags / passes (PRs #46 / #47), the weapon / device source ledger (PRs #48 / #49), empty-but-armable (PRs #50 / #51), and station construction visuals (PRs #52 / #53) are the **locked** baselines — **Keep #33, #35, #37, #38, #39, #40, #41, #42, #43, #44, #45, #46, #47, #48, #49, #50, #51, #52, and #53 locked.** This is an **HTML review-catalog brief only**, not a combat retune, not a live price lock, not a second shop, not a construction-visuals reopen, and **not** a claim that those lanes already had a Referee Pass on the status MD. This brief does **not** claim a new Referee Pass.  
**Companion:** `docs/html-catalogs/BM1-HTML-CATALOGS-ENGINE-DEPENDENCIES.md` (hooks, risks, later S25 static-page sketch).  
**Scoped by:** Tenth Mountain Trooper, 2026-09-20 — proposal + deps first; room scores the hard gates **before** any HTML page set or generator. Room-locked hard gates (HTML, Flash is evidence not viewer; inspect defs only; subscribe read-only sources and show both; never gift fire; do-not-reopen + named outs + blind) are **in** this one scoreable brief.

Phases 1–10 and Phase 9–9.4 already landed, including a **read-only** Phase 9 weapons matrix, a **subscribe-only** weapon / device source ledger (PR #49), `data/game_items.json` as the live item file, `data/station_manifest.json` (36 types) + `data/stationData.json` (269 placements), and construction-site language that already means **being built** (PR #53). Convergence §9 and plan §16.2 row 9 named the remaining **weapon / station review presentation** gap: review catalogs are **HTML**, without requiring the original Flash client; Flash is **source evidence**, not a required viewer; pages must not silently “fix” Flash vs bake-off conflicts — they show both and cite the ledger.

This is **one** docs-inspect brief: publish a **scoreable contract** for HTML review catalogs that inspect weapon and station defs, subscribe to the landed ledger and the station JSON as **read-only** sources, keep Flash prices as **source material, not live locks**, and never gift `firingSolution`, culture fire, or `engagement_authorized` from opening a catalog page. It is not a remastered `git am`, not a combat retune, not a second shop, not dockClear polish, not a broader economy / difficulty package, and not a Thaleron facility invent.

**This PR ships proposal + engine-deps only.** A later thin **static HTML** page set is the natural S25 deliverable and can ship in a later **docs** PR without touching combat / engine. This brief does **not** ship those pages.

## 1. The result we want

A reviewer can **inspect weapon and station defs in a browser** without the Flash client, without anyone retuning combat, without treating a Flash number as a live shop price, and without a catalog page becoming a second market or a fire token. Flash vs bake-off mismatches stay **visible**. The landed ledger stays the **citation** for weapon identities. Station pages inspect `station_manifest.json` types and `stationData.json` placements as they are.

**Exit condition (GUIDED-CONVERGENCE §9 / plan §16.2 row 9):** review catalogs for weapons and stations are **HTML**; Flash is not required as a viewer; pages show Flash and bake-off side by side and cite the ledger instead of silently reconciling them; opening a page does not gift fire or become a shop.

**Proposed first-release decisions:**

| Question | Proposed answer |
| --- | --- |
| What is the first playable slice? | **Docs-only** scoreable contract under `docs/html-catalogs/`. **This PR does not ship HTML pages.** A later thin **static HTML** page set (S25), **if** Tenth scopes it after Pass, lives under `docs/html-catalogs/` (names can change) and **subscribes** to the landed weapon ledger + `data/game_items.json` + `data/station_manifest.json` + `data/stationData.json` without rewriting combat numbers, live prices, or station runtime. |
| Is a thin static HTML review page set the natural later deliverable? | **Yes.** Analog: `docs/ship-balance/REVIEW.html` (hull review). S25 is **docs**, not combat. It can ship in a later docs PR. Combat / `src/` fire paths / `game_items.json` combat fields stay **untouched**. |
| May we require the Flash client as the viewer? | **No.** Flash is **source evidence**. Review happens in HTML. |
| What are the catalogs for? | **Inspecting defs** (weapons / stations). Not a combat retune. Not live price locks. Not a second shop. |
| What are the read-only sources? | Landed weapon ledger (PRs #48 / #49, `src/weapon-source-ledger.js` + `docs/weapon-ledger/`); `data/game_items.json`; `data/station_manifest.json`; `data/stationData.json`. Phase 9 matrix stays **read-only**. Flash prices stay **source material**. |
| May pages silently “fix” Flash vs bake-off conflicts? | **No.** Show both. Cite the ledger. Display-name collision on ids 6 / 7 stays an **audit finding**, not a merge. |
| May opening a catalog page gift `firingSolution`, culture fire, or `engagement_authorized`? | **No.** A review page is knowledge. It is not a lock, a war, or a shop. |
| May we reopen EW #33–#45, boarding #38/#39, Phase 10 #40/#41, flags #46/#47, ledger #48/#49, empty-armable #50/#51, or construction #52/#53? | **No.** Construction §5 / plan row 5 is **engine-landed stay-locked**. |
| DockClear polish, broader economy / difficulty knobs, combat retune, Thaleron facility invent, remastered crib / `git am`? | **Out.** Economy / difficulty is a **separate package** (plan §16.2 row 8). |
| May we `git am` remastered patches or lock remastered constants? | **No.** `HTML_CATALOG_LOCKED_FROM_REMASTERED === false` (name can change). |
| Is this a Referee Pass? | **No.** Referee / One / Number 2 / Number Four score the hard gates **before** any HTML page set or engine. Number Three probes only after a later S25 slice. |

These are recommendations for this review-catalog package, not new decisions attributed to the user. Locked bake-off constraints take precedence over older flavor that treated Flash as the required viewer, treated a review table as a shop, or silently merged Flash vs bake-off rows.

Cite GUIDED-CONVERGENCE §9 and plan §16.2 row 9 as the planning sources this brief **reconciles**, not as a second spec:

| Planning source | This brief |
| --- | --- |
| GUIDED §9: review catalogs are **HTML**, without requiring Flash | Gate 1. |
| GUIDED §9: working agreement for how the team inspects defs, not a claim the pages already exist | This PR: proposal + deps. Pages are S25, later. |
| GUIDED §9: Flash is source evidence, not a required viewer | Gate 1. |
| GUIDED §9: pages must not silently “fix” Flash vs bake-off; show both; cite the ledger | Gate 3. |
| GUIDED §1 / ledger #48/#49: Flash prices are source, not live locks; three disruptor identities; Tractor stays a slot; Sail / Warp Core deferred | Gates 2–3. Subscribe; do not reopen. |
| GUIDED §5 / construction #52/#53: scaffolds / workbees / blue beams already mean being built | **Stay locked.** Catalogs inspect defs, not site language. |
| Plan §16.2 row 8: broader economy / difficulty | **Out.** Separate package. |
| Plan §16.2 rows 1–5 | **Locked.** Do not reopen ledger / flags / empty-armable / boarding / construction. |

## 2. Locked constraints (do not reopen)

The bake-off room locked these before this brief. Implementation and probes must treat **gates 1–7** as **hard gates**. Referee / One score this brief against those **seven** **before** any HTML page set or engine PR. Number Three probes only after a later S25 slice. EW / boarding / Phase 10 / flags / ledger / empty-armable / construction gates stay **closed**; they are restated only as **gate 5** (preserve / do-not-open), not as a reopen. This docs PR **does not** claim a Referee Pass.

### Hard gate 1 — Catalogs are HTML; Flash is evidence, not a viewer

> Review catalogs for weapons and stations are **HTML**. The original Flash client is **source evidence**, not a required viewer. A later slice that ships only a “open this SWF” note, or that treats Flash as the review UI, **fails** even if the tables look complete in a markdown file.

Lane owner (wording): **Referee / One** on the agreement; **Number Four** on “the later page set is HTML.”

`docs/ship-balance/REVIEW.html` already proves the team reviews hull defs in HTML. Weapon / station review follows that **medium**, not that file’s hull-balance copy. Markdown companions may exist; they do not replace the HTML catalogs once S25 is scoped.

### Hard gate 2 — Inspect defs; not a retune, not a live price lock, not a second shop

> Catalogs are for **inspecting defs** (weapons / stations). They are **not** a combat retune, **not** live price locks, and **not** a second shop. Do **not** edit `data/game_items.json` damage / cooldown / range / live price, `BASELINE_COMBAT_NUMBERS`, or station runtime stock / cost / repair rules “so the catalog looks clean.” Do **not** add Buy / Equip / Dock / Stock-now controls. A Flash price column is a **source label**. A bake-off cost / price column is **current data**. Neither is a lock and neither is a vendor.

Lane owner (wording): **Number Four** on no-write; **Number 2** on “a review page is not a market and not a fire token.”

An S25 page that copies Flash 1300 into a non-overridable live constant, or that lets a reviewer “buy Type X from the catalog,” **fails** even if the HTML is pretty. `FLASH_PRICES_ARE_LIVE_LOCKS` stays **false**. Station `cost` values in `station_manifest.json` are **bake-off current data**, not Flash-certified prices — GUIDED did not supply a Flash station-price table.

### Hard gate 3 — Subscribe read-only; show both; cite the ledger; do not silently fix

> Subscribe to the landed weapon ledger (#48 / #49) and to `game_items.json` / station data as **read-only** sources. Flash prices stay **source material**. Pages must **show both** Flash and bake-off and **cite** the ledger. They must not silently merge Disrupter Canon / Cannon / Turret, invent Flash prices for inherited extras, invent Bajoran Sail / Warp Core ids, drop vacant or unknown `stock.weaponIds`, or rewrite a station type to “match Flash.” Plasma Torpedo live **7200** stays **uncertified**.

Lane owner (wording): **Referee / One** on honesty; **Number Four** on subscribe-only reads.

Landed `snapshotWeaponLedger` already prints Flash-vs-live, three disruptor identities, Tractor Device, deferred utilities, inherited extras, and vacant ids. First S25 **reads** that snapshot (or the same JSON + ledger tables). A writer who “cleans” id 7’s display name, fills vacant stock ids 20 / 21 / 31–37 / 40–43, or invents defs for placement stock ids 46 / 47 / 48 / 50 / 51 / 52 / 58 **fails**.

### Hard gate 4 — Never gift fire from opening a catalog page

> Opening, searching, filtering, or printing a catalog page must **never** gift `firingSolution`, culture fire, or `engagement_authorized`. A review page is not a weapons-free token, not a Phase 3 ceasefire, not a boarding warrant, not a Dominion discovery write, and not a construction-beam attribution. Pursuit, permission to engage, and the per-weapon firing gate stay the landed three-step.

Lane owner (wording): **Number 2**.

Same doctrine lean as Phase 9 gate 5, Phase 10 stories, flags credentials, the ledger, empty-armable, and construction visuals. If a later in-game panel (out of first S25) is scoped, it is still **knowledge**. It must not write combat facts.

### Hard gate 5 — Do not reopen landed lanes

> Do **not** reopen EW #33 / #35 / #37 / #42 / #43 / #44 / #45 (matrix read-only; ghosts book-only; no report wipe; soft numbers ≠ new fire rules; `MAGNITUDES_LOCKED_FROM_REMASTERED === false`). Do **not** reopen boarding #38 / #39 (`tractorIsBoarding()` stays false; capture XOR scuttle; XP `not_tracked_yet`). Do **not** reopen Phase 10 #40 / #41 (stories stay knowledge layers). Do **not** reopen flags / passes #46 / #47 (`utilityBook` stays credentials; Thaleron pass **unverified — not shipped**). Do **not** reopen weapon ledger #48 / #49 (Phase 9 matrix read-only; Flash prices source not locks; three disruptor identities; Bajoran Sail / Warp Core deferred). Do **not** reopen empty-armable #50 / #51 (three slots; empty stays empty; unarmed cannot fire). Do **not** reopen construction visuals #52 / #53 (scaffolds / workbees / **blue** beams mean being built; repair arms stay PR #18; `CONSTRUCTION_LOCKED_FROM_REMASTERED === false`).

Lane owner (wording): **Referee / One**.

### Hard gate 6 — Named outs

> Do **not** open dockClear polish, broader economy / difficulty knobs (plan §16.2 row 8 — **separate package**), combat retune, live Flash price locks, or Thaleron **facility** invent (place, quest, pin, or pass). Do **not** treat construction-site language as a station-def column that reopens #53. Do **not** invent a workbee hull, a second Reman id, or a shop SKU from a catalog row.

Lane owner (wording): **Referee / One**.

### Hard gate 7 — Blind bake-off; remastered-lock false

> Do **not** `git am` remastered patches. Do **not** crib `BM1-remastered-work` engine or DESIGN as the catalog source. `HTML_CATALOG_LOCKED_FROM_REMASTERED === false`. Implement later from bake-off `docs/` + the landed ledger + the in-repo JSON files only. A later static HTML generator, if any, **reads** those files and **writes HTML under `docs/`** — it does not write combat JSON and does not become a runtime shop.

Lane owner (wording): **Referee / One**.

### Soft gate 8 — Suites stay green (after a later slice)

> **Soft:** existing suites stay green (S4–S24 / catalog / doctrine / boarding / Phase 10 / Phase 9.4 / utility / weapon-ledger / empty-armable / construction / side-lane). Screenshot / no-clip is **N/A** on this docs PR. A later S25 docs PR may attach a static-page screenshot of the HTML catalogs themselves; dockClear polish stays **out**. In-game Chromium of combat is **not** required for a static `docs/` page set.

Lane owner (wording): **Number Four** (process); **Number Three** scores suite-green **after** a later slice that touches runtime — not this brief.

### Also from the room (score with the gates)

| Plan / room want | How this brief locks it |
| --- | --- |
| Catalogs are HTML; Flash is not a required viewer | Gate 1. |
| Inspect defs; not retune / not live locks / not a second shop | Gate 2. |
| Subscribe ledger + `game_items.json` / station data read-only; show both; cite ledger | Gate 3. |
| Never gift FS / culture / `engagement_authorized` from opening a page | Gate 4. |
| Do not reopen EW / boarding / Phase 10 / flags / ledger / empty-armable / construction | Gate 5. |
| Named outs: dockClear, economy knobs, combat retune, Thaleron facility, remastered crib | Gate 6. |
| Blind; `HTML_CATALOG_LOCKED_FROM_REMASTERED === false` | Gate 7. |
| Suites green; no Referee Pass from this PR | Soft gate 8. Scoring note below. |

### Must not break (cite landed work)

Score as **preservation**. A later catalog Pass that regresses them is a Fail. **#33, #35, #37, #38, #39, #40, #41, #42, #43, #44, #45, #46, #47, #48, #49, #50, #51, #52, and #53 stay locked.**

| Locked rule | Cite | This brief / later slice must not |
| --- | --- | --- |
| Ten-column matrix before overhaul; numbers unchanged | Phase 9 gate 4; ledger #48/#49; S14.12 / S22.1 | Edit live damage / cooldown / range / price “so the HTML matches Flash.” |
| Three disruptors + Tractor Device slot | Ledger gates 2–3; S22.2 | Collapse 6/7/12. Move Tractor to cargo / `utilityBook` / a catalog “utility” shop. |
| Flash prices = source, not live locks | Ledger gate 4; `FLASH_PRICES_ARE_LIVE_LOCKS === false` | Print a “locked” Flash price or copy Flash into non-overridable constants. |
| Bajoran Sail / Warp Core deferred; Warp Core ≠ “Warp Cores” | Ledger gate 5 | Invent ids. Merge into cargo. Ship as `utilityBook`. |
| Inherited extras listed; no invented Flash prices | Ledger gate 6 | Drop Particle Beam et al. Invent Flash cells. Fill vacant ids 20 / 21 / 31–37 / 40–43. |
| No universal shield bypass; no gifted fire | Ledger gate 7; Phase 9 gate 5 | `if (name.includes('polaron')) skipShields`. Gift FS from opening a page. |
| Tractor ≠ boarding | #38 / #39; `tractorIsBoarding() === false` | Tractor-as-catalog-crane / capture. |
| Flags/passes are credentials; Thaleron pass unverified | #46 / #47 | Ship Thaleron **pass** / **facility** from a station row named “research.” |
| Empty stays empty; unarmed cannot fire | #50 / #51 | Auto-fill Type X onto a reviewed hull “because the catalog listed a gun.” |
| Construction language = being built; repair arms stay PR #18 | #52 / #53; S24 | Redo site draw. Bind construction art as repair. Treat a catalog page as construction evidence. |
| Defense platforms never repair | Side-lane PR #18; types 86 / 87 | Mark a defense-platform catalog row `repairCapable: true`. |
| Money ≠ standing ≠ Reman | PR #28; Phase 8 | Latinum + a catalog price bypasses `meetPackPurchaseDecision`. |
| `*_LOCKED_FROM_REMASTERED === false` | #44–#53 | Flip EW / boarding / Phase 10 / utility / ledger / empty-armable / construction / new HTML-catalog lock flags true. |

### Process locks (not a change to gates 1–7)

- **Proposal first.** Do not ship HTML pages or a generator from this text until Tenth scopes S25 after a brief Pass.
- **Blind bake-off.** Implement against bake-off `main` (`91ecc2c` after #53), **not** remastered `758665e`. From `docs/` + landed ledger + in-repo JSON only. Do **not** crib `Artemis2028/BM1-remastered-work`.
- **No invented flavor copy.** Flash weapon descriptions were **not** in the bake-off source packet. Description cells stay empty until a later packet supplies them. Station `description` strings already in `station_manifest.json` may be **shown as current data**, not rewritten.
- **#33 / #35 / #37 / #38 / #39 / #40 / #41 / #42 / #43 / #44 / #45 / #46 / #47 / #48 / #49 / #50 / #51 / #52 / #53 stay locked.**
- **Subscribe, do not fork.** A later page set reads the landed ledger + JSON. It does not become a second weapon religion or a second station runtime.
- **No Pass claimed** in `docs/BAKEOFF-STATUS.md` from this PR.

### Scoring note

Referee / One / Number 2 / Number Four score the **seven hard gates** **before** any HTML page set or engine PR. Number Three probes **only after** a later S25 slice. **No Referee Pass is claimed by this docs PR.** Room scores the brief before any engine.

## 3. What “HTML review catalog” means (gates 1–3)

**Lane owner (wording):** Number Four on pages / sources; **Referee / One** on “inspect, do not fix.”

| Term | Meaning in this brief |
| --- | --- |
| Review catalog | A **static HTML** page (or small page set) the team opens in a browser to inspect defs. Not a shop. Not combat HUD. Not dockClear. |
| Weapon catalog | HTML table(s) of weapon / device identities: Flash name / Flash price (source), bake-off id / live name / type / live price (current data), provenance, slot class, notes. Cites `docs/weapon-ledger/` + `snapshotWeaponLedger`. |
| Station catalog | HTML table(s) of station **types** from `station_manifest.json` (36 rows) and, if included, **placements** from `stationData.json` (269 rows). Cost / hull / shields / sizeClass / stock ids are **current data**. |
| Flash | Historical BM1 source. Evidence for a cell. **Not** the viewer. **Not** a live lock. |
| Show both | When Flash and bake-off disagree (Canon vs “Disruptor Cannon”; Pulse vs Turret; Plasma price unsupplied), print **both** cells and a note. Do not pick a winner. |
| Cite the ledger | Weapon identity / provenance / deferred / inherited claims point at `docs/weapon-ledger/` and the landed snapshot. Do not re-audit from scratch and silently change a verdict. |
| Second shop | Buy / sell / equip / restock / “add to loadout” from the catalog page. **Forbidden.** |
| In-game review panel | A later runtime UI that mirrors these pages. **Out of first S25.** If ever scoped, it still obeys gates 2–4. |

`docs/ship-balance/REVIEW.html` is the **medium analog** (HTML, searchable, in-repo). It is **not** a source of weapon or station numbers for this package, and this brief does **not** rewrite that hull page.

## 4. Weapon catalog contract (gates 2–3)

**Lane owner (wording):** Referee / One on ledger fidelity; **Number Four** on columns.

First S25 weapon page **subscribes**. It does not replace `src/weapon-source-ledger.js` or `src/phase9-weapons-matrix.js`.

### 4.1 Required columns (names can change)

| Column | Source | Lock? |
| --- | --- | --- |
| Flash name | GUIDED §1 / ledger §3 (Flash spelling) | No |
| Flash price | Same; Plasma **not supplied** | **No** — source label |
| Bake-off id | `game_items.json` / ledger | Identity only |
| Live name / type / live price | `game_items.json` | Current data, **not** a lock |
| Slot class | Ledger (combat / device / deferred utility) | Subscribe |
| Provenance | Ledger enum: `BM1-flash` / `retained-BM2` / `bake-off-game-items` / `new` | Subscribe |
| Live price lock? | Always **No** | Gate 2 |
| Notes | Ledger findings only. No invented flavor. | |

### 4.2 Must remain visible (do not “fix”)

| Finding | Catalog must |
| --- | --- |
| Ids **7 / 6 / 12** are three disruptor identities (Flash Canon / Cannon / Turret) | Three rows. Live names of 6 and 7 both “Disruptor Cannon” is an **audit finding**. |
| Tractor id **25** Device | Slot class **device**. Not cargo. Not `utilityBook`. Not boarding. |
| Bajoran Sail / Warp Core | Listed as **explicitly deferred utilities**; `bakeoffId: null`; Warp Core ≠ cargo “Warp Cores.” |
| Inherited extras ids **2, 27, 28, 29, 30, 38, 39, 44, 45** | Listed. Flash price cell **empty / not in this Flash table**. |
| Plasma Torpedo id **17** | Flash **name**; price **not supplied**; live **7200** current data, uncertified. |
| HoJ | `provenance: new`; unmounted; not a catalog id. |
| Vacant weapon ids **20, 21, 31–37, 40–43** | Stay vacant. Do not invent rows. |

### 4.3 Must not appear as shop chrome

No Buy, Equip, “install in slot 1,” or “stock at Daystrom.” Placement stock on a **station** page may list weapon **ids** as current data (see §5.3). That list is **inspect**, not a live market.

## 5. Station catalog contract (gates 2–3)

**Lane owner (wording):** Number Four on JSON fidelity; **Number 2** on “a type row is not a shop and not a fire token.”

GUIDED §9 asks for **station** review catalogs in the same HTML medium. There is **no** landed station source-ledger analog to #48/#49. First S25 therefore **inspects the in-repo station JSON** and labels every numeric claim **bake-off current data** unless a later packet supplies Flash station prices. Do **not** invent a Flash station-price table in this brief.

### 5.1 Type catalog (`data/station_manifest.json`)

Facts at `91ecc2c` (observations, not retunes):

- Schema / pack: `generatedFrom: "clean mod manifest"`; `assetFolder: "assets/game/stations"`.
- **36** types. Ids: **70–90, 106–113, 119, 200–205**.
- Typical fields: `id`, `name`, `description`, `sizeClass`, `cost`, `hull`, `shields`, `mass`, `cargoCapacity`, `image`, draw metrics.
- `sizeClass` values in-tree: `starbase` (8), `shipyard` (5), `heavy-shipyard` (4), `commerce` (3), `defense-platform` (3), plus utility / civilian / habitat / communications / industrial / megastructure / research / special-utility / small-civilian.

Required type columns (names can change): id, name, sizeClass, cost (**current data, not a lock**), hull, shields, mass, cargoCapacity, image path. Description may be shown as the JSON string.

### 5.2 Placement catalog (`data/stationData.json`) — optional second page

Facts at `91ecc2c`:

- Schema `bm2.station-data.v1`; **269** placements; **69** `systemNumber` values.
- Fields: `id`, `systemNumber`, `systemIndex`, `stationTypeId`, `name`, `condition`, `offset`, `rotation`, `stock.{rawIds,shipIds,weaponIds}`.

If S25 includes placements, list type id + name + system + stock weapon ids as **current data**. Do **not** treat `stock.weaponIds` as a live Phase 8 shop, a price lock, or permission to invent missing weapon defs.

### 5.3 Placement stock ids that are not live weapon defs

`stationData.json` `stock.weaponIds` at `91ecc2c` include ids that are **not** in `game_items.json` `weapons[]`:

| Kind | Ids observed in placement stock | Catalog must |
| --- | --- | --- |
| Vacant catalog holes | 20, 21, 31–37, 40–43 | Label **vacant / no live weapon def**. Do not invent. Do not drop the stock cell. |
| Ids outside the ledger vacant list | 46, 47, 48, 50, 51, 52, 58 | Label **listed in station stock; no live weapon def on this tip**. Do not invent a `weapons[]` row. Do not silently delete the stock id. |

This is an **inspect finding**, not a retune. Filling those holes from this brief **fails** gate 3. Treating them as buyable catalog SKUs **fails** gate 2.

### 5.4 Repair / construction / defense — cite, do not reopen

| Fact | Cite | Catalog may | Must not |
| --- | --- | --- | --- |
| Repair-capable size classes `starbase` / `shipyard` / `heavy-shipyard`; type **83** Maintenance Station | Side-lane PR #18; `isRepairCapableLocation` | Print a **cite** column “repair-capable per PR #18” | Invent new repair yards. Retune the predicate. |
| Defense platforms types **86 / 87** never repair | Same | Print **never repair** | Mark them repair-capable. Redo overlay art. |
| Constructing stations do not dock / fire; site language is scaffold / workbee / blue beam | #52 / #53; S24 | Optional note “construction language is a **visual** lane, already landed” | Reopen site draw. Treat a type row as `underConstruction`. |
| Phase 8 ruin reconstruction un-destroys without `underConstruction` | Construction brief Q6 | **Out** | Fold reconstruction into the catalog as a build SKU. |

## 6. What already exists (subscribe; do not reinvent)

| Surface | Landed fact at `91ecc2c` | This brief requires |
| --- | --- | --- |
| Weapon ledger | `src/weapon-source-ledger.js`; `__BM1_PROBE__.weaponLedger`; S22; docs under `docs/weapon-ledger/` | **Subscribe.** Do not rewrite combat numbers or verdicts. |
| Phase 9 matrix | `src/phase9-weapons-matrix.js`; ten columns; Flash-not-lock; no universal bypass | **Read-only.** |
| Live items | `data/game_items.json` `weapons[]` (32 rows) + `tradeGoods` + device knobs | **Read-only.** |
| Station types | `data/station_manifest.json` (36) | **Read-only.** |
| Station placements | `data/stationData.json` (269) | **Read-only.** |
| Hull HTML analog | `docs/ship-balance/REVIEW.html` | Medium analog only. Do not import hull prices as weapon/station locks. |
| Construction visuals | `src/construction-visuals.js`; S24; `CONSTRUCTION_LOCKED_FROM_REMASTERED === false` | **Stay locked.** Catalogs do not draw sites. |
| Repair overlay | PR #18; `shouldDrawRepairOverlay`; types 86 / 87 refuse | **Stay locked.** |
| Utility book | `utilityBook`; Thaleron pass **unverified — not shipped** | Do not ship a pass from a station name. |
| Probe surface | `__BM1_PROBE__.phase9` … `.constructionVisuals` | First S25 is static docs. Do **not** require a new combat probe unless a runtime panel is scoped later. |

**Gap this brief closes (docs now; static HTML only if later scoped):** there is no **scoreable S25 contract** that (a) weapon / station review happens in HTML without Flash as a viewer, (b) pages inspect defs and show Flash vs bake-off without silently fixing them, (c) opening a page never gifts fire or becomes a shop, (d) construction / ledger / EW / boarding stay locked.

## 7. Acceptance exercises (S25 sketch)

Keep Phase 1 / S4–S24 / doctrine / catalog / boarding / Phase 10 / Phase 9.4 / utility / weapon-ledger / empty-armable / construction / side-lane green. **S14 stays Phase 9.** **S22 stays ledger.** **S24 stays construction.** Add **S25** only **after** Tenth scopes a later thin **static HTML** (or docs-generator) slice. IDs are a sketch; do not promise a final count. **This docs PR does not add S25 to the probe and does not add HTML pages.**

Number Three owns the probe gate **after** a later slice, not this brief. For a static `docs/` page set, S25 is primarily an **offline HTML / file-contract** check plus a **src-untouched** preservation replay. In-game Chromium of combat is **not** the S25 Pass.

| Case | Required exercise and result (later S25 only) |
| --- | --- |
| **S25.1** Catalogs are HTML; Flash is not required | `docs/html-catalogs/` contains HTML review pages (index + weapons + stations, names can change) that open in a browser. No SWF / Flash runtime is required. A markdown-only dump **fails** once S25 is scoped. |
| **S25.2** Inspect only; no shop; no live lock | Pages have no Buy / Equip / Dock / restock control. Weapon Flash-price column labeled **source**. `flashPricesAreLiveLocks` (page banner or data attribute) is **false**. No `game_items.json` / station JSON combat or cost writes in the S25 diff. |
| **S25.3** Subscribe + show both + cite ledger | Weapon page lists Canon **7** / Cannon **6** / Turret **12** as three identities; Tractor **25** Device; Sail / Warp Core deferred; inherited extras present with empty Flash price; Plasma **7200** uncertified. Station page lists **36** types. Placement stock ids that lack a live weapon def are **labeled**, not invented, not dropped. Ledger / JSON cited. |
| **S25.4** Opening a page does not gift fire | Static pages do not call game injects. If a later in-game panel exists (out of first S25), opening it writes no `firingSolution` / `engagement_authorized` / culture fire. |
| **S25.5** Landed lanes preserved | Replay S14–S24 / S17 / S18 / S7. Diff does **not** reopen EW / boarding / Phase 10 / flags / ledger / empty-armable / construction. No dockClear / economy-knob / combat-retune / Thaleron-facility / `git am` work. |
| **S25.6** Blind lock false | `HTML_CATALOG_LOCKED_FROM_REMASTERED === false` (page banner, generator constant, or docs flag). No remastered crib. |

Do not claim a Referee Pass from this list.

## 8. Non-goals

This brief will not:

- Implement engine code, ship HTML pages, or attach UI screenshots.
- Require Flash as a viewer.
- Retune damage, cooldown, range, live weapon prices, or station costs / stock / repair rules.
- Treat any Flash number as a live price lock.
- Become a second shop, dock, or loadout editor.
- Silently merge Canon / Cannon / Turret or invent Flash prices for inherited extras.
- Invent Bajoran Sail / Warp Core ids, or merge Warp Core into “Warp Cores.”
- Invent weapon defs for vacant or unknown station-stock ids.
- Gift `firingSolution`, culture fire, or `engagement_authorized`.
- Reopen EW PRs #33 / #35 / #37 / #42 / #43 / #44 / #45, boarding #38 / #39, Phase 10 #40 / #41, flags #46 / #47, ledger #48 / #49, empty-armable #50 / #51, or construction #52 / #53.
- Redo repair arms (PR #18) or construction-site language (PR #53).
- Open dockClear polish or broader economy / difficulty knobs.
- Invent Thaleron Test Facility (place, quest, pin, or pass).
- `git am` remastered patches, or treat remastered DESIGN as engine source.
- Claim a Referee Pass in `docs/BAKEOFF-STATUS.md`.

## 9. Open questions

Mark these clearly. They do **not** weaken the hard gates.

| ID | Question | Default if a later S25 slice is scoped before an answer |
| --- | --- | --- |
| Q1 | One HTML file or a small set (`index` / `weapons` / `stations` / optional `placements`)? | **Small set under `docs/html-catalogs/`.** One file is allowed if all required columns still appear. |
| Q2 | Generated HTML vs hand-authored tables? | **Either.** A generator, if used, **reads** JSON / ledger and **writes `docs/` HTML only**. It must not write `game_items.json` or station runtime. |
| Q3 | Include the 269-row placement catalog in first S25? | **Optional.** Type catalog (36) is enough to inspect defs. If placements ship, vacant / unknown stock ids must be labeled (gate 3). |
| Q4 | In-game review panel (OPS / Inventory / dock)? | **Out of first S25.** Static `docs/` HTML is the natural slice. A runtime panel is a later Tenth-scoped lane and still obeys gates 2–4. |
| Q5 | Search / filter chrome (like hull `REVIEW.html`)? | **Allowed** as page UX. Must not become a shop or a fire inject. |
| Q6 | Flash station prices / descriptions beyond in-repo JSON? | **Not supplied.** Do not invent. Show bake-off fields as current data. |
| Q7 | Rename live id 7 “Disruptor Cannon” → “Disruptor Canon” on the HTML page only? | **No silent fix.** May show Flash identity **and** live name. Live rename remains ledger Q1 / later data slice. |
| Q8 | Broader economy / difficulty knobs, dockClear, combat overhaul? | **Out.** Separate packages. |

## 10. Implementation sequence and handoff

1. **Brief Pass.** Referee / One score the **seven hard gates**. Number 2 scores gates **2 and 4** (inspect ≠ shop ≠ fire token). Number Four scores gates **1 and 3** and the engine/docs half of **5**, plus soft gate **8** as process. Do not open an S25 PR on this document alone.
2. **Tenth scopes** a later thin **static HTML** page set **or** leaves this as docs-only. Blind implement from `docs/html-catalogs/` against bake-off `main` after #53 (`91ecc2c`).
3. **Suggested order if scoped:** HTML pages exist without Flash (S25.1) → no shop / no live lock / no JSON combat writes (S25.2) → subscribe + show both + cite ledger + label vacant stock (S25.3) → no fire gift (S25.4) → preservation replay (S25.5) → remastered-lock false (S25.6). **Do not** retune combat. **Do not** reopen #33–#53.
4. **Number Three** adds/runs S25 after the later slice. Keep S4–S24 green. Do not weaken S14 / S22 / S24 to make S25 pass.
5. Changelog / status Pass wait on Referee after review. This proposal PR may note that the brief is open; it must **not** write a Pass.

## 11. Lanes

| Who | Owns | Scores |
| --- | --- | --- |
| **Number 2** | Doctrine: gates **2, 4** — inspect ≠ shop ≠ lock; opening a page is not FS / culture / `engagement_authorized` | A review page is not a shot and not a market |
| **Number Four** | Docs / later pages: gates **1, 3** (HTML medium; subscribe + show both) plus later S25 file-contract. Must not retune `game_items.json` or reopen EW / boarding / flags / ledger / empty-armable / construction | Pages inspect; Flash vs bake-off both visible |
| **Number Three** | Probe gate **after** a later S25 slice (S25; S4–S24 stay green) | Not this brief |
| **Referee / One** | This brief vs the **seven hard gates** in §2. Gates **5–7** (do-not-reopen + named outs + blind). **Do-not-open** check: no #33–#53 reopen; no dockClear / economy knobs / combat retune / Flash locks / Thaleron facility; no `git am`; **no Referee Pass claimed** from this PR | **Before** any HTML page set or engine PR |

This brief is ready to score when a reader can mark Pass/Fail on: catalogs are HTML and Flash is not required; inspect ≠ retune ≠ lock ≠ shop; ledger + JSON are read-only and conflicts stay visible; opening a page never gifts fire; landed EW / boarding / Phase 10 / flags / ledger / empty-armable / construction not reopened; remastered-lock false and named outs held.

## Sources and precedence

- This brief’s later-slice checklist: `docs/html-catalogs/BM1-HTML-CATALOGS-ENGINE-DEPENDENCIES.md`.
- Planning: `docs/GUIDED-CONVERGENCE.md` §9; `docs/revised-development-plan.md` §16.2 row 9.
- Weapon ledger (subscribe, do not reopen): `docs/weapon-ledger/`; PRs **#48 / #49**; `src/weapon-source-ledger.js`; S22.
- Phase 9 matrix (read-only): `src/phase9-weapons-matrix.js`; `docs/phase9/`; PR **#33**; S14.12–S14.15.
- Live items: `data/game_items.json` at `91ecc2c`.
- Station types / placements: `data/station_manifest.json`; `data/stationData.json` at `91ecc2c`.
- Hull HTML analog (medium only): `docs/ship-balance/REVIEW.html`.
- Construction visuals (stay locked): `docs/construction-visuals/`; PRs **#52 / #53**; S24.
- Side-lane repair (cite, do not redo): `docs/side-lane-repair-reman-independence/`; PR **#18**; types 86 / 87 never repair.
- Empty-armable (do not reopen): `docs/empty-armable/`; PRs **#50 / #51**; S23.
- Flags/passes (do not ship Thaleron): `docs/flags-passes/`; PRs **#46 / #47**.
- EW locked: `docs/phase9/`; PRs **#33 / #35 / #37 / #42 / #43 / #44 / #45**; S14–S20.
- Phase 10 locked: `docs/phase10/`; PRs **#40 / #41**; S18.
- Boarding locked: `docs/boarding/`; PRs **#38 / #39**; S17.
- Remastered engine / DESIGN: **out of bounds.** Not a patch source. Not a constant lock. Not `758665e`.
- Bake-off process: `docs/BAKEOFF-STATUS.md` (this PR may note the HTML-catalogs brief is open; **no Pass claimed**; #33–#53 remain locked).

Settled Phase 1–10 behavior, Phase 9–9.4 gates, PR #33 / #35 / #37 / #38 / #39 / #40 / #41 / #42 / #43 / #44 / #45 / #46 / #47 / #48 / #49 / #50 / #51 / #52 / #53, and these seven hard gates take precedence over older handoff text that treated Flash as the required reviewer, treated a review table as a shop, or silently merged Flash vs bake-off defs.
