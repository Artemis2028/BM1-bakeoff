# BM1 bake-off status

Repo: https://github.com/Artemis2028/BM1-bakeoff  
Updated: `2026-09-11T20:26:00Z` (Asia/Dubai `2026-09-12T00:26:00+04:00`)  
Head: `092e530` on `main` (Phase 4 implement PR #13 merged)

Sibling of `BM1-remastered-work` for a **blind** Cloud Agent bake-off. Implement from `docs/` only. Do **not** crib the guided stack on `Artemis2028/BM1-remastered-work` PR #1 (answer key for scoring).

Times below are ISO-8601 UTC (`Z`) with the matching Asia/Dubai wall clock (`UTC+4`). SHAs are full enough to check out; use them to roll back this bake-off clone only.

## Briefs

| Path | Role |
| --- | --- |
| `docs/revised-development-plan.md` | Goals / roadmap checkpoint |
| `docs/doctrine/` | Faction doctrine v0.2.1 pack + offline validator |
| `docs/phase3/` | Phase 3 holding-zones / compliance briefs |
| `docs/phase4/` | Phase 4 incidents / escalation / alerts proposal + engine deps |
| `docs/side-lane-repair-reman-independence/` | Side-lane brief (repairCapable / Reman unlock / independence + unrest/commerce/pirates follow-up) — proposal; not a Referee Pass |
| `docs/phase5/` | Phase 5 persistent convoy/distress objectives proposal + engine deps — brief open; not a Referee Pass |
| This file | What landed here and how it was gated |

## Merged

| PR | Lane | Merge |
| --- | --- | --- |
| [#2](https://github.com/Artemis2028/BM1-bakeoff/pull/2) | Engine / combat (Phase 1 attribution, pursuit≠fire, political authority) | `4c399da` |
| [#1](https://github.com/Artemis2028/BM1-bakeoff/pull/1) | Doctrine runtime wiring (loader + authority/spawn/identity hooks) | `f684e0b` (rebased onto engine) |
| [#5](https://github.com/Artemis2028/BM1-bakeoff/pull/5) | Chromium behavior probe (Phase 1 live 17) | `c158f2c` |
| [#6](https://github.com/Artemis2028/BM1-bakeoff/pull/6) | Phase 2 ROE/Security | `2164eb5` (rebased tip `9e373ab`) |
| [#9](https://github.com/Artemis2028/BM1-bakeoff/pull/9) | Phase 3 red-team #4/#5 (`unable_to_comply` tractor/engine; no `orders[0]` fallback) | `8cf7002` (in `da1604b`) |
| [#8](https://github.com/Artemis2028/BM1-bakeoff/pull/8) | Phase 3 holding zones / compliance | `da1604b` |
| [#11](https://github.com/Artemis2028/BM1-bakeoff/pull/11) | Phase 4 incidents/escalation/alerts proposal | `276ea8c` |
| [#13](https://github.com/Artemis2028/BM1-bakeoff/pull/13) | Phase 4 incidents/escalation/alerts engine | `092e530` (implement tip `7f926df`) |

## Post-merge gates (on `main` @ `092e530`)

Number Three (merge `092e530`; implement tip [`7f926df`](https://github.com/Artemis2028/BM1-bakeoff/commit/7f926df)):

```sh
npm run test:phase1    # 17/17
npm run test:phase3    # 21/21
npm run test:phase4    # 43/43
npm run test:doctrine  # validate-doctrine 59/59 + runtime adapter 79/79
npm run probe          # 89/89 (Phase 1 live 17 + S4 + S5 + S6)
```

Hard gates closed: S6.1/2 non-aggression; S6.4 single standing; S4-21 rewritten; S6.13 `protect` → `record_only`; S6.14 no second FLASH.

Soft non-blocking: top-level `snapshot().alertsActive` still raw `playerSecurity` vs `getEffectivePolicy` — follow-up if holding alert overrides matter.

Local suites only — this repo has no GitHub Actions CI.

This status MD is docs-only on top of `092e530`.

## Roles

- **Number Four** — engine/combat (Phase 4 incidents/escalation/alerts engine done on `092e530`)
- **Number 2** — doctrine wiring (done for v0.2.1 loader slice)
- **Number Three** — probe / merge gate — Phase 4 engine green on `092e530` (`test:phase1` 17/17, `test:phase3` 21/21, `test:phase4` 43/43, `test:doctrine` 59+79, `probe` 89/89)
- **Referee** — MD fidelity scoring (docs only; peek at guided PR only when scoring) — **Pass** Phase 4 engine §6 on `7f926df`; prior **Pass** Phase 4 brief §6 on `1e8e98d`; prior **Pass** on `da1604b` Phase 3 §5; prior **Pass** on `2164eb5` Phase 2 §3; prior **Pass** on `bf11cd9` Phase 1 (see Version history)

## Next (optional)

1. Referee fidelity score vs `docs/revised-development-plan.md` + `docs/doctrine/` + `docs/phase3/` + `docs/phase4/` — **Pass** Phase 1 on `bf11cd9`; **Pass** Phase 2 §3 on `2164eb5`; **Pass** Phase 3 §5 on `da1604b`; **Pass** Phase 4 brief §6 on `1e8e98d`; **Pass** Phase 4 engine §6 on `7f926df` (see Version history).
2. Combined Chromium behavioral probe — landed [PR #5](https://github.com/Artemis2028/BM1-bakeoff/pull/5) (`c158f2c`); extended by [PR #6](https://github.com/Artemis2028/BM1-bakeoff/pull/6) to 53/53, [PR #8](https://github.com/Artemis2028/BM1-bakeoff/pull/8)/[PR #9](https://github.com/Artemis2028/BM1-bakeoff/pull/9) to 75/75, and [PR #13](https://github.com/Artemis2028/BM1-bakeoff/pull/13) to `probe` 89/89 (Phase 1 live 17 + S4 + S5 + S6).
3. Phase 3 holding zones are **no longer Pending on bake-off** — landed [PR #8](https://github.com/Artemis2028/BM1-bakeoff/pull/8) (`da1604b`, includes red-team [PR #9](https://github.com/Artemis2028/BM1-bakeoff/pull/9)). Plan §2 still listing holding zones as Pending is a **non-blocking docs drift** on `docs/revised-development-plan.md`, not bake-off status. [PR #4](https://github.com/Artemis2028/BM1-bakeoff/pull/4) briefs are already on `main`.
4. Phase 4 engine is **done** — landed [PR #13](https://github.com/Artemis2028/BM1-bakeoff/pull/13) (`092e530`, implement tip `7f926df`). Hard gates closed: S6.1/2 non-aggression, S6.4 single standing, S4-21 rewritten, S6.13 `protect` → `record_only`, S6.14 no second FLASH. Soft follow-up optional: top-level `snapshot().alertsActive` still raw `playerSecurity` vs `getEffectivePolicy` — only if holding alert overrides matter.
5. Later / next plan phase only when Tenth scopes it — still bake-off-only unless directed otherwise. Process note: no GitHub Actions CI; gates are local suites only.
6. Side-lane brief (repairCapable / Reman unlock / independence-civil-war) — **proposal [PR #16](https://github.com/Artemis2028/BM1-bakeoff/pull/16) merged** on `main` @ `1791808` (after additive `bm-ships/` PR #15; no catalog wire). **Not** roadmap Phase 5. **No Referee Pass claimed.** Tenth amend 2026-09-12: gate 3 allows **divergent** doctrine/ROE and war-driven temperament (`peaceful` / `warlike` / `xenophobic` / `xenophilic`); gates 1–2 unchanged. Referee / One / Four / Two score the three hard gates before any engine PR. Number Three probes only after engine.
7. Side-lane follow-up docs (unrest / commerce / pirates / civilian lounge+contract) — **proposal [PR #17](https://github.com/Artemis2028/BM1-bakeoff/pull/17)** from `main` @ `1791808`. Tenth amend 2026-09-12: independence is **not a random flip**; stackable pressure raises unrest; civilians must **lounge and** run commerce contracts; pirates are a pressure faction; temperament may shift *because* of these pressures. Gates 1–2 unchanged. Soft S7.8 unchanged. **Not** Phase 5 (overlap with future commerce scenarios may be noted only). **No Referee Pass claimed.** Referee / One / Two / Four score the new §6 before any engine PR.
8. Phase 5 brief (persistent convoy / distress / `asset_overdue` objectives) — **proposal PR open** from `main` @ `72cc984` (after side-lane engine PRs #18 / #19). Eight hard gates for scoring (clock only on completed warp/wormhole; stable close-once IDs; overdue ≠ destroyed ≠ attacker; delivered knowledge; reuse P4 + side-lane civilians; no invented attacker / no double standing; reachable urgency; urgency tiers). **No Referee Pass claimed.** Referee / One score the eight gates before any engine PR. Number Three probes only after engine.

## Version history

Newest first.

- **Referee** — `2026-09-11T20:26:00Z` (Asia/Dubai `2026-09-12T00:26:00+04:00`) — **Pass** — Phase 4 engine §6 on 7f926df (probe 89; hard gates closed; soft alertsActive snapshot note).
- [`092e530`](https://github.com/Artemis2028/BM1-bakeoff/commit/092e530) — `2026-09-11T20:23:26Z` (Asia/Dubai `2026-09-12T00:23:26+04:00`) — Merge [PR #13](https://github.com/Artemis2028/BM1-bakeoff/pull/13) Phase 4 incidents/escalation/alerts engine. Implement tip [`7f926df`](https://github.com/Artemis2028/BM1-bakeoff/commit/7f926df)
- **Referee** — `2026-09-11T19:53:36Z` (Asia/Dubai `2026-09-11T23:53:36+04:00`) — **Pass** — Phase 4 brief §6 on 1e8e98d (hard gates + S4-21/S6.13/S6.14 locks).
- [`276ea8c`](https://github.com/Artemis2028/BM1-bakeoff/commit/276ea8c) — `2026-09-11T19:49:30Z` (Asia/Dubai `2026-09-11T23:49:30+04:00`) — Merge [PR #11](https://github.com/Artemis2028/BM1-bakeoff/pull/11) Phase 4 incidents/escalation/alerts proposal. Brief tip [`1e8e98d`](https://github.com/Artemis2028/BM1-bakeoff/commit/1e8e98d)
- **Referee** — `2026-09-11T19:14:30Z` (Asia/Dubai `2026-09-11T23:14:30+04:00`) — **Pass** — Phase 3 holding zones/compliance matches plan §5 + phase3 docs (probe 75; #4/#5 closed). Non-blocking: status MD tip lag, no Actions CI, plan §2 still says holding zones Pending. Head scored: [`da1604b`](https://github.com/Artemis2028/BM1-bakeoff/commit/da1604b). Number Three gates: `test:phase1` 17/17; `test:phase3` 21/21; `test:doctrine` 59+79; `probe` 75/75. #4/#5 closed (`unable_to_comply` tractor/engine assert; no `orders[0]` fallback)
- [`da1604b`](https://github.com/Artemis2028/BM1-bakeoff/commit/da1604b) — `2026-09-11T19:05:24Z` (Asia/Dubai `2026-09-11T23:05:24+04:00`) — Merge [PR #8](https://github.com/Artemis2028/BM1-bakeoff/pull/8) Phase 3 holding zones / compliance (includes [PR #9](https://github.com/Artemis2028/BM1-bakeoff/pull/9))
- [`8cf7002`](https://github.com/Artemis2028/BM1-bakeoff/commit/8cf7002) — `2026-09-11T19:05:20Z` (Asia/Dubai `2026-09-11T23:05:20+04:00`) — Merge [PR #9](https://github.com/Artemis2028/BM1-bakeoff/pull/9) Phase 3 red-team #4/#5
- **Referee** — `2026-09-11T16:28:32Z` (Asia/Dubai `2026-09-11T20:28:32+04:00`) — **Pass** — Phase 2 ROE/Security matches plan §3 (probe 53/53); residual UI/shape/probe-count deltas vs guided only. Head scored: [`2164eb5`](https://github.com/Artemis2028/BM1-bakeoff/commit/2164eb5). Number Three gates: `test:phase1` 17/17; `test:doctrine` 59+79; `probe` 53/53 (Phase 1 live 17 + S4 36)
- [`2164eb5`](https://github.com/Artemis2028/BM1-bakeoff/commit/2164eb5) — `2026-09-11T16:22:16Z` (Asia/Dubai `2026-09-11T20:22:16+04:00`) — Merge [PR #6](https://github.com/Artemis2028/BM1-bakeoff/pull/6) Phase 2 ROE/Security. Rebased tip [`9e373ab`](https://github.com/Artemis2028/BM1-bakeoff/commit/9e373ab)
- [`c158f2c`](https://github.com/Artemis2028/BM1-bakeoff/commit/c158f2c) — `2026-09-11T15:07:08Z` (Asia/Dubai `2026-09-11T19:07:08+04:00`) — Merge [PR #5](https://github.com/Artemis2028/BM1-bakeoff/pull/5) Chromium behavior probe (Phase 1 live 17)
- **Referee** — `2026-09-11T14:22:15Z` (Asia/Dubai `2026-09-11T18:22:15+04:00`) — **Pass** — Phase 1 + doctrine-loader high fidelity to plan §2–§3 / DESIGN Phase 1 (offline gates only; no Chromium probe; pack-load vs DESIGN_ONLY noted as intentional). Head scored: [`bf11cd9`](https://github.com/Artemis2028/BM1-bakeoff/commit/bf11cd9)
- [`bf11cd9`](https://github.com/Artemis2028/BM1-bakeoff/commit/bf11cd9) — `2026-09-11T13:51:56Z` (Asia/Dubai `2026-09-11T17:51:56+04:00`) — Status MD added (`docs/BAKEOFF-STATUS.md`)
- [`f684e0b`](https://github.com/Artemis2028/BM1-bakeoff/commit/f684e0b) — `2026-09-11T13:49:24Z` (Asia/Dubai `2026-09-11T17:49:24+04:00`) — Merge [PR #1](https://github.com/Artemis2028/BM1-bakeoff/pull/1) doctrine runtime wiring. Post-merge gates: `test:phase1` 17/17; `test:doctrine` validate 59/59 + adapter 79/79
- [`4c399da`](https://github.com/Artemis2028/BM1-bakeoff/commit/4c399da) — `2026-09-11T13:44:09Z` (Asia/Dubai `2026-09-11T17:44:09+04:00`) — Merge [PR #2](https://github.com/Artemis2028/BM1-bakeoff/pull/2) engine / combat (Phase 1 attribution, pursuit≠fire, political authority)
- [`538b277`](https://github.com/Artemis2028/BM1-bakeoff/commit/538b277) — `2026-09-11T12:48:32Z` (Asia/Dubai `2026-09-11T16:48:32+04:00`) — Revised development plan brief (`docs/revised-development-plan.md`)
- [`e1a32a2`](https://github.com/Artemis2028/BM1-bakeoff/commit/e1a32a2) — `2026-09-11T12:46:32Z` (Asia/Dubai `2026-09-11T16:46:32+04:00`) — Doctrine v0.2.1 docs pack (`docs/doctrine/`)
- [`87bfe46`](https://github.com/Artemis2028/BM1-bakeoff/commit/87bfe46) — `2026-09-10T20:55:37Z` (Asia/Dubai `2026-09-11T00:55:37+04:00`) — Seed from work-repo `main`

## Rollback (bake-off only)

Use a SHA from Version history to inspect or reset **this bake-off clone**. Do not force-push `main` on GitHub unless Tenth explicitly directs it.

| Goal | Command |
| --- | --- |
| Inspect a SHA without moving the branch | `git fetch origin && git checkout <SHA>` |
| Detached look at current recorded head | `git checkout 092e530` |
| Hard-reset a **local** bake-off clone to a SHA | `git reset --hard <SHA>` |
| Return to latest `main` after inspecting | `git checkout main && git pull origin main` |

Examples:

```sh
# Read-only inspect of current recorded head (Phase 4 engine on main)
git checkout 092e530

# Read-only inspect of Phase 4 briefs (proposal + engine deps only)
git checkout 276ea8c

# Read-only inspect of Phase 3 holding zones (engine gates green here)
git checkout da1604b

# Read-only inspect of the doctrine merge (offline gates green here)
git checkout f684e0b

# Local clone only: drop later commits and sit on the engine merge
git reset --hard 4c399da

# Back to tracking origin/main
git checkout main
git pull origin main
```

`git reset --hard` discards uncommitted local changes. Prefer `git checkout <SHA>` when you only need to look.
