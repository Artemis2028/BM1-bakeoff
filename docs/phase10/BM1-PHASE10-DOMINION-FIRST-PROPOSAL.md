# BM1 Phase 10 — Dominion-first (hidden campaign + pack gates)

**Status:** proposal for implementation; no engine changes made by this document.  
**Repository:** `Artemis2028/BM1-bakeoff`  
**Planning baseline:** `de1f857` on `main` (15 September 2026), after boarding-capture engine (PR #39).  
**This is a Phase 10 brief, Dominion-first.** It does **not** open the full faction roster (Independent, Ferengi, Vulcan, …) as playable content. Plan §4 Phase 10 is “wider faction content, rare commanders and Dominion operations”; this slice takes **only** the Hidden Dominion campaign plus live pack spawn/purchase gates.  
**Referee context:** Phase 4 engine §6 **Pass** on `7f926df`. Phase 9 engine (PR #33), Phase 9.1 engine (PR #35), and Phase 9.2 engine (PR #37) are the **locked** EW/weapons baselines. Boarding brief (PR #38) and boarding engine (PR #39) are the **locked** prize/command-transfer baselines. **Keep #33, #35, #37, #38, and #39 Pass locked.** Do **not** reopen EW or boarding. This brief does **not** claim a new Referee Pass, does **not** reopen Phase 6 layers or Phase 6.5 generation, and does **not** reopen Phase 4/5 delivered reports or kill-standing tokens.  
**Companion:** `docs/phase10/BM1-PHASE10-ENGINE-DEPENDENCIES.md` (hooks, risks, probe plan).  
**Scoped by:** Tenth Mountain Trooper, 2026-09-15 — proposal first; no engine until Tenth scopes after a brief Pass. Room-locked hard gates (stories = knowledge layers; hidden wider Dominion; faction paths ≠ ROE injects; pack spawn/purchase gates; staged campaign shape; compartmented covert knowledge; preserve EW + boarding) are **in** this one scoreable brief.

Phases 1–9.2 and boarding already landed: political authority, two-mode ROE, holding zones, incident ledger / FLASH, persistent convoy/`asset_overdue`, sensors/cloak + power suites, fleet hold-outside, compact finite markets, catalog wire + standing tiers, Phase 9 EW on the reserved `ew` consumer with ghosts as contact-book rows, a read-only weapons matrix, closed fire gates, Phase 9.1 spend-to-suppress / burn-through / residue-before-void / RSS / HoJ / transponder claim, Phase 9.2 lobes / escort ECCM / spoof catch / comms-delay / heat / decoys / silent-running / dock-fit, and boarding capture XOR scuttle / command transfer (`BOARDING_IMPLEMENTED === true`; `tractorIsBoarding() === false`; away-team XP `not_tracked_yet`). Convergence §10 and plan §12 named the remaining Dominion gap: pack `dominion-all` / `dominion-core`, reserved Gorn, mission-only major threats, and a **hidden** wider Dominion campaign. This brief is that gap, **Dominion-first**.

This is **one** connected Dominion-first surface: Blender remnant stays playable and isolated; the distant Dominion region stays **hidden until discovery earns it**; rumor → corroborating evidence → contact are **knowledge / objective layers**, not fire permission; live spawn/purchase must respect pack region gates; a staged campaign may later reach procurement, coordinated fronts, and supplied occupation or withdrawal **without** instantly conjuring an invasion from opponent weakness. Magnitudes, discovery clocks, and invasion odds stay **injectable / TBD**. It is not a remastered `git am`, not a full-roster Phase 10, not a reopen of EW or boarding, and not permission to invent locked discovery percentages.

## 1. The result we want

The player (and NPCs) can **learn** that a wider Dominion exists, **without** being gifted a lock, a war, or a map of Gamma. Blender remains a scarce remnant start. Distant Dominion systems, labels, route previews, and tooltips stay dark until a named discovery write. Pack helpers already know `dominion-all` vs `dominion-core` vs `reserved-gorn` vs `mission-only`; live traffic and yards must **obey** those helpers. A campaign that later prepares an invasion consumes **finite** assets (plan §10 table) and can be exposed, delayed, sabotaged, or abandoned. Ordinary captains do not inherit secret Breen/Cardassian arrangements.

**Exit condition (plan §4 Phase 10, Dominion-first):** persistent Dominion stories and supplied campaigns respond to player and NPC **knowledge and logistics**, not to a debug spawn flag. Full roster paths and rare commanders stay **out**.

**Proposed first-release decisions:**

| Question | Proposed answer |
| --- | --- |
| What is the first playable slice? | Dominion-first: hidden wider region + pack spawn/purchase gates + rumor→evidence→contact knowledge layers. Campaign stages **beyond contact** exist as an injectable **shape** (procurement / access prep / fronts / occupation-or-withdraw). Magnitudes / timing / odds **TBD**. |
| Where do campaign facts live? | A compact `state.dominionBook` (name can change) **outside** `systemStates`, keyed on observer / agreement / operation ids — **not** on recycled `npc.id`. Discovery earned by an observer is **that observer’s** knowledge. **Never** as a fake `npcShips` fleet in Alpha. **Never** inside `systemStates`. |
| What is a “story”? | A **knowledge / objective layer** (rumor, corroborating evidence, authenticated contact, later operation assignment). Not a gifted `firingSolution`. Not culture fire. Not `engagement_authorized`. |
| Does a Dominion / Blender start reveal Gamma? | **No.** Map labels, route previews, wormhole destination chrome, and tooltips for the distant region stay hidden until discovery earns them. Starting `playerFaction === 'dominion'` does **not** auto-reveal Dominica / Founders Watch / JemHadar Relay / etc. |
| Do faction paths change ROE / fire permission? | **No.** Different objectives via roles, knowledge, and constraints. Two-mode Phase 2 ROE stays. `engagement_authorized` is still computed from the selected role’s permitted modes (doctrine), never injected by campaign stage. |
| Must live spawn/purchase respect pack regions? | **Yes.** `dominion-all` / `dominion-core` / `reserved-gorn` / `mission-only`. Empty legal pool stays empty. No ambient Dominion core / Battleship as ordinary traffic. `authorizedDeployment` is a **real operation** flag, not `role === 'fleetAttack' \|\| role === 'mission'`. |
| Can opponent weakness instantly spawn an invasion? | **No.** Opportunity, not conjuration. Prep consumes finite assets (plan §10). Can be exposed / delayed / sabotaged / abandoned. |
| Do ordinary captains know secret pacts? | **No.** Breen/Cardassian covert arrangements (if mentioned) are scoped agreements. Compartmented. |
| Full Independent / Ferengi / Vulcan / … roster paths? | **Out.** Later Phase 10 follow-on. |
| Rare recurring commanders? | **Later** sketch only (§16). Not playable in this brief. |
| Locked discovery % / invasion odds? | **Do not invent.** Injectable / TBD. |
| May we reopen EW / boarding / #33 / #35 / #37 / #38 / #39, or crib remastered? | **No.** Blind bake-off: `docs/` only. |

These are recommendations for this Dominion-first package, not new decisions attributed to the user. Locked bake-off constraints take precedence over older flavor that treated the Gamma map as always labeled, a Dominion start as omniscient, `authorizedDeployment` as a debug default, rumor as a firing solution, or opponent weakness as an instant invasion.

Cite plan §4 Phase 10, plan §10 table, plan §12 Hidden Dominion campaign, and `docs/GUIDED-CONVERGENCE.md` §10 as the planning sources this brief **reconciles**, not as a second spec:

| Planning source | This brief |
| --- | --- |
| Plan §4 Phase 10: wider faction + rare commanders + Dominion operations | **Dominion-first.** Full roster and rare commanders **deferred**. |
| Plan §10 table: finite stock/demand; embargoes/licenses; fleet costs; conquest garrison/supply/reconstruction/stabilization | Gate 5: prep consumes **finite** assets. Occupation is a **responsibility**. Do not reprint free invasion fleets. |
| Plan §12: factions differ via roles/knowledge/constraints, not just hails; civilian ≠ empire military permissions | Gates 1 and 3. |
| Plan §12 table: Dominion Remnant / Blender — scarce supplies, local survival, autonomy, choices about the wider Dominion | Gate 2: remnant stays playable and isolated. |
| Plan §12 Hidden Dominion campaign: hide region (labels, route previews, tooltips); start as Dominion must not auto-reveal; staged rumor→…→occupation/withdrawal; weakness ≠ invasion; finite prep; covert Breen/Cardassian scoped; discovery timing / map UX / undiscovered-can-act **open** | Gates 2, 5, 6 + §14 open questions. |
| GUIDED-CONVERGENCE §10: `dominion-all` / `dominion-core`; reserved Gorn; mission-only; Battleship not ambient; authorized flags must be real operations | Gate 4. |
| Doctrine: two Dominion profiles share runtime key `dominion`; `engagement_authorized` never injected by world state | Gates 1, 3; remnant vs central profile selection. |
| Catalog wire PR #28: pack helpers exist; live `currentCatalogSpawnContext` still sets `authorizedDeployment` from role | Gate 4 closes the debug default. |

## 2. Locked constraints (do not reopen)

The bake-off room locked these before this brief. Implementation and probes must treat them as **hard gates**. Referee / One score this brief against these **seven** **before** any engine PR. EW / boarding gates stay **closed**; they are restated only as **gate 7** (preserve), not as a reopen.

### Hard gate 1 — Stories are knowledge / objective layers

> Rumor → corroborating evidence → contact (and further stages) must **not** gift `firingSolution`, culture fire, or `engagement_authorized`. They cannot rewrite Phase 1 side, Reman unlock, or `playerFaction` / `playerSide`. An old report is not a live lock. A campaign stage is not a weapons-free token.

Lane owner (wording): **Number 2**.

Phase 6 already separates detection ≠ identification ≠ track quality ≠ `firingSolution`. Phase 4 already separates simulation truth from observer evidence. Doctrine already forbids injecting `engagement_authorized` from world state. This brief **subscribes**. A rumor is a **fact an observer holds** (low confidence, named provenance). Corroborating evidence is a **second independent** fact. Contact is an **authenticated** campaign fact (doctrine: remnant “assess contact with the wider Dominion”). None of those writes `consultDoctrineFire` extras. None of those stamp culture-as-empire. Capturing a Jem’Hadar prize (boarding #39) still does not gift a lock or rewrite Reman **53**.

### Hard gate 2 — Hidden wider Dominion

> The Blender remnant stays **playable and isolated**. The distant Dominion region stays **hidden until discovery earns it**. **Blender / Dominion start must not auto-reveal** the distant region — including map labels, route previews, and tooltips. Two doctrine profiles share runtime key `dominion`; sharing the key is **not** sharing the map.

Lane owner (wording): **Number 2** on knowledge bounds; **Number Four** on map / spawn / tooltip hooks.

`data/mapnames.json` already lists Dominica, JemHadar Relay, Karemma Exchange, Founders Watch, Dosi Gate, T-Rogoran Annex. `data/planetData.json` already describes Dominica as “Gamma Quadrant, home to the dreaded Dominion.” `src/main.js` already hard-wires `WORMHOLE_DOMINION_SYSTEM_NAME = 'Dominica'` and a Bajora↔Dominica wormhole. Those are **leaks until gated**. First slice must make undiscovered distant systems **unsayable** in map chrome, plotted-route labels, wormhole destination lists, and planet-description tooltips **for observers who have not earned them**. Blender itself remains a legal, labeled start. Isolation means remnant traffic/yards stay remnant (`dominion-all` blender routine IDs), not core.

### Hard gate 3 — Faction paths are not ROE injects

> Different Dominion (and, later, other-faction) objectives arrive through **roles, knowledge, and constraints**, not through alternate fire permission. Phase 2 two-mode ROE stays. Access is still a permission, not a ceasefire. A remnant merchant does not inherit central-command strike modes. Culture cannot grant fire. Pack `protect` still folds to `record_only`.

Lane owner (wording): **Number 2**.

Plan §12: “Give factions different objectives through roles, knowledge and constraints—not just different hails.” A civilian merchant must not inherit all its empire’s military permissions. Selecting `dominion_central` vs `dominion_remnant` changes **priorities and assignments**, not `playerForceMayAutoEngage` and not a gifted `engagement_authorized`. Hostility / warFlag still is not enough under `return-fire`.

### Hard gate 4 — Pack spawn / purchase gates are live

> Live wiring must respect `dominion-all` / `dominion-core`, **reserved Gorn** (no routine generation), and **mission-only** major threats. No ambient Dominion **core** hulls or **Battleship** as ordinary traffic. Authorized invasion/mission flags must be **real operations**, not debug defaults. An empty legal `spawnPool` stays empty. Do **not** recreate a Gorn state from a leftover name pool.

Lane owner (wording): **Number Four**.

Pack already encodes this (`bm-ships/catalog.mjs` `regionAllows` / `eligibleForSpawn`; `integration-rules.json` `dominion.blenderRoutineIds` 206, 322; Battleship `trafficEligible: false` even in core). Catalog wire (PR #28) calls those helpers. The load-bearing bug this brief names: `currentCatalogSpawnContext` today sets `authorizedDeployment: role === 'fleetAttack' || role === 'mission'`. That is a **debug default**. Gate 4 requires `authorizedDeployment === true` only when a named operation on `dominionBook` (or an authored mission record) is **live**. Ordinary Earth traffic must not spawn Dominion core hulls. `spawnPool(..., 'gorn')` remains `[]`. Mission-only (e.g. Tactical Cube 261) requires `role === 'mission'` **and** authorized deployment.

### Hard gate 5 — Staged campaign shape; weakness ≠ invasion

> Campaign shape is locked and **injectable** in magnitudes/timing: rumor → corroborating evidence → contact → procurement / access prep → coordinated fronts → supplied occupation **or** withdrawal. Opponent weakness creates **opportunity**; it must **not** instantly conjure an invasion. Preparation consumes **finite** assets (plan §10 table) and can be **exposed, delayed, sabotaged, or abandoned**.

Lane owner (wording): **Number 2** on stage semantics; **Number Four** on inject / finite-asset hooks.

Doctrine “The wider Dominion's operation” already lists reconnect / partners / conceal prep / access / coordinate fronts / consolidate-or-withdraw. This brief **does not invent percentages**. First slice may **inject** stage (`rumor` | `evidence` | `contact` | `procurement` | `access_prep` | `fronts` | `occupation` | `withdraw` | `abandoned`) so S18 can score writes without a chance table. A low Earth/Klingon strength snapshot must **not** call `authorizedDeployment = true` by itself. Procurement subscribes to Phase 8 `marketBook` (finite stock) and fleet/holding costs — do not mint a free Battleship fleet. Occupation subscribes to Phase 8 garrison/supply/reconstruction/stabilization — do not treat a won fight as free income.

### Hard gate 6 — Compartmented covert knowledge

> Breen/Cardassian covert arrangements (if mentioned) require **scoped agreements**. Ordinary captains do **not** inherit secret campaign knowledge. Phase 1 already removed static Breen–Dominion friendship both ways; this brief does **not** restore a blanket alliance. A shipment order need not disclose the invasion it supports.

Lane owner (wording): **Number 2**.

Doctrine: informed Cardassian command may support hidden preparation; an ordinary merchant does not know the conspiracy. Breen: a secret treaty can involve informed command while ordinary captains remain guarded. Knowledge is **per actor** (or per named agreement roster), not per `runtimeFaction`. Delivering a Phase 4 report to “the Cardassians” does **not** brief every Cardassian freighter. `state.playerFaction` is not a pact. Starting Breen or Cardassian does **not** auto-grant Dominion campaign facts.

### Hard gate 7 — Preserve EW + boarding

> Tractor ≠ board. Capture XOR scuttle. Prize credit explicit (capture ≠ kill cascade; no double-charge). Ghosts book-only. No report wipe. No gifted FS / `engagement_authorized` from EW. Away-team XP stays `not_tracked_yet` until a later boarding inject. **#33, #35, #37, #38, and #39 stay locked.** This brief does **not** retune weapons, flip `tractorIsBoarding`, or reopen S14–S17 except to **replay** them.

Lane owner (wording): **Referee / One** (do-not-open check). Number 2 scores fire-gate / report / compartmentation preservation. Number Four scores spawn hooks that must not bypass boarding reach or EW books.

Cite Phase 9 gates, 9.1 gates, 9.2 gates, and boarding’s eight gates as **already locked**. This brief **subscribes**. A Dominion rumor is not a ghost hull, not a decoy, not a prize, and not a boarding warrant. An invasion fleet, when later authorized, is still ordinary hulls under Phase 6 layers and boarding ≤10%.

### Also from the plan / room (score with the gates; not an eighth religion)

| Plan / room want | How this brief locks it |
| --- | --- |
| Stories = knowledge / objective layers; no gifted FS / culture / `engagement_authorized`; no Phase 1 rewrite | Gate 1. |
| Hidden wider Dominion; Blender isolated; start must not auto-reveal | Gate 2. |
| Faction paths ≠ ROE injects | Gate 3. |
| Pack `dominion-all` / `dominion-core`; reserved Gorn; mission-only; no ambient core / Battleship; authorized flags are real ops | Gate 4. |
| Staged rumor→…→occupation/withdrawal; weakness ≠ invasion; finite prep; can fail | Gate 5. |
| Compartmented Breen/Cardassian knowledge | Gate 6. |
| Preserve EW + boarding; #33/#35/#37/#38/#39 locked | Gate 7. |
| Discovery timing / undiscovered-can-act / map UX | §14 open questions. Defaults do **not** weaken gates 1–2. |
| Screenshot / no-clip | Process lock; later engine. |

### Must not break (cite landed work)

Score these as **preservation**. A Phase 10 Pass that regresses them is a Fail. **#33, #35, #37, #38, and #39 stay locked.**

| Locked rule | Cite | Phase 10 must not |
| --- | --- | --- |
| Detection ≠ identification ≠ track quality ≠ `firingSolution`. An old report is not a live lock. | Phase 6 hard gate 2; Phase 9 gate 2; boarding gate 7 | Gift FS from rumor, evidence, contact, map reveal, or wormhole chrome. Seed a lock from a Dominion tooltip. |
| Hidden stays hidden. Lost tracks drop exact targeting same tick. | Phase 6 gates 3–4 | Leak Dominica / Gamma labels to an observer who has not earned discovery. Keep `combatTargetId` because “the campaign knows.” |
| Culture cannot grant fire. `engagement_authorized` never injected. | Phase 1 / doctrine; Phase 9 gate 5; `consultDoctrineFire` | Write the fact from campaign stage, remnant vs central profile, or a pact. |
| Pursuit ≠ permission ≠ per-weapon gate | Phase 1; Phase 9 gate 5 | Treat contact or invasion-stage as weapons-free. |
| Two-mode ROE; access ≠ ceasefire | Phase 2 | Add a third Dominion ROE. Auto-engage because `dominionBook.stage === 'fronts'`. |
| Checkpoint refusal / inability are not aggression | Phase 3 / 4 | Turn a hidden-region refuse or “you have not discovered this” into `attackId` / fire. |
| Punishment tokens; standing once | Phase 4 §8; S6.4 | Charge standing from a rumor. Double-charge a later invasion kill already tokenized. |
| FLASH append-only; no second offense pulse | Phase 4 §7.3; S6.14 | Pulse FLASH as “Dominion exists” unless a **new** FLASH-eligible incident actually opened. Rumor default is **not** FLASH. |
| Overdue ≠ destroyed ≠ attacker | Phase 5; S8 | Treat a missing Gamma rumor as `destroyed`. Invent `attackerId` from a rumor. |
| Ghosts are book rows only; decoys ≠ hulls | Phase 9 gate 2; 9.2 gate 5 | Spawn a rumor hull. Prize a ghost as “Dominion contact.” |
| Tractor stays a device slot; boarding XOR / ≤10% / capture ≠ kill | Boarding #38/#39; `tractorIsBoarding() === false` | Tractor-as-capture. Capture-as-`destroyNpcShip`. Gift boarding reach from campaign knowledge without detection. |
| Away-team XP `not_tracked_yet` | Boarding gate 8 | Invent an XP table because the campaign “needs heroes.” |
| Catalog wire: 172 active, 38 aliases, Reman **53** | PR #28; S11 | Resurrect discarded IDs. Grant Reman unlock because a Dominion prize is 53. Rewrite `playerFaction` from remnant/central profile. |
| Empty legal spawn pool stays empty | GUIDED-CONVERGENCE §7 / §10; `catalog.mjs` | Fallback into reserved Gorn or unknown regions. |
| Phase 7 standing orders persist | PR #29; S12 | Silently supersede `hold_outside` because a campaign tick ran. |
| Phase 8 markets subscribe-only; money ≠ standing ≠ Reman | PR #31; S13 | Restock Gamma yards from a rumor. Sell hull 65 at Blender. Embargo-as-fire. |
| Repair arms / `repairCapable` | Side-lane PR #18 | Repair overlay from campaign stage. |
| Independence / concessions | Side-lane; Phase 1 | Retitle stations because a rumor landed. Gift system control with discovery. |
| EW spend-to-suppress / residue-before-void / lobes / claim-only spoof | #33 / #35 / #37 | Reopen EW. Treat silent-running as cloak-void that hides a whole quadrant. |

Also preserve, without reopening:

- Authority is a political side (`isSystemControlled`), not a flown flag.
- Phase 1 combat credit: only `player` / `playerEscort` final hits reward or blame.
- Arrival protection is personal; it must not delete hostile fleets or rewrite ownership.
- Breen and Dominion have **no** static alliance in Phase 1.
- Phase 6 first-frame cloak, purposeful destinations, arrival/spacing/exit stay closed.
- Phase 6.5 generation / passive-vs-active / paid suites / reserved `ew` stay closed.
- Soft authored breakaway profiles stay **out**.
- Boarding APIs stay as landed (`BOARDING_IMPLEMENTED` true; tractor not board; XOR writer; capture token).

### Process locks (implementation locks, not a change to gates 1–7)

- **Proposal first.** Do not implement from this text until Tenth scopes the engine lane after a brief Pass.
- **Blind bake-off.** Implement against bake-off `main` (**this** head after #39, `de1f857`), **not** remastered. Implement from `docs/` only. Do **not** crib `Artemis2028/BM1-remastered-work`.
- **No invented discovery % or invasion odds as locked constants.** Stage *shape*, knowledge *layer caps*, pack *region forbids*, map-hide *forbids*, fire-gate *forbids*, and finite-prep *forbids* are locked. Clocks, rumor rates, invasion odds, and procurement magnitudes are **TBD / injectable**.
- **#33, #35, #37, #38, and #39 stay locked.** A PR that reopens EW gates, regresses S14–S17, or “fixes” hidden Dominion by making tractor a capture **fails** this brief even if pack pools are green.
- **Subscribe, do not fork.** Campaign writes call existing Phase 4 `openIncident` / `deliverReport` (new sends only), Phase 5 close-once, Phase 6 contact layers (rumor ≠ FS), Phase 8 `marketBook` / holding obligations, catalog `spawnPool` / `getPurchaseDecision` / `catalogSpawnContext`, doctrine profile selection (`dominion_remnant` vs `dominion_central` sharing key `dominion`). Do not implement a second incident ledger, a second standing religion, a second catalog, or a second contact book.
- **§13 saved timers:** campaign clocks use `localElapsedMs` / completed strategic jumps as declared. Do not persist `performance.now()` as a discovery deadline.
- **Screenshot / no-clip process lock continues** for a later engine PR (1280×720; `clippedControls: []`; dock-clear). This docs PR does **not** attach those PNGs. See §10.
- **No Pass claimed** in `docs/BAKEOFF-STATUS.md` from this PR.
- **Dominion-first, not full roster.** Do not title, store, or implement this as Independent / Ferengi / Vulcan / Romulan / … playable paths.

## 3. Knowledge layers (gate 1)

**Lane owner (wording):** Number 2.

### 3.1 Rumor, evidence, contact are not shots

| Layer | What it is | What it is not |
| --- | --- | --- |
| **Rumor** | Observer-held fact, low confidence, named provenance (hail, barter, recovered fragment, overdue *report* about a missing patrol). | Live detection. Map pin of Dominica. `firingSolution`. FLASH by default. `engagement_authorized`. |
| **Corroborating evidence** | A **second** independent fact that raises confidence (another observer’s delivered report, recovered cargo that actually exists, a scan the actor paid for). | Omniscience. Gifted identification-known. Culture fire. Phase 1 rewrite. |
| **Contact** | Authenticated campaign fact: remnant (or another briefed actor) has usable contact with wider Dominion command. Doctrine: `assess_contact_with_wider_dominion`. | Automatic map reveal of the whole Gamma set (that is a **separate** discovery write under gate 2). War declaration. Weapons-free. Reman unlock. |
| **Later stages** | Assignments / operations on `dominionBook` (procurement, access prep, fronts, occupation, withdraw). | Debug `authorizedDeployment` on every `fleetAttack` role. Instant fleet mint. |

Suggested observer row (names can change):

```js
{
  observerKey: 'player',            // or npc securityInstanceId / command id
  subject: 'wider_dominion',
  layer: 'rumor' | 'evidence' | 'contact',
  confidence: 'low' | 'corroborated' | 'authenticated',
  provenance: 'report' | 'direct' | 'recovered' | 'briefing',
  firingSolution: false,            // hard
  engagement_authorized: undefined, // hard — must remain absent
  mapRevealed: false,               // contact does not imply Gamma labels
  playerFactionUnchanged: true
}
```

Phase 6 `seedFromReport` is already area-only, FS false. Campaign rumor **may** seed a last-known **area** only if the report actually contained a usable location the observer received. A rumor with no coordinates seeds **no** map pin.

### 3.2 What knowledge must not do

- Rewrite `state.playerFaction` / `playerSide` / Reman **53**.
- Call `applyKillStanding` because someone heard a rumor.
- Raise contact-book layers past what sensors / burn-through actually earned.
- Authorize boarding of a hull that is not detected and legally reached (boarding gate 7 stays).
- Treat culture id `blender_remnant` as empire fire.

Player-facing lines (names can change):

- `Rumor only. Not a firing solution, not a map.`
- `Corroborating evidence. Still not engagement authorized.`
- `Authenticated contact with wider Dominion. Distant region remains hidden until discovery.`

If the UI says “weapons free because you heard a rumor” or “identity rewritten to central Dominion,” the family is not ready.

## 4. Hidden wider Dominion (gate 2)

**Lane owner (wording):** Number Four on chrome; Number 2 on “earned vs start.”

### 4.1 What stays visible

| Always sayable | Hidden until discovery earns it |
| --- | --- |
| Blender as a start / remnant holding | Dominica, JemHadar Relay, Karemma Exchange, Founders Watch, Dosi Gate, T-Rogoran Annex, and other Gamma/core names in `WORMHOLE_ISOLATED_SYSTEM_NAMES` |
| Remnant hulls legal at Blender (`dominion-all` blender routine) | Core-only hull names in Blender yards (48, 65, 216, 238) |
| That the player started as Dominion **remnant** (side identity) | Distant map labels, route previews that name hidden systems, wormhole destination chrome that names Dominica, planet-description tooltips that dump “home to the dreaded Dominion” |

Discovery is **per observer**. NPC remnant command may hold contact without the player seeing Gamma labels. The player may hold a rumor without remnant command treating it as authenticated.

### 4.2 Start must not auto-reveal

Fixtures that **fail** if they leak:

1. New game, start faction Dominion, current system Blender: map/tooltip/route-preview snapshot has **no** Dominica / Founders Watch / JemHadar Relay / … labels.
2. Same start: `getDefaultWormholeDestinationIndex` / wormhole destination options must **not** prefer or name Dominica to that observer.
3. Start faction Ferengi (or Earth, Klingon, …): same hide. Visiting Blender still does not dump Gamma chrome.
4. `playerFaction === 'dominion'` must **not** flip `mapRevealed` on load.

Exact hide UX (fog, unnamed node, omitted node) is **Q3**. Default if scoped before an answer: **omit labels and sayable names**; do not show a tooltip that names the Dominion. A later engine screenshot must prove the hide (**§10**).

### 4.3 What reveal may do (after a named write)

A **discovery write** (injectable; not the same as rumor) may reveal **that observer’s** labels / route names / descriptions for the systems the write lists. It still does **not**:

- Gift `firingSolution` on hulls in those systems.
- Gift `engagement_authorized`.
- Transfer system control or concessions.
- Authorize core hull spawn in Alpha traffic.
- Reveal systems the write did not list (no galaxy dump from one pin).

## 5. Faction paths ≠ ROE injects (gate 3)

**Lane owner (wording):** Number 2.

| Path (this brief) | Objectives via | Must not |
| --- | --- | --- |
| **Dominion remnant / Blender** | Survive, secure supplies, protect Blender, assess contact; later cooperate / reunify / autonomy / resist as **assignments** | Inherit central invasion fire modes. Auto-reveal Gamma. Gift FS. Rewrite Phase 1. |
| **Wider Dominion** (NPC / later player contact) | Reconnect, partners, conceal prep, access, fronts, occupy-or-withdraw — **if** logistics and knowledge support it | Instant invasion from weakness. Blanket Breen alliance. Civilian traffic as warships. |
| **Other factions (not playable Phase 10 content)** | Remain doctrine `dominionStory` flavor until a follow-on brief | Implement Ferengi brokerage / Vulcan mediation / Independent refuge as this PR’s engine. |

`consultDoctrineFire` / `liveFireFactsFromEw` still **delete** `engagement_authorized`. Campaign helpers must **not** pass that extra. Phase 2 `return-fire` vs `defend` unchanged. A remnant captain under `return-fire` still needs attributable attacks (or the matching raid) — “we are Dominion” is not enough.

## 6. Pack spawn / purchase gates (gate 4)

**Lane owner (wording):** Number Four.

### 6.1 Pack rules to wire, not reinvent

| Rule | Pack fact | Live engine must |
| --- | --- | --- |
| `dominion-all` | Blender / Dominica / `region === 'dominion-core'` / authorized invasion or mission | Blender remnant traffic: blender routine (30, 206, 322) **yes**; core-only **no** |
| `dominion-core` | Dominica / core / authorized | Not Earth traffic. Not Blender yards for 48, 65, 216, 238 |
| `reserved-gorn` | `regionAllows` false; `spawnPool(..., 'gorn')` is `[]` | Stay empty. No name-pool recreation of a Gorn state |
| `mission-only` | `role === 'mission'` **and** `authorizedDeployment` | Tactical Cube 261 and similar never ambient |
| Dominion Battleship (65) | No ambient even in core; mission/authorized | Not ordinary Dominica patrol; not Blender stock |
| Empty pool stays empty | `spawnPool` does not fallback | No “pick a random hull because the pool was empty” |

`bm-ships/validate.mjs` already asserts Blender ≠ cruisers/battleships and Gorn reserved. S11 catalog wire asserts `gorn-pool-empty` and `mission-only-not-ambient`. This brief **extends** that to **live** `createNpcShip` / yard stock / `currentCatalogSpawnContext`, not only the helper.

### 6.2 `authorizedDeployment` is an operation, not a role

Today (`main` @ `de1f857`):

```js
authorizedDeployment: role === 'fleetAttack' || role === 'mission'
```

That **fails** this gate. Required:

```js
authorizedDeployment:
  role is 'fleetAttack' or 'mission'
  AND dominionBook (or authored mission) has a live operation
      whose id authorizes this spawn / purchase
```

Probes inject `{ operationId, authorizedDeployment: true }` and fail setup if the helper treats every `fleetAttack` as authorized. Debug cheats, if any, must be **off** in the snapshot (`debugAuthorizeAllDeployments: false`).

### 6.3 Purchase

Blender yards: remnant-legal hulls only (`getPurchaseDecision` region refuse for core). Dominica yards (once revealed / actually present for that observer): core hulls may stock **without** becoming Earth stock. Credits still ≠ standing ≠ Reman (Phase 8 / catalog wire). Selling 65 at Blender **fails**.

## 7. Staged campaign shape (gate 5)

**Lane owner (wording):** Number 2 on semantics; Number Four on inject / logistics.

### 7.1 Shape locked; numbers not locked

| Stage | Dominion objective (doctrine) | Player / NPC can change it | Finite-asset hook |
| --- | --- | --- | --- |
| Rumor | Something is out there | Ignore, investigate, sell the rumor | None (knowledge only) |
| Corroborating evidence | Command evaluates what it **knows** | Intercept reports, plant false evidence | Search consumes time / capacity (Phase 5 / 6) |
| Contact | Authenticated link remnant ↔ wider | Help, oppose, negotiate, stay independent | Comms may be delayed (9.2); not unsent FLASH |
| Procurement / access prep | Fund ships, stores, staging, wormhole access | Expose traces, sabotage deliveries, deny transit | Phase 8 stock / fleet costs; no free reprint |
| Coordinated fronts | Commit when **both** fronts have sustainable readiness | Expose Blender force; starve supplies; break an ally | `authorizedDeployment` only with a live operation |
| Supplied occupation **or** withdrawal | Hold territory **and** supply it, or leave | Resistance, overextension, broken routes | Phase 8 garrison/supply/reconstruction/stabilization |

Inject:

```js
injectDominionStage({
  stage: 'rumor' | 'evidence' | 'contact' | 'procurement' | 'access_prep' | 'fronts' | 'occupation' | 'withdraw' | 'abandoned',
  weaknessOpportunity: false,   // may be true; must not auto-authorize
  authorizedDeployment: false
})
```

Invariant: `weaknessOpportunity === true` **does not** imply `authorizedDeployment === true` or `stage === 'fronts'`. A path that stamps fronts because Earth hull count is low **fails**.

### 7.2 Failure modes are first-class

| Failure | Write | Must not |
| --- | --- | --- |
| Exposed | Stage may stall or drop; optional Phase 4 incident (default FLASH: no) | Auto-war. Gift FS to every Earth patrol |
| Delayed | Clock continues on declared strategic/tactical clock | Instant catch-up spawn |
| Sabotaged | Finite stores decrease; operation may `abandoned` | Free replacement fleet (Phase 5 close-once / no free replacements) |
| Abandoned | Terminal; `authorizedDeployment` clears | Leave ambient core hulls in Alpha as leftovers |

### 7.3 Player-facing lines

- `Opponent weakness is opportunity — not an invasion order.`
- `Preparation consumes stores. This operation can be exposed, delayed, sabotaged, or abandoned.`
- `No authorized deployment. Pack spawn stays remnant / local.`

## 8. Compartmented covert knowledge (gate 6)

**Lane owner (wording):** Number 2.

Phase 1: Breen and Dominion have **no** static alliance. This brief may **mention** covert arrangements as a **possible** later agreement, not as a starting friendship.

| Who | May know | Must not inherit |
| --- | --- | --- |
| Named agreement roster (scoped `agreementId`) | The facts the agreement lists | Galaxy-wide Cardassian/Breen omniscience |
| Ordinary captain of that faction | Cargo orders, local ROE, what they detected / were told | Invasion plan, Dominica labels, `authorizedDeployment` |
| Player starting Breen or Cardassian | Phase 1 identity only | Auto-brief of `dominion_breen_pact` / `dominion_cardassian_pact` |
| Player starting Dominion remnant | Remnant priorities; **not** central secret plan; **not** Gamma map | `dominion_central` command authority from species/hull |

Doctrine JSON already has `dominion_breen_pact` / `dominion_cardassian_pact` as **disabled** scenario treaties in Phase 1. First slice may leave them **inactive** (`agreementsLive: false`) and still pass gate 6 by proving ordinary captains do not hold those facts. Activating a pact is a **later inject** that still must be scoped (named participants, not `runtimeFaction`).

Player-facing:

- `Ordinary captains do not inherit secret campaign knowledge.`
- `No static Breen–Dominion alliance. Any pact is a scoped agreement.`

## 9. Preserve EW + boarding (gate 7)

**Lane owner (wording):** Referee / One on do-not-open; Number Four on hooks that must not collide.

Replay, do not rewrite:

| Family | Locked fact |
| --- | --- |
| EW #33 / #35 / #37 | Ghosts book-only; jamming cannot unsend delivered reports; residue-before-void; lobes; escort share ≠ FS; catch ≠ Phase 1; decoys ≠ hulls; silent ≠ cloak |
| Boarding #38 / #39 | ≤10% hull; capture XOR scuttle; tractor ≠ board; prize credit; identity; reach/detection; XP `not_tracked_yet` |
| Fire | `consultDoctrineFire` deletes `engagement_authorized` |

Dominion campaign must **not** implement “board the rumor,” “tractor the wormhole,” or “jam away the Gamma map.” Hidden-region hide is **knowledge chrome**, not cloak-void and not an EW family.

## 10. Controls and screenshot / no-clip

**Lane owner (wording):** Number Four. Copy can wait.

Exact widget names can change. If the control cannot say **why a region is hidden**, **which knowledge layer the observer holds**, **that rumor is not a lock**, and **that deployment is unauthorized**, it is not ready.

| Control / chrome | States (shape) | Notes |
| --- | --- | --- |
| **Star chart labels** | Hidden / rumor-unsayable / revealed | Gate 2. No Dominica name before discovery |
| **Route preview** | Omits hidden names | Must not preview “to Dominica” for an unearned observer |
| **Tooltips / planet copy** | Redacted vs full | Flavor that names Gamma Dominion is a leak |
| **Wormhole destination** | No default Dominica for unearned observers | `bajora-dominica-wormhole` must not dump the name |
| **Campaign / knowledge readout** | Rumor / evidence / contact / none | FS false; no `engagement_authorized` |
| **Deployment** | Unauthorized / authorized operation id | Debug-all **off** |
| **Pact** | Inactive / scoped roster | Ordinary captain: none |

**Later engine PR screenshot / no-clip process** (this brief does **not** attach PNGs):

- Viewport **1280×720** Chromium, same family as `docs/phase9/screenshots/phase92/` and boarding after-shots.
- Shots: star chart at Blender Dominion start (hidden Gamma); star chart after injected discovery (named systems only); knowledge readout (rumor ≠ FS); Target / OPS / Settings / Inventory still `clippedControls: []` and dock-clear.
- JSON overflow dump + `docs/phase10/screenshots/` NOTES when engine lands.
- Compare dock-clear with Phase 9.2 (`--bm1-dock-clear`). Do not cover campaign math with CSS hacks that clip EW/boarding chrome.

## 11. Acceptance exercises (S18)

Keep all existing Phase 1 / S4–S17 / doctrine / catalog / side-lane gates green. **S14 stays Phase 9. S15 stays 9.1. S16 stays 9.2. S17 stays boarding** — replay, do not rewrite. Add S18 fixtures that fail setup if the dominion-book helper, discovery-hide helper, pack-authorized-deployment helper, stage-inject helper, or compartmentation snapshot is missing. Classification-only asserts are insufficient for “Blender start did not label Dominica,” “weakness did not authorize invasion,” and “rumor did not gift FS.”

Number Three owns the probe gate **after** engine, not this brief. IDs are a sketch; do not promise a final count.

| Case | Required exercise and result |
| --- | --- |
| **S18.1** Rumor ≠ FS / ≠ `engagement_authorized` / ≠ Phase 1 rewrite | Inject rumor for player. Contact-book `firingSolution === false`. `engagement_authorized` absent. `playerFaction` / `playerSide` / Reman 53 unchanged. No kill-standing delta. Default no FLASH. |
| **S18.2** Evidence corroborates; still not a lock | Second independent fact raises layer to evidence. Still no FS. Still no culture fire. Scan flavor cargo is not a manifest (Phase 4/6). |
| **S18.3** Contact is knowledge, not map dump, not ROE | Inject contact. Authenticated fact present. Gamma labels still hidden unless a **separate** discovery write. Two-mode ROE unchanged. `mayAutoEngage` not flipped. |
| **S18.4** Blender / Dominion start does not auto-reveal | New-game Dominion at Blender: snapshot `hiddenSystems` includes Dominica + isolated Gamma names; labels/tooltips/route previews do not contain those strings. Ferengi start: same hide. |
| **S18.5** Wormhole / tooltip leak closed | Unearned observer: wormhole destination options do not **name** Dominica as a default. Planet description for a hidden system is redacted / omitted. After discovery inject for **listed** systems only: those names may appear; unlisted isolated names stay hidden. |
| **S18.6** Remnant isolated from core hulls | Live spawn/stock at Blender: 206/322 (and legal blender routine) may appear; **48, 65, 216, 238 absent**. Earth traffic: no `dominion-core` hulls. Replay pack validate + S11 region asserts on the **live** path, not only `catalog.mjs`. |
| **S18.7** Reserved Gorn / mission-only | `spawnPool(..., 'gorn')` empty in live spawn. Name pool does not mint a Gorn polity. Tactical Cube 261 not in Earth ambient. Mission spawn **fails** unless injected operation sets `authorizedDeployment`. |
| **S18.8** `authorizedDeployment` is not a debug default | `catalogSpawnContext({ role: 'fleetAttack' })` ⇒ `authorizedDeployment === false` unless operation inject. Snapshot `debugAuthorizeAllDeployments === false`. Authorized mission/invasion **does** spawn the allowed pack hulls. |
| **S18.9** Battleship / core not ordinary traffic | Hull 65 not in ambient Dominica patrol **or** Blender stock. Core patrol at Dominica (once that system is actually loaded for a legal observer) may include other core hulls **except** no-ambient flags. |
| **S18.10** Weakness ≠ invasion | Inject `weaknessOpportunity: true` at rumor/contact. `stage` does **not** jump to `fronts`. `authorizedDeployment` stays false. No new core fleet in Alpha. |
| **S18.11** Finite prep; can fail | Procurement inject spends named stores (Phase 8 subscribe). Sabotage/abandon inject clears authorization and does **not** mint a free replacement fleet. Occupation inject, if present, attaches Phase 8 holding obligations — not free income. |
| **S18.12** Magnitudes / odds not invented | Snapshot `discoveryOddsLocked: false`, `invasionOddsLocked: false`, `magnitudesInjectable: true`. Inject stage still writes. `MAGNITUDES_LOCKED_FROM_REMASTERED === false` (or equivalent campaign flag). |
| **S18.13** Compartmentation | Cardassian/Breen ordinary captain fixture: no pact facts. Scoped `agreementId` roster **does** hold them when inject says so. Player start Breen/Cardassian: `agreementsLive` default false; `playerFaction` unchanged. Remnant start ≠ central command authority. |
| **S18.14** Paths ≠ ROE | Remnant merchant vs remnant patrol vs central (if present): different **objectives** in snapshot; same fire-gate delete. Culture ≠ fire. Replay S14.16 / S15.12 / S16.17 / S17.6. |
| **S18.15** Persistence | `dominionBook` + discovery flags: save, wipe `systemStates`, reload. Same observer knowledge / hidden labels / tokens. Ambient `npc.id` reuse does not steal a pact or an operation. Clocks are `localElapsedMs` / jump clocks as declared. |
| **S18.16** Both-sides knowledge | NPC remnant may hold contact while player still has rumor only (or neither). Player discovery does not auto-brief every Dominion NPC. No telepathic faction net (Phase 1 independents / shared `neutral` still not an alliance). |
| **S18.17** EW / boarding / catalog / markets preserved | Replay S14–S17: tractor not board; XOR still holds; ghosts book-only; delivered reports survive; Reman 53; S13 no restock from rumor; S12 hold-outside; S6.4 / S6.14; S9 cloak. `BOARDING_IMPLEMENTED` stays true; `tractorIsBoarding` stays false. |
| **S18.18** Full roster not shipped | Snapshot `phase10Roster: 'dominion-first'`. Independent / Ferengi / Vulcan playable-path flags **false** or absent. Rare-commander book **false** / `not_in_this_slice`. |
| **S18.19** Dock / no-clip (engine PR) | 1280×720 map + knowledge chrome: `clippedControls: []`, dock-clear. Docs-only brief: **N/A** (process lock). |

Each case may contain multiple assertions. Include startup smoke. Do not claim a Referee Pass from this list.

## 12. Non-goals

This Phase 10 Dominion-first brief will not:

- Ship **full faction roster** paths (Independent / New Switzerland, Ferengi, Vulcan, Romulan, Cardassian, Terran, Klingon, Tholian, …) as playable Phase 10 content.
- Ship **rare recurring commanders** with bounded memory as playable content (see §16 Later sketch only).
- Invent **locked** discovery percentages or invasion odds.
- Reopen EW / PR #33 / #35 / #37, or boarding / PR #38 / #39.
- Recreate a **Gorn state** from leftover name pools.
- Restore a static Breen–Dominion alliance; inject `engagement_authorized`; gift `firingSolution` from rumor/contact/map.
- Rewrite Phase 1 `playerFaction` / `playerSide` / Reman **53** / concessions / foreign fleets.
- Auto-reveal Dominica / Gamma from a Blender or Dominion start.
- Treat `authorizedDeployment` as true whenever `role` is `fleetAttack` or `mission`.
- Let ordinary Earth traffic spawn Dominion core hulls or Battleship 65 as ambient.
- Instantly conjure an invasion from opponent weakness, or mint free replacement invasion fleets.
- Wipe delivered Phase 4/5 reports, unsend FLASH, or key campaign state inside `systemStates`.
- Persist `performance.now()` as a discovery deadline.
- Weapon overhaul, HoJ combat retune, or universal shield bypass.
- Flags/passes inventory, construction visuals, difficulty knobs that change political identity.
- Touch `Artemis2028/BM1-remastered-work` as an implementation source.
- Claim a Referee Pass in `docs/BAKEOFF-STATUS.md`.

## 13. Implementation sequence and handoff

1. **Brief Pass.** Referee / One score the **seven** hard gates. Number 2 scores gates **1, 3, 5 (semantics), 6** and knowledge wording on **2**. Number Four scores gates **2 (chrome), 4, 5 (inject/logistics)** and preservation hooks on **7**. Do not open an engine PR on this document alone.
2. **Tenth scopes the engine lane** after Pass. Blind implement from `docs/` against bake-off `main` after #39 (`de1f857`). Do not implement from remastered.
3. **Suggested order if scoped:** pack `authorizedDeployment` close + live Blender/core/Gorn/mission pools (S18.6–S18.9) → hide Gamma chrome on start (S18.4–S18.5) → rumor/evidence/contact knowledge layers (S18.1–S18.3) → compartmentation (S18.13) → stage inject + weakness≠invasion + finite prep (S18.10–S18.12) → persistence / both-sides (S18.15–S18.16) → preservation (S18.14, S18.17–S18.18) → screenshots (S18.19). **Do not** ship debug-all deployments. **Do not** ship start-as-Dominion map dump. **Do not** ship invasion-from-weakness.
4. **Number Three** adds/runs S18 after engine. Keep Phase 1 / S4–S17 / `test:catalog` green. Do not weaken S14–S17 to make S18 pass.
5. Changelog / status Pass wait on Referee after review. This proposal PR may note that the Phase 10 Dominion-first brief is open; it must **not** write a Pass.

If one model implements full-roster paths, rare commanders, or locked invasion odds, reserve a separate review pass. Fable can edit rumor/journal copy after the paths work.

## 14. Open questions

Mark these clearly. They do **not** weaken the hard gates.

| ID | Question | Default if engine is scoped before an answer |
| --- | --- | --- |
| **Q1** | **Discovery timing** — how long from rumor to evidence to contact? Jump-clock vs tactical? | **TBD / injectable.** S18 injects layers. **No** locked %. Rumor is not contact; contact is not automatic full-region reveal. |
| **Q2** | **Can undiscovered Dominion act?** Off-map prep vs observable Alpha/Blender spawn? | **Default: no observable act** that leaks the region (no core hulls in Alpha, no labels, no named route previews). Off-map bookkeeping **may** exist on `dominionBook` **without** chrome. They must not fight as Earth ambient traffic. |
| **Q3** | **Map revelation UX** — omit nodes, unnamed fog, “unknown signal”? | **Omit sayable names / labels / tooltips** first. Exact art is later. Discovery write lists systems; no galaxy dump. Engine screenshots prove the hide. |
| Q4 | Does contact FLASH? | **No by default.** Same family as boarding capture. |
| Q5 | Does authenticated contact reveal **Dominica only**, or the whole isolated set? | **Listed systems only** (inject). Default list may be empty until a later authoring pass. |
| Q6 | Wormhole Bajora↔Dominica physical link — hide name vs disable transit? | **Hide name and refuse unearned transit** first (treat as undiscovered destination). Do not delete the link record if persistence needs it; do not say “Dominica.” |
| Q7 | Player remnant: can they *travel* to a hidden system they somehow plot? | **Refuse** until discovery write includes it. Do not soft-teleport. |
| Q8 | Activate Breen/Cardassian pacts in this slice? | **Inactive** (`agreementsLive: false`) first. Gate 6 still scores ordinary captains ≠ command. |
| Q9 | NPC-only campaign vs player-visible stages? | **Both-sides knowledge** (S18.16). Player need not see every remnant fact. |
| Q10 | Difficulty knobs? | **Out.** Political identity stays the same. |
| Q11 | Split engine PRs (pack gates vs hide vs stages)? | Tenth decides after Pass. Gates 2+4 still forbid start-reveal and debug authorization. |
| Q12 | Deep-space POIs outside Dominica (plan §8 later add)? | **Out** of this slice except as unnamed “later.” |

## 15. Lanes

| Who | Owns | Scores |
| --- | --- | --- |
| **Number 2** | Doctrine / knowledge / **no `engagement_authorized`** / compartmentation: gates **1, 3, 6**, stage semantics on **5**, earned-vs-start wording on **2**. Paths ≠ ROE. Ordinary captains ≠ secret plan. | Rumor≠FS; contact≠war; remnant≠central fire modes; no Phase 1 rewrite; pacts scoped |
| **Number Four** | Engine hooks: pack gates, contact-book discovery, spawn/purchase: gates **2 (chrome), 4, 5 (inject / finite assets)**, preservation plumbing on **7**. `authorizedDeployment`, map hide, live `spawnPool`. | Blender start hides Gamma; live pools respect `dominion-all`/`core`/Gorn/mission-only; weakness≠invasion; no debug-all |
| **Number Three** | Probe gate **after** engine (S18 on `__BM1_PROBE__` / offline tests; S4–S17 stay green) | Not this brief |
| **Referee / One** | This brief vs the **seven hard gates** in §2. **Do-not-open** check: Dominion-first (full roster deferred), no EW/boarding reopen, no invented % / odds, **no Referee Pass claimed** from this PR | **Before** any engine PR |

## 16. Deferred work / Later sketch

**Follow-on (not this brief):**

- Full faction roster paths as playable Phase 10 content (plan §12 table: Independent, Ferengi, Vulcan, Romulan, Cardassian, Terran, Klingon, Tholian, …). Doctrine `dominionStory` flavor may remain as **non-acting** copy.
- Rare recurring commanders with **bounded** memory (plan §12 content candidate). **Later sketch:** keep named commanders uncommon; remember a few significant encounters; believable travel; bounded records; no galaxy-wide telepathy; no gifted FS from “they remember you.” Not playable here; do not invent a memory table.
- Locked discovery percentages / invasion odds playtest ledger (only after Tenth asks).
- Gorn survivor authored exception (must **not** be a leftover name pool).
- Construction visuals, HTML review catalogs, flags/passes inventory, empty-but-armable if still incomplete, difficulty knobs.
- Independently addressable deep-space locations (plan §8 later add).
- Weapon overhaul (still waits on the reviewed Phase 9 matrix **plus** a later Tenth-scoped retune).

This Phase 10 Dominion-first brief is ready to score when a reader can mark Pass/Fail on all seven gates: stories are knowledge/objective layers (no gifted FS / culture / `engagement_authorized`; no Phase 1 rewrite); hidden wider Dominion (Blender isolated; start does not auto-reveal); faction paths ≠ ROE injects; live pack gates (`dominion-all` / `dominion-core`, reserved Gorn, mission-only, no ambient core/Battleship, authorized flags are real operations); staged campaign shape with injectable magnitudes (weakness ≠ invasion; finite prep; can fail); compartmented covert knowledge; EW + boarding preserved (#33/#35/#37/#38/#39 locked). Full roster deferred. Magnitudes, discovery timing, and invasion odds remain injectable / TBD. **No Referee Pass is claimed.**

## Sources and precedence

- This brief’s engine checklist: `docs/phase10/BM1-PHASE10-ENGINE-DEPENDENCIES.md`.
- Plan §4 Phase 10 row; plan §10 economy/conquest table (finite assets, occupation obligations); plan §12 faction paths + **Hidden Dominion campaign**: `docs/revised-development-plan.md`.
- GUIDED-CONVERGENCE §10 (dominion-all / dominion-core, reserved Gorn, mission-only, Battleship not ambient, authorized flags real): `docs/GUIDED-CONVERGENCE.md`.
- Doctrine remnant vs wider Dominion; `engagement_authorized` never injected; Gorn absence; compartmented Breen/Cardassian: `docs/doctrine/DESIGN-doctrine-v0.2.1.md` (“The wider Dominion's operation”); `docs/doctrine/bm1-faction-doctrine.v0.2.1.json` profiles `dominion_remnant` / `dominion_central` (shared `runtimeFaction: "dominion"`).
- Pack: `bm-ships/catalog.mjs` `regionAllows` / `eligibleForSpawn` / `spawnPool`; `bm-ships/integration-rules.json` `dominion`; `bm-ships/README.md` “Using it in a browser game”; `bm-ships/validate.mjs` Blender vs core / Gorn / mission-only.
- Catalog wire: `src/ship-catalog-wire.js` `catalogSpawnContext` / `spawnIdsFromCatalog`; `src/main.js` `currentCatalogSpawnContext` (debug default to close); S11 `scripts/test-catalog-wire.mjs`.
- Map / wormhole leaks to close: `data/mapnames.json`; `data/planetData.json` Dominica / JemHadar Relay copy; `src/main.js` `WORMHOLE_DOMINION_SYSTEM_NAME`, `WORMHOLE_ISOLATED_SYSTEM_NAMES`, `getFixedWormholeLinks`, `drawPlanetMarker` labels.
- EW locked: `docs/phase9/`; PRs **#33 / #35 / #37**; S14–S16.
- Boarding locked: `docs/boarding/`; PRs **#38 / #39**; S17; `src/boarding-eligibility.js` `BOARDING_IMPLEMENTED === true`; `tractorIsBoarding() === false`.
- Phase 8 finite markets / conquest costs: `docs/phase8/`; PR #31.
- Fire facts: `src/doctrine.js` `deriveLiveFireFacts`; `consultDoctrineFire` in `src/main.js`.
- Reman / catalog: PR #28; hull **53** / `meetPackPurchaseDecision`.
- UI process: `docs/phase9/screenshots/phase92/NOTES.md` (later engine; dock-clear / no-clip continues).
- Remastered Dominion / invasion: **not a patch source**. Blind bake-off.
- Bake-off process: `docs/BAKEOFF-STATUS.md` (this PR may note the Phase 10 Dominion-first brief is open; no Pass claimed; #33 / #35 / #37 / #38 / #39 remain locked).

Settled Phase 1–9.2 behavior, EW Passes #33 / #35 / #37, boarding #38 / #39, and these seven Phase 10 Dominion-first gates take precedence over older handoff text that treated the Gamma map as always labeled, a Dominion start as omniscient, `authorizedDeployment` as a role bit, rumor as a firing solution, opponent weakness as an instant invasion, or this package as a full-roster Phase 10.
