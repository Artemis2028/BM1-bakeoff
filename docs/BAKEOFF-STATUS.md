# BM1 bake-off status

Repo: https://github.com/Artemis2028/BM1-bakeoff  
Updated: `2026-09-11T19:14:30Z` (Asia/Dubai `2026-09-11T23:14:30+04:00`)  
Head: `da1604b` on `main` (Referee-scored)

Sibling of `BM1-remastered-work` for a **blind** Cloud Agent bake-off. Implement from `docs/` only. Do **not** crib the guided stack on `Artemis2028/BM1-remastered-work` PR #1 (answer key for scoring).

Times below are ISO-8601 UTC (`Z`) with the matching Asia/Dubai wall clock (`UTC+4`). SHAs are full enough to check out; use them to roll back this bake-off clone only.

## Briefs

| Path | Role |
| --- | --- |
| `docs/revised-development-plan.md` | Goals / roadmap checkpoint |
| `docs/doctrine/` | Faction doctrine v0.2.1 pack + offline validator |
| `docs/phase3/` | Phase 3 holding-zones / compliance briefs |
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

## Post-merge gates (on `main` @ `da1604b`)

Number Three (merge `da1604b`; includes [PR #9](https://github.com/Artemis2028/BM1-bakeoff/pull/9) `8cf7002`):

```sh
npm run test:phase1    # 17/17
npm run test:phase3    # 21/21
npm run test:doctrine  # validate-doctrine 59/59 + runtime adapter 79/79
npm run probe          # 75/75 (Phase 1 live 17 + S4 + S5)
```

Red-team **#4** / **#5** closed: `unable_to_comply` tractor/engine assert; no `orders[0]` fallback.

Local suites only — this repo has no GitHub Actions CI.

This status MD is docs-only on top of `da1604b`.

## Roles

- **Number Four** — engine/combat (done for Phase 1 slice)
- **Number 2** — doctrine wiring (done for v0.2.1 loader slice)
- **Number Three** — probe / merge gate — Phase 3 holding zones green on `da1604b` (`test:phase1` 17/17, `test:phase3` 21/21, `test:doctrine` 59+79, `probe` 75/75)
- **Referee** — MD fidelity scoring (docs only; peek at guided PR only when scoring) — **Pass** on `da1604b` Phase 3 §5; prior **Pass** on `2164eb5` Phase 2 §3; prior **Pass** on `bf11cd9` Phase 1 (see Version history)

## Next (optional)

1. Referee fidelity score vs `docs/revised-development-plan.md` + `docs/doctrine/` + `docs/phase3/` — **Pass** Phase 1 on `bf11cd9`; **Pass** Phase 2 §3 on `2164eb5`; **Pass** Phase 3 §5 on `da1604b` (see Version history).
2. Combined Chromium behavioral probe — landed [PR #5](https://github.com/Artemis2028/BM1-bakeoff/pull/5) (`c158f2c`); extended by [PR #6](https://github.com/Artemis2028/BM1-bakeoff/pull/6) to 53/53 and [PR #8](https://github.com/Artemis2028/BM1-bakeoff/pull/8)/[PR #9](https://github.com/Artemis2028/BM1-bakeoff/pull/9) to `probe` 75/75 (Phase 1 live 17 + S4 + S5).
3. Phase 3 holding zones are **no longer Pending on bake-off** — landed [PR #8](https://github.com/Artemis2028/BM1-bakeoff/pull/8) (`da1604b`, includes red-team [PR #9](https://github.com/Artemis2028/BM1-bakeoff/pull/9)). Plan §2 still listing holding zones as Pending is a **non-blocking docs drift** on `docs/revised-development-plan.md`, not bake-off status. [PR #4](https://github.com/Artemis2028/BM1-bakeoff/pull/4) briefs are already on `main`.
4. Later phases only when Tenth scopes them — still bake-off-only unless directed otherwise. Process note: no GitHub Actions CI; gates are local suites only.

## Version history

Newest first.

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
| Detached look at current recorded head | `git checkout da1604b` |
| Hard-reset a **local** bake-off clone to a SHA | `git reset --hard <SHA>` |
| Return to latest `main` after inspecting | `git checkout main && git pull origin main` |

Examples:

```sh
# Read-only inspect of current recorded head (Phase 3 holding zones on main)
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
