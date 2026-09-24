# BM1 away-team XP: later-slice dependencies

**Reviewed document:** `BM1-AWAY-TEAM-XP-PROPOSAL.md`  
**Later status (hygiene 23 September 2026 — cross-link only, deps text below unchanged):** S30 engine **stay-locked** [PR #66](https://github.com/Artemis2028/BM1-bakeoff/pull/66) @ `10540aa` (`named_mix`). `AWAY_TEAM_XP_LOCKED_FROM_REMASTERED` stays false. **No Referee Pass claimed.**  
**Reviewed against:** `Artemis2028/BM1-bakeoff` at `ce177f0` on `main` (21 September 2026), after alertsActive S29 engine (PR #64). Line numbers below refer to this head and may drift.  
**Method:** read landed `AWAY_TEAM_XP` frozen snapshot, `awayTeamXpSnapshot()`, `restoreBoardingBook` overwrite, `resolveBoardingAttempt` return field, Target chrome XP line, `utilityBook` sibling inventory, boarding S17.4, and the BAKEOFF-STATUS / GUIDED / boarding gate 8 notes that left `not_tracked_yet` as a **soft residual**. No engine changes made. This is a dependency/risk checklist for a **later** writer **if** Tenth scopes a thin subscribe module — not a post-implementation review and not permission to implement before Tenth scopes the lane. **Keep #33, #35, #37, #38, #39, #40, #41, #42, #43, #44, #45, #46, #47, #48, #49, #50, #51, #52, #53, #54, #55, #56, #57, #58, #59, #60, #61, #62, #63, and #64 locked.** Do not reopen EW, boarding **combat** (gates 1–7), Phase 10, flags/passes, the weapon ledger, empty-armable, construction visuals, HTML catalogs, economy / difficulty, standing tiers, dockClear, hygiene, or alertsActive. Do not rewrite two-mode ROE. Do not retune combat. Do not invent a Thaleron facility. Do not reopen dockClear. Do not `git am` remastered patches.

## Verdict in one paragraph

Away-team XP can stay **docs-only** on this PR. **This PR ships proposal + deps only.** Boarding already made XP **explicit** as `not_tracked_yet` (frozen `AWAY_TEAM_XP`, S17.4, Target line). The parked residual is **tracking**: no career pool, no named retain/lose mix, no inject path, and `restoreBoardingBook` always restamps the frozen constant. If Tenth later scopes a thin slice, prefer a **sibling book** (`src/away-team-xp.js`, name can change) that **subscribes** to `resolveBoardingAttempt` / inject outcome, exports `AWAY_TEAM_XP_LOCKED_FROM_REMASTERED === false`, awards injectable playtest rates on capture/scuttle, **retains** on fail, **loses pending only** on unrecovered, mirrors a snapshot onto `boardingBook.awayTeamXp`, amends S17.4 expected values, adds S30 probes, replays boarding / doctrine. Do **not** touch hull% helpers, XOR flags, `tractorIsBoarding`, `game_items.json`, `utilityBook` items, or dockClear CSS. The load-bearing risks are all identity mistakes: stuffing XP into slots or `utilityBook`; driving Board / XOR / odds from totals; gifting `firingSolution` / `engagement_authorized`; inventing a locked class table; leaving `not_tracked_yet` after claiming tracked; `git am` remastered; reopening #33–#64.

## Natural later deliverable (say this clearly)

A thin **subscribe module** that tracks away-team XP (closes `not_tracked_yet`) as skill / progression for boarding away teams is the natural **S30** deliverable. Boarding combat / tractor / prize credit / identity / reach / ROE / dockClear stay untouched.

| S30 is | S30 is not |
| --- | --- |
| Explicit book/API; `tracked: true`; `rule: 'named_mix'` | A new boarding start, hull% rewrite, or XOR rewrite |
| Award on capture/scuttle; retain on fail; lose pending on unrecovered | A locked class/level table or remastered XP crib |
| Injectable rates; override changes snapshot | A hidden `pCapture` / away-team size lock |
| Sibling store beside `boardingBook`, **not** `utilityBook` / slots | A facility pass or fourth hardpoint |
| Amend S17.4 expected values; replay S17 combat cases | Deleting XP explicitness or restoring silence |
| `AWAY_TEAM_XP_LOCKED_FROM_REMASTERED === false` | A remastered `git am` or locked remastered constant |
| Replay boarding / doctrine green | A boarding hard-gate 1–7 reopen |

DockClear polish, a Thaleron facility, a Phase 10 full roster, a combat retune, or a ROE rewrite, if ever wanted, remain **different** Tenth-scoped lanes.

## What already exists (do not reinvent)

| Need | Engine / docs fact at `ce177f0` |
| --- | --- |
| Residual snapshot | `src/boarding-eligibility.js` `AWAY_TEAM_XP` (~21–26): `{ tracked: false, rule: 'not_tracked_yet', magnitudesInjectable: true, tablePresent: false }`. `awayTeamXpSnapshot()` spreads that object (~64–66). Also re-exported from `src/boarding-attempt.js` (~18–19). |
| Book overwrite | `restoreBoardingBook` (`boarding-attempt.js` ~77) **sets** `restored.awayTeamXp = awayTeamXpSnapshot()`. Serialize does the same (~65). Live totals **cannot** survive load today. |
| Resolve hook | `resolveBoardingAttempt` (~161–199) XOR-writes capture/scuttle/fail and returns `awayTeamXp: awayTeamXpSnapshot()` — **no award**. `injectBoardingAttempt` (~202) is the S17 named inject. |
| In-transit fail | Boarding proposal §10.2: cancel / actor destroyed / scene unload **fails** the attempt, no capture+scuttle, no standing. Tick uses `localElapsedMs` (`tickBoarding` ~215). |
| Eligibility | `evaluateBoardingEligibility` — hull% / wreck / station / ghost / decoy. **Do not fork.** |
| Tractor | `tractorIsBoarding()` false (`src/phase9-ew.js`). Probe S17.5. |
| Chrome | `src/main.js` ~6079–6105: Target / board panel `Away-team XP: ${xp.rule === 'not_tracked_yet' ? 'Not tracked yet' : …} · tracked: false`. Command-transfer panel also says the residual. |
| Probe | `__BM1_PROBE__.boarding.snapshot().awayTeamXp` (`main.js` ~28606). S17.4 in `scripts/behavior-probe.mjs` (~4474) and `scripts/test-boarding-capture.mjs` (~167–168, ~335). |
| Utility (distinct) | `state.utilityBook` via `src/utility-inventory.js`. Credentials only. Save sibling key (~14267). **Do not alias XP into items.** |
| Boarding persist | `state.boardingBook` (~1450); `saveGame` `boardingBook: serializeBoardingBook(...)` (~14300); `loadGame` restore (~14391). `systemStates = {}` still wipes on load. |
| Magnitudes pattern | `src/phase94-magnitudes.js` + `MAGNITUDES_LOCKED_FROM_REMASTERED === false`. Boarding already exports the same lock flag on eligibility (~19). |
| Pack name | `bm-ships/integration-rules.json` `missingFeatures` includes `"away-team XP"`. Pack is **not** engine. |
| Remastered locks | Sibling `*_LOCKED_FROM_REMASTERED` all **false**. **#33–#64 stay locked.** |
| Soft leftover (this lane) | BAKEOFF-STATUS / GUIDED §4 / boarding gate 8: XP `not_tracked_yet`. alertsActive residual is **closed in engine** (#64). |

**Gap this brief closes (docs now; module only if scoped):** there is no **scoreable S30 contract** that XP is tracked in an explicit book/API, that the named mix writes award/retain/lose-pending, that rates inject, and that BAKEOFF-STATUS’s boarding XP note is a **parked progression item** rather than permission to reopen hull%, XOR, tractor, or utility inventory.

## Hooks the writer will have to touch

**This PR touches none of these.** If Tenth later scopes a thin subscribe module:

Prefer **one new file** rather than growing `resolveBoardingAttempt` into an XP religion:

| Proposed file | Responsibility |
| --- | --- |
| `src/away-team-xp.js` (name can change) | `AWAY_TEAM_XP_LOCKED_FROM_REMASTERED === false`; `emptyAwayTeamXpBook` / serialize / restore; named mix event table; `applyAwayTeamXpOutcome(book, { outcome, unrecovered })`; `resolveAwayTeamXpMagnitudes(inject)` (playtest defaults); `awayTeamXpSnapshot(book)` with `tracked: true`, `rule: 'named_mix'`, `tablePresent: false`, `inUtilityBook: false`, `inCombatSlots: false`. **No** hull% write. **No** XOR write. **No** fire write. **No** `utilityBook` write. |
| `src/boarding-attempt.js` | Thin **subscribe**: after a successful XOR resolve, call `applyAwayTeamXpOutcome`. Stop overwriting live totals from the frozen constant on restore — **mirror** the XP book instead. Keep XOR hard-fail. |
| `src/boarding-eligibility.js` | Stop treating frozen `AWAY_TEAM_XP` as live truth after S30. May re-export snapshot helper that **reads the book**. Do **not** change `HULL_BOARDING_THRESHOLD` / refuse reasons. |
| `src/main.js` | Thin: create/restore sibling `state.awayTeamXpBook` next to `boardingBook` / `utilityBook`; `saveGame` / `loadGame` / `resetRunState`; `__BM1_PROBE__.awayTeamXp`; Target XP line honesty (`tracked` / total). **Do not** dockClear-reflow. |
| Optional `scripts/test-away-team-xp.mjs` | Offline: lock false; capture award; fail retain; inject override; not in slots / utility; XOR still xor. **Not** a rewrite of `test-boarding-capture.mjs` except S17.4 expected values. |
| `scripts/behavior-probe.mjs` / `scripts/test-boarding-capture.mjs` | Add S30. **Amend** S17.4 expected `tracked` / `rule`. **Replay** S17.1–S17.3 / S17.5–S17.18. |

Do **not** implement this inside `src/phase9-*.js` / `src/phase91-*.js` / `src/phase92-*.js` / `src/phase94-magnitudes.js` as an EW side effect, `src/utility-inventory.js` as a credential, `src/phase10-*.js`, `src/dock-clear.js`, `src/alerts-active.js`, `src/empty-armable.js`, or `destroyNpcShip`. Do **not** `git am` remastered patches. Do **not** retune `game_items.json`. Do **not** edit `docs/html-catalogs/*.html`.

| Existing path | Required integration (later S30) |
| --- | --- |
| `resolveBoardingAttempt` / `injectBoardingAttempt` | **Subscribe after XOR.** Fail if award runs when `captured && scuttled`. Fail if award runs on hull% refuse (no attempt). |
| `evaluateBoardingEligibility` | **Untouched math.** Fail if XP total changes `eligible`. |
| `tractorIsBoarding` / `tractorHold` | Untouched. Fail if hold awards XP or captures. |
| `capturePrizeHull` / `applyKillStanding` / `destroyNpcShip` | Untouched standing. Fail if capture award calls kill-standing. |
| `consultDoctrineFire` / `playerForceMayAutoEngage` | Untouched. Fail if award writes `firingSolution` or `engagement_authorized`. |
| `utilityBook` / `weaponSlots` | Untouched. Fail if XP id lands in either. |
| `saveGame` / `loadGame` / `resetRunState` | New sibling key. Load still wipes `systemStates` first. Restore XP book **with** boarding, **not** inside slots. No `performance.now()` XP deadlines. Old saves: `total: 0`. |
| `awayTeamXpSnapshot` / Target chrome | Honest tracked line. Fail if still `not_tracked_yet` after S30.1. |
| `__BM1_PROBE__.boarding` | Keep. Add `.awayTeamXp` snapshot: lock false, tracked, rule, total, lastAward, fire flags false, `inUtilityBook: false`. |
| S17.4 | **Amend values.** Fail if deleted or restored to `not_tracked_yet` to hide a missing book. |
| `src/dock-clear.js` / GUIDED §6 / alertsActive | **Untouched.** Fail if S30 edits overflow CSS or reverts #64. |

## Risks

### 1. Residual left in place / silent totals / slot or utility conflation (gate 1)

Changing the comment, or asserting `tracked: true` while `restoreBoardingBook` still restamps `not_tracked_yet`, leaves the residual. Pushing XP into `weaponSlots[0]` or `utilityBook.items` fails “explicit book, not slots / not credentials.”

**Gate:** S30.1 / S30.8 / S30.9.

### 2. XP drives Board / XOR / tractor / odds (gate 2)

Lighting Board at 40% hull because the team is “veteran,” refusing Board at 0 XP, stamping both XOR flags, flipping `tractorIsBoarding`, or using `total` as `pCapture` fails boarding combat preservation.

**Gate:** S30.6 / S30.2.

### 3. Award gifts fire / Reman / refit (gate 3)

A wrap that sets `engagement_authorized` / `firingSolution` because XP increased, fills empty slots, or unlocks hull 53 fails the doctrine lean.

**Gate:** S30.7.

### 4. Locked table / remastered crib / skipped inject probe (gates 6 + 8)

Shipping `xpToNextRank` as a non-overridable table, `git am` remastered boarding XP, flipping `AWAY_TEAM_XP_LOCKED_FROM_REMASTERED` true, or landing awards without S30.5 **fails** even if S17.3 stays green.

**Gate:** S30.5 / S30.1.

### 5. DockClear / ROE / alertsActive / Thaleron reopen (gates 4–5)

Reflowing Target CSS, adding a third ROE, reverting `alertsActive` to raw store, inventing Thaleron / P10 roster / combat retune, or un-flipping hygiene copy fails do-not-reopen / named outs.

**Gate:** S30.8 / S30.10.

### 6. Fail strips career / mix not implemented (gate 8)

Treating ordinary fail as lose-career, or awarding on fail by default, fails the named mix this brief picked.

**Gate:** S30.3 / S30.4.

## Probe plan (S30)

**Not in this docs PR.** Add `__BM1_PROBE__.awayTeamXp` + optional `scripts/test-away-team-xp.mjs` **only after** Tenth scopes the slice. **Replay `test:boarding` + `test:doctrine` + S17.1–S17.3 / S17.5–S17.18 + S14.18 tractor preservation.** Do not break existing injectors except S17.4 expected values.

**Minimum later-slice contract:**

```js
__BM1_PROBE__.awayTeamXp = {
  snapshot: () => {
    const boarding = globalThis.__BM1_PROBE__.boarding?.snapshot?.() || {};
    return {
      lockedFromRemastered: false,
      tracked: true,
      rule: 'named_mix',
      tablePresent: false,
      total: /* career pool */,
      pending: 0,
      events: {
        onCapture: 'award',
        onScuttle: 'award',
        onFail: 'retain',
        onUnrecovered: 'lose_pending',
      },
      magnitudesInjectable: true,
      captureAward: /* resolved playtest or inject */,
      inUtilityBook: false,
      inCombatSlots: false,
      boardingTracked: boarding.awayTeamXp?.tracked === true,
      tractorIsBoard: false,
      fire: { firingSolutionPresent: false, engagementAuthorizedPresent: false },
    };
  },
  injectMagnitudes: (partial) => { /* fail setup if missing */ },
};
```

Suggested first check set:

1. **S30.1 / S30.5 / S30.9:** remastered-lock false; tracked named mix; inject live; S17.4 amended.
2. **S30.2 / S30.3 / S30.4:** capture award; scuttle award; fail retain; unrecovered pending.
3. **S30.6 / S30.7 / S30.8 / S30.10:** boarding combat replay; no fire / no slots / no utility; persist; chrome honesty.

## Recommended implementation order (later S30 only)

1. Add `AWAY_TEAM_XP_LOCKED_FROM_REMASTERED === false` + empty sibling book (S30.1).
2. Subscribe award on capture inject; keep XOR (S30.2).
3. Scuttle award + fail retain (S30.3).
4. Unrecovered lose-pending (S30.4).
5. Inject override changes snapshot (S30.5).
6. Assert no fire / no slots / no utility / no Reman (S30.7).
7. Save/load/reset (S30.8).
8. Amend S17.4; replay S17 combat (S30.6 / S30.9).
9. Honest XP line; shots **only if** chrome changed (S30.10).

Skip invented skill trees, `git am`, `game_items.json` combat retune, hull% / XOR / tractor hook rewrites, `utilityBook` item rows, dockClear CSS, HTML catalog edits, Thaleron / Phase 10 roster, and ROE entirely.

## Out of scope for the writer of a later slice

Engine work **before** a brief Pass; S30 on **this** docs PR; boarding hull% / XOR / tractor / prize-credit / identity / reach reopen; XP-as-`pCapture`; class/level table; stuffing XP into `utilityBook` or `weaponSlots`; dockClear #60 / #61 reopen; hygiene #62 un-flip; alertsActive #63 / #64 revert; EW #33–#45 reopen; Phase 10 discovery / roster; flags Thaleron-shipped; ledger / empty-armable / construction / HTML / economy / standing reopen; `game_items.json` combat retune; Flash price locks; ROE rewrite; `BM1-remastered-work` as source; `git am` remastered patches; claiming a Referee Pass; gifted FS / `engagement_authorized` from a total; wiping delivered reports; flipping `tractorIsBoarding`; rewriting `meetPackPurchaseDecision`; moving Phase 5 `deadlineAt`; a sixth power consumer.

## Sources

- Proposal: `docs/away-team-xp/BM1-AWAY-TEAM-XP-PROPOSAL.md`
- Boarding residual: `docs/boarding/BM1-BOARDING-CAPTURE-PROPOSAL.md` gate 8 / §10 / S17.4; `docs/boarding/BM1-BOARDING-ENGINE-DEPENDENCIES.md` risk 9; PRs #38 / #39
- GUIDED §4 / BAKEOFF-STATUS soft residual list
- Landed helpers: `src/boarding-eligibility.js`; `src/boarding-attempt.js`; `src/main.js` Target XP line / `serializeBoardingBook`
- Probe: `scripts/test-boarding-capture.mjs`; `scripts/behavior-probe.mjs` S17.4
- Magnitudes analog: `docs/phase9/BM1-PHASE9.4-ENGINE-DEPENDENCIES.md`; `src/phase94-magnitudes.js`
- Soft-residual analog: `docs/alerts-active/BM1-ALERTS-ACTIVE-ENGINE-DEPENDENCIES.md`; PRs #63 / #64
- Utility (stay distinct): `src/utility-inventory.js`; PRs #46 / #47
- DockClear (stay locked): `docs/dock-clear/`; PRs #60 / #61
- Phase 10: `docs/phase10/`; PRs #40 / #41; S18
- EW locked: `docs/phase9/`; PRs #33 / #35 / #37 / #42 / #43 / #44 / #45; S14–S20
- Companion shape: `docs/alerts-active/BM1-ALERTS-ACTIVE-ENGINE-DEPENDENCIES.md`
