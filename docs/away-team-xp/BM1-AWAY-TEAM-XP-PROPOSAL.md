# BM1 away-team XP (boarding soft residual)

**Status:** proposal for the parked boarding **soft residual**; no engine changes made by this document.  
**Repository:** `Artemis2028/BM1-bakeoff`  
**Planning baseline:** `ce177f0` on `main` (21 September 2026), after alertsActive S29 engine (PR #64) on `main` @ `ce177f0` (brief #63).  
**This is an away-team XP brief, not a boarding combat reopen, not Phase 10 / Dominion / faction-slice content.** Boarding #38 / #39 already landed the eight hard gates; gate 8 locked first-slice XP as **`not_tracked_yet`**. Convergence §4 and BAKEOFF-STATUS / GUIDED soft residuals have named that parking since PR #39. This document **opens** that residual as a scoreable brief. It does **not** reopen boarding gates 1–7, does **not** open Phase 10 wider faction / Dominion campaign, and does **not** claim a Referee Pass.  
**Referee context:** Phase 4 engine §6 **Pass** on `7f926df`. Boarding brief #38 / engine #39 are the **locked** boarding baselines — **Keep #38 and #39 Pass-as-engine locked** for hull%, XOR, tractor, fire, prize credit, identity, and reach. This brief **closes the XP explicitness residual** by proposing a tracked book; it does **not** reopen EW #33 / #35 / #37 / #42 / #43 / #44 / #45, Phase 10 #40 / #41, flags #46 / #47, ledger #48 / #49, empty-armable #50 / #51, construction #52 / #53, HTML #54 / #55, economy #56 / #57, standing #58 / #59, dockClear #60 / #61, hygiene #62, or alertsActive #63 / #64.  
**Companion:** `docs/away-team-xp/BM1-AWAY-TEAM-XP-ENGINE-DEPENDENCIES.md` (hooks, risks, later S30 thin-module sketch).  
**Scoped by:** Tenth Mountain Trooper, 2026-09-21 — proposal + deps first; room scores the hard gates **before** any engine. Room-locked hard gates (tracked book/API closes `not_tracked_yet`; no boarding eligibility / XOR / tractor rewrite; never gift fire; do-not-reopen #33–#64; named outs; blind; later thin module + probes / replay; named mix + injectable magnitudes / no locked table) are **in** this one scoreable brief.

Phases 1–10 and the later subscribe packages already landed. Boarding (PR #39) flipped `BOARDING_IMPLEMENTED === true` with `tractorIsBoarding() === false`, named-inject capture XOR scuttle, prize credit, command transfer, and an **explicit** XP snapshot:

```js
awayTeamXp: {
  tracked: false,
  rule: 'not_tracked_yet',
  magnitudesInjectable: true,
  tablePresent: false
}
```

S17.4 / `scripts/test-boarding-capture.mjs` assert that triple. Target / command-transfer chrome already **says** `Away-team XP: Not tracked yet`. Pack `bm-ships/integration-rules.json` `missingFeatures` still lists `"away-team XP"` (pack text is not engine). This brief **is** that parked progression item.

This is **one** docs-progression brief: publish a **scoreable contract** that away-team XP is **tracked** in an explicit book/API as **skill / progression for away teams used in boarding**, that a **named retain/lose mix** is chosen in this brief (boarding gate 8 required that pick **before** engine), that magnitudes / rates stay **injectable playtest / TBD** (Phase 9.4 style), and that XP gain or unlock **never** gifts `firingSolution`, culture fire, or `engagement_authorized`, **never** changes ≤10% hull / capture XOR scuttle / tractor ≠ board, and **never** lives in combat slots or `utilityBook` credentials. It is not a remastered `git am`, not a new boarding start condition, not a hull% rewrite, not a capture/scuttle rewrite, not a combat retune, and not permission to invent a locked class table or a hidden `pCapture` from XP.

**This PR ships proposal + engine-deps only.** A later thin **subscribe module** that closes `not_tracked_yet` as a probeable S30 surface is the natural later deliverable. This brief does **not** ship that module.

## 1. The result we want

A later writer can treat **away-team XP** the way Phase 9.4 treats EW magnitudes: a **named book**, **injectable rates**, **probe-visible totals**, and **no new fire / identity / boarding-start religion**. Capture still starts only at ≤10% hull. One attempt still writes capture **XOR** scuttle. Tractor stay is still not a board. The XP book **subscribes** to the landed XOR resolve; it does not become a second eligibility helper.

**Exit condition:** the eight hard gates in §2 are scoreable; boarding S17.1–S17.3 / S17.5–S17.18 stay green (S17.4 XP-explicitness is **amended**, not deleted — see gate 1); no gifted fire; #33–#64 stay closed.

**Proposed first-release decisions:**

| Question | Proposed answer |
| --- | --- |
| What is the first playable slice? | **Docs-only** scoreable contract under `docs/away-team-xp/`. **This PR does not ship engine.** A later thin subscribe module (S30), **if** Tenth scopes it after Pass, tracks XP in an explicit book/API, flips `tracked: true`, replaces `rule: 'not_tracked_yet'` with the **named mix** in §3, and keeps rates injectable. Name can change. |
| Is a thin subscribe module the natural later deliverable? | **Yes.** Analog: `src/alerts-active.js` / `src/phase94-magnitudes.js`. S30 is **progression bookkeeping**, not a boarding combat retune and not a new start condition. Hull% / XOR / tractor / prize credit / identity / reach stay **untouched**. |
| What is already green? | Boarding S17; `BOARDING_IMPLEMENTED === true`; `tractorIsBoarding() === false`; XP snapshot **explicit** as `not_tracked_yet` (S17.4). Target chrome already has an XP line. **Preserve** gates 1–7. **Amend** only the XP residual. |
| What is still residual? | `AWAY_TEAM_XP` in `src/boarding-eligibility.js` is a **frozen** `{ tracked: false, rule: 'not_tracked_yet' }`. `restoreBoardingBook` **overwrites** `awayTeamXp` from that constant. Resolve returns the same snapshot and **never awards**. No career pool, no retain/lose pick, no inject path for rates. Silent XP would still fail; unmentioned XP would still fail; **`not_tracked_yet` is now the thing to close.** |
| Is XP a new boarding start condition / hull% / capture-XOR rewrite? | **No.** Subscribe to landed eligibility + XOR writer. XP does not light Board, does not refuse Board, does not stamp `captured` / `scuttled`. |
| Where does the book live? | Compact `state.awayTeamXpBook` (name can change) **outside** `systemStates`, **beside** `boardingBook` and **beside** `utilityBook` — **not inside** `weaponSlots`, cargo, or credential rows. Snapshot **mirrors** onto `boardingBook.awayTeamXp` / `__BM1_PROBE__.boarding.awayTeamXp` so S17 consumers still see one field. |
| Combat slots / utility inventory? | **Not those stores.** Flags/passes stay credentials (`utilityBook`). XP is not a facility pass and not a fourth hardpoint. Subscribe-only: award **hooks** `resolveBoardingAttempt` / inject outcome; it does **not** alias `utilityBook.items`. |
| Named retain / lose / mix? | **Named mix** — see §3. Boarding gate 8 required this brief to pick **before** engine. Magnitudes stay injectable. |
| May XP modify capture odds / away-team size / travel / combat math? | **No this slice.** Odds / size / travel stay boarding §10 **TBD / injectable** at the boarding layer. XP is not a hidden `pCapture`. |
| May XP gain or an “unlock” gift `firingSolution`, culture fire, or `engagement_authorized`? | **No.** |
| May we reopen EW #33–#45, boarding combat #38/#39, Phase 10 #40/#41, flags #46/#47, ledger #48/#49, empty-armable #50/#51, construction #52/#53, HTML #54/#55, economy #56/#57, standing #58/#59, dockClear #60/#61, hygiene #62, or alertsActive #63/#64? | **No.** Boarding **XP residual** is in; boarding **combat rules** stay locked. |
| Thaleron facility, Phase 10 full roster, combat retune, Flash price locks, dockClear reopen, ROE rewrite? | **Out.** |
| May we `git am` remastered patches or lock remastered constants? | **No.** `AWAY_TEAM_XP_LOCKED_FROM_REMASTERED === false`. Existing `*_LOCKED_FROM_REMASTERED` stay false. |
| Must a later engine PR prove tracking + mix + inject? | **Yes.** Probe: after capture inject, `tracked === true`, `rule !== 'not_tracked_yet'`, total changes by the injectable capture award; fail retains; unrecovered loses pending only. Replay boarding / doctrine green. |
| Screenshot / no-clip? | **Only if** UI chrome is touched (the existing Target / transfer XP line becoming honest counts as chrome copy). Else **N/A** like alertsActive. DockClear CSS **out**. |
| Is this a Referee Pass? | **No.** Referee / One score the hard gates **before** any engine. Number Three probes only after a later S30 slice. |

These are recommendations for this progression package, not new decisions attributed to the user. Locked bake-off constraints take precedence over older flavor that treated XP as a boarding start, a capture table, a utility pass, a gifted lock, or a remastered class tree.

Cite GUIDED-CONVERGENCE §4, boarding gate 8, and BAKEOFF-STATUS as the planning sources this brief **reconciles**, not as a second spec:

| Planning source | This brief |
| --- | --- |
| Boarding hard gate 8: XP **not silent**; first slice **`not_tracked_yet`**; later slice must pick **retain / lose / named mix in the brief first**; magnitudes injectable; no invented table | Gates 1 + 8. This **is** that later slice. Mix in §3. |
| GUIDED §4: retain vs lose on failure / death / scuttle is **TBD**; do not invent an XP table | Gate 8. Named mix + playtest rates, not a class table. |
| GUIDED §4 acceptance: XP rule explicit (retain, lose, or “not tracked yet”) | Gate 1. Explicit becomes `named_mix` + `tracked: true`. |
| Boarding gates 1–7 (≤10%; XOR; tractor ≠ board; no gifted fire; prize credit; Phase 1 identity; legal reach) | Gate 2 + preservation. **Do not reopen.** |
| Pack `missingFeatures`: `"away-team XP"` | Residual name. Pack text is **not** engine (same as boarding left the pack list). |
| Phase 9.4: injectable playtest ledger; override changes snapshot; remastered-lock false | Gate 8 + 6. Same magnitude discipline. |
| alertsActive #63/#64: soft residual → scoreable brief → thin module; no Referee Pass | Process analog. This PR is the **brief**. |
| Hygiene #62 / GUIDED soft residuals: keep `not_tracked_yet` explicit until a scoreable follow-up | This brief **is** that follow-up. **#62 stay-locked.** |

## 2. Locked constraints (do not reopen)

The bake-off room locked these before this brief. Implementation and probes must treat **gates 1–8** as **hard gates**. Referee / One score this brief against those **eight** **before** any engine PR. Number Three probes only after a later S30 slice. EW / boarding combat / Phase 10 / flags / ledger / empty-armable / construction / HTML-catalog / economy-difficulty / standing-tiers / dockClear / hygiene / alertsActive gates stay **closed**; they are restated only as **gate 4** (preserve / do-not-open), not as a reopen. This docs PR **does not** claim a Referee Pass.

### Hard gate 1 — Away-team XP is tracked (closes `not_tracked_yet`) via an explicit book/API

> Away-team XP **must be tracked**. First-slice `tracked: false` / `rule: 'not_tracked_yet'` is the residual this brief closes. A later slice **must** expose an explicit book **and** API (names can change: `state.awayTeamXpBook`, `awayTeamXpSnapshot()`, `__BM1_PROBE__.awayTeamXp`) whose snapshot says `tracked: true` and a **named** rule other than `not_tracked_yet`. An engine that awards or strips XP without that named rule **fails**. An engine that leaves XP unmentioned **fails**. An engine that only comments “we should track this” **fails**.

Lane owner (wording): **Number Four** on the book/API; **Referee / One** on explicitness.

The book is **not** a combat/device slot, **not** `weaponInventory`, **not** cargo, and **not** `utilityBook` credentials. Do **not** conflate XP with flags/passes unless a writer **proves subscribe-only** (this brief does **not** so prove — keep stores distinct). `restoreBoardingBook` today overwrites `awayTeamXp` from the frozen constant; a later slice that still does that after claiming `tracked: true` **fails** save/load.

S17.4 (“XP not invented / explicit”) **stays an explicitness gate**. A later S30 **amends** its expected values (`tracked: true`, `rule: 'named_mix'`, `tablePresent: false`) and **must not** delete the assert or restore silence. Hull% / XOR / tractor cases S17.1–S17.3 / S17.5 **unchanged**.

### Hard gate 2 — Do not change boarding eligibility / capture XOR scuttle / tractor ≠ board

> XP is **progression / skill tracking** for away teams **used in** boarding. It is **not** a new boarding start condition, **not** a hull% rewrite, **not** a capture/scuttle rewrite. `combatHull / maxCombatHull ≤ 0.10` still gates start. One attempt still writes capture **XOR** scuttle (**never both**). `tractorIsBoarding()` stays **false**. Cutting beam is not capture. Ghosts/decoys are not prizes. A later slice that lights Board from XP, refuses Board because XP is low, stamps both XOR flags, or flips tractor-is-board **fails**, even if the book totals look right.

Lane owner (wording): **Number Four** on eligibility / XOR / tractor subscribe; **Referee / One** on do-not-reopen boarding combat.

Subscribe to `evaluateBoardingEligibility` / `resolveBoardingAttempt` / `tractorIsBoarding`. Do **not** fork a second hull religion. Do **not** call `destroyNpcShip` from an XP award. Prize credit (boarding gate 5) and identity (gate 6) and reach (gate 7) stay as landed.

### Hard gate 3 — Never gift FS / culture / `engagement_authorized` from XP gain or unlock

> Awarding XP, retaining it, losing pending, injecting a rate, or showing a total must **never** gift `firingSolution`, culture fire, or `engagement_authorized`. An XP “unlock” is not a lock, not a war, not Reman **53**, not a Dominion discovery write, and not `mayAutoEngage`. Pursuit ≠ permission ≠ per-weapon gate still holds. Culture on a prize hull still cannot grant fire.

Lane owner (wording): **Number 2**.

Same doctrine lean as boarding gate 4, Phase 9 fire gates, Phase 10 knowledge layers, and every later subscribe package. `consultDoctrineFire` keeps deleting `engagement_authorized`. XP helpers must **not** pass that extra.

### Hard gate 4 — Do not reopen landed lanes (#33–#64)

> Do **not** reopen EW #33 / #35 / #37 / #42 / #43 / #44 / #45. Do **not** reopen boarding **combat** #38 / #39 (gates 1–7 stay; `tractorIsBoarding()` stays false; this brief is **only** the gate-8 residual). Do **not** reopen Phase 10 #40 / #41 (full roster stays deferred). Do **not** reopen flags / passes #46 / #47 (Thaleron pass **unverified — not shipped**; `utilityBook` stays credentials). Do **not** reopen ledger #48 / #49. Do **not** reopen empty-armable #50 / #51. Do **not** reopen construction #52 / #53. Do **not** reopen HTML catalogs #54 / #55. Do **not** reopen economy / difficulty #56 / #57. Do **not** reopen standing-tiers **#58 / #59**. Do **not** reopen dockClear **#60 / #61**. Do **not** reopen hygiene **#62**. Do **not** reopen alertsActive **#63 / #64**. Phase 4 **hard** gates stay closed. This brief is **not** a Settings HUD rewrite and **not** a dock-overlap pass.

Lane owner (wording): **Referee / One**.

A writer who “finishes boarding by retuning XOR odds from XP,” who stuffs XP into `utilityBook`, or who treats alertsActive readout as unfinished work **fails**.

### Hard gate 5 — Named outs

> Do **not** invent a Thaleron **facility** (place, quest, pin, or pass). Do **not** ship a Phase 10 full faction roster. Do **not** retune combat weapons. Do **not** treat any Flash number as a live price lock. Do **not** reopen dockClear / UI-fit. Do **not** rewrite two-mode ROE. Cite those as **other** residuals / locked packages. Do **not** reopen Phase 8 clamps or catalog wire. Do **not** invent away-team size / travel ms / success % as locked constants (boarding §10 still owns those as TBD).

Lane owner (wording): **Referee / One**.

### Hard gate 6 — Blind bake-off

> Do **not** `git am` remastered patches. Do **not** crib `BM1-remastered-work` engine or DESIGN as the XP source. `AWAY_TEAM_XP_LOCKED_FROM_REMASTERED === false`. Implement later from bake-off `docs/away-team-xp/` + landed boarding helpers only. Flipping any existing `*_LOCKED_FROM_REMASTERED` to true **fails**.

Lane owner (wording): **Referee / One**.

### Hard gate 7 — Later engine: thin module + probes; replay boarding / doctrine; shots only if chrome

> A later engine PR **must** be a **thin** subscribe module plus probes that assert: XP is tracked (gate 1), the §3 mix writes the expected retain/award/lose-pending, inject changes the snapshot (gate 8), and boarding combat / fire flags are unchanged (gates 2–3). It **must** replay boarding (`test:boarding` / S17 except the amended S17.4 values) and doctrine green. An engine PR that lands a helper without the capture-award / fail-retain / unrecovered-pending probes **fails**. An engine PR that rewrites hull% / XOR / tractor / prize credit to make totals move **fails**. **This docs PR adds no S30 to the probe and no engine.**

**Screenshots:** baseline + after **only if** UI chrome is touched (honest Target / transfer XP line counts). If the later slice is probe-only with **stale** “Not tracked yet” copy, that **fails** gate 1 (XP must stay sayable). DockClear CSS / overflow JSON **out**. If no chrome: **N/A**, like alertsActive.

Lane owner (wording): **Number Four** (module + process); **Number Three** scores the probe **after** a later slice.

### Hard gate 8 — Named mix + injectable magnitudes; no locked XP table

> This brief **picks** the §3 **named mix** (`onCapture: award`, `onScuttle: award`, `onFail: retain`, `onUnrecovered: lose_pending`). Magnitudes / rates are **injectable playtest / TBD** (Phase 9.4 style). `tablePresent` stays **false**. Do **not** ship a locked class/level/skill tree, a remastered XP table, or locked success percentages. Override **must** change the snapshot. Omit inject ⇒ §3 playtest defaults. A “veteran +15% capture” constant **fails**. A frozen non-overridable `captureAward` **fails**.

Lane owner (wording): **Number Four** on inject; **Referee / One** on do-not-invent-a-table.

Starting playtest defaults in §3.3 are **not** remastered constants and **not** a Referee-certified balance.

### Soft gate 9 — Suites stay green (after a later slice)

> **Soft:** existing suites stay green (Phase 1 / S4–S29 / catalog / doctrine / boarding / Phase 10 / Phase 8 / Phase 9.4 / utility / weapon-ledger / empty-armable / construction / html-catalogs / economy-difficulty / standing-tiers / dock-clear / alerts-active / side-lane). A later S30 engine does **not** reopen dockClear or EW math.

Lane owner (wording): **Number Four** (process); **Number Three** scores suite-green **after** a later slice that touches runtime — not this brief.

### Also from the room (score with the gates)

| Plan / room want | How this brief locks it |
| --- | --- |
| Close `not_tracked_yet` via explicit book/API; not slots; not utility conflation | Gate 1. §3. |
| XP ≠ hull% / XOR / tractor rewrite | Gate 2. |
| Never gift FS / culture / `engagement_authorized` from XP | Gate 3. |
| Do not reopen #33–#64 | Gate 4. |
| Named outs: Thaleron, P10 full roster, combat retune, Flash locks, dockClear, ROE | Gate 5. |
| Blind; `AWAY_TEAM_XP_LOCKED_FROM_REMASTERED === false` | Gate 6. |
| Later engine: thin module + probes; replay boarding / doctrine; shots only if chrome | Gate 7. |
| Named mix picked here; rates injectable; no locked table | Gate 8. §3. |
| Suites green; no Referee Pass from this PR | Soft gate 9. Scoring note below. |

### Must not break (cite landed work)

Score as **preservation**. A later away-team XP Pass that regresses them is a Fail. **#33, #35, #37, #38, #39, #40, #41, #42, #43, #44, #45, #46, #47, #48, #49, #50, #51, #52, #53, #54, #55, #56, #57, #58, #59, #60, #61, #62, #63, and #64 stay locked.**

| Locked rule | Cite | This brief / later slice must not |
| --- | --- | --- |
| ≤10% hull to start | Boarding gate 1; S17.1–S17.2 | Start boarding from XP, shields, tractor, or overdue. |
| Capture XOR scuttle; odds TBD | Boarding gate 2; S17.3 | Stamp both flags. Lock a success %. Drive XOR from XP. |
| Tractor ≠ board | Boarding gate 3; S14.18 / S17.5 | `tractorIsBoarding() === true`. Tractor hold as XP award. |
| No gifted FS / culture / `engagement_authorized` | Boarding gate 4; Phase 9 gate 5 | Write the fact from an XP total or unlock. |
| Prize credit; capture ≠ kill cascade; no double-charge | Boarding gate 5; S17.7–S17.9 | Route award through `destroyNpcShip` / `applyKillStanding`. |
| Phase 1 identity; no silent refit; no gifted foreign fleet | Boarding gate 6; S17.10–S17.11 | Fill empty slots because the team “leveled.” Reman from XP. |
| Legal reach / detection | Boarding gate 7; S17.12 | Gift detection / FS so XP can accrue. |
| XP explicit (not silent) | Boarding gate 8; S17.4 | Drop the snapshot field; leave `not_tracked_yet` after claiming tracked. |
| Credentials ≠ combat slots | Flags #46/#47 | Put XP in `utilityBook.items` or `weaponSlots`. |
| Two ROE modes only | Phase 2 Pass | Add a mode because the team is veteran. |
| `*_LOCKED_FROM_REMASTERED === false` | #44–#64 | Flip any remastered-lock true. |
| Effective `alertsActive` | #63/#64 | Revert top-level snapshot to raw `playerSecurity`. |
| Operator-panel / target / map dock-clear | #60/#61; S16.15 / S28 | Reopen CSS / overflow JSON “to fit the XP line.” |

### Process locks (not a change to gates 1–8)

- **Proposal first.** Do not implement the XP module from this text until Tenth scopes S30 after a brief Pass.
- **Blind bake-off.** Implement against bake-off `main` (`ce177f0` after #64), **not** remastered. From `docs/away-team-xp/` + landed boarding helpers only. Do **not** crib `Artemis2028/BM1-remastered-work`.
- **#33 / #35 / #37 / #38 / #39 / #40 / #41 / #42 / #43 / #44 / #45 / #46 / #47 / #48 / #49 / #50 / #51 / #52 / #53 / #54 / #55 / #56 / #57 / #58 / #59 / #60 / #61 / #62 / #63 / #64 stay locked.**
- **Subscribe, do not fork.** Award on the landed XOR writer. Do not become a second boarding book, a second incident ledger, or a second utility inventory.
- **No invented balance numbers as locked constants.** §3.3 numbers are **playtest / TBD / injectable**.
- **No Pass claimed** in `docs/BAKEOFF-STATUS.md` from this PR.

### Scoring note

Referee / One / Number Four score the **eight hard gates** **before** any engine PR. Number 2 scores gate **3**. Number Three probes **only after** a later S30 slice. **No Referee Pass is claimed by this docs PR.** Room scores the brief before any engine.

## 3. Named mix and book shape (gates 1 + 8)

**Lane owner (wording):** Number Four on the book / inject; Referee / One on explicitness.

Boarding gate 8: when a later slice tracks XP, it must pick **retain**, **lose**, or a **named mix in the brief first**. This brief picks a **named mix**. Names can change. Magnitudes are **not** in the mix — they are §3.3 injectables.

### 3.1 Event table (locked shape)

| Event (already named in boarding) | XP write | Why this is the mix |
| --- | --- | --- |
| **Capture** (XOR terminal) | **Award** `captureAward` | Away-team skill demonstrated; prize taken. Not a kill token. |
| **Scuttle** of original (XOR terminal) | **Award** `scuttleAward` | Attempt resolved by the team. Not a second standing religion. |
| **Fail** (neither capture nor scuttle; hull remains theirs) | **Retain** — no award, no strip of the career pool | Team returns. Failure is not death. |
| **Unrecovered** (actor destroyed / in-transit death / scene-unload that already **fails** the attempt per boarding §10.2) | **Lose pending only** — drop in-flight pending award; career pool **retains** | Death ≠ ordinary fail. Default `loseCareerOnUnrecovered: false` (injectable). |
| Command transfer / tractor hold / later prize destroy / Phase 5 close | **No XP write** | Not away-team skill events. Subscribe those lanes unchanged. |

`rule: 'named_mix'` in the snapshot. Spell the four event keys. A later engine that implements only “award on anything resolved” **fails** fail-retain. A later engine that wipes the career pool on ordinary fail **fails** this mix (that would be a different pick, and it is **not** this brief).

Pending: while an attempt is in-transit, a later slice **may** hold `pending: 0` until resolve (default) or accrue pending then commit/drop. Default: **commit on resolve only** (no pending until XOR writes). Unrecovered then has nothing to drop unless a later inject enables pending-in-transit. First slice can still assert the `lose_pending` key exists and is a no-op when `pending === 0`.

### 3.2 The book (gate 1)

A compact `state.awayTeamXpBook` (name can change) **outside** `systemStates`:

| Field | Meaning | First slice |
| --- | --- | --- |
| `tracked` | Residual closed | **`true`** after later S30 |
| `rule` | Named mix id | `'named_mix'` |
| `events` | `{ onCapture, onScuttle, onFail, onUnrecovered }` | `award` / `award` / `retain` / `lose_pending` |
| `total` | Career pool | Number; start **0**; persist across save/load |
| `pending` | In-flight uncommitted | Default **0** |
| `lastAward` | Last committed delta + attemptId | Probe aid; not a second religion |
| `tablePresent` | Class/level table | **`false`** |
| `magnitudesInjectable` | Rates overridable | **`true`** |
| `AWAY_TEAM_XP_LOCKED_FROM_REMASTERED` | Blind flag | **`false`** |
| `inUtilityBook` / `inCombatSlots` | Conflation guards | **`false`** |

Never store this book inside `weaponSlots`, `weaponInventory`, `cargoArray`, `stationPlans`, `ewEquipmentId`, `sensorSuiteId`, or `utilityBook.items`. Those stores stay themselves.

**Subscribe mirror:** `boardingBook.awayTeamXp` and `__BM1_PROBE__.boarding.awayTeamXp` read the same snapshot so S17.4 / Target chrome keep one field. **Do not** treat the frozen `AWAY_TEAM_XP` constant in `boarding-eligibility.js` as the live total after S30 — that constant is today’s residual.

**Identity of the team:** first slice is **one player career pool** (flagship away-team). Not per-hull XP. Not NPC boarding (`npcBoardingImplemented` stays false). Not a sprite / shuttle hull (boarding Q17).

**Save/load:** sibling key beside `boardingBook` (like `utilityBook`). Old saves: `total: 0`, `tracked: true` after migrate, no invented history. `resetRunState` / new game: empty pool. Load still wipes `systemStates` first. Clocks remain `localElapsedMs` on the **boarding** attempt; XP has no `performance.now()` deadline.

### 3.3 Playtest magnitudes (gate 8 — TBD / injectable)

**Lane owner (wording):** Number Four.

These are **starting injectable defaults** for playtest, in the Phase 9.4 discipline. They are **not** remastered XP, **not** locked constants, and **not** a Referee-certified balance. Mark every number **TBD / playtest**. Override must change the snapshot.

| Key | Starting playtest default | What it is |
| --- | --- | --- |
| `captureAward` | **10** | Added to `total` on XOR capture |
| `scuttleAward` | **5** | Added to `total` on XOR scuttle-of-original |
| `failAward` | **0** | Retain path; inject may raise; default stay 0 |
| `startingTotal` | **0** | New game / reset |
| `loseCareerOnUnrecovered` | **false** | Career pool retains on unrecovered |
| `pendingInTransit` | **false** | Commit on resolve only |

Prices, levels, caps, diminishing returns: **unset**. Do not invent `xpToNextRank` or a 40/60 capture table here.

Player-facing (later chrome; copy can wait):

- `Away-team XP: tracked · named mix · total <n>` (replace “Not tracked yet”)
- `Away team reports: prize taken. XP awarded (playtest).`
- `Away team failed. XP retained.`
- `Away team unrecovered. Pending XP dropped. Career pool retained.`

If the UI still says “Not tracked yet” after S30 claims `tracked: true`, gate 1 is not ready.

### 3.4 What already exists (do not reinvent)

| Surface at `ce177f0` | What it is | What it is not |
| --- | --- | --- |
| `AWAY_TEAM_XP` / `awayTeamXpSnapshot()` in `src/boarding-eligibility.js` | Frozen explicit residual | A career pool |
| `boardingBook.awayTeamXp` restored from that constant | S17.4 / persistence of the **rule name** | Persistable totals (restore **wipes** any extra fields) |
| `resolveBoardingAttempt` return `awayTeamXp` | Same frozen snapshot | An award hook |
| Target chrome XP line | Sayable residual | A tracker |
| `state.utilityBook` | Flags / empty facility passes | XP |
| `state.weaponSlots` length 3 | Combat/device hardpoints | Progression |
| `MAGNITUDES_LOCKED_FROM_REMASTERED === false` on boarding | Odds / XP magnitudes already injectable-shaped | A live XP inject path |

## 4. What XP must not do (gates 2–5)

**Lane owner (wording):** Number 2 on fire / identity; Number Four on boarding subscribe.

| Event | May do | Must not do |
| --- | --- | --- |
| Award on capture | Increment `total` by injectable `captureAward` | Call `applyKillStanding`; gift FS; fill empty slots; change hull% |
| Award on scuttle | Increment by `scuttleAward` | Double-charge original kill; treat XP as salvage latinum |
| Fail retain | Leave `total` unchanged (default) | Strip career pool; stamp `captured && scuttled` |
| Unrecovered | Drop `pending` (often 0) | Rewrite Phase 1; inject `engagement_authorized` |
| Inject rates | Change snapshot keys | Lock remastered table; change `pCapture` |
| UI line | Say tracked total | DockClear reopen; hide Board to “make room” |

## 5. Acceptance exercises (S30 sketch)

Keep Phase 1 / S4–S29 / doctrine / catalog / boarding (S17.1–S17.3, S17.5–S17.18) / Phase 10 / Phase 8 / Phase 9.4 / utility / weapon-ledger / empty-armable / construction / html-catalogs / economy-difficulty / standing-tiers / dock-clear / alerts-active / side-lane green. **S17.4 stays an explicitness gate** with **amended** expected values. Add **S30** only **after** Tenth scopes a later thin module. IDs are a sketch; do not promise a final count. **This docs PR does not add S30 to the probe and does not add engine.**

Number Three owns the probe gate **after** a later slice, not this brief.

| Case | Required exercise and result (later S30 only) |
| --- | --- |
| **S30.1** Tracked book/API closes `not_tracked_yet` | Snapshot `tracked === true`, `rule === 'named_mix'` (or the locked name), `tablePresent === false`. `not_tracked_yet` **absent**. Book/API present; fail setup if missing. Not in `weaponSlots`. Not in `utilityBook.items`. |
| **S30.2** Capture awards injectable amount | Inject `outcome: 'capture'`. XOR still capture-only (replay S17.3). `total` increases by `captureAward` (default 10, or injected). Standing unchanged (replay S17.7). |
| **S30.3** Scuttle awards; fail retains | Inject scuttle: `total` += `scuttleAward`; hull unusable; not both flags. Inject fail: `total` **unchanged** (retain). |
| **S30.4** Unrecovered loses pending only | In-transit cancel / actor-destroyed fail: career `total` retained; `pending` 0. `loseCareerOnUnrecovered` default false. |
| **S30.5** Inject changes snapshot | Override `captureAward` (e.g. 3). Next capture delta is 3. Omit inject ⇒ §3.3 default. `AWAY_TEAM_XP_LOCKED_FROM_REMASTERED === false`. |
| **S30.6** Boarding combat / tractor / reach unchanged | Replay S17.1 / S17.2 / S17.5 / S17.12. Hull 11% still refuses. Tractor hold without boarding order does not capture and does not award. Ghost/decoy refuse. |
| **S30.7** No gifted fire / identity / utility conflation | After award: no `engagement_authorized`; no gifted FS; `playerFaction` / Reman 53 unchanged; empty slots stay empty; `utilityBook` items unchanged; two ROE modes only. |
| **S30.8** Persistence + preservation | Save/load/reset: totals persist on save/load; reset → 0. Not inside `systemStates`. Replay S17.15 family. Diff does **not** reopen EW / Phase 10 / flags / ledger / empty-armable / construction / HTML / economy / standing / dockClear / hygiene / alertsActive. No Thaleron-facility / combat-retune / Flash-lock / ROE / `git am` work. |
| **S30.9** S17.4 amended, not deleted | Boarding offline + Chromium still assert XP **explicit**. Expected values follow S30.1. Do **not** restore `not_tracked_yet` to hide a missing book. |
| **S30.10** Chrome honesty / shots | If Target / transfer XP line exists, it must not still say “Not tracked yet.” Shots baseline+after **if** that line (or other chrome) changed; else N/A. DockClear CSS untouched. |

Do not claim a Referee Pass from this list.

## 6. Non-goals

This brief will not:

- Implement engine code or add S30 on **this** PR.
- Reopen boarding hull%, capture XOR scuttle, tractor ≠ board, prize credit, Phase 1 identity, or legal reach.
- Invent locked success percentages or a class/level XP table.
- Use XP as a hidden boarding-odds modifier or a new start condition.
- Gift `firingSolution`, culture fire, or `engagement_authorized`.
- Stuff XP into combat slots or `utilityBook` credentials.
- Reopen EW PRs #33 / #35 / #37 / #42 / #43 / #44 / #45, boarding combat #38 / #39, Phase 10 #40 / #41, flags #46 / #47, ledger #48 / #49, empty-armable #50 / #51, construction #52 / #53, HTML catalogs #54 / #55, economy #56 / #57, standing #58 / #59, dockClear #60 / #61, hygiene #62, or alertsActive #63 / #64.
- Invent a Thaleron Test Facility (place, quest, pin, or pass).
- Ship a Phase 10 full faction roster.
- Retune combat weapons or treat any Flash number as a live price lock.
- Reopen dockClear / UI-fit, or rewrite two-mode ROE.
- `git am` remastered patches, or treat remastered DESIGN as engine source.
- Claim a Referee Pass in `docs/BAKEOFF-STATUS.md`.

## 7. Open questions

Mark these clearly. They do **not** weaken the hard gates.

| ID | Question | Default if a later S30 slice is scoped before an answer |
| --- | --- | --- |
| Q1 | Sibling `awayTeamXpBook` vs only a live sub-object on `boardingBook`? | **Sibling + snapshot mirror** (gate 1). Boarding restore today wipes extras on `awayTeamXp`; a sibling key is the persistence-safe subscribe. Do **not** put rows in `utilityBook`. |
| Q2 | Scuttle playtest default 5 vs 0? | **5** in §3.3, injectable. Inject 0 if playtest wants scuttle = no award. Mix shape stays `onScuttle: 'award'` (award of 0 is still the named path). |
| Q3 | Levels / skill tree / rank titles? | **Out.** `tablePresent: false`. |
| Q4 | May XP modify boarding success odds? | **Out this slice.** Odds stay boarding §10 TBD at the boarding layer. |
| Q5 | Per-hull or multi-team XP? | **One player career pool.** NPC boarding stays false. |
| Q6 | Must S30 restyle Target chrome? | **Honesty required** if the line exists. Layout / dockClear **out**. Shots if chrome text changes. |
| Q7 | Amend S17.4 in place vs S30-only? | **Both:** S30 owns tracking cases; S17.4 expected values **amend**; do not delete explicitness. |
| Q8 | Pack `missingFeatures` string? | **Leave pack text** (boarding did). Runtime book is the close. |
| Q9 | Thaleron / P10 roster / dockClear / ROE? | **Out.** Other residuals / locks. |

## 8. Implementation sequence and handoff

1. **Brief Pass.** Referee / One score the **eight hard gates**. Number 2 scores gate **3** (no gifted fire). Number Four scores gates **1, 2, 7, 8** (book/API; no combat rewrite; thin module + probes; named mix + inject) and the engine half of **4**, plus soft gate **9** as process. Do not open an S30 PR on this document alone.
2. **Tenth scopes** a later thin subscribe module **or** leaves this as docs-only. Blind implement from `docs/away-team-xp/` against bake-off `main` after #64 (`ce177f0`).
3. **Suggested order if scoped:** remastered-lock false + empty book (S30.1 / S30.5) → subscribe award on capture inject (S30.2) → scuttle award + fail retain (S30.3) → unrecovered pending (S30.4) → no fire / no slots / no utility (S30.7) → persist (S30.8) → amend S17.4 (S30.9) → chrome honesty / optional shots (S30.10) → replay boarding combat / doctrine (S30.6). **Do not** reopen #33–#64. **Do not** retune XOR or hull%.
4. **Number Three** adds/runs S30 after the later slice. Keep S17.1–S17.3 / S17.5–S17.18 green. Do not weaken S17.4 to hide `not_tracked_yet`.
5. Changelog / status Pass wait on Referee after review. This proposal PR may note that the brief is open; it must **not** write a Pass.

## 9. Lanes

| Who | Owns | Scores |
| --- | --- | --- |
| **Number Four** | Later slice: gates **1, 2, 7, 8** — book/API; no hull%/XOR/tractor rewrite; thin module + probes; named mix + injectable rates | `tracked: true`; totals follow §3; S17 combat cases green |
| **Number 2** | Doctrine: gate **3** — XP is not FS / culture / `engagement_authorized` | Award ≠ lock / ceasefire / `mayAutoEngage` / Reman |
| **Number Three** | Probe gate **after** a later S30 slice (S30; S17 amend; S4–S29 / doctrine stay green) | Not this brief |
| **Referee / One** | This brief vs the **eight hard gates** in §2. Gates **4–6** (do-not-reopen #33–#64 + named outs + blind). **Do-not-open** check: no boarding combat reopen; no XP table lock; no Thaleron / P10 roster / combat retune / Flash locks / dockClear / ROE; no `git am`; **no Referee Pass claimed** from this PR | **Before** any engine PR |

This brief is ready to score when a reader can mark Pass/Fail on: away-team XP tracked via an explicit book/API (closes `not_tracked_yet`); not slots / not utility conflation; boarding eligibility / XOR / tractor unchanged; XP never gifts fire; landed #33–#64 not reopened; named outs hold; remastered-lock false; later engine thin module + probes required; named mix picked; rates injectable / no locked table.

## Sources and precedence

- This brief’s later-slice checklist: `docs/away-team-xp/BM1-AWAY-TEAM-XP-ENGINE-DEPENDENCIES.md`.
- Boarding soft residual (planning source): `docs/boarding/BM1-BOARDING-CAPTURE-PROPOSAL.md` gate 8 / §10 / S17.4; `docs/boarding/BM1-BOARDING-ENGINE-DEPENDENCIES.md` risk 9; `docs/GUIDED-CONVERGENCE.md` §4; `docs/BAKEOFF-STATUS.md` soft residual. **This brief is that follow-up.**
- Landed boarding engine: `src/boarding-eligibility.js` `AWAY_TEAM_XP`; `src/boarding-attempt.js` restore overwrite; PRs **#38 / #39**.
- Magnitude discipline: `docs/phase9/BM1-PHASE9.4-MAGNITUDES-PLAYTEST-PROPOSAL.md`; PR **#44 / #45**.
- Soft-residual brief shape: `docs/alerts-active/`; PRs **#63 / #64**.
- Utility (stay distinct): `docs/flags-passes/`; PRs **#46 / #47**.
- DockClear (stay locked): `docs/dock-clear/`; PRs **#60 / #61**.
- Hygiene (stay locked): PR **#62**.
- Phase 10 (stay locked; full roster deferred): `docs/phase10/`; PRs **#40 / #41**.
- EW locked: `docs/phase9/`; PRs **#33 / #35 / #37 / #42 / #43 / #44 / #45**.
- Pack name only: `bm-ships/integration-rules.json` `missingFeatures`.
- Remastered engine / DESIGN: **out of bounds.** Not a patch source. Not a constant lock.
- Bake-off process: `docs/BAKEOFF-STATUS.md` (this PR may note the away-team XP brief is open; **no Pass claimed**; #33–#64 remain locked).

Settled Phase 1–10 behavior, boarding gates 1–7, PR #33 / #35 / #37 / #38 / #39 / #40 / #41 / #42 / #43 / #44 / #45 / #46 / #47 / #48 / #49 / #50 / #51 / #52 / #53 / #54 / #55 / #56 / #57 / #58 / #59 / #60 / #61 / #62 / #63 / #64, and these eight hard gates take precedence over older handoff text that treated XP as a boarding start, a locked capture table, a utility pass, or a remastered class tree.
