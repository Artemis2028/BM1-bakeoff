# BM1 bake-off status

Repo: https://github.com/Artemis2028/BM1-bakeoff  
Updated: `2026-09-11T13:51:56Z` (Asia/Dubai `2026-09-11T17:51:56+04:00`)  
Head: `bf11cd9` on `main`

Sibling of `BM1-remastered-work` for a **blind** Cloud Agent bake-off. Implement from `docs/` only. Do **not** crib the guided stack on `Artemis2028/BM1-remastered-work` PR #1 (answer key for scoring).

Times below are ISO-8601 UTC (`Z`) with the matching Asia/Dubai wall clock (`UTC+4`). SHAs are full enough to check out; use them to roll back this bake-off clone only.

## Briefs

| Path | Role |
| --- | --- |
| `docs/revised-development-plan.md` | Goals / roadmap checkpoint |
| `docs/doctrine/` | Faction doctrine v0.2.1 pack + offline validator |
| This file | What landed here and how it was gated |

## Merged

| PR | Lane | Merge |
| --- | --- | --- |
| [#2](https://github.com/Artemis2028/BM1-bakeoff/pull/2) | Engine / combat (Phase 1 attribution, pursuit≠fire, political authority) | `4c399da` |
| [#1](https://github.com/Artemis2028/BM1-bakeoff/pull/1) | Doctrine runtime wiring (loader + authority/spawn/identity hooks) | `f684e0b` (rebased onto engine) |

## Post-merge gates (on `main` @ `f684e0b`)

```sh
npm run test:phase1    # 17/17
npm run test:doctrine  # validate-doctrine 59/59 + runtime adapter 79/79
```

No Playwright `behavior-probe` / Chromium suite on this repo yet. `bf11cd9` is docs-only on top of these gates (this status MD).

## Roles

- **Number Four** — engine/combat (done for Phase 1 slice)
- **Number 2** — doctrine wiring (done for v0.2.1 loader slice)
- **Number Three** — probe / merge gate
- **Referee** — MD fidelity scoring (docs only; peek at guided PR only when scoring)

## Next (optional)

1. Referee fidelity score vs `docs/revised-development-plan.md` + `docs/doctrine/`.
2. Combined Chromium behavioral probe (parity with guided stack’s Playwright suite).
3. Later phases (ROE / holding zones / etc.) only when Tenth scopes them — still bake-off-only unless directed otherwise.

## Version history

Newest first. Pending rows are placeholders — do not invent scores or results.

| SHA | When (UTC + Asia/Dubai UTC+4) | What |
| --- | --- | --- |
| — | pending | **Referee** MD-fidelity score vs `docs/revised-development-plan.md` + `docs/doctrine/` — **not scored yet** (do not invent a number) |
| [`bf11cd9`](https://github.com/Artemis2028/BM1-bakeoff/commit/bf11cd9) | `2026-09-11T13:51:56Z`<br>Asia/Dubai `2026-09-11T17:51:56+04:00` | Status MD added (`docs/BAKEOFF-STATUS.md`) |
| [`f684e0b`](https://github.com/Artemis2028/BM1-bakeoff/commit/f684e0b) | `2026-09-11T13:49:24Z`<br>Asia/Dubai `2026-09-11T17:49:24+04:00` | Merge [PR #1](https://github.com/Artemis2028/BM1-bakeoff/pull/1) doctrine runtime wiring. Post-merge gates: `test:phase1` 17/17; `test:doctrine` validate 59/59 + adapter 79/79 |
| [`4c399da`](https://github.com/Artemis2028/BM1-bakeoff/commit/4c399da) | `2026-09-11T13:44:09Z`<br>Asia/Dubai `2026-09-11T17:44:09+04:00` | Merge [PR #2](https://github.com/Artemis2028/BM1-bakeoff/pull/2) engine / combat (Phase 1 attribution, pursuit≠fire, political authority) |
| [`538b277`](https://github.com/Artemis2028/BM1-bakeoff/commit/538b277) | `2026-09-11T12:48:32Z`<br>Asia/Dubai `2026-09-11T16:48:32+04:00` | Revised development plan brief (`docs/revised-development-plan.md`) |
| [`e1a32a2`](https://github.com/Artemis2028/BM1-bakeoff/commit/e1a32a2) | `2026-09-11T12:46:32Z`<br>Asia/Dubai `2026-09-11T16:46:32+04:00` | Doctrine v0.2.1 docs pack (`docs/doctrine/`) |
| [`87bfe46`](https://github.com/Artemis2028/BM1-bakeoff/commit/87bfe46) | `2026-09-10T20:55:37Z`<br>Asia/Dubai `2026-09-11T00:55:37+04:00` | Seed from work-repo `main` |

## Rollback (bake-off only)

Use a SHA from the table to inspect or reset **this bake-off clone**. Do not force-push `main` on GitHub unless Tenth explicitly directs it.

| Goal | Command |
| --- | --- |
| Inspect a SHA without moving the branch | `git fetch origin && git checkout <SHA>` |
| Detached look at current recorded head | `git checkout bf11cd9` |
| Hard-reset a **local** bake-off clone to a SHA | `git reset --hard <SHA>` |
| Return to latest `main` after inspecting | `git checkout main && git pull origin main` |

Examples:

```sh
# Read-only inspect of the doctrine merge (gates green here)
git checkout f684e0b

# Local clone only: drop later commits and sit on the engine merge
git reset --hard 4c399da

# Back to tracking origin/main
git checkout main
git pull origin main
```

`git reset --hard` discards uncommitted local changes. Prefer `git checkout <SHA>` when you only need to look.
